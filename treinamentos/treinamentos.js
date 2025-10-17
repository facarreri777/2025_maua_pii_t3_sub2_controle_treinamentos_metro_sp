// VLibras Widget
new window.VLibras.Widget('https://vlibras.gov.br/app');

// Função para fazer logout
function logout() {
    if (confirm('Tem certeza que deseja sair do sistema?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '../../2025_maua_pii_t3_sub2_controle_treinamentos_metro_sp-tela_login/tela_login.html';
    }
}

// Inicializar dados vazios
function inicializarDadosExemplo() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        console.log('Inicializando dados vazios...');
        localStorage.setItem('token', '');
        localStorage.setItem('user', JSON.stringify({
            nome: '',
            usuario: '',
            setor: '',
            cargo: '',
            treinamentos: []
        }));
        console.log('Dados vazios inicializados');
    }
}

// Função para verificar autenticação (modo offline)
async function verificarAutenticacao() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    console.log('Token:', token);
    console.log('User:', user);
    
    // Sempre permitir acesso - não redirecionar nunca
    console.log('Permitindo acesso offline');
    return true;
}

// Carregar treinamentos
async function carregarTreinamentos() {
    const token = localStorage.getItem('token');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const container = document.getElementById('treinamentosContainer');
    
    try {
        const response = await fetch('http://localhost:3000/api/aluno/treinamentos', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const treinamentos = await response.json();
            
            loadingState.style.display = 'none';
            
            if (treinamentos.length === 0) {
                document.getElementById('emptyMessage').style.display = 'block';
            } else {
                container.style.display = 'block';
                renderizarTreinamentos(treinamentos);
            }
        } else {
            throw new Error('Erro ao carregar treinamentos');
        }
    } catch (error) {
        console.log('Modo offline - usando dados locais');
        loadingState.style.display = 'none';
        container.style.display = 'block';
        renderizarTreinamentos([]);
    }
}

// Renderizar treinamentos
function renderizarTreinamentos(treinamentos) {
    const container = document.getElementById('treinamentosContainer');
    
        // Sem dados simulados - lista vazia
        const treinamentosExemplo = [];
    
    if (treinamentosExemplo.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-graduation-cap"></i><p>Nenhum treinamento atribuído ainda. Entre em contato com seu supervisor.</p></div>';
        return;
    }
    
    container.innerHTML = treinamentosExemplo.map(treinamento => {
        const status = treinamento.concluido ? 'completed' : 
                     (treinamento.progresso_percentual > 0 ? 'in-progress' : 'not-started');
        
        const statusText = treinamento.concluido ? 'Concluído' : 
                          (treinamento.progresso_percentual > 0 ? 'Em Andamento' : 'Não Iniciado');
        
        let buttonHtml = '';
        if (treinamento.concluido) {
            buttonHtml = '<button class="btn-action btn-view" onclick="visualizarTreinamento(' + treinamento.id + ')">Visualizar</button>';
        } else if (treinamento.progresso_percentual > 0) {
            buttonHtml = '<button class="btn-action btn-continue" onclick="continuarTreinamento(' + treinamento.id + ')">Continuar</button>';
        } else {
            buttonHtml = '<button class="btn-action btn-start" onclick="iniciarTreinamento(' + treinamento.id + ')">Iniciar</button>';
        }
        
        return `
            <div class="treinamento-item">
                <div class="treinamento-header">
                    <h3 class="treinamento-title">${treinamento.titulo}</h3>
                    <span class="treinamento-status ${status}">${statusText}</span>
                </div>
                
                <p style="margin-bottom: 15px; color: #666;">Treinamento sobre ${treinamento.categoria.toLowerCase()} - ${treinamento.titulo.toLowerCase()}</p>
                
                <div class="treinamento-details">
                    <div class="detail-item">
                        <strong>Categoria:</strong> ${treinamento.categoria}
                    </div>
                    <div class="detail-item">
                        <strong>Carga Horária:</strong> ${treinamento.duracao_minutos}h
                    </div>
                    <div class="detail-item">
                        <strong>Turma:</strong> ${treinamento.turmas}
                    </div>
                    <div class="detail-item">
                        <strong>Período:</strong> ${treinamento.periodo}
                    </div>
                </div>
                
                ${treinamento.progresso_percentual > 0 ? `
                <div class="progress-container">
                    <div class="progress-text">Progresso: ${treinamento.progresso_percentual}%</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${treinamento.progresso_percentual}%"></div>
                    </div>
                </div>
                ` : ''}
                
                ${buttonHtml}
            </div>
        `;
    }).join('');
}

// Iniciar treinamento
async function iniciarTreinamento(treinamentoId) {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`http://localhost:3000/api/aluno/treinamento/${treinamentoId}/iniciar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            alert('Treinamento iniciado com sucesso!');
            carregarTreinamentos(); // Recarregar a lista
        } else {
            const data = await response.json();
            alert(data.error || 'Erro ao iniciar treinamento');
        }
    } catch (error) {
        console.error('Erro ao iniciar treinamento:', error);
        alert('Erro ao iniciar treinamento. Tente novamente.');
    }
}

// Continuar treinamento
function continuarTreinamento(treinamentoId) {
    alert('Funcionalidade de continuar treinamento será implementada em breve!');
    // Aqui seria redirecionado para a página do treinamento
}

// Visualizar treinamento
function visualizarTreinamento(treinamentoId) {
    alert('Funcionalidade de visualizar treinamento será implementada em breve!');
    // Aqui seria redirecionado para uma página de visualização/completude
}

// Inicializar página
window.addEventListener('load', async function() {
    // Inicializar dados de exemplo se necessário
    inicializarDadosExemplo();
    
    const autenticado = await verificarAutenticacao();
    if (autenticado) {
        await carregarTreinamentos();
    }
});
