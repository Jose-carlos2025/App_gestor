class Dashboard {
    constructor() {
        this.apiBaseUrl = '/api';
        this.init();
    }

    async init() {
        await this.loadDashboardData();
        setInterval(() => this.loadDashboardData(), 30000); // Atualizar a cada 30 segundos
    }

    async loadDashboardData() {
        try {
            const [statsRes, recentRes, upcomingRes] = await Promise.all([
                fetch(`${this.apiBaseUrl}/dashboard/stats`, { credentials: 'include' }),
                fetch(`${this.apiBaseUrl}/tasks?limit=5`, { credentials: 'include' }),
                fetch(`${this.apiBaseUrl}/tasks/upcoming`, { credentials: 'include' })
            ]);

            const statsData = await statsRes.json();
            const recentData = await recentRes.json();
            const upcomingData = await upcomingRes.json();

            if (statsData.success) {
                this.updateStats(statsData.stats);
                this.updateCategoryDistribution(statsData.stats.byCategory);
            }

            if (recentData.success) {
                this.updateRecentTasks(recentData.tasks);
            }

            if (upcomingData.success) {
                this.updateUpcomingTasks(upcomingData.tasks);
            }
        } catch (error) {
            console.error('Erro ao carregar dados do dashboard:', error);
        }
    }

    updateStats(stats) {
        document.getElementById('totalTasks').textContent = stats.total || 0;
        document.getElementById('pendingTasks').textContent = stats.pending || 0;
        document.getElementById('inProgressTasks').textContent = stats.in_progress || 0;
        document.getElementById('completedTasks').textContent = stats.completed || 0;
        document.getElementById('overdueTasks').textContent = stats.overdue || 0;
        
        const completionRate = stats.total > 0 
            ? Math.round((stats.completed / stats.total) * 100) 
            : 0;
        document.getElementById('completionRate').textContent = `${completionRate}%`;
    }

    updateRecentTasks(tasks) {
        const tbody = document.getElementById('recentTasks');
        tbody.innerHTML = '';

        tasks.slice(0, 5).forEach(task => {
            const row = document.createElement('tr');
            
            const dueDate = new Date(task.due_date);
            const today = new Date();
            const isOverdue = dueDate < today && task.status !== 'completed';
            
            row.innerHTML = `
                <td>
                    <strong>${task.title}</strong><br>
                    <small style="color: #6b7280;">${task.category}</small>
                </td>
                <td>${task.client_name}</td>
                <td>
                    <span class="badge badge-${task.status === 'completed' ? 'completed' : 
                                              task.status === 'in_progress' ? 'progress' : 'pending'}">
                        ${task.status === 'completed' ? 'Concluído' : 
                          task.status === 'in_progress' ? 'Em Andamento' : 'Pendente'}
                    </span>
                </td>
                <td class="${isOverdue ? 'task-due-date overdue' : 'task-due-date'}">
                    ${this.formatDate(task.due_date)}
                    ${isOverdue ? ' ⚠️' : ''}
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    updateUpcomingTasks(tasks) {
        const container = document.getElementById('upcomingTasks');
        container.innerHTML = '';

        tasks.slice(0, 3).forEach(task => {
            const card = document.createElement('div');
            card.className = `task-card ${task.priority}`;
            
            const dueDate = new Date(task.due_date);
            const today = new Date();
            const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            
            card.innerHTML = `
                <div class="task-header">
                    <div>
                        <div class="task-title">${task.title}</div>
                        <div class="task-client">${task.client_name}</div>
                    </div>
                    <span class="badge badge-${task.priority}">
                        ${task.priority === 'high' ? 'Alta' : 
                          task.priority === 'medium' ? 'Média' : 'Baixa'}
                    </span>
                </div>
                
                <div style="margin: 12px 0; font-size: 0.9rem;">
                    <div><i class="fas fa-tag"></i> ${this.getCategoryName(task.category)}</div>
                    <div><i class="fas fa-user"></i> ${task.technician_name || 'Não atribuído'}</div>
                </div>
                
                <div class="task-due-date ${daysDiff <= 0 ? 'overdue' : ''}">
                    <i class="fas fa-calendar"></i> 
                    Prazo: ${this.formatDate(task.due_date)}
                    ${daysDiff <= 0 ? ' (Vencido)' : ` (${daysDiff} dias)`}
                </div>
                
                <div class="task-actions">
                    <a href="task-detail.html?id=${task.id}" class="btn btn-primary" style="padding: 6px 12px; font-size: 0.9rem;">
                        <i class="fas fa-eye"></i> Ver
                    </a>
                </div>
            `;
            
            container.appendChild(card);
        });
    }

    updateCategoryDistribution(categories) {
        const tbody = document.getElementById('categoryDistribution');
        tbody.innerHTML = '';

        categories.forEach(category => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.getCategoryName(category.category)}</td>
                <td>${category.count}</td>
                <td>${Math.round((category.count / categories.reduce((a, b) => a + b.count, 0)) * 100)}%</td>
            `;
            tbody.appendChild(row);
        });
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

// Inicializar dashboard quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});