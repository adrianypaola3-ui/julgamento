const socket = io();

let usuarioLogado = null;
let salaAtual = null;

// Funções de transição de telas
function mostrarLogin() {
    document.getElementById('tela-cadastro').style.display = 'none';
    document.getElementById('tela-login').style.display = 'block';
}

function mostrarCadastro() {
    document.getElementById('tela-login').style.display = 'none';
    document.getElementById('tela-cadastro').style.display = 'block';
}

// Evento de Cadastro
document.getElementById('btn-fazer-cadastro').addEventListener('click', async () => {
    const usuario = document.getElementById('cad-usuario').value.trim();
    const senha = document.getElementById('cad-senha').value.trim();

    if (!usuario || !senha) {
        alert('Preencha todos os campos!');
        return;
    }

    const res = await fetch('/api/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, senha })
    });
    const data = await res.json();
    alert(data.mensagem);
    if (data.sucesso) mostrarLogin();
});

// Evento de Login
document.getElementById('btn-fazer-login').addEventListener('click', async () => {
    const usuario = document.getElementById('login-usuario').value.trim();
    const senha = document.getElementById('login-senha').value.trim();

    if (!usuario || !senha) {
        alert('Preencha todos os campos!');
        return;
    }

    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, senha })
    });
    const data = await res.json();
    
    if (data.sucesso) {
        usuarioLogado = data.usuario;
        document.getElementById('span-usuario-logado').textContent = usuarioLogado;
        document.getElementById('tela-login').style.display = 'none';
        document.getElementById('tela-criacao-sala').style.display = 'block';
        carregarCasosAleatorios();
        socket.emit('solicitar-salas');
    } else {
        alert(data.mensagem);
    }
});

// Carregar Casos Aleatórios (2 opções)
async function carregarCasosAleatorios() {
    const container = document.getElementById('container-opcoes-temas');
    container.innerHTML = '<p style="color: var(--system-text); font-size: 0.85rem; text-align: center;">A carregar casos...</p>';

    try {
        const res = await fetch('/api/casos-aleatorios');
        const casos = await res.json();

        container.innerHTML = '';
        casos.forEach((caso, index) => {
            const div = document.createElement('div');
            div.style.cssText = "background: rgba(0,0,0,0.3); padding: 8px; border-radius: 4px; border: 1px solid var(--border-line);";
            div.innerHTML = `
                <label style="cursor: pointer; display: flex; align-items: flex-start; gap: 8px; color: #fff; font-size: 0.85rem;">
                    <input type="radio" name="caso-escolhido" value="${index}" data-tema="${caso.tema}" data-historinha="${caso.historinha}" ${index === 0 ? 'checked' : ''}>
                    <div>
                        <strong style="color: var(--accent-gold);">${caso.tema}</strong>
                        <p style="margin: 3px 0 0 0; color: #ccc; font-size: 0.78rem;">${caso.historinha}</p>
                    </div>
                </label>
            `;
            container.appendChild(div);
        });
    } catch (err) {
        container.innerHTML = '<p style="color: #ef4444; font-size: 0.85rem; text-align: center;">Erro ao carregar casos.</p>';
    }
}

document.getElementById('btn-ressortear').addEventListener('click', carregarCasosAleatorios);

// Entrar ou Criar Sala
document.getElementById('btn-entrar-sala').addEventListener('click', () => {
    const nomeSala = document.getElementById('input-nome-sala').value.trim();
    const maxJogadores = document.getElementById('select-max-jogadores').value;
    const radioSelecionado = document.querySelector('input[name="caso-escolhido"]:checked');

    if (!nomeSala) {
        alert('Digite o nome da sala!');
        return;
    }
    if (!radioSelecionado) {
        alert('Selecione um caso para julgar!');
        return;
    }

    const tema = radioSelecionado.getAttribute('data-tema');
    const historinha = radioSelecionado.getAttribute('data-historinha');
    salaAtual = nomeSala;

    socket.emit('entrar-sala', {
        nome: nomeSala,
        tema,
        historinha,
        maxJogadores,
        usuario: usuarioLogado
    });

    document.getElementById('tela-criacao-sala').style.display = 'none';
    document.getElementById('tela-sala').style.display = 'block';
    document.getElementById('span-tema-caso').textContent = tema;
    document.getElementById('span-historinha-texto').textContent = historinha;
});

