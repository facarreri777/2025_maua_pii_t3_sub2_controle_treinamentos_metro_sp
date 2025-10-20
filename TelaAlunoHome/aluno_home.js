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

// Função para verificar autenticação (modo offline)
function verificarAutenticacao() {
    return true;
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

// Carregar dados do aluno
function carregarDadosAluno() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.nome && user.nome.trim() !== '') {
        document.querySelector('h1').textContent = `Seja Bem-Vindo, ${user.nome}!`;
    } else {
        document.querySelector('h1').textContent = 'Seja Bem-Vindo!';
    }
}

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar dados de exemplo se necessário
    inicializarDadosExemplo();
    
    verificarAutenticacao();
    carregarDadosAluno();
});