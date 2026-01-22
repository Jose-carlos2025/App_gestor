const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const app = express();

// Configuração para Vercel
const isVercel = process.env.VERCEL === '1';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'techsolutions-secret-key-2024-vercel',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: isVercel, // true no Vercel (HTTPS), false localmente
        maxAge: 24 * 60 * 60 * 1000 
    }
}));

// Servir arquivos estáticos - caminho correto para Vercel
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Conectar ao banco de dados - configuração especial para Vercel
const dbPath = isVercel ? path.join('/tmp', 'database.db') : './database.db';
console.log(`📁 Usando banco de dados em: ${dbPath}`);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('❌ Erro ao conectar ao banco:', err.message);
    } else {
        console.log('✅ Conectado ao banco de dados SQLite');
        if (!isVercel) {
            initializeDatabase();
        } else {
            // No Vercel, só criar tabelas se não existirem
            createTables();
        }
    }
});

function createTables() {
    // Criar tabelas apenas se não existirem
    db.serialize(() => {
        // Tabela users
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'technician',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error('❌ Erro ao criar tabela users:', err);
            else console.log('✅ Tabela users verificada');
        });
        
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
        )`, (err) => {
            if (err) console.error('❌ Erro ao criar tabela tasks:', err);
            else console.log('✅ Tabela tasks verificada');
        });
        
        // Criar usuário admin se não existir
        setTimeout(() => {
            const adminEmail = 'admin@empresa.com';
            db.get('SELECT id FROM users WHERE email = ?', [adminEmail], (err, row) => {
                if (err) {
                    console.error('❌ Erro ao verificar admin:', err);
                    return;
                }
                
                if (!row) {
                    bcrypt.hash('Admin@123', 10, (err, hash) => {
                        if (err) {
                            console.error('❌ Erro ao criar hash:', err);
                            return;
                        }
                        
                        db.run(
                            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                            ['Administrador', adminEmail, hash, 'admin'],
                            (err) => {
                                if (err) console.error('❌ Erro ao criar admin:', err);
                                else console.log('👑 Admin criado no Vercel');
                            }
                        );
                    });
                } else {
                    console.log('✅ Admin já existe');
                }
            });
        }, 1000);
    });
}

function initializeDatabase() {
    db.serialize(() => {
        // Tabela users
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'technician',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error('❌ Erro ao criar tabela users:', err);
            else console.log('✅ Tabela users criada');
        });
        
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
        )`, (err) => {
            if (err) console.error('❌ Erro ao criar tabela tasks:', err);
            else console.log('✅ Tabela tasks criada');
        });
        
        // Criar usuário admin se não existir
        db.get('SELECT id FROM users WHERE email = ?', ['admin@empresa.com'], (err, row) => {
            if (err) {
                console.error('❌ Erro ao verificar admin:', err);
                return;
            }
            
            if (!row) {
                bcrypt.hash('Admin@123', 10, (err, hash) => {
                    if (err) {
                        console.error('❌ Erro ao criar hash:', err);
                        return;
                    }
                    
                    db.run(
                        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                        ['Administrador', 'admin@empresa.com', hash, 'admin'],
                        (err) => {
                            if (err) console.error('❌ Erro ao criar admin:', err);
                            else console.log('👑 Admin criado');
                        }
                    );
                });
            } else {
                console.log('✅ Admin já existe');
            }
        });
        
        // Adicionar tarefas de exemplo se a tabela estiver vazia
        db.get('SELECT COUNT(*) as count FROM tasks', (err, row) => {
            if (err) {
                console.error('❌ Erro ao contar tarefas:', err);
                return;
            }
            
            if (!row || row.count === 0) {
                const tasks = [
                    ['Reparo Notebook Dell', 'Tela quebrada e ventoinha barulhenta', 'reparo_pc', 'high', 'João Silva', 450, '2024-12-20'],
                    ['Venda PC Gamer', 'Configuração completa para jogos', 'venda', 'medium', 'Maria Santos', 3200, '2024-12-15'],
                    ['Reparo iPhone 13', 'Tela trincada e bateria fraca', 'reparo_celular', 'high', 'Carlos Oliveira', 350, '2024-12-18']
                ];
                
                tasks.forEach(task => {
                    db.run(
                        'INSERT INTO tasks (title, description, category, priority, client_name, budget, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        task
                    );
                });
                console.log('📝 Tarefas exemplo adicionadas');
            } else {
                console.log(`✅ Já existem ${row.count} tarefas no banco`);
            }
        });
    });
}

// ========== API ==========

