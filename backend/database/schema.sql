-- ============================================
-- SCHEMA DO BANCO DE DADOS - SISTEMA JUNTOS
-- Banco: SQLite
-- ============================================

-- Tabela: users (Usuários: alunos, instrutores, admin)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    rgMetro TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    telefone TEXT,
    cargo TEXT NOT NULL,
    setor TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'aluno',
    matricula TEXT UNIQUE,
    dataAdmissao DATETIME,
    fotoPerfil TEXT,
    ativo INTEGER DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para users
CREATE INDEX IF NOT EXISTS idx_users_rgMetro ON users(rgMetro);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tipo ON users(tipo);

-- Tabela: trainings (Treinamentos)
CREATE TABLE IF NOT EXISTS trainings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descricao TEXT,
    categoria TEXT NOT NULL,
    instrutor TEXT NOT NULL,
    duracao_horas INTEGER NOT NULL,
    vagas_total INTEGER NOT NULL,
    vagas_ocupadas INTEGER DEFAULT 0,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    horario_inicio TIME,
    horario_fim TIME,
    local TEXT NOT NULL,
    status TEXT DEFAULT 'planejado',
    objetivos TEXT,
    conteudo TEXT,
    requisitos TEXT,
    certificado INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para trainings
CREATE INDEX IF NOT EXISTS idx_trainings_categoria ON trainings(categoria);
CREATE INDEX IF NOT EXISTS idx_trainings_status ON trainings(status);

-- Tabela: user_trainings (Relação usuário-treinamento)
CREATE TABLE IF NOT EXISTS user_trainings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    training_id INTEGER NOT NULL,
    dataInscricao DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'inscrito',
    progresso INTEGER DEFAULT 0,
    dataEntrada DATETIME,
    ultimaAtividade DATETIME,
    aulasCompletadas INTEGER DEFAULT 0,
    certificadoEmitido INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (training_id) REFERENCES trainings(id) ON DELETE CASCADE,
    UNIQUE(user_id, training_id)
);

-- Índices para user_trainings
CREATE INDEX IF NOT EXISTS idx_user_trainings_user ON user_trainings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trainings_training ON user_trainings(training_id);

-- Tabela: classes (Aulas realizadas)
CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    training_id INTEGER NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    data DATE NOT NULL,
    horario_inicio TIME,
    horario_fim TIME,
    local TEXT,
    instrutor TEXT NOT NULL,
    conteudo TEXT,
    materiais TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (training_id) REFERENCES trainings(id) ON DELETE CASCADE
);

-- Índices para classes
CREATE INDEX IF NOT EXISTS idx_classes_training ON classes(training_id);
CREATE INDEX IF NOT EXISTS idx_classes_data ON classes(data);

-- Tabela: attendances (Presenças)
CREATE TABLE IF NOT EXISTS attendances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    training_id INTEGER NOT NULL,
    presente INTEGER NOT NULL DEFAULT 0,
    assinatura TEXT,
    observacoes TEXT,
    registradoEm DATETIME DEFAULT CURRENT_TIMESTAMP,
    registradoPor INTEGER,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (training_id) REFERENCES trainings(id) ON DELETE CASCADE,
    FOREIGN KEY (registradoPor) REFERENCES users(id),
    UNIQUE(class_id, user_id)
);

-- Índices para attendances
CREATE INDEX IF NOT EXISTS idx_attendances_class ON attendances(class_id);
CREATE INDEX IF NOT EXISTS idx_attendances_user ON attendances(user_id);
CREATE INDEX IF NOT EXISTS idx_attendances_training ON attendances(training_id);

-- Tabela: certificates (Certificados)
CREATE TABLE IF NOT EXISTS certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    training_id INTEGER NOT NULL,
    codigo TEXT UNIQUE NOT NULL,
    dataEmissao DATE NOT NULL,
    validoAte DATE,
    cargaHoraria INTEGER NOT NULL,
    aproveitamento REAL,
    observacoes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (training_id) REFERENCES trainings(id) ON DELETE CASCADE,
    UNIQUE(user_id, training_id)
);

-- Índices para certificates
CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_training ON certificates(training_id);
CREATE INDEX IF NOT EXISTS idx_certificates_codigo ON certificates(codigo);

-- ============================================
-- TRIGGERS PARA ATUALIZAR updatedAt
-- ============================================

-- Trigger para users
CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
AFTER UPDATE ON users
BEGIN
    UPDATE users SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger para trainings
CREATE TRIGGER IF NOT EXISTS update_trainings_timestamp 
AFTER UPDATE ON trainings
BEGIN
    UPDATE trainings SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

