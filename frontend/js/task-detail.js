class TaskDetail {
    constructor() {
        this.apiBaseUrl = '/api';
        this.taskId = new URLSearchParams(window.location.search).get('id');
        this.init();
    }

    async init() {
        if (!this.taskId) {
            window.location.href = 'tasks.html';
            return;
        }
        await this.loadTaskDetail();
    }

    async loadTaskDetail() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/tasks/${this.taskId}`, {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success) {
                this.renderTaskDetail(data.task);
            } else {
                window.location.href = 'tasks.html';
            }
        } catch (error) {
            console.error('Erro ao carregar detalhes da tarefa:', error);
            window.location.href = 'tasks.html';
        }
    }

    renderTaskDetail(task) {
        const container = document.getElementById('taskDetail');
        
        const dueDate = new Date(task.due_date);
        const today = new Date();
        const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        const isOverdue = daysDiff < 0 && task.status !== 'completed';
        
        const statusText = task.status === 'completed' ? 'Concluído' : 
                          task.status === 'in_progress' ? 'Em Andamento' : 'Pendente';
        const statusClass = task.status === 'completed' ? 'completed' : 
                           task.status === 'in_progress' ? 'progress' : 'pending';
        
        const priorityText = task.priority === 'high' ? 'Alta' : 
                            task.priority === 'medium' ? 'Média' : 'Baixa';
        const priorityClass = task.priority;
        
        container.innerHTML = `
            <div class="task-detail-card">
                <div class="task-detail-header">
                    <h2>${task.title}</h2>
                    <div>
                        <span class="badge badge-${statusClass}">${statusText}</span>
                        <span class="badge badge-${priorityClass}">Prioridade ${priorityText}</span>
                    </div>
                </div>
                
                <div class="task-detail-info">
                    <div class="info-section">
                        <h3><i class="fas fa-info-circle"></i> Informações da Tarefa</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <strong>Categoria:</strong>
                                <span>${this.getCategoryName(task.category)}</span>
                            </div>
                            <div class="info-item">
                                <strong>Data de Criação:</strong>
                                <span>${this.formatDate(task.created_at)}</span>
                            </div>
                            <div class="info-item">
                                <strong>Prazo:</strong>
                                <span class="${isOverdue ? 'overdue' : ''}">
                                    ${this.formatDate(task.due_date)} 
                                    ${isOverdue ? ' (Vencido)' : daysDiff >= 0 ? ` (${daysDiff} dias restantes)` : ''}
                                </span>
                            </div>
                            <div class="info-item">
                                <strong>Data de Conclusão:</strong>
                                <span>${task.completed_at ? this.formatDate(task.completed_at) : 'Não concluída'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <h3><i class="fas fa-user"></i> Informações do Cliente</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <strong>Nome:</strong>
                                <span>${task.client_name}</span>
                            </div>
                            <div class="info-item">
                                <strong>Telefone:</strong>
                                <span>${task.client_phone || 'Não informado'}</span>
                            </div>
                            <div class="info-item">
                                <strong>Email:</strong>
                                <span>${task.client_email || 'Não informado'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <h3><i class="fas fa-laptop"></i> Equipamento</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <strong>Equipamento:</strong>
                                <span>${task.equipment || 'Não informado'}</span>
                            </div>
                            <div class="info-item">
                                <strong>Modelo:</strong>
                                <span>${task.equipment_model || 'Não informado'}</span>
                            </div>
                            <div class="info-item">
                                <strong>Peças Necessárias:</strong>
                                <span>${task.required_parts || 'Nenhuma peça listada'}</span>
                            </div>
                            <div class="info-item">
                                <strong>Orçamento:</strong>
                                <span>${task.budget ? `R$ ${parseFloat(task.budget).toFixed(2)}` : 'Não definido'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <h3><i class="fas fa-user-cog"></i> Responsável</h3>
                        <div class="info-item">
                            <strong>Técnico:</strong>
                            <span>${task.technician_name || 'Não atribuído'}</span>
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <h3><i class="fas fa-file-alt"></i> Descrição</h3>
                        <div class="description-box">
                            ${task.description || 'Sem descrição'}
                        </div>
                    </div>
                </div>
                
                <div class="task-detail-actions">
                    <button onclick="editTask(${task.id})" class="btn btn-warning">
                        <i class="fas fa-edit"></i> Editar Tarefa
                    </button>
                    <button onclick="deleteTask(${task.id})" class="btn btn-danger">
                        <i class="fas fa-trash"></i> Excluir Tarefa
                    </button>
                </div>
            </div>
        `;
    }

    getCategoryName(categoryId) {
        const categories = {
            'venda': 'Venda de Equipamentos',
            'reparo_pc': 'Reparação de PC',
            'reparo_celular': 'Reparação de Celular',
            'reparo_impressora': 'Reparação de Impressora',
            'instalacao_software': 'Instalação de Software',
            'rede': 'Configuração de Rede',
            'backup': 'Backup de Dados',
            'outros': 'Outros Serviços'
        };
        return categories[categoryId] || categoryId;
    }

    formatDate(dateString) {
        if (!dateString) return 'Não definido';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    new TaskDetail();
});

// Funções globais
window.editTask = (taskId) => {
    window.location.href = `tasks.html?edit=${taskId}`;
};

window.deleteTask = async (taskId) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            window.location.href = 'tasks.html';
        }
    } catch (error) {
        console.error('Erro ao excluir tarefa:', error);
        alert('Erro ao excluir tarefa. Tente novamente.');
    }
};