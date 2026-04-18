import chromadb
from chromadb.api.models.Collection import Collection
from chromadb.utils.embedding_functions import ONNXMiniLM_L6_V2

# ONNX MiniLM matches all-MiniLM-L6-v2 (384-d) without loading PyTorch — critical for low-RAM hosts (e.g. Render free).
CHROMA_PATH = "data/chroma"
COLLECTION_NAME = "mf_faq"

# Lazy-initialized globals to keep API startup lightweight.
_collection: Collection | None = None
_query_embedder: ONNXMiniLM_L6_V2 | None = None


def _get_collection() -> Collection:
    global _collection, _query_embedder

    if _collection is None:
        print("Loading retriever...")
        _query_embedder = ONNXMiniLM_L6_V2()
        client = chromadb.PersistentClient(path=CHROMA_PATH)
        # Collection was built with pre-computed embeddings (ingest); do not attach a new embedding_function here.
        _collection = client.get_collection(COLLECTION_NAME)
        print("Retriever ready!\n")

    return _collection

def retrieve(query: str, k: int = 3):
    """
    Search ChromaDB for the most relevant chunks to the query.
    Returns top k results with text and source URL.
    """
    collection = _get_collection()
    assert _query_embedder is not None
    query_embedding = _query_embedder([query])[0].tolist()

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=k,
        include=["documents", "metadatas", "distances"],
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