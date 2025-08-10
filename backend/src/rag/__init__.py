from os import getenv

from sentence_transformers import SentenceTransformer

EMB_DIM = 384
CHUNK_WORDS = 200
SAMPLE_CHUNKS = 5
TOP_K = 5
DOC_PREFIX = "doc:"
INDEX_NAME = "doc_index"

model = SentenceTransformer(getenv("MODEL_NAME"))
