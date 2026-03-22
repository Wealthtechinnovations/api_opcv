const express = require('express');
const router = express.Router();
const { Sequelize } = require('sequelize');
const Op = Sequelize.Op;
const moment = require('moment');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const exceljs = require('exceljs');
const { PDFDocument, rgb } = require('pdf-lib');
const { Document, Packer, Paragraph, TextRun, ImageRun } = require('docx');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const puppeteer = require('puppeteer');
const ImageModule = require('docxtemplater-image-module-free');

const {
  vl,
  fond,
  sequelize,
  portefeuille,
  portefeuille_vl,
  portefeuilles_proposes_vls,
  users,
  societe,
  performences,
  simulation,
  simulationportefeuille,
} = require('../shared/db');

const { authenticate } = require('../shared/middleware');

const {
  groupDatesByYear,
  adaptValuesToGroupedYears,
  AdaptTableauwithdate,
} = require('../../src/functions/dates');

// ---------------------
// Resolve file paths relative to project root
// ---------------------
const projectRoot = path.resolve(__dirname, '../../');
const fichiersDir = path.join(projectRoot, 'fichiers');

// ---------------------
// Helper: isWeekend
// ---------------------
function isWeekend(date) {
  const dayOfWeek = date.day();
  return dayOfWeek === 0 || dayOfWeek === 6; // 0 for Sunday, 6 for Saturday
}

// ---------------------
// Helper: getMissingDates
// ---------------------
async function getMissingDates(fundId) {
  const fundRecord = await fond.findOne({ where: { id: fundId } });
  const periodicite = fundRecord.periodicite;
  const firstVlDate = await vl.min('date', {
    where: { fund_id: fundId },
  });
  const increment = periodicite === 'Journaliere' ? 'days' : 'weeks';
  const missingDates = [];

  if (periodicite === 'Journaliere') {
    for (let date = moment(firstVlDate); date.isBefore(moment()); date.add(1, increment)) {
      if (isWeekend(date)) {
        continue;
      }
      const vlExists = await vl.findOne({ where: { fund_id: fundId, date: date.format('YYYY-MM-DD') } });
      if (!vlExists) {
        missingDates.push(date.format('YYYY-MM-DD'));
      }
    }
  } else if (periodicite === 'Hebdomadaire') {
    for (let date = moment(firstVlDate); date.isBefore(moment()); date.add(1, increment)) {
      const startOfWeek = date.clone().startOf('isoWeek');
      const endOfWeek = date.clone().endOf('isoWeek');

      const weeklyVlDates = await vl.findAll({
        where: {
          fund_id: fundId,
          date: {
            [Op.between]: [startOfWeek.format('YYYY-MM-DD'), endOfWeek.format('YYYY-MM-DD')],
          },
        },
        limit: 500,
      });

      if (weeklyVlDates.length === 0) {
        missingDates.push({ week: startOfWeek.format('YYYY-MM-DD'), status: 'manquant' });
      } else if (weeklyVlDates.length > 1) {
        missingDates.push({ week: startOfWeek.format('YYYY-MM-DD'), status: 'double date' });
      }
    }
  }

  return missingDates;
}

// ---------------------
// Helper: findCommonDates
// ---------------------
function findCommonDates(dataSets) {
  const dateSetsMapped = dataSets.map(data => new Set(data.map(row => moment(row.date).format('YYYY-MM-DD'))));
  let commonDates = [...dateSetsMapped[0]];
  for (let i = 1; i < dateSetsMapped.length; i++) {
    commonDates = commonDates.filter(date => dateSetsMapped[i].has(date));
  }
  return commonDates;
}

// =============================================
// REPORT / DOCUMENT GENERATION ROUTES
// =============================================

