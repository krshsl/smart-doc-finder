import shutil

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from fastapi import (
    File as FastAPIFile,
)
from filetype import guess
from pydantic import BaseModel

import src.utils.auth as auth
from src.client import get_fs, get_redis_client
from src.models import File, Folder
from src.rag.ingest import ingest_file_to_redis
from src.utils.constants import (
    ALLOWED_MIME_TYPES,
    DEFAULT_FOLDER,
    META_DATA_SIZE,
    STORAGE_QUOTA,
    TEMP_UPLOAD_DIR,
)
from src.utils.exceptions import (
    raise_access_denied,
    raise_not_found,
    raise_storage_exceeded,
)

router = APIRouter()


class FinalizeRequest(BaseModel):
    upload_id: str
    file_name: str
    total_chunks: int
    parent_folder_id: str | None
    file_path: str


@router.post("/upload/chunk", status_code=status.HTTP_200_OK)
async def upload_chunk(
    upload_id: str = Form(...),
    chunk_index: int = Form(...),
    file_chunk: UploadFile = FastAPIFile(...),
):
    chunk_dir = TEMP_UPLOAD_DIR / upload_id
    chunk_dir.mkdir(parents=True, exist_ok=True)
    chunk_path = chunk_dir / f"{chunk_index}.chunk"

    with open(chunk_path, "wb") as f:
        f.write(await file_chunk.read())

    return {"message": f"Chunk {chunk_index} for {upload_id} uploaded"}


@router.post("/upload/finalize", status_code=status.HTTP_201_CREATED)
async def finalize_upload(
    payload: FinalizeRequest,
    background_tasks: BackgroundTasks,
    token=Depends(auth.verify_access_token_exclude_guests),
    fs=Depends(get_fs),
    r_client=Depends(get_redis_client),
):
    token_data, current_user = token
    chunk_dir = TEMP_UPLOAD_DIR / payload.upload_id

    if not chunk_dir.exists() or len(list(chunk_dir.iterdir())) != payload.total_chunks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"file_name": payload.file_name, "error": "Missing file chunks."},
        )

    if payload.parent_folder_id:
        upload_root_folder = await Folder.get(payload.parent_folder_id)
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

    final_path = chunk_dir / payload.file_name
    with open(final_path, "wb") as final_file:
        for i in range(payload.total_chunks):
            chunk_path = chunk_dir / f"{i}.chunk"
            with open(chunk_path, "rb") as chunk_file:
                final_file.write(chunk_file.read())

    file_size = final_path.stat().st_size
    if current_user.used_storage + file_size > STORAGE_QUOTA:
        raise_storage_exceeded()

    gridfs_id = None
    storage_to_add = 0
    created_folders_cache = {}

    try:
        current_parent_folder = upload_root_folder
        path_parts = payload.file_path.split("/")
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
                    created_folders_cache[cumulative_path] = current_parent_folder

        with open(final_path, "rb") as f:
            contents = f.read()
            kind = guess(contents)
            mime_type = kind.mime if kind else "application/octet-stream"
            if mime_type not in ALLOWED_MIME_TYPES:
                raise ValueError(f"Unsupported file type: {mime_type}")

            gridfs_id = await fs.upload_from_stream(
                payload.file_name, contents, metadata={"contentType": mime_type}
            )

        new_file = File(
            file_name=payload.file_name,
            file_type=mime_type,
            file_size=file_size,
            owner=current_user,
            folder=current_parent_folder,
            gridfs_id=str(gridfs_id),
        )
        await new_file.insert()

        storage_to_add += file_size
        if storage_to_add > 0:
            await current_user.update({"$inc": {"used_storage": storage_to_add}})

        background_tasks.add_task(ingest_file_to_redis, r_client, fs, str(new_file.id))

        return {
            "successful_uploads": [
                {"file_name": new_file.file_name, "id": str(new_file.id)}
            ]
        }
    except Exception as e:
        if gridfs_id:
            await fs.delete(gridfs_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "file_name": payload.file_name,
                "error": f"Failed to process file: {e}",
            },
        )
    finally:
        shutil.rmtree(chunk_dir)
