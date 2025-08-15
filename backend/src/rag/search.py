from bson import ObjectId

from src.client import get_redis_client
from src.middleware.limits import ENV
from src.models import File, User

from . import INDEX_NAME, TOP_K
from .manager import get_search_semaphore


async def perform_redis_search(embedding: bytes):
    r_client = get_redis_client()

    query_string = f"*=>[KNN {TOP_K} @embedding_{ENV} $vec AS distance]"
    command_args = [
        "FT.SEARCH",
        INDEX_NAME,
        query_string,
        "PARAMS",
        "2",
        "vec",
        embedding,
        "DIALECT",
        "2",
        "RETURN",
        "1",
        "distance",
    ]

    async with get_search_semaphore():
        raw_results = await r_client.execute_command(*command_args)

    results = []
    keys_to_touch = []
    i = 1
    while i < len(raw_results):
        doc_id = raw_results[i]
        keys_to_touch.append(doc_id)

        distance = float(raw_results[i + 1][1])
        results.append(
            {
                "hash": doc_id.decode("utf-8").split(":")[1],
                "score": 1 / (1 + distance),
            }
        )
        i += 2

    # After getting the results, touch the keys to update the LRU status
    if keys_to_touch:
        async with get_search_semaphore():
            try:
                pipe = r_client.pipeline()
                for key in keys_to_touch:
                    pipe.touch(key)
                await pipe.execute()
            except Exception as e:
                from src import logger

                logger.warning(f"Failed to TOUCH Redis keys: {e}")

    return results


async def perform_mongodb_search(embeddings, user: User):
    query_vector = [float(x) for x in embeddings]

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
