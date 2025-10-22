// ===== JAVASCRIPT DA PÁGINA DE CERTIFICADOS =====

// VLibras Widget
new window.VLibras.Widget('https://vlibras.gov.br/app');

// Verificar autenticação
function verificarAutenticacao() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    // Sempre permitir acesso - não redirecionar nunca
    console.log('Permitindo acesso offline');
    return true;
}

// Carregar certificados
async function carregarCertificados() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyMessage');
    const container = document.getElementById('certificadosContainer');
    
    try {
        // Simular carregamento
        if (loadingState) {
            loadingState.style.display = 'block';
        }
        if (container) {
            container.style.display = 'none';
        }
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        
        // Simular delay de carregamento
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Carregar certificados do localStorage
        const certificadosSalvos = localStorage.getItem('certificadosDisponiveis');
        let certificados = [];
        
        if (certificadosSalvos) {
            certificados = JSON.parse(certificadosSalvos);
        }
        
        if (loadingState) {
            loadingState.style.display = 'none';
        }
        
        if (certificados.length === 0) {
            if (emptyState) {
                emptyState.style.display = 'block';
            }
        } else {
            if (container) {
                container.style.display = 'grid';
            }
            renderizarCertificados(certificados);
        }
    } catch (error) {
        console.error('Erro ao carregar certificados:', error);
        if (loadingState) {
            loadingState.style.display = 'none';
        }
        if (emptyState) {
            emptyState.style.display = 'block';
        }
    }
}

// Renderizar certificados
function renderizarCertificados(certificados) {
    const container = document.getElementById('certificadosContainer');
    const emptyState = document.getElementById('emptyMessage');
    
    if (!container) {
        console.error('Container de certificados não encontrado');
        return;
    }
    
    if (certificados.length === 0) {
        container.style.display = 'none';
        if (emptyState) {
            emptyState.style.display = 'block';
            emptyState.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-certificate"></i>
                    <h3>Nenhum certificado disponível ainda</h3>
                    <p>Complete seus treinamentos para obter certificados.</p>
                    <p>Os certificados aparecerão automaticamente quando você atingir 100% de progresso em um treinamento.</p>
                </div>
            `;
        }
        return;
    }
    
    // Mostrar certificados
    container.innerHTML = certificados.map(certificado => `
        <div class="certificado-item">
            <div class="certificado-header">
                <div class="certificado-icon">
                    <i class="fa-solid fa-certificate"></i>
                </div>
                <h3 class="certificado-title">${certificado.titulo || 'Certificado de Treinamento'}</h3>
            </div>
            
            <div class="certificado-details">
                <div class="detail-item">
                    <strong>Categoria:</strong> ${certificado.categoria || 'N/A'}
                </div>
                <div class="detail-item">
                    <strong>RG do Metrô:</strong> ${certificado.alunoRg || 'N/A'}
                </div>
                <div class="detail-item">
                    <strong>Concluído em:</strong> ${certificado.dataConclusao || new Date().toLocaleDateString('pt-BR')}
                </div>
                <div class="detail-item">
                    <strong>Carga Horária:</strong> ${certificado.cargaHoraria || 'N/A'}
                </div>
                <div class="detail-item">
                    <strong>Código:</strong> ${certificado.codigo || 'CERT-' + Date.now()}
                </div>
                <div class="detail-item">
                    <strong>Aluno:</strong> ${certificado.aluno || 'N/A'}
                </div>
            </div>
            
            <div class="certificado-actions">
                <a href="#" class="btn-action btn-view" onclick="visualizarCertificado(${certificado.id || 0})">
                    <i class="fa-solid fa-eye"></i> Visualizar
                </a>
                <a href="#" class="btn-action btn-download" onclick="baixarCertificado(${certificado.id || 0})">
                    <i class="fa-solid fa-download"></i> Baixar
                </a>
            </div>
        </div>
    `).join('');
}

// Visualizar certificado
function visualizarCertificado(certificadoId) {
    alert(`Visualizando certificado ${certificadoId}`);
    // Aqui seria implementada a lógica para visualizar o certificado
}

// Baixar certificado
function baixarCertificado(certificadoId) {
    alert(`Baixando certificado ${certificadoId}`);
    // Aqui seria implementada a lógica para baixar o certificado
}

// Função para fazer logout
function logout() {
    if (confirm('Tem certeza que deseja sair do sistema?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '../TelaLogin/tela_login.html';
    }
}


// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    if (verificarAutenticacao()) {
        carregarCertificados();
    }
});






