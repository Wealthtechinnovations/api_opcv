'use strict';
/**
 * MASI depuis FT markets — source de repli, logique de validation ECRITE UNE FOIS.
 *
 * POURQUOI CE MODULE. La chaine de rattrapage du benchmark marocain existe en
 * entier (`fix_index_tail.js` → `propagate_indref_range.js` →
 * `recalc_eur_usd_daily_rate.js`), mais il lui manque une piece :
 * `fix_index_tail.js:107` lit MASI depuis medias24, ferme par Cloudflare — 403
 * a Node ET a curl depuis S2, verifie. Resultat mesure au 2026-10-07 :
 * `C9.MAROC` a **48,2 %** (4 161 VL sans benchmark sur 8 031 entrees en 30 j).
 *
 * La source de remplacement a deja ete trouvee et validee pour le scraper
 * quotidien : FT markets, instrument `MASI:CAS`. Elle a passe un test de
 * jonction qui est la seule preuve qui compte ici — **la cloture FT du
 * 31/07/2026 vaut 17 843,70, exactement la valeur deja stockee dans
 * `indice_references` ce jour-la, ecart 0,00**. FT publie donc la serie que
 * nous suivions deja : ce n est pas un raccord entre deux series d echelles
 * differentes, c est une continuation. Le repli livre le 2026-10-05 a porte
 * `C10.MASI` de 66 jours a 0 et repare 3 214 VL.
 *
 * Ce module existe pour que la LOGIQUE DE VALIDATION DES COLONNES n existe
 * qu une fois. Elle est le coeur du sujet : le tableau FT donne
 * Date | Ouverture | Haut | Bas | Cloture | Volume, et prendre la premiere
 * colonne venue fausserait le benchmark d environ +1,6 % — un ecart credible,
 * donc invisible pour tous les controles. Dupliquer cette logique dans un
 * second script serait exactement la dette que ce depot interdit.
 *
 * DETTE ASSUMEE, A DIRE PLUTOT QU A TAIRE. `scripts/scraper/scrape_indices_daily.js`
 * garde pour l instant sa propre copie de cette logique, dans
 * `scrapeMASIviaFT`. Elle tourne en production depuis le 2026-10-05 et vient de
 * reparer le benchmark marocain : la brancher sur ce module dans le meme lot que
 * la creation du module ferait dependre une chaine fraichement reparee d un code
 * non encore eprouve. L unification est un lot a part, a faire **apres** que ce
 * module ait fait ses preuves sur le rattrapage des seances manquantes.
 *
 * LES DEUX CONTROLES, DONT UN SEUL EST UN VRAI INVARIANT.
 *
 *   1. CONTENANCE OHLC — `bas <= ouverture <= haut` et `bas <= cloture <= haut`.
 *      Ne depend d aucune hypothese de marche. Valide la POSITION des quatre
 *      colonnes. Exige a l unanimite.
 *   2. ORIENTATION — « ouverture du jour J = cloture du jour J-1 ». Departage
 *      ouverture et cloture, qui sont symetriques dans le controle 1. Juge **en
 *      majorite, jamais a l unanimite**.
 *
 * POURQUOI LA MAJORITE, ET NON L UNANIMITE. Ma premiere version exigeait trois
 * paires coherentes sur trois. Sur une fenetre de dix jours l invariant tenait
 * (3/3) et je l ai cru general. Mesure du 2026-10-05 sur quarante seances :
 * **29 paires sur 39**. Un quart des seances ouvre a un autre niveau que la
 * cloture precedente — c est un gap d ouverture, le comportement normal d un
 * marche apres un week-end, un jour ferie ou une nouvelle. Mon invariant etait
 * une heuristique. Avec 74 % de paires coherentes, exiger l unanimite sur trois
 * paires revenait a refuser la valeur six fois sur dix, en silence, en se
 * donnant l air de proteger la donnee.
 *
 * LECTURE SEULE. Ce module n ecrit rien : il rend des valeurs, l appelant
 * decide.
 */
const { execFile } = require('child_process');

const TEARSHEET = 'https://markets.ft.com/data/indices/tearsheet/historical?s=MASI:CAS';
const AJAX = 'https://markets.ft.com/data/equities/ajax/get-historical-prices';
const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

const MOIS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const OUVERTURE = 1, HAUT = 2, BAS = 3, CLOTURE = 4;
const PART_MINIMALE = 0.6;   // 74 % mesure ; en deca de 60 %, l orientation est douteuse
const PLANCHER_MASI = 1000;  // le MASI n est jamais descendu sous ce niveau

