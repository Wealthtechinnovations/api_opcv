-- =============================================================================
-- MIGRATION ADDITIVE — Mesures explicites SEC Nigeria
-- =============================================================================
-- Objet : permettre de stocker SANS AMBIGUITE l'actif net total, la VL explicite,
--         le Bid, l'Offer, la devise et la provenance officielle, alors que la
--         colonne historique `value` ne permet pas de prouver la nature du prix
--         qu'elle contient (audit 2026-07-31 : 8 643 Bid + 784 Offer + 92 Bid USD
--         + 10 Offer USD y sont stockes contre seulement 7 247 vraies VL).
--
-- GARANTIES DE NON-REGRESSION :
--   * 100 % ADDITIVE : aucun DROP, aucun RENAME, aucun changement de type sur
--     une colonne existante. `value`, `actif_net`, `souscription`, `rachat`
--     restent strictement inchanges et continuent d'alimenter l'API/frontend.
--   * Toutes les nouvelles colonnes sont NULLABLE et NULL par defaut : une ligne
--     non encore traitee se comporte exactement comme avant.
--   * Aucune contrainte UNIQUE ajoutee (l'audit doublons doit passer d'abord).
--   * Idempotente : re-executable sans erreur (test d'existence par colonne).
--   * Rollback fourni en fin de fichier.
--
-- PORTEE : table `valorisations` (toutes lignes) — mais SEULES les lignes Nigeria
--          seront renseignees par le script de correction. Les autres pays
--          gardent NULL partout : aucun impact.
--
-- Types : DECIMAL et non DOUBLE pour les nouvelles colonnes financieres
--         (precision exacte exigee). Actif net max observe ~1.7e12 NGN
--         -> DECIMAL(28,6) couvre largement. Prix unitaires jusqu'a 6 decimales.
-- =============================================================================

-- --- Procedure utilitaire : ajoute une colonne seulement si elle n'existe pas ---
DROP PROCEDURE IF EXISTS add_col_if_missing;
DELIMITER //
CREATE PROCEDURE add_col_if_missing(
    IN tbl VARCHAR(64), IN col VARCHAR(64), IN defn TEXT)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tbl AND COLUMN_NAME = col
    ) THEN
        SET @s = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN `', col, '` ', defn);
        PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
    END IF;
END //
DELIMITER ;

-- --- Mesures officielles explicites (jamais confondues entre elles) ---
CALL add_col_if_missing('valorisations', 'net_assets_ngn',  'DECIMAL(28,6) NULL COMMENT "Actif net total NGN publie par la SEC — jamais une VL"');
CALL add_col_if_missing('valorisations', 'net_assets_usd',  'DECIMAL(28,6) NULL COMMENT "Actif net total USD publie — jamais une VL"');
CALL add_col_if_missing('valorisations', 'unit_price_ngn',  'DECIMAL(20,6) NULL COMMENT "VL/Unit Price NGN — uniquement si la source dit explicitement Unit Price"');
CALL add_col_if_missing('valorisations', 'unit_price_usd',  'DECIMAL(20,6) NULL COMMENT "VL/Unit Price USD explicite"');
CALL add_col_if_missing('valorisations', 'bid_price_ngn',   'DECIMAL(20,6) NULL COMMENT "Prix de rachat (Bid) NGN — distinct de la VL"');
CALL add_col_if_missing('valorisations', 'bid_price_usd',   'DECIMAL(20,6) NULL COMMENT "Prix de rachat (Bid) USD — distinct de la VL"');
CALL add_col_if_missing('valorisations', 'offer_price_ngn', 'DECIMAL(20,6) NULL COMMENT "Prix de souscription (Offer) NGN — distinct de la VL"');
CALL add_col_if_missing('valorisations', 'offer_price_usd', 'DECIMAL(20,6) NULL COMMENT "Prix de souscription (Offer) USD — distinct de la VL"');

-- --- Qualification de la colonne historique `value` ---
-- `value` reste alimentee pour la compatibilite frontend, mais sa nature devient
-- enfin explicite. Regle documentee : VL explicite prioritaire ; a defaut Bid ;
-- a defaut Offer. `value` ne doit JAMAIS etre presentee comme « VL » si
-- price_type vaut BID ou OFFER.
CALL add_col_if_missing('valorisations', 'price_type',    'VARCHAR(16) NULL COMMENT "Nature reelle de value : UNIT_PRICE | BID | OFFER | UNKNOWN"');
CALL add_col_if_missing('valorisations', 'currency_code', 'VARCHAR(8) NULL COMMENT "Devise de publication du prix (NGN ou USD) — aucune conversion implicite"');

