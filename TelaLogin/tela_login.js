// Variável para armazenar o tipo de usuário selecionado
let selectedUserType = 'aluno';

// Função para limpar inputs
function limparInputs() {
    document.querySelector('input[type="text"]').value = '';
    document.querySelector('input[type="password"]').value = '';
}

// Seleção de tipo de usuário
const userTypeButtons = document.querySelectorAll('.user-type-btn');
userTypeButtons.forEach(button => {
    button.addEventListener('click', function() {
        // Remove a classe active de todos os botões
        userTypeButtons.forEach(btn => btn.classList.remove('active'));
        // Adiciona a classe active ao botão clicado
        this.classList.add('active');
        // Atualiza o tipo de usuário selecionado
        selectedUserType = this.getAttribute('data-type');
        // Removido: limpeza automática ao trocar tipo
    });
});

// Função de login
document.getElementById('loginBtn').addEventListener('click', async function() {
    const username = document.querySelector('input[type="text"]').value;
    const password = document.querySelector('input[type="password"]').value;

    // Validação básica
    if (!username || !password) {
        alert('Por favor, preencha todos os campos!');
        limparInputs();
        return;
    }

    try {
        // Tentar login no backend
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: username,
                senha: password
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Login bem-sucedido
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Redirecionar baseado no tipo de usuário
            if (data.user.tipo === 'aluno') {
                window.location.href = '../TelaHomeAluno/aluno_home.html';
            } else if (data.user.tipo === 'instrutor' || data.user.tipo === 'admin') {
                window.location.href = '../TelaHome/tela_home.html';
            }
        } else {
            // Login falhou
            alert(data.error || 'Erro no login');
            limparInputs();
        }
    } catch (error) {
        console.error('Erro de conexão:', error);
        
        // Fallback para sistema local se backend não estiver rodando
        if (selectedUserType === 'aluno') {
            const alunosCadastrados = JSON.parse(localStorage.getItem('alunos_cadastrados') || '[]');
            const aluno = alunosCadastrados.find(a => a.usuario === username && a.senha === password);
            
            if (aluno) {
                localStorage.setItem('token', 'aluno_token_' + Date.now());
                localStorage.setItem('user', JSON.stringify(aluno));
                window.location.href = '../TelaHomeAluno/aluno_home.html';
            } else {
                alert('Usuário ou senha inválidos! Verifique se você foi cadastrado pelo instrutor.');
                limparInputs();
            }
        } else if (selectedUserType === 'instrutor') {
            if (username === 'instrutor' && password === 'metro123') {
                localStorage.setItem('token', 'instrutor_token_' + Date.now());
                localStorage.setItem('user', JSON.stringify({
                    id: 'instrutor',
                    nome: 'Instrutor',
                    tipo: 'instrutor',
                    email: 'instrutor@metro.sp.gov.br'
                }));
                window.location.href = '../TelaHome/tela_home.html';
            } else {
                alert('Credenciais do instrutor inválidas! Use: usuário="instrutor", senha="metro123"');
                limparInputs();
            }
        }
    }
});

// Permitir login com Enter
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('loginBtn').click();
    }
});

// Limpar campos quando a página carrega
window.addEventListener('load', function() {
    limparInputs();
});
