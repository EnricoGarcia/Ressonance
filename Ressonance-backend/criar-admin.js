// Executar manualmente pelo terminal, fora da API pública.
// ADMIN_EMAIL=... ADMIN_PASSWORD=... node criar-admin.js
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const { loadConfig } = require('./config');

async function main() {
    const config = loadConfig();
    const { ADMIN_EMAIL: email, ADMIN_PASSWORD: senha, ADMIN_NAME: nome = 'Administrador' } = process.env;
    if (!email || !senha || senha.length < 12 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Defina ADMIN_EMAIL válido e ADMIN_PASSWORD com no mínimo 12 caracteres no ambiente.');
    }
    const conexao = await mysql.createConnection(config.database);
    try {
        const hash = await bcrypt.hash(senha, 12);
        // Não altera nenhuma conta existente silenciosamente.
        const [result] = await conexao.execute('INSERT INTO utilizadores (nome, email, senha, perfil) VALUES (?, ?, ?, ?)', [nome, email.toLowerCase(), hash, 'admin']);
        console.log(`Administrador criado (ID ${result.insertId}). Apague ADMIN_PASSWORD do ambiente.`);
    } finally {
        await conexao.end();
    }
}
main().catch(err => { console.error(`Falha ao criar administrador: ${err.message}`); process.exitCode = 1; });
