const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const schemas = require('./schemas');

class HttpError extends Error {
    constructor(status, message) { super(message); this.status = status; }
}

function createApp({ repo, jwtSecret, logger, nodeEnv = 'production', corsOrigins = [] }) {
    if (!jwtSecret || Buffer.byteLength(jwtSecret, 'utf8') < 32) throw new Error('JWT_SECRET inválido.');
    const app = express();
    app.disable('x-powered-by');
    app.use(cors({ origin(origin, cb) {
        if (!origin || corsOrigins.includes(origin)) return cb(null, true);
        return cb(new HttpError(403, 'Origem não permitida.'));
    } }));
    app.use(express.json({ limit: '50kb' }));

    const validate = (schema, input) => schema.parse(input);
    const routeId = req => validate(schemas.id, req.params.id);
    const fail = (status, message) => { throw new HttpError(status, message); };

    async function authenticate(req, res, next) {
        const match = /^Bearer\s+(\S+)$/i.exec(req.get('authorization') || '');
        if (!match) { logger.warn('Falha de autenticação: ausência de token.'); return next(new HttpError(401, 'Autenticação necessária.')); }
        let payload;
        try {
            payload = jwt.verify(match[1], jwtSecret, { algorithms: ['HS256'], issuer: 'ressonance', audience: 'ressonance-web' });
            if (!payload.sub || !Number.isSafeInteger(Number(payload.sub)) || Number(payload.sub) <= 0) throw new Error('Identidade inválida');
        } catch (_) {
            logger.warn('Falha de autenticação: token inválido ou expirado.');
            return next(new HttpError(401, 'Token inválido, expirado ou revogado.'));
        }
        try {
            const user = await repo.findUserById(Number(payload.sub));
            if (!user || user.token_version !== payload.tokenVersion) {
                logger.warn('Falha de autenticação: token revogado ou utilizador inexistente.');
                return next(new HttpError(401, 'Token inválido, expirado ou revogado.'));
            }
            req.user = user; // perfil sempre lido do banco, nunca confiado ao JWT
            next();
        } catch (err) { next(err); }
    }
    function requireAdmin(req, res, next) {
        if (req.user.perfil !== 'admin') return next(new HttpError(403, 'Acesso restrito a administradores.'));
        next();
    }

    app.post('/api/auth/registar', async (req, res) => {
        const data = validate(schemas.registro, req.body);
        const exists = await repo.findUserByEmail(data.email);
        if (exists) fail(409, 'Este e-mail já está cadastrado.');
        const senhaHash = await bcrypt.hash(data.senha, 12);
        const id = await repo.createUser({ nome: data.nome, email: data.email, senhaHash });
        logger.info(`Criação de entidade: utilizador ID ${id}.`);
        res.status(201).json({ mensagem: 'Usuário registrado com sucesso.', id });
    });

    app.post('/api/auth/login', async (req, res) => {
        const data = validate(schemas.login, req.body);
        const user = await repo.findUserByEmail(data.email);
        const correct = user?.senha
    ? await bcrypt.compare(data.senha, user.senha)
    : false;
        if (!correct) {
            logger.warn('Falha de autenticação: credenciais inválidas.');
            fail(401, 'E-mail ou senha inválidos.');
        }
        const token = jwt.sign({ tokenVersion: user.token_version }, jwtSecret, {
            algorithm: 'HS256', subject: String(user.id), issuer: 'ressonance',
            audience: 'ressonance-web', expiresIn: '2h'
        });
        logger.info(`Login bem-sucedido: utilizador ID ${user.id}.`);
        res.json({ mensagem: 'Login efetuado com sucesso.', token, utilizador: { id: user.id, nome: user.nome, perfil: user.perfil } });
    });

    app.post('/api/auth/logout', authenticate, async (req, res) => {
        const count = await repo.revokeTokens(req.user.id, req.user.token_version);
        if (!count) fail(401, 'Sessão já encerrada.');
        logger.info(`Logout realizado: utilizador ID ${req.user.id}.`);
        res.json({ mensagem: 'Sessão encerrada no servidor.' });
    });

    app.get('/api/albuns', async (req, res) => res.json(await repo.listAlbums()));
    app.get('/api/albuns/:id', async (req, res) => {
        const album = await repo.findAlbum(routeId(req));
        if (!album) fail(404, 'Álbum não encontrado.');
        res.json(album);
    });
    app.post('/api/albuns', authenticate, requireAdmin, async (req, res) => {
        const data = validate(schemas.album, req.body);
        const id = await repo.createAlbum(data);
        logger.info(`Criação de entidade: álbum ID ${id} pelo admin ID ${req.user.id}.`);
        res.status(201).json({ mensagem: 'Álbum criado com sucesso.', id });
    });
    app.put('/api/albuns/:id', authenticate, requireAdmin, async (req, res) => {
        const id = routeId(req);
        const data = validate(schemas.album, req.body);
        if (!await repo.updateAlbum(id, data)) fail(404, 'Álbum não encontrado.');
        logger.info(`Álbum ID ${id} atualizado pelo admin ID ${req.user.id}.`);
        res.json({ mensagem: 'Álbum atualizado com sucesso.' });
    });
    app.delete('/api/albuns/:id', authenticate, requireAdmin, async (req, res) => {
        const id = routeId(req);
        if (!await repo.deleteAlbum(id)) fail(404, 'Álbum não encontrado.');
        logger.info(`Álbum ID ${id} excluído pelo admin ID ${req.user.id}.`);
        res.json({ mensagem: 'Álbum excluído com sucesso.' });
    });

    app.get('/api/albuns/:id/faixas', async (req, res) => res.json(await repo.listTracks(routeId(req))));
    app.post('/api/albuns/:id/faixas', authenticate, requireAdmin, async (req, res) => {
        const albumId = routeId(req);
        const data = validate(schemas.faixa, req.body);
        if (!await repo.findAlbum(albumId)) fail(404, 'Álbum não encontrado.');
        const id = await repo.createTrack(albumId, data);
        logger.info(`Criação de entidade: faixa ID ${id} do álbum ${albumId}.`);
        res.status(201).json({ mensagem: 'Faixa criada com sucesso.', id });
    });

    app.get('/api/albuns/:id/resenhas', async (req, res) => res.json(await repo.listAlbumReviews(routeId(req))));
    app.get('/api/resenhas/minhas', authenticate, async (req, res) => res.json(await repo.listMyReviews(req.user.id)));
    app.post('/api/resenhas', authenticate, async (req, res) => {
        const data = validate(schemas.resenha, req.body);
        if (!await repo.findAlbum(data.album_id)) fail(404, 'Álbum não encontrado.');
        const id = await repo.createReview(req.user.id, data);
        logger.info(`Criação de entidade: resenha ID ${id} pelo utilizador ID ${req.user.id}.`);
        res.status(201).json({ mensagem: 'Resenha publicada com sucesso.', id });
    });
    app.delete('/api/resenhas/:id', authenticate, async (req, res) => {
        const id = routeId(req);
        const owner = await repo.findReviewOwner(id);
        if (!owner) fail(404, 'Resenha não encontrada.');
        if (owner.utilizador_id !== req.user.id && req.user.perfil !== 'admin') fail(403, 'Somente o autor ou um administrador pode excluir esta resenha.');
        await repo.deleteReview(id);
        logger.info(`Resenha ID ${id} excluída pelo utilizador ID ${req.user.id}.`);
        res.json({ mensagem: 'Resenha excluída com sucesso.' });
    });

    app.get('/api/usuarios/me', authenticate, async (req, res) => {
        res.json({ nome: req.user.nome, email: req.user.email, perfil: req.user.perfil, generos: await repo.listGenres(req.user.id) });
    });
    app.put('/api/usuarios/me', authenticate, async (req, res) => {
        const data = validate(schemas.perfil, req.body);
        await repo.updateProfile(req.user.id, data);
        logger.info(`Perfil atualizado: utilizador ID ${req.user.id}.`);
        res.json({ mensagem: 'Perfil atualizado com sucesso.' });
    });

    app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Endpoint não encontrado.')));
    app.use((err, req, res, _next) => {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ erro: 'Erro de validação.', detalhes: err.issues.map(x => ({ campo: x.path.join('.') || 'corpo', mensagem: x.message, codigo: x.code })) });
        }
        if (err instanceof HttpError) return res.status(err.status).json({ erro: err.message });
        if (err.type === 'entity.parse.failed') return res.status(400).json({ erro: 'JSON inválido.' });
        if (err.type === 'entity.too.large') return res.status(413).json({ erro: 'Corpo da requisição muito grande.' });
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ erro: 'Registro duplicado.' });
        logger.error(`Erro interno em ${req.method} ${req.path}: ${err.stack || err.message}`);
        const response = { erro: 'Erro interno do servidor.' };
        if (nodeEnv === 'development') response.detalhes = err.message;
        res.status(500).json(response);
    });
    return app;
}
module.exports = { createApp };
