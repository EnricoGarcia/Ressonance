// Servidor estático local com lista explícita de arquivos públicos.
// NÃO expõe .env, Ressonance-backend, logs, .git ou documentos internos.
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const ROOT = __dirname;
const PUBLIC_FILES = new Set([
    'index.html', 'album.html', 'login.html', 'admin.html',
    'adicionar-resenha.html', 'meu-perfil.html', 'minhas-resenhas.html',
    'style.css', 'ui.js', 'script.js', 'album.js', 'login.js', 'admin.js',
    'adicionar-resenha.js', 'meu-perfil.js', 'minhas-resenhas.js',
    'barralat.js', 'dados.js'
]);
const EXT = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: http:; connect-src http://localhost:3000 http://127.0.0.1:3000; base-uri 'none'; object-src 'none'; frame-ancestors 'none'";

function createFrontendServer() {
    return http.createServer(async (req, res) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Security-Policy', CSP);
        res.setHeader('Cache-Control', 'no-store');
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end('Método não permitido');
        }
        let pathname;
        try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
        catch (_) { res.writeHead(400); return res.end('URL inválida'); }
        const name = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
        // O arquivo precisa constar da lista explícita, ou ser uma capa na pasta img/.
        const img = /^img\/[\w.-]+\.(?:png|jpe?g|webp|svg)$/i.test(name);
        if (!PUBLIC_FILES.has(name) && !img) {
            res.writeHead(404); return res.end('Arquivo não encontrado');
        }
        const full = path.join(ROOT, name);
        try {
            const data = await fs.readFile(full);
            res.writeHead(200, { 'Content-Type': EXT[path.extname(name).toLowerCase()] || 'application/octet-stream' });
            if (req.method === 'HEAD') res.end(); else res.end(data);
        } catch (err) {
            res.writeHead(err.code === 'ENOENT' ? 404 : 500);
            res.end('Arquivo indisponível');
        }
    });
}
if (require.main === module) {
    const port = Number(process.env.FRONT_PORT || 5500);
    createFrontendServer().listen(port, '127.0.0.1', () => console.log(`Frontend local: http://127.0.0.1:${port}`));
}
module.exports = { createFrontendServer };
