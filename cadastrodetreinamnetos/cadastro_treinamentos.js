// VLibras Widget
new window.VLibras.Widget('https://vlibras.gov.br/app');

// Variáveis globais
let treinamentosCadastrados = [];
let treinamentosConcluidos = [];
let proximoId = 1;
let abaAtual = 'cadastrados';

// Função para fazer logout
function logout() {
    if (confirm('Tem certeza que deseja sair do sistema?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '../2025_maua_pii_t3_sub2_controle_treinamentos_metro_sp-tela_login/tela_login.html';
    }
}

// Inicializar dados vazios
function inicializarDadosVazios() {
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

// Verificar autenticação (modo offline)
async function verificarAutenticacao() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    console.log('Token:', token);
    console.log('User:', user);
    
    // Sempre permitir acesso - não redirecionar nunca
    console.log('Permitindo acesso offline');
    return true;
}

// Carregar treinamentos cadastrados
function carregarTreinamentos() {
    // Carregar do localStorage
    const treinamentosSalvos = localStorage.getItem('treinamentosCadastrados');
    if (treinamentosSalvos) {
        treinamentosCadastrados = JSON.parse(treinamentosSalvos);
        // Atualizar próximo ID
        if (treinamentosCadastrados.length > 0) {
            proximoId = Math.max(...treinamentosCadastrados.map(t => t.id)) + 1;
        }
    }
    
    renderizarTreinamentos();
}

// Salvar treinamentos no localStorage
function salvarTreinamentos() {
    localStorage.setItem('treinamentosCadastrados', JSON.stringify(treinamentosCadastrados));
    localStorage.setItem('treinamentosConcluidos', JSON.stringify(treinamentosConcluidos));
}

// Carregar treinamentos concluídos
function carregarTreinamentosConcluidos() {
    const concluidos = localStorage.getItem('treinamentosConcluidos');
    if (concluidos) {
        treinamentosConcluidos = JSON.parse(concluidos);
    }
}

// Alternar entre abas
function alternarAba(aba) {
    // Atualizar botões das abas
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${aba}`).classList.add('active');
    
    // Atualizar conteúdo das abas
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`content-${aba}`).classList.add('active');
    
    abaAtual = aba;
    
    // Atualizar contadores
    atualizarContadores();
    
    // Renderizar conteúdo da aba ativa
    if (aba === 'cadastrados') {
        renderizarTreinamentos();
    } else if (aba === 'concluir') {
        atualizarTreinamentosConclusao();
    } else if (aba === 'concluidos') {
        renderizarTreinamentosConcluidos();
    }
}

// Atualizar contadores das abas
function atualizarContadores() {
    document.getElementById('count-cadastrados').textContent = treinamentosCadastrados.length;
    document.getElementById('count-concluir').textContent = treinamentosCadastrados.length;
    document.getElementById('count-concluidos').textContent = treinamentosConcluidos.length;
}

// Calcular número de alunos inscritos em um treinamento
function getAlunosInscritos(treinamentoId) {
    const certificados = JSON.parse(localStorage.getItem('certificadosDisponiveis') || '[]');
    return certificados.filter(c => c.treinamentoId == treinamentoId).length;
}

// Função de notificação manual como fallback
function mostrarNotificacaoManual(type, title, message) {
    // Criar container se não existir
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
    
    // Criar notificação
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Ícones para cada tipo
    const icons = {
        success: 'fa-check-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle',
        error: 'fa-times-circle'
    };
    
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fa-solid ${icons[type] || icons.info}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fa-solid fa-times"></i>
        </button>
    `;
    
    container.appendChild(notification);
    
    // Trigger da animação
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto-remove após 6 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 400);
        }
    }, 6000);
}

