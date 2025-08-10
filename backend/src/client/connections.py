from os import getenv

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


async def init_redis(env_vars):
    try:
        redis_client = Redis(
            host=env_vars.REDIS_HOST,
            port=env_vars.REDIS_PORT,
            username=getenv("REDIS_USERNAME"),
            password=env_vars.REDIS_PASSWORD,
            decode_responses=False,
        )
        redis_client.ping()
        print("Successfully connected to Redis.")
    except ConnectionError as e:
        print(f"Could not connect to Redis: {e}")
        redis_client = None


def get_mongo_client() -> AsyncMongoClient:
    return mongo_client


def get_db() -> AsyncDatabase:
    return db


def get_fs() -> AsyncGridFSBucket:
    return fs


def get_redis_client() -> Redis:
    return redis_client
