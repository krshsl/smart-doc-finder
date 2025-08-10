from functools import lru_cache

import numpy as np
from redis.commands.search.query import Query as RSQuery

from src.client import get_redis_client
from src.models import File, User

from . import INDEX_NAME, TOP_K, model


@lru_cache(maxsize=128)
async def perform_redis_search(query_text: str, user_id: str):
    r_client = get_redis_client()
    q_emb = (
        model.encode(query_text, normalize_embeddings=True).astype(np.float32).tobytes()
    )

    knn_query = f"(@user_id:{{{user_id}}})=>[KNN {TOP_K} @embedding $vec AS distance]"

    q = RSQuery(knn_query).return_fields("distance").dialect(2)
    results = await r_client.ft(INDEX_NAME).search(q, query_params={"vec": q_emb})

    return [
        {"id": doc.id.split(":")[1], "score": 1 / (1 + float(doc.distance))}
        for doc in results.docs
    ]


async def perform_mongodb_search(query_text: str, user: User):
    query_vector = model.encode(query_text).tolist()

    pipeline = [
        {
            "$vectorSearch": {
                "index": "vector_search_index",
                "path": "embedding",
                "queryVector": query_vector,
                "numCandidates": 100,
                "limit": TOP_K,
                "filter": {
                    "compound": {
                        "must": [{"equals": {"path": "owner.id", "value": user.id}}]
                    }
                },
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
