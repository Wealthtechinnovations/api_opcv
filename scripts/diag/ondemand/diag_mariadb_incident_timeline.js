/**
 * Timeline read-only des incidents MariaDB recents.
 *
 * Objectif:
 * - attribuer une indisponibilite a un evenement observe (OOM, stop/start,
 *   crash systemd) au lieu de deduire la cause depuis un ECONNREFUSED;
 * - conserver une vue reutilisable des 14 derniers jours;
 * - isoler la fenetre 2026-09-21 -> 2026-09-22.
 *
 * LECTURE SEULE: journalctl, systemctl show, /proc, ss.
 * Aucun SQL d'ecriture, aucun restart, aucun changement de configuration.
 *
 * Usage:
 *   node scripts/diag/ondemand/diag_mariadb_incident_timeline.js
 */
"use strict";

const fs = require("fs");
const { execFileSync } = require("child_process");

const MAX_BUFFER = 12 * 1024 * 1024;

function exec(cmd, args) {
  try {
    return execFileSync(cmd, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: MAX_BUFFER,
    }).trim();
  } catch (e) {
    const stdout = e && e.stdout ? String(e.stdout).trim() : "";
    const stderr = e && e.stderr ? String(e.stderr).trim() : "";
    return [stdout, stderr].filter(Boolean).join("\n");
  }
}

function printBlock(title, body) {
  console.log("\n--- " + title + " ---");
  console.log(body && body.trim() ? body.trim() : "(aucune ligne)");
}

function grepLines(text, regex, limit) {
  const rows = String(text || "")
    .split("\n")
    .filter(function (line) { return regex.test(line); });
  const n = typeof limit === "number" ? limit : 250;
  return rows.slice(Math.max(0, rows.length - n)).join("\n");
}

function procValue(pid, key) {
  try {
    const txt = fs.readFileSync("/proc/" + pid + "/status", "utf8");
    const line = txt.split("\n").find(function (l) { return l.indexOf(key + ":") === 0; });
    return line ? line.split(/\s+/)[1] : "NA";
  } catch (e) {
    return "NA";
  }
}

function smapsValue(pid, key) {
  try {
    const txt = fs.readFileSync("/proc/" + pid + "/smaps_rollup", "utf8");
    const line = txt.split("\n").find(function (l) { return l.indexOf(key + ":") === 0; });
    return line ? line.split(/\s+/)[1] : "NA";
  } catch (e) {
    return "NA";
  }
}

console.log("\n=== MARIADB — TIMELINE INCIDENTS RECENTS (LECTURE SEULE) ===");
console.log("Mesure le " + new Date().toISOString() + "\n");

const service = exec("systemctl", [
  "show", "mariadb",
  "-p", "ActiveState",
  "-p", "SubState",
  "-p", "Result",
  "-p", "NRestarts",
  "-p", "Restart",
  "-p", "ExecMainPID",
  "-p", "ExecMainStartTimestamp",
  "-p", "ActiveEnterTimestamp",
  "-p", "StateChangeTimestamp",
  "-p", "MemoryCurrent",
]);
printBlock("etat systemd courant", service);

const pidRaw = exec("pgrep", ["-xo", "mariadbd"]);
const pid = /^\d+$/.test(pidRaw) ? pidRaw : "";
if (pid) {
  const etimes = exec("ps", ["-o", "etimes=", "-p", pid]).trim() || "NA";
  const rss = procValue(pid, "VmRSS");
  const anon = procValue(pid, "RssAnon");
  const swap = procValue(pid, "VmSwap");
  const dirty = smapsValue(pid, "Private_Dirty");
  console.log("\n--- processus mariadbd courant ---");
  console.log(
    "MARIADB_PROCESS pid=" + pid +
    " uptime_s=" + etimes +
    " rss_kb=" + rss +
    " rssanon_kb=" + anon +
    " private_dirty_kb=" + dirty +
    " swap_kb=" + swap
  );
} else {
  console.log("\n--- processus mariadbd courant ---");
  console.log("MARIADB_PROCESS=ABSENT");
}

