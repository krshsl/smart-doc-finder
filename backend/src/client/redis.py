import logging
from os import getenv
from types import SimpleNamespace
from typing import Optional

from redis.asyncio import ConnectionPool, Redis
from redis.exceptions import ConnectionError, ResponseError

from src.rag import DOC_PREFIX, EMB_DIM, INDEX_NAME

redis_client: Optional[Redis] = None


async def drop_redis_index(logger):
    global redis_client

    if not redis_client:
        logger.error("Redis client not initialized.")
        return

    try:
        await redis_client.execute_command("FT.DROPINDEX", INDEX_NAME, "DD")
        logger.info(f"Redis Search index '{INDEX_NAME}' dropped successfully.")
    except ResponseError as e:
        if "Unknown Index name" in str(e):
            logger.info(f"Redis Search index '{INDEX_NAME}' does not exist.")
        else:
            logger.error(f"Failed to drop Redis Search index: {e}")
            raise


async def init_redis_index(env: str):
    global redis_client

    logger = logging.getLogger("uvicorn")
    # await drop_redis_index(logger)
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
        "embedding" + "_" + env,
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
        if not redis_client:
            raise Exception

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
        redis_pool = ConnectionPool(
            host=env.REDIS_HOST,
            port=env.REDIS_PORT,
            username=env.REDIS_USERNAME,
            password=env.REDIS_PASSWORD,
            max_connections=int(getenv("MAX_CONCURRENT_REQUESTS")),
            retry_on_timeout=True,
            socket_connect_timeout=1,
            socket_timeout=1,
            socket_keepalive=True,
            health_check_interval=60,
            decode_responses=False,
        )
        redis_client = Redis(connection_pool=redis_pool)
        await redis_client.ping()
    except ConnectionError as e:
        logger = logging.getLogger("uvicorn")
        logger.error(f"Could not connect to Redis: {e}")
        redis_client = None
        exit(1)


async def shutdown_redis():
    global redis_client

    if redis_client:
        await redis_client.close()
        await redis_client.connection_pool.disconnect()

        logger = logging.getLogger("uvicorn")
        logger.error("Redis stopped successfully")


def get_redis_client() -> Optional[Redis]:
    return redis_client
