// ===== SISTEMA DE REGISTRO DE PRESENÇA COM ASSINATURA DIGITAL =====

// Variáveis globais
let treinamentosDisponiveis = [];
let alunosInscritos = [];
let presencaAtual = {};
let alunoSelecionado = null;
let canvas = null;
let ctx = null;
let isDrawing = false;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema de Registro de Presença iniciado');
    inicializarDataAtual();
    carregarTreinamentos();
    inicializarInstrutor();
});

// ===== INICIALIZAÇÃO =====
function inicializarDataAtual() {
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('data-aula').value = hoje;
}

function inicializarInstrutor() {
    const usuario = JSON.parse(localStorage.getItem('user') || '{}');
    if (usuario.nome) {
        document.getElementById('instrutor').value = usuario.nome;
    }
}

// ===== CARREGAR DADOS =====
function carregarTreinamentos() {
    console.log('Carregando treinamentos...');
    const treinamentos = localStorage.getItem('treinamentosCadastrados');
    
    if (treinamentos) {
        try {
            treinamentosDisponiveis = JSON.parse(treinamentos);
            console.log(`${treinamentosDisponiveis.length} treinamentos encontrados`);
            preencherSelectTreinamentos();
        } catch (error) {
            console.error('Erro ao carregar treinamentos:', error);
            treinamentosDisponiveis = [];
        }
    } else {
        console.warn('Nenhum treinamento encontrado');
        treinamentosDisponiveis = [];
        preencherSelectTreinamentos();
    }
}

function preencherSelectTreinamentos() {
    const select = document.getElementById('treinamento-select');
    
    if (!select) {
        console.error('Elemento treinamento-select não encontrado!');
        return;
    }
    
    select.innerHTML = '<option value="">Selecione um treinamento</option>';
    
    if (treinamentosDisponiveis.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Nenhum treinamento cadastrado';
        option.disabled = true;
        select.appendChild(option);
        return;
    }
    
    treinamentosDisponiveis.forEach(treinamento => {
        const option = document.createElement('option');
        option.value = treinamento.id;
        option.textContent = treinamento.titulo;
        select.appendChild(option);
    });
    
    console.log(`${treinamentosDisponiveis.length} treinamentos carregados`);
}

// ===== CARREGAR ALUNOS =====
function carregarAlunos() {
    console.log('Carregando alunos...');
    const treinamentoId = document.getElementById('treinamento-select').value;
    
    if (!treinamentoId) {
        ocultarSecoes();
        return;
    }
    
    // Carregar alunos inscritos no treinamento selecionado
    alunosInscritos = carregarAlunosInscritos(treinamentoId);
    
    console.log(`${alunosInscritos.length} alunos carregados para o treinamento ${treinamentoId}`);
    renderizarAlunos();
    mostrarSecoes();
    atualizarResumo();
}

// ===== CARREGAR ALUNOS INSCRITOS =====
function carregarAlunosInscritos(treinamentoId) {
    // Buscar inscrições do treinamento no localStorage
    const inscricoes = JSON.parse(localStorage.getItem('inscricoesTreinamentos') || '[]');
    const inscricoesTreinamento = inscricoes.filter(inscricao => 
        inscricao.treinamentoId == treinamentoId && inscricao.status === 'inscrito'
    );
    
    // Buscar dados dos alunos cadastrados
    const colaboradores = JSON.parse(localStorage.getItem('colaboradoresCadastrados') || '[]');
    
    // Combinar dados das inscrições com dados dos colaboradores
    const alunosInscritos = inscricoesTreinamento.map(inscricao => {
        const colaborador = colaboradores.find(col => col.id == inscricao.alunoId);
        if (colaborador) {
            return {
                id: colaborador.id,
                nome: colaborador.nome,
                rgMetro: colaborador.rgMetro,
                cargo: colaborador.cargo,
                setor: colaborador.setor,
                dataInscricao: inscricao.dataInscricao
            };
        }
        return null;
    }).filter(aluno => aluno !== null);
    
    return alunosInscritos;
}

function ocultarSecoes() {
    document.getElementById('lista-alunos-card').style.display = 'none';
    document.getElementById('resumo-card').style.display = 'none';
}

function mostrarSecoes() {
    document.getElementById('lista-alunos-card').style.display = 'block';
    document.getElementById('resumo-card').style.display = 'block';
}

