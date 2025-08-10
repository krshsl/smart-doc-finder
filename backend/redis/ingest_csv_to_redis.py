import os
import hashlib
import numpy as np
import redis
import pandas as pd
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

# ---------- CONFIG ----------
dotenv_path = os.path.join(os.path.dirname(__file__), "..", "dev.env")
load_dotenv(dotenv_path=dotenv_path)

CSV_FOLDER = "files"
INDEX_NAME = "doc_index"
DOC_PREFIX = "doc:"
MODEL_NAME = "all-MiniLM-L6-v2"
EMB_DIM = 384
SAMPLE_CHUNKS = 5       # number of chunks to sample from each CSV
CHUNK_WORDS = 200       # words per sampled chunk

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
    decode_responses=False
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
            "snippet", "TEXT",
            "embedding", "VECTOR", "HNSW", "6",
                "TYPE", "FLOAT32",
                "DIM", EMB_DIM,
                "DISTANCE_METRIC", "L2"
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

    files = [f for f in os.listdir(CSV_FOLDER) if f.lower().endswith(".csv")]
    if not files:
        print("No CSV files found in", CSV_FOLDER)
        return

    for fname in files:
        path = os.path.join(CSV_FOLDER, fname)
        doc_hash = file_hash(path)

        if r.exists(f"{DOC_PREFIX}{doc_hash}"):
            print(f"Skipping {fname} — already ingested.")
            continue

        try:
            df = pd.read_csv(path)
        except Exception as e:
            print(f"Skipping {fname} — failed to read CSV: {e}")
            continue

        full_text = df.to_string(index=False)
        if not full_text.strip():
            print(f"Skipping {fname} — empty content.")
            continue

        chunks = list(chunk_text(full_text))
        if len(chunks) > SAMPLE_CHUNKS:
            step = max(1, len(chunks) // SAMPLE_CHUNKS)
            sampled_chunks = [chunks[i] for i in range(0, len(chunks), step)][:SAMPLE_CHUNKS]
        else:
            sampled_chunks = chunks

        chunk_embeddings = model.encode(sampled_chunks)
        emb = np.mean(chunk_embeddings, axis=0).astype(np.float32)

        snippet_text = sampled_chunks[0][:200]
        r.hset(f"{DOC_PREFIX}{doc_hash}", mapping={
            "filename": fname,
            "snippet": snippet_text,
            "embedding": emb.tobytes()
        })

        print(f"Stored: {fname} ({len(full_text)//1024} KB)")

if __name__ == "__main__":
    ingest_all()
