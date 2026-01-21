const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();
const PORT = 3000;

// Configurar sessões
app.use(session({
    secret: 'chave_secreta_para_sessoes_do_sistema',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Use true em produção com HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../frontend')));

// Middleware para verificar autenticação
const requireAuth = (req, res, next) => {
    if (!req.session.userId && req.path.startsWith('/api/') && req.path !== '/api/login') {
        return res.status(401).json({ error: 'Não autenticado' });
    }
    next();
};

app.use(requireAuth);

// USUÁRIOS FIXOS
const users = [
    {
        id: 1,
        name: 'Administrador',
        email: 'admin@empresa.com',
        password: 'Admin@123',
        role: 'admin'
    },
    {
        id: 2,
        name: 'Técnico João',
        email: 'joao@empresa.com',
        password: 'Tecnico@123',
        role: 'technician'
    }
];

// BANCO DE DADOS EM MEMÓRIA (simplificado)
let tasks = [
    {
        id: 1,
        title: 'Reparo de Notebook Dell Inspiron',
        description: 'Tela não liga e ventoinha fazendo barulho alto',
        category: 'reparo_pc',
        priority: 'high',
        status: 'pending',
        client_name: 'João Silva',
        client_phone: '(11) 98765-4321',
        client_email: 'joao@email.com',
        equipment: 'Notebook Dell',
        equipment_model: 'Inspiron 15 3000',
        required_parts: 'Tela 15.6", ventoinha, pasta térmica',
        budget: 450.00,
        technician_id: 1,
        due_date: '2024-12-20',
        created_at: '2024-01-15'
    },
    {
        id: 2,
        title: 'Venda de PC Gamer Completo',
        description: 'Cliente interessado em PC para jogos de última geração',
        category: 'venda',
        priority: 'medium',
        status: 'in_progress',
        client_name: 'Maria Santos',
        client_phone: '(11) 91234-5678',
        client_email: 'maria@empresa.com',
        equipment: 'PC Gamer',
        equipment_model: 'Configuração avançada',
        required_parts: 'RTX 4070, i7-13700K, 32GB RAM',
        budget: 8500.00,
        technician_id: 1,
        due_date: '2024-12-15',
        created_at: '2024-01-14'
    },
    {
        id: 3,
        title: 'Reparo de iPhone 13',
        description: 'Tela trincada e bateria com pouca duração',
        category: 'reparo_celular',
        priority: 'high',
        status: 'pending',
        client_name: 'Carlos Oliveira',
        client_phone: '(11) 99876-5432',
        client_email: 'carlos@email.com',
        equipment: 'iPhone 13',
        equipment_model: '128GB Azul',
        required_parts: 'Tela original, bateria',
        budget: 350.00,
        technician_id: 2,
        due_date: '2024-12-18',
        created_at: '2024-01-13'
    },
    {
        id: 4,
        title: 'Formatação e Instalação de Software',
        description: 'Formatação do sistema e instalação do pacote Office e antivírus',
        category: 'instalacao_software',
        priority: 'medium',
        status: 'completed',
        client_name: 'Ana Paula',
        client_phone: '(11) 94567-8901',
        equipment: 'Notebook Acer',
        budget: 120.00,
        technician_id: 1,
        due_date: '2024-12-10',
        created_at: '2024-01-10',
        completed_at: '2024-01-12'
    }
];

// ========== API ROUTES ==========

// LOGIN
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    console.log('🔐 Tentativa de login:', email);
    
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        // Criar sessão
        req.session.userId = user.id;
        req.session.userName = user.name;
        req.session.userRole = user.role;
        
        console.log('✅ Login bem-sucedido para:', user.name);
        
        // Remover senha da resposta
        const { password: _, ...userWithoutPassword } = user;
        
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

// LOGOUT
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// VERIFICAR AUTENTICAÇÃO
app.get('/api/check-auth', (req, res) => {
    if (req.session.userId) {
        const user = users.find(u => u.id === req.session.userId);
        if (user) {
            const { password: _, ...userWithoutPassword } = user;
            res.json({
                authenticated: true,
                user: userWithoutPassword
            });
        } else {
            res.json({ authenticated: false });
        }
    } else {
        res.json({ authenticated: false });
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

// OBTER UMA TAREFA
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

// CRIAR TAREFA
app.post('/api/tasks', (req, res) => {
    const newTask = req.body;
    newTask.id = tasks.length + 1;
    newTask.created_at = new Date().toISOString().split('T')[0];
    newTask.status = newTask.status || 'pending';
    newTask.priority = newTask.priority || 'medium';
    newTask.technician_id = req.session.userId;
    
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
        const deletedTask = tasks.splice(taskIndex, 1)[0];
        res.json({
            success: true,
            message: 'Tarefa excluída com sucesso',
            task: deletedTask
        });
    } else {
        res.status(404).json({
            success: false,
            error: 'Tarefa não encontrada'
        });
    }
});

// ESTATÍSTICAS DO DASHBOARD
app.get('/api/dashboard/stats', (req, res) => {
    const stats = {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        overdue: 0
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

// ========== ROTAS DE PÁGINAS ==========

// Página de login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Dashboard (protegido)
app.get('/dashboard', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

// Tarefas (protegido)
app.get('/tasks', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, '../frontend/tasks.html'));
});

// Nova tarefa (protegido)
app.get('/tasks/new', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, '../frontend/new-task.html'));
});

// Detalhes da tarefa (protegido)
app.get('/tasks/:id', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, '../frontend/task-detail.html'));
});

// Rota principal
app.get('/', (req, res) => {
    if (req.session.userId) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/login');
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log('==========================================');
    console.log('🚀 SISTEMA FINAL INICIADO!');
    console.log('==========================================');
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log('👤 Login: admin@empresa.com');
    console.log('🔑 Senha: Admin@123');
    console.log('==========================================');
    console.log('✅ Sistema completo com sessões');
    console.log('✅ Login persistente');
    console.log('✅ Dashboard completo');
    console.log('✅ Gestão de tarefas completa');
    console.log('==========================================');
});