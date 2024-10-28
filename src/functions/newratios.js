const PortfolioAnalytics = require('portfolio-analytics');
const quants = require('quants')
const math = require('mathjs');
const { calculatePerformance, calculateAnnualizedPerformance } = require('./performances')


/**
 * Calculates the maximum drawdown of a portfolio based on cumulative returns.
 *
 * @param {number[]} cumulativeReturns - Array of cumulative returns over time.
 * @returns {number} - Maximum drawdown value.
 *//*
function calculateMaxDrawdown(cumulativeReturns) {
  let maxDrawdown = 0;
  let peak = cumulativeReturns[0];

  cumulativeReturns.forEach(value => {
    if (value > peak) {
      peak = value;
    }
    const drawdown = (peak - value) / peak;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  });

  return maxDrawdown;
}
*/

const calculateDSR = (rendements, targetReturn = 0, periodYears) => {
 // const rendements = calculateRendementsForPeriod(valeursLiquidatives, periodYears);
  if (rendements.length === 0) {
    return NaN;
  }
  const downsideReturns = rendements.filter(r => r < targetReturn);
  return math.sqrt(math.mean(downsideReturns.map(r => math.pow(r - targetReturn, 2))));
};

const calculateSortinoRatio1 = (rendements, riskFreeRate, targetReturn, periodYears) => {
 // const rendements = calculateRendementsForPeriod(valeursLiquidatives, periodYears);
  if (rendements.length === 0) {
    return NaN;
  }
  const dsr = calculateDSR(rendements, targetReturn, periodYears);
  const excessReturns = rendements.map(r => r - riskFreeRate);
  return math.mean(excessReturns) / dsr;
};
function convertAnnualToWeeklyRate(annualRate) {
  return Math.pow((1 + annualRate), 1 / 52) - 1;
}
function calculateSortinoRatio(weeklyReturns, annualRiskFreeRate) {
  if (weeklyReturns.length === 0) {
    return NaN;
  }
  const weeklyRiskFreeRate = convertAnnualToWeeklyRate(annualRiskFreeRate);
  const excessReturns = weeklyReturns.map(r => r - weeklyRiskFreeRate);
  const negativeExcessReturns = excessReturns.filter(r => r < 0);

  const meanExcessReturnAnnualized = math.mean(excessReturns) * 52; // Annualisation
  const stdDevNegativeExcessReturnAnnualized = calculerVolatilite(negativeExcessReturns)

  if(stdDevNegativeExcessReturnAnnualized === 0) {
    return 'IndÃ©fini'; // Ãviter la division par zÃ©ro
  }

  return meanExcessReturnAnnualized / stdDevNegativeExcessReturnAnnualized;
}

const calculateVAR95 = (rendements, confidenceLevel, periodYears) => {
 // const rendements = calculateRendementsForPeriod(valeursLiquidatives, periodYears);
 if (rendements.length === 0) {
  return NaN;
}
const sortedReturns = rendements.sort((a, b) => a - b);
const index = Math.floor(sortedReturns.length * (1 - confidenceLevel));
return sortedReturns[index];
};

