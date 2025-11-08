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

// Variáveis globais
let treinamentosDisponiveis = [];
let treinamentosFiltrados = [];
let visualizacaoAtual = 'grid';
let categoriaAtualFiltro = ''; // Categoria selecionada

// Função para fazer logout
function logout() {
    if (confirm('Tem certeza que deseja sair do sistema?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '../TelaLogin/tela_login.html';
    }
}

// Inicializar dados de exemplo
function inicializarDadosExemplo() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        console.log('Inicializando dados vazios...');
        localStorage.setItem('token', 'demo-token');
        localStorage.setItem('user', JSON.stringify({
            nome: 'Aluno Demo',
            usuario: 'aluno',
            setor: 'Operacional',
            cargo: 'Operador',
            treinamentos: []
        }));
        console.log('Dados vazios inicializados');
    }
}

// Dados de exemplo de treinamentos disponíveis (vazio por enquanto)
const treinamentosExemplo = [];

// ===== FUNÇÕES DE FILTRO =====

// Filtrar por categoria
function filtrarPorCategoria(categoria) {
    console.log('════════════════════════════════════════════════════════════');
    console.log('🔘 FILTRO SELECIONADO:', categoria || 'Todas');
    console.log('════════════════════════════════════════════════════════════');
    
    // Atualizar categoria selecionada
    // Se categoria for vazia ou 'todas', limpar o filtro
    if (categoria === '' || categoria === 'todas') {
        categoriaAtualFiltro = '';
        console.log('   ✅ Mostrando TODOS os treinamentos');
    } else {
        categoriaAtualFiltro = categoria;
        console.log('   🔍 Filtrando por categoria:', categoria);
    }
    
    // Atualizar visual dos chips
    document.querySelectorAll('.category-chip').forEach(chip => {
        chip.classList.remove('active');
    });
    
    // Se for filtro vazio, ativar o chip "todas"
    const categoriaParaChip = categoria === '' ? '' : categoria;
    const chipSelecionado = document.querySelector(`.category-chip[data-categoria="${categoriaParaChip}"]`);
    if (chipSelecionado) {
        chipSelecionado.classList.add('active');
        console.log('   ✅ Chip ativado:', chipSelecionado.textContent.trim());
    }
    
    // Aplicar filtros
    aplicarFiltrosCombinados();
    console.log('════════════════════════════════════════════════════════════\n');
}

// Aplicar filtros (apenas por categoria)
function aplicarFiltrosCombinados() {
    console.log('🔍 Aplicando filtros...');
    console.log('   Categoria selecionada:', categoriaAtualFiltro || 'Todas');
    console.log('   Total de treinamentos disponíveis:', treinamentosDisponiveis.length);
    
    let resultado = [...treinamentosDisponiveis];
    
    // Filtrar por categoria
    if (categoriaAtualFiltro && categoriaAtualFiltro !== '' && categoriaAtualFiltro !== 'todas') {
        console.log('   Filtrando por categoria:', categoriaAtualFiltro);
        resultado = resultado.filter(t => {
            const categoriaMatch = t.categoria && t.categoria.toLowerCase() === categoriaAtualFiltro.toLowerCase();
            if (categoriaMatch) {
                console.log('     ✅ Incluído:', t.titulo, '(', t.categoria, ')');
            }
            return categoriaMatch;
        });
    } else {
        console.log('   Mostrando TODOS os treinamentos');
    }
    
    treinamentosFiltrados = resultado;
    console.log('   📊 Resultado do filtro:', treinamentosFiltrados.length, 'treinamento(s)');
    
    renderizarTreinamentos(treinamentosFiltrados);
    atualizarMensagemFiltros();
}

// Atualizar mensagem de filtros
function atualizarMensagemFiltros() {
    const total = treinamentosDisponiveis.length;
    const filtrados = treinamentosFiltrados.length;
    
    // Atualizar contador de resultados
    const totalElement = document.getElementById('total-treinamentos');
    if (totalElement) {
        totalElement.textContent = filtrados;
    }
    
    // Se houver filtros ativos, mostrar mensagem
    if (categoriaAtualFiltro) {
        let mensagem = `Mostrando ${filtrados} de ${total} treinamento${total !== 1 ? 's' : ''}`;
        
        if (categoriaAtualFiltro) {
            const nomeCategoria = document.querySelector(`.category-chip[data-categoria="${categoriaAtualFiltro}"] span:not(.chip-count)`);
            mensagem += ` na categoria "${nomeCategoria ? nomeCategoria.textContent : categoriaAtualFiltro}"`;
        }
        
        console.log(mensagem);
    }
}

