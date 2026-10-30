/**
 * Le snapshot runtime VIVANT, celui qui est hors du depot.
 *
 * POURQUOI CE SCRIPT EXISTE, et c est une correction de regle plus que de code.
 *
 * Les deux `CLAUDE.md` ordonnaient a chaque session de lire
 * `PRODUCTION_STATE.json` **du depot** et de le considerer comme « la source de
 * verite sur l etat de production », generee par un cron horaire. Mesure du
 * 2026-10-30 : cette copie est figee a `generated_at: 2026-08-02T14:00Z`, soit
 * **89 jours**. Une session suivant la regle a la lettre prenait des donnees
 * d aout pour l etat du jour.
 *
 * La production n etait pas en panne : elle avait CHANGE DE CONCEPTION.
 * `scripts/deploy/sync_production.sh` declare desormais qu il « n effectue
 * AUCUN git add, commit, push » et ecrit le snapshot HORS du working tree. C est
 * le remede de GOV-006, l incident ou les commits automatiques de S2 provenaient
 * precisement de ce snapshot horaire. Restaurer le commit recreerait l incident
 * resolu — seule la regle devait etre corrigee, et elle l a ete.
 *
 * Restait un trou : la regle corrigee pointe vers un fichier qu aucune session
 * ne pouvait VOIR, puisqu il vit sur S2 et hors de Git. Ce script le comble. Il
 * s execute sur S2 par le canal a la demande, lit le snapshot, et en ramene la
 * substance dans `docs/DIAG_ONDEMAND.md`.
 *
 * LIRE N EST PAS COMMITER. Le snapshot reste hors du depot ; seule sa LECTURE
 * revient, par le canal de diagnostic, dont les commits sont faits par le
 * workflow GitHub et non par S2. GOV-006 n est pas recree.
 *
 * CE QU IL IMPRIME EN PREMIER, ET POURQUOI. L AGE du snapshot, avant son
 * contenu. Un snapshot de six heures et un snapshot de trois mois se lisent de
 * la meme facon et ne valent pas la meme chose — c est exactement ce qui a
 * permis a la copie du depot de mentir pendant 89 jours.
 *
 * LECTURE SEULE : lecture d un fichier JSON. Aucune requete SQL, aucune
 * ecriture.
 *
 * USAGE  node scripts/diag/ondemand/diag_runtime_state_vivant.js
 */
const fs = require('fs');
const path = require('path');

// Meme defaut que `sync_production.sh`, et meme variable d environnement : si
// l un change, l autre doit changer avec lui.
const DOSSIER = process.env.FUNDAFRICA_RUNTIME_STATE_DIR || '/var/lib/fundafrica/runtime';
const VIVANT = path.join(DOSSIER, 'PRODUCTION_STATE.json');
const HISTORIQUE = path.resolve(__dirname, '../../../PRODUCTION_STATE.json');

const age = iso => {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return (Date.now() - t) / 3600000;
};

