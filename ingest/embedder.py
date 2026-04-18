import os
import json
import numpy as np
from sentence_transformers import SentenceTransformer
from datetime import datetime

MODEL_NAME = "BAAI/bge-small-en-v1.5"

def embed_all():
    os.makedirs("data/normalized", exist_ok=True)
    
    print(f"\n--- Embedder started at {datetime.now()} ---\n")
    print(f"Loading model: {MODEL_NAME}\n")
    
    model = SentenceTransformer(MODEL_NAME)
    print("✓ Model loaded!\n")
    
    # Auto-discover all JSON files in data/chunked/
    chunked_dir = "data/chunked"
    json_files = [f for f in os.listdir(chunked_dir) if f.endswith(".json")]
    
    if not json_files:
        print("No chunk files found in data/chunked/")
        return
    
    print(f"Found {len(json_files)} chunk files to embed\n")
    total_embedded = 0
    
    for json_file in json_files:
        name = json_file.replace(".json", "")
        input_path = os.path.join(chunked_dir, json_file)
        output_path = f"data/normalized/{name}.json"
        
        with open(input_path, "r", encoding="utf-8") as f:
            chunks = json.load(f)
        
        if not chunks:
            continue
            
        print(f"Embedding: {name} ({len(chunks)} chunks)")
        texts = [chunk["text"] for chunk in chunks]
        embeddings = model.encode(texts, show_progress_bar=True)
        
        normalized = []
        for chunk, embedding in zip(chunks, embeddings):
            normalized.append({
                "text": chunk["text"],
                "metadata": chunk["metadata"],
                "embedding": embedding.tolist()
            })
        
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(normalized, f, ensure_ascii=False)
        
        print(f"  ✓ {len(normalized)} embeddings saved → {output_path}\n")
        total_embedded += len(normalized)
    
    print(f"--- Done. {total_embedded} total embeddings created ---\n")

if __name__ == "__main__":
    embed_all()