// Atualizar contadores dos chips e mostrar/ocultar categorias
function atualizarContadoresChips() {
    console.log('════════════════════════════════════════════════════════════');
    console.log('🔄 ATUALIZANDO CONTADORES DE CHIPS');
    console.log('════════════════════════════════════════════════════════════');
    console.log('📊 Total de treinamentos disponíveis:', treinamentosDisponiveis.length);
    
    const categorias = [
        { key: 'todas', name: 'Todos', dataCategoria: '' },
        { key: 'seguranca', name: 'Segurança', dataCategoria: 'seguranca' },
        { key: 'operacional', name: 'Operacional', dataCategoria: 'operacional' },
        { key: 'administrativo', name: 'Administrativo', dataCategoria: 'administrativo' },
        { key: 'tecnico', name: 'Técnico', dataCategoria: 'tecnico' },
        { key: 'gerencial', name: 'Gerencial', dataCategoria: 'gerencial' }
    ];
    
    categorias.forEach(({ key, name, dataCategoria }) => {
        const elemento = document.getElementById(`count-${key}`);
        const chip = document.querySelector(`.category-chip[data-categoria="${dataCategoria}"]`);
        
        console.log(`\n📌 Processando: ${name}`);
        console.log(`   ID elemento: count-${key} → ${elemento ? 'ENCONTRADO' : '❌ NÃO ENCONTRADO'}`);
        console.log(`   Chip: data-categoria="${dataCategoria}" → ${chip ? 'ENCONTRADO' : '❌ NÃO ENCONTRADO'}`);
        
        if (elemento && chip) {
            let count = 0;
            
            if (key === 'todas') {
                count = treinamentosDisponiveis.length;
                console.log(`   ✅ ${name}: ${count} curso(s) (TODOS)`);
            } else {
                // Verificar todas as variações possíveis de categoria
                count = treinamentosDisponiveis.filter(t => {
                    if (!t.categoria) return false;
                    const catLower = t.categoria.toLowerCase().trim();
                    const keyLower = key.toLowerCase().trim();
                    return catLower === keyLower;
                }).length;
                
                console.log(`   ${count > 0 ? '✅' : '⚠️'} ${name}: ${count} curso(s)`);
            }
            
            elemento.textContent = count;
            console.log(`   💾 Contador atualizado: "${count}"`);
            
            // Mostrar/ocultar chip baseado na disponibilidade
            if (key === 'todas') {
                // Chip "Todos" sempre visível
                chip.style.display = 'inline-flex';
                console.log(`   👁️ Chip "${name}" sempre VISÍVEL`);
            } else if (count > 0) {
                // Mostrar chip se há cursos disponíveis
                chip.style.display = 'inline-flex';
                console.log(`   👁️ Chip "${name}" VISÍVEL (${count} curso(s))`);
            } else {
                // Ocultar chip se não há cursos disponíveis
                chip.style.display = 'none';
                console.log(`   🚫 Chip "${name}" OCULTO (sem cursos)`);
                
                // Se o chip oculto estava ativo, voltar para "Todos"
                if (chip.classList.contains('active')) {
                    console.log(`   ⚠️ Chip estava ativo, voltando para "Todos"`);
                    filtrarPorCategoria('');
                }
            }
        } else {
            console.log(`   ❌ ERRO: Elemento ou chip não encontrado!`);
        }
    });
    
    console.log('\n════════════════════════════════════════════════════════════');
    console.log('✅ CONTADORES ATUALIZADOS!');
    console.log('════════════════════════════════════════════════════════════\n');
}

// ===== FUNÇÕES AUXILIARES =====

// Salvar treinamento no progresso do aluno
function salvarTreinamentoNoProgresso(treinamento) {
    console.log('════════════════════════════════════════════════════════════');
    console.log('💾 SALVANDO TREINAMENTO NO PROGRESSO');
    console.log('════════════════════════════════════════════════════════════');
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('👤 Dados do usuário no localStorage:');
    console.log('   user.id:', user.id);
    console.log('   user.nome:', user.nome);
    console.log('   user completo:', user);
    
    if (!user.id) {
        console.error('❌ ERRO: Usuário não identificado!');
        console.error('   Dados do user:', user);
        console.error('   localStorage.user:', localStorage.getItem('user'));
        alert('ERRO: Usuário não está autenticado. Faça login novamente.');
        return false;
    }
    
    // Verificar se o colaborador existe (apenas para log, não bloqueia)
    const colaboradores = JSON.parse(localStorage.getItem('colaboradoresCadastrados') || '[]');
    console.log('📋 Verificando colaboradores cadastrados...');
    console.log('   Total de colaboradores:', colaboradores.length);
    console.log('   IDs disponíveis:', colaboradores.map(c => c.id));
    console.log('   Tipo dos IDs:', colaboradores.map(c => typeof c.id));
    console.log('   user.id:', user.id, '(tipo:', typeof user.id, ')');
    
    // Tentar encontrar colaborador com conversão de tipos
    let colaborador = colaboradores.find(c => c.id === user.id);
    
    // Se não encontrar, tentar com conversão de string para número
    if (!colaborador) {
        colaborador = colaboradores.find(c => String(c.id) === String(user.id));
    }
    
    // Se não encontrar, tentar com conversão de número
    if (!colaborador) {
        colaborador = colaboradores.find(c => parseInt(c.id) === parseInt(user.id));
    }
    
    if (!colaborador) {
        console.warn('⚠️ AVISO: Colaborador não encontrado na lista de colaboradores cadastrados');
        console.warn('   Buscando por ID:', user.id, '(tipo:', typeof user.id, ')');
        console.warn('   Colaboradores disponíveis:');
        colaboradores.forEach(c => {
            console.warn(`      - ID: ${c.id} (tipo: ${typeof c.id}), Nome: ${c.nome}`);
        });
        console.warn('   ⚠️ Continuando mesmo assim, pois o usuário está autenticado...');
        
        // Criar um colaborador temporário com os dados do usuário
        colaborador = {
            id: user.id,
            nome: user.nome || 'Usuário',
            rgMetro: user.rgMetro || user.usuario || 'N/A'
        };
    } else {
        console.log('✅ Colaborador encontrado:');
        console.log('   Nome:', colaborador.nome);
        console.log('   RG Metro:', colaborador.rgMetro);
    }
    
    // Carregar progresso atual do aluno
    let progressoAluno = JSON.parse(localStorage.getItem('progressoAluno') || '{}');
    console.log('📊 Progresso atual no localStorage:');
    console.log('   Chaves disponíveis:', Object.keys(progressoAluno));
    console.log('   Progresso para user.id', user.id, ':', progressoAluno[user.id]);
    
    if (!progressoAluno[user.id]) {
        progressoAluno[user.id] = {
            treinamentos: [],
            ultimaAtualizacao: new Date().toISOString()
        };
        console.log('📝 Criando novo registro de progresso para o aluno:', user.id);
    }
    
    // Verificar se o treinamento já está no progresso
    const treinamentoExistente = progressoAluno[user.id].treinamentos.find(t => 
        parseInt(t.id) === parseInt(treinamento.id)
    );
    console.log('🔍 Treinamento já existe no progresso?', treinamentoExistente ? 'SIM' : 'NÃO');
    
    if (!treinamentoExistente) {
        // Adicionar novo treinamento ao progresso
        const novoTreinamento = {
            id: parseInt(treinamento.id), // Garantir que seja número
            titulo: treinamento.titulo,
            categoria: treinamento.categoria,
            duracao_horas: treinamento.duracao_horas,
            instrutor: treinamento.instrutor,
            dataInicio: treinamento.data_inicio,
            dataFim: treinamento.data_fim,
            status: 'em-andamento',
            progresso: 0,
            dataEntrada: new Date().toISOString(),
            ultimaAtividade: new Date().toISOString(),
            aulasCompletadas: 0,
            totalAulas: 10, // Valor padrão, pode ser ajustado
            certificadoEmitido: false
        };
        
        console.log('➕ Adicionando novo treinamento ao progresso:');
        console.log('   ID:', novoTreinamento.id);
        console.log('   Título:', novoTreinamento.titulo);
        console.log('   Dados completos:', novoTreinamento);
        
        progressoAluno[user.id].treinamentos.push(novoTreinamento);
        progressoAluno[user.id].ultimaAtualizacao = new Date().toISOString();
        
        console.log('📊 Progresso antes de salvar:', progressoAluno[user.id]);
        
        // Salvar progresso atualizado
        localStorage.setItem('progressoAluno', JSON.stringify(progressoAluno));
        
        console.log(`✅ Treinamento "${treinamento.titulo}" adicionado ao progresso do aluno ID: ${user.id}`);
        console.log('📊 Total de treinamentos no progresso agora:', progressoAluno[user.id].treinamentos.length);
    } else {
        // Atualizar data de última atividade se já existir
        console.log('🔄 Treinamento já existe, atualizando última atividade...');
        treinamentoExistente.ultimaAtividade = new Date().toISOString();
        progressoAluno[user.id].ultimaAtualizacao = new Date().toISOString();
        
        // Salvar progresso atualizado
        localStorage.setItem('progressoAluno', JSON.stringify(progressoAluno));
        
        console.log(`✅ Treinamento "${treinamento.titulo}" atualizado no progresso do aluno ID: ${user.id}`);
    }
    
    // Verificação final
    const progressoSalvo = JSON.parse(localStorage.getItem('progressoAluno') || '{}');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔍 VERIFICAÇÃO FINAL:');
    console.log('   Progresso salvo para user.id', user.id, ':', progressoSalvo[user.id]);
    console.log('   Total de treinamentos salvos:', progressoSalvo[user.id]?.treinamentos?.length || 0);
    if (progressoSalvo[user.id]?.treinamentos) {
        console.log('   IDs dos treinamentos salvos:', progressoSalvo[user.id].treinamentos.map(t => t.id));
    }
    console.log('═══════════════════════════════════════════════════════════\n');
    
    return true;
}

