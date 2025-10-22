// ===== DADOS =====
let treinamentosDisponiveis = [];
let certificadosAluno = [];
let treinamentosConcluidos = [];

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    carregarDados();
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
function carregarDados() {
    // Carregar progresso do aluno
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const progressoAluno = JSON.parse(localStorage.getItem('progressoAluno') || '{}');
    
    if (progressoAluno[user.id] && progressoAluno[user.id].treinamentos) {
        // Usar treinamentos do progresso do aluno
        treinamentosDisponiveis = progressoAluno[user.id].treinamentos;
        console.log('Treinamentos do progresso carregados:', treinamentosDisponiveis);
    } else {
        // Se não há progresso, carregar treinamentos disponíveis
        const treinamentos = localStorage.getItem('treinamentosCadastrados');
        if (treinamentos) {
            treinamentosDisponiveis = JSON.parse(treinamentos);
        }
        console.log('Nenhum progresso encontrado, carregando treinamentos disponíveis');
    }
    
    // Inicializar arrays vazios - certificados só aparecem quando instrutor concluir curso
    treinamentosConcluidos = [];
    certificadosAluno = [];
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
        
        return `
            <div class="treinamento-item">
                <div class="treinamento-info">
                    <h3>${treinamento.titulo}</h3>
                    <p>${treinamento.descricao}</p>
                </div>
                <div class="treinamento-status">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
            </div>
        `;
    }).join('');
}

// ===== BUSCAR TREINAMENTOS DO ALUNO =====
function buscarTreinamentosAluno() {
    const treinamentosAluno = [];
    
    // Buscar treinamentos concluídos que incluem este aluno
    treinamentosConcluidos.forEach(concluido => {
        const treinamentoOriginal = treinamentosDisponiveis.find(t => t.id === concluido.treinamentoId);
        
        if (treinamentoOriginal) {
            // Verificar se o aluno está na lista de concluídos
            const alunoConcluiu = concluido.alunosConcluidos && 
                concluido.alunosConcluidos.some(aluno => 
                    aluno.rgMetro === '123456789' // RG do aluno logado (em um sistema real, viria da sessão)
                );
            
            if (alunoConcluiu) {
                treinamentosAluno.push({
                    id: treinamentoOriginal.id,
                    titulo: treinamentoOriginal.titulo,
                    descricao: treinamentoOriginal.descricao,
                    status: 'concluido',
                    statusText: 'Concluído',
                    progress: 100
                });
            } else {
                // Verificar se o aluno está inscrito mas não concluiu
                const alunoInscrito = concluido.alunosInscritos && 
                    concluido.alunosInscritos.some(aluno => 
                        aluno.rgMetro === '123456789'
                    );
                
                if (alunoInscrito) {
                    treinamentosAluno.push({
                        id: treinamentoOriginal.id,
                        titulo: treinamentoOriginal.titulo,
                        descricao: treinamentoOriginal.descricao,
                        status: 'em-andamento',
                        statusText: 'Em Andamento',
                        progress: 50
                    });
                }
            }
        }
    });
    
    return treinamentosAluno;
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