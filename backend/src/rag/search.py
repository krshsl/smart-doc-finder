import numpy as np
from async_lru import alru_cache
from bson import ObjectId

from src.client import get_redis_client
from src.models import File, User

from . import INDEX_NAME, TOP_K, get_model


@alru_cache(maxsize=128)
async def perform_redis_search(query_text: str):
    r_client = get_redis_client()
    model = get_model()
    q_emb = (
        model.encode(query_text, normalize_embeddings=True).astype(np.float32).tobytes()
    )

    query_string = f"*=>[KNN {TOP_K} @embedding $vec AS distance]"

    command_args = [
        "FT.SEARCH",
        INDEX_NAME,
        query_string,
        "PARAMS",
        "2",
        "vec",
        q_emb,
        "DIALECT",
        "2",
        "RETURN",
        "1",
        "distance",
    ]

    raw_results = await r_client.execute_command(*command_args)

    results = []
    i = 1
    while i < len(raw_results):
        doc_id = raw_results[i].decode("utf-8")
        distance = float(raw_results[i + 1][1])

        results.append({"hash": doc_id.split(":")[1], "score": 1 / (1 + distance)})
        i += 2

    return results


async def perform_mongodb_search(query_text: str, user: User):
    model = get_model()
    query_vector = [float(x) for x in model.encode(query_text)]

    pipeline = [
        {
            "$vectorSearch": {
                "index": INDEX_NAME,
                "path": "embedding",
                "queryVector": query_vector,
                "numCandidates": 100,
                "limit": TOP_K,
                "filter": {"owner.$id": ObjectId(user.id)},
            },
        },
        {
            "$project": {
                "id": {"$toString": "$_id"},
                "score": {"$meta": "vectorSearchScore"},
            }
        },
    ]

    results = await File.aggregate(pipeline).to_list()
    return results
