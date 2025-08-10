import re
from asyncio import gather

from bson.dbref import DBRef
from fastapi import APIRouter, Depends, status

import src.utils.auth as auth
from src.models import File, Folder, User

router = APIRouter()


# TODO: Update this flow??
# How do I handle both query and searching for name here?
# Is it better to provide query using the link or do I send it another way??
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
