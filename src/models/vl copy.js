
module.exports = (sequelize, DataTypes) => {
    return sequelize.define('fund_data', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      fund_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      value: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      tsr: {
        type: DataTypes.STRING(50),
        allowNull: false,
        references: {
          model: { tableName: 'tsrs' },
          key: 'tsr_id'
        }
      },
      tra: {
        type: DataTypes.STRING(50),
        allowNull: false,
        references: {
          model: { tableName: 'tras' },
          key: 'tra_id'
        }
      },
      indRef: {
        type: DataTypes.STRING(50),
        allowNull: false,
        references: {
          model: { tableName: 'indices' },
          key: 'ind_id'
        }
      }

    }, {
      timestamps: true,
      createdAt: 'created',
      updatedAt: false
    })
  }