const calculateVAR99 = (rendements, confidenceLevel, periodYears) => {
 // const rendements = calculateRendementsForPeriod(valeursLiquidatives, periodYears);
  if (rendements.length === 0) {
    return NaN;
  }
  const sortedReturns = rendements.sort((a, b) => a - b);
  const index = Math.floor(sortedReturns.length * (1 - confidenceLevel));
  return sortedReturns[index];
};
/*
const calculateSharpeRatio = (rendements, weeklyRiskFreeRate, periodYears) => {
 // const rendements = calculateRendementsForPeriod(valeursLiquidatives, periodYears);
  if (rendements.length === 0) {
    return NaN;
  }

  const annualizedReturns = rendements.map(r => r * 52);
  const annualizedRiskFreeRate = weeklyRiskFreeRate * 52;
  const excessReturns = annualizedReturns.map(r => r - annualizedRiskFreeRate);
  const standardDeviation = calculerVolatilite(excessReturns);

  return math.mean(excessReturns) / standardDeviation;
};*/
function calculateSharpeRatio(weeklyReturns, weeklyRiskFreeRate) {
  const excessReturns = weeklyReturns.map(r => r - weeklyRiskFreeRate);
  const meanExcessReturn = mean(excessReturns) * 52; // Annualisation des rendements excessifs
  const stdDevExcessReturn = calculerVolatilite(excessReturns); // Annualisation de l'écart-type

  if(stdDevExcessReturn === 0) {
    return 'Indéfini'; // Éviter la division par zéro
  }

  return meanExcessReturn / stdDevExcessReturn;
}
function calculateCAGR(finalValue, initialValue, numberOfYears) {
  return Math.pow(finalValue / initialValue, 1 / numberOfYears) - 1;
}
// Fonction pour calculer le CAGR
function calculerCAGR(valeurInitiale, valeurFinale, nombreAnnees) {
  if (valeurInitiale <= 0 || nombreAnnees <= 0) {
    //  throw new Error("La valeur initiale et le nombre d'années doivent être supérieurs à 0");
    return 1
  }

  return ((valeurFinale / valeurInitiale) ** (1 / nombreAnnees)) - 1;
}
/*
function calculateSharperationew(PerfAnnu,tauxsansrique){
  const Sharpe=(PerfAnnu-tauxsansrique)/
}*/
/*
function calculateCalmarRatio(filteredReturns, numberOfYears, periodYears) {
 // const filteredReturns = selectDataForPeriod(valeursLiquidatives, periodYears);
  if (filteredReturns.length === 0) {
    return NaN;
  }

  const finalValue = filteredReturns[filteredReturns.length - 1].vl;
  const initialValue = filteredReturns[0].vl;
  const cagr = calculateCompoundAnnualGrowthRate(initialValue, finalValue, numberOfYears);
  const maxDrawdown = calculateMaxDrawdown(filteredReturns);

  return cagr / maxDrawdown;
}*/
function calculateCalmarRatio(maxDrawdown, cagr) {
 
 // const cagr = calculateCAGR(finalValue, initialValue, numberOfYears);
 // const maxDrawdown = calculateMaxDrawdown(weeklyReturns); // Utilisez la fonction calculateMaxDrawdown

  if (maxDrawdown === 0) {
    return NaN; // Ãviter la division par zÃ©ro
  }

  return cagr / Math.abs(maxDrawdown);
}

const calculateSkewness = (rendements, periodYears) => {
 // const rendements = calculateRendementsForPeriod(valeursLiquidatives, periodYears);
  const meanReturn = math.mean(rendements);
  const cubedDifferences = rendements.map(r => Math.pow(r - meanReturn, 3));
  const meanCubedDifference = math.mean(cubedDifferences);
  const standardDeviation = math.std(rendements);

  return meanCubedDifference / Math.pow(standardDeviation, 3);
};/*
function calculerSkewness(rendementsHebdomadaires) {
  const N = rendementsHebdomadaires.length;
  const moyenne = math.mean(rendementsHebdomadaires);
  const ecartType = calculerVolatilite(rendementsHebdomadaires);
  const sommeCubes = rendementsHebdomadaires.reduce((acc, val) => acc + Math.pow(val - moyenne, 3), 0);

  return (N * sommeCubes) / ((N - 1) * (N - 2) * Math.pow(ecartType, 3));
}*/
function calculerSkewness(returns) {
  if (returns.length === 0) {
    return NaN;
  }
  const meanReturn = math.mean(returns);
  const skewness = math.sum(returns.map(r => Math.pow(r - meanReturn, 3))) / ((returns.length - 1) * Math.pow(math.std(returns), 3));
  return skewness;
}/*
function calculerSkewness(rendementsHebdomadaires, volatilite) {
  const N = rendementsHebdomadaires.length;
  const moyenne = math.mean(rendementsHebdomadaires);
  const sommeCubes = rendementsHebdomadaires.reduce((acc, val) => acc + Math.pow(val - moyenne, 3), 0);

  return (N * sommeCubes) / ((N - 1) * (N - 2) * Math.pow(volatilite, 3));
}*/
function calculateKurtosis(returns) {
  if (returns.length === 0) {
    return NaN;
  }
  const meanReturn = math.mean(returns);
  const kurtosis = math.sum(returns.map(r => Math.pow(r - meanReturn, 4))) / ((returns.length - 1) * Math.pow(math.std(returns), 4)) - 3;
  return kurtosis;
}
function calculateUpCaptureRatio(portfolioReturns, benchmarkReturns, periodYears) {
  if (portfolioReturns.length === 0) {
    return NaN;
  }
  //const portfolioReturns = calculateRendementsForPeriod(valeursLiquidatives, periodYears);
 // const filteredBenchmarkReturns = selectDataForPeriod(benchmarkReturns, periodYears);

  let sumPortfolioUpReturns = 0;
  let sumBenchmarkUpReturns = 0;
let i=0;
  benchmarkReturns.forEach((benchmarkReturn, idx) => {
    if (benchmarkReturn > 0) {
      i++
      sumPortfolioUpReturns += portfolioReturns[idx];
      sumBenchmarkUpReturns += benchmarkReturn;
    }
  });

  if (sumBenchmarkUpReturns === 0) {
    return null; // Pas de hausse de l'indice
  }

  return (sumPortfolioUpReturns / sumBenchmarkUpReturns) * 100;
}
function calculateDownCaptureRatio(portfolioReturns, filteredBenchmarkReturns, periodYears) {
  if (portfolioReturns.length === 0) {
    return NaN;
  }
//  const portfolioReturns = calculateRendementsForPeriod(valeursLiquidatives, periodYears);
 // const filteredBenchmarkReturns = selectDataForPeriod(benchmarkReturns, periodYears);

  let sumPortfolioDownReturns = 0;
  let sumBenchmarkDownReturns = 0;
  let a=[];

  filteredBenchmarkReturns.forEach((benchmarkReturn, idx) => {
    if (benchmarkReturn < 0) {
      a.push(benchmarkReturn)
      sumPortfolioDownReturns += portfolioReturns[idx];
      sumBenchmarkDownReturns += benchmarkReturn;
    }
  });

  if (sumBenchmarkDownReturns === 0) {
    return null; // Pas de baisse de l'indice
  }

  return (sumPortfolioDownReturns / sumBenchmarkDownReturns) * 100;
}


