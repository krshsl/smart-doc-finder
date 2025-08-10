import logging
import tracemalloc
from contextlib import asynccontextmanager
from os import getenv
from sys import exit

from dotenv import load_dotenv
from fastapi import FastAPI

from .api import routes
from .client import init_db

tracemalloc.start()
logger = logging.getLogger("uvicorn")


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_dotenv("dev.env")

    _uri = getenv("URI")
    _pwd = getenv("DB_PASS")
    _db = getenv("DB_NAME")
    _secret_key = getenv("SECRET_KEY")
    _algo = getenv("ALGORITHM")

    if not all([_uri, _pwd, _db, _secret_key, _algo]):
        logger.error("Error: One or more required environment variables are missing.")
        exit(1)

    await init_db(_uri.replace("<db_password>", _pwd), _db)
    logger.info("Database initialized successfully.")
    yield

    logger.info("Application shutting down.")


app = FastAPI(lifespan=lifespan)
app.include_router(routes)
