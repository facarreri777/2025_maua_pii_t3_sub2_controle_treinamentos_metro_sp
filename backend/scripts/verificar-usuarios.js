// ============================================
// SCRIPT PARA VERIFICAR USUÁRIOS NO BANCO
// ============================================

require('dotenv').config();
const { conectarBanco, buscarTodos, fecharBanco } = require('../config/database-sqlite');

async function verificarUsuarios() {
  try {
    console.log('🔍 Verificando usuários no banco de dados...\n');

    // Conecta ao banco
    await conectarBanco();

    // Busca todos os usuários
    const usuarios = await buscarTodos('SELECT id, nome, email, rgMetro, tipo, ativo FROM users ORDER BY tipo, id');

    console.log('═══════════════════════════════════════════════════');
    console.log(`📊 TOTAL DE USUÁRIOS: ${usuarios.length}`);
    console.log('═══════════════════════════════════════════════════\n');

    if (usuarios.length === 0) {
      console.log('❌ NENHUM USUÁRIO ENCONTRADO!');
      console.log('   Execute: npm run seed\n');
    } else {
      usuarios.forEach((user, index) => {
        console.log(`${index + 1}. ${user.nome}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Tipo: ${user.tipo}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   RG Metro: ${user.rgMetro}`);
        console.log(`   Ativo: ${user.ativo ? 'Sim' : 'Não'}`);
        console.log('');
      });

      console.log('═══════════════════════════════════════════════════');
      console.log('📋 CREDENCIAIS PARA LOGIN:');
      console.log('═══════════════════════════════════════════════════\n');

      // Admin
      const admin = usuarios.find(u => u.tipo === 'admin');
      if (admin) {
        console.log('👑 ADMIN:');
        console.log(`   Email: ${admin.email}`);
        console.log('   Senha: admin123\n');
      }

      // Instrutor
      const instrutor = usuarios.find(u => u.tipo === 'instrutor');
      if (instrutor) {
        console.log('👨‍🏫 INSTRUTOR:');
        console.log(`   Email: ${instrutor.email}`);
        console.log('   Senha: metro123\n');
      }

      // Aluno
      const aluno = usuarios.find(u => u.tipo === 'aluno');
      if (aluno) {
        console.log('👨‍🎓 ALUNO:');
        console.log(`   RG Metro: ${aluno.rgMetro}`);
        console.log('   Senha: aluno123\n');
      }
    }

    // Fecha a conexão
    await fecharBanco();

    console.log('✅ Verificação concluída!\n');

  } catch (error) {
    console.error('❌ Erro ao verificar usuários:', error);
    process.exit(1);
  }
}

// Executa
verificarUsuarios();









