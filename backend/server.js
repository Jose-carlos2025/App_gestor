const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');  // Adicione esta linha no topo

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração de sessão simplificada
app.use(session({
    secret: 'techsolutions-local-dev-2024',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Servir arquivos estáticos
const frontendPath = path.join(__dirname, '../frontend');
console.log('📁 Servindo frontend de:', frontendPath);
app.use(express.static(frontendPath));

// Conectar ao banco de dados
const dbPath = path.join(__dirname, 'database.db');
console.log('🗄️ Caminho do banco:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Erro ao conectar ao banco:', err.message);
    } else {
        console.log('✅ Conectado ao banco de dados SQLite');
        initDB();
    }
});

function initDB() {
    db.serialize(() => {
        // Tabela users
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'technician',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        // Tabela tasks
        db.run(`CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT,
            priority TEXT DEFAULT 'medium',
            status TEXT DEFAULT 'pending',
            client_name TEXT,
            client_phone TEXT,
            budget REAL,
            due_date TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        // Criar admin se não existir
        db.get('SELECT id FROM users WHERE email = ?', ['admin@empresa.com'], (err, row) => {
            if (!row) {
                bcrypt.hash('Admin@123', 10, (err, hash) => {
                    if (!err) {
                        db.run(
                            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                            ['Administrador', 'admin@empresa.com', hash, 'admin']
                        );
                        console.log('👑 Admin criado');
                    }
                });
            }
        });
        
        // Verificar se tem tarefas
        db.get('SELECT COUNT(*) as count FROM tasks', (err, row) => {
            if (row && row.count === 0) {
                const tasks = [
                    ['Reparo Notebook Dell', 'Tela quebrada', 'reparo_pc', 'high', 'João Silva', 450, '2024-12-20'],
                    ['Venda PC Gamer', 'PC completo', 'venda', 'medium', 'Maria Santos', 3200, '2024-12-15'],
                    ['Reparo iPhone', 'Tela trincada', 'reparo_celular', 'high', 'Carlos Oliveira', 350, '2024-12-18']
                ];
                
                tasks.forEach(task => {
                    db.run(
                        'INSERT INTO tasks (title, description, category, priority, client_name, budget, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        task
                    );
                });
                console.log('📝 Tarefas exemplo criadas');
            }
        });
    });
}

// ========== API SIMPLES E FUNCIONAL ==========

// LOGIN
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    console.log('🔐 Login:', email);
    
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err || !user) {
            return res.status(401).json({ 
                success: false, 
                error: 'Usuário não encontrado' 
            });
        }
        
        bcrypt.compare(password, user.password, (err, match) => {
            if (err || !match) {
                return res.status(401).json({ 
                    success: false, 
                    error: 'Senha incorreta' 
                });
            }
            
            req.session.userId = user.id;
            req.session.userName = user.name;
            
            console.log('✅ Login OK:', user.name);
            
            res.json({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        });
    });
});

// LOGOUT
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// VERIFICAR AUTH
app.get('/api/check-auth', (req, res) => {
    res.json({ loggedIn: !!req.session.userId });
});

// DASHBOARD STATS
app.get('/api/dashboard/stats', (req, res) => {
    db.get(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
        FROM tasks
    `, (err, stats) => {
        res.json({
            success: true,
            stats: stats || { total: 0, pending: 0, in_progress: 0, completed: 0 }
        });
    });
});

// TODAS TAREFAS
app.get('/api/tasks', (req, res) => {
    db.all('SELECT * FROM tasks ORDER BY created_at DESC', (err, tasks) => {
        res.json({
            success: true,
            tasks: tasks || []
        });
    });
});

// UMA TAREFA
app.get('/api/tasks/:id', (req, res) => {
    db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id], (err, task) => {
        if (!task) return res.status(404).json({ error: 'Não encontrada' });
        res.json({ success: true, task });
    });
});

// CRIAR TAREFA
app.post('/api/tasks', (req, res) => {
    const task = req.body;
    
    db.run(
        `INSERT INTO tasks (title, description, category, priority, status, client_name, client_phone, budget, due_date) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            task.title,
            task.description || '',
            task.category || 'outros',
            task.priority || 'medium',
            'pending', // sempre inicia como pendente
            task.client_name || '',
            task.client_phone || '',
            task.budget || 0,
            task.due_date || null
        ],
        function(err) {
            if (err) {
                console.error('Erro criar tarefa:', err);
                return res.status(500).json({ error: 'Erro interno' });
            }
            
            // Buscar tarefa criada
            db.get('SELECT * FROM tasks WHERE id = ?', [this.lastID], (err, newTask) => {
                res.json({
                    success: true,
                    task: newTask
                });
            });
        }
    );
});

// ATUALIZAR TAREFA
app.put('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(id);
    
    db.run(`UPDATE tasks SET ${fields} WHERE id = ?`, values, function(err) {
        if (err) return res.status(500).json({ error: 'Erro atualizar' });
        
        db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, task) => {
            res.json({ success: true, task });
        });
    });
});

// EXCLUIR TAREFA
app.delete('/api/tasks/:id', (req, res) => {
    db.run('DELETE FROM tasks WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: 'Erro excluir' });
        res.json({ success: true, message: 'Excluída' });
    });
});

// CATEGORIAS
app.get('/api/categories', (req, res) => {
    res.json({
        success: true,
        categories: [
            { id: 'venda', name: 'Venda de Equipamentos' },
            { id: 'reparo_pc', name: 'Reparação de PC' },
            { id: 'reparo_celular', name: 'Reparação de Celular' },
            { id: 'reparo_impressora', name: 'Reparação de Impressora' },
            { id: 'instalacao_software', name: 'Instalação de Software' },
            { id: 'rede', name: 'Configuração de Rede' },
            { id: 'backup', name: 'Backup de Dados' },
            { id: 'outros', name: 'Outros Serviços' }
        ]
    });
});

// ========== ROTAS DE PÁGINAS ==========

app.get('/login', (req, res) => {
    res.sendFile(path.join(frontendPath, 'login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(frontendPath, 'dashboard.html'));
});

app.get('/tarefas', (req, res) => {
    res.sendFile(path.join(frontendPath, 'tarefas.html'));
});

app.get('/nova-tarefa', (req, res) => {
    res.sendFile(path.join(frontendPath, 'nova-tarefa.html'));
});

app.get('/tarefa/:id', (req, res) => {
    res.sendFile(path.join(frontendPath, 'detalhe-tarefa.html'));
});

app.get('/', (req, res) => {
    res.redirect('/login');
});

// Rota para verificar status
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        database: 'connected',
        session: req.session.userId ? 'active' : 'inactive',
        time: new Date().toISOString()
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log('==================================');
    console.log('🚀 SISTEMA LOCAL INICIADO!');
    console.log('==================================');
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log('👤 Email: admin@empresa.com');
    console.log('🔑 Senha: Admin@123');
    console.log('==================================');
});