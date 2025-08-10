import os
import hashlib
import numpy as np
import redis
import fitz                     # pip install pymupdf
from sentence_transformers import SentenceTransformer

# Load env vars (make sure you load them if needed)
from dotenv import load_dotenv
dotenv_path = os.path.join(os.path.dirname(__file__), "..", "dev.env")
load_dotenv(dotenv_path=dotenv_path)

# ---------- CONFIG ----------
PDF_FOLDER = "files"             # Folder containing PDFs
INDEX_NAME = "doc_index"
DOC_PREFIX = "doc:"             # Redis key prefix
CHUNK_WORDS = 250               # Words per text chunk

MODEL_NAME = "all-MiniLM-L6-v2"  # Embedding model
EMB_DIM = 384                    # Embedding dimension

REDIS_HOST = os.getenv("REDIS_HOST")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_USERNAME = os.getenv("REDIS_USERNAME") or None
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD")
# ----------------------------

r = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    username=REDIS_USERNAME,
    password=REDIS_PASSWORD,
    decode_responses=False  # Keep false for binary embedding
)

model = SentenceTransformer(MODEL_NAME)

def chunk_text(text, n=CHUNK_WORDS):
    words = text.split()
    for i in range(0, len(words), n):
        yield " ".join(words[i:i + n])

def file_hash(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while True:
            chunk = f.read(8192)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()

def drop_index_if_exists():
    try:
        r.execute_command("FT.DROPINDEX", INDEX_NAME, "DD")
        print(f"Dropped existing index {INDEX_NAME}")
    except redis.exceptions.ResponseError as e:
        if "Unknown Index name" in str(e):
            print("No existing index to drop")
        else:
            raise

def create_index():
    try:
        r.execute_command(
            "FT.CREATE", INDEX_NAME,
            "ON", "HASH",
            "PREFIX", "1", DOC_PREFIX,
            "SCHEMA",
            "filename", "TAG",
            "embedding", "VECTOR", "HNSW", "6",
                "TYPE", "FLOAT32",
                "DIM", EMB_DIM,
                "DISTANCE_METRIC", "COSINE"
        )
        print("Index created successfully.")
    except redis.exceptions.ResponseError as e:
        if "Index already exists" in str(e):
            print("Index already exists, skipping creation.")
        else:
            raise

def ingest_all():
    drop_index_if_exists()
    create_index()

    files = [f for f in os.listdir(PDF_FOLDER) if f.lower().endswith(".pdf")]
    if not files:
        print("No PDFs found in", PDF_FOLDER)
        return

    for fname in files:
        path = os.path.join(PDF_FOLDER, fname)
        doc_hash = file_hash(path)

        if r.exists(f"{DOC_PREFIX}{doc_hash}"):
            print(f"Skipping {fname} — already ingested.")
            continue

        # Extract full text from PDF
        doc = fitz.open(path)
        full_text = []
        for page in doc:
            full_text.append(page.get_text())
        text = " ".join(full_text).strip()

        # Encode entire document once
        emb = model.encode(text).astype(np.float32)

        # Store only filename + embedding
        r.hset(f"{DOC_PREFIX}{doc_hash}", mapping={
            "filename": fname,
            "embedding": emb.tobytes()
        })

        print(f"Stored: {fname} (size: {len(text)//1024} KB)")

if __name__ == "__main__":
    ingest_all()