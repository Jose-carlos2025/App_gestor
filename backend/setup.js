const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

console.log('🔧 Configurando banco de dados...');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao criar banco de dados:', err.message);
    return;
  }
  
  console.log('✅ Banco de dados criado/aberto com sucesso');
  
  // Criar tabela de usuários
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'technician',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('❌ Erro ao criar tabela users:', err.message);
    } else {
      console.log('✅ Tabela users criada');
    }
  });

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
  )`, (err) => {
    if (err) {
      console.error('❌ Erro ao criar tabela tasks:', err.message);
    } else {
      console.log('✅ Tabela tasks criada');
    }
  });

  // Criar usuário administrador
  setTimeout(() => {
    const adminEmail = 'admin@empresa.com';
    const adminPassword = 'Admin@123';
    
    bcrypt.hash(adminPassword, 10, (err, hashedPassword) => {
      if (err) {
        console.error('❌ Erro ao criar hash da senha:', err.message);
        return;
      }
      
      db.get('SELECT id FROM users WHERE email = ?', [adminEmail], (err, row) => {
        if (err) {
          console.error('❌ Erro ao verificar admin:', err.message);
          return;
        }
        
        if (!row) {
          db.run(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            ['Administrador', adminEmail, hashedPassword, 'admin'],
            (err) => {
              if (err) {
                console.error('❌ Erro ao criar admin:', err.message);
              } else {
                console.log('👨‍💼 Usuário administrador criado:');
                console.log('   Email: admin@empresa.com');
                console.log('   Senha: Admin@123');
              }
            }
          );
        } else {
          console.log('✅ Usuário admin já existe');
        }
      });
    });
    
    // Adicionar algumas tarefas de exemplo
    setTimeout(() => {
      const exampleTasks = [
        {
          title: 'Reparação de Notebook Dell',
          description: 'Tela não liga e faz barulho na ventoinha',
          category: 'reparo_pc',
          priority: 'high',
          client_name: 'João Silva',
          client_phone: '(11) 99999-9999',
          equipment: 'Notebook Dell Inspiron',
          equipment_model: 'Inspiron 15 3000',
          required_parts: 'Tela 15.6", ventoinha',
          budget: 450.00,
          due_date: '2024-12-20'
        },
        {
          title: 'Venda de PC Gamer',
          description: 'Cliente interessado em PC para jogos',
          category: 'venda',
          priority: 'medium',
          client_name: 'Maria Santos',
          client_email: 'maria@email.com',
          equipment: 'PC Gamer Completo',
          budget: 3200.00,
          due_date: '2024-12-15'
        }
      ];
      
      exampleTasks.forEach(task => {
        db.run(
          `INSERT INTO tasks (title, description, category, priority, client_name, client_phone, client_email, equipment, equipment_model, required_parts, budget, due_date) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            task.title, task.description, task.category, task.priority,
            task.client_name, task.client_phone || null, task.client_email || null,
            task.equipment, task.equipment_model || null, task.required_parts || null,
            task.budget, task.due_date
          ],
          (err) => {
            if (err) console.error('Erro ao inserir tarefa:', err.message);
          }
        );
      });
      
      console.log('📝 Tarefas de exemplo adicionadas');
      
    }, 1000);
  }, 1000);
});

// Fechar conexão após 3 segundos
setTimeout(() => {
  db.close();
  console.log('✅ Configuração concluída!');
  console.log('🚀 Execute: node server.js');
}, 3000);