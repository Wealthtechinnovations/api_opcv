/**
 * Lecture du CSV produit par `sec_ng_nav_extractor_v6.py`, et appariement des
 * noms de fonds — source unique.
 *
 * POURQUOI CE MODULE. Ces deux fonctions vivaient uniquement dans
 * `scripts/import/import_vl_nigeria_sec.js`, sans etre exportees. Tout autre
 * outil devant lire le meme CSV — un diagnostic, un comparateur, un correctif —
 * devait les reecrire. Or c est exactement le defaut qui a coute le plus cher
 * sur ce chantier : deux implementations de la meme regle finissent par
 * diverger, et l on croit mesurer ce que l importeur fait alors qu on mesure
 * autre chose.
 *
 * Un comparateur qui n apparie pas les noms EXACTEMENT comme l importeur ne
 * compare rien d utile : il signalerait comme absents des fonds que l import
 * reconnait parfaitement.
 */

/**
 * Une ligne de CSV, en respectant les guillemets. Les noms de fonds SEC
 * contiennent des virgules (« Women's Balanced Fund (Gender/Diversity) ») et
 * un `split(',')` naif decalerait toutes les colonnes suivantes.
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

/**
 * Forme normalisee d un nom de fonds, pour comparer un libelle SEC a un libelle
 * en base. Les deux sources ecrivent le meme fonds differemment : ponctuation,
 * esperluette, « Limited » contre « Ltd », espaces multiples.
 *
 * Cette regle doit rester IDENTIQUE a celle qu applique l importeur, sans quoi
 * un outil de comparaison declarerait introuvables des fonds que l import
 * apparie sans difficulte.
 */
function normalizeNameForMatch(name) {
  return (name || '')
    .toUpperCase()
    .replace(/&/g, ' AND ')
    .replace(/[''`]/g, '')
    .replace(/\bLIMITED\b/g, 'LTD')
    .replace(/\bPUBLIC LIMITED COMPANY\b/g, 'PLC')
    .replace(/\bP L C\b/g, 'PLC')
    .replace(/\bL T D\b/g, 'LTD')
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Le CSV entier, en objets indexes par nom de colonne. L extracteur ecrit une
 * cinquantaine de colonnes dont l ordre a deja change entre deux versions : on
 * lit donc par NOM, jamais par position.
 */
function lireCSV(chemin) {
  const fs = require('fs');
  const contenu = fs.readFileSync(chemin, 'utf8');
  const lignes = contenu.split('\n').filter(l => l.trim().length > 0);
  if (!lignes.length) return { entetes: [], lignes: [] };

  const entetes = parseCSVLine(lignes[0]);
  const sorties = [];
  for (let i = 1; i < lignes.length; i++) {
    const valeurs = parseCSVLine(lignes[i]);
    const o = {};
    entetes.forEach((h, k) => { o[h] = valeurs[k]; });
    sorties.push(o);
  }
  return { entetes, lignes: sorties };
}

module.exports = { parseCSVLine, normalizeNameForMatch, lireCSV };
