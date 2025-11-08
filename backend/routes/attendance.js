const express = require('express');
const router = express.Router();
const { buscarUm, buscarTodos, executarQuery } = require('../config/database-sqlite');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/attendance/classes
// @desc    Criar nova aula
// @access  Private (Instrutor/Admin)
router.post('/classes', protect, authorize('instrutor', 'admin'), async (req, res) => {
  try {
    const { training_id, titulo, descricao, data, horario_inicio, horario_fim, local, conteudo, materiais } = req.body;

    const result = await executarQuery(
      `INSERT INTO classes (training_id, titulo, descricao, data, horario_inicio, horario_fim, local, instrutor, conteudo, materiais)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [training_id, titulo, descricao, data, horario_inicio || null, horario_fim || null, local || null, req.user.nome, conteudo || null, materiais || null]
    );

    const aula = await buscarUm('SELECT * FROM classes WHERE id = ?', [result.lastID]);

    res.status(201).json({
      success: true,
      message: 'Aula criada com sucesso',
      aula
    });
  } catch (error) {
    console.error('Erro ao criar aula:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar aula'
    });
  }
});

// @route   GET /api/attendance/classes/:trainingId
// @desc    Obter aulas de um treinamento
// @access  Private
router.get('/classes/:trainingId', protect, async (req, res) => {
  try {
    const aulas = await buscarTodos(
      'SELECT * FROM classes WHERE training_id = ? ORDER BY data DESC',
      [req.params.trainingId]
    );

    res.json({
      success: true,
      count: aulas.length,
      aulas
    });
  } catch (error) {
    console.error('Erro ao buscar aulas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar aulas'
    });
  }
});

// @route   POST /api/attendance/registrar
// @desc    Registrar presença de alunos com assinatura digital (cria aula automaticamente)
// @access  Private (Instrutor/Admin)
router.post('/registrar', protect, authorize('instrutor', 'admin'), async (req, res) => {
  try {
    const { treinamentoId, dataAula, horarioAula, instrutor, presencas } = req.body;

    console.log('📝 Recebendo registro de presença:');
    console.log('   Treinamento ID:', treinamentoId);
    console.log('   Data:', dataAula);
    console.log('   Horário:', horarioAula);
    console.log('   Instrutor:', instrutor);
    console.log('   Presenças:', presencas.length);

    // Validações
    if (!treinamentoId || !dataAula || !horarioAula || !instrutor) {
      return res.status(400).json({
        success: false,
        erro: 'Dados incompletos: treinamentoId, dataAula, horarioAula e instrutor são obrigatórios'
      });
    }

    if (!Array.isArray(presencas) || presencas.length === 0) {
      return res.status(400).json({
        success: false,
        erro: 'Lista de presenças é obrigatória e deve conter ao menos um registro'
      });
    }

    // Verificar se o treinamento existe
    const treinamento = await buscarUm('SELECT * FROM trainings WHERE id = ?', [treinamentoId]);
    if (!treinamento) {
      return res.status(404).json({
        success: false,
        erro: 'Treinamento não encontrado'
      });
    }

    // Verificar se já existe uma aula para esta data e treinamento
    let aula = await buscarUm(
      'SELECT * FROM classes WHERE training_id = ? AND data = ?',
      [treinamentoId, dataAula]
    );
    
    let aulaId;
    if (aula) {
      // Usar aula existente
      aulaId = aula.id;
      console.log('ℹ️ Usando aula existente com ID:', aulaId);
    } else {
      // Criar nova aula
      const resultAula = await executarQuery(
        `INSERT INTO classes (training_id, titulo, data, horario_inicio, instrutor, conteudo)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          treinamentoId,
          `Aula - ${treinamento.titulo}`,
          dataAula,
          horarioAula,
          instrutor,
          'Registro de presença com assinatura digital'
        ]
      );
      aulaId = resultAula.lastID;
      console.log('✅ Aula criada com ID:', aulaId);
    }

    // Registrar presenças
    for (const presenca of presencas) {
      const { alunoId, presente, assinatura } = presenca;

      // Verificar se o aluno existe
      const aluno = await buscarUm('SELECT * FROM users WHERE id = ?', [alunoId]);
      if (!aluno) {
        console.warn(`⚠️ Aluno ID ${alunoId} não encontrado no banco, pulando...`);
        continue;
      }

      // Verificar se já existe registro de presença para este aluno nesta aula
      const jaExiste = await buscarUm(
        'SELECT * FROM attendances WHERE class_id = ? AND user_id = ?',
        [aulaId, alunoId]
      );

      if (jaExiste) {
        // Atualizar presença existente
        await executarQuery(
          'UPDATE attendances SET presente = ?, assinatura = ?, registradoPor = ? WHERE class_id = ? AND user_id = ?',
          [presente ? 1 : 0, assinatura || null, req.user.id, aulaId, alunoId]
        );
      } else {
        // Inserir nova presença
        await executarQuery(
          `INSERT INTO attendances (class_id, user_id, training_id, presente, assinatura, registradoPor)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [aulaId, alunoId, treinamentoId, presente ? 1 : 0, assinatura || null, req.user.id]
        );
      }
    }

    // Contar presenças REALMENTE salvas no banco após todas as inserções/atualizações
    const presencasBanco = await buscarTodos(
      'SELECT presente FROM attendances WHERE class_id = ?',
      [aulaId]
    );
    
    let qtdPresentes = 0;
    let qtdAusentes = 0;
    const alunosPresentesIds = [];
    
    presencasBanco.forEach((p) => {
      if (p.presente === 1) {
        qtdPresentes++;
      } else {
        qtdAusentes++;
      }
    });

    console.log('✅ Registro de presença salvo:');
    console.log('   Aula ID:', aulaId);
    console.log('   Presentes:', qtdPresentes);
    console.log('   Ausentes:', qtdAusentes);

    // Emissão de certificados removida daqui.

    res.json({
      success: true,
      message: 'Registro de presença salvo com sucesso',
      aulaId,
      estatisticas: {
        presentes: qtdPresentes,
        ausentes: qtdAusentes,
        total: qtdPresentes + qtdAusentes
      }
    });
  } catch (error) {
    console.error('❌ Erro ao registrar presenças:', error);
    res.status(500).json({
      success: false,
      erro: 'Erro ao registrar presenças: ' + error.message
    });
  }
});

// @route   POST /api/attendance/register
// @desc    Registrar presença de alunos
// @access  Private (Instrutor/Admin)
router.post('/register', protect, authorize('instrutor', 'admin'), async (req, res) => {
  try {
    const { class_id, training_id, presencas } = req.body;

    if (!Array.isArray(presencas) || presencas.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Lista de presenças é obrigatória'
      });
    }

    // Registra cada presença
    const promises = presencas.map(async ({ user_id, presente, assinatura, observacoes }) => {
      // Verifica se já existe registro
      const existe = await buscarUm(
        'SELECT * FROM attendances WHERE class_id = ? AND user_id = ?',
        [class_id, user_id]
      );

      if (existe) {
        // Atualiza
        return executarQuery(
          'UPDATE attendances SET presente = ?, assinatura = ?, observacoes = ?, registradoPor = ? WHERE class_id = ? AND user_id = ?',
          [presente ? 1 : 0, assinatura || null, observacoes || null, req.user.id, class_id, user_id]
        );
      } else {
        // Insere
        return executarQuery(
          'INSERT INTO attendances (class_id, user_id, training_id, presente, assinatura, observacoes, registradoPor) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [class_id, user_id, training_id, presente ? 1 : 0, assinatura || null, observacoes || null, req.user.id]
        );
      }
    });

    await Promise.all(promises);

    res.json({
      success: true,
      message: 'Presenças registradas com sucesso'
    });
  } catch (error) {
    console.error('Erro ao registrar presenças:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao registrar presenças'
    });
  }
});

// @route   GET /api/attendance/training/:trainingId
// @desc    Obter todas as presenças de um treinamento
// @access  Private
router.get('/training/:trainingId', protect, async (req, res) => {
  try {
    const presencas = await buscarTodos(
      `SELECT a.*, c.titulo as aula_titulo, c.data as aula_data, u.nome as aluno_nome 
       FROM attendances a
       INNER JOIN classes c ON a.class_id = c.id
       INNER JOIN users u ON a.user_id = u.id
       WHERE a.training_id = ?
       ORDER BY c.data DESC, u.nome ASC`,
      [req.params.trainingId]
    );

    res.json({
      success: true,
      count: presencas.length,
      presencas
    });
  } catch (error) {
    console.error('Erro ao buscar presenças:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar presenças'
    });
  }
});

// @route   GET /api/attendance/class/:classId
// @desc    Obter presenças de uma aula específica
// @access  Private
router.get('/class/:classId', protect, async (req, res) => {
  try {
    const presencas = await buscarTodos(
      `SELECT a.*, u.nome as aluno_nome, u.rgMetro, u.cargo 
       FROM attendances a
       INNER JOIN users u ON a.user_id = u.id
       WHERE a.class_id = ?
       ORDER BY u.nome ASC`,
      [req.params.classId]
    );

    res.json({
      success: true,
      count: presencas.length,
      presencas
    });
  } catch (error) {
    console.error('Erro ao buscar presenças:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar presenças'
    });
  }
});

// @route   GET /api/attendance/user/:userId/training/:trainingId
// @desc    Obter frequência de um aluno em um treinamento
// @access  Private
router.get('/user/:userId/training/:trainingId', protect, async (req, res) => {
  try {
    const presencas = await buscarTodos(
      `SELECT a.*, c.titulo as aula_titulo, c.data as aula_data 
       FROM attendances a
       INNER JOIN classes c ON a.class_id = c.id
       WHERE a.user_id = ? AND a.training_id = ?
       ORDER BY c.data DESC`,
      [req.params.userId, req.params.trainingId]
    );

    const totalAulas = await buscarUm(
      'SELECT COUNT(*) as total FROM classes WHERE training_id = ?',
      [req.params.trainingId]
    );

    const totalPresencas = presencas.filter(p => p.presente === 1).length;
    const percentualFrequencia = totalAulas.total > 0 
      ? ((totalPresencas / totalAulas.total) * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      presencas,
      stats: {
        totalAulas: totalAulas.total,
        totalPresencas,
        percentualFrequencia: parseFloat(percentualFrequencia)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar frequência:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar frequência'
    });
  }
});

module.exports = router;