// GET /api/fill-template
router.get('/api/fill-template', async (req, res) => {
  try {
    const templatePath = path.join(fichiersDir, 'template.pdf');
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({ error: 'Le fichier PDF n\'existe pas.' });
    }

    const usersData = await societe.findAll({ limit: 500 });

    const existingPdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    let yOffset = 700;
    usersData.forEach(user => {
      firstPage.drawText(`Name: ${user.nom}, Email: ${user.email}`, {
        x: 50,
        y: yOffset,
        size: 12,
        color: rgb(0, 0, 0),
      });
      yOffset -= 20;
    });

    const pdfBytes = await pdfDoc.save();

    res.setHeader('Content-Disposition', 'attachment; filename="filled_template.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBytes);
  } catch (error) {
    console.error('Erreur lors du traitement du template PDF :', error);
    res.status(500).json({ error: 'Erreur lors du traitement du template PDF.' });
  }
});

// GET /api/telechargerword
router.get('/api/telechargerword', async (req, res) => {
  try {
    const user = await societe.findOne();

    const content = fs.readFileSync(path.join(fichiersDir, 'template.docx'));
    const zip = new PizZip(content);

    // Capture screenshots of the specific tables using Puppeteer
    const urls = [
      'https://funds.chainsolutions.fr/fundview/historique/1114',
      'https://funds.chainsolutions.fr/fundview/historique/1115',
      'https://funds.chainsolutions.fr/fundview/historique/1116',
    ];
    const screenshotPaths = [];
    const browser = await puppeteer.launch({ headless: true });

    for (let i = 0; i < urls.length; i++) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      await page.goto(urls[i]);

      await page.waitForFunction(() => {
        const table = document.querySelector('#tabPerfGlissante');
        return table && table.querySelectorAll('tbody tr').length > 0;
      });

      await page.evaluate(() => {
        const table = document.querySelector('#tabPerfGlissante');
        table.scrollIntoView();
      });

      const table = await page.$('#tabPerfGlissante');
      const screenshotBuffer = await table.screenshot();

      const screenshotPath = path.resolve(path.join(fichiersDir, `screenshot${i + 1}.png`));
      fs.writeFileSync(screenshotPath, screenshotBuffer);
      screenshotPaths.push(screenshotPath);

      await page.close();
    }
    await browser.close();

    const data = {
      nom: user.nom,
      email: user.email,
      performances: [
        { date: '2022-01-01', performance: 0.5 },
        { date: '2022-02-01', performance: 0.6 },
        { date: '2022-03-01', performance: 0.7 },
      ],
      image1: path.join(fichiersDir, 'screenshot1.png'),
      image2: path.join(fichiersDir, 'screenshot2.png'),
      image3: path.join(fichiersDir, 'screenshot3.png'),
    };

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.setData(data);
    doc.render();

    let buf = doc.getZip().generate({ type: 'nodebuffer' });

    const zipWithImages = new PizZip(buf);

    const imagePlaceholders = ['image1', 'image2', 'image3'];
    imagePlaceholders.forEach((placeholder, index) => {
      const filePath = data[placeholder];
      if (filePath && fs.existsSync(filePath)) {
        const imageFile = fs.readFileSync(filePath);
        zipWithImages.file(`word/media/image${index + 1}.png`, imageFile);
      }
    });

    const updatedDoc = new Docxtemplater(zipWithImages);
    const finalBuf = updatedDoc.getZip().generate({ type: 'nodebuffer' });

    res.setHeader('Content-Disposition', 'attachment; filename="filled_template.docx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(finalBuf);

    // Clean up temporary screenshots
    screenshotPaths.forEach(filePath => fs.unlinkSync(filePath));
  } catch (error) {
    console.error('Erreur lors du traitement du template Word :', error);
    res.status(500).json({ error: 'Erreur lors du traitement du template Word.' });
  }
});

