# Arquitetura e matriz de permissões

## Arquitetura em camadas

```text
[Navegador / HTML, CSS, JS] --HTTP/JSON + Authorization: Bearer--> [Express / app.js]
                                                                  |
                                       [schemas.js: Zod] ----> [autenticação/ACL]
                                                                  |
                                       [repository.js: SQL parametrizado]
                                                                  |
                                                    [MySQL / MariaDB]

config.js => variáveis de ambiente; db.js => pool; logger.js => log com timestamp.
```

**Apresentação:** `serve-frontend.js` disponibiliza exclusivamente HTML/CSS/JS/imagens públicos (sem expor `.env` ou backend); arquivos HTML/JS da raiz (catálogo, detalhes, resenhas, perfil, admin). `ui.js` escapa texto dinâmico e valida URLs de capas. **Regras e controle de fluxo:** `app.js`, que implementa HTTP, autenticação e autorização; `schemas.js` concentra a validação. **Acesso a dados:** `repository.js` contém todas as consultas parametrizadas. **Infraestrutura:** `config.js` obriga JWT_SECRET, `db.js` cria pool e `server.js` inicializa. As dependências do app são injetadas para facilitar testes isolados.

## Matriz de permissões

| Ação | Visitante | Usuário | Admin |
|---|:---:|:---:|:---:|
| Consultar álbuns, detalhes, faixas e resenhas | Sim | Sim | Sim |
| Registrar-se e fazer login | Sim | Sim | Sim |
| Criar, atualizar e apagar álbuns | Não | Não | Sim |
| Criar faixas | Não | Não | Sim |
| Criar resenha | Não | Sim | Sim |
| Ler próprias resenhas / perfil / alterar perfil | Não | Sim | Sim |
| Apagar própria resenha | Não | Sim | Sim |
| Apagar resenha de terceiros | Não | Não | Sim |
| Logout com revogação | Não | Sim | Sim |
| Criar administrador (API) | Não | Não | Não |

O primeiro admin é criado apenas por CLI local usando variáveis de ambiente. Quando um JWT é apresentado, a API verifica assinatura, emissor, audiência, expiração, versão atual do token e o usuário no banco. A permissão `admin` é lida do banco a cada requisição protegida.

## Dados persistentes

- `utilizadores`: PK id, UNIQUE email, nome, senha bcrypt, perfil e versão do token.
- `albuns`: PK id, título, artista, ano, gênero, capa e índices por título/gênero.
- `faixas`: PK id, FK album_id, UNIQUE (album_id, numero_faixa), exclusão em cascata.
- `resenhas`: PK id, FKs para álbum e usuário, nota de 0 a 5, texto e timestamp.
- `utilizadores_generos`: PK id, FK para usuário, UNIQUE usuário + gênero.

No catálogo, uma consulta SQL com agrupamento de avaliações calcula a média e quantidade de resenhas por álbum; antes, o navegador enviava uma requisição por álbum. A operação de atualizar perfil é transacional, evitando perda dos gêneros após falhas intermediárias.
