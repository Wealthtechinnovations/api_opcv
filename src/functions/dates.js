const { startOfWeek, addDays, isWeekend, isSameDay, startOfMonth, startOfYear } = require('date-fns');

//PAR DEFAUT TOUTES CES FONCTION SI ELLES NE TROUVENT PAS LA DATE SOUHAITEE RENVOIENT LA DERNIERE DATE DU TABLEAU

//derniere date du mois precedent il y a 3,5,8,10 selon l'année specifiée
const findNearestDateAnnualized = (arrayOfDates, year, dateToFind) => {
  // Step 1: Convert date strings to Date objects
  const dateObjects = arrayOfDates.map((dateStr) => new Date(dateStr));

  // Step 2: Calculate the date a year behind the dateToFind
  const dateToFindObject = new Date(dateToFind);
  const yearBehind = new Date(dateToFindObject);
  yearBehind.setFullYear(yearBehind.getFullYear() - year);

  // Step 3: Search for the calculated date in the array
  const foundDate = dateObjects.find((date) => date.getTime() === yearBehind.getTime());

  if (foundDate) {
    // If the calculated date is found, return it
    return foundDate.toISOString().slice(0, 10); // Convert it back to 'YYYY-MM-DD' format
  } else {
    // Step 4: Find the nearest date before the calculated date
    const nearestDatesBefore = dateObjects.filter((date) => date.getTime() < yearBehind.getTime());
    if (nearestDatesBefore.length > 0) {
      const nearestDate = nearestDatesBefore.reduce((acc, curr) => {
        return curr.getTime() > acc.getTime() ? curr : acc;
      });
      return nearestDate.toISOString().slice(0, 10); // Convert it back to 'YYYY-MM-DD' format
    } else {
      // If there are no dates before the calculated date, return the last date in the array
      // return dateObjects[dateObjects.length - 1].toISOString().slice(0, 10);
      return findLastDateOfPreviousMonth(dateObjects)
    }
  }
}

//meme chose mais avec les mois
const findNearestDateMonthlized = (arrayOfDates, months, dateToFind) => {
  // Step 1: Convert date strings to Date objects
  const dateObjects = arrayOfDates.map((dateStr) => new Date(dateStr));

  // Step 2: Calculate the date a specified number of months behind the dateToFind
  const dateToFindObject = new Date(dateToFind);
  const monthsBehind = new Date(dateToFindObject);
  monthsBehind.setMonth(monthsBehind.getMonth() - months);

  // Step 3: Search for the calculated date in the array
  const foundDate = dateObjects.find((date) => date.getTime() === monthsBehind.getTime());

  if (foundDate) {
    // If the calculated date is found, return it
    return foundDate.toISOString().slice(0, 10); // Convert it back to 'YYYY-MM-DD' format
  } else {
    // Step 4: Find the nearest date before the calculated date
    const nearestDatesBefore = dateObjects.filter((date) => date.getTime() < monthsBehind.getTime());
    if (nearestDatesBefore.length > 0) {
      const nearestDate = nearestDatesBefore.reduce((acc, curr) => {
        return curr.getTime() > acc.getTime() ? curr : acc;
      });
      return nearestDate.toISOString().slice(0, 10); // Convert it back to 'YYYY-MM-DD' format
    } else {
      // If there are no dates before the calculated date, return the last date in the array
      return dateObjects[dateObjects.length - 1].toISOString().slice(0, 10);
    }
  }
};

