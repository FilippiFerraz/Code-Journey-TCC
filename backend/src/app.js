const express = require("express");
const cors = require("cors");
const rotas = require("./routes");
const tratarErros = require("./middlewares/error.middleware");


const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", rotas);

app.use(tratarErros);

module.exports = app;
