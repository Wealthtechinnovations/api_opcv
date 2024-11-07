const { Magic } = require('@magic-sdk/admin');
const { Sequelize, DataTypes, where } = require('sequelize');
const { vl, indice, taux, fond, pays_regulateurs, sequelize, urll, urllsite, portefeuille, portefeuille_vl, portefeuilles_proposes_vls, portefeuilles_proposes, users, societe, classementfonds, performences, transaction, investissement, tsr, cashdb, frais, fiscalite, portefeuille_vl_cumul, devises, portefeuille_base100, favorisfonds, devisedechanges, personnel, documentss, performences_eurs, performences_usds, classementfonds_eurs, classementfonds_usds, actu, tsrhisto, rendement, simulation, simulationportefeuille, date_valorisation, apikeys } = require('../db/sequelize')
const moment = require('moment');
const math = require('mathjs');
const csv = require('csv-parser');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const fs = require('fs');
const xlsx = require('xlsx');
const cron = require('node-cron');
const _ = require('lodash');
const path = require('path');
const express = require('express');
const app = express();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Set your upload directory
const PortfolioAnalytics = require('portfolio-analytics');
const ss = require('simple-statistics')
const socktrader = require('@socktrader/indicators');
const quants = require('quants');
const bodyParser = require('body-parser');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 3600 }); // Cache valide pendant 1 heure
const magic = new Magic(process.env.MAGIC_SECRET_KEY);
const Bottleneck = require('bottleneck');
const { fork } = require('child_process');
const exceljs = require('exceljs');
const { PDFDocument, rgb } = require('pdf-lib');
const { Document, Packer, Paragraph, TextRun, ImageRun } = require('docx');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const { Image } = require('docxtemplater');
const puppeteer = require('puppeteer');
const ImageModule = require('docxtemplater-image-module-free');






async function checkAndUpdateData(filePath, res) {

  let report = [];


  const fileData = await new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv({ separator: ';' })) // Utilisez le séparateur correct pour le fichier CSV
      .on('headers', (headers) => {
        console.log('Headers:', headers); // Affiche les en-têtes pour vérifier leur structure
      })
      .on('data', (row) => results.push(row)) // Corrigez `data` en `row`
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });

  for (const row of fileData) {
    const existingRow = await vl.findOne({
      where: {
        code_isin: row.code,
        date: row.date
      }
    });

    if (existingRow) {
      if (existingRow.value === parseFloat(row.value) && existingRow.actif_net === parseFloat(row.actif_net)) {
        report.push({
          date: row.date,
          code: row.code,
          value_db: existingRow.value,
          value_file: parseFloat(row.value),
          vlb_ddifferent_vl_file: 'Equal',
          actif_net_db: existingRow.actif_net,
          actif_net_file: parseFloat(row.actif_net),
          actif_net_different: 'Equal'
        });
      } else if (existingRow.value === parseFloat(row.value) || existingRow.actif_net !== parseFloat(row.actif_net)) {
        /* await existingRow.update({
           value: parseFloat(row.value),
           actif_net: parseFloat(row.actif_net)
         });*/
        report.push({
          date: row.date,
          code: row.code,
          value_db: existingRow.value,
          value_file: parseFloat(row.value),
          vlb_ddifferent_vl_file: 'Equal',
          actif_net_db: existingRow.actif_net,
          actif_net_file: parseFloat(row.actif_net),
          actif_net_different: 'Dif'
        });
      } else if (existingRow.value !== parseFloat(row.value) || existingRow.actif_net === parseFloat(row.actif_net)) {

        report.push({
          date: row.date,
          code: row.code,
          value_db: existingRow.value,
          value_file: parseFloat(row.value),
          vlb_ddifferent_vl_file: 'Dif',
          actif_net_db: existingRow.actif_net,
          actif_net_file: parseFloat(row.actif_net),
          actif_net_different: 'Equal'
        });
      }
    } else {
      /* await vl.create({
         fund_id: row.fund_id,
         date: row.date,
         value: parseFloat(row.value),
         actif_net: parseFloat(row.actif_net)
       });*/
      report.push({
        date: row.date,
        code: row.code,
        value_db: null,
        value_file: parseFloat(row.value),
        vlb_ddifferent_vl_file: 'New Entry',
        actif_net_db: null,
        actif_net_file: parseFloat(row.actif_net),
        actif_net_different: 'New Entry'
      });
    }
  }
  // Générer le fichier Excel à partir du rapport
  const workbook = new exceljs.Workbook();
  const worksheet = workbook.addWorksheet('Report');

  // Ajouter les en-têtes
  worksheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Code', key: 'code', width: 15 },
    { header: 'Value DB', key: 'value_db', width: 15 },
    { header: 'Value File', key: 'value_file', width: 15 },
    { header: 'Value Different', key: 'vlb_ddifferent_vl_file', width: 20 },
    { header: 'Actif Net DB', key: 'actif_net_db', width: 15 },
    { header: 'Actif Net File', key: 'actif_net_file', width: 15 },
    { header: 'Actif Net Different', key: 'actif_net_different', width: 20 },
  ];

  // Ajouter les données
  report.forEach(row => {
    worksheet.addRow(row);
  });


  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=rapport.xlsx');

  await workbook.xlsx.write(res);
  res.end();

}

async function insertfondfile(filePath) {
  const fileData = await new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv({ separator: ';' })) // Utilisez le séparateur correct pour le fichier CSV
      .on('headers', (headers) => {
        console.log('Headers:', headers); // Affiche les en-têtes pour vérifier leur structure
      })
      .on('data', (row) => results.push(row)) // Corrigez `data` en `row`
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });

  const report = [];

  for (const row of fileData) {
    const existingRow = await fond.findOne({
      where: {
        code_ISIN: row.code_ISIN
      }
    });

    if (existingRow) {
      await existingRow.update({
        code: row.code ? row.code : existingRow.code,
        nom_fond: row.nom_fond ? row.nom_fond : existingRow.nom_fond,
        structure_fond: row.structure_fond ? row.structure_fond : existingRow.structure_fond,
        societe_gestion: row.societe_gestion ? row.societe_gestion : existingRow.societe_gestion,
        categorie_libelle: row.categorie_libelle ? row.categorie_libelle : existingRow.categorie_libelle,
        sensibilite: row.sensibilite ? row.sensibilite : existingRow.sensibilite,
        indice_benchmark: row.indice_benchmark ? row.indice_benchmark : existingRow.indice_benchmark,
        periodicite: row.periodicite ? row.periodicite : existingRow.periodicite,
        type_investissement: row.type_investissement ? row.type_investissement : existingRow.type_investissement,
        affectation: row.affectation ? row.affectation : existingRow.affectation,
        frais_rachat: row.frais_rachat ? row.frais_rachat : existingRow.frais_rachat,
        frais_souscription: row.frais_souscription ? row.frais_souscription : existingRow.frais_souscription,
        frais_gestion: row.frais_gestion ? row.frais_gestion : existingRow.frais_gestion,
        depositaire: row.depositaire ? row.depositaire : existingRow.depositaire,
        reseau_placeur: row.reseau_placeur ? row.reseau_placeur : existingRow.reseau_placeur,
        structure_fond: row.structure_fond ? row.structure_fond : existingRow.structure_fond,
        pays: "Maroc"
      });

      report.push({ action: 'updated', code_ISIN: row.code_ISIN });
    } else {
      await fond.create({
        code: row.code ? row.code : null,
        code_ISIN: row.code_ISIN ? row.code_ISIN : null,
        nom_fond: row.nom_fond ? row.nom_fond : null,
        structure_fond: row.structure_fond ? row.structure_fond : null,
        societe_gestion: row.societe_gestion ? row.societe_gestion : null,
        categorie_libelle: row.categorie_libelle ? row.categorie_libelle : null,
        sensibilite: row.sensibilite ? row.sensibilite : null,
        indice_benchmark: row.indice_benchmark ? row.indice_benchmark : null,
        periodicite: row.periodicite ? row.periodicite : null,
        type_investissement: row.type_investissement ? row.type_investissement : null,
        affectation: row.affectation ? row.affectation : null,
        frais_rachat: row.frais_rachat ? row.frais_rachat : null,
        frais_souscription: row.frais_souscription ? row.frais_souscription : null,
        frais_gestion: row.frais_gestion ? row.frais_gestion : null,
        depositaire: row.depositaire ? row.depositaire : null,
        reseau_placeur: row.reseau_placeur ? row.reseau_placeur : null,
        structure_fond: row.structure_fond ? row.structure_fond : null,
        pays: "Maroc"
      });

      report.push({ action: 'created', code_ISIN: row.code_ISIN });
    }
  }

  fs.writeFileSync('report.json', JSON.stringify(report, null, 2));
}


//todo upCaptureRatio
const {
  AdaptTableaumonthwithdate,
  findNearestDateAnnualized,
  findLastDateOfPreviousMonth,
  findNearestDate,
  findNearestDateWeek,
  findNearestDateJanuary,
  findNearestDatetoyear,
  findLastDatesForEachPreviousYear,
  groupDatesByWeek,
  groupDatesByMonth,
  groupDatesByMonth1,
  groupDatesByYear,
  adaptValuesToGroupedWeeks,
  adaptValuesToGroupedYears,
  adaptValuesToGroupedMonths,
  AdaptTableauwithdate,
  AdaptTableauweekwithdate,
  findNearestDateMonthlized,
  findNearestDatemois
} = require('../functions/dates')

const { calculatePerformance, calculateAnnualizedPerformance, calculateAnnualizedPerformanceper100 } = require('../functions/performances')


const {
  calculateVolatility,
  calculateDSR,
  calculateSharpeRatio,
  calculateVAR95,
  calculateTrackingError,
  calculateVolatilityJour,
  calculateVolatilityMois,
  calculateVAR99,
  calculateInformationRatio,
  calculateSortinoRatio,
  calculateInformationRationew,
  calculateDSRnew,
  //calculateBetanew,
  calculateDownCaptureRatio,
  calculateUpCaptureRatio,
  calculateMaxDrawdown,
  calculateDownsideBeta,
  calculateHaussierBeta,
  calculateOmegaRatio,
  calculateCalmarRatio,
  calculerCAGR,
  calculateSortinoRationew,
  calculateVariance,
  calculateCovariance,
  calculateBetanew,
  calculateInformationRatiojour,
  calculerR2,
  calculerSkewness,
  calculateKurtosis,
  calculerDelaiRecouvrementOPCVM,
  calculerDelaiRecouvrementFonds,
  calculerDSRAnnualise
} = require('../functions/newratios')


const { CalculateRendHebdo, CalculateRendMensuel, CalculateRendJournalier, calculerRendements,
  grouperParAnnee,
  grouperParMois,
  grouperParSemaine,
  grouperTauxParSemaine,
  grouperParJour } = require('../functions/utils')

const {
  calculerDelaiRecouvrement,
  calculerUpCaptureRatio,
  calculerDownCaptureRatio,
  calculateBeta,
  calculateBetaHaussier,

  calculateBetaBaissier
} = require('../functions/delai_Beta_capture')
const { Fond } = require('../classes/fond')
const { Indice } = require('../classes/indice')
const { Op } = require("sequelize");
const { fastifySwaggerUi } = require("@fastify/swagger-ui");
const { da } = require('date-fns/locale');
const portefeuille_valorise = require('../models/portefeuille_valorise');
const { exit } = require('process');
const { url } = require('inspector');
const apikey = require('../models/apikey');

/**
 * Middleware pour la gestion des routes liées à l'application.
 *
 * @param {Object} app - Instance de l'application Fastify.
 */
module.exports = (app) => {
  /**
  * Middleware pour autoriser toutes les origines (pour le développement).
  *
  * @param {Object} req - Objet de requête.
  * @param {Object} res - Objet de réponse.
  * @param {Function} next - Fonction pour passer à la suite.
  */
  // Autoriser toutes les origines (pour le développement)
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin,Authorization, X-Requested-With, Content-Type, Accept');
    next();
  });
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    }
  });

  const upload = multer({ storage: storage });

  function getDateToday() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Ajoute un zéro devant si nécessaire
    const day = String(today.getDate()).padStart(2, '0'); // Ajoute un zéro devant si nécessaire

    // Concatène l'année, le mois et le jour avec des tirets pour obtenir le format "yyyy-mm-dd"
    const formattedDate = `${year}-${month}-${day}`;

    return formattedDate;
  }
  const parentPath1 = path.resolve(__dirname, '..');
  const parentPath = path.resolve(parentPath1, '..');
  const uploadDirectory = path.join(parentPath, 'uploads');
  const uploadDirectory1 = path.join(parentPath, 'fichiers');
  app.use('/uploads', express.static(uploadDirectory));

  const magic = new Magic("sk_live_D5E6305B1B7DCF1A");

  app.get('/api/fill-template', async (req, res) => {
    try {
      // Vérifier si le fichier PDF existe
      if (!fs.existsSync("fichiers/template.pdf")) {
        return res.status(404).json({ error: 'Le fichier PDF n\'existe pas.' });
      }

      const users = await societe.findAll();

      // Charger le template PDF
      const existingPdfBytes = fs.readFileSync("fichiers/template.pdf");

      // Créer un nouveau document PDF à partir du template
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      // Remplir le template avec les données
      let yOffset = 700;
      users.forEach(user => {
        firstPage.drawText(`Name: ${user.nom}, Email: ${user.email}`, {  // Correction du champ email
          x: 50,
          y: yOffset,
          size: 12,
          color: rgb(0, 0, 0),
        });
        yOffset -= 20;
      });

      const pdfBytes = await pdfDoc.save();

      // Envoyer le PDF généré au client
      res.setHeader('Content-Disposition', 'attachment; filename="filled_template.pdf"');
      res.setHeader('Content-Type', 'application/pdf');
      res.send(pdfBytes);
    } catch (error) {
      console.error('Erreur lors du traitement du template PDF :', error);
      res.status(500).json({ error: 'Erreur lors du traitement du template PDF.' });
    }
  });

  app.post('/api/reset-password', async (req, res) => {
    const { tokenapp, newPassword } = req.body;

    try {
      // Vérifier le jeton
      const decoded = jwt.verify(tokenapp, process.env.JWT_SECRET);
      const user = await users.findOne({ where: { id: decoded.userId } });

      if (!user) {
        return res.status(404).send('Utilisateur non trouvé');
      }

      // Hacher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();

      res.status(200).send('Mot de passe réinitialisé avec succès');
    } catch (error) {
      res.status(400).send('Jeton invalide ou expiré');
    }
  });

  process.env.JWT_SECRET = '88a865b9da673c6900322f74fb865b6abc76feb2b140d4d44d5bec3739a74bda57b9a626998c1def77a61ac4ca8b7be9b74b4fe5a65bbaf4e51701a467332f7';
  process.env.EMAIL_USER = 'kouassijauressigl@gmail.com';
  process.env.EMAIL_PASSWORD = 'itrn onhe lavz pxpn';
  process.env.FRONTEND_URL = urllsite;
  app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;

    // Vérifiez si l'utilisateur existe
    const user = await users.findOne({ where: { email: email } });
    if (!user) {
      return res.status(404).send('Utilisateur non trouvé');
    }

    // Créer un jeton de réinitialisation
    const resetToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Lien de réinitialisation
    const resetUrl = `${process.env.FRONTEND_URL}/panel/societegestionpanel/login/reset-password?token=${resetToken}`;

    // Configurer nodemailer pour envoyer l'email
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Réinitialisation de mot de passe',
      html: `<p>Cliquez sur ce lien pour réinitialiser votre mot de passe :</p>
             <a href="${resetUrl}">Réinitialiser le mot de passe</a>`,
    };

    try {
      await transporter.sendMail(mailOptions);
      res.status(200).send('Email de réinitialisation envoyé');
    } catch (error) {
      res.status(500).send('Erreur lors de l\'envoi de l\'email');
    }
  });

  app.get('/api/telechargerword', async (req, res) => {
    try {
      // Charger les données des utilisateurs
      const user = await societe.findOne();

      // Charger le fichier template Word
      const content = fs.readFileSync('fichiers/template.docx');
      const zip = new PizZip(content);

      // Capture screenshots of the specific tables using Puppeteer
      const urls = [
        'https://funds.chainsolutions.fr/fundview/historique/1114',
        'https://funds.chainsolutions.fr/fundview/historique/1115',
        'https://funds.chainsolutions.fr/fundview/historique/1116'
      ];
      const screenshotPaths = [];
      const browser = await puppeteer.launch({ headless: true });

      for (let i = 0; i < urls.length; i++) {
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        await page.goto(urls[i]);

        // Attendre que la table contienne des lignes
        await page.waitForFunction(() => {
          const table = document.querySelector('#tabPerfGlissante');
          return table && table.querySelectorAll('tbody tr').length > 0;
        });

        // Scroll to the bottom of the table to ensure all rows are loaded
        await page.evaluate(() => {
          const table = document.querySelector('#tabPerfGlissante');
          table.scrollIntoView();
        });

        // Capture the entire table
        const table = await page.$('#tabPerfGlissante');
        const screenshotBuffer = await table.screenshot();

        // Sauvegarder l'image temporairement
        const screenshotPath = path.resolve(`fichiers/screenshot${i + 1}.png`);
        fs.writeFileSync(screenshotPath, screenshotBuffer);
        screenshotPaths.push(screenshotPath);

        await page.close();
      }
      await browser.close();

      // Préparer les données à insérer dans le template
      const data = {
        nom: user.nom,
        email: user.email,
        performances: [
          { date: '2022-01-01', performance: 0.5 },
          { date: '2022-02-01', performance: 0.6 },
          { date: '2022-03-01', performance: 0.7 }
        ],
        // Ajouter des placeholders pour les images dynamiques
        image1: 'fichiers/screenshot1.png',
        image2: 'fichiers/screenshot2.png',
        image3: 'fichiers/screenshot3.png'
      };

      // Manipuler le fichier DOCX pour ajouter les images
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true
      });

      // Remplir le template avec les données
      doc.setData(data);
      doc.render();

      let buf = doc.getZip().generate({ type: 'nodebuffer' });

      // Ajouter les images dynamiques aux placeholders
      const zipWithImages = new PizZip(buf);

      // Liste des placeholders d'images dynamiques
      const imagePlaceholders = ['image1', 'image2', 'image3'];
      const files = zipWithImages.filter((relativePath) => relativePath.startsWith('word/media/'));

      // Remplacer les placeholders d'images dynamiques
      imagePlaceholders.forEach((placeholder, index) => {
        const filePath = data[placeholder];
        if (filePath && fs.existsSync(filePath)) {
          const imageFile = fs.readFileSync(filePath);
          // Ajouter ou remplacer uniquement les images dynamiques
          zipWithImages.file(`word/media/image${index + 1}.png`, imageFile);
        }
      });
      /*screenshotPaths.forEach((filePath, index) => {
        const imageFile = fs.readFileSync(filePath);
        // La clé doit correspondre aux placeholders dynamiques dans le template
        zipWithImages.file(`word/media/image${index + 1}.png`, imageFile);
      });*/

      // Créez un nouveau Docxtemplater avec les images ajoutées
      const updatedDoc = new Docxtemplater(zipWithImages);
      const finalBuf = updatedDoc.getZip().generate({ type: 'nodebuffer' });

      // Envoyer le fichier Word généré au client
      res.setHeader('Content-Disposition', 'attachment; filename="filled_template.docx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.send(finalBuf);

      // Supprimer les images temporaires
      screenshotPaths.forEach(filePath => fs.unlinkSync(filePath));
    } catch (error) {
      console.error('Erreur lors du traitement du template Word :', error);
      res.status(500).json({ error: 'Erreur lors du traitement du template Word.' });
    }
  });

  app.get('/api/wordexemple', async (req, res) => {
    const content = fs.readFileSync('fichiers/Templateexport.docx', 'binary');
    const zip = new PizZip(content);
  //  const doc = new Docxtemplater(zip);

  const imageOpts = {
    centered: false,
    getImage: (tagValue) => {
        try {
            const imageBuffer = fs.readFileSync(tagValue);
            return imageBuffer;
        } catch (error) {
            console.error("Erreur de chargement de l'image:", error);
            return Buffer.from(''); // Retourne un buffer vide si l'image n'est pas trouvée
        }
    },
    getSize: () => [150, 150] // Dimensions en pixels
};
  const imageModule = new ImageModule(imageOpts);
  const doc = new Docxtemplater(zip, { modules: [imageModule] });
    // Récupérer les données depuis la base de données
    const data = {
        nom_fonds: "ECHIQUIER MAJOR SRI GROWTH EUROPE A",
        date_creation: "11/03/2005",
        valeur_liquidative: "351,48 €",
        actif_net: "1 223 M€",
        commentaire: "Echiquier Major SRI Growth Europe A progresse de 3,57%...",
        image_fond: "fichiers/test.png"
        // Ajoutez d'autres variables selon le template
    };
    
    // Remplir les balises dans le template
    doc.setData(data);
    
    try {
        doc.render();
        const buffer = doc.getZip().generate({ type: "nodebuffer" });
        // Envoyer le fichier en tant que pièce jointe
        res.setHeader('Content-Disposition', 'attachment; filename=output.docx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.send(buffer);

        // console.log("Document envoyé pour téléchargement !");
        // fs.writeFileSync("output.docx", buffer);
        console.log("Document créé avec succès !");
    } catch (error) {
      console.error('Erreur lors du traitement du template Word :', error);
      res.status(500).json({ error: 'Erreur lors du traitement du template Word.' });
    }
  });


 
app.post('/api/reportingmensuelle', async (req, res) => {
  try {
      const { selectedOptions1, managerComments, selectedMonth, selectedYear } = req.body;

      // Charger les données des utilisateurs
      const user = await societe.findOne();

      // Charger le fichier template Word
      const content = fs.readFileSync('fichiers/template.docx');
      const zip = new PizZip(content);

      // Capture screenshots of the specific tables using Puppeteer
      const urls = ['https://funds.chainsolutions.fr/Opcvm/historique/1114'];
      const screenshotPaths = [];
      const browser = await puppeteer.launch({ headless: true });

      for (let i = 0; i < urls.length; i++) {
          const page = await browser.newPage();
          await page.setViewport({ width: 1920, height: 1080 });
          await page.goto(urls[i]);

          // Attendre que la table contienne des lignes
          await page.waitForFunction(() => {
              const table = document.querySelector('#tabPerfGlissante');
              return table && table.querySelectorAll('tbody tr').length > 0;
          });

          // Capture the entire table
          const table = await page.$('#tabPerfGlissante');
          const screenshotBuffer = await table.screenshot();

          // Sauvegarder l'image temporairement
          const screenshotPath = path.resolve(`fichiers/screenshot${i + 1}.png`);
          fs.writeFileSync(screenshotPath, screenshotBuffer);
          screenshotPaths.push(screenshotPath);

          await page.close();
      }
      await browser.close();

      // Préparer les données à insérer dans le template
      const data = {
          nom: user.nom,
          email: user.email,
          performances: [
              { date: '2022-01-01', performance: 0.5 },
              { date: '2022-02-01', performance: 0.6 },
              { date: '2022-03-01', performance: 0.7 }
          ],
          image1: 'fichiers/screenshot1.png', // Path to screenshots
          image2: 'fichiers/screenshot2.png'
      };

      // Manipuler le fichier DOCX pour ajouter les images
      const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true
      });

      // Remplir le template avec les données
      doc.setData(data);
      doc.render();

      let buf = doc.getZip().generate({ type: 'nodebuffer' });

      // Ajouter les images dynamiques aux placeholders
      const zipWithImages = new PizZip(buf);

      // Remplacer les placeholders d'images dynamiques
      const imagePlaceholders = ['image1', 'image2'];
      imagePlaceholders.forEach((placeholder, index) => {
          const filePath = data[placeholder];
          if (filePath && fs.existsSync(filePath)) {
              const imageFile = fs.readFileSync(filePath);
              zipWithImages.file(`word/media/image${index + 1}.png`, imageFile);
          }
      });

      // Créez un nouveau Docxtemplater avec les images ajoutées
      const updatedDoc = new Docxtemplater(zipWithImages);
      const finalBuf = updatedDoc.getZip().generate({ type: 'nodebuffer' });

      // Envoyer le fichier Word généré au client
      res.setHeader('Content-Disposition', 'attachment; filename="filled_template.docx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.send(finalBuf);

      // Supprimer les images temporaires
      screenshotPaths.forEach(filePath => fs.unlinkSync(filePath));
  } catch (error) {
      console.error('Erreur lors du traitement du template Word :', error);
      res.status(500).json({ error: 'Erreur lors du traitement du template Word.' });
  }
});


  app.get('/api/fetch-currency-pairs', async (req, res) => {
    try {
      const apikey = "92f2058ef24f7fcdd129c260";
      const url = `https://v6.exchangerate-api.com/v6/${apikey}/latest/USD`;

      const response = await fetch(url);

      const data = await response.json();

      const pairs = Object.keys(data.conversion_rates).map(pair => ({
        paire: `USD/${pair}`,
        value: data.conversion_rates[pair],
        date: new Date()
      }));

      await devisedechanges.bulkCreate(pairs);

      res.status(200).json({ message: 'Les paires de devises ont été récupérées et enregistrées avec succès.' });
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la récupération des paires de devises.' });
    }
  });

  app.get('/api/generate-excel-report', async (req, res) => {
    try {
      const societegestion = req.query.societegestion;

      // Appel des API pour obtenir les fonds avec anomalies
      const highVolatilityFundsVLManquante = await performences.findAll({
        attributes: ['fond_id'],
        where: { anomalie: 'VL MANQUANTE' },
        raw: true
      });

      /*  const highVolatilityFundsAutreAnomalie = await performences.findAll({
          attributes: ['fond_id'],
          where: {
            [Op.or]: [
              { volatility3an: { [Op.gt]: 50 } },
              { volatility1an: { [Op.gt]: 50 } },
              { volatility5an: { [Op.gt]: 50 } },
              { pertemax1an: { [Op.lt]: -50 } },
              { pertemax3an: { [Op.lt]: -50 } },
              { pertemax5an: { [Op.lt]: -50 } }
            ],
          },
          raw: true
        });*/

      const combinedData = [
        ...highVolatilityFundsVLManquante.map(fund => ({ id: fund.fond_id, anomalie: 'VL MANQUANTE' })),
        //  ...highVolatilityFundsAutreAnomalie.map(fund => ({ id: fund.fond_id, anomalie: 'ANOMALIE VL' }))
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
      const allMissingDates = new Set();

      for (const fund of highVolatilityFundsData) {
        const id = fund.id;
        const correspondingData = combinedData.filter(data => data.id === id);

        for (const data of correspondingData) {
          const combinationKey = `${fund.id}-${data.anomalie}`;

          if (!seenCombinations.has(combinationKey)) {
            seenCombinations.add(combinationKey);

            if (data.anomalie === 'VL MANQUANTE') {
              const missingDates = await getMissingDates(fund.id);
              //    missingDates.forEach(date => allMissingDates.add(date));

              dataWithAnomalyType.push({
                ...fund.toJSON(),
                type_anomalie: data.anomalie,
                anomalies: missingDates
              });
            }/* else {
              const anomalies = await getVLAnomalies(fund.id);
              dataWithAnomalyType.push({
                ...fund.toJSON(),
                type_anomalie: data.anomalie,
                anomalies: anomalies
              });
            }*/
          }
        }
      }
      // const uniqueMissingDates = Array.from(allMissingDates).sort();


      // Générer le rapport Excel
      const workbook = new exceljs.Workbook();
      const worksheet = workbook.addWorksheet('Anomalies Fonds');

      worksheet.columns = [
        { header: 'ID Fonds', key: 'id', width: 15 },
        { header: 'Nom Fonds', key: 'nom_fond', width: 30 },
        { header: 'Code ISIN', key: 'code_ISIN', width: 20 },
        { header: 'Type d\'Anomalie', key: 'periodicite', width: 20 },
        { header: 'Type d\'Anomalie', key: 'type_anomalie', width: 20 },
        { header: 'missing_date', key: 'missing_date', width: 50 }
      ];
      const datesWorksheet = workbook.addWorksheet('Dates Uniques');
      datesWorksheet.columns = [
        { header: 'Date', key: 'date', width: 15 }
      ];

      dataWithAnomalyType.forEach(fund => {
        fund.anomalies.forEach(date => {
          worksheet.addRow({
            id: fund.id,
            nom_fond: fund.nom_fond,
            code_ISIN: fund.code_ISIN,
            periodicite: fund.periodicite,
            type_anomalie: fund.type_anomalie,
            missing_date: date
          });
        });
      });

      /*  uniqueMissingDates.forEach(date => {
          datesWorksheet.addRow({ date });
        });*/

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=rapport_anomalies.xlsx');

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Fonction pour obtenir les dates manquantes
  async function getMissingDates(fundId) {
    const fund = await fond.findOne({ where: { id: fundId } });
    const periodicite = fund.periodicite;
    const firstVlDate = await vl.min('date', {
      where: {
        fund_id: fundId,/* date: {
          [Sequelize.Op.lt]: "2024-03-31" // Utilise createdAt ou tout autre attribut de date
        },*/
      }
    });
    const increment = periodicite === 'Journaliere' ? 'days' : 'weeks';
    const missingDates = [];

    /* for (let date = moment(firstVlDate); date.isBefore(moment()); date.add(1, increment)) {
       if (isWeekend(date)) {
         continue;
       }
 
       const vlExists = await vl.findOne({ where: { fund_id: fundId, date: date.format('YYYY-MM-DD') } });
 
       if (!vlExists) {
         missingDates.push(date.format('YYYY-MM-DD'));
       }
     }*/
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
        /* if (isWeekend(date)) {
           continue;
         }*/
        const startOfWeek = date.clone().startOf('isoWeek');
        const endOfWeek = date.clone().endOf('isoWeek');

        const weeklyVlDates = await vl.findAll({
          where: {
            fund_id: fundId,
            date: {
              [Sequelize.Op.between]: [startOfWeek.format('YYYY-MM-DD'), endOfWeek.format('YYYY-MM-DD')]
            }
          }
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

  app.get('/api/verifvlimport', async (req, res) => {
    try {
      checkAndUpdateData('fichiers/vl2.csv', res)
        .then(() => console.log('Data check and update completed.'))
        .catch((error) => console.error('Error during data check and update:', error));
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal server error.');
    }
  });

  app.get('/api/insertfond', async (req, res) => {
    try {
      insertfondfile('fichiers/Updatefondsmaroc.csv')
        .then(() => console.log('Data check and update completed.'))
        .catch((error) => console.error('Error during data check and update:', error));
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal server error.');
    }
  });

  //Taux sans risque
  app.get('/api/tsr/:year', async (req, res) => {
    // Récupérer la dernière valeur du mois précédent
    const lastValue = await tsrhisto.findOne({
      where: {
        date: {
          [Op.lt]: new Date(new Date().setDate(0))  // Dernier jour du mois précédent
        },
        annee: req.params.year
      },
      order: [['date', 'DESC']]
    });

    if (!lastValue) {
      throw new Error('No data found for the last month.');
    }

    const endDate = lastValue.date;
    const startDate = new Date(endDate);
    startDate.setFullYear(startDate.getFullYear() - 10);

    // Récupérer les valeurs sur les 10 dernières années
    const values = await tsrhisto.findAll({
      where: {
        date: {
          [Op.between]: [startDate, endDate]
        }, annee: req.params.year
      },
      order: [['date', 'ASC']]
    });
    const valueArray = values.map(record => record.value);
    const annualYield = math.mean(valueArray)
    //  const annualYield = calculateAnnualYield(valueArray);
    console.log(`Le taux sans risque à ${req.params.year} ans est de ${annualYield.toFixed(2)}%`);
    console.log(`Le taux sans risque à ${req.params.year} ans est de ${annualYield.toFixed(2)}%`);

  });

  app.get('/update-indRef/:idDebu/:idFin', async (req, res) => {
    try {
      const idDebu = req.params.idDebu;
      const idFin = req.params.idFin;

      const whereClause = {
        indRef: null
      };

      if (idDebu && idFin) {
        whereClause.fund_id = {
          [Sequelize.Op.between]: [idDebu, idFin]
        };
      }

      const valorisations = await vl.findAll({
        where: whereClause,
        order: [['id', 'ASC']]
      });

      for (let i = 0; i < valorisations.length; i++) {
        const currentValue = valorisations[i];
        const previousValue = await vl.findOne({
          where: {
            date: {
              [Sequelize.Op.lt]: currentValue.date // Utilise createdAt ou tout autre attribut de date
            },
            fund_id: currentValue.fund_id,
            indRef: {
              [Sequelize.Op.ne]: null
            }
          },
          order: [['date', 'DESC']]
        });

        if (previousValue) {
          await currentValue.update({ indRef: previousValue.indRef });
        }
      }

      res.status(200).send('Mise à jour terminée.');
    } catch (error) {
      console.error('Erreur lors de la mise à jour :', error);
      res.status(500).send('Erreur lors de la mise à jour.');
    }
  });
  app.get('/api/login', async (req, res) => {
    try {
      const didToken = req.headers.authorization?.substr(7);
      if (!didToken) {
        return res.status(401).json({ error: 'Missing authorization token' });
      }

      await magic.token.validate(didToken);
      res.status(200).json({ authenticated: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  const cors = require('cors');
  app.use(cors({
    origin: urllsite, // Remplacez par l'URL de votre frontend
  }));
  app.use('/fichiers', express.static(uploadDirectory1));


  app.post('/api/contact', async (req, res) => {
    const { name, email, description } = req.body;

    let transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    let mailOptions = {
      from: email,
      to: process.env.EMAIL_USER,
      subject: `Nouveau message de ${name}`,
      text: description,
    };

    try {
      await transporter.sendMail(mailOptions);
      res.status(200).json({ success: true, message: 'Email envoyé avec succès' });
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi de l\'email' });
    }
  });

  // Route dynamique pour servir des fichiers
  app.get('/doc/:pays/:societe/:opcvm/:nomfichier/:id', async (req, res) => {
    const { id } = req.params;
    const document = await documentss.findOne({
      where: {
        id: id
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Le document n\'existe pas.' });
    }


    const filePath = path.resolve(__dirname, '../..', document.nom); // Utiliser path.resolve pour obtenir un chemin absolu

    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Erreur lors de l\'envoi du fichier:', err);
        res.status(err.status).end();
      }
    });
  });
  // Définir une route statique pour servir les fichiers depuis le dossier upload
  app.get('/api/upload', async (req, res) => {
    const parentPath1 = path.resolve(__dirname, '..');
    const parentPath = path.resolve(parentPath1, '..');
    const uploadDirectory = path.join(parentPath, 'uploads');

    const path = uploadDirectory;
    // express.static(uploadDirectory); 
    res.status(200).json({ message: 'Document créé avec succès', path: uploadDirectory });

  });

  const dateToday = getDateToday();
  console.log(dateToday);
  // const upload = multer({ storage: storage });

  function constructNomFond({ date, mois, annee, objet, typedoc, fond_name }) {
    // Créer un tableau pour stocker les parties du nom du fond
    let parts = [];

    // Ajouter les parties existantes
    if (date) parts.push(date);
    if (mois) parts.push(mois);
    if (annee) parts.push(annee);
    if (objet) parts.push(objet);
    if (typedoc) parts.push(typedoc);
    if (fond_name) parts.push(fond_name);


    // Si le tableau est vide, retourner une chaîne vide
    if (parts.length === 0) return '';

    // Joindre les parties avec des underscores
    return parts.join('_');
  }
  app.get('/api/usersWithFunds', async (req, res) => {
    const query = `
   SELECT u.nom, u.prenoms, f.societe_gestion, GROUP_CONCAT(f.nom_fond SEPARATOR ', ') AS fonds_favoris
FROM users u
INNER JOIN favorisfonds fa ON u.id = fa.user_id
INNER JOIN fond_investissements f ON fa.fund_id = f.id
GROUP BY f.societe_gestion;
  `;
    try {
      const usersWithFunds = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT });
      res.status(200).json(usersWithFunds);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erreur du serveur' });
    }
  });
  // API endpoint for uploading article
  app.post('/api/actualite', upload.single('fichier'), async (req, res) => {
    try {
      const { description, date, type, user_id, username } = req.body;
      const image = req.file;
      const user = await users.findOne({ where: { denomination: user_id } });
      const nouveauDocument = await actu.create({
        date: dateToday,
        user_id: user.id,
        username: username,
        description,
        type,
        image: image.filename
      });

      res.status(200).json({ message: 'Article uploaded successfully', document: nouveauDocument });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
  });
  app.get('/api/getactualite', async (req, res) => {
    try {
      // Récupérer toutes les actualités de la base de données
      const actualites = await actu.findAll({
        order: [['id', 'DESC']] // Triez par ordre décroissant sur la colonne 'id'
      });
      // Envoyer les actualités en tant que réponse
      res.status(200).json(actualites);
    } catch (error) {
      console.error(error);
      // Si une erreur survient, envoyer une réponse d'erreur au client
      res.status(500).json({ message: 'Erreur du serveur' });
    }
  });
  app.post('/api/doc', upload.single('fichier'), async (req, res) => {
    try {
      const { fond_id, date, objet, mois, annee, typedoc, societe } = req.body;
      const fichier = req.file; // Le fichier est accessible via req.file
      const dateToday = getDateToday();
      const dernierePartieFondId = fond_id.split(' ').pop();

      const existingfond = await fond.findOne({ where: { code_isin: dernierePartieFondId } });
      const fond_name = existingfond.nom_fond;
      const nomfile = fichier.filename;
      const nom = constructNomFond({ date, mois, annee, objet, typedoc, fond_name }) + path.extname(nomfile);


      // Créer le chemin du dossier
      const dossierPath = `documents/${existingfond.pays}/${societe}/${fond_name}/`;

      // Assurez-vous que le dossier existe (vous devrez peut-être utiliser fs pour créer le dossier)
      fs.mkdirSync(dossierPath, { recursive: true });
      // Déplacer le fichier vers le nouveau chemin
      const oldPath = fichier.path; // Chemin temporaire
      const newPath = path.join(dossierPath, nom);

      fs.renameSync(oldPath, newPath); // Déplacer le fichier

      const nouveauDocument = await documentss.create({
        date: date ? date : dateToday,
        nom: newPath,
        fond: fond_name,
        fond_id: existingfond.id,
        mois,
        annee,
        objet,
        type_fichier: typedoc,
        societe,
        fichier: nom
      });



      res.status(200).json({ message: 'Document créé avec succès', document: nouveauDocument });
    } catch (error) {
      console.error('Erreur lors de la création du document :', error);
      res.status(500).json({ message: 'Erreur lors de la création du document' });
    }
  });
  app.get('/api/documents/:societe', async (req, res) => {
    const { societe } = req.params;
    const query = `
    SELECT *
    FROM documents
    WHERE societe = :societe
  `;

    try {
      const documents = await sequelize.query(query, {
        replacements: { societe },
        type: sequelize.QueryTypes.SELECT,
      });

      // Retournez la liste des documents
      res.status(200).json(documents);
    } catch (error) {
      console.error('Erreur lors de la récupération des documents:', error);
      res.status(500).json({ message: 'Erreur lors de la récupération des documents' });
    }
  });

  app.get('/api/documentsfond/:fond', async (req, res) => {
    const { fond } = req.params; // Modifier de societe à fond
    const fondId = parseInt(fond); // Convertir fond en entier, si nécessaire
    const query = `
    SELECT *
    FROM documents
    WHERE fond_id = :fondId
  `;

    try {
      const documents = await sequelize.query(query, {
        replacements: { fondId },
        type: sequelize.QueryTypes.SELECT,
      });

      // Retournez la liste des documents
      res.status(200).json(documents);
    } catch (error) {
      console.error('Erreur lors de la récupération des documents:', error);
      res.status(500).json({ message: 'Erreur lors de la récupération des documents' });
    }
  });



  app.post('/api/personnelsociete', upload.single('photo'), async (req, res) => {
    try {
      const selectedValues = req.query.query;
      let valuesArray = [];
      if (selectedValues) {
        valuesArray = selectedValues.split(',');
      }

      const { nom, prenom, email, numero, fonction, societe, activite, photo } = req.body;

      if (valuesArray.length >= 1 && valuesArray[0] !== '') {
        const formattedValues = valuesArray.map(value => `'${value}'`).join(',');

        const query = `
             UPDATE fond_investissements
             SET nom_gerant = :nom
             WHERE id IN (${formattedValues})
           `;

        const fondsDansCategorie = await sequelize.query(query, {
          replacements: { nom },
          type: sequelize.QueryTypes.UPDATE
        });
      }

      const fonc = fonction.toString();
      const activiteString = JSON.stringify(activite);
      let photos = null; // Initialisation de la variable photo à null

      // Vérifie si une photo a été téléchargée
      if (req.file) {
        photos = req.file.filename; // Utilisation du nom de fichier pour la photo
      }
      /* const parentPath1 = path.resolve(__dirname, '..');
       const parentPath = path.resolve(parentPath1, '..');
 
 
       const destinationPath = path.join(parentPath, 'uploads'); // Changer 'uploads' par votre dossier de destination*/
      /*
            const newPath = path.join(destinationPath, photos.filename);
            await fs.promises.rename(photos.path, newPath);*/
      // Créer un nouveau document dans la base de données
      const newPersonnel = await personnel.create({
        nom,
        prenom,
        email,
        numero,
        societe,
        photo: photos,
        fonction: fonc,
        activite: activiteString
        //activite: JSON.parse(activite) // Parsez la chaîne JSON pour obtenir un tableau d'activités
      });

      res.status(200).json(newPersonnel);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la création de la personne.' });
    }
  });

  app.get('/api/personnel/:societe', async (req, res) => {
    const { societe } = req.params;
    const query = `
    SELECT *
    FROM 	personnel_sgs
    WHERE societe = :societe
  `;

    try {
      const documents = await sequelize.query(query, {
        replacements: { societe },
        type: sequelize.QueryTypes.SELECT,
      });

      // Retournez la liste des documents
      res.status(200).json(documents);
    } catch (error) {
      console.error('Erreur lors de la récupération des documents:', error);
      res.status(500).json({ message: 'Erreur lors de la récupération des documents' });
    }
  });
  app.get('/api/personnelsocietecharge/:id', async (req, res) => {
    try {
      const id = req.params.id;

      // Recherchez le personnel dans la base de données en fonction de son ID
      const existingPersonnel = await personnel.findOne({ where: { id } });

      if (!existingPersonnel) {
        return res.status(404).json({ error: "Personnel not found" });
      }

      // Envoyez les données du personnel trouvé
      res.status(200).json(existingPersonnel);
    } catch (error) {
      console.error("Error fetching personnel:", error);
      res.status(500).json({ error: 'An error occurred while fetching personnel data.' });
    }
  });
  // Route pour mettre à jour une personne
  app.post('/api/personnelsocietemodif', upload.single('photo'), async (req, res) => {
    try {
      const selectedValues = req.query.query;
      let valuesArray = [];
      if (selectedValues) {
        valuesArray = selectedValues.split(',');
      }

      const { id, nom, prenom, email, numero, fonction, activite, photo } = req.body;

      if (valuesArray.length >= 1 && valuesArray[0] !== '') {
        const formattedValues = valuesArray.map(value => `'${value}'`).join(',');

        const query = `
        UPDATE fond_investissements
        SET nom_gerant = :nom
        WHERE id IN (${formattedValues})
      `;

        const fondsDansCategorie = await sequelize.query(query, {
          replacements: { nom },
          type: sequelize.QueryTypes.UPDATE
        });
      }

      const fonc = fonction.toString();
      const activiteString = JSON.stringify(activite);
      let photos = null;

      // Vérifie si une nouvelle photo a été téléchargée
      if (req.file) {
        photos = req.file.filename;
      }

      // Obtenez le personnel existant à mettre à jour
      const existingPersonnel = await personnel.findOne({ where: { id: parseInt(id) } });

      if (!existingPersonnel) {
        return res.status(404).json({ error: "Personnel not found" });
      }

      // Mettez à jour les données existantes avec les nouvelles données
      existingPersonnel.nom = nom;
      existingPersonnel.prenom = prenom;
      existingPersonnel.email = email;
      existingPersonnel.numero = numero;
      existingPersonnel.fonction = fonc;
      existingPersonnel.activite = activiteString;

      if (photos) {
        existingPersonnel.photo = photos;
      }

      await existingPersonnel.save();

      res.status(200).json(existingPersonnel);
    } catch (error) {
      console.error("Error updating personnel:", error);
      res.status(500).json({ error: 'An error occurred while updating personnel.' });
    }
  });




  //fonction avoir date vl manquante
  app.get('/dates-manquantes/:fundId', async (req, res) => {
    const fundId = req.params.fundId;
    const fund = await fond.findOne({ where: { id: fundId } });
    const periodicite = fund.periodicite; // Récupérer la périodicité depuis la requête si nécessaire

    try {
      const firstVlDate = await vl.min('date', { where: { fund_id: fundId } });
      const increment = periodicite === 'journaliere' ? 'days' : 'weeks';
      const missingDates = [];

      for (let date = moment(firstVlDate); date.isBefore(moment()); date.add(1, increment)) {
        // Si la périodicité est journalière et la date est un week-end, passer à la prochaine date
        if (periodicite === 'journaliere' && isWeekend(date)) {
          continue;
        }

        // Vérifier si la VL est manquante pour cette date
        const vlExists = await vl.findOne({ where: { fund_id: fundId, date: date.format('YYYY-MM-DD') } });

        // Si la VL n'existe pas, ajouter la date à la liste des dates manquantes
        if (!vlExists) {
          missingDates.push(date.format('YYYY-MM-DD'));
        }
      }

      res.json({ fundId: fundId, missingDates: missingDates });
    } catch (error) {
      console.error('Erreur lors de la récupération des dates manquantes :', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des dates manquantes' });
    }
  });

  app.get('/dates-indRef-null/:fundId', async (req, res) => {
    const fundId = req.params.fundId;

    try {
      // Recherche du fond par ID
      const fund = await fond.findOne({ where: { id: fundId } });

      // Vérification si le fond existe
      if (!fund) {
        return res.status(404).json({ error: "Fond non trouvé" });
      }

      // Récupération des dates avec indRef null pour le fond donné
      const datesWithIndRefNull = await vl.findAll({
        where: {
          fund_id: fundId,
          indRef: null
        },
        attributes: ['date'], // Sélectionner uniquement la colonne 'date'
        raw: true // Retourner les résultats en tant qu'objets JavaScript
      });

      // Extraction des dates à partir des résultats
      const dates = datesWithIndRefNull.map(entry => entry.date);

      res.json({ fundId: fundId, datesWithIndRefNull: dates });
    } catch (error) {
      console.error('Erreur lors de la récupération des dates avec indRef null :', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des dates avec indRef null' });
    }
  });



  app.use(bodyParser.json());
  app.post('/api/login', async (req, res) => {
    try {
      const didToken = req.headers.authorization?.substr(7);

      if (!didToken) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      await magic.token.validate(didToken);
      res.status(200).json({ authenticated: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.get('/api/getdateavailable/:id', async (req, res) => {
    try {
      const vldatas = await vl.findAll({
        where: {
          fund_id: req.params.id,
        },
        attributes: ['date'], // Specify the columns you want to retrieve
      });

      // Extracting the 'date' values from the result
      const dates = vldatas.map(vldata => vldata.date);
      res.json({ code: 200, data: dates });
    } catch (error) {
      res.status(500).send('Erreur lors de la récupération des dates');
    }
  });
  app.post('/api/managecash', async (req, res) => {

    try {
      const { portefeuilleselect, montant, type, date } = req.body[0];

      // Recherche de la transaction existante
      const existingTransaction = await portefeuille.findOne({
        where: {
          id: portefeuilleselect,
        },
      });
      let updatedTransaction;
      const currentCash = parseInt(existingTransaction.cash, 10) || 0;


      if (existingTransaction) {

        // Convert montant to an integer
        const montantValue = parseInt(montant, 10) || 0;

        if (type === 'ajoutcash') {
          updatedTransaction = await existingTransaction.update({
            cash: (currentCash + montantValue).toString(),
          });
          const createdcashdb = await cashdb.create({
            portefeuille_id: portefeuilleselect,
            montant: montantValue,
            date,
          });
        } else {
          updatedTransaction = await existingTransaction.update({
            cash: (currentCash - montantValue).toString(),
          });
          const createdcashdb = await cashdb.create({
            portefeuille_id: portefeuilleselect,
            montant: -montantValue,
            date,
          });
        }
      }

      const transactionsData = [{
        portefeuilleselect,
        type,
        montant,
        date,
      }];

      // Remplacez l'URL et le port par les valeurs correctes de votre environnement
      const baseUrl = urll; // Remplacez par votre URL de base

      const createTransactionsUrl = `${baseUrl}/api/createtransactions`;

      const response = await fetch(createTransactionsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionsData),
      });



      // Parse the response JSON
      const responseData = await response.json();

      // Utilisez la réponse comme nécessaire (peut-être ajoutez-la à votre réponse JSON)
      const { code, data } = responseData;

      return res.json({ code: 200, data: updatedTransaction, createTransactionsResponse: { code, data } });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur lors de la création des transactions' });
    }
  });
  app.get('/api/vlpardate', async (req, res) => {
    const { fund_id, date } = req.query;

    try {
      const dateObject = new Date(date); // Assuming 'date' is a string representation of a date
      const isoDateString = dateObject.toISOString().substring(0, 10);
      const exchangeRates = await vl.findOne({
        where: {
          date: isoDateString,
          fund_id: parseInt(fund_id),

        },
      });

      if (!exchangeRates) {
        return res.status(404).json({ message: 'Exchange rates not found for the given date' });
      }

      res.json(exchangeRates);
    } catch (error) {
      console.error('Error fetching exchange rates from the database', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  app.get('/api/changedevise', async (req, res) => {
    const { paire, date } = req.query;

    try {
      const dateObject = new Date(date); // Assuming 'date' is a string representation of a date
      const isoDateString = dateObject.toISOString().substring(0, 10);
      const exchangeRates = await devisedechanges.findOne({
        where: {
          date: { [Op.lte]: isoDateString }, // Chercher la date la plus proche inférieure ou égale

          //date: isoDateString,
          paire: paire,

        },
      });

      if (!exchangeRates) {
        return res.status(404).json({ message: 'Exchange rates not found for the given date' });
      }

      res.json(exchangeRates.value);
    } catch (error) {
      console.error('Error fetching exchange rates from the database', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  app.post('/api/createtransactions', async (req, res) => {
    const transactionsData = req.body;

    try {
      const transactions = [];

      for (const transactionData of transactionsData) {
        const { portefeuilleselect, type, montant, date, fondId, quantiteachat } = transactionData;
        //   populatePortefeuilleVls(portefeuilleselect);
        let prixparunite;
        let existingTransaction;

        const portefeuilledata = await portefeuille.findOne({
          where: {
            id: portefeuilleselect,
          },
        });

        const fraisdata = await frais.findOne({
          where: {
            id: 1,
          },
        });



        if (type === 'achat' || type === 'vente') {
          const existingTransactions = await transaction.findAll({
            where: {
              type: 'achat',
              fond_ids: parseInt(fondId),
              date: {
                [Op.lte]: new Date(date)
              }
            }
          });

          // Calculate average purchase price
          let totalAmount = 0;
          let totalQuantity = 0;

          for (const existingTransaction of existingTransactions) {
            totalAmount += existingTransaction.prixparunite * existingTransaction.quantite;
            totalQuantity += existingTransaction.quantite;
          }

          const averagePurchasePrice = totalQuantity ? totalAmount / totalQuantity : 0;

          const vldata = await vl.findOne({
            where: {
              fund_id: fondId,
              date: date
            },
          });
          if (portefeuilledata.devise == "EUR") {
            prixparunite = vldata.value_EUR;
          } else {
            prixparunite = vldata.value_USD;

          }

          let quantiteachata;

          if (type === 'achat') {
            quantiteachata = (montant - (parseFloat(((montant * (fraisdata.frais_achat)) / 100)) + parseFloat(fraisdata.frais_transa_achat))) / prixparunite;

          }





          const currentCash = parseInt(portefeuilledata.cash, 10) || 0;
          // const montantValue = type=="achat"?(parseFloat(montant, 10) || 0)-(parseFloat(((montant*(fraisdata.frais_achat))/100))+parseFloat(fraisdata.frais_transa_achat)):(parseFloat(montant, 10) || 0)-(parseFloat(((prixparunite*quantiteachat*(fraisdata.frais_vente))/100)+parseFloat(fraisdata.frais_transa_vente)));
          const montantValue = type == "achat" ? (parseFloat(montant, 10) || 0) : parseFloat(averagePurchasePrice * quantiteachat);

          // Si la transaction existe, mettre à jour la quantité
          let updatedTransaction;
          if (type === 'achat') {

            portefeuilledata.update({ cash: (currentCash - montantValue).toString() });
            const createdcashdb = await cashdb.create({
              portefeuille_id: portefeuilleselect,
              montant: -montantValue,
              date,
            });
          } else if (type === 'vente') {
            /* updatedTransaction = await existingTransaction.update({
              quantite: existingTransaction.quantite - quantiteachat,
          });*/
            portefeuilledata.update({ cash: (currentCash + montantValue).toString() });
            const createdcashdb = await cashdb.create({
              portefeuille_id: portefeuilleselect,
              montant: montantValue,
              date,
            });
          }


          const funddata = await fond.findOne({
            where: {
              id: fondId,
            },
          });

          // Si la transaction n'existe pas, créer une nouvelle transaction
          const createdTransaction = await transaction.create({
            portefeuille_id: portefeuilleselect,
            type,
            montant: type == "achat" ? montant : prixparunite * quantiteachat,
            date,
            fond_ids: parseInt(fondId, 10),
            prixparunite,
            devise: funddata.dev_libelle,
            quantite: type == "achat" ? quantiteachata : quantiteachat,
            frais_entree: type == "achat" ? parseFloat(((montant * (fraisdata.frais_achat)) / 100)) : 0,
            frais_sortie: type == "vente" ? parseFloat(((prixparunite * quantiteachat * (fraisdata.frais_vente)) / 100)) : 0,
            frais_transaction: type == "achat" ? parseFloat(fraisdata.frais_transa_achat) : parseFloat(fraisdata.frais_transa_vente),
            frais: type == "achat" ? parseFloat(((montant * (fraisdata.frais_achat)) / 100)) + parseFloat(fraisdata.frais_transa_achat) : parseFloat(((prixparunite * quantiteachat * (fraisdata.frais_vente)) / 100) + parseFloat(fraisdata.frais_transa_vente)),
            average: averagePurchasePrice,
            invest: type == "vente" ? averagePurchasePrice * quantiteachat : 0,
            plus_moins_value: type == "vente" ? (parseFloat(prixparunite * quantiteachat) - parseFloat(((prixparunite * quantiteachat * (fraisdata.frais_vente)) / 100) + parseFloat(fraisdata.frais_transa_vente))) - (averagePurchasePrice * quantiteachat) : 0
          });

          transactions.push(createdTransaction);
          await valorisePortefeuilleVls(portefeuilleselect, createdTransaction)
          //  }
        } else if (type === 'ajoutcash' || type === 'retraitcash') {
          const createdTransaction = await transaction.create({
            portefeuille_id: portefeuilleselect,
            type,
            montant,
            date,
            // fond_ids: parseInt(fondId, 10),
            //  prixparunite,
            //   quantite: quantiteachat,
          });

          transactions.push(createdTransaction);
        }
      }

      return res.json({ code: 200, data: transactions });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur lors de la création des transactions' });
    }
  });


  app.get('/api/gettransactions/:id', async (req, res) => {
    try {
      const response = await transaction.findAll({
        where: {
          portefeuille_id: req.params.id,
          // ...
        },
        include: [{
          model: fond,
          attributes: ['nom_fond'], // Sélectionner seulement le nom du fond, vous pouvez ajouter d'autres attributs si nécessaire
        },
        {
          model: portefeuille,
          attributes: ['devise'], // Sélectionner seulement le nom du fond, vous pouvez ajouter d'autres attributs si nécessaire
        },

        ],
        order: [['date', 'ASC']]
      });
      const transactions = await Promise.all(response.map(async (data) => {
        const paire = `${data.portefeuille.devise}/${data.devise}`;

        const tauxChange = await devisedechanges.findOne({
          where: {
            date: {
              [Sequelize.Op.lte]: data.date // Cherche la date la plus proche ou égale
            },
            paire: paire
          },
          order: [['date', 'DESC']], // Trie par date décroissante pour obtenir le dernier
          attributes: ['value']
        });

        return {
          id: data.id,
          type: data.type,
          date: data.date,
          montant: data.montant,
          fond_ids: data.fond_ids,
          prixparunite: data.prixparunite,
          portefeuille_id: data.portefeuille_id,
          quantite: data.quantite,
          frais: data.frais,
          frais_transaction: data.frais_transaction,
          frais_sortie: data.frais_sortie,
          frais_entree: data.frais_entree,
          plus_moins_value: data.plus_moins_value,
          average: data.average,
          devise: data.devise,
          nom_fond: data.fond_investissement ? data.fond_investissement.nom_fond : null, // Vérifie si fond existe
          taux: tauxChange ? tauxChange.value : null // Vérifie si tauxChange existe
        };
      }));


      res.json({
        code: 200,
        data: {
          transactions,
        }
      });
    } catch (error) {
      console.error("Une erreur s'est produite :", error);
      res.status(500).json({ message: 'Erreur interne du serveur' });
    }
  });
  app.post('/api/valoriserportefeuille/:id', async (req, res) => {
    try {
      const portefeuill = await portefeuille.findOne({
        where: {
          id: parseInt(req.params.id),
        },
      });


      const valos = await portefeuille_vl.findAll({
        where: {
          portefeuille_id: parseInt(req.params.id),
        },
        order: [['date', 'ASC']], // Order transactions by date ascending
      });
      await cumulvl(valos, req.params.id)
      await portefeuille.update({ maj: 1 }, {
        where: {
          id: parseInt(req.params.id),
        },
      });
      return res.json({ code: 200, data: "succes" });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur lors de la création des transactions' });
    }
  });
  app.get('/api/exportToExcel', async (req, res) => {
    try {
      const id = req.query.id;
      const formattedDate = req.query.formattedDate; // Corrected variable name
      const formattedDate1 = req.query.formattedDate1; // Corrected variable name

      // Fetch data from the database for the past 1 year
      // const startDate = new Date();
      // startDate.setFullYear(startDate.getFullYear() - 1);

      const exportedData = await vl.findAll({
        where: {
          fund_id: parseInt(id),
          date: {
            //   [Sequelize.Op.gte]: Sequelize.literal('DATE_SUB((SELECT MAX(date) FROM valorisations WHERE fund_id = :fundId), INTERVAL 1 YEAR)'),
            [Sequelize.Op.between]: [formattedDate, formattedDate1],

          },
        },
        replacements: { fundId: req.params.id },
      });

      // Convert the data to Excel format
      const excelData = exportedData.map((item) => ({
        Date: item.date,
        Value: item.value,
        Dividende:item.dividende,
        Vlajuste:item.vl_ajuste
      }));

      // Send the Excel data as JSON
      res.json(excelData);
    } catch (error) {
      console.error('Error exporting data:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  app.get('/api/favoritesdataall/:id', async (req, res) => {
    try {

      const favoritesData = await favorisfonds.findAll({

        where: {
          // fond_ididids: { [Sequelize.Op.not]: null }, // Filter out transactions where fundid is null
          // user_id: parseInt(req.params.id),
          user_id: parseInt(req.params.id),

          // date: { [Sequelize.Op.lte]: Sequelize.literal('CURRENT_DATE') }, // Transactions on or before today
        },

      });
      if (favoritesData.length > 0) {
        res.json({ success: true, data: favoritesData });

      } else {
        res.json(null);

      }
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app.get('/api/favoritesdata/:id', async (req, res) => {
    try {

      const favoritesData = await favorisfonds.findAll({

        where: {
          // fond_ididids: { [Sequelize.Op.not]: null }, // Filter out transactions where fundid is null
          // user_id: parseInt(req.params.id),
          fund_id: parseInt(req.params.id),

          // date: { [Sequelize.Op.lte]: Sequelize.literal('CURRENT_DATE') }, // Transactions on or before today
        },

      });
      if (favoritesData.length > 0) {
        res.json({ success: true, data: favoritesData });

      } else {
        res.json({ success: false, data: null });

      }
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app.post('/api/favorites/add', async (req, res) => {
    try {
      const { fund_id, user_id } = req.body;

      favorisfonds.create({
        fund_id: parseInt(fund_id),
        user_id: parseInt(user_id),

      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Endpoint pour supprimer un fond des favoris
  app.get('/api/favorites/remove/:fundId/:userId', async (req, res) => {
    try {
      const { fundId, userId } = req.params;

      await favorisfonds.destroy({
        where: {
          fund_id: parseInt(fundId), user_id: parseInt(userId)

        }, truncate: false
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/portefeuillebase100/:id', async (req, res) => {
    try {
      const portefeuilleDatas = await getportefeuilleData(parseInt(req.params.id));
      const investissement = portefeuilleDatas[portefeuilleDatas.length - 1].investissement
      const plusmoinsvalue = portefeuilleDatas[portefeuilleDatas.length - 1].plus_moins_value
      const valeur = portefeuilleDatas[portefeuilleDatas.length - 1].valeur_portefeuille
      const date = portefeuilleDatas[portefeuilleDatas.length - 1].date
      const id = portefeuilleDatas[portefeuilleDatas.length - 1].id


      return res.json({ code: 200, data: { portefeuilleDatas, investissement, plusmoinsvalue, valeur, date, id } });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur lors de la création des transactions' });
    }
  });
  app.get('/api/portefeuillebase100dev/:id/:dev', async (req, res) => {
    try {
      const portefeuilleDatas = await getportefeuilleData(parseInt(req.params.id));
      const investissement = req.params.dev === 'EUR' ? portefeuilleDatas[portefeuilleDatas.length - 1].investissement_EUR : portefeuilleDatas[portefeuilleDatas.length - 1].investissement_USD;
      //const investissement=portefeuilleDatas[portefeuilleDatas.length-1].investissement
      const plusmoinsvalue = req.params.dev === 'EUR' ? portefeuilleDatas[portefeuilleDatas.length - 1].plus_moins_value_EUR : portefeuilleDatas[portefeuilleDatas.length - 1].plus_moins_value_USD
      const valeur = req.params.dev === 'EUR' ? portefeuilleDatas[portefeuilleDatas.length - 1].valeur_portefeuille_EUR : portefeuilleDatas[portefeuilleDatas.length - 1].valeur_portefeuille_USD
      const date = portefeuilleDatas[portefeuilleDatas.length - 1].date
      const id = portefeuilleDatas[portefeuilleDatas.length - 1].id
      const cash = req.params.dev === 'EUR' ? portefeuilleDatas[portefeuilleDatas.length - 1].cash_EUR : portefeuilleDatas[portefeuilleDatas.length - 1].cash_USD;


      return res.json({ code: 200, data: { portefeuilleDatas, investissement, cash, plusmoinsvalue, valeur, date, id } });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur lors de la création des transactions' });
    }
  });
  app.get('/api/portefeuillebase100s', async (req, res) => {
    try {
      const portefeuilleDatas = await getportefeuilleDatas();


      return res.json({ code: 200, data: { portefeuilleDatas } });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur lors de la création des transactions' });
    }
  });

  /*
  async function calculerPerformanceTotale(portfolioId) {
  const transactions = await Transaction.findAll({ where: { portfolioId } });
  // Logique pour calculer la performance totale basée sur les transactions
  }*/



  function getDatesInRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const workingDatesInRange = [];

    // Boucle pour générer les dates dans l'intervalle
    for (let currentDate = start; currentDate <= end; currentDate.setDate(currentDate.getDate() + 1)) {
      // Vérifier si le jour actuel n'est pas un weekend (lundi à vendredi)
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        const formattedDate = currentDate.toISOString().split('T')[0];
        workingDatesInRange.push(formattedDate);
      }
    }

    return workingDatesInRange;
  }
  function obtenirDerniereVL(fundVLs, date) {
    // Si la VL pour la date est disponible, on la retourne


    // Sinon, on cherche la VL la plus récente avant cette date
    const datesDisponibles = fundVLs.filter(d => d.date <= date);
    const derniereDate = datesDisponibles.sort().reverse()[0];
    return fundVLs.find(fund => fund.id === derniereDate.id);
  }

  async function getportefeuilleData(portefeuilleId) {
    try {
      const transactions = await portefeuille_vl_cumul.findAll({
        where: {
          portefeuille_id: portefeuilleId
        },
        order: [
          ['date', 'ASC']
        ]
      });
      return transactions;
    } catch (error) {
      throw new Error("Erreur lors de la récupération des transactions : " + error.message);
    }
  }
  async function getportefeuilleDatas() {
    try {
      const transactions = await portefeuille_vl_cumul.findAll({

        order: [
          ['portefeuille_id', 'ASC'],
          ['date', 'ASC']
        ]
      });
      return transactions;
    } catch (error) {
      throw new Error("Erreur lors de la récupération des transactions : " + error.message);
    }
  }


  // Function to valorize and populate the portfolio_vls table
  async function valorisePortefeuilleVls(portefeuilleId, transactionp) {
    try {
      /* await portefeuille_vl.destroy({ where: {portefeuille_id: parseInt(portefeuilleId),
   
       }, truncate: true });*/


      const valorisations = [];
      // Fetch transactions for the given portfolio
      const portfolioTransactions = await transaction.findAll({
        where: {
          fond_ids: { [Sequelize.Op.not]: null }, // Filter out transactions where fundid is null
          portefeuille_id: parseInt(portefeuilleId),
        },
        order: [['date', 'ASC']], // Order transactions by date ascending
      });

      const portefeuilleselect = await portefeuille.findOne({
        where: {
          // fond_ididids: { [Sequelize.Op.not]: null }, // Filter out transactions where fundid is null
          id: parseInt(portefeuilleId),
          // date: { [Sequelize.Op.lte]: Sequelize.literal('CURRENT_DATE') }, // Transactions on or before today
        },
        //order: [['date', 'ASC']], // Order transactions by date ascending
      });

      // Calculate and populate the portfolio_vls table for each transaction
      const valuesToInsert = {};
      // let quantiteCumulee;
      const mostRecentDatesandfund = []; // Assurez-vous que mostRecentDatesandfund est défini comme un tableau

      //Recherche de la date de Vl la plus recente
      const distinctFundIds = parseInt(transactionp.fond_ids);

      // Fetch the most recent VL for each fund in a single query
      const mostRecentVLs = await vl.findAll({
        attributes: ['fund_id', [Sequelize.fn('MAX', Sequelize.col('date')), 'mostRecentDate']],
        where: {
          fund_id: distinctFundIds,
        },
        group: ['fund_id'],
        order: [[Sequelize.literal('mostRecentDate ASC')]], // Order by mostRecentDate in descending order
        limit: 1, // Limit to get only the most recent VL for each fund
        raw: true, // This ensures that the result is plain JSON objects, not Sequelize model instances
      });
      if (mostRecentVLs.length > 0) {
        mostRecentDatesandfund.push({
          date: mostRecentVLs[0].mostRecentDate,
          fund_id: mostRecentVLs[0].fund_id,
        });
      }
      // Create an array to store promises for each transaction
      //const portfolioPromises = portfolioTransactions.map(async (transaction, index) => {
      const currentDate = transactionp.date;



      let totalValue;
      let quantiteCumulee = transactionp.quantite;

      const startDate = transactionp.date;

      const fundVLs = await vl.findAll({
        where: {
          fund_id: parseInt(transactionp.fond_ids),
        },
        order: [['date', 'ASC']], // Order VLs by date ascending
        distinct: true,
      });

      const fundVLsvente = await vl.findOne({
        where: {
          fund_id: parseInt(transactionp.fond_ids),
          date: transactionp.date
        },
        order: [['date', 'ASC']], // Order VLs by date ascending
        distinct: true,
      });
      const distinctFundIdss = portefeuilleselect.fundids.replace(/[^0-9A-Za-z\s,]+/g, '').split(',')
      const distinctFundIdsParsed = distinctFundIdss.map(id => parseInt(id));

      const commonDates = await vl.findAll({
        attributes: ['date'],
        where: {
          fund_id: distinctFundIdsParsed
        },
        group: ['date'],
        having: Sequelize.literal(`COUNT(DISTINCT fund_id) = ${distinctFundIdss.length}`),
        order: [['date', 'DESC']],
        limit: 1,
        raw: true
      });

      const existingTransactions = await transaction.findAll({
        where: {
          type: 'achat',
          fond_ids: parseInt(transactionp.fond_ids),
          date: {
            [Op.lte]: new Date(transactionp.date)
          }
        }
      });

      // Calculate average purchase price
      let totalAmount = 0;
      let totalQuantity = 0;

      for (const existingTransaction of existingTransactions) {
        totalAmount += existingTransaction.prixparunite * existingTransaction.quantite;
        totalQuantity += existingTransaction.quantite;
      }

      const averagePurchasePrice = totalQuantity ? totalAmount / totalQuantity : 0;

      //  const dates = getDatesInRange(startDate, new Date());
      const dates = commonDates.length ? getDatesInRange(startDate, commonDates[0].date) : getDatesInRange(startDate, new Date());
      for (const date of dates) {
        const fundVL = obtenirDerniereVL(fundVLs, date)
        if (fundVL) {
          // Assuming transactionps is an array of transactionps



          if (transactionp.type === 'achat') {
            if (portefeuilleselect.devise == "EUR") {
              totalValue = transactionp.quantite * fundVL.value_ajuste_EUR; //todo

            } else {
              totalValue = transactionp.quantite * fundVL.value_ajuste_USD; //todo

            }
          } else if (transactionp.type === 'vente') {
            if (portefeuilleselect.devise == "EUR") {
              totalValue = -transactionp.quantite * fundVL.value_ajuste_EUR; //todo

            } else {
              totalValue = -transactionp.quantite * fundVL.value_ajuste_USD; //todo

            }
            // averagePrice = calculateAveragePrice(portfolioTransactions, transactionp.date);

            // totalValue = -transactionp.quantite * averagePrice;


          }

          const result1 = await cashdb.findAll({
            attributes: [
              'portefeuille_id',
              [Sequelize.fn('SUM', Sequelize.col('montant')), 'totalMontant'],
            ],
            where: {
              date: { [Sequelize.Op.lte]: date },
              portefeuille_id: parseInt(portefeuilleId),
            },
            group: ['portefeuille_id'],
            raw: true,
          });

          const totalMontant = result1.length > 0 ? result1[0].totalMontant : 0;
          const cashhhh = parseFloat(totalMontant) + parseFloat(totalValue);
          let exchangeRates = await devisedechanges.findOne({
            where: {
              date: { [Op.lte]: date }, // Chercher la date la plus proche inférieure ou égale
              //date: date,
              paire: 'EUR/USD',
            },
            order: [['date', 'DESC']] // Tri par date descendant
          });

          // Si aucune entrée n'est trouvée pour la date spécifiée et la paire de devises 'EUR/USD'
          if (!exchangeRates) {
            // Recherche de la dernière entrée dans la base de données
            exchangeRates = await devisedechanges.findOne({
              where: {
                paire: 'EUR/USD',
              },
              order: [['date', 'DESC']] // Tri par date descendant
            });
          }

          const montantdepense = transactionp.quantite * transactionp.prixparunite + transactionp.frais;
          valorisations.push({
            date: date,
            //     value: transactionp.type === 'achat' ? cashhhh : totalValue,
            valeur_jour: totalValue,
            valeur_jour_EUR: portefeuilleselect.devise == 'EUR' ? totalValue : totalValue / exchangeRates.value,
            valeur_jour_USD: portefeuilleselect.devise == 'USD' ? totalValue : totalValue * exchangeRates.value,
            cash: totalMontant,
            cash_EUR: portefeuilleselect.devise == 'EUR' ? totalMontant : totalMontant / exchangeRates.value,
            cash_USD: portefeuilleselect.devise == 'USD' ? totalMontant : totalMontant * exchangeRates.value,
            montantdepense: transactionp.type === 'achat' ? montantdepense : 0,
            frais: transactionp.type === 'achat' ? -transactionp.frais : -transactionp.frais,
            investissement: transactionp.type === 'achat' ? transactionp.quantite * transactionp.prixparunite : -transactionp.quantite * averagePurchasePrice,
            investissement_EUR: portefeuilleselect.devise == 'EUR' ? (transactionp.quantite * transactionp.prixparunite) : (transactionp.quantite * averagePurchasePrice) / exchangeRates.value,
            investissement_USD: portefeuilleselect.devise == 'USD' ? (transactionp.quantite * transactionp.prixparunite) : (transactionp.quantite * averagePurchasePrice) * exchangeRates.value,
            vl: portefeuilleselect.devise == 'EUR' ? fundVL.value_EUR : fundVLsvente.value_USD,
            quantite: transactionp.type === 'achat' ? transactionp.quantite : -transactionp.quantite,
            fund_id: transactionp.fond_ids,
            prix_moyen: averagePurchasePrice,
            portefeuille_id: parseInt(portefeuilleId),
          });
        }
      }

      //  });

      // Wait for all promises to complete before proceeding
      // await Promise.all(portfolioPromises);

      await portefeuille_vl.bulkCreate(valorisations);





      console.log('Portefeuille_vls table populated successfully.');
    } catch (error) {
      console.error('Error populating portfolio_vls table:', error);
      throw error;
    }
  }



  async function cumulvl(valorisations, portefeuilleId) {
    await portefeuille_vl_cumul.destroy({ where: { portefeuille_id: parseInt(portefeuilleId), }, truncate: false });
    await portefeuille_base100.destroy({ where: { portefeuille_id: parseInt(portefeuilleId), }, truncate: false });

    // Continue with the rest of the code
    let aggregateValues = {};
    valorisations.forEach((valo) => {
      const date = valo.date;

      if (aggregateValues[date]) {
        aggregateValues[date].valeur_jour = parseFloat(aggregateValues[date].valeur_jour) + parseFloat(valo.valeur_jour);
        aggregateValues[date].investissement = parseFloat(aggregateValues[date].investissement) + parseFloat(valo.investissement);
        aggregateValues[date].valeur_jour_EUR = parseFloat(aggregateValues[date].valeur_jour_EUR) + parseFloat(valo.valeur_jour_EUR);
        aggregateValues[date].investissement_EUR = parseFloat(aggregateValues[date].investissement_EUR) + parseFloat(valo.investissement_EUR);
        aggregateValues[date].valeur_jour_USD = parseFloat(aggregateValues[date].valeur_jour_USD) + parseFloat(valo.valeur_jour_USD);
        aggregateValues[date].investissement_USD = parseFloat(aggregateValues[date].investissement_USD) + parseFloat(valo.investissement_USD);
        aggregateValues[date].quantite = parseFloat(aggregateValues[date].quantite) + parseFloat(valo.quantite);

      } else {
        aggregateValues[date] = {
          date: valo.date,
          valeur_jour: valo.valeur_jour,
          valeur_jour_EUR: valo.valeur_jour_EUR,
          valeur_jour_USD: valo.valeur_jour_USD,
          quantite: valo.quantite,
          //  fund_id: valo.fund_id,
          portefeuille_id: valo.portefeuille_id,
          cash: valo.cash,
          cash_EUR: valo.cash_EUR,
          cash_USD: valo.cash_USD,

          //   montantdepense:valo.montantdepense,
          //   frais:valo.frais,
          investissement: valo.investissement,
          investissement_EUR: valo.investissement_EUR,
          investissement_USD: valo.investissement_USD,

          //   plus_moins_value:valo.valeur_jour-parseFloat(valo.investissement),
          //   vl:valo.vl,
          //   quantite:valo.quantite,
        };
      }
    });

    // Continue with the rest of your code after the portfolio-related queries are completed


    // Convertir 'aggregateValues' en tableau
    const aggregatedArray = Object.values(aggregateValues);


    for (const valo of aggregatedArray) {
      const date = valo.date;

      const result2 = await cashdb.findAll({
        attributes: [
          'portefeuille_id',
          [Sequelize.fn('SUM', Sequelize.col('montant')), 'totalMontant'],
        ],
        where: {
          date: { [Sequelize.Op.lte]: date },
          portefeuille_id: parseInt(portefeuilleId),
        },
        group: ['portefeuille_id'],
        raw: true,
      });
      const portefeuilleselect = await portefeuille.findOne({
        where: {
          // fond_ididids: { [Sequelize.Op.not]: null }, // Filter out transactions where fundid is null
          id: parseInt(portefeuilleId),
          // date: { [Sequelize.Op.lte]: Sequelize.literal('CURRENT_DATE') }, // Transactions on or before today
        },
        //order: [['date', 'ASC']], // Order transactions by date ascending
      });

      let exchangeRates = await devisedechanges.findOne({
        where: {
          date: { [Op.lte]: date }, // Chercher la date la plus proche inférieure ou égale

          //  date: date,
          paire: 'EUR/USD',
        },
        order: [['date', 'DESC']] // Tri par date descendant
      });

      // Si aucune entrée n'est trouvée pour la date spécifiée et la paire de devises 'EUR/USD'
      if (!exchangeRates) {
        // Recherche de la dernière entrée dans la base de données
        exchangeRates = await devisedechanges.findOne({
          where: {
            paire: 'EUR/USD',
          },
          order: [['date', 'DESC']] // Tri par date descendant
        });
      }
      const totalMontant = result2.length > 0 ? result2[0].totalMontant : 0;
      let totalMontant_EUR;
      let totalMontant_USD;

      if (portefeuilleselect.devise == 'EUR') {
        totalMontant_EUR = totalMontant;
        totalMontant_USD = totalMontant_EUR * exchangeRates.value;
      } else {
        totalMontant_USD = totalMontant;
        totalMontant_EUR = totalMontant_USD / exchangeRates.value
      }

      // Modify the 'cash' property of the current object in aggregatedArray
      valo.valeur_portefeuille = valo.valeur_jour + totalMontant;
      valo.valeur_portefeuille_EUR = valo.valeur_jour_EUR + totalMontant_EUR;
      valo.valeur_portefeuille_USD = valo.valeur_jour_USD + totalMontant_USD;

      valo.plus_moins_value = valo.valeur_jour - valo.investissement;
      valo.plus_moins_value_EUR = valo.valeur_jour_EUR - valo.investissement_EUR;
      valo.plus_moins_value_USD = valo.valeur_jour_USD - valo.investissement_USD;

      // Do something with cashhhh or perform other operations...
    }



    await portefeuille_vl_cumul.bulkCreate(aggregatedArray)
    const transactionDatas = await getTransactionData(parseInt(portefeuilleId));
    const portefeuilleDatas = await getportefeuilleData(parseInt(portefeuilleId));


    let lastValuep = portefeuilleDatas[0].valeur_portefeuille; // Dernière valeur

    const base100Datas = portefeuilleDatas.map((item) => ({
      dates: item.date,
      base_100: (item.valeur_portefeuille / lastValuep) * 100,
      portefeuille_id: parseInt(portefeuilleId),
      //  valeur_portefeuille:item.valeur_portefeuille
    }));


    for (let index = 0; index < transactionDatas.length; index++) {
      const transaction = transactionDatas[index];
      console.log("rffffff");

      if (index !== 0) {
        if (transaction.type === 'ajoutcash') {

          lastValuep += parseFloat(transaction.montant);
          console.log("lastValue");

          console.log(lastValuep);

        }
        if (transaction.type === 'retraitcash') {
          lastValuep -= transaction.montant

        }


        const indexe = portefeuilleDatas.findIndex((item) => item.date === transaction.date);
        console.log("datasgraph[indexe]")
        console.log(indexe)

        for (let i = indexe; i < base100Datas.length; i++) {
          base100Datas[i].base_100 = (portefeuilleDatas[i].valeur_portefeuille / lastValuep) * 100;
        }
      }


    };


    for (let i = 0; i < base100Datas.length; i++) {
      const exchangeRates = await devisedechanges.findOne({
        where: {
          date: { [Op.lte]: base100Datas[i].dates }, // Chercher la date la plus proche inférieure ou égale

          //  date: base100Datas[i].dates,
          paire: 'EUR/MAD',

        },
      });
      const exchangeRates1 = await devisedechanges.findOne({
        where: {
          date: { [Op.lte]: base100Datas[i].dates }, // Chercher la date la plus proche inférieure ou égale

          //  date: base100Datas[i].dates,
          paire: 'USD/MAD',

        },
      });
      await portefeuille_vl_cumul.update(
        {
          base_100: base100Datas[i].base_100, base_100_bis: (portefeuilleDatas[i].valeur_jour / parseFloat(portefeuilleDatas[i].investissement)) * 100,
          base_100_bis_2: (portefeuilleDatas[i].valeur_portefeuille / parseFloat(portefeuilleDatas[i].investissement)) * 100,
          base_100_bis_EUR: (portefeuilleDatas[i].valeur_jour_EUR / parseFloat(portefeuilleDatas[i].investissement_EUR)) * 100,
          base_100_bis_USD: (portefeuilleDatas[i].valeur_jour_USD / parseFloat(portefeuilleDatas[i].investissement_USD)) * 100
        },
        {
          where: {
            date: base100Datas[i].dates,
            portefeuille_id: base100Datas[i].portefeuille_id,
          },
        }
      );
    }

  }


  app.post('/api/saveValuationData', (req, res) => {
    const valuationData = req.body; // Assuming the request body contains valuation data
    // Save valuation data to the database or file system
    // Respond with a success message or saved data
  });

  app.post('/api/postuserportefeuille', async (req, res) => {
    try {
      const {
        email,
        password,
        nom,
        prenoms,
        denomination,
        pays,
        typeusers,
        typeusers_id


        // Ajoutez d'autres champs ici
      } = req.body;
      /* const fundsData = req.body.funds;
   
       const fundsArray = fundsData.split(', ');
       const fundsidData = req.body.fundids;
   
       const fundsidArray = fundsidData.split(', ');*/

      const newUser = await users.create({
        email: email,
        password: bcrypt.hashSync(password, 10),
        nom: nom,
        prenoms: prenoms,
        denomination: denomination,
        pays: pays,
        typeusers: typeusers,
        typeusers_id: typeusers_id,
        active: typeusers_id != 1 ? 0 : 1
      });

      // Retrieve additional data if needed
      // For example, you can retrieve the user ID after creation
      const userId = newUser;

      // Respond with a success message and additional data
      res.json({
        code: 200,
        data: {
          userId: userId
        }
      });
    } catch (error) {
      // Gérez les erreurs ici
      console.error('Erreur lors de l\'insertion en base de données :', error);
      res.status(500).json({ message: 'Erreur lors de l\'insertion en base de données' });
    }
  });
  app.get('/api/userexist', async (req, res) => {
    try {
      const userEmail = req.query.email;

      if (!userEmail) {
        return res.status(400).json({ code: 400, message: 'Email parameter is missing' });
      }

      const user = await users.findOne({
        where: {
          email: userEmail
        }
      });

      if (user) {
        // L'utilisateur existe
        return res.json({
          code: 200,
          data: {
            userExists: true,
            user: user
          }
        });
      } else {
        // L'utilisateur n'existe pas
        return res.json({
          code: 400,
          data: {
            userExists: false
          }
        });
      }
    } catch (error) {
      console.error("Error in /api/userexist:", error);
      return res.status(500).json({ code: 500, message: 'Internal Server Error' });
    }
  });

  app.get('/api/userlogin', async (req, res) => {
    try {
      const userEmail = req.query.email;
      const password = req.query.password;


      if (!userEmail) {
        return res.status(400).json({ code: 400, message: 'Email parameter is missing' });
      }

      const user = await users.findOne({
        where: {
          email: userEmail
        }
      });

      if (user) {
        if (await bcrypt.compare(password, user.password)) {
          return res.json({
            code: 200,
            data: {
              userExists: user
            }
          });
        } else {
          // L'utilisateur n'existe pas
          return res.json({
            code: 400,
            data: {
              userExists: false
            }
          });
        }
        // L'utilisateur existe

      } else {
        // L'utilisateur n'existe pas
        return res.json({
          code: 400,
          data: {
            userExists: false
          }
        });
      }
    } catch (error) {
      console.error("Error in /api/userexist:", error);
      return res.status(500).json({ code: 500, message: 'Internal Server Error' });
    }
  });

 

  //Process2
 

  app.get('/api/getallfondsvlmanquant', async (req, res) => {
    const societegestion = req.query.societegestion;
    const pays = req.query.pays;


    // Requête pour récupérer les fonds avec une anomalie de type "VL MANQUANTE"
    const highVolatilityFundsVLManquante = await performences.findAll({
      attributes: ['fond_id'], // Sélectionnez uniquement la colonne fond_id
      where: {

        anomalie: 'VL MANQUANTE'
      },
      raw: true // Assurez-vous de récupérer les résultats sous forme de tableau brut
    });

    const dataWithAnomalyTypeVLManquante = highVolatilityFundsVLManquante.map(fundId => ({
      id: fundId.fond_id,
      anomalie: 'VL MANQUANTE'
    }));

    // Combiner les deux ensembles
    const combinedData = [...dataWithAnomalyTypeVLManquante,];

    // Récupérer les données des fonds à partir des IDs combinés
    const highVolatilityFundsData = [];

    for (const data of combinedData) {
      let fundData;
      if (societegestion) {
        fundData = await fond.findOne({ where: { id: data.id, societe_gestion: societegestion } });
      } else if (pays) {
        fundData = await fond.findOne({ where: { id: data.id, pays: pays } });
      }

      else {
        fundData = await fond.findOne({ where: { id: data.id } });
      }
      if (fundData) {
        highVolatilityFundsData.push(fundData);
      }
    }


    // Associer les données récupérées avec le type d'anomalie correspondant
    const dataWithAnomalyType = [];
    const idCounts = {};
    const seenCombinations = new Set();

    for (const fund of highVolatilityFundsData) {
      const id = fund.id;
      /* let anomalyType = 'VL MANQUANTE';
   
       if (idCounts[id]) {
         idCounts[id]++;
         anomalyType = `ANOMALIE VL`;
       } else {
         idCounts[id] = 1;
       }*/

      const correspondingData = combinedData.filter(data => data.id === id);
      /*correspondingData.forEach(data => {
        dataWithAnomalyType.push({
          ...fund.toJSON(),
          type_anomalie: data.anomalie,
          // Vous pouvez également ajouter les autres propriétés de data si nécessaire
        });
      });*/

      correspondingData.forEach(data => {
        const combinationKey = `${fund.id}-${data.anomalie}`; // Assurez-vous que fund.id est une propriété unique pour chaque fund

        if (!seenCombinations.has(combinationKey)) {
          seenCombinations.add(combinationKey);
          dataWithAnomalyType.push({
            ...fund.toJSON(),
            type_anomalie: data.anomalie,
            // Ajoutez les autres propriétés de data si nécessaire
          });
        }
      });
    }
    console.log(dataWithAnomalyType)
    res.json({
      code: 200,
      data: dataWithAnomalyType
    });
  });

  app.get('/api/getallfondsvlanomalie', async (req, res) => {
    const societegestion = req.query.societegestion;
    const pays = req.query.pays;

    // Requête pour récupérer les fonds avec une autre anomalie que "VL MANQUANTE"
    const highVolatilityFundsAutreAnomalie = await performences.findAll({
      attributes: ['fond_id'], // Sélectionnez uniquement la colonne fond_id
      where: {
        [Sequelize.Op.or]: [
          { volatility3an: { [Op.gt]: 50 } },
          { volatility1an: { [Op.gt]: 50 } },
          { volatility5an: { [Op.gt]: 50 } },
          { pertemax1an: { [Op.lt]: -50 } },
          { pertemax3an: { [Op.lt]: -50 } },
          { pertemax5an: { [Op.lt]: -50 } }
        ],
      },
      raw: true // Assurez-vous de récupérer les résultats sous forme de tableau brut
    });

    // Parcourir fundIdsAutreAnomalie et ajouter les fonds avec l'anomalie "fff"
    const dataWithAnomalyTypeAutreAnomalie = highVolatilityFundsAutreAnomalie.map(fundId => ({
      id: fundId.fond_id,
      anomalie: 'ANOMALIE VL'
    }));

    // Combiner les deux ensembles
    const combinedData = [ ...dataWithAnomalyTypeAutreAnomalie];

    // Récupérer les données des fonds à partir des IDs combinés
    const highVolatilityFundsData = [];

    for (const data of combinedData) {
      let fundData;
      if (societegestion) {
        fundData = await fond.findOne({ where: { id: data.id, societe_gestion: societegestion } });
      } else if (pays) {
        fundData = await fond.findOne({ where: { id: data.id, pays: pays } });
      }

      else {
        fundData = await fond.findOne({ where: { id: data.id } });
      }
      if (fundData) {
        highVolatilityFundsData.push(fundData);
      }
    }


    // Associer les données récupérées avec le type d'anomalie correspondant
    const dataWithAnomalyType = [];
    const idCounts = {};
    const seenCombinations = new Set();

    for (const fund of highVolatilityFundsData) {
      const id = fund.id;
      /* let anomalyType = 'VL MANQUANTE';
   
       if (idCounts[id]) {
         idCounts[id]++;
         anomalyType = `ANOMALIE VL`;
       } else {
         idCounts[id] = 1;
       }*/

      const correspondingData = combinedData.filter(data => data.id === id);
      /*correspondingData.forEach(data => {
        dataWithAnomalyType.push({
          ...fund.toJSON(),
          type_anomalie: data.anomalie,
          // Vous pouvez également ajouter les autres propriétés de data si nécessaire
        });
      });*/

      correspondingData.forEach(data => {
        const combinationKey = `${fund.id}-${data.anomalie}`; // Assurez-vous que fund.id est une propriété unique pour chaque fund

        if (!seenCombinations.has(combinationKey)) {
          seenCombinations.add(combinationKey);
          dataWithAnomalyType.push({
            ...fund.toJSON(),
            type_anomalie: data.anomalie,
            // Ajoutez les autres propriétés de data si nécessaire
          });
        }
      });
    }
    console.log(dataWithAnomalyType)
    res.json({
      code: 200,
      data: dataWithAnomalyType
    });
  });
  app.get('/api/vlspresui/:id/:value/:date', async (req, res) => {
    try {
      const { id, value, date } = req.params;
      // Récupérer les valeurs précédentes et suivantes pour le fonds spécifié
      const previousValues = await vl.findAll({
        where: {
          fund_id: parseInt(id), // ID du fonds
          date: { [Sequelize.Op.lt]: date }, // Date antérieure à la date donnée
          //  value: { [Sequelize.Op.lt]: value } // Valeur antérieure à la valeur donnée
        },
        order: [['date', 'DESC'],], // Trier par date et valeur en ordre décroissant
        limit: 5 // Limiter les résultats à 5 enregistrements
      });
      const nextValues = await vl.findAll({
        where: {
          fund_id: parseInt(id), // ID du fonds
          date: { [Sequelize.Op.gt]: date }, // Date postérieure à la date donnée
          //  value: { [Sequelize.Op.gte]: value } // Valeur postérieure ou égale à la valeur donnée
        },
        order: [['date', 'ASC']], // Trier par date et valeur en ordre croissant
        limit: 5 // Limiter les résultats à 5 enregistrements
      });
      previousValues.reverse();

      res.json({
        code: 200,
        data: { previousValues, nextValues }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  app.post('/api/updateValues/:id', async (req, res) => {
    try {
      const nupdatedDataList = req.body.nextValues; // Récupérez la liste de données mises à jour envoyées depuis le front-end
      const pupdatedDataList = req.body.previousValues; // Récupérez la liste de données mises à jour envoyées depuis le front-end

      // Parcourez la liste et mettez à jour chaque entrée de valorisation
      for (const updatedData of nupdatedDataList) {
        const { id, date, value } = updatedData;
        let fonds = await fond.findOne({
          where: {
            id: parseInt(id)
          },

        });
        const paireEUR = "EUR" + "/" + fonds.dev_libelle;
        const paireUSD = "USD" + "/" + fonds.dev_libelle;
        const val = parseFloat(value)
        let exchangeRatesEUR = await devisedechanges.findOne({
          where: {
            date: { [Op.lte]: date }, // Chercher la date la plus proche inférieure ou égale
            paire: paireEUR,
          },
          order: [['date', 'DESC']], // Tri par date descendant pour obtenir la date la plus proche
        });
        let exchangeRatesUSD = await devisedechanges.findOne({
          where: {
            date: { [Op.lte]: date }, // Chercher la date la plus proche inférieure ou égale
            paire: paireUSD,
          },
          order: [['date', 'DESC']] // Tri par date descendant
        });
        await vl.update({
          date: date,
          value: parseFloat(val),
          value_EUR: exchangeRatesEUR ? parseFloat(val) * exchangeRatesEUR.value : null,
          value_USD: exchangeRatesUSD ? parseFloat(val) * exchangeRatesUSD.value : null
        }, { where: { fund_id: parseInt(req.params.id), date: date } });
      }

      for (const updatedData of pupdatedDataList) {
        const { id, date, value } = updatedData;
        const val = parseFloat(value)
        await vl.update({
          date: date,
          value: parseFloat(val),
          value_EUR: exchangeRatesEUR ? parseFloat(val) * exchangeRatesEUR.value : null,
          value_USD: exchangeRatesUSD ? parseFloat(val) * exchangeRatesUSD.value : null
        }, { where: { fund_id: parseInt(req.params.id), date: date } });
      }

      res.status(200).json({ message: 'Valorisations updated successfully' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  app.get('/api/getfondsanomalie/:id', async (req, res) => {
    try {
      const valorisations = await vl.findAll({
        where: {
          fund_id: parseInt(req.params.id)
        },
        order: [['date', 'ASC']]
      });
      const highVolatilityFundsData = await fond.findAll({
        where: {
          id: parseInt(req.params.id)
        }
      });
      const fondsWithAnomalies = [];

      for (let i = 1; i < valorisations.length - 1; i++) {
        const currentValue = valorisations[i].value;
        const prevValue = valorisations[i - 1].value;
        const nextValue = valorisations[i + 1].value;
        const dateprev = valorisations[i - 1].date;
        const datenext = valorisations[i + 1].date;
        const date = valorisations[i].date;

        const percentChangePrev = Math.abs((currentValue - prevValue) / prevValue) * 100;
        const percentChangeNext = Math.abs((nextValue - currentValue) / currentValue) * 100;

        //   if (percentChangePrev <= 10 && percentChangeNext <= 10) {
        if (prevValue <= currentValue * 0.9) {
          fondsWithAnomalies.push({
            id: parseInt(req.params.id),
            nom: highVolatilityFundsData[0].nom_fond,
            code: highVolatilityFundsData[0].code_ISIN,
            now: currentValue,
            after: prevValue,
            //  nextValue,
            nowdate: date,
            afterdate: dateprev

            //  datenext
          });
        }/*else if(nextValue>=currentValue*1.1){
              fondsWithAnomalies.push({
                id:highVolatilityFundsData[0].id,
                nom:highVolatilityFundsData[0].nom_fond,
                code:highVolatilityFundsData[0].code_ISIN,

            now:    currentValue,
               // prevValue,
             after:   nextValue,
              //  dateprev,
            nowdate:  date,
             afterdate:   datenext

            });
            }*/
      }

      res.json({
        code: 200,
        data: fondsWithAnomalies
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({
        code: 500,
        message: 'Internal server error'
      });
    }
  });

  app.get('/api/getportefeuillebyuser/:id', async (req, res) => {
    portefeuille.findAll({
      where: {
        user_id: req.params.id

      },
      order: [
        ['id', 'ASC']
      ]
    })
      .then(response => {
        //const funds = response.map((data) => data.id);

        const portefeuille = response.map(data => ({
          nom_portefeuille: data.nom_portefeuille.toString(), // Remplacez avec la propriété correcte de l'objet
          description: data.description,
          funds: data.funds,
          fundids: data.fundids,
          id: data.id,
          montant_invest: data.montant_invest,
          poids: data.poidsportefeuille,
          portefeuilletype: data.portefeuilletype,
          horizon: data.horizon,
          categorie: data.categorie,
          univers: data.univers,
          universsous: data.universsous,

        }));
        res.json({
          code: 200,
          data: {
            portefeuille,
            //  valorisation

          }
        })

      })
  })
  app.get('/api/getportefeuille/:id', async (req, res) => {
    const resultat = await portefeuille_vl_cumul.findAll({
      attributes: ['date', 'valeur_portefeuille'],
      where: {
        portefeuille_id: req.params.id,
      },
      order: [
        ['date', 'ASC']
      ]
    });
    let valorisation;
    if (resultat) {
      valorisation = resultat;
      // Utilisez valorisation ici
    }

    const resultat1 = await portefeuilles_proposes_vls.findAll({
      attributes: ['date', 'value'],
      where: {
        portefeuille_id: req.params.id,
      },
      order: [
        ['date', 'ASC']
      ]
    });
    let valorisation_robo;
    if (resultat1) {
      valorisation_robo = resultat1;
      // Utilisez valorisation ici
    }

    const portefeuilleResult = await portefeuille.findAll({
      where: {
        id: req.params.id
        /* id: {
           //  [Sequelize.Op.like]: `%${searchTerm}%`
         }*/
      },
      order: [
        ['id', 'ASC']
      ]
    })
      .then(response => {
        //const funds = response.map((data) => data.id);

        const portefeuille = {
          nom_portefeuille: response[0].nom_portefeuille.toString(), // Remplacez avec la propriété correcte de l'objet
          description: response[0].description,
          funds: response[0].funds,
          fundids: response[0].fundids,
          id: response[0].id,
          montant_invest: response[0].montant_invest,
          cash: response[0].cash,
          devise: response[0].devise,
          poids: response[0].poidsportefeuille,
          portefeuilletype: response[0].portefeuilletype,
          horizon: response[0].horizon,
          categorie: response[0].categorie,
          univers: response[0].univers,
          maj: response[0].maj,
          universsous: response[0].universsous,
        };
        res.json({
          code: 200,
          data: {
            portefeuille,
            valorisation,
            valorisation_robo

          }
        })

      })
  })
  app.post('/api/postportefeuille', async (req, res) => {
    try {
      const {
        nomDuportefeuille,
        Description,
        horizon,
        portefeuilletype,
        universInvestissement,
        universInvestissementsous,
        classeActifs,
        userid,
        devise

        // Ajoutez d'autres champs ici
      } = req.body;
      /* const fundsData = req.body.funds;
   
       const fundsArray = fundsData.split(', ');
       const fundsidData = req.body.fundids;
   
       const fundsidArray = fundsidData.split(', ');*/

      portefeuille.create({
        nom_portefeuille: nomDuportefeuille,
        description: Description,
        portefeuilletype: portefeuilletype,
        horizon: horizon,
        univers: universInvestissement,
        universsous: universInvestissementsous,
        categorie: classeActifs,
        user_id: userid,
        devise: devise,
        //  funds:fundsArray,
        // fundids:fundsidArray
        // Ajoutez d'autres champs ici
      })



      // Répondez avec un message de succès ou autre réponse appropriée
      res.status(200).json({ message: 'Données insérées avec succès' });
    } catch (error) {
      // Gérez les erreurs ici
      console.error('Erreur lors de l\'insertion en base de données :', error);
      res.status(500).json({ message: 'Erreur lors de l\'insertion en base de données' });
    }
  });
  app.post('/api/updateportefeuille', async (req, res) => {
    try {
      const {
        selectedportfeuille,
        selectedValue,
        selectedValuename,
        Fond,
        Fondname

        // funds,
        // Ajoutez d'autres champs ici
      } = req.body;
      let fundsArraypost;
      let fundsnameArraypost;

      let fundsArray = null; // Change const to let to allow reassignment
      let fundsnameArray = null; // Change const to let to allow reassignment

      const fundsData = selectedValue; // Use the correct variable name
      const fundsDataname = selectedValuename; // Use the correct variable name



      if (fundsData != null) {
        fundsArray = fundsData.split(',');
        fundsnameArray = fundsDataname.split(',');
        fundsArraypost = fundsArray;
        fundsnameArraypost = fundsnameArray;

      }

      // Define the 'updatedData' object that you want to use in the 'portefeuille.update' method
      const updatedData = {
        fundids: fundsArraypost, funds: fundsnameArraypost
      };

      // Assuming 'portefeuille' is your model for updating data in your database
      await portefeuille.update(updatedData, {
        where: { id: selectedportfeuille },
      });
      // Répondez avec un message de succès ou autre réponse appropriée
      res.status(200).json({ message: 'Données insérées avec succès' });
    } catch (error) {
      // Gérez les erreurs ici
      console.error('Erreur lors de l\'insertion en base de données :', error);
      res.status(500).json({ message: 'Erreur lors de l\'insertion en base de données' });
    }
  });




  app.post('/api/reconstitution', async (req, res) => {
    try {
      // const { entries } = req.body;

      const valorisations = [];
      let montantInvestissement = 0;
      for (const entry of req.body) {
        const { date, montantInvesti, fondId, portefeuilleselect } = entry;
        montantInvestissement += montantInvesti
        // Rechercher la valeur du fond pour la date spécifiée
        let vls = await vl.findAll({
          where: {
            fund_id: fondId, date: {
              [Op.gte]: date // Remplacez 'votreDate' par la date que vous souhaitez comparer.
            }
          }
        });
        const quantite = montantInvesti / vls[0].value;

        for (const dateRow of vls) {

          const valorisation = quantite * dateRow.value;
          valorisations.push({ date: dateRow.date, value: valorisation, fund_id: fondId, portefeuille_id: portefeuilleselect });

        }
        // Insérer les nouvelles valorisations dans la table vl_portefeuille
        await portefeuille_vl.bulkCreate(valorisations);
      }

      const updatedData = {
        montant_invest: montantInvestissement
      };

      // Assuming 'portefeuille' is your model for updating data in your database
      await portefeuille.update(updatedData, {
        where: { id: portefeuille },
      });

      return res.json({ code: 200, data: "succes" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erreur lors du calcul de la valorisation" });
    }
  });


  async function fetchFundsByValorisationfirst(selectedValues, selectedcategorie, selectedsociete, selectedDevise, frequence, selectedcategorieregionale, selectedcategorienationale) {
    try {
      let query;
      if (selectedValues.length >= 1 && selectedValues[0] != '') {

        query = `
      SELECT f.*
      FROM fond_investissements AS f
      WHERE  f.id in (${selectedValues.map(cat => cat).join(',')}) and  f.id IN (SELECT v.fund_id FROM valorisations AS v )
    `;
      } else {

        query = `
        SELECT f.*
        FROM fond_investissements AS f
        WHERE   f.id IN (SELECT v.fund_id FROM valorisations AS v )
 `;
      }

      if (selectedcategorie != 'undefined') {
        query += `
   
        AND f.categorie_globale = :selectedcategorie
    
  `;
      }

      if (selectedDevise != 'undefined') {
        query += `
   
        AND f.dev_libelle = :selectedDevise
    
  `;
      }

      if (frequence != 'undefined' && frequence.length >= 1) {
        query += `
   
        AND f.periodicite = :frequence
    
  `;
      }

      if (selectedsociete != 'undefined') {
        query += `
   
        AND f.societe_gestion = :selectedsociete
    
  `;
      }

      if (selectedcategorienationale != 'undefined') {
        query += `
   
        AND f.categorie_national = :selectedcategorienationale
    
  `;
      }
      if (selectedcategorieregionale != 'undefined') {
        query += `
   
        AND f.categorie_regional = :selectedcategorieregionale
    
  `;
      }

      const fondsDansCategorie = await sequelize.query(query, {
        replacements: { selectedsociete, selectedcategorie, selectedDevise, frequence, selectedcategorieregionale, selectedcategorienationale },

        type: sequelize.QueryTypes.SELECT,
      });

      // Retournez la liste des fonds
      return fondsDansCategorie;
    } catch (erreur) {
      console.error('Erreur lors de la récupération des fonds par catégorie :', erreur);
      throw erreur; // Propagez l'erreur pour qu'elle soit gérée ailleurs si nécessaire
    }
  }





  app.post('/api/rechercheravance-fonds', async (req, res) => {
    const formData = req.body.formData;
    const selectedValues = req.query.query;
    const selectedcategorieregionale = req.query.selectedcategorieregionale;
    const selectedcategorienationale = req.query.selectedcategorienationale;
    const selectedCategorie = req.query.selectedcategorie; // Corrected variable name
    const selectedDevise = req.query.selecteddevise; // Corrected variable name
    const selectedSociete = req.query.selectedsociete; // Corrected variable name
    const frequence = req.query.frequence; // Corrected variable name

    console.log(frequence.length);
    const valuesArray = selectedValues.split(',');

    // Fetch funds based on criteria
    const funds = await fetchFundsByValorisationfirst(valuesArray, selectedCategorie, selectedSociete, selectedDevise, frequence, selectedcategorieregionale, selectedcategorienationale);

    if (!funds.length) {
      res.status(404).json({ error: 'No funds found.' });
      return;
    }

    // Use batch processing to fetch fund data and performance data
    const fundIds = funds.map(fund => fund.id);

    try {
      // Fetch all fund data in one batch
      const fundDataResults = await fond.findAll({
        where: { id: fundIds }
      });

      // Fetch all performance data in one batch
      const performanceResults = await performences.findAll({
        where: {
          fond_id: fundIds
        },
        order: [['date', 'DESC']]
      });

      // Create a map for performance data for quick lookup
      const performanceMap = performanceResults.reduce((acc, performance) => {
        if (!acc[performance.fond_id]) {
          acc[performance.fond_id] = performance;
        }
        return acc;
      }, {});

      // Combine data
      const fundsWithAllData = fundDataResults.map(fundData => {
        const performanceData = performanceMap[fundData.id] || null;
        return {
          id: fundData.id,
          fundData: fundData.toJSON(),
          performanceData: performanceData ? performanceData.toJSON() : null
        };
      });

      let resultats = fundsWithAllData;
      if (Object.keys(formData).length > 0) {
        // Filtrez les fonds en fonction des critères
        resultats = fundsWithAllData.filter((fonds) => {
          let correspondances = 0;

          // Parcourez les critères du formulaire (formData) et comparez-les aux caractéristiques des fonds
          for (const typeCritere in formData) {
            const critere = formData[typeCritere];

            // Parcourez les critères spécifiques (perf_annu, sharpe, volatilite)
            const operation = critere["operation"];
            const value = critere["value"]

            // Construisez la clé de la propriété correspondante dans le fonds
            // Évaluez la condition par annee
            if (typeof critere["periode"] !== 'undefined') {
              periode = critere["periode"]
              if (periode === "1a") {

                if (typeCritere === "Ratioinf" && fonds.performanceData) {
                  const Ratioinf = fonds.performanceData.info1an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Ratioinf !== '-' && Ratioinf !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Ratioinf} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Ratioinf} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Var95" && fonds.performanceData) {
                  const Var95 = fonds.performanceData.var951an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Var95 !== '-' && Var95 !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Var95} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Var95} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Var99" && fonds.performanceData) {
                  const Var99 = fonds.performanceData.var991an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Var99 !== '-' && Var99 !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Var99} < ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Var99} > ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Calamar" && fonds.performanceData) {
                  const Calamar = fonds.performanceData.calamar1an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Calamar !== '-' && Calamar !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Calamar} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Calamar} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "PerfAnnu" && fonds.performanceData) {
                  const PerfAnnu = fonds.performanceData.perfannu1an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (PerfAnnu !== '-' && PerfAnnu !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${PerfAnnu} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${PerfAnnu} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Sharpe" && fonds.performanceData) {
                  const Sharpe = fonds.performanceData.ratiosharpe1an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Sharpe !== '-' && Sharpe !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Sharpe} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Sharpe} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Pertemax" && fonds.performanceData) {
                  const Pertemax = fonds.performanceData.pertemax1an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Pertemax !== '-' && Pertemax !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Pertemax} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Pertemax} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Volatilite" && fonds.performanceData) {
                  const Volatilite = fonds.performanceData.volatility1an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Volatilite !== '-' && Volatilite !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Volatilite} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Volatilite} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Trakingerror" && fonds.performanceData) {
                  const Trakingerror = fonds.performanceData.trackingerror1an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Trakingerror !== '-' && Trakingerror !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Trakingerror} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Trakingerror} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Sortino" && fonds.performanceData) {
                  const Sortino = fonds.performanceData.sortino1an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Sortino !== '-' && Sortino !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Sortino} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Sortino} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Omega" && fonds.performanceData) {
                  const Omega = fonds.performanceData.omega1an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Omega !== '-' && Omega !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Omega} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Omega} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Dsr" && fonds.performanceData) {
                  const Dsr = fonds.performanceData.dsr1an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Dsr !== '-' && Dsr !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Dsr} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Dsr} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Betahaussier" && fonds.performanceData) {
                  const Betahaussier = fonds.performanceData.betahaussier1an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Betahaussier !== '-' && Betahaussier !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Betahaussier} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Betahaussier} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Betabaissier" && fonds.performanceData) {
                  const Betabaissier = fonds.performanceData.betabaissier1an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Betabaissier !== '-' && Betabaissier !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Betabaissier} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Betabaissier} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Downcapture" && fonds.performanceData) {
                  const Downcapture = fonds.performanceData.downcapture1an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Downcapture !== '-' && Downcapture !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Downcapture} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Downcapture} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Upcapture" && fonds.performanceData) {
                  const Upcapture = fonds.performanceData.upcapture1an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Upcapture !== '-' && Upcapture !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Upcapture} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Upcapture} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Skewness" && fonds.performanceData) {
                  const Skewness = fonds.performanceData.skewness1an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Skewness !== '-' && Skewness !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Skewness} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Skewness} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Kurtosis" && fonds.performanceData) {
                  const Kurtosis = fonds.performanceData.kurtosis1an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Kurtosis !== '-' && Kurtosis !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Kurtosis} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Kurtosis} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Beta" && fonds.performanceData) {
                  const Beta = fonds.performanceData.beta1an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Beta !== '-' && Beta !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Beta} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Beta} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
              } else if (periode === "3a") {
                if (typeCritere === "Ratioinf" && fonds.performanceData) {
                  const Ratioinf = fonds.performanceData.info3an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Ratioinf !== '-' && Ratioinf !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Ratioinf} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Ratioinf} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Var95" && fonds.performanceData) {
                  const Var95 = fonds.performanceData.var953an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Var95 !== '-' && Var95 !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Var95} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Var95} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Var99" && fonds.performanceData) {
                  const Var99 = fonds.performanceData.var993an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Var99 !== '-' && Var99 !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Var99} < ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Var99} > ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Calamar" && fonds.performanceData) {
                  const Calamar = fonds.performanceData.calamar3an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Calamar !== '-' && Calamar !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Calamar} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Calamar} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "PerfAnnu" && fonds.performanceData) {
                  const PerfAnnu = fonds.performanceData.perfannu3an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (PerfAnnu !== '-' && PerfAnnu !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${PerfAnnu} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${PerfAnnu} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Sharpe" && fonds.performanceData) {
                  const Sharpe = fonds.performanceData.ratiosharpe3an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Sharpe !== '-' && Sharpe !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Sharpe} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Sharpe} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Pertemax" && fonds.performanceData) {
                  const Pertemax = fonds.performanceData.pertemax3an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Pertemax !== '-' && Pertemax !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Pertemax} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Pertemax} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Volatilite" && fonds.performanceData) {
                  const Volatilite = fonds.performanceData.volatility3an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Volatilite !== '-' && Volatilite !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Volatilite} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Volatilite} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Trakingerror" && fonds.performanceData) {
                  const Trakingerror = fonds.performanceData.trackingerror3an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Trakingerror !== '-' && Trakingerror !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Trakingerror} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Trakingerror} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Sortino" && fonds.performanceData) {
                  const Sortino = fonds.performanceData.sortino3an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Sortino !== '-' && Sortino !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Sortino} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Sortino} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Omega" && fonds.performanceData) {
                  const Omega = fonds.performanceData.omega3an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Omega !== '-' && Omega !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Omega} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Omega} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Dsr" && fonds.performanceData) {
                  const Dsr = fonds.performanceData.dsr3an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Dsr !== '-' && Dsr !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Dsr} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Dsr} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Betahaussier" && fonds.performanceData) {
                  const Betahaussier = fonds.performanceData.betahaussier3an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Betahaussier !== '-' && Betahaussier !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Betahaussier} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Betahaussier} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Betabaissier" && fonds.performanceData) {
                  const Betabaissier = fonds.performanceData.betabaissier3an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Betabaissier !== '-' && Betabaissier !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Betabaissier} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Betabaissier} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Downcapture" && fonds.performanceData) {
                  const Downcapture = fonds.performanceData.downcapture3an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Downcapture !== '-' && Downcapture !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Downcapture} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Downcapture} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Upcapture" && fonds.performanceData) {
                  const Upcapture = fonds.performanceData.upcapture3an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Upcapture !== '-' && Upcapture !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Upcapture} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Upcapture} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Skewness" && fonds.performanceData) {
                  const Skewness = fonds.performanceData.skewness3an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Skewness !== '-' && Skewness !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Skewness} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Skewness} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Kurtosis" && fonds.performanceData) {
                  const Kurtosis = fonds.performanceData.kurtosis3an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Kurtosis !== '-' && Kurtosis !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Kurtosis} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Kurtosis} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Beta" && fonds.performanceData) {
                  const Beta = fonds.performanceData.beta3an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Beta !== '-' && Beta !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Beta} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Beta} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
              } else if (periode === "5a") {
                if (typeCritere === "Ratioinf" && fonds.performanceData) {
                  const Ratioinf = fonds.performanceData.info5an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Ratioinf !== '-' && Ratioinf !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Ratioinf} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Ratioinf} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Var95" && fonds.performanceData) {
                  const Var95 = fonds.performanceData.var955an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Var95 !== '-' && Var95 !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Var95} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Var95} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Var99" && fonds.performanceData) {
                  const Var99 = fonds.performanceData.var995an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Var99 !== '-' && Var99 !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Var99} < ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Var99} > ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Calamar" && fonds.performanceData) {
                  const Calamar = fonds.performanceData.calamar5an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Calamar !== '-' && Calamar !== null) {
                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Calamar} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Calamar} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "PerfAnnu" && fonds.performanceData) {
                  const PerfAnnu = fonds.performanceData.perfannu5an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (PerfAnnu !== '-' && PerfAnnu !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${PerfAnnu} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${PerfAnnu} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Sharpe" && fonds.performanceData) {
                  const Sharpe = fonds.performanceData.ratiosharpe5an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Sharpe !== '-' && Sharpe !== null) {
                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Sharpe} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Sharpe} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Pertemax" && fonds.performanceData) {
                  const Pertemax = fonds.performanceData.pertemax5an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Pertemax !== '-' && Pertemax !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Pertemax} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Pertemax} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Volatilite" && fonds.performanceData) {
                  const Volatilite = fonds.performanceData.volatility5an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Volatilite !== '-' && Volatilite !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Volatilite} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Volatilite} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Trakingerror" && fonds.performanceData) {
                  const Trakingerror = fonds.performanceData.trackingerror5an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Trakingerror !== '-' && Trakingerror !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Trakingerror} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Trakingerror} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Sortino" && fonds.performanceData) {
                  const Sortino = fonds.performanceData.sortino5an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Sortino !== '-' && Sortino !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Sortino} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Sortino} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Omega" && fonds.performanceData) {
                  const Omega = fonds.performanceData.omega5an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Omega !== '-' && Omega !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Omega} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Omega} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Dsr" && fonds.performanceData) {
                  const Dsr = fonds.performanceData.dsr5an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Dsr !== '-' && Dsr !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Dsr} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Dsr} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Betahaussier" && fonds.performanceData) {
                  const Betahaussier = fonds.performanceData.betahaussier5an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Betahaussier !== '-' && Betahaussier !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Betahaussier} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Betahaussier} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Betabaissier" && fonds.performanceData) {
                  const Betabaissier = fonds.performanceData.betabaissier5an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Betabaissier !== '-' && Betabaissier !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Betabaissier} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Betabaissier} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Downcapture" && fonds.performanceData) {
                  const Downcapture = fonds.performanceData.downcapture5an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Downcapture !== '-' && Downcapture !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Downcapture} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Downcapture} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Upcapture" && fonds.performanceData) {
                  const Upcapture = fonds.performanceData.upcapture5an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Upcapture !== '-' && Upcapture !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Upcapture} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Upcapture} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Skewness" && fonds.performanceData) {
                  const Skewness = fonds.performanceData.skewness5an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Skewness !== '-' && Skewness !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Skewness} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Skewness} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Kurtosis" && fonds.performanceData) {
                  const Kurtosis = fonds.performanceData.kurtosis5an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Kurtosis !== '-' && Kurtosis !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Kurtosis} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Kurtosis} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
                if (typeCritere === "Beta" && fonds.performanceData) {
                  const Beta = fonds.performanceData.beta5an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (Beta !== '-' && Beta !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${Beta} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${Beta} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
              } else if (periode === "perfVeille") {
                if (typeCritere === "PerfCummul" && fonds.performanceData && fonds.firstData.data) {
                  const PerfCummul = fonds.performanceData.perfveille;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (PerfCummul !== '-' && PerfCummul !== null) {
                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${PerfCummul} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${PerfCummul} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }

              } else if (periode === "perf4Semaines") {
                if (typeCritere === "PerfCummul" && fonds.performanceData) {
                  const PerfCummul = fonds.performanceData.perf4s;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (PerfCummul !== '-' && PerfCummul !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${PerfCummul} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${PerfCummul} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }

              } else if (periode === "perf1erJanvier") {
                if (typeCritere === "PerfCummul" && fonds.performanceData) {
                  const PerfCummul = fonds.performanceData.ytd;
                  // Ajoutez d'autres propriétés si nécessaire

                  // Comparez les valeurs avec les critères
                  if (PerfCummul !== '-' && PerfCummul !== null) {
                    if (operation === "<=" && eval(`${PerfCummul} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${PerfCummul} >= ${value}`)) {
                      correspondances++;
                    }


                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
              } else if (periode === "perf3Mois") {
                if (typeCritere === "PerfCummul" && fonds.performanceData) {
                  const PerfCummul = fonds.performanceData.perf3m;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (PerfCummul !== '-' && PerfCummul !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${PerfCummul} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${PerfCummul} >= ${value}`)) {
                      correspondances++;
                    }
                    // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                  }
                }
              } else if (periode === "perf6Mois") {
                if (typeCritere === "PerfCummul" && fonds.performanceData) {
                  const PerfCummul = fonds.performanceData.perf6m;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (PerfCummul !== '-' && PerfCummul !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${PerfCummul} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${PerfCummul} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }

              } else if (periode === "perf1An") {
                if (typeCritere === "PerfCummul" && fonds.performanceData) {
                  const PerfCummul = fonds.performanceData.perf1an;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (PerfCummul !== '-' && PerfCummul !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${PerfCummul} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${PerfCummul} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }
              } else if (periode === "perf3Ans") {
                if (typeCritere === "PerfCummul" && fonds.performanceData) {
                  const PerfCummul = fonds.performanceData.perf3ans;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (PerfCummul !== '-' && PerfCummul !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${PerfCummul} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${PerfCummul} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }

              } else if (periode === "perf5Ans") {
                if (typeCritere === "PerfCummul" && fonds.performanceData) {
                  const PerfCummul = fonds.performanceData.perf5ans;
                  // Ajoutez d'autres propriétés si nécessaire
                  if (PerfCummul !== '-' && PerfCummul !== null) {

                    // Comparez les valeurs avec les critères
                    if (operation === "<=" && eval(`${PerfCummul} <= ${value}`)) {
                      correspondances++;
                    } else if (operation === ">=" && eval(`${PerfCummul} >= ${value}`)) {
                      correspondances++;
                    }
                  }
                  // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
                }

              }
            } else if (typeof critere["periode"] === 'undefined' && typeof critere["operation"] !== 'undefined') {
              if (typeCritere === "Fraissous" && fonds.fundData) {
                const Fraissous = fonds.fundData.frais_souscription;
                // Ajoutez d'autres propriétés si nécessaire

                // Comparez les valeurs avec les critères
                if (operation === "<=" && eval(`${Fraissous} <= ${value}`)) {
                  correspondances++;
                } else if (operation === ">=" && eval(`${Fraissous} >= ${value}`)) {
                  correspondances++;
                }
                // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
              } else if (typeCritere === "Fraisgestion" && fonds.fundData) {
                const Fraisgestion = fonds.fundData.frais_gestion;
                // Ajoutez d'autres propriétés si nécessaire

                // Comparez les valeurs avec les critères
                if (operation === "<=" && eval(`${Fraisgestion} <= ${value}`)) {
                  correspondances++;
                } else if (operation === ">=" && eval(`${Fraisgestion} >= ${value}`)) {
                  correspondances++;
                }
                // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
              } else if (typeCritere === "Fraisrachat" && fonds.fundData) {
                const Fraisrachat = fonds.fundData.frais_rachat;
                // Ajoutez d'autres propriétés si nécessaire

                // Comparez les valeurs avec les critères
                if (operation === "<=" && eval(`${Fraisrachat} <= ${value}`)) {
                  correspondances++;
                } else if (operation === ">=" && eval(`${Fraisrachat} >= ${value}`)) {
                  correspondances++;
                }
                // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
              } else if (typeCritere === "Fraiscourant" && fonds.fundData) {
                const Fraiscourant = fonds.fundData.frais_courant;
                // Ajoutez d'autres propriétés si nécessaire

                // Comparez les valeurs avec les critères
                if (operation === "<=" && eval(`${Fraiscourant} <= ${value}`)) {
                  correspondances++;
                } else if (operation === ">=" && eval(`${Fraiscourant} >= ${value}`)) {
                  correspondances++;
                }
                // Ajoutez d'autres conditions pour les autres propriétés si nécessaire

              } else if (typeCritere === "Mininvest" && fonds.fundData) {
                const Mininvest = fonds.fundData.mininvestinitial;
                // Ajoutez d'autres propriétés si nécessaire

                // Comparez les valeurs avec les critères
                if (operation === "<=" && eval(`${Mininvest} <= ${value}`)) {
                  correspondances++;
                } else if (operation === ">=" && eval(`${Mininvest} >= ${value}`)) {
                  correspondances++;
                }
                // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
              } else if (typeCritere === "Actifnet" && fonds.fundData) {
                const Actifnet = fonds.fundData.actifnet;
                // Ajoutez d'autres propriétés si nécessaire

                // Comparez les valeurs avec les critères
                if (operation === "<=" && eval(`${Actifnet} <= ${value}`)) {
                  correspondances++;
                } else if (operation === ">=" && eval(`${Actifnet} >= ${value}`)) {
                  correspondances++;
                }
                // Ajoutez d'autres conditions pour les autres propriétés si nécessaire
              }

            } else {
              if (typeCritere === "Typeinvest" && fonds.fundData) {
                const Typeinvest = fonds.fundData.type_investissement;
                // Ajoutez d'autres propriétés si nécessaire

                // Comparez les valeurs avec les critères
                if (eval(`${Typeinvest} == ${value}`)) {
                  correspondances++;
                }
              }

            }

          }

          // Si le nombre de correspondances est égal au nombre total de critères, le fonds est inclus dans les résultats
          return correspondances === Object.keys(formData).length;
        });
      }


      // Envoyez les résultats en tant que réponse JSON
      res.json({
        code: 200,
        data: { funds: resultats }
      });
    } catch (error) {
      console.error('Erreur lors de la recherche des données :', error);
      res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des données.' });
    }
  });







  app.get('/api/getDevises', async (req, res) => {
    devises.findAll({
      //where:{id:1}
    })
      .then(response => {

        const devises = response.map((data) => ({
          id: data.id,
          devise: data.Symbole,


        }));
        res.json({
          code: 200,
          data: {
            devises
          }
        })
      })
  })
  app.post('/api/assignportefeuille', async (req, res) => {
    const { portfolioId, indices, categories, tsr, tacc } = req.body;

    // Appeler l'endpoint pour récupérer les performances
    const performanceResponse = await fetch(`${urll}/api/valLiqportefeuillewithindice/${portfolioId}/${indices}/${tsr}/${categories}`);
    if (performanceResponse.status !== 200) {
      return res.status(performanceResponse.status).json({ message: 'Error fetching performance data' });
    }
    const performanceData = await performanceResponse.json();

    // Répondre avec succès et les données du GET endpoint
    res.json({
      code: 200,
      data: {
        performanceData
      }
    });
  });

  app.get('/api/getIndice', async (req, res) => {
    try {
      const indices = await indice.findAll({
        attributes: [
          [sequelize.fn('DISTINCT', sequelize.col('id_indice')), 'nom_indice']
        ]
      });



      res.json({
        code: 200,
        data: {
          indices: indices.map(index => ({ id: index.id, name: index.nom_indice })),
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching data' });
    }
  });

  app.get('/api/getCategories', async (req, res) => {
    try {
      const categoriesRegion = await fond.findAll({
        attributes: [
          [sequelize.fn('DISTINCT', sequelize.col('categorie_regional')), 'categorie_regional']
        ]
      });

      const categoriesNational = await fond.findAll({
        attributes: [
          [sequelize.fn('DISTINCT', sequelize.col('categorie_national')), 'categorie_national']
        ]
      });

      // Filtrer les valeurs vides
      const filteredCategoriesRegion = categoriesRegion
        .map(item => item.get('categorie_regional'))
        .filter(categorie => categorie !== null && categorie !== '');

      const filteredCategoriesNational = categoriesNational
        .map(item => item.get('categorie_national'))
        .filter(categorie => categorie !== null && categorie !== '');

      const distinctCategorieregional = filteredCategoriesRegion.map(category => category);
      const distinctNationalCategories = filteredCategoriesNational.map(category => category);

      res.json({
        code: 200,
        data: {
          categoriesRegional: distinctCategorieregional,
          categoriesNational: distinctNationalCategories
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching data' });
    }
  });

  app.get('/api/valLiqportefeuillewithindice/:id/:indice/:tsr/:categorie', async (req, res) => {

    const portefeuilleId = parseInt(req.params.id)
    const response = await portefeuille_vl_cumul.findAll({
      where: {
        portefeuille_id: portefeuilleId
      },
      order: [
        ['date', 'ASC']
      ]
    });
    const response1 = await indice.findAll({
      where: {
        id_indice: req.params.indice
      },
      order: [
        ['date', 'ASC']
      ]
    });


    if (response.length > 0) {
      // Convertir les dates en format YYYY-MM-DD
      const dates = response.map(data => moment(data.date).format('YYYY-MM-DD'));
      const values = response.map(data => parseFloat(data.base_100_bis));

      const datesInd = response1.map(data => moment(data.date).format('YYYY-MM-DD'));
      const valuesInd = response1.map(data => data.valeur);

      // Trouver les dates communes entre les deux ensembles de données
      const commonDates = dates.filter(date => datesInd.includes(date));

      // Récupérer les valeurs pour les dates communes
      const commonValues = commonDates.map(date => ({
        date,
        value: values[dates.indexOf(date)],
        indValueRef: valuesInd[datesInd.indexOf(date)]
      }));



      const lastDate = dates[dates.length - 1];

      const lastdatepreviousmonth = findLastDateOfPreviousMonth(dates);
      const baseUrl = urll; // Remplacez par votre URL de base
      const lastValResponse = await fetch(`${baseUrl}/api/performancesportefeuillewithindice/fond/${portefeuilleId}/${req.params.categorie}/${lastDate}`);

      const lastValData = await lastValResponse.json();

      const last1ansRatiosResponse = await fetch(`${baseUrl}/api/ratiosportfeuillewithindice/1/${portefeuilleId}/${parseFloat(req.params.tsr)}/${req.params.indice}`);

      if (!last1ansRatiosResponse.ok) {
        return res.status(404).json({ message: 'Fonds introuvable' });
      }

      const last1ansRatiosData = await last1ansRatiosResponse.json();

      const lastRatiosResponse = await fetch(`${baseUrl}/api/ratiosportfeuillewithindice/3/${portefeuilleId}/${parseFloat(req.params.tsr)}/${req.params.indice}`);

      if (!lastRatiosResponse.ok) {
        return res.status(404).json({ message: 'Fonds introuvable' });
      }

      const lastRatiosData = await lastRatiosResponse.json();

      const last5ansRatiosResponse = await fetch(`${baseUrl}/api/ratiosportfeuillewithindice/5/${portefeuilleId}/${parseFloat(req.params.tsr)}/${req.params.indice}`);

      if (!last5ansRatiosResponse.ok) {
        return res.status(404).json({ message: 'Fonds introuvable' });
      }

      const last5ansRatiosData = await last5ansRatiosResponse.json();



      res.json({
        code: 200,
        data: {
          lastDate,
          graphs: commonValues,
          lastdatepreviousmonth,
          performances: lastValData,
          ratios3a: lastRatiosData,
          ratios1a: last1ansRatiosData,
          ratios5a: last5ansRatiosData
        }
      });
    } else {
      res.status(500).json({ message: 'Erreur lors de la récupération des données' });

    }
    /* } catch (error) {
       console.error('Erreur lors de la récupération des données:', error);
       res.status(500).json({ message: 'Erreur lors de la récupération des données' });
     }*/
  });

  app.get('/api/performancesportefeuillewithindice/fond/:id/:categorie/:date', async (req, res) => {

    performancesCategorie = await getPerformancesByCategorynow(req.params.categorie, "2024-03-22");


    portefeuille_vl_cumul.findAll({
      where: {
        portefeuille_id: req.params.id
      },
      order: [
        ['date', 'ASC']
      ]
    })
      .then(response => {
        let lastValuep = response[response.length - 1].base_100_bis; // Dernière valeur


        // Valeurs liquidatives
        const values = response.map((data) => data.base_100_bis);
        const dates = response.map((data) => moment(data.date).format('YYYY-MM-DD'));

        //  const values = response.map((data) => data.value);
        const lastValue = lastValuep;
        //  const dates = response.map((data) => moment(data.date).format('YYYY-MM-DD'));
        const lastDate = dates[dates.length - 1]

        const targetYear = groupDatesByYear(dates).length

        const lastdatepreviousmonth = findLastDateOfPreviousMonth(dates);

        // Calcul des performances glissantes
        const previousValue = values[values.length - 2];
        const perfVeille = calculatePerformance(lastValue, previousValue);
        const perf4Semaines = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateWeek(dates))]);
        const perf1erJanvier = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateJanuary(dates))]);
        const perf3Mois = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateMonthlized(dates, 3, lastDate))]);
        const perf6Mois = calculatePerformance(lastValue, values[dates.indexOf(findNearestDateMonthlized(dates, 6, lastDate))]);
        const perf1An = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 1))]);
        const perf3Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 3))]);
        const perf5Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 5))]);
        const perf8Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 8))]);
        const perf10Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 10))]);
        const perf12Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 12))]);
        const perf15Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 15))]);
        const perf20Ans = calculatePerformance(lastValue, values[dates.indexOf(findNearestDate(dates, 20))]);
        const perfOrigine = calculatePerformance(lastValue, values[0]);

        //Performances fin de mois
        const targetDate1An = findNearestDateAnnualized(dates, 1, findLastDateOfPreviousMonth(dates))
        const targetDate3Ans = findNearestDateAnnualized(dates, 3, findLastDateOfPreviousMonth(dates))
        const targetDate5Ans = findNearestDateAnnualized(dates, 5, findLastDateOfPreviousMonth(dates))
        const targetDate8Ans = findNearestDateAnnualized(dates, 8, findLastDateOfPreviousMonth(dates))
        const targetDate10Ans = findNearestDateAnnualized(dates, 10, findLastDateOfPreviousMonth(dates))
        const targetDate12Ans = findNearestDateAnnualized(dates, 12, findLastDateOfPreviousMonth(dates))
        const targetDate15Ans = findNearestDateAnnualized(dates, 15, findLastDateOfPreviousMonth(dates))
        const targetDate20Ans = findNearestDateAnnualized(dates, 20, findLastDateOfPreviousMonth(dates))
        const targetDateOrigine = groupDatesByMonth(dates)[0]
        const perfFindeMois1An = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate1An)])
        const perfFindeMois3Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate3Ans)])
        const perfFindeMois5Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate5Ans)])
        const perfFindeMois8Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate8Ans)])
        const perfFindeMois10Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate10Ans)])
        const perfFindeMois12Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate12Ans)])
        const perfFindeMois15Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate15Ans)])
        const perfFindeMois20Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate20Ans)])
        const perfFindeMoisOrigine = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDateOrigine[targetDateOrigine.length - 1])])

        console.log(findLastDateOfPreviousMonth(dates))
        //Performances annualizées fin de mois
        const perfFindeMoisAnnualized1An = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 1, findLastDateOfPreviousMonth(dates)))], 1);
        const perfFindeMoisAnnualized3Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 3, findLastDateOfPreviousMonth(dates)))], 3);
        const perfFindeMoisAnnualized5Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 5, findLastDateOfPreviousMonth(dates)))], 5);
        const perfFindeMoisAnnualized8Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 8, findLastDateOfPreviousMonth(dates)))], 8);
        const perfFindeMoisAnnualized10Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 10, findLastDateOfPreviousMonth(dates)))], 10);
        const perfFindeMoisAnnualized12Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 12, findLastDateOfPreviousMonth(dates)))], 12);
        const perfFindeMoisAnnualized15Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 15, findLastDateOfPreviousMonth(dates)))], 15);
        const perfFindeMoisAnnualized20Ans = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDateAnnualized(dates, 20, findLastDateOfPreviousMonth(dates)))], 20);
        const perfFindeMoisAnnualizedOrigine = calculateAnnualizedPerformanceper100(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(findNearestDate(dates, targetYear))], targetYear);


        //Performances cumulées fin de mois
        const perfCumuleeFindeMois1An = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate1An)])
        const perfCumuleeFindeMois3Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate3Ans)])
        const perfCumuleeFindeMois5Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate5Ans)])
        const perfCumuleeFindeMois8Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate8Ans)])
        const perfCumuleeFindeMois10Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate10Ans)])
        const perfCumuleeFindeMois12Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate12Ans)])
        const perfCumuleeFindeMois15Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate15Ans)])
        const perfCumuleeFindeMois20Ans = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDate20Ans)])
        const perfCumuleeFindeMoisOrigine = calculatePerformance(values[dates.indexOf(findLastDateOfPreviousMonth(dates))], values[dates.indexOf(targetDateOrigine[targetDateOrigine.length - 1])])

        //Performances annualizées à date
        const perfAnnualizedtodate1An = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 1))], 1);
        const perfAnnualizedtodate3Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 3))], 3);
        const perfAnnualizedtodate5Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 5))], 5);
        const perfAnnualizedtodate8Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 8))], 8);
        const perfAnnualizedtodate10Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 10))], 10);
        const perfAnnualizedtodate12Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 12))], 12);
        const perfAnnualizedtodate15Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 15))], 15);
        const perfAnnualizedtodate20Ans = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, 20))], 20);
        const perfAnnualizedtodateOrigine = calculateAnnualizedPerformanceper100(lastValue, values[dates.indexOf(findNearestDate(dates, targetYear))], targetYear);
        //Performances  annee calendaire
        const ArrayDates = groupDatesByYear(dates);
        const adaptValues = adaptValuesToGroupedYears(values, ArrayDates);
        const adaptValues1 = AdaptTableauwithdate(adaptValues, ArrayDates);
        const multipliedValues = adaptValues1.map(item => {
          const year = item[0];
          const value1 = item[1];
          const value3 = item[2] * 100; // Multipliez la troisième position par 100

          return [year, value1, value3];
        });


        console.log(multipliedValues);
        res.json({
          code: 200,
          data: {
            portefeuille: req.params.id,
            lastdatepreviousmonth: lastdatepreviousmonth,
            //    perf3Moisactif_net: perf3Moisactif_net,
            perfVeille: perfVeille,
            perf4Semaines: perf4Semaines,
            perf1erJanvier: perf1erJanvier,
            perf3Mois: perf3Mois,
            perf6Mois: perf6Mois,
            perf1An: perf1An,
            perf3Ans: perf3Ans,
            perf5Ans: perf5Ans,
            perf8Ans: perf8Ans,
            perf10Ans: perf10Ans,
            perf12Ans: perf12Ans,
            perf15Ans: perf15Ans,
            perf20Ans: perf20Ans,
            perfOrigine: perfOrigine,
            perfFindeMois1An: perfFindeMois1An,
            perfFindeMois3Ans: perfFindeMois3Ans,
            perfFindeMois5Ans: perfFindeMois5Ans,
            perfFindeMois8Ans: perfFindeMois8Ans,
            perfFindeMois10Ans: perfFindeMois10Ans,
            perfFindeMois12Ans: perfFindeMois12Ans,
            perfFindeMois15Ans: perfFindeMois15Ans,
            perfFindeMois20Ans: perfFindeMois20Ans,
            perfFindeMoisOrigine: perfFindeMoisOrigine,
            perfFindeMoisAnnualized1An: perfFindeMoisAnnualized1An,
            perfFindeMoisAnnualized3An: perfFindeMoisAnnualized3Ans,
            perfFindeMoisAnnualized5Ans: perfFindeMoisAnnualized5Ans,
            perfFindeMoisAnnualized8Ans: perfFindeMoisAnnualized8Ans,
            perfFindeMoisAnnualized10Ans: perfFindeMoisAnnualized10Ans,
            perfFindeMoisAnnualized12Ans: perfFindeMoisAnnualized12Ans,
            perfFindeMoisAnnualized15Ans: perfFindeMoisAnnualized15Ans,
            perfFindeMoisAnnualized20Ans: perfFindeMoisAnnualized20Ans,
            perfFindeMoisAnnualizedOrigine: perfFindeMoisAnnualizedOrigine,
            perfCumuleeFindeMois1An: perfCumuleeFindeMois1An,
            perfCumuleeFindeMois3Ans: perfCumuleeFindeMois3Ans,
            perfCumuleeFindeMois5Ans: perfCumuleeFindeMois5Ans,
            perfCumuleeFindeMois8Ans: perfCumuleeFindeMois8Ans,
            perfCumuleeFindeMois10Ans: perfCumuleeFindeMois10Ans,
            perfCumuleeFindeMois12Ans: perfCumuleeFindeMois12Ans,
            perfCumuleeFindeMois15Ans: perfCumuleeFindeMois15Ans,
            perfCumuleeFindeMois20Ans: perfCumuleeFindeMois20Ans,
            perfCumuleeFindeMoisOrigine: perfCumuleeFindeMoisOrigine,
            perfAnnualizedtodate1An: perfAnnualizedtodate1An,
            perfAnnualizedtodate3Ans: perfAnnualizedtodate3Ans,
            perfAnnualizedtodate5Ans: perfAnnualizedtodate5Ans,
            perfAnnualizedtodate8Ans: perfAnnualizedtodate8Ans,
            perfAnnualizedtodate10Ans: perfAnnualizedtodate10Ans,
            perfAnnualizedtodate12Ans: perfAnnualizedtodate12Ans,
            perfAnnualizedtodate15Ans: perfAnnualizedtodate15Ans,
            perfAnnualizedtodate20Ans: perfAnnualizedtodate20Ans,
            perfAnnualizedtodateOrigine: perfAnnualizedtodateOrigine,
            adaptValues1: multipliedValues,
            performancesCategorie: performancesCategorie
          }
        })

      })
  })

  app.get('/api/ratiosportfeuillewithindice/:year/:id/:tsr/:indice', async (req, res) => {
    try {


      const response = await portefeuille_vl_cumul.findAll({
        where: {
          portefeuille_id: req.params.id
        },
        order: [
          ['date', 'DESC']
        ]
      })
      const response1 = await indice.findAll({
        where: {
          id_indice: req.params.indice
        },
        order: [
          ['date', 'DESC']
        ]
      })

      ////////////////////////////

      // Convertir les dates en format YYYY-MM-DD
      const dates = response.map(data => moment(data.date).format('YYYY-MM-DD'));
      const values = response.map(data => parseFloat(data.base_100_bis));

      const datesInd = response1.map(data => moment(data.date).format('YYYY-MM-DD'));
      const valuesInd = response1.map(data => data.valeur);

      // Trouver les dates communes entre les deux ensembles de données
      const commonDates = dates.filter(date => datesInd.includes(date));

      // Récupérer les valeurs pour les dates communes
      const commonValues = commonDates.map(date => ({
        date,
        value: values[dates.indexOf(date)],
        indValueRef: valuesInd[datesInd.indexOf(date)]
      }));

      const datescomun = commonValues.map(commun => commun.date);
      const valuescomun = commonValues.map(commun => commun.value);
      const valuesindcomun = commonValues.map(commun => commun.indValueRef);

      // Exécuter les calculs en fonction de l'année
      const tauxsr = parseFloat(req.params.tsr);


      const lastPreviousDate = findLastDateOfPreviousMonth(datescomun);
      const lastValue = commonValues.find(cv => cv.date === lastPreviousDate)?.value;
      const lastValueInd = commonValues.find(cv => cv.date === lastPreviousDate)?.indValueRef;

      // Période de calcul (ajustée pour les dates communes)
      // Trouver l'index de lastPreviousDate dans commonDates
      const startIndex = commonDates.indexOf(lastPreviousDate);
      // Extraire les données depuis lastPreviousDate jusqu'à la fin des données
      const yArrayValuesnew = commonValues.slice(startIndex).map(cv => cv.value);
      const yArrayDatesnew = commonValues.slice(startIndex).map(cv => cv.date);
      const yArrayValuesindifrefnew = commonValues.slice(startIndex).map(cv => cv.indValueRef);

      const donneesarray = yArrayValuesnew.map((value, i) => ({ date: yArrayDatesnew[i], value }));
      const donneesarrayindref = yArrayValuesindifrefnew.map((value, i) => ({ date: yArrayDatesnew[i], value }));


      const numberOfUniqueYears = calculateYearsBetweenDates(datescomun);

      if (req.params.year === "1" && numberOfUniqueYears >= 1) {
        handleCalculations(req, res, donneesarray, donneesarrayindref, datescomun, values, valuesindcomun, lastPreviousDate, 1, 1, tauxsr);
      } else if (req.params.year === "3" && numberOfUniqueYears >= 3) {
        handleCalculations(req, res, donneesarray, donneesarrayindref, datescomun, values, valuesindcomun, lastPreviousDate, 3, 1, tauxsr);
      } else if (req.params.year === "5" && numberOfUniqueYears >= 5) {
        handleCalculations(req, res, donneesarray, donneesarrayindref, datescomun, values, valuesindcomun, lastPreviousDate, 5, 1, tauxsr);
      } else {
        res.status(200).json({ code: 200, message: "Invalid year parameter" });
      }
    } catch (error) {
      console.error('Erreur lors du traitement des ratios:', error);
      res.status(500).json({ code: 500, message: 'Erreur interne du serveur' });
    }
  });

  function calculateYearsBetweenDates(dates) {
    // Convertir les dates en objets Date
    const minDate = new Date(Math.min(...dates.map(date => new Date(date))));
    const maxDate = new Date(Math.max(...dates.map(date => new Date(date))));

    // Calculer la différence en millisecondes
    const diffInMs = maxDate - minDate;

    // Convertir la différence en années
    const diffInYears = diffInMs / (1000 * 60 * 60 * 24 * 365.25);

    return diffInYears;
  }

  app.post('/api/calculatePerformance', async (req, res) => {
    const { selectedIndex, selectedCategory } = req.body;

    // Implémentez ici votre logique pour calculer les performances
    const performances = await calculatePerformance(selectedIndex, selectedCategory);

    res.json({
      code: 200,
      data: performances
    });
  });

  app.get('/api/getSocietes', async (req, res) => {
    societe.findAll({
      //where:{id:1}
    })
      .then(response => {

        const societes = response.map((data) => ({
          id: data.id,
          name: data.nom,
          description: data.description,
          email: data.email,
          tel: data.tel,

        }));
        res.json({
          code: 200,
          data: {
            societes
          }
        })
      })
  })
  app.get('/api/getSocietesbypays/:pays', async (req, res) => {
    const pays = req.params.pays; // Use req.params to access route parameters

    societe.findAll({
      where: { pays: pays }
    })
      .then(response => {

        const societes = response.map((data) => ({
          id: data.id,
          name: data.nom,
          description: data.description,
          email: data.email,
          tel: data.tel,

        }));
        res.json({
          code: 200,
          data: {
            societes
          }
        })
      })
  })
  app.get('/api/getPays', (req, res) => {
    // Récupérez la liste des pays depuis la base de données
    pays_regulateurs
      .findAll({
        attributes: ['id', 'pays'], // Ajoutez les colonnes nécessaires
        group: ['pays'],
        order: [['pays', 'ASC']]
      })
      .then(response => {

        const paysOptions = response.map((data) => ({
          value: data.pays,
          label: data.pays,
        }));
        res.json({
          code: 200,
          data: {
            paysOptions
          }
        })
      })
  });

  app.get('/api/getPaysall', async (req, res) => {
    try {
      // Retrieve the list of countries from pays_regulateurs table
      const countries = await pays_regulateurs.findAll({
        attributes: [[sequelize.literal('DISTINCT pays'), 'pays']],
        order: [['pays', 'ASC']]
      });

      // Retrieve the count of companies per country from the societe table
      const companiesPerCountry = await sequelize.query(`
      SELECT pays, COUNT(*) AS companyCount 
      FROM societes
      GROUP BY pays
    `, { type: sequelize.QueryTypes.SELECT });

      // Combine the data to get the required format for countries and their respective company counts
      const countriesWithCompanies = countries.map(country => ({
        pays: country.pays,
        companyCount: companiesPerCountry.find(c => c.pays === country.pays)?.companyCount ?? 0
      }));

      // Prepare data for table display
      const tableData = countriesWithCompanies.map(({ pays, companyCount }) => ({ pays, companyCount }));

      res.json({
        code: 200,
        data: {
          countriesWithCompanies: tableData
        }
      });
    } catch (error) {
      // Handle errors
      console.error('Error:', error);
      res.status(500).json({
        code: 500,
        message: 'Internal Server Error'
      });
    }
  });




  app.get('/api/getRegulateur', (req, res) => {
    const selectedPays = req.query.pays;

    // Recherchez le régulateur correspondant dans la base de données en fonction du pays sélectionné
    pays_regulateurs
      .findOne({
        attributes: ['regulateur'],
        where: { pays: selectedPays },
      })
      .then((response) => {
        if (response) {
          const regulateur = {
            value: response.regulateur,
            label: response.regulateur,
          };

          res.json({
            code: 200,
            data: {
              regulateur
            }
          });
        } else {
          res.status(404).json({
            code: 404,
            error: 'Régulateur introuvable pour ce pays.',
          });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).json({
          code: 500,
          error: 'Une erreur s\'est produite lors de la récupération du régulateur.',
        });
      });
  });

  app.get('/api/getDevise', (req, res) => {
    const selectedPays = req.query.pays;

    // Recherchez le régulateur correspondant dans la base de données en fonction du pays sélectionné
    pays_regulateurs
      .findOne({
        attributes: ['symboledevise'],
        where: { pays: selectedPays },
      })
      .then((response) => {
        if (response) {
          const devises = {
            value: response.symboledevise,
            label: response.symboledevise,
          };

          res.json({
            code: 200,
            data: {
              devises
            }
          });
        } else {
          res.status(404).json({
            code: 404,
            error: 'Devise introuvable pour ce pays.',
          });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).json({
          code: 500,
          error: 'Une erreur s\'est produite lors de la récupération du régulateur.',
        });
      });
  });


  app.get('/api/valLiqportefeuilledev/:id/:devise', async (req, res) => {
    //  try {
    //  const transactionDatas = await getTransactionData(req.params.id);
    const portefeuilleDatas = await getportefeuilleData(parseInt(req.params.id));
    const devise = req.params.devise
    const response = await portefeuille_vl_cumul.findAll({
      where: {
        portefeuille_id: req.params.id
      },
      order: [
        ['date', 'ASC']
      ]
    });
    if (response.length > 0) {
      let lastValuep = response[0].base_100_bis; // Dernière valeur


      // const tauxsr=0.03;-0.0116;-0,0234
      const tauxsr = -0.0234;
      // Valeurs liquidatives
      const values = response.map((data) => data.base_100_bis);
      const dates = response.map((data) => moment(data.date).format('YYYY-MM-DD'));
      const lastDate = dates[dates.length - 1];

      const graphs = response.map(data => ({
        dates: moment(data.date).format('YYYY-MM-DD'), // Remplacez avec la propriété correcte de l'objet
        values: data.base_100_bis, // Remplacez avec la propriété correcte de l'objet
        // valuesInd: data.indRef,
      }));


      const lastdatepreviousmonth = findLastDateOfPreviousMonth(dates);
      const baseUrl = urll; // Remplacez par votre URL de base
      const lastValResponse = await fetch(`${baseUrl}/api/performancesportefeuilledev/fond/${req.params.id}/${devise}`);

      const lastValData = await lastValResponse.json();

      const last1ansRatiosResponse = await fetch(`${baseUrl}/api/ratiosportefeuilledev/1/${req.params.id}/${devise}`);

      if (!last1ansRatiosResponse.ok) {
        return res.status(404).json({ message: 'Fonds introuvable' });
      }

      const last1ansRatiosData = await last1ansRatiosResponse.json();

      const lastRatiosResponse = await fetch(`${baseUrl}/api/ratiosportefeuilledev/3/${req.params.id}/${devise}`);

      if (!lastRatiosResponse.ok) {
        return res.status(404).json({ message: 'Fonds introuvable' });
      }

      const lastRatiosData = await lastRatiosResponse.json();

      const last5ansRatiosResponse = await fetch(`${baseUrl}/api/ratiosportefeuilledev/5/${req.params.id}/${devise}`);

      if (!last5ansRatiosResponse.ok) {
        return res.status(404).json({ message: 'Fonds introuvable' });
      }

      const last5ansRatiosData = await last5ansRatiosResponse.json();



      res.json({
        code: 200,
        data: {
          lastDate,

          graphs: portefeuilleDatas,

          lastdatepreviousmonth,
          performances: lastValData,
          ratios3a: lastRatiosData,
          ratios1a: last1ansRatiosData,
          ratios5a: last5ansRatiosData
        }
      });
    } else {
      res.status(500).json({ message: 'Erreur lors de la récupération des données' });

    }
    /* } catch (error) {
       console.error('Erreur lors de la récupération des données:', error);
       res.status(500).json({ message: 'Erreur lors de la récupération des données' });
     }*/
  });

  app.get('/api/valLiqportefeuille/:id', async (req, res) => {
    //  try {
    //  const transactionDatas = await getTransactionData(req.params.id);
    //  const portefeuilleDatas = await getportefeuilleData(parseInt(req.params.id));

    const response = await portefeuille_vl_cumul.findAll({
      where: {
        portefeuille_id: req.params.id
      },
      order: [
        ['date', 'ASC']
      ]
    });
    if (response.length > 0) {
      const dates = response.map((data) => moment(data.date).format('YYYY-MM-DD'));
      const lastDate = dates[dates.length - 1];

      const lastdatepreviousmonth = findLastDateOfPreviousMonth(dates);
      const baseUrl = urll; // Remplacez par votre URL de base
      const lastValResponse = await fetch(`${baseUrl}/api/performancesportefeuille/fond/${req.params.id}`);

      const lastValData = await lastValResponse.json();

      const last1ansRatiosResponse = await fetch(`${baseUrl}/api/ratiosportefeuille/1/${req.params.id}`);

      if (!last1ansRatiosResponse.ok) {
        return res.status(404).json({ message: 'Fonds introuvable' });
      }

      const last1ansRatiosData = await last1ansRatiosResponse.json();

      const lastRatiosResponse = await fetch(`${baseUrl}/api/ratiosportefeuille/3/${req.params.id}`);

      if (!lastRatiosResponse.ok) {
        return res.status(404).json({ message: 'Fonds introuvable' });
      }

      const lastRatiosData = await lastRatiosResponse.json();

      const last5ansRatiosResponse = await fetch(`${baseUrl}/api/ratiosportefeuille/5/${req.params.id}`);

      if (!last5ansRatiosResponse.ok) {
        return res.status(404).json({ message: 'Fonds introuvable' });
      }

      const last5ansRatiosData = await last5ansRatiosResponse.json();



      res.json({
        code: 200,
        data: {
          lastDate,
          graphs: response,

          lastdatepreviousmonth,
          performances: lastValData,
          ratios3a: lastRatiosData,
          ratios1a: last1ansRatiosData,
          ratios5a: last5ansRatiosData
        }
      });
    } else {
      res.status(500).json({ message: 'Erreur lors de la récupération des données' });

    }
    /* } catch (error) {
       console.error('Erreur lors de la récupération des données:', error);
       res.status(500).json({ message: 'Erreur lors de la récupération des données' });
     }*/
  });

  app.post('/api/recherchefonds', async (req, res) => {
    try {
      const selectedValues = req.query.query;
      const selectedCategorie = req.query.selectedcategorie; // Corrected variable name
      const selectedSociete = req.query.selectedsociete; // Corrected variable name
      const selectedcategorieregionale = req.query.selectedcategorieregionale;
      const selectedcategorienationale = req.query.selectedcategorienationale;
      const valuesArray = selectedValues.split(',');

      // Fetch funds based on criteria
      const funds = await fetchFundsByValorisationfirst(valuesArray, selectedCategorie, selectedSociete, 'undefined', '',selectedcategorieregionale,selectedcategorienationale);

      if (!funds.length) {
        res.status(404).json({ error: 'No funds found.' });
        return;
      }

      const fundIds = funds.map(fund => fund.id);

      // Fetch all fund data in one batch
      const fundDataResults = await fond.findAll({
        where: { id: fundIds }
      });

      // Fetch all performance data in one batch
      const performanceResults = await performences.findAll({
        where: {
          fond_id: fundIds
        },
        order: [['date', 'DESC']]
      });

      // Create a map for performance data for quick lookup
      const performanceMap = performanceResults.reduce((acc, performance) => {
        if (!acc[performance.fond_id]) {
          acc[performance.fond_id] = performance;
        }
        return acc;
      }, {});

      // Combine data
      const fundsWithAllData = fundDataResults.map(fundData => {
        const performanceData = performanceMap[fundData.id] || null;
        return {
          id: fundData.id,
          fundData: fundData.toJSON(),
          performanceData: performanceData ? performanceData.toJSON() : null
        };
      });

      res.json({
        code: 200,
        data: {
          funds: fundsWithAllData,
        },
      });
    } catch (error) {
      console.error('Erreur lors de la recherche des fonds :', error);
      res.status(500).json({ error: 'Une erreur est survenue lors de la recherche des fonds.' });
    }
  });





  app.get('/api/searchFundsreconstitution', async (req, res) => {
    const { categorie, univers, universsous, selectedPays, selectedRegion } = req.query;

    const categories = categorie.split(',');
    /* const univers = data?.data.portefeuille.univers;
      const universsous = data?.data.portefeuille.universsous;*/

    const getFundsByCategorie = async (categories) => {
      if (categories.includes("Toutes les classes")) {
        // Si "Toutes les classes" est dans les catégories, renvoyer tout
        query = `
            SELECT f.*
            FROM fond_investissements AS f
            WHERE f.id IN (SELECT v.fund_id FROM valorisations AS v)
          `;
      } else {
        // Sinon, filtrer par les catégories spécifiées
        query = `
            SELECT f.*
            FROM fond_investissements AS f
            WHERE f.id IN (SELECT v.fund_id FROM valorisations AS v)
            AND f.categorie_globale IN (${categories.map(cat => `'${cat}'`).join(',')})
          `;
      }
      if (selectedPays) {
        query += `
      AND  f.pays = :selectedPays
     
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
        label: data.nom_fond.toString() + " " + data.code_ISIN,
        value: data.id,
      }));
    };

    const getFundsByRegionalCategorie = async (univers, universsous, categories) => {
      const categorieWithUnivers = categories.map(cat => `'${cat} ${univers}'`);
      if (univers === "Tous univers") {
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
    }

    const getFundsByNationalCategorie = async (universsous, categories) => {
      // Construisez votre requête SQL pour récupérer les fonds en fonction de la catégorie nationale
      const categorieWithUniverssous = categories.map(cat => `'${cat} ${universsous}'`);
      if (univers === "Tous univers") {
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
      // Exécutez la requête SQL et obtenez les fonds correspondants
      const fondsDansCategorieNationale = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,
      });

      return fondsDansCategorieNationale.map(data => ({
        label: data.nom_fond.toString() + " " + data.code_ISIN,
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
  app.post('/api/updatefond/:id', async (req, res) => {
    try {
      const fondId = req.params.id;

      // Trouver le fond en question
      const fonds = await fond.findOne({ where: { id: parseInt(fondId) } });

      if (!fonds) {
        return res.status(404).json({ error: 'Fond non trouvé.' });
      }

      // Mettre à jour la propriété active du fond à 1
      const updatedFond = await fond.update({ active: 1 }, {
        where: {
          id: parseInt(fondId)
        }
      });

      res.json({
        code: 200,
        message: 'Fond mis à jour avec succès.',
        data: updatedFond
      });
    } catch (err) {
      res.status(500).json({ error: 'Erreur lors de la mise à jour du fond.' });
    }
  });


  //Users adamin valide
  app.get('/api/getusersbyadmin', (req, res) => {
    ///  const searchTerm = req.query.query;

    // Vérifiez si searchTerm existe
    /*if (!searchTerm) {
        return res.status(400).json({ error: 'Le paramètre query est manquant.' });
    }*/

    users.findAll({
      where: {
      },
      order: [
        ['id', 'DESC']
      ]
    })
      .then(response => {
        //const funds = response.map((data) => data.id);

        const userss = response.map(data => ({
          id: data.id,
          email: data.email, // Remplacez avec la propriété correcte de l'objet
          nom: data.nom, // Remplacez avec la propriété correcte de l'objet
          prenoms: data.prenoms,
          active: data.active

        }));
        res.json({
          code: 200,
          data: {
            userss
          }
        })

      })
  })

  app.post('/api/activate-user/:id', (req, res) => {
    const userId = req.params.id;

    // Trouver l'utilisateur avec l'ID
    users.findOne({
      where: {
        id: userId
      }
    })
      .then(user => {
        if (!user) {
          return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        // Mettre à jour l'utilisateur pour l'activer
        return user.update({ active: 1 });
      })
      .then(updatedUser => {
        // Répondre avec une confirmation de l'activation
        res.json({
          code: 200,
          message: "L'utilisateur a été activé avec succès",
          data: {
            id: updatedUser.id,
            nom: updatedUser.nom,
            active: updatedUser.active,
          }
        });
      })
      .catch(error => {
        console.error('Erreur lors de l\'activation de l\'utilisateur:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
      });
  });

  //Frais
  app.get('/api/getfraisbyadmin', (req, res) => {
    ///  const searchTerm = req.query.query;

    // Vérifiez si searchTerm existe
    /*if (!searchTerm) {
        return res.status(400).json({ error: 'Le paramètre query est manquant.' });
    }*/

    frais.findAll({
      where: {
      },
      order: [
        ['id', 'DESC']
      ]
    })
      .then(response => {
        //const funds = response.map((data) => data.id);

        const frais = response.map(data => ({
          id: data.id,
          fond_id: data.fond_id, // Remplacez avec la propriété correcte de l'objet
          fond: data.fond, // Remplacez avec la propriété correcte de l'objet
          frais_transa_achat: data.frais_transa_achat,
          frais_transa_vente: data.frais_transa_vente

        }));
        res.json({
          code: 200,
          data: {
            frais
          }
        })

      })
  })
  app.get('/api/getfraisbyadminid/:id', (req, res) => {
    frais.findOne({
      where: {
        fond_id: req.params.id
      },
      order: [
        ['id', 'DESC']
      ]
    })
      .then(data => {
        if (data) {
          res.json({
            code: 200,
            data: {
              id: data.id,
              fond_id: data.fond_id,
              fond: data.fond,
              frais_transa_achat: data.frais_transa_achat,
              frais_transa_vente: data.frais_transa_vente
            }
          });
        } else {
          res.status(404).json({ error: 'Data not found' });
        }
      })
      .catch(error => {
        res.status(500).json({ error: 'Internal Server Error' });
      });
  });
  app.post('/api/createfrais', async (req, res) => {
    try {
      const { fond_id, frais_transa_achat, frais_transa_vente } = req.body;

      // Vérifiez si le fond existe
      const fondExists = await fond.findOne({ where: { id: parseInt(fond_id) } });

      if (!fondExists) {
        return res.status(404).json({ error: 'Fond non trouvé.' });
      }

      // Vérifiez si les frais existent déjà pour ce fond
      const fraisExists = await frais.findOne({ where: { fond_id: parseInt(fond_id) } });

      if (fraisExists) {
        // Mettez à jour les frais existants
        const updatedFrais = await frais.update(
          { frais_transa_achat, frais_transa_vente },
          { where: { fond_id: parseInt(fond_id) } }
        );
        return res.json({
          code: 200,
          message: 'Frais mis à jour avec succès.',
          data: updatedFrais,
        });
      }

      // Créez les frais de transaction
      const newFrais = await frais.create({
        fond: fondExists.nom_fond,
        fond_id: parseInt(fond_id),
        frais_transa_achat,
        frais_transa_vente,
      });

      res.json({
        code: 200,
        message: 'Frais créés avec succès.',
        data: newFrais,
      });
    } catch (err) {
      res.status(500).json({ error: 'Erreur lors de la création ou de la mise à jour des frais.' });
    }
  });
  app.post('/api/updatefraisbyadminid/:id', async (req, res) => {
    try {
      const fondId = req.params.id;
      const { frais_transa_achat, frais_transa_vente } = req.body;

      // Trouver le fond en question
      const fonds = await frais.findOne({ where: { fond_id: parseInt(fondId) } });

      if (!fonds) {
        return res.status(404).json({ error: 'Fond non trouvé.' });
      }

      // Mettre à jour les frais de transaction
      const updatedFond = await frais.update(
        { frais_transa_achat, frais_transa_vente },
        {
          where: {
            fond_id: parseInt(fondId)
          }
        }
      );

      res.json({
        code: 200,
        message: 'Frais mis à jour avec succès.',
        data: updatedFond
      });
    } catch (err) {
      res.status(500).json({ error: 'Erreur lors de la mise à jour des frais.' });
    }
  });
  app.get('/api/getfondbyadmin', (req, res) => {
    ///  const searchTerm = req.query.query;

    // Vérifiez si searchTerm existe
    /*if (!searchTerm) {
        return res.status(400).json({ error: 'Le paramètre query est manquant.' });
    }*/

    fond.findAll({
      where: {

        /* id: {
           //  [Sequelize.Op.like]: `%${searchTerm}%`
         }*/
      },
      order: [
        ['id', 'DESC']
      ]
    })
      .then(response => {
        //const funds = response.map((data) => data.id);

        const funds = response.map(data => ({
          id: data.id,
          nom_fond: data.nom_fond.toString(), // Remplacez avec la propriété correcte de l'objet
          code_ISIN: data.dev_libelle,
          categorie_libelle: data.categorie_libelle,
          categorie_national: data.categorie_national,
          datejour: data.datejour,
          active: data.active,
          code_ISIN: data.code_ISIN, // Remplacez avec la propriété correcte de l'objet
        }));
        res.json({
          code: 200,
          data: {
            funds


          }
        })

      })
  })
  app.get('/api/getfondbyuser/:id', (req, res) => {
    const societeGestionId = req.params.id;
    const pays = req.query.pays;

    // Définir la clause where de base
    let whereClause = {
      active: 0
    };

    if (pays) {
      whereClause.pays = pays;
    } else {
      whereClause.societe_gestion = societeGestionId;
    }


    fond.findAll({
      where: whereClause,
      order: [
        ['id', 'DESC']
      ]
    })
      .then(response => {
        //const funds = response.map((data) => data.id);

        const funds = response.map(data => ({
          id: data.id,
          nom_fond: data.nom_fond.toString(), // Remplacez avec la propriété correcte de l'objet
          dev_libelle: data.dev_libelle,
          categorie_libelle: data.categorie_libelle,
          categorie_national: data.categorie_national,
          datejour: data.datejour,
          active: data.active,

          code_ISIN: data.code_ISIN, // Remplacez avec la propriété correcte de l'objet
        }));
        res.json({
          code: 200,
          data: {
            funds


          }
        })

      })
  })
  app.get('/api/getfondbyuservalide/:id', (req, res) => {
    const societeGestionId = req.params.id;
    const pays = req.query.pays;

    // Définir la clause where de base
    let whereClause = {
      active: 1
    };

    if (pays) {
      whereClause.pays = pays;
    } else {
      whereClause.societe_gestion = societeGestionId;
    }


    fond.findAll({
      where: whereClause,
      order: [
        ['id', 'DESC']
      ]
    })
      .then(response => {
        //const funds = response.map((data) => data.id);

        const funds = response.map(data => ({
          id: data.id,
          nom_fond: data.nom_fond.toString(), // Remplacez avec la propriété correcte de l'objet
          categorie_libelle: data.categorie_libelle,
          categorie_national: data.categorie_national,
          datejour: data.datejour,
          dev_libelle: data.dev_libelle,
          active: data.active,

          code_ISIN: data.code_ISIN, // Remplacez avec la propriété correcte de l'objet
        }));
        res.json({
          code: 200,
          data: {
            funds


          }
        })

      })
  })
  app.get('/api/getfondbysociete/:id', (req, res) => {
    ///  const searchTerm = req.query.query;

    // Vérifiez si searchTerm existe
    /*if (!searchTerm) {
        return res.status(400).json({ error: 'Le paramètre query est manquant.' });
    }*/

    fond.findAll({
      where: {
        societe_gestion: req.params.id,
        /* id: {
           //  [Sequelize.Op.like]: `%${searchTerm}%`
         }*/
      },
      order: [
        ['id', 'DESC']
      ]
    })
      .then(response => {
        //const funds = response.map((data) => data.id);

        const funds = response.map(data => ({
          id: data.id,
          nom_fond: data.nom_fond.toString(), // Remplacez avec la propriété correcte de l'objet
          test: data.nom_fond.toString() + " " + data.code_ISIN,
          categorie_libelle: data.categorie_libelle,
          categorie_national: data.categorie_national,
          datejour: data.datejour,
          active: data.active,

          code_ISIN: data.code_ISIN, // Remplacez avec la propriété correcte de l'objet
        }));
        res.json({
          code: 200,
          data: {
            funds


          }
        })

      })
  })

  app.get('/api/getfondbypays/:id', (req, res) => {
    ///  const searchTerm = req.query.query;

    // Vérifiez si searchTerm existe
    /*if (!searchTerm) {
        return res.status(400).json({ error: 'Le paramètre query est manquant.' });
    }*/

    fond.findAll({
      where: {
        pays: req.params.id,
        /* id: {
           //  [Sequelize.Op.like]: `%${searchTerm}%`
         }*/
      },
      order: [
        ['id', 'DESC']
      ]
    })
      .then(response => {
        //const funds = response.map((data) => data.id);

        const funds = response.map(data => ({
          id: data.id,
          nom_fond: data.nom_fond.toString(), // Remplacez avec la propriété correcte de l'objet
          test: data.nom_fond.toString() + " " + data.code_ISIN,
          categorie_libelle: data.categorie_libelle,
          categorie_national: data.categorie_national,
          datejour: data.datejour,
          active: data.active,

          code_ISIN: data.code_ISIN, // Remplacez avec la propriété correcte de l'objet
        }));
        res.json({
          code: 200,
          data: {
            funds
          }



        })

      })
  })





  app.get('/api/getData', (req, res) => {
    pays_regulateurs.findAll({
      where: {
        //  id: searchTerm
        /* id: {
           //  [Sequelize.Op.like]: `%${searchTerm}%`
         }*/
      },
      order: [
        ['created', 'ASC']
      ]
    })
      .then(response => {
        const funds = response.map((data) => data.id);


        res.json({
          code: 200,
          data: {



          }
        })

      })
  })
  app.get('/api/fondscharge/:id', async (req, res) => {
    try {
      const id = req.params.id;

      // Recherchez le personnel dans la base de données en fonction de son ID
      const existingPersonnel = await fond.findOne({ where: { id } });

      if (!existingPersonnel) {
        return res.status(404).json({ error: "Personnel not found" });
      }

      // Envoyez les données du personnel trouvé
      res.status(200).json(existingPersonnel);
    } catch (error) {
      console.error("Error fetching personnel:", error);
      res.status(500).json({ error: 'An error occurred while fetching personnel data.' });
    }
  });
  app.post('/api/postfond', async (req, res) => {
    try {
      /* const {
         nomDuFonds,
         numeroDagrement,
         codeISIN,
         dateDeLaPremiereVL,
         deviseDeValorisation,
         regulateur,
         periodicitevalorisation,
         pays,
         societe
       } = req.body;*/

      const {
        nom_fond,
        pays,
        regulateur,
        periodicite,
        structure_fond,
        code_ISIN,
        date_creation,
        dev_libelle,
        societe_gestion,
        categorie_libelle,
        classification,
        type_investissement,
        nom_gerant,
        categorie_globale,
        categorie_national,
        categorie_regional,
        frais_gestion,
        frais_souscription,
        frais_entree,
        frais_sortie,
        minimum_investissement,
        affectation,
        frais_rachat,
        description,
        strategie_politique_invest,
        philosophie_fond,
        //  horizonplacement,
        date_agrement,
        date_premiere_vl,
        active,
        depositaire,
        teneur_registre,
        valorisateur,
        centralisateur,
        agent_transfert,
        agent_payeur,
        numero_agrement,
        montant_premier_vl,
        montant_actif_net,
        duree_investissement_recommande,
        date_cloture,
        heure_cutt_off,
        delai_reglement,
        souscripteur,
        datejour,
        IBAN,
        RIB,
        banque,
        nombre_part,
        horizonplacement,
        indice_benchmark
      } = req.body;

      const categorie_nationale = categorie_globale + " " + pays

      const PAYS_AFRIQUE_DU_NORD = ["ALGERIE", "MAROC", "TUNISIE", "LIBYE", "ÉGYPTE", "MAURITANIE"];
      const PAYS_AFRIQUE_DE_L_OUEST = ["SÉNÉGAL", "MALI", "CÔTE D'IVOIRE", "BURKINA FASO", "NIGER", "BÉNIN", "GUINÉE", "TOGO", "GHANA"];
      const PAYS_AFRIQUE_CENTRALE = ["CAMEROUN", "TCHAD", "GABON", "RÉPUBLIQUE CENTRAFRICAINE", "CONGO", "RÉPUBLIQUE DÉMOCRATIQUE DU CONGO", "GUINÉE ÉQUATORIALE"];
      const PAYS_AFRIQUE_DE_L_EST = ["KENYA", "OUGANDA", "TANZANIE", "ETHIOPIE", "SOMALIE", "SOUDAN", "ERYTHREE"];
      const PAYS_AFRIQUE_AUSTRALE = ["AFRIQUE DU SUD", "NAMIBIE", "BOTSWANA", "ZAMBIE", "ZIMBABWE", "MOZAMBIQUE", "ANGOLA"];


      let CATEGORIE_REGIONALE = categorie_globale; // Assigner la valeur initiale de categorie_globale

      if (PAYS_AFRIQUE_DU_NORD.includes(pays)) {
        CATEGORIE_REGIONALE += " AFRIQUE DU NORD";
      } else if (PAYS_AFRIQUE_DE_L_OUEST.includes(pays)) {
        CATEGORIE_REGIONALE += " AFRIQUE DE L OUEST";
      } else if (PAYS_AFRIQUE_CENTRALE.includes(pays)) {
        CATEGORIE_REGIONALE += " AFRIQUE CENTRALE";
      } else if (PAYS_AFRIQUE_DE_L_EST.includes(pays)) {
        CATEGORIE_REGIONALE += " AFRIQUE DE L EST";
      } else if (PAYS_AFRIQUE_AUSTRALE.includes(pays)) {
        CATEGORIE_REGIONALE += " AFRIQUE AUSTRALE";
      } else {
        CATEGORIE_REGIONALE += " REGION INCONNUE"; // Pour les pays qui ne sont pas dans la liste
      }      //  const convertedDate = convertDateFormat(dateDeLaPremiereVL);
      fond.create({
        nom_fond,
        pays,
        periodicite,
        structure_fond,
        code_ISIN,
        date_creation,
        dev_libelle,
        societe_gestion,
        categorie_libelle,
        classification,
        type_investissement,
        nom_gerant,
        categorie_globale,
        categorie_national: categorie_nationale,
        categorie_regional: CATEGORIE_REGIONALE,
        frais_gestion,
        frais_souscription,
        frais_entree,
        frais_sortie,
        minimum_investissement,
        affectation,
        frais_rachat,
        description,
        strategie_politique_invest,
        philosophie_fond,
        date_agrement,
        date_premiere_vl,
        active,
        depositaire,
        teneur_registre,
        valorisateur,
        centralisateur,
        agent_transfert,
        agent_payeur,
        numero_agrement,
        montant_premier_vl,
        montant_actif_net,
        duree_investissement_recommande,
        date_cloture,
        heure_cutt_off,
        delai_reglement,
        souscripteur,
        datejour: date_premiere_vl,
        IBAN,
        RIB,
        banque,
        nombre_part,
        horizonplacement,
        indice_benchmark,
        regulateur
      })



      // Répondez avec un message de succès ou autre réponse appropriée
      res.status(200).json({ message: 'Données insérées avec succès' });
    } catch (error) {
      // Gérez les erreurs ici
      console.error('Erreur lors de l\'insertion en base de données :', error);
      res.status(500).json({ message: 'Erreur lors de l\'insertion en base de données' });
    }
  });
  app.post('/api/updatefondmodif/:id', async (req, res) => {
    try {
      const {
        nom_fond,
        pays,
        regulateur,
        periodicite,
        structure_fond,
        code_ISIN,
        date_creation,
        dev_libelle,
        societe_gestion,
        categorie_libelle,
        classification,
        type_investissement,
        nom_gerant,
        categorie_globale,
        categorie_national,
        categorie_regional,
        frais_gestion,
        frais_souscription,
        frais_entree,
        frais_sortie,
        minimum_investissement,
        affectation,
        frais_rachat,
        description,
        strategie_politique_invest,
        philosophie_fond,
        horizonplacement,
        date_agrement,
        date_premiere_vl,
        active,
        depositaire,
        teneur_registre,
        valorisateur,
        centralisateur,
        agent_transfert,
        agent_payeur,
        numero_agrement,
        montant_premier_vl,
        montant_actif_net,
        duree_investissement_recommande,
        date_cloture,
        heure_cutt_off,
        delai_reglement,
        souscripteur,
        datejour,
        IBAN,
        RIB,
        banque,
        nombre_part,
        indice_benchmark
      } = req.body;



      const categorie_nationale = categorie_globale + " " + pays

      const PAYS_AFRIQUE_DU_NORD = ["ALGERIE", "MAROC", "TUNISIE", "LIBYE", "ÉGYPTE", "MAURITANIE"];
      const PAYS_AFRIQUE_DE_L_OUEST = ["SÉNÉGAL", "MALI", "CÔTE D'IVOIRE", "BURKINA FASO", "NIGER", "BÉNIN", "GUINÉE", "TOGO", "GHANA"];
      const PAYS_AFRIQUE_CENTRALE = ["CAMEROUN", "TCHAD", "GABON", "RÉPUBLIQUE CENTRAFRICAINE", "CONGO", "RÉPUBLIQUE DÉMOCRATIQUE DU CONGO", "GUINÉE ÉQUATORIALE"];
      const PAYS_AFRIQUE_DE_L_EST = ["KENYA", "OUGANDA", "TANZANIE", "ETHIOPIE", "SOMALIE", "SOUDAN", "ERYTHREE"];
      const PAYS_AFRIQUE_AUSTRALE = ["AFRIQUE DU SUD", "NAMIBIE", "BOTSWANA", "ZAMBIE", "ZIMBABWE", "MOZAMBIQUE", "ANGOLA"];


      let CATEGORIE_REGIONALE = categorie_globale; // Assigner la valeur initiale de categorie_globale

      if (PAYS_AFRIQUE_DU_NORD.includes(pays)) {
        CATEGORIE_REGIONALE += " AFRIQUE DU NORD";
      } else if (PAYS_AFRIQUE_DE_L_OUEST.includes(pays)) {
        CATEGORIE_REGIONALE += " AFRIQUE DE L OUEST";
      } else if (PAYS_AFRIQUE_CENTRALE.includes(pays)) {
        CATEGORIE_REGIONALE += " AFRIQUE CENTRALE";
      } else if (PAYS_AFRIQUE_DE_L_EST.includes(pays)) {
        CATEGORIE_REGIONALE += " AFRIQUE DE L EST";
      } else if (PAYS_AFRIQUE_AUSTRALE.includes(pays)) {
        CATEGORIE_REGIONALE += " AFRIQUE AUSTRALE";
      } else {
        CATEGORIE_REGIONALE += " REGION INCONNUE"; // Pour les pays qui ne sont pas dans la liste
      }      //  const convertedDate = convertDateFormat(dateDeLaPremiereVL);

      // Vérifiez si un fond avec le même identifiant existe déjà
      const existingFond = await fond.findOne({ where: { id: parseInt(req.params.id) } });

      if (existingFond) {
        // Si le fond existe déjà, mettez à jour ses informations
        const updatedValues = {};

        Object.keys(existingFond.toJSON()).forEach(key => {
          if (key in {
            nom_fond, pays, periodicite, structure_fond, code_ISIN, date_creation, dev_libelle,
            societe_gestion, categorie_libelle, classification, type_investissement, nom_gerant,
            categorie_globale, frais_gestion, frais_souscription,
            frais_entree, frais_sortie, minimum_investissement, affectation, frais_rachat, description,
            strategie_politique_invest, philosophie_fond, date_agrement, date_premiere_vl, active,
            depositaire, teneur_registre, valorisateur, centralisateur, agent_transfert, agent_payeur,
            numero_agrement, montant_premier_vl, montant_actif_net, duree_investissement_recommande,
            date_cloture, heure_cutt_off, delai_reglement, souscripteur, datejour, horizonplacement, IBAN,
            RIB,
            banque,
            nombre_part,
            indice_benchmark, regulateur
          }) {
            const value = eval(key);
            if (value !== '' && value !== undefined) {
              updatedValues[key] = value;
            }
          }
          // Plugger CATEGORIE_REGIONALE
          if (key === 'categorie_regional') {
            updatedValues[key] = CATEGORIE_REGIONALE; // Assigner la valeur de CATEGORIE_REGIONALE
          }
          // Plugger CATEGORIE_REGIONALE
          if (key === 'categorie_national') {
            updatedValues[key] = categorie_nationale; // Assigner la valeur de CATEGORIE_REGIONALE
          }
        });

        await existingFond.update(updatedValues);

        // Répondez avec un message de succès ou autre réponse appropriée
        res.status(200).json({ message: 'Données mises à jour avec succès' });
      } else {
        // Si aucun fond avec cet identifiant n'existe
        res.status(404).json({ message: 'Fond non trouvé' });
      }
    } catch (error) {
      // Gérez les erreurs ici
      console.error('Erreur lors de la mise à jour en base de données :', error);
      res.status(500).json({ message: 'Erreur lors de la mise à jour en base de données' });
    }
  });


  app.post('/api/ajoutVL/:id', async (req, res) => {
    try {
      const vlEntries = req.body; // This should be an array of Vl entries
      let fonds = await fond.findOne({
        where: {
          id: parseInt(req.params.id)
        },

      });
      const paireEUR = "EUR" + "/" + fonds.dev_libelle
      const paireUSD = "USD" + "/" + fonds.dev_libelle


      let vlEntriesNEW = [];

      // Update each vlEntry and add to vlEntriesNEW
      for (let i = 0; i < vlEntries.length; i++) {
        const vlEntry = vlEntries[i];
        let exchangeRatesEUR = await devisedechanges.findOne({
          where: {
            date: { [Op.lte]: vlEntry.date }, // Chercher la date la plus proche inférieure ou égale
            paire: paireEUR,
          },
          order: [['date', 'DESC']], // Tri par date descendant pour obtenir la date la plus proche
        });
        let exchangeRatesUSD = await devisedechanges.findOne({
          where: {
            date: { [Op.lte]: vlEntry.date }, // Chercher la date la plus proche inférieure ou égale
            paire: paireUSD,
          },
          order: [['date', 'DESC']] // Tri par date descendant
        });
        const vlEntryNEW = {
          code_ISIN:fonds.code_ISIN,
          fund_id: vlEntry.fund_id,
          date: vlEntry.date,
          value: parseFloat(vlEntry.value),
          value_EUR: exchangeRatesEUR ? parseFloat(vlEntry.value) * exchangeRatesEUR.value : null,
          value_USD: exchangeRatesUSD ? parseFloat(vlEntry.value) * exchangeRatesUSD.value : null,
          dividende:vlEntry.dividende? parseFloat(vlEntry.dividende):0,
          dividende_EUR: vlEntry.dividende ? parseFloat(vlEntry.dividende) * exchangeRatesEUR.value : null,
          dividende_USD: vlEntry.dividende  ? parseFloat(vlEntry.dividende) * exchangeRatesUSD.value : null,
          actif_net: parseFloat(vlEntry.actif_net),
          actif_net_EUR: exchangeRatesEUR ? parseFloat(vlEntry.actif_net) * exchangeRatesEUR.value : null,
          actif_net_USD: exchangeRatesUSD ? parseFloat(vlEntry.actif_net) * exchangeRatesUSD.value : null,
          indRef: vlEntry.indRef != undefined ? parseFloat(vlEntry.indRef) : null,
          indRef_EUR: vlEntry.indRef != undefined ? parseFloat(vlEntry.indRef) * exchangeRatesEUR.value : null,
          indRef_USD: vlEntry.indRef != undefined ? parseFloat(vlEntry.indRef) * exchangeRatesUSD.value : null
        };
        const existingEntry = await vl.findOne({
          where: {
            date: vlEntry.date,
            fund_id: parseInt(req.params.id)
          }
        });

        if (existingEntry) {
          // If an existing entry is found, update it
          await vl.update(vlEntryNEW, {
            where: {
              date: vlEntry.date,
              fund_id: parseInt(req.params.id)
            }
          });
        } else {
          // If no existing entry is found, create a new one
          vlEntriesNEW.push(vlEntryNEW);
        }
      }
      if (vlEntriesNEW.length > 0) {
        await vl.bulkCreate(vlEntriesNEW);
      }
      // Assuming you have a Sequelize model named 'vl', you can create multiple Vl entries as follows:

  // Récupérer tous les fonds où "dividende" est défini à "oui"
  const fondsAvecDividende = await fond.findAll({
    where: { id:parseInt(req.params.id) },
    include: [{
      model: vl,
      order: [['date', 'ASC']] // Assurez-vous que les VL sont triées par date croissante
    }]
  });

  // Parcourir chaque fonds et mettre à jour la table VL en tenant compte du cumul des dividendes
  for (const fonds of fondsAvecDividende) {
    const vlRecords = fonds.valorisations; // Obtenir les VL associés au fonds
    let totalDividende = 0; // Initialiser le cumul des dividendes à zéro
    let totalDividende_EUR = 0;
    let totalDividende_USD = 0;
    // Parcourir chaque VL du fonds, trié par date croissante
    for (const vl of vlRecords) {
      // Remplacer null par 0 pour éviter les erreurs de calcul
      const valeur = vl.value || 0;
      const dividende = vl.dividende || 0;
      const valeurEUR = vl.value_EUR || 0;
      const dividendeEUR = vl.dividende_EUR || 0;
      const valeurUSD = vl.value_USD || 0;
      const dividendeUSD = vl.dividende_USD || 0;

      // Ajouter le dividende courant au cumul total si un dividende est présent
      if (dividende > 0 ) {
        totalDividende += dividende; // Ajouter le dividende courant au cumul total
      }
      if(dividendeEUR > 0 ){
        totalDividende_EUR += dividendeEUR;// Ajouter le dividende courant au cumul total
      }
      if(dividendeUSD > 0 ){
        totalDividende_USD += dividendeUSD;// Ajouter le dividende courant au cumul total
      }

      // Calculer les nouvelles valeurs en ajoutant le cumul des dividendes aux valeurs existantes
      const newValue = valeur + totalDividende;
      const newValueEUR = valeurEUR + totalDividende_EUR;
      const newValueUSD = valeurUSD + totalDividende_USD;

      // Mettre à jour la table VL avec la nouvelle valeur cumulative
      await vl.update({ vl_ajuste: newValue, vl_ajuste_EUR: newValueEUR, vl_ajuste_USD: newValueUSD }, { where: { id: vl.id } });
    }
  }


      // Respond with a success message or appropriate response
      res.status(200).json({ message: 'Data inserted successfully' });
    } catch (error) {
      // Handle errors here
      console.error('Error inserting data into the database:', error);
      res.status(500).json({ message: 'Error inserting data into the database' });
    }
  });

  app.post('/api/ajoutIndice/:id', async (req, res) => {
    try {
      const vlEntries = req.body; // This should be an array of Vl entries
      let fonds = await fond.findOne({
        where: {
          id: parseInt(req.params.id)
        },

      });
      const paireEUR = "EUR" + "/" + fonds.dev_libelle
      const paireUSD = "USD" + "/" + fonds.dev_libelle


      let vlEntriesNEW = [];
      let indiceEntriesNEW = [];

      // Update each vlEntry and add to vlEntriesNEW
      for (let i = 0; i < vlEntries.length; i++) {
        const vlEntry = vlEntries[i];
        let exchangeRatesEUR = await devisedechanges.findOne({
          where: {
            date: { [Op.lte]: vlEntry.date }, // Chercher la date la plus proche inférieure ou égale
            paire: paireEUR,
          },
          order: [['date', 'DESC']] // Tri par date descendant
        });
        let exchangeRatesUSD = await devisedechanges.findOne({
          where: {
            date: { [Op.lte]: vlEntry.date }, // Chercher la date la plus proche inférieure ou égale
            paire: paireUSD,
          },
          order: [['date', 'DESC']] // Tri par date descendant
        });
        const vlEntryNEW = {
          code_ISIN:fonds.code_ISIN,
          fund_id: vlEntry.fund_id,
          date: vlEntry.date,
          indRef: vlEntry.value != undefined ? parseFloat(vlEntry.value) : null,
          indRef_EUR: vlEntry.value != undefined ? parseFloat(vlEntry.value) * exchangeRatesEUR.value : null,
          indRef_USD: vlEntry.value != undefined ? parseFloat(vlEntry.value) * exchangeRatesUSD.value : null
        };
        const indiceEntryNEW = {
          date: vlEntry.date,
          valeur: parseFloat(vlEntry.value),
          id_indice: vlEntry.nom,
          type_indice_id: 1

        };
        const existingEntry = await vl.findOne({
          where: {
            date: vlEntryNEW.date,
            fund_id: parseInt(req.params.id)
          }
        });

        if (existingEntry) {
          // If an existing entry is found, update it
          await vl.update(vlEntryNEW, {
            where: {
              date: vlEntryNEW.date,
              fund_id: parseInt(req.params.id)
            }
          });
        } else {
          // If no existing entry is found, create a new one
          vlEntriesNEW.push(vlEntryNEW);
        }

        // const existingEntry1 = await indice.findOne({
        //   where: {
        //     date: indiceEntryNEW.date,
        //     id_indice: indiceEntryNEW.id_indice
        //   }
        // });

        // if (existingEntry1) {
        //   // If an existing entry is found, update it
        //   await indice.update(indiceEntryNEW, {
        //     where: {
        //       date: indiceEntryNEW.date,
        //       id_indice: indiceEntryNEW.id_indice
        //     }
        //   });
        // } else {
        //   // If no existing entry is found, create a new one
        //   indiceEntriesNEW.push(indiceEntryNEW);
        // }
      }

      // Assuming you have a Sequelize model named 'vl', you can create multiple Vl entries as follows:
      if (vlEntriesNEW.length > 0)
        await vl.bulkCreate(vlEntriesNEW);


      // if (indiceEntriesNEW.length > 0)
      //   await indice.bulkCreate(indiceEntriesNEW);



      // Respond with a success message or appropriate response
      res.status(200).json({ message: 'Data inserted successfully' });
    } catch (error) {
      // Handle errors here
      console.error('Error inserting data into the database:', error);
      res.status(500).json({ message: 'Error inserting data into the database' });
    }
  });


  app.post('/api/uploadsfilevl/:id', upload.single('file'), async (req, res) => {
    if (!req.file) {
      res.status(400).send('No file uploaded.');
      return;
    }

    if (req.file.mimetype !== 'text/csv' && req.file.mimetype !== 'application/vnd.ms-excel') {
      res.status(400).send('Uploaded file is not a CSV.');
      return;
    }

    const vlEntries = [];
    const promises = [];

    fs.createReadStream(req.file.path)
      .pipe(csv({ separator: ';' })) // Utilisez le séparateur correct pour le fichier CSV
      .on('headers', (headers) => {
        console.log('Headers:', headers); // Affiche les en-têtes pour vérifier leur structure
      })
      .on('data', (row) => {
        const promise = (async () => {
          console.log('Row:', row); // Affichez chaque ligne pour le débogage

          let fonds = await fond.findOne({
            where: {
              id: parseInt(req.params.id)
            },
          });

          if (!fonds) {
            console.error('Fund not found for id:', req.params.id);
            return;
          }

          const paireEUR = "EUR" + "/" + fonds.dev_libelle;
          const paireUSD = "USD" + "/" + fonds.dev_libelle;

          let exchangeRatesEUR = await devisedechanges.findOne({
            where: {
              date: { [Op.lte]: row.date }, // Chercher la date la plus proche inférieure ou égale
              paire: paireEUR,
            },
            order: [['date', 'DESC']] // Tri par date descendant
          });

          let exchangeRatesUSD = await devisedechanges.findOne({
            where: {
              date: { [Op.lte]: row.date }, // Chercher la date la plus proche inférieure ou égale
              paire: paireUSD,
            },
            order: [['date', 'DESC']] // Tri par date descendant
          });

          let vlEntry = {
            fund_id: parseInt(req.params.id),
            date: row.date,
            code_ISIN:fonds.code_ISIN,
            value: 0,
            value_EUR: 0,
            value_USD: 0,
            vl_ajuste: 0,
            vl_ajuste_EUR: 0,
            vl_ajuste_USD: 0,
            actif_net: 0,
            actif_net_EUR: 0,
            actif_net_USD: 0,
            dividende:0,
            dividende_EUR:0,
            dividende_USD:0,
            indRef: 0,
            indRef_EUR: 0,
            indRef_USD: 0
          };

          if ('value' in row && exchangeRatesEUR && exchangeRatesUSD) {
            vlEntry.value = parseFloat(row.value);
            vlEntry.value_EUR = parseFloat(row.value) * exchangeRatesEUR.value;
            vlEntry.value_USD = parseFloat(row.value) * exchangeRatesUSD.value;
          }

          if ('actif_net' in row && exchangeRatesEUR && exchangeRatesUSD) {
            vlEntry.actif_net = parseFloat(row.actif_net);
            vlEntry.actif_net_EUR = parseFloat(row.actif_net) * exchangeRatesEUR.value;
            vlEntry.actif_net_USD = parseFloat(row.actif_net) * exchangeRatesUSD.value;
          }

          if ('dividende' in row && exchangeRatesEUR && exchangeRatesUSD) {
            vlEntry.dividende = parseFloat(row.dividende);
            vlEntry.dividende_EUR = parseFloat(row.dividende) * exchangeRatesEUR.value;
            vlEntry.dividende_USD = parseFloat(row.dividende) * exchangeRatesUSD.value;
          }

          if ('indRef' in row && exchangeRatesEUR && exchangeRatesUSD) {
            vlEntry.indRef = parseFloat(row.indRef);
            vlEntry.indRef_EUR = parseFloat(row.indRef) * exchangeRatesEUR.value;
            vlEntry.indRef_USD = parseFloat(row.indRef) * exchangeRatesUSD.value;
          }

          console.log(vlEntry); // Affichez l'entrée VL pour le débogage

          const existingEntry = await vl.findOne({
            where: {
              date: row.date,
              fund_id: parseInt(req.params.id)
            }
          });

          if (existingEntry) {
            // Si une entrée existante est trouvée, mettez-la à jour
            await vl.update(vlEntry, {
              where: {
                date: row.date,
                fund_id: parseInt(req.params.id)
              }
            });
          } else {
            // Si aucune entrée existante n'est trouvée, créez-en une nouvelle
            vlEntries.push(vlEntry);
          }
        })();

        promises.push(promise);
      })
      .on('end', async () => {
        try {
          // Attendre que toutes les promesses soient résolues
          await Promise.all(promises);

          // Sauvegardez les entrées VL dans la base de données
          if (vlEntries.length > 0) {
            await vl.bulkCreate(vlEntries);
          }

          // Supprimez le fichier temporaire
          fs.unlinkSync(req.file.path);

            // Récupérer tous les fonds où "dividende" est défini à "oui"
            const fondsAvecDividende = await fond.findAll({
        where: { id:parseInt(req.params.id) },
        include: [{
          model: vl,
          order: [['date', 'ASC']] // Assurez-vous que les VL sont triées par date croissante
        }]
      });
  
      // Parcourir chaque fonds et mettre à jour la table VL en tenant compte du cumul des dividendes
      for (const fonds of fondsAvecDividende) {
        const vlRecords = fonds.valorisations; // Obtenir les VL associés au fonds
        let totalDividende = 0; // Initialiser le cumul des dividendes à zéro
        let totalDividende_EUR = 0;
        let totalDividende_USD = 0;
        // Parcourir chaque VL du fonds, trié par date croissante
        for (const vl of vlRecords) {
          // Remplacer null par 0 pour éviter les erreurs de calcul
          const valeur = vl.value || 0;
          const dividende = vl.dividende || 0;
          const valeurEUR = vl.value_EUR || 0;
          const dividendeEUR = vl.dividende_EUR || 0;
          const valeurUSD = vl.value_USD || 0;
          const dividendeUSD = vl.dividende_USD || 0;
  
          // Ajouter le dividende courant au cumul total si un dividende est présent
          if (dividende > 0 ) {
            totalDividende += dividende; // Ajouter le dividende courant au cumul total
          }
          if(dividendeEUR > 0 ){
            totalDividende_EUR += dividendeEUR;// Ajouter le dividende courant au cumul total
          }
          if(dividendeUSD > 0 ){
            totalDividende_USD += dividendeUSD;// Ajouter le dividende courant au cumul total
          }
  
          // Calculer les nouvelles valeurs en ajoutant le cumul des dividendes aux valeurs existantes
          const newValue = valeur + totalDividende;
          const newValueEUR = valeurEUR + totalDividende_EUR;
          const newValueUSD = valeurUSD + totalDividende_USD;
  
          // Mettre à jour la table VL avec la nouvelle valeur cumulative
          await vl.update({ vl_ajuste: newValue, vl_ajuste_EUR: newValueEUR, vl_ajuste_USD: newValueUSD }, { where: { id: vl.id } });
        }
      }

          res.status(200).send('File uploaded and data saved successfully.');
        } catch (error) {
          console.error('Database error:', error);
          res.status(500).send('Error saving data to the database.');
        }
      })
      .on('error', (error) => {
        console.error('Error reading CSV file:', error);
        res.status(500).send('Error processing the file.');
      });
  });

  app.post('/api/uploadsfileindice/:id', upload.single('file'), async (req, res) => {
    if (!req.file) {
      res.status(400).send('No file uploaded.');
      return;
    }

    if (req.file.mimetype !== 'text/csv') {
      res.status(400).send('Uploaded file is not a CSV.');
      return;
    }

    const vlEntries = []; // Initialize an array to store vl entries
    const indices = []; // Initialize an array to store indice entries
    const promises = []; // Initialize an array to store promises

    fs.createReadStream(req.file.path)
      .pipe(csv({ separator: ';' })) // Utilisez le séparateur correct pour le fichier CSV
      .on('headers', (headers) => {
        console.log('Headers:', headers); // Affiche les en-têtes pour vérifier leur structure
      })
      .on('data', (row) => {
        const promise = (async () => {
          console.log('Row:', row); // Affichez chaque ligne pour le débogage

          let fonds = await fond.findOne({
            where: {
              id: parseInt(req.params.id)
            },
          });

          if (!fonds) {
            console.error('Fund not found for id:', req.params.id);
            return;
          }

          const paireEUR = "EUR" + "/" + fonds.dev_libelle;
          const paireUSD = "USD" + "/" + fonds.dev_libelle;

          let exchangeRatesEUR = await devisedechanges.findOne({
            where: {
              date: { [Op.lte]: row.date }, // Chercher la date la plus proche inférieure ou égale
              paire: paireEUR,
            },
            order: [['date', 'DESC']] // Tri par date descendant
          });

          let exchangeRatesUSD = await devisedechanges.findOne({
            where: {
              date: { [Op.lte]: row.date }, // Chercher la date la plus proche inférieure ou égale
              paire: paireUSD,
            },
            order: [['date', 'DESC']] // Tri par date descendant
          });

          let vlEntry = {
            fund_id: parseInt(req.params.id),
            date: row.date,
            code_ISIN:fonds.code_ISIN,
            indRef: null,
            indRef_EUR: null,
            indRef_USD: null
          };

          let indiceEntry = {
            date: row.date,
            valeur: null,
            id_indice: row.nom,
            type_indice_id: 1,
          };

          if ('indRef' in row && exchangeRatesEUR && exchangeRatesUSD) {
            indiceEntry.valeur = parseFloat(row.indRef);
            vlEntry.indRef = parseFloat(row.indRef);
            vlEntry.indRef_EUR = parseFloat(row.indRef) * exchangeRatesEUR.value;
            vlEntry.indRef_USD = parseFloat(row.indRef) * exchangeRatesUSD.value;
          }

          console.log(vlEntry); // Affichez l'entrée VL pour le débogage

          const existingVLEntry = await vl.findOne({
            where: {
              date: row.date,
              fund_id: parseInt(req.params.id)
            }
          });

          if (existingVLEntry) {
            // Si une entrée existante est trouvée, mettez-la à jour
            await vl.update(vlEntry, {
              where: {
                date: row.date,
                fund_id: parseInt(req.params.id)
              }
            });
          } else {
            // Si aucune entrée existante n'est trouvée, créez-en une nouvelle
            vlEntries.push(vlEntry);
          }

          //TODO const existingIndiceEntry = await indice.findOne({
          //   where: {
          //     date: row.date,
          //     id_indice: row.nom,
          //   }
          // });

          // if (existingIndiceEntry) {
          //   // Si une entrée existante est trouvée, mettez-la à jour
          //   await indice.update(indiceEntry, {
          //     where: {
          //       date: row.date,
          //       id_indice: row.nom,
          //     }
          //   });
          // } else {
          //   // Si aucune entrée existante n'est trouvée, créez-en une nouvelle
          //   indices.push(indiceEntry);
          // }
        })();

        promises.push(promise);
      })
      .on('end', async () => {
        try {
          // Attendre que toutes les promesses soient résolues
          await Promise.all(promises);

          // Sauvegardez les entrées VL et indices dans la base de données
          if (vlEntries.length > 0) {
            await vl.bulkCreate(vlEntries);
          }
          // if (indices.length > 0) {
          //   await indice.bulkCreate(indices);
          // }

          // Supprimez le fichier temporaire
          fs.unlinkSync(req.file.path);

          res.status(200).send('File uploaded and data saved successfully.');
        } catch (error) {
          console.error('Database error:', error);
          res.status(500).send('Error saving data to the database.');
        }
      })
      .on('error', (error) => {
        console.error('Error reading CSV file:', error);
        res.status(500).send('Error processing the file.');
      });
  });

  /**
  * @swagger
  * /api/comparaison/{fund_id}:
  *   get:
  *     tags:
  *       - Derniere Valeur Liquidative
  *     summary: Retrieve the last value and date for a specific record.
  *     description: Retrieve the last liquidation value and date for a specific record.
  *     parameters:
  *       - name: fund_id
  *         in: path
  *         description: The fund_id of the record.
  *         required: true
  *         schema:
  *           type: string
  *     responses:
  *       200:
  *         description: Successful response containing the last value and date.
  *         content:
  *           application/json:
  *             schema:
  *               type: object
  *               properties:
  *                 code:
  *                   type: integer
  *                   example: 200
  *                 data:
  *                   type: object
  *                   properties:
  *                     lastValue:
  *                       type: number
  *                       format: double
  *                       example: 123.45
  *                       description: The last liquidation value.
  *                     lastDate:
  *                       type: string
  *                       format: date
  *                       example: "2023-09-02"
  *                       description: The date corresponding to the last value.
  */
  app.get('/api/comparaison', async (req, res) => {
    const selectedValues = req.query.query;

    if (!selectedValues) {
      return res.status(400).json({ error: 'Le paramètre query est manquant.' });
    }


    const valuesArray = selectedValues.split(',');
    const promessesDB = valuesArray.map((value) => {
      return fond.findByPk(value)
        .then((fond) => {
          if (fond) {
            return fond.toJSON();
          } else {
            return { error: `Aucun élément trouvé pour l'ID ${value}` };
          }
        })
        .catch((error) => {
          console.error('Erreur lors de la recherche en base de données :', error);
          return { error: 'Erreur lors de la recherche en base de données.' };
        });
    });
    // Créez un tableau de promesses pour les appels à l'API externe initiale
    const promessesAPI = valuesArray.map((value) => {
      // Effectuez une requête à l'API externe initiale pour chaque élément
      return fetch(`${urll}/api/performancescomparaison/fond/${value}`)
        .then((response) => response.json())
        .catch((error) => {
          console.error('Erreur lors de l\'appel à l\'API externe :', error);
          // Vous pouvez gérer l'erreur ici si nécessaire
          return { error: 'Erreur lors de l\'appel à l\'API externe.' };
        });
    });

    // Utilisez Promise.all pour attendre que toutes les requêtes se terminent
    Promise.all([Promise.all(promessesDB), Promise.all(promessesAPI)])
      .then(async ([dbResults, apiResults]) => {
        // dbResults contient les éléments trouvés en base de données
        // apiResults contient les réponses de l'API externe initiale

        // Vous pouvez maintenant combiner les données des deux sources comme nécessaire
        const funds = valuesArray.map((value, index) => ({
          id: value,
          fundData: dbResults[index],
          firstData: apiResults[index],
        }));





        const fundsWithGraphData = await Promise.all(funds.map(async (fund) => {
          const response = await vl.findAll({
            where: {
              fund_id: fund.id,
            },
            order: [['date', 'ASC']],
          });

          /* const graphs = response.map((data) => ({
             dates: moment(data.date).format('YYYY-MM-DD'),
             values: data.value, // Remplacez avec la propriété correcte de l'objet
             valuesInd: data.indRef,
           }));*/
          const graphs = response.map(data => {
            if (data.value !== null && data.indRef !== null) {
              return {
                dates: moment(data.date).format('YYYY-MM-DD'), // Remplacez avec la propriété correcte de l'objet
                values: data.value, // Remplacez avec la propriété correcte de l'objet
                valuesInd: data.indRef,
              };
            } else {
              return null; // Ignorer les lignes où la condition n'est pas satisfaite
            }
          }).filter(Boolean); // Supprimer les valeurs nulles de l'array

          // Ajoutez la propriété graphData à l'objet fund
          return {
            ...fund,
            graphData: graphs,
          };
        }));
        // Effectuez une nouvelle série d'appels à une deuxième API pour chaque élément
        const promessesAPI2 = funds.map((fund) => {
          // Effectuez une requête à la deuxième API pour chaque élément
          return fetch(`${urll}/api/ratios/1/${fund.id}`)
            .then((response) => response.json())
            .catch((error) => {
              console.error('Erreur lors de l\'appel à la deuxième API :', error);
              // Vous pouvez gérer l'erreur ici si nécessaire
              return { error: 'Erreur lors de l\'appel à la deuxième API.' };
            });
        });

        // Utilisez Promise.all pour attendre que toutes les requêtes à la deuxième API se terminent
        Promise.all(promessesAPI2)
          .then((results2) => {
            // Combinez les données de l'API externe initiale avec les données de la deuxième API
            const fundsWithSecondData = fundsWithGraphData.map((fund, index) => ({
              ...fund,
              secondData: results2[index], // Données de la deuxième API
              graphData: fund.graphData, // Conservez la propriété graphData
            }));

            // Effectuez une nouvelle série d'appels à une troisième API pour chaque élément
            const promessesAPI3 = fundsWithSecondData.map((fund) => {
              // Effectuez une requête à la troisième API pour chaque élément
              return fetch(`${urll}/api/ratios/3/${fund.id}`)
                .then((response) => response.json())
                .catch((error) => {
                  console.error('Erreur lors de l\'appel à la troisième API :', error);
                  // Vous pouvez gérer l'erreur ici si nécessaire
                  return { error: 'Erreur lors de l\'appel à la troisième API.' };
                });
            });

            // Utilisez Promise.all pour attendre que toutes les requêtes à la troisième API se terminent
            Promise.all(promessesAPI3)
              .then((results3) => {
                // Combinez les données des API précédentes avec les données de la troisième API
                const fundsWithThirdData = fundsWithSecondData.map((fund, index) => ({
                  ...fund,
                  thirdData: results3[index], // Données de la troisième API
                  graphData: fund.graphData, // Conservez la propriété graphData
                }));

                // Effectuez une nouvelle série d'appels à une quatrième API pour chaque élément
                const promessesAPI4 = fundsWithThirdData.map((fund) => {
                  // Effectuez une requête à la quatrième API pour chaque élément
                  return fetch(`${urll}/api/ratios/5/${fund.id}`)
                    .then((response) => response.json())
                    .catch((error) => {
                      console.error('Erreur lors de l\'appel à la quatrième API :', error);
                      // Vous pouvez gérer l'erreur ici si nécessaire
                      return { error: 'Erreur lors de l\'appel à la quatrième API.' };
                    });
                });

                // Utilisez Promise.all pour attendre que toutes les requêtes à la quatrième API se terminent
                Promise.all(promessesAPI4)
                  .then((results4) => {
                    // Combinez les données des API précédentes avec les données de la quatrième API
                    const fundsWithFourthData = fundsWithThirdData.map((fund, index) => ({
                      ...fund,
                      fourthData: results4[index], // Données de la quatrième API
                      graphData: fund.graphData, // Conservez la propriété graphData
                    }));
                    console.log(fundsWithGraphData);
                    console.log(fundsWithSecondData);
                    console.log(fundsWithThirdData);

                    // console.log(fundsWithFourthData);
                    res.json({
                      code: 200,
                      data: {
                        funds: fundsWithFourthData,
                      },
                    });
                  });
              });
          })
      })


      .catch((error) => {
        console.error('Erreur lors de la récupération des données :', error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des données.' });
      });
  });



// Route d'upload de fichier avec paramètres (par exemple, `societe`)
app.post('/api/uploadsocietefilenew/:societe', upload.single('file'), async (req, res) => {
  const file = req.file;
  const societe = req.params.societe;

  if (!file) {
    return res.status(400).send('Aucun fichier téléchargé.');
  }

  try {
    console.log('Path du fichier :', file.path);

    // Vérifier l'existence du fichier
    if (!fs.existsSync(file.path)) {
      return res.status(400).send('Le fichier n\'existe pas.');
    }

    let workbook;
    try {
      // Lecture du fichier Excel
      workbook = xlsx.readFile(file.path);
    } catch (error) {
      console.error('Erreur lors de la lecture du fichier Excel :', error);
      return res.status(500).send('Erreur lors de la lecture du fichier Excel : ' + error.message);
    }

    // Afficher le nom des feuilles du fichier Excel
    console.log('Feuilles dans le fichier Excel :', workbook.SheetNames);

    // Extraction de la feuille "Data Statiques des fonds"
    const fondsSheet = workbook.Sheets['Fonds'];
    const societesSheet = workbook.Sheets['Societe de gestion'];
    const personnelSheet = workbook.Sheets['Personnels'];


    if (!fondsSheet) {
      return res.status(400).send('Feuille "Data Statiques des fonds" non trouvée.');
    }
    if (!societesSheet) {
      return res.status(400).send('Feuille "Data Statiques societes de gestion" non trouvée.');
    }
    if (!personnelSheet) {
      return res.status(400).send('Feuille "Data Statiques personnels" non trouvée.');
    }

    // Conversion de la feuille "Data Statiques des fonds" en JSON
    const fondsData = xlsx.utils.sheet_to_json(fondsSheet, { header: 2 }); // Lignes de fonds à partir de la ligne 3
    const societesData = xlsx.utils.sheet_to_json(societesSheet, { header: 2 });
    const personnelsData = xlsx.utils.sheet_to_json(personnelSheet, { header: 2 });

    // Correspondance des colonnes de la feuille avec les colonnes de la BD
    const fondsEntries = fondsData.map(row => ({
      nom_fond: row['nom_du fonds'],
      pays: row['pays'],
      regulateur: row['code_régulateur'],
      periodicite: row['periodicite de valorisation'],
      structure_fond: row['structure_du_fonds'],
      code_ISIN: row['code_ISIN_du fonds'],
      date_creation: row['Date_de_Lancement_du fonds'],
      dev_libelle: row['Libellé de la devise'],
      societe_gestion: row['Nom_societe_gestion'],
      categorie_libelle: row['Nom_societe_gestion'],
      classification: row['Nom_societe_gestion'],
      type_investissement: row['Nom_societe_gestion'],
      nom_gerant: row['nom_gerant'],
      categorie_globale: row["Catégorie/classe d'actifs"],
      categorie_national: row['Nom_societe_gestion'],
      categorie_regional: row['Nom_societe_gestion'],
      frais_gestion: row["Frais de gestion (%)"],
      frais_souscription: row['Nom_societe_gestion'],
      frais_entree: row["frais_d'entrée(%)"],
      frais_sortie: row["Frais de sortie(%)"],
      minimum_investissement: row['minimum_investissement'],
      affectation: row['affectation des dividendes'],
      frais_rachat: row['Nom_societe_gestion'],
      description: row['Description du fonds'],
      strategie_politique_invest: row["Stratégie d'investissement"],
      philosophie_fond: row["Philosophie d'investissement"],
      //  horizonplacement: row['Nom_societe_gestion'],
      date_agrement: row['Date de visa du fonds (agrément)'],
      date_premiere_vl: row['date_publication_première_vl'],
      active: row['Nom_societe_gestion'],
      depositaire: row['depositaire'],
      teneur_registre: row['teneur_registre'],
      valorisateur: row['valorisateur'],
      centralisateur: row['centralisateur'],
      agent_transfert: row['agent_transfert'],
      agent_payeur: row['agent_payeur'],
      numero_agrement: row['numero_agrement_du fonds'],
      montant_premier_vl: row['montant_de la première Vl'],
      montant_actif_net: row['montant_actif_net_initial'],
      duree_investissement_recommande: row['duree_investissement_recommandée'],
      date_cloture: row["date_cloture_de l'exercice annuel du fonds"],
      heure_cutt_off: row['heure_cutt_off'],
      delai_reglement: row['delai_reglement_Livraison'],
      souscripteur: row['Nom_societe_gestion'],
      datejour: row['Nom_societe_gestion'],
      IBAN: row['IBAN du fonds'],
      RIB: row['RIB du fonds'],
      banque: row['nom de la banque (compte cash du fonds)'],
      nombre_part: row['Nombre de part'],
      horizonplacement: row["Horizon d'investissement"],
      indice_benchmark: row['Nom du Benchmark']
    
    }));

    console.log('Données extraites de "Data Statiques des fonds" :', fondsEntries);

    // Insérer ou mettre à jour les données des fonds dans la table `fonds`
    await fond.bulkCreate(fondsEntries, { updateOnDuplicate: ['code_ISIN'] });

    // Insérer ou mettre à jour les données de la société de gestion
    const societesEntries = societesData.map(row => ({
      nom: row['Nom_societe_gestion'],
      pays: row['Pays'],
      description: row['Presentation'],
     // tel: row['adresse societe_gestion'],
      site_web: row['Site web société de gestion'],
      email: row['adresse email'],
      tel: row['numero de telephone'],
      dateimmatriculation: row['Date Immatriculation'],
      numeroagrement: row['Numero agrement'],

    }));

    console.log('Données extraites de "Data Statiques societes de gestion" :', societesEntries);

    await societe.update(societesEntries[0], { where: { nom: societe } });

// Insérer ou mettre à jour les données de la société de gestion
const personnelsEntries = personnelsData.map(row => ({
    nom: row['Nom'],
      prenom: row['Prenoms'],
      numero: row['Numero'],
      email: row['Email'],
      fonction: row['Fonction'],
      activite: row['Activité'],
      societe: row['Nombre de part']
     
    
    }));

    console.log('Données extraites de "Data Statiques des fonds" :', personnelsEntries);

    // Insérer ou mettre à jour les données des fonds dans la table `fonds`
    await personnel.bulkCreate(personnelsEntries, { updateOnDuplicate: ['email'] });

    // Nombre de fonds dans la feuille "Data Statiques des fonds"
    const fondsCount = fondsEntries.length;

    // Boucler sur chaque feuille "VL Fonds n" de manière dynamique
    for (let i = 1; i <= fondsCount; i++) {
      const sheetName = `VL Fonds ${i}`;
      const vlSheet = workbook.Sheets[sheetName];

      if (!vlSheet) {
        console.warn(`Feuille "${sheetName}" non trouvée. Ignorer.`);
        continue; // Passer si la feuille n'existe pas
      }

      // Extraire les données de la feuille "VL Fonds n"
      const vlData = xlsx.utils.sheet_to_json(vlSheet, { header: 2 });

      console.log(`Données extraites de la feuille "${sheetName}" :`, vlData);

      // Correspondance des colonnes de la feuille VL avec les colonnes de la BD `valorisations`
      const vlEntries = vlData.map(row => ({
        fund_id: i, // ID du fond correspondant à la ligne dans "Data Statiques des fonds"
        value: row['Valeur liquidative'],
        dividende:row['montant du dividende'],
        date: row['dates de valorisation'],
        actif_net: row['actif_net_du fonds'],
        code_ISIN:row["code_ISIN ou Code unique du fonds"],
        souscription: row['Souscription'],
        ind_ref: row['Niveau du benchmark'],
      }));

      // Insertion des valorisations pour chaque fond
      await vl.bulkCreate(vlEntries);
    }

    res.send('Données insérées et mises à jour avec succès.');
  } catch (error) {
    console.error('Erreur lors du traitement des données :', error);
    res.status(500).send('Erreur lors du traitement des données : ' + error.message);
  }
});



  async function getTransactionData(portefeuilleId) {
    try {
      const transactions = await transaction.findAll({
        where: {
          portefeuille_id: portefeuilleId
        },
        order: [
          ['date', 'ASC']
        ]
      });
      return transactions;
    } catch (error) {
      throw new Error("Erreur lors de la récupération des transactions : " + error.message);
    }
  }

  app.get('/api/ratiosportefeuille/:year/:id', async (req, res) => {
    // Récupérer les taux_sans_risques en fonction des valeurs de la table fond
    const tauxSansRisques = await tsr.findAll({
      attributes: ['valeur', 'valeur2', 'semaine', 'rate', 'date', 'pays'],
      where: {
        // Ajoutez les conditions spécifiques en fonction de votre logique
        pays: "Nigeria",
      },
    });

    const transactionDatas = await getTransactionData(req.params.id);



    await portefeuille_vl_cumul.findAll({
      where: {
        portefeuille_id: req.params.id
      },
      order: [
        ['date', 'DESC'] // Modification ici pour trier par date en ordre décroissant
      ]
    })
      .then(async (response) => {

        // const tauxsr=0.03;-0.0116;-0,0234
        //const tauxsr = -0.0234;
        const tauxsr = 0.03
        // const tauxacc = -0.00473;
        const tauxacc = 0.02;

        // Valeurs liquidatives
        const values = response.map((data) => data.base_100_bis);
        const dates = response.map((data) => moment(data.date).format('YYYY-MM-DD'));
        //  const dates = response.map((data) => moment(data.date).format('YYYY-MM-DD'));
        const valuesindifref = response.map((data) => data.base_100_bis);


        const lastValue = values[dates.indexOf(findLastDateOfPreviousMonth(dates))];
        const lastValueInd = valuesindifref[dates.indexOf(findLastDateOfPreviousMonth(dates))];


        // Dernière date du mois précédent
        const lastPreviousDate = findLastDateOfPreviousMonth(dates)

        const yArrayValuesnew = values.slice(dates.indexOf(lastPreviousDate), dates.length - 1);
        const yArrayDatesnew = dates.slice(dates.indexOf(lastPreviousDate), dates.length - 1);
        const yArrayValuesindifrefnew = values.slice(dates.indexOf(lastPreviousDate), dates.length - 1);

        const donneesarray = [];
        const donneesarrayindref = [];

        for (let i = 0; i < yArrayValuesnew.length; i++) {
          const date = yArrayDatesnew[i];
          const value = yArrayValuesnew[i];

          donneesarray.push({ date, value });
        }

        for (let i = 0; i < yArrayValuesindifrefnew.length; i++) {
          const date = yArrayDatesnew[i];
          const value = yArrayValuesindifrefnew[i];

          donneesarrayindref.push({ date, value });
        }




        //si le nombre de rendements de l'indice
        if (req.params.year === "1") {
          let donneesGroupéesSS = grouperParSemaine(donneesarray);
          let donneesGroupéesindice = grouperParSemaine(donneesarrayindref);

          let donneesGroupéesSSjour = grouperParJour(donneesarray);
          let donneesGroupéesindicejour = grouperParJour(donneesarrayindref);

          let donneesGroupéesSSmois = grouperParMois(donneesarray);
          let donneesGroupéesindicemois = grouperParMois(donneesarrayindref);


          // Calcul de la volatilité pour différentes périodes
          let endDate = moment(lastPreviousDate);
          let periods = {
            '1_an': findNearestDatetoyear(dates, 1, endDate),

          };
          let tauxensemainefilte = {};

          let volatilites = {};
          let volatilitesind = {};
          let rendementsTableau = {};
          let rendementsTableauindice = {};

          let volatilitesjour = {};
          let volatilitesindjour = {};
          let rendementsTableaujour = {};
          let rendementsTableauindicejour = {};


          let volatilitesmois = {};
          let volatilitesindmois = {};
          let rendementsTableaumois = {};
          let rendementsTableauindicemois = {};
          let Vls = [];
          let Vlsindice = [];
          for (let [periode, dateDebut] of Object.entries(periods)) {
            console.log(donneesGroupéesSSjour);

            let donneesPeriodesemaine = donneesGroupéesSS.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicesemaine = donneesGroupéesindice.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            //let donneestauxPeriodesemaine = tableauDonneestsr.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let donneesPeriodejour = donneesGroupéesSSjour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicejour = donneesGroupéesindicejour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            for (let i = 0; i <= donneesPeriodejour.length - 1; i++) {
              Vls.push(donneesPeriodejour[i].value)
            }
            for (let i = 0; i <= donneesPeriodeindicejour.length - 1; i++) {
              Vlsindice.push(donneesPeriodeindicejour[i].value)
            }
            let donneesPeriodemois = donneesGroupéesSSmois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicemois = donneesGroupéesindicemois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let rendementsPeriode = calculerRendements(donneesPeriodesemaine);
            let rendementsPeriodeindice = calculerRendements(donneesPeriodeindicesemaine);
            rendementsTableau[periode] = rendementsPeriode;
            rendementsTableauindice[periode] = rendementsPeriodeindice;

            volatilites[periode] = calculerVolatilite(rendementsPeriode);
            volatilitesind[periode] = calculerVolatilite(rendementsPeriodeindice);

            let rendementsPeriodejour = calculerRendements(donneesPeriodejour);
            let rendementsPeriodeindicejour = calculerRendements(donneesPeriodeindicejour);
            rendementsTableaujour[periode] = rendementsPeriodejour;
            rendementsTableauindicejour[periode] = rendementsPeriodeindicejour;

            volatilitesjour[periode] = calculerVolatilitejour(rendementsPeriodejour);
            volatilitesindjour[periode] = calculerVolatilitejour(rendementsPeriodeindicejour);

            let rendementsPeriodemois = calculerRendements(donneesPeriodemois);
            let rendementsPeriodeindicemois = calculerRendements(donneesPeriodeindicemois);
            rendementsTableaumois[periode] = rendementsPeriodemois;
            rendementsTableauindicemois[periode] = rendementsPeriodeindicemois;

            volatilitesmois[periode] = calculerVolatilitemois(rendementsPeriodemois);
            volatilitesindmois[periode] = calculerVolatilitemois(rendementsPeriodeindicemois);
            //tauxensemainefilte = donneestauxPeriodesemaine;
          }

          if (rendementsTableau['1_an'].length > 0) {

            const yDate = findNearestDateAnnualized(dates, 1, lastPreviousDate)

            const portfolioReturns = rendementsTableau['1_an']

            const benchmarkReturns = rendementsTableauindice['1_an'];
            const CAGR = calculerCAGR(values[dates.indexOf(findNearestDateAnnualized(dates, 1, findLastDateOfPreviousMonth(dates)))], lastValue, 1)

            //  const varindice = calculateVariance([...rendementsTableauindice['1_an']]);
            //  const cov = calculateCovariance(rendementsTableau['1_an'], [...rendementsTableauindice['1_an']])
            const perfAnnualisee = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDateAnnualized(dates, 1, findLastDateOfPreviousMonth(dates)))], 1);
            const perfAnnualiseeInd = calculateAnnualizedPerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDateAnnualized(dates, 1, findLastDateOfPreviousMonth(dates)))], 1);

            const info = calculateInformationRatio([...rendementsTableau['1_an']], [...rendementsTableauindice['1_an']])
            const infojour = calculateInformationRatiojour([...rendementsTableaujour['1_an']], [...rendementsTableauindicejour['1_an']])
            const infomois = calculateInformationRatio([...rendementsTableaumois['1_an']], [...rendementsTableauindicemois['1_an']])

            // const info= calculateInformationRationew(portfolioReturns,benchmarkReturns)* Math.sqrt(52);
            const beta = calculateBetanew(rendementsTableau['1_an'], rendementsTableauindice['1_an'])
            const betajour = calculateBetanew(rendementsTableaujour['1_an'], rendementsTableauindicejour['1_an'])
            const betamois = calculateBetanew(rendementsTableaumois['1_an'], rendementsTableauindicemois['1_an'])

            const VAR95 = calculateVAR95([...rendementsTableau["1_an"]], 0.95);
            const VAR95jour = calculateVAR95([...rendementsTableaujour["1_an"]], 0.95);
            const VAR95mois = calculateVAR95([...rendementsTableaumois["1_an"]], 0.95);

            const VAR99 = calculateVAR99([...rendementsTableau["1_an"]], 0.99)
            const VAR99jour = calculateVAR99([...rendementsTableaujour["1_an"]], 0.99)
            const VAR99mois = calculateVAR99([...rendementsTableaumois["1_an"]], 0.99)

            const skewness = calculerSkewness([...rendementsTableau["1_an"]], volatilites["1_an"])
            const skewnessjour = calculerSkewness([...rendementsTableaujour["1_an"]], volatilitesjour["1_an"])
            const skewnessmois = calculerSkewness([...rendementsTableaumois["1_an"]], volatilitesmois["1_an"])


            const kurtosis = calculateKurtosis([...rendementsTableau["1_an"]])
            const kurtosisjour = calculateKurtosis([...rendementsTableaujour["1_an"]])
            const kurtosismois = calculateKurtosis([...rendementsTableaumois["1_an"]])

            const maxDrawdown = calculateMaxDrawdown(Vls.reverse())
            const maxDrawdownInd = calculateMaxDrawdown(Vlsindice.reverse())
            const dsr = calculerDSRAnnualise([...rendementsTableau["1_an"]], 0.01)
            const dsrjour = calculerDSRAnnualise([...rendementsTableaujour["1_an"]], 0.01)
            const dsrmois = calculerDSRAnnualise([...rendementsTableaumois["1_an"]], 0.01)

            const omega = calculateOmegaRatio([...rendementsTableau["1_an"]], 0);
            const omegajour = calculateOmegaRatio([...rendementsTableaujour["1_an"]], 0);
            const omegamois = calculateOmegaRatio([...rendementsTableaumois["1_an"]], 0);

            const calmar = calculateCalmarRatio(maxDrawdown, CAGR)

            const sortino = calculateSortinoRatio([...rendementsTableau["1_an"]], tauxacc, 0.01);
            const sortinojour = calculateSortinoRatio([...rendementsTableaujour["1_an"]], tauxacc, 0.01);
            const sortinomois = calculateSortinoRatio([...rendementsTableaumois["1_an"]], tauxacc, 0.01);

            const betaBaiss = calculateDownsideBeta([...rendementsTableau["1_an"]], [...rendementsTableauindice["1_an"]])
            const betaBaissjour = calculateDownsideBeta([...rendementsTableaujour["1_an"]], [...rendementsTableauindicejour["1_an"]])
            const betaBaissmois = calculateDownsideBeta([...rendementsTableaumois["1_an"]], [...rendementsTableauindicemois["1_an"]])

            const betaHaussier = calculateHaussierBeta([...rendementsTableau["1_an"]], [...rendementsTableauindice["1_an"]])
            const betaHaussierjour = calculateHaussierBeta([...rendementsTableaujour["1_an"]], [...rendementsTableauindicejour["1_an"]])
            const betaHaussiermois = calculateHaussierBeta([...rendementsTableaumois["1_an"]], [...rendementsTableauindicemois["1_an"]])

            const trackingError = calculateTrackingError([...rendementsTableau["1_an"]], [...rendementsTableauindice["1_an"]])
            const trackingErrorjour = calculateTrackingError([...rendementsTableaujour["1_an"]], [...rendementsTableauindicejour["1_an"]])
            const trackingErrormois = calculateTrackingError([...rendementsTableaumois["1_an"]], [...rendementsTableauindicemois["1_an"]])

            const DownCaptureRatio = calculateDownCaptureRatio([...rendementsTableau["1_an"]], [...rendementsTableauindice["1_an"]])
            const DownCaptureRatiojour = calculateDownCaptureRatio([...rendementsTableaujour["1_an"]], [...rendementsTableauindicejour["1_an"]])
            const DownCaptureRatiomois = calculateDownCaptureRatio([...rendementsTableaumois["1_an"]], [...rendementsTableauindicemois["1_an"]])

            const UpCaptureRatio = calculateUpCaptureRatio([...rendementsTableau["1_an"]], [...rendementsTableauindice["1_an"]])
            const UpCaptureRatiojour = calculateUpCaptureRatio([...rendementsTableaujour["1_an"]], [...rendementsTableauindicejour["1_an"]])
            const UpCaptureRatiomois = calculateUpCaptureRatio([...rendementsTableaumois["1_an"]], [...rendementsTableauindicemois["1_an"]])

            // const dsr = calculerDSRAnnualise([...rendementsTableau["1_an"]], 0) 

            const delaiRecouvrement = calculerDelaiRecouvrementFonds(Vls.reverse());


            // const ratioSharpe = calculateSharpeRatio(rendementsTableau["1_an"], 0.000751923)
            const ratioSharpe = (CAGR - tauxsr) / volatilites["1_an"];
            const ratioSharpejour = (CAGR - tauxsr) / volatilitesjour["1_an"];
            const ratioSharpemois = (CAGR - tauxsr) / volatilitesmois["1_an"];

            const correlation = quants.corrcoef([...rendementsTableau["1_an"]], [...rendementsTableauindice["1_an"]], 0)
            const correlationjour = quants.corrcoef([...rendementsTableaujour["1_an"]], [...rendementsTableauindicejour["1_an"]], 0)
            const correlationmois = quants.corrcoef([...rendementsTableaumois["1_an"]], [...rendementsTableauindicemois["1_an"]], 0)

            // const r2 = quants.linreg([...rendementsTableau["1_an"]], [...rendementsTableauindice["1_an"]]).rsq
            const r2 = calculerR2([...rendementsTableau["1_an"]], [...rendementsTableauindice["1_an"]])
            const r2jour = calculerR2([...rendementsTableaujour["1_an"]], [...rendementsTableauindicejour["1_an"]])
            const r2mois = calculerR2([...rendementsTableaumois["1_an"]], [...rendementsTableauindicemois["1_an"]])



            res.json({
              code: 200,
              data: {

                volatility: volatilites["1_an"] * 100,
                volatilityjour: volatilitesjour["1_an"] * 100,
                volatilitymois: volatilitesmois["1_an"] * 100,
                volatilityInd: volatilitesind["1_an"] * 100,
                volatilityIndjour: volatilitesindjour["1_an"] * 100,
                volatilityIndmois: volatilitesindmois["1_an"] * 100,
                beta,
                betajour,
                betamois,
                perfAnnualisee: perfAnnualisee * 100,
                CAGR,
                perfAnnualiseeInd: perfAnnualiseeInd * 100,
                info,
                infojour: infojour,
                infomois: infomois,
                r2,
                r2jour,
                r2mois,
                // skewness,
                correlation,
                correlationjour,
                correlationmois,
                omega,
                omegajour,
                omegamois,
                sortino,
                sortinojour,
                sortinomois,
                calmar,

                // volatilityInd,
                maxDrawdown: -maxDrawdown * 100,
                maxDrawdownInd: -maxDrawdownInd * 100,
                dsr,
                dsrjour,
                dsrmois,
                ratioSharpe,
                ratioSharpejour,
                ratioSharpemois,
                // kurtosis,
                // betaHaussier,
                // betaBaiss,
                VAR95: VAR95 * 100,
                VAR95jour: VAR95jour * 100,
                VAR95jour: VAR95mois * 100,
                trackingError: trackingError * 100,
                trackingErrorjour: trackingErrorjour * 100,
                trackingErrorjour: trackingErrormois * 100,

                VAR99: VAR99 * 100,
                VAR99jour: VAR99jour * 100,
                VAR99mois: VAR99mois * 100,

                delaiRecouvrement,
                betaHaussier,
                betaHaussierjour,
                betaHaussiermois,

                betaBaiss,
                betaBaissjour,
                betaBaissmois,

                UpCaptureRatio,
                UpCaptureRatiojour,
                UpCaptureRatiomois,

                DownCaptureRatio,
                DownCaptureRatiojour,
                DownCaptureRatiomois,

                skewness,
                skewnessjour,
                skewnessmois,

                kurtosis,
                kurtosisjour,
                kurtosismois,


                // dd: (perfAnnualisee - perfAnnualiseeInd)
                // delaiRecouvrementInd
              }
            })
          } else {
            res.json({
              code: 200,
              data: {
                volatility: '-',
                volatilityInd: '-',
                beta: '-',
                perfAnnualisee: '-',
                perfAnnualiseeInd: '-',
                info: '-',
                r2: '-',
                // skewness,
                correlation: '-',
                omega: '-',
                sortino: '-',
                calmar: '-',
                // volatilityInd,
                maxDrawdown: '-',
                maxDrawdownInd: '-',
                dsr: '-',
                ratioSharpe: '-',
                // kurtosis,
                betaHaussier: '-',
                betaBaiss: '-',
                VAR95: '-',
                trackingError: '-',
                VAR99: '-',
                /* delaiRecouvrement,
                 betaHaussier,*/
                // betaBaiss:'-',
                /*  upCaptureRatio,
                  downCaptureRatio,*/
                // dd: (perfAnnualisee - perfAnnualiseeInd)
                // delaiRecouvrementInd
              }
            })
          }
        } else if (req.params.year === "3") {
          let donneesGroupéesSS = grouperParSemaine(donneesarray);
          let donneesGroupéesindice = grouperParSemaine(donneesarrayindref);

          let donneesGroupéesSSjour = grouperParJour(donneesarray);
          let donneesGroupéesindicejour = grouperParJour(donneesarrayindref);

          let donneesGroupéesSSmois = grouperParMois(donneesarray);
          let donneesGroupéesindicemois = grouperParMois(donneesarrayindref);


          // Calcul de la volatilité pour différentes périodes
          let endDate = moment(lastPreviousDate);
          let periods = {
            '3_ans': findNearestDatetoyear(dates, 3, endDate),


          };
          let tauxensemainefilte = {};

          let volatilites = {};
          let volatilitesind = {};
          let rendementsTableau = {};
          let rendementsTableauindice = {};

          let volatilitesjour = {};
          let volatilitesindjour = {};
          let rendementsTableaujour = {};
          let rendementsTableauindicejour = {};


          let volatilitesmois = {};
          let volatilitesindmois = {};
          let rendementsTableaumois = {};
          let rendementsTableauindicemois = {};


          let Vls = [];
          let Vlsindice = [];

          for (let [periode, dateDebut] of Object.entries(periods)) {
            console.log(donneesGroupéesSS);

            let donneesPeriodesemaine = donneesGroupéesSS.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicesemaine = donneesGroupéesindice.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            //let donneestauxPeriodesemaine = tableauDonneestsr.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let donneesPeriodejour = donneesGroupéesSSjour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicejour = donneesGroupéesindicejour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            for (let i = 0; i <= donneesPeriodejour.length - 1; i++) {
              Vls.push(donneesPeriodejour[i].value)
            }
            for (let i = 0; i <= donneesPeriodeindicejour.length - 1; i++) {
              Vlsindice.push(donneesPeriodeindicejour[i].value)
            }
            let donneesPeriodemois = donneesGroupéesSSmois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicemois = donneesGroupéesindicemois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let rendementsPeriode = calculerRendements(donneesPeriodesemaine);
            let rendementsPeriodeindice = calculerRendements(donneesPeriodeindicesemaine);
            rendementsTableau[periode] = rendementsPeriode;
            rendementsTableauindice[periode] = rendementsPeriodeindice;

            volatilites[periode] = calculerVolatilite(rendementsPeriode);
            volatilitesind[periode] = calculerVolatilite(rendementsPeriodeindice);

            let rendementsPeriodejour = calculerRendements(donneesPeriodejour);
            let rendementsPeriodeindicejour = calculerRendements(donneesPeriodeindicejour);
            rendementsTableaujour[periode] = rendementsPeriodejour;
            rendementsTableauindicejour[periode] = rendementsPeriodeindicejour;

            volatilitesjour[periode] = calculerVolatilitejour(rendementsPeriodejour);
            volatilitesindjour[periode] = calculerVolatilitejour(rendementsPeriodeindicejour);

            let rendementsPeriodemois = calculerRendements(donneesPeriodemois);
            let rendementsPeriodeindicemois = calculerRendements(donneesPeriodeindicemois);
            rendementsTableaumois[periode] = rendementsPeriodemois;
            rendementsTableauindicemois[periode] = rendementsPeriodeindicemois;

            volatilitesmois[periode] = calculerVolatilitemois(rendementsPeriodemois);
            volatilitesindmois[periode] = calculerVolatilitemois(rendementsPeriodeindicemois);
            //tauxensemainefilte = donneestauxPeriodesemaine;

          }
          //   if(rendementsTableau['3_an'].length>0){
          const yDate = findNearestDateAnnualized(dates, 3, lastPreviousDate)
          const CAGR = calculerCAGR(values[dates.indexOf(findNearestDateAnnualized(dates, 3, findLastDateOfPreviousMonth(dates)))], lastValue, 3)
          const portfolioReturns = rendementsTableau['3_ans']

          const benchmarkReturns = rendementsTableauindice['3_ans'];
          const perfAnnualisee = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDateAnnualized(dates, 3, findLastDateOfPreviousMonth(dates)))], 3);
          const perfAnnualiseeInd = calculateAnnualizedPerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDateAnnualized(dates, 3, findLastDateOfPreviousMonth(dates)))], 3);
          //  const varindice = calculateVariance([...rendementsTableauindice['3_ans']]);
          //  const cov = calculateCovariance(rendementsTableau['3_ans'], [...rendementsTableauindice['3_ans']])
          /*
                  const info= calculateInformationRatio([...rendementsTableau['3_ans']], [...rendementsTableauindice['3_ans']])
                  const infojour= calculateInformationRatiojour([...rendementsTableaujour['3_ans']], [...rendementsTableauindicejour['3_ans']])
          
                  // const info= calculateInformationRationew(portfolioReturns,benchmarkReturns)* Math.sqrt(52);
                  const beta=calculateBeta(rendementsTableau['3_ans'], rendementsTableauindice['3_ans'])
                  const VAR95 = calculateVAR95([...rendementsTableau["3_ans"]], 0.95);
                  const VAR99 = calculateVAR99([...rendementsTableau["3_ans"]], 0.99);
                
                console.log(valuesindifref.slice((dates.indexOf(lastPreviousDate)),dates.indexOf(yDate)  + 1))
                  const maxDrawdown = calculateMaxDrawdown(Vls.reverse())
                  const maxDrawdownInd = calculateMaxDrawdown(Vlsindice.reverse())
                  const dsr = calculerDSRAnnualise([...rendementsTableau["3_ans"]], 0)
                  const omega = calculateOmegaRatio([...rendementsTableau["3_ans"]], 0);
                  const calmar = calculateCalmarRatio(maxDrawdown,CAGR)
                  const sortino = calculateSortinoRatio([...rendementsTableau["3_ans"]],-0.00473,  0.01);
                  const betaBaiss = calculateDownsideBeta([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]])
                  const betaHaussier = calculateHaussierBeta([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]])
                  const trackingError = calculateTrackingError([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]]) 
                  const DownCaptureRatio = calculateDownCaptureRatio([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]]) 
                  const UpCaptureRatio = calculateUpCaptureRatio([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]]) 
                  const delaiRecouvrement=calculerDelaiRecouvrementFonds(Vls.reverse());
          
                  
          
          
                  //const ratioSharpe = calculateSharpeRatio(rendementsTableau["3_ans"], -0.00473)
                //  const ratioSharpe = calculateSharpeRatio(rendementsTableau["3_ans"], 0.000751923)
                  const ratioSharpe = (CAGR- tauxsr)/volatilites["3_ans"];
          
                  const correlation = quants.corrcoef([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]], 0)
                  
                 // const r2 = quants.linreg([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]]).rsq
                  const r2 = calculerR2([...rendementsTableau["3_ans"]],[...rendementsTableauindice["3_ans"]])
          */
          const info = calculateInformationRatio([...rendementsTableau['3_ans']], [...rendementsTableauindice['3_ans']])
          const infojour = calculateInformationRatiojour([...rendementsTableaujour['3_ans']], [...rendementsTableauindicejour['3_ans']])
          const infomois = calculateInformationRatiojour([...rendementsTableaumois['3_ans']], [...rendementsTableauindicemois['3_ans']])

          // const info= calculateInformationRationew(portfolioReturns,benchmarkReturns)* Math.sqrt(52);
          const beta = calculateBetanew(rendementsTableau['3_ans'], rendementsTableauindice['3_ans'])
          const betajour = calculateBetanew(rendementsTableaujour['3_ans'], rendementsTableauindicejour['3_ans'])
          const betamois = calculateBetanew(rendementsTableaumois['3_ans'], rendementsTableauindicemois['3_ans'])

          const VAR95 = calculateVAR95([...rendementsTableau["3_ans"]], 0.95);
          const VAR95jour = calculateVAR95([...rendementsTableaujour["3_ans"]], 0.95);
          const VAR95mois = calculateVAR95([...rendementsTableaumois["3_ans"]], 0.95);

          const VAR99 = calculateVAR99([...rendementsTableau["3_ans"]], 0.99)
          const VAR99jour = calculateVAR99([...rendementsTableaujour["3_ans"]], 0.99)
          const VAR99mois = calculateVAR99([...rendementsTableaumois["3_ans"]], 0.99)

          const skewness = calculerSkewness([...rendementsTableau["3_ans"]], volatilites["3_ans"])
          const skewnessjour = calculerSkewness([...rendementsTableaujour["3_ans"]], volatilitesjour["3_ans"])
          const skewnessmois = calculerSkewness([...rendementsTableaumois["3_ans"]], volatilitesmois["3_ans"])

          const kurtosis = calculateKurtosis([...rendementsTableau["3_ans"]])
          const kurtosisjour = calculateKurtosis([...rendementsTableaujour["3_ans"]])
          const kurtosismois = calculateKurtosis([...rendementsTableaumois["3_ans"]])

          const maxDrawdown = calculateMaxDrawdown(Vls.reverse())
          const maxDrawdownInd = calculateMaxDrawdown(Vlsindice.reverse())
          const dsr = calculerDSRAnnualise([...rendementsTableau["3_ans"]], 0.01)
          const dsrjour = calculerDSRAnnualise([...rendementsTableaujour["3_ans"]], 0.01)
          const dsrmois = calculerDSRAnnualise([...rendementsTableaumois["3_ans"]], 0.01)

          const omega = calculateOmegaRatio([...rendementsTableau["3_ans"]], 0);
          const omegajour = calculateOmegaRatio([...rendementsTableaujour["3_ans"]], 0);
          const omegamois = calculateOmegaRatio([...rendementsTableaumois["3_ans"]], 0);

          const calmar = calculateCalmarRatio(maxDrawdown, CAGR)

          const sortino = calculateSortinoRatio([...rendementsTableau["3_ans"]], tauxacc, 0.01);
          const sortinojour = calculateSortinoRatio([...rendementsTableaujour["3_ans"]], tauxacc, 0.01);
          const sortinomois = calculateSortinoRatio([...rendementsTableaumois["3_ans"]], tauxacc, 0.01);

          const betaBaiss = calculateDownsideBeta([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]])
          const betaBaissjour = calculateDownsideBeta([...rendementsTableaujour["3_ans"]], [...rendementsTableauindicejour["3_ans"]])
          const betaBaissmois = calculateDownsideBeta([...rendementsTableaumois["3_ans"]], [...rendementsTableauindicemois["3_ans"]])

          const betaHaussier = calculateHaussierBeta([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]])
          const betaHaussierjour = calculateHaussierBeta([...rendementsTableaujour["3_ans"]], [...rendementsTableauindicejour["3_ans"]])
          const betaHaussiermois = calculateHaussierBeta([...rendementsTableaumois["3_ans"]], [...rendementsTableauindicemois["3_ans"]])

          const trackingError = calculateTrackingError([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]])
          const trackingErrorjour = calculateTrackingError([...rendementsTableaujour["3_ans"]], [...rendementsTableauindicejour["3_ans"]])
          const trackingErrormois = calculateTrackingError([...rendementsTableaumois["3_ans"]], [...rendementsTableauindicemois["3_ans"]])

          const DownCaptureRatio = calculateDownCaptureRatio([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]])
          const DownCaptureRatiojour = calculateDownCaptureRatio([...rendementsTableaujour["3_ans"]], [...rendementsTableauindicejour["3_ans"]])
          const DownCaptureRatiomois = calculateDownCaptureRatio([...rendementsTableaumois["3_ans"]], [...rendementsTableauindicemois["3_ans"]])

          const UpCaptureRatio = calculateUpCaptureRatio([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]])
          const UpCaptureRatiojour = calculateUpCaptureRatio([...rendementsTableaujour["3_ans"]], [...rendementsTableauindicejour["3_ans"]])
          const UpCaptureRatiomois = calculateUpCaptureRatio([...rendementsTableaumois["3_ans"]], [...rendementsTableauindicemois["3_ans"]])

          // const dsr = calculerDSRAnnualise([...rendementsTableau["3_ans"]], 0) 

          const delaiRecouvrement = calculerDelaiRecouvrementFonds(Vls.reverse());


          // const ratioSharpe = calculateSharpeRatio(rendementsTableau["3_ans"], 0.000751923)
          const ratioSharpe = (CAGR - tauxsr) / volatilites["3_ans"];
          const ratioSharpejour = (CAGR - tauxsr) / volatilitesjour["3_ans"];
          const ratioSharpemois = (CAGR - tauxsr) / volatilitesmois["3_ans"];

          const correlation = quants.corrcoef([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]], 0)
          const correlationjour = quants.corrcoef([...rendementsTableaujour["3_ans"]], [...rendementsTableauindicejour["3_ans"]], 0)
          const correlationmois = quants.corrcoef([...rendementsTableaumois["3_ans"]], [...rendementsTableauindicemois["3_ans"]], 0)

          // const r2 = quants.linreg([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]]).rsq
          const r2 = calculerR2([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]])
          const r2jour = calculerR2([...rendementsTableaujour["3_ans"]], [...rendementsTableauindicejour["3_ans"]])
          const r2mois = calculerR2([...rendementsTableaumois["3_ans"]], [...rendementsTableauindicemois["3_ans"]])



          res.json({
            code: 200,
            data: {

              volatility: volatilites["3_ans"] * 100,
              volatilityjour: volatilitesjour["3_ans"] * 100,
              volatilitymois: volatilitesmois["3_ans"] * 100,
              volatilityInd: volatilitesind["3_ans"] * 100,
              volatilityIndjour: volatilitesindjour["3_ans"] * 100,
              volatilityIndmois: volatilitesindmois["3_ans"] * 100,
              beta,
              betajour,
              betamois,
              perfAnnualisee: perfAnnualisee * 100,
              CAGR,
              perfAnnualiseeInd: perfAnnualiseeInd * 100,
              info,
              infojour: infojour,
              infomois: infomois,
              r2,
              r2jour,
              r2mois,
              // skewness,
              correlation,
              correlationjour,
              correlationmois,
              omega,
              omegajour,
              omegamois,
              sortino,
              sortinojour,
              sortinomois,
              calmar,

              // volatilityInd,
              maxDrawdown: -maxDrawdown * 100,
              maxDrawdownInd: -maxDrawdownInd * 100,
              dsr,
              dsrjour,
              dsrmois,
              ratioSharpe,
              ratioSharpejour,
              ratioSharpemois,
              // kurtosis,
              // betaHaussier,
              // betaBaiss,
              VAR95: VAR95 * 100,
              VAR95jour: VAR95jour * 100,
              VAR95jour: VAR95mois * 100,
              trackingError: trackingError * 100,
              trackingErrorjour: trackingErrorjour * 100,
              trackingErrorjour: trackingErrormois * 100,

              VAR99: VAR99 * 100,
              VAR99jour: VAR99jour * 100,
              VAR99mois: VAR99mois * 100,

              delaiRecouvrement,
              betaHaussier,
              betaHaussierjour,
              betaHaussiermois,

              betaBaiss,
              betaBaissjour,
              betaBaissmois,

              UpCaptureRatio,
              UpCaptureRatiojour,
              UpCaptureRatiomois,

              DownCaptureRatio,
              DownCaptureRatiojour,
              DownCaptureRatiomois,

              skewness,
              skewnessjour,
              skewnessmois,

              kurtosis,
              kurtosisjour,
              kurtosismois,

              // dd: (perfAnnualisee - perfAnnualiseeInd)
              // delaiRecouvrementInd
            }
          })
          /*   }else{
               res.json({
                 code: 200,
                 data: {
                   volatility: '-',
                   volatilityInd: '-',
                   beta:'-',
                   perfAnnualisee: '-',
                   perfAnnualiseeInd: '-',
                   info:'-',
                   r2:'-',
                   // skewness,
                   correlation:'-',
                   omega:'-',
                   sortino:'-',
                   calmar:'-',
                   // volatilityInd,
                   maxDrawdown: '-',
                   maxDrawdownInd: '-',
                   dsr:'-',
                   ratioSharpe:'-',
                   // kurtosis,
                   // betaHaussier,
                   // betaBaiss,
                   VAR95: '-',
                   trackingError: '-',
                   VAR99: '-',
                 
                  
                   betaBaiss:'-',
                  
                   // dd: (perfAnnualisee - perfAnnualiseeInd)
                   // delaiRecouvrementInd
                 }
               })
             }*/
        } else if (req.params.year === "5") {
          let donneesGroupéesSS = grouperParSemaine(donneesarray);
          let donneesGroupéesindice = grouperParSemaine(donneesarrayindref);

          console.log(donneesarray);
          console.log(donneesGroupéesSS)

          let donneesGroupéesSSjour = grouperParJour(donneesarray);
          let donneesGroupéesindicejour = grouperParJour(donneesarrayindref);

          let donneesGroupéesSSmois = grouperParMois(donneesarray);
          let donneesGroupéesindicemois = grouperParMois(donneesarrayindref);


          // Calcul de la volatilité pour différentes périodes
          let endDate = moment(lastPreviousDate);
          let periods = {
            '5_ans': findNearestDatetoyear(dates, 5, endDate),


          };
          let tauxensemainefilte = {};

          let volatilites = {};
          let volatilitesind = {};
          let rendementsTableau = {};
          let rendementsTableauindice = {};

          let volatilitesjour = {};
          let volatilitesindjour = {};
          let rendementsTableaujour = {};
          let rendementsTableauindicejour = {};


          let volatilitesmois = {};
          let volatilitesindmois = {};
          let rendementsTableaumois = {};
          let rendementsTableauindicemois = {};
          let Vls = [];
          let Vlsindice = [];
          for (let [periode, dateDebut] of Object.entries(periods)) {
            //  console.log(donneesGroupéesSS);

            let donneesPeriodesemaine = donneesGroupéesSS.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicesemaine = donneesGroupéesindice.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            //let donneestauxPeriodesemaine = tableauDonneestsr.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            console.log(donneesPeriodesemaine);

            let donneesPeriodejour = donneesGroupéesSSjour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicejour = donneesGroupéesindicejour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            for (let i = 0; i <= donneesPeriodejour.length - 1; i++) {
              Vls.push(donneesPeriodejour[i].value)
            }
            for (let i = 0; i <= donneesPeriodeindicejour.length - 1; i++) {
              Vlsindice.push(donneesPeriodeindicejour[i].value)
            }
            let donneesPeriodemois = donneesGroupéesSSmois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicemois = donneesGroupéesindicemois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let rendementsPeriode = calculerRendements(donneesPeriodesemaine);
            let rendementsPeriodeindice = calculerRendements(donneesPeriodeindicesemaine);
            rendementsTableau[periode] = rendementsPeriode;
            rendementsTableauindice[periode] = rendementsPeriodeindice;

            volatilites[periode] = calculerVolatilite(rendementsPeriode);
            volatilitesind[periode] = calculerVolatilite(rendementsPeriodeindice);

            let rendementsPeriodejour = calculerRendements(donneesPeriodejour);
            let rendementsPeriodeindicejour = calculerRendements(donneesPeriodeindicejour);
            rendementsTableaujour[periode] = rendementsPeriodejour;
            rendementsTableauindicejour[periode] = rendementsPeriodeindicejour;

            volatilitesjour[periode] = calculerVolatilitejour(rendementsPeriodejour);
            volatilitesindjour[periode] = calculerVolatilitejour(rendementsPeriodeindicejour);

            let rendementsPeriodemois = calculerRendements(donneesPeriodemois);
            let rendementsPeriodeindicemois = calculerRendements(donneesPeriodeindicemois);
            rendementsTableaumois[periode] = rendementsPeriodemois;
            rendementsTableauindicemois[periode] = rendementsPeriodeindicemois;

            volatilitesmois[periode] = calculerVolatilitemois(rendementsPeriodemois);
            volatilitesindmois[periode] = calculerVolatilitemois(rendementsPeriodeindicemois);
            //tauxensemainefilte = donneestauxPeriodesemaine;

          }
          //     if(rendementsTableau['5_an'].length>0){
          const yDate = findNearestDateAnnualized(dates, 5, lastPreviousDate)

          const portfolioReturns = rendementsTableau['5_ans']
          const CAGR = calculerCAGR(values[dates.indexOf(findNearestDateAnnualized(dates, 5, findLastDateOfPreviousMonth(dates)))], lastValue, 5)
          const benchmarkReturns = rendementsTableauindice['5_ans'];
          const perfAnnualisee = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDateAnnualized(dates, 5, findLastDateOfPreviousMonth(dates)))], 5);
          const perfAnnualiseeInd = calculateAnnualizedPerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDateAnnualized(dates, 5, findLastDateOfPreviousMonth(dates)))], 5);
          //    const varindice = calculateVariance([...rendementsTableauindice['5_ans']]);
          //    const cov = calculateCovariance(rendementsTableau['5_ans'], [...rendementsTableauindice['5_ans']])
          const info = calculateInformationRatio([...rendementsTableau['5_ans']], [...rendementsTableauindice['5_ans']])
          const infojour = calculateInformationRatiojour([...rendementsTableaujour['5_ans']], [...rendementsTableauindicejour['5_ans']])
          const infomois = calculateInformationRatiojour([...rendementsTableaumois['5_ans']], [...rendementsTableauindicemois['5_ans']])

          // const info= calculateInformationRationew(portfolioReturns,benchmarkReturns)* Math.sqrt(52);
          const beta = calculateBetanew(rendementsTableau['5_ans'], rendementsTableauindice['5_ans'])
          const betajour = calculateBetanew(rendementsTableaujour['5_ans'], rendementsTableauindicejour['5_ans'])
          const betamois = calculateBetanew(rendementsTableaumois['5_ans'], rendementsTableauindicemois['5_ans'])

          const VAR95 = calculateVAR95([...rendementsTableau["5_ans"]], 0.95);
          const VAR95jour = calculateVAR95([...rendementsTableaujour["5_ans"]], 0.95);
          const VAR95mois = calculateVAR95([...rendementsTableaumois["5_ans"]], 0.95);

          const VAR99 = calculateVAR99([...rendementsTableau["5_ans"]], 0.99)
          const VAR99jour = calculateVAR99([...rendementsTableaujour["5_ans"]], 0.99)
          const VAR99mois = calculateVAR99([...rendementsTableaumois["5_ans"]], 0.99)

          const skewness = calculerSkewness([...rendementsTableau["5_ans"]], volatilites["5_ans"])
          const skewnessjour = calculerSkewness([...rendementsTableaujour["5_ans"]], volatilitesjour["5_ans"])
          const skewnessmois = calculerSkewness([...rendementsTableaumois["5_ans"]], volatilitesmois["5_ans"])
          const kurtosis = calculateKurtosis([...rendementsTableau["5_ans"]])
          const kurtosisjour = calculateKurtosis([...rendementsTableaujour["5_ans"]])
          const kurtosismois = calculateKurtosis([...rendementsTableaumois["5_ans"]])

          const maxDrawdown = calculateMaxDrawdown(Vls.reverse())
          const maxDrawdownInd = calculateMaxDrawdown(Vlsindice.reverse())
          const dsr = calculerDSRAnnualise([...rendementsTableau["5_ans"]], 0.01)
          const dsrjour = calculerDSRAnnualise([...rendementsTableaujour["5_ans"]], 0.01)
          const dsrmois = calculerDSRAnnualise([...rendementsTableaumois["5_ans"]], 0.01)

          const omega = calculateOmegaRatio([...rendementsTableau["5_ans"]], 0);
          const omegajour = calculateOmegaRatio([...rendementsTableaujour["5_ans"]], 0);
          const omegamois = calculateOmegaRatio([...rendementsTableaumois["5_ans"]], 0);

          const calmar = calculateCalmarRatio(maxDrawdown, CAGR)

          const sortino = calculateSortinoRatio([...rendementsTableau["5_ans"]], -0.00473, 0.01);
          const sortinojour = calculateSortinoRatio([...rendementsTableaujour["5_ans"]], -0.00473, 0.01);
          const sortinomois = calculateSortinoRatio([...rendementsTableaumois["5_ans"]], -0.00473, 0.01);

          const betaBaiss = calculateDownsideBeta([...rendementsTableau["5_ans"]], [...rendementsTableauindice["5_ans"]])
          const betaBaissjour = calculateDownsideBeta([...rendementsTableaujour["5_ans"]], [...rendementsTableauindicejour["5_ans"]])
          const betaBaissmois = calculateDownsideBeta([...rendementsTableaumois["5_ans"]], [...rendementsTableauindicemois["5_ans"]])

          const betaHaussier = calculateHaussierBeta([...rendementsTableau["5_ans"]], [...rendementsTableauindice["5_ans"]])
          const betaHaussierjour = calculateHaussierBeta([...rendementsTableaujour["5_ans"]], [...rendementsTableauindicejour["5_ans"]])
          const betaHaussiermois = calculateHaussierBeta([...rendementsTableaumois["5_ans"]], [...rendementsTableauindicemois["5_ans"]])

          const trackingError = calculateTrackingError([...rendementsTableau["5_ans"]], [...rendementsTableauindice["5_ans"]])
          const trackingErrorjour = calculateTrackingError([...rendementsTableaujour["5_ans"]], [...rendementsTableauindicejour["5_ans"]])
          const trackingErrormois = calculateTrackingError([...rendementsTableaumois["5_ans"]], [...rendementsTableauindicemois["5_ans"]])

          const DownCaptureRatio = calculateDownCaptureRatio([...rendementsTableau["5_ans"]], [...rendementsTableauindice["5_ans"]])
          const DownCaptureRatiojour = calculateDownCaptureRatio([...rendementsTableaujour["5_ans"]], [...rendementsTableauindicejour["5_ans"]])
          const DownCaptureRatiomois = calculateDownCaptureRatio([...rendementsTableaumois["5_ans"]], [...rendementsTableauindicemois["5_ans"]])

          const UpCaptureRatio = calculateUpCaptureRatio([...rendementsTableau["5_ans"]], [...rendementsTableauindice["5_ans"]])
          const UpCaptureRatiojour = calculateUpCaptureRatio([...rendementsTableaujour["5_ans"]], [...rendementsTableauindicejour["5_ans"]])
          const UpCaptureRatiomois = calculateUpCaptureRatio([...rendementsTableaumois["5_ans"]], [...rendementsTableauindicemois["5_ans"]])

          // const dsr = calculerDSRAnnualise([...rendementsTableau["5_ans"]], 0) 

          const delaiRecouvrement = calculerDelaiRecouvrementFonds(Vls.reverse());


          // const ratioSharpe = calculateSharpeRatio(rendementsTableau["5_ans"], 0.000751923)
          const ratioSharpe = (CAGR - tauxsr) / volatilites["5_ans"];
          const ratioSharpejour = (CAGR - tauxsr) / volatilitesjour["5_ans"];
          const ratioSharpemois = (CAGR - tauxsr) / volatilitesmois["5_ans"];

          const correlation = quants.corrcoef([...rendementsTableau["5_ans"]], [...rendementsTableauindice["5_ans"]], 0)
          const correlationjour = quants.corrcoef([...rendementsTableaujour["5_ans"]], [...rendementsTableauindicejour["5_ans"]], 0)
          const correlationmois = quants.corrcoef([...rendementsTableaumois["5_ans"]], [...rendementsTableauindicemois["5_ans"]], 0)

          // const r2 = quants.linreg([...rendementsTableau["5_ans"]], [...rendementsTableauindice["5_ans"]]).rsq
          const r2 = calculerR2([...rendementsTableau["5_ans"]], [...rendementsTableauindice["5_ans"]])
          const r2jour = calculerR2([...rendementsTableaujour["5_ans"]], [...rendementsTableauindicejour["5_ans"]])
          const r2mois = calculerR2([...rendementsTableaumois["5_ans"]], [...rendementsTableauindicemois["5_ans"]])



          res.json({
            code: 200,
            data: {

              volatility: volatilites["5_ans"] * 100,
              volatilityjour: volatilitesjour["5_ans"] * 100,
              volatilitymois: volatilitesmois["5_ans"] * 100,
              volatilityInd: volatilitesind["5_ans"] * 100,
              volatilityIndjour: volatilitesindjour["5_ans"] * 100,
              volatilityIndmois: volatilitesindmois["5_ans"] * 100,
              beta,
              betajour,
              betamois,
              perfAnnualisee: perfAnnualisee * 100,
              CAGR,
              perfAnnualiseeInd: perfAnnualiseeInd * 100,
              info,
              infojour: infojour,
              infomois: infomois,
              r2,
              r2jour,
              r2mois,
              // skewness,
              correlation,
              correlationjour,
              correlationmois,
              omega,
              omegajour,
              omegamois,
              sortino,
              sortinojour,
              sortinomois,
              calmar,

              // volatilityInd,
              maxDrawdown: -maxDrawdown * 100,
              maxDrawdownInd: -maxDrawdownInd * 100,
              dsr,
              dsrjour,
              dsrmois,
              ratioSharpe,
              ratioSharpejour,
              ratioSharpemois,
              // kurtosis,
              // betaHaussier,
              // betaBaiss,
              VAR95: VAR95 * 100,
              VAR95jour: VAR95jour * 100,
              VAR95jour: VAR95mois * 100,
              trackingError: trackingError * 100,
              trackingErrorjour: trackingErrorjour * 100,
              trackingErrorjour: trackingErrormois * 100,

              VAR99: VAR99 * 100,
              VAR99jour: VAR99jour * 100,
              VAR99mois: VAR99mois * 100,

              delaiRecouvrement,
              betaHaussier,
              betaHaussierjour,
              betaHaussiermois,

              betaBaiss,
              betaBaissjour,
              betaBaissmois,

              UpCaptureRatio,
              UpCaptureRatiojour,
              UpCaptureRatiomois,

              DownCaptureRatio,
              DownCaptureRatiojour,
              DownCaptureRatiomois,

              skewness,
              skewnessjour,
              skewnessmois,

              kurtosis,
              kurtosisjour,
              kurtosismois,
              // dd: (perfAnnualisee - perfAnnualiseeInd)
              // delaiRecouvrementInd
            }
          })
          /*  }else{
              res.json({
                code: 200,
                data: {
                  volatility: '-',
                  volatilityInd: '-',
                  beta:'-',
                  perfAnnualisee: '-',
                  perfAnnualiseeInd: '-',
                  info:'-',
                  r2:'-',
                  // skewness,
                  correlation:'-',
                  omega:'-',
                  sortino:'-',
                  calmar:'-',
                  // volatilityInd,
                  maxDrawdown: '-',
                  maxDrawdownInd: '-',
                  dsr:'-',
                  ratioSharpe:'-',
                  // kurtosis,
                  // betaHaussier,
                  // betaBaiss,
                  VAR95: '-',
                  trackingError: '-',
                  VAR99: '-',
               
                  betaBaiss:'-',
                  
                  // dd: (perfAnnualisee - perfAnnualiseeInd)
                  // delaiRecouvrementInd
                }
              })
            }*/
        } else if (req.params.year === "8") {
          let donneesGroupéesSS = grouperParSemaine(donneesarray);
          let donneesGroupéesindice = grouperParSemaine(donneesarrayindref);

          let donneesGroupéesSSjour = grouperParJour(donneesarray);
          let donneesGroupéesindicejour = grouperParJour(donneesarrayindref);

          let donneesGroupéesSSmois = grouperParMois(donneesarray);
          let donneesGroupéesindicemois = grouperParMois(donneesarrayindref);


          // Calcul de la volatilité pour différentes périodes
          let endDate = moment(lastPreviousDate);
          let periods = {
            '8_ans': findNearestDatetoyear(dates, 8, endDate),


          };
          let tauxensemainefilte = {};

          let volatilites = {};
          let volatilitesind = {};
          let rendementsTableau = {};
          let rendementsTableauindice = {};

          let volatilitesjour = {};
          let volatilitesindjour = {};
          let rendementsTableaujour = {};
          let rendementsTableauindicejour = {};


          let volatilitesmois = {};
          let volatilitesindmois = {};
          let rendementsTableaumois = {};
          let rendementsTableauindicemois = {};
          let Vls = [];
          let Vlsindice = [];
          for (let [periode, dateDebut] of Object.entries(periods)) {
            console.log(donneesGroupéesSS);

            let donneesPeriodesemaine = donneesGroupéesSS.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicesemaine = donneesGroupéesindice.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            //let donneestauxPeriodesemaine = tableauDonneestsr.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let donneesPeriodejour = donneesGroupéesSSjour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicejour = donneesGroupéesindicejour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            for (let i = 0; i <= donneesPeriodejour.length - 1; i++) {
              Vls.push(donneesPeriodejour[i].value)
            }
            for (let i = 0; i <= donneesPeriodeindicejour.length - 1; i++) {
              Vlsindice.push(donneesPeriodeindicejour[i].value)
            }
            let donneesPeriodemois = donneesGroupéesSSmois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicemois = donneesGroupéesindicemois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let rendementsPeriode = calculerRendements(donneesPeriodesemaine);
            let rendementsPeriodeindice = calculerRendements(donneesPeriodeindicesemaine);
            rendementsTableau[periode] = rendementsPeriode;
            rendementsTableauindice[periode] = rendementsPeriodeindice;

            volatilites[periode] = calculerVolatilite(rendementsPeriode);
            volatilitesind[periode] = calculerVolatilite(rendementsPeriodeindice);

            let rendementsPeriodejour = calculerRendements(donneesPeriodejour);
            let rendementsPeriodeindicejour = calculerRendements(donneesPeriodeindicejour);
            rendementsTableaujour[periode] = rendementsPeriodejour;
            rendementsTableauindicejour[periode] = rendementsPeriodeindicejour;

            volatilitesjour[periode] = calculerVolatilite(rendementsPeriodejour);
            volatilitesindjour[periode] = calculerVolatilite(rendementsPeriodeindicejour);

            let rendementsPeriodemois = calculerRendements(donneesPeriodemois);
            let rendementsPeriodeindicemois = calculerRendements(donneesPeriodeindicemois);
            rendementsTableaumois[periode] = rendementsPeriodemois;
            rendementsTableauindicemois[periode] = rendementsPeriodeindicemois;

            volatilitesmois[periode] = calculerVolatilite(rendementsPeriodemois);
            volatilitesindmois[periode] = calculerVolatilite(rendementsPeriodeindicemois);
            //tauxensemainefilte = donneestauxPeriodesemaine;

          }
          const yDate = findNearestDateAnnualized(dates, 8, lastPreviousDate)

          const portfolioReturns = rendementsTableau['8_ans']

          const benchmarkReturns = rendementsTableauindice['8_ans'];
          const perfAnnualisee = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDateAnnualized(dates, 8, findLastDateOfPreviousMonth(dates)))], 8);
          const perfAnnualiseeInd = calculateAnnualizedPerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDateAnnualized(dates, 8, findLastDateOfPreviousMonth(dates)))], 8);
          //   const varindice = calculateVariance([...rendementsTableauindice['1_an']]);
          //   const cov = calculateCovariance(rendementsTableau['1_an'], [...rendementsTableauindice['1_an']])

          //const info= quants.inforatio([...rendementsTableau['3_ans']], [...rendementsTableauindice['3_ans']])* Math.sqrt(52)
          const info = calculateInformationRatio([...rendementsTableau['8_ans']], [...rendementsTableauindice['8_ans']])
          const beta = calculateBeta(rendementsTableau['8_ans'], rendementsTableauindice['8_ans'])
          const VAR95 = calculateVAR95([...rendementsTableau["8_ans"]], 0.95);
          const VAR99 = calculateVAR99([...rendementsTableau["8_ans"]], 0.99)
          const maxDrawdown = calculateMaxDrawdown(Vls.reverse())
          const maxDrawdownInd = calculateMaxDrawdown(Vlsindice.reverse())
          const dsr = calculerDSRAnnualise([...rendementsTableau["8_ans"]], 0.01)
          const omega = calculateOmegaRatio([...rendementsTableau["8_ans"]], 0);
          const calmar = calculateCalmarRatio([...rendementsTableau["8_ans"]], 8)
          const sortino = calculateSortinoRatio([...rendementsTableau["8_ans"]], -0.00473, 0.01);
          const betaBaiss = calculateDownsideBeta([...rendementsTableau["8_ans"]], [...rendementsTableauindice["8_ans"]])
          const trackingError = calculateTrackingError([...rendementsTableau["8_ans"]], [...rendementsTableauindice["8_ans"]])
          const DownCaptureRatio = calculateDownCaptureRatio([...rendementsTableau["8_ans"]], [...rendementsTableauindice["8_ans"]])
          const UpCaptureRatio = calculateUpCaptureRatio([...rendementsTableau["8_ans"]], [...rendementsTableauindice["8_ans"]])
          const delaiRecouvrement = calculerDelaiRecouvrementFonds(Vls.reverse());




          const ratioSharpe = calculateSharpeRatio(rendementsTableau["8_ans"], -0.00473)
          const correlation = quants.corrcoef([...rendementsTableau["8_ans"]], [...rendementsTableauindice["8_ans"]], 0)

          // const r2 = quants.linreg([...rendementsTableau["8_ans"]], [...rendementsTableauindice["8_ans"]]).rsq
          const r2 = calculerR2([...rendementsTableau["8_ans"]], [...rendementsTableauindice["8_ans"]])


          console.log(beta);

          res.json({
            code: 200,
            data: {
              volatility: volatilites["8_ans"] * 100,
              volatilityInd: volatilitesind["8_ans"] * 100,
              beta,
              perfAnnualisee: perfAnnualisee * 100,
              perfAnnualiseeInd: perfAnnualiseeInd * 100,
              info,
              r2,
              // skewness,
              correlation,
              omega,
              sortino,
              calmar,
              // volatilityInd,
              maxDrawdown: -maxDrawdown * 100,
              maxDrawdownInd: -maxDrawdownInd * 100,
              dsr,
              ratioSharpe,
              // kurtosis,
              // betaHaussier,
              // betaBaiss,
              VAR95: VAR95 * 100,
              trackingError: trackingError * 100,
              VAR99: VAR99 * 100,
              delaiRecouvrement,
              /*betaHaussier,*/
              betaBaiss,
              /*  upCaptureRatio,
                downCaptureRatio,*/
              // dd: (perfAnnualisee - perfAnnualiseeInd)
              // delaiRecouvrementInd
            }
          })
        } else if (req.params.year === "10") {
          let donneesGroupéesSS = grouperParSemaine(donneesarray);
          let donneesGroupéesindice = grouperParSemaine(donneesarrayindref);

          let donneesGroupéesSSjour = grouperParJour(donneesarray);
          let donneesGroupéesindicejour = grouperParJour(donneesarrayindref);

          let donneesGroupéesSSmois = grouperParMois(donneesarray);
          let donneesGroupéesindicemois = grouperParMois(donneesarrayindref);


          // Calcul de la volatilité pour différentes périodes
          let endDate = moment(lastPreviousDate);
          let periods = {
            '10_ans': findNearestDatetoyear(dates, 10, endDate),


          };
          let tauxensemainefilte = {};

          let volatilites = {};
          let volatilitesind = {};
          let rendementsTableau = {};
          let rendementsTableauindice = {};

          let volatilitesjour = {};
          let volatilitesindjour = {};
          let rendementsTableaujour = {};
          let rendementsTableauindicejour = {};


          let volatilitesmois = {};
          let volatilitesindmois = {};
          let rendementsTableaumois = {};
          let rendementsTableauindicemois = {};
          let Vls = [];
          let Vlsindice = [];
          for (let [periode, dateDebut] of Object.entries(periods)) {
            console.log(donneesGroupéesSS);

            let donneesPeriodesemaine = donneesGroupéesSS.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicesemaine = donneesGroupéesindice.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            //let donneestauxPeriodesemaine = tableauDonneestsr.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let donneesPeriodejour = donneesGroupéesSSjour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicejour = donneesGroupéesindicejour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            for (let i = 0; i <= donneesPeriodejour.length - 1; i++) {
              Vls.push(donneesPeriodejour[i].value)
            }
            for (let i = 0; i <= donneesPeriodeindicejour.length - 1; i++) {
              Vlsindice.push(donneesPeriodeindicejour[i].value)
            }
            let donneesPeriodemois = donneesGroupéesSSmois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicemois = donneesGroupéesindicemois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let rendementsPeriode = calculerRendements(donneesPeriodesemaine);
            let rendementsPeriodeindice = calculerRendements(donneesPeriodeindicesemaine);
            rendementsTableau[periode] = rendementsPeriode;
            rendementsTableauindice[periode] = rendementsPeriodeindice;

            volatilites[periode] = calculerVolatilite(rendementsPeriode);
            volatilitesind[periode] = calculerVolatilite(rendementsPeriodeindice);

            let rendementsPeriodejour = calculerRendements(donneesPeriodejour);
            let rendementsPeriodeindicejour = calculerRendements(donneesPeriodeindicejour);
            rendementsTableaujour[periode] = rendementsPeriodejour;
            rendementsTableauindicejour[periode] = rendementsPeriodeindicejour;

            volatilitesjour[periode] = calculerVolatilite(rendementsPeriodejour);
            volatilitesindjour[periode] = calculerVolatilite(rendementsPeriodeindicejour);

            let rendementsPeriodemois = calculerRendements(donneesPeriodemois);
            let rendementsPeriodeindicemois = calculerRendements(donneesPeriodeindicemois);
            rendementsTableaumois[periode] = rendementsPeriodemois;
            rendementsTableauindicemois[periode] = rendementsPeriodeindicemois;

            volatilitesmois[periode] = calculerVolatilite(rendementsPeriodemois);
            volatilitesindmois[periode] = calculerVolatilite(rendementsPeriodeindicemois);
            //tauxensemainefilte = donneestauxPeriodesemaine;

          }
          const yDate = findNearestDateAnnualized(dates, 10, lastPreviousDate)

          const portfolioReturns = rendementsTableau['10_ans']

          const benchmarkReturns = rendementsTableauindice['10_ans'];
          const perfAnnualisee = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDateAnnualized(dates, 10, findLastDateOfPreviousMonth(dates)))], 10);
          const perfAnnualiseeInd = calculateAnnualizedPerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDateAnnualized(dates, 10, findLastDateOfPreviousMonth(dates)))], 10);
          //   const varindice = calculateVariance([...rendementsTableauindice['1_an']]);
          //   const cov = calculateCovariance(rendementsTableau['1_an'], [...rendementsTableauindice['1_an']])

          //const info= quants.inforatio([...rendementsTableau['3_ans']], [...rendementsTableauindice['3_ans']])* Math.sqrt(52)
          const info = calculateInformationRatiojour([...rendementsTableaujour['10_ans']], [...rendementsTableauindicejour['10_ans']])
          const beta = calculateBeta(rendementsTableau['10_ans'], rendementsTableauindice['10_ans'])
          const VAR95 = calculateVAR95([...rendementsTableau["10_ans"]], 0.95);
          const VAR99 = calculateVAR99([...rendementsTableau["10_ans"]], 0.99)
          const maxDrawdown = calculateMaxDrawdown(Vls.reverse())
          const maxDrawdownInd = calculateMaxDrawdown(Vlsindice.reverse())
          const dsr = calculerDSRAnnualise([...rendementsTableau["10_ans"]], 0.01)
          const omega = calculateOmegaRatio([...rendementsTableau["10_ans"]], 0);
          const calmar = calculateCalmarRatio([...rendementsTableau["10_ans"]], 10)
          const sortino = calculateSortinoRatio([...rendementsTableau["10_ans"]], -0.00473, 0.01);
          const betaBaiss = calculateDownsideBeta([...rendementsTableau["10_ans"]], [...rendementsTableauindice["10_ans"]])
          const trackingError = calculateTrackingError([...rendementsTableau["10_ans"]], [...rendementsTableauindice["10_ans"]])
          const DownCaptureRatio = calculateDownCaptureRatio([...rendementsTableau["10_ans"]], [...rendementsTableauindice["10_ans"]])
          const UpCaptureRatio = calculateUpCaptureRatio([...rendementsTableau["10_ans"]], [...rendementsTableauindice["10_ans"]])

          const delaiRecouvrement = calculerDelaiRecouvrementFonds(Vls.reverse());



          const ratioSharpe = calculateSharpeRatio(rendementsTableau["10_ans"], -0.00473)
          const correlation = quants.corrcoef([...rendementsTableau["10_ans"]], [...rendementsTableauindice["10_ans"]], 0)

          // const r2 = quants.linreg([...rendementsTableau["10_ans"]], [...rendementsTableauindice["10_ans"]]).rsq
          const r2 = calculerR2([...rendementsTableau["10_ans"]], [...rendementsTableauindice["10_ans"]])


          console.log(beta);

          res.json({
            code: 200,
            data: {
              volatility: volatilites["10_ans"] * 100,
              volatilityInd: volatilitesind["10_ans"] * 100,
              beta,
              perfAnnualisee: perfAnnualisee * 100,
              perfAnnualiseeInd: perfAnnualiseeInd * 100,
              info,
              r2,
              // skewness,
              correlation,
              omega,
              sortino,
              calmar,
              // volatilityInd,
              maxDrawdown: -maxDrawdown * 100,
              maxDrawdownInd: -maxDrawdownInd * 100,
              dsr,
              ratioSharpe,
              // kurtosis,
              // betaHaussier,
              // betaBaiss,
              VAR95: VAR95 * 100,
              trackingError: trackingError * 100,
              VAR99: VAR99 * 100,
              delaiRecouvrement,
              /*  betaHaussier,*/
              betaBaiss,
              /*  upCaptureRatio,
                downCaptureRatio,*/
              // dd: (perfAnnualisee - perfAnnualiseeInd)
              // delaiRecouvrementInd
            }
          })
        } else if (req.params.year === "12") {
          let donneesGroupéesSS = grouperParSemaine(donneesarray);
          let donneesGroupéesindice = grouperParSemaine(donneesarrayindref);

          let donneesGroupéesSSjour = grouperParJour(donneesarray);
          let donneesGroupéesindicejour = grouperParJour(donneesarrayindref);

          let donneesGroupéesSSmois = grouperParMois(donneesarray);
          let donneesGroupéesindicemois = grouperParMois(donneesarrayindref);


          // Calcul de la volatilité pour différentes périodes
          let endDate = moment(lastPreviousDate);
          let periods = {
            '12_ans': findNearestDatetoyear(dates, 12, endDate),


          };
          let tauxensemainefilte = {};

          let volatilites = {};
          let volatilitesind = {};
          let rendementsTableau = {};
          let rendementsTableauindice = {};

          let volatilitesjour = {};
          let volatilitesindjour = {};
          let rendementsTableaujour = {};
          let rendementsTableauindicejour = {};


          let volatilitesmois = {};
          let volatilitesindmois = {};
          let rendementsTableaumois = {};
          let rendementsTableauindicemois = {};
          let Vls = [];
          let Vlsindice = [];
          for (let [periode, dateDebut] of Object.entries(periods)) {
            console.log(donneesGroupéesSS);

            let donneesPeriodesemaine = donneesGroupéesSS.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicesemaine = donneesGroupéesindice.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            //let donneestauxPeriodesemaine = tableauDonneestsr.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let donneesPeriodejour = donneesGroupéesSSjour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicejour = donneesGroupéesindicejour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            for (let i = 0; i <= donneesPeriodejour.length - 1; i++) {
              Vls.push(donneesPeriodejour[i].value)
            }
            for (let i = 0; i <= donneesPeriodeindicejour.length - 1; i++) {
              Vlsindice.push(donneesPeriodeindicejour[i].value)
            }
            let donneesPeriodemois = donneesGroupéesSSmois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicemois = donneesGroupéesindicemois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let rendementsPeriode = calculerRendements(donneesPeriodesemaine);
            let rendementsPeriodeindice = calculerRendements(donneesPeriodeindicesemaine);
            rendementsTableau[periode] = rendementsPeriode;
            rendementsTableauindice[periode] = rendementsPeriodeindice;

            volatilites[periode] = calculerVolatilite(rendementsPeriode);
            volatilitesind[periode] = calculerVolatilite(rendementsPeriodeindice);

            let rendementsPeriodejour = calculerRendements(donneesPeriodejour);
            let rendementsPeriodeindicejour = calculerRendements(donneesPeriodeindicejour);
            rendementsTableaujour[periode] = rendementsPeriodejour;
            rendementsTableauindicejour[periode] = rendementsPeriodeindicejour;

            volatilitesjour[periode] = calculerVolatilite(rendementsPeriodejour);
            volatilitesindjour[periode] = calculerVolatilite(rendementsPeriodeindicejour);

            let rendementsPeriodemois = calculerRendements(donneesPeriodemois);
            let rendementsPeriodeindicemois = calculerRendements(donneesPeriodeindicemois);
            rendementsTableaumois[periode] = rendementsPeriodemois;
            rendementsTableauindicemois[periode] = rendementsPeriodeindicemois;

            volatilitesmois[periode] = calculerVolatilite(rendementsPeriodemois);
            volatilitesindmois[periode] = calculerVolatilite(rendementsPeriodeindicemois);
            //tauxensemainefilte = donneestauxPeriodesemaine;

          }
          const yDate = findNearestDateAnnualized(dates, 12, lastPreviousDate)

          const portfolioReturns = rendementsTableau['12_ans']

          const benchmarkReturns = rendementsTableauindice['12_ans'];
          const perfAnnualisee = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDateAnnualized(dates, 12, findLastDateOfPreviousMonth(dates)))], 12);
          const perfAnnualiseeInd = calculateAnnualizedPerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDateAnnualized(dates, 12, findLastDateOfPreviousMonth(dates)))], 12);
          //   const varindice = calculateVariance([...rendementsTableauindice['1_an']]);
          //   const cov = calculateCovariance(rendementsTableau['1_an'], [...rendementsTableauindice['1_an']])

          //const info= quants.inforatio([...rendementsTableau['3_ans']], [...rendementsTableauindice['3_ans']])* Math.sqrt(52)
          const info = calculateInformationRatio([...rendementsTableau['12_ans']], [...rendementsTableauindice['12_ans']])
          const beta = calculateBeta(rendementsTableau['12_ans'], rendementsTableauindice['12_ans'])
          const VAR95 = calculateVAR95([...rendementsTableau["12_ans"]], 0.95);
          const VAR99 = calculateVAR99([...rendementsTableau["12_ans"]], 0.99)
          const maxDrawdown = calculateMaxDrawdown(Vls.reverse())
          const maxDrawdownInd = calculateMaxDrawdown(Vlsindice.reverse())
          const dsr = calculerDSRAnnualise([...rendementsTableau["12_ans"]], 0.01)
          const omega = calculateOmegaRatio([...rendementsTableau["12_ans"]], 0);
          const calmar = calculateCalmarRatio([...rendementsTableau["12_ans"]], 12)
          const sortino = calculateSortinoRatio([...rendementsTableau["12_ans"]], -0.00473, 0.01);
          const betaBaiss = calculateDownsideBeta([...rendementsTableau["12_ans"]], [...rendementsTableauindice["12_ans"]])
          const trackingError = calculateTrackingError([...rendementsTableau["12_ans"]], [...rendementsTableauindice["12_ans"]])
          const DownCaptureRatio = calculateDownCaptureRatio([...rendementsTableau["12_ans"]], [...rendementsTableauindice["12_ans"]])
          const UpCaptureRatio = calculateUpCaptureRatio([...rendementsTableau["12_ans"]], [...rendementsTableauindice["12_ans"]])

          const delaiRecouvrement = calculerDelaiRecouvrementFonds(Vls.reverse());



          const ratioSharpe = calculateSharpeRatio(rendementsTableau["12_ans"], -0.00473)
          const correlation = quants.corrcoef([...rendementsTableau["12_ans"]], [...rendementsTableauindice["12_ans"]], 0)

          //const r2 = quants.linreg([...rendementsTableau["12_ans"]], [...rendementsTableauindice["12_ans"]]).rsq
          const r2 = calculerR2([...rendementsTableau["12_ans"]], [...rendementsTableauindice["12_ans"]])


          console.log(beta);

          res.json({
            code: 200,
            data: {
              volatility: volatilites["12_ans"] * 100,
              volatilityInd: volatilitesind["12_ans"] * 100,
              beta,
              perfAnnualisee: perfAnnualisee * 100,
              perfAnnualiseeInd: perfAnnualiseeInd * 100,
              info,
              r2,
              // skewness,
              correlation,
              omega,
              sortino,
              calmar,
              // volatilityInd,
              maxDrawdown: -maxDrawdown * 100,
              maxDrawdownInd: -maxDrawdownInd * 100,
              dsr,
              ratioSharpe,
              // kurtosis,
              // betaHaussier,
              // betaBaiss,
              VAR95: VAR95 * 100,
              trackingError: trackingError * 100,
              VAR99: VAR99 * 100,
              delaiRecouvrement,
              /* betaHaussier,*/
              betaBaiss,
              /*  upCaptureRatio,
                downCaptureRatio,*/
              // dd: (perfAnnualisee - perfAnnualiseeInd)
              // delaiRecouvrementInd
            }
          })
        } else if (req.params.year === "origine") {
          let donneesGroupéesSS = grouperParSemaine(donneesarray);
          let donneesGroupéesindice = grouperParSemaine(donneesarrayindref);

          let donneesGroupéesSSjour = grouperParJour(donneesarray);
          let donneesGroupéesindicejour = grouperParJour(donneesarrayindref);

          let donneesGroupéesSSmois = grouperParMois(donneesarray);
          let donneesGroupéesindicemois = grouperParMois(donneesarrayindref);


          // Calcul de la volatilité pour différentes périodes
          let endDate = moment(lastPreviousDate);
          let periods = {

            'origine': findNearestDatetoyear(dates, 5, endDate)


          };
          let tauxensemainefilte = {};

          let volatilites = {};
          let volatilitesind = {};
          let rendementsTableau = {};
          let rendementsTableauindice = {};

          let volatilitesjour = {};
          let volatilitesindjour = {};
          let rendementsTableaujour = {};
          let rendementsTableauindicejour = {};


          let volatilitesmois = {};
          let volatilitesindmois = {};
          let rendementsTableaumois = {};
          let rendementsTableauindicemois = {};
          let Vls = [];
          let Vlsindice = [];
          for (let [periode, dateDebut] of Object.entries(periods)) {
            console.log(donneesGroupéesSS);

            let donneesPeriodesemaine = donneesGroupéesSS.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicesemaine = donneesGroupéesindice.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            //let donneestauxPeriodesemaine = tableauDonneestsr.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let donneesPeriodejour = donneesGroupéesSSjour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicejour = donneesGroupéesindicejour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            for (let i = 0; i <= donneesPeriodejour.length - 1; i++) {
              Vls.push(donneesPeriodejour[i].value)
            }
            for (let i = 0; i <= donneesPeriodeindicejour.length - 1; i++) {
              Vlsindice.push(donneesPeriodeindicejour[i].value)
            }
            let donneesPeriodemois = donneesGroupéesSSmois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicemois = donneesGroupéesindicemois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let rendementsPeriode = calculerRendements(donneesPeriodesemaine);
            let rendementsPeriodeindice = calculerRendements(donneesPeriodeindicesemaine);
            rendementsTableau[periode] = rendementsPeriode;
            rendementsTableauindice[periode] = rendementsPeriodeindice;

            volatilites[periode] = calculerVolatilite(rendementsPeriode);
            volatilitesind[periode] = calculerVolatilite(rendementsPeriodeindice);

            let rendementsPeriodejour = calculerRendements(donneesPeriodejour);
            let rendementsPeriodeindicejour = calculerRendements(donneesPeriodeindicejour);
            rendementsTableaujour[periode] = rendementsPeriodejour;
            rendementsTableauindicejour[periode] = rendementsPeriodeindicejour;

            volatilitesjour[periode] = calculerVolatilite(rendementsPeriodejour);
            volatilitesindjour[periode] = calculerVolatilite(rendementsPeriodeindicejour);

            let rendementsPeriodemois = calculerRendements(donneesPeriodemois);
            let rendementsPeriodeindicemois = calculerRendements(donneesPeriodeindicemois);
            rendementsTableaumois[periode] = rendementsPeriodemois;
            rendementsTableauindicemois[periode] = rendementsPeriodeindicemois;

            volatilitesmois[periode] = calculerVolatilite(rendementsPeriodemois);
            volatilitesindmois[periode] = calculerVolatilite(rendementsPeriodeindicemois);
            //tauxensemainefilte = donneestauxPeriodesemaine;

          }
          const targetYear = groupDatesByYear(dates).length
          const perfAnnualisee = calculateAnnualizedPerformance(lastValue, values[0], targetYear);
          const perfAnnualiseeInd = calculateAnnualizedPerformance(lastValueInd, valuesindifref[0], targetYear);

          const portfolioReturns = rendementsTableau['origine']

          const benchmarkReturns = rendementsTableauindice['origine'];
          //   const varindice = calculateVariance([...rendementsTableauindice['1_an']]);
          //   const cov = calculateCovariance(rendementsTableau['1_an'], [...rendementsTableauindice['1_an']])

          //const info= quants.inforatio([...rendementsTableau['3_ans']], [...rendementsTableauindice['3_ans']])* Math.sqrt(52)
          const info = calculateInformationRatio([...rendementsTableau['origine']], [...rendementsTableauindice['origine']])
          const beta = calculateBeta(rendementsTableau['origine'], rendementsTableauindice['origine'])
          const VAR95 = calculateVAR95([...rendementsTableau["origine"]], 0.95);
          const VAR99 = calculateVAR99([...rendementsTableau["origine"]], 0.99)
          const maxDrawdown = calculateMaxDrawdown(Vls.reverse())
          const maxDrawdownInd = calculateMaxDrawdown(Vlsindice.reverse())
          const dsr = calculerDSRAnnualise([...rendementsTableau["origine"]], 0.01)
          const omega = calculateOmegaRatio([...rendementsTableau["origine"]], 0);
          const calmar = calculateCalmarRatio([...rendementsTableau["origine"]], 0)
          const sortino = calculateSortinoRatio([...rendementsTableau["origine"]], -0.00473, 0.01);
          const betaBaiss = calculateDownsideBeta([...rendementsTableau["origine"]], [...rendementsTableauindice["origine"]])
          const trackingError = calculateTrackingError([...rendementsTableau["origine"]], [...rendementsTableauindice["origine"]])
          const DownCaptureRatio = calculateDownCaptureRatio([...rendementsTableau["origine"]], [...rendementsTableauindice["origine"]])
          const UpCaptureRatio = calculateUpCaptureRatio([...rendementsTableau["origine"]], [...rendementsTableauindice["origine"]])




          const ratioSharpe = calculateSharpeRatio(rendementsTableau["origine"], -0.00473)
          const correlation = quants.corrcoef([...rendementsTableau["origine"]], [...rendementsTableauindice["origine"]], 0)

          // const r2 = quants.linreg([...rendementsTableau["origine"]], [...rendementsTableauindice["origine"]]).rsq
          const r2 = calculerR2([...rendementsTableau["origine"]], [...rendementsTableauindice["origine"]])


          console.log(beta);

          res.json({
            code: 200,
            data: {
              volatility: volatilites["origine"] * 100,
              volatilityInd: volatilitesind["origine"] * 100,
              beta,
              perfAnnualisee: perfAnnualisee * 100,
              perfAnnualiseeInd: perfAnnualiseeInd * 100,
              info,
              r2,
              // skewness,
              correlation,
              omega,
              sortino,
              calmar,
              // volatilityInd,
              maxDrawdown: -maxDrawdown * 100,
              maxDrawdownInd: -maxDrawdownInd * 100,
              dsr,
              ratioSharpe,
              // kurtosis,
              // betaHaussier,
              // betaBaiss,
              VAR95: VAR95 * 100,
              trackingError: trackingError * 100,
              VAR99: VAR99 * 100,
              /* delaiRecouvrement,
               betaHaussier,*/
              betaBaiss,
              /*  upCaptureRatio,
                downCaptureRatio,*/
              // dd: (perfAnnualisee - perfAnnualiseeInd)
              // delaiRecouvrementInd
            }
          })
        }





      })
  })

  app.get('/api/ratiosportefeuilledev/:year/:id/:devise', async (req, res) => {
    // Récupérer les taux_sans_risques en fonction des valeurs de la table fond
    const tauxSansRisques = await tsr.findAll({
      attributes: ['valeur', 'valeur2', 'semaine', 'rate', 'date', 'pays'],
      where: {
        // Ajoutez les conditions spécifiques en fonction de votre logique
        pays: "Nigeria",
      },
    });

    const transactionDatas = await getTransactionData(req.params.id);

    // Tableau pour stocker les résultats
    const tableauDonneestsr = [];

    // Boucle à travers les résultats et stocke les données dans le tableau
    tauxSansRisques.forEach(d => {
      tableauDonneestsr.push({
        valeur: d.valeur,
        valeur2: d.valeur2,
        semaine: d.semaine,
        rate: d.rate,
        date: d.date,
        pays: d.pays,
      });
    });

    await portefeuille_vl_cumul.findAll({
      where: {
        portefeuille_id: req.params.id
      },
      order: [
        ['date', 'DESC'] // Modification ici pour trier par date en ordre décroissant
      ]
    })
      .then(async (response) => {
        let baseProperty;
        if (req.params.devise === 'EUR') {
          baseProperty = 'base_100_bis_EUR';
        } else if (req.params.devise === 'USD') {
          baseProperty = 'base_100_bis_USD';
        } else {
          // Handle other cases or set a default property
          baseProperty = 'base_100_bis';
        }
        // const tauxsr=0.03;-0.0116;-0,0234
        const tauxsr = -0.0234;
        // Valeurs liquidatives
        const values = response.map((data) => data[baseProperty]);
        const dates = response.map((data) => moment(data.date).format('YYYY-MM-DD'));
        //  const dates = response.map((data) => moment(data.date).format('YYYY-MM-DD'));
        const valuesindifref = response.map((data) => data[baseProperty]);


        const lastValue = values[dates.indexOf(findLastDateOfPreviousMonth(dates))];
        const lastValueInd = valuesindifref[dates.indexOf(findLastDateOfPreviousMonth(dates))];


        // Dernière date du mois précédent
        const lastPreviousDate = findLastDateOfPreviousMonth(dates)

        const yArrayValuesnew = values.slice(dates.indexOf(lastPreviousDate), dates.length - 1);
        const yArrayDatesnew = dates.slice(dates.indexOf(lastPreviousDate), dates.length - 1);
        const yArrayValuesindifrefnew = values.slice(dates.indexOf(lastPreviousDate), dates.length - 1);

        const donneesarray = [];
        const donneesarrayindref = [];

        for (let i = 0; i < yArrayValuesnew.length; i++) {
          const date = yArrayDatesnew[i];
          const value = yArrayValuesnew[i];

          donneesarray.push({ date, value });
        }

        for (let i = 0; i < yArrayValuesindifrefnew.length; i++) {
          const date = yArrayDatesnew[i];
          const value = yArrayValuesindifrefnew[i];

          donneesarrayindref.push({ date, value });
        }


        //  const tauxGroupesParSemaine = grouperTauxParSemaine(tableauDonneestsr);
        /*   tableauDonneestsr.forEach((expObject) => {
       expObject.date = grouperTauxParSemaine(expObject.semaine);
     });*/
        let tauxsrannu = trouverElementLePlusProche(tableauDonneestsr, findNearestDateAnnualized(dates, 1, findLastDateOfPreviousMonth(dates)));

        //si le nombre de rendements de l'indice
        if (req.params.year === "1") {
          let donneesGroupéesSS = grouperParSemaine(donneesarray);
          let donneesGroupéesindice = grouperParSemaine(donneesarrayindref);

          let donneesGroupéesSSjour = grouperParJour(donneesarray);
          let donneesGroupéesindicejour = grouperParJour(donneesarrayindref);

          let donneesGroupéesSSmois = grouperParMois(donneesarray);
          let donneesGroupéesindicemois = grouperParMois(donneesarrayindref);


          // Calcul de la volatilité pour différentes périodes
          let endDate = moment(lastPreviousDate);
          let periods = {
            '1_an': findNearestDatetoyear(dates, 1, endDate),

          };
          let tauxensemainefilte = {};

          let volatilites = {};
          let volatilitesind = {};
          let rendementsTableau = {};
          let rendementsTableauindice = {};

          let volatilitesjour = {};
          let volatilitesindjour = {};
          let rendementsTableaujour = {};
          let rendementsTableauindicejour = {};


          let volatilitesmois = {};
          let volatilitesindmois = {};
          let rendementsTableaumois = {};
          let rendementsTableauindicemois = {};
          let Vls = [];
          let Vlsindice = [];
          for (let [periode, dateDebut] of Object.entries(periods)) {
            console.log(donneesGroupéesSSjour);

            let donneesPeriodesemaine = donneesGroupéesSS.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicesemaine = donneesGroupéesindice.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            //let donneestauxPeriodesemaine = tableauDonneestsr.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let donneesPeriodejour = donneesGroupéesSSjour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicejour = donneesGroupéesindicejour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            for (let i = 0; i <= donneesPeriodejour.length - 1; i++) {
              Vls.push(donneesPeriodejour[i].value)
            }
            for (let i = 0; i <= donneesPeriodeindicejour.length - 1; i++) {
              Vlsindice.push(donneesPeriodeindicejour[i].value)
            }
            let donneesPeriodemois = donneesGroupéesSSmois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicemois = donneesGroupéesindicemois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let rendementsPeriode = calculerRendements(donneesPeriodesemaine);
            let rendementsPeriodeindice = calculerRendements(donneesPeriodeindicesemaine);
            rendementsTableau[periode] = rendementsPeriode;
            rendementsTableauindice[periode] = rendementsPeriodeindice;

            volatilites[periode] = calculerVolatilite(rendementsPeriode);
            volatilitesind[periode] = calculerVolatilite(rendementsPeriodeindice);

            let rendementsPeriodejour = calculerRendements(donneesPeriodejour);
            let rendementsPeriodeindicejour = calculerRendements(donneesPeriodeindicejour);
            rendementsTableaujour[periode] = rendementsPeriodejour;
            rendementsTableauindicejour[periode] = rendementsPeriodeindicejour;

            volatilitesjour[periode] = calculerVolatilitejour(rendementsPeriodejour);
            volatilitesindjour[periode] = calculerVolatilitejour(rendementsPeriodeindicejour);

            let rendementsPeriodemois = calculerRendements(donneesPeriodemois);
            let rendementsPeriodeindicemois = calculerRendements(donneesPeriodeindicemois);
            rendementsTableaumois[periode] = rendementsPeriodemois;
            rendementsTableauindicemois[periode] = rendementsPeriodeindicemois;

            volatilitesmois[periode] = calculerVolatilitemois(rendementsPeriodemois);
            volatilitesindmois[periode] = calculerVolatilitemois(rendementsPeriodeindicemois);
            //tauxensemainefilte = donneestauxPeriodesemaine;
          }

          if (rendementsTableau['1_an'].length > 0) {

            const yDate = findNearestDateAnnualized(dates, 1, lastPreviousDate)

            const portfolioReturns = rendementsTableau['1_an']

            const benchmarkReturns = rendementsTableauindice['1_an'];
            const CAGR = calculerCAGR(values[dates.indexOf(findNearestDateAnnualized(dates, 1, findLastDateOfPreviousMonth(dates)))], lastValue, 1)

            //  const varindice = calculateVariance([...rendementsTableauindice['1_an']]);
            //  const cov = calculateCovariance(rendementsTableau['1_an'], [...rendementsTableauindice['1_an']])
            const perfAnnualisee = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDateAnnualized(dates, 1, findLastDateOfPreviousMonth(dates)))], 1);
            const perfAnnualiseeInd = calculateAnnualizedPerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDateAnnualized(dates, 1, findLastDateOfPreviousMonth(dates)))], 1);

            const info = calculateInformationRatio([...rendementsTableau['1_an']], [...rendementsTableauindice['1_an']])
            const infojour = calculateInformationRatiojour([...rendementsTableaujour['1_an']], [...rendementsTableauindicejour['1_an']])
            const infomois = calculateInformationRatio([...rendementsTableaumois['1_an']], [...rendementsTableauindicemois['1_an']])

            // const info= calculateInformationRationew(portfolioReturns,benchmarkReturns)* Math.sqrt(52);
            const beta = calculateBetanew(rendementsTableau['1_an'], rendementsTableauindice['1_an'])
            const betajour = calculateBetanew(rendementsTableaujour['1_an'], rendementsTableauindicejour['1_an'])
            const betamois = calculateBetanew(rendementsTableaumois['1_an'], rendementsTableauindicemois['1_an'])

            const VAR95 = calculateVAR95([...rendementsTableau["1_an"]], 0.95);
            const VAR95jour = calculateVAR95([...rendementsTableaujour["1_an"]], 0.95);
            const VAR95mois = calculateVAR95([...rendementsTableaumois["1_an"]], 0.95);

            const VAR99 = calculateVAR99([...rendementsTableau["1_an"]], 0.99)
            const VAR99jour = calculateVAR99([...rendementsTableaujour["1_an"]], 0.99)
            const VAR99mois = calculateVAR99([...rendementsTableaumois["1_an"]], 0.99)

            const skewness = calculerSkewness([...rendementsTableau["1_an"]], volatilites["1_an"])
            const skewnessjour = calculerSkewness([...rendementsTableaujour["1_an"]], volatilitesjour["1_an"])
            const skewnessmois = calculerSkewness([...rendementsTableaumois["1_an"]], volatilitesmois["1_an"])


            const kurtosis = calculateKurtosis([...rendementsTableau["1_an"]])
            const kurtosisjour = calculateKurtosis([...rendementsTableaujour["1_an"]])
            const kurtosismois = calculateKurtosis([...rendementsTableaumois["1_an"]])

            const maxDrawdown = calculateMaxDrawdown(Vls.reverse())
            const maxDrawdownInd = calculateMaxDrawdown(Vlsindice.reverse())
            const dsr = calculerDSRAnnualise([...rendementsTableau["1_an"]], 0.01)
            const dsrjour = calculerDSRAnnualise([...rendementsTableaujour["1_an"]], 0.01)
            const dsrmois = calculerDSRAnnualise([...rendementsTableaumois["1_an"]], 0.01)

            const omega = calculateOmegaRatio([...rendementsTableau["1_an"]], 0);
            const omegajour = calculateOmegaRatio([...rendementsTableaujour["1_an"]], 0);
            const omegamois = calculateOmegaRatio([...rendementsTableaumois["1_an"]], 0);

            const calmar = calculateCalmarRatio(maxDrawdown, CAGR)

            const sortino = calculateSortinoRatio([...rendementsTableau["1_an"]], -0.00473, 0.01);
            const sortinojour = calculateSortinoRatio([...rendementsTableaujour["1_an"]], -0.00473, 0.01);
            const sortinomois = calculateSortinoRatio([...rendementsTableaumois["1_an"]], -0.00473, 0.01);

            const betaBaiss = calculateDownsideBeta([...rendementsTableau["1_an"]], [...rendementsTableauindice["1_an"]])
            const betaBaissjour = calculateDownsideBeta([...rendementsTableaujour["1_an"]], [...rendementsTableauindicejour["1_an"]])
            const betaBaissmois = calculateDownsideBeta([...rendementsTableaumois["1_an"]], [...rendementsTableauindicemois["1_an"]])

            const betaHaussier = calculateHaussierBeta([...rendementsTableau["1_an"]], [...rendementsTableauindice["1_an"]])
            const betaHaussierjour = calculateHaussierBeta([...rendementsTableaujour["1_an"]], [...rendementsTableauindicejour["1_an"]])
            const betaHaussiermois = calculateHaussierBeta([...rendementsTableaumois["1_an"]], [...rendementsTableauindicemois["1_an"]])

            const trackingError = calculateTrackingError([...rendementsTableau["1_an"]], [...rendementsTableauindice["1_an"]])
            const trackingErrorjour = calculateTrackingError([...rendementsTableaujour["1_an"]], [...rendementsTableauindicejour["1_an"]])
            const trackingErrormois = calculateTrackingError([...rendementsTableaumois["1_an"]], [...rendementsTableauindicemois["1_an"]])

            const DownCaptureRatio = calculateDownCaptureRatio([...rendementsTableau["1_an"]], [...rendementsTableauindice["1_an"]])
            const DownCaptureRatiojour = calculateDownCaptureRatio([...rendementsTableaujour["1_an"]], [...rendementsTableauindicejour["1_an"]])
            const DownCaptureRatiomois = calculateDownCaptureRatio([...rendementsTableaumois["1_an"]], [...rendementsTableauindicemois["1_an"]])

            const UpCaptureRatio = calculateUpCaptureRatio([...rendementsTableau["1_an"]], [...rendementsTableauindice["1_an"]])
            const UpCaptureRatiojour = calculateUpCaptureRatio([...rendementsTableaujour["1_an"]], [...rendementsTableauindicejour["1_an"]])
            const UpCaptureRatiomois = calculateUpCaptureRatio([...rendementsTableaumois["1_an"]], [...rendementsTableauindicemois["1_an"]])

            // const dsr = calculerDSRAnnualise([...rendementsTableau["1_an"]], 0) 

            const delaiRecouvrement = calculerDelaiRecouvrementFonds(Vls.reverse());


            // const ratioSharpe = calculateSharpeRatio(rendementsTableau["1_an"], 0.000751923)
            const ratioSharpe = (CAGR - tauxsr) / volatilites["1_an"];
            const ratioSharpejour = (CAGR - tauxsr) / volatilitesjour["1_an"];
            const ratioSharpemois = (CAGR - tauxsr) / volatilitesmois["1_an"];

            const correlation = quants.corrcoef([...rendementsTableau["1_an"]], [...rendementsTableauindice["1_an"]], 0)
            const correlationjour = quants.corrcoef([...rendementsTableaujour["1_an"]], [...rendementsTableauindicejour["1_an"]], 0)
            const correlationmois = quants.corrcoef([...rendementsTableaumois["1_an"]], [...rendementsTableauindicemois["1_an"]], 0)

            // const r2 = quants.linreg([...rendementsTableau["1_an"]], [...rendementsTableauindice["1_an"]]).rsq
            const r2 = calculerR2([...rendementsTableau["1_an"]], [...rendementsTableauindice["1_an"]])
            const r2jour = calculerR2([...rendementsTableaujour["1_an"]], [...rendementsTableauindicejour["1_an"]])
            const r2mois = calculerR2([...rendementsTableaumois["1_an"]], [...rendementsTableauindicemois["1_an"]])



            res.json({
              code: 200,
              data: {

                volatility: volatilites["1_an"] * 100,
                volatilityjour: volatilitesjour["1_an"] * 100,
                volatilitymois: volatilitesmois["1_an"] * 100,
                volatilityInd: volatilitesind["1_an"] * 100,
                volatilityIndjour: volatilitesindjour["1_an"] * 100,
                volatilityIndmois: volatilitesindmois["1_an"] * 100,
                beta,
                betajour,
                betamois,
                perfAnnualisee: perfAnnualisee * 100,
                CAGR,
                perfAnnualiseeInd: perfAnnualiseeInd * 100,
                info,
                infojour: infojour,
                infomois: infomois,
                r2,
                r2jour,
                r2mois,
                // skewness,
                correlation,
                correlationjour,
                correlationmois,
                omega,
                omegajour,
                omegamois,
                sortino,
                sortinojour,
                sortinomois,
                calmar,

                // volatilityInd,
                maxDrawdown: -maxDrawdown * 100,
                maxDrawdownInd: -maxDrawdownInd * 100,
                dsr,
                dsrjour,
                dsrmois,
                ratioSharpe,
                ratioSharpejour,
                ratioSharpemois,
                // kurtosis,
                // betaHaussier,
                // betaBaiss,
                VAR95: VAR95 * 100,
                VAR95jour: VAR95jour * 100,
                VAR95jour: VAR95mois * 100,
                trackingError: trackingError * 100,
                trackingErrorjour: trackingErrorjour * 100,
                trackingErrorjour: trackingErrormois * 100,

                VAR99: VAR99 * 100,
                VAR99jour: VAR99jour * 100,
                VAR99mois: VAR99mois * 100,

                delaiRecouvrement,
                betaHaussier,
                betaHaussierjour,
                betaHaussiermois,

                betaBaiss,
                betaBaissjour,
                betaBaissmois,

                UpCaptureRatio,
                UpCaptureRatiojour,
                UpCaptureRatiomois,

                DownCaptureRatio,
                DownCaptureRatiojour,
                DownCaptureRatiomois,

                skewness,
                skewnessjour,
                skewnessmois,

                kurtosis,
                kurtosisjour,
                kurtosismois,


                // dd: (perfAnnualisee - perfAnnualiseeInd)
                // delaiRecouvrementInd
              }
            })
          } else {
            res.json({
              code: 200,
              data: {
                volatility: '-',
                volatilityInd: '-',
                beta: '-',
                perfAnnualisee: '-',
                perfAnnualiseeInd: '-',
                info: '-',
                r2: '-',
                // skewness,
                correlation: '-',
                omega: '-',
                sortino: '-',
                calmar: '-',
                // volatilityInd,
                maxDrawdown: '-',
                maxDrawdownInd: '-',
                dsr: '-',
                ratioSharpe: '-',
                // kurtosis,
                betaHaussier: '-',
                betaBaiss: '-',
                VAR95: '-',
                trackingError: '-',
                VAR99: '-',
                /* delaiRecouvrement,
                 betaHaussier,*/
                // betaBaiss:'-',
                /*  upCaptureRatio,
                  downCaptureRatio,*/
                // dd: (perfAnnualisee - perfAnnualiseeInd)
                // delaiRecouvrementInd
              }
            })
          }
        } else if (req.params.year === "3") {
          let donneesGroupéesSS = grouperParSemaine(donneesarray);
          let donneesGroupéesindice = grouperParSemaine(donneesarrayindref);

          let donneesGroupéesSSjour = grouperParJour(donneesarray);
          let donneesGroupéesindicejour = grouperParJour(donneesarrayindref);

          let donneesGroupéesSSmois = grouperParMois(donneesarray);
          let donneesGroupéesindicemois = grouperParMois(donneesarrayindref);


          // Calcul de la volatilité pour différentes périodes
          let endDate = moment(lastPreviousDate);
          let periods = {
            '3_ans': findNearestDatetoyear(dates, 3, endDate),


          };
          let tauxensemainefilte = {};

          let volatilites = {};
          let volatilitesind = {};
          let rendementsTableau = {};
          let rendementsTableauindice = {};

          let volatilitesjour = {};
          let volatilitesindjour = {};
          let rendementsTableaujour = {};
          let rendementsTableauindicejour = {};


          let volatilitesmois = {};
          let volatilitesindmois = {};
          let rendementsTableaumois = {};
          let rendementsTableauindicemois = {};


          let Vls = [];
          let Vlsindice = [];

          for (let [periode, dateDebut] of Object.entries(periods)) {
            console.log(donneesGroupéesSS);

            let donneesPeriodesemaine = donneesGroupéesSS.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicesemaine = donneesGroupéesindice.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            //let donneestauxPeriodesemaine = tableauDonneestsr.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let donneesPeriodejour = donneesGroupéesSSjour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicejour = donneesGroupéesindicejour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            for (let i = 0; i <= donneesPeriodejour.length - 1; i++) {
              Vls.push(donneesPeriodejour[i].value)
            }
            for (let i = 0; i <= donneesPeriodeindicejour.length - 1; i++) {
              Vlsindice.push(donneesPeriodeindicejour[i].value)
            }
            let donneesPeriodemois = donneesGroupéesSSmois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicemois = donneesGroupéesindicemois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let rendementsPeriode = calculerRendements(donneesPeriodesemaine);
            let rendementsPeriodeindice = calculerRendements(donneesPeriodeindicesemaine);
            rendementsTableau[periode] = rendementsPeriode;
            rendementsTableauindice[periode] = rendementsPeriodeindice;

            volatilites[periode] = calculerVolatilite(rendementsPeriode);
            volatilitesind[periode] = calculerVolatilite(rendementsPeriodeindice);

            let rendementsPeriodejour = calculerRendements(donneesPeriodejour);
            let rendementsPeriodeindicejour = calculerRendements(donneesPeriodeindicejour);
            rendementsTableaujour[periode] = rendementsPeriodejour;
            rendementsTableauindicejour[periode] = rendementsPeriodeindicejour;

            volatilitesjour[periode] = calculerVolatilitejour(rendementsPeriodejour);
            volatilitesindjour[periode] = calculerVolatilitejour(rendementsPeriodeindicejour);

            let rendementsPeriodemois = calculerRendements(donneesPeriodemois);
            let rendementsPeriodeindicemois = calculerRendements(donneesPeriodeindicemois);
            rendementsTableaumois[periode] = rendementsPeriodemois;
            rendementsTableauindicemois[periode] = rendementsPeriodeindicemois;

            volatilitesmois[periode] = calculerVolatilitemois(rendementsPeriodemois);
            volatilitesindmois[periode] = calculerVolatilitemois(rendementsPeriodeindicemois);
            //tauxensemainefilte = donneestauxPeriodesemaine;

          }
          //   if(rendementsTableau['3_an'].length>0){
          const yDate = findNearestDateAnnualized(dates, 3, lastPreviousDate)
          const CAGR = calculerCAGR(values[dates.indexOf(findNearestDateAnnualized(dates, 3, findLastDateOfPreviousMonth(dates)))], lastValue, 3)
          const portfolioReturns = rendementsTableau['3_ans']

          const benchmarkReturns = rendementsTableauindice['3_ans'];
          const perfAnnualisee = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDateAnnualized(dates, 3, findLastDateOfPreviousMonth(dates)))], 3);
          const perfAnnualiseeInd = calculateAnnualizedPerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDateAnnualized(dates, 3, findLastDateOfPreviousMonth(dates)))], 3);
          //  const varindice = calculateVariance([...rendementsTableauindice['3_ans']]);
          //  const cov = calculateCovariance(rendementsTableau['3_ans'], [...rendementsTableauindice['3_ans']])
          /*
                  const info= calculateInformationRatio([...rendementsTableau['3_ans']], [...rendementsTableauindice['3_ans']])
                  const infojour= calculateInformationRatiojour([...rendementsTableaujour['3_ans']], [...rendementsTableauindicejour['3_ans']])
          
                  // const info= calculateInformationRationew(portfolioReturns,benchmarkReturns)* Math.sqrt(52);
                  const beta=calculateBeta(rendementsTableau['3_ans'], rendementsTableauindice['3_ans'])
                  const VAR95 = calculateVAR95([...rendementsTableau["3_ans"]], 0.95);
                  const VAR99 = calculateVAR99([...rendementsTableau["3_ans"]], 0.99);
                
                console.log(valuesindifref.slice((dates.indexOf(lastPreviousDate)),dates.indexOf(yDate)  + 1))
                  const maxDrawdown = calculateMaxDrawdown(Vls.reverse())
                  const maxDrawdownInd = calculateMaxDrawdown(Vlsindice.reverse())
                  const dsr = calculerDSRAnnualise([...rendementsTableau["3_ans"]], 0)
                  const omega = calculateOmegaRatio([...rendementsTableau["3_ans"]], 0);
                  const calmar = calculateCalmarRatio(maxDrawdown,CAGR)
                  const sortino = calculateSortinoRatio([...rendementsTableau["3_ans"]],-0.00473,  0.01);
                  const betaBaiss = calculateDownsideBeta([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]])
                  const betaHaussier = calculateHaussierBeta([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]])
                  const trackingError = calculateTrackingError([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]]) 
                  const DownCaptureRatio = calculateDownCaptureRatio([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]]) 
                  const UpCaptureRatio = calculateUpCaptureRatio([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]]) 
                  const delaiRecouvrement=calculerDelaiRecouvrementFonds(Vls.reverse());
          
                  
          
          
                  //const ratioSharpe = calculateSharpeRatio(rendementsTableau["3_ans"], -0.00473)
                //  const ratioSharpe = calculateSharpeRatio(rendementsTableau["3_ans"], 0.000751923)
                  const ratioSharpe = (CAGR- tauxsr)/volatilites["3_ans"];
          
                  const correlation = quants.corrcoef([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]], 0)
                  
                 // const r2 = quants.linreg([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]]).rsq
                  const r2 = calculerR2([...rendementsTableau["3_ans"]],[...rendementsTableauindice["3_ans"]])
          */
          const info = calculateInformationRatio([...rendementsTableau['3_ans']], [...rendementsTableauindice['3_ans']])
          const infojour = calculateInformationRatiojour([...rendementsTableaujour['3_ans']], [...rendementsTableauindicejour['3_ans']])
          const infomois = calculateInformationRatiojour([...rendementsTableaumois['3_ans']], [...rendementsTableauindicemois['3_ans']])

          // const info= calculateInformationRationew(portfolioReturns,benchmarkReturns)* Math.sqrt(52);
          const beta = calculateBetanew(rendementsTableau['3_ans'], rendementsTableauindice['3_ans'])
          const betajour = calculateBetanew(rendementsTableaujour['3_ans'], rendementsTableauindicejour['3_ans'])
          const betamois = calculateBetanew(rendementsTableaumois['3_ans'], rendementsTableauindicemois['3_ans'])

          const VAR95 = calculateVAR95([...rendementsTableau["3_ans"]], 0.95);
          const VAR95jour = calculateVAR95([...rendementsTableaujour["3_ans"]], 0.95);
          const VAR95mois = calculateVAR95([...rendementsTableaumois["3_ans"]], 0.95);

          const VAR99 = calculateVAR99([...rendementsTableau["3_ans"]], 0.99)
          const VAR99jour = calculateVAR99([...rendementsTableaujour["3_ans"]], 0.99)
          const VAR99mois = calculateVAR99([...rendementsTableaumois["3_ans"]], 0.99)

          const skewness = calculerSkewness([...rendementsTableau["3_ans"]], volatilites["3_ans"])
          const skewnessjour = calculerSkewness([...rendementsTableaujour["3_ans"]], volatilitesjour["3_ans"])
          const skewnessmois = calculerSkewness([...rendementsTableaumois["3_ans"]], volatilitesmois["3_ans"])

          const kurtosis = calculateKurtosis([...rendementsTableau["3_ans"]])
          const kurtosisjour = calculateKurtosis([...rendementsTableaujour["3_ans"]])
          const kurtosismois = calculateKurtosis([...rendementsTableaumois["3_ans"]])

          const maxDrawdown = calculateMaxDrawdown(Vls.reverse())
          const maxDrawdownInd = calculateMaxDrawdown(Vlsindice.reverse())
          const dsr = calculerDSRAnnualise([...rendementsTableau["3_ans"]], 0.01)
          const dsrjour = calculerDSRAnnualise([...rendementsTableaujour["3_ans"]], 0.01)
          const dsrmois = calculerDSRAnnualise([...rendementsTableaumois["3_ans"]], 0.01)

          const omega = calculateOmegaRatio([...rendementsTableau["3_ans"]], 0);
          const omegajour = calculateOmegaRatio([...rendementsTableaujour["3_ans"]], 0);
          const omegamois = calculateOmegaRatio([...rendementsTableaumois["3_ans"]], 0);

          const calmar = calculateCalmarRatio(maxDrawdown, CAGR)

          const sortino = calculateSortinoRatio([...rendementsTableau["3_ans"]], -0.00473, 0.01);
          const sortinojour = calculateSortinoRatio([...rendementsTableaujour["3_ans"]], -0.00473, 0.01);
          const sortinomois = calculateSortinoRatio([...rendementsTableaumois["3_ans"]], -0.00473, 0.01);

          const betaBaiss = calculateDownsideBeta([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]])
          const betaBaissjour = calculateDownsideBeta([...rendementsTableaujour["3_ans"]], [...rendementsTableauindicejour["3_ans"]])
          const betaBaissmois = calculateDownsideBeta([...rendementsTableaumois["3_ans"]], [...rendementsTableauindicemois["3_ans"]])

          const betaHaussier = calculateHaussierBeta([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]])
          const betaHaussierjour = calculateHaussierBeta([...rendementsTableaujour["3_ans"]], [...rendementsTableauindicejour["3_ans"]])
          const betaHaussiermois = calculateHaussierBeta([...rendementsTableaumois["3_ans"]], [...rendementsTableauindicemois["3_ans"]])

          const trackingError = calculateTrackingError([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]])
          const trackingErrorjour = calculateTrackingError([...rendementsTableaujour["3_ans"]], [...rendementsTableauindicejour["3_ans"]])
          const trackingErrormois = calculateTrackingError([...rendementsTableaumois["3_ans"]], [...rendementsTableauindicemois["3_ans"]])

          const DownCaptureRatio = calculateDownCaptureRatio([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]])
          const DownCaptureRatiojour = calculateDownCaptureRatio([...rendementsTableaujour["3_ans"]], [...rendementsTableauindicejour["3_ans"]])
          const DownCaptureRatiomois = calculateDownCaptureRatio([...rendementsTableaumois["3_ans"]], [...rendementsTableauindicemois["3_ans"]])

          const UpCaptureRatio = calculateUpCaptureRatio([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]])
          const UpCaptureRatiojour = calculateUpCaptureRatio([...rendementsTableaujour["3_ans"]], [...rendementsTableauindicejour["3_ans"]])
          const UpCaptureRatiomois = calculateUpCaptureRatio([...rendementsTableaumois["3_ans"]], [...rendementsTableauindicemois["3_ans"]])

          // const dsr = calculerDSRAnnualise([...rendementsTableau["3_ans"]], 0) 

          const delaiRecouvrement = calculerDelaiRecouvrementFonds(Vls.reverse());


          // const ratioSharpe = calculateSharpeRatio(rendementsTableau["3_ans"], 0.000751923)
          const ratioSharpe = (CAGR - tauxsr) / volatilites["3_ans"];
          const ratioSharpejour = (CAGR - tauxsr) / volatilitesjour["3_ans"];
          const ratioSharpemois = (CAGR - tauxsr) / volatilitesmois["3_ans"];

          const correlation = quants.corrcoef([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]], 0)
          const correlationjour = quants.corrcoef([...rendementsTableaujour["3_ans"]], [...rendementsTableauindicejour["3_ans"]], 0)
          const correlationmois = quants.corrcoef([...rendementsTableaumois["3_ans"]], [...rendementsTableauindicemois["3_ans"]], 0)

          // const r2 = quants.linreg([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]]).rsq
          const r2 = calculerR2([...rendementsTableau["3_ans"]], [...rendementsTableauindice["3_ans"]])
          const r2jour = calculerR2([...rendementsTableaujour["3_ans"]], [...rendementsTableauindicejour["3_ans"]])
          const r2mois = calculerR2([...rendementsTableaumois["3_ans"]], [...rendementsTableauindicemois["3_ans"]])



          res.json({
            code: 200,
            data: {

              volatility: volatilites["3_ans"] * 100,
              volatilityjour: volatilitesjour["3_ans"] * 100,
              volatilitymois: volatilitesmois["3_ans"] * 100,
              volatilityInd: volatilitesind["3_ans"] * 100,
              volatilityIndjour: volatilitesindjour["3_ans"] * 100,
              volatilityIndmois: volatilitesindmois["3_ans"] * 100,
              beta,
              betajour,
              betamois,
              perfAnnualisee: perfAnnualisee * 100,
              CAGR,
              perfAnnualiseeInd: perfAnnualiseeInd * 100,
              info,
              infojour: infojour,
              infomois: infomois,
              r2,
              r2jour,
              r2mois,
              // skewness,
              correlation,
              correlationjour,
              correlationmois,
              omega,
              omegajour,
              omegamois,
              sortino,
              sortinojour,
              sortinomois,
              calmar,

              // volatilityInd,
              maxDrawdown: -maxDrawdown * 100,
              maxDrawdownInd: -maxDrawdownInd * 100,
              dsr,
              dsrjour,
              dsrmois,
              ratioSharpe,
              ratioSharpejour,
              ratioSharpemois,
              // kurtosis,
              // betaHaussier,
              // betaBaiss,
              VAR95: VAR95 * 100,
              VAR95jour: VAR95jour * 100,
              VAR95jour: VAR95mois * 100,
              trackingError: trackingError * 100,
              trackingErrorjour: trackingErrorjour * 100,
              trackingErrorjour: trackingErrormois * 100,

              VAR99: VAR99 * 100,
              VAR99jour: VAR99jour * 100,
              VAR99mois: VAR99mois * 100,

              delaiRecouvrement,
              betaHaussier,
              betaHaussierjour,
              betaHaussiermois,

              betaBaiss,
              betaBaissjour,
              betaBaissmois,

              UpCaptureRatio,
              UpCaptureRatiojour,
              UpCaptureRatiomois,

              DownCaptureRatio,
              DownCaptureRatiojour,
              DownCaptureRatiomois,

              skewness,
              skewnessjour,
              skewnessmois,

              kurtosis,
              kurtosisjour,
              kurtosismois,

              // dd: (perfAnnualisee - perfAnnualiseeInd)
              // delaiRecouvrementInd
            }
          })
          /*   }else{
               res.json({
                 code: 200,
                 data: {
                   volatility: '-',
                   volatilityInd: '-',
                   beta:'-',
                   perfAnnualisee: '-',
                   perfAnnualiseeInd: '-',
                   info:'-',
                   r2:'-',
                   // skewness,
                   correlation:'-',
                   omega:'-',
                   sortino:'-',
                   calmar:'-',
                   // volatilityInd,
                   maxDrawdown: '-',
                   maxDrawdownInd: '-',
                   dsr:'-',
                   ratioSharpe:'-',
                   // kurtosis,
                   // betaHaussier,
                   // betaBaiss,
                   VAR95: '-',
                   trackingError: '-',
                   VAR99: '-',
                 
                  
                   betaBaiss:'-',
                  
                   // dd: (perfAnnualisee - perfAnnualiseeInd)
                   // delaiRecouvrementInd
                 }
               })
             }*/
        } else if (req.params.year === "5") {
          let donneesGroupéesSS = grouperParSemaine(donneesarray);
          let donneesGroupéesindice = grouperParSemaine(donneesarrayindref);

          console.log(donneesarray);
          console.log(donneesGroupéesSS)

          let donneesGroupéesSSjour = grouperParJour(donneesarray);
          let donneesGroupéesindicejour = grouperParJour(donneesarrayindref);

          let donneesGroupéesSSmois = grouperParMois(donneesarray);
          let donneesGroupéesindicemois = grouperParMois(donneesarrayindref);


          // Calcul de la volatilité pour différentes périodes
          let endDate = moment(lastPreviousDate);
          let periods = {
            '5_ans': findNearestDatetoyear(dates, 5, endDate),


          };
          let tauxensemainefilte = {};

          let volatilites = {};
          let volatilitesind = {};
          let rendementsTableau = {};
          let rendementsTableauindice = {};

          let volatilitesjour = {};
          let volatilitesindjour = {};
          let rendementsTableaujour = {};
          let rendementsTableauindicejour = {};


          let volatilitesmois = {};
          let volatilitesindmois = {};
          let rendementsTableaumois = {};
          let rendementsTableauindicemois = {};
          let Vls = [];
          let Vlsindice = [];
          for (let [periode, dateDebut] of Object.entries(periods)) {
            //  console.log(donneesGroupéesSS);

            let donneesPeriodesemaine = donneesGroupéesSS.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicesemaine = donneesGroupéesindice.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            //let donneestauxPeriodesemaine = tableauDonneestsr.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            console.log(donneesPeriodesemaine);

            let donneesPeriodejour = donneesGroupéesSSjour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicejour = donneesGroupéesindicejour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            for (let i = 0; i <= donneesPeriodejour.length - 1; i++) {
              Vls.push(donneesPeriodejour[i].value)
            }
            for (let i = 0; i <= donneesPeriodeindicejour.length - 1; i++) {
              Vlsindice.push(donneesPeriodeindicejour[i].value)
            }
            let donneesPeriodemois = donneesGroupéesSSmois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicemois = donneesGroupéesindicemois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let rendementsPeriode = calculerRendements(donneesPeriodesemaine);
            let rendementsPeriodeindice = calculerRendements(donneesPeriodeindicesemaine);
            rendementsTableau[periode] = rendementsPeriode;
            rendementsTableauindice[periode] = rendementsPeriodeindice;

            volatilites[periode] = calculerVolatilite(rendementsPeriode);
            volatilitesind[periode] = calculerVolatilite(rendementsPeriodeindice);

            let rendementsPeriodejour = calculerRendements(donneesPeriodejour);
            let rendementsPeriodeindicejour = calculerRendements(donneesPeriodeindicejour);
            rendementsTableaujour[periode] = rendementsPeriodejour;
            rendementsTableauindicejour[periode] = rendementsPeriodeindicejour;

            volatilitesjour[periode] = calculerVolatilitejour(rendementsPeriodejour);
            volatilitesindjour[periode] = calculerVolatilitejour(rendementsPeriodeindicejour);

            let rendementsPeriodemois = calculerRendements(donneesPeriodemois);
            let rendementsPeriodeindicemois = calculerRendements(donneesPeriodeindicemois);
            rendementsTableaumois[periode] = rendementsPeriodemois;
            rendementsTableauindicemois[periode] = rendementsPeriodeindicemois;

            volatilitesmois[periode] = calculerVolatilitemois(rendementsPeriodemois);
            volatilitesindmois[periode] = calculerVolatilitemois(rendementsPeriodeindicemois);
            //tauxensemainefilte = donneestauxPeriodesemaine;

          }
          //     if(rendementsTableau['5_an'].length>0){
          const yDate = findNearestDateAnnualized(dates, 5, lastPreviousDate)

          const portfolioReturns = rendementsTableau['5_ans']
          const CAGR = calculerCAGR(values[dates.indexOf(findNearestDateAnnualized(dates, 5, findLastDateOfPreviousMonth(dates)))], lastValue, 5)
          const benchmarkReturns = rendementsTableauindice['5_ans'];
          const perfAnnualisee = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDateAnnualized(dates, 5, findLastDateOfPreviousMonth(dates)))], 5);
          const perfAnnualiseeInd = calculateAnnualizedPerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDateAnnualized(dates, 5, findLastDateOfPreviousMonth(dates)))], 5);
          //    const varindice = calculateVariance([...rendementsTableauindice['5_ans']]);
          //    const cov = calculateCovariance(rendementsTableau['5_ans'], [...rendementsTableauindice['5_ans']])
          const info = calculateInformationRatio([...rendementsTableau['5_ans']], [...rendementsTableauindice['5_ans']])
          const infojour = calculateInformationRatiojour([...rendementsTableaujour['5_ans']], [...rendementsTableauindicejour['5_ans']])
          const infomois = calculateInformationRatiojour([...rendementsTableaumois['5_ans']], [...rendementsTableauindicemois['5_ans']])

          // const info= calculateInformationRationew(portfolioReturns,benchmarkReturns)* Math.sqrt(52);
          const beta = calculateBetanew(rendementsTableau['5_ans'], rendementsTableauindice['5_ans'])
          const betajour = calculateBetanew(rendementsTableaujour['5_ans'], rendementsTableauindicejour['5_ans'])
          const betamois = calculateBetanew(rendementsTableaumois['5_ans'], rendementsTableauindicemois['5_ans'])

          const VAR95 = calculateVAR95([...rendementsTableau["5_ans"]], 0.95);
          const VAR95jour = calculateVAR95([...rendementsTableaujour["5_ans"]], 0.95);
          const VAR95mois = calculateVAR95([...rendementsTableaumois["5_ans"]], 0.95);

          const VAR99 = calculateVAR99([...rendementsTableau["5_ans"]], 0.99)
          const VAR99jour = calculateVAR99([...rendementsTableaujour["5_ans"]], 0.99)
          const VAR99mois = calculateVAR99([...rendementsTableaumois["5_ans"]], 0.99)

          const skewness = calculerSkewness([...rendementsTableau["5_ans"]], volatilites["5_ans"])
          const skewnessjour = calculerSkewness([...rendementsTableaujour["5_ans"]], volatilitesjour["5_ans"])
          const skewnessmois = calculerSkewness([...rendementsTableaumois["5_ans"]], volatilitesmois["5_ans"])
          const kurtosis = calculateKurtosis([...rendementsTableau["5_ans"]])
          const kurtosisjour = calculateKurtosis([...rendementsTableaujour["5_ans"]])
          const kurtosismois = calculateKurtosis([...rendementsTableaumois["5_ans"]])

          const maxDrawdown = calculateMaxDrawdown(Vls.reverse())
          const maxDrawdownInd = calculateMaxDrawdown(Vlsindice.reverse())
          const dsr = calculerDSRAnnualise([...rendementsTableau["5_ans"]], 0.01)
          const dsrjour = calculerDSRAnnualise([...rendementsTableaujour["5_ans"]], 0.01)
          const dsrmois = calculerDSRAnnualise([...rendementsTableaumois["5_ans"]], 0.01)

          const omega = calculateOmegaRatio([...rendementsTableau["5_ans"]], 0);
          const omegajour = calculateOmegaRatio([...rendementsTableaujour["5_ans"]], 0);
          const omegamois = calculateOmegaRatio([...rendementsTableaumois["5_ans"]], 0);

          const calmar = calculateCalmarRatio(maxDrawdown, CAGR)

          const sortino = calculateSortinoRatio([...rendementsTableau["5_ans"]], -0.00473, 0.01);
          const sortinojour = calculateSortinoRatio([...rendementsTableaujour["5_ans"]], -0.00473, 0.01);
          const sortinomois = calculateSortinoRatio([...rendementsTableaumois["5_ans"]], -0.00473, 0.01);

          const betaBaiss = calculateDownsideBeta([...rendementsTableau["5_ans"]], [...rendementsTableauindice["5_ans"]])
          const betaBaissjour = calculateDownsideBeta([...rendementsTableaujour["5_ans"]], [...rendementsTableauindicejour["5_ans"]])
          const betaBaissmois = calculateDownsideBeta([...rendementsTableaumois["5_ans"]], [...rendementsTableauindicemois["5_ans"]])

          const betaHaussier = calculateHaussierBeta([...rendementsTableau["5_ans"]], [...rendementsTableauindice["5_ans"]])
          const betaHaussierjour = calculateHaussierBeta([...rendementsTableaujour["5_ans"]], [...rendementsTableauindicejour["5_ans"]])
          const betaHaussiermois = calculateHaussierBeta([...rendementsTableaumois["5_ans"]], [...rendementsTableauindicemois["5_ans"]])

          const trackingError = calculateTrackingError([...rendementsTableau["5_ans"]], [...rendementsTableauindice["5_ans"]])
          const trackingErrorjour = calculateTrackingError([...rendementsTableaujour["5_ans"]], [...rendementsTableauindicejour["5_ans"]])
          const trackingErrormois = calculateTrackingError([...rendementsTableaumois["5_ans"]], [...rendementsTableauindicemois["5_ans"]])

          const DownCaptureRatio = calculateDownCaptureRatio([...rendementsTableau["5_ans"]], [...rendementsTableauindice["5_ans"]])
          const DownCaptureRatiojour = calculateDownCaptureRatio([...rendementsTableaujour["5_ans"]], [...rendementsTableauindicejour["5_ans"]])
          const DownCaptureRatiomois = calculateDownCaptureRatio([...rendementsTableaumois["5_ans"]], [...rendementsTableauindicemois["5_ans"]])

          const UpCaptureRatio = calculateUpCaptureRatio([...rendementsTableau["5_ans"]], [...rendementsTableauindice["5_ans"]])
          const UpCaptureRatiojour = calculateUpCaptureRatio([...rendementsTableaujour["5_ans"]], [...rendementsTableauindicejour["5_ans"]])
          const UpCaptureRatiomois = calculateUpCaptureRatio([...rendementsTableaumois["5_ans"]], [...rendementsTableauindicemois["5_ans"]])

          // const dsr = calculerDSRAnnualise([...rendementsTableau["5_ans"]], 0) 

          const delaiRecouvrement = calculerDelaiRecouvrementFonds(Vls.reverse());


          // const ratioSharpe = calculateSharpeRatio(rendementsTableau["5_ans"], 0.000751923)
          const ratioSharpe = (CAGR - tauxsr) / volatilites["5_ans"];
          const ratioSharpejour = (CAGR - tauxsr) / volatilitesjour["5_ans"];
          const ratioSharpemois = (CAGR - tauxsr) / volatilitesmois["5_ans"];

          const correlation = quants.corrcoef([...rendementsTableau["5_ans"]], [...rendementsTableauindice["5_ans"]], 0)
          const correlationjour = quants.corrcoef([...rendementsTableaujour["5_ans"]], [...rendementsTableauindicejour["5_ans"]], 0)
          const correlationmois = quants.corrcoef([...rendementsTableaumois["5_ans"]], [...rendementsTableauindicemois["5_ans"]], 0)

          // const r2 = quants.linreg([...rendementsTableau["5_ans"]], [...rendementsTableauindice["5_ans"]]).rsq
          const r2 = calculerR2([...rendementsTableau["5_ans"]], [...rendementsTableauindice["5_ans"]])
          const r2jour = calculerR2([...rendementsTableaujour["5_ans"]], [...rendementsTableauindicejour["5_ans"]])
          const r2mois = calculerR2([...rendementsTableaumois["5_ans"]], [...rendementsTableauindicemois["5_ans"]])



          res.json({
            code: 200,
            data: {

              volatility: volatilites["5_ans"] * 100,
              volatilityjour: volatilitesjour["5_ans"] * 100,
              volatilitymois: volatilitesmois["5_ans"] * 100,
              volatilityInd: volatilitesind["5_ans"] * 100,
              volatilityIndjour: volatilitesindjour["5_ans"] * 100,
              volatilityIndmois: volatilitesindmois["5_ans"] * 100,
              beta,
              betajour,
              betamois,
              perfAnnualisee: perfAnnualisee * 100,
              CAGR,
              perfAnnualiseeInd: perfAnnualiseeInd * 100,
              info,
              infojour: infojour,
              infomois: infomois,
              r2,
              r2jour,
              r2mois,
              // skewness,
              correlation,
              correlationjour,
              correlationmois,
              omega,
              omegajour,
              omegamois,
              sortino,
              sortinojour,
              sortinomois,
              calmar,

              // volatilityInd,
              maxDrawdown: -maxDrawdown * 100,
              maxDrawdownInd: -maxDrawdownInd * 100,
              dsr,
              dsrjour,
              dsrmois,
              ratioSharpe,
              ratioSharpejour,
              ratioSharpemois,
              // kurtosis,
              // betaHaussier,
              // betaBaiss,
              VAR95: VAR95 * 100,
              VAR95jour: VAR95jour * 100,
              VAR95jour: VAR95mois * 100,
              trackingError: trackingError * 100,
              trackingErrorjour: trackingErrorjour * 100,
              trackingErrorjour: trackingErrormois * 100,

              VAR99: VAR99 * 100,
              VAR99jour: VAR99jour * 100,
              VAR99mois: VAR99mois * 100,

              delaiRecouvrement,
              betaHaussier,
              betaHaussierjour,
              betaHaussiermois,

              betaBaiss,
              betaBaissjour,
              betaBaissmois,

              UpCaptureRatio,
              UpCaptureRatiojour,
              UpCaptureRatiomois,

              DownCaptureRatio,
              DownCaptureRatiojour,
              DownCaptureRatiomois,

              skewness,
              skewnessjour,
              skewnessmois,

              kurtosis,
              kurtosisjour,
              kurtosismois,
              // dd: (perfAnnualisee - perfAnnualiseeInd)
              // delaiRecouvrementInd
            }
          })
          /*  }else{
              res.json({
                code: 200,
                data: {
                  volatility: '-',
                  volatilityInd: '-',
                  beta:'-',
                  perfAnnualisee: '-',
                  perfAnnualiseeInd: '-',
                  info:'-',
                  r2:'-',
                  // skewness,
                  correlation:'-',
                  omega:'-',
                  sortino:'-',
                  calmar:'-',
                  // volatilityInd,
                  maxDrawdown: '-',
                  maxDrawdownInd: '-',
                  dsr:'-',
                  ratioSharpe:'-',
                  // kurtosis,
                  // betaHaussier,
                  // betaBaiss,
                  VAR95: '-',
                  trackingError: '-',
                  VAR99: '-',
               
                  betaBaiss:'-',
                  
                  // dd: (perfAnnualisee - perfAnnualiseeInd)
                  // delaiRecouvrementInd
                }
              })
            }*/
        } else if (req.params.year === "8") {
          let donneesGroupéesSS = grouperParSemaine(donneesarray);
          let donneesGroupéesindice = grouperParSemaine(donneesarrayindref);

          let donneesGroupéesSSjour = grouperParJour(donneesarray);
          let donneesGroupéesindicejour = grouperParJour(donneesarrayindref);

          let donneesGroupéesSSmois = grouperParMois(donneesarray);
          let donneesGroupéesindicemois = grouperParMois(donneesarrayindref);


          // Calcul de la volatilité pour différentes périodes
          let endDate = moment(lastPreviousDate);
          let periods = {
            '8_ans': findNearestDatetoyear(dates, 8, endDate),


          };
          let tauxensemainefilte = {};

          let volatilites = {};
          let volatilitesind = {};
          let rendementsTableau = {};
          let rendementsTableauindice = {};

          let volatilitesjour = {};
          let volatilitesindjour = {};
          let rendementsTableaujour = {};
          let rendementsTableauindicejour = {};


          let volatilitesmois = {};
          let volatilitesindmois = {};
          let rendementsTableaumois = {};
          let rendementsTableauindicemois = {};
          let Vls = [];
          let Vlsindice = [];
          for (let [periode, dateDebut] of Object.entries(periods)) {
            console.log(donneesGroupéesSS);

            let donneesPeriodesemaine = donneesGroupéesSS.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicesemaine = donneesGroupéesindice.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            //let donneestauxPeriodesemaine = tableauDonneestsr.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let donneesPeriodejour = donneesGroupéesSSjour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicejour = donneesGroupéesindicejour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            for (let i = 0; i <= donneesPeriodejour.length - 1; i++) {
              Vls.push(donneesPeriodejour[i].value)
            }
            for (let i = 0; i <= donneesPeriodeindicejour.length - 1; i++) {
              Vlsindice.push(donneesPeriodeindicejour[i].value)
            }
            let donneesPeriodemois = donneesGroupéesSSmois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicemois = donneesGroupéesindicemois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let rendementsPeriode = calculerRendements(donneesPeriodesemaine);
            let rendementsPeriodeindice = calculerRendements(donneesPeriodeindicesemaine);
            rendementsTableau[periode] = rendementsPeriode;
            rendementsTableauindice[periode] = rendementsPeriodeindice;

            volatilites[periode] = calculerVolatilite(rendementsPeriode);
            volatilitesind[periode] = calculerVolatilite(rendementsPeriodeindice);

            let rendementsPeriodejour = calculerRendements(donneesPeriodejour);
            let rendementsPeriodeindicejour = calculerRendements(donneesPeriodeindicejour);
            rendementsTableaujour[periode] = rendementsPeriodejour;
            rendementsTableauindicejour[periode] = rendementsPeriodeindicejour;

            volatilitesjour[periode] = calculerVolatilite(rendementsPeriodejour);
            volatilitesindjour[periode] = calculerVolatilite(rendementsPeriodeindicejour);

            let rendementsPeriodemois = calculerRendements(donneesPeriodemois);
            let rendementsPeriodeindicemois = calculerRendements(donneesPeriodeindicemois);
            rendementsTableaumois[periode] = rendementsPeriodemois;
            rendementsTableauindicemois[periode] = rendementsPeriodeindicemois;

            volatilitesmois[periode] = calculerVolatilite(rendementsPeriodemois);
            volatilitesindmois[periode] = calculerVolatilite(rendementsPeriodeindicemois);
            //tauxensemainefilte = donneestauxPeriodesemaine;

          }
          const yDate = findNearestDateAnnualized(dates, 8, lastPreviousDate)

          const portfolioReturns = rendementsTableau['8_ans']

          const benchmarkReturns = rendementsTableauindice['8_ans'];
          const perfAnnualisee = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDateAnnualized(dates, 8, findLastDateOfPreviousMonth(dates)))], 8);
          const perfAnnualiseeInd = calculateAnnualizedPerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDateAnnualized(dates, 8, findLastDateOfPreviousMonth(dates)))], 8);
          //   const varindice = calculateVariance([...rendementsTableauindice['1_an']]);
          //   const cov = calculateCovariance(rendementsTableau['1_an'], [...rendementsTableauindice['1_an']])

          //const info= quants.inforatio([...rendementsTableau['3_ans']], [...rendementsTableauindice['3_ans']])* Math.sqrt(52)
          const info = calculateInformationRatio([...rendementsTableau['8_ans']], [...rendementsTableauindice['8_ans']])
          const beta = calculateBeta(rendementsTableau['8_ans'], rendementsTableauindice['8_ans'])
          const VAR95 = calculateVAR95([...rendementsTableau["8_ans"]], 0.95);
          const VAR99 = calculateVAR99([...rendementsTableau["8_ans"]], 0.99)
          const maxDrawdown = calculateMaxDrawdown(Vls.reverse())
          const maxDrawdownInd = calculateMaxDrawdown(Vlsindice.reverse())
          const dsr = calculerDSRAnnualise([...rendementsTableau["8_ans"]], 0.01)
          const omega = calculateOmegaRatio([...rendementsTableau["8_ans"]], 0);
          const calmar = calculateCalmarRatio([...rendementsTableau["8_ans"]], 8)
          const sortino = calculateSortinoRatio([...rendementsTableau["8_ans"]], -0.00473, 0.01);
          const betaBaiss = calculateDownsideBeta([...rendementsTableau["8_ans"]], [...rendementsTableauindice["8_ans"]])
          const trackingError = calculateTrackingError([...rendementsTableau["8_ans"]], [...rendementsTableauindice["8_ans"]])
          const DownCaptureRatio = calculateDownCaptureRatio([...rendementsTableau["8_ans"]], [...rendementsTableauindice["8_ans"]])
          const UpCaptureRatio = calculateUpCaptureRatio([...rendementsTableau["8_ans"]], [...rendementsTableauindice["8_ans"]])
          const delaiRecouvrement = calculerDelaiRecouvrementFonds(Vls.reverse());




          const ratioSharpe = calculateSharpeRatio(rendementsTableau["8_ans"], -0.00473)
          const correlation = quants.corrcoef([...rendementsTableau["8_ans"]], [...rendementsTableauindice["8_ans"]], 0)

          // const r2 = quants.linreg([...rendementsTableau["8_ans"]], [...rendementsTableauindice["8_ans"]]).rsq
          const r2 = calculerR2([...rendementsTableau["8_ans"]], [...rendementsTableauindice["8_ans"]])


          console.log(beta);

          res.json({
            code: 200,
            data: {
              volatility: volatilites["8_ans"] * 100,
              volatilityInd: volatilitesind["8_ans"] * 100,
              beta,
              perfAnnualisee: perfAnnualisee * 100,
              perfAnnualiseeInd: perfAnnualiseeInd * 100,
              info,
              r2,
              // skewness,
              correlation,
              omega,
              sortino,
              calmar,
              // volatilityInd,
              maxDrawdown: -maxDrawdown * 100,
              maxDrawdownInd: -maxDrawdownInd * 100,
              dsr,
              ratioSharpe,
              // kurtosis,
              // betaHaussier,
              // betaBaiss,
              VAR95: VAR95 * 100,
              trackingError: trackingError * 100,
              VAR99: VAR99 * 100,
              delaiRecouvrement,
              /*betaHaussier,*/
              betaBaiss,
              /*  upCaptureRatio,
                downCaptureRatio,*/
              // dd: (perfAnnualisee - perfAnnualiseeInd)
              // delaiRecouvrementInd
            }
          })
        } else if (req.params.year === "10") {
          let donneesGroupéesSS = grouperParSemaine(donneesarray);
          let donneesGroupéesindice = grouperParSemaine(donneesarrayindref);

          let donneesGroupéesSSjour = grouperParJour(donneesarray);
          let donneesGroupéesindicejour = grouperParJour(donneesarrayindref);

          let donneesGroupéesSSmois = grouperParMois(donneesarray);
          let donneesGroupéesindicemois = grouperParMois(donneesarrayindref);


          // Calcul de la volatilité pour différentes périodes
          let endDate = moment(lastPreviousDate);
          let periods = {
            '10_ans': findNearestDatetoyear(dates, 10, endDate),


          };
          let tauxensemainefilte = {};

          let volatilites = {};
          let volatilitesind = {};
          let rendementsTableau = {};
          let rendementsTableauindice = {};

          let volatilitesjour = {};
          let volatilitesindjour = {};
          let rendementsTableaujour = {};
          let rendementsTableauindicejour = {};


          let volatilitesmois = {};
          let volatilitesindmois = {};
          let rendementsTableaumois = {};
          let rendementsTableauindicemois = {};
          let Vls = [];
          let Vlsindice = [];
          for (let [periode, dateDebut] of Object.entries(periods)) {
            console.log(donneesGroupéesSS);

            let donneesPeriodesemaine = donneesGroupéesSS.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicesemaine = donneesGroupéesindice.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            //let donneestauxPeriodesemaine = tableauDonneestsr.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let donneesPeriodejour = donneesGroupéesSSjour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicejour = donneesGroupéesindicejour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            for (let i = 0; i <= donneesPeriodejour.length - 1; i++) {
              Vls.push(donneesPeriodejour[i].value)
            }
            for (let i = 0; i <= donneesPeriodeindicejour.length - 1; i++) {
              Vlsindice.push(donneesPeriodeindicejour[i].value)
            }
            let donneesPeriodemois = donneesGroupéesSSmois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicemois = donneesGroupéesindicemois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let rendementsPeriode = calculerRendements(donneesPeriodesemaine);
            let rendementsPeriodeindice = calculerRendements(donneesPeriodeindicesemaine);
            rendementsTableau[periode] = rendementsPeriode;
            rendementsTableauindice[periode] = rendementsPeriodeindice;

            volatilites[periode] = calculerVolatilite(rendementsPeriode);
            volatilitesind[periode] = calculerVolatilite(rendementsPeriodeindice);

            let rendementsPeriodejour = calculerRendements(donneesPeriodejour);
            let rendementsPeriodeindicejour = calculerRendements(donneesPeriodeindicejour);
            rendementsTableaujour[periode] = rendementsPeriodejour;
            rendementsTableauindicejour[periode] = rendementsPeriodeindicejour;

            volatilitesjour[periode] = calculerVolatilite(rendementsPeriodejour);
            volatilitesindjour[periode] = calculerVolatilite(rendementsPeriodeindicejour);

            let rendementsPeriodemois = calculerRendements(donneesPeriodemois);
            let rendementsPeriodeindicemois = calculerRendements(donneesPeriodeindicemois);
            rendementsTableaumois[periode] = rendementsPeriodemois;
            rendementsTableauindicemois[periode] = rendementsPeriodeindicemois;

            volatilitesmois[periode] = calculerVolatilite(rendementsPeriodemois);
            volatilitesindmois[periode] = calculerVolatilite(rendementsPeriodeindicemois);
            //tauxensemainefilte = donneestauxPeriodesemaine;

          }
          const yDate = findNearestDateAnnualized(dates, 10, lastPreviousDate)

          const portfolioReturns = rendementsTableau['10_ans']

          const benchmarkReturns = rendementsTableauindice['10_ans'];
          const perfAnnualisee = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDateAnnualized(dates, 10, findLastDateOfPreviousMonth(dates)))], 10);
          const perfAnnualiseeInd = calculateAnnualizedPerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDateAnnualized(dates, 10, findLastDateOfPreviousMonth(dates)))], 10);
          //   const varindice = calculateVariance([...rendementsTableauindice['1_an']]);
          //   const cov = calculateCovariance(rendementsTableau['1_an'], [...rendementsTableauindice['1_an']])

          //const info= quants.inforatio([...rendementsTableau['3_ans']], [...rendementsTableauindice['3_ans']])* Math.sqrt(52)
          const info = calculateInformationRatiojour([...rendementsTableaujour['10_ans']], [...rendementsTableauindicejour['10_ans']])
          const beta = calculateBeta(rendementsTableau['10_ans'], rendementsTableauindice['10_ans'])
          const VAR95 = calculateVAR95([...rendementsTableau["10_ans"]], 0.95);
          const VAR99 = calculateVAR99([...rendementsTableau["10_ans"]], 0.99)
          const maxDrawdown = calculateMaxDrawdown(Vls.reverse())
          const maxDrawdownInd = calculateMaxDrawdown(Vlsindice.reverse())
          const dsr = calculerDSRAnnualise([...rendementsTableau["10_ans"]], 0.01)
          const omega = calculateOmegaRatio([...rendementsTableau["10_ans"]], 0);
          const calmar = calculateCalmarRatio([...rendementsTableau["10_ans"]], 10)
          const sortino = calculateSortinoRatio([...rendementsTableau["10_ans"]], -0.00473, 0.01);
          const betaBaiss = calculateDownsideBeta([...rendementsTableau["10_ans"]], [...rendementsTableauindice["10_ans"]])
          const trackingError = calculateTrackingError([...rendementsTableau["10_ans"]], [...rendementsTableauindice["10_ans"]])
          const DownCaptureRatio = calculateDownCaptureRatio([...rendementsTableau["10_ans"]], [...rendementsTableauindice["10_ans"]])
          const UpCaptureRatio = calculateUpCaptureRatio([...rendementsTableau["10_ans"]], [...rendementsTableauindice["10_ans"]])

          const delaiRecouvrement = calculerDelaiRecouvrementFonds(Vls.reverse());



          const ratioSharpe = calculateSharpeRatio(rendementsTableau["10_ans"], -0.00473)
          const correlation = quants.corrcoef([...rendementsTableau["10_ans"]], [...rendementsTableauindice["10_ans"]], 0)

          // const r2 = quants.linreg([...rendementsTableau["10_ans"]], [...rendementsTableauindice["10_ans"]]).rsq
          const r2 = calculerR2([...rendementsTableau["10_ans"]], [...rendementsTableauindice["10_ans"]])


          console.log(beta);

          res.json({
            code: 200,
            data: {
              volatility: volatilites["10_ans"] * 100,
              volatilityInd: volatilitesind["10_ans"] * 100,
              beta,
              perfAnnualisee: perfAnnualisee * 100,
              perfAnnualiseeInd: perfAnnualiseeInd * 100,
              info,
              r2,
              // skewness,
              correlation,
              omega,
              sortino,
              calmar,
              // volatilityInd,
              maxDrawdown: -maxDrawdown * 100,
              maxDrawdownInd: -maxDrawdownInd * 100,
              dsr,
              ratioSharpe,
              // kurtosis,
              // betaHaussier,
              // betaBaiss,
              VAR95: VAR95 * 100,
              trackingError: trackingError * 100,
              VAR99: VAR99 * 100,
              delaiRecouvrement,
              /*  betaHaussier,*/
              betaBaiss,
              /*  upCaptureRatio,
                downCaptureRatio,*/
              // dd: (perfAnnualisee - perfAnnualiseeInd)
              // delaiRecouvrementInd
            }
          })
        } else if (req.params.year === "12") {
          let donneesGroupéesSS = grouperParSemaine(donneesarray);
          let donneesGroupéesindice = grouperParSemaine(donneesarrayindref);

          let donneesGroupéesSSjour = grouperParJour(donneesarray);
          let donneesGroupéesindicejour = grouperParJour(donneesarrayindref);

          let donneesGroupéesSSmois = grouperParMois(donneesarray);
          let donneesGroupéesindicemois = grouperParMois(donneesarrayindref);


          // Calcul de la volatilité pour différentes périodes
          let endDate = moment(lastPreviousDate);
          let periods = {
            '12_ans': findNearestDatetoyear(dates, 12, endDate),


          };
          let tauxensemainefilte = {};

          let volatilites = {};
          let volatilitesind = {};
          let rendementsTableau = {};
          let rendementsTableauindice = {};

          let volatilitesjour = {};
          let volatilitesindjour = {};
          let rendementsTableaujour = {};
          let rendementsTableauindicejour = {};


          let volatilitesmois = {};
          let volatilitesindmois = {};
          let rendementsTableaumois = {};
          let rendementsTableauindicemois = {};
          let Vls = [];
          let Vlsindice = [];
          for (let [periode, dateDebut] of Object.entries(periods)) {
            console.log(donneesGroupéesSS);

            let donneesPeriodesemaine = donneesGroupéesSS.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicesemaine = donneesGroupéesindice.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            //let donneestauxPeriodesemaine = tableauDonneestsr.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let donneesPeriodejour = donneesGroupéesSSjour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicejour = donneesGroupéesindicejour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            for (let i = 0; i <= donneesPeriodejour.length - 1; i++) {
              Vls.push(donneesPeriodejour[i].value)
            }
            for (let i = 0; i <= donneesPeriodeindicejour.length - 1; i++) {
              Vlsindice.push(donneesPeriodeindicejour[i].value)
            }
            let donneesPeriodemois = donneesGroupéesSSmois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicemois = donneesGroupéesindicemois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let rendementsPeriode = calculerRendements(donneesPeriodesemaine);
            let rendementsPeriodeindice = calculerRendements(donneesPeriodeindicesemaine);
            rendementsTableau[periode] = rendementsPeriode;
            rendementsTableauindice[periode] = rendementsPeriodeindice;

            volatilites[periode] = calculerVolatilite(rendementsPeriode);
            volatilitesind[periode] = calculerVolatilite(rendementsPeriodeindice);

            let rendementsPeriodejour = calculerRendements(donneesPeriodejour);
            let rendementsPeriodeindicejour = calculerRendements(donneesPeriodeindicejour);
            rendementsTableaujour[periode] = rendementsPeriodejour;
            rendementsTableauindicejour[periode] = rendementsPeriodeindicejour;

            volatilitesjour[periode] = calculerVolatilite(rendementsPeriodejour);
            volatilitesindjour[periode] = calculerVolatilite(rendementsPeriodeindicejour);

            let rendementsPeriodemois = calculerRendements(donneesPeriodemois);
            let rendementsPeriodeindicemois = calculerRendements(donneesPeriodeindicemois);
            rendementsTableaumois[periode] = rendementsPeriodemois;
            rendementsTableauindicemois[periode] = rendementsPeriodeindicemois;

            volatilitesmois[periode] = calculerVolatilite(rendementsPeriodemois);
            volatilitesindmois[periode] = calculerVolatilite(rendementsPeriodeindicemois);
            //tauxensemainefilte = donneestauxPeriodesemaine;

          }
          const yDate = findNearestDateAnnualized(dates, 12, lastPreviousDate)

          const portfolioReturns = rendementsTableau['12_ans']

          const benchmarkReturns = rendementsTableauindice['12_ans'];
          const perfAnnualisee = calculateAnnualizedPerformance(lastValue, values[dates.indexOf(findNearestDateAnnualized(dates, 12, findLastDateOfPreviousMonth(dates)))], 12);
          const perfAnnualiseeInd = calculateAnnualizedPerformance(lastValueInd, valuesindifref[dates.indexOf(findNearestDateAnnualized(dates, 12, findLastDateOfPreviousMonth(dates)))], 12);
          //   const varindice = calculateVariance([...rendementsTableauindice['1_an']]);
          //   const cov = calculateCovariance(rendementsTableau['1_an'], [...rendementsTableauindice['1_an']])

          //const info= quants.inforatio([...rendementsTableau['3_ans']], [...rendementsTableauindice['3_ans']])* Math.sqrt(52)
          const info = calculateInformationRatio([...rendementsTableau['12_ans']], [...rendementsTableauindice['12_ans']])
          const beta = calculateBeta(rendementsTableau['12_ans'], rendementsTableauindice['12_ans'])
          const VAR95 = calculateVAR95([...rendementsTableau["12_ans"]], 0.95);
          const VAR99 = calculateVAR99([...rendementsTableau["12_ans"]], 0.99)
          const maxDrawdown = calculateMaxDrawdown(Vls.reverse())
          const maxDrawdownInd = calculateMaxDrawdown(Vlsindice.reverse())
          const dsr = calculerDSRAnnualise([...rendementsTableau["12_ans"]], 0.01)
          const omega = calculateOmegaRatio([...rendementsTableau["12_ans"]], 0);
          const calmar = calculateCalmarRatio([...rendementsTableau["12_ans"]], 12)
          const sortino = calculateSortinoRatio([...rendementsTableau["12_ans"]], -0.00473, 0.01);
          const betaBaiss = calculateDownsideBeta([...rendementsTableau["12_ans"]], [...rendementsTableauindice["12_ans"]])
          const trackingError = calculateTrackingError([...rendementsTableau["12_ans"]], [...rendementsTableauindice["12_ans"]])
          const DownCaptureRatio = calculateDownCaptureRatio([...rendementsTableau["12_ans"]], [...rendementsTableauindice["12_ans"]])
          const UpCaptureRatio = calculateUpCaptureRatio([...rendementsTableau["12_ans"]], [...rendementsTableauindice["12_ans"]])

          const delaiRecouvrement = calculerDelaiRecouvrementFonds(Vls.reverse());



          const ratioSharpe = calculateSharpeRatio(rendementsTableau["12_ans"], -0.00473)
          const correlation = quants.corrcoef([...rendementsTableau["12_ans"]], [...rendementsTableauindice["12_ans"]], 0)

          //const r2 = quants.linreg([...rendementsTableau["12_ans"]], [...rendementsTableauindice["12_ans"]]).rsq
          const r2 = calculerR2([...rendementsTableau["12_ans"]], [...rendementsTableauindice["12_ans"]])


          console.log(beta);

          res.json({
            code: 200,
            data: {
              volatility: volatilites["12_ans"] * 100,
              volatilityInd: volatilitesind["12_ans"] * 100,
              beta,
              perfAnnualisee: perfAnnualisee * 100,
              perfAnnualiseeInd: perfAnnualiseeInd * 100,
              info,
              r2,
              // skewness,
              correlation,
              omega,
              sortino,
              calmar,
              // volatilityInd,
              maxDrawdown: -maxDrawdown * 100,
              maxDrawdownInd: -maxDrawdownInd * 100,
              dsr,
              ratioSharpe,
              // kurtosis,
              // betaHaussier,
              // betaBaiss,
              VAR95: VAR95 * 100,
              trackingError: trackingError * 100,
              VAR99: VAR99 * 100,
              delaiRecouvrement,
              /* betaHaussier,*/
              betaBaiss,
              /*  upCaptureRatio,
                downCaptureRatio,*/
              // dd: (perfAnnualisee - perfAnnualiseeInd)
              // delaiRecouvrementInd
            }
          })
        } else if (req.params.year === "origine") {
          let donneesGroupéesSS = grouperParSemaine(donneesarray);
          let donneesGroupéesindice = grouperParSemaine(donneesarrayindref);

          let donneesGroupéesSSjour = grouperParJour(donneesarray);
          let donneesGroupéesindicejour = grouperParJour(donneesarrayindref);

          let donneesGroupéesSSmois = grouperParMois(donneesarray);
          let donneesGroupéesindicemois = grouperParMois(donneesarrayindref);


          // Calcul de la volatilité pour différentes périodes
          let endDate = moment(lastPreviousDate);
          let periods = {

            'origine': findNearestDatetoyear(dates, 5, endDate)


          };
          let tauxensemainefilte = {};

          let volatilites = {};
          let volatilitesind = {};
          let rendementsTableau = {};
          let rendementsTableauindice = {};

          let volatilitesjour = {};
          let volatilitesindjour = {};
          let rendementsTableaujour = {};
          let rendementsTableauindicejour = {};


          let volatilitesmois = {};
          let volatilitesindmois = {};
          let rendementsTableaumois = {};
          let rendementsTableauindicemois = {};
          let Vls = [];
          let Vlsindice = [];
          for (let [periode, dateDebut] of Object.entries(periods)) {
            console.log(donneesGroupéesSS);

            let donneesPeriodesemaine = donneesGroupéesSS.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicesemaine = donneesGroupéesindice.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            //let donneestauxPeriodesemaine = tableauDonneestsr.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let donneesPeriodejour = donneesGroupéesSSjour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicejour = donneesGroupéesindicejour.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            for (let i = 0; i <= donneesPeriodejour.length - 1; i++) {
              Vls.push(donneesPeriodejour[i].value)
            }
            for (let i = 0; i <= donneesPeriodeindicejour.length - 1; i++) {
              Vlsindice.push(donneesPeriodeindicejour[i].value)
            }
            let donneesPeriodemois = donneesGroupéesSSmois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));
            let donneesPeriodeindicemois = donneesGroupéesindicemois.filter(d => moment(d.date, 'YYYY-MM-DD').isSameOrAfter(dateDebut) && moment(d.date, 'YYYY-MM-DD').isSameOrBefore(endDate));

            let rendementsPeriode = calculerRendements(donneesPeriodesemaine);
            let rendementsPeriodeindice = calculerRendements(donneesPeriodeindicesemaine);
            rendementsTableau[periode] = rendementsPeriode;
            rendementsTableauindice[periode] = rendementsPeriodeindice;

            volatilites[periode] = calculerVolatilite(rendementsPeriode);
            volatilitesind[periode] = calculerVolatilite(rendementsPeriodeindice);

            let rendementsPeriodejour = calculerRendements(donneesPeriodejour);
            let rendementsPeriodeindicejour = calculerRendements(donneesPeriodeindicejour);
            rendementsTableaujour[periode] = rendementsPeriodejour;
            rendementsTableauindicejour[periode] = rendementsPeriodeindicejour;

            volatilitesjour[periode] = calculerVolatilite(rendementsPeriodejour);
            volatilitesindjour[periode] = calculerVolatilite(rendementsPeriodeindicejour);

            let rendementsPeriodemois = calculerRendements(donneesPeriodemois);
            let rendementsPeriodeindicemois = calculerRendements(donneesPeriodeindicemois);
            rendementsTableaumois[periode] = rendementsPeriodemois;
            rendementsTableauindicemois[periode] = rendementsPeriodeindicemois;

            volatilitesmois[periode] = calculerVolatilite(rendementsPeriodemois);
            volatilitesindmois[periode] = calculerVolatilite(rendementsPeriodeindicemois);
            //tauxensemainefilte = donneestauxPeriodesemaine;

          }
          const targetYear = groupDatesByYear(dates).length
          const perfAnnualisee = calculateAnnualizedPerformance(lastValue, values[0], targetYear);
          const perfAnnualiseeInd = calculateAnnualizedPerformance(lastValueInd, valuesindifref[0], targetYear);

          const portfolioReturns = rendementsTableau['origine']

          const benchmarkReturns = rendementsTableauindice['origine'];
          //   const varindice = calculateVariance([...rendementsTableauindice['1_an']]);
          //   const cov = calculateCovariance(rendementsTableau['1_an'], [...rendementsTableauindice['1_an']])

          //const info= quants.inforatio([...rendementsTableau['3_ans']], [...rendementsTableauindice['3_ans']])* Math.sqrt(52)
          const info = calculateInformationRatio([...rendementsTableau['origine']], [...rendementsTableauindice['origine']])
          const beta = calculateBeta(rendementsTableau['origine'], rendementsTableauindice['origine'])
          const VAR95 = calculateVAR95([...rendementsTableau["origine"]], 0.95);
          const VAR99 = calculateVAR99([...rendementsTableau["origine"]], 0.99)
          const maxDrawdown = calculateMaxDrawdown(Vls.reverse())
          const maxDrawdownInd = calculateMaxDrawdown(Vlsindice.reverse())
          const dsr = calculerDSRAnnualise([...rendementsTableau["origine"]], 0.01)
          const omega = calculateOmegaRatio([...rendementsTableau["origine"]], 0);
          const calmar = calculateCalmarRatio([...rendementsTableau["origine"]], 0)
          const sortino = calculateSortinoRatio([...rendementsTableau["origine"]], -0.00473, 0.01);
          const betaBaiss = calculateDownsideBeta([...rendementsTableau["origine"]], [...rendementsTableauindice["origine"]])
          const trackingError = calculateTrackingError([...rendementsTableau["origine"]], [...rendementsTableauindice["origine"]])
          const DownCaptureRatio = calculateDownCaptureRatio([...rendementsTableau["origine"]], [...rendementsTableauindice["origine"]])
          const UpCaptureRatio = calculateUpCaptureRatio([...rendementsTableau["origine"]], [...rendementsTableauindice["origine"]])




          const ratioSharpe = calculateSharpeRatio(rendementsTableau["origine"], -0.00473)
          const correlation = quants.corrcoef([...rendementsTableau["origine"]], [...rendementsTableauindice["origine"]], 0)

          // const r2 = quants.linreg([...rendementsTableau["origine"]], [...rendementsTableauindice["origine"]]).rsq
          const r2 = calculerR2([...rendementsTableau["origine"]], [...rendementsTableauindice["origine"]])


          console.log(beta);

          res.json({
            code: 200,
            data: {
              volatility: volatilites["origine"] * 100,
              volatilityInd: volatilitesind["origine"] * 100,
              beta,
              perfAnnualisee: perfAnnualisee * 100,
              perfAnnualiseeInd: perfAnnualiseeInd * 100,
              info,
              r2,
              // skewness,
              correlation,
              omega,
              sortino,
              calmar,
              // volatilityInd,
              maxDrawdown: -maxDrawdown * 100,
              maxDrawdownInd: -maxDrawdownInd * 100,
              dsr,
              ratioSharpe,
              // kurtosis,
              // betaHaussier,
              // betaBaiss,
              VAR95: VAR95 * 100,
              trackingError: trackingError * 100,
              VAR99: VAR99 * 100,
              /* delaiRecouvrement,
               betaHaussier,*/
              betaBaiss,
              /*  upCaptureRatio,
                downCaptureRatio,*/
              // dd: (perfAnnualisee - perfAnnualiseeInd)
              // delaiRecouvrementInd
            }
          })
        }





      })
  })



  app.get('/api/robotadvisor/fonds', async (req, res) => {
    const ids = req.query.ids.split(',');
    const fundIds = ids; // Séparer les IDs des fonds par une virgule
    var PortfolioAllocation = require('portfolio-allocation');
    const formdata = req.params.formData;
    var minWeight = [];
    var maxWeight = []
    if (req.query.minweight) {
      minWeight = JSON.parse(req.query.minweight);
      maxWeight = JSON.parse(req.query.maxweight);
    }

    const minReturn = req.query.minReturn / 100;
    const maxReturn = req.query.maxReturn / 100;
    const minVolatility = req.query.minVolatility / 100;
    const maxVolatility = req.query.maxVolatility / 100;

    // const totalInvestment = 100000;
    try {
      // Obtenir l'historique de chaque fond et trouver les dates communes
      const fundData = await Promise.all(
        fundIds.map(async fundId => {
          const data = await vl.findAll({
            where: {
              fund_id: fundId
            },
            order: [
              ['date', 'ASC']
            ]
          });
          return {
            fundId,
            data
          };
        })
      );

      // Trouver l'ensemble commun de dates
      const commonDates = findCommonDates(fundData.map(entry => entry.data));
      // Filtrer les dates pour s'assurer qu'elles sont entre le 1er janvier et le 31 décembre

      // Filtrer les données pour inclure uniquement les dates communes
      const filteredData = fundData.map(entry => {
        const filteredValues = entry.data.filter(row => commonDates.includes(moment(row.date).format('YYYY-MM-DD')));
        return {
          fundId: entry.fundId,
          values: filteredValues.map(row => row.value)
        };
      });
      // Calculer les rendements pour chaque fond
      const returnsData = filteredData.map(entry => {
        const values = entry.values;
        const ArrayDates = groupDatesByYear(commonDates);
        const adaptValues = adaptValuesToGroupedYears(values, ArrayDates);
        const adaptValues1 = AdaptTableauwithdate(adaptValues, ArrayDates);
        // const valueYearArray = adaptValues1.map((entry) => Object.values(entry)[0].map((data) => data[2]));
        return {
          fundId: entry.fundId,
          returns: adaptValues1
        };
      });
      const ddd = returnsData.map(entry => entry.returns);
      // const filteredDdd = ddd.map(subArray => subArray.filter(value => value.length == 12)); 
      //const filteredDdd = ddd;
      // Calcul des performances glissantes
      const extraireRendements = ddd.map(fond => {
        return fond.map(anneeData => anneeData[2]);
      });
      const tableauConcatené = extraireRendements.map((sousTableau) => {
        // Appliquer un flatMap sur chaque sous-tableau
        return sousTableau.flatMap((element) => element);
      });
      console.log(tableauConcatené);
      const tableauTransformé = [];
      for (let i = 0; i < tableauConcatené[0].length; i++) {
        const colonne = [];
        for (let j = 0; j < tableauConcatené.length; j++) {
          colonne.push(tableauConcatené[j][i]);
        }
        tableauTransformé.push(colonne);
      }


      const minnestedArray = [];
      for (let i = 0; i < fundIds.length; i++) {
        minnestedArray.push(minReturn);
      }
      const maxnestedArray = [];
      for (let i = 0; i < fundIds.length; i++) {
        maxnestedArray.push(maxReturn);
      }
      const meanReturns = PortfolioAllocation.meanVector(tableauConcatené);
      const covMatrix = PortfolioAllocation.covarianceMatrix(tableauConcatené);
      var opt = {}
      if (minWeight.length > 0) {
        opt = {
          discretizationType: 'volatility',
          nbPortfolios: 1000,
          optimizationMethod: 'automatic',
          constraints: {
            minWeights: minWeight,// exemple
            maxWeights: maxWeight, // exemple

          }
        };
      } else {
        opt = {
          discretizationType: 'volatility',
          nbPortfolios: 1000,
          optimizationMethod: 'automatic',

        };
      }

      const portfolios = PortfolioAllocation.meanVarianceEfficientFrontierPortfolios(meanReturns, covMatrix, opt
      );
      console.log(portfolios)
      // Filtrer les portefeuilles en fonction des contraintes
      const filteredPortfolios = portfolios.filter(portfolio => {
        const portfolioReturn = portfolio[1];
        const portfolioVolatility = portfolio[2];
        return portfolioReturn >= minReturn && portfolioReturn <= maxReturn &&
          portfolioVolatility >= minVolatility && portfolioVolatility <= maxVolatility;
      });

      // Affichage des portefeuilles efficients filtrés
      console.log("Portefeuilles efficients filtrés :");
      filteredPortfolios.forEach((portfolio, index) => {
        console.log(`Portefeuille ${index + 1}:`);
        console.log("Poids:", portfolio[0]);
        console.log("Rendement:", portfolio[1]);
        console.log("Volatilité:", portfolio[2]);
        console.log("------------");
      });

      /*
              // Calcul de la matrice de covariance des rendements des actifs
              const covMatrix = PortfolioAllocation.covarianceMatrix(tableauTransformé);
              const meanReturns = PortfolioAllocation.meanVector(tableauTransformé);
      
              // Vous pouvez continuer avec le reste de votre code ici...
        
              // Afficher les résultats
              console.log('La matrice de covariance des rendements des actifs est :');
              console.log(covMatrix);
              //var targetReturn = 0.02; // Rendement attendu de 2% par mois
             // var weights = PortfolioAllocation.proportionalMinimumVarianceWeights(covMatrix, targetReturn);
              // Calculer les poids optimaux du portefeuille qui minimise la variance
              // var weights = PortfolioAllocation.globalMinimumVarianceWeights(covMatrix);
              const weights = PortfolioAllocation.meanVarianceOptimizationWeights(meanReturns,covMatrix, {
                constraints: {
                 // return:targetReturn,
                  maxVolatility: maxVolatility
                },
              }).weights;
      
              let investmentAmounts = calculateInvestmentAmounts(weights, totalInvestment);
      
              // Afficher les résultats
              console.log('Les poids optimaux du portefeuille sont :');
              for (var i = 0; i < fundIds.length; i++) {
                  console.log(fundIds[i] + ' : ' + weights[i]);
              }*/


      res.json({
        code: 200,
        data: {
          filteredPortfolios: filteredPortfolios,
          //  investmentAmounts:investmentAmounts
          // Ajoutez d'autres données si nécessaire
        }
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: 'Une erreur s\'est produite lors du traitement de la demande.',
        error: error.message
      });
    }
  });

  app.get('/api/roboadvisorsetvalue', async (req, res) => {
    try {
      const { date, montantinvest, fundids, portefeuilleselect, poids } = req.query;
      const poidsfond = poids.split(',');
      const fondids = fundids.split(',');


      for (const fond of fondids) {
        const index = fondids.indexOf(fond);

        // Rechercher la valeur du fond pour la date spécifiée
        let vls = await vl.findAll({
          where: {
            fund_id: fond, date: {
              [Op.gte]: date // Remplacez 'votreDate' par la date que vous souhaitez comparer.
            }
          }
        });


        // Récupérer toutes les dates dans la table vl_fond
        //  const toutesLesDates = await Fond.findAll({ attributes: ['date'] });

        // Calculer la valorisation pour chaque date à partir de la date spécifiée
        const valorisations = [];
        const quantite = (montantinvest * poidsfond[index]) / vls[0].value;
        for (const dateRow of vls) {

          const valorisation = quantite * dateRow.value;
          valorisations.push({ date: dateRow.date, value: valorisation, fund_id: fond, portefeuille_id: portefeuilleselect });

        }

        // Insérer les nouvelles valorisations dans la table vl_portefeuille
        await portefeuilles_proposes_vls.bulkCreate(valorisations);
      }
      const updatedData = {
        poidsportefeuille: poidsfond
      };

      // Assuming 'portefeuille' is your model for updating data in your database
      await portefeuille.update(updatedData, {
        where: { id: portefeuilleselect },
      });
      return res.json({ code: 200, data: "Succes" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erreur lors du calcul de la valorisation" });
    }
  });

  app.post('/api/postportefeuillepropose', async (req, res) => {
    try {
      const { portfolios } = req.body;

      // Loop through portfolios to insert each one
      for (const portfolio of portfolios) {
        const { poids, fond, simulation_id, portefeuille_id, nom } = portfolio;

        await simulationportefeuille.create({
          poids: poids.toString(), // Convertir poids en chaîne de caractères
          fond_ids: fond,
          nom,
          simulation_id,
          portefeuille_id // Assuming this is auto-incremented by your database
        });
      }

      // Respond with a success message
      res.status(200).json({ message: 'Données insérées avec succès' });
    } catch (error) {
      // Handle errors
      console.error('Erreur lors de l\'insertion en base de données :', error);
      res.status(500).json({ message: 'Erreur lors de l\'insertion en base de données' });
    }
  });

  app.get('/api/getsimulationportefeuillebyuser/:id', async (req, res) => {
    simulationportefeuille.findAll({
      where: {
        simulation_id: req.params.id

      },
      order: [
        ['id', 'ASC']
      ]
    })
      .then(response => {
        //const funds = response.map((data) => data.id);

        const simulations = response.map(data => ({
          id: data.portefeuille_id,
          poids: data.poids, // Remplacez avec la propriété correcte de l'objet
          nom: data.nom,
          fond_ids: data.fond_ids


        }));
        res.json({
          code: 200,
          data: {
            simulations,
            //  valorisation

          }
        })

      })
  })

  async function fetchFundsByValorisation1(selectedValues, selectedcategorie, selectedsociete, selectedDevise, frequence, fund1, fund2) {
    try {
      let query;
      if (selectedValues.length >= 1 && selectedValues[0] != '') {
  
        query = `
      SELECT f.*
      FROM fond_investissements AS f
      WHERE  f.id in (${selectedValues.map(cat => cat).join(',')}) and  f.id IN (SELECT v.fund_id FROM valorisations AS v ) and f.id>=${fund1} and  f.id<=${fund2} 
    `;
      } else {
  
        query = `
        SELECT f.*
        FROM fond_investissements AS f
        WHERE   f.id IN (SELECT v.fund_id FROM valorisations AS v ) and f.id>=${fund1} and  f.id<=${fund2} 
  `;
      }
  
      if (selectedcategorie != 'undefined') {
        query += `
   
        AND f.categorie_globale = :selectedcategorie
    
  `;
      }
  
      if (selectedDevise != 'undefined') {
        query += `
   
        AND f.dev_libelle = :selectedDevise
    
  `;
      }
  
      if (frequence != 'undefined' && frequence.length >= 1) {
        query += `
   
        AND f.periodicite = :frequence
    
  `;
      }
  
      if (selectedsociete != 'undefined') {
        query += `
   
        AND f.societe_gestion = :selectedsociete
    
  `;
      }
  
      const fondsDansCategorie = await sequelize.query(query, {
        replacements: { selectedsociete, selectedcategorie, selectedDevise, frequence },
  
        type: sequelize.QueryTypes.SELECT,
      });
  
      // Retournez la liste des fonds
      return fondsDansCategorie;
    } catch (erreur) {
      console.error('Erreur lors de la récupération des fonds par catégorie :', erreur);
      throw erreur; // Propagez l'erreur pour qu'elle soit gérée ailleurs si nécessaire
    }
  }
  
  async function fetchFundsByValorisation(selectedValues, selectedcategorie, selectedsociete, selectedDevise, frequence) {
    try {
      let query;
      if (selectedValues.length >= 1 && selectedValues[0] != '') {
  
        query = `
      SELECT f.*
      FROM fond_investissements AS f
      WHERE  f.id in (${selectedValues.map(cat => cat).join(',')}) and  f.id IN (SELECT v.fund_id FROM valorisations AS v )
    `;
      } else {
  
        query = `
        SELECT f.*
        FROM fond_investissements AS f
        WHERE   f.id IN (SELECT v.fund_id FROM valorisations AS v )
  `;
      }
  
      if (selectedcategorie != 'undefined') {
        query += `
   
        AND f.categorie_globale = :selectedcategorie
    
  `;
      }
  
      if (selectedDevise != 'undefined') {
        query += `
   
        AND f.dev_libelle = :selectedDevise
    
  `;
      }
  
      if (frequence != 'undefined' && frequence.length >= 1) {
        query += `
   
        AND f.periodicite = :frequence
    
  `;
      }
  
      if (selectedsociete != 'undefined') {
        query += `
   
        AND f.societe_gestion = :selectedsociete
    
  `;
      }
  
      const fondsDansCategorie = await sequelize.query(query, {
        replacements: { selectedsociete, selectedcategorie, selectedDevise, frequence },
  
        type: sequelize.QueryTypes.SELECT,
      });
  
      // Retournez la liste des fonds
      return fondsDansCategorie;
    } catch (erreur) {
      console.error('Erreur lors de la récupération des fonds par catégorie :', erreur);
      throw erreur; // Propagez l'erreur pour qu'elle soit gérée ailleurs si nécessaire
    }
  }


  // Fonction pour trouver les dates communes parmi plusieurs ensembles de données
  function findCommonDates(dataSets) {
    const dateSets = dataSets.map(data => new Set(data.map(row => moment(row.date).format('YYYY-MM-DD'))));
    let commonDates = [...dateSets[0]];
    for (let i = 1; i < dateSets.length; i++) {
      commonDates = commonDates.filter(date => dateSets[i].has(date));
    }
    return commonDates;
  }


  app.post('/api/postsimulation', async (req, res) => {
    try {
      const {
        nom,
        description,
        userid

        // Ajoutez d'autres champs ici
      } = req.body;


      simulation.create({
        nom: nom,
        description: description,
        user_id: userid

      })



      // Répondez avec un message de succès ou autre réponse appropriée
      res.status(200).json({ message: 'Données insérées avec succès' });
    } catch (error) {
      // Gérez les erreurs ici
      console.error('Erreur lors de l\'insertion en base de données :', error);
      res.status(500).json({ message: 'Erreur lors de l\'insertion en base de données' });
    }
  });
  app.get('/api/getsimulationbyuser/:id', async (req, res) => {
    simulation.findAll({
      where: {
        user_id: req.params.id

      },
      order: [
        ['id', 'ASC']
      ]
    })
      .then(response => {
        //const funds = response.map((data) => data.id);

        const simulations = response.map(data => ({
          id: data.id,
          nom: data.nom, // Remplacez avec la propriété correcte de l'objet
          description: data.description


        }));
        res.json({
          code: 200,
          data: {
            simulations,
            //  valorisation

          }
        })

      })
  })

  app.get('/api/getportefeuillebysimulation/:id', async (req, res) => {
    simulationportefeuille.findAll({
      where: {
        simulation_id: req.params.id

      },
      order: [
        ['id', 'ASC']
      ]
    })
      .then(response => {
        //const funds = response.map((data) => data.id);

        const simulations = response.map(data => ({
          nom: data.nom, // Remplacez avec la propriété correcte de l'objet
          fond_ids: data.fond_ids,
          poids: data.poids,
          portefeuille_id: data.portefeuille_id,


        }));
        res.json({
          code: 200,
          data: {
            simulations,
            //  valorisation

          }
        })

      })
  })
  app.use(require('./apigestionsociete'));
  app.use(require('./apigestionpays'));
  app.use(require('./apigestionrendement'));
  app.use(require('./apigestionperformance'));
  app.use(require('./apigestionportefeuille'));
  app.use(require('./apigestionquartile'));
  app.use(require('./apigestionratios'));
  app.use(require('./apigestionrobotadvisor'));
  app.use(require('./apigestionsavequotidien'));
  app.use(require('./apigestionapikey'));
  app.use(require('./apigestionfonds'));

}