require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const winston = require('winston');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'segredo_super_seguro_ressonance';

// ==========================================
// 1. OBSERVABILIDADE (Logs com Winston)
// ==========================================
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        })
    ),
    transports: [
        new winston.transports.File({ filename: 'app.log' }),
        new winston.transports.Console()
    ]
});

// ==========================================
// 2. CONFIGURAÇÃO DA BASE DE DADOS
// ==========================================
const dbPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ressonance_data',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ==========================================
// 3. ESQUEMAS DE VALIDAÇÃO (Zod)
// ==========================================
const esquemaRegisto = z.object({
    nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
    email: z.string().email("Formato de e-mail inválido."),
    senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
    perfil: z.enum(['admin', 'usuario']).optional()
});

const esquemaAlbum = z.object({
    titulo: z.string().min(1, "O título é obrigatório."),
    artista: z.string().min(1, "O artista é obrigatório."),
    ano: z.number().int().min(1900, "Ano inválido.").max(new Date().getFullYear(), "O ano não pode estar no futuro."),
    genero: z.string().min(1, "O género é obrigatório."),
    capa: z.string().url("A capa deve ser um URL válido.").optional().or(z.literal(''))
});

const esquemaResenha = z.object({
    album_id: z.number().int("O ID do álbum deve ser um número inteiro."),
    nota: z.number().min(0).max(5, "A nota deve ser entre 0 e 5."),
    resenha: z.string().min(1, "O texto da resenha é obrigatório.")
});

const esquemaPerfil = z.object({
    nome: z.string().min(1, "O nome não pode ficar vazio."),
    generos: z.array(z.string()).max(3, "Você pode escolher no máximo 3 gêneros.")
});

// ==========================================
// 4. MIDDLEWARES DE SEGURANÇA
// ==========================================
async function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        logger.warn('Falha de autenticação: Tentativa de acesso sem token.');
        return res.status(401).json({ erro: 'Acesso não autorizado. Token em falta.' });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (erro) {
        logger.warn('Falha de autenticação: Token inválido ou expirado.');
        return res.status(403).json({ erro: 'Token inválido ou expirado.' });
    }
}

function verificarPerfilAdmin(req, res, next) {
    if (req.user.perfil !== 'admin') {
        logger.warn(`Acesso negado: Utilizador ID ${req.user.id} tentou aceder a rota de administrador.`);
        return res.status(403).json({ erro: 'Acesso proibido. Requer privilégios de administrador.' });
    }
    next();
}

