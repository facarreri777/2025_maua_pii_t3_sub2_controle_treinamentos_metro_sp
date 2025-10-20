// VLibras Widget
new window.VLibras.Widget('https://vlibras.gov.br/app');

// Variáveis globais
let treinamentosDisponiveis = [];
let treinamentosFiltrados = [];
let visualizacaoAtual = 'grid';

// Função para fazer logout
function logout() {
    if (confirm('Tem certeza que deseja sair do sistema?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '../2025_maua_pii_t3_sub2_controle_treinamentos_metro_sp-tela_login/tela_login.html';
    }
}

// Inicializar dados de exemplo
function inicializarDadosExemplo() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        console.log('Inicializando dados vazios...');
        localStorage.setItem('token', 'demo-token');
        localStorage.setItem('user', JSON.stringify({
            nome: 'Aluno Demo',
            usuario: 'aluno',
            setor: 'Operacional',
            cargo: 'Operador',
            treinamentos: []
        }));
        console.log('Dados vazios inicializados');
    }
}

// Dados de exemplo de treinamentos disponíveis (vazio por enquanto)
const treinamentosExemplo = [];

// Verificar autenticação (modo offline)
async function verificarAutenticacao() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    console.log('Token:', token);
    console.log('User:', user);
    
    // Sempre permitir acesso - não redirecionar nunca
    console.log('Permitindo acesso offline');
    return true;
}

// Carregar treinamentos disponíveis
async function carregarTreinamentos() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyMessage');
    const container = document.getElementById('treinamentosContainer');
    
    try {
        // Simular carregamento
        loadingState.style.display = 'block';
        container.style.display = 'none';
        emptyState.style.display = 'none';
        
        // Simular delay de carregamento
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Usar dados de exemplo
        treinamentosDisponiveis = [...treinamentosExemplo];
        treinamentosFiltrados = [...treinamentosDisponiveis];
        
        loadingState.style.display = 'none';
        
        if (treinamentosFiltrados.length === 0) {
            emptyState.style.display = 'block';
        } else {
            container.style.display = 'block';
            renderizarTreinamentos(treinamentosFiltrados);
            atualizarEstatisticas();
        }
    } catch (error) {
        console.error('Erro ao carregar treinamentos:', error);
        loadingState.style.display = 'none';
        emptyState.style.display = 'block';
    }
}

// Renderizar treinamentos
function renderizarTreinamentos(treinamentos) {
    const container = document.getElementById('treinamentosContainer');
    
    if (treinamentos.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-graduation-cap"></i><h3>Nenhum treinamento disponível</h3><p>Ainda não há treinamentos cadastrados no sistema. Os treinamentos aparecerão aqui quando forem criados pelos instrutores.</p></div>';
        return;
    }
    
    container.innerHTML = treinamentos.map(treinamento => {
        const statusClass = treinamento.status;
        const statusText = getStatusText(treinamento.status);
        const statusColor = getStatusColor(treinamento.status);
        
        let buttonHtml = '';
        if (treinamento.status === 'disponivel' && treinamento.vagas_disponiveis > 0) {
            buttonHtml = `<button class="btn-action btn-start" onclick="inscreverTreinamento(${treinamento.id})">
                <i class="fa-solid fa-plus"></i> Inscrever-se
            </button>`;
        } else if (treinamento.status === 'em-andamento') {
            buttonHtml = `
                <button class="btn-action btn-continue" onclick="visualizarTreinamento(${treinamento.id})">
                    <i class="fa-solid fa-eye"></i> Visualizar
                </button>
                <button class="btn-action btn-complete" onclick="concluirTreinamento(${treinamento.id})">
                    <i class="fa-solid fa-check"></i> Concluir
                </button>
            `;
        } else if (treinamento.status === 'concluido') {
            buttonHtml = `<button class="btn-action btn-view" onclick="visualizarTreinamento(${treinamento.id})">
                <i class="fa-solid fa-certificate"></i> Certificado
            </button>`;
        } else {
            buttonHtml = `<button class="btn-action" disabled>
                <i class="fa-solid fa-lock"></i> Indisponível
            </button>`;
        }
        
        return `
            <div class="treinamento-item ${statusClass}">
                <div class="treinamento-header">
                    <h3 class="treinamento-title">${treinamento.titulo}</h3>
                    <span class="treinamento-status ${statusClass}" style="background: ${statusColor.background}; color: ${statusColor.color}">
                        ${statusText}
                    </span>
                </div>
                
                <p class="treinamento-description">${treinamento.descricao}</p>
                
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
                        <span class="detail-label">Período</span>
                        <span class="detail-value">${formatarData(treinamento.data_inicio)} - ${formatarData(treinamento.data_fim)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Vagas</span>
                        <span class="detail-value">${treinamento.vagas_disponiveis}/${treinamento.vagas_total}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Certificado</span>
                        <span class="detail-value">${treinamento.certificado ? 'Sim' : 'Não'}</span>
                    </div>
                </div>
                
                ${treinamento.requisitos ? `
                <div class="treinamento-requisitos">
                    <strong>Pré-requisitos:</strong> ${treinamento.requisitos}
                </div>
                ` : ''}
                
                <div class="treinamento-actions">
                    ${buttonHtml}
                </div>
            </div>
        `;
    }).join('');
}

