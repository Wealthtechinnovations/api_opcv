#!/usr/bin/env python3
"""Read-only inspection of the public CMF Tunisia OPCVM NAV source.

No S2, no database, no credentials, no file download to production.
The goal is to compare the current public HTML contract with
scripts/scraper/cmf_tunisie_daily.py discovery assumptions.
"""
from __future__ import annotations

import re
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

BASE_URLS = [
    "https://www.cmf.tn/valeurs-liquidatives-des-titres-opcvm",
    "https://www.cmf.tn/?q=valeurs-liquidatives-des-titres-opcvm",
]
PAGES = 9
UA = "AfricaFunds-CMF-Source-Diagnostic/1.0"
TIMEOUT = 30


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", s or "").strip()


def classify_page(url: str, html: str) -> None:
    soup = BeautifulSoup(html, "html.parser")
    title = norm(soup.title.get_text(" ")) if soup.title else ""
    anchors = []
    direct_files = []
    detail_links = []

    for a in soup.find_all("a", href=True):
        href = a.get("href", "")
        absolute = urljoin(url, href)
        label = norm(a.get_text(" "))
        row = (label, href, absolute)
        anchors.append(row)
        if re.search(r"\.xlsx?(?:$|[?#])", absolute, re.I):
            direct_files.append(row)
        if "valeurs-liquidatives" in absolute.lower() and not re.search(r"\.xlsx?(?:$|[?#])", absolute, re.I):
            detail_links.append(row)

    file_like_strings = sorted(set(re.findall(
        r"""https?://[^"'<>\s]+\.xlsx?|/[^"'<>\s]+\.xlsx?""",
        html,
        flags=re.I,
    )))

    recent_dates = re.findall(
        r"Valeurs\s+liquidatives\s+du\s+(\d{1,2})\s+([A-Za-zÀ-ÿ]+)\s+(2026)",
        soup.get_text(" ", strip=True),
        flags=re.I,
    )

    print("=" * 100)
    print("PAGE", url)
    print("TITLE", title)
    print("ANCHORS", len(anchors))
    print("DIRECT_XLS_XLSX_ANCHORS", len(direct_files))
    print("DETAIL_STYLE_LINKS", len(detail_links))
    print("FILE_LIKE_STRINGS", len(file_like_strings))
    print("RECENT_DATES_SAMPLE", recent_dates[:20])

    for label, href, absolute in direct_files[:40]:
        print("DIRECT_FILE", repr(label), href, "=>", absolute)
    for label, href, absolute in detail_links[:40]:
        print("DETAIL_LINK", repr(label), href, "=>", absolute)
    for s in file_like_strings[:40]:
        print("FILE_STRING", s)

    for needle in ("16 Septembre 2026", "15 Septembre 2026", "01 Septembre 2026", "28 Août 2026", "28 Aout 2026"):
        idx = html.lower().find(needle.lower())
        if idx >= 0:
            snippet = norm(html[max(0, idx - 600): idx + 1200])
            print("RAW_CONTEXT", needle, snippet[:1800])


def main() -> None:
    session = requests.Session()
    session.headers.update({"User-Agent": UA})
    visited = set()
    discovered_detail_urls = []

    for base in BASE_URLS:
        successful = 0
        for page in range(PAGES):
            sep = "&" if "?" in base else "?"
            url = base if page == 0 else f"{base}{sep}page={page}"
            try:
                r = session.get(url, timeout=TIMEOUT, allow_redirects=True)
                print("HTTP", r.status_code, "REQUEST", url, "FINAL", r.url, "BYTES", len(r.content))
                r.raise_for_status()
            except Exception as exc:
                print("FETCH_ERROR", url, type(exc).__name__, str(exc))
                continue
            successful += 1
            classify_page(r.url, r.text)
            soup = BeautifulSoup(r.text, "html.parser")
            for a in soup.find_all("a", href=True):
                absolute = urljoin(r.url, a["href"])
                if (
                    "valeurs-liquidatives" in absolute.lower()
                    and not re.search(r"\.xlsx?(?:$|[?#])", absolute, re.I)
                    and absolute not in visited
                ):
                    discovered_detail_urls.append(absolute)
                    visited.add(absolute)
        if successful:
            break

    print("\nDETAIL_PAGES_TO_PROBE", len(discovered_detail_urls))
    for url in discovered_detail_urls[:80]:
        try:
            r = session.get(url, timeout=TIMEOUT, allow_redirects=True)
            soup = BeautifulSoup(r.text, "html.parser")
            files = []
            for a in soup.find_all("a", href=True):
                absolute = urljoin(r.url, a["href"])
                if re.search(r"\.xlsx?(?:$|[?#])", absolute, re.I):
                    files.append((norm(a.get_text(" ")), absolute))
            text = norm(soup.get_text(" ", strip=True))
            if "2026" in text or files:
                print("DETAIL_PAGE", r.status_code, r.url, "FILES", len(files), "TEXT", text[:300])
                for label, absolute in files[:20]:
                    print("  DETAIL_FILE", repr(label), absolute)
        except Exception as exc:
            print("DETAIL_FETCH_ERROR", url, type(exc).__name__, str(exc))


if __name__ == "__main__":
    main()
