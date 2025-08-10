META_DATA_SIZE = 256
DEFAULT_FOLDER = "Home"
STORAGE_QUOTA = 32 * 1024 * 1024
USER_LIMIT = 16
ALLOWED_MIME_TYPES = [
    "application/pdf",
    "text/plain",
    "text/csv",
]
REQUIRED_ENV_VARS = [
    "URI",
    "DB_PASS",
    "DB_NAME",
    "SECRET_KEY",
    "ALGORITHM",
    "REDIS_HOST",
    "REDIS_PORT",
    "REDIS_USERNAME",
    "REDIS_PASSWORD",
]