// Atualizar select de treinamentos para conclusão
function atualizarTreinamentosConclusao() {
    const select = document.getElementById('treinamento-conclusao');
    const emptyState = document.getElementById('emptyConcluirMessage');
    
    if (!select) return;
    
    // Limpar opções existentes
    select.innerHTML = '<option value="">Selecione um treinamento</option>';
    
    if (treinamentosCadastrados.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Adicionar treinamentos disponíveis
    treinamentosCadastrados.forEach(treinamento => {
        const option = document.createElement('option');
        option.value = treinamento.id;
        option.textContent = `${treinamento.titulo} - ${treinamento.categoria}`;
        select.appendChild(option);
    });
}

// Concluir treinamento e emitir certificado
function concluirTreinamento() {
    const treinamentoId = document.getElementById('treinamento-conclusao').value;
    
    if (!treinamentoId) {
        mostrarAlerta('error', 'Erro', 'Selecione um treinamento.');
        return;
    }
    
    // Buscar treinamento
    const treinamentoIndex = treinamentosCadastrados.findIndex(t => t.id == treinamentoId);
    if (treinamentoIndex === -1) {
        mostrarAlerta('error', 'Erro', 'Treinamento não encontrado.');
        return;
    }
    
    const treinamento = treinamentosCadastrados[treinamentoIndex];
    
    // Confirmar conclusão
    if (!confirm(`Deseja concluir o treinamento "${treinamento.titulo}"?\n\nEsta ação irá:\n• Mover o treinamento para a aba "Concluídos"\n• Emitir um certificado automaticamente\n• Atualizar as estatísticas`)) {
        return;
    }
    
    // Criar certificado
    const certificado = {
        id: Date.now(),
        treinamentoId: treinamento.id,
        titulo: treinamento.titulo,
        categoria: treinamento.categoria,
        alunoRg: 'Sistema',
        dataConclusao: new Date().toLocaleDateString('pt-BR'),
        cargaHoraria: `${treinamento.duracao_horas} horas`,
        codigo: `CERT-${treinamento.categoria.toUpperCase().substring(0, 3)}-${Date.now().toString().slice(-6)}`,
        instrutor: treinamento.instrutor,
        dataEmissao: new Date().toISOString()
    };
    
    // Salvar certificado
    const certificadosExistentes = JSON.parse(localStorage.getItem('certificadosDisponiveis') || '[]');
    certificadosExistentes.push(certificado);
    localStorage.setItem('certificadosDisponiveis', JSON.stringify(certificadosExistentes));
    
    // Criar treinamento concluído com dados adicionais
    const treinamentoConcluido = {
        ...treinamento,
        aluno_rg: 'Sistema',
        aluno_nome: 'Sistema',
        data_conclusao: new Date().toISOString(),
        nota: Math.floor(Math.random() * 40) + 60, // Nota entre 60 e 100
        certificado_emitido: true,
        certificado_id: certificado.id
    };
    
    // Mover treinamento de cadastrados para concluídos
    treinamentosConcluidos.push(treinamentoConcluido);
    treinamentosCadastrados.splice(treinamentoIndex, 1);
    
    // Salvar no localStorage
    salvarTreinamentos();
    
    // Atualizar interfaces
    renderizarTreinamentos();
    renderizarTreinamentosConcluidos();
    atualizarContadores();
    atualizarTreinamentosConclusao();
    
    // Limpar formulário
    document.getElementById('treinamento-conclusao').value = '';
    
    // Mostrar notificação de sucesso com delay para garantir que apareça
    setTimeout(() => {
        if (window.notificationManager && typeof window.notificationManager.treinamentoConcluido === 'function') {
            window.notificationManager.treinamentoConcluido(treinamento.titulo);
        } else {
            mostrarNotificacaoManual('success', 'Treinamento Concluído!', `Parabéns! O treinamento "${treinamento.titulo}" foi concluído com sucesso e o certificado foi emitido automaticamente.`);
        }
    }, 300);
}

// Renderizar lista de treinamentos concluídos
function renderizarTreinamentosConcluidos() {
    const container = document.getElementById('treinamentosConcluidosList');
    const emptyState = document.getElementById('emptyConcluidosMessage');
    
    if (treinamentosConcluidos.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    container.innerHTML = treinamentosConcluidos.map(treinamento => {
        const dataConclusao = new Date(treinamento.data_conclusao).toLocaleDateString('pt-BR');
        
        return `
            <div class="treinamento-item concluido">
                <div class="treinamento-header">
                    <h3>${treinamento.titulo}</h3>
                    <span class="status-badge concluido">
                        <i class="fa-solid fa-check-circle"></i> Concluído
                    </span>
                </div>
                <div class="treinamento-details">
                    <div class="detail-item">
                        <span class="detail-label">Descrição</span>
                        <span class="detail-value">${treinamento.descricao}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Categoria</span>
                        <span class="detail-value">${treinamento.categoria}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Duração</span>
                        <span class="detail-value">${treinamento.duracao_horas}h</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Instrutor</span>
                        <span class="detail-value">${treinamento.instrutor}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Data de Conclusão</span>
                        <span class="detail-value">${dataConclusao}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Aluno</span>
                        <span class="detail-value">${treinamento.aluno_nome || 'N/A'}</span>
                    </div>
                </div>
                <div class="treinamento-actions">
                    <button class="btn btn-success" onclick="gerarCertificado(${treinamento.id})">
                        <i class="fa-solid fa-certificate"></i> Gerar Certificado
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Renderizar lista de treinamentos
function renderizarTreinamentos() {
    const container = document.getElementById('treinamentosList');
    const emptyState = document.getElementById('emptyMessage');
    
    if (treinamentosCadastrados.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    container.style.display = 'block';
    emptyState.style.display = 'none';
    
    container.innerHTML = treinamentosCadastrados.map(treinamento => {
        const statusClass = treinamento.ativo ? 'ativo' : 'inativo';
        const statusText = treinamento.ativo ? 'Ativo' : 'Inativo';
        
        return `
            <div class="treinamento-item">
                <div class="treinamento-header">
                    <h3 class="treinamento-title">${treinamento.titulo}</h3>
                    <span class="treinamento-status ${statusClass}">${statusText}</span>
                </div>
                
                <div class="treinamento-details">
                    <div class="detail-item">
                        <span class="detail-label">Categoria</span>
                        <span class="detail-value">${treinamento.categoria}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Duração</span>
                        <span class="detail-value">${treinamento.duracao_horas}h</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Instrutor</span>
                        <span class="detail-value">${treinamento.instrutor}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Vagas</span>
                        <span class="detail-value">${treinamento.vagas_total}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Alunos Inscritos</span>
                        <span class="detail-value inscritos-count">
                            <i class="fa-solid fa-users"></i> ${getAlunosInscritos(treinamento.id)} aluno${getAlunosInscritos(treinamento.id) !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Período</span>
                        <span class="detail-value">${formatarData(treinamento.data_inicio)} - ${formatarData(treinamento.data_fim)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Modalidade</span>
                        <span class="detail-value">${treinamento.modalidade}</span>
                    </div>
                </div>
                
                <div class="treinamento-actions">
                    <button class="btn-action btn-view" onclick="visualizarTreinamento(${treinamento.id})">
                        <i class="fa-solid fa-eye"></i> Visualizar
                    </button>
                    <button class="btn-action btn-edit" onclick="editarTreinamento(${treinamento.id})">
                        <i class="fa-solid fa-edit"></i> Editar
                    </button>
                    <button class="btn-action btn-delete" onclick="excluirTreinamento(${treinamento.id})">
                        <i class="fa-solid fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    // Atualizar select de conclusão
    atualizarSelectConclusao();
}

// Atualizar select de treinamentos para conclusão
function atualizarSelectConclusao() {
    const select = document.getElementById('treinamento-conclusao');
    if (!select) return;
    
    // Limpar opções existentes (exceto a primeira)
    select.innerHTML = '<option value="">Selecione um treinamento</option>';
    
    // Adicionar treinamentos ativos
    treinamentosCadastrados
        .filter(t => t.ativo)
        .forEach(treinamento => {
            const option = document.createElement('option');
            option.value = treinamento.id;
            option.textContent = `${treinamento.titulo} - ${treinamento.categoria}`;
            select.appendChild(option);
        });
}

// Função auxiliar para formatar data
function formatarData(data) {
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
}

// Validar formulário
function validarFormulario(formData) {
    const erros = [];
    
    // Validar campos obrigatórios
    if (!formData.titulo.trim()) {
        erros.push('Título é obrigatório');
    }
    
    if (!formData.descricao.trim()) {
        erros.push('Descrição é obrigatória');
    }
    
    if (!formData.categoria) {
        erros.push('Categoria é obrigatória');
    }
    
    if (!formData.duracao_horas || formData.duracao_horas < 1) {
        erros.push('Duração deve ser maior que 0');
    }
    
    if (!formData.instrutor.trim()) {
        erros.push('Instrutor é obrigatório');
    }
    
    if (!formData.vagas_total || formData.vagas_total < 1) {
        erros.push('Número de vagas deve ser maior que 0');
    }
    
    if (!formData.data_inicio) {
        erros.push('Data de início é obrigatória');
    }
    
    if (!formData.data_fim) {
        erros.push('Data de término é obrigatória');
    }
    
    if (!formData.modalidade) {
        erros.push('Modalidade é obrigatória');
    }
    
    // Validar datas
    if (formData.data_inicio && formData.data_fim) {
        const dataInicio = new Date(formData.data_inicio);
        const dataFim = new Date(formData.data_fim);
        
        if (dataFim <= dataInicio) {
            erros.push('Data de término deve ser posterior à data de início');
        }
    }
    
    return erros;
}

// Cadastrar treinamento
function cadastrarTreinamento(formData) {
    const erros = validarFormulario(formData);
    
    if (erros.length > 0) {
        mostrarAlerta('error', 'Erro na validação', erros.join('<br>'));
        return false;
    }
    
    const novoTreinamento = {
        id: proximoId++,
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim(),
        categoria: formData.categoria,
        duracao_horas: parseInt(formData.duracao_horas),
        instrutor: formData.instrutor.trim(),
        vagas_total: parseInt(formData.vagas_total),
        data_inicio: formData.data_inicio,
        data_fim: formData.data_fim,
        horario_inicio: formData.horario_inicio || null,
        horario_fim: formData.horario_fim || null,
        local: formData.local.trim() || null,
        modalidade: formData.modalidade,
        requisitos: formData.requisitos.trim() || null,
        objetivos: formData.objetivos.trim() || null,
        conteudo: formData.conteudo.trim() || null,
        certificado: true, // Todos os treinamentos emitem certificado
        obrigatorio: formData.obrigatorio || false,
        ativo: true,
        data_cadastro: new Date().toISOString()
    };
    
    treinamentosCadastrados.push(novoTreinamento);
    salvarTreinamentos();
    renderizarTreinamentos();
    atualizarContadores();
    
    // Mostrar notificação de sucesso
    if (window.notificationManager && typeof window.notificationManager.treinamentoCadastrado === 'function') {
        window.notificationManager.treinamentoCadastrado(novoTreinamento.titulo);
    } else {
        mostrarNotificacaoManual('success', 'Treinamento Cadastrado!', `O treinamento "${novoTreinamento.titulo}" foi cadastrado com sucesso no sistema.`);
    }
    return true;
}

// Limpar formulário
function limparFormulario() {
    document.getElementById('formTreinamento').reset();
    ocultarAlertas();
}

// Mostrar alerta
function mostrarAlerta(tipo, titulo, mensagem) {
    // Remover alertas existentes
    ocultarAlertas();
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo}`;
    
    const icon = tipo === 'success' ? 'fa-check-circle' : 
                 tipo === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    
    alertDiv.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <div>
            <strong>${titulo}</strong><br>
            ${mensagem}
        </div>
    `;
    
    // Inserir antes do formulário
    const formCard = document.querySelector('.form-card');
    formCard.parentNode.insertBefore(alertDiv, formCard);
    
    // Remover após 5 segundos
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}

// Ocultar alertas
function ocultarAlertas() {
    const alertas = document.querySelectorAll('.alert');
    alertas.forEach(alerta => {
        if (alerta.parentNode) {
            alerta.parentNode.removeChild(alerta);
        }
    });
}

// Visualizar treinamento
function visualizarTreinamento(id) {
    const treinamento = treinamentosCadastrados.find(t => t.id === id);
    if (treinamento) {
        const detalhes = `
            <strong>Título:</strong> ${treinamento.titulo}<br>
            <strong>Descrição:</strong> ${treinamento.descricao}<br>
            <strong>Categoria:</strong> ${treinamento.categoria}<br>
            <strong>Duração:</strong> ${treinamento.duracao_horas} horas<br>
            <strong>Instrutor:</strong> ${treinamento.instrutor}<br>
            <strong>Vagas:</strong> ${treinamento.vagas_total}<br>
            <strong>Período:</strong> ${formatarData(treinamento.data_inicio)} - ${formatarData(treinamento.data_fim)}<br>
            <strong>Modalidade:</strong> ${treinamento.modalidade}<br>
            ${treinamento.local ? `<strong>Local:</strong> ${treinamento.local}<br>` : ''}
            ${treinamento.requisitos ? `<strong>Pré-requisitos:</strong> ${treinamento.requisitos}<br>` : ''}
            ${treinamento.objetivos ? `<strong>Objetivos:</strong> ${treinamento.objetivos}<br>` : ''}
            ${treinamento.conteudo ? `<strong>Conteúdo:</strong> ${treinamento.conteudo}<br>` : ''}
            <strong>Certificado:</strong> ${treinamento.certificado ? 'Sim' : 'Não'}<br>
            <strong>Obrigatório:</strong> ${treinamento.obrigatorio ? 'Sim' : 'Não'}
        `;
        
        alert(`Detalhes do Treinamento:\n\n${detalhes.replace(/<br>/g, '\n').replace(/<[^>]*>/g, '')}`);
    }
}

// Editar treinamento
function editarTreinamento(id) {
    const treinamento = treinamentosCadastrados.find(t => t.id === id);
    if (treinamento) {
        // Preencher formulário com dados do treinamento
        document.getElementById('titulo').value = treinamento.titulo;
        document.getElementById('descricao').value = treinamento.descricao;
        document.getElementById('categoria').value = treinamento.categoria;
        document.getElementById('duracao_horas').value = treinamento.duracao_horas;
        document.getElementById('instrutor').value = treinamento.instrutor;
        document.getElementById('vagas_total').value = treinamento.vagas_total;
        document.getElementById('data_inicio').value = treinamento.data_inicio;
        document.getElementById('data_fim').value = treinamento.data_fim;
        document.getElementById('horario_inicio').value = treinamento.horario_inicio || '';
        document.getElementById('horario_fim').value = treinamento.horario_fim || '';
        document.getElementById('local').value = treinamento.local || '';
        document.getElementById('modalidade').value = treinamento.modalidade;
        document.getElementById('requisitos').value = treinamento.requisitos || '';
        document.getElementById('objetivos').value = treinamento.objetivos || '';
        document.getElementById('conteudo').value = treinamento.conteudo || '';
        // Certificado sempre true - não precisa definir
        document.getElementById('obrigatorio').checked = treinamento.obrigatorio;
        
        // Remover treinamento da lista (será adicionado novamente ao salvar)
        treinamentosCadastrados = treinamentosCadastrados.filter(t => t.id !== id);
        salvarTreinamentos();
        renderizarTreinamentos();
        
        // Rolar para o formulário
        document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth' });
        
        mostrarAlerta('info', 'Edição', 'Treinamento carregado para edição. Faça as alterações necessárias e clique em "Cadastrar Treinamento".');
    }
}

// Excluir treinamento
function excluirTreinamento(id) {
    const treinamento = treinamentosCadastrados.find(t => t.id === id);
    if (treinamento) {
        if (confirm(`Tem certeza que deseja excluir o treinamento "${treinamento.titulo}"?`)) {
            treinamentosCadastrados = treinamentosCadastrados.filter(t => t.id !== id);
            salvarTreinamentos();
            renderizarTreinamentos();
            mostrarAlerta('success', 'Sucesso', 'Treinamento excluído com sucesso!');
        }
    }
}


// Exportar treinamentos
function exportarTreinamentos() {
    if (treinamentosCadastrados.length === 0) {
        mostrarAlerta('info', 'Exportação', 'Não há treinamentos para exportar.');
        return;
    }
    
    // Criar CSV
    const headers = ['ID', 'Título', 'Categoria', 'Duração (h)', 'Instrutor', 'Vagas', 'Data Início', 'Data Fim', 'Modalidade', 'Status'];
    const csvContent = [
        headers.join(','),
        ...treinamentosCadastrados.map(t => [
            t.id,
            `"${t.titulo}"`,
            t.categoria,
            t.duracao_horas,
            `"${t.instrutor}"`,
            t.vagas_total,
            formatarData(t.data_inicio),
            formatarData(t.data_fim),
            t.modalidade,
            t.ativo ? 'Ativo' : 'Inativo'
        ].join(','))
    ].join('\n');
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `treinamentos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    mostrarAlerta('success', 'Exportação', 'Treinamentos exportados com sucesso!');
}

// Inicializar página
window.addEventListener('load', async function() {
    // Inicializar dados vazios se necessário
    inicializarDadosVazios();
    
    const autenticado = await verificarAutenticacao();
    if (autenticado) {
        carregarTreinamentos();
        carregarTreinamentosConcluidos();
        atualizarContadores();
        
        // Adicionar event listener para o formulário
        document.getElementById('formTreinamento').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());
            
            // Converter checkboxes
            data.certificado = true; // Sempre true
            data.obrigatorio = document.getElementById('obrigatorio').checked;
            
            if (cadastrarTreinamento(data)) {
                this.reset();
            }
        });
        
        // Validação em tempo real para datas
        document.getElementById('data_inicio').addEventListener('change', function() {
            const dataInicio = new Date(this.value);
            const dataFim = document.getElementById('data_fim');
            
            if (dataFim.value) {
                const dataFimValue = new Date(dataFim.value);
                if (dataFimValue <= dataInicio) {
                    dataFim.setCustomValidity('Data de término deve ser posterior à data de início');
                } else {
                    dataFim.setCustomValidity('');
                }
            }
        });
        
        document.getElementById('data_fim').addEventListener('change', function() {
            const dataFim = new Date(this.value);
            const dataInicio = document.getElementById('data_inicio');
            
            if (dataInicio.value) {
                const dataInicioValue = new Date(dataInicio.value);
                if (dataFim <= dataInicioValue) {
                    this.setCustomValidity('Data de término deve ser posterior à data de início');
                } else {
                    this.setCustomValidity('');
                }
            }
        });
    }
});
