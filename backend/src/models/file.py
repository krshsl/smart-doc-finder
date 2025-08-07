from typing import Optional, List
from beanie import Link

from .baseDocument import BaseDocument
from .folder import Folder
from .user import User

class File(BaseDocument):
    file_name: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    storage_path: str
    owner: Link[User]
    folder: Optional[Link[Folder]] = None
    tags: List[str] = []
    embedding_id: Optional[str] = None
