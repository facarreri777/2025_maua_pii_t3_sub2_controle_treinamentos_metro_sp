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
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Sistema de Registro de Presença iniciado');
    inicializarDataAtual();
    await carregarTreinamentos();
    inicializarInstrutor();
    
    // Debug automático
    debugarDadosLocalStorage();

    // Quando mudar a data, recarregar presenças existentes
    const dataInput = document.getElementById('data-aula');
    if (dataInput) {
        dataInput.addEventListener('change', async () => {
            const treinamentoId = document.getElementById('treinamento-select').value;
            if (treinamentoId) {
                await carregarPresencasExistentes(treinamentoId);
                renderizarAlunos();
                atualizarResumo();
            }
        });
    }
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
async function carregarTreinamentos() {
    console.log('Carregando treinamentos...');
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch('http://localhost:3000/api/trainings', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            cache: 'no-store'
        });
        if (!resp.ok) throw new Error('API de treinamentos indisponível');
        const data = await resp.json();
        treinamentosDisponiveis = (data.trainings || []).map(t => ({
            id: t.id,
            titulo: t.titulo,
            data_inicio: t.data_inicio,
            data_fim: t.data_fim
        }));
    } catch (e) {
        console.warn('Falha ao buscar treinamentos do backend:', e.message);
        treinamentosDisponiveis = [];
    }
    preencherSelectTreinamentos();
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
async function carregarAlunos() {
    console.log('Carregando alunos...');
    const treinamentoId = document.getElementById('treinamento-select').value;
    
    if (!treinamentoId) {
        ocultarSecoes();
        return;
    }
    
    // Ajustar data, horário e instrutor conforme treinamento
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(`http://localhost:3000/api/trainings/${treinamentoId}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            cache: 'no-store'
        });
        if (resp.ok) {
            const data = await resp.json();
            const t = data.training;
            if (t) {
                // Data da aula = data_inicio do treinamento por padrão
                if (t.data_inicio) {
                    document.getElementById('data-aula').value = String(t.data_inicio);
                }
                // Limitar período permitido para seleção de data
                const dataInput = document.getElementById('data-aula');
                if (dataInput) {
                    if (t.data_inicio) dataInput.min = String(t.data_inicio);
                    if (t.data_fim) dataInput.max = String(t.data_fim);
                }
                // Horário da aula = horário_inicio do treinamento
                if (t.horario_inicio) {
                    document.getElementById('horario-aula').value = String(t.horario_inicio);
                }
                // Instrutor do treinamento
                if (t.instrutor) {
                    document.getElementById('instrutor').value = String(t.instrutor);
                }
            }
        }
    } catch (e) {
        console.warn('Falha ao ajustar campos a partir do treinamento:', e.message);
    }
    
    // Carregar alunos inscritos no treinamento selecionado (via backend)
    alunosInscritos = await carregarAlunosInscritos(treinamentoId);

    // Carregar presenças existentes para este treinamento e data atual do campo
    await carregarPresencasExistentes(treinamentoId);
    
    console.log(`${alunosInscritos.length} alunos carregados para o treinamento ${treinamentoId}`);
    renderizarAlunos();
    mostrarSecoes();
    atualizarResumo();
}

// ===== CARREGAR ALUNOS INSCRITOS =====
async function carregarAlunosInscritos(treinamentoId) {
    console.log('════════════════════════════════════════════════════════════');
    console.log('🔍 BUSCANDO ALUNOS INSCRITOS (Registro de Presença)');
    console.log('════════════════════════════════════════════════════════════');
    console.log('   Treinamento ID:', treinamentoId);
    
    // Buscar via backend
    const lista = [];
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(`http://localhost:3000/api/trainings/${treinamentoId}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            cache: 'no-store'
        });
        if (resp.ok) {
            const data = await resp.json();
            const alunos = data.training?.alunos || [];
            alunos.forEach(a => {
                lista.push({
                    id: a.id,
                    nome: a.nome,
                    rgMetro: a.rgMetro,
                    cargo: a.cargo || 'Não informado',
                    setor: a.setor || 'Não informado',
                    email: a.email || '',
                    telefone: a.telefone || ''
                });
            });
        }
    } catch (e) {
        console.warn('Falha ao buscar alunos inscritos do backend:', e.message);
    }
    return lista;
}

