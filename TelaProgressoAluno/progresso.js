// ===== DADOS =====
let treinamentosDisponiveis = [];
let certificadosAluno = [];
let treinamentosConcluidos = [];

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', async function() {
    await carregarDados();
    renderizarTreinamentos();
    atualizarEstatisticas();
});

// ===== FUNÇÕES AUXILIARES =====

// Obter texto do status
function getStatusText(status) {
    switch (status) {
        case 'em-andamento':
            return 'Em Andamento';
        case 'concluido':
            return 'Concluído';
        case 'disponivel':
            return 'Disponível';
        default:
            return 'Em Andamento';
    }
}

// ===== CARREGAR DADOS =====
async function carregarDados() {
    // Carregar treinamentos cadastrados (fonte da verdade)
    const treinamentosCadastrados = JSON.parse(localStorage.getItem('treinamentosCadastrados') || '[]');
    
    // Carregar progresso do aluno
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const progressoAluno = JSON.parse(localStorage.getItem('progressoAluno') || '{}');
    
    if (progressoAluno[user.id] && progressoAluno[user.id].treinamentos) {
        // Validar e limpar treinamentos que foram excluídos
        const treinamentosValidados = validarTreinamentosExistentes(
            progressoAluno[user.id].treinamentos,
            treinamentosCadastrados
        );
        
        // Se houve mudanças, atualizar o progresso no localStorage
        if (treinamentosValidados.length !== progressoAluno[user.id].treinamentos.length) {
            progressoAluno[user.id].treinamentos = treinamentosValidados;
            progressoAluno[user.id].ultimaAtualizacao = new Date().toISOString();
            localStorage.setItem('progressoAluno', JSON.stringify(progressoAluno));
            console.log('🧹 Treinamentos excluídos removidos do progresso');
        }
        
        treinamentosDisponiveis = treinamentosValidados;
        console.log('✅ Treinamentos do progresso carregados e validados:', treinamentosDisponiveis);
    } else {
        // Se não há progresso, usar array vazio
        treinamentosDisponiveis = [];
        console.log('⚠️ Nenhum progresso encontrado para este aluno');
    }
    
    // Buscar dados reais do backend para contadores e lista do aluno
    try {
        const token = localStorage.getItem('token');
        if (token) {
            const [respTrain, respCert] = await Promise.all([
                fetch('http://localhost:3000/api/trainings/meus', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('http://localhost:3000/api/certificates/meus', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const dataTrain = await respTrain.json();
            const dataCert = await respCert.json();
            if (respTrain.ok && Array.isArray(dataTrain.trainings)) {
                // Substituir fonte por dados reais do backend do usuário logado
                treinamentosDisponiveis = dataTrain.trainings.map(t => ({
                    id: t.id,
                    titulo: t.titulo,
                    descricao: t.descricao || '',
                    status: t.meuStatus === 'concluido' ? 'concluido' : 'em-andamento',
                    progresso: t.progresso || 0,
                    presencaPercentual: 0
                }));
                // Enriquecer com frequência do aluno por curso
                const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
                if (userId) {
                    await Promise.all(treinamentosDisponiveis.map(async (tr) => {
                        try {
                            const r = await fetch(`http://localhost:3000/api/attendance/user/${userId}/training/${tr.id}`, {
                                headers: { 'Authorization': `Bearer ${token}` },
                                cache: 'no-store'
                            });
                            if (r.ok) {
                                const dj = await r.json();
                                tr.presencaPercentual = dj?.stats?.percentualFrequencia ?? 0;
                            }
                        } catch (_) {}
                    }));
                }
            }
            if (respCert.ok && Array.isArray(dataCert.certificados)) {
                certificadosAluno = dataCert.certificados;
            } else {
                certificadosAluno = [];
            }
        } else {
            certificadosAluno = [];
        }
    } catch (e) {
        console.warn('⚠️ Falha ao buscar dados do backend (modo offline):', e.message);
        // Mantém dados locais se backend indisponível
        certificadosAluno = [];
    }
}

// ===== VALIDAR SE TREINAMENTOS AINDA EXISTEM =====
function validarTreinamentosExistentes(treinamentosProgresso, treinamentosCadastrados) {
    console.log('🔍 Validando treinamentos...');
    console.log('  Treinamentos no progresso:', treinamentosProgresso.length);
    console.log('  Treinamentos cadastrados:', treinamentosCadastrados.length);
    
    // Filtrar apenas treinamentos que ainda existem na lista principal
    const treinamentosValidos = treinamentosProgresso.filter(treinamentoProgresso => {
        const existe = treinamentosCadastrados.some(t => 
            parseInt(t.id) === parseInt(treinamentoProgresso.id)
        );
        
        if (!existe) {
            console.log(`  ❌ Treinamento "${treinamentoProgresso.titulo}" (ID: ${treinamentoProgresso.id}) foi excluído`);
        }
        
        return existe;
    });
    
    console.log('  ✅ Treinamentos válidos:', treinamentosValidos.length);
    
    // Atualizar informações dos treinamentos com dados mais recentes
    const treinamentosAtualizados = treinamentosValidos.map(treinamentoProgresso => {
        const treinamentoAtual = treinamentosCadastrados.find(t => 
            parseInt(t.id) === parseInt(treinamentoProgresso.id)
        );
        
        if (treinamentoAtual) {
            // Manter progresso do aluno, mas atualizar informações do treinamento
            return {
                ...treinamentoProgresso,
                titulo: treinamentoAtual.titulo,
                descricao: treinamentoAtual.descricao,
                categoria: treinamentoAtual.categoria,
                duracao_horas: treinamentoAtual.duracao_horas,
                instrutor: treinamentoAtual.instrutor,
                dataInicio: treinamentoAtual.data_inicio,
                dataFim: treinamentoAtual.data_fim
            };
        }
        
        return treinamentoProgresso;
    });
    
    return treinamentosAtualizados;
}

// ===== RENDERIZAR TREINAMENTOS =====
function renderizarTreinamentos() {
    const container = document.getElementById('treinamentosList');
    const emptyState = document.getElementById('emptyMessage');
    
    console.log('Treinamentos disponíveis para renderizar:', treinamentosDisponiveis);
    
    if (treinamentosDisponiveis.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    container.style.display = 'block';
    emptyState.style.display = 'none';
    
    container.innerHTML = treinamentosDisponiveis.map(treinamento => {
        const statusClass = treinamento.status || 'em-andamento';
        const statusText = getStatusText(statusClass);
        const progress = treinamento.progresso || 0;
        const freq = Math.round(treinamento.presencaPercentual || 0);
        
        return `
            <div class="treinamento-item">
                <div class="treinamento-info">
                    <h3>${treinamento.titulo}</h3>
                    <p>${treinamento.descricao}</p>
                </div>
                <div class="treinamento-status">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                    <span class="status-badge" title="Frequência nas aulas">${freq}% presença</span>
                </div>
            </div>
        `;
    }).join('');
}

// ===== BUSCAR TREINAMENTOS DO ALUNO =====
function buscarTreinamentosAluno() {
    // Agora a fonte é treinamentosDisponiveis carregado do backend
    return treinamentosDisponiveis.map(t => ({
        id: t.id,
        titulo: t.titulo,
        descricao: t.descricao || '',
        status: t.status === 'concluido' ? 'concluido' : 'em-andamento',
        statusText: t.status === 'concluido' ? 'Concluído' : 'Em Andamento',
        progress: t.progresso || 0
    }));
}

// ===== ATUALIZAR ESTATÍSTICAS =====
function atualizarEstatisticas() {
    const treinamentosAluno = buscarTreinamentosAluno();
    
    const totalCursos = treinamentosAluno.length;
    const concluidos = treinamentosAluno.filter(t => t.status === 'concluido').length;
    const emAndamento = treinamentosAluno.filter(t => t.status === 'em-andamento').length;
    const certificados = certificadosAluno.length;
    
    document.getElementById('total-cursos').textContent = totalCursos;
    document.getElementById('concluidos').textContent = concluidos;
    document.getElementById('em-andamento').textContent = emAndamento;
    document.getElementById('certificados').textContent = certificados;
}


// ===== VOLTAR AO DASHBOARD =====
function voltarDashboard() {
    window.location.href = '../TelaHomeAluno/aluno_home.html';
}

// ===== LOGOUT =====
function logout() {
    if (confirm('Tem certeza que deseja sair do sistema?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '../TelaLogin/tela_login.html';
    }
}