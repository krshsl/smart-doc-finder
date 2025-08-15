import asyncio
import hashlib

import numpy as np
from bson import ObjectId

from src.middleware.limits import ENV
from src.models import File

from . import DOC_PREFIX, encode_query, sample_text_chunks
from .manager import get_ingest_semaphore


def extract_text_from_contents(contents: bytes, mime_type: str) -> str:
    if mime_type == "application/pdf":
        import fitz

        with fitz.open(stream=contents, filetype="pdf") as doc:
            return " ".join(page.get_text() for page in doc).strip()
    elif mime_type == "text/plain":
        return contents.decode("utf-8", errors="ignore").strip()
    elif mime_type == "text/csv":
        from io import StringIO

        import pandas as pd

        return pd.read_csv(StringIO(contents.decode("utf-8"))).to_string(index=False)
    return ""


async def ingest_file_to_redis(r_client, fs, file_id: str):
    from src import logger

    file_doc = await File.get(ObjectId(file_id))
    if not file_doc or not file_doc.gridfs_id:
        logger.info(f"File {file_id} not found or has no content. Skipping ingestion.")
        return

    try:
        gridfs_file = await fs.open_download_stream(ObjectId(file_doc.gridfs_id))
        contents = await gridfs_file.read()

        full_text = extract_text_from_contents(contents, file_doc.file_type)
        if not full_text:
            return

        content_hash = hashlib.sha256(contents).hexdigest()
        file_doc.content_hash = content_hash
        redis_key = f"{DOC_PREFIX}{content_hash}"

        chunks = sample_text_chunks(full_text)
        chunk_embeddings = await encode_query(chunks)
        emb = np.mean(chunk_embeddings, axis=0).astype(np.float32)

        file_doc.embedding = emb.tolist()
        await file_doc.save()

        async with get_ingest_semaphore():
            if not await r_client.exists(redis_key):
                await r_client.hset(
                    redis_key,
                    mapping={
                        "embedding_" + ENV: emb.tobytes(),
                        "filename": file_doc.file_name,
                    },
                )
    except Exception as e:
        logger.error(f"Failed to ingest file {file_id}: {e}")


async def sync_files_to_redis(r_client, fs, file_ids: list[str]):
    from src import logger

    logger.info(f"Background sync initiated for {len(file_ids)} file(s).")

    async def sync_single_file(file_id):
        try:
            file = await File.get(ObjectId(file_id))
            if not (file and file.gridfs_id):
                return

            if not file.embedding or not file.content_hash:
                logger.info(f"Re-ingesting file {file_id} due to missing data.")
                await ingest_file_to_redis(r_client, fs, str(file.id))
                return

            embd_list = np.array(file.embedding, dtype=np.float32)
            embd_bytes = embd_list.tobytes()
            redis_key = f"{DOC_PREFIX}{file.content_hash}"

            async with get_ingest_semaphore():
                if not await r_client.exists(redis_key):
                    await r_client.hset(
                        redis_key,
                        mapping={
                            "embedding_" + ENV: embd_bytes,
                            "filename": file.file_name,
                        },
                    )
        except Exception as e:
            logger.error(f"Failed to sync file {file_id} to Redis: {e}")

    tasks = [sync_single_file(file_id) for file_id in file_ids]
    await asyncio.gather(*tasks)
