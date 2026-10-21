"""Retrieval-augmented knowledge base over Markdown documents.

Documents are split by headings into ~900-character chunks, embedded once (cached on disk by content
hash) and searched with a hybrid score: 0.7 × semantic cosine similarity + 0.3 × saturated BM25,
where BM25 is mapped through s / (s + 4) so a weak keyword match stays weak (dividing by the best score
would rate the top match 1.0 even for an unrelated query).
Hybrid retrieval keeps exact terms (e.g. "112A", "T+1", tickers) findable even when embeddings blur them.
"""
import hashlib
import re
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from rank_bm25 import BM25Okapi

from ..config import get_settings
from .embeddings import embed_passages_sync, embed_query

CHUNK_CHARS = 900
SEMANTIC_WEIGHT = 0.7
BM25_SATURATION = 4.0


@dataclass
class Chunk:
    id: str
    doc: str        # document title
    section: str    # nearest heading
    source: str     # relative path, e.g. guides/tax.md
    text: str


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z0-9₹+%.]+", text.lower())


def _title_of(markdown: str, fallback: str) -> str:
    match = re.search(r"^#\s+(.+)$", markdown, re.M)
    return match.group(1).strip() if match else fallback


def chunk_markdown(markdown: str, source: str) -> list[Chunk]:
    """Split on ##/### headings, then pack paragraphs into chunks of at most CHUNK_CHARS."""
    body = re.sub(r"^---\n.*?\n---\n", "", markdown, flags=re.S)  # drop front matter
    title = _title_of(body, Path(source).stem.replace("-", " ").title())
    sections: list[tuple[str, str]] = []
    current_heading, buffer = title, []
    for line in body.splitlines():
        heading = re.match(r"^#{1,3}\s+(.+)$", line)
        if heading:
            if buffer:
                sections.append((current_heading, "\n".join(buffer).strip()))
            current_heading, buffer = heading.group(1).strip(), []
        else:
            buffer.append(line)
    if buffer:
        sections.append((current_heading, "\n".join(buffer).strip()))

    chunks: list[Chunk] = []
    for heading, text in sections:
        if not text:
            continue
        for i, piece in enumerate(_pack_paragraphs(text)):
            cid = hashlib.sha1(f"{source}|{heading}|{i}|{piece[:40]}".encode()).hexdigest()[:12]
            chunks.append(Chunk(id=cid, doc=title, section=heading, source=source, text=piece))
    return chunks


def _pack_paragraphs(text: str) -> list[str]:
    """Greedily pack paragraphs into pieces of at most CHUNK_CHARS (a long paragraph stays whole)."""
    pieces: list[str] = []
    packed = ""
    for para in (p.strip() for p in re.split(r"\n\s*\n", text)):
        if not para:
            continue
        if packed and len(packed) + len(para) > CHUNK_CHARS:
            pieces.append(packed)
            packed = ""
        packed = f"{packed}\n\n{para}" if packed else para
    if packed:
        pieces.append(packed)
    return pieces


@dataclass
class SearchHit:
    chunk: Chunk
    score: float


class KnowledgeBase:
    def __init__(self, chunks: list[Chunk], vectors: np.ndarray):
        self.chunks = chunks
        self.vectors = vectors
        # Section headings and document titles are part of the searchable text.
        self.bm25 = BM25Okapi([_tokenize(f"{c.doc} {c.section} {c.text}") for c in chunks]) if chunks else None

    @classmethod
    def load(cls, directory: str | None = None) -> "KnowledgeBase":
        settings = get_settings()
        root = Path(directory or settings.knowledge_dir)
        chunks: list[Chunk] = []
        for path in sorted(root.rglob("*.md")):
            chunks.extend(chunk_markdown(path.read_text(encoding="utf-8"), str(path.relative_to(root))))
        texts = [f"{c.doc} — {c.section}\n{c.text}" for c in chunks]
        digest = hashlib.sha1("\n\x00".join(texts).encode()).hexdigest()[:16]
        # The index lives next to the documents and is committed, so deploys skip re-embedding the corpus.
        # Run scripts/build_index.py (or just start the service) after editing the knowledge base.
        index_dir = root / ".index"
        index = index_dir / f"kb-{digest}.npy"
        if index.exists():
            vectors = np.load(index)
        else:
            vectors = embed_passages_sync(texts)
            index_dir.mkdir(parents=True, exist_ok=True)
            for stale in index_dir.glob("kb-*.npy"):
                stale.unlink()
            np.save(index, vectors)
        return cls(chunks, vectors)

    async def search(self, query: str, k: int = 4, min_score: float = 0.35) -> list[SearchHit]:
        if not self.chunks:
            return []
        q = await embed_query(query)
        semantic = self.vectors @ q  # cosine (vectors are normalised)
        raw = np.array(self.bm25.get_scores(_tokenize(query)), dtype=np.float32)
        lexical = raw / (raw + BM25_SATURATION)
        score = SEMANTIC_WEIGHT * semantic + (1 - SEMANTIC_WEIGHT) * lexical
        order = np.argsort(-score)
        hits: list[SearchHit] = []
        seen_sections: set[tuple[str, str]] = set()
        for i in order:
            if score[i] < min_score or len(hits) >= k:
                break
            key = (self.chunks[i].source, self.chunks[i].section)
            if key in seen_sections:  # one chunk per section keeps the context diverse
                continue
            seen_sections.add(key)
            hits.append(SearchHit(self.chunks[i], float(score[i])))
        return hits


_kb: KnowledgeBase | None = None


def get_knowledge_base() -> KnowledgeBase:
    global _kb
    if _kb is None:
        _kb = KnowledgeBase.load()
    return _kb
