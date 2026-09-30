const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const mongoUri = process.env.MONGO_URI || "SUA CHAVE DE API AQUI";

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
        if (existe) {
            return res.json({ sucesso: false, mensagem: 'Este usuário já existe!' });
        }
        const novoUsuario = new Usuario({ usuario, senha });
        await novoUsuario.save();
        res.json({ sucesso: true, mensagem: 'Cadastro realizado com sucesso!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ sucesso: false, mensagem: 'Erro interno no servidor.' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { usuario, senha } = req.body;
        const user = await Usuario.findOne({ usuario, senha });
        if (!user) {
            return res.json({ sucesso: false, mensagem: 'Usuário ou senha incorretos.' });
        }
        res.json({ sucesso: true, mensagem: 'Login bem-sucedido!', usuario: user.usuario });
    } catch (err) {
        console.error(err);
        res.status(500).json({ sucesso: false, mensagem: 'Erro interno no servidor.' });
    }
});

app.get('/api/casos-aleatorios', (req, res) => {
    const embaralhados = [...listaDeCasos].sort(() => Math.random() - 0.5);
    res.json(embaralhados.slice(0, 2));
});

const salasAtivas = {};

io.on('connection', (socket) => {
    console.log('Utilizador conectado:', socket.id);

    socket.on('solicitar-salas', () => {
        atualizarSalasParaTodos();
    });

    socket.on('entrar-sala', (dados) => {
        const { nome, tema, historinha, maxJogadores, usuario } = dados;

        if (!salasAtivas[nome]) {
            salasAtivas[nome] = {
                nome,
                tema,
                historinha,
                maxJogadores: parseInt(maxJogadores),
                criadorId: socket.id, // O primeiro a entrar define-se como o Criador (Juiz fixo)
                jogadores: [],
                papeis: {}, 
                nicks: {},
                inicioPartida: null,
                liberadoVeredito: false
            };
        }

        const sala = salasAtivas[nome];

        if (sala.jogadores.length >= sala.maxJogadores) {
            socket.emit('erro-sala', 'Esta sala já está cheia!');
            return;
        }

        socket.join(nome);
        sala.jogadores.push(socket.id);
        sala.nicks[socket.id] = usuario || 'Participante';

        atualizarSalasParaTodos();
        atribuirPapeisFixosESorteados(nome);

        // Após 10 minutos (600000 ms), o juiz ganha a opção de finalizar o jogo
        if (sala.jogadores.length === sala.maxJogadores && !sala.inicioPartida) {
            sala.inicioPartida = Date.now();
            console.log(`[Servidor] Sala ${nome} cheia. Partida iniciada.`);

            setTimeout(() => {
                if (salasAtivas[nome]) {
                    salasAtivas[nome].liberadoVeredito = true;
                    io.to(sala.criadorId).emit('liberar-opcao-veredito', {
                        mensagem: "Já passaram 10 minutos. Pode emitir o veredito quando desejar."
                    });
                    io.to(nome).emit('receber-mensagem', {
                        remetenteFormatado: '<span style="color: #f97316; font-weight: bold;">⚖️ SISTEMA</span>',
                        texto: 'Passaram-se 10 minutos de julgamento. O Juiz já tem a opção de encerrar e dar o veredito.'
                    });
                }
            }, 10 * 60 * 1000);
        }
    });

    socket.on('enviar-mensagem', (dados) => {
        const { sala: nomeSala, texto } = dados;
        const sala = salasAtivas[nomeSala];
        if (!sala) return;

        const papelRemetente = sala.papeis[socket.id] || 'Participante';
        const nickReal = sala.nicks[socket.id] || 'Anónimo';

        const socketsNaSala = io.sockets.adapter.rooms.get(nomeSala);
        if (socketsNaSala) {
            for (const socketId of socketsNaSala) {
                const papelReceptor = sala.papeis[socketId];
                
                let corPapel = '#fff';
                if (papelRemetente.includes('Defesa')) corPapel = '#22c55e';
                else if (papelRemetente.includes('Acusação') || papelRemetente.includes('Promotor')) corPapel = '#ef4444';
                else if (papelRemetente.includes('Testemunha')) corPapel = '#eab308';
                else if (papelRemetente.includes('Juiz')) corPapel = '#f97316';

                let remetenteExibido = '';

                // SE O RECEPTOR FOR O JUIZ, ELE NÃO VÊ OS NICKS (ANONIMATO ESTRITO)
                if (papelReceptor === 'Juiz') {
                    remetenteExibido = `<span style="color: ${corPapel}; font-weight: bold;">[${papelRemetente.toUpperCase()}]</span>`;
                } else {
                    remetenteExibido = `<span style="color: ${corPapel}; font-weight: bold;">${nickReal} (${papelRemetente})</span>`;
                }

                io.to(socketId).emit('receber-mensagem', {
                    remetenteFormatado: remetenteExibido,
                    texto: texto
                });
            }
        }
    });

    socket.on('emitir-veredito', (dados) => {
        const sala = salasAtivas[dados.sala];
        if (!sala || socket.id !== sala.criadorId) return;

        io.to(dados.sala).emit('receber-mensagem', {
            remetenteFormatado: '<span style="color: #f97316; font-weight: bold;">⚖️ TRIBUNAL (VEREDITO)</span>',
            texto: `<strong style="color: var(--accent-gold); font-size: 1.1rem;">${dados.texto}</strong>`
        });
    });

    socket.on('encerrar-caso', (dados) => {
        const sala = salasAtivas[dados.sala];
        if (!sala || socket.id !== sala.criadorId) return;

        io.to(dados.sala).emit('receber-mensagem', {
            remetenteFormatado: '<span style="color: #fff; font-weight: bold;">⚖️ SISTEMA</span>',
            texto: 'O caso foi encerrado pelo Juiz. A sessão terminou.'
        });
        delete salasAtivas[dados.sala];
        atualizarSalasParaTodos();
    });

    socket.on('disconnect', () => {
        console.log('Utilizador desconectado:', socket.id);
        for (let nomeSala in salasAtivas) {
            const sala = salasAtivas[nomeSala];
            sala.jogadores = sala.jogadores.filter(id => id !== socket.id);
            delete sala.papeis[socket.id];
            delete sala.nicks[socket.id];
            if (sala.jogadores.length === 0) {
                delete salasAtivas[nomeSala];
            } else {
                if (socket.id === sala.criadorId && sala.jogadores.length > 0) {
                    sala.criadorId = sala.jogadores[0];
                }
                atribuirPapeisFixosESorteados(nomeSala);
            }
        }
        atualizarSalasParaTodos();
    });
});

