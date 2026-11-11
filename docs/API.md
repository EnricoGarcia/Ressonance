# Documentação completa da API — Ressonance

**Base local:** `http://localhost:3000`. Corpo JSON e resposta JSON (`Content-Type: application/json`). Rotas privadas exigem `Authorization: Bearer <JWT>`. IDs de rota devem ser inteiros positivos. Erros têm formato `{ "erro": "Mensagem" }`, com `detalhes: [{campo, mensagem, codigo}]` quando a validação Zod falha. Erros internos não exibem informações técnicas em produção.

| Método | URL | Acesso | Sucesso | Outros status |
|---|---|---|---|---|
| POST | `/api/auth/registar` | Público | 201 | 400, 409, 500 |
| POST | `/api/auth/login` | Público | 200 | 400, 401, 500 |
| POST | `/api/auth/logout` | Autenticado | 200 | 401, 500 |
| GET | `/api/albuns` | Público | 200 | 500 |
| GET | `/api/albuns/:id` | Público | 200 | 400, 404, 500 |
| POST | `/api/albuns` | Admin | 201 | 400, 401, 403, 409, 500 |
| PUT | `/api/albuns/:id` | Admin | 200 | 400, 401, 403, 404, 500 |
| DELETE | `/api/albuns/:id` | Admin | 200 | 400, 401, 403, 404, 500 |
| GET | `/api/albuns/:id/faixas` | Público | 200 | 400, 500 |
| POST | `/api/albuns/:id/faixas` | Admin | 201 | 400, 401, 403, 404, 409, 500 |
| GET | `/api/albuns/:id/resenhas` | Público | 200 | 400, 500 |
| GET | `/api/resenhas/minhas` | Autenticado | 200 | 401, 500 |
| POST | `/api/resenhas` | Autenticado | 201 | 400, 401, 404, 500 |
| DELETE | `/api/resenhas/:id` | Autor ou admin | 200 | 400, 401, 403, 404, 500 |
| GET | `/api/usuarios/me` | Autenticado | 200 | 401, 500 |
| PUT | `/api/usuarios/me` | Autenticado | 200 | 400, 401, 500 |

## Exemplos de requisição e resposta (todos os endpoints)

Os exemplos são ilustrativos e não evidência de execução contra MySQL.

### POST /api/auth/registar

Entrada: `{ "nome": "Maria Silva", "email": "maria@exemplo.com", "senha": "SenhaForte@2026" }`. Resposta `201`: `{ "mensagem": "Usuário registrado com sucesso.", "id": 12 }`. **`perfil` não é aceito** e retorna `400` com detalhes. E-mail repetido retorna `409`.

### POST /api/auth/login

Entrada: `{ "email": "maria@exemplo.com", "senha": "SenhaForte@2026" }`. Resposta `200`: `{ "mensagem": "Login efetuado com sucesso.", "token": "<JWT>", "utilizador": { "id": 12, "nome": "Maria Silva", "perfil": "usuario" } }`. Credenciais inválidas: `401`.

### POST /api/auth/logout

Entrada: sem corpo, cabeçalho `Authorization: Bearer <JWT>`. Resposta `200`: `{ "mensagem": "Sessão encerrada no servidor." }`. Um token já revogado retorna `401`. O logout invalida todas as sessões anteriores daquele usuário.

### GET /api/albuns

Entrada: sem parâmetros. Resposta `200`: `[{ "id": 1, "titulo": "Ten", "artista": "Pearl Jam", "ano": 1991, "genero": "Grunge", "capa": "img/Ten.jpg", "mediaExibicao": 4.5, "total_resenhas": 10 }]`. O backend calcula a média sem chamadas extras do navegador.

### GET /api/albuns/:id

Parâmetro de URL: `id=1`. Requisição `GET /api/albuns/1`. Resposta `200`: `{ "id": 1, "titulo": "Ten", "artista": "Pearl Jam", "ano": 1991, "genero": "Grunge", "capa": "img/Ten.jpg" }`. Álbum inexistente `404`.

### POST /api/albuns

