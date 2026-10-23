'use strict';

/**
 * Horodate la reconstruction des classements.
 *
 * POURQUOI. Les trois tables `classementfonds`, `classementfonds_eurs` et
 * `classementfonds_usds` sont declarees `timestamps: false` et n ont AUCUNE
 * colonne de date. Consequence mesuree : apres un run de recalcul qui sort en
 * `HTTP 000`, on ne peut pas distinguer un run qui a commite d un run qui a
 * roule en arriere. La route enveloppe la purge et les ~3 600 insertions dans
 * une transaction unique (`apigestionsavequotidien.js:359` pour le
 * `destroy({ where: {} })`, `:587` commit, `:590` rollback) : les deux issues
 * laissent la table dans un etat indistinguable.
 *
 * Le 2026-10-06 j ai conclu d un `HTTP 000` que « le classement local n est pas
 * recalcule ». Le depot avertit par ecrit qu un `HTTP 000` signifie que le
 * CLIENT a cesse d attendre, pas que le serveur a echoue. La conclusion etait
 * donc indue — et elle restera indue tant que la reconstruction ne sera pas
 * observable. Cette migration la rend observable : comme la route purge puis
 * recree tout, `MIN/MAX(created_at)` donne directement la fenetre du dernier
 * run, et `COUNT(*)` son volume.
 *
 * AUCUNE LIGNE DE CODE N EST MODIFIEE PAR CETTE MIGRATION, et c est voulu :
 * Sequelize n ecrit que les colonnes qu il connait, MySQL remplit le defaut
 * seul. Les modeles ne doivent SURTOUT PAS basculer en `timestamps: true` :
 * si le modele partait avant la migration, chaque `INSERT` de la route
 * echouerait sur une colonne absente.
 *
 * RETOUR ARRIERE : `down` retire les deux colonnes. Aucune donnee metier n est
 * touchee — ni lue, ni ecrite, ni deplacee.
 *
 * PRECAUTION. `src/db/sequelize.js:263` lance `sync({ alter: true })` quand
 * `DB_SYNC_ALTER=true`. Dans ce cas, et dans ce cas seulement, une colonne
 * absente du modele peut etre SUPPRIMEE au demarrage suivant, ce qui annulerait
 * cette migration en silence. `scripts/diag/ondemand/diag_perf_colonnes_manquantes.js`
 * verifie la PRESENCE de cette variable (jamais sa valeur) avant application.
 *
 * APPLICATION (proprietaire) :
 *   npx sequelize-cli db:migrate
 * Les trois tables sont petites (~3 600 lignes chacune) : un `ADD COLUMN` y est
 * instantane. Demander malgre tout `ALGORITHM=INPLACE, LOCK=NONE` serait
 * superflu a cette volumetrie.
 */
const TABLES = ['classementfonds', 'classementfonds_eurs', 'classementfonds_usds'];

module.exports = {
  async up(queryInterface, Sequelize) {
    for (const table of TABLES) {
      // `.catch` par table et par colonne : la migration doit etre rejouable
      // sans echouer si une colonne existe deja, et un defaut sur une table ne
      // doit pas empecher les deux autres d etre horodatees.
      await queryInterface.addColumn(table, 'created_at', {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: true,
      }).catch((e) => {
        console.warn(`[migration] ${table}.created_at non ajoutee : ${e.message}`);
      });

      await queryInterface.addColumn(table, 'updated_at', {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        allowNull: true,
      }).catch((e) => {
        console.warn(`[migration] ${table}.updated_at non ajoutee : ${e.message}`);
      });
    }
  },

  async down(queryInterface) {
    for (const table of TABLES) {
      await queryInterface.removeColumn(table, 'created_at').catch(() => {});
      await queryInterface.removeColumn(table, 'updated_at').catch(() => {});
    }
  },
};
