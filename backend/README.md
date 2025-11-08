# 🚇 Sistema de Treinamentos - Metrô SP - Backend

Backend completo com Node.js, Express e MongoDB para o Sistema de Controle de Treinamentos do Metrô de São Paulo.

## 📋 Índice

- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Como Usar](#como-usar)
- [API Endpoints](#api-endpoints)
- [Modelos de Dados](#modelos-de-dados)
- [Autenticação](#autenticação)
- [Scripts Úteis](#scripts-úteis)

## 🛠️ Tecnologias

- **Node.js** v16+
- **Express** v4.18 - Framework web
- **MongoDB** v8.0 - Banco de dados NoSQL
- **Mongoose** v8.0 - ODM para MongoDB
- **JWT** - Autenticação via tokens
- **bcryptjs** - Hash de senhas
- **CORS** - Controle de acesso
- **dotenv** - Variáveis de ambiente

## 📁 Estrutura do Projeto

```
backend/
├── config/
│   └── database.js          # Configuração do MongoDB
├── models/
│   ├── User.js             # Modelo de usuários
│   ├── Training.js         # Modelo de treinamentos
│   ├── Certificate.js      # Modelo de certificados
│   └── Attendance.js       # Modelo de presenças
├── routes/
│   ├── auth.js             # Rotas de autenticação
│   ├── users.js            # Rotas de usuários
│   ├── trainings.js        # Rotas de treinamentos
│   ├── certificates.js     # Rotas de certificados
│   └── attendance.js       # Rotas de presenças
├── middleware/
│   └── auth.js             # Middleware de autenticação
├── scripts/
│   └── seed.js             # Script para popular BD
├── .gitignore
├── env-example.txt         # Exemplo de variáveis de ambiente
├── package.json
├── server.js               # Servidor principal
└── README.md
```

## 🚀 Instalação

### 1. Pré-requisitos

- **Node.js** v16 ou superior
- **MongoDB** instalado localmente ou MongoDB Atlas (cloud)
- **npm** ou **yarn**

### 2. Instalar MongoDB

#### Windows:
```bash
# Baixe e instale: https://www.mongodb.com/try/download/community
# Ou use MongoDB Atlas (recomendado): https://www.mongodb.com/cloud/atlas
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

#### macOS:
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### 3. Clonar e instalar dependências

```bash
cd juntos/backend
npm install
```

## ⚙️ Configuração

### 1. Criar arquivo `.env`

Copie o arquivo `env-example.txt` e renomeie para `.env`:

```bash
# Windows
copy env-example.txt .env

# Linux/Mac
cp env-example.txt .env
```

### 2. Configurar variáveis de ambiente

Edite o arquivo `.env`:

```env
# Configurações do Servidor
PORT=3000
NODE_ENV=development

# MongoDB Local
MONGODB_URI=mongodb://localhost:27017/metro_treinamentos

# OU MongoDB Atlas (Produção)
# MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/metro_treinamentos

# JWT Secret (ALTERE PARA PRODUÇÃO!)
JWT_SECRET=sua_chave_secreta_super_segura_aqui_metro_sp_2024

# Token Expiration
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=*
```

### 3. Popular o banco de dados

Execute o script de seed para criar dados iniciais:

```bash
npm run seed
```

Isso criará:
- 1 usuário admin
- 1 instrutor
- 5 alunos de exemplo
- 4 treinamentos de exemplo

## 🎯 Como Usar

### Iniciar o servidor

#### Modo de Desenvolvimento (com auto-reload):
```bash
npm run dev
```

#### Modo de Produção:
```bash
npm start
```

O servidor estará disponível em: `http://localhost:3000`

### Testar a API

Acesse: `http://localhost:3000`

Você verá uma resposta JSON com as informações da API.

## 📡 API Endpoints

### 🔐 Autenticação (`/api/auth`)

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| POST | `/api/auth/register` | Registrar novo usuário | Não |
| POST | `/api/auth/login` | Login de usuário | Não |
| GET | `/api/auth/me` | Obter usuário atual | Sim |
| PUT | `/api/auth/update-password` | Atualizar senha | Sim |

#### Exemplo de Login:
```json
POST /api/auth/login
{
  "email": "instrutor@metro.sp.gov.br",
  "senha": "metro123"
}
```

#### Resposta:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "nome": "Carlos Silva Instrutor",
    "email": "instrutor@metro.sp.gov.br",
    "tipo": "instrutor"
  }
}
```

### 👥 Usuários (`/api/users`)

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/api/users` | Listar todos usuários | Instrutor/Admin |
| GET | `/api/users/alunos` | Listar alunos | Instrutor/Admin |
| GET | `/api/users/:id` | Obter usuário por ID | Todos |
| PUT | `/api/users/:id` | Atualizar usuário | Próprio/Admin |
| DELETE | `/api/users/:id` | Desativar usuário | Admin |
| GET | `/api/users/stats/dashboard` | Estatísticas | Instrutor/Admin |

### 📚 Treinamentos (`/api/trainings`)

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/api/trainings` | Listar treinamentos | Todos |
| GET | `/api/trainings/disponiveis` | Treinamentos disponíveis | Aluno |
| GET | `/api/trainings/meus` | Meus treinamentos | Aluno |
| GET | `/api/trainings/:id` | Obter treinamento | Todos |
| POST | `/api/trainings` | Criar treinamento | Instrutor/Admin |
| PUT | `/api/trainings/:id` | Atualizar treinamento | Instrutor/Admin |
| DELETE | `/api/trainings/:id` | Deletar treinamento | Instrutor/Admin |
| POST | `/api/trainings/:id/inscrever` | Inscrever-se | Aluno |
| POST | `/api/trainings/:id/cancelar-inscricao` | Cancelar inscrição | Aluno |
| GET | `/api/trainings/stats/dashboard` | Estatísticas | Instrutor/Admin |

### ✅ Presenças (`/api/attendance`)

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/api/attendance` | Listar presenças | Instrutor/Admin |
| GET | `/api/attendance/treinamento/:id` | Presenças do treinamento | Todos |
| GET | `/api/attendance/aluno/:id` | Presenças do aluno | Todos |
| POST | `/api/attendance` | Registrar presença | Instrutor/Admin |
| PUT | `/api/attendance/:id` | Atualizar presença | Instrutor/Admin |
| DELETE | `/api/attendance/:id` | Deletar presença | Admin |
| GET | `/api/attendance/relatorio/:trainingId` | Relatório de presença | Instrutor/Admin |

### 🎓 Certificados (`/api/certificates`)

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/api/certificates` | Listar certificados | Instrutor/Admin |
| GET | `/api/certificates/meus` | Meus certificados | Aluno |
| GET | `/api/certificates/:id` | Obter certificado | Próprio/Admin |
| GET | `/api/certificates/validar/:numero` | Validar certificado | Público |
| POST | `/api/certificates` | Emitir certificado | Instrutor/Admin |
| PUT | `/api/certificates/:id` | Atualizar certificado | Instrutor/Admin |
| DELETE | `/api/certificates/:id` | Invalidar certificado | Admin |
| GET | `/api/certificates/stats/dashboard` | Estatísticas | Instrutor/Admin |

## 📊 Modelos de Dados

### User (Usuário)
```javascript
{
  nome: String,
  rgMetro: String (7 dígitos, único),
  email: String (único),
  senha: String (hash),
  telefone: String,
  cargo: String (enum),
  setor: String (enum),
  tipo: String (aluno/instrutor/admin),
  matricula: String (auto-gerado),
  dataAdmissao: Date,
  fotoPerfil: String,
  ativo: Boolean,
  treinamentos: [{ treinamentoId, status, progresso }]
}
```

### Training (Treinamento)
```javascript
{
  titulo: String,
  descricao: String,
  categoria: String (enum),
  instrutor: ObjectId (ref: User),
  instrutorNome: String,
  cargaHoraria: Number,
  dataInicio: Date,
  dataFim: Date,
  horario: String,
  local: String,
  vagasTotal: Number,
  vagasDisponiveis: Number,
  status: String (enum),
  modalidade: String (enum),
  nivel: String (enum),
  requisitos: String,
  alunos: [{ alunoId, nome, status, nota, frequencia }],
  presencas: [{ data, alunosPresentes }]
}
```

### Certificate (Certificado)
```javascript
{
  numeroRegistro: String (auto-gerado, único),
  aluno: ObjectId (ref: User),
  alunoNome: String,
  alunoRgMetro: String,
  treinamento: ObjectId (ref: Training),
  treinamentoTitulo: String,
  instrutor: ObjectId (ref: User),
  instrutorNome: String,
  cargaHoraria: Number,
  dataInicio: Date,
  dataConclusao: Date,
  dataEmissao: Date,
  nota: Number (0-10),
  frequencia: Number (0-100),
  status: String (Aprovado/Reprovado),
  validado: Boolean
}
```

### Attendance (Presença)
```javascript
{
  treinamento: ObjectId (ref: Training),
  treinamentoTitulo: String,
  data: Date,
  instrutor: ObjectId (ref: User),
  instrutorNome: String,
  presencas: [{
    aluno: ObjectId,
    alunoNome: String,
    alunoRgMetro: String,
    presente: Boolean,
    horarioEntrada: String,
    horarioSaida: String,
    assinatura: String (base64)
  }],
  totalPresentes: Number,
  totalAusentes: Number,
  percentualPresenca: Number
}
```

## 🔒 Autenticação

### Como usar o JWT Token

1. Faça login e receba o token
2. Inclua o token em todas as requisições protegidas:

```javascript
headers: {
  'Authorization': 'Bearer SEU_TOKEN_AQUI'
}
```

### Exemplo com Fetch:
```javascript
const response = await fetch('http://localhost:3000/api/trainings', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## 🔧 Scripts Úteis

```bash
# Iniciar servidor em modo desenvolvimento
npm run dev

# Iniciar servidor em modo produção
npm start

# Popular banco de dados com dados de exemplo
npm run seed

# Verificar versão do Node
node --version

# Verificar se MongoDB está rodando
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl status mongodb
```

## 📝 Credenciais de Teste

Após executar `npm run seed`, use estas credenciais:

### Admin
- **Email:** admin@metro.sp.gov.br
- **Senha:** admin123

### Instrutor
- **Email:** instrutor@metro.sp.gov.br
- **Senha:** metro123

### Aluno (exemplo)
- **Email:** joao.santos@metro.sp.gov.br
- **Senha:** aluno123

## 🐛 Troubleshooting

### Erro: "Cannot connect to MongoDB"
```bash
# Verifique se o MongoDB está rodando
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongodb
```

### Erro: "Port 3000 already in use"
```bash
# Altere a porta no arquivo .env
PORT=3001
```

### Erro: "JWT Secret not defined"
```bash
# Verifique se o arquivo .env existe e tem a variável JWT_SECRET
```

## 🌐 Deploy em Produção

### Usando MongoDB Atlas:

1. Crie uma conta gratuita em: https://www.mongodb.com/cloud/atlas
2. Crie um cluster
3. Obtenha a string de conexão
4. Atualize o `.env`:
```env
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/metro_treinamentos
NODE_ENV=production
JWT_SECRET=chave_super_segura_aqui
```

### Deploy no Heroku/Railway/Render:

1. Configure as variáveis de ambiente
2. Execute:
```bash
git push heroku main
```

## 📚 Documentação Adicional

- [Express.js](https://expressjs.com/)
- [MongoDB](https://docs.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)
- [JWT](https://jwt.io/)

## 🤝 Contribuindo

Este é um projeto acadêmico do Instituto Mauá de Tecnologia.

## 📄 Licença

ISC - Instituto Mauá de Tecnologia

---

**Desenvolvido para o Sistema de Controle de Treinamentos - Metrô SP** 🚇










