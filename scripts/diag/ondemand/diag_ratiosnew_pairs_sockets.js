/**
 * `ratiosnew` attend un socket : QUEL pair, et sur quel port ?
 *
 * SEPT HYPOTHESES REFUTEES AVANT CELLE-CI, toutes par la mesure : le volume (un
 * fonds a 20 VL pend autant qu un fonds a 311), l index pose le 29/10 (quatre
 * routes lisant `valorisations` repondent en 0,5 a 3,2 s), le N+1 sur `tsr`
 * (2,2 ms l appel, et garde par `if (year === "1")` donc jamais execute ici),
 * une boucle infinie (la date y avance bien), le CPU JavaScript (83,2 %
 * `(idle)` au profil), une requete SQL lente (0 requete active sur vingt
 * echantillons), et le pool de connexions (8 sur 20, et `acquire` plafonne a
 * 30 s quand le blocage dure 120 s).
 *
 * CE QUI RESTE, ET LA LIMITE DE LA DERNIERE MESURE.
 * `getActiveResourcesInfo()` a rendu, au moment du blocage :
 *   {"PipeWrap":3,"TCPServerWrap":1,"TCPSocketWrap":3,"Timeout":2}
 * Trois sockets vivants — mais DEUX sont la requete HTTP de la sonde vers
 * elle-meme, cote client et cote serveur. Il en reste UN non explique, et deux
 * minuteries. `getActiveResourcesInfo()` ne rend que des TYPES, pas les adresses
 * des pairs : cela resserre, cela ne tranche pas.
 *
 * CE SCRIPT TRANCHE. Il lit les sockets du processus `api-monolith` LUI-MEME,
 * en production, avant puis pendant qu une requete `ratiosnew` pend, et NOMME
 * chaque pair :
 *   - un pair sur le port 3306 → connexion a la base jamais rendue ;
 *   - un pair externe → appel sortant sans delai d expiration ;
 *   - aucun socket nouveau → le blocage n est pas reseau du tout, et il faut
 *     alors revenir aux deux minuteries.
 *
 * Ces trois issues appellent trois corrections differentes. C est pourquoi il
 * faut la mesurer et non la deviner — j ai devine sept fois.
 *
 * METHODE, PRECISE PAR CONSTRUCTION. `/proc/net/tcp` liste les sockets de tout
 * l espace de noms reseau, pas ceux d un processus. On croise donc les INODES :
 * `/proc/<pid>/fd/*` rend les inodes des sockets detenus par api-monolith, et
 * `/proc/net/tcp` les adresses par inode. Seuls les sockets de CE processus sont
 * retenus — sans ce croisement, on attribuerait a la route les connexions de
 * n importe quel autre service.
 *
 * LECTURE SEULE : lecture de `/proc`, et un GET sur l API locale. Aucune
 * ecriture, aucune modification de code, aucun signal envoye au processus.
 *
 * USAGE  node scripts/diag/ondemand/diag_ratiosnew_pairs_sockets.js
 */
const fs = require('fs');
const http = require('http');
const path = require('path');

const PORT = process.env.PORT || 3005;
const CIBLE = '/api/ratiosnew/2026/1141';
const SECONDES = 14;
const dors = ms => new Promise(r => setTimeout(r, ms));

/** « 0100007F:0CEA » → « 127.0.0.1:3306 ». Les octets sont en ordre inverse. */
const decode = hex => {
  const [a, p] = hex.split(':');
  const port = parseInt(p, 16);
  if (a.length === 8) {
    const o = a.match(/../g).reverse().map(h => parseInt(h, 16));
    return `${o.join('.')}:${port}`;
  }
  // IPv6, souvent une adresse v4 encapsulee : on garde les quatre derniers octets.
  const o = a.slice(-8).match(/../g).reverse().map(h => parseInt(h, 16));
  return `${o.join('.')}:${port}  [v6]`;
};

const ETATS = { '01': 'ESTABLISHED', '02': 'SYN_SENT', '03': 'SYN_RECV', '06': 'TIME_WAIT',
  '08': 'CLOSE_WAIT', '0A': 'LISTEN' };

const socketsDe = pid => {
  // 1. les inodes de socket detenus par le processus
  const inodes = new Set();
  let fds;
  try { fds = fs.readdirSync(`/proc/${pid}/fd`); } catch { return null; }
  for (const fd of fds) {
    try {
      const l = fs.readlinkSync(`/proc/${pid}/fd/${fd}`);
      const m = l.match(/^socket:\[(\d+)\]$/);
      if (m) inodes.add(m[1]);
    } catch { /* fd disparu entre-temps */ }
  }
  // 2. les adresses, par inode
  const out = [];
  for (const f of ['/proc/net/tcp', '/proc/net/tcp6']) {
    let txt;
    try { txt = fs.readFileSync(f, 'utf8'); } catch { continue; }
    for (const l of txt.split('\n').slice(1)) {
      const c = l.trim().split(/\s+/);
      if (c.length < 10) continue;
      if (!inodes.has(c[9])) continue;
      out.push({ local: decode(c[1]), pair: decode(c[2]),
        etat: ETATS[c[3]] || c[3], inode: c[9] });
    }
  }
  return out;
};

