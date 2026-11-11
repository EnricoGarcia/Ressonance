# Checklist de requisitos — Trabalho Individual II (SCOM)

Estado **implementado**: alteração conferida no código. **Testado**: cenário executado automaticamente. **A verificar**: depende do MySQL, navegador, processo Git ou entrega final do estudante.

| Item | Estado | Evidência / observação |
|---|---|---|
| A — separação frontend/backend | Implementado | arquivos públicos permitidos por `serve-frontend.js`; backend em subpasta |
| A — módulos/camadas | Implementado | `app.js`, `schemas.js`, `repository.js`, `config.js` |
| A — segredo fora do código | Implementado | `JWT_SECRET` obrigatório em `.env`; `.env.example` sem valor |
| A — script SQL | Implementado; a verificar no banco | `schema.sql`; comparar com SHOW CREATE TABLE |
| A — README e documentação da arquitetura | Implementado | `README.md`, `docs/ARQUITETURA.md` |
| A — logs e arquivos temporários ignorados | Implementado; Git pendente | `.gitignore`; remover `app.log` já rastreado |
| B — PK/FK/UNIQUE/NOT NULL/índices | Implementado; a verificar no banco | `schema.sql` |
| C — SQL parametrizado | Implementado e testado | `repository.js`, testes 12/15/17 |
| C — XSS HTML | Implementado; navegador a verificar | `ui.js`, `script.js`, `minhas-resenhas.js`, `album.js`, `admin.js`, teste 14 |
| C — CSRF | Não aplicável no fluxo JWT Bearer | Nenhuma sessão por cookie automático |
| C — controle de acesso | Implementado e testado | testes 01/05/06/09/10 |
| C — cinco testes de segurança | Casos automatizados; screenshots pendentes | `docs/TESTES_E_SEGURANCA.md` |
| D — senhas com bcrypt | Implementado e testado | testes 02/04 |
| D — login/logout/revogação | Implementado e testado | testes 04/11; requer migração no MySQL existente |
| E — REST e códigos status | Implementado e testado em mocks | `app.js` |
| E — API documentada | Implementado | `docs/API.md` (16 endpoints) |
| F — ≥5 testes, casos inválidos, evidência | Implementado e testado | 20 testes; `docs/evidencias/testes-automatizados.txt` |
| G — commits padronizados, branch/tag | Pendente no Git real | comandos abaixo |
| Observabilidade com timestamp | Implementado | `logger.js`; amostra real de log pendente |
| Performance | Otimização implementada; medição real pendente | agregação de médias em `repository.js` |
| Relatório em PDF | Base documental preparada | `docs/RELATORIO_TECNICO.md` / PDF conforme entrega |
| Vídeo da demonstração | Pendente | gravar no computador local |
| Declaração de uso de IA | Preparada; revisar | `docs/RELATORIO_TECNICO.md` |

## Operações de Git a executar no repositório original

```bash
# Na raiz do seu repositório local verdadeiro (com seu histórico original):
git switch -c fix/trabalho-ii-seguranca
# Copie/mescle o conteúdo corrigido nesta branch.
git rm --cached Ressonance-backend/app.log
# Confirme o que será versionado ANTES de adicionar:
git status --short
# .env e logs não podem aparecer como arquivos adicionados.
git add README.md .gitignore *.js *.html img/placeholder.svg docs/ Ressonance-backend/
git commit -m "fix(security): impede escalada de privilegios e revoga JWT"
git tag -a v2.0.0-scom -m "Marco do Trabalho Individual II"
git log --oneline --graph --decorate -10
git branch --list
git tag --list
```

**Importante:** se existirem alterações suas ainda não commitadas ou divergências no repositório original, revise cada arquivo antes de copiar. Não crie commits ou tags falsos. O pacote entregue aqui contém o **código corrigido sem o diretório `.git`**, para não republicar versões antigas de segredos e logs. Branch, tag, commits e envio remoto precisam ocorrer no seu repositório de trabalho.

Como a chave JWT antiga era pública, a simples remoção do arquivo atual não apaga o histórico remoto; use um segredo completamente novo, encerre sessões antigas e, se for preciso remover dados sensíveis do histórico, faça uma limpeza planejada sem sobrescrever commits de outros colaboradores inadvertidamente.
