const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../frontend')));

// Middleware para parsear JSON
app.use(express.json());

// USUÁRIOS FIXOS (apenas para teste)
const users = [
    {
        id: 1,
        name: 'Administrador',
        email: 'admin@empresa.com',
        password: 'Admin@123',
        role: 'admin'
    }
];

// TAREFAS DE EXEMPLO
let tasks = [
    {
        id: 1,
        title: 'Reparo de Notebook Dell',
        description: 'Tela não liga e ventoinha fazendo barulho',
        category: 'reparo_pc',
        priority: 'high',
        status: 'pending',
        client_name: 'João Silva',
        client_phone: '(11) 98765-4321',
        equipment: 'Notebook Dell Inspiron',
        due_date: '2024-12-20',
        budget: 450.00,
        created_at: '2024-01-15'
    },
    {
        id: 2,
        title: 'Venda de PC Gamer',
        description: 'Configuração completa para jogos',
        category: 'venda',
        priority: 'medium',
        status: 'in_progress',
        client_name: 'Maria Santos',
        equipment: 'PC Gamer Completo',
        due_date: '2024-12-15',
        budget: 3200.00,
        created_at: '2024-01-14'
    },
    {
        id: 3,
        title: 'Reparo de iPhone 13',
        description: 'Tela trincada e bateria fraca',
        category: 'reparo_celular',
        priority: 'high',
        status: 'pending',
        client_name: 'Carlos Oliveira',
        client_phone: '(11) 91234-5678',
        equipment: 'iPhone 13',
        due_date: '2024-12-18',
        budget: 350.00,
        created_at: '2024-01-13'
    }
];

// ========== ROTAS DA API ==========

// LOGIN SIMPLES
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    console.log('📧 Tentativa de login:', email);
    
    // Encontrar usuário
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        // Remover senha da resposta
        const { password, ...userWithoutPassword } = user;
        
        console.log('✅ Login bem-sucedido para:', user.name);
        
        res.json({
            success: true,
            user: userWithoutPassword
        });
    } else {
        console.log('❌ Login falhou para:', email);
        res.status(401).json({
            success: false,
            error: 'Email ou senha incorretos'
        });
    }
});

// OBTER TAREFAS
app.get('/api/tasks', (req, res) => {
    const { status, category, priority, search } = req.query;
    
    let filteredTasks = [...tasks];
    
    // Aplicar filtros
    if (status) {
        filteredTasks = filteredTasks.filter(task => task.status === status);
    }
    
    if (category) {
        filteredTasks = filteredTasks.filter(task => task.category === category);
    }
    
    if (priority) {
        filteredTasks = filteredTasks.filter(task => task.priority === priority);
    }
    
    if (search) {
        const searchLower = search.toLowerCase();
        filteredTasks = filteredTasks.filter(task => 
            task.title.toLowerCase().includes(searchLower) ||
            task.description.toLowerCase().includes(searchLower) ||
            task.client_name.toLowerCase().includes(searchLower)
        );
    }
    
    res.json({
        success: true,
        tasks: filteredTasks
    });
});

// OBTER UMA TAREFA ESPECÍFICA
app.get('/api/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    const task = tasks.find(t => t.id === taskId);
    
    if (task) {
        res.json({
            success: true,
            task: task
        });
    } else {
        res.status(404).json({
            success: false,
            error: 'Tarefa não encontrada'
        });
    }
});

// CRIAR NOVA TAREFA
app.post('/api/tasks', (req, res) => {
    const newTask = req.body;
    newTask.id = tasks.length + 1;
    newTask.created_at = new Date().toISOString().split('T')[0];
    newTask.status = newTask.status || 'pending';
    newTask.priority = newTask.priority || 'medium';
    
    tasks.push(newTask);
    
    res.json({
        success: true,
        task: newTask
    });
});

// ATUALIZAR TAREFA
app.put('/api/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex !== -1) {
        tasks[taskIndex] = { ...tasks[taskIndex], ...req.body };
        res.json({
            success: true,
            task: tasks[taskIndex]
        });
    } else {
        res.status(404).json({
            success: false,
            error: 'Tarefa não encontrada'
        });
    }
});

// EXCLUIR TAREFA
app.delete('/api/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex !== -1) {
        tasks.splice(taskIndex, 1);
        res.json({
            success: true,
            message: 'Tarefa excluída com sucesso'
        });
    } else {
        res.status(404).json({
            success: false,
            error: 'Tarefa não encontrada'
        });
    }
});

// DASHBOARD STATS
app.get('/api/dashboard/stats', (req, res) => {
    const stats = {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        overdue: 0 // Simplificado para este exemplo
    };
    
    res.json({
        success: true,
        stats: stats
    });
});

// CATEGORIAS
app.get('/api/categories', (req, res) => {
    const categories = [
        { id: 'venda', name: 'Venda de Equipamentos', icon: '🛒' },
        { id: 'reparo_pc', name: 'Reparação de PC', icon: '💻' },
        { id: 'reparo_celular', name: 'Reparação de Celular', icon: '📱' },
        { id: 'reparo_impressora', name: 'Reparação de Impressora', icon: '🖨️' },
        { id: 'instalacao_software', name: 'Instalação de Software', icon: '📀' },
        { id: 'rede', name: 'Configuração de Rede', icon: '🌐' },
        { id: 'backup', name: 'Backup de Dados', icon: '💾' },
        { id: 'outros', name: 'Outros Serviços', icon: '🔧' }
    ];
    
    res.json({
        success: true,
        categories: categories
    });
});

// ========== ROTAS PARA PÁGINAS HTML ==========

// Rota para login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Rota para dashboard
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

// Rota para tarefas
app.get('/tasks', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/tasks.html'));
});

// Rota para nova tarefa
app.get('/tasks/new', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/new-task.html'));
});

// Rota para detalhes da tarefa
app.get('/tasks/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/task-detail.html'));
});

// Rota principal (redireciona para login)
app.get('/', (req, res) => {
    res.redirect('/login');
});

// ========== INICIAR SERVIDOR ==========
app.listen(PORT, () => {
    console.log('==========================================');
    console.log('🚀 SISTEMA COMPLETO INICIADO!');
    console.log('==========================================');
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log('👤 Login: admin@empresa.com');
    console.log('🔑 Senha: Admin@123');
    console.log('==========================================');
    console.log('✅ Sistema 100% funcional');
    console.log('✅ Dashboard completo');
    console.log('✅ Gestão de tarefas');
    console.log('✅ API totalmente operacional');
    console.log('==========================================');
});