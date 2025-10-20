// ===== DADOS =====
let treinamentosDisponiveis = [];
let certificadosAluno = [];
let treinamentosConcluidos = [];

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    carregarDados();
    renderizarTreinamentos();
    atualizarEstatisticas();
});

// ===== CARREGAR DADOS =====
function carregarDados() {
    // Carregar treinamentos disponíveis
    const treinamentos = localStorage.getItem('treinamentosCadastrados');
    if (treinamentos) {
        treinamentosDisponiveis = JSON.parse(treinamentos);
    }
    
    // Carregar treinamentos concluídos pelo aluno
    const concluidos = localStorage.getItem('treinamentosConcluidos');
    if (concluidos) {
        treinamentosConcluidos = JSON.parse(concluidos);
    }
    
    // Carregar certificados do aluno
    const certificados = localStorage.getItem('certificadosDisponiveis');
    if (certificados) {
        certificadosAluno = JSON.parse(certificados);
    }
}

// ===== RENDERIZAR TREINAMENTOS =====
function renderizarTreinamentos() {
    const container = document.getElementById('treinamentosList');
    const emptyState = document.getElementById('emptyMessage');
    
    // Buscar treinamentos do aluno baseado nos concluídos pelo aluno
    const treinamentosAluno = buscarTreinamentosAluno();
    
    if (treinamentosAluno.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    container.style.display = 'block';
    emptyState.style.display = 'none';
    
    container.innerHTML = treinamentosAluno.map(treinamento => {
        const statusClass = treinamento.status;
        const statusText = treinamento.statusText;
        const progress = treinamento.progress;
        
        return `
            <div class="treinamento-item">
                <div class="treinamento-info">
                    <h3>${treinamento.titulo}</h3>
                    <p>${treinamento.descricao}</p>
                </div>
                <div class="treinamento-status">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                    ${treinamento.status === 'concluido' ? `
                        <button class="btn-action btn-certificate" onclick="verCertificado(${treinamento.id})">
                            <i class="fa-solid fa-certificate"></i> Ver Certificado
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// ===== BUSCAR TREINAMENTOS DO ALUNO =====
function buscarTreinamentosAluno() {
    const treinamentosAluno = [];
    
    // Buscar treinamentos concluídos que incluem este aluno
    treinamentosConcluidos.forEach(concluido => {
        const treinamentoOriginal = treinamentosDisponiveis.find(t => t.id === concluido.treinamentoId);
        
        if (treinamentoOriginal) {
            // Verificar se o aluno está na lista de concluídos
            const alunoConcluiu = concluido.alunosConcluidos && 
                concluido.alunosConcluidos.some(aluno => 
                    aluno.rgMetro === '123456789' // RG do aluno logado (em um sistema real, viria da sessão)
                );
            
            if (alunoConcluiu) {
                treinamentosAluno.push({
                    id: treinamentoOriginal.id,
                    titulo: treinamentoOriginal.titulo,
                    descricao: treinamentoOriginal.descricao,
                    status: 'concluido',
                    statusText: 'Concluído',
                    progress: 100
                });
            } else {
                // Verificar se o aluno está inscrito mas não concluiu
                const alunoInscrito = concluido.alunosInscritos && 
                    concluido.alunosInscritos.some(aluno => 
                        aluno.rgMetro === '123456789'
                    );
                
                if (alunoInscrito) {
                    treinamentosAluno.push({
                        id: treinamentoOriginal.id,
                        titulo: treinamentoOriginal.titulo,
                        descricao: treinamentoOriginal.descricao,
                        status: 'em-andamento',
                        statusText: 'Em Andamento',
                        progress: 50
                    });
                }
            }
        }
    });
    
    return treinamentosAluno;
}

// ===== ATUALIZAR ESTATÍSTICAS =====
function atualizarEstatisticas() {
    const treinamentosAluno = buscarTreinamentosAluno();
    
    const totalCursos = treinamentosAluno.length;
    const concluidos = treinamentosAluno.filter(t => t.status === 'concluido').length;
    const emAndamento = treinamentosAluno.filter(t => t.status === 'em-andamento').length;
    const certificados = certificadosAluno.length;
    
    document.getElementById('total-cursos').textContent = totalCursos;
    document.getElementById('concluidos').textContent = concluidos;
    document.getElementById('em-andamento').textContent = emAndamento;
    document.getElementById('certificados').textContent = certificados;
}

// ===== VER CERTIFICADO =====
function verCertificado(treinamentoId) {
    const certificado = certificadosAluno.find(c => c.treinamentoId === treinamentoId);
    
    if (certificado) {
        // Abrir certificado em nova aba
        const certificadoWindow = window.open('', '_blank');
        certificadoWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Certificado - ${certificado.titulo}</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .certificado { border: 3px solid #002776; padding: 40px; max-width: 800px; margin: 0 auto; }
                    .logo { font-size: 24px; font-weight: bold; color: #002776; margin-bottom: 20px; }
                    .titulo { font-size: 28px; font-weight: bold; margin: 20px 0; }
                    .aluno { font-size: 18px; margin: 20px 0; }
                    .data { font-size: 14px; color: #666; margin-top: 30px; }
                </style>
            </head>
            <body>
                <div class="certificado">
                    <div class="logo">GOVERNO DO ESTADO DE SÃO PAULO</div>
                    <div class="logo">METRÔ DE SÃO PAULO</div>
                    <h1 class="titulo">CERTIFICADO DE CONCLUSÃO</h1>
                    <p class="aluno">Certificamos que <strong>${certificado.nomeAluno}</strong></p>
                    <p class="aluno">RG do Metrô: <strong>${certificado.rgMetro}</strong></p>
                    <p>concluiu com sucesso o treinamento:</p>
                    <h2>${certificado.titulo}</h2>
                    <p>${certificado.descricao}</p>
                    <div class="data">
                        <p>Data de conclusão: ${certificado.dataConclusao}</p>
                        <p>Data de emissão: ${certificado.dataEmissao}</p>
                    </div>
                </div>
            </body>
            </html>
        `);
    } else {
        alert('Certificado não encontrado. Entre em contato com o administrador.');
    }
}

// ===== VOLTAR AO DASHBOARD =====
function voltarDashboard() {
    window.location.href = '../2025_maua_pii_t3_sub2_controle_treinamentos_metro_sp-tela-aluno-home/TelaAlunoHome/aluno_home.html';
}

// ===== SAIR =====
function sair() {
    if (confirm('Tem certeza que deseja sair do sistema?')) {
        window.location.href = '../../2025_maua_pii_t3_sub2_controle_treinamentos_metro_sp-tela_login/tela_login.html';
    }
}