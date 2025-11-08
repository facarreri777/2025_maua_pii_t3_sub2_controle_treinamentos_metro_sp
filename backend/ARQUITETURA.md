# 🏗️ ARQUITETURA DO SISTEMA

## 📊 Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  (HTML + CSS + JavaScript - Já existente no projeto)        │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Login   │  │  Home    │  │Treinamen │  │Certifica │   │
│  │          │  │          │  │   tos    │  │   dos    │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │             │             │             │           │
└───────┼─────────────┼─────────────┼─────────────┼───────────┘
        │             │             │             │
        │   HTTP Requests (fetch/axios)          │
        │   Authorization: Bearer TOKEN          │
        ▼             ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND API                              │
│              (Node.js + Express + MongoDB)                   │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   ROTAS (Routes)                       │  │
│  │                                                        │  │
│  │  /api/auth        /api/users      /api/trainings     │  │
│  │  • login          • CRUD users    • CRUD trainings    │  │
│  │  • register       • stats         • inscrições        │  │
│  │  • me             • busca         • stats             │  │
│  │                                                        │  │
│  │  /api/attendance          /api/certificates           │  │
│  │  • registrar presença     • emitir certificado       │  │
│  │  • relatórios             • validar                  │  │
│  └────────────────────┬───────────────────────────────────┘  │
│                       │                                       │
│  ┌────────────────────▼───────────────────────────────────┐  │
│  │              MIDDLEWARE (auth.js)                      │  │
│  │  • Verificar JWT Token                                │  │
│  │  • Validar permissões                                 │  │
│  │  • Autorizar acesso por tipo de usuário              │  │
│  └────────────────────┬───────────────────────────────────┘  │
│                       │                                       │
│  ┌────────────────────▼───────────────────────────────────┐  │
│  │              CONTROLLERS (Lógica)                      │  │
│  │  • Validação de dados                                 │  │
│  │  • Regras de negócio                                  │  │
│  │  • Tratamento de erros                                │  │
│  └────────────────────┬───────────────────────────────────┘  │
│                       │                                       │
│  ┌────────────────────▼───────────────────────────────────┐  │
│  │           MODELS (Mongoose Schemas)                    │  │
│  │                                                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │  │
│  │  │  User    │  │ Training │  │Certific. │           │  │
│  │  └──────────┘  └──────────┘  └──────────┘           │  │
│  │  ┌──────────┐                                        │  │
│  │  │Attendance│                                        │  │
│  │  └──────────┘                                        │  │
│  └────────────────────┬───────────────────────────────────┘  │
│                       │                                       │
└───────────────────────┼───────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    MONGODB DATABASE                          │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Collection  │  │  Collection  │  │  Collection  │     │
│  │    users     │  │  trainings   │  │ certificates │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐                                          │
│  │  Collection  │                                          │
│  │ attendances  │                                          │
│  └──────────────┘                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo de Dados Completo

### 📝 Exemplo: Login de Usuário

```
1. FRONTEND (tela_login.js)
   └─► Seleciona tipo de usuário (Aluno ou Instrutor)
       ├─ Instrutor: fetch({ email, senha, tipoLogin: 'instrutor' })
       └─ Aluno: fetch({ rgMetro, senha, tipoLogin: 'aluno' })

2. BACKEND (routes/auth.js)
   └─► Recebe requisição
       ├─ Se tipoLogin='instrutor': User.findOne({ email })
       └─ Se tipoLogin='aluno': User.findOne({ rgMetro })
           └─► Compara senha (bcrypt.compare)
               └─► Gera JWT Token (jwt.sign)
                   └─► Retorna: { token, user }

3. FRONTEND
   └─► Recebe resposta
       └─► Salva token: localStorage.setItem('token', token)
           └─► Redireciona para dashboard
               └─► Aluno: TelaHomeAluno
               └─► Instrutor/Admin: TelaHome
```

### 📚 Exemplo: Inscrição em Treinamento