(async () => {
  console.log('=== ratiosnew : QUEL PAIR LE PROCESSUS ATTEND-IL ? ===');
  console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — LECTURE SEULE\n`);

  // ---- 1. Trouver api-monolith, sans supposer son PID ---------------
  console.log('## 1. LE PROCESSUS api-monolith');
  let pid = null;
  for (const d of fs.readdirSync('/proc')) {
    if (!/^\d+$/.test(d)) continue;
    try {
      const cmd = fs.readFileSync(`/proc/${d}/cmdline`, 'utf8').replace(/\0/g, ' ');
      if (/api-monolith|app\.js/.test(cmd) && !/diag_|sonde/.test(cmd)) {
        pid = d;
        console.log(`  pid ${d} — ${cmd.trim().slice(0, 96)}`);
        break;
      }
    } catch { /* processus disparu */ }
  }
  if (!pid) {
    console.log('  INTROUVABLE. Sans le pid, les sockets ne peuvent pas etre attribues :');
    console.log('  ne rien conclure. Verifier `pm2 list` et le nom du processus.');
    process.exitCode = 2;
    return;
  }

  // ---- 2. Ligne de base AVANT la requete ----------------------------
  const avant = socketsDe(pid);
  if (!avant) {
    console.log(`  /proc/${pid}/fd illisible (droits insuffisants). Ne rien conclure.`);
    process.exitCode = 2;
    return;
  }
  const clef = s => `${s.local}>${s.pair}`;
  const vusAvant = new Set(avant.map(clef));
  console.log(`\n## 2. AVANT LA REQUETE — ${avant.length} socket(s)`);
  const parPort = {};
  for (const s of avant) {
    const p = s.pair.split(':')[1];
    parPort[p] = (parPort[p] || 0) + 1;
  }
  for (const [p, n] of Object.entries(parPort).sort((a, b) => b[1] - a[1]).slice(0, 8)) {
    console.log(`  port pair ${String(p).padEnd(8)} ${n} socket(s)`);
  }

  // ---- 3. Lancer la requete, puis regarder ce qui APPARAIT ----------
  console.log(`\n## 3. PENDANT ${CIBLE}`);
  let fini = null;
  const t0 = Date.now();
  const req = http.get({ host: '127.0.0.1', port: PORT, path: CIBLE, timeout: 130000 }, res => {
    res.resume();
    res.on('end', () => { fini = { code: res.statusCode, s: (Date.now() - t0) / 1000 }; });
  });
  req.on('error', e => { fini = { code: `ERREUR ${e.message}`, s: (Date.now() - t0) / 1000 }; });
  req.on('timeout', () => req.destroy(new Error('delai local')));

  const nouveaux = new Map();
  for (let t = 1; t <= SECONDES; t++) {
    await dors(1000);
    const maintenant = socketsDe(pid) || [];
    for (const s of maintenant) {
      if (vusAvant.has(clef(s))) continue;
      const k = clef(s);
      if (!nouveaux.has(k)) nouveaux.set(k, { ...s, vuA: t, vuPendant: 0 });
      nouveaux.get(k).vuPendant++;
      nouveaux.get(k).etat = s.etat;
    }
    if (fini) break;
  }
  req.destroy();

  console.log(`  ${nouveaux.size} socket(s) APPARU(S) pendant la requete :`);
  if (nouveaux.size) {
    console.log(`  ${'local'.padEnd(24)}${'pair'.padEnd(26)}${'etat'.padEnd(13)}${'vu'.padStart(4)}s`);
    for (const s of [...nouveaux.values()].sort((a, b) => b.vuPendant - a.vuPendant)) {
      console.log(`  ${s.local.padEnd(24)}${s.pair.padEnd(26)}${s.etat.padEnd(13)}${String(s.vuPendant).padStart(4)}`);
    }
  }

  // ---- 4. Le verdict, et il a trois formes --------------------------
  console.log('\n## 4. VERDICT');
  const liste = [...nouveaux.values()];
  const versDB = liste.filter(s => /:3306(\s|$)/.test(s.pair));
  const horsMachine = liste.filter(s => !/^127\.0\.0\.1:|^0\.0\.0\.0:/.test(s.pair)
    && !/:3306(\s|$)/.test(s.pair));
  if (versDB.length) {
    console.log(`  → ${versDB.length} socket(s) vers le port 3306 ouvert(s) pendant la requete et`);
    console.log('    maintenu(s). La route attend la BASE : une connexion prise et jamais');
    console.log('    rendue. Le pool n etait pas sature AVANT la requete — c est la requete');
    console.log('    elle-meme qui retient. Chercher un `await` de requete sans `finally`,');
    console.log('    ou une transaction ouverte sans `commit` ni `rollback`.');
  } else if (horsMachine.length) {
    console.log(`  → ${horsMachine.length} socket(s) vers un pair HORS de cette machine :`);
    for (const s of horsMachine.slice(0, 6)) console.log(`      ${s.pair}  ${s.etat}`);
    console.log('    La route attend le RESEAU. Un appel sortant sans delai d expiration');
    console.log('    pend jusqu au delai de la passerelle. Identifier l appelant et lui');
    console.log('    donner un `timeout` — jamais allonger le delai de la passerelle.');
  } else if (!liste.length) {
    console.log('  → AUCUN socket nouveau. Le blocage n est donc PAS reseau, et il faut');
    console.log('    revenir aux deux `Timeout` releves par la sonde : une minuterie tient');
    console.log('    la requete ouverte sans la faire avancer.');
    console.log('    Ne pas conclure a une attente reseau faute de mieux : cette mesure');
    console.log('    l ecarte explicitement.');
  } else {
    console.log('  → sockets nouveaux uniquement en local et hors 3306 : probablement la');
    console.log('    requete HTTP de ce script. Lire le tableau avant de conclure.');
  }
  console.log(fini ? `\n  reponse HTTP : ${fini.code} apres ${fini.s}s`
    : `\n  la requete pendait toujours apres ${SECONDES}s.`);
  console.log('\n=== FIN — aucune ecriture effectuee ===');
})().catch(e => { console.error('ECHEC :', e.message); process.exit(1); });
