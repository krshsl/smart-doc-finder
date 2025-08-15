import re

from beanie.operators import In
from bson import ObjectId
from bson.dbref import DBRef
from fastapi import APIRouter, BackgroundTasks, Depends, status
from numpy import float32
from redis.exceptions import RedisError

import src.utils.auth as auth
from src.client import get_fs, get_redis_client
from src.models import File, Folder, User
from src.rag import encode_query, sample_text_chunks
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

    result = {}
    result["folders"] = []
    for folder in folders:
        result["folders"].append(await folder._to_dict())

    result["files"] = []
    for file in files:
        result["files"].append(await file._to_dict(include_refs=True))

    return result


@router.get("/search/ai", status_code=status.HTTP_200_OK)
async def ai_search(
    q: str,
    background_tasks: BackgroundTasks,
    token=Depends(auth.verify_access_token),
    fs=Depends(get_fs),
):
    token_data, current_user = token
    file_docs = []
    score_map = {}
    chunks = sample_text_chunks(q)
    embedding = await encode_query(chunks)
    embedding_bytes = embedding.astype(float32).tobytes()
    use_hash = True

    try:
        search_results = await perform_redis_search(embedding_bytes)
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
        use_hash = False
        search_results = await perform_mongodb_search(embedding, current_user)
        if search_results:
            score_map = {res["id"]: res["score"] for res in search_results}
            result_ids = list(score_map.keys())

            file_docs = await File.find(
                In(File.id, [ObjectId(id) for id in result_ids]),
                File.owner == DBRef(User.__name__, current_user.id),
            ).to_list()

            sync_ids = [str(doc.id) for doc in file_docs]
            r_client = get_redis_client()
            background_tasks.add_task(sync_files_to_redis, r_client, fs, sync_ids)

    if not file_docs:
        return {"files": [], "folders": []}

    files_as_dicts = []
    min_score = float("inf")
    max_score = float("-inf")

    for doc in file_docs:
        file_dict = await doc._to_dict(include_refs=True)
        doc_id_str = file_dict["id"]
        lookup_key = doc.content_hash if use_hash else doc_id_str
        score = score_map.get(lookup_key, 0)

        file_dict["score"] = score
        if score > 0:
            if score < min_score:
                min_score = score
            if score > max_score:
                max_score = score

        files_as_dicts.append(file_dict)

    if min_score != float("inf") and max_score != float("-inf"):
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
