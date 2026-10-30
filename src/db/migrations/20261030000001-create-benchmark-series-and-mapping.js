'use strict';

/**
 * M1 du chantier Benchmarks V2 — creation de `benchmark_series` et
 * `benchmark_mapping`. STRICTEMENT ADDITIF : deux `CREATE TABLE`, et rien
 * d'autre.
 *
 * POURQUOI MAINTENANT, ET CE QUE LA VERIFICATION A MONTRE. Le mandat du
 * 2026-10-30 autorise l'engagement F4/M2 en pilote Maroc/MONIA, en exigeant
 * d'« utiliser le modele additif `benchmark_series`, APRES verification des
 * dependances et de la migration M1 ». Verification faite le 2026-10-30 :
 *
 *   `benchmark_series` dans src/, migrations/, scripts/  : ABSENT
 *   src/db/migrations/                                   : 6 fichiers, aucun benchmark
 *   `BENCHMARKS_V2_ENABLED`                              : present dans le SEUL
 *                                                          document F3, nulle part
 *                                                          dans le code
 *
 * **M1 n'a jamais ete execute.** M2 ne peut donc pas ecrire dans une table qui
 * n'existe pas : M1 est le premier lot executable du mandat, et il precede
 * toute adaptation de collecteur.
 *
 * SCHEMA REPRIS DE SA SOURCE CANONIQUE, NON INVENTE :
 * `docs/BENCHMARKS_F3_MAPPING_SCHEMA.md` §2.1 et §2.2, decide le 2026-07-09.
 * Chaque colonne, chaque ENUM et chaque cle unique y figure. Le mandat impose
 * de reprendre les identifiants « depuis leur source canonique » et de ne pas
 * en « inventer, modifier ou deduire » la signification.
 *
 * CE QUE CETTE MIGRATION NE FAIT PAS, et c'est l'essentiel :
 *   - elle n'ecrit AUCUNE ligne. Les tables sont creees vides ;
 *   - elle ne touche NI `valorisations`, NI `indice_references`, NI
 *     `fond_investissements`, NI aucune table existante — pas une colonne, pas
 *     un index ;
 *   - elle ne change AUCUN comportement : sans donnees et sans le flag
 *     `BENCHMARKS_V2_ENABLED`, rien ne lit ces tables. Le site se comporte
 *     exactement comme avant ;
 *   - elle ne seed PAS `benchmark_mapping`. F3 §127 prevoit un seed depuis
 *     `04_REF_INDICES_FUNDAFRICA` ; melanger une creation de schema et une
 *     insertion de donnees de reference dans une meme migration rendrait le
 *     retour arriere ambigu. Le seed est un lot distinct.
 *
 * RETOUR ARRIERE : `down()` supprime les deux tables. Comme elles sont creees
 * vides et que rien ne les lit, le retour arriere est sans perte tant que M2
 * n'a pas ecrit. **Des que M2 ecrit, `down()` detruit des donnees collectees** —
 * la remarque est ici pour que personne ne l'apprenne au mauvais moment.
 *
 * DEUX POINTS DU SCHEMA CANONIQUE QUI MERITENT D'ETRE DITS, plutot que
 * decouverts plus tard :
 *
 * 1. `publication_date` est SEPAREE de `as_of_date`, et c'est exactement ce
 *    dont MONIA a besoin : une observation du jour J est publiee en J+1. Le
 *    mandat l'exige — « dates d'observation et de publication distinctes ». Le
 *    defaut mesure au lot DA de `SUIVI.md` — une valeur ecrite sous la date
 *    demandee au cron et non sous sa date economique — devient structurellement
 *    impossible dans cette table.
 *
 * 2. La cle unique de `benchmark_mapping` porte sur
 *    `(fond_id, pays, categorie, benchmark_scope, indicator_code)`, dont les
 *    TROIS premieres colonnes sont nullables. **MySQL autorise plusieurs NULL
 *    dans un index UNIQUE** : cette cle n'empechera donc pas deux regles
 *    identiques dont `fond_id` est NULL. C'est une limite du schema canonique,
 *    pas une erreur de cette migration — je l'implemente tel que decide, et je
 *    la signale. Le controle d'unicite des regles par (pays, categorie) devra
 *    etre applicatif, ou passer par une colonne generee.
 *
 * APPLICATION (proprietaire) : `npx sequelize-cli db:migrate`.
 * Deux `CREATE TABLE` sur des tables vides : l'operation est instantanee et ne
 * pose aucun verrou sur les tables de production.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // ---- benchmark_series : un point = (indicateur, date, devise) ----
    await queryInterface.createTable('benchmark_series', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      indicator_code: {
        type: Sequelize.STRING(64),
        allowNull: false,
        comment: 'MASI, TUNINDEX, MONIA, SP_ALL_AFRICA, AFRICA_CASH_SYNTH...',
      },
      indicator_name: { type: Sequelize.STRING(255), allowNull: true },
      country: {
        type: Sequelize.STRING(32),
        allowNull: true,
        comment: 'MAROC/TUNISIE/NIGERIA/UEMOA/CEMAC/AFRIQUE',
      },
      category: {
        type: Sequelize.STRING(64),
        allowNull: true,
        comment: 'ACTIONS/OBLIGATIONS_CT/OBLIGATIONS_LT/MONETAIRE/DIVERSIFIE/RFR/MAR',
      },
      benchmark_scope: {
        // La couche 2 (converted) ne doit JAMAIS etre confondue avec la couche 3
        // (africa) : le mandat l'interdit explicitement. L'ENUM rend la
        // confusion impossible au niveau du stockage.
        type: Sequelize.ENUM('national', 'converted', 'africa'),
        allowNull: false,
      },
      return_type: {
        type: Sequelize.ENUM('price', 'total_return', 'yield', 'rate', 'synthetic'),
        allowNull: false,
      },
      original_currency: { type: Sequelize.STRING(8), allowNull: true },
      display_currency: {
        type: Sequelize.STRING(8),
        allowNull: false,
        comment: 'LOCAL / EUR / USD',
      },
      value: { type: Sequelize.DECIMAL(20, 6), allowNull: true },
      as_of_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'date de MARCHE de l observation',
      },
      publication_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'date de publication, distincte de as_of_date (cf MONIA, J+1)',
      },
      fetched_at: { type: Sequelize.DATE, allowNull: true },
      source_name: { type: Sequelize.STRING(128), allowNull: true },
      source_url: { type: Sequelize.STRING(512), allowNull: true },
      source_rank: {
        type: Sequelize.TINYINT,
        allowNull: true,
        comment: '1=officielle, 2=fallback reglemente, 3=fallback technique',
      },
      is_official: { type: Sequelize.BOOLEAN, allowNull: true },
      is_synthetic: { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: false },
      confidence_level: {
        type: Sequelize.ENUM('high', 'medium', 'low'),
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING(48),
        allowNull: true,
        comment: 'OK_EXACT_DATE / OK_PREVIOUS_AVAILABLE_DATE / NO_VALUE_* / '
          + 'SYNTHETIC_BENCHMARK_USED / FX_MISSING...',
      },
      raw_payload_hash: { type: Sequelize.CHAR(64), allowNull: true },
    });

    // La cle unique est ce qui rend un collecteur IDEMPOTENT : relancer une
    // collecte sur une date deja couverte ne cree pas de doublon. Sans elle,
    // chaque rejeu dupliquerait la serie — le defaut exact mesure sur
    // `valorisations`, ou l'absence de contrainte avait laisse entrer des
    // doublons pendant des annees (lot CU de SUIVI.md).
    await queryInterface.addConstraint('benchmark_series', {
      fields: ['indicator_code', 'display_currency', 'benchmark_scope', 'as_of_date'],
      type: 'unique',
      name: 'uq_benchmark_series_point',
    });

    await queryInterface.addIndex('benchmark_series', {
      fields: ['country', 'category', 'as_of_date'],
      name: 'idx_benchmark_series_pays_cat_date',
    });

    // ---- benchmark_mapping : quel indicateur pour quel fonds/couche ----
    await queryInterface.createTable('benchmark_mapping', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      fond_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'NULL = regle par (pays, categorie) ; sinon override par fonds',
      },
      pays: { type: Sequelize.STRING(32), allowNull: true },
      categorie: { type: Sequelize.STRING(64), allowNull: true },
      benchmark_scope: {
        type: Sequelize.ENUM('national', 'converted', 'africa'),
        allowNull: false,
      },
      indicator_code: {
        type: Sequelize.STRING(64),
        allowNull: false,
        comment: 'FK LOGIQUE vers benchmark_series.indicator_code — pas de FK '
          + 'physique : une regle peut exister avant la premiere observation',
      },
      weight: {
        type: Sequelize.DECIMAL(6, 4),
        allowNull: false,
        defaultValue: 1.0,
        comment: 'composites (diversifie) : les poids d un meme scope sommant a 1',
      },
      is_composite: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      mapping_status: {
        type: Sequelize.STRING(48),
        allowNull: true,
        comment: 'VALIDATED / BENCHMARK_MAPPING_PENDING / HOUSE_COMPOSITE_EXPLICIT',
      },
      effective_from: { type: Sequelize.DATEONLY, allowNull: true },
      source_prospectus: { type: Sequelize.STRING(255), allowNull: true },
    });

    // Cle unique du schema canonique. ATTENTION, limite reelle : ses trois
    // premieres colonnes sont nullables, et MySQL autorise plusieurs NULL dans
    // un index UNIQUE. Elle n'empechera donc pas deux regles identiques a
    // `fond_id` NULL. Limite du schema decide, signalee et non corrigee ici :
    // la corriger unilateralement s'ecarterait de la source canonique.
    await queryInterface.addConstraint('benchmark_mapping', {
      fields: ['fond_id', 'pays', 'categorie', 'benchmark_scope', 'indicator_code'],
      type: 'unique',
      name: 'uq_benchmark_mapping_regle',
    });
  },

  async down(queryInterface) {
    // Les tables sont creees vides et rien ne les lit sans le flag : le retour
    // arriere est sans perte AVANT que M2 n'ecrive. Apres, il detruit des
    // donnees collectees — sauvegarder d'abord.
    await queryInterface.dropTable('benchmark_mapping');
    await queryInterface.dropTable('benchmark_series');
  },
};
