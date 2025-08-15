import asyncio
import gc
from os import getenv, path

import numpy as np
import psutil
from sentence_transformers import SentenceTransformer

EMB_DIM = 384
CHUNK_WORDS = 200
SAMPLE_CHUNKS = 5
TOP_K = 5
DOC_PREFIX = "doc:"
INDEX_NAME = "doc_index_" + getenv("ENV", "prod")


def init_torch():
    import torch

    torch.set_grad_enabled(False)
    torch.set_num_threads(1)
    torch.set_num_interop_threads(1)


class LifecycleEncoder:
    def __init__(self, model_name=None):
        self.model_name = model_name
        self.model = None
        self.active_queries = 0
        self.lock = asyncio.Lock()
        self.encoding_semaphore = asyncio.Semaphore(2)
        self.memory_threshold_mb = 400
        self.last_used = None
        self.unload_delay = 30

    def _check_memory_usage(self):
        memory_mb = psutil.Process().memory_info().rss / 1024 / 1024
        return memory_mb

    def load_model(self, local_files_only=True):
        if self.model is None:
            memory_mb = self._check_memory_usage()
            if memory_mb > 490:
                gc.collect()

            base_dir = path.dirname(__file__)
            backend_dir = path.abspath(path.join(base_dir, "..", "..", "models"))
            model_path = path.join(backend_dir, self.model_name)

            if path.exists(model_path):
                self.model = SentenceTransformer(model_path)
            else:
                self.model = SentenceTransformer(
                    self.model_name, local_files_only=local_files_only
                )

            self.model.eval()

    def unload_model(self):
        if self.model is not None:
            del self.model
            self.model = None
        gc.collect()

    async def _schedule_unload(self):
        await asyncio.sleep(self.unload_delay)
        async with self.lock:
            if self.active_queries == 0:
                self.unload_model()

    async def encode(self, texts):
        async with self.encoding_semaphore:
            memory_mb = self._check_memory_usage()
            if memory_mb > self.memory_threshold_mb:
                async with self.lock:
                    self.unload_model()
                gc.collect()
                await asyncio.sleep(0.1)

            async with self.lock:
                self.active_queries += 1
                if self.model is None:
                    self.load_model()
                self.last_used = asyncio.get_event_loop().time()

            try:
                if isinstance(texts, str):
                    texts = [texts]

                all_embeddings = []
                for text in texts:
                    emb = self.model.encode(
                        [text],
                        batch_size=1,
                        convert_to_tensor=False,
                        normalize_embeddings=True,
                        show_progress_bar=False,
                    )
                    all_embeddings.append(emb[0])
                    del emb

                return np.array(all_embeddings, dtype=np.float32)

            finally:
                async with self.lock:
                    self.active_queries -= 1
                    if self.active_queries == 0:
                        asyncio.create_task(self._schedule_unload())


encoder = LifecycleEncoder(getenv("EMBEDDING_MODEL_NAME"))


async def encode_query(texts):
    return await encoder.encode(texts)


def sample_text_chunks(full_text, n=CHUNK_WORDS, sample_chunks=SAMPLE_CHUNKS):
    words = full_text.split()
    chunks = [" ".join(words[i : i + n]) for i in range(0, len(words), n)]
    if len(chunks) > sample_chunks:
        step = max(1, len(chunks) // sample_chunks)
        sampled_chunks = [chunks[i] for i in range(0, len(chunks), step)][
            :sample_chunks
        ]
    else:
        sampled_chunks = chunks
    return sampled_chunks
