// Camada única de persistência: somente consultas parametrizadas.
function createRepository(db) {
    return {
        async findUserByEmail(email) {
            const [rows] = await db.execute('SELECT id, nome, email, senha, perfil, token_version FROM utilizadores WHERE email = ?', [email]);
            return rows[0] || null;
        },
        async findUserById(id) {
            const [rows] = await db.execute('SELECT id, nome, email, perfil, token_version FROM utilizadores WHERE id = ?', [id]);
            return rows[0] || null;
        },
        async createUser({ nome, email, senhaHash }) {
            const [result] = await db.execute('INSERT INTO utilizadores (nome, email, senha, perfil) VALUES (?, ?, ?, ?)', [nome, email, senhaHash, 'usuario']);
            return result.insertId;
        },
        async revokeTokens(id, version) {
            const [result] = await db.execute('UPDATE utilizadores SET token_version = token_version + 1 WHERE id = ? AND token_version = ?', [id, version]);
            return result.affectedRows;
        },
        async listAlbums() {
            const [rows] = await db.execute(`
                SELECT a.id, a.titulo, a.artista, a.ano, a.genero, a.capa,
                    COALESCE(m.media, 0) AS mediaExibicao,
                    COALESCE(m.total, 0) AS total_resenhas
                FROM albuns AS a
                LEFT JOIN (
                    SELECT album_id, ROUND(AVG(nota), 1) AS media, COUNT(*) AS total
                    FROM resenhas GROUP BY album_id
                ) AS m ON m.album_id = a.id
                ORDER BY a.id
            `);
            return rows;
        },
        async findAlbum(id) {
            const [rows] = await db.execute('SELECT id, titulo, artista, ano, genero, capa FROM albuns WHERE id = ?', [id]);
            return rows[0] || null;
        },
        async createAlbum(a) {
            const [result] = await db.execute('INSERT INTO albuns (titulo, artista, ano, genero, capa) VALUES (?, ?, ?, ?, ?)', [a.titulo, a.artista, a.ano, a.genero, a.capa || null]);
            return result.insertId;
        },
        async updateAlbum(id, a) {
            const [result] = await db.execute('UPDATE albuns SET titulo = ?, artista = ?, ano = ?, genero = ?, capa = ? WHERE id = ?', [a.titulo, a.artista, a.ano, a.genero, a.capa || null, id]);
            return result.affectedRows;
        },
        async deleteAlbum(id) {
            const [result] = await db.execute('DELETE FROM albuns WHERE id = ?', [id]);
            return result.affectedRows;
        },
        async listTracks(albumId) {
            const [rows] = await db.execute('SELECT numero_faixa, titulo FROM faixas WHERE album_id = ? ORDER BY numero_faixa', [albumId]);
            return rows;
        },
        async createTrack(albumId, f) {
            const [result] = await db.execute('INSERT INTO faixas (album_id, numero_faixa, titulo) VALUES (?, ?, ?)', [albumId, f.numero_faixa, f.titulo]);
            return result.insertId;
        },
        async listAlbumReviews(albumId) {
            const [rows] = await db.execute(`
                SELECT r.id, r.nota, r.texto AS resenha, r.data_publicacao, u.nome AS autor
                FROM resenhas r JOIN utilizadores u ON r.utilizador_id = u.id
                WHERE r.album_id = ? ORDER BY r.data_publicacao DESC, r.id DESC
            `, [albumId]);
            return rows;
        },
        async listMyReviews(userId) {
            const [rows] = await db.execute(`
                SELECT r.id, r.nota, r.texto AS resenha, a.titulo AS album_titulo,
                    a.capa AS album_capa, a.genero AS album_genero
                FROM resenhas r JOIN albuns a ON r.album_id = a.id
                WHERE r.utilizador_id = ? ORDER BY r.id DESC
            `, [userId]);
            return rows;
        },
        async createReview(userId, r) {
            const [result] = await db.execute('INSERT INTO resenhas (album_id, utilizador_id, nota, texto) VALUES (?, ?, ?, ?)', [r.album_id, userId, r.nota, r.resenha]);
            return result.insertId;
        },
        async findReviewOwner(id) {
            const [rows] = await db.execute('SELECT utilizador_id FROM resenhas WHERE id = ?', [id]);
            return rows[0] || null;
        },
        async deleteReview(id) {
            const [result] = await db.execute('DELETE FROM resenhas WHERE id = ?', [id]);
            return result.affectedRows;
        },
        async listGenres(userId) {
            const [rows] = await db.execute('SELECT genero FROM utilizadores_generos WHERE utilizador_id = ?', [userId]);
            return rows.map(row => row.genero);
        },
        async updateProfile(userId, p) {
            const conn = await db.getConnection();
            try {
                await conn.beginTransaction();
                await conn.execute('UPDATE utilizadores SET nome = ? WHERE id = ?', [p.nome, userId]);
                await conn.execute('DELETE FROM utilizadores_generos WHERE utilizador_id = ?', [userId]);
                for (const genero of p.generos) {
                    await conn.execute('INSERT INTO utilizadores_generos (utilizador_id, genero) VALUES (?, ?)', [userId, genero]);
                }
                await conn.commit();
            } catch (err) {
                await conn.rollback();
                throw err;
            } finally {
                conn.release();
            }
        }
    };
}
module.exports = { createRepository };
