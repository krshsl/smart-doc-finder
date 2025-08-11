import logging
from types import SimpleNamespace

from redis.asyncio import Redis
from redis.exceptions import ConnectionError, ResponseError

from src.rag import DOC_PREFIX, EMB_DIM, INDEX_NAME

redis_client: Redis = None


async def init_redis_index():
    global redis_client
    logger = logging.getLogger("uvicorn")

    command_args = [
        "FT.CREATE",
        INDEX_NAME,
        "ON",
        "HASH",
        "PREFIX",
        "1",
        DOC_PREFIX,
        "SCHEMA",
        "filename",
        "TAG",
        "snippet",
        "TEXT",
        "embedding",
        "VECTOR",
        "HNSW",
        "6",
        "TYPE",
        "FLOAT32",
        "DIM",
        EMB_DIM,
        "DISTANCE_METRIC",
        "L2",
    ]

    try:
        await redis_client.execute_command(*command_args)
        logger.info(f"Redis Search index '{INDEX_NAME}' created successfully.")
    except ResponseError as e:
        if "Index already exists" in str(e):
            logger.info(f"Redis Search index '{INDEX_NAME}' already exists.")
        else:
            logger.error(f"Failed to create Redis Search index: {e}")
            raise


async def init_redis(env: SimpleNamespace):
    global redis_client
    try:
        redis_client = Redis(
            host=env.REDIS_HOST,
            port=env.REDIS_PORT,
            username=env.REDIS_USERNAME,
            password=env.REDIS_PASSWORD,
            decode_responses=False,
        )
        await redis_client.ping()
    except ConnectionError as e:
        logger = logging.getLogger("uvicorn")
        logger.error(f"Could not connect to Redis: {e}")
        redis_client = None
        exit(1)


def get_redis_client() -> Redis:
    return redis_client
