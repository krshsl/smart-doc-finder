import re
from asyncio import gather

from bson import ObjectId
from bson.dbref import DBRef
from fastapi import APIRouter, BackgroundTasks, Depends, status
from redis.exceptions import RedisError

import src.utils.auth as auth
from src.models import File, Folder, User
from src.rag.search import perform_redis_search, perform_mongodb_fallback_search

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
    q: str, background_tasks: BackgroundTasks, token=Depends(auth.verify_access_token)
):
    token_data, current_user = token
    search_results = []

    try:
        search_results = await perform_redis_search(q, str(current_user.id))
    except RedisError:
        search_results = await perform_mongodb_fallback_search(q, current_user)

    if not search_results:
        return {"files": [], "folders": []}

    search_results_ids = [res["id"] for res in search_results]

    file_docs = await File.find(
        File.id.in_([ObjectId(id) for id in search_results_ids]),
        File.owner.id == current_user.id,
    ).to_list()

    return {"files": await gather(*(f._to_dict() for f in file_docs))
            , "folders": []}
