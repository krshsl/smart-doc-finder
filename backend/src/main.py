import logging
import tracemalloc
from contextlib import asynccontextmanager
from os import getenv
from sys import exit
from types import SimpleNamespace

from fastapi import FastAPI

from .api import routes
from .client import init_db, init_redis
from .utils.constants import REQUIRED_ENV_VARS

tracemalloc.start()
logger = logging.getLogger("uvicorn")


def get_env_vars():
    env_vars = {name: getenv(name) for name in REQUIRED_ENV_VARS}

    missing_vars = [name for name, val in env_vars.items() if not val]
    if missing_vars:
        logger.error(f"Missing env vars: {', '.join(missing_vars)}")
        exit(1)

    return SimpleNamespace(**env_vars)


@asynccontextmanager
async def lifespan(app: FastAPI):
    env_vars = get_env_vars()
    await init_db(
        env_vars.URI.replace("<db_password>", env_vars.DB_PASS),
        env_vars.DB_NAME,
    )
    logger.info("Database initialized successfully.")
    yield
    await init_redis()
    logger.info("Application shutting down.")


app = FastAPI(lifespan=lifespan)
app.include_router(routes)
