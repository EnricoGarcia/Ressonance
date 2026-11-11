# Testes, segurança e evidências

## Testes executáveis

Acesse `Ressonance-backend/` e rode `npm ci && npm test`. O conjunto foi executado neste ambiente com **20 testes aprovados e nenhuma falha**. Usa `node:test` com HTTP real contra Express em porta efêmera, **repositório simulado** (sem dependência do MySQL). É um teste de aplicação isolada, não é evidência de integração com banco real.

| Nº | Caso | Comportamento esperado |
|---|---|---|
| 01 | Cadastro enviando `perfil: admin` | 400 e nenhum usuário criado |
| 02 | Cadastro válido | 201, perfil usuário e hash bcrypt |
| 03 | Tipos inválidos no login | 400 com detalhes Zod 4 |
| 04 | Senha incorreta | 401, nenhum token |
| 05 | Histórico sem login | 401 |
| 06 | Claim admin forjado num JWT de usuário | 403; perfil lido no banco |
| 07 | JWT_SECRET curto/ausente | inicialização recusada |
| 08 | Criação de álbum por admin | 201 e listagem com nota média |
| 09 | Atualização de álbum | 200, 404 ou 403 conforme situação |
| 10 | Exclusão de resenha | autor/admin permitidos, outro usuário bloqueado |
| 11 | Logout + reutilização de token | 200 no logout e 401 no token antigo |
| 12 | SQL Injection no ID de álbum | 400 antes de consultar banco |
| 13 | Erro interno | detalhe omitido em produção; presente em dev |
| 14 | HTML malicioso e esquema `javascript:` | texto escapado / URL rejeitada |
| 15 | Consulta SQL | placeholder separado dos valores |
| 16 | JSON inválido | 400 sem stack trace |
| 17 | Agregação de notas | uma consulta SQL com AVG |
| 18 | Servidor estático | 200 para HTML; 404 para backend/.env/.git e CSP presente |
| 19 | JWT expirado | 401 |
| 20 | Mais de três gêneros | 400 com detalhes |

Arquivo com saída real: `docs/evidencias/testes-automatizados.txt`.

## Cinco cenários de segurança para demonstrar ao professor

Use o Postman ou terminal. Substitua `<TOKEN_USUARIO>` e `<TOKEN_ADMIN>` por tokens **atuais**, nunca coloque tokens reais nos relatórios versionados. Faça as capturas de tela do comando/requisição e da resposta JSON, ocultando valores sensíveis.

1. **SQL Injection:** `GET /api/albuns/1%20OR%201=1` → `400`, detalhes de validação; `GET /api/albuns/1` funciona. Acesso ao banco usa placeholders. Evidência automatizada: testes 12 e 15.
2. **XSS:** registrar uma resenha com texto `<img src=x onerror=alert(1)>` (via API com usuário autenticado) e visitar a página do álbum. O texto deve aparecer literalmente, sem disparar JavaScript. Verifique também os filtros na home e página de resenhas. Evidência automatizada parcial (escape/URL): teste 14; captura de navegador precisa ser produzida localmente.
3. **Rota sem login:** `POST /api/albuns` com JSON válido e sem Authorization → `401`. Evidência automatizada: teste 05 (rota autenticada).
4. **Perfil insuficiente:** `POST /api/albuns` com token de usuário normal → `403` e álbum não criado. Evidência automatizada: testes 06 e 09.
5. **Token revogado:** faça login, `POST /api/auth/logout` com o Bearer e tente `GET /api/usuarios/me` com o mesmo Bearer → `401`. Evidência automatizada: teste 11.

**Teste adicional crítico:** `POST /api/auth/registar` com `{ "nome": "Ataque", "email": "atacante@exemplo.com", "senha": "SenhaSegura123", "perfil": "admin" }` → `400`, sem inserir admin (teste 01).

## Comandos curl básicos

```bash
curl -i http://localhost:3000/api/albuns/1%20OR%201=1
curl -i http://localhost:3000/api/resenhas/minhas
curl -i -X POST http://localhost:3000/api/auth/registar \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Ataque","email":"atacante@exemplo.com","senha":"SenhaSegura123","perfil":"admin"}'
```

## Observabilidade

A aplicação utiliza Winston com `timestamp` e níveis INFO/WARN/ERROR. Os eventos implementados incluem login bem-sucedido, credencial inválida, token recusado, criação de usuário/álbum/faixa/resenha e erro interno. Em execução local, os registros aparecem em `Ressonance-backend/logs/app.log`; **não anexar logs de produção contendo dados pessoais ou segredos**. O log original do projeto não integra a versão distribuída.

## Verificações que ainda exigem ambiente real

- **Servidor estático:** `node serve-frontend.js` permite `GET /index.html`, mas bloqueia `GET /Ressonance-backend/.env` (404); verificar antes da apresentação.
- **Banco:** executar `schema.sql` num banco limpo, registrar, fazer login, criar e editar álbum, registrar resenha, modificar perfil e verificar cascade/índices. Para banco antigo, comparar `SHOW CREATE TABLE` antes de aplicar migração.
- **Navegador:** reproduzir o teste XSS e tirar captura de tela sem execução de script; testar layout Desktop/Mobile.
- **Desempenho:** com catálogo de 30 álbuns, abrir DevTools > Network; agora o catálogo faz **1 chamada GET /api/albuns**, em vez de 1 GET de catálogo + 30 chamadas GET de resenhas. O perfil do usuário logado é consultado separadamente. Medir tempo total da página e registrar tela real, sem inferir tempos a partir de mocks.
- **Relatório e entrega:** gravar vídeo, capturas de segurança, amostra de log local, `git log --oneline --graph`, `git branch -a` e `git tag`; incluir no PDF final.

**Atenção:** os resultados da execução real do MySQL, screenshots e tempos de carregamento não são alegados como concluídos neste ambiente.
