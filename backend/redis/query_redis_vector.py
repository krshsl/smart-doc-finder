import os
import numpy as np
import redis
from sentence_transformers import SentenceTransformer
from redis.commands.search.query import Query as RSQuery
from dotenv import load_dotenv

# ---------- CONFIG ----------
dotenv_path = os.path.join(os.path.dirname(__file__), "..", "dev.env")
load_dotenv(dotenv_path=dotenv_path)

REDIS_HOST = os.getenv("REDIS_HOST")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_USERNAME = os.getenv("REDIS_USERNAME") or None
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD")

INDEX_NAME = "doc_index"
DOC_PREFIX = "doc:"
TOP_K = 3
EMB_DIM = 384
MODEL_NAME = "all-MiniLM-L6-v2"
# ----------------------------

# Redis client (keep decode_responses=False for binary vectors)
r = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    username=REDIS_USERNAME,
    password=REDIS_PASSWORD,
    decode_responses=False
)

model = SentenceTransformer(MODEL_NAME)

def search_vector(query_text, k=TOP_K):
    """Search top-k most relevant unique documents."""
    q_emb = model.encode(query_text).astype(np.float32).tobytes()
    knn = f"*=>[KNN {k} @embedding $vec AS score]"

    # We only store filename + embedding in this schema
    q = RSQuery(knn).return_fields("filename", "score").dialect(2)
    res = r.ft(INDEX_NAME).search(q, query_params={"vec": q_emb})

    if not res.docs:
        return []

    seen_filenames = set()
    unique_results = []

    for doc in res.docs:
        filename = doc.filename.decode() if isinstance(doc.filename, (bytes, bytearray)) else doc.filename
        score = float(doc.score) if not isinstance(doc.score, (bytes, bytearray)) else float(doc.score.decode())

        if filename not in seen_filenames:
            seen_filenames.add(filename)
            unique_results.append({
                "filename": filename,
                "score": score
            })

        if len(unique_results) >= k:
            break

    return unique_results


if __name__ == "__main__":
    q = input("Enter question: ")
    results = search_vector(q, k=TOP_K)

    if not results:
        print("No matching document found.")
    else:
        for i, rdoc in enumerate(results, start=1):
            print(f"{i}. {rdoc['filename']}  score={rdoc['score']:.4f}")