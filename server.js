const express = require("express");
const db = require("./db");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// ==========================================
// ROTAS DE NAVEGAÇÃO
// ==========================================
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "login.html"));
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "login.html"));
});

app.get("/cadastro", (req, res) => {
    res.sendFile(path.join(__dirname, "CadastroPacientes.html"));
});

app.get("/recepcao", (req, res) => {
    res.sendFile(path.join(__dirname, "recepcao.html"));
});

app.get("/painel", (req, res) => {
    res.sendFile(path.join(__dirname, "painel.html"));
});

app.get("/laboratorio", (req, res) => {
    res.sendFile(path.join(__dirname, "laboratorio.html"));
});

app.get("/atendimento_medico", (req, res) => {
    res.sendFile(path.join(__dirname, "atendimento_medico.html"));
});

// ==========================================
// ROTAS DA API / BANCO DE DADOS
// ==========================================

// 1. JOIN DE PACIENTES E ATENDIMENTOS (Painel Kanban)
app.get("/atendimentos", (req, res) => {
  db.all(`SELECT AOS.ID_ATENDIMENTO, AOS.ID_PACIENTE, PCT.PACIENTE, PCT.ESPECIE, PCT.RACA,
                  AOS.DATA_ATENDIMENTO, AOS.VETERINARIO, AOS.SITUACAO, AOS.SINTOMAS, 
                  AOS.PESO, AOS.TEMPERATURA, AOS.DIAGNOSTICO, AOS.RECEITA
           FROM ATENDIMENTOS AOS 
           LEFT JOIN PACIENTES PCT ON PCT.ID_PACIENTE = AOS.ID_PACIENTE;`, [], (err, rows) => {
    if (err) {
      console.log(err);
      res.status(500).json({ erro: err.message });
    } else {
      res.json(rows);
    }
  });
});

app.get("/atendimentos/:id", (req, res) => {
    const { id } = req.params;
    db.get(`SELECT AOS.*, PCT.PACIENTE, PCT.ESPECIE, PCT.RACA 
            FROM ATENDIMENTOS AOS 
            LEFT JOIN PACIENTES PCT ON PCT.ID_PACIENTE = AOS.ID_PACIENTE
            WHERE AOS.ID_ATENDIMENTO = ?`, [id], (err, row) => {
        if (err) return res.status(500).json({ erro: err.message });
        if (!row) return res.status(404).json({ erro: "Atendimento não encontrado." });
        res.json(row);
    });
});

app.get("/pacientes", (req, res) => {
  db.all("SELECT ID_PACIENTE, PACIENTE, ESPECIE, RACA, TUTOR FROM PACIENTES", [], (err, rows) => {
    if (err) return res.status(500).json({ erro: err.message });
    res.json(rows);
  });
});

app.get("/situacao", (req, res) => {
  db.all("SELECT DISTINCT SITUACAO FROM ATENDIMENTOS", [], (err, rows) => {
    if (err) return res.status(500).json({ erro: err.message });
    res.json(rows);
  });
});

app.post("/atendimentos", (req, res) => {
    const { ID_PACIENTE, DATA_ATENDIMENTO, VETERINARIO, SITUACAO, PESO, TEMPERATURA, SINTOMAS } = req.body;
    const sql = `INSERT INTO ATENDIMENTOS (ID_PACIENTE, DATA_ATENDIMENTO, VETERINARIO, SITUACAO, PESO, TEMPERATURA, SINTOMAS) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const params = [ID_PACIENTE, DATA_ATENDIMENTO, VETERINARIO || null, SITUACAO, PESO || null, TEMPERATURA || null, SINTOMAS];

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ erro: err.message });
        res.json({ mensagem: "Salvo com sucesso", id: this.lastID });
    });
});

app.put("/atendimentos/:id", (req, res) => {
    const { id } = req.params;
    const { SITUACAO, DIAGNOSTICO, RECEITA } = req.body;
    const sql = `UPDATE ATENDIMENTOS SET SITUACAO = ?, DIAGNOSTICO = COALESCE(?, DIAGNOSTICO), RECEITA = COALESCE(?, RECEITA) WHERE ID_ATENDIMENTO = ?`;

    db.run(sql, [SITUACAO, DIAGNOSTICO || null, RECEITA || null, id], function(err) {
        if (err) return res.status(500).json({ erro: err.message });
        res.json({ mensagem: "Atendimento/Prontuário atualizado com sucesso!" });
    });
});

app.post("/pacientes", (req, res) => {
    const { PACIENTE, TUTOR, IDADE, ESPECIE, SEXO, RACA, TELEFONE, CASTRADO } = req.body;
    const sql = `INSERT INTO PACIENTES (PACIENTE, TUTOR, IDADE, ESPECIE, SEXO, RACA, TELEFONE, CASTRADO) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [PACIENTE, TUTOR, IDADE, ESPECIE, SEXO, RACA || null, TELEFONE || null, CASTRADO || null];

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ erro: err.message });
        res.json({ mensagem: "Paciente cadastrado com sucesso 🐾", id: this.lastID });
    });
});

