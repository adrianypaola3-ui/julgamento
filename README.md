# julgamento

# ⚖️ Tribunal Virtual 

Aplicação web em tempo real desenvolvida como projeto escolar para a ETEC, que simula um ambiente de tribunal de justiça interativo. Os participantes assumem papéis jurídicos (Juiz, Advogados de Defesa e Promotores de Acusação, além de Testemunhas) para debater e julgar casos de crimes digitais envolvendo o réu **Carlos Silva**.

---

## 🚀 Funcionalidades Principais

* **Autenticação de Utilizadores**: Sistema de registo e login seguro integrado com MongoDB Atlas.
* **Comunicação em Tempo Real**: Chat ao vivo sincronizado via WebSockets (Socket.io) com atribuição de cores automáticas por equipa (Verde para Defesa, Vermelho para Acusação, Amarelo para Testemunhas e Laranja para o Juiz).
* **Distribuição de Papéis**: Atribuição automática de 9 papéis diferentes em salas cheias (1 Juiz, 3 Membros da Defesa, 3 Membros da Acusação e 2 Testemunhas).
* **Imparcialidade Estricta**: O sistema oculta os nicks reais dos participantes especificamente para o **Juiz**, garantindo um julgamento imparcial.
* **Validação de Casos**: Seleção de casos predefinidos aleatórios ou envio de casos personalizados validados automaticamente pelo servidor (exigindo menção obrigatória ao réu Carlos Silva).

---

## 🛠️ Tecnologias Utilizadas

* **Node.js** & **Express.js** (Backend e Servidor Web)
* **Socket.io** (Comunicação bidirecional em tempo real)
* **MongoDB Atlas** & **Mongoose** (Base de dados NoSQL)
* **Dotenv** (Gestão de variáveis de ambiente)
* **HTML5, CSS3 & JavaScript** (Frontend)

---

## 📦 Como Instalar e Rodar o Projeto

### Pré-requisitos
Certifica-te de que tens o **Node.js** instalado no teu computador.

### 1. Clonar o repositório ou descarregar os ficheiros
```bash
git clone <url-do-teu-repositorio>
cd nome-do-repositorio

como rodar o site:
digite node server.js
ele gerará o http://localhost:3000
tenha o ngrok instalado
npx ngrok http 3000 -- este e o codigo para que rode no portão certo. Ele dara um link para visitar o site.
ngrok http 3000
após rodar esse trecho, o ngrok gerará um link para colocar o site em público.
