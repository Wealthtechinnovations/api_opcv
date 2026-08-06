#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
fix_nigeria_ambiguous_apply.py — Applique les DECISIONS D'ARBITRAGE des cles
ambigues du classeur SEC Nigeria (mode --ambiguities du loader).

CONTEXTE
--------
Le classeur `Nigeria_SEC_OPCVM_NAV_2011_2026.xlsx` est la base de verite. 330
cles sur 352 sont rattachees automatiquement ; 22 restent AMBIGUOUS (classes de
parts, renommages, homonymes) et ne sont JAMAIS rattachees automatiquement. Ce
script applique UNIQUEMENT les decisions validees explicitement par l'humain :

  ATTACH  : rattacher les observations d'une cle a un fonds EXISTANT precis
            (le classeur va plus loin que la base -> insertion des dates
            manquantes seulement).
  CREATE  : creer un fonds ABSENT du referentiel (metadonnees clonees d'un
            fonds de reference : gerant depuis un fonds du meme gestionnaire,
            categorie depuis un fonds monetaire de reference), puis inserer son
            historique.

Decisions validees par l'utilisateur (2026-08-06) :
  - ATTACH « Zenith Balanced Strategy Fund »   -> fonds 2825 (Balanced Strategy Fund (Zenith Equity))
  - ATTACH « Vantage Dollar Fund (VDF) »        -> fonds 1224 (Vantage Dollar Fund)
  - CREATE « FCMBAM Money Market Fund »         (gerant clone de 2900, categorie clonee de 1156)
  - CREATE « First Asset Money Market Fund »    (gerant clone de 2903, categorie clonee de 1156)

GARANTIES
---------
  * Insertion des SEULES dates absentes du fonds cible (jamais d'ecrasement).
  * Meme format d'insertion que sec_ng_apply_corrections.py (mesures qualifiees
    price_type/currency + provenance), via pick_value (VL > Bid > Offer).
  * Chaque insertion et chaque creation journalisee dans sec_ng_corrections_audit.
  * Dry-run par defaut ; --execute exige --confirm.
  * Reversible : --rollback <batch> supprime EXACTEMENT ce que le batch a cree.
  * Le code_ISIN n'est jamais clone (evite toute collision d'unicite).

USAGE
  python3 scripts/fix/fix_nigeria_ambiguous_apply.py --xlsx <classeur.xlsx>
  python3 scripts/fix/fix_nigeria_ambiguous_apply.py --xlsx <classeur.xlsx> --execute --confirm
  python3 scripts/fix/fix_nigeria_ambiguous_apply.py --rollback NGAMB_20260806_170000