/*const calculateOmegaRatio = (rendements, targetReturn = 0, periodYears) => {
//  const rendements = calculateRendementsForPeriod(valeursLiquidatives, periodYears);
  if (rendements.length === 0) {
    return NaN;
  }

  const excessReturns = rendements.map(r => r - targetReturn);
  const gain = math.sum(excessReturns.filter(r => r > 0));
  const loss = -math.sum(excessReturns.filter(r => r < 0));

  return gain / loss;
};*/

function calculateDownsideBeta(portfolioReturns, filteredBenchmarkReturns, periodYears) {
  if (portfolioReturns.length === 0) {
    return NaN;
  }
 // const portfolioReturns = calculateRendementsForPeriod(valeursLiquidatives, periodYears);
 // const filteredBenchmarkReturns = selectDataForPeriod(benchmarkReturns, periodYears);

  const negativeBenchmarkPeriods = filteredBenchmarkReturns.map((ret, idx) => ret < 0 ? portfolioReturns[idx] : null).filter(x => x !== null);
  const negativeBenchmarkReturns = filteredBenchmarkReturns.filter(ret => ret < 0);

  if (negativeBenchmarkPeriods.length === 0) {
    return null;
  }

  const covariance = calculateCovariance(negativeBenchmarkPeriods, negativeBenchmarkReturns);
  const variance = calculateVariance(negativeBenchmarkReturns);

  return covariance / variance;
}

function calculateHaussierBeta(portfolioReturns, filteredBenchmarkReturns, periodYears) {
  if (portfolioReturns.length === 0) {
    return NaN;
  }
  // const portfolioReturns = calculateRendementsForPeriod(valeursLiquidatives, periodYears);
  // const filteredBenchmarkReturns = selectDataForPeriod(benchmarkReturns, periodYears);
 
   const negativeBenchmarkPeriods = filteredBenchmarkReturns.map((ret, idx) => ret > 0 ? portfolioReturns[idx] : null).filter(x => x !== null);
   const negativeBenchmarkReturns = filteredBenchmarkReturns.filter(ret => ret > 0);
 
   if (negativeBenchmarkPeriods.length === 0) {
     return null;
   }
 
   const covariance = calculateCovariance(negativeBenchmarkPeriods, negativeBenchmarkReturns);
   const variance = calculateVariance(negativeBenchmarkReturns);
 
   return covariance / variance;
 }

 function calculerR2(rendementsActif, rendementsMarche) {
  if (rendementsActif.length !== rendementsMarche.length) {
    throw new Error("Les séries de rendements doivent être de même longueur.");
  }
  
  const correlation = quants.corrcoef(rendementsActif, rendementsMarche);
  return correlation ** 2;
}