// Receber Atribuição de Papel
socket.on('seu-papel', (dados) => {
    const meuPapelSpan = document.getElementById('meu-papel-span');
    meuPapelSpan.textContent = `Seu Papel: ${dados.papel}`;

    // Se for Juiz, mostra o painel de veredito após algum tempo ou simulação
    if (dados.papel === 'Juiz') {
        document.getElementById('painel-veredito').style.display = 'block';
    }
});

// Enviar Mensagem no Chat
document.getElementById('btn-enviar-chat').addEventListener('click', () => {
    const input = document.getElementById('input-chat');
    const texto = input.value.trim();
    if (!texto || !salaAtual) return;

    socket.emit('enviar-mensagem', {
        sala: salaAtual,
        texto
    });
    input.value = '';
});

// Receber Mensagens no Chat
socket.on('receber-mensagem', (dados) => {
    const caixa = document.getElementById('caixa-mensagens');
    const div = document.createElement('div');
    div.className = 'message';
    div.style.fontSize = '0.85rem';
    div.innerHTML = `${dados.remetenteFormatado}: ${dados.texto}`;
    caixa.appendChild(div);
    caixa.scrollTop = caixa.scrollHeight;
});

// Listagem de Salas Ativas
socket.on('listar-salas', (salas) => {
    const lista = document.getElementById('lista-salas');
    if (salas.length === 0) {
        lista.innerHTML = '<p style="text-align: center; color: var(--system-text); font-size: 0.9rem; padding: 10px;">Nenhuma sala ativa no momento.</p>';
        return;
    }

    lista.innerHTML = '';
    salas.forEach(s => {
        const div = document.createElement('div');
        div.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 6px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.85rem;";
        div.innerHTML = `
            <span><strong>${s.nome}</strong> (${s.tema}) - ${s.jogadoresAtuais}/${s.maxJogadores} jog.</span>
            <button type="button" style="padding: 2px 8px; font-size: 0.75rem; background: var(--accent-gold); border: none; border-radius: 3px; cursor: pointer;" onclick="entrarSalaDireto('${s.nome}', '${s.tema}', '${s.historinha}', ${s.maxJogadores})">Entrar</button>
        `;
        lista.appendChild(div);
    });
});

function entrarSalaDireto(nome, tema, historinha, maxJogadores) {
    document.getElementById('input-nome-sala').value = nome;
    salaAtual = nome;
    socket.emit('entrar-sala', {
        nome,
        tema,
        historinha,
        maxJogadores,
        usuario: usuarioLogado
    });
    document.getElementById('tela-criacao-sala').style.display = 'none';
    document.getElementById('tela-sala').style.display = 'block';
    document.getElementById('span-tema-caso').textContent = tema;
    document.getElementById('span-historinha-texto').textContent = historinha;
}

// Emitir Veredito (Juiz)
document.getElementById('btn-emitir-veredito').addEventListener('click', () => {
    const input = document.getElementById('input-veredito');
    const texto = input.value.trim();
    if (!texto || !salaAtual) return;

    socket.emit('emitir-veredito', {
        sala: salaAtual,
        texto
    });
    input.value = '';
});

// Sair / Encerrar Caso
document.getElementById('btn-encerrar-caso').addEventListener('click', () => {
    if (salaAtual) {
        socket.emit('encerrar-caso', { sala: salaAtual });
    }
    document.getElementById('tela-sala').style.display = 'none';
    document.getElementById('tela-criacao-sala').style.display = 'block';
    salaAtual = null;
});