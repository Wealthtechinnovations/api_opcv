const moment = require('moment');

/**
 * Calcul des rendements journaliers à partir de valeurs.
 * @param {number[]} values - Tableau de valeurs
 * @returns {number[]} Tableau de rendements
 */
const CalculateRendJournalier = (values) => {
  const rendements = [];
  for (let i = 1; i < values.length; i++) {
    rendements.push((values[i] - values[i - 1]) / values[i - 1]);
  }
  return rendements;
};

/**
 * Calcul des rendements hebdomadaires.
 * @param {number[][]} values - Valeurs groupées par semaine
 * @returns {number[]} Rendements hebdomadaires
 */
const CalculateRendHebdo = (values) => {
  const rendements = [];
  for (let i = 1; i < values.length - 1; i++) {
    rendements.push((values[i - 1][0] - values[i][0]) / values[i][0]);
  }
  return rendements;
};

/**
 * Calcul des rendements mensuels.
 * @param {number[][]} valuesMonth - Valeurs groupées par mois
 * @returns {number[]} Rendements mensuels
 */
const CalculateRendMensuel = (valuesMonth) => {
  const rendements = [];
  valuesMonth.forEach((el, index) => {
    if (index === 0) {
      rendements.push((el[el.length - 1] - el[0]) / el[0]);
    } else {
      rendements.push((el[0] - valuesMonth[index - 1][0]) / valuesMonth[index - 1][0]);
    }
  });
  return rendements;
};

/**
 * Grouper des données par jour (garder la dernière valeur par jour).
 */
function grouperParJour(data) {
  const grouped = {};
  data.forEach(d => {
    const date = moment(d.date, 'YYYY-MM-DD').format('YYYY-MM-DD');
    if (!grouped[date] || moment(d.date, 'YYYY-MM-DD').isAfter(moment(grouped[date].date, 'YYYY-MM-DD'))) {
      grouped[date] = d;
    }
  });
  return Object.values(grouped);
}

/**
 * Grouper des données par semaine (garder la dernière valeur par semaine).
 */
function grouperParSemaine(data) {
  const grouped = {};
  data.forEach(d => {
    const date = moment(d.date, 'YYYY-MM-DD');
    const weekEnd = date.clone().endOf('week').format('YYYY-MM-DD');
    if (!grouped[weekEnd] || moment(d.date, 'YYYY-MM-DD').isAfter(moment(grouped[weekEnd].date, 'YYYY-MM-DD'))) {
      grouped[weekEnd] = d;
    }
  });
  return Object.values(grouped);
}

/**
 * Grouper des données par mois (garder la dernière valeur par mois).
 */
function grouperParMois(data) {
  const grouped = {};
  data.forEach(d => {
    const date = moment(d.date, 'YYYY-MM-DD');
    const monthEnd = date.clone().endOf('month').format('YYYY-MM-DD');
    if (!grouped[monthEnd] || moment(d.date, 'YYYY-MM-DD').isAfter(moment(grouped[monthEnd].date, 'YYYY-MM-DD'))) {
      grouped[monthEnd] = d;
    }
  });
  return Object.values(grouped);
}

/**
 * Grouper des données par année (garder la dernière valeur par année).
 */
function grouperParAnnee(data) {
  const grouped = {};
  data.forEach(d => {
    const date = moment(d.date, 'YYYY-MM-DD');
    const yearEnd = date.clone().endOf('year').format('YYYY-MM-DD');
    if (!grouped[yearEnd] || moment(d.date, 'YYYY-MM-DD').isAfter(moment(grouped[yearEnd].date, 'YYYY-MM-DD'))) {
      grouped[yearEnd] = d;
    }
  });
  return Object.values(grouped);
}

/**
 * Calculer les rendements à partir de données {date, value}.
 */
function calculerRendements(data) {
  const rendements = [];
  for (let i = 1; i < data.length; i++) {
    const valeurActuelle = parseFloat(data[i - 1].value);
    const valeurPrecedente = parseFloat(data[i].value);
    rendements.push((valeurActuelle / valeurPrecedente) - 1);
  }
  return rendements;
}

/**
 * Convertir un identifiant semaine (YYYY-WW) en date de fin de semaine.
 */
function grouperTauxParSemaine(data) {
  const [year, week] = data.split('-').map(Number);
  const date = moment().year(year).isoWeek(week).endOf('isoWeek');

  // Exclure les week-ends
  if (date.isoWeekday() === 6) {
    date.subtract(1, 'days');
  } else if (date.isoWeekday() === 7) {
    date.subtract(2, 'days');
  }

  return date.format('YYYY-MM-DD');
}

module.exports = {
  CalculateRendHebdo,
  CalculateRendMensuel,
  CalculateRendJournalier,
  calculerRendements,
  grouperParAnnee,
  grouperParMois,
  grouperParSemaine,
  grouperParJour,
  grouperTauxParSemaine,
};
