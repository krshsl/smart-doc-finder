import logging
import tracemalloc
from contextlib import asynccontextmanager
from os import getenv
from sys import exit
from types import SimpleNamespace

from fastapi import FastAPI

from .api import routes
from .client import init_db, init_redis, init_redis_index, init_search_index
from .utils.constants import REQUIRED_APP_VARS
from .utils.populate_db import populate_db

tracemalloc.start()
logger = logging.getLogger("uvicorn")


def get_app_vars():
    app_vars = {name: getenv(name) for name in REQUIRED_APP_VARS}

    missing_vars = [name for name, val in app_vars.items() if not val]
    if missing_vars:
        logger.error(f"Missing env vars: {', '.join(missing_vars)}")
        exit(1)

    return SimpleNamespace(**app_vars)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app_vars = get_app_vars()
    await init_db(
        app_vars.DB_URI.replace("<db_password>", app_vars.DB_PASS),
        app_vars.DB_NAME,
    )
    logger.info("Database initialized successfully.")
    await init_redis(app_vars)
    logger.info("Redis initialized successfully.")
    await init_redis_index()
    logger.info("Redis Search index initialized successfully.")
    await init_search_index(app_vars)
    logger.info("Atlas Search index initialized successfully.")
    await populate_db(app_vars)
    logger.info("Populated db successfully.")
    yield
    logger.info("Application shutting down.")


app = FastAPI(lifespan=lifespan)
app.include_router(routes)
