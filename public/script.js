document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    let usuarioLogado = '';
    let salaAtual = '';

    // Elementos de Tela
    const telaLogin = document.getElementById('tela-login');
    const telaCadastro = document.getElementById('tela-cadastro');
    const telaCriacaoSala = document.getElementById('tela-criacao-sala');
    const telaSala = document.getElementById('tela-sala');

    function mostrarTela(telaAlvo) {
        [telaLogin, telaCadastro, telaCriacaoSala, telaSala].forEach(tela => {
            if (tela) {
                tela.style.display = 'none';
                tela.classList.remove('active');
            }
        });
        if (telaAlvo) {
            telaAlvo.style.display = 'block';
            telaAlvo.classList.add('active');
        }
    }

    // Funções globais para alternar telas de login/cadastro no HTML
    window.mostrarCadastro = () => mostrarTela(telaCadastro);
    window.mostrarLogin = () => mostrarTela(telaLogin);

    // Carregar Casos Aleatórios ao iniciar
    carregarCasosAleatorios();

    async function carregarCasosAleatorios() {
        try {
            const res = await fetch('/api/casos-aleatorios');
            const casos = await res.json();
            const container = document.getElementById('container-opcoes-temas');
            if (!container) return;

            container.innerHTML = '';
            casos.forEach((caso, index) => {
                const div = document.createElement('div');
                div.style.cssText = "background: rgba(0,0,0,0.3); padding: 6px; border-radius: 4px; font-size: 0.78rem; border: 1px solid var(--border-line);";
                div.innerHTML = `
                    <label style="display: flex; align-items: flex-start; gap: 6px; cursor: pointer; color: #fff;">
                        <input type="radio" name="caso-escolhido" value="${index}" ${index === 0 ? 'checked' : ''} 
                            data-tema="${caso.tema}" data-historinha="${caso.historinha}" style="margin-top: 2px;">
                        <div>
                            <strong style="color: var(--accent-gold);">${caso.tema}</strong>
                            <p style="margin: 2px 0 0 0; color: #bbb; font-size: 0.72rem;">${caso.historinha}</p>
                        </div>
                    </label>
                `;
                container.appendChild(div);
            });
        } catch (err) {
            console.error("Erro ao carregar casos:", err);
        }
    }

    document.getElementById('btn-ressortear')?.addEventListener('click', carregarCasosAleatorios);

    // Botão Fazer Login
    document.getElementById('btn-fazer-login')?.addEventListener('click', async () => {
        const usuario = document.getElementById('login-usuario').value.trim();
        const senha = document.getElementById('login-senha').value.trim();

        if (!usuario || !senha) {
            alert('Preencha o usuário e a senha!');
            return;
        }

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario, senha })
            });
            const dados = await res.json();
            if (dados.sucesso) {
                usuarioLogado = dados.usuario;
                document.getElementById('span-usuario-logado').innerText = usuarioLogado;
                mostrarTela(telaCriacaoSala);
                socket.emit('solicitar-salas');
            } else {
                alert(dados.mensagem);
            }
        } catch (err) {
            console.error("Erro no login:", err);
        }
    });

    // Botão Fazer Cadastro
    document.getElementById('btn-fazer-cadastro')?.addEventListener('click', async () => {
        const usuario = document.getElementById('cad-usuario').value.trim();
        const senha = document.getElementById('cad-senha').value.trim();

        if (!usuario || !senha) {
            alert('Preencha todos os campos do cadastro!');
            return;
        }

        try {
            const res = await fetch('/api/cadastro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario, senha })
            });
            const dados = await res.json();
            alert(dados.mensagem);
            if (dados.sucesso) {
                mostrarLogin();
            }
        } catch (err) {
            console.error("Erro no cadastro:", err);
        }
    });

    // Criar / Entrar em Sala
    document.getElementById('btn-entrar-sala')?.addEventListener('click', () => {
        const nomeInput = document.getElementById('input-nome-sala').value.trim();
        const nome = nomeInput || `Sala_${Math.floor(Math.random() * 1000)}`;
        const maxJogadores = document.getElementById('select-max-jogadores').value;
        const usarJuizIA = document.getElementById('check-juiz-ia')?.checked || false;

        const radioSelecionado = document.querySelector('input[name="caso-escolhido"]:checked');
        if (!radioSelecionado) {
            alert('Selecione um caso para prosseguir!');
            return;
        }

        const tema = radioSelecionado.dataset.tema;
        const historinha = radioSelecionado.dataset.historinha;

        salaAtual = nome;
        mostrarTela(telaSala);

        socket.emit('entrar-sala', {
            nome,
            tema,
            historinha,
            maxJogadores,
            usuario: usuarioLogado,
            usarJuizIA
        });
    });

    // Listar salas disponíveis no Lobby
    socket.on('listar-salas', (salas) => {
        const listaDiv = document.getElementById('lista-salas');
        if (!listaDiv) return;
        listaDiv.innerHTML = '';

        if (!salas || salas.length === 0) {
            listaDiv.innerHTML = '<p style="text-align: center; color: var(--system-text); font-size: 0.8rem; padding: 6px;">Nenhuma sala ativa.</p>';
            return;
        }

        salas.forEach(sala => {
            const item = document.createElement('div');
            item.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.3); padding: 6px; margin-bottom: 4px; border-radius: 4px; font-size: 0.8rem;";
            item.innerHTML = `
                <div>
                    <strong style="color: var(--accent-gold);">${sala.nome}</strong> - ${sala.tema} 
                    <span style="color: #aaa;">(${sala.jogadoresAtuais}/${sala.maxJogadores})</span>
                </div>
                <button class="btn-entrar-direto" data-nome="${sala.nome}" data-tema="${sala.tema}" data-historinha="${sala.historinha}" data-max="${sala.maxJogadores}" style="padding: 2px 6px; font-size: 0.7rem; background: var(--accent-gold); border: none; border-radius: 3px; cursor: pointer; font-weight: bold;">Entrar</button>
            `;
            listaDiv.appendChild(item);
        });

        listaDiv.querySelectorAll('.btn-entrar-direto').forEach(btn => {
            btn.addEventListener('click', () => {
                salaAtual = btn.dataset.nome;
                mostrarTela(telaSala);

                socket.emit('entrar-sala', {
                    nome: btn.dataset.nome,
                    tema: btn.dataset.tema,
                    historinha: btn.dataset.historinha,
                    maxJogadores: btn.dataset.max,
                    usuario: usuarioLogado,
                    usarJuizIA: true
                });
            });
        });
    });

    // Receber papel e dados do caso
    socket.on('seu-papel', (dados) => {
        const meuPapelSpan = document.getElementById('meu-papel-span');
        const spanTemaCaso = document.getElementById('span-tema-caso');
        const spanHistorinhaTexto = document.getElementById('span-historinha-texto');

        if (meuPapelSpan) meuPapelSpan.innerText = `Seu Papel: ${dados.papel}`;
        if (spanTemaCaso) spanTemaCaso.innerText = dados.tema;
        if (spanHistorinhaTexto) spanHistorinhaTexto.innerText = dados.historinha;

        const painelVeredito = document.getElementById('painel-veredito');
        if (painelVeredito) {
            if (dados.papel === 'Juiz') {
                painelVeredito.style.display = 'block';
            } else {
                painelVeredito.style.display = 'none';
            }
        }
    });

    // Envio de mensagens no Chat
    const inputChat = document.getElementById('input-chat');
    const btnEnviarChat = document.getElementById('btn-enviar-chat');

    function enviarMensagemChat() {
        if (!inputChat) return;
        const texto = inputChat.value.trim();
        if (!texto) return;

        socket.emit('enviar-mensagem', {
            sala: salaAtual,
            texto: texto
        });

        inputChat.value = '';
    }

    inputChat?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            enviarMensagemChat();
        }
    });

    btnEnviarChat?.addEventListener('click', enviarMensagemChat);

    socket.on('receber-mensagem', (dados) => {
        const caixa = document.getElementById('caixa-mensagens');
        if (!caixa) return;

        const divMsg = document.createElement('div');
        divMsg.className = 'message';
        divMsg.style.cssText = "margin-bottom: 6px; font-size: 0.85rem; line-height: 1.3;";
        divMsg.innerHTML = `<strong>${dados.remetenteFormatado}:</strong> ${dados.texto}`;
        caixa.appendChild(divMsg);
        caixa.scrollTop = caixa.scrollHeight;
    });

    socket.on('limpar-chat', () => {
        const caixa = document.getElementById('caixa-mensagens');
        if (caixa) {
            caixa.innerHTML = '<div class="message sistema-msg" style="color: var(--system-text); font-size: 0.8rem;">Sessão iniciada.</div>';
        }
    });

    // Temporizador da sessão
    socket.on('atualizar-tempo', (tempoRestante) => {
        const timerEl = document.getElementById('timer-sessao');
        if (!timerEl) return;
        const minutos = Math.floor(tempoRestante / 60);
        const segundos = tempoRestante % 60;
        timerEl.innerText = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
    });

    socket.on('tempo-esgotado', () => {
        const timerEl = document.getElementById('timer-sessao');
        if (timerEl) timerEl.innerText = "Tempo esgotado!";
    });

    // Emissão de Veredito (Caso seja Juiz humano)
    document.getElementById('btn-emitir-veredito')?.addEventListener('click', () => {
        const inputVeredito = document.getElementById('input-veredito');
        if (!inputVeredito) return;
        const textoVeredito = inputVeredito.value.trim();
        if (!textoVeredito) {
            alert('Digite o veredito antes de emitir!');
            return;
        }

        socket.emit('emitir-veredito', {
            sala: salaAtual,
            texto: textoVeredito
        });
        inputVeredito.value = '';
    });

    socket.on('julgamento-encerrado', () => {
        if (inputChat) inputChat.disabled = true;
        if (btnEnviarChat) btnEnviarChat.disabled = true;
    });

    // Botão Sair da Sala
    document.getElementById('btn-sair-sala')?.addEventListener('click', () => {
        if (salaAtual) {
            socket.emit('sair-sala', { sala: salaAtual });
        }
        salaAtual = '';
        mostrarTela(telaCriacaoSala);
        socket.emit('solicitar-salas');
    });
});