//derniere date du mois precedent
const findLastDateOfPreviousMonth = (arrayOfDates) => {
  // Step 1: Convert date strings to Date objects
  const dateObjects = arrayOfDates.map((dateStr) => new Date(dateStr));

  // Step 2: Find the last date and extract the month and year
  const lastDate = new Date(Math.max(...dateObjects));
  const lastMonth = lastDate.getMonth();
  const lastYear = lastDate.getFullYear();

  // Step 3: Calculate the last date of the previous month
  const lastDateOfPreviousMonth = new Date(lastYear, lastMonth, 0);

  // Step 4: Search for the last date of the previous month in the array
  const foundDate = dateObjects.find((date) => date.getTime() === lastDateOfPreviousMonth.getTime());

  if (foundDate) {
    // If the last date of the previous month is found, return it
    return foundDate.toISOString().slice(0, 10); // Convert it back to 'YYYY-MM-DD' format
  } else {
    // Step 5: Find the nearest date before the last date of the previous month in the array
    const nearestDatesBefore = dateObjects.filter((date) => date.getTime() < lastDateOfPreviousMonth.getTime());
    if (nearestDatesBefore.length > 0) {
      const nearestDate = new Date(Math.max(...nearestDatesBefore));
      return nearestDate.toISOString().slice(0, 10); // Convert it back to 'YYYY-MM-DD' format
    } else {
      // If there are no dates before the last date of the previous month in the array,
      // return the last date in the array
      return lastDate.toISOString().slice(0, 10);
    }
  }
}




//prends la derniere date du tableau et trouve son equivalent il y a year ans
const findNearestDate = (arrayOfDates, year) => {
  // Step 1: Convert date strings to Date objects
  const dateObjects = arrayOfDates.map((dateStr) => new Date(dateStr));

  // Step 2: Find the last date and calculate the date a year behind it
  const lastDate = dateObjects[dateObjects.length - 1];
  const yearBehind = new Date(lastDate);
  yearBehind.setFullYear(yearBehind.getFullYear() - year);

  // Step 3: Search for the calculated date in the array
  const foundDate = dateObjects.find((date) => date.getTime() === yearBehind.getTime());

  if (foundDate) {
    // If the calculated date is found, return it
    return foundDate.toISOString().slice(0, 10); // Convert it back to 'YYYY-MM-DD' format
  } else {
    // Step 4: Find the nearest date before the calculated date
    const nearestDatesBefore = dateObjects.filter((date) => date.getTime() < yearBehind.getTime());
    if (nearestDatesBefore.length > 0) {
      const nearestDate = nearestDatesBefore.reduce((acc, curr) => {
        return curr.getTime() > acc.getTime() ? curr : acc;
      });
      return nearestDate.toISOString().slice(0, 10); // Convert it back to 'YYYY-MM-DD' format
    } else {
      // If there are no dates before the calculated date, return the last date in the array
      return lastDate.toISOString().slice(0, 10);
    }
  }
}

//prends la derniere date du tableau et trouve son equivalent il y a year ans
const findNearestDatemois = (arrayOfDates, year) => {
  // Step 1: Convert date strings to Date objects
  const dateObjects = arrayOfDates.map((dateStr) => new Date(dateStr));

  // Step 2: Find the last date and calculate the date a year behind it
  const lastDate = dateObjects[dateObjects.length - 1];
  const yearBehind = new Date(lastDate);
  yearBehind.setFullYear(yearBehind.getFullYear() - year);

  // Step 3: Search for the calculated date in the array
  const foundDate = dateObjects.find((date) => date.getTime() === yearBehind.getTime());

  if (foundDate) {
    // If the calculated date is found, return it
    return foundDate.toISOString().slice(0, 10); // Convert it back to 'YYYY-MM-DD' format
  } else {
    // Step 4: Find the nearest date before the calculated date
    const nearestDatesBefore = dateObjects.filter((date) => date.getTime() < yearBehind.getTime());
    if (nearestDatesBefore.length > 0) {
      const nearestDate = nearestDatesBefore.reduce((acc, curr) => {
        return curr.getTime() > acc.getTime() ? curr : acc;
      });
      return nearestDate.toISOString().slice(0, 10); // Convert it back to 'YYYY-MM-DD' format
    } else {
      // If there are no dates before the calculated date, return the last date in the array
      return null;
    }
  }
}