// Carrega presenças já salvas no banco e aplica no estado da tela
async function carregarPresencasExistentes(treinamentoId) {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(`http://localhost:3000/api/attendance/training/${treinamentoId}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            cache: 'no-store'
        });
        if (!resp.ok) return;
        const data = await resp.json();
        const presencas = data.presencas || [];

        // Filtro: considerar somente a data selecionada na tela
        const dataSelecionada = document.getElementById('data-aula').value;

        // Limpa estado anterior
        presencaAtual = {};

        presencas
            .filter(p => String(p.aula_data) === String(dataSelecionada))
            .forEach(p => {
                const keyBase = String(p.user_id);
                if (p.presente === 1) {
                    presencaAtual[keyBase] = true;
                    if (p.assinatura) presencaAtual[keyBase + '_assinatura'] = p.assinatura;
                } else {
                    presencaAtual[keyBase + '_ausente'] = true;
                }
                presencaAtual[keyBase + '_data'] = dataSelecionada;
                presencaAtual[keyBase + '_horario'] = (p.horario || document.getElementById('horario-aula').value);
            });
    } catch (e) {
        console.warn('Falha ao carregar presenças existentes:', e.message);
    }
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
    console.log('═══════════════════════════════════════════════════════');
    console.log('📝 RENDERIZANDO ALUNOS');
    console.log('═══════════════════════════════════════════════════════');
    
    const container = document.getElementById('alunos-container');
    
    if (!container) {
        console.error('Container alunos-container não encontrado!');
        return;
    }
    
    console.log('Total de alunosInscritos:', alunosInscritos ? alunosInscritos.length : 0);
    
    if (!alunosInscritos || alunosInscritos.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-user-slash"></i><p>Nenhum aluno encontrado</p></div>';
        console.log('⚠️ Nenhum aluno para renderizar');
        return;
    }
    
    console.log('Alunos a serem renderizados:');
    alunosInscritos.forEach((aluno, i) => {
        console.log(`  ${i + 1}. ID: ${aluno.id} (tipo: ${typeof aluno.id}) - Nome: ${aluno.nome}`);
    });
    
    const html = alunosInscritos.map(aluno => {
        const temAssinatura = presencaAtual[aluno.id + '_assinatura'];
        const marcadoAusente = presencaAtual[aluno.id + '_ausente'] === true;
        
        let status = 'aguardando';
        if (temAssinatura) {
            status = 'presente';
        } else if (marcadoAusente) {
            status = 'ausente';
        }
        
        return `
            <div class="aluno-item ${status}" data-aluno-id="${aluno.id}">
                <div class="aluno-info">
                    <div class="aluno-avatar">
                        <i class="fa-solid fa-user-circle"></i>
                    </div>
                    <div class="aluno-details">
                        <h3 class="aluno-nome">
                            <i class="fa-solid fa-user"></i>
                            ${aluno.nome}
                        </h3>
                        <div class="aluno-dados">
                            <span class="dado-item">
                                <i class="fa-solid fa-id-card"></i>
                                <strong>RG Metro:</strong> ${aluno.rgMetro}
                            </span>
                            <span class="dado-item">
                                <i class="fa-solid fa-briefcase"></i>
                                <strong>Cargo:</strong> ${aluno.cargo || 'Não informado'}
                            </span>
                            <span class="dado-item">
                                <i class="fa-solid fa-building"></i>
                                <strong>Setor:</strong> ${aluno.setor || 'Não informado'}
                            </span>
                            ${aluno.email ? `
                            <span class="dado-item">
                                <i class="fa-solid fa-envelope"></i>
                                <strong>Email:</strong> ${aluno.email}
                            </span>
                            ` : ''}
                            ${aluno.telefone ? `
                            <span class="dado-item">
                                <i class="fa-solid fa-phone"></i>
                                <strong>Telefone:</strong> ${aluno.telefone}
                            </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
                <div class="aluno-status">
                    <div class="status-indicator ${status}">
                        <i class="fa-solid fa-${temAssinatura ? 'check-circle' : marcadoAusente ? 'user-xmark' : 'clock'}"></i>
                        <span>${temAssinatura ? 'Presente (Assinado)' : marcadoAusente ? 'Ausente (Falta Registrada)' : 'Aguardando'}</span>
                    </div>
                    
                    ${temAssinatura ? `
                        <div class="assinatura-preview">
                            <p class="preview-label"><i class="fa-solid fa-signature"></i> Assinatura registrada:</p>
                            <img src="${temAssinatura}" alt="Assinatura" class="assinatura-img">
                        </div>
                        <button class="btn btn-success" onclick="abrirModalAssinatura('${aluno.id}')">
                            <i class="fa-solid fa-signature"></i> Ver/Editar Assinatura
                    </button>
                    ` : marcadoAusente ? `
                        <div class="falta-info">
                            <p><i class="fa-solid fa-exclamation-triangle"></i> Falta registrada</p>
                    </div>
                        <button class="btn btn-warning" onclick="desmarcarFalta('${aluno.id}')">
                            <i class="fa-solid fa-undo"></i> Remover Falta
                        </button>
                    ` : `
                        <div class="acoes-aluno">
                            <button class="btn btn-primary" onclick="abrirModalAssinatura('${aluno.id}')">
                                <i class="fa-solid fa-signature"></i> Assinar Presença
                            </button>
                            <button class="btn btn-danger" onclick="marcarFalta('${aluno.id}')">
                                <i class="fa-solid fa-user-xmark"></i> Marcar Falta
                            </button>
                        </div>
                    `}
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
    console.log('Alunos renderizados com sucesso');
}

// ===== MARCAR/DESMARCAR FALTA =====
function marcarFalta(alunoId) {
    console.log('Marcando falta para aluno:', alunoId);
    
    const aluno = alunosInscritos.find(a => 
        a.id === alunoId || 
        String(a.id) === String(alunoId) || 
        Number(a.id) === Number(alunoId)
    );
    
    if (!aluno) {
        console.error('Aluno não encontrado:', alunoId);
        alert('Erro: Aluno não encontrado!');
        return;
    }
    
    const confirmacao = confirm(
        `⚠️ Registrar Falta\n\n` +
        `Aluno: ${aluno.nome}\n` +
        `RG Metro: ${aluno.rgMetro}\n\n` +
        `Deseja registrar a ausência deste aluno?`
    );
    
    if (!confirmacao) {
        return;
    }
    
    // Marcar como ausente
    presencaAtual[alunoId + '_ausente'] = true;
    presencaAtual[alunoId + '_data'] = document.getElementById('data-aula').value;
    presencaAtual[alunoId + '_horario'] = document.getElementById('horario-aula').value;
    
    console.log('✅ Falta registrada para:', aluno.nome);
    
    // Atualizar visualização
    renderizarAlunos();
    atualizarResumo();
    
    mostrarNotificacao(
        'Falta Registrada',
        `A ausência de <strong>${aluno.nome}</strong> foi registrada com sucesso.`,
        'info',
        4000
    );
}

function desmarcarFalta(alunoId) {
    console.log('Removendo falta do aluno:', alunoId);
    
    const aluno = alunosInscritos.find(a => 
        a.id === alunoId || 
        String(a.id) === String(alunoId) || 
        Number(a.id) === Number(alunoId)
    );
    
    if (!aluno) {
        console.error('Aluno não encontrado:', alunoId);
        alert('Erro: Aluno não encontrado!');
        return;
    }
    
    // Remover marca de ausente
    delete presencaAtual[alunoId + '_ausente'];
    delete presencaAtual[alunoId + '_data'];
    delete presencaAtual[alunoId + '_horario'];
    
    console.log('✅ Falta removida de:', aluno.nome);
    
    // Atualizar visualização
    renderizarAlunos();
    atualizarResumo();
    
    mostrarNotificacao(
        'Falta Removida',
        `A falta de <strong>${aluno.nome}</strong> foi removida. O aluno voltou ao status "Aguardando".`,
        'success',
        4000
    );
}

// ===== ASSINATURA INDIVIDUAL - MODAL =====
function abrirModalAssinatura(alunoId) {
    console.log('Abrindo modal de assinatura para aluno:', alunoId);
    console.log('Tipo do alunoId recebido:', typeof alunoId);
    console.log('Alunos disponíveis:', alunosInscritos.map(a => ({ id: a.id, tipo: typeof a.id, nome: a.nome })));
    
    // Tentar encontrar aluno (convertendo tipos se necessário)
    const aluno = alunosInscritos.find(a => 
        a.id === alunoId || 
        String(a.id) === String(alunoId) || 
        Number(a.id) === Number(alunoId)
    );
    
    if (!aluno) {
        console.error('Aluno não encontrado:', alunoId);
        console.error('IDs disponíveis:', alunosInscritos.map(a => a.id));
        alert('Erro: Aluno não encontrado!');
        return;
    }
    
    console.log('Aluno encontrado:', aluno);
    alunoSelecionado = alunoId;
    
    // Preencher informações do aluno no modal
    document.getElementById('modal-nome-aluno').textContent = aluno.nome;
    document.getElementById('modal-rg-aluno').textContent = aluno.rgMetro;
    document.getElementById('modal-data-aula').textContent = formatarData(document.getElementById('data-aula').value);
    
    // Mostrar modal
    document.getElementById('modal-assinatura').style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevenir scroll da página
    
    // Inicializar canvas
    setTimeout(() => {
        inicializarCanvas();
        
        // Se já tem assinatura, carregar
        const assinaturaExistente = presencaAtual[alunoId + '_assinatura'];
        if (assinaturaExistente) {
            carregarAssinaturaExistente(assinaturaExistente);
        }
    }, 100);
}

function fecharModalAssinatura() {
    document.getElementById('modal-assinatura').style.display = 'none';
    document.body.style.overflow = 'auto'; // Restaurar scroll
    alunoSelecionado = null;
    limparAssinatura();
}

function formatarData(dataISO) {
    const data = new Date(dataISO + 'T00:00:00');
    return data.toLocaleDateString('pt-BR');
}

function carregarAssinaturaExistente(assinaturaBase64) {
    if (!canvas || !ctx) return;
    
    const img = new Image();
    img.onload = function() {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        document.getElementById('canvas-placeholder').style.display = 'none';
    };
    img.src = assinaturaBase64;
}

// ===== COMPATIBILIDADE (manter função antiga) =====
function abrirAssinatura(alunoId) {
    abrirModalAssinatura(alunoId);
}

function cancelarAssinatura() {
    fecharModalAssinatura();
}

// ===== INICIALIZAR CANVAS =====
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
    
    // Configurar estilo do canvas
    ctx.strokeStyle = '#002776';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Adicionar fundo branco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Restaurar cor da caneta
    ctx.strokeStyle = '#002776';
    
    // Limpar eventos anteriores
    const eventos = ['mousedown', 'mousemove', 'mouseup', 'mouseout', 'touchstart', 'touchmove', 'touchend'];
    eventos.forEach(evento => {
        const novoCampo = canvas.cloneNode(true);
    });
    
    // Adicionar eventos de mouse
    canvas.addEventListener('mousedown', iniciarDesenho);
    canvas.addEventListener('mousemove', desenhar);
    canvas.addEventListener('mouseup', pararDesenho);
    canvas.addEventListener('mouseout', pararDesenho);
    
    // Adicionar eventos de touch (mobile)
    canvas.addEventListener('touchstart', iniciarDesenhoTouch, { passive: false });
    canvas.addEventListener('touchmove', desenharTouch, { passive: false });
    canvas.addEventListener('touchend', pararDesenho);
    
    console.log('Canvas inicializado com sucesso');
}

function iniciarDesenho(e) {
    isDrawing = true;
    
    // Esconder placeholder
    const placeholder = document.getElementById('canvas-placeholder');
    if (placeholder) {
        placeholder.style.display = 'none';
    }
    
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
    isDrawing = true;
    
    // Esconder placeholder
    const placeholder = document.getElementById('canvas-placeholder');
    if (placeholder) {
        placeholder.style.display = 'none';
    }
    
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
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
    if (!ctx || !canvas) {
        console.warn('Canvas não inicializado');
        return;
    }
    
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Adicionar fundo branco novamente
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Restaurar cor da caneta
    ctx.strokeStyle = '#002776';
    
    // Mostrar placeholder
    const placeholder = document.getElementById('canvas-placeholder');
    if (placeholder) {
        placeholder.style.display = 'flex';
    }
    
    console.log('Assinatura limpa');
}

function confirmarAssinatura() {
    console.log('Confirmando assinatura...');
    
    if (!alunoSelecionado) {
        alert('Erro: Nenhum aluno selecionado!');
        return;
    }
    
    if (!canvas || !ctx) {
        alert('Erro: Canvas não inicializado!');
        return;
    }
    
    // Verificar se há desenho no canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let hasDrawing = false;
    
    // Verificar se há pixels não-brancos
    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];
        
        // Se encontrar um pixel que não seja branco (255,255,255) com alpha > 0
        if (a > 0 && (r !== 255 || g !== 255 || b !== 255)) {
            hasDrawing = true;
            break;
        }
    }
    
    if (!hasDrawing) {
        alert('Por favor, assine no quadro antes de confirmar!');
        return;
    }
    
    // Converter canvas para imagem base64
    const assinaturaBase64 = canvas.toDataURL('image/png');
    
    // Salvar assinatura
    presencaAtual[alunoSelecionado] = true;
    presencaAtual[alunoSelecionado + '_assinatura'] = assinaturaBase64;
    presencaAtual[alunoSelecionado + '_data'] = document.getElementById('data-aula').value;
    presencaAtual[alunoSelecionado + '_horario'] = document.getElementById('horario-aula').value;
    
    console.log('Assinatura salva para aluno:', alunoSelecionado);
    
    // Fechar modal
    fecharModalAssinatura();
    
    // Atualizar visualização
    renderizarAlunos();
    atualizarResumo();
    
    // Buscar nome do aluno
    const aluno = alunosInscritos.find(a => 
        String(a.id) === String(alunoSelecionado) ||
        a.id === alunoSelecionado
    );
    const nomeAluno = aluno ? aluno.nome : 'Aluno';
    
    // Mostrar notificação de sucesso
    mostrarNotificacao(
        '✅ Assinatura Registrada!',
        `A presença de <strong>${nomeAluno}</strong> foi registrada com assinatura digital.`,
        'success',
        5000
    );
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
    const ausentes = alunosInscritos.filter(aluno => presencaAtual[aluno.id + '_ausente'] === true).length;
    const aguardando = totalAlunos - presentes - ausentes;
    
    document.getElementById('total-alunos').textContent = totalAlunos;
    document.getElementById('total-presentes').textContent = presentes;
    document.getElementById('total-ausentes').textContent = ausentes;
    
    console.log('📊 Resumo atualizado:', { totalAlunos, presentes, ausentes, aguardando });
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

    // Garantir que a data esteja no período do treinamento (min/max definidos ao selecionar curso)
    const dataInput = document.getElementById('data-aula');
    if (dataInput && (dataInput.min && dataAula < dataInput.min || dataInput.max && dataAula > dataInput.max)) {
        mostrarNotificacao(`A data precisa estar entre ${new Date(dataInput.min).toLocaleDateString('pt-BR')} e ${new Date(dataInput.max).toLocaleDateString('pt-BR')}`, 'error');
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

// ===== NOTIFICAÇÕES TOAST =====
function mostrarNotificacao(titulo, mensagem = '', tipo = 'info', duracao = 5000) {
    // Se só passou 2 parâmetros (titulo e tipo), ajusta
    if (typeof mensagem === 'string' && ['success', 'error', 'info', 'warning'].includes(mensagem)) {
        tipo = mensagem;
        mensagem = '';
    }
    
    // Ícones por tipo
    const icones = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    };
    
    // Títulos padrão por tipo
    const titulosPadrao = {
        success: '✅ Sucesso!',
        error: '❌ Erro!',
        info: 'ℹ️ Informação',
        warning: '⚠️ Atenção'
    };
    
    // Se não passou mensagem, o título vira mensagem e usa título padrão
    if (!mensagem) {
        mensagem = titulo;
        titulo = titulosPadrao[tipo] || titulosPadrao.info;
    }
    
    // Criar toast
    const toast = document.createElement('div');
    toast.className = `toast-notification ${tipo}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fa-solid ${icones[tipo]}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${titulo}</div>
            ${mensagem ? `<div class="toast-message">${mensagem}</div>` : ''}
        </div>
        <button class="toast-close" onclick="fecharToast(this)">
            <i class="fa-solid fa-times"></i>
        </button>
        <div class="toast-progress">
            <div class="toast-progress-bar"></div>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Animar entrada
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Animar barra de progresso
    setTimeout(() => {
        const progressBar = toast.querySelector('.toast-progress-bar');
        if (progressBar) {
            progressBar.style.width = '0%';
        }
    }, 150);
    
    // Auto-remover
        setTimeout(() => {
        removerToast(toast);
    }, duracao);
    
    return toast;
}

function fecharToast(btn) {
    const toast = btn.closest('.toast-notification');
    removerToast(toast);
}

function removerToast(toast) {
    if (!toast) return;
    
    toast.classList.remove('show');
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 400);
}

// ===== SALVAR ASSINATURAS NO BANCO DE DADOS =====
async function salvarAssinaturasNoBanco() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('💾 SALVANDO ASSINATURAS NO BANCO DE DADOS');
    console.log('═══════════════════════════════════════════════════════════════');
    
    const treinamentoId = document.getElementById('treinamento-select').value;
    const dataAula = document.getElementById('data-aula').value;
    const horarioAula = document.getElementById('horario-aula').value;
    const instrutor = document.getElementById('instrutor').value;
    
    // Validações
    if (!treinamentoId) {
        alert('Erro: Selecione um treinamento!');
        return;
    }
    
    if (!dataAula) {
        alert('Erro: Informe a data da aula!');
        return;
    }
    
    if (!horarioAula) {
        alert('Erro: Informe o horário da aula!');
        return;
    }
    
    if (!instrutor) {
        alert('Erro: Informe o nome do instrutor!');
        return;
    }
    
    // Verificar se há pelo menos um registro (assinatura ou falta)
    const temRegistros = Object.keys(presencaAtual).some(key => 
        key.endsWith('_assinatura') || key.endsWith('_ausente')
    );
    
    if (!temRegistros) {
        alert('Atenção: Nenhum registro foi feito!\n\nPor favor, registre presenças (assinaturas) ou faltas antes de salvar.');
        return;
    }
    
    // Preparar dados
    const presencas = [];
    
    alunosInscritos.forEach(aluno => {
        const temAssinatura = presencaAtual[aluno.id + '_assinatura'];
        const marcadoAusente = presencaAtual[aluno.id + '_ausente'];
        
        if (temAssinatura) {
            // Aluno presente com assinatura
            presencas.push({
                alunoId: aluno.id,
                alunoNome: aluno.nome,
                alunoRgMetro: aluno.rgMetro,
                presente: true,
                assinatura: temAssinatura,
                data: dataAula,
                horario: horarioAula
            });
        } else if (marcadoAusente) {
            // Aluno ausente (falta registrada)
            presencas.push({
                alunoId: aluno.id,
                alunoNome: aluno.nome,
                alunoRgMetro: aluno.rgMetro,
                presente: false,
                assinatura: null,
                data: dataAula,
                horario: horarioAula
            });
        }
    });
    
    // Contar presentes e ausentes
    const qtdPresentes = presencas.filter(p => p.presente).length;
    const qtdAusentes = presencas.filter(p => !p.presente).length;
    const qtdSemRegistro = alunosInscritos.length - presencas.length;
    
    console.log('📊 Resumo do registro:');
    console.log('   Treinamento ID:', treinamentoId);
    console.log('   Data:', dataAula);
    console.log('   Horário:', horarioAula);
    console.log('   Instrutor:', instrutor);
    console.log('   Total de alunos:', alunosInscritos.length);
    console.log('   Presentes:', qtdPresentes);
    console.log('   Ausentes:', qtdAusentes);
    console.log('   Sem registro:', qtdSemRegistro);
    
    const confirmacao = confirm(
        `📋 Confirmar Salvamento\n\n` +
        `Treinamento: ${document.getElementById('treinamento-select').options[document.getElementById('treinamento-select').selectedIndex].text}\n` +
        `Data: ${new Date(dataAula + 'T00:00:00').toLocaleDateString('pt-BR')}\n` +
        `Horário: ${horarioAula}\n` +
        `Instrutor: ${instrutor}\n\n` +
        `📊 Resumo:\n` +
        `✅ Presentes: ${qtdPresentes}\n` +
        `❌ Ausentes: ${qtdAusentes}\n` +
        `⏳ Sem registro: ${qtdSemRegistro}\n` +
        `📝 Total: ${alunosInscritos.length} aluno(s)\n\n` +
        `Deseja salvar este registro de presença no banco de dados?`
    );
    
    if (!confirmacao) {
        console.log('❌ Salvamento cancelado pelo usuário');
        return;
    }
    
    // Desabilitar botão e mostrar loading
    const btnSalvar = document.getElementById('btn-salvar-assinaturas');
    const textoOriginal = btnSalvar.innerHTML;
    btnSalvar.disabled = true;
    btnSalvar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
    
    // Mostrar notificação de progresso
    const toastSalvando = mostrarNotificacao(
        '⏳ Salvando...',
        'Enviando dados para o banco de dados. Por favor, aguarde...',
        'info',
        30000
    );
    
    try {
        // Obter token
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Token de autenticação não encontrado. Faça login novamente.');
        }
        
        // Enviar para o backend
        const response = await fetch('http://localhost:3000/api/attendance/registrar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                treinamentoId,
                dataAula,
                horarioAula,
                instrutor,
                presencas
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.erro || 'Erro ao salvar registro de presença');
        }
        
        console.log('✅ Registro salvo com sucesso!');
        console.log('   Resposta do servidor:', data);
        
        // Fechar toast de salvando
        removerToast(toastSalvando);
        
        // Mostrar notificação de sucesso com detalhes
        mostrarNotificacao(
            '🎉 Registro Salvo com Sucesso!',
            `✅ ${qtdPresentes} aluno(s) presente(s)<br>` +
            `❌ ${qtdAusentes} aluno(s) ausente(s)<br>` +
            `📝 Total: ${qtdPresentes + qtdAusentes} registro(s)<br><br>` +
            `Os dados foram salvos permanentemente no banco de dados.`,
            'success',
            7000
        );
        
        // Limpar dados locais
        presencaAtual = {};
        
        // Recarregar lista
        setTimeout(() => {
            carregarAlunos();
            mostrarNotificacao(
                'Lista Atualizada',
                'Os dados foram recarregados. Você pode fazer um novo registro.',
                'info',
                3000
            );
        }, 2000);
        
    } catch (error) {
        console.error('❌ Erro ao salvar:', error);
        
        // Fechar toast de salvando
        removerToast(toastSalvando);
        
        // Mostrar notificação de erro
        mostrarNotificacao(
            '❌ Erro ao Salvar',
            `Não foi possível salvar o registro de presença:<br><br>` +
            `<strong>${error.message}</strong><br><br>` +
            `Verifique se o servidor está rodando e tente novamente.`,
            'error',
            8000
        );
    } finally {
        // Reabilitar botão
        btnSalvar.disabled = false;
        btnSalvar.innerHTML = textoOriginal;
    }
    
    console.log('═══════════════════════════════════════════════════════════════\n');
}