// Mostrar notificação
function mostrarNotificacao(mensagem, tipo = 'info') {
    // Criar elemento de notificação
    const notificacao = document.createElement('div');
    notificacao.className = `notificacao notificacao-${tipo}`;
    notificacao.innerHTML = `
        <div class="notificacao-conteudo">
            <i class="fa-solid fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${mensagem}</span>
        </div>
        <button class="notificacao-fechar" onclick="this.parentElement.remove()">
            <i class="fa-solid fa-times"></i>
        </button>
    `;
    
    // Adicionar estilos se não existirem
    if (!document.getElementById('notificacao-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notificacao-styles';
        styles.textContent = `
            .notificacao {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                padding: 16px 20px;
                display: flex;
                align-items: center;
                gap: 12px;
                z-index: 10000;
                max-width: 400px;
                animation: slideInRight 0.3s ease-out;
            }
            
            .notificacao-success {
                border-left: 4px solid #28a745;
            }
            
            .notificacao-error {
                border-left: 4px solid #dc3545;
            }
            
            .notificacao-info {
                border-left: 4px solid #007bff;
            }
            
            .notificacao-conteudo {
                display: flex;
                align-items: center;
                gap: 8px;
                flex: 1;
            }
            
            .notificacao-conteudo i {
                font-size: 18px;
            }
            
            .notificacao-success .notificacao-conteudo i {
                color: #28a745;
            }
            
            .notificacao-error .notificacao-conteudo i {
                color: #dc3545;
            }
            
            .notificacao-info .notificacao-conteudo i {
                color: #007bff;
            }
            
            .notificacao-conteudo span {
                font-size: 14px;
                color: #333;
                line-height: 1.4;
            }
            
            .notificacao-fechar {
                background: none;
                border: none;
                color: #666;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: background-color 0.2s;
            }
            
            .notificacao-fechar:hover {
                background: #f5f5f5;
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Adicionar notificação ao body
    document.body.appendChild(notificacao);
    
    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        if (notificacao.parentElement) {
            notificacao.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => {
                if (notificacao.parentElement) {
                    notificacao.remove();
                }
            }, 300);
        }
    }, 5000);
}

// Calcular status do treinamento baseado nas datas
// Parser seguro para datas no formato YYYY-MM-DD (evita fuso horário)
function parseDateOnly(yyyyMmDd) {
    if (!yyyyMmDd || typeof yyyyMmDd !== 'string') return null;
    const [y, m, d] = yyyyMmDd.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d, 0, 0, 0, 0); // Local midnight
}

function calcularStatusTreinamento(treinamento) {
    const hoje = new Date();
    const dataInicio = parseDateOnly(treinamento.data_inicio) || new Date(treinamento.data_inicio);
    const dataFim = parseDateOnly(treinamento.data_fim) || new Date(treinamento.data_fim);
    
    if (hoje < dataInicio) {
        return 'disponivel';
    } else if (hoje >= dataInicio && hoje <= dataFim) {
        return 'em-andamento';
    } else {
        return 'concluido';
    }
}

// Calcular vagas ocupadas baseado nas inscrições ativas
function calcularVagasOcupadas(treinamentoId) {
    const inscricoes = JSON.parse(localStorage.getItem('inscricoesTreinamentos') || '[]');
    return inscricoes.filter(inscricao => 
        inscricao.treinamentoId == treinamentoId && 
        (inscricao.status === 'inscrito' || inscricao.status === 'ativo')
    ).length;
}

// Verificar se o aluno já está inscrito no treinamento
function verificarInscricao(treinamentoId) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const inscricoes = JSON.parse(localStorage.getItem('inscricoesTreinamentos') || '[]');
    
    return inscricoes.some(inscricao => 
        inscricao.treinamentoId == treinamentoId && 
        inscricao.alunoId == user.id && 
        (inscricao.status === 'inscrito' || inscricao.status === 'ativo')
    );
}

// Verificar se o aluno já está no progresso do treinamento
function verificarNoProgresso(treinamentoId) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const progressoAluno = JSON.parse(localStorage.getItem('progressoAluno') || '{}');
    
    console.log(`🔍 VERIFICANDO PROGRESSO para treinamento ID: ${treinamentoId}`);
    console.log('   user.id:', user.id);
    console.log('   Tem progresso?', !!progressoAluno[user.id]);
    
    if (!user.id) {
        console.log('   ❌ Usuário não identificado');
        return false;
    }
    
    if (!progressoAluno[user.id]) {
        console.log('   ❌ Nenhum progresso encontrado para este usuário');
        return false;
    }
    
    if (!progressoAluno[user.id].treinamentos) {
        console.log('   ❌ Lista de treinamentos não existe');
        return false;
    }
    
    const treinamentosIds = progressoAluno[user.id].treinamentos.map(t => parseInt(t.id));
    console.log('   IDs no progresso:', treinamentosIds);
    console.log('   Procurando por:', parseInt(treinamentoId));
    
    const noProgresso = progressoAluno[user.id].treinamentos.some(treinamento => 
        parseInt(treinamento.id) === parseInt(treinamentoId)
    );
    
    console.log(`   Resultado: ${noProgresso ? '✅ ESTÁ NO PROGRESSO' : '❌ NÃO ESTÁ NO PROGRESSO'}\n`);
    
    return noProgresso;
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

// Carregar treinamentos disponíveis
async function carregarTreinamentos() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyMessage');
    const container = document.getElementById('treinamentosContainer');
    
    try {
        // Estado de carregamento
        loadingState.style.display = 'block';
        container.style.display = 'none';
        emptyState.style.display = 'none';

        // 1) Tentar carregar do backend
        try {
            const token = localStorage.getItem('token');
            const hasToken = !!token;
            const endpoint = hasToken ? 'http://localhost:3000/api/trainings' : 'http://localhost:3000/api/trainings/public';
            const resp = await fetch(endpoint, {
                headers: hasToken ? { 'Authorization': `Bearer ${token}` } : {},
                cache: 'no-store'
            });
            if (resp.ok) {
                const data = await resp.json();
                const apiTrainings = data.trainings || [];
                treinamentosDisponiveis = apiTrainings
                    // Filtrar treinamentos concluídos - alunos não devem ver
                    .filter(t => t.status !== 'concluido')
                    .map(t => {
                        // Mapear status do backend para a UI
                        let statusUI = 'disponivel';
                        if (t.status === 'em_andamento') statusUI = 'em-andamento';
                        else if (t.status === 'planejado') statusUI = 'disponivel';

                        return {
                            id: t.id,
                            titulo: t.titulo,
                            descricao: t.descricao,
                            categoria: t.categoria,
                            duracao_horas: t.duracao_horas,
                            instrutor: t.instrutor,
                            vagas_total: t.vagas_total,
                            vagas_ocupadas: t.vagas_ocupadas,
                            data_inicio: t.data_inicio,
                            data_fim: t.data_fim,
                            horario_inicio: t.horario_inicio,
                            horario_fim: t.horario_fim,
                            local: t.local,
                            requisitos: t.requisitos,
                            objetivos: t.objetivos,
                            conteudo: t.conteudo,
                            obrigatorio: t.obrigatorio,
                            status: statusUI,
                            dataCadastro: t.createdAt
                        };
                    });
            } else {
                if (resp.status === 401 && hasToken) {
                    // Tenta endpoint público como fallback
                    const respPublic = await fetch('http://localhost:3000/api/trainings/public', { cache: 'no-store' });
                    if (respPublic.ok) {
                        const dataPub = await respPublic.json();
                        treinamentosDisponiveis = (dataPub.trainings || [])
                            // Filtrar treinamentos concluídos
                            .filter(t => t.status !== 'concluido')
                            .map(t => ({
                            id: t.id,
                            titulo: t.titulo,
                            descricao: t.descricao,
                            categoria: t.categoria,
                            duracao_horas: t.duracao_horas,
                            instrutor: t.instrutor,
                            vagas_total: t.vagas_total,
                            vagas_ocupadas: t.vagas_ocupadas,
                            data_inicio: t.data_inicio,
                            data_fim: t.data_fim,
                            horario_inicio: t.horario_inicio,
                            horario_fim: t.horario_fim,
                            local: t.local,
                            requisitos: t.requisitos,
                            objetivos: t.objetivos,
                            conteudo: t.conteudo,
                            obrigatorio: t.obrigatorio,
                            status: calcularStatusTreinamento(t),
                            dataCadastro: t.createdAt
                        }));
                    } else {
                        alert('Sua sessão expirou. Faça login novamente.');
                        window.location.href = '../TelaLogin/tela_login.html';
                        return;
                    }
                } else {
                throw new Error('API de treinamentos indisponível');
                }
            }
        } catch (e) {
            console.warn('⚠️ Falha ao buscar do backend:', e.message);
            // Sem localStorage: manter UX clara
            treinamentosDisponiveis = [];
        }

        // Finalizar renderização
        treinamentosFiltrados = [...treinamentosDisponiveis];
        if (treinamentosFiltrados.length === 0) {
            emptyState.style.display = 'block';
            container.style.display = 'none';
        } else {
            container.style.display = 'block';
            renderizarTreinamentos(treinamentosFiltrados);
            atualizarEstatisticas();
        }
    } catch (error) {
        console.error('Erro ao carregar treinamentos:', error);
        emptyState.style.display = 'block';
        container.style.display = 'none';
    }
    finally {
        loadingState.style.display = 'none';
    }
}

// Limpar treinamentos excluídos do progresso do aluno
function limparTreinamentosExcluidosDoProgresso(treinamentosCadastrados) {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const progressoAluno = JSON.parse(localStorage.getItem('progressoAluno') || '{}');
        
        if (progressoAluno[user.id] && progressoAluno[user.id].treinamentos) {
            const treinamentosOriginais = progressoAluno[user.id].treinamentos.length;
            
            // Filtrar apenas treinamentos que ainda existem
            progressoAluno[user.id].treinamentos = progressoAluno[user.id].treinamentos.filter(t => {
                const existe = treinamentosCadastrados.some(tc => 
                    parseInt(tc.id) === parseInt(t.id)
                );
                
                if (!existe) {
                    console.log(`🧹 Removendo treinamento excluído: "${t.titulo}" (ID: ${t.id})`);
                }
                
                return existe;
            });
            
            // Se houve mudanças, salvar
            if (progressoAluno[user.id].treinamentos.length !== treinamentosOriginais) {
                progressoAluno[user.id].ultimaAtualizacao = new Date().toISOString();
                localStorage.setItem('progressoAluno', JSON.stringify(progressoAluno));
                console.log(`✅ ${treinamentosOriginais - progressoAluno[user.id].treinamentos.length} treinamento(s) excluído(s) removido(s) do progresso`);
            }
        }
    } catch (error) {
        console.error('Erro ao limpar treinamentos excluídos:', error);
    }
}

// Renderizar treinamentos
function renderizarTreinamentos(treinamentos) {
    console.log('🎨 Renderizando treinamentos...');
    console.log('   Total a renderizar:', treinamentos.length);
    
    const container = document.getElementById('treinamentosContainer');
    
    if (treinamentos.length === 0) {
        console.log('   ⚠️ Nenhum treinamento para renderizar');
        // Verificar se há filtros ativos
        if (categoriaAtualFiltro) {
            // Mensagem para filtros sem resultados
            const nomeCategoria = document.querySelector(`.category-chip[data-categoria="${categoriaAtualFiltro}"] span:not(.chip-count)`);
            const mensagem = `Nenhum treinamento de ${nomeCategoria ? nomeCategoria.textContent : categoriaAtualFiltro}`;
            const detalhe = 'Não há cursos disponíveis nesta categoria no momento.';
            
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-search"></i>
                    <h3>${mensagem}</h3>
                    <p>${detalhe}</p>
                    <button class="btn btn-primary" onclick="filtrarPorCategoria('')">
                        <i class="fa-solid fa-list"></i> Ver Todos os Cursos
                    </button>
                </div>
            `;
        } else {
            // Mensagem padrão quando não há treinamentos cadastrados
            container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-graduation-cap"></i><h3>Nenhum treinamento disponível</h3><p>Ainda não há treinamentos cadastrados no sistema. Os treinamentos aparecerão aqui quando forem criados pelos instrutores.</p></div>';
        }
        return;
    }
    
    container.innerHTML = treinamentos.map(treinamento => {
        const statusClass = treinamento.status;
        const statusText = getStatusText(treinamento.status);
        const statusColor = getStatusColor(treinamento.status);
        const jaInscrito = verificarInscricao(treinamento.id);
        const jaNoProgresso = verificarNoProgresso(treinamento.id);
        const vagasDisponiveis = treinamento.vagas_total - treinamento.vagas_ocupadas;
        
        // Debug: verificar status do treinamento
        console.log(`Treinamento ${treinamento.id} (${treinamento.titulo}):`, {
            status: treinamento.status,
            jaInscrito,
            jaNoProgresso,
            vagasDisponiveis,
            vagasTotal: treinamento.vagas_total,
            vagasOcupadas: treinamento.vagas_ocupadas
        });
        
        let buttonHtml = '';
        
        // Se já está no progresso, mostrar botão desabilitado
        if (jaNoProgresso) {
            buttonHtml = `<button class="btn-action btn-inscrito" disabled>
                <i class="fa-solid fa-check-circle"></i> Já está no treinamento
            </button>`;
        } else if (vagasDisponiveis > 0) {
            // Se há vagas disponíveis, pode entrar
            buttonHtml = `<button class="btn-action btn-start" onclick="entrarTreinamento(${treinamento.id})">
                <i class="fa-solid fa-play"></i> Entrar no Treinamento
            </button>`;
        } else {
            // Vagas esgotadas
            buttonHtml = `<button class="btn-action" disabled>
                <i class="fa-solid fa-users"></i> Vagas Esgotadas
            </button>`;
        }
        
        return `
            <div class="treinamento-item ${statusClass}">
                <div class="treinamento-header">
                    <h3 class="treinamento-title">${treinamento.titulo}</h3>
                    <span class="treinamento-status ${statusClass}" style="background: ${statusColor.background}; color: ${statusColor.color}">
                        ${statusText}
                    </span>
                </div>
                
                <p class="treinamento-description">${treinamento.descricao}</p>
                
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
                        <span class="detail-label">Período</span>
                        <span class="detail-value">${formatarData(treinamento.data_inicio)} - ${formatarData(treinamento.data_fim)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Vagas</span>
                        <span class="detail-value ${vagasDisponiveis > 0 ? 'vagas-disponiveis' : 'vagas-esgotadas'}">
                            ${treinamento.vagas_ocupadas === 0 ? 
                                `${treinamento.vagas_total} vagas abertas` : 
                                vagasDisponiveis > 0 ? 
                                    `${vagasDisponiveis} disponíveis de ${treinamento.vagas_total}` : 
                                    'Esgotadas'
                            }
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Certificado</span>
                        <span class="detail-value">${treinamento.certificado ? 'Sim' : ''}</span>
                    </div>
                </div>
                
                ${treinamento.requisitos ? `
                <div class="treinamento-requisitos">
                    <strong>Pré-requisitos:</strong> ${treinamento.requisitos}
                </div>
                ` : ''}
                
                <div class="treinamento-actions">
                    ${buttonHtml}
                </div>
            </div>
        `;
    }).join('');
}

