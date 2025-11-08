const express = require('express');
const router = express.Router();
const { buscarUm, buscarTodos, executarQuery } = require('../config/database-sqlite');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/trainings
// @desc    Obter todos os treinamentos
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, categoria, search } = req.query;
    
    let sql = 'SELECT * FROM trainings WHERE 1=1';
    const params = [];
    
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (categoria) {
      sql += ' AND categoria = ?';
      params.push(categoria);
    }
    if (search) {
      sql += ' AND (titulo LIKE ? OR descricao LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
    }

    sql += ' ORDER BY data_inicio DESC';

    const trainings = await buscarTodos(sql, params);

    res.json({
      success: true,
      count: trainings.length,
      trainings
    });
  } catch (error) {
    console.error('Erro ao buscar treinamentos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar treinamentos'
    });
  }
});

// @route   GET /api/trainings/public
// @desc    Listar treinamentos para exibição pública (aluno sem exigir token)
// @access  Public
router.get('/public', async (req, res) => {
  try {
    // Lista simples; ajuste filtros conforme necessidade (data/vagas/status)
    const trainings = await buscarTodos(
      'SELECT * FROM trainings ORDER BY date(data_inicio) DESC'
    );

    res.json({
      success: true,
      count: trainings.length,
      trainings
    });
  } catch (error) {
    console.error('Erro ao buscar treinamentos públicos:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar treinamentos' });
  }
});

// @route   GET /api/trainings/disponiveis
// @desc    Obter treinamentos disponíveis para inscrição
// @access  Private (Aluno)
router.get('/disponiveis', protect, async (req, res) => {
  try {
    const trainings = await buscarTodos(
      `SELECT * FROM trainings 
       WHERE status IN ('planejado', 'em_andamento') 
       AND (vagas_total - vagas_ocupadas) > 0 
       AND date(data_inicio) >= date('now')
       ORDER BY data_inicio ASC`
    );

    res.json({
      success: true,
      count: trainings.length,
      trainings
    });
  } catch (error) {
    console.error('Erro ao buscar treinamentos disponíveis:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar treinamentos disponíveis'
    });
  }
});

// @route   GET /api/trainings/meus
// @desc    Obter treinamentos do aluno logado
// @access  Private (Aluno)
router.get('/meus', protect, async (req, res) => {
  try {
    const trainings = await buscarTodos(
      `SELECT t.*, ut.status as meuStatus, ut.progresso, ut.dataInscricao
       FROM trainings t
       INNER JOIN user_trainings ut ON t.id = ut.training_id
       WHERE ut.user_id = ?
       ORDER BY t.data_inicio DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      count: trainings.length,
      trainings
    });
  } catch (error) {
    console.error('Erro ao buscar seus treinamentos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar seus treinamentos'
    });
  }
});

// @route   GET /api/trainings/:id
// @desc    Obter treinamento por ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const training = await buscarUm('SELECT * FROM trainings WHERE id = ?', [req.params.id]);

    if (!training) {
      return res.status(404).json({
        success: false,
        error: 'Treinamento não encontrado'
      });
    }

    // Buscar alunos inscritos
    const alunos = await buscarTodos(
      `SELECT u.id, u.nome, u.email, u.rgMetro, u.cargo, u.setor, 
              ut.status, ut.progresso, ut.dataInscricao
       FROM user_trainings ut
       INNER JOIN users u ON ut.user_id = u.id
       WHERE ut.training_id = ?`,
      [req.params.id]
    );

    training.alunos = alunos;

    res.json({
      success: true,
      training
    });
  } catch (error) {
    console.error('Erro ao buscar treinamento:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar treinamento'
    });
  }
});

// @route   POST /api/trainings
// @desc    Criar novo treinamento
// @access  Private (Instrutor/Admin)
router.post('/', protect, authorize('instrutor', 'admin'), async (req, res) => {
  try {
    const {
      titulo, descricao, categoria, duracao_horas, vagas_total,
      data_inicio, data_fim, horario_inicio, horario_fim, local,
      status, objetivos, conteudo, requisitos, certificado, tipo
    } = req.body;

    const tipoSanitizado = (tipo === 'legal' ? 'legal' : 'interno');

    const result = await executarQuery(
      `INSERT INTO trainings (
        titulo, descricao, categoria, instrutor, duracao_horas, vagas_total, vagas_ocupadas,
        data_inicio, data_fim, horario_inicio, horario_fim, local, status, 
        objetivos, conteudo, requisitos, certificado, tipo
      ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        titulo, descricao, categoria, req.user.nome, duracao_horas, vagas_total,
        data_inicio, data_fim, horario_inicio || null, horario_fim || null, local,
        status || 'planejado', objetivos || null, conteudo || null, requisitos || null,
        certificado ? 1 : 0, tipoSanitizado
      ]
    );

    const training = await buscarUm('SELECT * FROM trainings WHERE id = ?', [result.lastID]);

    res.status(201).json({
      success: true,
      training
    });
  } catch (error) {
    console.error('Erro ao criar treinamento:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao criar treinamento'
    });
  }
});

