require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod'); // Requisito 5: Validação
const winston = require('winston'); // Requisito 10: Observabilidade

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
        new winston.transports.File({ filename: 'app.log' }), // Guarda os logs num ficheiro
        new winston.transports.Console() // Exibe também no terminal
    ]
});

// ==========================================
// 2. CONFIGURAÇÃO DA BASE DE DADOS
// ==========================================
const dbPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ressonance_db',
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
        // Validação da entrada
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
        // Validação da entrada com Zod
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor a correr em http://localhost:${PORT}`);
    logger.info('Servidor iniciado com sucesso.');
});