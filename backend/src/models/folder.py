from typing import List, Optional

from beanie import Delete, Link, before_event
from bson.dbref import DBRef

from src.utils.constants import META_DATA_SIZE

from .baseDocument import BaseDocument
from .user import User


class Folder(BaseDocument):
    name: str
    owner: Link[User]
    parent: Optional[Link["Folder"]] = None
    shared_with: List[Link[User]] = []
    folder_size: int = META_DATA_SIZE

    async def calculate_total_size(self):
        from .file import File

        total_size = self.folder_size
        file_size = await File.find(File.folder == DBRef(Folder.__name__, self.id)).sum(
            File.file_size
        )
        total_size = total_size + file_size if file_size else total_size
        child_folders = await Folder.find(
            Folder.parent == DBRef(Folder.__name__, self.id)
        ).to_list()
        for child in child_folders:
            total_size += await child.calculate_total_size()

        return total_size

    @before_event(Delete)
    async def _cascade_delete(self):
        from .file import (
            File,  # cascade delete can only be triggered with a get request??
        )

        files = await File.find(
            File.folder == DBRef(Folder.__name__, self.id)
        ).to_list()
        for file in files:
            await file.delete()

        subfolders = await Folder.find(
            Folder.parent == DBRef(Folder.__name__, self.id)
        ).to_list()
        for folder in subfolders:
            await folder.delete()

    async def _to_dict(
        self, include_refs=False, include_parents=False, include_children=False
    ):
        folder = {
            "id": str(self.id),
            "name": self.name,
            "folder_size": self.folder_size,
        }

        if include_refs:
            from .file import File

            files = await File.find(
                File.folder == DBRef(Folder.__name__, self.id)
            ).to_list()
            folder["files"] = []
            for file in files:
                folder["files"].append(await file._to_dict())

            sub_folders = await Folder.find(
                Folder.parent == DBRef(Folder.__name__, self.id)
            ).to_list()
            folder["sub_folders"] = []
            for sub_folder in sub_folders:
                folder["sub_folders"] = await sub_folder._to_dict(
                    include_refs=include_children, include_children=include_children
                )

        if self.parent:
            parent = await self.parent.fetch()
            folder["parent"] = await parent._to_dict(include_parents=include_parents)

        return folder