// ==========================================
// 5. ROTAS DE AUTENTICAÇÃO E UTILIZADORES
// ==========================================
app.post('/api/auth/registar', async (req, res) => {
    try {
        const dadosValidados = esquemaRegisto.parse(req.body);

        const [usuariosExistentes] = await dbPool.query('SELECT id FROM usuarios WHERE email = ?', [dadosValidados.email]);
        if (usuariosExistentes.length > 0) {
            return res.status(400).json({ erro: 'Este email já está registado.' });
        }

        const senha_hash = await bcrypt.hash(dadosValidados.senha, 10);
        const perfilAtribuido = dadosValidados.perfil || 'usuario';

        const [resultado] = await dbPool.query(
            'INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES (?, ?, ?, ?)',
            [dadosValidados.nome, dadosValidados.email, senha_hash, perfilAtribuido]
        );

        logger.info(`Criação de entidade: Novo utilizador registado (ID: ${resultado.insertId}, Email: ${dadosValidados.email})`);
        res.status(201).json({ mensagem: 'Utilizador registado com sucesso!', id: resultado.insertId });

    } catch (erro) {
        if (erro instanceof z.ZodError) {
            return res.status(400).json({ erro: 'Erro de validação.', detalhes: erro.errors });
        }
        logger.error(`Erro interno ao registar utilizador: ${erro.message}`);
        res.status(500).json({ erro: 'Erro interno ao registar utilizador.' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, senha } = req.body;

    try {
        const [resultados] = await dbPool.query('SELECT * FROM usuarios WHERE email = ?', [email]);

        if (resultados.length === 0) {
            logger.warn(`Falha de autenticação: Email não encontrado (${email})`);
            return res.status(401).json({ erro: 'Email ou senha inválidos.' });
        }

        const usuario = resultados[0];
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
        
        if (!senhaCorreta) {
            logger.warn(`Falha de autenticação: Senha incorreta para o email (${email})`);
            return res.status(401).json({ erro: 'Email ou senha inválidos.' });
        }

        const token = jwt.sign(
            { id: usuario.id, email: usuario.email, perfil: usuario.perfil },
            JWT_SECRET,
            { expiresIn: '2h' }
        );

        logger.info(`Login bem-sucedido: Utilizador ID ${usuario.id} (${usuario.email})`);
        res.status(200).json({
            mensagem: 'Login efetuado com sucesso!',
            token,
            utilizador: { id: usuario.id, nome: usuario.nome, perfil: usuario.perfil }
        });
    } catch (erro) {
        logger.error(`Erro interno no login: ${erro.message}`);
        res.status(500).json({ erro: 'Erro interno no servidor.' });
    }
});

// ==========================================
// 6. ROTAS CRUD DE ÁLBUNS
// ==========================================
app.get('/api/albuns', async (req, res) => {
    try {
        const [resultados] = await dbPool.query('SELECT * FROM albuns');
        res.status(200).json(resultados);
    } catch (erro) {
        logger.error(`Erro interno ao procurar álbuns: ${erro.message}`);
        res.status(500).json({ erro: 'Erro interno ao procurar os álbuns.' });
    }
});

app.post('/api/albuns', verificarToken, verificarPerfilAdmin, async (req, res) => {
    try {
        const dadosValidados = esquemaAlbum.parse(req.body);

        const query = 'INSERT INTO albuns (titulo, artista, ano, genero, capa) VALUES (?, ?, ?, ?, ?)';
        const valores = [dadosValidados.titulo, dadosValidados.artista, dadosValidados.ano, dadosValidados.genero, dadosValidados.capa || null];

        const [resultado] = await dbPool.query(query, valores);
        
        logger.info(`Criação de entidade: Álbum "${dadosValidados.titulo}" adicionado pelo admin ID ${req.user.id}`);
        res.status(201).json({
            mensagem: 'Álbum criado com sucesso!',
            id: resultado.insertId
        });
    } catch (erro) {
        if (erro instanceof z.ZodError) {
            return res.status(400).json({ erro: 'Erro de validação.', detalhes: erro.errors });
        }
        logger.error(`Erro interno ao salvar álbum: ${erro.message}`);
        res.status(500).json({ erro: 'Erro interno ao salvar o álbum.' });
    }
});

app.delete('/api/albuns/:id', verificarToken, verificarPerfilAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        const query = 'DELETE FROM albuns WHERE id = ?';
        const [resultado] = await dbPool.query(query, [id]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ erro: 'Álbum não encontrado.' });
        }

        logger.info(`Entidade removida: Álbum ID ${id} excluído pelo admin ID ${req.user.id}`);
        res.status(200).json({ mensagem: 'Álbum excluído com sucesso!' });
    } catch (erro) {
        logger.error(`Erro interno ao excluir álbum ID ${id}: ${erro.message}`);
        res.status(500).json({ erro: 'Erro interno ao excluir o álbum.' });
    }
});

// ==========================================
// 7. ROTAS DE FAIXAS
// ==========================================
app.get('/api/albuns/:id/faixas', async (req, res) => {
    try {
        const [faixas] = await dbPool.query(
            'SELECT numero_faixa, titulo FROM faixas WHERE album_id = ? ORDER BY numero_faixa ASC',
            [req.params.id]
        );
        res.status(200).json(faixas);
    } catch (erro) {
        logger.error(`Erro ao buscar faixas do álbum ID ${req.params.id}: ${erro.message}`);
        res.status(500).json({ erro: 'Erro interno ao buscar as faixas.' });
    }
});

// ==========================================
// 8. ROTAS CRUD DE RESENHAS
// ==========================================

app.get('/api/albuns/:id/resenhas', async (req, res) => {
    try {
        const query = `
            SELECT r.id, r.nota, r.texto AS resenha, r.data_publicacao, u.nome AS autor 
            FROM resenhas r 
            JOIN utilizadores u ON r.utilizador_id = u.id 
            WHERE r.album_id = ? 
            ORDER BY r.data_publicacao DESC
        `;
        const [resenhas] = await dbPool.query(query, [req.params.id]);
        res.status(200).json(resenhas);
    } catch (erro) {
        logger.error(`Erro ao buscar resenhas do álbum ID ${req.params.id}: ${erro.message}`);
        res.status(500).json({ erro: 'Erro ao buscar resenhas.' });
    }
});

app.get('/api/resenhas/minhas', verificarToken, async (req, res) => {
    try {
        const query = `
            SELECT r.id, r.nota, r.texto AS resenha, a.titulo AS album_titulo, a.capa AS album_capa 
            FROM resenhas r 
            JOIN albuns a ON r.album_id = a.id 
            WHERE r.utilizador_id = ? 
            ORDER BY r.data_publicacao DESC
        `;
        const [minhasResenhas] = await dbPool.query(query, [req.user.id]);
        res.status(200).json(minhasResenhas);
    } catch (erro) {
        logger.error(`Erro ao buscar histórico do utilizador ID ${req.user.id}: ${erro.message}`);
        res.status(500).json({ erro: 'Erro ao buscar seu histórico de resenhas.' });
    }
});

