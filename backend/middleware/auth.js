const jwt = require('jsonwebtoken');
const { buscarUm } = require('../config/database-sqlite');

// Middleware para proteger rotas
exports.protect = async (req, res, next) => {
  let token;

  // Verifica se o token está no header Authorization
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Não autorizado - Token não fornecido'
    });
  }

  try {
    // Verifica o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'metro_secret_key_2024');
    
    // Adiciona o usuário à requisição
    req.user = await buscarUm('SELECT * FROM users WHERE id = ?', [decoded.id]);
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Não autorizado - Token inválido'
    });
  }
};

// Middleware para verificar tipo de usuário
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.tipo)) {
      return res.status(403).json({
        success: false,
        error: `Tipo de usuário ${req.user.tipo} não autorizado a acessar esta rota`
      });
    }
    next();
  };
};


