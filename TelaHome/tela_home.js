// VLibras Widget
new window.VLibras.Widget('https://vlibras.gov.br/app');

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
