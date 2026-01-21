class TaskManager {
    constructor() {
        this.apiBaseUrl = '/api';
        this.currentTaskId = null;
        this.init();
    }

    async init() {
        await this.loadCategories();
        await this.loadTasks();
        this.setupModal();
    }

    async loadCategories() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/tasks/categories`, {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success) {
                this.updateCategorySelects(data.categories);
            }
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
        }
    }

    updateCategorySelects(categories) {
        const filterSelect = document.getElementById('filterCategory');
        const taskSelect = document.getElementById('taskCategory');
        
        // Limpar opções existentes (exceto a primeira)
        while (filterSelect.options.length > 1) filterSelect.remove(1);
        while (taskSelect.options.length > 0) taskSelect.remove(0);
        
        categories.forEach(category => {
            // Para filtro
            const filterOption = document.createElement('option');
            filterOption.value = category.id;
            filterOption.textContent = `${category.icon} ${category.name}`;
            filterSelect.appendChild(filterOption);
            
            // Para formulário
            const taskOption = document.createElement('option');
            taskOption.value = category.id;
            taskOption.textContent = `${category.icon} ${category.name}`;
            taskSelect.appendChild(taskOption);
        });
    }

    async loadTasks() {
        try {
            const filters = {
                status: document.getElementById('filterStatus').value,
                category: document.getElementById('filterCategory').value,
                priority: document.getElementById('filterPriority').value,
                search: document.getElementById('filterSearch').value
            };
            
            const queryString = new URLSearchParams(filters).toString();
            const response = await fetch(`${this.apiBaseUrl}/tasks?${queryString}`, {
                credentials: 'include'
            });
            
            const data = await response.json();
            if (data.success) {
                this.renderTasks(data.tasks);
            }
        } catch (error) {
            console.error('Erro ao carregar tarefas:', error);
        }
    }

    renderTasks(tasks) {
        const container = document.getElementById('tasksContainer');
        container.innerHTML = '';

        if (tasks.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #6b7280;">
                    <i class="fas fa-inbox fa-3x" style="margin-bottom: 20px; opacity: 0.5;"></i>
                    <h3>Nenhuma tarefa encontrada</h3>
                    <p>Tente ajustar os filtros ou crie uma nova tarefa.</p>
                </div>
            `;
            return;
        }

        tasks.forEach(task => {
            const card = this.createTaskCard(task);
            container.appendChild(card);
        });
    }

    createTaskCard(task) {
        const card = document.createElement('div');
        card.className = `task-card ${task.priority}`;
        
        const dueDate = new Date(task.due_date);
        const today = new Date();
        const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        const isOverdue = daysDiff < 0 && task.status !== 'completed';
        
        const categoryIcon = this.getCategoryIcon(task.category);
        const categoryName = this.getCategoryName(task.category);
        
        card.innerHTML = `
            <div class="task-header">
                <div>
                    <div class="task-title">${task.title}</div>
                    <div class="task-client">
                        <i class="fas fa-user"></i> ${task.client_name}
                        ${task.client_phone ? ` • ${task.client_phone}` : ''}
                    </div>
                </div>
                <div style="text-align: right;">
                    <span class="badge badge-${task.priority}">
                        ${task.priority === 'high' ? 'Alta' : 
                          task.priority === 'medium' ? 'Média' : 'Baixa'}
                    </span>
                    <span class="badge badge-${task.status === 'completed' ? 'completed' : 
                                              task.status === 'in_progress' ? 'progress' : 'pending'}" 
                          style="display: block; margin-top: 5px;">
                        ${task.status === 'completed' ? 'Concluído' : 
                          task.status === 'in_progress' ? 'Em Andamento' : 'Pendente'}
                    </span>
                </div>
            </div>
            
            <div style="margin: 12px 0;">
                <div><strong>${categoryIcon} ${categoryName}</strong></div>
                ${task.equipment ? `<div><i class="fas fa-laptop"></i> ${task.equipment}</div>` : ''}
                ${task.equipment_model ? `<div><small>Modelo: ${task.equipment_model}</small></div>` : ''}
            </div>
            
            <div style="margin: 12px 0; font-size: 0.9rem; color: #6b7280;">
                ${task.description ? `<div>${task.description.substring(0, 100)}${task.description.length > 100 ? '...' : ''}</div>` : ''}
            </div>
            
            <div class="task-due-date ${isOverdue ? 'overdue' : ''}">
                <i class="fas fa-calendar"></i> 
                Prazo: ${this.formatDate(task.due_date)}
                ${isOverdue ? ' ⚠️ Vencido' : daysDiff >= 0 ? ` (${daysDiff} dias)` : ''}
            </div>
            
            ${task.budget ? `
                <div style="margin: 8px 0; padding: 8px; background: #f0f9ff; border-radius: 4px;">
                    <i class="fas fa-money-bill"></i> 
                    Orçamento: R$ ${parseFloat(task.budget).toFixed(2)}
                </div>
            ` : ''}
            
            <div class="task-actions">
                <a href="task-detail.html?id=${task.id}" class="btn btn-primary" style="padding: 6px 12px;">
                    <i class="fas fa-eye"></i> Detalhes
                </a>
                <button onclick="editTask(${task.id})" class="btn btn-warning" style="padding: 6px 12px;">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button onclick="deleteTask(${task.id})" class="btn btn-danger" style="padding: 6px 12px;">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;
        
        return card;
    }

    setupModal() {
        // Definir data mínima como hoje
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('dueDate').min = tomorrow.toISOString().split('T')[0];
    }

    openTaskModal(taskId = null) {
        this.currentTaskId = taskId;
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        const modalTitle = modal.querySelector('h3');
        
        if (taskId) {
            modalTitle.innerHTML = '<i class="fas fa-edit"></i> Editar Tarefa';
            this.loadTaskData(taskId);
        } else {
            modalTitle.innerHTML = '<i class="fas fa-plus"></i> Nova Tarefa';
            form.reset();
            
            // Definir data padrão para 7 dias à frente
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            document.getElementById('dueDate').value = nextWeek.toISOString().split('T')[0];
        }
        
        modal.style.display = 'flex';
    }

    closeTaskModal() {
        document.getElementById('taskModal').style.display = 'none';
        document.getElementById('taskForm').reset();
        this.currentTaskId = null;
    }

    async loadTaskData(taskId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/tasks/${taskId}`, {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success) {
                const task = data.task;
                document.getElementById('taskTitle').value = task.title;
                document.getElementById('taskCategory').value = task.category;
                document.getElementById('taskPriority').value = task.priority;
                document.getElementById('clientName').value = task.client_name;
                document.getElementById('clientPhone').value = task.client_phone || '';
                document.getElementById('clientEmail').value = task.client_email || '';
                document.getElementById('equipment').value = task.equipment || '';
                document.getElementById('equipmentModel').value = task.equipment_model || '';
                document.getElementById('requiredParts').value = task.required_parts || '';
                document.getElementById('budget').value = task.budget || '';
                document.getElementById('taskDescription').value = task.description || '';
                
                if (task.due_date) {
                    document.getElementById('dueDate').value = task.due_date.split('T')[0];
                }
            }
        } catch (error) {
            console.error('Erro ao carregar tarefa:', error);
        }
    }

    async saveTask(event) {
        event.preventDefault();
        
        try {
            const taskData = {
                title: document.getElementById('taskTitle').value,
                category: document.getElementById('taskCategory').value,
                priority: document.getElementById('taskPriority').value,
                client_name: document.getElementById('clientName').value,
                client_phone: document.getElementById('clientPhone').value,
                client_email: document.getElementById('clientEmail').value,
                equipment: document.getElementById('equipment').value,
                equipment_model: document.getElementById('equipmentModel').value,
                required_parts: document.getElementById('requiredParts').value,
                budget: document.getElementById('budget').value || null,
                description: document.getElementById('taskDescription').value,
                due_date: document.getElementById('dueDate').value,
                status: 'pending'
            };
            
            const url = this.currentTaskId 
                ? `${this.apiBaseUrl}/tasks/${this.currentTaskId}`
                : `${this.apiBaseUrl}/tasks`;
            
            const method = this.currentTaskId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(taskData),
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.closeTaskModal();
                await this.loadTasks();
                
                // Mostrar mensagem de sucesso
                const alertDiv = document.createElement('div');
                alertDiv.className = 'alert alert-success';
                alertDiv.textContent = this.currentTaskId 
                    ? 'Tarefa atualizada com sucesso!' 
                    : 'Tarefa criada com sucesso!';
                alertDiv.style.position = 'fixed';
                alertDiv.style.top = '80px';
                alertDiv.style.right = '20px';
                alertDiv.style.zIndex = '1000';
                document.body.appendChild(alertDiv);
                
                setTimeout(() => alertDiv.remove(), 3000);
            }
        } catch (error) {
            console.error('Erro ao salvar tarefa:', error);
            alert('Erro ao salvar tarefa. Tente novamente.');
        }
    }

    async deleteTask(taskId) {
        if (!confirm('Tem certeza que deseja excluir esta tarefa?')) {
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/tasks/${taskId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.success) {
                await this.loadTasks();
                
                // Mostrar mensagem de sucesso
                const alertDiv = document.createElement('div');
                alertDiv.className = 'alert alert-success';
                alertDiv.textContent = 'Tarefa excluída com sucesso!';
                alertDiv.style.position = 'fixed';
                alertDiv.style.top = '80px';
                alertDiv.style.right = '20px';
                alertDiv.style.zIndex = '1000';
                document.body.appendChild(alertDiv);
                
                setTimeout(() => alertDiv.remove(), 3000);
            }
        } catch (error) {
            console.error('Erro ao excluir tarefa:', error);
            alert('Erro ao excluir tarefa. Tente novamente.');
        }
    }

    getCategoryIcon(categoryId) {
        const icons = {
            'venda': '🛒',
            'reparo_pc': '💻',
            'reparo_celular': '📱',
            'reparo_impressora': '🖨️',
            'instalacao_software': '📀',
            'rede': '🌐',
            'backup': '💾',
            'outros': '🔧'
        };
        return icons[categoryId] || '📋';
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

// Instanciar o gerenciador de tarefas
const taskManager = new TaskManager();

// Funções globais para acesso pelo HTML
window.openTaskModal = (taskId) => taskManager.openTaskModal(taskId);
window.closeTaskModal = () => taskManager.closeTaskModal();
window.saveTask = (event) => taskManager.saveTask(event);
window.editTask = (taskId) => taskManager.openTaskModal(taskId);
window.deleteTask = (taskId) => taskManager.deleteTask(taskId);
window.loadTasks = () => taskManager.loadTasks();