import os
import csv
import hashlib
import numpy as np
import redis
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

# Load env vars
dotenv_path = os.path.join(os.path.dirname(__file__), "..", "dev.env")
load_dotenv(dotenv_path=dotenv_path)

# ---------- CONFIG ----------
CSV_FOLDER = "files"
INDEX_NAME = "doc_index"
DOC_PREFIX = "doc:"
CHUNK_WORDS = 250
MODEL_NAME = "all-MiniLM-L6-v2"
EMB_DIM = 384

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
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()

def ingest_all_csv():
    files = [f for f in os.listdir(CSV_FOLDER) if f.lower().endswith(".csv")]
    if not files:
        print("No CSV files found in", CSV_FOLDER)
        return

    for fname in files:
        path = os.path.join(CSV_FOLDER, fname)
        doc_hash = file_hash(path)

        # Skip if already ingested
        if any(r.scan_iter(f"{DOC_PREFIX}{doc_hash}:chunk:*")):
            print(f"Skipping {fname} — already ingested.")
            continue

        # Read CSV into plain text
        with open(path, newline='', encoding='utf-8') as csvfile:
            reader = csv.reader(csvfile)
            text_data = "\n".join([", ".join(row) for row in reader])

        chunks = [(0, idx, chunk) for idx, chunk in enumerate(chunk_text(text_data))]
        print(f"Ingesting {fname}: {len(chunks)} chunks")

        for (page_num, idx, chunk) in chunks:
            emb = model.encode(chunk).astype(np.float32)
            key = f"{DOC_PREFIX}{doc_hash}:chunk:{idx}:{page_num}"
            r.hset(key, mapping={
                "content": chunk,
                "filename": fname,
                "page": str(page_num),
                "embedding": emb.tobytes()
            })

        print("Stored:", fname)

if __name__ == "__main__":
    ingest_all_csv()

