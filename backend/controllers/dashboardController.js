const Task = require('../models/Task');

class DashboardController {
  async getStats(req, res) {
    try {
      const stats = await Task.getStats();
      const recentTasks = await Task.findAll({ limit: 5 });

      res.json({
        success: true,
        stats,
        recentTasks
      });

    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async getOverview(req, res) {
    try {
      const stats = await Task.getStats();
      const categories = [
        { name: 'Venda', count: 2, color: '#3B82F6' },
        { name: 'Reparo PC', count: 5, color: '#10B981' },
        { name: 'Reparo Celular', count: 3, color: '#F59E0B' },
        { name: 'Reparo Impressora', count: 1, color: '#EF4444' }
      ];

      res.json({
        success: true,
        stats,
        categories
      });

    } catch (error) {
      console.error('Erro ao buscar overview:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = new DashboardController();