require('dotenv').config();
const mysql = require('mysql2/promise');
const albuns = require('./albuns-novos');

async function seed() {
    const conexao = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'ressonance_data'
    });

    console.log('Ligação estabelecida. Inserindo álbuns e faixas...');
    let totalAlbuns = 0, totalFaixas = 0, ignorados = 0;

    try {
        for (const album of albuns) {
            // Evita duplicar se o script for executado mais de uma vez
            const [existe] = await conexao.execute(
                'SELECT id FROM albuns WHERE titulo = ? AND artista = ?',
                [album.titulo, album.artista]
            );
            if (existe.length > 0) {
                console.log(`- Já existe, ignorado: ${album.titulo}`);
                ignorados++;
                continue;
            }

            await conexao.beginTransaction();
            try {
                // O id do álbum é gerado pelo banco (AUTO_INCREMENT)
                const [res] = await conexao.execute(
                    'INSERT INTO albuns (titulo, artista, ano, genero, capa) VALUES (?, ?, ?, ?, ?)',
                    [album.titulo, album.artista, album.ano, album.genero, album.capa]
                );
                const albumId = res.insertId;

                // Cada faixa recebe o id próprio (AUTO_INCREMENT) + album_id + numero_faixa
                for (let i = 0; i < album.musicas.length; i++) {
                    await conexao.execute(
                        'INSERT INTO faixas (album_id, numero_faixa, titulo) VALUES (?, ?, ?)',
                        [albumId, i + 1, album.musicas[i]]
                    );
                    totalFaixas++;
                }

                await conexao.commit();
                totalAlbuns++;
                console.log(`+ ${album.titulo} (id ${albumId}, ${album.musicas.length} faixas)`);
            } catch (erro) {
                await conexao.rollback();
                console.error(`! Erro em "${album.titulo}":`, erro.message);
            }
        }
        console.log(`\nConcluído: ${totalAlbuns} álbuns, ${totalFaixas} faixas inseridas, ${ignorados} ignorados.`);
    } finally {
        await conexao.end();
    }
}

seed();
