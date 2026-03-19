const { startOfWeek, startOfMonth, startOfYear, isWeekend } = require('date-fns');

// =============================================
// Helper: Find nearest date in array
// =============================================

/**
 * Trouve la date la plus proche (avant) d'une date cible dans un tableau.
 * @param {string[]} arrayOfDates - Tableau de dates au format 'YYYY-MM-DD'
 * @param {Date} targetDate - Date cible
 * @returns {string|null} Date au format 'YYYY-MM-DD' ou null
 */
function findNearestDateBefore(arrayOfDates, targetDate) {
  const dateObjects = arrayOfDates.map(d => new Date(d));

  // Chercher la date exacte
  const exact = dateObjects.find(d => d.getTime() === targetDate.getTime());
  if (exact) return exact.toISOString().slice(0, 10);

  // Chercher la plus proche avant
  const before = dateObjects.filter(d => d.getTime() < targetDate.getTime());
  if (before.length > 0) {
    const nearest = before.reduce((acc, curr) => curr.getTime() > acc.getTime() ? curr : acc);
    return nearest.toISOString().slice(0, 10);
  }

  return null;
}

// =============================================
// Date Finding Functions
// =============================================

/**
 * Trouve la date il y a N années par rapport à dateToFind.
 */
const findNearestDateAnnualized = (arrayOfDates, year, dateToFind) => {
  const target = new Date(dateToFind);
  target.setFullYear(target.getFullYear() - year);

  const result = findNearestDateBefore(arrayOfDates, target);
  if (result) return result;

  // Fallback: dernière date du mois précédent
  return findLastDateOfPreviousMonth(arrayOfDates);
};

/**
 * Trouve la date il y a N mois par rapport à dateToFind.
 */
const findNearestDateMonthlized = (arrayOfDates, months, dateToFind) => {
  const target = new Date(dateToFind);
  target.setMonth(target.getMonth() - months);

  const result = findNearestDateBefore(arrayOfDates, target);
  if (result) return result;

  // Fallback: dernière date du tableau
  const dateObjects = arrayOfDates.map(d => new Date(d));
  return dateObjects[dateObjects.length - 1].toISOString().slice(0, 10);
};

/**
 * Trouve la dernière date du mois précédent dans le tableau.
 */
const findLastDateOfPreviousMonth = (arrayOfDates) => {
  const dateObjects = arrayOfDates.map(d => new Date(d));
  const lastDate = new Date(Math.max(...dateObjects));
  const lastDateOfPrevMonth = new Date(lastDate.getFullYear(), lastDate.getMonth(), 0);

  const result = findNearestDateBefore(arrayOfDates, lastDateOfPrevMonth);
  if (result) return result;
  return lastDate.toISOString().slice(0, 10);
};

/**
 * Trouve la date il y a N années par rapport à la dernière date du tableau.
 */
const findNearestDate = (arrayOfDates, year) => {
  const dateObjects = arrayOfDates.map(d => new Date(d));
  const lastDate = dateObjects[dateObjects.length - 1];
  const target = new Date(lastDate);
  target.setFullYear(target.getFullYear() - year);

  const result = findNearestDateBefore(arrayOfDates, target);
  if (result) return result;
  return lastDate.toISOString().slice(0, 10);
};

/**
 * Comme findNearestDate mais retourne null si aucune date trouvée.
 */
const findNearestDatemois = (arrayOfDates, year) => {
  const dateObjects = arrayOfDates.map(d => new Date(d));
  const lastDate = dateObjects[dateObjects.length - 1];
  const target = new Date(lastDate);
  target.setFullYear(target.getFullYear() - year);

  return findNearestDateBefore(arrayOfDates, target);
};

/**
 * Trouve la date il y a N années par rapport à une date spécifique.
 */
const findNearestDatetoyear = (arrayOfDates, year, date) => {
  const target = new Date(date);
  target.setFullYear(target.getFullYear() - year);

  const result = findNearestDateBefore(arrayOfDates, target);
  if (result) return result;
  return new Date(date).toISOString().slice(0, 10);
};

/**
 * Trouve la date 4 semaines avant la dernière date du tableau.
 */