<<<<<<< HEAD
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
=======
function atribuirPapeisFixosESorteados(nomeSala) {
    const sala = salasAtivas[nomeSala];
    if (!sala || sala.jogadores.length === 0) return;

    // O criador da sala é SEMPRE o Juiz fixo
    sala.papeis[sala.criadorId] = 'Juiz';

    // Os outros papéis são sorteados entre os demais participantes
    const outrosPapeisDisponiveis = [
        'Promotor (Acusação)', 
        'Advogado de Defesa', 
        'Testemunha 1', 
        'Testemunha 2', 
        'Advogado de Apoio'
    ];

    const demaisJogadores = sala.jogadores.filter(id => id !== sala.criadorId);
    const papeisEmbaralhados = [...outrosPapeisDisponiveis].sort(() => Math.random() - 0.5);

    demaisJogadores.forEach((socketId, index) => {
        sala.papeis[socketId] = papeisEmvalhados = papeisEmbaralhados[index] || `Participante ${index}`;
    });

    sala.jogadores.forEach(socketId => {
        io.to(socketId).emit('seu-papel', {
            papel: sala.papeis[socketId],
            tema: sala.tema,
            historinha: sala.historinha
        });
    });
}

function atualizarSalasParaTodos() {
    const lista = Object.values(salasAtivas).map(s => ({
        nome: s.nome,
        tema: s.tema,
        historinha: s.historinha,
        jogadoresAtuais: s.jogadores.length,
        maxJogadores: s.maxJogadores
    }));
    io.emit('listar-salas', lista);
}

server.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
>>>>>>> 64ccef4 (commit correto)
});
