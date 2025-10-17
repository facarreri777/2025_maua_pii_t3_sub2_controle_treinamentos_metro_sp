// VLibras Widget
new window.VLibras.Widget('https://vlibras.gov.br/app');

// Função para cadastrar colaborador
document.getElementById('cadastroForm').addEventListener('submit', function(e) {
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
    
    // Salvar no localStorage
    const colaboradores = JSON.parse(localStorage.getItem('alunos_cadastrados') || '[]');
    const novoColaborador = {
        id: Date.now(),
        nome: colaborador.nome,
        usuario: colaborador.rgMetro,
        senha: colaborador.senha,
        email: colaborador.email,
        telefone: colaborador.telefone,
        cargo: colaborador.cargo,
        setor: colaborador.setor,
        tipo: 'aluno',
        dataCadastro: new Date().toLocaleDateString('pt-BR'),
        treinamentos: []
    };
    
    colaboradores.push(novoColaborador);
    localStorage.setItem('alunos_cadastrados', JSON.stringify(colaboradores));
    
    // Mostrar toast de sucesso
    showToast('Colaborador cadastrado com sucesso!');
    
    // Limpar formulário
    this.reset();
    
    // Atualizar lista
    carregarColaboradores();
    atualizarEstatisticas();
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
function carregarColaboradores() {
    const colaboradores = JSON.parse(localStorage.getItem('alunos_cadastrados') || '[]');
    const container = document.getElementById('colaboradoresLista');
    
    if (colaboradores.length === 0) {
        container.innerHTML = '<p class="sem-colaboradores">Nenhum colaborador cadastrado ainda.</p>';
        return;
    }
    
    container.innerHTML = colaboradores.map(colaborador => `
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

// Função para remover colaborador
function removerColaborador(rgMetro) {
    if (confirm('Tem certeza que deseja remover este colaborador?')) {
        const colaboradores = JSON.parse(localStorage.getItem('alunos_cadastrados') || '[]');
        const colaboradoresFiltrados = colaboradores.filter(c => c.usuario !== rgMetro);
        localStorage.setItem('alunos_cadastrados', JSON.stringify(colaboradoresFiltrados));
        
        showToast('Colaborador removido com sucesso!');
        carregarColaboradores();
        atualizarEstatisticas();
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
        window.location.href = '../2025_maua_pii_t3_sub2_controle_treinamentos_metro_sp-tela_login/tela_login.html';
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