// @route   PUT /api/trainings/:id
// @desc    Atualizar treinamento
// @access  Private (Instrutor/Admin)
router.put('/:id', protect, authorize('instrutor', 'admin'), async (req, res) => {
  try {
    const training = await buscarUm('SELECT * FROM trainings WHERE id = ?', [req.params.id]);

    if (!training) {
      return res.status(404).json({
        success: false,
        error: 'Treinamento não encontrado'
      });
    }

    // Campos permitidos para atualização
    const camposPermitidos = [
      'titulo', 'descricao', 'categoria', 'duracao_horas', 'vagas_total',
      'data_inicio', 'data_fim', 'horario_inicio', 'horario_fim', 'local',
      'status', 'objetivos', 'conteudo', 'requisitos', 'certificado', 'tipo'
    ];

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

    updates.push('updatedAt = CURRENT_TIMESTAMP');
    params.push(req.params.id);

    const sql = `UPDATE trainings SET ${updates.join(', ')} WHERE id = ?`;
    await executarQuery(sql, params);

    const updatedTraining = await buscarUm('SELECT * FROM trainings WHERE id = ?', [req.params.id]);

    // Se o treinamento foi concluído, emitir certificados conforme regra de presença >= 75%
    try {
      const statusRequested = req.body.status;
      if (statusRequested === 'concluido' || updatedTraining.status === 'concluido') {
        // Total de aulas do treinamento
        const totalAulasRow = await buscarUm('SELECT COUNT(*) as total FROM classes WHERE training_id = ?', [req.params.id]);
        const totalAulas = totalAulasRow?.total || 0;

        // Buscar todos os alunos inscritos neste treinamento
        const inscritos = await buscarTodos(
          'SELECT user_id FROM user_trainings WHERE training_id = ?',
          [req.params.id]
        );

        const cargaHoraria = updatedTraining.duracao_horas || 0;
        const gerarCodigo = () => `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2,8).toUpperCase()}`;

        for (const row of inscritos) {
          const userId = row.user_id;
          // Presenças do aluno
          const presRow = await buscarUm(
            'SELECT COUNT(*) as presentes FROM attendances WHERE training_id = ? AND user_id = ? AND presente = 1',
            [req.params.id, userId]
          );
          const presentes = presRow?.presentes || 0;

          let percentual = 0;
          if (totalAulas <= 1) {
            // Um único encontro: se esteve presente em alguma, consideramos 100%; caso contrário, 0%
            percentual = presentes > 0 ? 100 : 0;
          } else {
            percentual = Math.round((presentes / totalAulas) * 100);
          }

          if (percentual >= 75) {
            const jaTem = await buscarUm(
              'SELECT id FROM certificates WHERE user_id = ? AND training_id = ?',
              [userId, req.params.id]
            );
            if (!jaTem) {
              const codigo = gerarCodigo();
              const dataEmissao = new Date().toISOString().split('T')[0];
              const hashData = `${codigo}|${userId}|${req.params.id}|${dataEmissao}|${cargaHoraria || ''}`;
              const crypto = require('crypto');
              const hash = crypto.createHash('sha256').update(hashData).digest('hex');
              
              const evidencias = {
                emissor: { id: req.user.id, nome: req.user.nome, tipo: req.user.tipo },
                requester: { ip: (req.headers['x-forwarded-for'] || req.ip || '').toString(), userAgent: (req.headers['user-agent'] || '').toString() },
                treinamento: { id: updatedTraining.id, titulo: updatedTraining.titulo, tipo: updatedTraining.tipo },
                timestamp: new Date().toISOString(),
                baseHashCampos: 'codigo|user_id|training_id|dataEmissao|cargaHoraria'
              };
              
              await executarQuery(
                `INSERT INTO certificates (user_id, training_id, codigo, dataEmissao, cargaHoraria, aproveitamento, observacoes, hash, evidenciasJson, emissor_user_id, emissor_nome, emissor_ip, emissor_userAgent)
                 VALUES (?, ?, ?, ?, ?, NULL, 'Emitido ao concluir treinamento (>=75% presença)', ?, ?, ?, ?, ?, ?)`,
                [userId, req.params.id, codigo, dataEmissao, cargaHoraria, hash, JSON.stringify(evidencias), req.user.id, req.user.nome, evidencias.requester.ip, evidencias.requester.userAgent]
              );
            }
            await executarQuery(
              'UPDATE user_trainings SET certificadoEmitido = 1, status = ? WHERE user_id = ? AND training_id = ?',
              ['concluido', userId, req.params.id]
            );
          }
        }
      }
    } catch (emitErr) {
      console.warn('⚠️ Erro ao emitir certificados na conclusão:', emitErr?.message || emitErr);
    }

    res.json({
      success: true,
      training: updatedTraining
    });
  } catch (error) {
    console.error('Erro ao atualizar treinamento:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao atualizar treinamento'
    });
  }
});

