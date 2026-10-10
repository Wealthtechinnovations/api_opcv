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
from collections import Counter, defaultdict
from datetime import date as dt_date
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
        source_key_rows = defaultdict(list)

        for row in rows:
            fund_id, status_name, confidence, _ = bvmac.match_fund(row, by_norm, aliases, funds)
            matches[status_name] = matches.get(status_name, 0) + 1
            detail = {
                "source_name": row.get("fund_name_raw"),
                "management_company": row.get("management_company_raw"),
                "section": row.get("section"),
                "periodicity": bvmac.SECTION_PERIODICITY.get(row.get("section")),
                "nav_date": row.get("nav_date"),
                "current_nav": row.get("current_nav"),
                "quality": row.get("quality_status"),
                "match_status": status_name,
                "matched_fund_id": fund_id,
                "confidence": confidence,
            }
            details.append(detail)
            if fund_id and row.get("nav_date"):
                source_key_rows[(fund_id, row.get("nav_date"))].append(detail)

        duplicate_keys = {k: v for k, v in source_key_rows.items() if len(v) > 1}
        duplicate_same_value = 0
        duplicate_conflicting_value = 0
        duplicate_key_details = []
        for (fund_id, nav_date), dup_rows in duplicate_keys.items():
            values = [float(x["current_nav"]) for x in dup_rows if x.get("current_nav") is not None]
            same_value = bool(values) and max(values) - min(values) <= 0.01
            if same_value:
                duplicate_same_value += 1
            else:
                duplicate_conflicting_value += 1
            duplicate_key_details.append({
                "fund_id": fund_id,
                "nav_date": nav_date,
                "rows": len(dup_rows),
                "same_value": same_value,
                "values": values,
                "sections": [x.get("section") for x in dup_rows],
                "source_names": [x.get("source_name") for x in dup_rows],
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

            fx_cache = {}
            def strict_usd_xaf(nav_date):
                """Latest source observation <= nav_date only. Never future."""
                if nav_date in fx_cache:
                    return fx_cache[nav_date]
                cur.execute(
                    "SELECT date, value FROM devisedechanges "
                    "WHERE paire='USD/XAF' AND date<=%s AND value IS NOT NULL AND value>0 "
                    "ORDER BY date DESC LIMIT 1",
                    (nav_date,),
                )
                direct = cur.fetchone()
                if direct:
                    result = {
                        "available": True,
                        "method": "USD/XAF_PRIOR",
                        "source_date": str(direct["date"]),
                        "value": float(direct["value"]),
                    }
                    fx_cache[nav_date] = result
                    return result
                cur.execute(
                    "SELECT date, value FROM devisedechanges "
                    "WHERE paire='USD/EUR' AND date<=%s AND value IS NOT NULL AND value>0 "
                    "ORDER BY date DESC LIMIT 1",
                    (nav_date,),
                )
                eur = cur.fetchone()
                if eur:
                    result = {
                        "available": True,
                        "method": "USD/EUR_PRIOR_DERIVED_XAF",
                        "source_date": str(eur["date"]),
                        "value": bvmac.EUR_XAF / float(eur["value"]),
                    }
                    fx_cache[nav_date] = result
                    return result
                result = {"available": False, "method": "NONE", "source_date": None, "value": None}
                fx_cache[nav_date] = result
                return result

            dryrun = []
            disposition_counts = Counter()
            fx_method_counts = Counter()
            for detail in details:
                fund_id = detail["matched_fund_id"]
                nav_date = detail["nav_date"]
                quality_status = detail["quality"]
                disposition = None
                existing_value = None
                fx = None

                if not fund_id:
                    disposition = "BLOCK_UNMATCHED"
                elif quality_status != "OK":
                    disposition = "REJECT_QUALITY"
                elif not nav_date or detail.get("current_nav") is None:
                    disposition = "REJECT_INCOMPLETE"
                elif (fund_id, nav_date) in duplicate_keys:
                    dup = duplicate_keys[(fund_id, nav_date)]
                    vals = [float(x["current_nav"]) for x in dup if x.get("current_nav") is not None]
                    disposition = (
                        "BLOCK_SOURCE_DUPLICATE_SAME_VALUE"
                        if vals and max(vals) - min(vals) <= 0.01
                        else "BLOCK_SOURCE_DUPLICATE_CONFLICT"
                    )
                else:
                    cur.execute(
                        "SELECT id, value FROM valorisations WHERE fund_id=%s AND date=%s LIMIT 1",
                        (fund_id, nav_date),
                    )
                    existing = cur.fetchone()
                    if existing:
                        existing_value = float(existing["value"])
                        if abs(existing_value - float(detail["current_nav"])) <= 0.01:
                            disposition = "SKIP_EXISTING_SAME"
                        else:
                            disposition = "BLOCK_EXISTING_CONFLICT"
                    else:
                        fx = strict_usd_xaf(nav_date)
                        fx_method_counts[fx["method"]] += 1
                        disposition = "WOULD_INSERT" if fx["available"] else "BLOCK_FX_ASOF_UNAVAILABLE"

                disposition_counts[disposition] += 1
                dryrun.append({
                    **detail,
                    "disposition": disposition,
                    "existing_value": existing_value,
                    "fx_method": fx["method"] if fx else None,
                    "fx_source_date": fx["source_date"] if fx else None,
                })

            fx_gaps = []
            for nav_date, fx in sorted(fx_cache.items()):
                gap_days = None
                if fx["available"] and fx["source_date"]:
                    try:
                        gap_days = (dt_date.fromisoformat(str(nav_date)) - dt_date.fromisoformat(str(fx["source_date"])[:10])).days
                    except Exception:
                        pass
                fx_gaps.append({
                    "nav_date": nav_date,
                    "available": fx["available"],
                    "method": fx["method"],
                    "source_date": fx["source_date"],
                    "gap_days": gap_days,
                })
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
    print("")
    print("DRYRUN_DISPOSITION_COUNTS=" + json.dumps(dict(disposition_counts), ensure_ascii=False, sort_keys=True))
    print(f"SOURCE_DUPLICATE_KEYS={len(duplicate_keys)}")
    print(f"SOURCE_DUPLICATE_SAME_VALUE_KEYS={duplicate_same_value}")
    print(f"SOURCE_DUPLICATE_CONFLICT_KEYS={duplicate_conflicting_value}")
    print("SOURCE_DUPLICATE_DETAILS=" + json.dumps(duplicate_key_details[:30], ensure_ascii=False, default=str))
    print("FX_ASOF_METHOD_COUNTS=" + json.dumps(dict(fx_method_counts), ensure_ascii=False, sort_keys=True))
    print("FX_ASOF_BY_DATE=" + json.dumps(fx_gaps, ensure_ascii=False, default=str))
    print("DRYRUN_ACTIONABLE_SAMPLE=" + json.dumps(
        [x for x in dryrun if x["disposition"] in (
            "WOULD_INSERT", "SKIP_EXISTING_SAME", "BLOCK_EXISTING_CONFLICT",
            "BLOCK_FX_ASOF_UNAVAILABLE", "BLOCK_SOURCE_DUPLICATE_SAME_VALUE",
            "BLOCK_SOURCE_DUPLICATE_CONFLICT"
        )][:40],
        ensure_ascii=False,
        default=str,
    ))
    print("DRYRUN_BLOCKED_SAMPLE=" + json.dumps(
        [x for x in dryrun if x["disposition"].startswith("BLOCK_") or x["disposition"].startswith("REJECT_")][:40],
        ensure_ascii=False,
        default=str,
    ))
    print("")
    print("RULE_FX=Exact/prior only: USD/XAF <= nav_date, else USD/EUR <= nav_date derived through fixed EUR/XAF parity. Never future.")
    print("RULE=No alias, fund, staging table, cron or VL is written by this probe.")
    print("VERDICT=W2_CEMAC_DRYRUN_SCOPE_MEASURED_READ_ONLY")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
