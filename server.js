const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const mongoUri = process.env.MONGO_URI || 'SUA CHAVE API AQUI';

if (!mongoUri) {
    console.error("Erro: A variável de ambiente MONGO_URI não está definida!");
    process.exit(1);
}

mongoose.connect(mongoUri)
    .then(() => console.log("Conectado ao MongoDB Atlas com sucesso! 🚀"))
    .catch((err) => console.error("Erro ao conectar ao MongoDB:", err));

const usuarioSchema = new mongoose.Schema({
    usuario: { type: String, required: true, unique: true },
    senha: { type: String, required: true }
});
const Usuario = mongoose.model('Usuario', usuarioSchema);

// Inicialização do Gemini com a chave de API
const ai = new GoogleGenAI({ apiKey: 'SUA CHAVE API DO GEMINI AQUI' });
const temporizadoresSalas = {};

const listaDeCasos = [
    { tema: "Caso 1: O Acesso Indevido ao Servidor", historinha: "O réu Carlos Silva é acusado de invadir o sistema da empresa e apagar registos financeiros cruciais na véspera de uma auditoria externa." },
    { tema: "Caso 2: O Vazamento de Dados Sigilosos", historinha: "Carlos Silva é apontado como o responsável por descarregar e vender bases de dados de clientes da corporação para concorrentes no mercado negro." },
    { tema: "Caso 3: A Manipulação de Câmeras de Segurança", historinha: "Na noite do furto ao cofre, o sistema de segurança foi desativado remotamente. A acusação alega que Carlos Silva utilizou as suas credenciais de administrador para o fazer." },
    { tema: "Caso 4: A Fraude no Ponto Eletrónico", historinha: "Carlos Silva é acusado de adulterar o código fonte do sistema de ponto eletrónico para registar horas extraordinárias falsas para si e para colegas em troca de comissões." },
    { tema: "Caso 5: O Software Espião no Computador do Diretor", historinha: "Um keylogger foi encontrado instalado no computador do CEO. Os registos de rede apontam que o endereço IP do computador de Carlos Silva realizou a instalação." },
    { tema: "Caso 6: A Extorsão por Ransomware", historinha: "Os computadores da empresa foram bloqueados por um vírus de resgate. A investigação de tráfego de rede aponta o terminal de Carlos Silva como a origem do script malicioso." },
    { tema: "Caso 7: A Alteração de Notas Fiscais", historinha: "Carlos Silva é acusado de modificar o sistema de faturação para desviar pagamentos de clientes para uma conta bancária secundária sob o seu controlo." },
    { tema: "Caso 8: O Desvio de Criptomoedas da Empresa", historinha: "A carteira digital da empresa sofreu uma transferência não autorizada. As chaves de acesso utilizadas pertenciam ao perfil de Carlos Silva no departamento de TI." },
    { tema: "Caso 9: A Inativação Proposital do Alarme", historinha: "Durante um assalto digital e físico simultâneo, o alarme principal não disparou. A perícia descobriu que Carlos Silva desativou os sensores poucos minutos antes." },
    { tema: "Caso 10: O Plágio de Código Proprietário", historinha: "Carlos Silva é acusado de roubar o código-fonte de um software exclusivo da empresa e entregá-lo a uma startup rival onde possui laços societários ocultos." },
    { tema: "Caso 11: A Sabotagem do Servidor de Emails", historinha: "Emails corporativos comprometedores foram apagados da caixa de correio da diretoria. Os registos de exclusão mostram a credencial de Carlos Silva a ser utilizada." },
    { tema: "Caso 12: A Falsificação de Assinaturas Digitais", historinha: "Contratos de alto valor foram aprovados digitalmente usando o certificado token de um diretor ausente. O histórico físico aponta que Carlos Silva teve acesso físico ao token." },
    { tema: "Caso 13: O Ataque de Negação de Serviço (DDoS Interno)", historinha: "O site da empresa caiu durante o lançamento de um produto essencial. A origem do tráfego sobrecarregado veio diretamente da máquina de Carlos Silva." },
    { tema: "Caso 14: A Ocultação de Registos de Erros (Logs)", historinha: "Após uma falha grave de segurança que expôs dados de utilizadores, descobriu-se que os ficheiros de log do servidor haviam sido apagados por Carlos Silva para esconder vestígios." },
    { tema: "Caso 15: O Uso Indevido de Recursos de Nuvem (Cloud)", historinha: "Carlos Silva é acusado de utilizar os servidores de computação em nuvem da empresa de forma secreta para minerar criptomoedas durante a madrugada." },
    { tema: "Caso 16: A Inserção de Portas dos Fundos (Backdoors)", historinha: "A auditoria de código encontrou um acesso oculto no sistema de pagamentos criado por Carlos Silva, permitindo transações sem validação de senha." },
    { tema: "Caso 17: O Desaparecimento de Dispositivos de Armazenamento", historinha: "Discos rígidos externos contendo patentes industriais sumiram do laboratório. A última pessoa registada a aceder ao armário de segurança foi Carlos Silva." },
    { tema: "Caso 18: A Injeção de SQL Maliciosa no Banco de Dados", historinha: "Dados confidenciais de funcionários vazaram na internet. A investigação aponta comandos executados a partir da conta de Carlos Silva para extrair as tabelas." },
    { tema: "Caso 19: A Fraude no Sistema de Votação Interna", historinha: "As eleições para a diretoria corporativa foram manipuladas digitalmente. Os metadados do servidor indicam que Carlos Silva alterou os votos registados." },
    { tema: "Caso 20: A Destruição de Provas Digitais na Nuvem", historinha: "Após ser intimado internamente, Carlos Silva acessou os backups remotos e executou rotinas de formatação para apagar o histórico das suas atividades ilícitas." }
];

