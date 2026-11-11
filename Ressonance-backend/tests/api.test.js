const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createApp } = require('../app');
const { createRepository } = require('../repository');
const { loadConfig } = require('../config');
const { escapeHTML, safeImageURL } = require('../../ui');

const SECRET = 'in-memory-test-secret-with-at-least-32-characters';
const logger = { info() {}, warn() {}, error() {} };

function fixtures() {
    const users = new Map();
    const albums = new Map([[1, { id: 1, titulo: 'Ten', artista: 'Pearl Jam', ano: 1991, genero: 'Grunge', capa: null }]]);
    const reviews = new Map([[9, { utilizador_id: 1 }]]);
    let nextUserId = 3;
    const repo = {
        users, albums, reviews,
        async findUserByEmail(email) { return [...users.values()].find(x => x.email === email) || null; },
        async findUserById(id) { return users.get(id) || null; },
        async createUser(data) {
            const id = nextUserId++;
            users.set(id, { id, nome: data.nome, email: data.email, senha: data.senhaHash, perfil: 'usuario', token_version: 0 });
            return id;
        },
        async revokeTokens(id, version) {
            const user = users.get(id);
            if (!user || user.token_version !== version) return 0;
            user.token_version++;
            return 1;
        },
        async listAlbums() { return [...albums.values()].map(x => ({ ...x, mediaExibicao: 4.5, total_resenhas: 1 })); },
        async findAlbum(id) { return albums.get(id) || null; },
        async createAlbum(a) { const id = Math.max(...albums.keys()) + 1; albums.set(id, { id, ...a }); return id; },
        async updateAlbum(id, a) { if (!albums.has(id)) return 0; albums.set(id, { id, ...a }); return 1; },
        async deleteAlbum(id) { return Number(albums.delete(id)); },
        async listTracks() { return []; },
        async createTrack() { return 22; },
        async listAlbumReviews() { return []; },
        async listMyReviews() { return []; },
        async createReview() { return 10; },
        async findReviewOwner(id) { return reviews.get(id) || null; },
        async deleteReview(id) { return Number(reviews.delete(id)); },
        async listGenres() { return []; },
        async updateProfile() { }
    };
    return repo;
}
function bearer(id, version = 0, extra = {}) {
    return jwt.sign({ tokenVersion: version, ...extra }, SECRET, { algorithm: 'HS256', subject: String(id), issuer: 'ressonance', audience: 'ressonance-web', expiresIn: '2h' });
}
async function withApp(fn, options = {}) {
    const repo = fixtures();
    const hash = await bcrypt.hash('SenhaForte@2026', 4);
    repo.users.set(1, { id: 1, nome: 'Usuário', email: 'u@exemplo.com', senha: hash, perfil: 'usuario', token_version: 0 });
    repo.users.set(2, { id: 2, nome: 'Admin', email: 'admin@exemplo.com', senha: hash, perfil: 'admin', token_version: 0 });
    const server = createApp({ repo, jwtSecret: SECRET, logger, nodeEnv: options.nodeEnv || 'production' }).listen(0);
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    async function req(path, method = 'GET', body, token) {
        const headers = {};
        if (body !== undefined) headers['Content-Type'] = 'application/json';
        if (token) headers.Authorization = `Bearer ${token}`;
        const response = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
        const result = await response.json().catch(() => undefined);
        return { status: response.status, body: result };
    }
    try { await fn({ req, repo, base }); }
    finally { await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
}
const album = { titulo: 'Teste', artista: 'Artista', ano: 2020, genero: 'Rock', capa: '' };

test('01 - Cadastro bloqueia elevação de privilégio via perfil=admin', async () => withApp(async ({ req, repo }) => {
    const r = await req('/api/auth/registar', 'POST', { nome: 'Invasor', email: 'x@exemplo.com', senha: 'SenhaForte@2026', perfil: 'admin' });
    assert.equal(r.status, 400); assert.ok(r.body.detalhes.length); assert.equal(repo.users.size, 2);
}));

test('02 - Cadastro válido cria apenas usuário com hash', async () => withApp(async ({ req, repo }) => {
    const r = await req('/api/auth/registar', 'POST', { nome: 'Fulano', email: 'FULANO@EXEMPLO.COM', senha: 'SenhaForte@2026' });
    assert.equal(r.status, 201);
    const u = repo.users.get(r.body.id);
    assert.equal(u.perfil, 'usuario'); assert.equal(u.email, 'fulano@exemplo.com');
    assert.notEqual(u.senha, 'SenhaForte@2026'); assert.equal(await bcrypt.compare('SenhaForte@2026', u.senha), true);
}));

test('03 - Login exige tipos corretos e informa Zod 4 issues', async () => withApp(async ({ req }) => {
    const r = await req('/api/auth/login', 'POST', { email: 123, senha: null });
    assert.equal(r.status, 400); assert.ok(Array.isArray(r.body.detalhes));
    assert.ok(r.body.detalhes.some(x => x.campo === 'email'));
}));

test('04 - Login inválido não emite JWT', async () => withApp(async ({ req }) => {
    const r = await req('/api/auth/login', 'POST', { email: 'u@exemplo.com', senha: 'senhaErrada' });
    assert.equal(r.status, 401); assert.equal(r.body.token, undefined);
}));

test('05 - Rota protegida bloqueia requisição sem token', async () => withApp(async ({ req }) => {
    assert.equal((await req('/api/resenhas/minhas')).status, 401);
}));

test('06 - Token com claim admin forjado não promove usuário do banco', async () => withApp(async ({ req }) => {
    assert.equal((await req('/api/albuns', 'POST', album, bearer(1, 0, { perfil: 'admin' }))).status, 403);
}));

test('07 - JWT_SECRET ausente ou curto impede iniciar', () => {
    assert.throws(() => loadConfig({ JWT_SECRET: 'curto' }), /JWT_SECRET/);
    assert.throws(() => createApp({ repo: fixtures(), jwtSecret: 'fraco', logger }), /JWT_SECRET/);
});

test('08 - Admin cria álbum; catálogo retorna média sem N+1', async () => withApp(async ({ req }) => {
    const r = await req('/api/albuns', 'POST', album, bearer(2));
    assert.equal(r.status, 201);
    const l = await req('/api/albuns');
    assert.equal(l.status, 200); assert.ok(l.body[0].mediaExibicao >= 0);
}));

test('09 - PUT atualiza álbum e retorna 404 para ID inexistente', async () => withApp(async ({ req }) => {
    assert.equal((await req('/api/albuns/1', 'PUT', album, bearer(2))).status, 200);
    assert.equal((await req('/api/albuns/999', 'PUT', album, bearer(2))).status, 404);
    assert.equal((await req('/api/albuns/1', 'PUT', album, bearer(1))).status, 403);
}));

test('10 - Autor ou admin pode excluir resenha; terceiro não pode', async () => withApp(async ({ req, repo }) => {
    assert.equal((await req('/api/resenhas/9', 'DELETE', undefined, bearer(2))).status, 200);
    repo.reviews.set(9, { utilizador_id: 2 });
    assert.equal((await req('/api/resenhas/9', 'DELETE', undefined, bearer(1))).status, 403);
}));

test('11 - Logout revoga token no banco e impede reutilização', async () => withApp(async ({ req }) => {
    const token = bearer(1);
    assert.equal((await req('/api/auth/logout', 'POST', undefined, token)).status, 200);
    assert.equal((await req('/api/usuarios/me', 'GET', undefined, token)).status, 401);
    const login = await req('/api/auth/login', 'POST', { email: 'u@exemplo.com', senha: 'SenhaForte@2026' });
    assert.equal(login.status, 200); assert.equal((await req('/api/usuarios/me', 'GET', undefined, login.body.token)).status, 200);
}));

test('12 - SQL Injection no ID é barrada antes de consultar banco', async () => withApp(async ({ req }) => {
    assert.equal((await req('/api/albuns/1%20OR%201=1')).status, 400);
}));

test('13 - Erros internos escondem detalhe em produção e mostram em desenvolvimento', async () => {
    for (const env of ['production', 'development']) {
        await withApp(async ({ req, repo }) => {
            repo.listAlbums = async () => { throw new Error('SELECT segredo FROM dados'); };
            const response = await req('/api/albuns');
            assert.equal(response.status, 500);
            assert.equal(Boolean(response.body.detalhes), env === 'development');
            assert.ok(!response.body.erro.includes('SELECT'));
        }, { nodeEnv: env });
    }
});

test('14 - XSS: saída HTML e URL de imagem são neutralizadas', () => {
    assert.equal(escapeHTML('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
    assert.equal(safeImageURL('javascript:alert(1)'), 'img/placeholder.svg');
    assert.equal(safeImageURL('img/Ten.jpg'), 'img/Ten.jpg');
});

test('15 - Banco recebe parâmetros separados da consulta SQL', async () => {
    const calls = [];
    const db = { async execute(sql, args) { calls.push({ sql, args }); return [[{ id: 1 }]]; } };
    const repo = createRepository(db);
    await repo.findAlbum('1 OR 1=1');
    assert.match(calls[0].sql, /id = \?/);
    assert.deepEqual(calls[0].args, ['1 OR 1=1']);
    assert.ok(!calls[0].sql.includes('1 OR 1=1'));
});

test('16 - JSON malformado retorna 400 sem informação interna', async () => withApp(async ({ base }) => {
    const response = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{incompleto' });
    assert.equal(response.status, 400); assert.equal((await response.json()).erro, 'JSON inválido.');
}));

test('17 - Lista de álbuns usa uma consulta agregada para notas', async () => {
    const sqlCalls = [];
    const db = { async execute(sql) { sqlCalls.push(sql); return [[{ id: 1, mediaExibicao: 4.7 }]]; } };
    const rows = await createRepository(db).listAlbums();
    assert.equal(sqlCalls.length, 1);
    assert.match(sqlCalls[0], /AVG\(nota\)/);
    assert.equal(rows[0].mediaExibicao, 4.7);
});

test('18 - Servidor estático não expõe arquivos do backend nem .git e envia CSP', async () => {
    const { createFrontendServer } = require('../../serve-frontend');
    const server = createFrontendServer().listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    try {
        const home = await fetch(base + '/index.html');
        assert.equal(home.status, 200);
        assert.match(home.headers.get('content-security-policy'), /script-src 'self'/);
        for (const path of ['/Ressonance-backend/.env', '/Ressonance-backend/server.js', '/.git/config', '/docs/API.md']) {
            assert.equal((await fetch(base + path)).status, 404, `arquivo privado: ${path}`);
        }
    } finally {
        await new Promise(resolve => server.close(resolve));
    }
});

test('19 - Token expirado é recusado', async () => withApp(async ({ req }) => {
    const expired = jwt.sign({ tokenVersion: 0 }, SECRET, {
        subject: '1', issuer: 'ressonance', audience: 'ressonance-web', expiresIn: -10
    });
    assert.equal((await req('/api/usuarios/me', 'GET', undefined, expired)).status, 401);
}));

test('20 - Perfil com mais de três gêneros é rejeitado', async () => withApp(async ({ req }) => {
    const data = { nome: 'Usuário normal', generos: ['Rock', 'Pop', 'Jazz', 'MPB'] };
    const r = await req('/api/usuarios/me', 'PUT', data, bearer(1));
    assert.equal(r.status, 400);
    assert.ok(r.body.detalhes.some(x => x.campo === 'generos'));
}));

test('21 - Login de usuário fictício com senha NULL retorna 401',
  async () => withApp(async ({ req, repo }) => {

    repo.users.set(3, {
        id: 3,
        nome: 'Usuário fictício',
        email: 'ficticio@exemplo.com',
        senha: null,
        perfil: 'usuario',
        token_version: 0
    });

    const r = await req('/api/auth/login', 'POST', {
        email: 'ficticio@exemplo.com',
        senha: 'SenhaQualquer@2026'
    });

    assert.equal(r.status, 401);
    assert.equal(r.body.erro, 'E-mail ou senha inválidos.');
    assert.equal(r.body.token, undefined);
}));