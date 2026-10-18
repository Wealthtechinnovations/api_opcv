'use strict';

/**
 * Trois index composites de categorie sur chacune des trois tables de
 * performances.
 *
 * POURQUOI, ET LA MESURE QUI LE JUSTIFIE. La route de classement emet, pour
 * chaque fonds et chaque niveau de categorie, la sous-requete de
 * `src/services/ranking.service.js:87-100` :
 *
 *   SELECT fond_id, MAX(date) FROM performences
 *    WHERE categorie_nationale = ? GROUP BY fond_id
 *
 * Mesure du 2026-10-07 sur la production (`diag_classement_index_plan.js`,
 * sortie dans `docs/DIAG_ONDEMAND.md`) :
 *
 *   index existants sur `performences` : PRIMARY(id), fond_id, code_ISIN, date
 *   index couvrant (categorie_nationale, fond_id, date) : NON
 *   EXPLAIN  type=index  key=idx_perf_fond_id  rows=64739  Extra="Using where"
 *   duree    400 ms en moyenne sur les cinq plus grosses categories
 *   projection  1 245 fonds x 3 niveaux x 400 ms ≈ 24,9 min de SQL SEUL
 *
 * Le cron accorde `--max-time 1800` (30 min) aux etapes 9a-9c. Vingt-cinq
 * minutes de SQL pur, plus le reste du traitement, expliquent le `HTTP 000`
 * que ces etapes rendent chaque soir. **L absence d index est la cause
 * mesuree du HTTP 000**, et non un symptome a masquer en rallongeant le delai.
 *
 * Le composite couvre ENTIEREMENT la sous-requete : la colonne de filtre en
 * tete, puis `fond_id` pour le regroupement, puis `date` pour l agregat. MySQL
 * n a plus a lire les lignes, l index suffit (`Using index`).
 *
 * POURQUOI C EST LA MODIFICATION LA PLUS SURE DE CE CHANTIER. **Un index ne
 * change jamais un resultat, seulement un plan d execution.** C est la seule
 * intervention du plan de remediation dont on puisse affirmer qu elle n a
 * aucun effet numerique : aucune valeur financiere n est lue, ecrite ou
 * recalculee. Et `DROP INDEX` est un retour arriere instantane et sans perte.
 *
 * APPLICATION (proprietaire). `npx sequelize-cli db:migrate`.
 * `performences` fait ≈ 82 600 lignes pour 90,7 Mo : la creation prend
 * quelques secondes. Sequelize passe par `ALTER TABLE ... ADD INDEX`, que
 * MySQL 5.7+ et MariaDB executent en ligne (`ALGORITHM=INPLACE, LOCK=NONE`)
 * pour un ajout d index secondaire — la table reste lisible et inscriptible
 * pendant l operation. A lancer malgre tout hors de la fenetre du cron de
 * 20 h, par prudence.
 *
 * VERIFICATION APRES APPLICATION. Rejouer
 * `scripts/diag/ondemand/diag_classement_index_plan.js` : l `EXPLAIN` doit
 * passer de `type=index key=idx_perf_fond_id rows=64739` a `type=ref` sur le
 * nouvel index, avec un `rows` de l ordre du nombre de lignes de la seule
 * categorie, et la duree doit tomber de 400 ms a quelques millisecondes.
 *
 * COUT EN ESPACE. Trois index par table, trois tables. Sur `performences`,
 * l index represente aujourd hui 7,5 Mo pour 90,7 Mo de donnees (ratio 0,08) ;
 * chaque composite ajoute environ la taille d un index sur la colonne de
 * categorie plus deux entiers par ligne. Ordre de grandeur attendu : quelques
 * mega-octets par index. Negligeable au regard du gain.
 */
const TABLES = ['performences', 'performences_eurs', 'performences_usds'];

// La colonne de filtre vient EN TETE : c est elle qui est comparee a une
// constante. `fond_id` ensuite pour le GROUP BY, `date` enfin pour MAX().
// Inverser cet ordre rendrait l index inutilisable pour cette requete.
const NIVEAUX = [
  { colonne: 'categorie_nationale', suffixe: 'nat' },
  { colonne: 'categorie_fundafrica_regionale', suffixe: 'reg' },
  { colonne: 'categorie_fundafrica_globale', suffixe: 'glo' },
];

// Les noms d index MySQL sont limites a 64 caracteres : on abrege la table.
const abrev = t => t.replace('performences', 'perf').replace('_eurs', '_eur').replace('_usds', '_usd');

module.exports = {
  async up(queryInterface) {
    for (const table of TABLES) {
      for (const n of NIVEAUX) {
        const nom = `idx_${abrev(table)}_${n.suffixe}_fond_date`;
        // `.catch` par index : la migration doit etre rejouable sans echouer si
        // un index existe deja, et un defaut sur l un ne doit pas empecher les
        // huit autres d etre crees.
        await queryInterface.addIndex(table, [n.colonne, 'fond_id', 'date'], { name: nom })
          .catch((e) => {
            console.warn(`[migration] ${nom} non cree : ${e.message}`);
          });
      }
    }
  },

  async down(queryInterface) {
    for (const table of TABLES) {
      for (const n of NIVEAUX) {
        await queryInterface.removeIndex(table, `idx_${abrev(table)}_${n.suffixe}_fond_date`)
          .catch(() => {});
      }
    }
  },
};