// ===== RENDERIZAR ALUNOS =====
function renderizarAlunos() {
    const container = document.getElementById('alunos-container');
    
    if (!container) {
        console.error('Container alunos-container não encontrado!');
        return;
    }
    
    if (!alunosInscritos || alunosInscritos.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-user-slash"></i><p>Nenhum aluno encontrado</p></div>';
        return;
    }
    
    const html = alunosInscritos.map(aluno => {
        const temAssinatura = presencaAtual[aluno.id + '_assinatura'];
        const status = temAssinatura ? 'presente' : 'ausente';
        
        return `
            <div class="aluno-item ${status}" data-aluno-id="${aluno.id}">
                <div class="aluno-info">
                    <div class="aluno-avatar">
                        <i class="fa-solid fa-user"></i>
                    </div>
                    <div class="aluno-details">
                        <h3>${aluno.nome}</h3>
                        <p><strong>RG Metro:</strong> ${aluno.rgMetro}</p>
                        <p><strong>Cargo:</strong> ${aluno.cargo}</p>
                        <p><strong>Setor:</strong> ${aluno.setor}</p>
                    </div>
                </div>
                <div class="aluno-status">
                    <div class="status-indicator ${status}">
                        <i class="fa-solid fa-${temAssinatura ? 'check-circle' : 'times-circle'}"></i>
                        <span>${temAssinatura ? 'Presente' : 'Aguardando Assinatura'}</span>
                    </div>
                    <button class="btn ${temAssinatura ? 'btn-success' : 'btn-primary'}" onclick="abrirAssinatura(${aluno.id})">
                        <i class="fa-solid fa-signature"></i> 
                        ${temAssinatura ? 'Reassinar' : 'Assinar Presença'}
                    </button>
                    <div class="assinatura-preview" id="assinatura_${aluno.id}">
                        ${temAssinatura ? `<img src="${temAssinatura}" style="max-width: 100px; max-height: 50px; border: 1px solid #ddd; border-radius: 4px;">` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
    console.log('Alunos renderizados com sucesso');
}

// ===== ASSINATURA INDIVIDUAL =====
function abrirAssinatura(alunoId) {
    console.log('Abrindo assinatura para aluno:', alunoId);
    
    const aluno = alunosInscritos.find(a => a.id === alunoId);
    if (!aluno) {
        console.error('Aluno não encontrado:', alunoId);
        return;
    }
    
    alunoSelecionado = alunoId;
    
    // Preencher informações do aluno
    document.getElementById('nome-aluno-assinatura').textContent = aluno.nome;
    document.getElementById('rg-aluno-assinatura').textContent = aluno.rgMetro;
    
    // Mostrar seção de assinatura
    const assinaturaCard = document.getElementById('assinatura-card');
    assinaturaCard.style.display = 'block';
    
    // Rolar a tela para a seção de assinatura
    setTimeout(() => {
        assinaturaCard.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
        
        // Adicionar destaque visual temporário
        assinaturaCard.style.border = '3px solid #28a745';
        assinaturaCard.style.boxShadow = '0 0 20px rgba(40, 167, 69, 0.3)';
        
        // Remover destaque após 2 segundos
        setTimeout(() => {
            assinaturaCard.style.border = '';
            assinaturaCard.style.boxShadow = '';
        }, 2000);
    }, 100);
    
    // Inicializar canvas
    setTimeout(() => {
        inicializarCanvas();
        limparAssinatura();
    }, 300);
}

function cancelarAssinatura() {
    document.getElementById('assinatura-card').style.display = 'none';
    alunoSelecionado = null;
    
    // Rolar de volta para a lista de alunos
    setTimeout(() => {
        const listaAlunos = document.getElementById('lista-alunos-card');
        listaAlunos.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }, 100);
}

function inicializarCanvas() {
    console.log('Inicializando canvas...');
    canvas = document.getElementById('signature-canvas');
    
    if (!canvas) {
        console.error('Canvas não encontrado!');
        return;
    }
    
    ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Contexto 2D não criado!');
        return;
    }
    
    // Configurar canvas
    ctx.strokeStyle = '#002776';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Limpar eventos anteriores
    canvas.removeEventListener('mousedown', iniciarDesenho);
    canvas.removeEventListener('mousemove', desenhar);
    canvas.removeEventListener('mouseup', pararDesenho);
    canvas.removeEventListener('mouseout', pararDesenho);
    canvas.removeEventListener('touchstart', iniciarDesenhoTouch);
    canvas.removeEventListener('touchmove', desenharTouch);
    canvas.removeEventListener('touchend', pararDesenho);
    
    // Adicionar eventos
    canvas.addEventListener('mousedown', iniciarDesenho);
    canvas.addEventListener('mousemove', desenhar);
    canvas.addEventListener('mouseup', pararDesenho);
    canvas.addEventListener('mouseout', pararDesenho);
    canvas.addEventListener('touchstart', iniciarDesenhoTouch);
    canvas.addEventListener('touchmove', desenharTouch);
    canvas.addEventListener('touchend', pararDesenho);
    
    console.log('Canvas inicializado com sucesso');
}

function iniciarDesenho(e) {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function desenhar(e) {
    if (!isDrawing) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
}

function pararDesenho() {
    isDrawing = false;
}

function iniciarDesenhoTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    isDrawing = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function desenharTouch(e) {
    e.preventDefault();
    if (!isDrawing) return;
    
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
}

function limparAssinatura() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function salvarAssinatura() {
    if (!alunoSelecionado) {
        mostrarNotificacao('Nenhum aluno selecionado!', 'error');
        return;
    }
    
    if (!canvas || !ctx) {
        mostrarNotificacao('Canvas não inicializado!', 'error');
        return;
    }
    
    // Verificar se há desenho
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let hasDrawing = false;
    
    for (let i = 0; i < data.length; i += 4) {
        if (data[i] !== 0 || data[i + 1] !== 0 || data[i + 2] !== 0 || data[i + 3] !== 0) {
            hasDrawing = true;
            break;
        }
    }
    
    if (!hasDrawing) {
        mostrarNotificacao('Por favor, desenhe sua assinatura antes de salvar!', 'error');
        return;
    }
    
    const dataURL = canvas.toDataURL();
    
    // Salvar assinatura e marcar presença
    presencaAtual[alunoSelecionado + '_assinatura'] = dataURL;
    presencaAtual[alunoSelecionado] = 'presente';
    
    // Atualizar interface
    renderizarAlunos();
    atualizarResumo();
    
    // Fechar seção de assinatura
    document.getElementById('assinatura-card').style.display = 'none';
    alunoSelecionado = null;
    
    // Rolar de volta para a lista de alunos
    setTimeout(() => {
        const listaAlunos = document.getElementById('lista-alunos-card');
        listaAlunos.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }, 100);
    
    mostrarNotificacao('Assinatura salva com sucesso!', 'success');
}


// ===== AÇÕES EM LOTE =====
function marcarTodosPresentes() {
    alunosInscritos.forEach(aluno => {
        presencaAtual[aluno.id] = 'presente';
        // Gerar assinatura simulada
        presencaAtual[aluno.id + '_assinatura'] = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    });
    renderizarAlunos();
    atualizarResumo();
    mostrarNotificacao('Todos os alunos marcados como presentes!', 'success');
}

function marcarTodosAusentes() {
    alunosInscritos.forEach(aluno => {
        presencaAtual[aluno.id] = 'ausente';
        delete presencaAtual[aluno.id + '_assinatura'];
    });
    renderizarAlunos();
    atualizarResumo();
    mostrarNotificacao('Todos os alunos marcados como ausentes!', 'success');
}

// ===== RESUMO E ESTATÍSTICAS =====
function atualizarResumo() {
    const totalAlunos = alunosInscritos.length;
    const presentes = alunosInscritos.filter(aluno => presencaAtual[aluno.id + '_assinatura']).length;
    const ausentes = totalAlunos - presentes;
    
    document.getElementById('total-alunos').textContent = totalAlunos;
    document.getElementById('total-presentes').textContent = presentes;
    document.getElementById('total-ausentes').textContent = ausentes;
}

// ===== SALVAR PRESENÇA =====
function salvarPresenca() {
    const treinamentoId = document.getElementById('treinamento-select').value;
    const dataAula = document.getElementById('data-aula').value;
    const horarioAula = document.getElementById('horario-aula').value;
    const instrutor = document.getElementById('instrutor').value;
    
    if (!treinamentoId) {
        mostrarNotificacao('Selecione um treinamento!', 'error');
        return;
    }
    
    if (!dataAula || !horarioAula) {
        mostrarNotificacao('Preencha a data e horário!', 'error');
        return;
    }
    
    if (!instrutor) {
        mostrarNotificacao('Preencha o nome do instrutor!', 'error');
        return;
    }
    
    // Filtrar apenas alunos que assinaram
    const alunosPresentes = alunosInscritos.filter(aluno => presencaAtual[aluno.id + '_assinatura']);
    
    const registroPresenca = {
        id: Date.now(),
        treinamentoId: parseInt(treinamentoId),
        dataAula: dataAula,
        horarioAula: horarioAula,
        instrutor: instrutor,
        alunos: alunosPresentes.map(aluno => ({
            id: aluno.id,
            nome: aluno.nome,
            rgMetro: aluno.rgMetro,
            cargo: aluno.cargo,
            setor: aluno.setor,
            presenca: 'presente',
            assinatura: presencaAtual[aluno.id + '_assinatura']
        })),
        totalAlunos: alunosInscritos.length,
        totalPresentes: alunosPresentes.length,
        dataRegistro: new Date().toISOString()
    };
    
    // Salvar no localStorage
    const registros = JSON.parse(localStorage.getItem('registrosPresenca') || '[]');
    registros.push(registroPresenca);
    localStorage.setItem('registrosPresenca', JSON.stringify(registros));
    
    mostrarNotificacao('Registro de presença salvo com sucesso!', 'success');
    limparFormulario();
}

function limparFormulario() {
    document.getElementById('treinamento-select').value = '';
    document.getElementById('data-aula').value = new Date().toISOString().split('T')[0];
    document.getElementById('horario-aula').value = '09:00';
    presencaAtual = {};
    alunosInscritos = [];
    linkAssinatura = '';
    qrCodeGerado = false;
    
    // Limpar QR Code
    document.getElementById('qr-code').innerHTML = `
        <i class="fa-solid fa-qrcode"></i>
        <p>Clique em "Gerar QR Code" para criar o código de acesso</p>
    `;
    
    document.getElementById('link-assinatura').value = '';
    
    ocultarSecoes();
}

// ===== IMPRIMIR LISTA =====
function imprimirLista() {
    const treinamento = treinamentosDisponiveis.find(t => t.id == document.getElementById('treinamento-select').value);
    const dataAula = document.getElementById('data-aula').value;
    const horarioAula = document.getElementById('horario-aula').value;
    const instrutor = document.getElementById('instrutor').value;
    
    if (!treinamento) {
        mostrarNotificacao('Selecione um treinamento!', 'error');
        return;
    }
    
    const conteudo = `
        <html>
        <head>
            <title>Lista de Presença - ${treinamento.titulo}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .info { margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                th { background-color: #f0f0f0; }
                .assinatura { width: 200px; height: 50px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Lista de Presença</h1>
                <h2>${treinamento.titulo}</h2>
            </div>
            <div class="info">
                <p><strong>Data:</strong> ${new Date(dataAula).toLocaleDateString('pt-BR')}</p>
                <p><strong>Horário:</strong> ${horarioAula}</p>
                <p><strong>Instrutor:</strong> ${instrutor}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>RG Metro</th>
                        <th>Cargo</th>
                        <th>Setor</th>
                        <th>Presença</th>
                        <th class="assinatura">Assinatura</th>
                    </tr>
                </thead>
                <tbody>
                    ${alunosInscritos.map(aluno => `
                        <tr>
                            <td>${aluno.nome}</td>
                            <td>${aluno.rgMetro}</td>
                            <td>${aluno.cargo}</td>
                            <td>${aluno.setor}</td>
                            <td>${presencaAtual[aluno.id + '_assinatura'] ? '✓' : '✗'}</td>
                            <td class="assinatura"></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </body>
        </html>
    `;
    
    const janela = window.open('', '_blank');
    janela.document.write(conteudo);
    janela.document.close();
    janela.print();
}

// ===== NOTIFICAÇÕES =====
function mostrarNotificacao(mensagem, tipo = 'info') {
    const notificacao = document.createElement('div');
    notificacao.className = `notificacao notificacao-${tipo}`;
    notificacao.innerHTML = `
        <i class="fa-solid fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${mensagem}</span>
    `;
    
    document.body.appendChild(notificacao);
    
    setTimeout(() => {
        notificacao.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notificacao.classList.remove('show');
        setTimeout(() => {
            if (notificacao.parentNode) {
                notificacao.parentNode.removeChild(notificacao);
            }
        }, 300);
    }, 3000);
}

// ===== FUNÇÃO DE LOGOUT =====
function logout() {
    if (confirm('Tem certeza que deseja sair do sistema?')) {
        localStorage.removeItem('user');
        window.location.href = '../TelaLogin/tela_login.html';
    }
}