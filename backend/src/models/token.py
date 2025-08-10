from datetime import datetime, timedelta, timezone

from beanie import Document, Link
from pydantic import Field
from pymongo import ASCENDING, IndexModel

from .user import User


class JWTToken(Document):
    user: Link[User]
    token: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime

    class Settings:
        indexes = [
            "token",
            "user",
            [("expires_at", ASCENDING)],
            IndexModel(
                [("expires_at", ASCENDING)],
                expireAfterSeconds=0,
                name="expires_at_ttl_index",
            ),
        ]

    @classmethod
    async def create(cls, user: User, token: str, expires_in: int):
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=expires_in)
        return await cls(user=user, token=token, expires_at=expires_at).insert()