// Funções auxiliares
function getStatusText(status) {
    const statusMap = {
        'disponivel': 'Disponível',
        'em-andamento': 'Em Andamento',
        'concluido': 'Concluído'
    };
    return statusMap[status] || status;
}

function getStatusColor(status) {
    const colorMap = {
        'disponivel': { background: '#d4edda', color: '#155724' },
        'em-andamento': { background: '#fff3cd', color: '#856404' },
        'concluido': { background: '#cce5ff', color: '#004085' }
    };
    return colorMap[status] || { background: '#f8d7da', color: '#721c24' };
}

function formatarData(data) {
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
}

// Atualizar estatísticas
function atualizarEstatisticas() {
    const total = treinamentosFiltrados.length;
    const disponiveis = treinamentosFiltrados.filter(t => t.status === 'disponivel').length;
    const emAndamento = treinamentosFiltrados.filter(t => t.status === 'em-andamento').length;
    const concluidos = treinamentosFiltrados.filter(t => t.status === 'concluido').length;
    
    document.getElementById('total-treinamentos').textContent = total;
    document.getElementById('disponiveis').textContent = disponiveis;
    document.getElementById('em-andamento').textContent = emAndamento;
    document.getElementById('concluidos').textContent = concluidos;
}

// Aplicar filtros
function aplicarFiltros() {
    const statusFilter = document.getElementById('status-filter').value;
    const categoriaFilter = document.getElementById('categoria-filter').value;
    const searchInput = document.getElementById('search-input').value.toLowerCase();
    
    treinamentosFiltrados = treinamentosDisponiveis.filter(treinamento => {
        const statusMatch = !statusFilter || treinamento.status === statusFilter;
        const categoriaMatch = !categoriaFilter || treinamento.categoria.toLowerCase() === categoriaFilter;
        const searchMatch = !searchInput || 
            treinamento.titulo.toLowerCase().includes(searchInput) ||
            treinamento.descricao.toLowerCase().includes(searchInput) ||
            treinamento.instrutor.toLowerCase().includes(searchInput);
        
        return statusMatch && categoriaMatch && searchMatch;
    });
    
    renderizarTreinamentos(treinamentosFiltrados);
    atualizarEstatisticas();
}

// Alternar visualização
function alternarVisualizacao(tipo) {
    visualizacaoAtual = tipo;
    const container = document.getElementById('treinamentosContainer');
    const buttons = document.querySelectorAll('.view-btn');
    
    // Atualizar botões
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.closest('.view-btn').classList.add('active');
    
    // Aplicar classe de visualização
    if (tipo === 'list') {
        container.classList.add('list-view');
    } else {
        container.classList.remove('list-view');
    }
}

// Inscrever-se em treinamento
function inscreverTreinamento(treinamentoId) {
    const treinamento = treinamentosDisponiveis.find(t => t.id === treinamentoId);
    if (treinamento && treinamento.vagas_disponiveis > 0) {
        if (confirm(`Deseja inscrever-se no treinamento "${treinamento.titulo}"?`)) {
            // Mostrar notificação de sucesso
            if (window.notificationManager) {
                window.notificationManager.treinamentoIniciado(treinamento.titulo);
            } else {
                alert('Inscrição realizada com sucesso! Você receberá um e-mail de confirmação.');
            }
            // Aqui seria feita a inscrição via API
            // Por enquanto, apenas simulamos
            treinamento.vagas_disponiveis--;
            aplicarFiltros();
        }
    } else {
        alert('Este treinamento não possui vagas disponíveis.');
    }
}

// Concluir treinamento
function concluirTreinamento(treinamentoId) {
    const treinamento = treinamentosDisponiveis.find(t => t.id === treinamentoId);
    if (treinamento && treinamento.status === 'em-andamento') {
        if (confirm(`Deseja concluir o treinamento "${treinamento.titulo}"?`)) {
            // Atualizar status do treinamento
            treinamento.status = 'concluido';
            
            // Salvar no localStorage
            localStorage.setItem('treinamentosDisponiveis', JSON.stringify(treinamentosDisponiveis));
            
            // Atualizar a lista
            aplicarFiltros();
            
            // Mostrar notificação de sucesso
            if (window.notificationManager) {
                window.notificationManager.treinamentoConcluido(treinamento.titulo);
            } else {
                alert('Parabéns! Treinamento concluído com sucesso!');
            }
        }
    }
}

// Visualizar treinamento
function visualizarTreinamento(treinamentoId) {
    const treinamento = treinamentosDisponiveis.find(t => t.id === treinamentoId);
    if (treinamento) {
        alert(`Visualizando treinamento: ${treinamento.titulo}\n\nEsta funcionalidade será implementada em breve!`);
    }
}

// Inicializar página
window.addEventListener('load', async function() {
    // Inicializar dados de exemplo se necessário
    inicializarDadosExemplo();
    
    const autenticado = await verificarAutenticacao();
    if (autenticado) {
        await carregarTreinamentos();
    }
    
    // Adicionar event listeners para filtros
    document.getElementById('search-input').addEventListener('input', aplicarFiltros);
    document.getElementById('status-filter').addEventListener('change', aplicarFiltros);
    document.getElementById('categoria-filter').addEventListener('change', aplicarFiltros);
});