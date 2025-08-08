from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File as FastAPIFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, constr
from bson import ObjectId
from io import BytesIO
from filetype import guess

import src.utils.auth as auth
from src.client import fs
from src.models.user import DEFAULT_FOLDER
from src.models import File, Folder

router = APIRouter()

class FileCreateRequest(BaseModel):
    file_name: constr(min_length=1)
    folder_id: str | None = None
    tags: list[str] = []

@router.post("/file", status_code=status.HTTP_201_CREATED)
async def add_file(
    file: UploadFile = FastAPIFile(...),
    data: FileCreateRequest = Depends(),
    token = Depends(auth.verify_access_token)
):
    token_data, current_user = token
    if data.folder_id:
        folder = await Folder.get(data.folder_id)
    else:
        folder = await Folder.find_one(Folder.name == DEFAULT_FOLDER, Folder.parent == None, Folder.owner == current_user.id)

    if not folder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")

    contents = await file.read()
    file_obj = BytesIO(contents)

    file_size = len(contents)
    kind = guess(contents)
    mime_type = kind.mime if kind else None

    if mime_type != "application/pdf":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF files are allowed")

    new_usage = current_user.used_storage + file_size
    if new_usage > current_user.storage_quota:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Storage quota exceeded")

    gridfs_id = None
    try:
        gridfs_id = await fs.upload_from_stream(data.file_name, file_obj, metadata={"contentType": mime_type})

        new_file = File(
            file_name=data.file_name,
            file_type=mime_type,
            file_size=file_size,
            owner=current_user,
            folder=folder,
            tags=data.tags,
            gridfs_id=str(gridfs_id)
        )

        await new_file.insert()
        current_user.used_storage = new_usage
        await current_user.save()

        return {"message": "File has been created successfully", "file_id": str(new_file.id)}
    except Exception as e:
        if gridfs_id:
            await fs.delete(gridfs_id)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/file/{file_id}", status_code=status.HTTP_200_OK)
async def get_file(
    file_id: str,
    token=Depends(auth.verify_access_token)
):
    token_data, current_user = token
    file_doc = await File.get(ObjectId(file_id))
    if not (file_doc and file_doc.gridfs_id and await fs.exists(file_doc.gridfs_id)):
        raise HTTPException(status_code=404, detail="File not found")

    if file_doc.owner.id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    buffer = BytesIO()
    await fs.download_to_stream(ObjectId(file_doc.gridfs_id), buffer)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type=file_doc.file_type or "application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{file_doc.file_name}"'}
    )

@router.delete("/file/{file_id}", status_code=status.HTTP_200_OK)
async def delete_file(
    file_id: str,
    token=Depends(auth.verify_access_token)
):
    token_data, current_user = token
    file_doc = await File.get(ObjectId(file_id))
    if not (file_doc and file_doc.gridfs_id and await fs.exists(file_doc.gridfs_id)):
        raise HTTPException(status_code=404, detail="File not found")

    if file_doc.owner.id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    try:
        await file_doc.delete()
    except Exception:
        raise HTTPException(status_code=500, detail="Error deleting file from storage")

    return {"message": "File has been successfully deleted"}