function calculateBetanew(portfolioReturns, filteredBenchmarkReturns, periodYears) {
 // const portfolioReturns = calculateRendementsForPeriod(valeursLiquidatives, periodYears);
 // const filteredBenchmarkReturns = selectDataForPeriod(benchmarkReturns, periodYears);
 if (portfolioReturns.length === 0) {
  return NaN;
}
  const covariance = calculateCovariance(portfolioReturns, filteredBenchmarkReturns);
  const varianceBenchmark = calculateVariance(filteredBenchmarkReturns);

  return covariance / varianceBenchmark;
}
function calculerVolatilite(rendements) {
  let moyenne = rendements.reduce((acc, r) => acc + r, 0) / rendements.length;
  let variance = rendements.reduce((acc, r) => acc + Math.pow(r - moyenne, 2), 0) / rendements.length;
  return Math.sqrt(variance) * Math.sqrt(52); // Annualisation
}
function calculerVolatilitejour(rendements) {
  let moyenne = rendements.reduce((acc, r) => acc + r, 0) / rendements.length;
  let variance = rendements.reduce((acc, r) => acc + Math.pow(r - moyenne, 2), 0) / rendements.length;
  return Math.sqrt(variance) * Math.sqrt(252); // Annualisation
}
function calculerVolatilitemois(rendements) {
  let moyenne = rendements.reduce((acc, r) => acc + r, 0) / rendements.length;
  let variance = rendements.reduce((acc, r) => acc + Math.pow(r - moyenne, 2), 0) / rendements.length;
  return Math.sqrt(variance) * Math.sqrt(12); // Annualisation
}
function mean(numbers) {
  const total = numbers.reduce((acc, curr) => acc + curr, 0);
  return total / numbers.length;
}

function annualiserActiveReturn(weeklyActiveReturn) {
  return Math.pow(1 + weeklyActiveReturn, 52) - 1;
}
function calculateInformationRatio(portfolioReturns, filteredBenchmarkReturns, periodYears) {
 // const portfolioReturns = calculateRendementsForPeriod(valeursLiquidatives, periodYears);
 // const filteredBenchmarkReturns = selectDataForPeriod(benchmarkReturns, periodYears);

  const excessReturns = portfolioReturns.map((ret, idx) => ret - filteredBenchmarkReturns[idx]);
  //const trackingError = math.std(differences);
  const trackingError =calculerVolatilite(excessReturns);

  
  const moyenneActiveReturnHebdo = mean(excessReturns);

// Annualiser l'Active Return hebdomadaire moyen
  const activeReturnAnnuel = moyenneActiveReturnHebdo*52;

  return activeReturnAnnuel / trackingError;
}

function calculateInformationRatiojour(portfolioReturns, filteredBenchmarkReturns, periodYears) {
  // const portfolioReturns = calculateRendementsForPeriod(valeursLiquidatives, periodYears);
  // const filteredBenchmarkReturns = selectDataForPeriod(benchmarkReturns, periodYears);
 
   const excessReturns = portfolioReturns.map((ret, idx) => ret - filteredBenchmarkReturns[idx]);
   //const trackingError = math.std(differences);
   const trackingError =calculerVolatilitejour(excessReturns);
 
   
   const moyenneActiveReturnjour = mean(excessReturns);
 
 // Annualiser l'Active Return JOUR moyen
   const activeReturnAnnuel = moyenneActiveReturnjour*252;
 
   return activeReturnAnnuel / trackingError;
 }

function calculateTrackingError(portfolioReturns, filteredBenchmarkReturns, periodYears) {
  if (portfolioReturns.length === 0) {
    return NaN;
  }
  //const portfolioReturns = calculateRendementsForPeriod(valeursLiquidatives, periodYears);
  //const filteredBenchmarkReturns = selectDataForPeriod(benchmarkReturns, periodYears);

  const excessReturns = portfolioReturns.map((ret, idx) => ret - filteredBenchmarkReturns[idx]);
  const trackingError =calculerVolatilite(excessReturns);
  return trackingError;
}


const calculateCovariance = (x, y) => {
  const meanX = math.mean(x);
  const meanY = math.mean(y);
  return math.mean(x.map((val, idx) => (val - meanX) * (y[idx] - meanY)));
};


const calculateVariance = (values) => {
  const mean = math.mean(values);
  return math.mean(values.map(val => math.pow(val - mean, 2)));
};




function calculateCompoundAnnualGrowthRate(initialValue, finalValue, numberOfYears) {
  return Math.pow(finalValue / initialValue, 1 / numberOfYears) - 1;
}

const selectDataForPeriod = (returns, periodYears) => {
  // Implémentez la logique pour sélectionner les données en fonction de la période
  // Par exemple, sélectionner les dernières données de 52 semaines * nombre d'années
  const numberOfWeeks = 52 * periodYears;
  return returns.slice(-numberOfWeeks);
};

const calculateRendementsForPeriod = (valeursLiquidatives, periodYears) => {
  const selectedValeursLiquidatives = selectDataForPeriod(valeursLiquidatives, periodYears);
  return calculerRendements(selectedValeursLiquidatives);
};

const calculerRendements = (valeursLiquidatives) => {
  let rendements = [];
  for (let i = 0; i < valeursLiquidatives.length - 1; i++) {
    let rendement = (valeursLiquidatives[i].vl - valeursLiquidatives[i + 1].vl) / valeursLiquidatives[i + 1].vl;
    rendements.push(rendement);
  }
  return rendements;
};

