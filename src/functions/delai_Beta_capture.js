const ss = require('simple-statistics');
const quants = require('quants')
const math = require('mathjs')

// function calculerRendements(historiqueVL) {
//     const rendements = [];
//
//     for (let i = 1; i < historiqueVL.length; i++) {
//         const rendement = (historiqueVL[i].value - historiqueVL[i - 1].value) / historiqueVL[i - 1].value;
//         rendements.push(rendement);
//     }
//
//     return rendements;
// }
//
// function calculerRendementsPositifs(historiqueVL) {
//     const rendementsPositifs = [];
//
//     for (let i = 1; i < historiqueVL.length; i++) {
//         const rendement = (historiqueVL[i].value - historiqueVL[i - 1].value) / historiqueVL[i - 1].value;
//         if (rendement > 0) {
//             rendementsPositifs.push(rendement);
//         }
//     }
//
//     return rendementsPositifs;
// }
//
//
// function calculerRendementsNegatifs(historiqueVL) {
//     const rendementsPositifs = [];
//
//     for (let i = 1; i < historiqueVL.length; i++) {
//         const rendement = (historiqueVL[i].value - historiqueVL[i - 1].value) / historiqueVL[i - 1].value;
//         if (rendement < 0) {
//             rendementsPositifs.push(rendement);
//         }
//     }
//
//     return rendementsPositifs;
// }

//Délai de recouvrement sur ${periode} ans : ${delaiRecouvrement} jours
//si cest le calcul a l'origine preciser la taille du tableau comme periode
function calculerDelaiRecouvrement(historiqueVL, debut, fin) {
    let debutIndex = historiqueVL.findIndex((vl) => vl.date >= debut);
    let finIndex = historiqueVL.findIndex((vl) => vl.date >= fin);

    if (debutIndex === -1 || finIndex === -1) {
        return { delaiRecouvrement: -1, dateRecouvrement: null };
    }

    let delaiRecouvrement = 0;
    let plusHauteVLAtteinte = 0;

    for (let i = debutIndex; i <= finIndex; i++) {
        const vl = historiqueVL[i];
        if (vl.value > plusHauteVLAtteinte) {
            plusHauteVLAtteinte = vl.value;
        } else if (vl.value <= plusHauteVLAtteinte) {
            const dateRecouvrement = new Date(vl.date);
            dateRecouvrement.setDate(dateRecouvrement.getDate() + delaiRecouvrement);
            return { delaiRecouvrement, dateRecouvrement };
        }

        delaiRecouvrement++;
    }

    return { delaiRecouvrement: -1, dateRecouvrement: null };
}


//historique des fonds et periode a preciser
//si cest le calcul a l'origine preciser la taille du tableau comme periode
function calculateBeta(rendementsFonds, rendementsIndice) {

    const covariance = quants.cov(rendementsFonds, rendementsIndice, 0);
    const varianceIndice = quants.var(rendementsIndice, 0)
    return covariance / varianceIndice
}



function calculateBetaHaussier(rendementsFonds, rendementsIndice) {

    //je prends les rendements positifs de l'indice ensuite je prends les rendements correspondants au meme
    //dates (elles peuvent etre positives ou negatives
    //ensuite on fait le beta (regression des deux)
    // const rendementsPositifs

    // for(let i=0;i<valuesIndice.length;i++){
    //     if(i<valuesIndice.length-1){
    //         const res = (valuesIndice[i+1].value - valuesIndice[i].value) / valuesIndice[i].value;
    //         if(res > 0){
    //             rendIndPos.push(res)
    //             rendFond.push((valuesFonds[i+1].value - valuesFonds[i].value) / valuesFonds[i].value)
    //         }
    //     }
    // }

    const rendIndPos = [];
    const rendFondPos = [];

    for (let i = 0; i < rendementsFonds.length; i++) {
        if (rendementsFonds[i] > 0 && rendementsIndice[i] > 0) {
            rendIndPos.push(rendementsIndice[i])
            rendFondPos.push(rendementsFonds[i])
        }
    }

    return quants.linreg(rendFondPos, rendIndPos).beta

}


function calculateBetaBaissier(rendementsFonds, rendementsIndice) {

    //je prends les rendements negatifs du fond ensuite je prends les rendements correspondants au meme
    //dates (elles peuvent etre positives ou negatives
    //ensuite on fait le beta (regression des deux)
    const rendIndNeg = []
    const rendFondNeg = []

    // for (let i = 1; i < valuesIndice.length; i++) {
    //     // if(i<valuesIndice.length-1){
    //     const res = (valuesIndice[i - 1].value - valuesIndice[i].value) / valuesIndice[i].value;
    //     if (res < 0) {
    //         rendIndNeg.push(res)
    //         rendFond.push((valuesFonds[i - 1].value - valuesFonds[i].value) / valuesFonds[i].value)
    //     }
    //     // }
    // }

    for (let i = 0; i < rendementsFonds.length; i++) {
        if (rendementsFonds[i] < 0 && rendementsIndice[i] < 0) {
            rendIndNeg.push(rendementsIndice[i])
            rendFondNeg.push(rendementsFonds[i])
        }
    }

    return quants.linreg(rendFondNeg, rendIndNeg).beta

}



function calculerUpCaptureRatio(historiqueVLFonds, historiqueVLIndice, debut, fin) {

    const debutIndex = historiqueVLFonds.findIndex((vl) => vl.date >= debut);
    const finIndex = historiqueVLFonds.findIndex((vl) => vl.date >= fin);

    if (debutIndex === -1 || finIndex === -1) {
        return -1;
    }

    let performanceFonds = 1;
    let performanceIndice = 1;
    let periodesIndiceSup0 = 0;

    for (let i = debutIndex; i <= finIndex; i++) {
        const vlIndice = historiqueVLIndice[i].value;
        if (vlIndice > 0) {
            periodesIndiceSup0++;
        }

        const vlFonds = historiqueVLFonds[i].value;
        const vlIndiceDebut = historiqueVLIndice[debutIndex].value;

        performanceFonds *= (vlFonds / historiqueVLFonds[debutIndex - 1].value);
        performanceIndice *= (vlIndice / vlIndiceDebut);
    }

    if (periodesIndiceSup0 === 0) {
        return -1;
    }

    return performanceFonds / performanceIndice;
}


function calculerDownCaptureRatio(historiqueVLFonds, historiqueVLIndice, debut, fin) {
    const debutIndex = historiqueVLFonds.findIndex((vl) => vl.date >= debut);
    const finIndex = historiqueVLFonds.findIndex((vl) => vl.date >= fin);

    if (debutIndex === -1 || finIndex === -1) {
        return -1;
    }

    let performanceFonds = 1;
    let performanceIndice = 1;
    let periodesIndiceInf0 = 0;

    for (let i = debutIndex; i <= finIndex; i++) {
        const vlIndice = historiqueVLIndice[i].value;

        const vlFonds = historiqueVLFonds[i].value;
        const vlIndiceDebut = historiqueVLIndice[debutIndex].value;

        performanceFonds *= (vlFonds / historiqueVLFonds[debutIndex - 1].value);
        performanceIndice *= (vlIndice / vlIndiceDebut);

        if (vlIndice <= 0) {
            periodesIndiceInf0++;
        }
    }

    if (periodesIndiceInf0 === 0) {
        return -1;
    }

    return 1 - (performanceFonds / performanceIndice);
}



module.exports = {
    calculerDelaiRecouvrement,
    calculerUpCaptureRatio,
    calculerDownCaptureRatio,
    calculateBeta,
    calculateBetaHaussier,
    calculateBetaBaissier
}