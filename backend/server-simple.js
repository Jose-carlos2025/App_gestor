const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configurar sessões
app.use(session({
  secret: 'segredo_super_secreto_para_sessao',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Use true se tiver HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Middleware para verificar autenticação
const requireAuth = (req, res, next) => {
  if (!req.session.userId && req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  next();
};

app.use(requireAuth);

// Servir arquivos estáticos
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Configurar banco de dados
const db = new sqlite3.Database('./database.db');

// Criar tabelas se não existirem
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'technician'
  )`);

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
    due_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Criar usuário admin se não existir
  db.get('SELECT id FROM users WHERE email = ?', ['admin@empresa.com'], (err, row) => {
    if (!row) {
      bcrypt.hash('Admin@123', 10, (err, hash) => {
        if (!err) {
          db.run(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            ['Administrador', 'admin@empresa.com', hash, 'admin']
          );
          console.log('👨‍💼 Usuário admin criado');
        }
      });
    } else {
      console.log('✅ Usuário admin já existe');
    }
  });
});

// API Routes

// Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    bcrypt.compare(password, user.password, (err, match) => {
      if (err || !match) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Criar sessão
      req.session.userId = user.id;
      req.session.userName = user.name;
      req.session.userRole = user.role;

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
  req.session.destroy();
  res.json({ success: true });
});

// Verificar autenticação
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

// Obter tarefas
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
      return res.status(500).json({ error: 'Erro interno' });
    }
    res.json({ success: true, tasks });
  });
});

// Criar tarefa
app.post('/api/tasks', (req, res) => {
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
      task.client_phone || '',
      task.client_email || '',
      task.equipment || '',
      task.equipment_model || '',
      task.required_parts || '',
      task.budget || 0,
      req.session.userId,
      task.due_date || null
    ],
    function(err) {
      if (err) {
        console.error('Erro ao criar tarefa:', err);
        return res.status(500).json({ error: 'Erro interno' });
      }
      
      res.json({
        success: true,
        task: { id: this.lastID, ...task }
      });
    }
  );
});

// Obter categorias
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

// Dashboard stats
app.get('/api/dashboard/stats', (req, res) => {
  db.get(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN date(due_date) < date('now') AND status != 'completed' THEN 1 ELSE 0 END) as overdue
    FROM tasks
  `, (err, stats) => {
    if (err) {
      console.error('Erro ao buscar estatísticas:', err);
      return res.status(500).json({ error: 'Erro interno' });
    }
    
    res.json({ success: true, stats });
  });
});

// Rotas para páginas
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'login.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(frontendPath, 'login.html'));
});

app.get('/dashboard', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  res.sendFile(path.join(frontendPath, 'dashboard.html'));
});

app.get('/tasks', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  res.sendFile(path.join(frontendPath, 'tasks.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('==========================================');
  console.log('🚀 SISTEMA SIMPLIFICADO INICIADO!');
  console.log('==========================================');
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log('👤 Login: admin@empresa.com');
  console.log('🔑 Senha: Admin@123');
  console.log('==========================================');
});