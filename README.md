# 🐾 Projeto Clinica Pet Dogs

Este projeto consiste em um painel simples de atendimento veterinário desenvolvido utilizando **HTML, CSS e JavaScript**, com integração a um banco de dados por meio de uma API local.

O sistema organiza os pacientes de acordo com a situação do atendimento, permitindo uma visualização clara e rápida do fluxo de atendimento em uma clínica ou petshop.

---

# 🚀 Tecnologias Utilizadas

* HTML
* CSS
* JavaScript
* Fetch API
* Banco de dados SQLite (configurado localmente)
* API local para consulta de dados

---

# 📋 Funcionalidades

* Exibição de pacientes cadastrados
* Separação automática por situação do atendimento:

  * Aguardando atendimento
  * Em atendimento
  * Em observação
  * Em internação
* Atualização automática dos dados no painel
* Interface visual simples e organizada

---

# 🖥 Estrutura do Projeto

```text
Projeto_ClinicatPetDogs/

index.html
recepcao.html
server.js
db.js
clinica.db
package.json
README.md
```

---

# ⚙️ Como Executar o Projeto

1. Instalar as dependências:

```bash
npm install
```

2. Iniciar o servidor:

```bash
node server.js
```

3. Abrir o arquivo:

```bash
index.html
```

O sistema irá carregar automaticamente os atendimentos cadastrados no banco de dados.

---

# 📌 Objetivo do Projeto

Este projeto foi desenvolvido com o objetivo de praticar:

* Manipulação do DOM com JavaScript
* Consumo de API utilizando Fetch
* Integração entre interface e banco de dados
* Organização de dados em interface visual
* Estruturação de um sistema simples de atendimento

---

# 🔮 Melhorias Futuras

* Cadastro de novos pacientes 
* Atualização de status dos atendimentos
* Busca por nome do paciente
* Filtro por espécie
* Interface responsiva
* Sistema de login

---
