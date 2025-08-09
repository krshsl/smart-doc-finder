import os
import numpy as np
import redis
from sentence_transformers import SentenceTransformer
from redis.commands.search.query import Query as RSQuery
from dotenv import load_dotenv

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

r = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    username=REDIS_USERNAME,
    password=REDIS_PASSWORD,
    decode_responses=True  # decode for easy string handling
)

model = SentenceTransformer("all-MiniLM-L6-v2")

def search_vector(query_text, k=TOP_K):
    q_emb = model.encode(query_text).astype(np.float32).tobytes()
    knn = f"*=>[KNN {k} @embedding $vec AS score]"

    q = RSQuery(knn).return_fields("filename", "page", "content", "score").dialect(2)
    res = r.ft(INDEX_NAME).search(q, query_params={"vec": q_emb})
    
    if not res.docs:
        return []

    results = []
    for doc in res.docs:
        filename = getattr(doc, "filename")
        page = getattr(doc, "page")
        content = getattr(doc, "content")
        score = getattr(doc, "score")

        # decode bytes if needed
        if isinstance(filename, (bytes, bytearray)): filename = filename.decode()
        if isinstance(page, (bytes, bytearray)): page = page.decode()
        if isinstance(content, (bytes, bytearray)): content = content.decode()
        if isinstance(score, (bytes, bytearray)): score = float(score.decode())
        else: score = float(score)

        results.append({
            "filename": filename,
            "page": page,
            "content": content,
            "score": score
        })

    return results


if __name__ == "__main__":
    q = input("Enter question: ")
    results = search_vector(q, k=TOP_K)
    if not results:
        print("No matching document found.")
    else:
        for i, rdoc in enumerate(results, start=1):
            print(f"{i}. {rdoc['filename']} (page {rdoc['page']}) score={rdoc['score']:.4f}")
            print(rdoc['content'][:500].replace("\n", " ") + "...\n")

