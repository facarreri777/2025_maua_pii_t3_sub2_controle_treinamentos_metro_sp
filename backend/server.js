require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { inicializarBanco } = require('./config/database-sqlite');

const app = express();

// Conectar e criar schema mínimo
inicializarBanco()
  .then(() => console.log('✅ Banco inicializado'))
  .catch((err) => {
    console.error('❌ Falha ao inicializar banco:', err);
    process.exit(1);
  });

app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Rotas essenciais
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/trainings', require('./routes/trainings'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/certificates', require('./routes/certificates'));

app.get('/health', (req, res) => {
  res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

app.use((req, res) => res.status(404).json({ success: false, error: 'Rota não encontrada' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta: ${PORT}`);
});

module.exports = app;
