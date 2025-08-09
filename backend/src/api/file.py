import urllib.parse
from io import BytesIO

from bson import ObjectId
from bson.dbref import DBRef
from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, status
from fastapi import File as FastAPIFile
from fastapi.responses import StreamingResponse
from filetype import guess
from pydantic import BaseModel, constr

import src.utils.auth as auth
from src.client import get_fs
from src.models import File, Folder, User
from src.utils.constants import DEFAULT_FOLDER, META_DATA_SIZE, STORAGE_QUOTA
from src.utils.exceptions import (
    raise_access_denied,
    raise_not_found,
    raise_storage_exceeded,
)

router = APIRouter()


@router.post("/file", status_code=status.HTTP_201_CREATED)
async def add_file(
    file: UploadFile = FastAPIFile(...),
    file_name: str = Form(...),
    folder_id: str | None = Form(None),
    tags: list[str] = Form([]),
    token=Depends(auth.verify_access_token_exclude_guests),
    fs=Depends(get_fs),
):
    token_data, current_user = token
    if folder_id:
        folder = await Folder.get(folder_id)
    else:
        folder = await Folder.find_one(
            Folder.name == DEFAULT_FOLDER,
            Folder.owner == DBRef(User.__name__, current_user.id),
            Folder.parent == None,
        )

    if not folder:
        raise_not_found(Folder.__name__)

    user = await folder.owner.fetch()
    if not user or user.id != current_user.id:
        raise_access_denied()

    contents = await file.read()
    file_obj = BytesIO(contents)

    file_size = META_DATA_SIZE + len(contents)
    kind = guess(contents)
    mime_type = kind.mime if kind else file.content_type

    allowed_mime_types = [
        "application/pdf",
        "text/plain",
        "text/csv",
        "image/jpeg",
        "image/png",
        "image/gif",
    ]
    if mime_type not in allowed_mime_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Allowed types are: {', '.join(allowed_mime_types)}",
        )

    new_usage = current_user.used_storage + file_size
    if new_usage > STORAGE_QUOTA:
        raise_storage_exceeded()

    gridfs_id = None
    try:
        gridfs_id = await fs.upload_from_stream(
            file_name, file_obj, metadata={"contentType": mime_type}
        )

        new_file = File(
            file_name=file_name,
            file_type=mime_type,
            file_size=file_size,
            owner=current_user,
            folder=folder,
            tags=tags,
            gridfs_id=str(gridfs_id),
        )

        await new_file.insert()
        current_user.used_storage = new_usage
        await current_user.save()

        return {
            "message": "File has been created successfully",
            "file_id": str(new_file.id),
        }
    except Exception as e:
        from src import logger

        if gridfs_id:
            await fs.delete(gridfs_id)
        logger.error(e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


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
        media_type=file_doc.file_type or "application/pdf",
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
        await file_doc.delete()
    except Exception as e:
        from src import logger

        logger.error(e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting file from storage",
        )

    return {"message": "File has been successfully deleted"}
