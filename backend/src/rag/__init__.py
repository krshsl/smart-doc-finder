import os
from os import getenv

from sentence_transformers import SentenceTransformer

EMB_DIM = 384
CHUNK_WORDS = 200
SAMPLE_CHUNKS = 5
TOP_K = 5
DOC_PREFIX = "doc:"
INDEX_NAME = "doc_index"

_model_instance = None


def get_model():
    global _model_instance

    if _model_instance is None:
        model_name = getenv("EMBEDDING_MODEL_NAME")

        base_dir = os.path.dirname(__file__)
        backend_dir = os.path.abspath(os.path.join(base_dir, ".."))
        model_path = os.path.join(backend_dir, "models", model_name)

        if os.path.exists(model_path):
            _model_instance = SentenceTransformer(model_path)
        else:
            _model_instance = SentenceTransformer(model_name)

    return _model_instance
