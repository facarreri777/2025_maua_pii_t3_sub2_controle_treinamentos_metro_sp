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

// Função para cadastrar colaborador
document.getElementById('cadastroForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const colaborador = Object.fromEntries(formData);
    
    // Validação básica
    if (colaborador.senha !== colaborador.confirmarSenha) {
        alert('As senhas não coincidem!');
        return;
    }
    
    // Validar RG Metro (7 dígitos)
    if (!/^[0-9]{7}$/.test(colaborador.rgMetro)) {
        alert('RG Metro deve ter exatamente 7 dígitos!');
        return;
    }
    
    try {
        // Mostrar loading
        const submitBtn = this.querySelector('button[type="submit"]');
        const btnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Cadastrando...';
        submitBtn.disabled = true;
        
        // Obter token
        const token = localStorage.getItem('token');
        
        // Enviar para API
        const response = await fetch('http://localhost:3000/api/auth/register-aluno', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                nome: colaborador.nome,
                rgMetro: colaborador.rgMetro,
                senha: colaborador.senha,
                email: colaborador.email || `${colaborador.rgMetro}@aluno.metro.sp.gov.br`,
                telefone: colaborador.telefone,
                cargo: colaborador.cargo,
                setor: colaborador.setor
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Aluno cadastrado no banco de dados:', data.aluno);
            
            // Mostrar toast de sucesso
            showToast('Colaborador cadastrado com sucesso no banco de dados!');
            
            // Limpar formulário
            this.reset();
            
            // Atualizar lista
            await carregarColaboradores();
            await atualizarEstatisticas();
        } else {
            console.error('❌ Erro ao cadastrar:', data.error);
            alert('Erro ao cadastrar: ' + data.error);
        }
        
        // Restaurar botão
        submitBtn.innerHTML = btnText;
        submitBtn.disabled = false;
        
    } catch (error) {
        console.error('❌ Erro ao cadastrar colaborador:', error);
        alert('Erro ao conectar com o servidor. Verifique se o backend está rodando.');
        
        // Restaurar botão
        const submitBtn = this.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Cadastrar Colaborador';
        submitBtn.disabled = false;
    }
});

// Função para mostrar toast
function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        z-index: 1000;
        font-weight: 600;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        document.body.removeChild(toast);
    }, 3000);
}

// Função para carregar colaboradores
async function carregarColaboradores() {
    const container = document.getElementById('colaboradoresLista');
    
    try {
        // Mostrar loading
        container.innerHTML = '<p class="sem-colaboradores"><i class="fa-solid fa-spinner fa-spin"></i> Carregando colaboradores...</p>';
        
        // Obter token
        const token = localStorage.getItem('token');
        
        // Buscar alunos da API
        const response = await fetch('http://localhost:3000/api/users/alunos', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Erro ao buscar colaboradores');
        }
        
        const data = await response.json();
        const colaboradores = data.alunos || [];
        
        console.log('✅ Colaboradores carregados do banco:', colaboradores.length);
        
        if (colaboradores.length === 0) {
            container.innerHTML = '<p class="sem-colaboradores">Nenhum colaborador cadastrado ainda.</p>';
            return;
        }
        
        container.innerHTML = colaboradores.map(colaborador => {
            const dataCadastro = new Date(colaborador.createdAt || Date.now()).toLocaleDateString('pt-BR');
            return `
            <div class="colaborador-item" data-id="${colaborador.id}">
                <div class="colaborador-info">
                    <h3>${colaborador.nome}</h3>
                    <p><strong>RG Metro:</strong> ${colaborador.rgMetro}</p>
                    <p><strong>Matrícula:</strong> ${colaborador.matricula || 'N/A'}</p>
                    <p><strong>Email:</strong> ${colaborador.email}</p>
                    <p><strong>Cargo:</strong> ${colaborador.cargo}</p>
                    <p><strong>Setor:</strong> ${colaborador.setor}</p>
                    <p><strong>Data:</strong> ${dataCadastro}</p>
                </div>
                <div class="colaborador-actions">
                    <button class="btn-remover" onclick="removerColaborador('${colaborador.id}', '${colaborador.nome}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `}).join('');
    } catch (error) {
        console.error('❌ Erro ao carregar colaboradores:', error);
        container.innerHTML = '<p class="sem-colaboradores">Erro ao carregar colaboradores. Verifique se o backend está rodando.</p>';
    }
}