// @route   DELETE /api/trainings/:id
// @desc    Deletar treinamento
// @access  Private (Instrutor/Admin)
router.delete('/:id', protect, authorize('instrutor', 'admin'), async (req, res) => {
  try {
    const training = await buscarUm('SELECT * FROM trainings WHERE id = ?', [req.params.id]);

    if (!training) {
      return res.status(404).json({
        success: false,
        error: 'Treinamento não encontrado'
      });
    }

    // Delete real (não soft delete)
    await executarQuery('DELETE FROM trainings WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Treinamento deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar treinamento:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar treinamento'
    });
  }
});

// @route   POST /api/trainings/:id/inscrever
// @desc    Inscrever aluno em treinamento
// @access  Private (Aluno)
router.post('/:id/inscrever', protect, async (req, res) => {
  try {
    const training = await buscarUm('SELECT * FROM trainings WHERE id = ?', [req.params.id]);

    if (!training) {
      return res.status(404).json({
        success: false,
        error: 'Treinamento não encontrado'
      });
    }

    // Verifica se há vagas disponíveis
    const vagasDisponiveis = training.vagas_total - training.vagas_ocupadas;
    if (vagasDisponiveis <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Não há vagas disponíveis para este treinamento'
      });
    }

    // Verifica se já está inscrito
    const jaInscrito = await buscarUm(
      'SELECT * FROM user_trainings WHERE user_id = ? AND training_id = ?',
      [req.user.id, req.params.id]
    );

    if (jaInscrito) {
      return res.status(400).json({
        success: false,
        error: 'Você já está inscrito neste treinamento'
      });
    }

    // Inscreve o aluno
    await executarQuery(
      'INSERT INTO user_trainings (user_id, training_id, status, progresso) VALUES (?, ?, ?, ?)',
      [req.user.id, req.params.id, 'inscrito', 0]
    );

    // Atualiza vagas ocupadas
    await executarQuery(
      'UPDATE trainings SET vagas_ocupadas = vagas_ocupadas + 1 WHERE id = ?',
      [req.params.id]
    );

    const updatedTraining = await buscarUm('SELECT * FROM trainings WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Inscrição realizada com sucesso',
      training: updatedTraining
    });
  } catch (error) {
    console.error('Erro ao realizar inscrição:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao realizar inscrição'
    });
  }
});

// @route   POST /api/trainings/:id/cancelar-inscricao
// @desc    Cancelar inscrição em treinamento
// @access  Private (Aluno)
router.post('/:id/cancelar-inscricao', protect, async (req, res) => {
  try {
    // Verifica se está inscrito
    const inscricao = await buscarUm(
      'SELECT * FROM user_trainings WHERE user_id = ? AND training_id = ?',
      [req.user.id, req.params.id]
    );

    if (!inscricao) {
      return res.status(400).json({
        success: false,
        error: 'Você não está inscrito neste treinamento'
      });
    }

    // Atualiza status para cancelado
    await executarQuery(
      'UPDATE user_trainings SET status = ? WHERE user_id = ? AND training_id = ?',
      ['cancelado', req.user.id, req.params.id]
    );

    // Libera vaga
    await executarQuery(
      'UPDATE trainings SET vagas_ocupadas = vagas_ocupadas - 1 WHERE id = ?',
      [req.params.id]
    );

    res.json({
      success: true,
      message: 'Inscrição cancelada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao cancelar inscrição:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao cancelar inscrição'
    });
  }
});

// @route   GET /api/trainings/stats/dashboard
// @desc    Obter estatísticas de treinamentos
// @access  Private (Instrutor/Admin)
router.get('/stats/dashboard', protect, authorize('instrutor', 'admin'), async (req, res) => {
  try {
    const totalResult = await buscarUm('SELECT COUNT(*) as total FROM trainings');
    const totalTreinamentos = totalResult.total;

    const emAndamentoResult = await buscarUm('SELECT COUNT(*) as total FROM trainings WHERE status = "em_andamento"');
    const emAndamento = emAndamentoResult.total;

    const concluidosResult = await buscarUm('SELECT COUNT(*) as total FROM trainings WHERE status = "concluido"');
    const concluidos = concluidosResult.total;

    const planejadosResult = await buscarUm('SELECT COUNT(*) as total FROM trainings WHERE status = "planejado"');
    const planejados = planejadosResult.total;

    const porCategoria = await buscarTodos(
      `SELECT categoria as _id, COUNT(*) as count 
       FROM trainings 
       GROUP BY categoria 
       ORDER BY count DESC`
    );

    res.json({
      success: true,
      stats: {
        totalTreinamentos,
        emAndamento,
        concluidos,
        planejados,
        porCategoria
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
