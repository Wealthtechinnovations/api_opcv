const express = require('express');
const morgan = require('morgan');
const sequelize = require('./src/db/sequelize')
const swaggerUI = require("swagger-ui-express")
const swaggerJsDoc = require("swagger-jsdoc")

sequelize.initDb()
const app = express();
const port = 3005
app.use(morgan('dev')).use(express.json())

const options = {
    failOnErrors: true,
    definition:{
        openapi:"3.0.0",
        info:{
            title:"Documentation API",
            version: "1.0.0",
            description:"Liste des routes disponibles sur le serveur NodeJs"
        },
        servers:[
            {
                url:"http://localhost:3005"
            }
        ],
    },
    apis:["./src/routes/*.js"]
}

const specs = swaggerJsDoc(options);

require('./src/routes/routes_vl')(app)

app.use("/api-docs",swaggerUI.serve,swaggerUI.setup(specs))
app.listen(port, ()=> console.log('Serveur Démarré'))