APRES EXECUTION : recalcul cible de chaque fonds touche (le script imprime la
liste des id + les commandes).
"""
import os
import sys
import argparse
import logging
from datetime import datetime

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "scripts", "import"))
sys.path.insert(0, os.path.join(ROOT, "scripts", "fix"))

import sec_ng_xlsx_loader as L          # read_workbook, normalize_name, db_connect, PAYS
import sec_ng_apply_corrections as A    # pick_value, audit

log = logging.getLogger("ng_ambig")

# --- Decisions validees (cle RAW du classeur -> action). Normalisees au runtime. ---
ATTACH = {
    "Zenith Balanced Strategy Fund": 2825,
    "Vantage Dollar Fund (VDF)": 1224,
}
CREATE = {
    "FCMBAM Money Market Fund":     {"manager_ref": 2900, "category_ref": 1156},
    "First Asset Money Market Fund": {"manager_ref": 2903, "category_ref": 1156},
}
# Colonnes de categorie a prendre sur le fonds monetaire de reference (le reste
# des metadonnees vient du fonds du meme gestionnaire).
CATEGORY_COLS = [
    "categorie_national", "categorie_regional", "categorie_globale",
    "categorie_fundafrica_regionale", "categorie_fundafrica_globale",
    "categorie_libelle",
]
# Colonnes identitaires jamais clonees (unicite / propre au fonds).
NEVER_CLONE = {"id", "code_ISIN"}

# INSERT identique a sec_ng_apply_corrections.py (mesures qualifiees + provenance).
INSERT_SQL = """INSERT INTO valorisations
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
            %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"""


def insert_obs(cur, fid, vdate, o, batch):
    """Insere une observation officielle. Retourne (ok, valorisation_id)."""
    newval, ptype, curr = A.pick_value(o)
    if newval is None:
        return False, None
    cur.execute(INSERT_SQL, (
        fid, o["fund_name_raw"], newval, o["net_assets_ngn"], newval,
        o["fund_name_raw"], vdate,
        o["net_assets_ngn"], o["net_assets_usd"], o["unit_price_ngn"], None,
        o["bid_price_ngn"], o["bid_price_usd"], o["offer_price_ngn"], o["offer_price_usd"],
        ptype, curr, o["sec_document_id"], o["source_url"], o["report_date"],
        o["quality_status"], batch))
    vid = cur.lastrowid
    A.audit(cur, batch, fid, vdate, "INSERT_ROW", "value", None, newval,
            "arbitrage cle ambigue : observation officielle rattachee au fonds valide",
            o["sec_document_id"], o["source_url"], vid)
    return True, vid


def prod_dates(cur, fid):
    cur.execute("SELECT date FROM valorisations WHERE fund_id=%s", (fid,))
    out = set()
    for p in cur.fetchall():
        d = p["date"]
        out.add(d.strftime("%Y-%m-%d") if hasattr(d, "strftime") else str(d)[:10])
    return out


def build_new_fund_row(cur, spec, nom_fond):
    """Construit la ligne fond_investissements du nouveau fonds : metadonnees du
    gestionnaire (manager_ref) + colonnes de categorie du fonds monetaire de
    reference (category_ref). code_ISIN laisse a NULL. LECTURE seule ici."""
    cur.execute("SELECT * FROM fond_investissements WHERE id=%s", (spec["manager_ref"],))
    base = cur.fetchone()
    cur.execute("SELECT * FROM fond_investissements WHERE id=%s", (spec["category_ref"],))
    catref = cur.fetchone()
    if not base or not catref:
        raise RuntimeError(f"fonds de reference introuvable(s) : {spec}")
    row = {k: v for k, v in base.items() if k not in NEVER_CLONE}
    for c in CATEGORY_COLS:
        if c in row and c in catref:
            row[c] = catref[c]
    row["nom_fond"] = nom_fond
    row["pays"] = L.PAYS
    if "active" in row:
        row["active"] = 1
    return row


def create_fund(cur, row, batch, first_date, doc, url):
    cols = list(row.keys())
    ph = ",".join(["%s"] * len(cols))
    collist = ",".join("`" + c + "`" for c in cols)
    cur.execute(f"INSERT INTO fond_investissements ({collist}) VALUES ({ph})",
                [row[c] for c in cols])
    new_id = cur.lastrowid
    A.audit(cur, batch, new_id, first_date, "CREATE_FUND", "nom_fond", None,
            row["nom_fond"], "arbitrage : fonds officiel SEC absent du referentiel",
            doc, url)
    return new_id


def do_rollback(conn, batch):
    with conn.cursor() as cur:
        cur.execute("SELECT valorisation_id, action, fund_id FROM sec_ng_corrections_audit "
                    "WHERE batch=%s AND reverted=0 ORDER BY id DESC", (batch,))
        entries = cur.fetchall()
        if not entries:
            log.error("Aucune entree active pour le batch %s", batch)
            return 1
        rows_del = sum(1 for e in entries if e["action"] == "INSERT_ROW")
        funds_del = [e["fund_id"] for e in entries if e["action"] == "CREATE_FUND"]
        log.info("Rollback : %d VL inserees + %d fonds crees", rows_del, len(funds_del))
        for e in entries:
            if e["action"] == "INSERT_ROW" and e["valorisation_id"]:
                cur.execute("DELETE FROM valorisations WHERE id=%s AND correction_batch=%s",
                            (e["valorisation_id"], batch))
        for fid in funds_del:
            # securite : ne supprimer le fonds que s'il ne reste aucune VL
            cur.execute("SELECT COUNT(*) AS n FROM valorisations WHERE fund_id=%s", (fid,))
            if cur.fetchone()["n"] == 0:
                cur.execute("DELETE FROM fond_investissements WHERE id=%s", (fid,))
            else:
                log.warning("Fonds %s conserve (des VL subsistent hors batch)", fid)
        cur.execute("UPDATE sec_ng_corrections_audit SET reverted=1 WHERE batch=%s", (batch,))
    conn.commit()
    log.info("Rollback termine.")
    return 0


def main():
    ap = argparse.ArgumentParser(description="Application des arbitrages de cles ambigues Nigeria")
    ap.add_argument("--xlsx", help="chemin du classeur")
    ap.add_argument("--execute", action="store_true")
    ap.add_argument("--confirm", action="store_true")
    ap.add_argument("--rollback", metavar="BATCH")
    args = ap.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

    conn = L.db_connect()

    if args.rollback:
        code = do_rollback(conn, args.rollback)
        conn.close()
        return code

    if not args.xlsx:
        ap.error("--xlsx requis")
    execute = args.execute and args.confirm
    if args.execute and not args.confirm:
        log.error("--execute exige --confirm. Abandon.")
        return 2

    rows = L.read_workbook(args.xlsx)
    by_key = {}
    for r in rows:
        by_key.setdefault(r["fund_key"], []).append(r)

    attach_norm = {L.normalize_name(k): v for k, v in ATTACH.items()}
    create_norm = {L.normalize_name(k): (k, v) for k, v in CREATE.items()}

    log.info("=" * 66)
    log.info("  ARBITRAGE CLES AMBIGUES NIGERIA — mode %s",
             "EXECUTION" if execute else "DRY-RUN (aucune ecriture)")
    log.info("=" * 66)

    batch = f"NGAMB_{datetime.now():%Y%m%d_%H%M%S}"
    touched = []  # fund_ids a recalculer

    with conn.cursor() as cur:
        # ---- ATTACH ----
        for nkey, fid in attach_norm.items():
            obs = sorted(by_key.get(nkey, []), key=lambda r: r["valuation_date"])
            if not obs:
                log.warning("[ATTACH] cle introuvable dans le classeur : %s", nkey)
                continue
            existing = prod_dates(cur, fid)
            missing = [o for o in obs if o["valuation_date"] not in existing]
            drange = f"{obs[0]['valuation_date']} -> {obs[-1]['valuation_date']}"
            log.info("[ATTACH] %-34s -> fonds %s | classeur %d obs (%s) | absentes en base : %d",
                     nkey[:34], fid, len(obs), drange, len(missing))
            if execute and missing:
                for o in missing:
                    insert_obs(cur, fid, o["valuation_date"], o, batch)
                touched.append(fid)

        # ---- CREATE ----
        for nkey, (raw, spec) in create_norm.items():
            obs = sorted(by_key.get(nkey, []), key=lambda r: r["valuation_date"])
            if not obs:
                log.warning("[CREATE] cle introuvable dans le classeur : %s", nkey)
                continue
            drange = f"{obs[0]['valuation_date']} -> {obs[-1]['valuation_date']}"
            new_row = build_new_fund_row(cur, spec, raw)
            apercu = {k: new_row.get(k) for k in
                      ("nom_fond", "pays", "dev_libelle", "societe_gestion",
                       "categorie_globale", "categorie_libelle", "active")}
            log.info("[CREATE] %-34s | classeur %d obs (%s)", raw[:34], len(obs), drange)
            log.info("         nouveau fonds (clone gerant %s + categorie %s) : %s",
                     spec["manager_ref"], spec["category_ref"], apercu)
            if execute:
                new_id = create_fund(cur, new_row, batch, obs[0]["valuation_date"],
                                     obs[-1]["sec_document_id"], obs[-1]["source_url"])
                ins = 0
                for o in obs:
                    ok, _ = insert_obs(cur, new_id, o["valuation_date"], o, batch)
                    ins += 1 if ok else 0
                log.info("         -> fonds cree id=%s, %d VL inserees", new_id, ins)
                touched.append(new_id)

    if execute:
        conn.commit()
        log.info("Batch %s applique. Fonds touches : %s", batch, touched)
        log.info("ROLLBACK : python3 scripts/fix/fix_nigeria_ambiguous_apply.py --rollback %s", batch)
        log.info("RECALCUL CIBLE OBLIGATOIRE pour chaque fonds touche :")
        for fid in touched:
            log.info("  node scripts/recalc/recalc_vl_ajuste.js %s "
                     "&& node scripts/recalc/recalc_eur_usd_daily_rate.js %s "
                     "&& node scripts/fix/fix_populate_performances.js --fond %s --force "
                     "&& node scripts/fix/fix_populate_performances_eur_usd.js --devise BOTH --fond %s --force",
                     fid, fid, fid, fid)
    else:
        log.info(">>> DRY-RUN : aucune ecriture. Verifier les apercus ci-dessus, "
                 "puis relancer avec --execute --confirm. <<<")

    conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