// GET /api/wordexemple
router.get('/api/wordexemple', async (req, res) => {
  const content = fs.readFileSync(path.join(fichiersDir, 'Templateexport.docx'), 'binary');
  const zip = new PizZip(content);

  const imageOpts = {
    centered: false,
    getImage: (tagValue) => {
      try {
        const imageBuffer = fs.readFileSync(tagValue);
        return imageBuffer;
      } catch (error) {
        console.error("Erreur de chargement de l'image:", error);
        return Buffer.from('');
      }
    },
    getSize: () => [150, 150],
  };
  const imageModule = new ImageModule(imageOpts);
  const doc = new Docxtemplater(zip, { modules: [imageModule] });

  const data = {
    nom_fonds: 'ECHIQUIER MAJOR SRI GROWTH EUROPE A',
    date_creation: '11/03/2005',
    valeur_liquidative: '351,48 \u20ac',
    actif_net: '1 223 M\u20ac',
    commentaire: 'Echiquier Major SRI Growth Europe A progresse de 3,57%...',
    image_fond: path.join(fichiersDir, 'test.png'),
  };

  doc.setData(data);

  try {
    doc.render();
    const buffer = doc.getZip().generate({ type: 'nodebuffer' });
    res.setHeader('Content-Disposition', 'attachment; filename=output.docx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buffer);
    console.log('Document cr\u00e9\u00e9 avec succ\u00e8s !');
  } catch (error) {
    console.error('Erreur lors du traitement du template Word :', error);
    res.status(500).json({ error: 'Erreur lors du traitement du template Word.' });
  }
});

// POST /api/reportingmensuelle
router.post('/api/reportingmensuelle', async (req, res) => {
  try {
    const { selectedOptions1, managerComments, selectedMonth, selectedYear } = req.body;

    const user = await societe.findOne();

    const content = fs.readFileSync(path.join(fichiersDir, 'template.docx'));
    const zip = new PizZip(content);

    const urls = ['https://funds.chainsolutions.fr/Opcvm/historique/1114'];
    const screenshotPaths = [];
    const browser = await puppeteer.launch({ headless: true });

    for (let i = 0; i < urls.length; i++) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      await page.goto(urls[i]);

      await page.waitForFunction(() => {
        const table = document.querySelector('#tabPerfGlissante');
        return table && table.querySelectorAll('tbody tr').length > 0;
      });

      const table = await page.$('#tabPerfGlissante');
      const screenshotBuffer = await table.screenshot();

      const screenshotPath = path.resolve(path.join(fichiersDir, `screenshot${i + 1}.png`));
      fs.writeFileSync(screenshotPath, screenshotBuffer);
      screenshotPaths.push(screenshotPath);

      await page.close();
    }
    await browser.close();

    const data = {
      nom: user.nom,
      email: user.email,
      performances: [
        { date: '2022-01-01', performance: 0.5 },
        { date: '2022-02-01', performance: 0.6 },
        { date: '2022-03-01', performance: 0.7 },
      ],
      image1: path.join(fichiersDir, 'screenshot1.png'),
      image2: path.join(fichiersDir, 'screenshot2.png'),
    };

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.setData(data);
    doc.render();

    let buf = doc.getZip().generate({ type: 'nodebuffer' });

    const zipWithImages = new PizZip(buf);

    const imagePlaceholders = ['image1', 'image2'];
    imagePlaceholders.forEach((placeholder, index) => {
      const filePath = data[placeholder];
      if (filePath && fs.existsSync(filePath)) {
        const imageFile = fs.readFileSync(filePath);
        zipWithImages.file(`word/media/image${index + 1}.png`, imageFile);
      }
    });

    const updatedDoc = new Docxtemplater(zipWithImages);
    const finalBuf = updatedDoc.getZip().generate({ type: 'nodebuffer' });

    res.setHeader('Content-Disposition', 'attachment; filename="filled_template.docx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(finalBuf);

    screenshotPaths.forEach(filePath => fs.unlinkSync(filePath));
  } catch (error) {
    console.error('Erreur lors du traitement du template Word :', error);
    res.status(500).json({ error: 'Erreur lors du traitement du template Word.' });
  }
});

// GET /api/generate-excel-report
router.get('/api/generate-excel-report', async (req, res) => {
  try {
    const societegestion = req.query.societegestion;

    const highVolatilityFundsVLManquante = await performences.findAll({
      attributes: ['fond_id'],
      where: { anomalie: 'VL MANQUANTE' },
      raw: true,
      limit: 500,
    });

    const combinedData = [
      ...highVolatilityFundsVLManquante.map(fund => ({ id: fund.fond_id, anomalie: 'VL MANQUANTE' })),
    ];

    const highVolatilityFundsData = [];

    for (const data of combinedData) {
      let fundData;
      if (societegestion) {
        fundData = await fond.findOne({ where: { id: data.id, societe_gestion: societegestion } });
      } else {
        fundData = await fond.findOne({ where: { id: data.id } });
      }
      if (fundData) {
        highVolatilityFundsData.push(fundData);
      }
    }

    const dataWithAnomalyType = [];
    const seenCombinations = new Set();

    for (const fund of highVolatilityFundsData) {
      const id = fund.id;
      const correspondingData = combinedData.filter(data => data.id === id);

      for (const data of correspondingData) {
        const combinationKey = `${fund.id}-${data.anomalie}`;

        if (!seenCombinations.has(combinationKey)) {
          seenCombinations.add(combinationKey);

          if (data.anomalie === 'VL MANQUANTE') {
            const missingDates = await getMissingDates(fund.id);

            dataWithAnomalyType.push({
              ...fund.toJSON(),
              type_anomalie: data.anomalie,
              anomalies: missingDates,
            });
          }
        }
      }
    }

    // Generate Excel report
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('Anomalies Fonds');

    worksheet.columns = [
      { header: 'ID Fonds', key: 'id', width: 15 },
      { header: 'Nom Fonds', key: 'nom_fond', width: 30 },
      { header: 'Code ISIN', key: 'code_ISIN', width: 20 },
      { header: 'Type d\'Anomalie', key: 'periodicite', width: 20 },
      { header: 'Type d\'Anomalie', key: 'type_anomalie', width: 20 },
      { header: 'missing_date', key: 'missing_date', width: 50 },
    ];
    const datesWorksheet = workbook.addWorksheet('Dates Uniques');
    datesWorksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
    ];

    dataWithAnomalyType.forEach(fund => {
      fund.anomalies.forEach(date => {
        worksheet.addRow({
          id: fund.id,
          nom_fond: fund.nom_fond,
          code_ISIN: fund.code_ISIN,
          periodicite: fund.periodicite,
          type_anomalie: fund.type_anomalie,
          missing_date: date,
        });
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=rapport_anomalies.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// =============================================
// RECONSTITUTION ROUTES
// =============================================

// POST /api/reconstitution
router.post('/api/reconstitution', async (req, res) => {
  try {
    const valorisations = [];
    let montantInvestissement = 0;
    for (const entry of req.body) {
      const { date, montantInvesti, fondId, portefeuilleselect } = entry;
      montantInvestissement += montantInvesti;

      let vls = await vl.findAll({
        where: {
          fund_id: fondId,
          date: {
            [Op.gte]: date,
          },
        },
        limit: 500,
      });
      const quantite = montantInvesti / vls[0].value;

      for (const dateRow of vls) {
        const valorisation = quantite * dateRow.value;
        valorisations.push({ date: dateRow.date, value: valorisation, fund_id: fondId, portefeuille_id: portefeuilleselect });
      }

      await portefeuille_vl.bulkCreate(valorisations);
    }

    const updatedData = {
      montant_invest: montantInvestissement,
    };

    await portefeuille.update(updatedData, {
      where: { id: portefeuille },
    });

    return res.json({ code: 200, data: 'succes' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors du calcul de la valorisation' });
  }
});

// GET /api/searchFundsreconstitution
router.get('/api/searchFundsreconstitution', async (req, res) => {
  const { categorie, univers, universsous, selectedPays, selectedRegion } = req.query;

  const categories = categorie.split(',');

  const getFundsByCategorie = async (categories) => {
    let query;
    if (categories.includes('Toutes les classes')) {
      query = `
        SELECT f.*
        FROM fond_investissements AS f
        WHERE f.id IN (SELECT v.fund_id FROM valorisations AS v)
      `;
    } else {
      query = `
        SELECT f.*
        FROM fond_investissements AS f
        WHERE f.id IN (SELECT v.fund_id FROM valorisations AS v)
        AND f.categorie_globale IN (${categories.map(cat => `'${cat}'`).join(',')})
      `;
    }
    if (selectedPays) {
      query += `
        AND f.pays = :selectedPays
      `;
    }
    if (selectedRegion) {
      query += `
        AND f.region = :selectedRegion
      `;
    }

    const fondsDansCategorie = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT,
      replacements: { selectedRegion, selectedPays },
    });

    return fondsDansCategorie.map(data => ({
      label: data.nom_fond.toString() + ' ' + data.code_ISIN,
      value: data.id,
    }));
  };

  const getFundsByRegionalCategorie = async (univers, universsous, categories) => {
    const categorieWithUnivers = categories.map(cat => `'${cat} ${univers}'`);
    let query;
    if (univers === 'Tous univers') {
      query = `
        SELECT f.*
        FROM fond_investissements AS f
        WHERE f.id IN (SELECT v.fund_id FROM valorisations AS v)
      `;
    } else {
      query = `
        SELECT f.*
        FROM fond_investissements AS f
        WHERE f.id IN (SELECT v.fund_id FROM valorisations AS v)
        AND f.categorie_regional IN (${categorieWithUnivers.join(',')})
      `;
    }
  };

  const getFundsByNationalCategorie = async (universsous, categories) => {
    const categorieWithUniverssous = categories.map(cat => `'${cat} ${universsous}'`);
    let query;
    if (univers === 'Tous univers') {
      query = `
        SELECT f.*
        FROM fond_investissements AS f
        WHERE f.id IN (SELECT v.fund_id FROM valorisations AS v)
      `;
    } else {
      query = `
        SELECT f.*
        FROM fond_investissements AS f
        WHERE f.id IN (SELECT v.fund_id FROM valorisations AS v)
        AND f.categorie_national IN (${categorieWithUniverssous.join(',')})
      `;
    }
    const fondsDansCategorieNationale = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT,
    });

    return fondsDansCategorieNationale.map(data => ({
      label: data.nom_fond.toString() + ' ' + data.code_ISIN,
      value: data.id,
    }));
  };

  const [fundsByCategorie, fundsByRegionalCategorie, fundsByNationalCategorie] = await Promise.all([
    getFundsByCategorie(categories),
    getFundsByRegionalCategorie(univers, universsous, categories),
    getFundsByNationalCategorie(universsous, categories),
  ]);

  res.json({
    code: 200,
    data: {
      fundsByCategorie,
      fundsByRegionalCategorie,
      fundsByNationalCategorie,
    },
  });
});

// =============================================
// ROBO-ADVISOR ROUTES
// =============================================

// GET /api/robotadvisor/fonds
router.get('/api/robotadvisor/fonds', async (req, res) => {
  const ids = req.query.ids.split(',');
  const fundIds = ids;
  var PortfolioAllocation = require('portfolio-allocation');
  var minWeight = [];
  var maxWeight = [];
  if (req.query.minweight) {
    minWeight = JSON.parse(req.query.minweight);
    maxWeight = JSON.parse(req.query.maxweight);
  }

  const minReturn = req.query.minReturn / 100;
  const maxReturn = req.query.maxReturn / 100;
  const minVolatility = req.query.minVolatility / 100;
  const maxVolatility = req.query.maxVolatility / 100;

  try {
    // Get history for each fund and find common dates
    const fundData = await Promise.all(
      fundIds.map(async fundId => {
        const data = await vl.findAll({
          where: { fund_id: fundId },
          order: [['date', 'ASC']],
          limit: 500,
        });
        return { fundId, data };
      })
    );

    const commonDates = findCommonDates(fundData.map(entry => entry.data));

    const filteredData = fundData.map(entry => {
      const filteredValues = entry.data.filter(row => commonDates.includes(moment(row.date).format('YYYY-MM-DD')));
      return {
        fundId: entry.fundId,
        values: filteredValues.map(row => row.value),
      };
    });

    // Calculate returns for each fund
    const returnsData = filteredData.map(entry => {
      const values = entry.values;
      const ArrayDates = groupDatesByYear(commonDates);
      const adaptValues = adaptValuesToGroupedYears(values, ArrayDates);
      const adaptValues1 = AdaptTableauwithdate(adaptValues, ArrayDates);
      return {
        fundId: entry.fundId,
        returns: adaptValues1,
      };
    });

    const ddd = returnsData.map(entry => entry.returns);
    const extraireRendements = ddd.map(fondItem => {
      return fondItem.map(anneeData => anneeData[2]);
    });
    const tableauConcatene = extraireRendements.map((sousTableau) => {
      return sousTableau.flatMap((element) => element);
    });

    console.log(tableauConcatene);
    const tableauTransforme = [];
    for (let i = 0; i < tableauConcatene[0].length; i++) {
      const colonne = [];
      for (let j = 0; j < tableauConcatene.length; j++) {
        colonne.push(tableauConcatene[j][i]);
      }
      tableauTransforme.push(colonne);
    }

    const minnestedArray = [];
    for (let i = 0; i < fundIds.length; i++) {
      minnestedArray.push(minReturn);
    }
    const maxnestedArray = [];
    for (let i = 0; i < fundIds.length; i++) {
      maxnestedArray.push(maxReturn);
    }

    const meanReturns = PortfolioAllocation.meanVector(tableauConcatene);
    const covMatrix = PortfolioAllocation.covarianceMatrix(tableauConcatene);

    var opt = {};
    if (minWeight.length > 0) {
      opt = {
        discretizationType: 'volatility',
        nbPortfolios: 1000,
        optimizationMethod: 'automatic',
        constraints: {
          minWeights: minWeight,
          maxWeights: maxWeight,
        },
      };
    } else {
      opt = {
        discretizationType: 'volatility',
        nbPortfolios: 1000,
        optimizationMethod: 'automatic',
      };
    }

    const portfolios = PortfolioAllocation.meanVarianceEfficientFrontierPortfolios(meanReturns, covMatrix, opt);
    console.log(portfolios);

    // Filter portfolios based on constraints
    const filteredPortfolios = portfolios.filter(portfolio => {
      const portfolioReturn = portfolio[1];
      const portfolioVolatility = portfolio[2];
      return portfolioReturn >= minReturn && portfolioReturn <= maxReturn &&
        portfolioVolatility >= minVolatility && portfolioVolatility <= maxVolatility;
    });

    console.log('Portefeuilles efficients filtr\u00e9s :');
    filteredPortfolios.forEach((portfolio, index) => {
      console.log(`Portefeuille ${index + 1}:`);
      console.log('Poids:', portfolio[0]);
      console.log('Rendement:', portfolio[1]);
      console.log('Volatilit\u00e9:', portfolio[2]);
      console.log('------------');
    });

    res.json({
      code: 200,
      data: {
        filteredPortfolios: filteredPortfolios,
      },
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: 'Une erreur s\'est produite lors du traitement de la demande.',
      error: error.message,
    });
  }
});

// GET /api/roboadvisorsetvalue
router.get('/api/roboadvisorsetvalue', async (req, res) => {
  try {
    const { date, montantinvest, fundids, portefeuilleselect, poids } = req.query;
    const poidsfond = poids.split(',');
    const fondids = fundids.split(',');

    for (const fondItem of fondids) {
      const index = fondids.indexOf(fondItem);

      let vls = await vl.findAll({
        where: {
          fund_id: fondItem,
          date: {
            [Op.gte]: date,
          },
        },
        limit: 500,
      });

      const valorisations = [];
      const quantite = (montantinvest * poidsfond[index]) / vls[0].value;
      for (const dateRow of vls) {
        const valorisation = quantite * dateRow.value;
        valorisations.push({ date: dateRow.date, value: valorisation, fund_id: fondItem, portefeuille_id: portefeuilleselect });
      }

      await portefeuilles_proposes_vls.bulkCreate(valorisations);
    }

    const updatedData = {
      poidsportefeuille: poidsfond,
    };

    await portefeuille.update(updatedData, {
      where: { id: portefeuilleselect },
    });

    return res.json({ code: 200, data: 'Succes' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors du calcul de la valorisation' });
  }
});

// POST /api/postportefeuillepropose
router.post('/api/postportefeuillepropose', async (req, res) => {
  try {
    const { portfolios } = req.body;

    for (const portfolio of portfolios) {
      const { poids, fond, simulation_id, portefeuille_id, nom } = portfolio;

      await simulationportefeuille.create({
        poids: poids.toString(),
        fond_ids: fond,
        nom,
        simulation_id,
        portefeuille_id,
      });
    }

    res.status(200).json({ message: 'Donn\u00e9es ins\u00e9r\u00e9es avec succ\u00e8s' });
  } catch (error) {
    console.error('Erreur lors de l\'insertion en base de donn\u00e9es :', error);
    res.status(500).json({ message: 'Erreur lors de l\'insertion en base de donn\u00e9es' });
  }
});

// =============================================
// SIMULATION ROUTES
// =============================================

// POST /api/postsimulation
router.post('/api/postsimulation', async (req, res) => {
  try {
    const { nom, description, userid } = req.body;

    simulation.create({
      nom: nom,
      description: description,
      user_id: userid,
    });

    res.status(200).json({ message: 'Donn\u00e9es ins\u00e9r\u00e9es avec succ\u00e8s' });
  } catch (error) {
    console.error('Erreur lors de l\'insertion en base de donn\u00e9es :', error);
    res.status(500).json({ message: 'Erreur lors de l\'insertion en base de donn\u00e9es' });
  }
});

// GET /api/getsimulationbyuser/:id
router.get('/api/getsimulationbyuser/:id', async (req, res) => {
  simulation.findAll({
    where: {
      user_id: req.params.id,
    },
    order: [['id', 'ASC']],
    limit: 500,
  })
    .then(response => {
      const simulations = response.map(data => ({
        id: data.id,
        nom: data.nom,
        description: data.description,
      }));
      res.json({
        code: 200,
        data: {
          simulations,
        },
      });
    });
});

// GET /api/getsimulationportefeuillebyuser/:id
router.get('/api/getsimulationportefeuillebyuser/:id', async (req, res) => {
  simulationportefeuille.findAll({
    where: {
      simulation_id: req.params.id,
    },
    order: [['id', 'ASC']],
    limit: 500,
  })
    .then(response => {
      const simulations = response.map(data => ({
        id: data.portefeuille_id,
        poids: data.poids,
        nom: data.nom,
        fond_ids: data.fond_ids,
      }));
      res.json({
        code: 200,
        data: {
          simulations,
        },
      });
    });
});

// GET /api/getportefeuillebysimulation/:id
router.get('/api/getportefeuillebysimulation/:id', async (req, res) => {
  simulationportefeuille.findAll({
    where: {
      simulation_id: req.params.id,
    },
    order: [['id', 'ASC']],
    limit: 500,
  })
    .then(response => {
      const simulations = response.map(data => ({
        nom: data.nom,
        fond_ids: data.fond_ids,
        poids: data.poids,
        portefeuille_id: data.portefeuille_id,
      }));
      res.json({
        code: 200,
        data: {
          simulations,
        },
      });
    });
});

module.exports = router;
