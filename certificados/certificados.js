// ===== JAVASCRIPT DA PÁGINA DE CERTIFICADOS =====

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
    const token = localStorage.getItem('token');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyMessage');
    const container = document.getElementById('certificadosContainer');
    
    try {
        const response = await fetch('http://localhost:3000/api/aluno/certificados', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const certificados = await response.json();
            
            loadingState.style.display = 'none';
            
            if (certificados.length === 0) {
                emptyState.style.display = 'block';
            } else {
                container.style.display = 'grid';
                renderizarCertificados(certificados);
            }
        } else {
            throw new Error('Erro ao carregar certificados');
        }
    } catch (error) {
        console.log('Modo offline - usando dados locais');
        loadingState.style.display = 'none';
        container.style.display = 'grid';
        renderizarCertificados([]);
    }
}

// Renderizar certificados
function renderizarCertificados(certificados) {
    const container = document.getElementById('certificadosContainer');
    const emptyState = document.getElementById('emptyMessage');
    
    // Verificar se há treinamentos concluídos (100% de progresso)
    const treinamentosConcluidos = localStorage.getItem('treinamentosConcluidos');
    let certificadosDisponiveis = [];
    
    if (treinamentosConcluidos) {
        certificadosDisponiveis = JSON.parse(treinamentosConcluidos);
    }
    
    if (certificadosDisponiveis.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        emptyState.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-certificate"></i>
                <h3>Nenhum certificado disponível ainda</h3>
                <p>Complete seus treinamentos para obter certificados.</p>
                <p>Os certificados aparecerão automaticamente quando você atingir 100% de progresso em um treinamento.</p>
            </div>
        `;
        return;
    }
    
    // Mostrar certificados dos treinamentos concluídos
    container.innerHTML = certificadosDisponiveis.map(certificado => `
        <div class="certificado-item">
            <div class="certificado-header">
                <div class="certificado-icon">
                    <i class="fa-solid fa-certificate"></i>
                </div>
                <h3 class="certificado-title">${certificado.titulo}</h3>
            </div>
            
            <div class="certificado-details">
                <div class="detail-item">
                    <strong>Categoria:</strong> ${certificado.categoria}
                </div>
                <div class="detail-item">
                    <strong>Concluído em:</strong> ${certificado.dataConclusao}
                </div>
                <div class="detail-item">
                    <strong>Carga Horária:</strong> ${certificado.cargaHoraria}
                </div>
                <div class="detail-item">
                    <strong>Código:</strong> ${certificado.codigo}
                </div>
            </div>
            
            <div class="certificado-actions">
                <a href="#" class="btn-action btn-view" onclick="visualizarCertificado(${certificado.id})">
                    <i class="fa-solid fa-eye"></i> Visualizar
                </a>
                <a href="#" class="btn-action btn-download" onclick="baixarCertificado(${certificado.id})">
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
        window.location.href = '../../2025_maua_pii_t3_sub2_controle_treinamentos_metro_sp-tela_login/tela_login.html';
    }
}

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    if (verificarAutenticacao()) {
        carregarCertificados();
    }
});
