const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Banco de casos com Tema, Título e Texto do Cenário separados
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

const salas = {};

io.on('connection', (socket) => {
    console.log(`Usuário conectado: ${socket.id}`);

    // Envia a lista de salas atualizada para quem conectar
    socket.emit('atualizar_salas', salas);

    socket.on('criar_sala', ({ nomeSala, nick }) => {
        if (salas[nomeSala]) {
            socket.emit('erro', 'Esta sala já existe!');
            return;
        }

        // Sorteia o caso para a sala
        const casoSorteado = casosBanco[Math.floor(Math.random() * casosBanco.length)];

        salas[nomeSala] = {
            criador: nick,
            caso: casoSorteado,
            jogadores: [{ id: socket.id, nick, papel: 'defesa' }] // O criador começa como Defesa (verde)
        };

        socket.join(nomeSala);
        socket.emit('sala_criada', { nomeSala, caso: casoSorteado, papel: 'defesa' });
        io.emit('atualizar_salas', salas);
    });

    socket.on('entrar_sala', ({ nomeSala, nick }) => {
        if (!salas[nomeSala]) {
            socket.emit('erro', 'Sala não encontrada!');
            return;
        }

        socket.join(nomeSala);
        
        // Define o papel do segundo jogador como Acusação (vermelho), ou espectador se já estiver cheio
        let papel = 'espectador';
        const numJogadores = salas[nomeSala].jogadores.length;
        
        if (numJogadores === 1) {
            papel = 'acusacao';
        }

        salas[nomeSala].jogadores.push({ id: socket.id, nick, papel });

        socket.emit('entrou_na_sala', { nomeSala, caso: salas[nomeSala].caso, papel });
        io.to(nomeSala).emit('mensagem_sistema', `${nick} entrou na sala.`);
    });

    socket.on('enviar_mensagem', ({ nomeSala, nick, texto, papel }) => {
        io.to(nomeSala).emit('receber_mensagem', { nick, texto, papel });
    });

    socket.on('disconnect', () => {
        console.log(`Usuário desconectado: ${socket.id}`);
        // Remove jogador das salas se necessário
        for (let sala in salas) {
            salas[sala].jogadores = salas[sala].jogadores.filter(j => j.id !== socket.id);
            if (salas[sala].jogadores.length === 0) {
                delete salas[sala];
            }
        }
        io.emit('atualizar_salas', salas);
    });
});

server.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});