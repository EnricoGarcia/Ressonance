require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});


db.connect((erro) => {
    if (erro) {
        console.error('❌ Erro ao ligar à base de dados:', erro);
        return;
    }
    console.log('✅ Ligação à base de dados MySQL estabelecida com sucesso!');
});

// Rota CRUD: Método GET
app.get('/api/albuns', (req, res) => {
    const query = 'SELECT * FROM albuns';
    
    db.query(query, (erro, resultados) => {
        if (erro) {
            return res.status(500).json({ erro: 'Erro interno ao procurar os álbuns.' });
        }
        res.status(200).json(resultados);
    });
});

// 4. Rota CRUD: Método POST
app.post('/api/albuns', (req, res) => {
    const { titulo, artista, ano, genero, capa } = req.body;
    if (!titulo || !artista || !ano || !genero) {
        return res.status(400).json({ 
            erro: 'Todos os campos obrigatórios (titulo, artista, ano, genero) devem ser preenchidos.' 
        });
    }

    const query = 'INSERT INTO albuns (titulo, artista, ano, genero, capa) VALUES (?, ?, ?, ?, ?)'; // Os pontos de interrogação garantem que o texto seja escapado com segurança
    const valores = [titulo, artista, ano, genero, capa || null];

    db.query(query, valores, (erro, resultado) => {
        if (erro) {
            console.error('Erro ao inserir álbum:', erro);
            return res.status(500).json({ erro: 'Erro interno ao salvar o álbum.' });
        }
        res.status(201).json({
            mensagem: 'Álbum criado com sucesso!',
            id: resultado.insertId
        });
    });
});

// 5. Rota CRUD: Método PUT
app.put('/api/albuns/:id', (req, res) => {
    const { id } = req.params;
    const { titulo, artista, ano, genero, capa } = req.body;
    if (!titulo || !artista || !ano || !genero) {
        return res.status(400).json({ 
            erro: 'Todos os campos obrigatórios devem ser preenchidos para a atualização.' 
        });
    }

    const query = 'UPDATE albuns SET titulo = ?, artista = ?, ano = ?, genero = ?, capa = ? WHERE id = ?'; // Os pontos de interrogação garantem que o texto seja escapado com segurança
    const valores = [titulo, artista, ano, genero, capa || null, id];

    db.query(query, valores, (erro, resultado) => {
        if (erro) {
            console.error('Erro ao atualizar álbum:', erro);
            return res.status(500).json({ erro: 'Erro interno ao atualizar o álbum.' });
        }

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ erro: 'Álbum não encontrado.' });
        }

        res.status(200).json({ mensagem: 'Álbum atualizado com sucesso!' });
    });
});

// 6. Rota CRUD: Método DELETE
app.delete('/api/albuns/:id', (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM albuns WHERE id = ?';

    db.query(query, [id], (erro, resultado) => {
        if (erro) {
            console.error('Erro ao excluir álbum:', erro);
            return res.status(500).json({ erro: 'Erro interno ao excluir o álbum.' });
        }

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ erro: 'Álbum não encontrado.' });
        }

        res.status(200).json({ mensagem: 'Álbum excluído com sucesso!' });
    });
});

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Chave secreta para assinar o token (em produção, estaria no .env)
const JWT_SECRET = process.env.JWT_SECRET || 'segredo_super_seguro_ressonance';
app.post('/api/auth/registar', async (req, res) => {
    const { nome, email, senha, perfil } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios.' });
    }

    try {
        const custoDeProcessamento = 10;
        const senha_hash = await bcrypt.hash(senha, custoDeProcessamento);

        const query = 'INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES (?, ?, ?, ?)';
        const valores = [nome, email, senha_hash, perfil || 'usuario'];

        db.query(query, valores, (erro, resultado) => {
            if (erro) {
                if (erro.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ erro: 'Este email já está registado.' });
                }
                return res.status(500).json({ erro: 'Erro interno ao registar utilizador.' });
            }
            res.status(201).json({ mensagem: 'Utilizador registado com sucesso!', id: resultado.insertId });
        });
    } catch (e) {
        res.status(500).json({ erro: 'Erro ao processar a segurança da senha.' });
    }
});

// Autenticação
app.post('/api/auth/login', (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ erro: 'Email e senha são obrigatórios.' });
    }

    const query = 'SELECT * FROM usuarios WHERE email = ?';
    db.query(query, [email], async (erro, resultados) => {
        if (erro) {
            return res.status(500).json({ erro: 'Erro interno no servidor.' });
        }

        if (resultados.length === 0) {
            return res.status(401).json({ erro: 'Email ou senha inválidos.' });
        }

        const usuario = resultados[0];
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
        if (!senhaCorreta) {
            return res.status(401).json({ erro: 'Email ou senha inválidos.' });
        }
        const token = jwt.sign(
            { id: usuario.id, email: usuario.email, perfil: usuario.perfil },
            JWT_SECRET,
            { expiresIn: '2h' } //Indica 2 horas de validade
        );

        res.status(200).json({
            mensagem: 'Login efetuado com sucesso!',
            token,
            utilizador: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                perfil: usuario.perfil
            }
        });
    });
});

//Proteção de Rotas
function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ erro: 'Acesso não autorizado. Token em falta.' });
    }

    jwt.verify(token, JWT_SECRET, (erro, payload) => {
        if (erro) {
            return res.status(403).json({ erro: 'Token inválido ou expirado.' });
        }
        req.user = payload;
        next();
    });
}
app.get('/api/perfil-protegido', verificarToken, (req, res) => {
    res.status(200).json({
        mensagem: 'Acesso concedido à rota protegida!',
        dadosUtilizador: req.user
    });
});
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor a correr em http://localhost:${PORT}`);
});