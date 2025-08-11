from typing import List, Optional

from beanie import Delete, Link, before_event
from bson import ObjectId
from pydantic import Field

from .baseDocument import BaseDocument
from .folder import Folder
from .user import User


class File(BaseDocument):
    file_name: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    owner: Link[User]
    folder: Optional[Link[Folder]] = None
    tags: List[str] = []
    gridfs_id: Optional[str] = Field(default=None)
    embedding: Optional[List[float]] = Field(default=None)
    content_hash: Optional[str] = Field(default=None)

    class Settings(BaseDocument.Settings):
        indexes = ["content_hash"]

    @before_event(Delete)
    async def _delete_related_data(self):
        from src.client import get_fs, get_redis_client

        fs = get_fs()
        if self.gridfs_id:
            await fs.delete(ObjectId(self.gridfs_id))

        if self.content_hash:
            other_files_with_same_hash = await File.find(
                File.content_hash == self.content_hash, File.id != self.id
            ).count()

            if other_files_with_same_hash == 0:
                r = get_redis_client()
                redis_key = f"doc:{self.content_hash}"
                if await r.exists(redis_key):
                    await r.delete(redis_key)

    async def _to_dict(self, include_refs=False):
        file = {
            "id": str(self.id),
            "file_name": self.file_name,
            "file_type": self.file_type,
            "file_size": self.file_size,
            "tags": self.tags,
            "gridfs_id": str(self.gridfs_id),
        }

        if include_refs and self.folder:
            folder = await self.folder.fetch()
            if folder:
                file["folder"] = await folder._to_dict()

        return file
