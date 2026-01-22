const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'techsolutions-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../frontend')));

// Conectar ao banco
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('❌ Erro ao conectar ao banco:', err);
        return;
    }
    
    console.log('✅ Banco conectado');
    initDB();
});

function initDB() {
    // Executar queries em série para garantir ordem
    db.serialize(() => {
        // 1. Criar tabela users
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
        
        // 2. Criar tabela tasks
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
        
        // 3. Verificar e criar admin
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
        
        // 4. Adicionar tarefas de exemplo
        db.get('SELECT COUNT(*) as count FROM tasks', (err, row) => {
            if (err) {
                console.error('❌ Erro ao contar tarefas:', err);
                return;
            }
            
            // Verificar se row é válido
            if (!row || row.count === 0) {
                const tasks = [
                    ['Reparo Notebook Dell', 'Tela quebrada e ventoinha barulhenta', 'reparo_pc', 'high', 'João Silva', 450, '2024-12-20'],
                    ['Venda PC Gamer', 'Configuração completa para jogos', 'venda', 'medium', 'Maria Santos', 3200, '2024-12-15'],
                    ['Reparo iPhone 13', 'Tela trincada e bateria fraca', 'reparo_celular', 'high', 'Carlos Oliveira', 350, '2024-12-18']
                ];
                
                tasks.forEach(task => {
                    db.run(
                        'INSERT INTO tasks (title, description, category, priority, client_name, budget, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        task,
                        (err) => {
                            if (err) console.error('❌ Erro ao inserir tarefa:', err);
                        }
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
    
    // Validação básica
    if (!email || !password) {
        return res.status(400).json({ 
            success: false, 
            error: 'Email e senha são obrigatórios' 
        });
    }
    
    // Buscar usuário
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
        
        // Comparar senhas
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
            
            // Login bem-sucedido
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

// LOGIN SIMPLES (fallback)
app.post('/api/login-simple', (req, res) => {
    const { email, password } = req.body;
    
    console.log('🔐 [SIMPLE] Tentando login:', email);
    
    if (email === 'admin@empresa.com' && password === 'Admin@123') {
        // Criar sessão
        req.session.userId = 1;
        req.session.userName = 'Administrador';
        req.session.userRole = 'admin';
        
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
    console.log('📦 Dados recebidos:', req.body);
    
    if (!req.session.userId) {
        console.log('❌ Usuário não autenticado');
        return res.status(401).json({ 
            success: false, 
            error: 'Não autenticado' 
        });
    }
    
    const task = req.body;
    
    // Validação dos campos obrigatórios
    if (!task.title || !task.category || !task.client_name) {
        console.log('❌ Campos obrigatórios faltando');
        return res.status(400).json({ 
            success: false, 
            error: 'Título, categoria e nome do cliente são obrigatórios' 
        });
    }
    
    // Valores padrão
    const newTask = {
        title: task.title,
        description: task.description || '',
        category: task.category,
        priority: task.priority || 'medium',
        status: 'pending',
        client_name: task.client_name,
        client_phone: task.client_phone || '',
        budget: parseFloat(task.budget) || 0,
        due_date: task.due_date || null
    };
    
    console.log('📦 Tarefa processada:', newTask);
    
    // Inserir no banco
    const sql = `
        INSERT INTO tasks (title, description, category, priority, status, client_name, client_phone, budget, due_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
        newTask.title,
        newTask.description,
        newTask.category,
        newTask.priority,
        newTask.status,
        newTask.client_name,
        newTask.client_phone,
        newTask.budget,
        newTask.due_date
    ];
    
    db.run(sql, params, function(err) {
        if (err) {
            console.error('❌ ERRO SQL:', err.message);
            console.error('❌ Query:', sql);
            console.error('❌ Parâmetros:', params);
            return res.status(500).json({ 
                success: false, 
                error: 'Erro no banco de dados: ' + err.message 
            });
        }
        
        console.log('✅ Tarefa inserida com ID:', this.lastID);
        
        // Buscar a tarefa recém-criada
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
    
    // Validar se há dados para atualizar
    if (Object.keys(taskData).length === 0) {
        return res.status(400).json({ 
            success: false, 
            error: 'Nenhum dado para atualizar' 
        });
    }
    
    // Construir query dinamicamente
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(taskData)) {
        if (value !== undefined && value !== null) {
            fields.push(`${key} = ?`);
            values.push(value);
        }
    }
    
    values.push(taskId);
    
    const query = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`;
    
    db.run(query, values, function(err) {
        if (err) {
            console.error('❌ Erro ao atualizar tarefa:', err);
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

// TESTE DE BANCO
app.get('/api/test-db', (req, res) => {
    db.get('SELECT COUNT(*) as user_count FROM users', (err, userRow) => {
        if (err) {
            return res.json({ 
                success: false, 
                error: 'Erro no banco: ' + err.message 
            });
        }
        
        db.get('SELECT COUNT(*) as task_count FROM tasks', (err, taskRow) => {
            if (err) {
                return res.json({ 
                    success: false, 
                    error: 'Erro no banco: ' + err.message 
                });
            }
            
            res.json({
                success: true,
                message: 'Banco de dados funcionando!',
                stats: {
                    users: userRow.user_count,
                    tasks: taskRow.task_count
                }
            });
        });
    });
});

// ========== ROTAS DE PÁGINAS ==========

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/dashboard', (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

app.get('/tarefas', (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    res.sendFile(path.join(__dirname, '../frontend/tarefas.html'));
});

app.get('/nova-tarefa', (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    res.sendFile(path.join(__dirname, '../frontend/nova-tarefa.html'));
});

app.get('/tarefa/:id', (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    res.sendFile(path.join(__dirname, '../frontend/detalhe-tarefa.html'));
});

app.get('/', (req, res) => {
    res.redirect('/login');
});

// INICIAR SERVIDOR
app.listen(PORT, () => {
    console.log('==================================');
    console.log('🚀 SISTEMA DEFINITIVO INICIADO!');
    console.log('==================================');
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log('👤 Email: admin@empresa.com');
    console.log('🔑 Senha: Admin@123');
    console.log('==================================');
    console.log('✅ Banco: SQLite');
    console.log('✅ Sessões ativas');
    console.log('✅ API completa');
    console.log('==================================');
});