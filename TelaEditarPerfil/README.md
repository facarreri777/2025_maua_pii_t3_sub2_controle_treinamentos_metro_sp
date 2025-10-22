# Tela de Editar Perfil do Aluno

## 📋 Descrição

Esta tela permite que os alunos editem suas informações pessoais no sistema de treinamentos do Metrô SP. As informações profissionais são exibidas apenas para visualização, pois são gerenciadas pelo sistema administrativo.

## 🎯 Funcionalidades

### ✅ Campos Editáveis
- **Nome Completo**: Campo obrigatório para identificação do usuário
- **Email**: Endereço de email para comunicação
- **Telefone**: Número de telefone com formatação automática
- **Senha**: Alteração de senha com validação de segurança

### 👁️ Campos de Visualização (Read-Only)
- **RG Metro**: Identificação única do colaborador (não editável)
- **Cargo**: Posição ocupada na empresa
- **Setor**: Área de atuação (Operação, Manutenção, Segurança, Administrativo)
- **Data de Admissão**: Data de ingresso na empresa
- **Matrícula**: Número de matrícula do colaborador

## 🔧 Tecnologias Utilizadas

- **HTML5**: Estrutura semântica da página
- **CSS3**: Estilização responsiva e moderna
- **JavaScript**: Funcionalidades interativas e validações
- **Font Awesome**: Ícones para melhor UX
- **VLibras**: Acessibilidade para surdos

## 📱 Responsividade

A tela é totalmente responsiva e se adapta a diferentes tamanhos de tela:

- **Desktop**: Layout em 3 colunas para informações
- **Tablet**: Layout em 2 colunas
- **Mobile**: Layout em 1 coluna com otimizações para touch

## 🎨 Design System

### Cores Principais
- **Azul Escuro**: `#002776` (header, botões principais)
- **Verde Sucesso**: `#22c55e` (botão salvar)
- **Amarelo Aviso**: `#f59e0b` (botão limpar)
- **Cinza**: `#6c757d` (campos readonly)

### Componentes
- **Cards**: Seções organizadas com sombras sutis
- **Botões**: Estilo consistente com hover effects
- **Formulários**: Validação em tempo real
- **Notificações**: Toast messages para feedback

## 🔐 Segurança

### Validações Implementadas
- **Nome**: Mínimo 3 caracteres
- **Email**: Formato válido obrigatório
- **Telefone**: Formato (11) 99999-9999
- **Senha**: Mínimo 6 caracteres para nova senha
- **Confirmação**: Senhas devem coincidir

### Proteções
- RG Metro não pode ser alterado
- Informações profissionais protegidas
- Validação de senha atual para alterações
- Limpeza de sessão no logout

## 📂 Estrutura de Arquivos

```
2025_maua_pii_t3_sub2_controle_treinamentos_metro_sp-tela-editar-perfil-aluno/
├── editar_perfil_aluno.html          # Estrutura HTML
├── editar_perfil_aluno.css           # Estilos CSS
├── editar_perfil_aluno.js            # Funcionalidades JavaScript
├── imagens/                          # Logos e imagens
│   └── logoGov.png                   # Logo do Governo de SP
└── README.md                         # Esta documentação
```

## 🚀 Como Usar

### Navegação
1. **Acesso**: Através do botão "Editar Perfil" na tela home do aluno
2. **Voltar**: Botão "Voltar ao Dashboard" retorna à tela home do aluno

### Edição de Dados
1. **Preencher campos**: Nome e email são obrigatórios
2. **Alterar senha**: Preencher senha atual e nova senha
3. **Salvar**: Clique em "Salvar Alterações"
4. **Cancelar**: Descartar alterações e voltar

### Validações
- Campos obrigatórios são destacados em vermelho
- Mensagens de erro aparecem abaixo dos campos
- Validação em tempo real durante a digitação

## 🔗 Integração

### Links de Navegação
- **Home Aluno**: `../TelasAluno/2025_maua_pii_t3_sub2_controle_treinamentos_metro_sp-tela-aluno-home/TelaAlunoHome/aluno_home.html`
- **Login**: `../2025_maua_pii_t3_sub2_controle_treinamentos_metro_sp-tela_login/tela_login.html`

### Dependências
- **CSS Base**: `../styles/base.css`
- **Notificações**: `../styles/notifications.js`
- **Font Awesome**: CDN para ícones
- **VLibras**: CDN para acessibilidade

## 🎯 Melhorias Futuras

### Funcionalidades Planejadas
- [ ] Upload de foto de perfil
- [ ] Histórico de alterações
- [ ] Notificações por email
- [ ] Integração com API real
- [ ] Backup automático de dados

### Otimizações
- [ ] Lazy loading de imagens
- [ ] Compressão de assets
- [ ] Cache de dados do usuário
- [ ] Modo offline básico

## 🐛 Solução de Problemas

### Problemas Comuns
1. **Campos não salvam**: Verificar se todos os campos obrigatórios estão preenchidos
2. **Erro de validação**: Verificar formato do email e telefone
3. **Senha não altera**: Confirmar que a senha atual está correta
4. **Navegação não funciona**: Verificar se os links estão corretos

### Debug
- Abrir console do navegador (F12)
- Verificar erros JavaScript
- Validar dados no localStorage
- Testar em diferentes navegadores

## 📞 Suporte

Para dúvidas ou problemas:
- **Email**: suporte@metro.sp.gov.br
- **Telefone**: (11) 99999-9999
- **Horário**: 8h às 18h

---

**Desenvolvido para o Sistema de Treinamentos do Metrô SP**  
*Versão 1.0 - Janeiro 2025*



