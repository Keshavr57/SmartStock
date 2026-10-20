import pytest

from app.rag.knowledge_base import CHUNK_CHARS, KnowledgeBase, chunk_markdown

DOC = """---
id: x
---
# Sample Guide

Intro paragraph.

## Section One

""" + "\n\n".join(f"Paragraph {i} " + "word " * 60 for i in range(6)) + """

## Section Two

Short.
"""


def test_chunks_follow_headings_and_size_limit():
    chunks = chunk_markdown(DOC, "guides/sample.md")
    assert {c.section for c in chunks} == {"Sample Guide", "Section One", "Section Two"}
    assert all(c.doc == "Sample Guide" for c in chunks)
    assert len([c for c in chunks if c.section == "Section One"]) > 1
    assert all(len(c.text) <= CHUNK_CHARS + 400 for c in chunks)
    assert "id: x" not in " ".join(c.text for c in chunks)  # front matter dropped


@pytest.fixture(scope="module")
def kb():
    return KnowledgeBase.load("knowledge")


@pytest.mark.parametrize("query,expected_source,expected_section", [
    ("how much tax if I sell shares after 2 years", "guides/tax-on-equity.md", None),
    ("what is a good ROE", "guides/valuation-ratios.md", "ROE and ROCE"),
    ("T+1 settlement", None, "Settlement: T+1"),
    ("IPO retail quota", "guides/ipos.md", "Investor categories and quotas (mainboard, book-built)"),
    ("how is day P&L calculated in SmartStock", "guides/smartstock-platform.md", "How P&L is calculated"),
    ("RSI overbought", "guides/technical-analysis.md", "RSI (Relative Strength Index)"),
])
async def test_retrieval_finds_the_right_document(kb, query, expected_source, expected_section):
    hits = await kb.search(query, k=3)
    assert hits, query
    if expected_source:
        assert any(h.chunk.source == expected_source for h in hits), [h.chunk.source for h in hits]
    if expected_section:
        assert any(h.chunk.section == expected_section for h in hits), [h.chunk.section for h in hits]


async def test_irrelevant_query_returns_little(kb):
    hits = await kb.search("recipe for chocolate cake", k=4, min_score=0.5)
    assert len(hits) <= 1
