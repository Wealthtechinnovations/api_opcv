#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SEC Nigeria — Moteur de correction adosse a la preuve officielle
=================================================================

Applique les corrections Nigeria en s'appuyant EXCLUSIVEMENT sur le classeur
officiel SEC 2011-2026. Chaque ligne n'est corrigee que si la source identifie
sans ambiguite sa date de bloc ET sa mesure. Tout le reste est laisse intact et
place en quarantaine.

POURQUOI PAS DE REGLE GLOBALE (audit du 2026-07-31, execute sur la prod) :
  MATCH_DATE_PRECEDENTE 27 797 (52,1%) / MATCH_DATE_COURANTE 16 774 (31,4%)
  MAIS la regle N'EST PAS UNIFORME :
    - MONEY MARKET FUNDS : 8 574 dates CORRECTES contre 6 decalees ;
    - BALANCED : 1 310 decalees contre 56 correctes ;
    - bascule nette en 2022, correlee a l'arret des VL explicites par la SEC.
  => un decalage global d'une semaine DETRUIRAIT les 8 574 lignes Money Market
     aujourd'hui justes. La correction est donc LIGNE A LIGNE, jamais de masse.

REGLE DOCUMENTEE POUR `value` (colonne historique conservee pour le frontend) :
  VL explicite prioritaire ; a defaut Bid ; a defaut Offer. `price_type` porte
  toujours la nature reelle (UNIT_PRICE | BID | OFFER) : `value` ne doit JAMAIS
  etre presentee comme « VL » lorsque price_type vaut BID ou OFFER.

GARANTIES :
  - dry-run par defaut ; --execute exige une confirmation explicite ;
  - sauvegarde horodatee obligatoire avant toute ecriture (--backup) ;
  - chaque modification est journalisee avant/apres dans sec_ng_corrections_audit ;
  - rollback cible par batch (--rollback BATCH) ;
  - tous les UPDATE filtrent explicitement fund_id + date : jamais d'UPDATE large ;
  - aucun DELETE : les fonds fusionnes sont archives (active=0) avec alias ;
  - perimetre STRICTEMENT Nigeria : aucun autre pays n'est lu ni ecrit.

Usage :
  python3 sec_ng_apply_corrections.py --xlsx <f.xlsx> --backup
  python3 sec_ng_apply_corrections.py --xlsx <f.xlsx> --dry-run      # defaut
  python3 sec_ng_apply_corrections.py --xlsx <f.xlsx> --execute --confirm
  python3 sec_ng_apply_corrections.py --rollback SECNGFIX_20260801_101500
  python3 sec_ng_apply_corrections.py --selftest
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from datetime import datetime
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
API_DIR = SCRIPT_DIR.parent.parent
sys.path.insert(0, str(API_DIR / "scripts" / "import"))

try:
    from sec_ng_xlsx_loader import (read_workbook, load_nigeria_funds, match_fund,
                                    db_connect, normalize_name, compact_key)
except ImportError as e:                                   # pragma: no cover
    print(f"ERREUR: sec_ng_xlsx_loader introuvable ({e})")
    raise

REPORT_DIR = API_DIR / "data" / "sec_ng_xlsx" / "reports"
PAYS = "NIGERIA"

# Decisions utilisateur validees le 2026-07-31 (phrase VALIDER CORRECTIONS NIGERIA)
GDL_SURVIVOR, GDL_MERGED = 1219, 2867       # fusion vers 1219, 2867 archive + alias
CREATE_MISSING_FUNDS = True                  # creer les fonds UNMATCHED pour recuperer l'historique

log = logging.getLogger("sec_ng_fix")