// LOGIN
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    console.log('🔐 Tentando login para:', email);
    
    if (!email || !password) {
        return res.status(400).json({ 
            success: false, 
            error: 'Email e senha são obrigatórios' 
        });
    }
    
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) {
            console.error('❌ Erro no banco:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Erro interno do servidor' 
            });
        }
        
        if (!user) {
            console.log('❌ Usuário não encontrado:', email);
            return res.status(401).json({ 
                success: false, 
                error: 'Email ou senha incorretos' 
            });
        }
        
        bcrypt.compare(password, user.password, (err, match) => {
            if (err) {
                console.error('❌ Erro ao comparar senhas:', err);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Erro interno do servidor' 
                });
            }
            
            if (!match) {
                console.log('❌ Senha incorreta para:', email);
                return res.status(401).json({ 
                    success: false, 
                    error: 'Email ou senha incorretos' 
                });
            }
            
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
        res.json({ 
            authenticated: true,
            user: {
                id: req.session.userId,
                name: req.session.userName,
                role: req.session.userRole
            }
        });
    } else {
        res.json({ authenticated: false });
    }
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
        if (err) {
            console.error('Erro stats:', err);
            return res.json({
                success: true,
                stats: { total: 0, pending: 0, in_progress: 0, completed: 0 }
            });
        }
        
        res.json({
            success: true,
            stats: stats || { total: 0, pending: 0, in_progress: 0, completed: 0 }
        });
    });
});

// TODAS TAREFAS
app.get('/api/tasks', (req, res) => {
    db.all('SELECT * FROM tasks ORDER BY created_at DESC', (err, tasks) => {
        if (err) {
            console.error('Erro tarefas:', err);
            return res.json({ success: true, tasks: [] });
        }
        
        res.json({
            success: true,
            tasks: tasks || []
        });
    });
});

// UMA TAREFA
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
    console.log('📝 Recebendo nova tarefa...');
    
    if (!req.session.userId) {
        return res.status(401).json({ 
            success: false, 
            error: 'Não autenticado' 
        });
    }
    
    const task = req.body;
    
    if (!task.title || !task.category || !task.client_name) {
        return res.status(400).json({ 
            success: false, 
            error: 'Título, categoria e nome do cliente são obrigatórios' 
        });
    }
    
    const sql = `
        INSERT INTO tasks (title, description, category, priority, client_name, client_phone, budget, due_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
        task.title,
        task.description || '',
        task.category,
        task.priority || 'medium',
        task.client_name,
        task.client_phone || '',
        parseFloat(task.budget) || 0,
        task.due_date || null
    ];
    
    db.run(sql, params, function(err) {
        if (err) {
            console.error('❌ ERRO SQL:', err.message);
            return res.status(500).json({ 
                success: false, 
                error: 'Erro no banco de dados' 
            });
        }
        
        console.log('✅ Tarefa inserida com ID:', this.lastID);
        
        db.get('SELECT * FROM tasks WHERE id = ?', [this.lastID], (err, savedTask) => {
            if (err) {
                return res.status(500).json({ 
                    success: false, 
                    error: 'Erro ao buscar tarefa criada' 
                });
            }
            
            res.json({
                success: true,
                message: 'Tarefa criada com sucesso!',
                task: savedTask
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
            console.error('❌ Erro ao excluir tarefa:', err);
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

// CATEGORIAS
app.get('/api/categories', (req, res) => {
    res.json({
        success: true,
        categories: [
            { id: 'venda', name: 'Venda de Equipamentos', icon: '🛒' },
            { id: 'reparo_pc', name: 'Reparação de PC', icon: '💻' },
            { id: 'reparo_celular', name: 'Reparação de Celular', icon: '📱' },
            { id: 'reparo_impressora', name: 'Reparação de Impressora', icon: '🖨️' },
            { id: 'instalacao_software', name: 'Instalação de Software', icon: '📀' },
            { id: 'rede', name: 'Configuração de Rede', icon: '🌐' },
            { id: 'backup', name: 'Backup de Dados', icon: '💾' },
            { id: 'outros', name: 'Outros Serviços', icon: '🔧' }
        ]
    });
});

// ========== ROTAS DE PÁGINAS ==========

app.get('/login', (req, res) => {
    res.sendFile(path.join(frontendPath, 'login.html'));
});

app.get('/dashboard', (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    res.sendFile(path.join(frontendPath, 'dashboard.html'));
});

app.get('/tarefas', (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    res.sendFile(path.join(frontendPath, 'tarefas.html'));
});

app.get('/nova-tarefa', (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    res.sendFile(path.join(frontendPath, 'nova-tarefa.html'));
});

app.get('/tarefa/:id', (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    res.sendFile(path.join(frontendPath, 'detalhe-tarefa.html'));
});

app.get('/', (req, res) => {
    res.redirect('/login');
});

// Rota de teste para verificar se o servidor está funcionando
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Servidor funcionando normalmente',
        timestamp: new Date().toISOString(),
        environment: isVercel ? 'Vercel' : 'Local'
    });
});

// Tratamento de erros global
app.use((err, req, res, next) => {
    console.error('❌ Erro global:', err);
    res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('==================================');
    console.log('🚀 SERVIDOR VERCEL PRONTO!');
    console.log('==================================');
    console.log(`🌐 Porta: ${PORT}`);
    console.log(`📍 Ambiente: ${isVercel ? 'Vercel (Produção)' : 'Local'}`);
    console.log(`📁 Banco de dados: ${dbPath}`);
    console.log('👤 Login: admin@empresa.com');
    console.log('🔑 Senha: Admin@123');
    console.log('==================================');
});

// Exportar para Vercel
module.exports = app;