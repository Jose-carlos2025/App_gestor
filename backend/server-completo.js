const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 3000;

// Configurar sessões
app.use(session({
    secret: 'chave_secreta_sistema_techsolutions',
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

// Configurar banco de dados SQLite
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('❌ Erro ao conectar ao banco de dados:', err);
    } else {
        console.log('✅ Conectado ao banco de dados SQLite');
        initializeDatabase();
    }
});

function initializeDatabase() {
    // Criar tabela de usuários
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'technician',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Criar tabela de tarefas
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        priority TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'pending',
        client_name TEXT NOT NULL,
        client_phone TEXT,
        client_email TEXT,
        equipment TEXT,
        equipment_model TEXT,
        required_parts TEXT,
        budget REAL,
        technician_id INTEGER,
        due_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME
    )`);
    
    // Criar usuário administrador
    const adminEmail = 'admin@empresa.com';
    const adminPassword = 'Admin@123';
    
    db.get('SELECT id FROM users WHERE email = ?', [adminEmail], (err, row) => {
        if (!row) {
            bcrypt.hash(adminPassword, 10, (err, hash) => {
                if (!err) {
                    db.run(
                        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                        ['Administrador', adminEmail, hash, 'admin']
                    );
                    console.log('👑 Usuário administrador criado');
                }
            });
        }
    });
    
    // Adicionar tarefas de exemplo se a tabela estiver vazia
    db.get('SELECT COUNT(*) as count FROM tasks', (err, row) => {
        if (row.count === 0) {
            const exampleTasks = [
                `INSERT INTO tasks (title, description, category, priority, client_name, due_date, budget) 
                 VALUES ('Reparo Notebook Dell', 'Tela quebrada e ventoinha barulhenta', 'reparo_pc', 'high', 'João Silva', '2024-12-20', 450.00)`,
                `INSERT INTO tasks (title, description, category, priority, client_name, due_date, budget, status) 
                 VALUES ('Venda PC Gamer', 'Configuração completa para jogos', 'venda', 'medium', 'Maria Santos', '2024-12-15', 3200.00, 'in_progress')`,
                `INSERT INTO tasks (title, description, category, priority, client_name, due_date, budget) 
                 VALUES ('Reparo iPhone 13', 'Tela trincada', 'reparo_celular', 'high', 'Carlos Oliveira', '2024-12-18', 350.00)`
            ];
            
            exampleTasks.forEach(sql => {
                db.run(sql);
            });
            console.log('📝 Tarefas de exemplo adicionadas');
        }
    });
}

// ========== API ROUTES ==========

// LOGIN
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    console.log('🔐 Login tentado:', email);
    
    if (!email || !password) {
        return res.status(400).json({ 
            success: false, 
            error: 'Email e senha são obrigatórios' 
        });
    }
    
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err || !user) {
            return res.status(401).json({ 
                success: false, 
                error: 'Credenciais inválidas' 
            });
        }
        
        bcrypt.compare(password, user.password, (err, match) => {
            if (err || !match) {
                return res.status(401).json({ 
                    success: false, 
                    error: 'Credenciais inválidas' 
                });
            }
            
            // Criar sessão
            req.session.userId = user.id;
            req.session.userName = user.name;
            req.session.userRole = user.role;
            
            console.log('✅ Login bem-sucedido para:', user.name);
            
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

// VERIFICAR AUTENTICAÇÃO
app.get('/api/check-auth', (req, res) => {
    if (req.session.userId) {
        db.get('SELECT id, name, email, role FROM users WHERE id = ?', [req.session.userId], (err, user) => {
            if (user) {
                res.json({
                    authenticated: true,
                    user: user
                });
            } else {
                res.json({ authenticated: false });
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

// OBTER TAREFAS
app.get('/api/tasks', (req, res) => {
    const { status, category, priority, search } = req.query;
    
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params = [];
    
    if (status) {
        query += ' AND status = ?';
        params.push(status);
    }
    
    if (category) {
        query += ' AND category = ?';
        params.push(category);
    }
    
    if (priority) {
        query += ' AND priority = ?';
        params.push(priority);
    }
    
    if (search) {
        query += ' AND (title LIKE ? OR description LIKE ? OR client_name LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY created_at DESC';
    
    db.all(query, params, (err, tasks) => {
        if (err) {
            console.error('Erro ao buscar tarefas:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Erro interno do servidor' 
            });
        }
        
        res.json({
            success: true,
            tasks: tasks
        });
    });
});

// OBTER UMA TAREFA
app.get('/api/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    
    db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, task) => {
        if (err) {
            console.error('Erro ao buscar tarefa:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Erro interno do servidor' 
            });
        }
        
        if (!task) {
            return res.status(404).json({ 
                success: false, 
                error: 'Tarefa não encontrada' 
            });
        }
        
        res.json({
            success: true,
            task: task
        });
    });
});

// CRIAR TAREFA
app.post('/api/tasks', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ 
            success: false, 
            error: 'Não autenticado' 
        });
    }
    
    const task = req.body;
    
    db.run(
        `INSERT INTO tasks (
            title, description, category, priority, status,
            client_name, client_phone, client_email, equipment,
            equipment_model, required_parts, budget, technician_id, due_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            task.title,
            task.description || '',
            task.category,
            task.priority || 'medium',
            task.status || 'pending',
            task.client_name,
            task.client_phone || null,
            task.client_email || null,
            task.equipment || null,
            task.equipment_model || null,
            task.required_parts || null,
            task.budget || null,
            req.session.userId,
            task.due_date || null
        ],
        function(err) {
            if (err) {
                console.error('Erro ao criar tarefa:', err);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Erro interno do servidor' 
                });
            }
            
            res.json({
                success: true,
                task: { 
                    id: this.lastID,
                    ...task 
                }
            });
        }
    );
});

