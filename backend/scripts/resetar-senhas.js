// ============================================
// SCRIPT PARA RESETAR SENHAS
// ============================================

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { conectarBanco, executarQuery, buscarUm, fecharBanco } = require('../config/database-sqlite');

async function resetarSenhas() {
  try {
    console.log('🔧 Resetando senhas...\n');

    // Conecta ao banco
    await conectarBanco();

    // Hash das senhas
    const salt = await bcrypt.genSalt(10);
    const senhaAdmin = await bcrypt.hash('admin123', salt);
    const senhaInstrutor = await bcrypt.hash('metro123', salt);
    const senhaAluno = await bcrypt.hash('aluno123', salt);

    console.log('🔑 Atualizando senhas...\n');

    // Atualiza senha do admin
    await executarQuery(
      'UPDATE users SET senha = ? WHERE email = ?',
      [senhaAdmin, 'admin@metro.sp.gov.br']
    );
    console.log('✅ Senha do ADMIN atualizada');
    console.log('   📧 Email: admin@metro.sp.gov.br');
    console.log('   🔑 Senha: admin123\n');

    // Atualiza senha do instrutor
    await executarQuery(
      'UPDATE users SET senha = ? WHERE email = ?',
      [senhaInstrutor, 'instrutor@metro.sp.gov.br']
    );
    console.log('✅ Senha do INSTRUTOR atualizada');
    console.log('   📧 Email: instrutor@metro.sp.gov.br');
    console.log('   🔑 Senha: metro123\n');

    // Atualiza senha do aluno
    await executarQuery(
      'UPDATE users SET senha = ? WHERE rgMetro = ?',
      [senhaAluno, '1234567']
    );
    console.log('✅ Senha do ALUNO atualizada');
    console.log('   🆔 RG Metro: 1234567');
    console.log('   🔑 Senha: aluno123\n');

    console.log('═══════════════════════════════════════════════════');
    console.log('🎉 SENHAS RESETADAS COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════\n');

    // Fecha a conexão
    await fecharBanco();

    console.log('✅ Concluído!\n');

  } catch (error) {
    console.error('❌ Erro ao resetar senhas:', error);
    process.exit(1);
  }
}

// Executa
resetarSenhas();









