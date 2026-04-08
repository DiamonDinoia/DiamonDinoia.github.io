#!/usr/bin/env python3
"""
Build publications.json from dois.txt + overrides.json.

Fetches metadata from CrossRef for each DOI, merges with manual entries
and per-DOI overrides, then writes data/publications.json.

Usage:
    python3 scripts/build_publications.py
"""

import json
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOIS_FILE = ROOT / "data" / "dois.txt"
OVERRIDES_FILE = ROOT / "data" / "overrides.json"
OUTPUT_FILE = ROOT / "data" / "publications.json"

CROSSREF_API = "https://api.crossref.org/works/"
USER_AGENT = "MarcoBarbone-Homepage/1.0 (mailto:mbarbone@flatironinstitute.org)"


def fetch_crossref(doi: str) -> dict:
    """Fetch metadata for a single DOI from CrossRef."""
    url = CROSSREF_API + doi
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read())
        return data["message"]
    except (urllib.error.HTTPError, urllib.error.URLError) as e:
        print(f"  WARNING: Failed to fetch {doi}: {e}", file=sys.stderr)
        return None


def shorten_name(given: str, family: str) -> str:
    """Convert 'Marco' 'Barbone' -> 'M. Barbone'."""
    initials = ". ".join(p[0] for p in given.split() if p) + "."
    return f"{initials} {family}"


def parse_authors(cr: dict) -> list[str]:
    """Extract short author names from CrossRef response."""
    authors = []
    for a in cr.get("author", []):
        given = a.get("given", "")
        family = a.get("family", "")
        if family:
            authors.append(shorten_name(given, family) if given else family)
    return authors


def parse_venue(cr: dict) -> str:
    """Extract venue/journal name from CrossRef."""
    titles = cr.get("container-title", [])
    return titles[0] if titles else cr.get("publisher", "")


def parse_year(cr: dict) -> int:
    """Extract publication year."""
    issued = cr.get("issued", {}).get("date-parts", [[None]])
    return issued[0][0] if issued and issued[0] else 0


def parse_links(cr: dict) -> list[dict]:
    """Build PDF link badges. DOI is omitted since the paper title links to it."""
    links = []
    for link in cr.get("link", []):
        if link.get("content-type") == "application/pdf":
            links.append({"label": "PDF", "url": link["URL"], "type": "pdf"})
            break
    return links


def crossref_to_paper(doi: str, cr: dict) -> dict:
    """Convert a CrossRef response to our paper format."""
    title_parts = cr.get("title", [""])
    title = title_parts[0] if title_parts else ""
    return {
        "title": title,
        "authors": parse_authors(cr),
        "venue": parse_venue(cr),
        "year": parse_year(cr),
        "url": f"https://doi.org/{doi}",
        "links": parse_links(cr),
    }


def load_dois() -> list[str]:
    """Read DOIs from dois.txt, skipping comments and blanks."""
    dois = []
    for line in DOIS_FILE.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            dois.append(line)
    return dois


def main():
    overrides = json.loads(OVERRIDES_FILE.read_text()) if OVERRIDES_FILE.exists() else {}
    scholar_url = overrides.get("scholar_url", "")
    manual_papers = overrides.get("manual", [])
    doi_overrides = overrides.get("doi_overrides", {})

    dois = load_dois()
    papers = []

    print(f"Fetching {len(dois)} DOIs from CrossRef...")
    for i, doi in enumerate(dois):
        print(f"  [{i+1}/{len(dois)}] {doi}")
        cr = fetch_crossref(doi)
        if cr is None:
            print(f"  SKIPPED (fetch failed)")
            continue

        paper = crossref_to_paper(doi, cr)

        # Apply per-DOI overrides
        if doi in doi_overrides:
            paper.update(doi_overrides[doi])

        papers.append(paper)

        # Be polite to the API
        if i < len(dois) - 1:
            time.sleep(0.3)

    # Add manual entries
    papers.extend(manual_papers)

    # Sort by year descending, then title
    papers.sort(key=lambda p: (-p.get("year", 0), p.get("title", "")))

    output = {"scholar_url": scholar_url, "papers": papers}
    OUTPUT_FILE.write_text(json.dumps(output, indent=2, ensure_ascii=False) + "\n")
    print(f"\nWrote {len(papers)} papers to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