const findNearestDateWeek = (arrayOfDates) => {
  const dateObjects = arrayOfDates.map(d => new Date(d));
  const lastDate = dateObjects[dateObjects.length - 1];
  const target = new Date(lastDate);
  target.setDate(target.getDate() - 28);

  const result = findNearestDateBefore(arrayOfDates, target);
  if (result) return result;
  return lastDate.toISOString().slice(0, 10);
};

/**
 * Trouve le 1er janvier (ou la date la plus proche) de la même année.
 */
const findNearestDateJanuary = (arrayOfDates) => {
  const dateObjects = arrayOfDates.map(d => new Date(d));
  const lastDate = dateObjects[dateObjects.length - 1];
  const firstJanuary = new Date(lastDate.getFullYear(), 0, 1);

  const result = findNearestDateBefore(arrayOfDates, firstJanuary);
  if (result) return result;
  return lastDate.toISOString().slice(0, 10);
};

/**
 * Trouve les dernières dates pour les 4 années précédentes.
 */
const findLastDatesForEachPreviousYear = (dateArray) => {
  const dateObjects = dateArray.map(d => new Date(d));
  const lastDate = new Date(dateArray[dateArray.length - 1]);

  const results = [];
  for (let i = 1; i <= 4; i++) {
    const previousYear = lastDate.getFullYear() - i;
    const yearDates = dateObjects.filter(d => d.getFullYear() === previousYear);
    if (yearDates.length > 0) {
      const lastOfYear = yearDates.sort((a, b) => b - a)[0];
      results.push(lastOfYear.toISOString().substring(0, 10));
    }
  }

  return results;
};

// =============================================
// Date Grouping Functions
// =============================================

/**
 * Groupe un tableau de dates par semaine.
 */
const groupDatesByWeek = (dates) => {
  const result = [];
  const sortedDates = dates.map(d => new Date(d)).sort((a, b) => a - b);

  let currentWeek = [];
  let currentWeekStart = startOfWeek(sortedDates[0]);

  for (const currentDate of sortedDates) {
    if (isWeekend(currentDate)) continue;

    const weekStart = startOfWeek(currentDate);
    if (weekStart.getTime() === currentWeekStart.getTime()) {
      currentWeek.push(currentDate.toISOString());
    } else {
      result.push(currentWeek);
      currentWeek = [currentDate.toISOString()];
      currentWeekStart = weekStart;
    }
  }

  if (currentWeek.length > 0) result.push(currentWeek);
  return result;
};

/**
 * Groupe un tableau de dates par mois.
 */
const groupDatesByMonth = (dates) => {
  const result = [];
  const sortedDates = dates.map(d => new Date(d)).sort((a, b) => a - b);

  let currentMonth = [];
  let currentMonthStart = startOfMonth(sortedDates[0]);

  for (const currentDate of sortedDates) {
    const monthStart = startOfMonth(currentDate);
    if (monthStart.getTime() === currentMonthStart.getTime()) {
      currentMonth.push(currentDate.toISOString());
    } else {
      result.push(currentMonth);
      currentMonth = [currentDate.toISOString()];
      currentMonthStart = monthStart;
    }
  }

  if (currentMonth.length > 0) result.push(currentMonth);
  return result;
};

/**
 * Groupe dates par mois, ne garde que les années complètes (12 mois).
 */
const groupDatesByMonth1 = (dates) => {
  const result = [];
  const sortedDates = dates.map(d => new Date(d)).sort((a, b) => a - b);

  let currentYear = [];
  let currentYearStart = startOfYear(sortedDates[0]);

  for (const currentDate of sortedDates) {
    const yearStart = startOfYear(currentDate);
    if (yearStart.getTime() === currentYearStart.getTime()) {
      currentYear.push(currentDate.toISOString());
    } else {
      if (currentYear.length === 12) result.push(currentYear);
      currentYear = [currentDate.toISOString()];
      currentYearStart = yearStart;
    }
  }

  if (currentYear.length === 12) result.push(currentYear);
  return result;
};

/**
 * Groupe un tableau de dates par année.
 */