// ===== FUNÇÃO DE LOGOUT =====
function logout() {
    if (confirm('Tem certeza que deseja sair do sistema?')) {
        localStorage.removeItem('user');
        window.location.href = '../TelaLogin/tela_login.html';
    }
}

// ===== FUNÇÃO DE DEBUG =====
function debugarDadosLocalStorage() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔍 DEBUG - VERIFICANDO DADOS DO SISTEMA');
    console.log('═══════════════════════════════════════════════════════════════');
    
    // 1. Verificar colaboradores
    const colaboradores = JSON.parse(localStorage.getItem('colaboradoresCadastrados') || '[]');
    console.log('\n📋 COLABORADORES CADASTRADOS:', colaboradores.length);
    colaboradores.forEach((col, index) => {
        console.log(`  ${index + 1}. ID: ${col.id} | Nome: ${col.nome} | RG: ${col.rgMetro}`);
    });
    
    // 2. Verificar progresso dos alunos
    const progressoAluno = JSON.parse(localStorage.getItem('progressoAluno') || '{}');
    const alunosComProgresso = Object.keys(progressoAluno);
    console.log('\n📊 ALUNOS COM PROGRESSO:', alunosComProgresso.length);
    alunosComProgresso.forEach((alunoId) => {
        const progresso = progressoAluno[alunoId];
        const qtdTreinamentos = progresso.treinamentos?.length || 0;
        console.log(`  Aluno ID: ${alunoId} | Treinamentos: ${qtdTreinamentos}`);
        
        if (progresso.treinamentos && progresso.treinamentos.length > 0) {
            progresso.treinamentos.forEach((t, index) => {
                console.log(`    ${index + 1}. Treinamento ID: ${t.id} | Título: ${t.titulo}`);
            });
        }
    });
    
    // 3. Verificar treinamentos cadastrados
    const treinamentos = JSON.parse(localStorage.getItem('treinamentosCadastrados') || '[]');
    console.log('\n🎓 TREINAMENTOS CADASTRADOS:', treinamentos.length);
    treinamentos.forEach((t, index) => {
        console.log(`  ${index + 1}. ID: ${t.id} | Título: ${t.titulo}`);
    });
    
    // 4. Verificar usuário logado
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('\n👤 USUÁRIO LOGADO:');
    console.log('  ID:', user.id);
    console.log('  Nome:', user.nome);
    console.log('  Tipo:', user.tipoUsuario);
    
    // 5. TESTE: Simular busca de alunos para treinamento ID 1
    if (treinamentos.length > 0) {
        console.log('\n🧪 TESTE: Buscando alunos para o primeiro treinamento...');
        const primeiroTreinamento = treinamentos[0];
        console.log(`  Treinamento: ${primeiroTreinamento.titulo} (ID: ${primeiroTreinamento.id})`);
        
        let encontrados = 0;
        alunosComProgresso.forEach((alunoId) => {
            const progresso = progressoAluno[alunoId];
            if (progresso.treinamentos) {
                const temTreinamento = progresso.treinamentos.find(t => 
                    parseInt(t.id) === parseInt(primeiroTreinamento.id)
                );
                
                if (temTreinamento) {
                    const colaborador = colaboradores.find(c => c.id === parseInt(alunoId));
                    if (colaborador) {
                        console.log(`    ✅ Aluno encontrado: ${colaborador.nome} (ID: ${alunoId})`);
                        encontrados++;
                    } else {
                        console.log(`    ⚠️ Aluno ID ${alunoId} no progresso, mas não encontrado em colaboradores`);
                    }
                }
            }
        });
        
        console.log(`  📊 Total encontrados: ${encontrados} aluno(s)`);
    }
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ DEBUG CONCLUÍDO');
    console.log('═══════════════════════════════════════════════════════════════\n');
}

// Adicionar ao window para poder chamar do console
window.debugarDadosLocalStorage = debugarDadosLocalStorage;