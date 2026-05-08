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
// JOIN DE PACIENTES E ATENDIMENTOS
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


app.get("/pacientes", (req, res) => {
  db.all("SELECT ID, PACIENTE, especie FROM PACIENTES", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ erro: err.message });
    }
    res.json(rows);
  });
});


//ROTA CADASTRO DE ATENDIMENTOS
app.post("/atendimentos", (req, res) => {
    const { ID_PACIENTE, DATA_ATENDIMENTO, VETERINARIO, SITUACAO, SINTOMAS } = req.body;

    const sql = `
        INSERT INTO ATENDIMENTOS 
        (ID_PACIENTE, DATA_ATENDIMENTO, VETERINARIO, SITUACAO, SINTOMAS)
        VALUES (?, ?, ?, ?, ?)
    `;

    const params = [
        ID_PACIENTE,
        DATA_ATENDIMENTO,
        VETERINARIO || null,
        SITUACAO,
        SINTOMAS
    ];

    db.run(sql, params, function(err) {
        if (err) {
            console.log(err);
            return res.status(500).json({ erro: err.message });
        }

        res.json({
            mensagem: "Salvo com sucesso",
            id: this.lastID
        });
    });
});
const path = require("path");

app.use(express.static(__dirname));

//ROTA SITUAÇAO DOS ATENDIMENTOS
app.get("/situacao", (req, res) => {
  const sql = "SELECT DISTINCT SITUACAO FROM ATENDIMENTOS";

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ erro: err.message });
    }
    res.json(rows);
  });
});



// Rota de Cadastro de Pets 
app.post("/pacientes", (req, res) => {

    const {
        PACIENTE,
        TUTOR,
        IDADE,
        ESPECIE,
        SEXO
    } = req.body;

    const sql = `
        INSERT INTO PACIENTES
        (PACIENTE, TUTOR, IDADE, especie, SEXO)
        VALUES (?, ?, ?, ?, ?)
    `;

    const params = [
        PACIENTE,
        TUTOR,
        IDADE,
        ESPECIE,
        SEXO
    ];

    db.run(sql, params, function(err) {

        if (err) {
            console.log(err);

            return res.status(500).json({
                erro: err.message
            });
        }

        res.json({
            mensagem: "Paciente cadastrado com sucesso🐾",
            id: this.lastID
        });

    });

});

app.listen(3001, () => {
  console.log("Servidor rodando em http://localhost:3001");
});
