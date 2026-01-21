const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const app = express();
const PORT = 3000;

// Configurar middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Criar banco de dados
const db = new sqlite3.Database('./database.db');

// Inicializar banco de dados
db.serialize(() => {
    // Criar tabela de usuários
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'technician'
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
        due_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME
    )`);
    
    // Criar usuário admin se não existir
    db.get("SELECT id FROM users WHERE email = 'admin@empresa.com'", (err, row) => {
        if (!row) {
            bcrypt.hash('Admin@123', 10, (err, hash) => {
                if (!err) {
                    db.run(
                        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                        ['Administrador', 'admin@empresa.com', hash, 'admin']
                    );
                    console.log('✅ Usuário admin criado');
                }
            });
        } else {
            console.log('✅ Usuário admin já existe');
        }
    });
    
    // Adicionar tarefas de exemplo se não existirem
    db.get("SELECT COUNT(*) as count FROM tasks", (err, row) => {
        if (row.count === 0) {
            const exemplo = [
                `INSERT INTO tasks (title, description, category, client_name, due_date, status) 
                 VALUES ('Reparo Notebook Dell', 'Tela não liga', 'reparo_pc', 'João Silva', '2024-12-20', 'pending')`,
                `INSERT INTO tasks (title, description, category, client_name, due_date, status, budget) 
                 VALUES ('Venda PC Gamer', 'Configuração completa', 'venda', 'Maria Santos', '2024-12-15', 'in_progress', 3200.00)`,
                `INSERT INTO tasks (title, description, category, client_name, due_date, status, equipment) 
                 VALUES ('Formatação', 'Instalar Windows', 'instalacao_software', 'Carlos Oliveira', '2024-12-10', 'completed', 'Notebook Acer')`
            ];
            
            exemplo.forEach(sql => {
                db.run(sql);
            });
            console.log('✅ Tarefas de exemplo criadas');
        }
    });
});

// ========== API ==========

// Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err || !user) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        
        bcrypt.compare(password, user.password, (err, match) => {
            if (err || !match) {
                return res.status(401).json({ error: 'Credenciais inválidas' });
            }
            
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

// Logout
app.post('/api/logout', (req, res) => {
    res.json({ success: true });
});

// Obter todas as tarefas
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
            res.status(500).json({ error: 'Erro no servidor' });
        } else {
            res.json({ success: true, tasks });
        }
    });
});

// Obter uma tarefa
app.get('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, task) => {
        if (err || !task) {
            res.status(404).json({ error: 'Tarefa não encontrada' });
        } else {
            res.json({ success: true, task });
        }
    });
});

// Criar tarefa
app.post('/api/tasks', (req, res) => {
    const task = req.body;
    
    db.run(
        `INSERT INTO tasks (
            title, description, category, priority, status,
            client_name, client_phone, client_email, equipment,
            equipment_model, required_parts, budget, due_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            task.title,
            task.description || '',
            task.category,
            task.priority || 'medium',
            task.status || 'pending',
            task.client_name,
            task.client_phone || '',
            task.client_email || '',
            task.equipment || '',
            task.equipment_model || '',
            task.required_parts || '',
            task.budget || 0,
            task.due_date
        ],
        function(err) {
            if (err) {
                res.status(500).json({ error: 'Erro ao criar tarefa' });
            } else {
                res.json({ 
                    success: true, 
                    task: { id: this.lastID, ...task } 
                });
            }
        }
    );
});

// Atualizar tarefa
app.put('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const task = req.body;
    
    db.run(
        `UPDATE tasks SET
            title = ?, description = ?, category = ?, priority = ?, status = ?,
            client_name = ?, client_phone = ?, client_email = ?, equipment = ?,
            equipment_model = ?, required_parts = ?, budget = ?, due_date = ?
        WHERE id = ?`,
        [
            task.title,
            task.description || '',
            task.category,
            task.priority || 'medium',
            task.status || 'pending',
            task.client_name,
            task.client_phone || '',
            task.client_email || '',
            task.equipment || '',
            task.equipment_model || '',
            task.required_parts || '',
            task.budget || 0,
            task.due_date,
            id
        ],
        function(err) {
            if (err) {
                res.status(500).json({ error: 'Erro ao atualizar tarefa' });
            } else if (this.changes === 0) {
                res.status(404).json({ error: 'Tarefa não encontrada' });
            } else {
                res.json({ success: true, task: { id, ...task } });
            }
        }
    );
});

// Excluir tarefa
app.delete('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM tasks WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: 'Erro ao excluir tarefa' });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Tarefa não encontrada' });
        } else {
            res.json({ success: true, message: 'Tarefa excluída' });
        }
    });
});

// Estatísticas do dashboard
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
            res.status(500).json({ error: 'Erro ao buscar estatísticas' });
        } else {
            res.json({ success: true, stats });
        }
    });
});

// Categorias
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
    res.json({ success: true, categories });
});

// ========== ROTAS DE PÁGINAS ==========

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

app.get('/tarefas', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/tarefas.html'));
});

app.get('/tarefas/nova', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/nova-tarefa.html'));
});

app.get('/tarefas/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/detalhes-tarefa.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log('==========================================');
    console.log('🚀 SISTEMA COMPLETO INICIADO!');
    console.log('==========================================');
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log('👤 Login: admin@empresa.com');
    console.log('🔑 Senha: Admin@123');
    console.log('==========================================');
    console.log('✅ Banco de dados: database.db');
    console.log('✅ API totalmente funcional');
    console.log('✅ CRUD completo de tarefas');
    console.log('==========================================');
});