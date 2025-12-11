// ===== JAVASCRIPT DA PÁGINA DE REGISTRO DE PRESENÇA (SIMPLIFICADO) =====

// VLibras Widget
new window.VLibras.Widget('https://vlibras.gov.br/app');

// Variáveis globais
let treinamentosDisponiveis = [];
let alunosInscritos = [];
let presencaAtual = {};
let alunoSelecionado = null;
let canvas = null;
let ctx = null;
let isDrawing = false;
let assinaturasOnline = [];
let linkAssinatura = '';

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    inicializarDataAtual();
    carregarTreinamentos();
    inicializarCanvas();
});

// ===== INICIALIZAÇÃO =====
function inicializarDataAtual() {
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('data-aula').value = hoje;
}

function inicializarCanvas() {
    canvas = document.getElementById('signature-canvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
        configurarCanvas();
    }
}

function configurarCanvas() {
    if (!ctx) return;
    
    ctx.strokeStyle = '#002776';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Eventos do canvas
    canvas.addEventListener('mousedown', iniciarDesenho);
    canvas.addEventListener('mousemove', desenhar);
    canvas.addEventListener('mouseup', pararDesenho);
    canvas.addEventListener('mouseout', pararDesenho);
    
    // Eventos touch para dispositivos móveis
    canvas.addEventListener('touchstart', iniciarDesenhoTouch);
    canvas.addEventListener('touchmove', desenharTouch);
    canvas.addEventListener('touchend', pararDesenho);
}

