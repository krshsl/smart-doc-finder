import os

from sentence_transformers import SentenceTransformer

model_name = os.environ["EMBEDDING_MODEL_NAME"]
model_dir = os.path.join(os.path.dirname(__file__), "..", "models", model_name)
model_dir = os.path.abspath(model_dir)

print(f"Downloading {model_name} to {model_dir} ...")
model = SentenceTransformer(model_name)
model.save_pretrained(model_dir)
print("Model saved.")
