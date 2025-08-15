from os import getenv

import psutil
from fastapi import HTTPException

active_requests = 0
MAX_CONCURRENT_REQUESTS = int(getenv("MAX_CONCURRENT_REQUESTS"))
MAX_MEMORY_MB = int(getenv("MAX_MEMORY_MB"))
ENV = getenv("ENV", "prod").lower()
debug_mode = "dev" in ENV


async def concurrency_limiter(request, call_next):
    global active_requests
    if active_requests >= MAX_CONCURRENT_REQUESTS:
        raise HTTPException(status_code=503, detail="Server busy")
    active_requests += 1
    try:
        return await call_next(request)
    finally:
        active_requests -= 1


concurrency_limiter._is_middleware = True


def track_usage():
    if not debug_mode:
        return

    import logging
    import tracemalloc

    current, peak = tracemalloc.get_traced_memory()
    logging.getLogger("uvicorn").warning(
        f"Current: {current / 1024 / 1024:.2f} MB; Peak: {peak / 1024 / 1024:.2f} MB"
    )
    tracemalloc.stop()


async def memory_circuit_breaker(request, call_next):
    memory_mb = psutil.Process().memory_info().rss / 1024 / 1024
    if memory_mb > MAX_MEMORY_MB:
        raise HTTPException(status_code=503, detail="High memory usage")
    return await call_next(request)


memory_circuit_breaker._is_middleware = True

middlewares = [concurrency_limiter, memory_circuit_breaker]
