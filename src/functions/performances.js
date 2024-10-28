
//calcul de la perfomance simple
const calculatePerformance = (currentValue, previousValue) => {
    if(currentValue === previousValue){
        return "-"
    }else{
        return ((currentValue - previousValue) / previousValue) * 100;
    }

}

  // Fonction pour calculer la performance annualisée
const calculateAnnualizedPerformance = (currentValue, previousValue, numberOfYears) => {
    
    const performance = calculatePerformance(currentValue, previousValue);
      
    if(performance === "-"){
        return "-"
    }else{
        return Math.pow(1 + performance / 100, 1 / numberOfYears) - 1;
    }
}

  // Fonction pour calculer la performance annualisée
  const calculateAnnualizedPerformanceper100 = (currentValue, previousValue, numberOfYears) => {
    
    const performance = calculatePerformance(currentValue, previousValue);
      
    if(performance === "-"){
        return "-"
    }else{
        return (Math.pow(1 + performance / 100, 1 / numberOfYears) - 1)*100;
    }
}

module.exports = {
    calculatePerformance,
    calculateAnnualizedPerformance,
    calculateAnnualizedPerformanceper100
}