import zipfile
from io import BytesIO
from math import ceil

from bson import DBRef, ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
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


class FolderCreateRequest(BaseModel):
    name: constr(min_length=1)
    parent_folder_id: str | None = None


@router.post("/folder", status_code=status.HTTP_201_CREATED)
async def add_folder(
    data: FolderCreateRequest, token=Depends(auth.verify_access_token_exclude_guests)
):
    token_data, current_user = token
    if data.parent_folder_id:
        parent = await Folder.get(data.parent_folder_id)
    else:
        parent = await Folder.find_one(
            Folder.name == DEFAULT_FOLDER,
            Folder.owner == DBRef(User.__name__, current_user.id),
            Folder.parent is None,
        )

    if not parent:
        raise_not_found(Folder.__name__)

    user = await parent.owner.fetch()
    if not user or user.id != current_user.id:
        raise_access_denied()

    new_usage = current_user.used_storage + META_DATA_SIZE
    if new_usage > STORAGE_QUOTA:
        raise_storage_exceeded()

    new_folder = Folder(name=data.name, owner=current_user, parent=parent)

    await new_folder.insert()
    current_user.used_storage = new_usage
    await current_user.save()

    return {
        "message": "Folder has been created successfully",
        "folder_id": str(new_folder.id),
    }


class RenameRequest(BaseModel):
    name: constr(min_length=1)


@router.post("/folder/edit/{folder_id}", status_code=status.HTTP_200_OK)
async def edit_file(
    folder_id: str,
    payload: RenameRequest,
    token=Depends(auth.verify_access_token_exclude_guests),
):
    token_data, current_user = token
    folder = await Folder.get(ObjectId(folder_id))
    if not folder:
        raise_not_found(Folder.__name__)

    owner = await folder.owner.fetch()
    if owner.id != current_user.id:
        raise_access_denied()

    try:
        folder.name = payload.name
        await folder.save()

        return {"message": "Folder has been renamed successfully"}
    except Exception as e:
        from src import logger

        logger.error(e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error while renaming file",
        )


@router.get("/folder", status_code=status.HTTP_200_OK)
@router.get("/folder/{folder_id}", status_code=status.HTTP_200_OK)
async def get_folder_contents(
    folder_id: str | None = None,
    page: int = 1,
    limit: int = 20,
    token=Depends(auth.verify_access_token),
):
    token_data, current_user = token

    if folder_id:
        folder = await Folder.get(ObjectId(folder_id))
    else:
        folder = await Folder.find_one(
            Folder.name == DEFAULT_FOLDER,
            Folder.owner == DBRef(User.__name__, current_user.id),
            Folder.parent == None,
        )

    if not folder:
        raise_not_found(Folder.__name__)

    owner = await folder.owner.fetch()
    if owner.id != current_user.id:
        raise_access_denied()

    skip = (page - 1) * limit

    sub_folders_query = Folder.find(Folder.parent.id == folder.id)
    files_query = File.find(File.folder.id == folder.id)

    total_folders = await sub_folders_query.count()
    total_files = await files_query.count()
    total_items = total_folders + total_files

    sub_folders = await sub_folders_query.skip(skip).limit(limit).to_list()

    remaining_limit = limit - len(sub_folders)
    files_skip = max(0, skip - total_folders)

    files = []
    if remaining_limit > 0:
        files = await files_query.skip(files_skip).limit(remaining_limit).to_list()

    folder_dict = await folder._to_dict(include_refs=False, include_parents=True)
    folder_dict["sub_folders"] = [await f._to_dict() for f in sub_folders]
    folder_dict["files"] = [await f._to_dict() for f in files]

    return {
        "folder_data": folder_dict,
        "total_pages": ceil(total_items / limit),
        "current_page": page,
    }


@router.get("/folder/download/{folder_id}", status_code=status.HTTP_200_OK)
async def download_folder(
    folder_id: str, token=Depends(auth.verify_access_token), fs=Depends(get_fs)
):
    token_data, current_user = token
    folder = await Folder.get(ObjectId(folder_id))
    if not folder:
        raise_not_found(Folder.__name__)

    owner = await folder.owner.fetch()
    if owner.id != current_user.id:
        raise_access_denied()

    zip_buffer = BytesIO()

    async def add_folder_to_zip(
        target_folder: Folder, archive: zipfile.ZipFile, base_path: str
    ):
        current_path = f"{base_path}{target_folder.name}/"

        files_in_folder = await File.find(File.folder.id == target_folder.id).to_list()
        for file_doc in files_in_folder:
            if not file_doc.gridfs_id:
                continue
            try:
                gridfs_file = await fs.open_download_stream(
                    ObjectId(file_doc.gridfs_id)
                )
                file_content = await gridfs_file.read()
                archive.writestr(f"{current_path}{file_doc.file_name}", file_content)
            except Exception:
                continue

        sub_folders = await Folder.find(Folder.parent.id == target_folder.id).to_list()
        for sub_folder in sub_folders:
            await add_folder_to_zip(sub_folder, archive, current_path)

    with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as archive:
        await add_folder_to_zip(folder, archive, "")

    zip_buffer.seek(0)
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={folder.name}.zip"},
    )


@router.delete("/folder/{folder_id}", status_code=status.HTTP_200_OK)
async def delete_folder(
    folder_id: str, token=Depends(auth.verify_access_token_exclude_guests)
):
    token_data, current_user = token
    folder = await Folder.get(ObjectId(folder_id))
    if not folder:
        raise_not_found(Folder.__name__)

    owner = await folder.owner.fetch()
    if owner.id != current_user.id:
        raise_access_denied()

    if folder.name == DEFAULT_FOLDER and folder.parent is None:
        raise_access_denied()

    try:
        storage_freed = await folder.calculate_total_size()
        owner.used_storage -= storage_freed
        await folder.delete()
        await owner.save()
    except Exception as e:
        from src import logger

        logger.error(e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting folder from storage",
        )

    return {
        "message": "Folder and all associated contents have been successfully deleted"
    }
