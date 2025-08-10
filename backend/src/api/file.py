import urllib.parse
from io import BytesIO

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, constr

import src.utils.auth as auth
from src.client import get_fs
from src.models import File
from src.utils.exceptions import (
    raise_access_denied,
    raise_not_found,
)

router = APIRouter()


class RenameRequest(BaseModel):
    name: constr(min_length=1)


@router.post("/file/edit/{file_id}", status_code=status.HTTP_200_OK)
async def edit_file(
    file_id: str,
    payload: RenameRequest,
    token=Depends(auth.verify_access_token_exclude_guests),
    fs=Depends(get_fs),
):
    token_data, current_user = token
    file_doc = await File.get(ObjectId(file_id))
    if not (file_doc and file_doc.gridfs_id):
        raise_not_found(File.__name__)

    owner = await file_doc.owner.fetch()
    if owner.id != current_user.id:
        raise_access_denied()

    try:
        await fs.rename(ObjectId(file_doc.gridfs_id), payload.name)

        file_doc.file_name = payload.name
        await file_doc.save()

        return {"message": "File has been renamed successfully"}
    except Exception as e:
        from src import logger

        logger.error(e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error while renaming file",
        )


@router.get("/file/{file_id}", status_code=status.HTTP_200_OK)
async def get_file(
    file_id: str, token=Depends(auth.verify_access_token), fs=Depends(get_fs)
):
    token_data, current_user = token
    file_doc = await File.get(ObjectId(file_id))
    if not (file_doc and file_doc.gridfs_id):
        raise_not_found(File.__name__)

    owner = await file_doc.owner.fetch()
    if owner.id != current_user.id:
        raise_access_denied()

    buffer = BytesIO()
    try:
        await fs.download_to_stream(ObjectId(file_doc.gridfs_id), buffer)
        buffer.seek(0)
    except Exception as e:
        from src import logger

        logger.error(e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error while loading file",
        )

    encoded_filename = urllib.parse.quote(file_doc.file_name)
    return StreamingResponse(
        buffer,
        media_type=file_doc.file_type or "application/octet-stream",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"
        },
    )


@router.delete("/file/{file_id}", status_code=status.HTTP_200_OK)
async def delete_file(
    file_id: str,
    token=Depends(auth.verify_access_token_exclude_guests),
    fs=Depends(get_fs),
):
    token_data, current_user = token
    file_doc = await File.get(ObjectId(file_id))
    if not (file_doc and file_doc.gridfs_id):
        raise_not_found(File.__name__)

    owner = await file_doc.owner.fetch()
    if owner.id != current_user.id:
        raise_access_denied()

    try:
        owner.used_storage -= file_doc.file_size
        await file_doc.delete()
        await owner.save()
    except Exception as e:
        from src import logger

        logger.error(e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting file from storage",
        )

    return {"message": "File has been successfully deleted"}