```
1. FRONTEND (treinamentos.js)
   └─► fetch('http://localhost:3000/api/trainings/123/inscrever', {
         headers: { 'Authorization': 'Bearer TOKEN' }
       })

2. MIDDLEWARE (auth.js)
   └─► Verifica token
       └─► Decodifica e valida
           └─► Adiciona req.user com dados do usuário

3. ROUTES (trainings.js)
   └─► Busca treinamento (Training.findById)
       └─► Verifica vagas disponíveis
           └─► Verifica se já está inscrito
               └─► Adiciona aluno ao treinamento
                   └─► Decrementa vagas
                       └─► Atualiza lista de treinamentos do usuário
                           └─► Retorna sucesso

4. FRONTEND
   └─► Recebe confirmação
       └─► Atualiza interface
```

---

## 🗂️ Estrutura de Arquivos Detalhada

```
juntos/backend/
│
├── 📁 config/
│   └── database.js          # Conexão com MongoDB
│
├── 📁 middleware/
│   └── auth.js              # Autenticação e autorização
│
├── 📁 models/               # Schemas do MongoDB
│   ├── User.js              # 👤 Modelo de usuário
│   ├── Training.js          # 📚 Modelo de treinamento
│   ├── Certificate.js       # 🎓 Modelo de certificado
│   └── Attendance.js        # ✅ Modelo de presença
│
├── 📁 routes/               # Endpoints da API
│   ├── auth.js              # 🔐 Autenticação
│   ├── users.js             # 👥 Usuários
│   ├── trainings.js         # 📚 Treinamentos
│   ├── certificates.js      # 🎓 Certificados
│   └── attendance.js        # ✅ Presenças
│
├── 📁 scripts/
│   └── seed.js              # 🌱 Popular banco de dados
│
├── 📄 server.js             # 🚀 Servidor principal
├── 📄 package.json          # 📦 Dependências
├── 📄 .gitignore
├── 📄 env-example.txt       # ⚙️ Exemplo de configuração
│
└── 📚 DOCUMENTAÇÃO
    ├── README.md            # Documentação principal
    ├── QUICK_START.md       # Início rápido
    ├── IMPLEMENTACAO_COMPLETA.md  # Detalhes técnicos
    └── ARQUITETURA.md       # Este arquivo
```

---

## 🔐 Sistema de Autenticação

### 🎯 Fluxo de Cadastro e Login

**IMPORTANTE**: 
- **Instrutor**: Login com **Email/Usuário + Senha**
- **Aluno**: Login com **RG Metro + Senha**

#### 1️⃣ Cadastro de Aluno (pelo Instrutor)

```
┌─────────────────────────────────────────────────────────┐
│ INSTRUTOR cadastra COLABORADOR (que se torna ALUNO)    │
└─────────────────────────────────────────────────────────┘

1. Instrutor acessa: TelaCadastroColaboradores
2. Preenche dados do colaborador:
   ├─ Nome completo
   ├─ RG Metro (7 dígitos) ⭐ USADO NO LOGIN
   ├─ Email
   ├─ Senha inicial ⭐ ESCOLHIDA PELO COLABORADOR
   ├─ Telefone
   ├─ Cargo
   └─ Setor

3. Sistema cria usuário tipo "aluno" no banco de dados
4. Colaborador agora pode fazer login como ALUNO
```

#### 2️⃣ Login do Aluno

```
┌─────────────────────────────────────────────────────────┐
│ ALUNO faz login com RG Metro + Senha                    │
└─────────────────────────────────────────────────────────┘

1. Aluno acessa: TelaLogin
2. Seleciona tipo "Aluno"
3. Digita:
   ├─ RG Metro (7 dígitos)
   └─ Senha (escolhida no cadastro)

4. Sistema valida no banco de dados
5. Se válido: redireciona para TelaHomeAluno
6. Se inválido: mostra erro
```

#### 3️⃣ Credenciais de Teste

