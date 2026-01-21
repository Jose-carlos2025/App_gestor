const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const dbPath = './database.db';

// Remover arquivo antigo se existir
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('🗑️  Banco de dados antigo removido');
}

// Criar novo banco de dados
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro:', err.message);
    return;
  }
  
  console.log('✅ Novo banco de dados criado');
  
  // Criar tabelas
  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'technician',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.run(`
    CREATE TABLE tasks (
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
  
  // Criar usuário admin
  const adminEmail = 'admin@empresa.com';
  const adminPassword = 'Admin@123';
  
  bcrypt.hash(adminPassword, 10, (err, hash) => {
    if (err) {
      console.error('❌ Erro ao criar hash:', err);
      return;
    }
    
    db.run(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Administrador', adminEmail, hash, 'admin'],
      (err) => {
        if (err) {
          console.error('❌ Erro ao criar admin:', err);
        } else {
          console.log('👨‍💼 Usuário admin criado:');
          console.log('   Email: admin@empresa.com');
          console.log('   Senha: Admin@123');
        }
        
        db.close();
        console.log('✅ Banco de dados resetado com sucesso!');
      }
    );
  });
});