const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();
const PORT = 3000;

// Configurar sessões
app.use(session({
    secret: 'chave_secreta_sistema',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../frontend')));

// USUÁRIOS FIXOS
const users = [
    {
        id: 1,
        name: 'Administrador',
        email: 'admin@empresa.com',
        password: 'Admin@123',
        role: 'admin'
    }
];

// BANCO DE DADOS EM MEMÓRIA
let tasks = [
    {
        id: 1,
        title: 'Reparo de Notebook Dell',
        description: 'Tela não liga e ventoinha fazendo barulho',
        category: 'reparo_pc',
        priority: 'high',
        status: 'pending',
        client_name: 'João Silva',
        due_date: '2024-12-20',
        budget: 450.00
    },
    {
        id: 2,
        title: 'Venda de PC Gamer',
        description: 'Configuração completa para jogos',
        category: 'venda',
        priority: 'medium',
        status: 'in_progress',
        client_name: 'Maria Santos',
        due_date: '2024-12-15',
        budget: 3200.00
    }
];

// ========== API ROUTES ==========

// LOGIN SIMPLES - SEM VERIFICAÇÃO COMPLEXA
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    console.log('🔐 Login tentado:', email);
    
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        // Criar sessão SIMPLES
        req.session.userId = user.id;
        req.session.userName = user.name;
        
        console.log('✅ Login OK para:', user.name);
        
        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } else {
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

// VERIFICAR SE USUÁRIO ESTÁ LOGADO (OPCIONAL - NÃO CRÍTICO)
app.get('/api/check', (req, res) => {
    res.json({ 
        status: 'online',
        session: req.session.userId ? 'active' : 'inactive'
    });
});

// OBTER TAREFAS
app.get('/api/tasks', (req, res) => {
    res.json({
        success: true,
        tasks: tasks
    });
});

// CRIAR TAREFA
app.post('/api/tasks', (req, res) => {
    const newTask = req.body;
    newTask.id = tasks.length + 1;
    newTask.created_at = new Date().toISOString().split('T')[0];
    
    tasks.push(newTask);
    
    res.json({
        success: true,
        task: newTask
    });
});

// DASHBOARD STATS
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

// Página de login (SEMVERIFICAÇÃO)
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login-simple.html'));
});

// Dashboard (SEM VERIFICAÇÃO FORTE - frontend cuida)
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dashboard-simple.html'));
});

// Tarefas
app.get('/tasks', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/tasks-simple.html'));
});

// Rota principal
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Rota para qualquer outra coisa
app.get('*', (req, res) => {
    res.redirect('/login');
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log('==========================================');
    console.log('🚀 SISTEMA SEM LOOP INICIADO!');
    console.log('==========================================');
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log('👤 Login: admin@empresa.com');
    console.log('🔑 Senha: Admin@123');
    console.log('==========================================');
    console.log('✅ Sistema simplificado');
    console.log('✅ Sem verificações complexas');
    console.log('✅ Sem loop infinito');
    console.log('✅ Pronto para uso');
    console.log('==========================================');
});