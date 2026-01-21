const Task = require('../models/Task');

class TaskController {
  async create(req, res) {
    try {
      const taskData = req.body;
      taskData.technician_id = req.userId;

      const taskId = await Task.create(taskData);
      const task = await Task.findById(taskId);

      res.status(201).json({
        success: true,
        task
      });

    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async getAll(req, res) {
    try {
      const filters = req.query;
      const tasks = await Task.findAll(filters);

      res.json({
        success: true,
        tasks
      });

    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const task = await Task.findById(id);

      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'Tarefa não encontrada'
        });
      }

      res.json({
        success: true,
        task
      });

    } catch (error) {
      console.error('Erro ao buscar tarefa:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const taskData = req.body;

      const updated = await Task.update(id, taskData);

      if (updated === 0) {
        return res.status(404).json({
          success: false,
          error: 'Tarefa não encontrada'
        });
      }

      const task = await Task.findById(id);

      res.json({
        success: true,
        task
      });

    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const deleted = await Task.delete(id);

      if (deleted === 0) {
        return res.status(404).json({
          success: false,
          error: 'Tarefa não encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Tarefa excluída com sucesso'
      });

    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async getCategories(req, res) {
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
      categories
    });
  }

  async getStats(req, res) {
    try {
      const stats = await Task.getStats();
      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = new TaskController();