const db = require('../config/database');

class Task {
  static async create(taskData) {
    const {
      title,
      description,
      category,
      priority,
      status,
      client_name,
      client_phone,
      client_email,
      equipment,
      equipment_model,
      required_parts,
      budget,
      technician_id,
      due_date
    } = taskData;

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO tasks (
          title, description, category, priority, status,
          client_name, client_phone, client_email, equipment,
          equipment_model, required_parts, budget, technician_id, due_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title, description, category, priority || 'medium', status || 'pending',
          client_name, client_phone || null, client_email || null, equipment || null,
          equipment_model || null, required_parts || null, budget || null,
          technician_id, due_date
        ],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, task) => {
        if (err) reject(err);
        else resolve(task);
      });
    });
  }

  static async findAll(filters = {}) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM tasks WHERE 1=1';
      const params = [];

      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }

      if (filters.category) {
        query += ' AND category = ?';
        params.push(filters.category);
      }

      if (filters.priority) {
        query += ' AND priority = ?';
        params.push(filters.priority);
      }

      if (filters.search) {
        query += ' AND (title LIKE ? OR description LIKE ? OR client_name LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      query += ' ORDER BY created_at DESC';

      db.all(query, params, (err, tasks) => {
        if (err) reject(err);
        else resolve(tasks);
      });
    });
  }

  static async update(id, taskData) {
    const fields = [];
    const values = [];

    Object.entries(taskData).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }

    values.push(id);

    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`,
        values,
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  static async delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM tasks WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  static async getStats() {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN due_date < date('now') AND status != 'completed' THEN 1 ELSE 0 END) as overdue
        FROM tasks
      `, (err, stats) => {
        if (err) reject(err);
        else resolve(stats);
      });
    });
  }
}

module.exports = Task;