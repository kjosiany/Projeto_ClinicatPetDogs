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
// ROTAS DE NAVEGAÇÃO (Com caminhos blindados)
// ==========================================

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

// ==========================================
// ROTAS DA API / BANCO DE DADOS
// ==========================================

// 1. JOIN DE PACIENTES E ATENDIMENTOS (Painel)
app.get("/atendimentos", (req, res) => {
  db.all(`SELECT AOS.ID_ATENDIMENTO, AOS.ID_PACIENTE, PCT.PACIENTE, PCT.especie, 
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

// 2. BUSCAR UM ATENDIMENTO ESPECÍFICO 
app.get("/atendimentos/:id", (req, res) => {
    const { id } = req.params;
    db.get(`SELECT AOS.*, PCT.PACIENTE, PCT.especie 
            FROM ATENDIMENTOS AOS 
            LEFT JOIN PACIENTES PCT ON PCT.ID_PACIENTE = AOS.ID_PACIENTE
            WHERE AOS.ID_ATENDIMENTO = ?`, [id], (err, row) => {
        if (err) return res.status(500).json({ erro: err.message });
        if (!row) return res.status(404).json({ erro: "Atendimento não encontrado." });
        res.json(row);
    });
});

// 3. LISTAR PACIENTES 
app.get("/pacientes", (req, res) => {
  db.all("SELECT ID_PACIENTE, PACIENTE, especie, TUTOR FROM PACIENTES", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ erro: err.message });
    }
    res.json(rows);
  });
});

// 4. SITUAÇAO DOS ATENDIMENTOS
app.get("/situacao", (req, res) => {
  const sql = "SELECT DISTINCT SITUACAO FROM ATENDIMENTOS";
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ erro: err.message });
    }
    res.json(rows);
  });
});

// 5. CADASTRO DE ATENDIMENTOS / RECONCILIAÇÃO DA TRIAGEM
app.post("/atendimentos", (req, res) => {
    const { ID_PACIENTE, DATA_ATENDIMENTO, VETERINARIO, SITUACAO, PESO, TEMPERATURA, SINTOMAS } = req.body;

    const sql = `
        INSERT INTO ATENDIMENTOS 
        (ID_PACIENTE, DATA_ATENDIMENTO, VETERINARIO, SITUACAO, PESO, TEMPERATURA, SINTOMAS)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
        ID_PACIENTE,
        DATA_ATENDIMENTO,
        VETERINARIO || null,
        SITUACAO,
        PESO || null,
        TEMPERATURA || null,
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

// 6. ATUALIZAR STATUS, DIAGNÓSTICO E RECEITA (Salvar Prontuário Médico)
app.put("/atendimentos/:id", (req, res) => {
    const { id } = req.params;
    const { SITUACAO, DIAGNOSTICO, RECEITA } = req.body;

    const sql = `
        UPDATE ATENDIMENTOS 
        SET SITUACAO = ?,
            DIAGNOSTICO = COALESCE(?, DIAGNOSTICO),
            RECEITA = COALESCE(?, RECEITA)
        WHERE ID_ATENDIMENTO = ?
    `;

    db.run(sql, [SITUACAO, DIAGNOSTICO || null, RECEITA || null, id], function(err) {
        if (err) {
            console.log(err);
            return res.status(500).json({ erro: err.message });
        }
        res.json({ mensagem: "Atendimento/Prontuário atualizado com sucesso!" });
    });
});

// 7. CADASTRO DE PACIENTES
app.post("/pacientes", (req, res) => {
    const { PACIENTE, TUTOR, IDADE, ESPECIE, SEXO } = req.body;

    const sql = `
        INSERT INTO PACIENTES
        (PACIENTE, TUTOR, IDADE, especie, SEXO)
        VALUES (?, ?, ?, ?, ?)
    `;

    const params = [PACIENTE, TUTOR, IDADE, ESPECIE, SEXO];

    db.run(sql, params, function(err) {
        if (err) {
            console.log(err);
            return res.status(500).json({ erro: err.message });
        }
        res.json({
            mensagem: "Paciente cadastrado com sucesso 🐾",
            id: this.lastID
        });
    });
});

// 8. ROTA DE LOGIN (Autenticação)
app.post("/login", (req, res) => {
    const { USUARIO, SENHA } = req.body;

    const sql = `
        SELECT * FROM USUARIOS
        WHERE USUARIO = ? AND SENHA = ?
    `;

    db.get(sql, [USUARIO, SENHA], (err, row) => {
        if (err) {
            return res.status(500).json({ erro: err.message });
        }
        if (!row) {
            return res.status(401).json({ mensagem: "Usuário ou senha inválidos" });
        }
        res.json({
            mensagem: "Login realizado com sucesso!",
            usuario: row
        });
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

// SOLICITAR EXAME
app.post("/atendimentos/:id/exames", (req, res) => {
    const { id } = req.params;
    const { NOME_EXAME } = req.body;
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    if (!NOME_EXAME) {
        return res.status(400).json({ erro: "Nome do exame é obrigatório." });
    }

    const sqlInserirExame = `
        INSERT INTO EXAMES (ID_ATENDIMENTO, NOME_EXAME, STATUS, DATA_SOLICITACAO) 
        VALUES (?, ?, 'SOLICITADO', ?)
    `;

    db.run(sqlInserirExame, [id, NOME_EXAME.toUpperCase(), dataAtual], function(err) {
        if (err) {
            return res.status(500).json({ erro: err.message });
        }

        const sqlAtualizarPainel = `
            UPDATE ATENDIMENTOS 
            SET SITUACAO = 'AGUARDANDO EXAME' 
            WHERE ID_ATENDIMENTO = ?
        `;

        db.run(sqlAtualizarPainel, [id], function(err) {
            if (err) {
                return res.status(500).json({ erro: "Exame salvo, mas falhou ao atualizar o painel." });
            }
            res.status(201).json({ mensagem: "Exame solicitado e pet movido para a coluna do Lab!" });
        });
    });
});

app.put("/exames/:id", (req, res) => {
    const { id } = req.params;
    const { LABORATORIO_RESPONSAVEL, RESULTADO_LAUDO } = req.body;
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    db.get("SELECT ID_ATENDIMENTO FROM EXAMES WHERE ID_EXAME = ?", [id], (err, exame) => {
        if (err || !exame) {
            return res.status(500).json({ erro: "Exame não encontrado para laudar." });
        }

        const idAtendimento = exame.ID_ATENDIMENTO; 
        const sqlExame = `
            UPDATE EXAMES 
            SET LABORATORIO_RESPONSAVEL = ?,
                RESULTADO_LAUDO = ?,
                STATUS = 'PRONTO',
                DATA_RESULTADO = ?
            WHERE ID_EXAME = ?
        `;

        db.run(sqlExame, [LABORATORIO_RESPONSAVEL.toUpperCase(), RESULTADO_LAUDO.toUpperCase(), dataAtual, id], function(err) {
            if (err) {
                return res.status(500).json({ erro: err.message });
            }

            // Altera o status no painel de volta para a coluna azul médica
            const sqlAtendimento = `
                UPDATE ATENDIMENTOS 
                SET SITUACAO = 'EM ATENDIMENTO' 
                WHERE ID_ATENDIMENTO = ?
            `;

            db.run(sqlAtendimento, [idAtendimento], function(err) {
                if (err) {
                    return res.status(500).json({ erro: err.message });
                }
                res.json({ mensagem: "Exame laudado e pet devolvido para atendimento!" });
            });
        });
    });
});

app.put("/exames/:id/status", (req, res) => {
    const { id } = req.params;
    const { STATUS } = req.body;

    db.run("UPDATE EXAMES SET STATUS = ? WHERE ID_EXAME = ?", [STATUS, id], function(err) {
        if (err) {
            return res.status(500).json({ erro: err.message });
        }
        res.json({ mensagem: "Status do exame updated com sucesso!" });
    });
});

app.use(express.static(__dirname));

// INICIALIZAÇÃO DO SERVIDOR
app.listen(3001, () => {
  console.log("Servidor rodando com sucesso em http://localhost:3001 🐾");
});
