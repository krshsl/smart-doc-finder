import hashlib

import numpy as np
from bson import ObjectId

from src.client import get_fs
from src.models import File

from . import CHUNK_WORDS, DOC_PREFIX, SAMPLE_CHUNKS, get_model


def chunk_text(text, n=CHUNK_WORDS):
    words = text.split()
    for i in range(0, len(words), n):
        yield " ".join(words[i : i + n])


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


async def ingest_file_to_redis(r_client, file_doc: File, contents: bytes):
    full_text = extract_text_from_contents(contents, file_doc.file_type)
    if not full_text:
        return

    content_hash = hashlib.sha256(contents).hexdigest()

    file_doc.content_hash = content_hash

    redis_key = f"{DOC_PREFIX}{content_hash}"

    if await r_client.exists(redis_key):
        await file_doc.save()
        return

    chunks = list(chunk_text(full_text))
    if len(chunks) > SAMPLE_CHUNKS:
        step = max(1, len(chunks) // SAMPLE_CHUNKS)
        sampled_chunks = [chunks[i] for i in range(0, len(chunks), step)][
            :SAMPLE_CHUNKS
        ]
    else:
        sampled_chunks = chunks

    chunk_embeddings = get_model().encode(sampled_chunks)
    emb = np.mean(chunk_embeddings, axis=0).astype(np.float32)

    snippet_text = sampled_chunks[0][:200]
    await r_client.hset(
        redis_key,
        mapping={
            "snippet": snippet_text,
            "embedding": emb.tobytes(),
            "filename": file_doc.file_name,
        },
    )

    file_doc.embedding = emb.tolist()
    await file_doc.save()


async def sync_files_to_redis(r_client, file_ids: list[str]):
    from src import logger

    fs = get_fs()

    logger.info(f"Background sync initiated for {len(file_ids)} file(s).")

    for file_id in file_ids:
        try:
            file_doc = await File.get(ObjectId(file_id))
            if not (file_doc and file_doc.gridfs_id):
                continue

            grid_out = await fs.open_download_stream(ObjectId(file_doc.gridfs_id))
            contents = await grid_out.read()

            await ingest_file_to_redis(r_client, file_doc, contents)
        except Exception as e:
            logger.error(f"Failed to sync file {file_id} to Redis: {e}")
