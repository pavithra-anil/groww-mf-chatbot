import os
import json
import chromadb
from datetime import datetime

def build_vector_store():
    os.makedirs("data/chroma", exist_ok=True)

    print(f"\n--- Vector Store started at {datetime.now()} ---\n")

    client = chromadb.PersistentClient(path="data/chroma")

    try:
        client.delete_collection("mf_faq")
        print("✓ Existing collection deleted for fresh rebuild\n")
    except:
        print("✓ No existing collection — creating fresh\n")

    collection = client.create_collection("mf_faq")

    # Auto-discover all JSON files in data/normalized/
    normalized_dir = "data/normalized"
    json_files = [f for f in os.listdir(normalized_dir) if f.endswith(".json")]

    if not json_files:
        print("No normalized files found in data/normalized/")
        return

    print(f"Found {len(json_files)} files to store\n")
    total_stored = 0

    for json_file in json_files:
        name = json_file.replace(".json", "")
        input_path = os.path.join(normalized_dir, json_file)

        with open(input_path, "r", encoding="utf-8") as f:
            items = json.load(f)

        if not items:
            continue

        print(f"Storing: {name} ({len(items)} chunks)")

        ids = []
        embeddings = []
        documents = []
        metadatas = []

        for i, item in enumerate(items):
            ids.append(f"{name}_{i}")
            embeddings.append(item["embedding"])
            documents.append(item["text"])
            metadatas.append(item["metadata"])

        collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )

        print(f"  ✓ {len(items)} chunks stored\n")
        total_stored += len(items)

    print(f"--- Done. {total_stored} total chunks in ChromaDB ---\n")

if __name__ == "__main__":
    build_vector_store()