// ===== FUNÇÕES DE INSCRIÇÃO =====

// Inscrever-se em um treinamento
function inscreverTreinamento(treinamentoId) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!user.id) {
        alert('Erro: Usuário não identificado. Faça login novamente.');
        return;
    }
    
    // Verificar se já está inscrito
    if (verificarInscricao(treinamentoId)) {
        alert('Você já está inscrito neste treinamento!');
        return;
    }
    
    // Verificar vagas disponíveis
    const treinamento = treinamentosDisponiveis.find(t => t.id == treinamentoId);
    const vagasDisponiveis = treinamento.vagas_total - treinamento.vagas_ocupadas;
    
    if (vagasDisponiveis <= 0) {
        alert('Não há vagas disponíveis para este treinamento!');
        return;
    }
    
    // Confirmar inscrição
    if (confirm(`Deseja se inscrever no treinamento "${treinamento.titulo}"?`)) {
        // Criar inscrição
        const inscricao = {
            id: Date.now(),
            treinamentoId: treinamentoId,
            alunoId: user.id,
            status: 'inscrito',
            dataInscricao: new Date().toISOString()
        };
        
        // Salvar inscrição
        const inscricoes = JSON.parse(localStorage.getItem('inscricoesTreinamentos') || '[]');
        inscricoes.push(inscricao);
        localStorage.setItem('inscricoesTreinamentos', JSON.stringify(inscricoes));
        
        // Atualizar interface
        carregarTreinamentos();
        
        // Mostrar notificação
        alert('Inscrição realizada com sucesso!');
    }
}

