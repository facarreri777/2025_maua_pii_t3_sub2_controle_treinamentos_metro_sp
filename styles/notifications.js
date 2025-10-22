// ===== SISTEMA DE NOTIFICAÇÕES =====

class NotificationManager {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        // Criar container de notificações se não existir
        if (!document.querySelector('.notification-container')) {
            this.container = document.createElement('div');
            this.container.className = 'notification-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.querySelector('.notification-container');
        }
    }

    show(type, title, message, duration = 5000) {
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

        this.container.appendChild(notification);

        // Trigger da animação
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Auto-remove após a duração especificada
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification);
            }, duration);
        }

        return notification;
    }

    remove(notification) {
        if (notification && notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 400);
        }
    }

    // Métodos de conveniência
    success(title, message, duration = 5000) {
        return this.show('success', title, message, duration);
    }

    info(title, message, duration = 5000) {
        return this.show('info', title, message, duration);
    }

    warning(title, message, duration = 5000) {
        return this.show('warning', title, message, duration);
    }

    error(title, message, duration = 5000) {
        return this.show('error', title, message, duration);
    }

    // Notificações específicas do sistema
    treinamentoCadastrado(nomeTreinamento) {
        return this.success(
            'Treinamento Cadastrado!',
            `O treinamento "${nomeTreinamento}" foi cadastrado com sucesso no sistema.`,
            6000
        );
    }

    treinamentoConcluido(nomeTreinamento) {
        return this.success(
            'Treinamento Concluído!',
            `Parabéns! Você concluiu o treinamento "${nomeTreinamento}" com sucesso.`,
            6000
        );
    }

    treinamentoIniciado(nomeTreinamento) {
        return this.info(
            'Treinamento Iniciado',
            `Você iniciou o treinamento "${nomeTreinamento}". Boa sorte!`,
            5000
        );
    }

    colaboradorCadastrado(nomeColaborador) {
        return this.success(
            'Colaborador Cadastrado!',
            `O colaborador "${nomeColaborador}" foi cadastrado com sucesso no sistema.`,
            6000
        );
    }

    erroGenerico(mensagem) {
        return this.error(
            'Erro',
            mensagem || 'Ocorreu um erro inesperado. Tente novamente.',
            7000
        );
    }

    sucessoGenerico(mensagem) {
        return this.success(
            'Sucesso',
            mensagem || 'Operação realizada com sucesso!',
            5000
        );
    }
}

// Instância global do gerenciador de notificações
window.notificationManager = new NotificationManager();

// Funções globais para facilitar o uso
window.showNotification = (type, title, message, duration) => {
    return window.notificationManager.show(type, title, message, duration);
};

window.showSuccess = (title, message, duration) => {
    return window.notificationManager.success(title, message, duration);
};

window.showError = (title, message, duration) => {
    return window.notificationManager.error(title, message, duration);
};

window.showInfo = (title, message, duration) => {
    return window.notificationManager.info(title, message, duration);
};

window.showWarning = (title, message, duration) => {
    return window.notificationManager.warning(title, message, duration);
};