// ===== CARREGAR DADOS =====
function carregarTreinamentos() {
    console.log('Carregando treinamentos...');
    const treinamentos = localStorage.getItem('treinamentosCadastrados');
    
    if (treinamentos) {
        try {
            treinamentosDisponiveis = JSON.parse(treinamentos);
            console.log(`${treinamentosDisponiveis.length} treinamentos encontrados no localStorage`);
            preencherSelectTreinamentos();
        } catch (error) {
            console.error('Erro ao fazer parse dos treinamentos:', error);
            treinamentosDisponiveis = [];
        }
    } else {
        console.warn('Nenhum treinamento encontrado no localStorage');
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
        console.warn('Nenhum treinamento disponível encontrado');
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
    
    console.log(`${treinamentosDisponiveis.length} treinamentos carregados no select`);
}

// ===== CARREGAR ALUNOS =====
function carregarAlunos() {
    const treinamentoId = document.getElementById('treinamento-select').value;
    
    if (!treinamentoId) {
        document.getElementById('lista-alunos-card').style.display = 'none';
        document.getElementById('resumo-card').style.display = 'none';
        return;
    }
    
    // Carregar alunos inscritos no treinamento
    const treinamento = treinamentosDisponiveis.find(t => t.id == treinamentoId);
    if (treinamento && treinamento.alunosInscritos) {
        alunosInscritos = treinamento.alunosInscritos;
    } else {
        // Dados de exemplo se não houver alunos cadastrados
        alunosInscritos = [
            {
                id: 1,
                nome: 'João Silva',
                rgMetro: '123456789',
                cargo: 'Operador',
                setor: 'Operacional'
            },
            {
                id: 2,
                nome: 'Maria Santos',
                rgMetro: '987654321',
                cargo: 'Supervisora',
                setor: 'Administrativo'
            },
            {
                id: 3,
                nome: 'Pedro Costa',
                rgMetro: '456789123',
                cargo: 'Técnico',
                setor: 'Manutenção'
            }
        ];
    }
    
    renderizarAlunos();
    document.getElementById('lista-alunos-card').style.display = 'block';
    document.getElementById('resumo-card').style.display = 'block';
    atualizarResumo();
}

function renderizarAlunos() {
    const container = document.getElementById('lista-alunos');
    if (!container) return;
    
    container.innerHTML = alunosInscritos.map(aluno => {
        const temAssinatura = presencaAtual[aluno.id + '_assinatura'];
        const statusPresenca = presencaAtual[aluno.id];
        
        return `
            <div class="aluno-item ${temAssinatura ? 'assinado' : 'nao-assinado'}" data-aluno-id="${aluno.id}">
                <div class="aluno-info">
                    <div class="aluno-details">
                        <h4>${aluno.nome}</h4>
                        <p><strong>RG Metro:</strong> ${aluno.rgMetro}</p>
                        <p><strong>Cargo:</strong> ${aluno.cargo}</p>
                        <p><strong>Setor:</strong> ${aluno.setor}</p>
                    </div>
                    <div class="aluno-status">
                        <div class="status-indicator ${temAssinatura ? 'presente' : 'ausente'}">
                            <i class="fa-solid fa-${temAssinatura ? 'check-circle' : 'times-circle'}"></i>
                            <span>${temAssinatura ? 'Presente' : 'Aguardando Assinatura'}</span>
                        </div>
                    </div>
                </div>
                <div class="assinatura-section">
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
}

function marcarPresenca(alunoId, status) {
    presencaAtual[alunoId] = status;
    atualizarResumo();
}

function abrirAssinatura(alunoId) {
    alunoSelecionado = alunoId;
    document.getElementById('assinatura-modal').style.display = 'block';
    limparCanvas();
}

function fecharAssinatura() {
    document.getElementById('assinatura-modal').style.display = 'none';
    alunoSelecionado = null;
}

function salvarAssinatura() {
    if (!alunoSelecionado) return;
    
    const dataURL = canvas.toDataURL();
    
    // Salvar assinatura E marcar presença automaticamente
    presencaAtual[alunoSelecionado + '_assinatura'] = dataURL;
    presencaAtual[alunoSelecionado] = 'presente'; // Marcar como presente automaticamente
    
    // Mostrar preview da assinatura
    const preview = document.getElementById(`assinatura_${alunoSelecionado}`);
    preview.innerHTML = `<img src="${dataURL}" style="max-width: 100px; max-height: 50px; border: 1px solid #ddd; border-radius: 4px;">`;
    
    // Atualizar a interface
    renderizarAlunos();
    atualizarResumo();
    
    fecharAssinatura();
    
    // Mostrar confirmação
    alert('Assinatura salva! Presença confirmada automaticamente.');
}

function limparCanvas() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ===== CANVAS DE ASSINATURA =====
function iniciarDesenho(e) {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function desenhar(e) {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
}

function pararDesenho() {
    isDrawing = false;
}

function iniciarDesenhoTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

function desenharTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

// ===== RESUMO E ESTATÍSTICAS =====
function atualizarResumo() {
    const totalAlunos = alunosInscritos.length;
    
    // Contar apenas alunos que assinaram (presença confirmada)
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
    
    if (!treinamentoId) {
        alert('Por favor, selecione um treinamento.');
        return;
    }
    
    if (!dataAula || !horarioAula) {
        alert('Por favor, preencha a data e horário da aula.');
        return;
    }
    
    // Filtrar apenas alunos que assinaram (presença confirmada)
    const alunosPresentes = alunosInscritos.filter(aluno => presencaAtual[aluno.id + '_assinatura']);
    
    const registroPresenca = {
        id: Date.now(),
        treinamentoId: parseInt(treinamentoId),
        dataAula: dataAula,
        horarioAula: horarioAula,
        alunos: alunosPresentes.map(aluno => ({
            id: aluno.id,
            nome: aluno.nome,
            rgMetro: aluno.rgMetro,
            presenca: 'presente',
            assinatura: presencaAtual[aluno.id + '_assinatura']
        })),
        totalAlunos: alunosInscritos.length,
        totalPresentes: alunosPresentes.length,
        dataRegistro: new Date().toISOString(),
        instrutor: JSON.parse(localStorage.getItem('user') || '{}').nome || 'Instrutor'
    };
    
    // Salvar no localStorage
    const registros = JSON.parse(localStorage.getItem('registrosPresenca') || '[]');
    registros.push(registroPresenca);
    localStorage.setItem('registrosPresenca', JSON.stringify(registros));
    
    alert('Registro de presença salvo com sucesso!');
    limparFormulario();
}

function limparFormulario() {
    document.getElementById('treinamento-select').value = '';
    document.getElementById('data-aula').value = new Date().toISOString().split('T')[0];
    document.getElementById('horario-aula').value = '09:00';
    presencaAtual = {};
    alunosInscritos = [];
    document.getElementById('lista-alunos-card').style.display = 'none';
    document.getElementById('resumo-card').style.display = 'none';
}

// ===== IMPRIMIR LISTA =====
function imprimirLista() {
    const treinamento = treinamentosDisponiveis.find(t => t.id == document.getElementById('treinamento-select').value);
    const dataAula = document.getElementById('data-aula').value;
    const horarioAula = document.getElementById('horario-aula').value;
    
    if (!treinamento) {
        alert('Por favor, selecione um treinamento.');
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
                .assinatura { width: 200px; }
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
                            <td>${presencaAtual[aluno.id] === 'presente' ? '✓' : '✗'}</td>
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
