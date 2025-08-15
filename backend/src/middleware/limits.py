from os import getenv

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


# async def memory_circuit_breaker(request, call_next):
#     import gc
#     from asyncio import sleep

#     max_wait_time = 15
#     check_interval = 0.5
#     waited_time = 0
#     cleanup_attempted = False

#     while waited_time < max_wait_time:
#         memory_mb = psutil.Process().memory_info().rss / 1024 / 1024

#         if memory_mb <= MAX_MEMORY_MB:
#             return await call_next(request)

#         if not cleanup_attempted and waited_time > 2:
#             gc.collect()
#             gc.collect()
#             cleanup_attempted = True

#         elif waited_time > 5 and hasattr(request.app.state, "encoder"):
#             try:
#                 encoder = request.app.state.encoder
#                 if hasattr(encoder, "_emergency_cleanup"):
#                     encoder._emergency_cleanup()
#             except:
#                 pass

#         if debug_mode and int(waited_time) % 2 == 0:
#             import logging

#             logging.getLogger("uvicorn").warning(
#                 f"Memory: {memory_mb:.1f}MB (limit: {MAX_MEMORY_MB}MB), "
#                 f"waiting {waited_time:.1f}s..."
#             )

#         await sleep(check_interval)
#         waited_time += check_interval

#     try:
#         gc.collect()
#         if hasattr(request.app.state, "encoder"):
#             encoder = request.app.state.encoder
#             if hasattr(encoder, "unload_model"):
#                 encoder.unload_model()
#     except:
#         pass

#     final_memory_mb = psutil.Process().memory_info().rss / 1024 / 1024
#     if final_memory_mb <= MAX_MEMORY_MB:
#         return await call_next(request)

#     raise HTTPException(
#         status_code=503,
#         detail=f"Memory critical ({final_memory_mb:.1f}MB), please retry in a moment",
#     )


# memory_circuit_breaker._is_middleware = True

# middlewares = [concurrency_limiter, memory_circuit_breaker]

middlewares = [concurrency_limiter]
