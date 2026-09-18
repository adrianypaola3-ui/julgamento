const socket = io();

let usuarioLogado = '';
let meuPapel = '';
let salaAtual = '';
let temasSorteadosAtuais = [];

function mostrarCadastro() {
    const telaLogin = document.getElementById('tela-login');
    const telaCad = document.getElementById('tela-cadastro');
    
    telaLogin.classList.remove('active');
    telaLogin.style.display = 'none';
    
    telaCad.style.display = 'block';
    setTimeout(() => telaCad.classList.add('active'), 10);
}

function mostrarLogin() {
    const telaLogin = document.getElementById('tela-login');
    const telaCad = document.getElementById('tela-cadastro');
    
    telaCad.classList.remove('active');
    telaCad.style.display = 'none';
    
    telaLogin.style.display = 'block';
    setTimeout(() => telaLogin.classList.add('active'), 10);
}

function mostrarTelaCriacaoSala() {
    const telaLogin = document.getElementById('tela-login');
    const telaCriacao = document.getElementById('tela-criacao-sala');

    if (telaLogin) {
        telaLogin.classList.remove('active');
        telaLogin.style.display = 'none';
    }
    
    if (telaCriacao) {
        telaCriacao.style.display = 'block';
        setTimeout(() => telaCriacao.classList.add('active'), 10);
    }

    socket.emit('solicitar-temas-sorteio');
}

document.addEventListener('DOMContentLoaded', () => {
    const telaLogin = document.getElementById('tela-login');
    if (telaLogin) {
        telaLogin.style.display = 'block';
        telaLogin.classList.add('active');
    }

    const btnCadastro = document.getElementById('btn-fazer-cadastro');
    if (btnCadastro) btnCadastro.addEventListener('click', realizarCadastro);

    const btnLogin = document.getElementById('btn-fazer-login');
    if (btnLogin) btnLogin.addEventListener('click', realizarLogin);

    const btnRessortear = document.getElementById('btn-ressortear');
    if (btnRessortear) {
        btnRessortear.addEventListener('click', () => {
            socket.emit('solicitar-temas-sorteio');
        });
    }

    const btnEntrarSala = document.getElementById('btn-entrar-sala');
    if (btnEntrarSala) {
        btnEntrarSala.addEventListener('click', () => {
            entrarNaSala();
        });
    }

    const btnEnviarChat = document.getElementById('btn-enviar-chat');
    if (btnEnviarChat) btnEnviarChat.addEventListener('click', enviarMensagemChat);

    const btnDepoimento = document.getElementById('btn-enviar-depoimento');
    if (btnDepoimento) {
        btnDepoimento.addEventListener('click', () => {
            if (!btnDepoimento.disabled) {
                enviarDepoimento();
            }
        });
    }

    const btnVeredito = document.getElementById('btn-emitir-veredito');
    if (btnVeredito) {
        btnVeredito.addEventListener('click', () => {
            const inputVeredito = document.getElementById('input-veredito');
            const textoVeredito = inputVeredito ? inputVeredito.value.trim() : '';
            if (!textoVeredito) {
                alert('Digite o veredicto antes de emitir!');
                return;
            }
            socket.emit('emitir-veredito', { sala: salaAtual, texto: textoVeredito });
            inputVeredito.value = '';
        });
    }

    const btnEncerrarCaso = document.getElementById('btn-encerrar-caso');
    if (btnEncerrarCaso) {
        btnEncerrarCaso.addEventListener('click', () => {
            if (confirm('Deseja realmente encerrar este caso?')) {
                socket.emit('encerrar-caso', { sala: salaAtual });
            }
        });
    }
});

async function realizarCadastro() {
    const usuarioInput = document.getElementById('cad-usuario');
    const senhaInput = document.getElementById('cad-senha');
    
    const usuario = usuarioInput ? usuarioInput.value.trim() : '';
    const senha = senhaInput ? senhaInput.value.trim() : '';

    if (!usuario || !senha) {
        alert('Por favor, preencha o usuário e a senha para se cadastrar!');
        return;
    }

    try {
        const response = await fetch('/api/cadastrar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, senha })
        });
        const resultado = await response.json();
        alert(resultado.mensagem);
        if (resultado.sucesso) mostrarLogin();
    } catch (err) {
        alert('Erro de conexão com o servidor ao tentar cadastrar.');
    }
}