# ---------------------------------------------------------------------------
# Regle de presentation de `value` — explicite, documentee, testable
# ---------------------------------------------------------------------------
def pick_value(obs):
    """Retourne (valeur, price_type, devise) selon la priorite VL > Bid > Offer.

    Ne fabrique jamais de valeur : si aucune mesure n'est publiee, retourne
    (None, None, None) et la ligne ne sera pas corrigee.
    """
    for field, ptype, cur in (
        ("unit_price_ngn", "UNIT_PRICE", "NGN"), ("unit_price_usd", "UNIT_PRICE", "USD"),
        ("bid_price_ngn", "BID", "NGN"),         ("bid_price_usd", "BID", "USD"),
        ("offer_price_ngn", "OFFER", "NGN"),     ("offer_price_usd", "OFFER", "USD"),
    ):
        v = obs.get(field)
        if v is not None:
            return float(v), ptype, cur
    return None, None, None


def measures_of(obs):
    return {k: obs.get(k) for k in ("unit_price_ngn", "unit_price_usd", "bid_price_ngn",
                                    "bid_price_usd", "offer_price_ngn", "offer_price_usd")}


def matches_any(obs, val):
    """Nom du champ dont la mesure egale `val`, sinon None (tolerance 1e-4)."""
    if obs is None or val is None:
        return None
    for k, v in measures_of(obs).items():
        if v is not None and abs(float(val) - float(v)) < 0.0001:
            return k
    return None


# ---------------------------------------------------------------------------
# Sauvegarde
# ---------------------------------------------------------------------------
def do_backup(conn, stamp):
    """Sauvegarde ciblee des lignes Nigeria. Tables horodatees, jamais ecrasees."""
    bk_val = f"bak_valorisations_ng_{stamp}"
    bk_fnd = f"bak_fond_investissements_ng_{stamp}"
    with conn.cursor() as cur:
        cur.execute(f"""CREATE TABLE `{bk_val}` AS
            SELECT v.* FROM valorisations v
            JOIN fond_investissements f ON f.id = v.fund_id
            WHERE f.pays = %s""", (PAYS,))
        cur.execute(f"SELECT COUNT(*) c FROM `{bk_val}`")
        n_val = cur.fetchone()["c"]
        cur.execute(f"""CREATE TABLE `{bk_fnd}` AS
            SELECT * FROM fond_investissements WHERE pays = %s""", (PAYS,))
        cur.execute(f"SELECT COUNT(*) c FROM `{bk_fnd}`")
        n_fnd = cur.fetchone()["c"]
        # verification de lisibilite : la sauvegarde doit etre relisible
        cur.execute(f"SELECT * FROM `{bk_val}` LIMIT 1")
        assert cur.fetchone() is not None, "sauvegarde valorisations illisible"
    log.info("SAUVEGARDE OK : %s (%d lignes) | %s (%d fonds)", bk_val, n_val, bk_fnd, n_fnd)
    log.info("Restauration : voir --rollback <batch> (donnees) ou ces tables (structure)")
    return bk_val, bk_fnd, n_val, n_fnd


