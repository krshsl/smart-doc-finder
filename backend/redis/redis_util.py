import os
from dotenv import load_dotenv
import redis

load_dotenv()

def get_redis_connection():
    redis_host = os.getenv("REDIS_HOST")
    redis_port = os.getenv("REDIS_PORT")
    redis_password = os.getenv("REDIS_PASSWORD")
    redis_username = os.getenv("REDIS_USERNAME") or None

    if not redis_host or not redis_port or not redis_password:
        raise ValueError("Redis credentials missing. Check your .env file.")

    return redis.Redis(
        host=redis_host,
        port=int(redis_port),
        username=redis_username,
        password=redis_password,
        decode_responses=True   # decode strings automatically for convenience
    )
