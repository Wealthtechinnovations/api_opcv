
module.exports = (sequelize, DataTypes) => {
    return sequelize.define('tras', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        value: {
            type: DataTypes.DOUBLE,
            allowNull: false,
        },
        tra_id: {
            type: DataTypes.STRING(50),
            allowNull: false,
            index:true
        },
    }, {
        timestamps: true,
        createdAt: 'created',
        updatedAt: false,
        indexes:[
            {
                unique:false,
                fields:['tra_id']
            }
        ]
    })
}