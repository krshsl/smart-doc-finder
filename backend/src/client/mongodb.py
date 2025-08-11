from beanie import init_beanie
from gridfs import AsyncGridFSBucket
from pymongo import AsyncMongoClient
from pymongo.asynchronous.database import AsyncDatabase

from src.models import File, Folder, JWTToken, User

mongo_client: AsyncMongoClient = None
db: AsyncDatabase = None
fs: AsyncGridFSBucket = None


async def init_db(uri: str, db_name: str):
    global mongo_client, db, fs
    mongo_client = AsyncMongoClient(uri)
    db = AsyncDatabase(mongo_client, db_name)
    fs = AsyncGridFSBucket(db)
    await init_beanie(database=db, document_models=[User, File, Folder, JWTToken])


def get_mongo_client() -> AsyncMongoClient:
    return mongo_client


def get_db() -> AsyncDatabase:
    return db


def get_fs() -> AsyncGridFSBucket:
    return fs
