"""Rebuild the committed knowledge-base embedding index: python -m scripts.build_index"""
from app.rag.knowledge_base import KnowledgeBase

if __name__ == "__main__":
    kb = KnowledgeBase.load()
    print(f"Indexed {len(kb.chunks)} chunks")