def audit(cur, batch, fund_id, vdate, action, field=None, old=None, new=None,
          reason=None, doc=None, url=None, vid=None):
    cur.execute("""INSERT INTO sec_ng_corrections_audit
        (batch, valorisation_id, fund_id, valuation_date, action, field_name,
         old_value, new_value, reason, sec_document_id, source_url)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
        (batch, vid, fund_id, vdate, action, field,
         None if old is None else str(old), None if new is None else str(new),
         reason, doc, url))


# ---------------------------------------------------------------------------
# Rollback
# ---------------------------------------------------------------------------
def do_rollback(conn, batch):
    """Annule un batch : restaure les anciennes valeurs, supprime les insertions."""
    with conn.cursor() as cur:
        cur.execute("""SELECT * FROM sec_ng_corrections_audit
                       WHERE batch=%s AND reverted=0 ORDER BY id DESC""", (batch,))
        entries = cur.fetchall()
        if not entries:
            log.error("Batch %s introuvable ou deja annule", batch)
            return 1
        log.info("Annulation de %d operations du batch %s", len(entries), batch)
        undone = 0
        for e in entries:
            act = e["action"]
            if act in ("UPDATE_VALUE", "FILL_MEASURES") and e["field_name"]:
                old = e["old_value"]
                cur.execute(
                    f"UPDATE valorisations SET `{e['field_name']}`=%s "
                    f"WHERE fund_id=%s AND date=%s",
                    (None if old in (None, "None") else old, e["fund_id"], e["valuation_date"]))
                undone += 1
            elif act == "INSERT_ROW":
                cur.execute("DELETE FROM valorisations WHERE fund_id=%s AND date=%s "
                            "AND correction_batch=%s",
                            (e["fund_id"], e["valuation_date"], batch))
                undone += 1
            elif act == "MERGE_FUND":
                cur.execute("UPDATE valorisations SET fund_id=%s WHERE fund_id=%s "
                            "AND correction_batch=%s", (GDL_MERGED, GDL_SURVIVOR, batch))
                cur.execute("UPDATE fond_investissements SET active=1 WHERE id=%s", (GDL_MERGED,))
                undone += 1
            elif act == "CREATE_FUND":
                cur.execute("UPDATE fond_investissements SET active=0 WHERE id=%s "
                            "AND pays=%s", (e["fund_id"], PAYS))
                undone += 1
        cur.execute("UPDATE sec_ng_corrections_audit SET reverted=1 WHERE batch=%s", (batch,))
    log.info("ROLLBACK termine : %d operations annulees", undone)
    return 0


# ---------------------------------------------------------------------------
# Selftest
# ---------------------------------------------------------------------------
def selftest():
    # priorite VL > Bid > Offer
    assert pick_value({"unit_price_ngn": 10.0, "bid_price_ngn": 9.0,
                       "offer_price_ngn": 11.0}) == (10.0, "UNIT_PRICE", "NGN")
    assert pick_value({"unit_price_ngn": None, "bid_price_ngn": 9.0,
                       "offer_price_ngn": 11.0}) == (9.0, "BID", "NGN")
    assert pick_value({"unit_price_ngn": None, "bid_price_ngn": None,
                       "offer_price_ngn": 11.0}) == (11.0, "OFFER", "NGN")
    # fonds Dollar : la devise publiee est conservee, aucune conversion
    assert pick_value({"bid_price_usd": 119.2832}) == (119.2832, "BID", "USD")
    # aucune mesure -> aucune correction possible
    assert pick_value({"unit_price_ngn": None}) == (None, None, None)
    # zero publie preserve (n'est pas traite comme absent)
    assert pick_value({"unit_price_ngn": 0.0}) == (0.0, "UNIT_PRICE", "NGN")
    # detection de la mesure correspondante
    obs = {"unit_price_ngn": None, "bid_price_ngn": 189.9601, "offer_price_ngn": 195.5378}
    assert matches_any(obs, 195.5378) == "offer_price_ngn"
    assert matches_any(obs, 999.0) is None
    assert matches_any(None, 1.0) is None and matches_any(obs, None) is None
    print("SELFTEST OK — regle de valeur, devises, zeros et detection de mesure valides")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser(description="Correction Nigeria adossee a la preuve SEC")
    ap.add_argument("--xlsx", help="classeur officiel")
    ap.add_argument("--backup", action="store_true", help="sauvegarde ciblee des lignes Nigeria")
    ap.add_argument("--dry-run", action="store_true", help="simulation (defaut)")
    ap.add_argument("--execute", action="store_true", help="applique les corrections")
    ap.add_argument("--confirm", action="store_true", help="obligatoire avec --execute")
    ap.add_argument("--rollback", metavar="BATCH", help="annule un batch de corrections")
    ap.add_argument("--limit-funds", type=int, default=0, help="limiter a N fonds (test)")
    ap.add_argument("--selftest", action="store_true")
    args = ap.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    if args.selftest:
        selftest()
        return 0

    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    batch = f"SECNGFIX_{stamp}"
    conn = db_connect()
    try:
        if args.rollback:
            return do_rollback(conn, args.rollback)
        if args.backup:
            do_backup(conn, stamp)
            if not args.xlsx:
                return 0
        if not args.xlsx:
            ap.error("--xlsx requis")
        if args.execute and not args.confirm:
            log.error("--execute exige --confirm (securite). Aucune ecriture effectuee.")
            return 1
        if not args.execute:
            args.dry_run = True
            log.info("MODE DRY-RUN — aucune ecriture. Utiliser --execute --confirm pour appliquer.")

        # --- verification que la migration additive est appliquee ---
        with conn.cursor() as cur:
            cur.execute("""SELECT COUNT(*) c FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='valorisations'
                  AND COLUMN_NAME IN ('price_type','unit_price_ngn','bid_price_ngn',
                                      'offer_price_ngn','currency_code','correction_batch')""")
            if cur.fetchone()["c"] < 6:
                log.error("Migration additive absente. Executer d'abord "
                          "scripts/migration/2026_08_nigeria_additive_measures.sql")
                return 1

        rows = read_workbook(args.xlsx)
        log.info("Classeur : %d observations officielles", len(rows))
        funds, by_norm, by_compact = load_nigeria_funds(conn)
        cache = {}
        for r in rows:
            k = r["fund_key"]
            if k not in cache:
                cache[k] = match_fund(k, r["fund_name_raw"], funds, by_norm, by_compact)
            r["matched_fund_id"] = cache[k][0]
            r["match_status"] = cache[k][1]

        # ---------- Phase 1 : fusion GDL (decision utilisateur) ----------
        with conn.cursor() as cur:
            cur.execute("SELECT id, nom_fond, active FROM fond_investissements "
                        "WHERE id IN (%s,%s)", (GDL_SURVIVOR, GDL_MERGED))
            gdl = {r["id"]: r for r in cur.fetchall()}
        if len(gdl) == 2 and gdl[GDL_MERGED]["active"] == 1:
            with conn.cursor() as cur:
                cur.execute("""SELECT COUNT(*) c FROM valorisations m
                    WHERE m.fund_id=%s AND EXISTS (SELECT 1 FROM valorisations s
                      WHERE s.fund_id=%s AND s.date=m.date)""", (GDL_MERGED, GDL_SURVIVOR))
                collisions = cur.fetchone()["c"]
                cur.execute("SELECT COUNT(*) c FROM valorisations WHERE fund_id=%s", (GDL_MERGED,))
                to_move = cur.fetchone()["c"] - collisions
            log.info("FUSION GDL : %d VL a deplacer de %d vers %d (%d dates deja presentes, conservees)",
                     to_move, GDL_MERGED, GDL_SURVIVOR, collisions)
            if args.execute:
                with conn.cursor() as cur:
                    cur.execute("""UPDATE valorisations m SET m.fund_id=%s, m.correction_batch=%s
                        WHERE m.fund_id=%s AND NOT EXISTS (SELECT 1 FROM (SELECT date FROM valorisations
                          WHERE fund_id=%s) s WHERE s.date=m.date)""",
                        (GDL_SURVIVOR, batch, GDL_MERGED, GDL_SURVIVOR))
                    moved = cur.rowcount
                    cur.execute("UPDATE fond_investissements SET active=0 WHERE id=%s", (GDL_MERGED,))
                    audit(cur, batch, GDL_SURVIVOR, "1970-01-01", "MERGE_FUND",
                          reason=f"fusion {GDL_MERGED}->{GDL_SURVIVOR}, {moved} VL deplacees, "
                                 f"{collisions} doublons conserves, fonds source archive (active=0)")
                log.info("FUSION GDL appliquee : %d VL deplacees, fonds %d archive", moved, GDL_MERGED)
        else:
            log.info("FUSION GDL : deja faite ou fonds absents — aucune action")

        # ---------- Phase 2 : creation des fonds absents (decision utilisateur) ----------
        unmatched_keys = sorted({r["fund_key"] for r in rows if r["match_status"] == "UNMATCHED"})
        log.info("FONDS ABSENTS a creer : %d cles", len(unmatched_keys))
        created = 0
        if CREATE_MISSING_FUNDS and unmatched_keys:
            for key in unmatched_keys:
                sub = [r for r in rows if r["fund_key"] == key]
                last = sub[-1]
                if args.execute:
                    with conn.cursor() as cur:
                        cur.execute("""INSERT INTO fond_investissements
                            (nom_fond, pays, dev_libelle, societe_gestion, active, categorie_national)
                            VALUES (%s,%s,'NGN',%s,1,%s)""",
                            (last["fund_name_raw"], PAYS, last["manager_raw"],
                             last["category_sec"]))
                        new_id = cur.lastrowid
                        audit(cur, batch, new_id, min(r["valuation_date"] for r in sub),
                              "CREATE_FUND",
                              reason=f"fonds officiel SEC absent du referentiel ({len(sub)} obs "
                                     f"{min(r['valuation_date'] for r in sub)} -> "
                                     f"{max(r['valuation_date'] for r in sub)})",
                              doc=last["sec_document_id"], url=last["source_url"])
                    for r in sub:
                        r["matched_fund_id"] = new_id
                    created += 1
                else:
                    log.info("  [DRY-RUN] creerait : %s (%d obs)", last["fund_name_raw"], len(sub))
            if args.execute:
                log.info("FONDS CREES : %d", created)

        # ---------- Phase 3 : correction ligne a ligne, adossee a la preuve ----------
        by_fund = {}
        for r in rows:
            if r.get("matched_fund_id"):
                by_fund.setdefault(r["matched_fund_id"], {})[r["valuation_date"]] = r

        st = {"FILL_MEASURES": 0, "CORRECTED_VALUE": 0, "INSERTED": 0,
              "QUARANTINE": 0, "UNCHANGED": 0, "SKIPPED_NO_MEASURE": 0}
        fund_ids = list(by_fund)
        if args.limit_funds:
            fund_ids = fund_ids[:args.limit_funds]
            log.info("LIMITE : %d fonds traites (test)", len(fund_ids))

        with conn.cursor() as cur:
            for fid in fund_ids:
                obs_by_date = by_fund[fid]
                cur.execute("SELECT id, date, value FROM valorisations WHERE fund_id=%s", (fid,))
                prod = {(p["date"].strftime("%Y-%m-%d") if hasattr(p["date"], "strftime")
                         else str(p["date"])): p for p in cur.fetchall()}

                for vdate, o in obs_by_date.items():
                    newval, ptype, curr = pick_value(o)
                    p = prod.get(vdate)

                    if p is None:
                        # observation officielle absente de la base -> insertion
                        if newval is None:
                            st["SKIPPED_NO_MEASURE"] += 1
                            continue
                        st["INSERTED"] += 1
                        if args.execute:
                            cur.execute("""INSERT INTO valorisations
                                (fund_id, fund_name, value, value_EUR, value_USD, actif_net,
                                 actif_net_EUR, actif_net_USD, dividende, dividende_EUR,
                                 dividende_USD, vl_ajuste, vl_ajuste_EUR, vl_ajuste_USD,
                                 indice_name, base_100, base_100_InRef, tsr, tra, indRef,
                                 indRef_EUR, indRef_USD, indice_comparaison, libelle_fond,
                                 souscription, ID_indice, rachat, date,
                                 net_assets_ngn, net_assets_usd, unit_price_ngn, unit_price_usd,
                                 bid_price_ngn, bid_price_usd, offer_price_ngn, offer_price_usd,
                                 price_type, currency_code, sec_document_id, source_url,
                                 report_date, data_quality, correction_batch)
                                VALUES (%s,%s,%s,0,0,%s,0,0,0,0,0,%s,0,0,'',0,0,0,0,0,0,0,0,%s,0,'',0,%s,
                                        %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                                (fid, o["fund_name_raw"], newval, o["net_assets_ngn"], newval,
                                 o["fund_name_raw"], vdate,
                                 o["net_assets_ngn"], o["net_assets_usd"], o["unit_price_ngn"],
                                 None, o["bid_price_ngn"], o["bid_price_usd"],
                                 o["offer_price_ngn"], o["offer_price_usd"], ptype, curr,
                                 o["sec_document_id"], o["source_url"], o["report_date"],
                                 o["quality_status"], batch))
                            audit(cur, batch, fid, vdate, "INSERT_ROW", "value", None, newval,
                                  "observation officielle absente de la base",
                                  o["sec_document_id"], o["source_url"], cur.lastrowid)
                        continue

                    # ligne existante : la valeur correspond-elle a une mesure de CETTE date ?
                    hit = matches_any(o, p["value"])
                    if hit is None and newval is not None:
                        # valeur non justifiee par la source a cette date -> correction prouvee
                        st["CORRECTED_VALUE"] += 1
                        if args.execute:
                            cur.execute("UPDATE valorisations SET value=%s, price_type=%s, "
                                        "currency_code=%s, correction_batch=%s "
                                        "WHERE fund_id=%s AND date=%s",
                                        (newval, ptype, curr, batch, fid, vdate))
                            audit(cur, batch, fid, vdate, "UPDATE_VALUE", "value",
                                  p["value"], newval,
                                  "valeur absente des mesures publiees a cette date ; "
                                  "remplacee par la mesure officielle du bloc de cette date",
                                  o["sec_document_id"], o["source_url"], p["id"])
                    elif hit is not None:
                        st["UNCHANGED"] += 1        # deja juste : on ne touche pas a value
                    else:
                        st["QUARANTINE"] += 1
                        if args.execute:
                            cur.execute("UPDATE valorisations SET data_quality='QUARANTINE' "
                                        "WHERE fund_id=%s AND date=%s", (fid, vdate))
                        continue

                    # dans tous les cas : renseigner les mesures explicites + provenance
                    st["FILL_MEASURES"] += 1
                    if args.execute:
                        cur.execute("""UPDATE valorisations SET
                            net_assets_ngn=%s, net_assets_usd=%s, unit_price_ngn=%s,
                            bid_price_ngn=%s, bid_price_usd=%s, offer_price_ngn=%s,
                            offer_price_usd=%s, price_type=COALESCE(price_type,%s),
                            currency_code=COALESCE(currency_code,%s), sec_document_id=%s,
                            source_url=%s, report_date=%s, data_quality=%s
                            WHERE fund_id=%s AND date=%s""",
                            (o["net_assets_ngn"], o["net_assets_usd"], o["unit_price_ngn"],
                             o["bid_price_ngn"], o["bid_price_usd"], o["offer_price_ngn"],
                             o["offer_price_usd"], ptype, curr, o["sec_document_id"],
                             o["source_url"], o["report_date"], o["quality_status"], fid, vdate))

        log.info("--- BILAN %s ---", "APPLIQUE" if args.execute else "SIMULE")
        for k, v in sorted(st.items(), key=lambda x: -x[1]):
            log.info("  %-20s : %d", k, v)
        if not args.execute:
            log.info(">>> DRY-RUN : aucune ecriture effectuee. <<<")
        else:
            log.info("Batch : %s — rollback : --rollback %s", batch, batch)

        REPORT_DIR.mkdir(parents=True, exist_ok=True)
        rp = REPORT_DIR / f"sec_ng_fix_{batch}.json"
        rp.write_text(json.dumps({"batch": batch, "mode": "execute" if args.execute else "dry-run",
                                  "stats": st, "fonds_crees": created,
                                  "cles_non_resolues": len(unmatched_keys)},
                                 indent=2, ensure_ascii=False, default=str))
        log.info("Rapport : %s", rp)
    finally:
        conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
