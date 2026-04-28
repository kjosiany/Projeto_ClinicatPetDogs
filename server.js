console.log
const express = require("express");
const db = require("./db");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Servidor funcionando");
});

app.get("/atendimentos", (req, res) => {
  db.all("SELECT AOS.ID_ATENDIMENTO,AOS.ID_PACIENTE,PCT.PACIENTE, PCT.especie, AOS.DATA_ATENDIMENTO, AOS.VETERINARIO, AOS.SITUACAO, AOS.SINTOMAS FROM ATENDIMENTOS AOS LEFT JOIN PACIENTES PCT ON PCT.ID= AOS.ID_PACIENTE", [], (err, rows) => {
    if (err) {
      console.log(err);
      res.status(500).json({ erro: err.message });
    } else {
      res.json(rows);
    }
  });
});

app.listen(3001, () => {
  console.log("Servidor rodando em http://localhost:3001");
});