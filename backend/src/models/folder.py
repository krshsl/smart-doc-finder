from typing import Optional, List
from beanie import Link

from .baseDocument import BaseDocument
from .user import User

class Folder(BaseDocument):
    name: str
    owner: Link[User]
    parent: Optional[Link["Folder"]] = None  # self-referencing
    shared_with: List[Link[User]] = []
