// ===== INICIALIZAÇÃO DO VLIBRAS =====
function inicializarVLibras() {
    // Verifica se o VLibras já foi carregado
    if (typeof window.VLibras !== 'undefined') {
        try {
            // Inicializa o VLibras
            new window.VLibras.Widget('https://vlibras.gov.br/app');
            console.log('VLibras inicializado com sucesso');
        } catch (error) {
            console.error('Erro ao inicializar VLibras:', error);
        }
    } else {
        // Se o VLibras não foi carregado ainda, tenta novamente após um delay
        setTimeout(() => {
            if (typeof window.VLibras !== 'undefined') {
                try {
                    new window.VLibras.Widget('https://vlibras.gov.br/app');
                    console.log('VLibras inicializado com sucesso (retry)');
                } catch (error) {
                    console.error('Erro ao inicializar VLibras (retry):', error);
                }
            } else {
                console.warn('VLibras não foi carregado. Verifique a conexão com a internet.');
                // Tentar uma vez mais após outro delay
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

// Inicializar VLibras quando a página carregar
window.addEventListener('load', function() {
    inicializarVLibras();
});

// Também tentar inicializar quando o script do VLibras carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarVLibras);
} else {
    inicializarVLibras();
}

// Função para fazer logout
async function logout() {
    if (confirm('Tem certeza que deseja sair do sistema?')) {
        try {
            // Tentar logout no backend
            const token = localStorage.getItem('token');
            if (token) {
                await fetch('http://localhost:3000/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (error) {
            console.log('Logout offline');
        }
        
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '../TelaLogin/tela_login.html';
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

// Inicializar página
window.addEventListener('load', async function() {
    await verificarAutenticacao();
});