app.post("/login", (req, res) => {
    const { USUARIO, SENHA } = req.body;
    db.get(`SELECT * FROM USUARIOS WHERE USUARIO = ? AND SENHA = ?`, [USUARIO, SENHA], (err, row) => {
        if (err) return res.status(500).json({ erro: err.message });
        if (!row) return res.status(401).json({ mensagem: "Usuário ou senha inválidos" });
        res.json({ mensagem: "Login realizado com sucesso!", usuario: row });
    });
});

// ==========================================
// ROTAS DE EXAMES & LABORATÓRIO
// ==========================================
app.get("/atendimentos/:id/exames", (req, res) => {
    const { id } = req.params;
    db.all("SELECT * FROM EXAMES WHERE ID_ATENDIMENTO = ?", [id], (err, rows) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(rows);
    });
});

app.post("/atendimentos/:id/exames", (req, res) => {
    const { id } = req.params;
    const { NOME_EXAME } = req.body;
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    if (!NOME_EXAME) return res.status(400).json({ erro: "Nome do exame é obrigatório." });

    db.run(`INSERT INTO EXAMES (ID_ATENDIMENTO, NOME_EXAME, STATUS, DATA_SOLICITACAO) VALUES (?, ?, 'SOLICITADO', ?)`, 
    [id, NOME_EXAME.toUpperCase(), dataAtual], function(err) {
        if (err) return res.status(500).json({ erro: err.message });

        db.run(`UPDATE ATENDIMENTOS SET SITUACAO = 'AGUARDANDO EXAME' WHERE ID_ATENDIMENTO = ?`, [id], function(err) {
            if (err) return res.status(500).json({ erro: "Erro ao atualizar o painel." });
            res.status(200).json({ sucesso: true, mensagem: "Exame solicitado e pet movido para a coluna do Lab!" });
        });
    });
});

app.put("/exames/:id", (req, res) => {
    const { id } = req.params;
    const { LABORATORIO_RESPONSAVEL, RESULTADO_LAUDO } = req.body;
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    db.get("SELECT ID_ATENDIMENTO FROM EXAMES WHERE ID_EXAME = ?", [id], (err, exame) => {
        if (err || !exame) return res.status(500).json({ erro: "Exame não encontrado." });

        const idAtendimento = exame.ID_ATENDIMENTO; 

        db.run(`UPDATE EXAMES SET LABORATORIO_RESPONSAVEL = ?, RESULTADO_LAUDO = ?, STATUS = 'PRONTO', DATA_RESULTADO = ? WHERE ID_EXAME = ?`, 
        [LABORATORIO_RESPONSAVEL.toUpperCase(), RESULTADO_LAUDO.toUpperCase(), dataAtual, id], function(err) {
            if (err) return res.status(500).json({ erro: err.message });

            db.run(`UPDATE ATENDIMENTOS SET SITUACAO = 'EM ATENDIMENTO' WHERE ID_ATENDIMENTO = ?`, [idAtendimento], function(err) {
                if (err) return res.status(500).json({ erro: err.message });
                res.json({ mensagem: "Exame laudado e pet devolvido para atendimento!" });
            });
        });
    });
});

app.put("/exames/:id/status", (req, res) => {
    const { id } = req.params;
    const { STATUS } = req.body;
    db.run("UPDATE EXAMES SET STATUS = ? WHERE ID_EXAME = ?", [STATUS, id], function(err) {
        if (err) return res.status(500).json({ erro: err.message });
        res.json({ mensagem: "Status do exame atualizado com sucesso!" });
    });
});

app.use(express.static(__dirname));

app.listen(3001, () => {
  console.log("Servidor rodando com sucesso em http://localhost:3001 🐾");
});
