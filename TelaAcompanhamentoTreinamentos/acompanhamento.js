// ===== DADOS =====
let treinamentosCadastrados = [];

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    carregarTreinamentos();
    renderizarTreinamentos();
    atualizarEstatisticas();
});

// ===== CARREGAR DADOS =====
function carregarTreinamentos() {
    const dados = localStorage.getItem('treinamentosCadastrados');
    if (dados) {
        treinamentosCadastrados = JSON.parse(dados);
    }
}

// ===== RENDERIZAR TREINAMENTOS =====
function renderizarTreinamentos() {
    const container = document.getElementById('treinamentosList');
    const emptyState = document.getElementById('emptyMessage');
    
    if (treinamentosCadastrados.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    container.style.display = 'block';
    emptyState.style.display = 'none';
    
    container.innerHTML = treinamentosCadastrados.map(treinamento => {
        const statusClass = treinamento.ativo ? 'ativo' : 'inativo';
        const statusText = treinamento.ativo ? 'Ativo' : 'Inativo';
        
        return `
            <div class="treinamento-item">
                <div class="treinamento-header">
                    <h3 class="treinamento-title">${treinamento.titulo}</h3>
                    <span class="treinamento-status ${statusClass}">${statusText}</span>
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
                        <i class="fa-solid fa-eye"></i> Visualizar
                    </button>
                    <button class="btn-action btn-edit" onclick="editarTreinamento(${treinamento.id})">
                        <i class="fa-solid fa-edit"></i> Editar
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ===== ATUALIZAR ESTATÍSTICAS =====
function atualizarEstatisticas() {
    const total = treinamentosCadastrados.length;
    const ativos = treinamentosCadastrados.filter(t => t.ativo).length;
    const inativos = total - ativos;
    
    // Simular dados de conclusão (em um sistema real, viria do banco de dados)
    const certificados = JSON.parse(localStorage.getItem('certificadosDisponiveis') || '[]');
    const concluidos = certificados.length;
    const emAndamento = Math.max(0, ativos - concluidos);
    
    document.getElementById('total-treinamentos').textContent = total;
    document.getElementById('concluidos').textContent = concluidos;
    document.getElementById('em-andamento').textContent = emAndamento;
    document.getElementById('pendentes').textContent = inativos;
}

// ===== FUNÇÕES AUXILIARES =====
function formatarData(data) {
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
}

function visualizarTreinamento(id) {
    const treinamento = treinamentosCadastrados.find(t => t.id === id);
    if (treinamento) {
        alert(`Treinamento: ${treinamento.titulo}\nCategoria: ${treinamento.categoria}\nDuração: ${treinamento.duracao_horas}h\nInstrutor: ${treinamento.instrutor}`);
    }
}

function editarTreinamento(id) {
    // Redirecionar para a tela de cadastro com o treinamento selecionado
    window.location.href = `../TelaCadastroTreinamentos/cadastro_treinamentos.html?edit=${id}`;
}

// ===== LOGOUT =====
function logout() {
    if (confirm('Tem certeza que deseja sair do sistema?')) {
        localStorage.removeItem('user');
        window.location.href = '../TelaLogin/tela_login.html';
    }
}

// ===== VLIBRAS =====
new window.VLibras.Widget('https://vlibras.gov.br/app');

