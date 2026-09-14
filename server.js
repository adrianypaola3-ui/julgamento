const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Conexão com o MongoDB
const senhadoBanco = process.env.MONGO_URI;
mongoose.connect(uri)
.then(() => console.log('Conectado ao MongoDB Atlas com sucesso!'))
.catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// Definição do Schema da Sala no MongoDB
const salaSchema = new mongoose.Schema({
    nomeSala: { type: String, required: true, unique: true },
    criador: { type: String, required: true },
    caso: {
        tema: String,
        titulo: String,
        texto: String
    },
    jogadores: [{
        id: String,
        nick: String,
        papel: String
    }]
});

const Sala = mongoose.model('Sala', salaSchema);

// Banco de casos estático para sorteio
const casosBanco = [
    {
        tema: "Inteligência Artificial e Arte",
        titulo: "O Caso da IA Plagiadora",
        texto: "Um artista plástico famoso acusa uma empresa de inteligência artificial de roubar seu estilo artístico para gerar pinturas automatizadas que venceram um prêmio de arte nacional. A defesa alega que a IA apenas aprendeu padrões visuais humanos, assim como qualquer estudante de arte faria."
    },
    {
        tema: "Trânsito e Tecnologia",
        titulo: "O Dilema do Carro Autônomo",
        texto: "Um veículo autônomo atropelou um pedestre que atravessou a rua fora da faixa olhando para o smartphone. O sistema do carro detectou o pedestre com 0.5s de antecedência, mas optou por desviar para a calçada e colidir contra um poste em vez de frear bruscamente. A acusação diz que o algoritmo falhou na prioridade de preservação."
    },
    {
        tema: "Privacidade e Clonagem",
        titulo: "O Vazamento da Voz Sintética",
        texto: "Um político teve sua voz clonada por IA em um áudio falso vazado na internet às vésperas da eleição, causando perda massiva de votos. A defesa argumenta que era apenas uma sátira cômica gerada por um eleitor anônimo, amparada pela liberdade de expressão."
    }
];

// Função auxiliar para enviar a lista de salas atualizada para todos os conectados
async function atualizarSalasParaTodos() {
    const salasDoBanco = await Sala.find({});
    const salasObj = {};
    salasDoBanco.forEach(s => {
        salasObj[s.nomeSala] = {
            criador: s.criador,
            caso: s.caso,
            jogadores: s.jogadores
        };
    });
    io.emit('atualizar_salas', salasObj);
}

io.on('connection', async (socket) => {
    console.log(`Usuário conectado: ${socket.id}`);

    // Envia a lista atualizada logo que conecta
    await atualizarSalasParaTodos();

    socket.on('criar_sala', async ({ nomeSala, nick }) => {
        try {
            const salaExiste = await Sala.findOne({ nomeSala });
            if (salaExiste) {
                socket.emit('erro', 'Esta sala já existe!');
                return;
            }

            const casoSorteado = casosBanco[Math.floor(Math.random() * casosBanco.length)];

            const novaSala = new Sala({
                nomeSala,
                criador: nick,
                caso: casoSorteado,
                jogadores: [{ id: socket.id, nick, papel: 'defesa' }]
            });

            await novaSala.save();

            socket.join(nomeSala);
            socket.emit('sala_criada', { nomeSala, caso: casoSorteado, papel: 'defesa' });
            await atualizarSalasParaTodos();
        } catch (error) {
            console.error(error);
            socket.emit('erro', 'Erro ao criar a sala.');
        }
    });

    socket.on('entrar_sala', async ({ nomeSala, nick }) => {
        try {
            const sala = await Sala.findOne({ nomeSala });
            if (!sala) {
                socket.emit('erro', 'Sala não encontrada!');
                return;
            }

            socket.join(nomeSala);

            let papel = 'espectador';
            if (sala.jogadores.length === 1) {
                papel = 'acusacao';
            }

            sala.jogadores.push({ id: socket.id, nick, papel });
            await sala.save();

            socket.emit('entrou_na_sala', { nomeSala, caso: sala.caso, papel });
            io.to(nomeSala).emit('mensagem_sistema', `${nick} entrou na sala.`);
            await atualizarSalasParaTodos();
        } catch (error) {
            console.error(error);
        }
    });

    socket.on('enviar_mensagem', ({ nomeSala, nick, texto, papel }) => {
        io.to(nomeSala).emit('receber_mensagem', { nick, texto, papel });
    });

    socket.on('disconnect', async () => {
        console.log(`Usuário desconectado: ${socket.id}`);
        try {
            const salas = await Sala.find({ 'jogadores.id': socket.id });
            
            for (let sala of salas) {
                sala.jogadores = sala.jogadores.filter(j => j.id !== socket.id);
                
                if (sala.jogadores.length === 0) {
                    await Sala.deleteOne({ _id: sala._id });
                } else {
                    await sala.save();
                }
            }
            await atualizarSalasParaTodos();
        } catch (error) {
            console.error(error);
        }
    });
});

server.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});