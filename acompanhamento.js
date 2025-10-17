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
        window.location.href = '../2025_maua_pii_t3_sub2_controle_treinamentos_metro_sp-tela_login/tela_login.html';
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

// Treinamentos baseados no setor do colaborador
function gerarTreinamentosPorSetor(setor, cargo) {
    const treinamentosBase = {
        'operacao': [
            {
                titulo: 'Segurança Operacional',
                descricao: 'Treinamento sobre procedimentos de segurança na operação do metrô',
                horas: '40h',
                categoria: 'Obrigatório'
            },
            {
                titulo: 'Atendimento ao Cliente',
                descricao: 'Técnicas de atendimento e comunicação com passageiros',
                horas: '20h',
                categoria: 'Obrigatório'
            },
            {
                titulo: 'Procedimentos de Emergência',
                descricao: 'Como agir em situações de emergência no metrô',
                horas: '30h',
                categoria: 'Crítico'
            }
        ],
        'manutencao': [
            {
                titulo: 'Manutenção Preventiva',
                descricao: 'Conhecimentos sobre manutenção preventiva de equipamentos',
                horas: '35h',
                categoria: 'Obrigatório'
            },
            {
                titulo: 'Segurança no Trabalho',
                descricao: 'Normas de segurança para trabalhos de manutenção',
                horas: '25h',
                categoria: 'Crítico'
            },
            {
                titulo: 'Sistemas Elétricos',
                descricao: 'Manutenção de sistemas elétricos do metrô',
                horas: '30h',
                categoria: 'Técnico'
            }
        ],
        'seguranca': [
            {
                titulo: 'Procedimentos de Emergência',
                descricao: 'Como agir em situações de emergência no metrô',
                horas: '30h',
                categoria: 'Crítico'
            },
            {
                titulo: 'Controle de Multidões',
                descricao: 'Técnicas para controle e segurança de grandes grupos',
                horas: '20h',
                categoria: 'Específico'
            },
            {
                titulo: 'Primeiros Socorros',
                descricao: 'Conhecimentos básicos de primeiros socorros',
                horas: '15h',
                categoria: 'Obrigatório'
            }
        ],
        'administrativo': [
            {
                titulo: 'Gestão de Documentos',
                descricao: 'Organização e gestão de documentos administrativos',
                horas: '20h',
                categoria: 'Administrativo'
            },
            {
                titulo: 'Atendimento ao Cliente',
                descricao: 'Técnicas de atendimento e comunicação',
                horas: '15h',
                categoria: 'Obrigatório'
            },
            {
                titulo: 'Sistemas de Informação',
                descricao: 'Uso de sistemas administrativos do metrô',
                horas: '25h',
                categoria: 'Técnico'
            }
        ]
    };

    const treinamentosSetor = treinamentosBase[setor] || treinamentosBase['administrativo'];
    
    // Adicionar progresso e datas baseados no tempo de cadastro
    return treinamentosSetor.map((treinamento, index) => {
        const dataCadastro = new Date();
        const diasDesdeCadastro = Math.floor(Math.random() * 60) + 1;
        const progresso = Math.min(Math.floor(Math.random() * 100), 100);
        
        let status = 'not-started';
        if (progresso > 0 && progresso < 100) status = 'in-progress';
        else if (progresso === 100) status = 'completed';
        
        const dataInicio = new Date(dataCadastro.getTime() - (diasDesdeCadastro * 24 * 60 * 60 * 1000));
        const dataPrazo = new Date(dataInicio.getTime() + (90 * 24 * 60 * 60 * 1000)); // 90 dias para concluir
        
        return {
            id: index + 1,
            titulo: treinamento.titulo,
            descricao: treinamento.descricao,
            progresso: progresso,
            status: status,
            dataInicio: dataInicio.toLocaleDateString('pt-BR'),
            dataPrazo: dataPrazo.toLocaleDateString('pt-BR'),
            horas: treinamento.horas,
            categoria: treinamento.categoria
        };
    });
}

// Variável global para os treinamentos do usuário
let meusTreinamentos = [];

// Carregar informações do usuário
async function carregarInfoUsuario() {
    console.log('Carregando informações do usuário...');
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    console.log('User data from localStorage:', user);
    
    try {
        // Carregar perfil do backend
        if (token) {
            const response = await fetch('http://localhost:3000/api/aluno/perfil', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const perfil = await response.json();
                document.getElementById('userName').textContent = perfil.nome || 'Usuário não identificado';
                document.getElementById('userRG').textContent = perfil.matricula || 'N/A';
                document.getElementById('userSetor').textContent = perfil.departamento || 'N/A';
                document.getElementById('userCargo').textContent = 'Aluno';
                console.log('Dados carregados do backend');
            } else {
                throw new Error('Backend não disponível');
            }
        } else {
            throw new Error('Token não encontrado');
        }
    } catch (error) {
        console.log('Carregando dados offline:', error.message);
        // Fallback para localStorage ou dados vazios
        document.getElementById('userName').textContent = user.nome || 'Usuário não identificado';
        document.getElementById('userRG').textContent = user.usuario || 'N/A';
        document.getElementById('userSetor').textContent = user.setor || 'N/A';
        document.getElementById('userCargo').textContent = user.cargo || 'N/A';
    }
    
    // Carregar treinamentos do backend
    await carregarTreinamentosBackend();
}

