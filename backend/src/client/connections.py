import logging
from types import SimpleNamespace

from beanie import init_beanie
from gridfs import AsyncGridFSBucket
from pymongo import AsyncMongoClient
from pymongo.asynchronous.database import AsyncDatabase
from redis.asyncio import Redis
from redis.exceptions import ConnectionError

from src.models import File, Folder, JWTToken, User

mongo_client: AsyncMongoClient = None
db: AsyncDatabase = None
fs: AsyncGridFSBucket = None
redis_client: Redis = None


async def init_db(uri: str, db_name: str):
    global mongo_client, db, fs
    mongo_client = AsyncMongoClient(uri)
    db = AsyncDatabase(mongo_client, db_name)
    fs = AsyncGridFSBucket(db)
    await init_beanie(database=db, document_models=[User, File, Folder, JWTToken])


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
        logger.info("Could not connect to Redis: ", e)
        redis_client = None
        exit(1)


def get_mongo_client() -> AsyncMongoClient:
    return mongo_client


def get_db() -> AsyncDatabase:
    return db


def get_fs() -> AsyncGridFSBucket:
    return fs


def get_redis_client() -> Redis:
    return redis_client