app.post('/api/resenhas', verificarToken, async (req, res) => {
    try {
        const dadosValidados = esquemaResenha.parse(req.body);
        
        const [albumExiste] = await dbPool.query('SELECT id FROM albuns WHERE id = ?', [dadosValidados.album_id]);
        if (albumExiste.length === 0) return res.status(404).json({ erro: 'Álbum não encontrado.' });

        const [resultado] = await dbPool.query(
            'INSERT INTO resenhas (album_id, utilizador_id, nota, texto) VALUES (?, ?, ?, ?)',
            [dadosValidados.album_id, req.user.id, dadosValidados.nota, dadosValidados.resenha]
        );

        logger.info(`Nova resenha criada (ID: ${resultado.insertId}) pelo utilizador ID ${req.user.id}`);
        res.status(201).json({ mensagem: 'Resenha publicada com sucesso!', id: resultado.insertId });
    } catch (erro) {
        if (erro instanceof z.ZodError) return res.status(400).json({ erro: 'Erro de validação', detalhes: erro.errors });
        logger.error(`Erro ao criar resenha: ${erro.message}`);
        res.status(500).json({ erro: 'Erro interno ao publicar resenha.' });
    }
});

app.delete('/api/resenhas/:id', verificarToken, async (req, res) => {
    try {
        const resenhaId = req.params.id;
        const [resenha] = await dbPool.query('SELECT utilizador_id FROM resenhas WHERE id = ?', [resenhaId]);

        if (resenha.length === 0) return res.status(404).json({ erro: 'Resenha não encontrada.' });

        if (resenha[0].utilizador_id !== req.user.id && req.user.perfil !== 'admin') {
            logger.warn(`Tentativa de exclusão não autorizada: Utilizador ID ${req.user.id} tentou apagar resenha ID ${resenhaId}`);
            return res.status(403).json({ erro: 'Acesso negado. Apenas o autor ou um administrador podem excluir esta resenha.' });
        }

        await dbPool.query('DELETE FROM resenhas WHERE id = ?', [resenhaId]);
        logger.info(`Resenha ID ${resenhaId} excluída pelo utilizador ID ${req.user.id}`);
        res.status(200).json({ mensagem: 'Resenha excluída com sucesso.' });
    } catch (erro) {
        logger.error(`Erro ao excluir resenha ID ${req.params.id}: ${erro.message}`);
        res.status(500).json({ erro: 'Erro ao tentar excluir a resenha.' });
    }
});

// ==========================================
// 9. ROTAS DO PERFIL DE UTILIZADOR
// ==========================================

app.get('/api/usuarios/me', verificarToken, async (req, res) => {
    try {
        const [usuario] = await dbPool.query('SELECT nome, email, perfil FROM utilizadores WHERE id = ?', [req.user.id]);
        if (usuario.length === 0) return res.status(404).json({ erro: 'Utilizador não encontrado.' });

        const [generosDB] = await dbPool.query('SELECT genero FROM utilizadores_generos WHERE utilizador_id = ?', [req.user.id]);
        const generos = generosDB.map(g => g.genero);

        res.status(200).json({ ...usuario[0], generos });
    } catch (erro) {
        logger.error(`Erro ao buscar perfil do utilizador ID ${req.user.id}: ${erro.message}`);
        res.status(500).json({ erro: 'Erro ao buscar perfil.' });
    }
});

app.put('/api/usuarios/me', verificarToken, async (req, res) => {
    const conexao = await dbPool.getConnection();
    try {
        const dadosValidados = esquemaPerfil.parse(req.body);
        
        await conexao.beginTransaction();

        await conexao.query('UPDATE utilizadores SET nome = ? WHERE id = ?', [dadosValidados.nome, req.user.id]);

        await conexao.query('DELETE FROM utilizadores_generos WHERE utilizador_id = ?', [req.user.id]);
        
        if (dadosValidados.generos && dadosValidados.generos.length > 0) {
            const inserts = dadosValidados.generos.map(genero => [req.user.id, genero]);
            await conexao.query('INSERT INTO utilizadores_generos (utilizador_id, genero) VALUES ?', [inserts]);
        }

        await conexao.commit();
        logger.info(`Perfil do utilizador ID ${req.user.id} atualizado com sucesso.`);
        res.status(200).json({ mensagem: 'Perfil atualizado com sucesso!' });
    } catch (erro) {
        await conexao.rollback();
        if (erro instanceof z.ZodError) return res.status(400).json({ erro: 'Erro de validação', detalhes: erro.errors });
        logger.error(`Erro ao atualizar perfil (ID ${req.user.id}): ${erro.message}`);
        res.status(500).json({ erro: 'Erro ao atualizar o perfil.' });
    } finally {
        conexao.release();
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor a correr em http://localhost:${PORT}`);
    logger.info('Servidor iniciado com sucesso.');
});