//prends la derniere date du tableau et trouve son equivalent il y a year ans
const findNearestDatetoyear = (arrayOfDates, year, date) => {
  // Step 1: Convert date strings to Date objects
  const dateObjects = arrayOfDates.map((dateStr) => new Date(dateStr));

  // Step 2: Find the last date and calculate the date a year behind it
  const lastDate = date;
  const yearBehind = new Date(lastDate);
  yearBehind.setFullYear(yearBehind.getFullYear() - year);

  // Step 3: Search for the calculated date in the array
  const foundDate = dateObjects.find((date) => date.getTime() === yearBehind.getTime());

  if (foundDate) {
    // If the calculated date is found, return it
    return foundDate.toISOString().slice(0, 10); // Convert it back to 'YYYY-MM-DD' format
  } else {
    // Step 4: Find the nearest date before the calculated date
    const nearestDatesBefore = dateObjects.filter((date) => date.getTime() < yearBehind.getTime());
    if (nearestDatesBefore.length > 0) {
      const nearestDate = nearestDatesBefore.reduce((acc, curr) => {
        return curr.getTime() > acc.getTime() ? curr : acc;
      });
      return nearestDate.toISOString().slice(0, 10); // Convert it back to 'YYYY-MM-DD' format
    } else {
      // If there are no dates before the calculated date, return the last date in the array
      return lastDate.toISOString().slice(0, 10);
    }
  }
}

//meme chose qu'avant mais pour les semaines
const findNearestDateWeek = (arrayOfDates) => {
  // Step 1: Convert date strings to Date objects
  const dateObjects = arrayOfDates.map((dateStr) => new Date(dateStr));

  // Step 2: Find the last date and calculate the date 4 weeks behind it
  const lastDate = dateObjects[dateObjects.length - 1];
  const fourWeeksBehind = new Date(lastDate);
  fourWeeksBehind.setDate(fourWeeksBehind.getDate() - 28);

  // Step 3: Search for the calculated date in the array
  const foundDate = dateObjects.find((date) => date.getTime() === fourWeeksBehind.getTime());

  if (foundDate) {
    // If the calculated date is found, return it
    return foundDate.toISOString().slice(0, 10); // Convert it back to 'YYYY-MM-DD' format
  } else {
    // Step 4: Find the nearest date before the calculated date
    const nearestDatesBefore = dateObjects.filter((date) => date.getTime() < fourWeeksBehind.getTime());
    if (nearestDatesBefore.length > 0) {
      const nearestDate = nearestDatesBefore.reduce((acc, curr) => {
        return curr.getTime() > acc.getTime() ? curr : acc;
      });
      return nearestDate.toISOString().slice(0, 10); // Convert it back to 'YYYY-MM-DD' format
    } else {
      // If there are no dates before the calculated date, return the last date in the array
      return lastDate.toISOString().slice(0, 10);
    }
  }
}

//meme chose quavant mais trouve le 1er janvier
const findNearestDateJanuary = (arrayOfDates) => {
  // Step 1: Convert date strings to Date objects
  const dateObjects = arrayOfDates.map((dateStr) => new Date(dateStr));

  // Step 2: Find the last date and calculate the date of 1st January of the same year
  const lastDate = dateObjects[dateObjects.length - 1];
  const year = lastDate.getFullYear();
  const firstJanuary = new Date(year, 0, 1);

  // Step 3: Search for the calculated date in the array
  const foundDate = dateObjects.find((date) => date.getTime() === firstJanuary.getTime());

  if (foundDate) {
    // If the calculated date is found, return it
    return foundDate.toISOString().slice(0, 10); // Convert it back to 'YYYY-MM-DD' format
  } else {
    // Step 4: Find the nearest date before the calculated date
    const nearestDatesBefore = dateObjects.filter((date) => date.getTime() < firstJanuary.getTime());
    if (nearestDatesBefore.length > 0) {
      const nearestDate = nearestDatesBefore.reduce((acc, curr) => {
        return curr.getTime() > acc.getTime() ? curr : acc;
      });
      return nearestDate.toISOString().slice(0, 10); // Convert it back to 'YYYY-MM-DD' format
    } else {
      // If there are no dates before the calculated date, return the last date in the array
      return lastDate.toISOString().slice(0, 10);
    }
  }
}

