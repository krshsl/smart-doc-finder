from beanie import init_beanie
from pymongo import AsyncMongoClient
from pymongo.asynchronous.database import AsyncDatabase
from gridfs import AsyncGridFSBucket

from src.models import User, File, Folder, JWTToken

client: AsyncMongoClient = None
db: AsyncDatabase = None
fs: AsyncGridFSBucket = None

async def init_db(uri: str, db_name: str):
    global client, db, fs
    client = AsyncMongoClient(uri)
    db = AsyncDatabase(client, db_name)
    fs = AsyncGridFSBucket(db)
    await init_beanie(
        database=db,
        document_models=[User, File, Folder, JWTToken]
    )

def get_client() -> AsyncMongoClient:
    return client

def get_db() -> AsyncDatabase:
    return db

def get_fs() -> AsyncGridFSBucket:
    return fs