// Cancelar inscrição em um treinamento
function cancelarInscricao(treinamentoId) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!user.id) {
        alert('Erro: Usuário não identificado. Faça login novamente.');
        return;
    }
    
    if (confirm('Deseja cancelar sua inscrição neste treinamento?')) {
        // Buscar e remover inscrição
        const inscricoes = JSON.parse(localStorage.getItem('inscricoesTreinamentos') || '[]');
        const inscricoesAtualizadas = inscricoes.filter(inscricao => 
            !(inscricao.treinamentoId == treinamentoId && inscricao.alunoId == user.id)
        );
        
        localStorage.setItem('inscricoesTreinamentos', JSON.stringify(inscricoesAtualizadas));
        
        // Atualizar interface
        carregarTreinamentos();
        
        // Mostrar notificação
        alert('Inscrição cancelada com sucesso!');
    }
}

// Funções auxiliares
function getStatusText(status) {
    const statusMap = {
        'disponivel': 'Disponível',
        'em-andamento': 'Em Andamento',
        'concluido': 'Concluído'
    };
    return statusMap[status] || status;
}

function getStatusColor(status) {
    const colorMap = {
        'disponivel': { background: '#d4edda', color: '#155724' },
        'em-andamento': { background: '#fff3cd', color: '#856404' },
        'concluido': { background: '#cce5ff', color: '#004085' }
    };
    return colorMap[status] || { background: '#f8d7da', color: '#721c24' };
}

