const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database(
  "C:/ProjetosSql/sqlite-tools-win-x64-3530000/clinica.db",
  (err) => {
    if (err) {
      console.error("Erro ao conectar:", err.message);
    } else {
      console.log("Conectado ao banco SQLite");
    }
  }
);

module.exports = db;