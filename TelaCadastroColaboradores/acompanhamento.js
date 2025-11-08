// ===== DADOS =====
let treinamentosCadastrados = [];
let treinamentoAtualModal = null;
let filtroStatusAtual = 'todos';
let filtroCategoriaAtual = 'todas';

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔍 Iniciando carregamento de treinamentos...');
    await carregarTreinamentos();
    console.log('✅ Treinamentos carregados:', treinamentosCadastrados.length);
    renderizarTreinamentos();
    await atualizarEstatisticas();
    
    // Debug automático
    console.log('🔍 Para ver diagnóstico completo, digite no console: debugarDadosLocalStorage()');
    
    // Sincronização entre abas/telas
    window.addEventListener('storage', async (e) => {
        if (e.key === 'sync/trainings') {
            console.log('🔄 Sincronizando treinamentos...');
            await carregarTreinamentos();
            console.log('✅ Treinamentos sincronizados:', treinamentosCadastrados.length);
            renderizarTreinamentos();
            await atualizarEstatisticas();
        }
    });
});

// ===== CARREGAR DADOS =====
async function carregarTreinamentos() {
    // Buscar somente do backend (fonte de verdade)
    try {
        console.log('📡 Buscando treinamentos do backend...');
        const token = localStorage.getItem('token');
        console.log('🔑 Token presente?', !!token);
        const resp = await fetch('http://localhost:3000/api/trainings', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            cache: 'no-store'
        });
        console.log('📥 Resposta do backend:', resp.status, resp.statusText);
        if (resp.ok) {
            const data = await resp.json();
            console.log('📊 Dados recebidos:', data);
            const apiTrainings = data.trainings || [];
            console.log('📚 Total de treinamentos:', apiTrainings.length);
            treinamentosCadastrados = apiTrainings.map(t => ({
                id: t.id,
                titulo: t.titulo,
                descricao: t.descricao,
                categoria: t.categoria,
                duracao_horas: t.duracao_horas,
                instrutor: t.instrutor,
                vagas_total: t.vagas_total,
                vagas_ocupadas: t.vagas_ocupadas || 0,
                data_inicio: t.data_inicio,
                data_fim: t.data_fim,
                horario_inicio: t.horario_inicio,
                horario_fim: t.horario_fim,
                local: t.local,
                modalidade: 'presencial',
                status: t.status,
                ativo: t.status !== 'cancelado'
            }));
            console.log('✅ Treinamentos mapeados:', treinamentosCadastrados.length);
            return;
        }
        console.error('❌ Resposta não OK do backend:', resp.status, resp.statusText);
        throw new Error('API indisponível');
    } catch (e) {
        console.error('❌ Falha ao obter treinamentos do backend:', e.message);
        // Não usar mais localStorage como fallback para evitar "fantasmas".
        treinamentosCadastrados = [];
    }
}