//prends la derniere date et trouve les equivalents 1,2 et 3 ans en arriere 
const findLastDatesForEachPreviousYear = (dateArray) => {

  const dateObjects = dateArray.map((dateStr) => new Date(dateStr));
  const lastDate = new Date(dateArray[dateArray.length - 1]); // Get the last date (most recent date)

  const previousYears = [];
  for (let i = 1; i <= 4; i++) {
    const previousYear = new Date(lastDate);
    previousYear.setFullYear(lastDate.getFullYear() - i);
    previousYears.push(previousYear.getFullYear());
  }


  const year1 = dateObjects.filter(date => date.getFullYear() == previousYears[0])
  const year2 = dateObjects.filter(date => date.getFullYear() == previousYears[1])
  const year3 = dateObjects.filter(date => date.getFullYear() == previousYears[2])
  const year4 = dateObjects.filter(date => date.getFullYear() == previousYears[3])


  return [
    year1.reverse()[0].toISOString().substring(0, 10),
    year2.reverse()[0].toISOString().substring(0, 10),
    year3.reverse()[0].toISOString().substring(0, 10),
    year4.reverse()[0].toISOString().substring(0, 10)
  ]


}

//groupes un tableau de dates par semaine
const groupDatesByWeek = (dates) => {
  const result = [];
  const sortedDates = dates.map(date => new Date(date)).sort((a, b) => a - b);

  let currentWeek = [];
  let currentWeekStart = startOfWeek(sortedDates[0]);

  for (const currentDate of sortedDates) {
    if (isWeekend(currentDate)) {
      continue;
    }

    const currentDateStartOfWeek = startOfWeek(currentDate);

    if (currentDateStartOfWeek.getTime() === currentWeekStart.getTime()) {
      currentWeek.push(currentDate.toISOString());
    } else {
      result.push(currentWeek);
      currentWeek = [currentDate.toISOString()];
      currentWeekStart = currentDateStartOfWeek;
    }
  }

  if (currentWeek.length > 0) {
    result.push(currentWeek);
  }

  return result;
}

//meme chose mais par mois
const groupDatesByMonth = (dates) => {
  const result = [];
  const sortedDates = dates.map(date => new Date(date)).sort((a, b) => a - b);

  let currentMonth = [];
  let currentMonthStart = startOfMonth(sortedDates[0]);

  for (const currentDate of sortedDates) {
    const currentDateStartOfMonth = startOfMonth(currentDate);

    if (currentDateStartOfMonth.getTime() === currentMonthStart.getTime()) {
      currentMonth.push(currentDate.toISOString());
    } else {
      result.push(currentMonth);
      currentMonth = [currentDate.toISOString()];
      currentMonthStart = currentDateStartOfMonth;
    }
  }

  if (currentMonth.length > 0) {
    result.push(currentMonth);
  }

  return result;
}

const groupDatesByMonth1 = (dates) => {
  const result = [];
  const sortedDates = dates.map(date => new Date(date)).sort((a, b) => a - b);

  let currentYear = [];
  let currentYearStart = startOfYear(sortedDates[0]);

  for (const currentDate of sortedDates) {
    const currentDateStartOfYear = startOfYear(currentDate);

    if (currentDateStartOfYear.getTime() === currentYearStart.getTime()) {
      currentYear.push(currentDate.toISOString());
    } else {
      if (currentYear.length === 12) {
        result.push(currentYear);
      }
      currentYear = [currentDate.toISOString()];
      currentYearStart = currentDateStartOfYear;
    }
  }

  if (currentYear.length === 12) {
    result.push(currentYear);
  }

  return result;
}


//meme chose mais par année
const groupDatesByYear = (dates) => {
  const result = [];
  const sortedDates = dates.map(date => new Date(date)).sort((a, b) => a - b);

  let currentYear = [];
  let currentYearStart = startOfYear(sortedDates[0]);

  for (const currentDate of sortedDates) {
    const currentDateStartOfYear = startOfYear(currentDate);

    if (currentDateStartOfYear.getTime() === currentYearStart.getTime()) {
      currentYear.push(currentDate.toISOString());
    } else {
      result.push(currentYear);
      currentYear = [currentDate.toISOString()];
      currentYearStart = currentDateStartOfYear;
    }
  }

  if (currentYear.length > 0) {
    result.push(currentYear);
  }

  return result;
}

