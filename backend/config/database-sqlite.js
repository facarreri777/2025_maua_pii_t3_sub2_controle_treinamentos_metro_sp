// ============================================
// CONFIGURAÇÃO DO BANCO DE DADOS SQLite
// ============================================

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Caminho para o arquivo do banco de dados (pode ser definido por variável de ambiente DB_PATH)
const DEFAULT_DB_PATH = path.join(__dirname, '..', 'database', 'juntos.db');
const DB_PATH = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : DEFAULT_DB_PATH;
const SCHEMA_PATH = path.join(__dirname, '..', 'database', 'schema.sql');

// Instância única do banco de dados
let db = null;

/**
 * Conecta ao banco de dados SQLite
 */
const conectarBanco = () => {
    return new Promise((resolve, reject) => {
        // Se já existe conexão, retorna ela
        if (db) {
            return resolve(db);
        }

        // Cria diretório se não existir
        const dbDir = path.dirname(DB_PATH);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        // Conecta ao banco
        db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('❌ Erro ao conectar ao banco SQLite:', err.message);
                return reject(err);
            }

            console.log('✅ Conectado ao banco de dados SQLite');
            console.log(`📦 Arquivo do banco: ${DB_PATH}`);
            
            // Habilitar foreign keys
            db.run('PRAGMA foreign_keys = ON', (err) => {
                if (err) {
                    console.error('❌ Erro ao habilitar foreign keys:', err.message);
                }
            });

            resolve(db);
        });
    });
};

/**
 * Inicializa o banco de dados com o schema
 */
const inicializarBanco = async () => {
    try {
        const database = await conectarBanco();

        // Lê o arquivo schema.sql
        if (fs.existsSync(SCHEMA_PATH)) {
            console.log('📄 Lendo schema.sql...');
            const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');

            // Usa o schema completo de schema.sql
            return new Promise((resolve, reject) => {
                db.exec(schema, (err) => {
                    if (err) {
                        // Log mas não bloqueia se tabela já existe
                        if (!err.message.includes('already exists')) {
                            console.error('⚠️ Aviso ao aplicar schema (normal se tabelas já existem):', err.message);
                        }
                    }
                    console.log('✅ Schema aplicado');
                    
                    // Aplica migrações adicionais se necessário
                    aplicarMigracoes(database).then(() => resolve(database)).catch(reject);
                });
            });
        } else {
            console.warn('⚠️ Arquivo schema.sql não encontrado');
            return database;
        }
    } catch (error) {
        console.error('❌ Erro ao inicializar banco:', error);
        throw error;
    }
};

/**
 * Aplica migrações de schema (adicionar colunas que podem estar faltando)
 */
const aplicarMigracoes = async (database) => {
    try {
        // Verifica se colunas faltam e adiciona
        const checkColumn = (table, column) => {
            return new Promise((resolve, reject) => {
                database.all(`PRAGMA table_info(${table})`, (err, cols) => {
                    if (err) return reject(err);
                    const exists = cols.some(c => c.name === column);
                    resolve(exists);
                });
            });
        };

        // Migração: adicionar hash e evidenciasJson se não existirem
        const temHash = await checkColumn('certificates', 'hash');
        if (!temHash) {
            console.log('🔧 Adicionando coluna hash em certificates...');
            await executarQuery('ALTER TABLE certificates ADD COLUMN hash TEXT');
        }

        const temEvidencias = await checkColumn('certificates', 'evidenciasJson');
        if (!temEvidencias) {
            console.log('🔧 Adicionando coluna evidenciasJson em certificates...');
            await executarQuery('ALTER TABLE certificates ADD COLUMN evidenciasJson TEXT');
        }

        // Migração: adicionar tipo e certificado em trainings se não existirem
        const temTipo = await checkColumn('trainings', 'tipo');
        if (!temTipo) {
            console.log('🔧 Adicionando coluna tipo em trainings...');
            await executarQuery("ALTER TABLE trainings ADD COLUMN tipo TEXT DEFAULT 'interno'");
        }

        const temCertificado = await checkColumn('trainings', 'certificado');
        if (!temCertificado) {
            console.log('🔧 Adicionando coluna certificado em trainings...');
            await executarQuery('ALTER TABLE trainings ADD COLUMN certificado INTEGER DEFAULT 0');
        }

        // Migração: adicionar colunas relacionadas a emissor em certificates
        const temEmissorUserId = await checkColumn('certificates', 'emissor_user_id');
        if (!temEmissorUserId) {
            console.log('🔧 Adicionando colunas de emissor em certificates...');
            await executarQuery('ALTER TABLE certificates ADD COLUMN emissor_user_id INTEGER');
            await executarQuery('ALTER TABLE certificates ADD COLUMN emissor_nome TEXT');
            await executarQuery('ALTER TABLE certificates ADD COLUMN emissor_ip TEXT');
            await executarQuery('ALTER TABLE certificates ADD COLUMN emissor_userAgent TEXT');
        }
    } catch (error) {
        console.error('⚠️ Erro ao aplicar migrações (pode ser normal):', error.message);
    }
};

/**
 * Executa uma query no banco
 */
const executarQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        if (!db) {
            return reject(new Error('Banco de dados não está conectado'));
        }

        db.run(sql, params, function(err) {
            if (err) {
                return reject(err);
            }
            resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
};

/**
 * Busca um único registro
 */
const buscarUm = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        if (!db) {
            return reject(new Error('Banco de dados não está conectado'));
        }

        db.get(sql, params, (err, row) => {
            if (err) {
                return reject(err);
            }
            resolve(row);
        });
    });
};

/**
 * Busca múltiplos registros
 */
const buscarTodos = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        if (!db) {
            return reject(new Error('Banco de dados não está conectado'));
        }

        db.all(sql, params, (err, rows) => {
            if (err) {
                return reject(err);
            }
            resolve(rows || []);
        });
    });
};

/**
 * Fecha a conexão com o banco
 */
const fecharBanco = () => {
    return new Promise((resolve, reject) => {
        if (!db) {
            return resolve();
        }

        db.close((err) => {
            if (err) {
                console.error('❌ Erro ao fechar banco:', err.message);
                return reject(err);
            }
            console.log('✅ Conexão com banco fechada');
            db = null;
            resolve();
        });
    });
};

/**
 * Retorna a instância do banco
 */
const getBanco = () => {
    if (!db) {
        throw new Error('Banco de dados não está conectado. Chame conectarBanco() primeiro.');
    }
    return db;
};

module.exports = {
    conectarBanco,
    inicializarBanco,
    executarQuery,
    buscarUm,
    buscarTodos,
    fecharBanco,
    getBanco
};

