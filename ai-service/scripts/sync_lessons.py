"""Export SmartStock's lessons from the backend into knowledge/lessons/*.md for retrieval.

Run whenever lessons change:  python scripts/sync_lessons.py [--backend http://localhost:5050/api]
"""
import argparse
import re
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[1]

# Lessons generated from the backend's generic template repeat the same paragraphs for every topic.
# Indexing them would flood retrieval with near-duplicate filler, so they are skipped; the curated
# guides in knowledge/guides cover those topics properly.
TEMPLATE_MARKER = "This is a crucial aspect of"


def slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--backend", default="http://localhost:5050/api")
    args = parser.parse_args()

    out = ROOT / "knowledge" / "lessons"
    out.mkdir(parents=True, exist_ok=True)
    with httpx.Client(base_url=args.backend, timeout=30) as client:
        listing = client.get("/learning/list").json()
        lessons = listing.get("data", listing)
        if isinstance(lessons, dict):
            lessons = lessons.get("lessons") or [l for group in lessons.values() if isinstance(group, list) for l in group]
        written = skipped = 0
        for lesson in lessons:
            detail = client.get(f"/learning/lesson/{lesson['id']}").json()
            data = detail.get("data", detail)
            if TEMPLATE_MARKER in data["content"]:
                skipped += 1
                continue
            key_points = "\n".join(f"- {p}" for p in data.get("keyPoints") or [])
            content = re.sub(r"^#\s+.+\n", "", data["content"].strip(), count=1)  # we write our own H1
            markdown = (
                f"---\nid: {data['id']}\ncategory: {data.get('category', '')}\ndifficulty: {data.get('difficulty', '')}\n---\n"
                f"# {data['title']}\n\n{data.get('description', '')}\n\n{content}\n\n## Key points\n\n{key_points}\n"
            )
            (out / f"{slug(data['id'])}.md").write_text(markdown, encoding="utf-8")
            written += 1
    print(f"Wrote {written} lessons to {out.relative_to(ROOT)} (skipped {skipped} template lessons)")


if __name__ == "__main__":
    main()
