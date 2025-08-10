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

# Redis client (binary safe for embeddings)
r = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    username=REDIS_USERNAME,
    password=REDIS_PASSWORD,
    decode_responses=False
)

model = SentenceTransformer(MODEL_NAME)

def search_vector(query_text, k=TOP_K):
    q_emb = model.encode(query_text, normalize_embeddings=True).astype(np.float32).tobytes()
    knn = f"*=>[KNN {k} @embedding $vec AS distance]"

    q = RSQuery(knn).return_fields("filename", "snippet", "distance").dialect(2)
    res = r.ft(INDEX_NAME).search(q, query_params={"vec": q_emb})

    if not res.docs:
        return []

    seen_filenames = set()
    unique_results = []

    for doc in res.docs:
        filename = (
            doc.filename.decode() if isinstance(doc.filename, (bytes, bytearray)) else doc.filename
        )
        snippet = (
            doc.snippet.decode() if isinstance(doc.snippet, (bytes, bytearray)) else doc.snippet
        )
        distance = float(doc.distance) if not isinstance(doc.distance, (bytes, bytearray)) else float(doc.distance.decode())

# Convert L2 distance to a "similarity" (larger is better)
        score = 1 / (1 + distance)  # maps distance → (0,1]

        if filename not in seen_filenames:
            seen_filenames.add(filename)
            unique_results.append({
                "filename": filename,
                "snippet": snippet,
                "score": score,
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
            print(f"\n{i}. {rdoc['filename']}  (score={rdoc['score']:.4f})")
            print(f"   Snippet: {rdoc['snippet']}")