//change la structure d'un tableau et le rend par semaine
const adaptValuesToGroupedWeeks = (values, groupedDatesByWeek) => {
  const result = [];
  let currentIndex = 0;

  for (let i = 0; i < groupedDatesByWeek.length; i++) {
    const currentWeekLength = groupedDatesByWeek[i].length;
    const currentWeekValues = values.slice(currentIndex, currentIndex + currentWeekLength);
    result.push(currentWeekValues);
    currentIndex += currentWeekLength;
  }

  return result;
}

//meme chose mais par mois
const adaptValuesToGroupedMonths = (values, groupedDatesByMonth) => {
  const result = [];
  let currentIndex = 0;

  for (let i = 0; i < groupedDatesByMonth.length; i++) {
    const currentMonthLength = groupedDatesByMonth[i].length;
    const currentMonthValues = values.slice(currentIndex, currentIndex + currentMonthLength);
    result.push(currentMonthValues);
    currentIndex += currentMonthLength;
  }

  return result;
}
//meme chose mais par mois
const adaptValuesToGroupedYears = (values, groupedDatesByYear) => {
  const result = [];
  let currentIndex = 0;

  for (let i = 0; i < groupedDatesByYear.length; i++) {
    const currentYearLength = groupedDatesByYear[i].length;
    const currentYearValues = values.slice(currentIndex, currentIndex + currentYearLength);
    result.push(currentYearValues);
    currentIndex += currentYearLength;
  }

  return result;
}

//meme chose mais par mois
const AdaptTableauwithdate = (values, groupedDatesByYear) => {
  const result = [];
  let currentIndex = 0;
  groupedDatesByYear = groupedDatesByYear.reverse();
  values = values.reverse();
  for (let i = 0; i < groupedDatesByYear.length - 1; i++) {
    const currentYearLength = groupedDatesByYear[i].length;
    const currentYearValues = values[i][values[i].length - 1];
    const currentlastYearValues = values[i + 1][values[i + 1].length - 1];
    const year = groupedDatesByYear[i][0].slice(0, 4);
    const valueYear = (currentYearValues - currentlastYearValues) / currentlastYearValues

    result.push([year, currentYearValues, valueYear]);
    // result[year].push(valueYear);
    currentIndex += currentYearLength;
  }

  return result;
}

const AdaptTableaumonthwithdate = (values, groupedDatesByYear) => {
  const result = [];
  let currentIndex = 0;
  groupedDatesByYear = groupedDatesByYear.reverse();
  values = values.reverse();
  for (let i = 0; i < groupedDatesByYear.length - 1; i++) {
    const currentYearLength = groupedDatesByYear[i].length;
    const currentYearValues = values[i][values[i].length - 1];
    const currentlastYearValues = values[i + 1][values[i + 1].length - 1];
    const year = groupedDatesByYear[i][0].slice(0, 4);
    const valueYear = (currentYearValues - currentlastYearValues) / currentlastYearValues

    const month = groupedDatesByYear[i][0].slice(5, 7);

    if (!result[year]) {
      result[year] = [];
    }

    result[year].push([month, currentYearValues, valueYear]);

    // result[year].push(valueYear);
    currentIndex += currentYearLength;
  }

  // Convert the result object to the desired format
  const finalResult = Object.entries(result).map(([year, values]) => ({
    [year]: values,
  }));

  return finalResult.reverse();
}

const AdaptTableauweekwithdate = (values, groupedDatesByYear) => {
  const result = [];
  let currentIndex = 0;
  groupedDatesByYear = groupedDatesByYear.reverse();
  values = values.reverse();
  for (let i = 0; i < groupedDatesByYear.length - 1; i++) {
    const currentYearLength = groupedDatesByYear[i].length;
    const currentYearValues = values[i][values[i].length - 1];
    const currentlastYearValues = values[i + 1][values[i + 1].length - 1];
    const year = groupedDatesByYear[i][0].slice(0, 10);
    const valueYear = (currentYearValues - currentlastYearValues) / currentlastYearValues

    result.push([year, currentYearValues, valueYear]);
    // result[year].push(valueYear);
    currentIndex += currentYearLength;
  }

  return result;
}

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
  findNearestDatemois
}