const calculateVolatility = (values) => {
  // n = nombreDeRendementCalcules sur la période
  const nbrRdt_calcules = values.length;
  // console.log(nbrRdt_calcules)
  const mean = values.reduce((sum, value) => sum + value, 0) / nbrRdt_calcules;
  const squaredDeviations = values.map((value) => Math.pow(value - mean, 2));
  const variance = squaredDeviations.reduce((sum, value) => sum + value, 0) / nbrRdt_calcules;
  return Math.sqrt(variance) * Math.sqrt(52);
}

function calculateMaxDrawdown(values) {
  let peak = values[0];
  let maxDrawdown = 0;

  for (let value of values) {
      if (value > peak) {
          peak = value;
      }
      let drawdown = (peak - value) / peak;
      maxDrawdown = math.max(maxDrawdown, drawdown);
  }

  return maxDrawdown; // Le résultat est un pourcentage
}

function calculateOmegaRatio(rendements, seuilRendement) {
  if (rendements.length === 0) {
    return NaN;
  }
  let gains = rendements.filter(r => r > seuilRendement).map(r => r - seuilRendement);
  let pertes = rendements.filter(r => r < seuilRendement).map(r => seuilRendement - r);

  let sommeGains = math.sum(gains);
  let sommePertes = math.sum(pertes);

  if (sommePertes === 0) {
    return 'Infini'; // Éviter la division par zéro
  }

  return sommeGains / sommePertes;
}
function calculerDelaiRecouvrementOPCVM(investissementInitial, nombreDeParts, VLQuotidienne) {
  let jours = 0;

  for (let vl of VLQuotidienne) {
    let valeurActuelle = nombreDeParts * vl;
    jours++;
    if (valeurActuelle >= investissementInitial) {
      return jours;
    }
  }

  return "Non recouvré";
}

function calculerDelaiRecouvrementFonds(VLQuotidienne) {
  if (VLQuotidienne.length === 0) {
    return NaN;
  }
  let jourPremierPic = null;
  let plusHauteVL = VLQuotidienne[0];

  // Trouver le premier pic suivi d'une baisse
  for (let i = 1; i < VLQuotidienne.length; i++) {
    if (VLQuotidienne[i] > plusHauteVL) {
      plusHauteVL = VLQuotidienne[i];
      jourPremierPic = i;
    } else if (VLQuotidienne[i] < plusHauteVL) {
      break; // Premier pic suivi d'une baisse trouvé
    }
  }

  if (jourPremierPic === null) {
    return "Aucun pic suivi d'une baisse n'a été trouvé";
  }

  // Recherche du point de recouvrement
  for (let i = jourPremierPic + 1; i < VLQuotidienne.length; i++) {
    if (VLQuotidienne[i] >= plusHauteVL) {
      return i - jourPremierPic; // Nombre de jours pour le recouvrement
    }
  }

  return "Le fonds n'a pas récupéré";
}

function calculerDSRAnnualise(rendementsHebdomadaires, tauxCible) {
  let ecartsNegatifs = rendementsHebdomadaires.map(r => Math.min(0, r - tauxCible));
  let sommeDesCarrés = ecartsNegatifs.reduce((somme, ecart) => somme + ecart ** 2, 0);
  let dsrHebdomadaire = Math.sqrt(sommeDesCarrés / ecartsNegatifs.length);
  return dsrHebdomadaire * Math.sqrt(52); // Annualisation
}


module.exports = {
  calculateVolatility,
  calculateMaxDrawdown,
  calculateDSR,
  calculateCovariance,
  calculateBetanew,
  calculateVariance,
  calculerDelaiRecouvrementOPCVM,
 /* calculateInformationRationew,
  calculateDSRnew,*/
  calculateUpCaptureRatio,
  calculateDownCaptureRatio,
  calculateCalmarRatio,
  calculateDownsideBeta,
  calculateHaussierBeta,
  //calculateSortinoRationew,
  calculateSkewness,
  calculateOmegaRatio,
  // calculateNegativeVolatility,
  calculateSharpeRatio,
  calculateVAR95,
  calculerCAGR,
  calculateTrackingError,
 /* calculateVolatilityJour,
  calculateVolatilityMois,*/
  calculateVAR99,
  calculateInformationRatio,
  calculateSortinoRatio,
  calculateInformationRatiojour,
  calculerR2,
  calculerSkewness,
  calculateKurtosis,
  calculerDelaiRecouvrementFonds,
  calculerDSRAnnualise
}