const User = require('../models/User');

class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          error: 'Email e senha são obrigatórios' 
        });
      }

      const user = await User.findByEmail(email);

      if (!user) {
        return res.status(401).json({ 
          success: false, 
          error: 'Credenciais inválidas' 
        });
      }

      const isValidPassword = await User.comparePassword(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({ 
          success: false, 
          error: 'Credenciais inválidas' 
        });
      }

      const token = User.generateToken(user);
      const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };

      res.json({
        success: true,
        token,
        user: userData
      });

    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro interno do servidor' 
      });
    }
  }

  async register(req, res) {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ 
          success: false, 
          error: 'Nome, email e senha são obrigatórios' 
        });
      }

      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          error: 'Email já cadastrado' 
        });
      }

      const user = await User.create({ name, email, password, role });
      const token = User.generateToken(user);

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });

    } catch (error) {
      console.error('Erro no registro:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro interno do servidor' 
      });
    }
  }

  async profile(req, res) {
    try {
      const user = await User.findById(req.userId);
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          error: 'Usuário não encontrado' 
        });
      }

      res.json({
        success: true,
        user
      });

    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro interno do servidor' 
      });
    }
  }
}

module.exports = new AuthController();