function formatarData(data) {
    if (!data) return '';
    const parsed = parseDateOnly(data);
    if (parsed) return parsed.toLocaleDateString('pt-BR');
    const fallback = new Date(data);
    if (!isNaN(fallback)) return fallback.toLocaleDateString('pt-BR');
    // Último recurso: string original (já no formato AAAA-MM-DD)
    const [y, m, d] = String(data).split('-');
    if (y && m && d) return `${d.padStart(2,'0')}/${m.padStart(2,'0')}/${y}`;
    return String(data);
}

// Atualizar estatísticas
function atualizarEstatisticas() {
    const total = treinamentosFiltrados.length;
    const disponiveis = treinamentosFiltrados.filter(t => t.status === 'disponivel').length;
    const emAndamento = treinamentosFiltrados.filter(t => t.status === 'em-andamento').length;
    const concluidos = treinamentosFiltrados.filter(t => t.status === 'concluido').length;
    
    document.getElementById('total-treinamentos').textContent = total;
    document.getElementById('disponiveis').textContent = disponiveis;
    document.getElementById('em-andamento').textContent = emAndamento;
    document.getElementById('concluidos').textContent = concluidos;
}

// Aplicar filtros
function aplicarFiltros() {
    const statusFilter = document.getElementById('status-filter').value;
    const categoriaFilter = document.getElementById('categoria-filter').value;
    const searchInput = document.getElementById('search-input').value.toLowerCase();
    
    treinamentosFiltrados = treinamentosDisponiveis.filter(treinamento => {
        const statusMatch = !statusFilter || treinamento.status === statusFilter;
        const categoriaMatch = !categoriaFilter || treinamento.categoria.toLowerCase() === categoriaFilter;
        const searchMatch = !searchInput || 
            treinamento.titulo.toLowerCase().includes(searchInput) ||
            treinamento.descricao.toLowerCase().includes(searchInput) ||
            treinamento.instrutor.toLowerCase().includes(searchInput);
        
        return statusMatch && categoriaMatch && searchMatch;
    });
    
    renderizarTreinamentos(treinamentosFiltrados);
    atualizarEstatisticas();
}