app.post('/api/cadastro', async (req, res) => {
    try {
        const { usuario, senha } = req.body;
        const existe = await Usuario.findOne({ usuario });
        if (existe) return res.json({ sucesso: false, mensagem: 'Este usuário já existe!' });
        const novoUsuario = new Usuario({ usuario, senha });
        await novoUsuario.save();
        res.json({ sucesso: true, mensagem: 'Cadastro realizado com sucesso!' });
    } catch (err) {
        res.status(500).json({ sucesso: false, mensagem: 'Erro interno no servidor.' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { usuario, senha } = req.body;
        const user = await Usuario.findOne({ usuario, senha });
        if (!user) return res.json({ sucesso: false, mensagem: 'Usuário ou senha incorretos.' });
        res.json({ sucesso: true, mensagem: 'Login bem-sucedido!', usuario: user.usuario });
    } catch (err) {
        res.status(500).json({ sucesso: false, mensagem: 'Erro interno no servidor.' });
    }
});

app.get('/api/casos-aleatorios', (req, res) => {
    const embaralhados = [...listaDeCasos].sort(() => Math.random() - 0.5);
    res.json(embaralhados.slice(0, 2));
});

const salasAtivas = {};

io.on('connection', (socket) => {
    socket.on('solicitar-salas', () => atualizarSalasParaTodos());

    socket.on('entrar-sala', (dados) => {
        const { nome, tema, historinha, maxJogadores, usuario, usarJuizIA } = dados;

        for (let nomeSalaAntiga in salasAtivas) {
            const salaAntiga = salasAtivas[nomeSalaAntiga];
            if (salaAntiga.jogadores.includes(socket.id)) {
                salaAntiga.jogadores = salaAntiga.jogadores.filter(id => id !== socket.id);
                delete salaAntiga.papeis[socket.id];
                delete salaAntiga.nicks[socket.id];
                socket.leave(nomeSalaAntiga);
                if (salaAntiga.jogadores.length === 0) {
                    delete salasAtivas[nomeSalaAntiga];
                    if (temporizadoresSalas[nomeSalaAntiga]) clearInterval(temporizadoresSalas[nomeSalaAntiga]);
                } else {
                    atribuirPapeisIntercalados(nomeSalaAntiga);
                }
            }
        }

        if (!salasAtivas[nome]) {
            salasAtivas[nome] = { 
                nome, 
                tema, 
                historinha, 
                maxJogadores: parseInt(maxJogadores), 
                jogadores: [], 
                papeis: {}, 
                nicks: {}, 
                julgamentoEncerrado: false,
                usarJuizIA: !!usarJuizIA, 
                historicoChat: [], 
                historicoTextoIA: [] 
            };

            iniciarCronometroSala(nome);
        }
        
        const sala = salasAtivas[nome];
        if (sala.jogadores.length >= sala.maxJogadores) {
            socket.emit('erro-sala', 'Esta sala já está cheia!');
            return;
        }

        socket.join(nome);
        sala.jogadores.push(socket.id);
        sala.nicks[socket.id] = usuario || 'Participante';

        socket.emit('limpar-chat');

        if (sala.historicoChat && sala.historicoChat.length > 0) {
            sala.historicoChat.forEach(msg => {
                socket.emit('receber-mensagem', msg);
            });
        }

        atualizarSalasParaTodos();
        atribuirPapeisIntercalados(nome);
    });

    socket.on('enviar-mensagem', (dados) => {
        const { sala: nomeSala, texto } = dados;
        const sala = salasAtivas[nomeSala];
        if (!sala) return;

        if (sala.julgamentoEncerrado) {
            socket.emit('receber-mensagem', {
                remetenteFormatado: '<span style="color: #ef4444; font-weight: bold;">⚠️ SISTEMA</span>',
                texto: 'O julgamento foi encerrado com o veredito. Não é possível enviar mais mensagens.'
            });
            return;
        }

        const papelRemetente = sala.papeis[socket.id] || 'Participante';
        const nickReal = sala.nicks[socket.id] || 'Anónimo';

        sala.historicoTextoIA.push(`${nickReal} (${papelRemetente}): ${texto}`);

        const socketsNaSala = io.sockets.adapter.rooms.get(nomeSala);

        if (socketsNaSala) {
            for (const socketId of socketsNaSala) {
                const papelReceptor = sala.papeis[socketId];
                
                let corPapel = '#fff';
                if (papelRemetente.includes('Defesa')) {
                    corPapel = '#22c55e';
                } else if (papelRemetente.includes('Acusação') || papelRemetente.includes('Promotor')) {
                    corPapel = '#ef4444';
                } else if (papelRemetente.includes('Testemunha')) {
                    corPapel = '#eab308';
                } else if (papelRemetente.includes('Juiz')) {
                    corPapel = '#f97316';
                }

                let remetenteExibido = '';
                if (papelRemetente.includes('Juiz')) {
                    remetenteExibido = `<span style="color: #f97316; font-weight: bold;">[JUIZ]</span>`;
                } else if (papelReceptor === 'Juiz') {
                    remetenteExibido = `<span style="color: ${corPapel}; font-weight: bold;">[${papelRemetente.toUpperCase()}]</span>`;
                } else {
                    remetenteExibido = `<span style="color: ${corPapel}; font-weight: bold;">${nickReal} (${papelRemetente})</span>`;
                }

                const objetoMensagem = { remetenteFormatado: remetenteExibido, texto };
                io.to(socketId).emit('receber-mensagem', objetoMensagem);
            }

            const formatoGenerico = `<span style="color: #60a5fa; font-weight: bold;">${nickReal} (${papelRemetente})</span>`;
            sala.historicoChat.push({ remetenteFormatado: formatoGenerico, texto });
        }
    });

    socket.on('emitir-veredito', (dados) => {
        const sala = salasAtivas[dados.sala];
        if (!sala) return;

        sala.julgamentoEncerrado = true;
        if (temporizadoresSalas[dados.sala]) clearInterval(temporizadoresSalas[dados.sala]);

        const msgVeredito = {
            remetenteFormatado: '<span style="color: #f97316; font-weight: bold;">⚖️ JUIZ (VEREDITO FINAL)</span>',
            texto: `<strong style="color: var(--accent-gold); font-size: 1.1rem;">${dados.texto}</strong>`
        };

        sala.historicoChat.push(msgVeredito);
        io.to(dados.sala).emit('receber-mensagem', msgVeredito);
        io.to(dados.sala).emit('julgamento-encerrado');
    });

    socket.on('sair-sala', (dados) => {
        const sala = salasAtivas[dados.sala];
        if (sala) {
            sala.jogadores = sala.jogadores.filter(id => id !== socket.id);
            delete sala.papeis[socket.id];
            delete sala.nicks[socket.id];
            socket.leave(dados.sala);
            if (sala.jogadores.length === 0) {
                delete salasAtivas[dados.sala];
                if (temporizadoresSalas[dados.sala]) clearInterval(temporizadoresSalas[dados.sala]);
            } else {
                atribuirPapeisIntercalados(dados.sala);
            }
        }
        atualizarSalasParaTodos();
    });

    socket.on('disconnect', () => {
        for (let nomeSala in salasAtivas) {
            const sala = salasAtivas[nomeSala];
            sala.jogadores = sala.jogadores.filter(id => id !== socket.id);
            delete sala.papeis[socket.id];
            delete sala.nicks[socket.id];
            if (sala.jogadores.length === 0) {
                delete salasAtivas[nomeSala];
                if (temporizadoresSalas[nomeSala]) clearInterval(temporizadoresSalas[nomeSala]);
            } else {
                atribuirPapeisIntercalados(nomeSala);
            }
        }
        atualizarSalasParaTodos();
    });
});

function iniciarCronometroSala(nomeSala) {
    let tempoRestante = 480; 

    if (temporizadoresSalas[nomeSala]) clearInterval(temporizadoresSalas[nomeSala]);

    temporizadoresSalas[nomeSala] = setInterval(async () => {
        const sala = salasAtivas[nomeSala];
        if (!sala || sala.julgamentoEncerrado) {
            clearInterval(temporizadoresSalas[nomeSala]);
            return;
        }

        if (tempoRestante > 0) {
            tempoRestante--;
            io.to(nomeSala).emit('atualizar-tempo', tempoRestante);
        } else {
            clearInterval(temporizadoresSalas[nomeSala]);
            sala.julgamentoEncerrado = true;
            
            io.to(nomeSala).emit('tempo-esgotado');
            io.to(nomeSala).emit('julgamento-encerrado');

            if (sala.usarJuizIA) {
                await executarJuizGemini(nomeSala);
            }
        }
    }, 1000);
}

async function executarJuizGemini(nomeSala) {
    const sala = salasAtivas[nomeSala];
    if (!sala) return;

    const msgAnuncio = { 
        remetenteFormatado: '<span style="color: #94a3b8; font-weight: bold;">🤖 JUIZ BOT (GEMINI)</span>',
        texto: "O tempo esgotou-se. A analisar os argumentos apresentados no chat para emitir o veredito..." 
    };
    sala.historicoChat.push(msgAnuncio);
    io.to(nomeSala).emit('receber-mensagem', msgAnuncio);

    try {
        const historicoFormatado = sala.historicoTextoIA.length > 0 
            ? sala.historicoTextoIA.join('\n') 
            : "Nenhum argumento foi registado no chat.";

        const promptTexto = `Você é o Juiz supremo imparcial de um tribunal virtual. 
Tema do Caso: ${sala.tema}
História: ${sala.historinha}

Abaixo está o histórico completo de argumentações trocadas pelas partes durante o debate:\n\n${historicoFormatado}\n\nCom base estritamente nestes argumentos vistos no chat, decida quem tem razão e quem está errado, declare o vencedor do caso e fundamente detalhadamente o veredito final em português.`;

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: promptTexto,
        });

        const vereditoFinal = response.text || "Veredito não gerado pela IA.";
        
        const msgVereditoIA = {
            remetenteFormatado: '<span style="color: #f97316; font-weight: bold;">⚖️ JUIZ BOT (VEREDITO FINAL)</span>',
            texto: `<strong style="color: var(--accent-gold); font-size: 1.05rem; white-space: pre-line;">${vereditoFinal}</strong>`
        };
        sala.historicoChat.push(msgVereditoIA);
        io.to(nomeSala).emit('receber-mensagem', msgVereditoIA);

    } catch (error) {
        console.error("Erro ao gerar veredito com Gemini:", error.message || error);
        const msgErro = {
            remetenteFormatado: '<span style="color: #f97316; font-weight: bold;">⚖️ JUIZ BOT (VEREDITO AUTOMÁTICO)</span>',
            texto: `<strong style="color: var(--accent-gold); font-size: 1rem;">Com base nos argumentos apresentados, o Juiz declara o encerramento da sessão com veredito favorável à Defesa por insuficiência de provas conclusivas.</strong>`
        };
        sala.historicoChat.push(msgErro);
        io.to(nomeSala).emit('receber-mensagem', msgErro);
    }
}