(async () => {
  console.log('=== SNAPSHOT RUNTIME VIVANT (hors depot) ===');
  console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — LECTURE SEULE\n`);

  // ---- 1. L age d abord, le contenu ensuite -------------------------
  console.log(`## 1. LE SNAPSHOT VIVANT\n  ${VIVANT}`);
  if (!fs.existsSync(VIVANT)) {
    console.log('  ABSENT.');
    console.log('  → soit `sync_production.sh` ne tourne plus, soit il ecrit ailleurs.');
    console.log('    Verifier le crontab de S2 et `$FUNDAFRICA_RUNTIME_STATE_DIR` AVANT');
    console.log('    de conclure quoi que ce soit sur l etat de la production : un');
    console.log('    snapshot absent ne dit rien de la production, seulement de sa mesure.');
    process.exitCode = 2;
    return;
  }
  const st = fs.statSync(VIVANT);
  let d;
  try { d = JSON.parse(fs.readFileSync(VIVANT, 'utf8')); }
  catch (e) {
    console.log(`  ILLISIBLE : ${e.message.slice(0, 70)}`);
    console.log('  → le fichier existe mais n est pas du JSON valide. Ne rien en deduire.');
    process.exitCode = 2;
    return;
  }
  const hDecl = age(d.generated_at);
  const hFichier = (Date.now() - st.mtimeMs) / 3600000;
  console.log(`  ${(st.size / 1024).toFixed(1)} Ko`);
  console.log(`  generated_at declare : ${d.generated_at || '(absent)'}`
    + `${hDecl == null ? '' : `  — ${hDecl.toFixed(1)} h`}`);
  console.log(`  derniere ecriture du fichier : ${st.mtime.toISOString().slice(0, 16).replace('T', ' ')}`
    + `  — ${hFichier.toFixed(1)} h`);
  // Un ecart entre les deux signale une ecriture qui a echoue a mi-chemin.
  if (hDecl != null && Math.abs(hDecl - hFichier) > 2) {
    console.log('  ATTENTION : la date declaree et la date du fichier divergent de plus de');
    console.log('  deux heures. Une ecriture a pu echouer apres avoir touche le fichier.');
  }
  console.log(hDecl == null ? '  → age indeterminable : traiter le contenu avec prudence.'
    : hDecl <= 2 ? '  → FRAIS (cron horaire). Utilisable comme etat courant.'
    : hDecl <= 26 ? `  → ${hDecl.toFixed(0)} h : utilisable, mais le citer avec sa date.`
    : `  → PERIME (${(hDecl / 24).toFixed(0)} jours). NE PAS le citer comme l etat courant ;`
      + '\n    verifier d abord que le cron horaire tourne encore sur S2.');

  // ---- 2. La substance -----------------------------------------------
  console.log('\n## 2. CE QU IL CONTIENT');
  const bloc = (titre, v) => {
    if (v == null) return;
    console.log(`\n  ${titre}`);
    if (typeof v !== 'object') { console.log(`    ${v}`); return; }
    for (const [k, val] of Object.entries(v).slice(0, 14)) {
      const t = val === null ? 'null'
        : typeof val === 'object' ? JSON.stringify(val).slice(0, 96)
        : String(val).slice(0, 96);
      console.log(`    ${String(k).slice(0, 30).padEnd(32)}${t}`);
    }
  };
  bloc('derniere VL par pays', d.derniere_vl_par_pays);
  bloc('PM2', d.pm2_status);
  bloc('git API', d.git_api);
  bloc('git frontend', d.git_frontend);
  bloc('indices de reference', d.indices_references_stats);
  bloc('performances', d.performances_stats);
  if (d.tables && typeof d.tables === 'object') {
    const t = Object.entries(d.tables);
    console.log(`\n  tables : ${t.length} | les 10 plus volumineuses`);
    for (const [n, v] of t
      .map(([n, v]) => [n, typeof v === 'object' && v ? (v.rows ?? v.count ?? v) : v])
      .filter(([, v]) => Number.isFinite(Number(v)))
      .sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, 10)) {
      console.log(`    ${String(n).slice(0, 34).padEnd(36)}${String(v).padStart(12)}`);
    }
  }
  const connues = new Set(['generated_at', 'derniere_vl_par_pays', 'pm2_status', 'git_api',
    'git_frontend', 'indices_references_stats', 'performances_stats', 'tables']);
  const autres = Object.keys(d).filter(k => !connues.has(k));
  if (autres.length) console.log(`\n  autres cles presentes : ${autres.join(', ')}`);

  // ---- 3. La copie du depot, et ce qu elle n est pas -----------------
  console.log('\n## 3. LA COPIE DU DEPOT — FALLBACK HISTORIQUE, PAS L ETAT COURANT');
  if (!fs.existsSync(HISTORIQUE)) {
    console.log('  absente du depot.');
  } else {
    try {
      const h = JSON.parse(fs.readFileSync(HISTORIQUE, 'utf8'));
      const hh = age(h.generated_at);
      console.log(`  generated_at : ${h.generated_at || '(absent)'}`
        + `${hh == null ? '' : `  — ${(hh / 24).toFixed(0)} jours`}`);
      console.log('  Elle n est plus rafraichie ni commitee depuis S2 : c est le remede de');
      console.log('  GOV-006, ou les commits automatiques du serveur venaient de ce snapshot.');
      console.log('  Elle garde une valeur d ARCHIVE. Ne jamais la citer comme l etat du jour.');
      if (hh != null && hDecl != null) {
        console.log(`\n  ecart entre les deux : ${((hh - hDecl) / 24).toFixed(0)} jours.`);
        console.log('  C est exactement la quantite d erreur qu une session commettait en');
        console.log('  suivant l ancienne regle a la lettre.');
      }
    } catch { console.log('  presente mais illisible.'); }
  }
  console.log('\n=== FIN — aucune ecriture effectuee ===');
})().catch(e => { console.error('ECHEC :', e.message); process.exit(1); });
