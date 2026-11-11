# Diagnóstico e correções efetivamente aplicadas

Revisão feita a partir do arquivo original `ProjetoIndividual.rar` e dos requisitos de `Trabalho Individual II - SCOM.pdf` (10/11/2026). Os pontos a seguir foram identificados no código extraído; cada linha distingue alterações realizadas de verificações externas ainda pendentes.

| Prioridade | Problema no projeto original | Correção | Verificação |
|---|---|---|---|
| **Crítico** | Cadastro aceitava `perfil: admin` enviado pela API | `schemas.js` rejeita o campo e `repository.js` grava sempre `usuario` | Testes 01 e 02 |
| **Crítico** | JWT com segredo conhecido de fallback no código | `JWT_SECRET` obrigatório, sem valor padrão; `.env.example` e fail-fast | Teste 07 |
| **Crítico** | Bootstrap de administrador utilizava senha conhecida | `criar-admin.js` passou a exigir `ADMIN_EMAIL` e `ADMIN_PASSWORD` forte no ambiente, sem substituição silenciosa | Revisão de código; fluxo real pendente |
| **Alto** | Logout apenas removia `localStorage`; token seguia válido | Novo `POST /api/auth/logout` e `token_version` no banco para revogação | Teste 11; migração real pendente |
| **Alto** | JWT continha perfil, potencialmente desatualizado | Admin lido de `utilizadores` no banco em cada rota autenticada | Teste 06 |
| **Alto** | Não havia testes executáveis | Suíte Node (`npm test`) com **20 testes aprovados** | Evidência de execução incluída |
| **Alto** | Erros Zod 4 usavam `erro.errors` | Tratamento centralizado usa `err.issues`, campos e mensagens normalizadas | Teste 03 |
| **Alto** | Login não tinha validação de entrada | Zod `login`, email válido e senha string, limite de tamanhos | Testes 03, 04 |
| **Alto** | HTML em `script.js`, `minhas-resenhas.js`, `admin.js` podia interpretar conteúdo externo | Escape em todos os pontos de texto/atributo, `textContent` para mensagens e validação de URLs de imagem; ajustado `album.js` | Teste 14; navegador pendente |
| **Alto** | Servir frontend direto da raiz podia expor `.env` e backend | Criado `serve-frontend.js` com allowlist, CSP e bloqueio de arquivos privados | Teste 18 |
| **Médio** | Faltava script SQL | Criado `schema.sql` com cinco tabelas, PK/FK/UNIQUE/índices e migração de versão JWT | Compatibilidade e execução com MySQL reais pendentes |
| **Médio** | Faltava atualização de álbuns | `PUT /api/albuns/:id` e campo opcional de edição no painel admin | Teste 09 |
| **Médio** | Home fazia uma requisição por álbum para média | `GET /api/albuns` devolve média e contagem via agregação SQL | Testes 08 e 17 |
| **Médio** | Respostas podiam revelar texto de erro SQL | Tratamento centralizado oculta detalhes em produção e os mostra só em dev | Teste 13 |
| **Médio** | Validação inconsistente / entradas sem limite | Esquemas `strictObject`, IDs inteiros positivos, limites de strings, JSON 50 KB | Testes 12, 16, 20 |
| **Médio** | `app.log` versionado | `.gitignore` ignora logs; arquivo não incluído no pacote distribuído | `git rm --cached` deve ser feito no Git original |
| **Médio** | Documentação apenas do Trabalho I | README completo, arquitetura, matriz de acessos e API com 16 endpoints | Arquivos `README.md` e `docs/` |
| **Médio** | Scripts de seed incompatíveis com senha obrigatória, resquícios de faixas | `seed-resenhas.js` insere hash aleatório; `reset-db.js` limpa faixas | Revisão; banco real pendente |
| **Baixo** | Quatro capas em `reset-db.js` tinham letras maiúsculas/minúsculas divergentes dos arquivos | Caminhos corrigidos para os nomes reais de `img/` | Conferência dos nomes de arquivos |
| **Processo** | Sem branch/tag de marco no repositório entregue | Documentados comandos de branch, commit e tag em `docs/CHECKLIST.md` | **Pendente** no repositório Git real |

## Limitações explícitas

Não foi possível verificar `SHOW CREATE TABLE` do banco pessoal, nem executar migração/CRUD em um MySQL real neste ambiente. Também não foi possível produzir capturas reais do navegador, logs da execução real, resultados de desempenho em milissegundos, vídeo ou fazer push no repositório remoto. Esses itens estão descritos sem fingir que foram completados.

As dependências de `node_modules/` são instaláveis via `npm ci` e não estão incluídas no pacote. O `.env` original e o arquivo de log também foram **excluídos intencionalmente**. Algumas capas citadas por `albuns-novos.js` não estavam presentes no arquivo de origem (26 referências); a lista precisa ser acompanhada de imagens ou usar o placeholder SVG. O histórico `.git` foi omitido para não recircular possíveis segredos antigos; as correções devem ser incorporadas e commitadas na cópia do repositório do estudante.
