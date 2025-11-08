const express = require('express');
const router = express.Router();
const { buscarUm, buscarTodos, executarQuery } = require('../config/database-sqlite');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/users
// @desc    Obter todos os usuários
// @access  Private (Instrutor/Admin)
router.get('/', protect, authorize('instrutor', 'admin'), async (req, res) => {
  try {
    const { tipo, setor, cargo, ativo, search } = req.query;
    
    // Construir query SQL dinamicamente
    let sql = 'SELECT id, nome, rgMetro, email, telefone, cargo, setor, tipo, matricula, dataAdmissao, fotoPerfil, ativo, createdAt FROM users WHERE 1=1';
    const params = [];
    
    if (tipo) {
      sql += ' AND tipo = ?';
      params.push(tipo);
    }
    if (setor) {
      sql += ' AND setor = ?';
      params.push(setor);
    }
    if (cargo) {
      sql += ' AND cargo = ?';
      params.push(cargo);
    }
    if (ativo !== undefined) {
      sql += ' AND ativo = ?';
      params.push(ativo === 'true' ? 1 : 0);
    }
    
    // Busca por nome, email ou RG Metro
    if (search) {
      sql += ' AND (nome LIKE ? OR email LIKE ? OR rgMetro LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    sql += ' ORDER BY createdAt DESC';

    const users = await buscarTodos(sql, params);

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar usuários'
    });
  }
});

// @route   GET /api/users/alunos
// @desc    Obter todos os alunos
// @access  Private (Instrutor/Admin)
router.get('/alunos', protect, authorize('instrutor', 'admin'), async (req, res) => {
  try {
    const alunos = await buscarTodos(
      `SELECT id, nome, rgMetro, email, telefone, cargo, setor, tipo, matricula, dataAdmissao, fotoPerfil, ativo, createdAt 
       FROM users 
       WHERE tipo = 'aluno' AND ativo = 1 
       ORDER BY nome ASC`
    );

    res.json({
      success: true,
      count: alunos.length,
      alunos
    });
  } catch (error) {
    console.error('Erro ao buscar alunos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar alunos'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Obter usuário por ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await buscarUm(
      `SELECT id, nome, rgMetro, email, telefone, cargo, setor, tipo, matricula, dataAdmissao, fotoPerfil, ativo, createdAt 
       FROM users 
       WHERE id = ?`,
      [req.params.id]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Buscar treinamentos do usuário
    const treinamentos = await buscarTodos(
      `SELECT ut.*, t.titulo, t.categoria, t.data_inicio as dataInicio, t.data_fim as dataFim
       FROM user_trainings ut
       INNER JOIN trainings t ON ut.training_id = t.id
       WHERE ut.user_id = ?
       ORDER BY ut.dataInscricao DESC`,
      [req.params.id]
    );

    user.treinamentos = treinamentos;

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar usuário'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Atualizar usuário
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    // Verifica se é o próprio usuário ou admin/instrutor
    if (req.user.id.toString() !== req.params.id && 
        !['admin', 'instrutor'].includes(req.user.tipo)) {
      return res.status(403).json({
        success: false,
        error: 'Não autorizado a atualizar este usuário'
      });
    }

    // Campos que podem ser atualizados
    let camposPermitidos = ['nome', 'email', 'telefone', 'fotoPerfil'];
    
    // Admin/Instrutor podem atualizar mais campos
    if (['admin', 'instrutor'].includes(req.user.tipo)) {
      camposPermitidos = ['nome', 'email', 'telefone', 'fotoPerfil', 'cargo', 'setor', 'tipo', 'ativo', 'dataAdmissao'];
    }

    const updates = [];
    const params = [];

    camposPermitidos.forEach(campo => {
      if (req.body[campo] !== undefined) {
        updates.push(`${campo} = ?`);
        params.push(req.body[campo]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum campo válido para atualizar'
      });
    }

    // Adicionar updatedAt
    updates.push('updatedAt = CURRENT_TIMESTAMP');
    params.push(req.params.id);

    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    await executarQuery(sql, params);

    // Buscar usuário atualizado
    const user = await buscarUm(
      `SELECT id, nome, rgMetro, email, telefone, cargo, setor, tipo, matricula, dataAdmissao, fotoPerfil, ativo, createdAt 
       FROM users 
       WHERE id = ?`,
      [req.params.id]
    );

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
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao atualizar usuário'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Deletar usuário (soft delete)
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin', 'instrutor'), async (req, res) => {
  try {
    // Busca o alvo
    const alvo = await buscarUm(
      `SELECT id, nome, rgMetro, email, telefone, cargo, setor, tipo, ativo 
       FROM users 
       WHERE id = ?`,
      [req.params.id]
    );

    if (!alvo) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    }

    // Regras de autorização adicionais:
    // - Admin pode desativar qualquer usuário
    // - Instrutor só pode desativar alunos (não pode desativar instrutores ou admins)
    if (req.user.tipo === 'instrutor') {
      if (alvo.tipo !== 'aluno') {
        return res.status(403).json({
          success: false,
          error: 'Instrutor só pode desativar usuários do tipo aluno'
        });
      }
    }

    await executarQuery(
      'UPDATE users SET ativo = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [req.params.id]
    );

    const user = await buscarUm(
      `SELECT id, nome, rgMetro, email, telefone, cargo, setor, tipo, matricula, dataAdmissao, fotoPerfil, ativo 
       FROM users 
       WHERE id = ?`,
      [req.params.id]
    );

    res.json({
      success: true,
      message: 'Usuário desativado com sucesso',
      user
    });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar usuário'
    });
  }
});

// @route   GET /api/users/stats/dashboard
// @desc    Obter estatísticas de usuários
// @access  Private (Instrutor/Admin)
router.get('/stats/dashboard', protect, authorize('instrutor', 'admin'), async (req, res) => {
  try {
    // Total de usuários ativos
    const totalResult = await buscarUm('SELECT COUNT(*) as total FROM users WHERE ativo = 1');
    const totalUsuarios = totalResult.total;

    // Total de alunos
    const alunosResult = await buscarUm('SELECT COUNT(*) as total FROM users WHERE tipo = "aluno" AND ativo = 1');
    const totalAlunos = alunosResult.total;

    // Total de instrutores
    const instrutoresResult = await buscarUm('SELECT COUNT(*) as total FROM users WHERE tipo = "instrutor" AND ativo = 1');
    const totalInstrutores = instrutoresResult.total;
    
    // Usuários por setor
    const usuariosPorSetor = await buscarTodos(
      `SELECT setor as _id, COUNT(*) as count 
       FROM users 
       WHERE ativo = 1 
       GROUP BY setor 
       ORDER BY count DESC`
    );

    // Usuários por cargo
    const usuariosPorCargo = await buscarTodos(
      `SELECT cargo as _id, COUNT(*) as count 
       FROM users 
       WHERE ativo = 1 
       GROUP BY cargo 
       ORDER BY count DESC`
    );

    res.json({
      success: true,
      stats: {
        totalUsuarios,
        totalAlunos,
        totalInstrutores,
        usuariosPorSetor,
        usuariosPorCargo
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar estatísticas'
    });
  }
});

module.exports = router;
