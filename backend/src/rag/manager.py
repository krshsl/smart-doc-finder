import asyncio


class Manager:
    def __init__(self, total_connections: int, ingest_ratio: float = 0.75):
        ingest_connections = int(total_connections * ingest_ratio)
        search_connections = total_connections - ingest_connections

        self.ingest_semaphore = asyncio.Semaphore(ingest_connections)
        self.search_semaphore = asyncio.Semaphore(search_connections)


semaphore_manager = Manager(total_connections=8)


def get_ingest_semaphore() -> asyncio.Semaphore:
    return semaphore_manager.ingest_semaphore


def get_search_semaphore() -> asyncio.Semaphore:
    return semaphore_manager.search_semaphore
