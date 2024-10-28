const moment = require('moment');
const math = require('mathjs');

const CalculateRendJournalier = (adaptValues) => {
    let rendementJour = []

    for (let i = 1; i < adaptValues.length; i++) {
        // if(i<adaptValues.length-1){
        rendementJour.push((adaptValues[i] - adaptValues[i - 1]) / adaptValues[i - 1])
        // console.log()
        // }
    }

    return rendementJour
}

const CalculateRendHebdo = (adaptValues) => {
    let rendementHebdo = []
    for (let i = 1; i < adaptValues.length - 1; i++) {
        //console.log(adaptValues[i - 1][0]);
        rendementHebdo.push((adaptValues[i - 1][0] - adaptValues[i][0]) / adaptValues[i][0])
       // rendementHebdo.push((adaptValues[i - 1][adaptValues[i - 1].length - 1] - adaptValues[i][adaptValues[i].length - 1]) / adaptValues[i][adaptValues[i].length - 1])

    }
    return rendementHebdo
}

const CalculateRendMensuel = (adaptValuesMonth) => {
    let rendementMonths = []
    adaptValuesMonth.map((el, index) => {
        if (index === 0) {
            rendementMonths.push(((el[el.length - 1] - el[0]) / el[0]))
        } else {
            rendementMonths.push(((el[0] - adaptValuesMonth[index - 1][0]) / adaptValuesMonth[index - 1][0]))
        }
    })
    return rendementMonths
}

function grouperParJour(data) {
    let groupedData = {};
    data.forEach(d => {
        const date = moment(d.date, 'YYYY-MM-DD').format('YYYY-MM-DD'); // Jour seulement
        if (!groupedData[date] || moment(d.date, 'YYYY-MM-DD').isAfter(moment(groupedData[date].date, 'YYYY-MM-DD'))) {
            groupedData[date] = d;
        }
    });
    return Object.values(groupedData);
}

  function grouperParSemaine(data) {
    let groupedData = {};
    data.forEach(d => {
      const date = moment(d.date, 'YYYY-MM-DD');
      const weekEnd = date.endOf('week').format('YYYY-MM-DD');
      if (!groupedData[weekEnd] || moment(d.date, 'YYYY-MM-DD').isAfter(moment(groupedData[weekEnd].date, 'YYYY-MM-DD'))) {
          groupedData[weekEnd] = d;
      }
    });
    return Object.values(groupedData);
}
function grouperParMois(data) {
  let groupedData = {};
  data.forEach(d => {
      const date = moment(d.date, 'YYYY-MM-DD');
      const monthEnd = date.endOf('month').format('YYYY-MM-DD');
      if (!groupedData[monthEnd] || moment(d.date, 'YYYY-MM-DD').isAfter(moment(groupedData[monthEnd].date, 'YYYY-MM-DD'))) {
          groupedData[monthEnd] = d;
      }
  });
  return Object.values(groupedData);
}
function grouperParAnnee(data) {
  let groupedData = {};
  data.forEach(d => {
      const date = moment(d.date, 'YYYY-MM-DD');
      const yearEnd = date.endOf('year').format('YYYY-MM-DD');
      if (!groupedData[yearEnd] || moment(d.date, 'YYYY-MM-DD').isAfter(moment(groupedData[yearEnd].date, 'YYYY-MM-DD'))) {
          groupedData[yearEnd] = d;
      }
  });
  return Object.values(groupedData);
}

// Fonction pour calculer les rendements hebdomadaires
/*function calculerRendements(data) {
  let rendements = [];
  for (let i = 1; i < data.length; i++) {
      let valeurActuelle = parseFloat(data[i].value);
      let valeurPrecedente = parseFloat(data[i - 1].value);
      let rendement = (valeurActuelle / valeurPrecedente) - 1;
      rendements.push(rendement);
  }
  return rendements;
}*/
function calculerRendements(data) {
    let rendements = [];
    for (let i = 1; i < data.length; i++) {
        let valeurActuelle = parseFloat(data[i-1].value);
        let valeurPrecedente = parseFloat(data[i].value);
        let rendement = (valeurActuelle / valeurPrecedente) - 1;
        rendements.push(rendement);
    }
    return rendements;
  }

  function grouperTauxParSemaine(data) {
      // Décoder l'année et le numéro de la semaine depuis la chaîne
      const [year, week] = data.split('-').map(Number);
    
      // Utiliser Moment.js pour obtenir la date à partir de l'année et du numéro de la semaine
      const date = moment().year(year).isoWeek(week).endOf('isoWeek');
    
      // Exclure les week-ends
     // Si la date est un samedi ou un dimanche, revenir à la fin de la semaine précédente
  if (date.isoWeekday() === 6) {
    date.subtract(1, 'days').endOf('isoWeek');
  } else if (date.isoWeekday() === 7) {
    date.subtract(2, 'days').endOf('isoWeek');
  } else {
    // Sinon, rester à la fin de la semaine actuelle
    date.endOf('isoWeek');
  }

  // Retourner la date au format "YYYY-MM-DD"
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
    grouperTauxParSemaine

}