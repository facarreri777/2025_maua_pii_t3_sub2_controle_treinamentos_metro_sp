// Variável para armazenar o tipo de usuário selecionado
let selectedUserType = 'aluno';

// Função para limpar inputs
function limparInputs() {
    document.querySelector('input[type="text"]').value = '';
    document.querySelector('input[type="password"]').value = '';
}

// Seleção de tipo de usuário
const userTypeButtons = document.querySelectorAll('.user-type-btn');
const inputField = document.querySelector('input[type="text"]');

userTypeButtons.forEach(button => {
    button.addEventListener('click', function() {
        // Remove a classe active de todos os botões
        userTypeButtons.forEach(btn => btn.classList.remove('active'));
        // Adiciona a classe active ao botão clicado
        this.classList.add('active');
        // Atualiza o tipo de usuário selecionado
        selectedUserType = this.getAttribute('data-type');
        
        // Atualiza o placeholder baseado no tipo
        if (selectedUserType === 'aluno') {
            inputField.placeholder = 'RG Metro (7 dígitos)';
            inputField.maxLength = 7;
        } else if (selectedUserType === 'instrutor') {
            inputField.placeholder = 'Email';
            inputField.removeAttribute('maxlength');
        }
        
        // Limpa o campo ao trocar tipo
        limparInputs();
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
        // Preparar dados de login baseado no tipo de usuário
        let loginData;
        if (selectedUserType === 'aluno') {
            // Aluno usa RG Metro
            loginData = {
                rgMetro: username,
                senha: password,
                tipoLogin: 'aluno'
            };
        } else if (selectedUserType === 'instrutor') {
            // Instrutor usa email ou username
            loginData = {
                email: username,
                senha: password,
                tipoLogin: 'instrutor'
            };
        }

        // Tentar login no backend
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData)
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
        alert('Falha ao conectar ao servidor. Verifique se o backend está rodando em http://localhost:3000');
        limparInputs();
    }
});

// Permitir login com Enter
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('loginBtn').click();
    }
});


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

// Inicializar VLibras quando a página carregar
window.addEventListener('load', function() {
    limparInputs();
    inicializarVLibras();
});

// Também tentar inicializar quando o script do VLibras carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarVLibras);
} else {
    inicializarVLibras();
}
