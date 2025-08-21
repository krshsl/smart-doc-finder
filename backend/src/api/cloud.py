import zipfile
from io import BytesIO
from typing import List

from bson import ObjectId
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from fastapi import File as FastAPIFile
from fastapi.responses import JSONResponse, StreamingResponse
from filetype import guess
from pydantic import BaseModel, Field

import src.utils.auth as auth
from src.client import get_fs, get_redis_client
from src.models import File, Folder, User
from src.rag.ingest import ingest_file_to_redis
from src.utils.constants import (
    ALLOWED_MIME_TYPES,
    DEFAULT_FOLDER,
    META_DATA_SIZE,
    STORAGE_QUOTA,
)
from src.utils.exceptions import (
    raise_access_denied,
    raise_not_found,
    raise_storage_exceeded,
)

router = APIRouter()


class BulkActionRequest(BaseModel):
    file_ids: List[str] = Field(default_factory=list)
    folder_ids: List[str] = Field(default_factory=list)


@router.post("/bulk/upload", status_code=status.HTTP_207_MULTI_STATUS)
async def bulk_upload(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = FastAPIFile(...),
    file_paths: List[str] = Form(...),
    parent_folder_id: str | None = Form(None),
    tags: List[str] = Form([]),
    token=Depends(auth.verify_access_token_exclude_guests),
    fs=Depends(get_fs),
    r_client=Depends(get_redis_client),
):
    token_data, current_user = token

    if parent_folder_id:
        upload_root_folder = await Folder.get(parent_folder_id)
    else:
        upload_root_folder = await Folder.find_one(
            Folder.name == DEFAULT_FOLDER,
            Folder.owner.id == current_user.id,
            Folder.parent == None,
        )

    if not upload_root_folder:
        raise_not_found("Target folder")

    owner = await upload_root_folder.owner.fetch()
    if not owner or owner.id != current_user.id:
        raise_access_denied()

    total_upload_size = 0
    file_contents_map = {}
    unique_folder_paths = set()

    for i, file in enumerate(files):
        contents = await file.read()
        file_contents_map[i] = contents
        total_upload_size += len(contents)
        path_parts = file_paths[i].split("/")
        if len(path_parts) > 1:
            for j in range(len(path_parts) - 1):
                unique_folder_paths.add("/".join(path_parts[: j + 1]))

    total_upload_size += len(unique_folder_paths) * META_DATA_SIZE
    if current_user.used_storage + total_upload_size > STORAGE_QUOTA:
        raise_storage_exceeded()

    successful_uploads = []
    failed_uploads = []
    storage_to_add = 0
    created_folders_cache = {}

    for i, file in enumerate(files):
        file_path = file_paths[i]
        file_name = file.filename
        contents = file_contents_map[i]
        gridfs_id = None

        try:
            current_parent_folder = upload_root_folder
            path_parts = file_path.split("/")
            if len(path_parts) > 1:
                folder_path_parts = path_parts[:-1]
                cumulative_path = ""
                for part in folder_path_parts:
                    cumulative_path = (
                        f"{cumulative_path}/{part}" if cumulative_path else part
                    )

                    if cumulative_path in created_folders_cache:
                        current_parent_folder = created_folders_cache[cumulative_path]
                    else:
                        existing_folder = await Folder.find_one(
                            Folder.name == part,
                            Folder.owner.id == current_user.id,
                            Folder.parent.id == current_parent_folder.id,
                        )
                        if existing_folder:
                            current_parent_folder = existing_folder
                        else:
                            new_folder = Folder(
                                name=part,
                                owner=current_user,
                                parent=current_parent_folder,
                            )
                            await new_folder.insert()
                            storage_to_add += META_DATA_SIZE
                            current_parent_folder = new_folder
                            created_folders_cache[cumulative_path] = new_folder

            kind = guess(contents)
            mime_type = kind.mime if kind else file.content_type
            if mime_type not in ALLOWED_MIME_TYPES:
                raise ValueError(f"Unsupported file type: {mime_type}")

            file_obj = BytesIO(contents)
            gridfs_id = await fs.upload_from_stream(
                file_name, file_obj, metadata={"contentType": mime_type}
            )

            file_size = len(contents)
            new_file = File(
                file_name=file_name,
                file_type=mime_type,
                file_size=file_size,
                owner=current_user,
                folder=current_parent_folder,
                tags=tags,
                gridfs_id=str(gridfs_id),
            )
            await new_file.insert()
            background_tasks.add_task(
                ingest_file_to_redis, r_client, fs, str(new_file.id)
            )

            storage_to_add += file_size
            successful_uploads.append({"file_name": file_name, "id": str(new_file.id)})
        except Exception as e:
            if gridfs_id:
                await fs.delete(gridfs_id)
            failed_uploads.append(
                {"file_name": file_name, "path": file_path, "error": str(e)}
            )

    if storage_to_add > 0:
        await current_user.update({"$inc": {"used_storage": storage_to_add}})

    return JSONResponse(
        status_code=status.HTTP_207_MULTI_STATUS,
        content={
            "successful_uploads": successful_uploads,
            "failed_uploads": failed_uploads,
        },
    )


