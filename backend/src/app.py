from os import getenv
from sys import exit

from fastapi import FastAPI
from dotenv import load_dotenv

from .client import init_db
from .routes import routes

app = FastAPI()
app.include_router(routes)

@app.on_event("startup")
async def startup_event():
    load_dotenv("dev.env")

    _uri = getenv("URI")
    _pwd = getenv("DB_PASS")
    _db = getenv("DB_NAME")
    _secret_key = getenv("SECRET_KEY")
    _algo = getenv("ALGORITHM")

    if not all([_uri, _pwd, _db, _secret_key, _algo]):
        print("Error: One or more required environment variables are missing.")
        exit(1)

    await init_db(_uri.replace("<db_password>", _pwd), _db)
