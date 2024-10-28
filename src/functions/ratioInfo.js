const { default: subMilliseconds } = require("date-fns/fp/subMilliseconds/index");
const {calculateVolatility} = require('./ratios')

// Fonction pour calculer le rendement excédentaire
const calculateExcessReturns = (returns, benchmarkReturns) => {
  return returns.map((returnVal, index) => returnVal - benchmarkReturns[index]);
}



// // Fonction pour calculer la moyenne des rendements excédentaires
// const calculateMean = (returns)=> {
//   const filteredArray = returns.filter((element)=> element > 0)
//   const sum = filteredArray.reduce((total, returnVal) => total + returnVal, 0);
//   return sum / filteredArray.length;
// }

// // Fonction pour calculer l'écart-type des rendements excédentaires
// const calculateStandardDeviation = (returns)=> {
//   const mean = calculateMean(returns);
//   const variance = returns.reduce((total, returnVal) => total + Math.pow(returnVal - mean, 2), 0) / returns.length;
//   return Math.sqrt(variance);
// }

// Fonction pour calculer le ratio d'information
// const calculateInformationRatio = (returns, benchmarkReturns)=> {
//   const excessReturns = calculateExcessReturns(returns, benchmarkReturns);
//   const meanExcessReturns = calculateMean(excessReturns);
//   const standardDeviationExcessReturns = calculateStandardDeviation(excessReturns);
//   return meanExcessReturns / standardDeviationExcessReturns;
// }

// const calculateInformationRatio = (returns,benchmarkReturns)=> {
//     const excessReturns = calculateExcessReturns(returns, benchmarkReturns)
//     const squaredDeviations = excessReturns.map((element)=> Math.pow(element,2))
//     const sum2 = squaredDeviations.reduce((total, returnVal) => total + returnVal, 0) / excessReturns.length
//     const sqrt = Math.sqrt(sum2)


//     const sum = excessReturns.reduce((total, returnVal) => total + returnVal, 0)

//     const n = excessReturns/((198.2-186.2)/186.2) - ((18282.47-17428.48)/17428.48)
//     const n1 = excessReturns/((186.2-208.4)/208.4) - ((17428.48-20269.02)/20269.02)
//     const n2 = excessReturns/((208.4-150.1)/150.1) - ((20269.02-13446.96)/13446.96)



//     // const filteredArray = excessReturns.filter((element)=> element > 0)
//     // const sumSquared = squaredDeviations.reduce((total, returnVal) => total + returnVal, 0) / filteredArray.length;
//     // let p = ((198.2-186.2)/186.2) - ((18282.47-17428.48)/17428.48)
//     // let p2 = ((186.2-208.4)/208.4) - ((17428.48-20269.02)/20269.02)
//     // let p3 = ((208.4-150.1)/150.1) - ((20269.02-13446.96)/13446.96)
//     // console.log(4444,p3)
//     // console.log(2222,p+p2+p3)
//     return (sum/sqrt) * Math.sqrt(52)
// }
// const calculateInformationRatio = (returns,benchmarkReturns)=> {
//     const rvlm = returns.map((el,index)=>{
//         if(index==0){
//             return ((el[el.length-1] - el[0]) / el[0])
//         }else{
//             return ((el[0]-returns[index-1][0]) / returns[index-1][0])
//         }
//     })


//     const rblm = benchmarkReturns.map((el,index)=>{
//         if(index==0){
//             return ((el[el.length-1] - el[0]) / el[0])
//         }else{
//             return ((el[0]-benchmarkReturns[index-1][0]) / benchmarkReturns[index-1][0])
//         }
//     })

//     const exec = calculateExcessReturns(rvlm,rblm)
//     const sum = exec.reduce((total, returnVal) => total + returnVal, 0)

//     const squaredDeviations = exec.map((element)=> Math.pow(element,2))
//     const sum2 = squaredDeviations.reduce((total, returnVal) => total + returnVal, 0) / squaredDeviations.length
//     //  console.log(sum/Math.sqrt(sum2))

// }
const calculateInformationRatio = (rendementFond,rendementBench)=> {

    const exces = calculateExcessReturns(rendementFond,rendementBench)


return moyExces / volatility
}





module.exports = {
    calculateInformationRatio
}
