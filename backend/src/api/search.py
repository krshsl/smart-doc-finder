import re
from asyncio import gather

from beanie.operators import In
from bson import ObjectId
from bson.dbref import DBRef
from fastapi import APIRouter, BackgroundTasks, Depends, status
from redis.exceptions import RedisError

import src.utils.auth as auth
from src.client import get_redis_client
from src.models import File, Folder, User
from src.rag.ingest import sync_files_to_redis
from src.rag.search import (
    perform_mongodb_search,
    perform_redis_search,
)

router = APIRouter()


@router.get("/search", status_code=status.HTTP_200_OK)
async def search_files_and_folders(q: str, token=Depends(auth.verify_access_token)):
    token_data, current_user = token
    regex = re.compile(q, re.IGNORECASE)

    folders = await Folder.find(
        Folder.name == regex, Folder.owner == DBRef(User.__name__, current_user.id)
    ).to_list()

    files = await File.find(
        File.file_name == regex, File.owner == DBRef(User.__name__, current_user.id)
    ).to_list()

    return {
        "folders": await gather(*(f._to_dict() for f in folders)),
        "files": await gather(*(f._to_dict(include_refs=True) for f in files)),
    }


@router.get("/search/ai", status_code=status.HTTP_200_OK)
async def ai_search(
    q: str,
    background_tasks: BackgroundTasks,
    token=Depends(auth.verify_access_token),
):
    token_data, current_user = token
    file_docs = []
    score_map = {}

    try:
        search_results = await perform_redis_search(q)
        if search_results:
            score_map = {res["hash"]: res["score"] for res in search_results}
            content_hashes = list(score_map.keys())

            file_docs = await File.find(
                In(File.content_hash, content_hashes),
                File.owner == DBRef(User.__name__, current_user.id),
            ).to_list()

    except RedisError as e:
        from src import logger

        logger.warning(f"Redis search failed, falling back to MongoDB: {e}")

        search_results = await perform_mongodb_search(q, current_user)
        if search_results:
            score_map = {res["id"]: res["score"] for res in search_results}
            result_ids = list(score_map.keys())

            file_docs = await File.find(
                In(File.id, [ObjectId(id) for id in result_ids]),
                File.owner == DBRef(User.__name__, current_user.id),
            ).to_list()

            sync_ids = [str(doc.id) for doc in file_docs]
            r_client = get_redis_client()
            background_tasks.add_task(sync_files_to_redis, r_client, sync_ids)

    if not file_docs:
        return {"files": [], "folders": []}

    files_as_dicts = await gather(
        *(doc._to_dict(include_refs=True) for doc in file_docs)
    )

    for file_dict in files_as_dicts:
        doc_id_str = file_dict["id"]
        original_doc = next(
            (doc for doc in file_docs if str(doc.id) == doc_id_str), None
        )

        lookup_key = (
            original_doc.content_hash
            if original_doc and original_doc.content_hash in score_map
            else doc_id_str
        )
        file_dict["score"] = score_map.get(lookup_key, 0)

    scores = [f["score"] for f in files_as_dicts if f["score"] > 0]
    if scores:
        min_score = min(scores)
        max_score = max(scores)
        score_range = max_score - min_score

        if score_range > 0:
            for f in files_as_dicts:
                f["score"] = (f["score"] - min_score) / score_range
        else:
            for f in files_as_dicts:
                f["score"] = 1.0

    return {
        "files": files_as_dicts,
        "folders": [],
    }
