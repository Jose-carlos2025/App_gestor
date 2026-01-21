const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authMiddleware } = require('../middleware/auth');

// Todas as rotas exigem autenticação
router.use(authMiddleware);

router.get('/', taskController.getAll);
router.get('/categories', taskController.getCategories);
router.get('/stats', taskController.getStats);
router.get('/:id', taskController.getById);
router.post('/', taskController.create);
router.put('/:id', taskController.update);
router.delete('/:id', taskController.delete);

module.exports = router;