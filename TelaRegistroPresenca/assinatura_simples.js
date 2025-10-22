// ===== ASSINATURA SIMPLES =====

let canvas = null;
let ctx = null;
let isDrawing = false;
let alunoSelecionado = null;

// Função para abrir modal de assinatura
function abrirAssinatura(alunoId) {
    console.log('Abrindo assinatura para aluno:', alunoId);
    alunoSelecionado = alunoId;
    
    const modal = document.getElementById('assinatura-modal');
    if (modal) {
        modal.style.display = 'block';
        
        // Aguardar o modal aparecer e inicializar canvas
        setTimeout(() => {
            inicializarCanvasSimples();
        }, 200);
    } else {
        alert('Modal de assinatura não encontrado!');
    }
}

// Função para fechar modal
function fecharAssinatura() {
    const modal = document.getElementById('assinatura-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    alunoSelecionado = null;
}

// Inicializar canvas de forma simples
function inicializarCanvasSimples() {
    console.log('Inicializando canvas simples...');
    
    canvas = document.getElementById('signature-canvas');
    if (!canvas) {
        console.error('Canvas não encontrado!');
        return;
    }
    
    ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Contexto 2D não criado!');
        return;
    }
    
    // Configurar canvas
    ctx.strokeStyle = '#002776';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Remover eventos antigos
    canvas.onmousedown = null;
    canvas.onmousemove = null;
    canvas.onmouseup = null;
    canvas.onmouseout = null;
    canvas.ontouchstart = null;
    canvas.ontouchmove = null;
    canvas.ontouchend = null;
    
    // Adicionar eventos novos
    canvas.addEventListener('mousedown', function(e) {
        console.log('Mouse down');
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        ctx.beginPath();
        ctx.moveTo(x, y);
    });
    
    canvas.addEventListener('mousemove', function(e) {
        if (!isDrawing) return;
        console.log('Mouse move');
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        ctx.lineTo(x, y);
        ctx.stroke();
    });
    
    canvas.addEventListener('mouseup', function(e) {
        console.log('Mouse up');
        isDrawing = false;
    });
    
    canvas.addEventListener('mouseout', function(e) {
        console.log('Mouse out');
        isDrawing = false;
    });
    
    // Touch events
    canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();
        console.log('Touch start');
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        isDrawing = true;
        ctx.beginPath();
        ctx.moveTo(x, y);
    });
    
    canvas.addEventListener('touchmove', function(e) {
        e.preventDefault();
        if (!isDrawing) return;
        console.log('Touch move');
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        ctx.lineTo(x, y);
        ctx.stroke();
    });
    
    canvas.addEventListener('touchend', function(e) {
        console.log('Touch end');
        isDrawing = false;
    });
    
    console.log('Canvas inicializado com sucesso!');
}


// Limpar canvas
function limparCanvas() {
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        console.log('Canvas limpo!');
    }
}

// Salvar assinatura
function salvarAssinatura() {
    console.log('Salvando assinatura...');
    
    if (!alunoSelecionado) {
        alert('Nenhum aluno selecionado!');
        return;
    }
    
    if (!canvas || !ctx) {
        alert('Canvas não inicializado!');
        return;
    }
    
    // Verificar se há algo desenhado
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let hasDrawing = false;
    
    for (let i = 0; i < data.length; i += 4) {
        if (data[i] !== 0 || data[i + 1] !== 0 || data[i + 2] !== 0 || data[i + 3] !== 0) {
            hasDrawing = true;
            break;
        }
    }
    
    if (!hasDrawing) {
        alert('Por favor, desenhe sua assinatura antes de salvar!');
        return;
    }
    
    const dataURL = canvas.toDataURL();
    console.log('Assinatura salva:', dataURL.substring(0, 50) + '...');
    
    // Salvar no objeto global (assumindo que existe)
    if (typeof presencaAtual !== 'undefined') {
        presencaAtual[alunoSelecionado + '_assinatura'] = dataURL;
        presencaAtual[alunoSelecionado] = 'presente';
        
        // Atualizar interface se as funções existirem
        if (typeof renderizarAlunos === 'function') {
            renderizarAlunos();
        }
        if (typeof atualizarResumo === 'function') {
            atualizarResumo();
        }
    }
    
    fecharAssinatura();
    alert('Assinatura salva com sucesso!');
}