-- --- Provenance officielle (tracabilite exigee : pourquoi cette valeur ?) ---
CALL add_col_if_missing('valorisations', 'sec_document_id', 'VARCHAR(32) NULL COMMENT "Identifiant du document officiel SEC retenu"');
CALL add_col_if_missing('valorisations', 'source_url',      'VARCHAR(512) NULL COMMENT "URL du fichier officiel source"');
CALL add_col_if_missing('valorisations', 'report_date',     'DATE NULL COMMENT "Date du rapport source (peut differer de la date du bloc de mesures)"');
CALL add_col_if_missing('valorisations', 'data_quality',    'VARCHAR(24) NULL COMMENT "OK | SOURCE_ZERO | PARTIAL | REVIEW | QUARANTINE"');
CALL add_col_if_missing('valorisations', 'correction_batch','VARCHAR(40) NULL COMMENT "Batch de correction ayant touche la ligne (permet le rollback cible)"');

DROP PROCEDURE IF EXISTS add_col_if_missing;

-- --- Index de travail (non uniques : aucun risque de rejet d'insertion) ---
-- Crees seulement s'ils manquent, via la meme technique conditionnelle.
DROP PROCEDURE IF EXISTS add_idx_if_missing;
DELIMITER //
CREATE PROCEDURE add_idx_if_missing(IN tbl VARCHAR(64), IN idx VARCHAR(64), IN cols TEXT)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tbl AND INDEX_NAME = idx
    ) THEN
        SET @s = CONCAT('ALTER TABLE `', tbl, '` ADD INDEX `', idx, '` (', cols, ')');
        PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
    END IF;
END //
DELIMITER ;
CALL add_idx_if_missing('valorisations', 'idx_correction_batch', '`correction_batch`');
CALL add_idx_if_missing('valorisations', 'idx_price_type', '`price_type`');
DROP PROCEDURE IF EXISTS add_idx_if_missing;

-- --- Table d'audit des corrections : avant/apres, reversible ligne a ligne ---
CREATE TABLE IF NOT EXISTS sec_ng_corrections_audit (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    batch VARCHAR(40) NOT NULL,
    valorisation_id INT NULL,
    fund_id INT NOT NULL,
    valuation_date DATE NOT NULL,
    action VARCHAR(24) NOT NULL COMMENT 'UPDATE_VALUE | FILL_MEASURES | INSERT_ROW | MERGE_FUND | CREATE_FUND',
    field_name VARCHAR(64) NULL,
    old_value TEXT NULL,
    new_value TEXT NULL,
    reason VARCHAR(255) NULL,
    sec_document_id VARCHAR(32) NULL,
    source_url VARCHAR(512) NULL,
    reverted TINYINT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_batch (batch),
    KEY idx_fund_date (fund_id, valuation_date),
    KEY idx_reverted (reverted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Journal reversible des corrections Nigeria — permet un rollback cible par batch';

-- =============================================================================
-- ROLLBACK (a executer manuellement UNIQUEMENT si necessaire)
-- =============================================================================
-- Les colonnes ajoutees sont NULL pour toutes les lignes non traitees : les
-- supprimer n'est normalement PAS necessaire. Preferer un rollback des DONNEES
-- via sec_ng_corrections_audit (voir sec_ng_apply_corrections.py --rollback).
--
-- Suppression structurelle (destructive — perd les mesures explicites importees) :
--
-- ALTER TABLE valorisations
--   DROP COLUMN net_assets_ngn,  DROP COLUMN net_assets_usd,
--   DROP COLUMN unit_price_ngn,  DROP COLUMN unit_price_usd,
--   DROP COLUMN bid_price_ngn,   DROP COLUMN bid_price_usd,
--   DROP COLUMN offer_price_ngn, DROP COLUMN offer_price_usd,
--   DROP COLUMN price_type,      DROP COLUMN currency_code,
--   DROP COLUMN sec_document_id, DROP COLUMN source_url,
--   DROP COLUMN report_date,     DROP COLUMN data_quality,
--   DROP COLUMN correction_batch;
-- DROP TABLE IF EXISTS sec_ng_corrections_audit;
-- =============================================================================
