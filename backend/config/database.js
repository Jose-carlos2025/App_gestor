const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '../database.db'), (err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao banco de dados:', err.message);
  } else {
    console.log('✅ Conectado ao banco de dados SQLite');
    initializeDatabase();
  }
});

function initializeDatabase() {
  // Criar tabela de usuários
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'technician',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Criar tabela de tarefas
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
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
    )
  `);

  // Criar usuário administrador
  const adminEmail = 'admin@empresa.com';
  const adminPassword = 'Admin@123';
  
  db.get('SELECT id FROM users WHERE email = ?', [adminEmail], (err, row) => {
    if (!row) {
      bcrypt.hash(adminPassword, 10, (err, hash) => {
        if (err) {
          console.error('❌ Erro ao criar hash:', err);
        } else {
          db.run(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            ['Administrador', adminEmail, hash, 'admin'],
            (err) => {
              if (err) {
                console.error('❌ Erro ao criar admin:', err);
              } else {
                console.log('👨‍💼 Usuário administrador criado:');
                console.log('   Email: admin@empresa.com');
                console.log('   Senha: Admin@123');
              }
            }
          );
        }
      });
    } else {
      console.log('✅ Usuário admin já existe');
    }
  });

  // Adicionar tarefas de exemplo
  setTimeout(() => {
    const exampleTasks = [
      {
        title: 'Reparo de Notebook Dell Inspiron',
        description: 'Tela não liga e ventoinha fazendo barulho alto',
        category: 'reparo_pc',
        priority: 'high',
        client_name: 'João Silva',
        client_phone: '(11) 98765-4321',
        client_email: 'joao@email.com',
        equipment: 'Notebook Dell',
        equipment_model: 'Inspiron 15 3000',
        required_parts: 'Tela 15.6", ventoinha, pasta térmica',
        budget: 450.00,
        due_date: '2024-12-20'
      },
      {
        title: 'Venda de PC Gamer Completo',
        description: 'Cliente interessado em PC para jogos de última geração',
        category: 'venda',
        priority: 'medium',
        client_name: 'Maria Santos',
        client_phone: '(11) 91234-5678',
        client_email: 'maria@empresa.com',
        equipment: 'PC Gamer',
        equipment_model: 'Configuração avançada',
        required_parts: 'RTX 4070, i7-13700K, 32GB RAM',
        budget: 8500.00,
        due_date: '2024-12-15'
      },
      {
        title: 'Reparo de iPhone 13',
        description: 'Tela trincada e bateria com pouca duração',
        category: 'reparo_celular',
        priority: 'high',
        client_name: 'Carlos Oliveira',
        client_phone: '(11) 99876-5432',
        client_email: 'carlos@email.com',
        equipment: 'iPhone 13',
        equipment_model: '128GB Azul',
        required_parts: 'Tela original, bateria',
        budget: 350.00,
        due_date: '2024-12-18'
      }
    ];

    db.get('SELECT COUNT(*) as count FROM tasks', (err, row) => {
      if (row.count === 0) {
        exampleTasks.forEach(task => {
          db.run(
            `INSERT INTO tasks (
              title, description, category, priority, client_name, 
              client_phone, client_email, equipment, equipment_model, 
              required_parts, budget, due_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              task.title, task.description, task.category, task.priority,
              task.client_name, task.client_phone, task.client_email,
              task.equipment, task.equipment_model, task.required_parts,
              task.budget, task.due_date
            ]
          );
        });
        console.log('📝 Tarefas de exemplo adicionadas');
      }
    });
  }, 1000);
}

module.exports = db;