// Alternar visualização
function alternarVisualizacao(tipo) {
    visualizacaoAtual = tipo;
    const container = document.getElementById('treinamentosContainer');
    const buttons = document.querySelectorAll('.view-btn');
    
    // Atualizar botões
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.closest('.view-btn').classList.add('active');
    
    // Aplicar classe de visualização
    if (tipo === 'list') {
        container.classList.add('list-view');
    } else {
        container.classList.remove('list-view');
    }
}

// Inscrever-se em treinamento
function inscreverTreinamento(treinamentoId) {
    const treinamento = treinamentosDisponiveis.find(t => t.id === treinamentoId);
    if (treinamento && treinamento.vagas_disponiveis > 0) {
        if (confirm(`Deseja inscrever-se no treinamento "${treinamento.titulo}"?`)) {
            // Mostrar notificação de sucesso
            if (window.notificationManager) {
                window.notificationManager.treinamentoIniciado(treinamento.titulo);
            } else {
                alert('Inscrição realizada com sucesso! Você receberá um e-mail de confirmação.');
            }
            // Aqui seria feita a inscrição via API
            // Por enquanto, apenas simulamos
            treinamento.vagas_disponiveis--;
            aplicarFiltros();
        }
    } else {
        alert('Este treinamento não possui vagas disponíveis.');
    }
}

// Concluir treinamento
async function concluirTreinamento(treinamentoId) {
    const treinamento = treinamentosDisponiveis.find(t => t.id === treinamentoId);
    if (!treinamento) {
        alert('Treinamento não encontrado.');
        return;
    }
    if (!confirm(`Deseja concluir o treinamento "${treinamento.titulo}"?`)) return;

    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Token não encontrado. Faça login novamente.');

        // Atualiza status no backend; backend vai emitir certificados para >=75% presença
        const resp = await fetch(`http://localhost:3000/api/trainings/${treinamentoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: 'concluido' })
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || 'Erro ao concluir treinamento');

        // Recarrega lista para refletir mudança
        await carregarTreinamentos();
        aplicarFiltros();

        if (window.notificationManager) {
            window.notificationManager.treinamentoConcluido(treinamento.titulo);
        } else {
            alert('Treinamento concluído e certificados emitidos (quando aplicável).');
        }
    } catch (e) {
        console.error('Falha ao concluir treinamento:', e);
        alert('Erro: ' + e.message);
    }
}

// Entrar no treinamento (inscrever automaticamente se necessário)
async function entrarTreinamento(treinamentoId) {
    console.log('🚀 INICIANDO ENTRADA NO TREINAMENTO:', treinamentoId);
    
    // Obter dados do usuário PRIMEIRO
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('👤 Usuário atual:', user);
    
    // Desabilitar TODOS os botões de entrar imediatamente
    const botoes = document.querySelectorAll(`button[onclick*="entrarTreinamento(${treinamentoId})"]`);
    botoes.forEach(botao => {
        botao.disabled = true;
        botao.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processando...';
    });
    console.log('🔒 Botão desabilitado para evitar cliques múltiplos');
    
    // Verificar se o usuário está identificado ANTES de continuar
    if (!user.id) {
        console.error('❌ Usuário não identificado');
        botoes.forEach(botao => {
            botao.disabled = false;
            botao.innerHTML = '<i class="fa-solid fa-play"></i> Entrar no Treinamento';
        });
        alert('Erro: Usuário não identificado. Faça login novamente.');
        return;
    }
    
    const treinamento = treinamentosDisponiveis.find(t => t.id === treinamentoId);
    console.log('📚 Treinamento encontrado:', treinamento);
    
    if (treinamento) {
        const jaInscrito = verificarInscricao(treinamentoId);
        console.log('🔍 Já inscrito?', jaInscrito);
        
        if (!jaInscrito) {
            // Inscrever via API backend
            console.log('📝 Enviando inscrição para o backend...');
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Erro: Token não encontrado. Faça login novamente.');
                // Reabilitar botão
                botoes.forEach(botao => {
                    botao.disabled = false;
                    botao.innerHTML = '<i class="fa-solid fa-play"></i> Entrar no Treinamento';
                });
                return;
            }

            try {
                const resp = await fetch(`http://localhost:3000/api/trainings/${treinamentoId}/inscrever`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                });
                const data = await resp.json();
                if (!resp.ok) {
                    throw new Error(data.error || 'Erro ao inscrever-se no treinamento');
                }
                console.log('✅ Inscrição confirmada no backend');
                mostrarNotificacao('Inscrição realizada com sucesso!', 'success');
            } catch (e) {
                console.error('❌ Falha ao inscrever no backend:', e);
                alert('Erro ao inscrever no treinamento: ' + e.message);
                // Reabilitar botão
                botoes.forEach(botao => {
                    botao.disabled = false;
                    botao.innerHTML = '<i class="fa-solid fa-play"></i> Entrar no Treinamento';
                });
                return;
            }
        }
        
        // Salvar treinamento no progresso do aluno
        console.log('💾 Salvando treinamento no progresso do aluno...');
        salvarTreinamentoNoProgresso(treinamento);
        
        // Mostrar notificação de entrada no curso
        mostrarNotificacao(`Você entrou no curso "${treinamento.titulo}"! Acesse "Acompanhar Progresso" para continuar seu aprendizado.`, 'success');
        
        // Debug: verificar se foi salvo
        const progressoAluno = JSON.parse(localStorage.getItem('progressoAluno') || '{}');
        console.log('📋 Progresso do aluno após salvar:', progressoAluno);
        
        // Verificar se o treinamento foi salvo corretamente
        const treinamentoSalvo = progressoAluno[user.id]?.treinamentos?.find(t => 
            parseInt(t.id) === parseInt(treinamentoId)
        );
        console.log('✅ Treinamento salvo no progresso:', treinamentoSalvo ? 'SIM' : 'NÃO');
        if (treinamentoSalvo) {
            console.log('   Dados salvos:', treinamentoSalvo);
        }
        
        // Atualizar a lista consultando novamente as vagas e estado
        setTimeout(async () => {
            console.log('🔄 Recarregando treinamentos do backend/local para refletir inscrição...');
            await carregarTreinamentos();
            console.log('✅ Interface atualizada');
        }, 500);
    } else {
        // Se não encontrar o treinamento, reabilitar o botão
        console.error('❌ Treinamento não encontrado');
        botoes.forEach(botao => {
            botao.disabled = false;
            botao.innerHTML = '<i class="fa-solid fa-play"></i> Entrar no Treinamento';
        });
        alert('Erro: Treinamento não encontrado.');
    }
}


