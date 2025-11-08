const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { buscarUm, executarQuery } = require('../config/database-sqlite');
const { protect } = require('../middleware/auth');

// Gera JWT Token
const gerarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'metro_secret_key_2024', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Registrar novo usuário
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { nome, rgMetro, email, senha, cargo, setor, tipo } = req.body;

    // Verifica se o usuário já existe
    const userExists = await buscarUm(
      'SELECT * FROM users WHERE email = ? OR rgMetro = ?',
      [email, rgMetro]
    );
    
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'Usuário já cadastrado com este email ou RG Metro'
      });
    }

    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    // Cria o usuário
    const result = await executarQuery(
      `INSERT INTO users (nome, rgMetro, email, senha, cargo, setor, tipo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nome, rgMetro || null, email || null, senhaHash, cargo || null, setor || null, tipo || 'aluno']
    );

    // Busca o usuário criado
    const user = await buscarUm('SELECT * FROM users WHERE id = ?', [result.lastID]);

    // Gera token
    const token = gerarToken(user.id);

    res.status(201).json({
      success: true,
      token,
      user: { id: user.id, nome: user.nome, rgMetro: user.rgMetro, email: user.email, tipo: user.tipo, cargo: user.cargo, setor: user.setor }
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao registrar usuário'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login de usuário (Instrutor: email, Aluno: RG Metro)
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { rgMetro, email, senha, tipoLogin } = req.body;

    // Validação básica
    if (!senha) {
      return res.status(400).json({
        success: false,
        error: 'Por favor, forneça a senha'
      });
    }

    let user;

    // Login diferenciado por tipo
    if (tipoLogin === 'aluno' || rgMetro) {
      // ALUNO: Login com RG Metro
      if (!rgMetro) {
        return res.status(400).json({
          success: false,
          error: 'Por favor, forneça o RG Metro'
        });
      }
      user = await buscarUm('SELECT * FROM users WHERE rgMetro = ?', [rgMetro]);
    } else if (tipoLogin === 'instrutor' || email) {
      // INSTRUTOR/ADMIN: Login com email
      let loginEmail = (email || '').trim();
      // Permitir usar apenas "instrutor" como atalho
      if (!loginEmail || loginEmail.toLowerCase() === 'instrutor') {
        loginEmail = 'instrutor@metro.sp.gov.br';
      }
      if (!loginEmail) {
        return res.status(400).json({
          success: false,
          error: 'Por favor, forneça o email'
        });
      }
      user = await buscarUm('SELECT * FROM users WHERE email = ?', [loginEmail]);
      // Atualiza "email" para o normalizado usado abaixo
      req.body.email = loginEmail;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Por favor, forneça email ou RG Metro'
      });
    }

    // Login universal de instrutor (sempre aceitar senha "metro123"): cria o usuário se não existir
    if (!user && (tipoLogin === 'instrutor' || email) && senha === 'metro123') {
      const senhaHash = await bcrypt.hash(senha, 10);
      const cargo = 'Instrutor';
      const setor = 'Treinamentos';
      await executarQuery(
        `INSERT INTO users (nome, rgMetro, email, senha, cargo, setor, tipo, ativo)
         VALUES (?, ?, ?, ?, ?, ?, 'instrutor', 1)`,
        ['Instrutor', null, email, senhaHash, cargo, setor]
      );
      user = await buscarUm('SELECT * FROM users WHERE email = ?', [email]);
    }

    if (!user) {
      return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
    }

    // Verifica senha
    // Aceita sempre senha "metro123" para instrutor
    let senhaCorreta = false;
    if ((tipoLogin === 'instrutor' || email) && senha === 'metro123') {
      senhaCorreta = true;
    } else {
      senhaCorreta = await bcrypt.compare(senha, user.senha);
    }

    if (!senhaCorreta) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas'
      });
    }

    // Verifica se o usuário está ativo
    if (!user.ativo) {
      return res.status(401).json({
        success: false,
        error: 'Usuário desativado. Entre em contato com o administrador.'
      });
    }

    // Gera token
    const token = gerarToken(user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        nome: user.nome,
        rgMetro: user.rgMetro,
        email: user.email,
        tipo: user.tipo,
        cargo: user.cargo,
        setor: user.setor,
        matricula: user.matricula,
        fotoPerfil: user.fotoPerfil
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao fazer login'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Obter usuário atual
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await buscarUm('SELECT * FROM users WHERE id = ?', [req.user.id]);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        nome: user.nome,
        rgMetro: user.rgMetro,
        email: user.email,
        tipo: user.tipo,
        cargo: user.cargo,
        setor: user.setor,
        matricula: user.matricula,
        telefone: user.telefone,
        fotoPerfil: user.fotoPerfil,
        dataAdmissao: user.dataAdmissao
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar dados do usuário'
    });
  }
});

// @route   POST /api/auth/register-aluno
// @desc    Instrutor cadastra um aluno
// @access  Private (Instrutor/Admin)
router.post('/register-aluno', protect, async (req, res) => {
  try {
    // Verifica se é instrutor ou admin
    if (!['instrutor', 'admin'].includes(req.user.tipo)) {
      return res.status(403).json({
        success: false,
        error: 'Apenas instrutores e administradores podem cadastrar alunos'
      });
    }

    const { nome, rgMetro, senha, telefone, cargo, setor, email, dataAdmissao } = req.body;

    // Validações
    if (!nome || !rgMetro || !senha || !cargo || !setor) {
      return res.status(400).json({
        success: false,
        error: 'Por favor, preencha todos os campos obrigatórios: nome, RG Metro, senha, cargo e setor'
      });
    }

    // Verifica se RG Metro tem 7 dígitos
    if (!/^[0-9]{7}$/.test(rgMetro)) {
      return res.status(400).json({
        success: false,
        error: 'RG Metro deve ter exatamente 7 dígitos numéricos'
      });
    }

    // Verifica se o RG Metro já existe
    const alunoExiste = await buscarUm('SELECT * FROM users WHERE rgMetro = ?', [rgMetro]);
    
    if (alunoExiste) {
      return res.status(400).json({
        success: false,
        error: 'Já existe um aluno cadastrado com este RG Metro'
      });
    }

    // Gerar email automático se não fornecido
    const emailAluno = email || `${rgMetro}@aluno.metro.sp.gov.br`;

    // Verifica se o email já existe
    const emailExiste = await buscarUm('SELECT * FROM users WHERE email = ?', [emailAluno]);
    if (emailExiste) {
      return res.status(400).json({
        success: false,
        error: 'Este email já está em uso'
      });
    }

    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    // Gera matrícula automática (RG Metro + ano)
    const ano = new Date().getFullYear();
    const matricula = `${rgMetro}${ano}`;

    // Cria o aluno
    const result = await executarQuery(
      `INSERT INTO users (nome, rgMetro, email, senha, telefone, cargo, setor, tipo, matricula, dataAdmissao)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'aluno', ?, ?)`,
      [nome, rgMetro, emailAluno, senhaHash, telefone || null, cargo, setor, matricula, dataAdmissao || new Date().toISOString()]
    );

    // Busca o aluno criado
    const aluno = await buscarUm('SELECT * FROM users WHERE id = ?', [result.lastID]);

    res.status(201).json({
      success: true,
      message: 'Aluno cadastrado com sucesso!',
      aluno: {
        id: aluno.id,
        nome: aluno.nome,
        rgMetro: aluno.rgMetro,
        email: aluno.email,
        cargo: aluno.cargo,
        setor: aluno.setor,
        matricula: aluno.matricula,
        tipo: aluno.tipo,
        dataAdmissao: aluno.dataAdmissao
      }
    });
  } catch (error) {
    console.error('Erro ao cadastrar aluno:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao cadastrar aluno'
    });
  }
});

// @route   PUT /api/auth/update-password
// @desc    Atualizar senha
// @access  Private
router.put('/update-password', protect, async (req, res) => {
  try {
    const { senhaAtual, novaSenha } = req.body;

    if (!senhaAtual || !novaSenha) {
      return res.status(400).json({
        success: false,
        error: 'Por favor, forneça a senha atual e a nova senha'
      });
    }

    const user = await buscarUm('SELECT * FROM users WHERE id = ?', [req.user.id]);

    // Verifica senha atual
    const senhaCorreta = await bcrypt.compare(senhaAtual, user.senha);

    if (!senhaCorreta) {
      return res.status(401).json({
        success: false,
        error: 'Senha atual incorreta'
      });
    }

    // Hash da nova senha
    const salt = await bcrypt.genSalt(10);
    const novaSenhaHash = await bcrypt.hash(novaSenha, salt);

    // Atualiza senha
    await executarQuery(
      'UPDATE users SET senha = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [novaSenhaHash, user.id]
    );

    // Gera novo token
    const token = gerarToken(user.id);

    res.json({
      success: true,
      token,
      message: 'Senha atualizada com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar senha'
    });
  }
});

// Configurar transporter de email
const criarTransporter = () => {
  // Para desenvolvimento, usar conta de teste ou SMTP configurado
  // Em produção, configure SMTP real via variáveis de ambiente
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true para 465, false para outras portas
    auth: {
      user: process.env.SMTP_USER || 'seu-email@gmail.com',
      pass: process.env.SMTP_PASS || 'sua-senha-app'
    }
  });
};

// @route   POST /api/auth/forgot-password
// @desc    Verificar RG Metro e email para recuperação de senha
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { rgMetro, email } = req.body;

    // Validação dos campos
    if (!rgMetro || !email) {
      return res.status(400).json({
        success: false,
        error: 'Por favor, preencha o RG Metro e o email'
      });
    }

    // Validar RG Metro (7 dígitos)
    const rgMetroTrimmed = rgMetro.trim();
    if (!/^[0-9]{7}$/.test(rgMetroTrimmed)) {
      return res.status(400).json({
        success: false,
        error: 'RG Metro inválido! Deve conter exatamente 7 dígitos numéricos.'
      });
    }

    // Buscar usuário por RG Metro e email
    const user = await buscarUm(
      'SELECT * FROM users WHERE rgMetro = ? AND email = ?', 
      [rgMetro.trim(), email.trim()]
    );

    // Verificar se os dados estão corretos
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Dados inseridos não estão corretos'
      });
    }

    // Gerar senha nova simples baseada no RG Metro
    // Formato: metro + últimos 4 dígitos do RG Metro
    const rgMetroClean = rgMetro.trim();
    const novaSenha = `metro${rgMetroClean.slice(-4)}`; // Ex: metro3456
    const salt = await bcrypt.genSalt(10);
    const novaSenhaHash = await bcrypt.hash(novaSenha, salt);

    // Atualizar senha no banco de dados
    await executarQuery(
      'UPDATE users SET senha = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [novaSenhaHash, user.id]
    );

    // Retornar a senha na resposta
    return res.json({
      success: true,
      message: 'Nova senha gerada com sucesso!',
      newPassword: novaSenha,
      instructions: 'Use esta senha para fazer login. Você pode alterá-la na tela de perfil após o login.'
    });

  } catch (error) {
    console.error('Erro ao processar recuperação de senha:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao processar solicitação de recuperação de senha'
    });
  }
});

module.exports = router;