// Carregar treinamentos do backend
async function carregarTreinamentosBackend() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('http://localhost:3000/api/aluno/treinamentos', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const treinamentosData = await response.json();
            
            // Converter dados do backend para o formato esperado
            meusTreinamentos = treinamentosData.map(t => ({
                id: t.id,
                titulo: t.titulo,
                descricao: t.descricao,
                progresso: t.progresso_percentual || 0,
                status: t.concluido ? 'completed' : (t.progresso_percentual > 0 ? 'in-progress' : 'not-started'),
                dataInicio: t.data_inicio ? new Date(t.data_inicio).toLocaleDateString('pt-BR') : 'Não iniciado',
                dataPrazo: 'N/A', // Não temos data de prazo no backend atual
                horas: `${t.duracao_minutos}min`,
                categoria: t.categoria
            }));
        } else {
            // Fallback para localStorage
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            meusTreinamentos = user.treinamentos || [];
        }
    } catch (error) {
        console.log('Carregando treinamentos offline');
        // Sem dados simulados - lista vazia
        meusTreinamentos = [];
        console.log('Treinamentos carregados:', meusTreinamentos.length);
    }
}

// Calcular e atualizar estatísticas
function atualizarEstatisticas() {
    console.log('Atualizando estatísticas...');
    const total = meusTreinamentos.length;
    const concluidos = meusTreinamentos.filter(t => t.status === 'completed').length;
    const emAndamento = meusTreinamentos.filter(t => t.status === 'in-progress').length;
    const progressoGeral = total > 0 ? meusTreinamentos.reduce((acc, t) => acc + t.progresso, 0) / total : 0;

    console.log('Estatísticas calculadas:', { total, concluidos, emAndamento, progressoGeral });

    const totalEl = document.getElementById('totalTreinamentos');
    const concluidosEl = document.getElementById('treinamentosConcluidos');
    const emAndamentoEl = document.getElementById('treinamentosEmAndamento');
    const porcentagemEl = document.getElementById('porcentagemGeral');

    if (totalEl) totalEl.textContent = total;
    if (concluidosEl) concluidosEl.textContent = concluidos;
    if (emAndamentoEl) emAndamentoEl.textContent = emAndamento;
    if (porcentagemEl) porcentagemEl.textContent = Math.round(progressoGeral) + '%';

    console.log('Estatísticas atualizadas na interface');
}

// Carregar lista de treinamentos
function carregarTreinamentos() {
    console.log('Carregando lista de treinamentos...');
    const container = document.getElementById('treinamentosContainer');
    const emptyMessage = document.getElementById('emptyMessage');
    
    console.log('Container encontrado:', !!container);
    console.log('Empty message encontrado:', !!emptyMessage);
    console.log('Número de treinamentos:', meusTreinamentos.length);
    
    if (meusTreinamentos.length === 0) {
        console.log('Nenhum treinamento encontrado, mostrando mensagem vazia');
        if (container) container.style.display = 'none';
        if (emptyMessage) emptyMessage.style.display = 'block';
        return;
    }

    console.log('Renderizando treinamentos...');
    if (container) container.style.display = 'block';
    if (emptyMessage) emptyMessage.style.display = 'none';
    
    if (!container) {
        console.error('Container de treinamentos não encontrado!');
        return;
    }
    
    container.innerHTML = meusTreinamentos.map(treinamento => `
        <div class="treinamento-item">
            <div class="treinamento-header">
                <h3 class="treinamento-title">${treinamento.titulo}</h3>
                <span class="treinamento-status ${treinamento.status}">
                    ${treinamento.status === 'completed' ? 'Concluído' : 
                      treinamento.status === 'in-progress' ? 'Em Andamento' : 'Não Iniciado'}
                </span>
            </div>
            
            <p style="margin-bottom: 15px; color: #666;">${treinamento.descricao}</p>
            
            <div class="treinamento-details">
                <div class="detail-item">
                    <strong>Categoria:</strong> ${treinamento.categoria}
                </div>
                <div class="detail-item">
                    <strong>Carga Horária:</strong> ${treinamento.horas}
                </div>
                <div class="detail-item">
                    <strong>Data Início:</strong> ${treinamento.dataInicio || 'Não iniciado'}
                </div>
                <div class="detail-item">
                    <strong>Prazo:</strong> ${treinamento.dataPrazo || 'N/A'}
                </div>
            </div>
            
            <div class="progress-container">
                <div class="progress-info">
                    <span class="progress-text">Progresso do curso</span>
                    <span class="progress-percentage">${treinamento.progresso}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${treinamento.progresso}%"></div>
                </div>
            </div>
        </div>
    `).join('');
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

// Carregar dados quando a página carregar
window.addEventListener('load', async function() {
    console.log('Página carregada, iniciando carregamento...');
    
    // Inicializar dados de exemplo se necessário
    inicializarDadosExemplo();
    
    try {
        const autenticado = await verificarAutenticacao();
        if (autenticado) {
            await carregarInfoUsuario();
            atualizarEstatisticas();
            carregarTreinamentos();
            console.log('Dados carregados com sucesso');
        }
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        // Carregar dados mesmo em caso de erro
        await carregarInfoUsuario();
        atualizarEstatisticas();
        carregarTreinamentos();
    }
});

// Também executar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM carregado, iniciando carregamento...');
    
    // Inicializar dados de exemplo se necessário
    inicializarDadosExemplo();
    
    try {
        await carregarInfoUsuario();
        atualizarEstatisticas();
        carregarTreinamentos();
        console.log('Dados carregados via DOMContentLoaded');
    } catch (error) {
        console.error('Erro ao carregar dados via DOMContentLoaded:', error);
    }
});