// Função de debug global para testar no console
window.debugTreinamentos = function() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔍 DEBUG COMPLETO DO SISTEMA DE TREINAMENTOS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // 1. Usuário
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('👤 USUÁRIO LOGADO:');
    console.log('   ID:', user.id);
    console.log('   Nome:', user.nome);
    console.log('   Tipo:', user.tipo);
    console.log('   Dados completos:', user);
    
    // 2. Colaboradores
    const colaboradores = JSON.parse(localStorage.getItem('colaboradoresCadastrados') || '[]');
    console.log('\n📋 COLABORADORES CADASTRADOS:');
    console.log('   Total:', colaboradores.length);
    colaboradores.forEach((c, i) => {
        console.log(`   ${i + 1}. ID: ${c.id}, Nome: ${c.nome}, RG Metro: ${c.rgMetro}`);
    });
    
    // 3. Treinamentos disponíveis
    const treinamentos = JSON.parse(localStorage.getItem('treinamentosCadastrados') || '[]');
    console.log('\n📚 TREINAMENTOS DISPONÍVEIS:');
    console.log('   Total:', treinamentos.length);
    treinamentos.forEach((t, i) => {
        console.log(`   ${i + 1}. ID: ${t.id}, Título: ${t.titulo}, Categoria: ${t.categoria}`);
    });
    
    // 4. Progresso do aluno
    const progressoAluno = JSON.parse(localStorage.getItem('progressoAluno') || '{}');
    console.log('\n📊 PROGRESSO DO ALUNO:');
    console.log('   Chaves disponíveis:', Object.keys(progressoAluno));
    if (user.id && progressoAluno[user.id]) {
        console.log(`   Progresso do usuário ${user.id}:`);
        console.log('   Total de treinamentos:', progressoAluno[user.id].treinamentos?.length || 0);
        progressoAluno[user.id].treinamentos?.forEach((t, i) => {
            console.log(`      ${i + 1}. ID: ${t.id}, Título: ${t.titulo}, Status: ${t.status}`);
        });
    } else {
        console.log('   ⚠️ Nenhum progresso encontrado para o usuário atual');
    }
    
    // 5. Inscrições
    const inscricoes = JSON.parse(localStorage.getItem('inscricoesTreinamentos') || '[]');
    console.log('\n📝 INSCRIÇÕES:');
    console.log('   Total:', inscricoes.length);
    const inscricoesUsuario = inscricoes.filter(i => i.alunoId === user.id);
    console.log(`   Inscrições do usuário ${user.id}:`, inscricoesUsuario.length);
    inscricoesUsuario.forEach((i, idx) => {
        console.log(`      ${idx + 1}. Treinamento ID: ${i.treinamentoId}, Status: ${i.status}`);
    });
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ DEBUG CONCLUÍDO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    return {
        user,
        colaboradores,
        treinamentos,
        progressoAluno: progressoAluno[user.id],
        inscricoes: inscricoesUsuario
    };
};

console.log('💡 TIP: Digite debugTreinamentos() no console para ver todos os dados!');

// Inicializar página
window.addEventListener('load', async function() {
    // Inicializar dados de exemplo se necessário
    inicializarDadosExemplo();
    
    const autenticado = await verificarAutenticacao();
    if (autenticado) {
        await carregarTreinamentos();
    }
    
    // Ativar o chip "Todas" por padrão
    setTimeout(() => {
        const chipTodas = document.querySelector('.category-chip[data-categoria=""]');
        if (chipTodas) {
            chipTodas.classList.add('active');
            console.log('✅ Chip "Todas" ativado por padrão');
        }
    }, 100);
    
    // Adicionar event listeners para filtros
    document.getElementById('search-input').addEventListener('input', aplicarFiltros);
    document.getElementById('status-filter').addEventListener('change', aplicarFiltros);
    document.getElementById('categoria-filter').addEventListener('change', aplicarFiltros);
    
    // Sincronização entre abas/telas: recarrega quando houver mudanças em treinamentos
    window.addEventListener('storage', (e) => {
        if (e.key === 'sync/trainings') {
            carregarTreinamentos();
        }
    });
});

// Expor funções para o escopo global (usadas por onclick em HTML)
try {
    window.carregarTreinamentos = carregarTreinamentos;
    window.atualizarEstatisticas = atualizarEstatisticas;
} catch (_) {}