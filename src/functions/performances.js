/**
 * Calcul de la performance simple entre deux valeurs.
 * @param {number} currentValue - Valeur actuelle
 * @param {number} previousValue - Valeur précédente
 * @returns {number|null} Performance en pourcentage, ou null si identiques/invalides
 */
const calculatePerformance = (currentValue, previousValue) => {
  if (!previousValue || previousValue === 0) {
    return null;
  }
  if (currentValue === previousValue) {
    return 0;
  }
  return ((currentValue - previousValue) / previousValue) * 100;
};

/**
 * Calcul de la performance annualisée (en décimal).
 * @param {number} currentValue - Valeur actuelle
 * @param {number} previousValue - Valeur précédente
 * @param {number} numberOfYears - Nombre d'années
 * @returns {number|null} Performance annualisée en décimal
 */
const calculateAnnualizedPerformance = (currentValue, previousValue, numberOfYears) => {
  const performance = calculatePerformance(currentValue, previousValue);
  if (performance === null || numberOfYears <= 0) {
    return null;
  }
  return Math.pow(1 + performance / 100, 1 / numberOfYears) - 1;
};

/**
 * Calcul de la performance annualisée (en pourcentage).
 * @param {number} currentValue - Valeur actuelle
 * @param {number} previousValue - Valeur précédente
 * @param {number} numberOfYears - Nombre d'années
 * @returns {number|null} Performance annualisée en pourcentage
 */
const calculateAnnualizedPerformanceper100 = (currentValue, previousValue, numberOfYears) => {
  const annualized = calculateAnnualizedPerformance(currentValue, previousValue, numberOfYears);
  if (annualized === null) {
    return null;
  }
  return annualized * 100;
};

module.exports = {
  calculatePerformance,
  calculateAnnualizedPerformance,
  calculateAnnualizedPerformanceper100,
};