@router.post("/bulk/download", status_code=status.HTTP_200_OK)
async def bulk_download(
    payload: BulkActionRequest,
    token=Depends(auth.verify_access_token_exclude_guests),
    fs=Depends(get_fs),
):
    token_data, current_user = token
    zip_buffer = BytesIO()

    async def add_folder_to_zip(
        folder_id: str, archive: zipfile.ZipFile, base_path: str
    ):
        folder = await Folder.get(ObjectId(folder_id))
        if not folder:
            return

        owner = await folder.owner.fetch()
        if owner.id != current_user.id:
            return

        current_path = f"{base_path}{folder.name}/"

        files_in_folder = await File.find(File.folder.id == folder.id).to_list()
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

        sub_folders = await Folder.find(Folder.parent.id == folder.id).to_list()
        for sub_folder in sub_folders:
            await add_folder_to_zip(str(sub_folder.id), archive, current_path)

    with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as archive:
        for file_id in payload.file_ids:
            file_doc = await File.get(ObjectId(file_id))
            if not file_doc:
                continue

            owner = await file_doc.owner.fetch()
            if owner.id == current_user.id and file_doc.gridfs_id:
                try:
                    gridfs_file = await fs.open_download_stream(
                        ObjectId(file_doc.gridfs_id)
                    )
                    file_content = await gridfs_file.read()
                    archive.writestr(file_doc.file_name, file_content)
                except Exception:
                    continue

        for folder_id in payload.folder_ids:
            await add_folder_to_zip(folder_id, archive, "")

    zip_buffer.seek(0)
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=download.zip"},
    )


@router.post("/bulk/delete", status_code=status.HTTP_207_MULTI_STATUS)
async def bulk_delete(
    payload: BulkActionRequest,
    token=Depends(auth.verify_access_token_exclude_guests),
    fs=Depends(get_fs),
):
    token_data, current_user = token
    successful_deletes = []
    failed_deletes = []
    storage_freed = 0

    for folder_id in payload.folder_ids:
        try:
            folder = await Folder.get(ObjectId(folder_id))
            if not folder:
                raise_not_found(Folder.__name__)

            owner = await folder.owner.fetch()
            if not owner or owner.id != current_user.id:
                raise_access_denied()

            if folder.name == "Home" and folder.parent is None:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="The root 'Home' folder cannot be deleted.",
                )

            storage = await folder.calculate_total_size()
            await folder.delete()
            storage_freed += storage
            successful_deletes.append({"id": folder_id, "type": "folder"})
        except Exception as e:
            failed_deletes.append({"id": folder_id, "type": "folder", "error": str(e)})

    for file_id in payload.file_ids:
        try:
            file_doc = await File.get(ObjectId(file_id))
            if not file_doc:
                raise_not_found(File.__name__)

            owner = await file_doc.owner.fetch()
            if not owner or owner.id != current_user.id:
                raise_access_denied()

            storage = file_doc.file_size
            await file_doc.delete()
            storage_freed += storage
            successful_deletes.append({"id": file_id, "type": "file"})
        except Exception as e:
            failed_deletes.append({"id": file_id, "type": "file", "error": str(e)})

    try:
        current_user.used_storage -= storage_freed
        await current_user.save()
    except Exception as e:
        from src import logger

        logger.error(e, exc_info=True)

    return {
        "successful_deletes": successful_deletes,
        "failed_deletes": failed_deletes,
    }


@router.get("/storage/{user_id}", status_code=status.HTTP_200_OK)
async def get_cloud_storage(
    user_id: str,
    token=Depends(auth.verify_access_token),
):
    token_data, current_user = token
    user = await User.get(user_id)
    if not user:
        raise_not_found(User.__name__)

    if user.id != current_user.id and current_user.role != "admin":
        raise_access_denied()

    return {"storage_used": user.used_storage, "storage_quota": STORAGE_QUOTA}
