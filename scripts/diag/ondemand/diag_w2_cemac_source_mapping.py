#!/usr/bin/env python3
"""
W2 CEMAC/BVMAC source + identity mapping preflight — READ ONLY.

- fetches BVMAC index/PDF into memory only
- reuses parser/matcher functions from bvmac_boc_daily.py
- reads canonical CEMAC funds using SELECT only
- does NOT create bvmac_* tables
- does NOT write files
- does NOT promote/update/insert any VL
"""

from __future__ import annotations

import hashlib
import importlib.util
import io
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
MODULE_PATH = ROOT / "scripts" / "scraper" / "bvmac_boc_daily.py"

spec = importlib.util.spec_from_file_location("bvmac_boc_daily_readonly", MODULE_PATH)
if spec is None or spec.loader is None:
    raise RuntimeError("Unable to load bvmac_boc_daily.py")
bvmac = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bvmac)

def parse_pdf_bytes(content: bytes, boc_date_iso: str):
    if bvmac.pdfplumber is None:
        raise RuntimeError("pdfplumber unavailable")
    rows, failures, opcvm_pages = [], [], []
    with bvmac.pdfplumber.open(io.BytesIO(content)) as pdf:
        pages_count = len(pdf.pages)
        for i, page in enumerate(pdf.pages):
            head = (page.extract_text() or "")[:300].upper()
            if "OPCVM" in head and ("LIQUIDATIVE" in head or "LIQUIDATIV" in head):
                page_rows, page_failures = bvmac.parse_opcvm_page(page, i + 1)
                rows.extend(page_rows)
                failures.extend(page_failures)
                opcvm_pages.append(i + 1)
    for row in rows:
        fixed, salvaged = bvmac.salvage_implausible_year(row.get("nav_date"), boc_date_iso)
        if salvaged:
            row["nav_date"] = fixed
        row["quality_status"] = bvmac.quality_check(row, boc_date_iso)
    return rows, failures, pages_count, opcvm_pages

def main():
    print("=== W2 CEMAC/BVMAC — SOURCE + FUND MATCH PREFLIGHT ===")
    print("MODE=READ_ONLY_NO_DDL_NO_FILE_WRITE_NO_CANONICAL_WRITE")

    refs = bvmac.discover_index()
    if not refs:
        print("INDEX_REFS=0")
        print("VERDICT=W2_CEMAC_SOURCE_UNAVAILABLE")
        return 2

    latest = refs[-1]
    boc_date = f"{latest[:4]}-{latest[4:6]}-{latest[6:]}"
    pdf_url = bvmac.pdf_url_for(latest)
    response, status = bvmac.http_get(pdf_url, stream=False)
    print(f"INDEX_REFS={len(refs)}")
    print(f"LATEST_BOC={boc_date}")
    print(f"PDF_HTTP_STATUS={status}")
    print(f"PDF_URL={pdf_url}")
    if not response or status != 200:
        print("VERDICT=W2_CEMAC_PDF_UNAVAILABLE")
        return 2

    content = response.content
    print(f"PDF_BYTES={len(content)}")
    print(f"PDF_SHA256={hashlib.sha256(content).hexdigest()}")
    if not content.startswith(b"%PDF"):
        print("VERDICT=W2_CEMAC_NON_PDF")
        return 2

    rows, failures, pages_count, opcvm_pages = parse_pdf_bytes(content, boc_date)
    quality = {}
    for row in rows:
        quality[row["quality_status"]] = quality.get(row["quality_status"], 0) + 1

    conn = bvmac.db_connect()
    try:
        funds, by_norm = bvmac.load_cemac_funds(conn)
        aliases = {}  # bvmac_fund_aliases is intentionally absent/not required in preflight
        matches = {}
        details = []
        for row in rows:
            fund_id, status_name, confidence, _ = bvmac.match_fund(row, by_norm, aliases, funds)
            matches[status_name] = matches.get(status_name, 0) + 1
            details.append({
                "source_name": row.get("fund_name_raw"),
                "management_company": row.get("management_company_raw"),
                "section": row.get("section"),
                "periodicity": bvmac.SECTION_PERIODICITY.get(row.get("section")),
                "nav_date": row.get("nav_date"),
                "quality": row.get("quality_status"),
                "match_status": status_name,
                "matched_fund_id": fund_id,
                "confidence": confidence,
            })

        with conn.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) n, SUM(active=1) active, MAX(datejour) max_datejour "
                "FROM fond_investissements WHERE pays=%s",
                (bvmac.PAYS,),
            )
            fund_stats = cur.fetchone()
            cur.execute(
                "SELECT COUNT(*) n, MAX(v.date) latest "
                "FROM valorisations v JOIN fond_investissements f ON f.id=v.fund_id "
                "WHERE f.pays=%s",
                (bvmac.PAYS,),
            )
            vl_stats = cur.fetchone()
    finally:
        conn.close()

    print(f"PDF_PAGES={pages_count}")
    print("OPCVM_PAGES=" + ",".join(str(x) for x in opcvm_pages))
    print(f"PARSED_ROWS={len(rows)}")
    print(f"PARSE_FAILURES={len(failures)}")
    print("QUALITY_COUNTS=" + json.dumps(quality, ensure_ascii=False, sort_keys=True))
    print(f"LIVE_CEMAC_FUNDS={fund_stats.get('n', 0)}")
    print(f"LIVE_CEMAC_ACTIVE_FUNDS={fund_stats.get('active', 0)}")
    print(f"LIVE_CEMAC_MAX_DATEJOUR={fund_stats.get('max_datejour')}")
    print(f"LIVE_CEMAC_VL_ROWS={vl_stats.get('n', 0)}")
    print(f"LIVE_CEMAC_LATEST_VL={vl_stats.get('latest')}")
    print("MATCH_COUNTS=" + json.dumps(matches, ensure_ascii=False, sort_keys=True))
    print("FUZZY_ENGINE_AVAILABLE=" + ("YES" if bvmac.fuzz is not None else "NO"))

    unmatched = [x for x in details if x["match_status"] in ("UNMATCHED", "AMBIGUOUS")]
    matched = [x for x in details if x["match_status"].startswith("MATCHED")]
    print(f"MATCHED_ROWS={len(matched)}")
    print(f"UNMATCHED_OR_AMBIGUOUS_ROWS={len(unmatched)}")
    print("UNMATCHED_OR_AMBIGUOUS_SAMPLE=" + json.dumps(unmatched[:30], ensure_ascii=False, default=str))
    print("MATCHED_SAMPLE=" + json.dumps(matched[:20], ensure_ascii=False, default=str))

    print("RULE=No alias, fund, staging table, cron or VL is written by this probe.")
    print("VERDICT=W2_CEMAC_SOURCE_AND_IDENTITY_PREFLIGHT_MEASURED_READ_ONLY")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
