const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { buscarUm, buscarTodos, executarQuery } = require('../config/database-sqlite');
const { protect, authorize } = require('../middleware/auth');

// Função para gerar código único de certificado
function gerarCodigoCertificado() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${timestamp}-${random}`;
}

// @route   POST /api/certificates
// @desc    Emitir certificado
// @access  Private (Instrutor/Admin)
router.post('/', protect, authorize('instrutor', 'admin'), async (req, res) => {
  try {
    const { user_id, training_id, dataEmissao, validoAte, cargaHoraria, aproveitamento, observacoes } = req.body;

    // Valida campos obrigatórios
    if (!user_id || !training_id || !cargaHoraria) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: user_id, training_id, cargaHoraria'
      });
    }

    // Verifica se o aluno já possui certificado para este treinamento
    const certificadoExiste = await buscarUm(
      'SELECT * FROM certificates WHERE user_id = ? AND training_id = ?',
      [user_id, training_id]
    );

    if (certificadoExiste) {
      return res.status(400).json({
        success: false,
        error: 'Certificado já emitido para este aluno neste treinamento'
      });
    }

    // Verifica tipo do treinamento e aplica feature flag para legais
    const treinamento = await buscarUm('SELECT id, titulo, tipo FROM trainings WHERE id = ?', [training_id]);
    if (!treinamento) {
      return res.status(404).json({ success: false, error: 'Treinamento não encontrado' });
    }

    const ICP_ATIVO = String(process.env.CERTIFICADO_ICP_ATIVO || 'false').toLowerCase() === 'true';
    if (treinamento.tipo === 'legal' && !ICP_ATIVO) {
      return res.status(400).json({
        success: false,
        error: 'Emissão bloqueada: treinamento legal exige assinatura ICP. Habilite CERTIFICADO_ICP_ATIVO para prosseguir.'
      });
    }

    // Gera código único
    const codigo = gerarCodigoCertificado();

    // Monta dados de emissão e evidências (uso interno ou legal com ICP ativo)
    const emissaoISO = (dataEmissao || new Date().toISOString().split('T')[0]);
    const hashData = `${codigo}|${user_id}|${training_id}|${emissaoISO}|${cargaHoraria || ''}`;
    const hash = crypto.createHash('sha256').update(hashData).digest('hex');

    const evidencias = {
      emissor: {
        id: req.user.id,
        nome: req.user.nome,
        tipo: req.user.tipo
      },
      requester: {
        ip: (req.headers['x-forwarded-for'] || req.ip || '').toString(),
        userAgent: (req.headers['user-agent'] || '').toString()
      },
      treinamento: { id: treinamento.id, titulo: treinamento.titulo, tipo: treinamento.tipo },
      timestamp: new Date().toISOString(),
      baseHashCampos: 'codigo|user_id|training_id|dataEmissao|cargaHoraria'
    };

    // Cria o certificado
    const result = await executarQuery(
      `INSERT INTO certificates (user_id, training_id, codigo, dataEmissao, validoAte, cargaHoraria, aproveitamento, observacoes, hash, evidenciasJson, emissor_user_id, emissor_nome, emissor_ip, emissor_userAgent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id, training_id, codigo, emissaoISO, validoAte || null, cargaHoraria,
        aproveitamento || null, observacoes || null, hash, JSON.stringify(evidencias),
        req.user.id, req.user.nome, evidencias.requester.ip, evidencias.requester.userAgent
      ]
    );

    const certificado = await buscarUm('SELECT * FROM certificates WHERE id = ?', [result.lastID]);

    // Atualiza status do aluno no treinamento
    await executarQuery(
      'UPDATE user_trainings SET certificadoEmitido = 1, status = ? WHERE user_id = ? AND training_id = ?',
      ['concluido', user_id, training_id]
    );

    const verificationUrl = `${req.protocol}://${req.get('host')}/api/certificates/verify/${certificado.codigo}`;

    res.status(201).json({
      success: true,
      message: 'Certificado emitido com sucesso',
      certificado: {
        ...certificado,
        hash,
        verificationUrl
      }
    });
  } catch (error) {
    console.error('Erro ao emitir certificado:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao emitir certificado'
    });
  }
});

// @route   GET /api/certificates
// @desc    Obter todos os certificados
// @access  Private (Instrutor/Admin)
router.get('/', protect, authorize('instrutor', 'admin'), async (req, res) => {
  try {
    const certificados = await buscarTodos(
      `SELECT c.*, u.nome as aluno_nome, u.rgMetro, t.titulo as treinamento_titulo 
       FROM certificates c
       INNER JOIN users u ON c.user_id = u.id
       INNER JOIN trainings t ON c.training_id = t.id
       ORDER BY c.dataEmissao DESC`
    );

    res.json({
      success: true,
      count: certificados.length,
      certificados
    });
  } catch (error) {
    console.error('Erro ao buscar certificados:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar certificados'
    });
  }
});