const groupDatesByYear = (dates) => {
  const result = [];
  const sortedDates = dates.map(d => new Date(d)).sort((a, b) => a - b);

  let currentYear = [];
  let currentYearStart = startOfYear(sortedDates[0]);

  for (const currentDate of sortedDates) {
    const yearStart = startOfYear(currentDate);
    if (yearStart.getTime() === currentYearStart.getTime()) {
      currentYear.push(currentDate.toISOString());
    } else {
      result.push(currentYear);
      currentYear = [currentDate.toISOString()];
      currentYearStart = yearStart;
    }
  }

  if (currentYear.length > 0) result.push(currentYear);
  return result;
};

// =============================================
// Value Adaptation Functions
// =============================================

/**
 * Adapte un tableau de valeurs selon un groupage (semaine/mois/année).
 */
function adaptValuesToGroups(values, groupedDates) {
  const result = [];
  let currentIndex = 0;
  for (const group of groupedDates) {
    result.push(values.slice(currentIndex, currentIndex + group.length));
    currentIndex += group.length;
  }
  return result;
}

const adaptValuesToGroupedWeeks = (values, groupedDates) => adaptValuesToGroups(values, groupedDates);
const adaptValuesToGroupedMonths = (values, groupedDates) => adaptValuesToGroups(values, groupedDates);
const adaptValuesToGroupedYears = (values, groupedDates) => adaptValuesToGroups(values, groupedDates);

/**
 * Calcule les rendements annuels avec dates.
 */
const AdaptTableauwithdate = (values, groupedDatesByYear) => {
  const result = [];
  const reversedDates = [...groupedDatesByYear].reverse();
  const reversedValues = [...values].reverse();

  for (let i = 0; i < reversedDates.length - 1; i++) {
    const currentValue = reversedValues[i][reversedValues[i].length - 1];
    const previousValue = reversedValues[i + 1][reversedValues[i + 1].length - 1];
    const year = reversedDates[i][0].slice(0, 4);
    const rendement = (currentValue - previousValue) / previousValue;
    result.push([year, currentValue, rendement]);
  }

  return result;
};

/**
 * Calcule les rendements mensuels avec dates, groupés par année.
 */
const AdaptTableaumonthwithdate = (values, groupedDatesByYear) => {
  const result = {};
  const reversedDates = [...groupedDatesByYear].reverse();
  const reversedValues = [...values].reverse();

  for (let i = 0; i < reversedDates.length - 1; i++) {
    const currentValue = reversedValues[i][reversedValues[i].length - 1];
    const previousValue = reversedValues[i + 1][reversedValues[i + 1].length - 1];
    const year = reversedDates[i][0].slice(0, 4);
    const month = reversedDates[i][0].slice(5, 7);
    const rendement = (currentValue - previousValue) / previousValue;

    if (!result[year]) result[year] = [];
    result[year].push([month, currentValue, rendement]);
  }

  return Object.entries(result)
    .map(([year, values]) => ({ [year]: values }))
    .reverse();
};

/**
 * Calcule les rendements hebdomadaires avec dates.
 */
const AdaptTableauweekwithdate = (values, groupedDatesByYear) => {
  const result = [];
  const reversedDates = [...groupedDatesByYear].reverse();
  const reversedValues = [...values].reverse();

  for (let i = 0; i < reversedDates.length - 1; i++) {
    const currentValue = reversedValues[i][reversedValues[i].length - 1];
    const previousValue = reversedValues[i + 1][reversedValues[i + 1].length - 1];
    const dateLabel = reversedDates[i][0].slice(0, 10);
    const rendement = (currentValue - previousValue) / previousValue;
    result.push([dateLabel, currentValue, rendement]);
  }

  return result;
};

// =============================================
// Exports
// =============================================
module.exports = {
  findNearestDateAnnualized,
  findLastDateOfPreviousMonth,
  findNearestDate,
  findNearestDateWeek,
  findNearestDateJanuary,
  findLastDatesForEachPreviousYear,
  findNearestDatetoyear,
  groupDatesByWeek,
  groupDatesByMonth,
  groupDatesByYear,
  adaptValuesToGroupedWeeks,
  adaptValuesToGroupedMonths,
  adaptValuesToGroupedYears,
  AdaptTableauwithdate,
  AdaptTableauweekwithdate,
  AdaptTableaumonthwithdate,
  findNearestDateMonthlized,
  groupDatesByMonth1,
  findNearestDatemois,
};