const sockets = exec("ss", ["-ltnp"]);
printBlock(
  "listener TCP 3306 courant",
  grepLines(sockets, /(?:127\.0\.0\.1|0\.0\.0\.0|\[::\]).*:3306\b|:3306\b/, 20)
);

const lifecycle14d = exec("journalctl", [
  "-u", "mariadb",
  "--since", "14 days ago",
  "--no-pager",
  "-o", "short-iso",
]);
printBlock(
  "mariadb.service — evenements significatifs sur 14 jours",
  grepLines(
    lifecycle14d,
    /Started MariaDB|Stopped MariaDB|Stopping MariaDB|Failed with result|Main process exited|oom-kill|Killed|ready for connections|Shutdown complete|signal=/i,
    300
  )
);

const kernel14d = exec("journalctl", [
  "-k",
  "--since", "14 days ago",
  "--no-pager",
  "-o", "short-iso",
]);
const kernelOom14d = grepLines(
  kernel14d,
  /out of memory|oom-kill|killed process .*mariadbd|invoked oom-killer/i,
  250
);
printBlock("kernel — OOM sur 14 jours", kernelOom14d);

const windowStart = "2026-09-21 09:30:00";
const windowEnd = "2026-09-22 11:30:00";

const serviceWindow = exec("journalctl", [
  "-u", "mariadb",
  "--since", windowStart,
  "--until", windowEnd,
  "--no-pager",
  "-o", "short-iso",
]);
printBlock(
  "fenetre cible 2026-09-21 09:30 -> 2026-09-22 11:30 — service",
  grepLines(
    serviceWindow,
    /Started MariaDB|Stopped MariaDB|Stopping MariaDB|Failed with result|Main process exited|oom-kill|Killed|ready for connections|Shutdown complete|signal=|Out of memory/i,
    300
  )
);

const kernelWindow = exec("journalctl", [
  "-k",
  "--since", windowStart,
  "--until", windowEnd,
  "--no-pager",
  "-o", "short-iso",
]);
const kernelWindowOom = grepLines(
  kernelWindow,
  /out of memory|oom-kill|killed process .*mariadbd|invoked oom-killer/i,
  200
);
printBlock(
  "fenetre cible 2026-09-21 09:30 -> 2026-09-22 11:30 — kernel OOM",
  kernelWindowOom
);

const sep21MariadbKilled = /killed process .*\(mariadbd\)/i.test(kernelWindowOom);
const sep21OomGeneric = /out of memory|oom-kill/i.test(kernelWindowOom);
const sep21ServiceFailure = /Failed with result|Main process exited/i.test(serviceWindow);
const sep21Restart = /Started MariaDB|ready for connections/i.test(serviceWindow);

console.log("\n=== CLASSIFICATION BORNEE DE LA FENETRE 21/09 ===");
console.log("SEP21_MARIADB_OOM_PROVEN=" + (sep21MariadbKilled ? "YES" : "NO"));
console.log("SEP21_KERNEL_OOM_PRESENT=" + (sep21OomGeneric ? "YES" : "NO"));
console.log("SEP21_MARIADB_SERVICE_FAILURE_PRESENT=" + (sep21ServiceFailure ? "YES" : "NO"));
console.log("SEP21_MARIADB_START_OR_READY_PRESENT=" + (sep21Restart ? "YES" : "NO"));

if (!sep21MariadbKilled && !sep21OomGeneric) {
  console.log(
    "NOTE=Absence de preuve OOM dans le journal kernel retenu pour cette fenetre. " +
    "Cela ne prouve pas que la DB etait saine; les ECONNREFUSED restent a attribuer."
  );
}

console.log("\n=== FIN — AUCUNE MUTATION ===\n");
