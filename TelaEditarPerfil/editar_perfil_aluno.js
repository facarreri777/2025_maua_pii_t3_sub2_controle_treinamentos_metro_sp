// ===== TELA DE EDITAR PERFIL DO ALUNO - FUNCIONALIDADES SIMPLIFICADAS =====

// Dados do perfil atual (vazios - serão preenchidos quando cadastrados)
let perfilAtual = {
    nome: "",
    rgMetro: "",
    email: "",
    telefone: "",
    cargo: "",
    setor: "",
    dataAdmissao: "",
    matricula: "",
    ultimaAtualizacao: ""
};

// Inicialização da página
document.addEventListener('DOMContentLoaded', function() {
    carregarDadosDoSistema();
    carregarDadosPerfil();
    configurarEventos();
    inicializarVLibras();
});

// Carrega dados do sistema (localStorage/sessão)
function carregarDadosDoSistema() {
    // Carrega dados do usuário logado do localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const colaboradores = JSON.parse(localStorage.getItem('colaboradoresCadastrados') || '[]');
    
    // Busca o colaborador correspondente ao usuário logado
    const colaborador = colaboradores.find(c => c.id === user.id);
    
    if (colaborador) {
        perfilAtual = {
            nome: colaborador.nome || "",
            rgMetro: colaborador.rgMetro || "",
            email: colaborador.email || "",
            telefone: colaborador.telefone || "",
            cargo: colaborador.cargo || "",
            setor: colaborador.setor || "",
            dataAdmissao: colaborador.dataAdmissao || "",
            matricula: colaborador.matricula || "",
            ultimaAtualizacao: colaborador.ultimaAtualizacao || new Date().toISOString(),
            fotoPerfil: colaborador.fotoPerfil || ""
        };
    } else {
        // Se não encontrar, usa dados do user básico
        perfilAtual = {
            nome: user.nome || "",
            rgMetro: user.rgMetro || "",
            email: user.email || "",
            telefone: user.telefone || "",
            cargo: user.cargo || "",
            setor: user.setor || "",
            dataAdmissao: user.dataAdmissao || "",
            matricula: user.matricula || "",
            ultimaAtualizacao: new Date().toISOString(),
            fotoPerfil: user.fotoPerfil || ""
        };
    }
}

// Carrega os dados do perfil nos campos do formulário
function carregarDadosPerfil() {
    // Atualiza as informações pessoais (somente visualização)
    document.getElementById('displayNome').textContent = perfilAtual.nome || '-';
    document.getElementById('displayRgMetro').textContent = perfilAtual.rgMetro || '-';
    document.getElementById('displayEmail').textContent = perfilAtual.email || '-';
    document.getElementById('displayTelefone').textContent = perfilAtual.telefone || '-';
    
    // Atualiza as informações profissionais (somente visualização)
    document.getElementById('displayCargo').textContent = perfilAtual.cargo || '-';
    document.getElementById('displaySetor').textContent = perfilAtual.setor || '-';
    document.getElementById('displayDataAdmissao').textContent = perfilAtual.dataAdmissao || '-';
    document.getElementById('displayMatricula').textContent = perfilAtual.matricula || '-';
    
    // Carrega foto de perfil se existir
    if (perfilAtual.fotoPerfil) {
        document.getElementById('photoPreview').src = perfilAtual.fotoPerfil;
    }
}

// Converte código do setor para nome legível
function obterNomeSetor(codigoSetor) {
    const setores = {
        'operacao': 'Operação',
        'manutencao': 'Manutenção',
        'seguranca': 'Segurança',
        'administrativo': 'Administrativo'
    };
    return setores[codigoSetor] || '-';
}

// Formata data para exibição
function formatarData(data) {
    if (!data) return '-';
    const dataObj = new Date(data);
    return dataObj.toLocaleDateString('pt-BR');
}

// Configura eventos da página
function configurarEventos() {
    // Evento do formulário de edição
    document.getElementById('editarPerfilForm').addEventListener('submit', function(e) {
        e.preventDefault();
        salvarAlteracoes();
    });

    // Validação em tempo real dos campos
    const campos = document.querySelectorAll('input, select');
    campos.forEach(campo => {
        campo.addEventListener('blur', function() {
            validarCampo(this);
        });
    });

    // Validação da confirmação de senha
    document.getElementById('confirmarNovaSenha').addEventListener('input', function() {
        validarConfirmacaoSenha();
    });
}

