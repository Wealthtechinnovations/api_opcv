const { authenticate } = require('../middleware/auth');
const { fond, users, frais, societe, portefeuille, sequelize } = require('../db/sequelize');

module.exports = (app) => {

  app.get('/api/getusersbyadmin', (req, res) => {
    users.findAll({
      order: [['id', 'DESC']],
      limit: 500,
    })
      .then(response => {
        const userss = response.map(data => ({
          id: data.id,
          email: data.email,
          nom: data.nom,
          prenoms: data.prenoms,
          denomination: data.denomination,
          pays: data.pays,
          typeusers: data.typeusers,
          typeusers_id: data.typeusers_id,
          active: data.active,
          created_at: data.created_at,
        }));
        res.json({
          code: 200,
          data: { userss }
        });
      })
      .catch(error => {
        res.status(500).json({ error: error.message });
      });
  });

  app.get('/api/pending-accounts', (req, res) => {
    users.findAll({
      where: { active: 0 },
      order: [['id', 'DESC']],
      limit: 500,
    })
      .then(response => {
        const userss = response.map(data => ({
          id: data.id,
          email: data.email,
          nom: data.nom,
          prenoms: data.prenoms,
          denomination: data.denomination,
          pays: data.pays,
          typeusers: data.typeusers,
          typeusers_id: data.typeusers_id,
          active: data.active,
          created_at: data.created_at,
        }));
        res.json({
          code: 200,
          data: { userss }
        });
      })
      .catch(error => {
        res.status(500).json({ error: error.message });
      });
  });

  app.post('/api/reject-user/:id', (req, res) => {
    const userId = req.params.id;
    users.destroy({ where: { id: userId, active: 0 } })
      .then(deleted => {
        if (!deleted) {
          return res.status(404).json({ error: 'Utilisateur non trouvé ou déjà actif' });
        }
        res.json({ code: 200, message: 'Compte rejeté et supprimé' });
      })
      .catch(error => {
        res.status(500).json({ error: error.message });
      });
  })

  app.post('/api/activate-user/:id', (req, res) => {
    const userId = req.params.id;

    users.findOne({
      where: {
        id: userId
      }
    })
      .then(user => {
        if (!user) {
          return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        return user.update({ active: 1 });
      })
      .then(updatedUser => {
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

  app.get('/api/getfraisbyadmin', (req, res) => {
    frais.findAll({
      where: {},
      order: [['id', 'DESC']],
      limit: 500,
    })
      .then(response => {
        const fraisData = response.map(data => ({
          id: data.id,
          fond_id: data.fond_id,
          fond: data.fond,
          frais_transa_achat: data.frais_transa_achat,
          frais_transa_vente: data.frais_transa_vente
        }));
        res.json({
          code: 200,
          data: { frais: fraisData }
        })
      })
  })

  app.get('/api/getfraisbyadminid/:id', (req, res) => {
    frais.findOne({
      where: { fond_id: req.params.id },
      order: [['id', 'DESC']]
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
      const fondExists = await fond.findOne({ where: { id: parseInt(fond_id) } });
      if (!fondExists) {
        return res.status(404).json({ error: 'Fond non trouvé.' });
      }
      const fraisExists = await frais.findOne({ where: { fond_id: parseInt(fond_id) } });
      if (fraisExists) {
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
      const fonds = await frais.findOne({ where: { fond_id: parseInt(fondId) } });
      if (!fonds) {
        return res.status(404).json({ error: 'Fond non trouvé.' });
      }
      const updatedFond = await frais.update(
        { frais_transa_achat, frais_transa_vente },
        { where: { fond_id: parseInt(fondId) } }
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
    fond.findAll({
      where: {},
      order: [['id', 'DESC']],
      limit: 500,
    })
      .then(response => {
        const funds = response.map(data => ({
          id: data.id,
          nom_fond: data.nom_fond.toString(),
          code_ISIN: data.code_ISIN,
          dev_libelle: data.dev_libelle,
          categorie_libelle: data.categorie_libelle,
          categorie_national: data.categorie_national,
          datejour: data.datejour,
          active: data.active,
        }));
        res.json({ code: 200, data: { funds } })
      })
  })

  app.get('/api/getfondbyuser/:id', (req, res) => {
    const societeGestionId = req.params.id;
    const pays = req.query.pays;
    let whereClause = { active: 0 };
    if (pays) { whereClause.pays = pays; }
    else { whereClause.societe_gestion = societeGestionId; }

    fond.findAll({
      where: whereClause,
      order: [['id', 'DESC']],
      limit: 500,
    })
      .then(response => {
        const funds = response.map(data => ({
          id: data.id,
          nom_fond: data.nom_fond.toString(),
          dev_libelle: data.dev_libelle,
          categorie_libelle: data.categorie_libelle,
          categorie_national: data.categorie_national,
          datejour: data.datejour,
          active: data.active,
          code_ISIN: data.code_ISIN,
        }));
        res.json({ code: 200, data: { funds } })
      })
  })

  app.get('/api/getfondbyuservalide/:id', (req, res) => {
    const societeGestionId = req.params.id;
    const pays = req.query.pays;
    let whereClause = { active: 1 };
    if (pays) { whereClause.pays = pays; }
    else { whereClause.societe_gestion = societeGestionId; }

    fond.findAll({
      where: whereClause,
      order: [['id', 'DESC']],
      limit: 500,
    })
      .then(response => {
        const funds = response.map(data => ({
          id: data.id,
          nom_fond: data.nom_fond.toString(),
          categorie_libelle: data.categorie_libelle,
          categorie_national: data.categorie_national,
          datejour: data.datejour,
          dev_libelle: data.dev_libelle,
          active: data.active,
          code_ISIN: data.code_ISIN,
        }));
        res.json({ code: 200, data: { funds } })
      })
  })

  app.get('/api/getfondbysociete/:id', (req, res) => {
    fond.findAll({
      where: { societe_gestion: req.params.id },
      order: [['id', 'DESC']],
      limit: 500,
    })
      .then(response => {
        const funds = response.map(data => ({
          id: data.id,
          nom_fond: data.nom_fond.toString(),
          test: data.nom_fond.toString() + " " + data.code_ISIN,
          categorie_libelle: data.categorie_libelle,
          categorie_national: data.categorie_national,
          datejour: data.datejour,
          active: data.active,
          code_ISIN: data.code_ISIN,
        }));
        res.json({ code: 200, data: { funds } })
      })
  })

  app.get('/api/getfondbypays/:id', (req, res) => {
    fond.findAll({
      where: sequelize.where(sequelize.fn('LOWER', sequelize.col('pays')), req.params.id.toLowerCase()),
      order: [['id', 'DESC']],
      limit: 500,
    })
      .then(response => {
        const funds = response.map(data => ({
          id: data.id,
          nom_fond: data.nom_fond.toString(),
          test: data.nom_fond.toString() + " " + data.code_ISIN,
          categorie_libelle: data.categorie_libelle,
          categorie_national: data.categorie_national,
          datejour: data.datejour,
          active: data.active,
          code_ISIN: data.code_ISIN,
        }));
        res.json({ code: 200, data: { funds } })
      })
  })

  // ==================== PUT ENDPOINTS ====================

  app.put('/api/fonds/:id', authenticate, async (req, res) => {
    try {
      const existingFond = await fond.findByPk(req.params.id);
      if (!existingFond) {
        return res.status(404).json({ error: 'Fond non trouvé' });
      }
      await existingFond.update(req.body);
      res.json({ code: 200, data: existingFond });
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du fond' });
    }
  });

  app.put('/api/portefeuilles/:id', authenticate, async (req, res) => {
    try {
      const existing = await portefeuille.findByPk(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: 'Portefeuille non trouvé' });
      }
      await existing.update(req.body);
      res.json({ code: 200, data: existing });
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du portefeuille' });
    }
  });

  app.put('/api/users/:id', authenticate, async (req, res) => {
    try {
      const existing = await users.findByPk(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }
      await existing.update(req.body);
      res.json({ code: 200, data: existing });
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur lors de la mise à jour de l\'utilisateur' });
    }
  });

  app.put('/api/societes/:id', authenticate, async (req, res) => {
    try {
      const existing = await societe.findByPk(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: 'Société non trouvée' });
      }
      await existing.update(req.body);
      res.json({ code: 200, data: existing });
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur lors de la mise à jour de la société' });
    }
  });

};
