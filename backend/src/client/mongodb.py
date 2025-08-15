import logging
from typing import Optional

from beanie import init_beanie
from gridfs import AsyncGridFSBucket
from pymongo import AsyncMongoClient
from pymongo.asynchronous.database import AsyncDatabase

from src.models import File, Folder, JWTToken, User

mongo_client: Optional[AsyncMongoClient] = None
db: Optional[AsyncDatabase] = None
fs: Optional[AsyncGridFSBucket] = None


async def init_db(uri: str, db_name: str):
    try:
        global mongo_client, db, fs
        mongo_client = AsyncMongoClient(uri)
        db = AsyncDatabase(mongo_client, db_name)
        fs = AsyncGridFSBucket(db)
        await init_beanie(database=db, document_models=[User, File, Folder, JWTToken])
    except Exception as e:
        logger = logging.getLogger("uvicorn")
        logger.error(f"Could not connect to MongoDB: {e}")
        exit(1)


async def shutdown_db():
    global mongo_client
    if mongo_client:
        import logging

        await mongo_client.close()

        logger = logging.getLogger("uvicorn")
        logger.info("MongoDB connection closed.")


def get_mongo_client() -> Optional[AsyncMongoClient]:
    return mongo_client


def get_db() -> Optional[AsyncDatabase]:
    return db


def get_fs() -> Optional[AsyncGridFSBucket]:
    return fs
