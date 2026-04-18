import chromadb
from sentence_transformers import SentenceTransformer

MODEL_NAME = "BAAI/bge-small-en-v1.5"

# Load model and ChromaDB once when module is imported
print("Loading retriever...")
model = SentenceTransformer(MODEL_NAME)
client = chromadb.PersistentClient(path="data/chroma")
collection = client.get_collection("mf_faq")
print("✓ Retriever ready!\n")

def retrieve(query: str, k: int = 3):
    """
    Search ChromaDB for the most relevant chunks to the query.
    Returns top k results with text and source URL.
    """
    # Convert query to vector
    query_embedding = model.encode(query).tolist()

    # Search ChromaDB
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=k,
        include=["documents", "metadatas", "distances"]
    )

    # Format results
    retrieved = []
    for doc, meta, dist in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0]
    ):
        retrieved.append({
            "text": doc,
            "source_url": meta.get("source_url", ""),
            "score": round(1 - dist, 4)  # Convert distance to similarity score
        })

    return retrieved


# Quick test when run directly
if __name__ == "__main__":
    test_query = "What is the expense ratio of HDFC Mid Cap Fund?"
    print(f"Test query: {test_query}\n")
    
    results = retrieve(test_query)
    
    for i, r in enumerate(results, 1):
        print(f"Result {i}:")
        print(f"  Score: {r['score']}")
        print(f"  Source: {r['source_url']}")
        print(f"  Text: {r['text'][:200]}...")
        print()