async function realizarLogin() {
    const usuarioInput = document.getElementById('login-usuario');
    const senhaInput = document.getElementById('login-senha');
    
    const usuario = usuarioInput ? usuarioInput.value.trim() : '';
    const senha = senhaInput ? senhaInput.value.trim() : '';

    if (!usuario || !senha) {
        alert('Por favor, preencha o usuário e a senha para entrar!');
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, senha })
        });
        const resultado = await response.json();

        if (resultado.sucesso) {
            usuarioLogado = resultado.usuario;
            const spanUsuario = document.getElementById('span-usuario-logado');
            if (spanUsuario) spanUsuario.innerText = usuarioLogado;
            
            mostrarTelaCriacaoSala();
        } else {
            alert(resultado.mensagem || 'Usuário ou senha incorretos.');
        }
    } catch (err) {
        alert('Erro de conexão com o servidor ao tentar fazer login.');
    }
}

socket.on('receber-temas-sorteio', (temas) => {
    temasSorteadosAtuais = temas;
    const container = document.getElementById('container-opcoes-temas');
    if (!container) return;

    container.innerHTML = '';
    temas.forEach((item, index) => {
        const divOpcao = document.createElement('label');
        divOpcao.style.display = 'flex';
        divOpcao.style.alignItems = 'flex-start';
        divOpcao.style.gap = '10px';
        divOpcao.style.cursor = 'pointer';
        divOpcao.style.padding = '8px';
        divOpcao.style.background = 'rgba(0,0,0,0.2)';
        divOpcao.style.borderRadius = '6px';
        divOpcao.style.border = '1px solid var(--border-line)';

        divOpcao.innerHTML = `
            <input type="radio" name="tema-escolhido" value="${index}" ${index === 0 ? 'checked' : ''} style="margin-top: 4px;">
            <div>
                <strong style="color: var(--accent-gold); font-size: 0.95rem; display: block;">${item.titulo}</strong>
                <span style="color: #bbb; font-size: 0.82rem; display: block; margin-top: 2px;">${item.historinha}</span>
            </div>
        `;
        container.appendChild(divOpcao);
    });
});

function entrarNaSala(nomeSalaEspecifico = null, temaEspecifico = null, historinhaEspecifica = null) {
    const inputSala = document.getElementById('input-nome-sala');
    const selectMax = document.getElementById('select-max-jogadores');
    
    const nomeSala = nomeSalaEspecifico || (inputSala ? inputSala.value.trim() : '');
    const maxJogadores = selectMax ? selectMax.value : 9;
    
    if (!nomeSala) {
        alert('Digite o nome da sala!');
        return;
    }

    let temaCaso = temaEspecifico;
    let historinhaCaso = historinhaEspecifica;

    if (!temaCaso && temasSorteadosAtuais.length > 0) {
        const radios = document.getElementsByName('tema-escolhido');
        let selecionadoIndex = 0;
        for (let r of radios) {
            if (r.checked) {
                selecionadoIndex = parseInt(r.value);
                break;
            }
        }
        temaCaso = temasSorteadosAtuais[selecionadoIndex].titulo;
        historinhaCaso = temasSorteadosAtuais[selecionadoIndex].historinha;
    }

    salaAtual = nomeSala;
    socket.emit('entrar-sala', { 
        nome: nomeSala, 
        tema: temaCaso || 'Julgamento Geral', 
        historinha: historinhaCaso || 'Fatos do caso.',
        maxJogadores: maxJogadores 
    });

    const telaCriacao = document.getElementById('tela-criacao-sala');
    const telaSala = document.getElementById('tela-sala');

    telaCriacao.classList.remove('active');
    telaCriacao.style.display = 'none';
    
    telaSala.style.display = 'block';
    setTimeout(() => telaSala.classList.add('active'), 10);
}

function enviarMensagemChat() {
    const textoInput = document.getElementById('input-chat');
    const texto = textoInput ? textoInput.value.trim() : '';
    if (!texto) return;

    socket.emit('enviar-mensagem', {
        sala: salaAtual,
        texto: texto,
        papelRemetente: meuPapel,
        icone: 'avatar_padrao.png'
    });

    textoInput.value = '';
}

function enviarDepoimento() {
    const inputDepoimento = document.getElementById('input-depoimento');
    const textoResposta = inputDepoimento ? inputDepoimento.value.trim() : '';
    
    if (!textoResposta) return;

    const mensagemCompleta = `🗣️ [Depoimento de ${meuPapel}]: "${textoResposta}"`;

    socket.emit('enviar-mensagem', {
        sala: salaAtual,
        texto: mensagemCompleta,
        papelRemetente: meuPapel,
        icone: 'avatar_padrao.png'
    });

    if (inputDepoimento) {
        inputDepoimento.value = '';
        inputDepoimento.disabled = true;
    }

    const btnDepoimento = document.getElementById('btn-enviar-depoimento');
    if (btnDepoimento) {
        btnDepoimento.disabled = true;
        btnDepoimento.style.opacity = '0.5';
        btnDepoimento.style.cursor = 'not-allowed';
    }

    const aviso = document.getElementById('status-testemunha-aviso');
    if (aviso) {
        aviso.innerText = '🔒 Depoimento enviado! Aguarde nova pergunta...';
        aviso.style.color = '#e11d48';
    }
}

