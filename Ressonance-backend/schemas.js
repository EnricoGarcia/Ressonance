const { z } = require('zod');
const nome = z.string().trim().min(3, 'O nome deve ter pelo menos 3 caracteres.').max(120);
const email = z.email('Formato de e-mail inválido.').max(254).transform(v => v.toLowerCase());
const senha = z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.').max(72);
const id = z.coerce.number().int().positive().safe();

const registro = z.strictObject({ nome, email, senha }); // nunca recebe perfil do cliente
const login = z.strictObject({ email, senha: z.string().min(1).max(200) });
const album = z.strictObject({
    titulo: z.string().trim().min(1).max(200),
    artista: z.string().trim().min(1).max(160),
    ano: z.number().int().min(1900).max(new Date().getFullYear()),
    genero: z.string().trim().min(1).max(100),
    capa: z.union([
        z.literal(''),
        z.string().url().max(500).refine(v => /^https?:\/\//i.test(v), 'Use uma URL HTTP ou HTTPS.')
    ]).optional()
});
const faixa = z.strictObject({
    numero_faixa: z.number().int().positive().max(1000),
    titulo: z.string().trim().min(1).max(150)
});
const resenha = z.strictObject({
    album_id: z.number().int().positive().safe(),
    nota: z.number().min(0).max(5).refine(v => Number.isInteger(v * 10), 'A nota deve ter no máximo uma casa decimal.'),
    resenha: z.string().trim().min(1).max(5000)
});
const perfil = z.strictObject({
    nome,
    generos: z.array(z.string().trim().min(1).max(100)).max(3).refine(v => new Set(v).size === v.length, 'Gêneros não podem se repetir.')
});
module.exports = { id, registro, login, album, faixa, resenha, perfil };
