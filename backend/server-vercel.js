// VERSÃO ESPECIAL PARA O VERCEL
const express = require('express');
const path = require('path');
const app = express();

// Configurações básicas
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../frontend')));

// API de login simulada para Vercel
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    if (email === 'admin@empresa.com' && password === 'Admin@123') {
        res.json({
            success: true,
            user: {
                id: 1,
                name: 'Administrador',
                email: 'admin@empresa.com',
                role: 'admin'
            }
        });
    } else {
        res.status(401).json({
            success: false,
            error: 'Credenciais inválidas'
        });
    }
});

// API simulada para Vercel (dados em memória)
let tasks = [
    { id: 1, title: 'Reparo Notebook Dell', description: 'Tela quebrada', category: 'reparo_pc', priority: 'high', status: 'pending', client_name: 'João Silva', budget: 450, due_date: '2024-12-20' },
    { id: 2, title: 'Venda PC Gamer', description: 'PC completo', category: 'venda', priority: 'medium', status: 'in_progress', client_name: 'Maria Santos', budget: 3200, due_date: '2024-12-15' },
    { id: 3, title: 'Reparo iPhone', description: 'Tela trincada', category: 'reparo_celular', priority: 'high', status: 'pending', client_name: 'Carlos Oliveira', budget: 350, due_date: '2024-12-18' }
];

app.get('/api/tasks', (req, res) => {
    res.json({ success: true, tasks });
});

app.post('/api/tasks', (req, res) => {
    const newTask = { id: tasks.length + 1, ...req.body, status: 'pending' };
    tasks.push(newTask);
    res.json({ success: true, task: newTask });
});

app.get('/api/dashboard/stats', (req, res) => {
    res.json({
        success: true,
        stats: {
            total: tasks.length,
            pending: tasks.filter(t => t.status === 'pending').length,
            in_progress: tasks.filter(t => t.status === 'in_progress').length,
            completed: tasks.filter(t => t.status === 'completed').length
        }
    });
});

// Rotas de páginas
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

app.get('/tarefas', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/tarefas.html'));
});

app.get('/', (req, res) => {
    res.redirect('/login');
});

// Status
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'online', 
        environment: 'vercel',
        message: 'Sistema funcionando no Vercel'
    });
});

module.exports = app;