// @route   GET /api/certificates/meus
// @desc    Obter certificados do aluno logado
// @access  Private (Aluno)
router.get('/meus', protect, async (req, res) => {
  try {
    const certificados = await buscarTodos(
      `SELECT c.*, t.titulo as treinamento_titulo, t.descricao as treinamento_descricao, t.categoria 
       FROM certificates c
       INNER JOIN trainings t ON c.training_id = t.id
       WHERE c.user_id = ?
       ORDER BY c.dataEmissao DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      count: certificados.length,
      certificados
    });
  } catch (error) {
    console.error('Erro ao buscar seus certificados:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar seus certificados'
    });
  }
});

// @route   GET /api/certificates/:id
// @desc    Obter certificado por ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const certificado = await buscarUm(
      `SELECT c.*, 
              u.nome as aluno_nome, u.email as aluno_email, u.rgMetro, u.cargo, u.setor,
              t.titulo as treinamento_titulo, t.descricao as treinamento_descricao, 
              t.categoria, t.instrutor
       FROM certificates c
       INNER JOIN users u ON c.user_id = u.id
       INNER JOIN trainings t ON c.training_id = t.id
       WHERE c.id = ?`,
      [req.params.id]
    );

    if (!certificado) {
      return res.status(404).json({
        success: false,
        error: 'Certificado não encontrado'
      });
    }

    // Verifica permissão: próprio aluno, instrutor ou admin
    if (req.user.id !== certificado.user_id && !['instrutor', 'admin'].includes(req.user.tipo)) {
      return res.status(403).json({
        success: false,
        error: 'Não autorizado a visualizar este certificado'
      });
    }

    res.json({
      success: true,
      certificado
    });
  } catch (error) {
    console.error('Erro ao buscar certificado:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar certificado'
    });
  }
});

// @route   GET /api/certificates/verify/:codigo
// @desc    Verificar autenticidade de um certificado pelo código
// @access  Public
router.get('/verify/:codigo', async (req, res) => {
  try {
    const certificado = await buscarUm(
      `SELECT c.*, 
              u.nome as aluno_nome, u.rgMetro,
              t.titulo as treinamento_titulo, t.categoria
       FROM certificates c
       INNER JOIN users u ON c.user_id = u.id
       INNER JOIN trainings t ON c.training_id = t.id
       WHERE c.codigo = ?`,
      [req.params.codigo]
    );

    if (!certificado) {
      return res.status(404).json({
        success: false,
        error: 'Certificado não encontrado ou código inválido'
      });
    }

    const verificationUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    res.json({
      success: true,
      valido: true,
      certificado: {
        codigo: certificado.codigo,
        aluno_nome: certificado.aluno_nome,
        rgMetro: certificado.rgMetro,
        treinamento_titulo: certificado.treinamento_titulo,
        categoria: certificado.categoria,
        dataEmissao: certificado.dataEmissao,
        cargaHoraria: certificado.cargaHoraria,
        aproveitamento: certificado.aproveitamento,
        hash: certificado.hash || null,
        evidencias: certificado.evidenciasJson ? JSON.parse(certificado.evidenciasJson) : null,
        verificationUrl
      }
    });
  } catch (error) {
    console.error('Erro ao verificar certificado:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar certificado'
    });
  }
});

// @route   GET /api/certificates/training/:trainingId
// @desc    Obter certificados de um treinamento
// @access  Private (Instrutor/Admin)
router.get('/training/:trainingId', protect, authorize('instrutor', 'admin'), async (req, res) => {
  try {
    const certificados = await buscarTodos(
      `SELECT c.*, u.nome as aluno_nome, u.rgMetro, u.email 
       FROM certificates c
       INNER JOIN users u ON c.user_id = u.id
       WHERE c.training_id = ?
       ORDER BY c.dataEmissao DESC`,
      [req.params.trainingId]
    );

    res.json({
      success: true,
      count: certificados.length,
      certificados
    });
  } catch (error) {
    console.error('Erro ao buscar certificados:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar certificados'
    });
  }
});

// @route   DELETE /api/certificates/:id
// @desc    Cancelar/deletar certificado
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const certificado = await buscarUm('SELECT * FROM certificates WHERE id = ?', [req.params.id]);

    if (!certificado) {
      return res.status(404).json({
        success: false,
        error: 'Certificado não encontrado'
      });
    }

    await executarQuery('DELETE FROM certificates WHERE id = ?', [req.params.id]);

    // Atualiza status do aluno no treinamento
    await executarQuery(
      'UPDATE user_trainings SET certificadoEmitido = 0 WHERE user_id = ? AND training_id = ?',
      [certificado.user_id, certificado.training_id]
    );

    res.json({
      success: true,
      message: 'Certificado cancelado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao cancelar certificado:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao cancelar certificado'
    });
  }
});

module.exports = router;