Requer admin. Entrada: `{ "titulo": "Novo Álbum", "artista": "Artista", "ano": 2024, "genero": "Rock", "capa": "https://exemplo.com/capa.jpg" }`. `capa` é opcional e pode ser `""`; quando informada deve ser URL HTTP(S). Resposta `201`: `{ "mensagem": "Álbum criado com sucesso.", "id": 31 }`.

### PUT /api/albuns/:id

Requer admin. Parâmetro `id=31`. Entrada: `{ "titulo": "Novo Álbum (edição)", "artista": "Artista", "ano": 2024, "genero": "Rock", "capa": "" }` (todos os campos obrigatórios, exceto capa). Resposta `200`: `{ "mensagem": "Álbum atualizado com sucesso." }`. Inexistente `404`.

### DELETE /api/albuns/:id

Requer admin. Requisição `DELETE /api/albuns/31`, sem corpo. Resposta `200`: `{ "mensagem": "Álbum excluído com sucesso." }`. A FK com `ON DELETE CASCADE` remove faixas e resenhas daquele álbum.

### GET /api/albuns/:id/faixas

Parâmetro `id=1`. Requisição `GET /api/albuns/1/faixas`. Resposta `200`: `[{ "numero_faixa": 1, "titulo": "Once" }]`. Se não houver faixas, `[]`.

### POST /api/albuns/:id/faixas

Requer admin. Parâmetro `id=1`. Entrada: `{ "numero_faixa": 1, "titulo": "Once" }`. Resposta `201`: `{ "mensagem": "Faixa criada com sucesso.", "id": 51 }`. Álbum inexistente `404`; faixa de mesmo número para o álbum `409`.

### GET /api/albuns/:id/resenhas

Parâmetro `id=1`. Requisição `GET /api/albuns/1/resenhas`. Resposta `200`: `[{ "id": 4, "nota": 4.5, "resenha": "Ótimo disco", "data_publicacao": "2026-11-10T12:00:00.000Z", "autor": "Maria Silva" }]`.

### GET /api/resenhas/minhas

Requer login. Requisição `GET /api/resenhas/minhas` com Bearer. Resposta `200`: `[{ "id": 4, "nota": 4.5, "resenha": "Ótimo disco", "album_titulo": "Ten", "album_capa": "img/Ten.jpg", "album_genero": "Grunge" }]`.

### POST /api/resenhas

Requer login. Entrada: `{ "album_id": 1, "nota": 4.5, "resenha": "Ótimo disco" }`. Resposta `201`: `{ "mensagem": "Resenha publicada com sucesso.", "id": 4 }`. Nota de 0 a 5 com uma casa decimal; texto de 1 a 5000 caracteres. Álbum inexistente `404`.

### DELETE /api/resenhas/:id

Requer ser autor ou admin. Requisição `DELETE /api/resenhas/4`, sem corpo. Resposta `200`: `{ "mensagem": "Resenha excluída com sucesso." }`. Outro usuário recebe `403`; inexistente `404`.

### GET /api/usuarios/me

Requer login. Requisição `GET /api/usuarios/me`. Resposta `200`: `{ "nome": "Maria Silva", "email": "maria@exemplo.com", "perfil": "usuario", "generos": ["Rock", "Jazz"] }`. Nunca retorna senha nem hash.

### PUT /api/usuarios/me

Requer login. Entrada: `{ "nome": "Maria Silva", "generos": ["Rock", "Jazz"] }`. Até 3 gêneros distintos. Resposta `200`: `{ "mensagem": "Perfil atualizado com sucesso." }`. Atualização executada em transação.

## Exemplo de erro estruturado

Requisição inválida `POST /api/auth/login` com `{ "email": 123, "senha": null }` produz `400`:

```json
{
  "erro": "Erro de validação.",
  "detalhes": [
    { "campo": "email", "mensagem": "Invalid input: expected string, received number", "codigo": "invalid_type" },
    { "campo": "senha", "mensagem": "Invalid input: expected string, received null", "codigo": "invalid_type" }
  ]
}
```

Além dos códigos específicos da tabela, requisições com JSON malformado retornam `400`, payload superior a 50 KB retorna `413`, e endpoint desconhecido sob `/api` retorna `404`.