```
👨‍🏫 INSTRUTOR (padrão do sistema - login com email)
   Email/Usuário: instrutor
   Senha: metro123

🎓 ALUNO (deve ser cadastrado pelo instrutor - login com RG Metro)
   RG Metro: (definido no cadastro)
   Senha: (definida no cadastro)
```

### Fluxo JWT

```
┌─────────────┐
│   Cliente   │
│  (Frontend) │
└──────┬──────┘
       │ 1. POST /api/auth/login
       │    Instrutor: { email, senha }
       │    Aluno: { rgMetro, senha }
       ▼
┌─────────────────────────┐
│   Servidor (Backend)    │
│                         │
│ 2. Valida credenciais   │
│    ├─ Busca no MongoDB  │
│    └─ Compara senha     │
│                         │
│ 3. Gera JWT Token       │
│    jwt.sign({id}, KEY)  │
└──────┬──────────────────┘
       │ 4. Retorna
       │    { token, user }
       ▼
┌─────────────┐
│   Cliente   │
│             │
│ 5. Salva    │
│    localStorage        │
│    .setItem('token')   │
└──────┬──────┘
       │
       │ Próximas requisições:
       │ Header: Authorization: Bearer TOKEN
       ▼
┌─────────────────────────┐
│   Middleware (auth.js)  │
│                         │
│ 6. Extrai token         │
│ 7. Verifica JWT         │
│ 8. Decodifica           │
│ 9. Busca usuário        │
│ 10. req.user = user     │
└──────┬──────────────────┘
       │
       ▼
┌─────────────┐
│   Handler   │
│ (Controller)│
│             │
│ Acesso ao   │
│ req.user    │
└─────────────┘
```

---

## 💾 Modelo de Dados (ER Diagram)

```
┌─────────────────────────┐
│         USER            │
│─────────────────────────│
│ _id: ObjectId          │
│ nome: String           │
│ rgMetro: String (UK)   │
│ email: String (UK)     │
│ senha: String (hash)   │
│ tipo: String (enum)    │◄────┐
│ cargo: String          │     │
│ setor: String          │     │
│ treinamentos: [{       │     │ 1:N
│   treinamentoId,       │     │
│   status               │     │
│ }]                     │     │
└─────────────────────────┘     │
                                │
        ┌───────────────────────┤
        │                       │
        │ N:1              N:1  │
        ▼                       │
┌─────────────────────────┐     │
│       TRAINING          │     │
│─────────────────────────│     │
│ _id: ObjectId          │     │
│ titulo: String         │     │
│ instrutor: ObjectId    │─────┘
│ cargaHoraria: Number   │
│ dataInicio: Date       │
│ dataFim: Date          │
│ vagasTotal: Number     │
│ status: String         │
│ alunos: [{             │
│   alunoId: ObjectId    │─────┐
│   status,              │     │
│   nota,                │     │
│   frequencia           │     │
│ }]                     │     │
└────┬────────────────────┘     │
     │ 1:N                     │ N:1
     │                          │
     ▼                          ▼
┌─────────────────────────┐ ┌──────────────────────┐
│     ATTENDANCE          │ │    CERTIFICATE       │
│─────────────────────────│ │──────────────────────│
│ _id: ObjectId          │ │ _id: ObjectId        │
│ treinamento: ObjectId  │ │ numeroRegistro (UK)  │
│ data: Date             │ │ aluno: ObjectId      │─┐
│ presencas: [{          │ │ treinamento: ObjectId│◄┘
│   aluno: ObjectId,     │ │ nota: Number         │
│   presente: Boolean,   │ │ frequencia: Number   │
│   assinatura           │ │ status: String       │
│ }]                     │ │ validado: Boolean    │
└─────────────────────────┘ └──────────────────────┘

Legenda:
  UK = Unique Key (índice único)
  1:N = Relação Um para Muitos
  N:1 = Relação Muitos para Um
```

---