// Função para remover colaborador (chama API)
async function removerColaborador(userId, nome) {
    if (!userId) return;
    if (!confirm(`Remover o colaborador "${nome}"?`)) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Erro ao deletar usuário');
        }

        showToast('Colaborador removido com sucesso!');
        await carregarColaboradores();
        atualizarEstatisticas();
    } catch (err) {
        console.error('❌ Erro ao remover colaborador:', err);
        alert('Erro ao remover colaborador: ' + err.message);
    }
}

// Função para buscar colaboradores
function buscarColaboradores() {
    const termo = document.getElementById('campoBusca').value.toLowerCase();
    const colaboradores = JSON.parse(localStorage.getItem('alunos_cadastrados') || '[]');
    const colaboradoresFiltrados = colaboradores.filter(c => 
        c.nome.toLowerCase().includes(termo) || 
        c.usuario.includes(termo)
    );
    
    const container = document.getElementById('colaboradoresLista');
    
    if (colaboradoresFiltrados.length === 0) {
        container.innerHTML = '<p class="sem-colaboradores">Nenhum colaborador encontrado.</p>';
        return;
    }
    
    container.innerHTML = colaboradoresFiltrados.map(colaborador => `
        <div class="colaborador-item">
            <div class="colaborador-info">
                <h3>${colaborador.nome}</h3>
                <p><strong>RG Metro:</strong> ${colaborador.usuario}</p>
                <p><strong>Email:</strong> ${colaborador.email}</p>
                <p><strong>Cargo:</strong> ${colaborador.cargo}</p>
                <p><strong>Setor:</strong> ${colaborador.setor}</p>
                <p><strong>Data:</strong> ${colaborador.dataCadastro}</p>
            </div>
            <div class="colaborador-actions">
                <button class="btn-remover" onclick="removerColaborador('${colaborador.usuario}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Função para alternar visibilidade da lista
function toggleColaboradores() {
    const lista = document.getElementById('colaboradoresLista');
    const busca = document.getElementById('buscaContainer');
    const botao = document.querySelector('.btn-toggle');
    
    if (lista.style.display === 'none' || lista.style.display === '') {
        lista.style.display = 'block';
        busca.style.display = 'block';
        botao.innerHTML = '<i class="fa-solid fa-chevron-up"></i> Ocultar Lista';
    } else {
        lista.style.display = 'none';
        busca.style.display = 'none';
        botao.innerHTML = '<i class="fa-solid fa-chevron-down"></i> Ver Colaboradores Cadastrados';
        document.getElementById('campoBusca').value = '';
    }
}

// Função para atualizar estatísticas
function atualizarEstatisticas() {
    const colaboradores = JSON.parse(localStorage.getItem('alunos_cadastrados') || '[]');
    const totalColaboradores = colaboradores.length;
    
    document.getElementById('totalColaboradores').textContent = totalColaboradores;
}

// Função para limpar formulário
function limparFormulario() {
    document.getElementById('cadastroForm').reset();
}

// Função para fazer logout
function logout() {
    if (confirm('Tem certeza que deseja sair do sistema?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '../TelaLogin/tela_login.html';
    }
}

// Função para verificar autenticação (modo offline)
function verificarAutenticacao() {
    return true;
}

// Inicializar página
window.addEventListener('load', function() {
    verificarAutenticacao();
    carregarColaboradores();
    atualizarEstatisticas();
});