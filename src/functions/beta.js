
const ss = require('simple-statistics')

function calculerRendements(historiqueVL) {
    const rendements = [];

    for (let i = 1; i < historiqueVL.length; i++) {
        const rendement = (historiqueVL[i].valeurLiquidative - historiqueVL[i - 1].valeurLiquidative) / historiqueVL[i - 1].valeurLiquidative;
        rendements.push(rendement);
    }

    return rendements;
}

//historique des fonds et periode a preciser
//si cest le calcul a l'origine preciser la taille du tableau comme periode
//`Bêta sur ${periode} ans : ${beta}`
function calculateBeta(historiqueVLFonds, historiqueVLIndice, periode) {
    const dateFin = new Date();
    const dateDebut = new Date(dateFin);

    // Définir la date de début en remontant d'une période spécifiée
    dateDebut.setFullYear(dateDebut.getFullYear() - periode);

    // Filtrer les valeurs liquidatives du fonds et de l'indice pour la période spécifiée
    const vlFondsPeriode = historiqueVLFonds.filter((vl) => vl.date >= dateDebut && vl.date <= dateFin);
    const vlIndicePeriode = historiqueVLIndice.filter((vl) => vl.date >= dateDebut && vl.date <= dateFin);

    // Calculer les rendements pour le fonds et l'indice sur la période spécifiée
    const rendementsFonds = calculerRendements(vlFondsPeriode);
    const rendementsIndice = calculerRendements(vlIndicePeriode);

    // Calculer le bêta en utilisant la bibliothèque "simple-statistics"
    const covariance = ss.sampleCovariance(rendementsFonds, rendementsIndice);
    const varianceIndice = ss.sampleVariance(rendementsIndice);
    return covariance / varianceIndice;
}

module.exports = {
    calculateBeta
}