socket.on('listar-salas', (salas) => {
    const listaDiv = document.getElementById('lista-salas');
    if (!listaDiv) return;

    if (salas.length === 0) {
        listaDiv.innerHTML = `<p style="text-align: center; color: var(--system-text); font-size: 0.9rem; padding: 10px;">Nenhuma sala ativa no momento.</p>`;
        return;
    }

    listaDiv.innerHTML = '';
    salas.forEach(sala => {
        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.justify = 'space-between';
        item.style.alignItems = 'center';
        item.style.padding = '10px';
        item.style.marginBottom = '8px';
        item.style.background = 'rgba(0,0,0,0.3)';
        item.style.borderRadius = '6px';
        item.style.border = '1px solid var(--border-line)';

        item.innerHTML = `
            <div>
                <strong style="color: #fff; font-size: 1rem;">${sala.nome}</strong>
                <span style="display: block; font-size: 0.82rem; color: var(--accent-gold);">Tema: ${sala.tema || 'Geral'}</span>
                <span style="display: block; font-size: 0.8rem; color: var(--system-text);">Jogadores: ${sala.jogadoresAtuais}/${sala.maxJogadores}</span>
            </div>
            <button class="btn-entrar-direto" style="width: auto; margin-bottom: 0; padding: 8px 14px; font-size: 0.85rem;">Entrar</button>
        `;

        item.querySelector('.btn-entrar-direto').addEventListener('click', () => {
            entrarNaSala(sala.nome, sala.tema, sala.historinha || 'Fatos do caso.');
        });

        listaDiv.appendChild(item);
    });
});

socket.on('seu-papel', (dados) => {
    meuPapel = dados.papel;
    const badge = document.getElementById('meu-papel-span');
    if (badge) badge.innerText = `${dados.papel} - Nome: ${dados.nomeReal}`;

    const spanTema = document.getElementById('span-tema-caso');
    if (spanTema && dados.tema) {
        spanTema.innerText = dados.tema;
    }

    const spanHistorinhaTexto = document.getElementById('span-historinha-texto');
    if (spanHistorinhaTexto && dados.historinha) {
        spanHistorinhaTexto.innerText = dados.historinha;
    }

    ['painel-veredito', 'painel-testemunha', 'painel-advogado'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('escondido');
    });

    if (meuPapel === 'Juiz') {
        const el = document.getElementById('painel-veredito');
        if (el) el.classList.remove('escondido');
    } else if (meuPapel === 'Testemunha 1' || meuPapel === 'Testemunha 2') {
        const el = document.getElementById('painel-testemunha');
        if (el) el.classList.remove('escondido');
    } else {
        const el = document.getElementById('painel-advogado');
        if (el) el.classList.remove('escondido');
    }
});

socket.on('receber-mensagem', (dados) => {
    const caixa = document.getElementById('caixa-mensagens');
    if (!caixa) return;

    const divMsg = document.createElement('div');
    divMsg.className = 'message';

    let remetenteVisual = dados.papelRemetente;

    if (dados.papelRemetente === 'Juiz') {
        divMsg.classList.add('msg-juiz');
    } else if (dados.papelRemetente.includes('Acusação')) {
        divMsg.classList.add('msg-acusacao');
    } else {
        divMsg.classList.add('msg-defesa');
    }

    divMsg.innerHTML = `<strong>${remetenteVisual}:</strong> ${dados.texto}`;
    caixa.appendChild(divMsg);
    caixa.scrollTop = caixa.scrollHeight;

    if ((meuPapel === 'Testemunha 1' || meuPapel === 'Testemunha 2') && dados.texto.includes(meuPapel)) {
        const inputDepoimento = document.getElementById('input-depoimento');
        const btnDepoimento = document.getElementById('btn-enviar-depoimento');
        const aviso = document.getElementById('status-testemunha-aviso');

        if (inputDepoimento) inputDepoimento.disabled = false;
        if (btnDepoimento) {
            btnDepoimento.disabled = false;
            btnDepoimento.style.opacity = '1';
            btnDepoimento.style.cursor = 'pointer';
        }
        if (aviso) {
            aviso.innerText = '✅ Você foi chamada! Digite sua resposta abaixo.';
            aviso.style.color = '#22c55e';
        }
    }
});

socket.on('erro-sala', (mensagem) => {
    alert(mensagem);
    location.reload();
});