// ATUALIZAR TAREFA
app.put('/api/tasks/:id', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ 
            success: false, 
            error: 'Não autenticado' 
        });
    }
    
    const taskId = req.params.id;
    const taskData = req.body;
    
    const fields = [];
    const values = [];
    
    // Construir query dinamicamente
    for (const [key, value] of Object.entries(taskData)) {
        if (value !== undefined && value !== null) {
            fields.push(`${key} = ?`);
            values.push(value);
        }
    }
    
    if (fields.length === 0) {
        return res.status(400).json({ 
            success: false, 
            error: 'Nenhum dado para atualizar' 
        });
    }
    
    values.push(taskId);
    
    const query = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`;
    
    db.run(query, values, function(err) {
        if (err) {
            console.error('Erro ao atualizar tarefa:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Erro interno do servidor' 
            });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Tarefa não encontrada' 
            });
        }
        
        // Retornar a tarefa atualizada
        db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, task) => {
            if (err) {
                return res.status(500).json({ 
                    success: false, 
                    error: 'Erro interno do servidor' 
                });
            }
            
            res.json({
                success: true,
                task: task
            });
        });
    });
});

// EXCLUIR TAREFA
app.delete('/api/tasks/:id', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ 
            success: false, 
            error: 'Não autenticado' 
        });
    }
    
    const taskId = req.params.id;
    
    db.run('DELETE FROM tasks WHERE id = ?', [taskId], function(err) {
        if (err) {
            console.error('Erro ao excluir tarefa:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Erro interno do servidor' 
            });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Tarefa não encontrada' 
            });
        }
        
        res.json({
            success: true,
            message: 'Tarefa excluída com sucesso'
        });
    });
});

// ESTATÍSTICAS DO DASHBOARD
app.get('/api/dashboard/stats', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ 
            success: false, 
            error: 'Não autenticado' 
        });
    }
    
    db.get(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN due_date < date('now') AND status != 'completed' THEN 1 ELSE 0 END) as overdue
        FROM tasks
    `, (err, stats) => {
        if (err) {
            console.error('Erro ao buscar estatísticas:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Erro interno do servidor' 
            });
        }
        
        res.json({
            success: true,
            stats: stats
        });
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

// Dashboard
app.get('/dashboard', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

// Lista de tarefas
app.get('/tasks', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, '../frontend/tasks.html'));
});

// Nova tarefa
app.get('/tasks/new', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, '../frontend/new-task.html'));
});

// Detalhes da tarefa (USANDO O ARQUIVO CORRETO AGORA)
app.get('/tasks/:id', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, '../frontend/task-detail-crud.html'));
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
    console.log('🚀 SISTEMA COMPLETO COM BANCO DE DADOS!');
    console.log('==========================================');
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log('👤 Login: admin@empresa.com');
    console.log('🔑 Senha: Admin@123');
    console.log('==========================================');
    console.log('✅ Banco de dados SQLite');
    console.log('✅ CRUD completo de tarefas');
    console.log('✅ Dados persistentes');
    console.log('✅ Controle total das tarefas');
    console.log('==========================================');
});