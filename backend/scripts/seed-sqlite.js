// ============================================
// SCRIPT DE SEED PARA BANCO SQLite
// Popula o banco com dados iniciais para teste
// ============================================

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { conectarBanco, executarQuery, buscarUm, fecharBanco } = require('../config/database-sqlite');
const fs = require('fs');
const path = require('path');

async function seed() {
  try {
    console.log('🌱 Iniciando seed do banco de dados...\n');

    // Conecta ao banco
    await conectarBanco();

    // Lê e executa o schema
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('📄 Lendo schema.sql...');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // Divide o schema em comandos individuais
      const comandos = schema
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

      console.log(`⚙️  Executando ${comandos.length} comandos SQL...\n`);

      for (const comando of comandos) {
        try {
          await executarQuery(comando);
        } catch (err) {
          // Ignora erros de "already exists"
          if (!err.message.includes('already exists')) {
            console.warn('⚠️  Aviso:', err.message);
          }
        }
      }
    }

    console.log('✅ Schema criado/atualizado com sucesso!\n');

    // ============================================
    // CRIAR USUÁRIOS
    // ============================================
    console.log('👥 Criando usuários...\n');

    // Hash das senhas
    const salt = await bcrypt.genSalt(10);
    const senhaAdmin = await bcrypt.hash('admin123', salt);
    const senhaInstrutor = await bcrypt.hash('metro123', salt);
    const senhaAluno = await bcrypt.hash('aluno123', salt);

    // 1. ADMIN
    const adminExiste = await buscarUm('SELECT * FROM users WHERE email = ?', ['admin@metro.sp.gov.br']);
    if (!adminExiste) {
      await executarQuery(
        `INSERT INTO users (nome, rgMetro, email, senha, cargo, setor, tipo, matricula, ativo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Administrador', '0000001', 'admin@metro.sp.gov.br', senhaAdmin, 'Administrador', 'Administrativo', 'admin', 'ADM2024', 1]
      );
      console.log('✅ Admin criado');
      console.log('   📧 Email: admin@metro.sp.gov.br');
      console.log('   🔑 Senha: admin123\n');
    } else {
      console.log('ℹ️  Admin já existe\n');
    }

    // 2. INSTRUTOR
    const instrutorExiste = await buscarUm('SELECT * FROM users WHERE email = ?', ['instrutor@metro.sp.gov.br']);
    if (!instrutorExiste) {
      await executarQuery(
        `INSERT INTO users (nome, rgMetro, email, senha, telefone, cargo, setor, tipo, matricula, ativo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Instrutor Padrão', '0000002', 'instrutor@metro.sp.gov.br', senhaInstrutor, '(11) 98765-4321', 'Instrutor', 'Recursos Humanos', 'instrutor', 'INST2024', 1]
      );
      console.log('✅ Instrutor criado');
      console.log('   📧 Email: instrutor@metro.sp.gov.br');
      console.log('   🔑 Senha: metro123\n');
    } else {
      console.log('ℹ️  Instrutor já existe\n');
    }

    // 3. ALUNO
    const alunoExiste = await buscarUm('SELECT * FROM users WHERE rgMetro = ?', ['1234567']);
    if (!alunoExiste) {
      await executarQuery(
        `INSERT INTO users (nome, rgMetro, email, senha, telefone, cargo, setor, tipo, matricula, ativo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['João Silva', '1234567', '1234567@aluno.metro.sp.gov.br', senhaAluno, '(11) 91234-5678', 'Operador de Metrô', 'Operações', 'aluno', '12345672024', 1]
      );
      console.log('✅ Aluno criado');
      console.log('   🆔 RG Metro: 1234567');
      console.log('   🔑 Senha: aluno123\n');
    } else {
      console.log('ℹ️  Aluno já existe\n');
    }

    // CRIAR TREINAMENTOS (DESLIGADO POR PADRÃO)
    // Para popular exemplos, rode com SEED_TREINAMENTOS=true
    if (String(process.env.SEED_TREINAMENTOS).toLowerCase() === 'true') {
      console.log('📚 Criando treinamentos de exemplo...\n');
      const treinamentos = [
        // ... exemplos removidos propositalmente ...
      ];
      for (const t of treinamentos) {
        const existe = await buscarUm('SELECT * FROM trainings WHERE titulo = ?', [t.titulo]);
        if (!existe) {
          await executarQuery(
            `INSERT INTO trainings (titulo, descricao, categoria, instrutor, duracao_horas, vagas_total, vagas_ocupadas, 
             data_inicio, data_fim, horario_inicio, horario_fim, local, status, objetivos, conteudo, requisitos, certificado)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [t.titulo, t.descricao, t.categoria, t.instrutor, t.duracao_horas, t.vagas_total, t.vagas_ocupadas,
             t.data_inicio, t.data_fim, t.horario_inicio, t.horario_fim, t.local, t.status, t.objetivos, t.conteudo, t.requisitos, t.certificado]
          );
          console.log(`✅ Treinamento criado: ${t.titulo}`);
        }
      }
    } else {
      console.log('⏭️  Pulando criação de treinamentos de exemplo (SEED_TREINAMENTOS != true)\n');
    }

    console.log('\n════════════════════════════════════════════════════');
    console.log('🎉 SEED CONCLUÍDO COM SUCESSO!');
    console.log('════════════════════════════════════════════════════');
    console.log('\n📋 CREDENCIAIS DE ACESSO:\n');
    console.log('👤 ADMIN:');
    console.log('   Email: admin@metro.sp.gov.br');
    console.log('   Senha: admin123\n');
    console.log('👨‍🏫 INSTRUTOR:');
    console.log('   Email: instrutor@metro.sp.gov.br');
    console.log('   Senha: metro123\n');
    console.log('👨‍🎓 ALUNO:');
    console.log('   RG Metro: 1234567');
    console.log('   Senha: aluno123\n');
    console.log('════════════════════════════════════════════════════\n');

    // Fecha a conexão
    await fecharBanco();

    console.log('✅ Conexão com banco fechada\n');

  } catch (error) {
    console.error('❌ Erro no seed:', error);
    process.exit(1);
  }
}

// Executa o seed
seed();


