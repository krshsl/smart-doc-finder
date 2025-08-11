from os import getenv

from sentence_transformers import SentenceTransformer

EMB_DIM = 384
CHUNK_WORDS = 200
SAMPLE_CHUNKS = 5
TOP_K = 3
DOC_PREFIX = "doc:"
INDEX_NAME = "doc_index"

_model_instance = None


def get_model():
    global _model_instance

    if _model_instance is None:
        model_name = getenv("EMBEDDING_MODEL_NAME")
        _model_instance = SentenceTransformer(model_name)

    return _model_instance
