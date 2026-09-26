/**
 * Budgets de fraicheur des VL, par pays — source unique.
 *
 * POURQUOI CE MODULE. Ces seuils vivaient en double : dans
 * `scripts/diag/check_doc_drift.js` et, sous une autre forme (7 j / 30 j pour
 * tout le monde), dans `scripts/monitoring/check_cron_health.js`. Les deux
 * repondaient donc differemment a la meme question. Le 2026-08-21, le Nigeria
 * etait a 29 jours de retard : le controle de derive le declarait en ECHEC, le
 * controle de sante le declarait « VL a jour ». Deux verites contradictoires
 * publiees la meme nuit, dans deux fichiers que personne ne comparait.
 *
 * Un seuil duplique finit toujours par diverger. Celui-ci ne vit qu ici.
 *
 * CALIBRATION — chaque budget est cale sur la CADENCE NOMINALE de la chaine
 * d import, pas sur le pire retard deja observe. Un seuil cale sur l accident
 * passe cesse de mesurer : le Nigeria a longtemps porte 45 jours parce que la
 * SEC avait accumule plusieurs semaines en mai 2026, et ce seuil aurait laisse
 * passer un arret de quatre semaines sans rien dire.
 */

const FRESHNESS = {
  // Import ASFIM quotidien (lun-ven). Un week-end plus un jour ferie = 4 j.
  MAROC:   { days: 6,   level: 'CRITIQUE' },
  // Import BRVM quotidien (lun-ven).
  UEMOA:   { days: 6,   level: 'CRITIQUE' },
  // Import CMF quotidien, publication tunisienne parfois decalee de 2-3 j.
  TUNISIE: { days: 9,   level: 'CRITIQUE' },
  // Chaine hebdomadaire : publication SEC le vendredi, import le lundi. Un
  // retard sain ne depasse jamais une dizaine de jours.
  NIGERIA: { days: 14,  level: 'CRITIQUE' },
  // Aucune chaine d import n a jamais tourne. Le budget large evite de crier
  // chaque jour sur un manque connu et documente ; il ne le legitime pas.
  CEMAC:   { days: 400, level: 'AVERTISSEMENT' },
};

const FRESHNESS_DEFAULT = { days: 30, level: 'AVERTISSEMENT' };

function budgetPour(pays) {
  if (!pays) return FRESHNESS_DEFAULT;
  return FRESHNESS[String(pays).toUpperCase()] ?? FRESHNESS_DEFAULT;
}

module.exports = { FRESHNESS, FRESHNESS_DEFAULT, budgetPour };
