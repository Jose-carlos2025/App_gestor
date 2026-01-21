const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../frontend')));

// DADOS EM MEMÓRIA
const usuarios = [
    { id: 1, nome: 'Administrador', email: 'admin@empresa.com', senha: 'Admin@123', cargo: 'admin' }
];

let tarefas = [
    { id: 1, titulo: 'Reparo Notebook Dell', cliente: 'João Silva', status: 'pendente', categoria: 'reparo_pc', data: '2024-12-20', orcamento: 450.00 },
    { id: 2, titulo: 'Venda PC Gamer', cliente: 'Maria Santos', status: 'andamento', categoria: 'venda', data: '2024-12-15', orcamento: 3200.00 },
    { id: 3, titulo: 'Reparo iPhone', cliente: 'Carlos Oliveira', status: 'pendente', categoria: 'reparo_celular', data: '2024-12-18', orcamento: 350.00 },
    { id: 4, titulo: 'Formatação Windows', cliente: 'Ana Paula', status: 'concluido', categoria: 'instalacao_software', data: '2024-12-10', orcamento: 120.00 }
];

// ========== API ==========

// Login SIMPLES
app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;
    
    console.log('🔐 Login recebido para:', email);
    
    const usuario = usuarios.find(u => u.email === email && u.senha === senha);
    
    if (usuario) {
        console.log('✅ Login OK:', usuario.nome);
        res.json({
            sucesso: true,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                cargo: usuario.cargo
            }
        });
    } else {
        res.status(401).json({
            sucesso: false,
            erro: 'Email ou senha incorretos'
        });
    }
});

// Estatísticas do dashboard
app.get('/api/estatisticas', (req, res) => {
    const total = tarefas.length;
    const pendentes = tarefas.filter(t => t.status === 'pendente').length;
    const andamento = tarefas.filter(t => t.status === 'andamento').length;
    const concluidas = tarefas.filter(t => t.status === 'concluido').length;
    
    res.json({
        sucesso: true,
        estatisticas: {
            total,
            pendentes,
            andamento,
            concluidas,
            atrasadas: 0
        }
    });
});

// Todas as tarefas
app.get('/api/tarefas', (req, res) => {
    res.json({
        sucesso: true,
        tarefas: tarefas
    });
});

// Categorias
app.get('/api/categorias', (req, res) => {
    const categorias = [
        { id: 'venda', nome: 'Venda de Equipamentos' },
        { id: 'reparo_pc', nome: 'Reparação de PC' },
        { id: 'reparo_celular', nome: 'Reparação de Celular' },
        { id: 'reparo_impressora', nome: 'Reparação de Impressora' },
        { id: 'instalacao_software', nome: 'Instalação de Software' },
        { id: 'rede', nome: 'Configuração de Rede' },
        { id: 'backup', nome: 'Backup de Dados' },
        { id: 'outros', nome: 'Outros Serviços' }
    ];
    
    res.json({
        sucesso: true,
        categorias: categorias
    });
});

// ========== ROTAS DE PÁGINAS ==========

// Login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Dashboard
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

// Tarefas
app.get('/tarefas', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/tarefas.html'));
});

// Rota principal
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log('==========================================');
    console.log('🚀 SISTEMA ESTÁVEL INICIADO!');
    console.log('==========================================');
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log('👤 Login: admin@empresa.com');
    console.log('🔑 Senha: Admin@123');
    console.log('==========================================');
});