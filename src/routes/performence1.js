
module.exports = (sequelize, DataTypes) => {
    return sequelize.define('performences', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      fond: {
        type: DataTypes.STRING(255),
        allowNull: true,

      },
      fond_id: {
        type: DataTypes.STRING(255),
        allowNull: true,

      },
      code_ISIN: {
        type: DataTypes.STRING(255),
        allowNull: true,

      },
      categorie: {
        type: DataTypes.STRING(255),
        allowNull: true,

      },
      categorie_nationale: {
        type: DataTypes.STRING(255),
        allowNull: true,

      },
      categorie_regionale: {
        type: DataTypes.STRING(255),
        allowNull: true,

      },

      devise: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
      ytd: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
      perfveille: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
      perf1an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
      perf3ans: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
      perf5ans: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
      perf4s: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
      perf3m: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
      perf6m: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
     
      perfannu1an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
      volatility1an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } , 
      ratiosharpe1an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
      pertemax1an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
      sortino1an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
      info1an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } 
      ,
      calamar1an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } 
      ,
      var991an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } 
      ,
      var951an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } 
      ,
      trackingerror1an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } 
      ,
       betahaussier1an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } 
      ,
       betabaissier1an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } 
      ,
       beta1an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } 
      ,
       sortino1an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
       omega1an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
       dsr1an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
       downcapture1an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
       upcapture1an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
      skewness1an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
      kurtosis1an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
      perfannu3an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
      volatility3an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } , 
      ratiosharpe3an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
      pertemax3an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
      sortino3an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
      info3an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      }
      ,
      calamar3an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } 
      ,
      var993an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } 
      ,
      var953an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      }     ,
      trackingerror3an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } 
      ,
       betahaussier3an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } 
      ,
       betabaissier1an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } 
      ,
       beta3an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } 
      ,
       sortino3an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
       omega3an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
       dsr3an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
       downcapture3an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
       upcapture3an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
      skewness3an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
      kurtosis3an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      }  ,
      perfannu5an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
      volatility5an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } , 
      ratiosharpe5an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
      pertemax5an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
      sortino5an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
      info5an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      }  ,
      calamar5an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } 
      ,
      var995an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } 
      ,
      var955an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      }    ,
      trackingerror5an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } 
      ,
       betahaussier5an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } 
      ,
       betabaissier5an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } 
      ,
       beta5an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } 
      ,
       sortino5an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
       omega5an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
       dsr5an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
       downcapture5an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
       upcapture5an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
      skewness5an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } ,
      kurtosis5an: {
        type: DataTypes.STRING(255),
        allowNull: true,

      } 
     
     
    }, {
      timestamps: false,
      updatedAt: false
    })
  }