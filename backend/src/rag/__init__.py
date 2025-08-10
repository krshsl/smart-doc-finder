from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"
EMB_DIM = 384
CHUNK_WORDS = 200
SAMPLE_CHUNKS = 5
TOP_K = 5
DOC_PREFIX = "doc:"
INDEX_NAME = "doc_index"

model = SentenceTransformer(MODEL_NAME)