// Valida um campo específico
function validarCampo(campo) {
    const valor = campo.value.trim();
    const nome = campo.name;
    
    // Remove classes de erro anteriores
    campo.classList.remove('error');
    
    // Validações específicas
    switch(nome) {
        case 'nome':
            if (valor.length < 3) {
                mostrarErro(campo, 'Nome deve ter pelo menos 3 caracteres');
                return false;
            }
            break;
            
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (valor && !emailRegex.test(valor)) {
                mostrarErro(campo, 'Email inválido');
                return false;
            }
            break;
            
        case 'telefone':
            if (valor) {
                const telefoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
                if (!telefoneRegex.test(valor)) {
                    mostrarErro(campo, 'Telefone deve estar no formato (11) 99999-9999');
                    return false;
                }
            }
            break;
    }
    
    return true;
}

// Valida a confirmação de senha
function validarConfirmacaoSenha() {
    const novaSenha = document.getElementById('novaSenha').value;
    const confirmarSenha = document.getElementById('confirmarNovaSenha').value;
    const campoConfirmacao = document.getElementById('confirmarNovaSenha');
    
    if (confirmarSenha && novaSenha !== confirmarSenha) {
        mostrarErro(campoConfirmacao, 'As senhas não coincidem');
        return false;
    } else {
        campoConfirmacao.classList.remove('error');
        return true;
    }
}

// Mostra erro em um campo
function mostrarErro(campo, mensagem) {
    campo.classList.add('error');
    
    // Remove mensagem de erro anterior
    const erroAnterior = campo.parentNode.querySelector('.erro-mensagem');
    if (erroAnterior) {
        erroAnterior.remove();
    }
    
    // Adiciona nova mensagem de erro
    const erroDiv = document.createElement('div');
    erroDiv.className = 'erro-mensagem';
    erroDiv.style.color = '#dc3545';
    erroDiv.style.fontSize = '11px';
    erroDiv.style.marginTop = '4px';
    erroDiv.textContent = mensagem;
    
    campo.parentNode.appendChild(erroDiv);
}

// Salva as alterações do perfil
function salvarAlteracoes() {
    // Valida todos os campos obrigatórios
    if (!validarFormulario()) {
        mostrarToast('Por favor, corrija os erros antes de salvar', 'error');
        return;
    }
    
    // Coleta os dados do formulário
    const dadosFormulario = {
        nome: document.getElementById('nome').value.trim(),
        email: document.getElementById('email').value.trim(),
        telefone: document.getElementById('telefone').value.trim()
    };
    
    // Verifica se há alteração de senha
    const senhaAtual = document.getElementById('senhaAtual').value;
    const novaSenha = document.getElementById('novaSenha').value;
    const confirmarNovaSenha = document.getElementById('confirmarNovaSenha').value;
    
    if (novaSenha || confirmarNovaSenha) {
        if (!senhaAtual) {
            mostrarToast('Para alterar a senha, informe a senha atual', 'error');
            return;
        }
        
        if (novaSenha !== confirmarNovaSenha) {
            mostrarToast('As senhas não coincidem', 'error');
            return;
        }
        
        if (novaSenha.length < 6) {
            mostrarToast('A nova senha deve ter pelo menos 6 caracteres', 'error');
            return;
        }
        
        dadosFormulario.novaSenha = novaSenha;
    }
    
    // Simula salvamento (em produção seria uma chamada AJAX)
    console.log('Salvando dados:', dadosFormulario);
    
    // Atualiza o perfil atual
    Object.assign(perfilAtual, dadosFormulario);
    perfilAtual.ultimaAtualizacao = new Date().toISOString().split('T')[0];
    
    // Limpa os campos de senha
    document.getElementById('senhaAtual').value = '';
    document.getElementById('novaSenha').value = '';
    document.getElementById('confirmarNovaSenha').value = '';
    
    // Mostra mensagem de sucesso
    mostrarToast('Perfil atualizado com sucesso!', 'success');
    
    // Simula redirecionamento após 2 segundos
    setTimeout(() => {
        if (confirm('Deseja voltar ao dashboard?')) {
            window.location.href = '../TelaHomeAluno/aluno_home.html';
        }
    }, 2000);
}

