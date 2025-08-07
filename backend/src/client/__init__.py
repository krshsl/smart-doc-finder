from beanie import init_beanie
from pymongo import AsyncMongoClient

from src.models import User, File, Folder, JWTToken

client: AsyncMongoClient = None

async def init_db(uri: str, db_name: str):
    global client
    client = AsyncMongoClient(uri)
    db = client[db_name]
    await init_beanie(
        database=db,
        document_models=[User, File, Folder, JWTToken]
    )
