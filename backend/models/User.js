const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class User {
  static async create({ name, email, password, role = 'technician' }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, role],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, name, email, role });
        }
      );
    });
  }

  static async findByEmail(email) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) reject(err);
        else resolve(user);
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [id], (err, user) => {
        if (err) reject(err);
        else resolve(user);
      });
    });
  }

  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  static generateToken(user) {
    // Usar a chave do ambiente ou uma padrão
    const secret = process.env.JWT_SECRET || 'chave_temporaria_para_desenvolvimento';
    
    return jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        name: user.name 
      },
      secret,
      { expiresIn: '24h' }
    );
  }
}

module.exports = User;