## 🎯 Níveis de Permissão

```
┌──────────────────────────────────────────────────────┐
│                    ADMIN                             │
│  ✅ Todas as permissões                              │
│  ✅ Gerenciar usuários (criar, editar, deletar)     │
│  ✅ Ver estatísticas globais                         │
│  ✅ Invalidar certificados                           │
└──────────────────────────────────────────────────────┘
                        ▲
                        │ Herda de
                        │
┌──────────────────────────────────────────────────────┐
│                   INSTRUTOR                          │
│  ✅ Criar e gerenciar treinamentos                   │
│  ✅ Ver lista de alunos                              │
│  ✅ Registrar presença                               │
│  ✅ Emitir certificados                              │
│  ✅ Ver estatísticas de treinamentos                 │
└──────────────────────────────────────────────────────┘
                        ▲
                        │ Herda permissões básicas
                        │
┌──────────────────────────────────────────────────────┐
│                     ALUNO                            │
│  ✅ Ver treinamentos disponíveis                     │
│  ✅ Inscrever-se em treinamentos                     │
│  ✅ Ver próprios treinamentos                        │
│  ✅ Ver próprios certificados                        │
│  ✅ Editar próprio perfil (limitado)                 │
│  ✅ Ver própria frequência                           │
└──────────────────────────────────────────────────────┘
```

---

## 🛡️ Segurança Implementada

### ✅ Camadas de Segurança

1. **Autenticação JWT**
   - Token criptografado
   - Expiração configurável
   - Validação em cada requisição

2. **Hash de Senhas**
   - bcrypt com 10 rounds
   - Salt único por senha
   - Nunca armazena senha em texto puro

3. **Controle de Acesso**
   - Middleware de autorização
   - Verificação de tipo de usuário
   - Proteção de rotas sensíveis

4. **Validação de Dados**
   - Mongoose schema validation
   - Express-validator
   - Sanitização de inputs

5. **CORS Configurado**
   - Origins permitidas
   - Credentials controladas

6. **Soft Delete**
   - Usuários não são removidos
   - Apenas desativados
   - Preserva histórico

---

## 📊 Performance e Escalabilidade

### Otimizações Implementadas

```
✅ Índices no MongoDB
   - Índices únicos em email, rgMetro, numeroRegistro
   - Índices compostos para buscas frequentes

✅ Populate Seletivo
   - Carrega apenas campos necessários
   - Evita over-fetching

✅ Queries Otimizadas
   - Uso de aggregation para estatísticas
   - Filtros no banco, não no código

✅ Paginação Ready
   - Estrutura pronta para implementar
   - Suporta limit e skip

✅ Caching Ready
   - Estrutura permite adicionar Redis
   - Estatísticas candidatas a cache
```

---

## 🧪 Testes e Qualidade

### Pronto para Testes

```javascript
// Exemplo de teste com Jest
describe('Auth API', () => {
  test('Login com credenciais válidas', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@metro.sp.gov.br',
        senha: 'test123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
});
```

---

## 🚀 Deploy e DevOps

### Ambientes Suportados

```
┌──────────────────────┐
│   DEVELOPMENT        │
│ - localhost          │
│ - nodemon           │
│ - MongoDB local     │
└──────────────────────┘

┌──────────────────────┐
│   STAGING            │
│ - MongoDB Atlas     │
│ - Cloud hosting     │
│ - ENV variables     │
└──────────────────────┘

┌──────────────────────┐
│   PRODUCTION         │
│ - MongoDB Atlas     │
│ - Heroku/Railway    │
│ - SSL/HTTPS         │
│ - Monitoring        │
└──────────────────────┘
```

---

## 📈 Monitoramento

### Logs Implementados

```javascript
✅ Conexão MongoDB
✅ Requisições HTTP (em dev)
✅ Erros não capturados
✅ Status do servidor
✅ Health checks
```

---

**🏗️ Arquitetura Profissional, Escalável e Segura!**


