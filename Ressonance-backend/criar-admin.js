// criar-admin.js
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function criarAdministrador() {
    try {
        const conexao = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'reesonance_data'
        });

        const hashSenha = await bcrypt.hash('123456', 10);

        const query = `
            INSERT INTO utilizadores (nome, email, senha, perfil) 
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE senha = ?, perfil = ?
        `;
        
        await conexao.query(query, ['Administrador', 'admin@teste.com', hashSenha, 'admin', hashSenha, 'admin']);

        console.log("✅ Admin criado/atualizado com sucesso com senha criptografada!");
        await conexao.end();
    } catch (erro) {
        console.error("❌ Erro ao criar admin:", erro.message);
    }
}

criarAdministrador();