const nombre = s => Number(String(s).replace(/,/g, ''));
const fmtFT = iso => { const [a, m, j] = iso.split('-'); return `${MOIS[Number(m) - 1]} ${j}, ${a}`; };
const fmtRequete = d => `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;

// L identifiant interne FT ne change pas d une date a l autre. Sans ce cache,
// un rattrapage de soixante jours redemanderait soixante fois la meme fiche de
// 80 Ko. Portee processus : chaque execution le redemande une fois, donc un
// changement cote FT est pris en compte au passage suivant.
let xidCache = null;

/**
 * Transport par `curl` et non par le client de Node, pour la raison deja
 * documentee dans `scrape_indices_daily.js` a propos de bkam.ma : certains
 * hotes repondent 403 a l empreinte TLS de Node et 200 a curl.
 */
function curlGetText(url, extraHeaders = []) {
  const args = [
    '-s', '-f', '-L', '--compressed', '--max-time', '30',
    '-H', `User-Agent: ${USER_AGENT}`,
    '-H', 'Accept-Language: fr-FR,fr;q=0.9,en;q=0.8',
    '-H', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    ...extraHeaders,
    url,
  ];
  return new Promise((resolve, reject) => {
    execFile('curl', args, { maxBuffer: 25 * 1024 * 1024, timeout: 60000 }, (err, stdout, stderr) => {
      if (err) {
        err.message = `curl failed: ${err.message}${stderr ? ` | ${String(stderr).slice(0, 300)}` : ''}`;
        return reject(err);
      }
      resolve(stdout);
    });
  });
}

/** L identifiant interne de l instrument, LU DANS LA PAGE. Aucune valeur codee
 *  en dur : un identifiant fournisseur perime pointerait vers un autre
 *  instrument sans que rien ne le signale. */
async function identifiantInstrument(verbose) {
  if (xidCache) return xidCache;
  const page = await curlGetText(TEARSHEET);
  for (const re of [/&quot;symbol&quot;\s*:\s*&quot;(\d{6,})&quot;/, /"symbol"\s*:\s*"(\d{6,})"/]) {
    const m = page.match(re);
    if (m) { xidCache = m[1]; break; }
  }
  if (!xidCache && verbose) console.log('    [MASI] FT : identifiant interne introuvable dans la fiche');
  if (xidCache && verbose) console.log(`    [MASI] FT : identifiant interne ${xidCache} (mis en cache)`);
  return xidCache;
}

/** Les lignes du tableau renvoye par FT, cellules nettoyees. */
function extraireLignes(brut) {
  let fragment = brut;
  try { const j = JSON.parse(brut); if (typeof j.html === 'string') fragment = j.html; } catch { /* corps brut */ }
  const lignes = [];
  const reLigne = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let mr;
  while ((mr = reLigne.exec(fragment)) !== null) {
    const cellules = (mr[1].match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || [])
      .map(c => c.replace(/<[^>]+>/g, ' ').replace(/&nbsp;?/gi, ' ').replace(/\s+/g, ' ').trim())
      .filter(c => c.length);
    if (cellules.length >= 5) lignes.push(cellules);
  }
  return lignes;
}

/**
 * Les colonnes sont-elles a la place attendue ? Rend `{ ok, motif, ohlc, paires }`.
 * AUCUNE valeur ne doit etre lue avant que ceci ait repondu `ok`.
 */
function validerColonnes(lignes, verbose) {
  if (lignes.length < 2) {
    return { ok: false, motif: `${lignes.length} ligne(s) exploitable(s), insuffisant pour verifier la structure` };
  }

  // Controle 1 — contenance OHLC. Invariant, independant des gaps.
  // Tolerance d un centieme : les arrondis de publication ne sont pas des
  // violations de structure.
  let lignesOHLC = 0, lignesCoherentes = 0;
  for (const l of lignes) {
    const o = nombre(l[OUVERTURE]), h = nombre(l[HAUT]), b = nombre(l[BAS]), c = nombre(l[CLOTURE]);
    if (![o, h, b, c].every(isFinite)) continue;
    lignesOHLC++;
    if (b - 0.01 <= o && o <= h + 0.01 && b - 0.01 <= c && c <= h + 0.01 && b <= h) lignesCoherentes++;
  }
  if (lignesOHLC === 0 || lignesCoherentes !== lignesOHLC) {
    return {
      ok: false,
      motif: `colonnes OHLC non confirmees (${lignesCoherentes}/${lignesOHLC} lignes ou bas <= ouverture/cloture <= haut)`,
    };
  }

  // Controle 2 — orientation, jugee EN MAJORITE.
  let paires = 0, suivies = 0;
  for (let i = 0; i + 1 < lignes.length; i++) {
    const o = nombre(lignes[i][OUVERTURE]);
    const cPrec = nombre(lignes[i + 1][CLOTURE]);
    if (!isFinite(o) || !isFinite(cPrec)) continue;
    paires++;
    if (Math.abs(o - cPrec) < 0.01) suivies++;
  }
  if (paires >= 5 && suivies / paires < PART_MINIMALE) {
    return {
      ok: false,
      motif: `orientation des colonnes douteuse (${suivies}/${paires} ouvertures egales a la cloture precedente,`
        + ` attendu >= ${Math.round(PART_MINIMALE * 100)} %)`,
    };
  }
  if (verbose) console.log(`    [MASI] FT : colonnes confirmees — OHLC ${lignesCoherentes}/${lignesOHLC}, enchainement ${suivies}/${paires}`);
  return { ok: true, ohlc: `${lignesCoherentes}/${lignesOHLC}`, paires: `${suivies}/${paires}` };
}

/** Le tableau FT entre deux dates, en UNE requete. FT rend toute la plage d un
 *  coup : demander jour par jour ferait soixante appels pour rien, et sur le
 *  canal a la demande cela casse la session SSH unique (lecon du lot BS). */
async function tableauFT(depuis, jusqu, verbose) {
  const xid = await identifiantInstrument(verbose);
  if (!xid) return { lignes: [], url: null };
  const url = `${AJAX}?startDate=${encodeURIComponent(fmtRequete(depuis))}`
    + `&endDate=${encodeURIComponent(fmtRequete(jusqu))}&symbol=${xid}`;
  const brut = await curlGetText(url, ['-H', `Referer: ${TEARSHEET}`, '-H', 'X-Requested-With: XMLHttpRequest']);
  return { lignes: extraireLignes(brut), url };
}

/**
 * La cloture MASI d UNE date. Rend `{ value, source, url }` ou `null`.
 * Pas de date approchante : `propagateIndRef` gere deja le rapprochement a
 * +/- 7 jours, et c est lui qui doit le faire, pas une source.
 */
async function valeurMASIviaFT(targetDate, verbose = false) {
  try {
    const cible = new Date(`${targetDate}T00:00:00Z`);
    const { lignes, url } = await tableauFT(
      new Date(cible.getTime() - 10 * 86400000), new Date(cible.getTime() + 86400000), verbose);
    const v = validerColonnes(lignes, verbose);
    if (!v.ok) { console.log(`    [MASI] FT : ${v.motif} — aucune valeur retenue`); return null; }

    const marqueur = fmtFT(targetDate);
    const ligne = lignes.find(l => l[0] && l[0].includes(marqueur));
    if (!ligne) {
      if (verbose) console.log(`    [MASI] FT : pas de seance au ${targetDate} (jour non ouvre ?)`);
      return null;
    }
    const val = nombre(ligne[CLOTURE]);
    if (!isFinite(val) || val <= PLANCHER_MASI) {
      if (verbose) console.log(`    [MASI] FT : cloture inexploitable « ${ligne[CLOTURE]} »`);
      return null;
    }
    console.log(`    [MASI] SUCCESS via FT markets MASI:CAS (cloture ${marqueur}): ${val}`);
    return { value: val, source: 'FT markets MASI:CAS (cloture)', url };
  } catch (err) {
    if (verbose) console.log(`    [MASI] FT : ERROR ${err.message}`);
    return null;
  }
}

/**
 * La serie MASI sur une plage, en UNE requete. Rend une `Map` ISO -> cloture,
 * VIDE si les colonnes ne sont pas confirmees — jamais une serie partiellement
 * fiable. C est la forme que `fix_index_tail.js` consomme.
 */
async function serieMASIviaFT(depuisISO, jusquISO, verbose = false) {
  const serie = new Map();
  try {
    const { lignes } = await tableauFT(
      new Date(`${depuisISO}T00:00:00Z`), new Date(`${jusquISO}T00:00:00Z`), verbose);
    const v = validerColonnes(lignes, verbose);
    if (!v.ok) { console.log(`    [MASI] FT : ${v.motif} — SERIE REFUSEE EN ENTIER`); return serie; }

    // Le marqueur de date est reconstruit depuis la cellule, pas devine :
    // « Aug 29, 2026 » -> « 2026-08-29 ». Une cellule non reconnue est ignoree,
    // jamais interpretee.
    for (const l of lignes) {
      const m = /([A-Z][a-z]{2})\s+(\d{1,2}),\s*(\d{4})/.exec(l[0] || '');
      if (!m) continue;
      const mois = MOIS.indexOf(m[1]);
      if (mois < 0) continue;
      const iso = `${m[3]}-${String(mois + 1).padStart(2, '0')}-${String(m[2]).padStart(2, '0')}`;
      const val = nombre(l[CLOTURE]);
      if (!isFinite(val) || val <= PLANCHER_MASI) continue;
      serie.set(iso, val);
    }
    if (verbose) console.log(`    [MASI] FT : ${serie.size} seance(s) entre ${depuisISO} et ${jusquISO}`);
  } catch (err) {
    console.log(`    [MASI] FT : ERROR ${err.message} — serie vide`);
  }
  return serie;
}

module.exports = {
  valeurMASIviaFT,
  serieMASIviaFT,
  // Exportes pour les diagnostics et les tests : la validation doit pouvoir
  // etre exercee sans appel reseau.
  validerColonnes,
  extraireLignes,
  PLANCHER_MASI,
  PART_MINIMALE,
};