// ===== DETERMINAR STATUS DO TREINAMENTO =====
function parseDateOnly(yyyyMmDd) {
    if (!yyyyMmDd || typeof yyyyMmDd !== 'string') return null;
    const [y, m, d] = yyyyMmDd.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function determinarStatus(treinamento) {
    // Se o treinamento tem um status definido, normaliza e usa ele
    if (treinamento.status) {
        const statusNormalizado = treinamento.status.toLowerCase().replace('-', '_').replace(' ', '_');
        // Se é 'planejado' mas já está dentro do período, considera 'em_andamento'
        if (statusNormalizado === 'planejado') {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const dataInicio = parseDateOnly(treinamento.data_inicio);
            const dataFim = parseDateOnly(treinamento.data_fim);
            if (dataInicio && dataFim) {
                if (hoje >= dataInicio && hoje <= dataFim) {
                    return 'em_andamento';
                }
            }
        }
        return statusNormalizado;
    }
    
    // Caso contrário, determina baseado nas datas
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const dataInicio = parseDateOnly(treinamento.data_inicio) || new Date(treinamento.data_inicio);
    dataInicio.setHours(0, 0, 0, 0);
    
    const dataFim = parseDateOnly(treinamento.data_fim) || new Date(treinamento.data_fim);
    dataFim.setHours(0, 0, 0, 0);
    
    if (hoje < dataInicio) {
        return 'planejado';
    } else if (hoje >= dataInicio && hoje <= dataFim) {
        return 'em_andamento';
    } else {
        return 'concluido';
    }
}

// ===== FILTRAR POR STATUS =====
function filtrarPorStatus(status) {
    filtroStatusAtual = status;
    
    // Atualizar botões ativos
    document.querySelectorAll('.filtro-chip').forEach(chip => {
        chip.classList.remove('active');
    });
    document.querySelector(`[data-status="${status}"]`).classList.add('active');
    
    // Renderizar com filtro
    renderizarTreinamentos();
}

// ===== FILTRAR POR CATEGORIA =====
function filtrarPorCategoria(categoria) {
    filtroCategoriaAtual = categoria; // 'todas' ou valor da coluna categoria
    document.querySelectorAll('.filtro-chip-categoria').forEach(chip => chip.classList.remove('active'));
    const btn = document.querySelector(`[data-categoria="${categoria}"]`);
    if (btn) btn.classList.add('active');
    renderizarTreinamentos();
}

// ===== RENDERIZAR TREINAMENTOS =====
function renderizarTreinamentos() {
    const container = document.getElementById('treinamentosList');
    const emptyState = document.getElementById('emptyMessage');
    
    console.log('🎨 Renderizando treinamentos...');
    console.log('📊 Total de treinamentos:', treinamentosCadastrados.length);
    console.log('🔍 Filtro ativo - Status:', filtroStatusAtual, 'Categoria:', filtroCategoriaAtual);
    console.log('📋 Treinamentos antes do filtro:', treinamentosCadastrados.map(t => ({ id: t.id, titulo: t.titulo, status: t.status })));
    
    // Filtrar por status e categoria
    let treinamentosFiltrados = treinamentosCadastrados;
    if (filtroStatusAtual !== 'todos') {
        treinamentosFiltrados = treinamentosCadastrados.filter(t => {
            const status = t.status || determinarStatus(t);
            const match = status === filtroStatusAtual;
            console.log(`   Treinamento "${t.titulo}": status=${status}, filtro=${filtroStatusAtual}, match=${match}`);
            return match;
        });
    }
    if (filtroCategoriaAtual !== 'todas') {
        treinamentosFiltrados = treinamentosFiltrados.filter(t => (t.categoria || '').toLowerCase() === filtroCategoriaAtual);
    }
    
    if (treinamentosFiltrados.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        if (filtroStatusAtual !== 'todos') {
            emptyState.querySelector('p').textContent = `Nenhum treinamento ${filtroStatusAtual.replace('_', ' ')} encontrado.`;
        }
        return;
    }
    
    container.style.display = 'block';
    emptyState.style.display = 'none';
    
    container.innerHTML = treinamentosFiltrados.map(treinamento => {
        const status = treinamento.status || determinarStatus(treinamento);
        
        // Mapear status para texto e classe CSS
        const statusMap = {
            'concluido': { text: 'Concluído', class: 'status-concluido', icon: 'check-circle' },
            'em_andamento': { text: 'Em Andamento', class: 'status-em-andamento', icon: 'clock' },
            'planejado': { text: 'Planejado', class: 'status-planejado', icon: 'calendar' }
        };
        
        const statusInfo = statusMap[status] || statusMap['planejado'];
        
        return `
            <div class="treinamento-item">
                <div class="treinamento-header">
                    <h3 class="treinamento-title">${treinamento.titulo}</h3>
                    <span class="treinamento-status-badge ${statusInfo.class}">
                        <i class="fa-solid fa-${statusInfo.icon}"></i>
                        ${statusInfo.text}
                    </span>
                </div>
                
                <div class="treinamento-details">
                    <div class="detail-item">
                        <span class="detail-label">Categoria</span>
                        <span class="detail-value">${treinamento.categoria}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Duração</span>
                        <span class="detail-value">${treinamento.duracao_horas}h</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Instrutor</span>
                        <span class="detail-value">${treinamento.instrutor}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Vagas</span>
                        <span class="detail-value">${treinamento.vagas_total}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Período</span>
                        <span class="detail-value">${formatarData(treinamento.data_inicio)} - ${formatarData(treinamento.data_fim)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Modalidade</span>
                        <span class="detail-value">${treinamento.modalidade}</span>
                    </div>
                </div>
                
                <div class="treinamento-actions">
                    <button class="btn-action btn-view" onclick="visualizarTreinamento(${treinamento.id})">
                        <i class="fa-solid fa-eye"></i> Visualizar Detalhes
                    </button>
                    ${status !== 'concluido' ? `
                    <button class="btn-action btn-finish" onclick="concluirTreinamento(${treinamento.id}, '${treinamento.titulo.replace(/['"\\]/g, '')}')">
                        <i class=\"fa-solid fa-flag-checkered\"></i> Finalizar Curso
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Finalizar curso diretamente da tela de acompanhamento
async function concluirTreinamento(id, titulo) {
    if (!confirm(`Deseja concluir o treinamento "${titulo}"?\n\nAlunos com presença ≥ 75% receberão certificado automaticamente.`)) return;
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Token não encontrado. Faça login novamente.');
        const resp = await fetch(`http://localhost:3000/api/trainings/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: 'concluido' })
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || 'Erro ao concluir treinamento');
        await carregarTreinamentos();
        renderizarTreinamentos();
        await atualizarEstatisticas();
        try { localStorage.setItem('sync/trainings', String(Date.now())); } catch (_) {}
        alert('Treinamento concluído! Certificados emitidos para alunos com ≥ 75% de presença.');
    } catch (e) {
        alert('Erro: ' + e.message);
    }
}

// ===== ATUALIZAR ESTATÍSTICAS =====
async function atualizarEstatisticas() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch('http://localhost:3000/api/trainings/stats/dashboard', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            cache: 'no-store'
        });
        if (resp.ok) {
            const data = await resp.json();
            const s = data.stats || {};
            document.getElementById('total-treinamentos').textContent = s.totalTreinamentos ?? 0;
            document.getElementById('concluidos').textContent = s.concluidos ?? 0;
            document.getElementById('em-andamento').textContent = s.emAndamento ?? 0;
            // Removido cartão de planejados
            return;
        }
        throw new Error('Falha ao buscar estatísticas');
    } catch (e) {
        // Fallback com base nos dados locais
        const total = treinamentosCadastrados.length;
        const concluidos = treinamentosCadastrados.filter(t => determinarStatus(t) === 'concluido').length;
        const emAndamento = treinamentosCadastrados.filter(t => determinarStatus(t) === 'em_andamento').length;
        const planejados = treinamentosCadastrados.filter(t => determinarStatus(t) === 'planejado').length;
        document.getElementById('total-treinamentos').textContent = total;
        document.getElementById('concluidos').textContent = concluidos;
        document.getElementById('em-andamento').textContent = emAndamento;
        // Removido cartão de planejados
    }
}

// ===== FUNÇÕES AUXILIARES =====
function formatarData(data) {
    if (!data) return '';
    const parsed = parseDateOnly(data);
    if (parsed) return parsed.toLocaleDateString('pt-BR');
    const fallback = new Date(data);
    if (!isNaN(fallback)) return fallback.toLocaleDateString('pt-BR');
    const [y, m, d] = String(data).split('-');
    if (y && m && d) return `${d.padStart(2,'0')}/${m.padStart(2,'0')}/${y}`;
    return String(data);
}

async function visualizarTreinamento(id) {
    console.log('════════════════════════════════════════════════════════════');
    console.log('📊 VISUALIZANDO DETALHES DO TREINAMENTO');
    console.log('════════════════════════════════════════════════════════════');
    
    const treinamento = treinamentosCadastrados.find(t => t.id === id);
    if (!treinamento) {
        console.error('❌ Treinamento não encontrado com ID:', id);
        return;
    }
    
    console.log('✅ Treinamento encontrado:', treinamento.titulo);
    treinamentoAtualModal = treinamento;
    
    // Buscar dados relacionados do backend
    console.log('\n🔍 Buscando dados relacionados do backend...');
    let alunosInscritos = [];
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(`http://localhost:3000/api/trainings/${id}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            cache: 'no-store'
        });
        if (resp.ok) {
            const data = await resp.json();
            alunosInscritos = data.training?.alunos || [];
        }
    } catch (e) {
        console.warn('Falha ao buscar alunos inscritos via API:', e.message);
    }
    
    // Buscar aulas e presenças do backend
    let aulas = [];
    let presencas = {};
    try {
        const token = localStorage.getItem('token');
        const [rAulas, rPres] = await Promise.all([
            fetch(`http://localhost:3000/api/attendance/classes/${id}`, { headers: token ? { 'Authorization': `Bearer ${token}` } : {}, cache: 'no-store' }),
            fetch(`http://localhost:3000/api/attendance/training/${id}`, { headers: token ? { 'Authorization': `Bearer ${token}` } : {}, cache: 'no-store' })
        ]);
        if (rAulas.ok) {
            const dA = await rAulas.json();
            aulas = dA.aulas || [];
        }
        if (rPres.ok) {
            const dP = await rPres.json();
            // Monta mapa: class_id -> lista de presenças
            (dP.presencas || []).forEach(p => {
                if (!presencas[p.class_id]) presencas[p.class_id] = [];
                presencas[p.class_id].push({ alunoId: p.user_id, presente: p.presente === 1 });
            });
        }
    } catch (e) {
        console.warn('Falha ao buscar aulas/presenças:', e.message);
    }
    
    console.log('\n📋 RESUMO:');
    console.log('  - Alunos inscritos:', alunosInscritos.length);
    console.log('  - Aulas realizadas:', aulas.length);
    console.log('  - Registros de presença:', Object.keys(presencas).length);
    console.log('════════════════════════════════════════════════════════════\n');
    
    // Renderizar modal
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <!-- Informações do Treinamento -->
        <div class="info-section">
            <h3 class="section-title">
                <i class="fa-solid fa-graduation-cap"></i> Informações Gerais
            </h3>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Título:</span>
                    <span class="info-value">${treinamento.titulo}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Categoria:</span>
                    <span class="info-value">${treinamento.categoria}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Duração:</span>
                    <span class="info-value">${treinamento.duracao_horas} horas</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Instrutor:</span>
                    <span class="info-value">${treinamento.instrutor}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Período:</span>
                    <span class="info-value">${formatarData(treinamento.data_inicio)} - ${formatarData(treinamento.data_fim)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Modalidade:</span>
                    <span class="info-value">${treinamento.modalidade}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Local:</span>
                    <span class="info-value">${treinamento.local || 'Não especificado'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Vagas:</span>
                    <span class="info-value">${alunosInscritos.length} / ${treinamento.vagas_total}</span>
                </div>
            </div>
            ${treinamento.descricao ? `
                <div class="info-item full-width">
                    <span class="info-label">Descrição:</span>
                    <span class="info-value">${treinamento.descricao}</span>
                </div>
            ` : ''}
        </div>
        
        <!-- Alunos Inscritos -->
        <div class="info-section">
            <h3 class="section-title">
                <i class="fa-solid fa-users"></i> Alunos Inscritos (${alunosInscritos.length})
            </h3>
            ${renderizarAlunosInscritos(alunosInscritos, presencas, aulas)}
        </div>
        
        <!-- Aulas Realizadas -->
        <div class="info-section">
            <h3 class="section-title">
                <i class="fa-solid fa-calendar-check"></i> Aulas Realizadas (${aulas.length})
            </h3>
            ${renderizarAulas(aulas, alunosInscritos, presencas)}
        </div>
        
        <!-- Relatório de Presença -->
        <div class="info-section">
            <h3 class="section-title">
                <i class="fa-solid fa-chart-pie"></i> Relatório de Presença
            </h3>
            ${renderizarRelatorioPresenca(alunosInscritos, aulas, presencas)}
        </div>
    `;
    
    // Mostrar modal
    document.getElementById('modalVisualizacao').style.display = 'flex';
}


// ===== LOGOUT =====
function logout() {
    if (confirm('Tem certeza que deseja sair do sistema?')) {
        localStorage.removeItem('user');
        window.location.href = '../TelaLogin/tela_login.html';
    }
}

// ===== BUSCAR DADOS RELACIONADOS =====

// Função auxiliar para buscar dados completos de um aluno de qualquer fonte
function buscarDadosAluno(alunoId) {
    // Buscar em colaboradores cadastrados
    const colaboradores = JSON.parse(localStorage.getItem('colaboradoresCadastrados') || '[]');
    let dados = colaboradores.find(c => String(c.id) === String(alunoId) || parseInt(c.id) === parseInt(alunoId));
    
    if (dados) {
        console.log('   ✅ Dados encontrados em colaboradoresCadastrados');
        return {
            id: dados.id,
            nome: dados.nome,
            rgMetro: dados.rgMetro,
            setor: dados.setor || 'Não especificado',
            cargo: dados.cargo || 'Não especificado'
        };
    }
    
    // Buscar em alunos_cadastrados (sistema de login)
    const alunos = JSON.parse(localStorage.getItem('alunos_cadastrados') || '[]');
    dados = alunos.find(a => String(a.id) === String(alunoId) || parseInt(a.id) === parseInt(alunoId));
    
    if (dados) {
        console.log('   ✅ Dados encontrados em alunos_cadastrados');
        return {
            id: dados.id,
            nome: dados.nome,
            rgMetro: dados.rgMetro,
            setor: dados.setor || 'Não especificado',
            cargo: dados.cargo || 'Não especificado'
        };
    }
    
    // Buscar em user atual (se for o mesmo ID)
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (String(user.id) === String(alunoId)) {
        console.log('   ✅ Dados encontrados em localStorage.user (usuário atual)');
        return {
            id: user.id,
            nome: user.nome || 'Usuário',
            rgMetro: user.rgMetro || user.usuario || 'N/A',
            setor: user.setor || 'Não especificado',
            cargo: user.cargo || 'Não especificado'
        };
    }
    
    // Se não encontrar em nenhum lugar, retornar dados mínimos
    console.warn('   ⚠️ Dados não encontrados em nenhuma fonte, usando ID como nome');
    return {
        id: alunoId,
        nome: `Aluno ID ${alunoId}`,
        rgMetro: 'N/A',
        setor: 'Não especificado',
        cargo: 'Não especificado'
    };
}

// Buscar alunos inscritos em um treinamento
function buscarAlunosInscritos(treinamentoId) {
    console.log('════════════════════════════════════════════════════════════');
    console.log('🔍 BUSCANDO ALUNOS INSCRITOS');
    console.log('════════════════════════════════════════════════════════════');
    console.log('   Treinamento ID:', treinamentoId);
    
    const progressoAluno = JSON.parse(localStorage.getItem('progressoAluno') || '{}');
    const colaboradores = JSON.parse(localStorage.getItem('colaboradoresCadastrados') || '[]');
    const alunosInscritos = [];
    
    console.log('📊 Dados disponíveis:');
    console.log('   Total de alunos no progressoAluno:', Object.keys(progressoAluno).length);
    console.log('   IDs no progressoAluno:', Object.keys(progressoAluno));
    console.log('   Total de colaboradores cadastrados:', colaboradores.length);
    console.log('   IDs de colaboradores:', colaboradores.map(c => c.id));
    
    // Para cada aluno no progresso
    Object.keys(progressoAluno).forEach(alunoId => {
        const progresso = progressoAluno[alunoId];
        
        console.log(`\n👤 Verificando aluno ID: ${alunoId}`);
        
        if (progresso.treinamentos) {
            console.log('   Total de treinamentos deste aluno:', progresso.treinamentos.length);
            console.log('   IDs dos treinamentos:', progresso.treinamentos.map(t => t.id));
            
            // Verificar se o aluno está inscrito neste treinamento
            const treinamentoAluno = progresso.treinamentos.find(t => 
                parseInt(t.id) === parseInt(treinamentoId)
            );
            
            if (treinamentoAluno) {
                console.log('   ✅ Aluno ESTÁ inscrito neste treinamento!');
                console.log('   Treinamento:', treinamentoAluno.titulo);
                
                // Buscar dados completos do aluno de qualquer fonte disponível
                const dadosAluno = buscarDadosAluno(alunoId);
                
                alunosInscritos.push({
                    id: dadosAluno.id,
                    nome: dadosAluno.nome,
                    rgMetro: dadosAluno.rgMetro,
                    setor: dadosAluno.setor,
                    cargo: dadosAluno.cargo,
                    progresso: treinamentoAluno.progresso || 0,
                    status: treinamentoAluno.status || 'em-andamento'
                });
                console.log('   📝 Nome:', dadosAluno.nome, '| RG Metro:', dadosAluno.rgMetro);
            } else {
                console.log('   ❌ Aluno NÃO está inscrito neste treinamento');
            }
        } else {
            console.log('   ⚠️ Aluno não tem lista de treinamentos');
        }
    });
    
    console.log('\n════════════════════════════════════════════════════════════');
    console.log(`✅ BUSCA CONCLUÍDA: ${alunosInscritos.length} aluno(s) inscrito(s)`);
    if (alunosInscritos.length > 0) {
        console.log('   Lista de alunos:');
        alunosInscritos.forEach((a, i) => {
            console.log(`      ${i + 1}. ${a.nome} (ID: ${a.id}, RG Metro: ${a.rgMetro})`);
        });
    }
    console.log('════════════════════════════════════════════════════════════\n');
    
    return alunosInscritos;
}

// Buscar aulas de um treinamento
function buscarAulas(treinamentoId) {
    const aulas = JSON.parse(localStorage.getItem('aulasRealizadas') || '{}');
    return aulas[treinamentoId] || [];
}

// Buscar presenças de um treinamento
function buscarPresencas(treinamentoId) {
    const presencas = JSON.parse(localStorage.getItem('presencasTreinamento') || '{}');
    return presencas[treinamentoId] || {};
}

// ===== RENDERIZAR SEÇÕES DO MODAL =====

// Renderizar lista de alunos inscritos
function renderizarAlunosInscritos(alunos, presencas, aulas) {
    console.log('🎨 Renderizando alunos inscritos:', alunos.length);
    
    if (alunos.length === 0) {
        console.warn('⚠️ Nenhum aluno inscrito encontrado!');
        console.log('💡 DICA: Para que alunos apareçam aqui:');
        console.log('  1. O aluno deve fazer login');
        console.log('  2. Ir em "Treinamentos"');
        console.log('  3. Clicar em "ENTRAR NO CURSO"');
        console.log('  4. Verificar se aparece "Você entrou no curso"');
        
        return `
            <div class="empty-message">
                <i class="fa-solid fa-user-slash"></i>
                <p><strong>Nenhum aluno inscrito neste treinamento.</strong></p>
                <p style="margin-top: 10px; font-size: 14px;">
                    Para que os alunos apareçam aqui, eles precisam:
                    <br>1. Fazer login como aluno (RG Metro)
                    <br>2. Acessar "Treinamentos"
                    <br>3. Clicar em "ENTRAR NO CURSO"
                </p>
            </div>
        `;
    }
    
    console.log('✅ Renderizando tabela com', alunos.length, 'aluno(s)');
    alunos.forEach((aluno, index) => {
        console.log(`  ${index + 1}. ${aluno.nome} (ID: ${aluno.id})`);
    });
    
    return `
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>RG Metro</th>
                        <th>Setor</th>
                        <th>Cargo</th>
                        <th>Presença</th>
                        <th>Progresso</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${alunos.map(aluno => {
                        const totalAulas = aulas.length;
                        const presencasAluno = contarPresencasAluno(aluno.id, presencas);
                        const percentualPresenca = totalAulas > 0 ? ((presencasAluno / totalAulas) * 100).toFixed(0) : 0;
                        
                        return `
                            <tr>
                                <td><strong>${aluno.nome}</strong></td>
                                <td>${aluno.rgMetro}</td>
                                <td>${aluno.setor}</td>
                                <td>${aluno.cargo}</td>
                                <td>
                                    <span class="presence-badge ${percentualPresenca >= 75 ? 'high' : percentualPresenca >= 50 ? 'medium' : 'low'}">
                                        ${presencasAluno}/${totalAulas} (${percentualPresenca}%)
                                    </span>
                                </td>
                                <td>
                                    <div class="progress-bar-mini">
                                        <div class="progress-fill" style="width: ${aluno.progresso || 0}%"></div>
                                    </div>
                                    <span class="progress-text">${aluno.progresso || 0}%</span>
                                </td>
                                <td>
                                    <span class="status-badge ${aluno.status}">
                                        ${getStatusText(aluno.status)}
                                    </span>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Renderizar lista de aulas
function renderizarAulas(aulas, alunos, presencas) {
    if (aulas.length === 0) {
        return `
            <div class="empty-message">
                <i class="fa-solid fa-calendar-xmark"></i>
                <p>Nenhuma aula realizada ainda.</p>
            </div>
        `;
    }
    
    return `
        <div class="aulas-list">
            ${aulas.map((aula, index) => {
                const presencasAula = presencas[aula.id] || [];
                const totalPresentes = presencasAula.filter(p => p.presente).length;
                const percentualPresenca = alunos.length > 0 ? ((totalPresentes / alunos.length) * 100).toFixed(0) : 0;
                
                return `
                    <div class="aula-card">
                        <div class="aula-header">
                            <div class="aula-info">
                                <h4>
                                    <i class="fa-solid fa-chalkboard-teacher"></i>
                                    Aula ${index + 1}: ${aula.titulo || `Aula ${index + 1}`}
                                </h4>
                                <p class="aula-data">
                                    <i class="fa-solid fa-calendar"></i> ${formatarData(aula.data)}
                                    ${aula.horario ? `<i class="fa-solid fa-clock"></i> ${aula.horario}` : ''}
                                </p>
                            </div>
                            <div class="aula-stats">
                                <span class="presence-count ${percentualPresenca >= 75 ? 'high' : percentualPresenca >= 50 ? 'medium' : 'low'}">
                                    ${totalPresentes}/${alunos.length} presentes (${percentualPresenca}%)
                                </span>
                            </div>
                        </div>
                        
                        ${aula.descricao ? `<p class="aula-descricao">${aula.descricao}</p>` : ''}
                        
                        <div class="presenca-detalhada">
                            <button class="btn-toggle" onclick="togglePresencaAula('aula-${aula.id}')">
                                <i class="fa-solid fa-chevron-down"></i> Ver Presenças
                            </button>
                            <div class="presenca-lista" id="aula-${aula.id}" style="display: none;">
                                ${renderizarPresencaAula(aula.id, alunos, presencas)}
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// Renderizar presença de uma aula específica
function renderizarPresencaAula(aulaId, alunos, presencas) {
    const presencasAula = presencas[aulaId] || [];
    
    return `
        <table class="presenca-table">
            <thead>
                <tr>
                    <th>Aluno</th>
                    <th>RG Metro</th>
                    <th>Presença</th>
                </tr>
            </thead>
            <tbody>
                ${alunos.map(aluno => {
                    const presenca = presencasAula.find(p => p.alunoId === aluno.id);
                    const presente = presenca?.presente || false;
                    
                    return `
                        <tr>
                            <td>${aluno.nome}</td>
                            <td>${aluno.rgMetro}</td>
                            <td>
                                <span class="presenca-icon ${presente ? 'presente' : 'ausente'}">
                                    <i class="fa-solid fa-${presente ? 'check-circle' : 'times-circle'}"></i>
                                    ${presente ? 'Presente' : 'Ausente'}
                                </span>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

// Renderizar relatório de presença geral
function renderizarRelatorioPresenca(alunos, aulas, presencas) {
    if (alunos.length === 0 || aulas.length === 0) {
        return `
            <div class="empty-message">
                <i class="fa-solid fa-chart-simple"></i>
                <p>Dados insuficientes para gerar relatório.</p>
            </div>
        `;
    }
    
    const totalAulas = aulas.length;
    const totalAlunos = alunos.length;
    const totalPresencasPossiveis = totalAulas * totalAlunos;
    
    let totalPresencas = 0;
    aulas.forEach(aula => {
        const presencasAula = presencas[aula.id] || [];
        totalPresencas += presencasAula.filter(p => p.presente).length;
    });
    
    const percentualGeralPresenca = ((totalPresencas / totalPresencasPossiveis) * 100).toFixed(1);
    
    return `
        <div class="relatorio-grid">
            <div class="relatorio-card">
                <div class="relatorio-icon">
                    <i class="fa-solid fa-users"></i>
                </div>
                <div class="relatorio-content">
                    <div class="relatorio-number">${totalAlunos}</div>
                    <div class="relatorio-label">Total de Alunos</div>
                </div>
            </div>
            
            <div class="relatorio-card">
                <div class="relatorio-icon">
                    <i class="fa-solid fa-calendar-days"></i>
                </div>
                <div class="relatorio-content">
                    <div class="relatorio-number">${totalAulas}</div>
                    <div class="relatorio-label">Total de Aulas</div>
                </div>
            </div>
            
            <div class="relatorio-card">
                <div class="relatorio-icon">
                    <i class="fa-solid fa-check-double"></i>
                </div>
                <div class="relatorio-content">
                    <div class="relatorio-number">${totalPresencas}</div>
                    <div class="relatorio-label">Total de Presenças</div>
                </div>
            </div>
            
            <div class="relatorio-card highlight">
                <div class="relatorio-icon">
                    <i class="fa-solid fa-chart-pie"></i>
                </div>
                <div class="relatorio-content">
                    <div class="relatorio-number">${percentualGeralPresenca}%</div>
                    <div class="relatorio-label">Presença Geral</div>
                </div>
            </div>
        </div>
    `;
}

// ===== FUNÇÕES AUXILIARES ESPECÍFICAS =====

function contarPresencasAluno(alunoId, presencas) {
    let count = 0;
    Object.values(presencas).forEach(presencasAula => {
        const presencaAluno = presencasAula.find(p => p.alunoId === alunoId);
        if (presencaAluno && presencaAluno.presente) {
            count++;
        }
    });
    return count;
}

function getStatusText(status) {
    const statusMap = {
        'em-andamento': 'Em Andamento',
        'concluido': 'Concluído',
        'pendente': 'Pendente',
        'disponivel': 'Disponível'
    };
    return statusMap[status] || 'Em Andamento';
}

function togglePresencaAula(aulaId) {
    const elemento = document.getElementById(aulaId);
    const botao = elemento.previousElementSibling;
    const icone = botao.querySelector('i');
    
    if (elemento.style.display === 'none') {
        elemento.style.display = 'block';
        icone.classList.remove('fa-chevron-down');
        icone.classList.add('fa-chevron-up');
        botao.innerHTML = botao.innerHTML.replace('Ver Presenças', 'Ocultar Presenças');
    } else {
        elemento.style.display = 'none';
        icone.classList.remove('fa-chevron-up');
        icone.classList.add('fa-chevron-down');
        botao.innerHTML = botao.innerHTML.replace('Ocultar Presenças', 'Ver Presenças');
    }
}

// ===== CONTROLE DO MODAL =====

function fecharModal() {
    document.getElementById('modalVisualizacao').style.display = 'none';
    treinamentoAtualModal = null;
}

// Fechar modal ao clicar fora
document.addEventListener('click', function(e) {
    const modal = document.getElementById('modalVisualizacao');
    if (e.target === modal) {
        fecharModal();
    }
});

// Fechar modal com tecla ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        fecharModal();
    }
});

// ===== EXPORTAR RESUMO =====

function exportarResumo() {
    if (!treinamentoAtualModal) return;
    
    const treinamento = treinamentoAtualModal;
    const alunosInscritos = buscarAlunosInscritos(treinamento.id);
    const aulas = buscarAulas(treinamento.id);
    const presencas = buscarPresencas(treinamento.id);
    
    let conteudo = `RELATÓRIO DE ACOMPANHAMENTO - TREINAMENTO\n`;
    conteudo += `${'='.repeat(80)}\n\n`;
    
    // Informações do Treinamento
    conteudo += `INFORMAÇÕES DO TREINAMENTO\n`;
    conteudo += `${'-'.repeat(80)}\n`;
    conteudo += `Título: ${treinamento.titulo}\n`;
    conteudo += `Categoria: ${treinamento.categoria}\n`;
    conteudo += `Duração: ${treinamento.duracao_horas} horas\n`;
    conteudo += `Instrutor: ${treinamento.instrutor}\n`;
    conteudo += `Período: ${formatarData(treinamento.data_inicio)} - ${formatarData(treinamento.data_fim)}\n`;
    conteudo += `Modalidade: ${treinamento.modalidade}\n`;
    conteudo += `Local: ${treinamento.local || 'Não especificado'}\n`;
    conteudo += `Vagas: ${alunosInscritos.length} / ${treinamento.vagas_total}\n\n`;
    
    // Alunos Inscritos
    conteudo += `ALUNOS INSCRITOS (${alunosInscritos.length})\n`;
    conteudo += `${'-'.repeat(80)}\n`;
    alunosInscritos.forEach((aluno, index) => {
        const presencasAluno = contarPresencasAluno(aluno.id, presencas);
        const totalAulas = aulas.length;
        const percentualPresenca = totalAulas > 0 ? ((presencasAluno / totalAulas) * 100).toFixed(0) : 0;
        
        conteudo += `${index + 1}. ${aluno.nome}\n`;
        conteudo += `   RG Metro: ${aluno.rgMetro}\n`;
        conteudo += `   Setor: ${aluno.setor} | Cargo: ${aluno.cargo}\n`;
        conteudo += `   Presença: ${presencasAluno}/${totalAulas} (${percentualPresenca}%)\n`;
        conteudo += `   Progresso: ${aluno.progresso}% | Status: ${getStatusText(aluno.status)}\n\n`;
    });
    
    // Aulas Realizadas
    conteudo += `AULAS REALIZADAS (${aulas.length})\n`;
    conteudo += `${'-'.repeat(80)}\n`;
    aulas.forEach((aula, index) => {
        const presencasAula = presencas[aula.id] || [];
        const totalPresentes = presencasAula.filter(p => p.presente).length;
        
        conteudo += `Aula ${index + 1}: ${aula.titulo || `Aula ${index + 1}`}\n`;
        conteudo += `Data: ${formatarData(aula.data)}${aula.horario ? ` - ${aula.horario}` : ''}\n`;
        conteudo += `Presentes: ${totalPresentes}/${alunosInscritos.length}\n\n`;
    });
    
    // Criar e baixar arquivo
    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Relatorio_${treinamento.titulo.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    
    console.log('✅ Relatório exportado com sucesso!');
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
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ DEBUG CONCLUÍDO');
    console.log('═══════════════════════════════════════════════════════════════\n');
}

// Adicionar ao window para poder chamar do console
window.debugarDadosLocalStorage = debugarDadosLocalStorage;

// ===== VLIBRAS =====
new window.VLibras.Widget('https://vlibras.gov.br/app');