function atribuirPapeisIntercalados(nomeSala) {
    const sala = salasAtivas[nomeSala];
    if (!sala || sala.jogadores.length === 0) return;

    let listaPapeis = [];
    const maxJogadores = parseInt(sala.maxJogadores) || 9;

    if (!sala.usarJuizIA && maxJogadores >= 9) {
        listaPapeis.push('Juiz');
    }

    if (maxJogadores <= 3) {
        listaPapeis.push('Advogado de Defesa 1');
        listaPapeis.push('Promotor (Acusação 1)');
        listaPapeis.push('Testemunha 1');
    } 
    else if (maxJogadores <= 5) {
        listaPapeis.push('Advogado de Defesa 1');
        listaPapeis.push('Promotor (Acusação 1)');
        listaPapeis.push('Advogado de Defesa 2');
        listaPapeis.push('Promotor (Acusação 2)');
        listaPapeis.push('Testemunha 1');
    } 
    else {
        if (sala.usarJuizIA) {
            for (let i = 1; i <= 3; i++) {
                listaPapeis.push(`Advogado de Defesa ${i}`);
                listaPapeis.push(`Promotor (Acusação ${i})`);
                listaPapeis.push(`Testemunha ${i}`);
            }
        } else {
            for (let i = 1; i <= 3; i++) {
                listaPapeis.push(`Advogado de Defesa ${i}`);
                listaPapeis.push(`Promotor (Acusação ${i})`);
            }
            listaPapeis.push('Testemunha 1');
            listaPapeis.push('Testemunha 2');
        }
    }

    sala.jogadores.forEach((socketId, index) => {
        const papelAtribuido = listaPapeis[index] || `Participante ${index + 1}`;
        sala.papeis[socketId] = papelAtribuido;
        io.to(socketId).emit('seu-papel', { 
            papel: papelAtribuido, 
            tema: sala.tema, 
            historinha: sala.historinha,
            usarJuizIA: sala.usarJuizIA
        });
    });
}

function atualizarSalasParaTodos() {
    const lista = Object.values(salasAtivas).map(s => ({
        nome: s.nome, tema: s.tema, historinha: s.historinha, jogadoresAtuais: s.jogadores.length, maxJogadores: s.maxJogadores
    }));
    io.emit('listar-salas', lista);
}

server.listen(3000, () => console.log('Servidor rodando na porta 3000'));