// Valida todo o formulário
function validarFormulario() {
    let valido = true;
    
    // Campos obrigatórios
    const camposObrigatorios = ['nome', 'email'];
    camposObrigatorios.forEach(nome => {
        const campo = document.querySelector(`[name="${nome}"]`);
        if (!campo.value.trim()) {
            mostrarErro(campo, 'Este campo é obrigatório');
            valido = false;
        } else {
            if (!validarCampo(campo)) {
                valido = false;
            }
        }
    });
    
    // Validação da confirmação de senha
    if (!validarConfirmacaoSenha()) {
        valido = false;
    }
    
    return valido;
}

// Limpa o formulário
function limparFormulario() {
    if (confirm('Tem certeza que deseja limpar todos os dados? As alterações não salvas serão perdidas.')) {
        document.getElementById('editarPerfilForm').reset();
        carregarDadosPerfil(); // Recarrega os dados originais
        
        // Remove todas as mensagens de erro
        document.querySelectorAll('.erro-mensagem').forEach(erro => erro.remove());
        document.querySelectorAll('.error').forEach(campo => campo.classList.remove('error'));
        
        mostrarToast('Formulário limpo', 'warning');
    }
}


// Logout do sistema
function logout() {
    if (confirm('Tem certeza que deseja sair do sistema?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('usuarioLogado');
        sessionStorage.clear();
        
        // Redireciona para a tela de login
        window.location.href = '../TelaLogin/tela_login.html';
    }
}

// Função para remover foto de perfil
function removerFoto() {
    if (confirm('Tem certeza que deseja remover a foto de perfil?')) {
        // Remove a foto do perfil atual
        perfilAtual.fotoPerfil = "";
        
        // Volta para a imagem padrão
        document.getElementById('photoPreview').src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjE1IiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0yNSA3NUMyNSA2NS4zMzU4IDMyLjMzNTggNTggNDIgNThINThDNjcuNjY0MiA1OCA3NSA2NS4zMzU4IDc1IDc1VjEwMEgyNVY3NVoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+";
        
        // Atualiza no localStorage
        const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado') || '{}');
        usuarioLogado.fotoPerfil = "";
        localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
        
        mostrarToast('Foto removida com sucesso!', 'success');
    }
}

// Configura upload de foto
document.addEventListener('DOMContentLoaded', function() {
    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
        photoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('photoPreview').src = e.target.result;
                    perfilAtual.fotoPerfil = e.target.result;
                    
                    // Salva no localStorage
                    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado') || '{}');
                    usuarioLogado.fotoPerfil = e.target.result;
                    localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
                    
                    mostrarToast('Foto carregada com sucesso!', 'success');
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

// Adiciona estilos para campos com erro
const style = document.createElement('style');
style.textContent = `
    .error {
        border-color: #dc3545 !important;
        box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1) !important;
    }
    
    .erro-mensagem {
        color: #dc3545;
        font-size: 11px;
        margin-top: 4px;
        display: block;
    }
`;
document.head.appendChild(style);

// ===== INICIALIZAÇÃO DO VLIBRAS =====
function inicializarVLibras() {
    // Verifica se o VLibras já foi carregado
    if (typeof window.VLibras !== 'undefined') {
        try {
            // Inicializa o VLibras
            new window.VLibras.Widget('https://vlibras.gov.br/app/');
            console.log('VLibras inicializado com sucesso');
        } catch (error) {
            console.error('Erro ao inicializar VLibras:', error);
        }
    } else {
        // Se o VLibras não foi carregado ainda, tenta novamente após um delay
        setTimeout(() => {
            if (typeof window.VLibras !== 'undefined') {
                try {
                    new window.VLibras.Widget('https://vlibras.gov.br/app/');
                    console.log('VLibras inicializado com sucesso (retry)');
                } catch (error) {
                    console.error('Erro ao inicializar VLibras (retry):', error);
                }
            } else {
                console.warn('VLibras não foi carregado. Verifique a conexão com a internet.');
            }
        }, 1000);
    }
}