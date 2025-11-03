// ===== JAVASCRIPT DA PÁGINA DE CERTIFICADOS =====

// ===== INICIALIZAÇÃO DO VLIBRAS =====
function inicializarVLibras() {
    if (typeof window.VLibras !== 'undefined') {
        try {
            new window.VLibras.Widget('https://vlibras.gov.br/app');
            console.log('VLibras inicializado com sucesso');
        } catch (error) {
            console.error('Erro ao inicializar VLibras:', error);
        }
    } else {
        setTimeout(() => {
            if (typeof window.VLibras !== 'undefined') {
                try {
                    new window.VLibras.Widget('https://vlibras.gov.br/app');
                    console.log('VLibras inicializado com sucesso (retry)');
                } catch (error) {
                    console.error('Erro ao inicializar VLibras (retry):', error);
                }
            } else {
                setTimeout(() => {
                    if (typeof window.VLibras !== 'undefined') {
                        try {
                            new window.VLibras.Widget('https://vlibras.gov.br/app');
                            console.log('VLibras inicializado com sucesso (retry 2)');
                        } catch (error) {
                            console.error('Erro ao inicializar VLibras (retry 2):', error);
                        }
                    }
                }, 2000);
            }
        }, 1000);
    }
}

window.addEventListener('load', inicializarVLibras);
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarVLibras);
} else {
    inicializarVLibras();
}

// Verificar autenticação
function verificarAutenticacao() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    // Sempre permitir acesso - não redirecionar nunca
    console.log('Permitindo acesso offline');
    return true;
}

// Carregar certificados do backend
async function carregarCertificados() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyMessage');
    const container = document.getElementById('certificadosContainer');

    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('Token não encontrado. Redirecionando para login.');
        window.location.href = '../TelaLogin/tela_login.html';
        return;
    }

    try {
        if (loadingState) loadingState.style.display = 'block';
        if (container) container.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';

        const resp = await fetch('http://localhost:3000/api/certificates/meus', {
            headers: { 'Authorization': `Bearer ${token}`, 'Cache-Control': 'no-store' }
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || 'Erro ao buscar certificados');

        const certificados = data.certificados || [];

        if (certificados.length === 0) {
            if (loadingState) loadingState.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        // Renderizar cartões estilo wallet
        const html = certificados.map(c => {
            const titulo = c.treinamento_titulo || 'Treinamento';
            const dataEmissao = c.dataEmissao ? new Date(c.dataEmissao).toLocaleDateString('pt-BR') : '-';
            const carga = c.cargaHoraria ? `${c.cargaHoraria}h` : '-';
            const codigo = c.codigo;
            const verifyUrl = `http://localhost:3000/api/certificates/verify/${codigo}`;
            const categoria = c.categoria || 'Geral';
            
            // Ícones por categoria
            const categoriaIcons = {
                'seguranca': 'fa-shield-halved',
                'operacional': 'fa-train',
                'administrativo': 'fa-briefcase',
                'tecnico': 'fa-screwdriver-wrench',
                'gerencial': 'fa-user-tie'
            };
            const categoriaIcon = categoriaIcons[categoria.toLowerCase()] || 'fa-award';
            
            // Badge de status (válido ou expirado se tiver data de validade)
            let validadeBadge = '';
            if (c.validoAte) {
                const hoje = new Date();
                const validoAte = new Date(c.validoAte);
                const expirado = hoje > validoAte;
                validadeBadge = `<span class="badge-${expirado ? 'expirado' : 'valido'}">
                    <i class="fa-solid fa-${expirado ? 'clock' : 'check-circle'}"></i>
                    ${expirado ? 'Expirado' : 'Válido até'} ${new Date(c.validoAte).toLocaleDateString('pt-BR')}
                </span>`;
            } else {
                validadeBadge = `<span class="badge-valido">
                    <i class="fa-solid fa-infinity"></i>
                    Válido permanentemente
                </span>`;
            }
            
            return `
                <div class="certificado-item">
                    <div class="certificado-header">
                        <div class="certificado-icon">
                            <i class="fa-solid ${categoriaIcon}"></i>
                        </div>
                        <div class="certificado-info">
                            <h3 class="certificado-title">${titulo}</h3>
                            <span class="certificado-categoria">${categoria}</span>
                        </div>
                    </div>
                    <div class="certificado-details">
                        <div class="detail-item">
                            <strong>Emissão:</strong>
                            <span>${dataEmissao}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Carga Horária:</strong>
                            <span>${carga}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Código:</strong>
                            <span class="codigo">${codigo}</span>
                        </div>
                        ${c.aproveitamento ? `
                        <div class="detail-item">
                            <strong>Aproveitamento:</strong>
                            <span class="nota">${parseFloat(c.aproveitamento).toFixed(1)}%</span>
                        </div>
                        ` : ''}
                    </div>
                    ${validadeBadge}
                    ${c.observacoes && !c.observacoes.toLowerCase().includes('70%') ? `<div class="certificado-observacoes"><i class="fa-solid fa-info-circle"></i> ${c.observacoes}</div>` : ''}
                    <div class="certificado-actions">
                        <a href="${verifyUrl}" target="_blank" class="btn-verificar">
                            <i class="fa-solid fa-qrcode"></i> Verificar
                        </a>
                        <button onclick="compartilharCertificado('${codigo}')" class="btn-compartilhar" title="Compartilhar">
                            <i class="fa-solid fa-share-nodes"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
        if (loadingState) loadingState.style.display = 'none';
        container.style.display = 'block';
    } catch (error) {
        console.error('Erro ao carregar certificados:', error);
        if (loadingState) loadingState.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
    }
}


// Função para fazer logout
function logout() {
    if (confirm('Tem certeza que deseja sair do sistema?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '../TelaLogin/tela_login.html';
    }
}


// Função para compartilhar certificado
function compartilharCertificado(codigo) {
    const url = `http://localhost:3000/api/certificates/verify/${codigo}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Meu Certificado de Treinamento',
            text: 'Veja meu certificado de treinamento do Metrô SP',
            url: url
        }).catch(err => console.log('Erro ao compartilhar:', err));
    } else {
        // Fallback: copiar link para área de transferência
        navigator.clipboard.writeText(url).then(() => {
            alert('Link copiado para área de transferência! Cole onde quiser compartilhar.');
        }).catch(() => {
            // Último recurso: mostrar prompt
            prompt('Copie este link para compartilhar:', url);
        });
    }
}

// Atualizar automaticamente quando novo certificado for emitido
window.addEventListener('storage', (event) => {
    if (event.key === 'sync/trainings') {
        console.log('🔄 Sincronizando certificados...');
        carregarCertificados();
    }
});

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    if (verificarAutenticacao()) {
        carregarCertificados();
    }
});
