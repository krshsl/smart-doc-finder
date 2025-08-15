import logging
import tracemalloc
from asyncio import create_task
from contextlib import asynccontextmanager
from os import getenv
from sys import exit
from types import SimpleNamespace

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from .api import routes
from .client import (
    init_db,
    init_redis,
    init_redis_index,
    init_search_index,
    shutdown_db,
    shutdown_redis,
)
from .middleware import load_middlewares
from .rag import init_torch
from .utils.constants import REQUIRED_APP_VARS
from .utils.populate_db import populate_db

logger = logging.getLogger("uvicorn")

ENV = getenv("ENV", "prod").lower()
debug_mode = False  # "dev" in ENV
if debug_mode:
    tracemalloc.start()
    logger.info("tracemalloc enabled for development mode.")


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

    await init_redis_index(ENV)
    logger.info("Redis Search index initialized successfully.")

    await init_search_index(app_vars)
    logger.info("Atlas Search index initialized successfully.")

    init_torch()
    create_task(populate_db(app_vars))

    yield

    await shutdown_db()
    await shutdown_redis()
    logger.info("Application shutting down.")


app = FastAPI(lifespan=lifespan, debug=debug_mode)

origins = getenv("CORS_ORIGINS", "").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes)
app.add_middleware(GZipMiddleware, minimum_size=1000)
for middleware in load_middlewares():
    app.middleware("http")(middleware)
