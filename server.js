const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// CONEXÃO COM O MONGODB
const MONGO_URI = chave_API || 'mongodb://localhost:27017/sala-julgamento';

mongoose.connect(MONGO_URI)
    .then(() => console.log('Conectado ao MongoDB com sucesso!'))
    .catch((err) => console.error('Erro ao conectar ao MongoDB:', err));

// Schema e Model de Usuários no MongoDB
const usuarioSchema = new mongoose.Schema({
    usuario: { type: String, required: true, unique: true },
    senha: { type: String, required: true }
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

// Rota de Cadastro com MongoDB
app.post('/api/cadastrar', async (req, res) => {
    const { usuario, senha } = req.body;
    if (!usuario || !senha) {
        return res.json({ sucesso: false, mensagem: 'Usuário e senha são obrigatórios.' });
    }

    try {
        const usuarioExistente = await Usuario.findOne({ usuario });
        if (usuarioExistente) {
            return res.json({ sucesso: false, mensagem: 'Este usuário já existe.' });
        }

        const novoUsuario = new Usuario({ usuario, senha });
        await novoUsuario.save();
        res.json({ sucesso: true, mensagem: 'Cadastro realizado com sucesso!' });
    } catch (e) {
        console.error(e);
        res.json({ sucesso: false, mensagem: 'Erro interno ao cadastrar usuário.' });
    }
});

// Rota de Login com MongoDB
app.post('/api/login', async (req, res) => {
    const { usuario, senha } = req.body;

    try {
        const user = await Usuario.findOne({ usuario });
        if (!user || user.senha !== senha) {
            return res.json({ sucesso: false, mensagem: 'Usuário ou senha inválidos.' });
        }

        res.json({ sucesso: true, usuario: user.usuario });
    } catch (e) {
        console.error(e);
        res.json({ sucesso: false, mensagem: 'Erro interno ao fazer login.' });
    }
});

// Banco de Temas Oficiais
const temasOficiais = [
    {
        titulo: "O Furto do Relógio de Ouro",
        historinha: "Um mordomo é acusado de roubar o relógio de ouro de herança da patroa durante uma festa de gala, mas ele jura que o relógio estava sobre a mesa quando ele saiu da sala."
    },
    {
        titulo: "A Quebra de Contrato Tecnológico",
        historinha: "Uma startup acusa um ex-funcionário de vazar o código-fonte de um algoritmo secreto para uma empresa concorrente dias antes do lançamento oficial."
    },
    {
        titulo: "O Acidente na Indústria Química",
        historinha: "O gerente de uma fábrica é responsabilizado por negligência após um vazamento de substâncias que paralisou o comércio local, embora ele alegue falha estrutural no equipamento."
    },
    {
        titulo: "A Falsificação de Obra de Arte",
        historinha: "Um galerista é processado por vender uma pintura famosa afirmando ser original, enquanto o autor do quadro original exige reparação por falsificação."
    }
];

const salas = {};

io.on('connection', (socket) => {
    console.log(`Novo usuário conectado: ${socket.id}`);

    const enviarTemasSorteados = () => {
        const embaralhados = [...temasOficiais].sort(() => 0.5 - Math.random());
        const sorteados = embaralhados.slice(0, 2);
        socket.emit('receber-temas-sorteio', sorteados);
    };

    enviarTemasSorteados();
    socket.on('solicitar-temas-sorteio', enviarTemasSorteados);

    socket.emit('listar-salas', Object.keys(salas).map(nome => ({
        nome: nome,
        tema: salas[nome].tema,
        historinha: salas[nome].historinha,
        jogadoresAtuais: salas[nome].jogadores.length,
        maxJogadores: salas[nome].maxJogadores
    })));

    socket.on('entrar-sala', (dados) => {
        const { nome, tema, historinha, maxJogadores } = dados;

        if (!salas[nome]) {
            salas[nome] = {
                tema: tema,
                historinha: historinha,
                maxJogadores: parseInt(maxJogadores) || 9,
                jogadores: []
            };
        }

        const sala = salas[nome];

        if (sala.jogadores.length >= sala.maxJogadores) {
            socket.emit('erro-sala', 'Esta sala já está lotada!');
            return;
        }

        socket.join(nome);
        sala.jogadores.push({ id: socket.id });

        const total = sala.jogadores.length;
        let papel = 'Espectador/Advogado de Defesa';

        if (total === 1) papel = 'Juiz';
        else if (total === 2) papel = 'Promotor / Acusação';
        else if (total === 3) papel = 'Testemunha 1';
        else if (total === 4) papel = 'Testemunha 2';

        socket.emit('seu-papel', {
            papel: papel,
            nomeReal: `Usuário_${socket.id.substring(0, 4)}`,
            tema: sala.tema,
            historinha: sala.historinha
        });

        io.emit('listar-salas', Object.keys(salas).map(n => ({
            nome: n,
            tema: salas[n].tema,
            historinha: salas[n].historinha,
            jogadoresAtuais: salas[n].jogadores.length,
            maxJogadores: salas[n].maxJogadores
        })));
    });

    socket.on('enviar-mensagem', (dados) => {
        io.to(dados.sala).emit('receber-mensagem', dados);
    });

    socket.on('emitir-veredito', (dados) => {
        io.to(dados.sala).emit('receber-mensagem', {
            papelRemetente: '⚖️ JUIZ (VEREDITO FINAL)',
            texto: dados.texto
        });
    });

    socket.on('encerrar-caso', (dados) => {
        if (salas[dados.sala]) {
            delete salas[dados.sala];
            io.emit('listar-salas', Object.keys(salas).map(n => ({
                nome: n,
                tema: salas[n].tema,
                historinha: salas[n].historinha,
                jogadoresAtuais: salas[n].jogadores.length,
                maxJogadores: salas[n].maxJogadores
            })));
        }
    });

    socket.on('disconnect', () => {
        console.log(`Usuário desconectado: ${socket.id}`);
        for (let nomeSala in salas) {
            const sala = salas[nomeSala];
            sala.jogadores = sala.jogadores.filter(j => j.id !== socket.id);
            if (sala.jogadores.length === 0) {
                delete salas[nomeSala];
            }
        }
        io.emit('listar-salas', Object.keys(salas).map(n => ({
            nome: n,
            tema: salas[n].tema,
            historinha: salas[n].historinha,
            jogadoresAtuais: salas[n].jogadores.length,
            maxJogadores: salas[n].maxJogadores
        })));
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
