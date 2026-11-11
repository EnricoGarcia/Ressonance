# Ressonance — Catálogo e Resenhas Musicais (Trabalhos I e II — SCOM)

Aplicação cliente/servidor para navegação por álbuns, publicação de resenhas e administração do catálogo. Evolução do frontend do Trabalho I com **API REST em Node.js/Express 5**, **MySQL/MariaDB**, **autenticação JWT revogável**, validação Zod 4 e testes automatizados.

## Início rápido

**Requisitos:** Node.js 20+ (recomendado 22), npm, MySQL 8+ ou MariaDB 10.5+. Comandos a executar na pasta do projeto:

```bash
cd Ressonance-backend
npm ci
cp .env.example .env
```

No Windows/PowerShell, `cp` pode ser substituído por `Copy-Item .env.example .env`. Abra `Ressonance-backend/.env` e configure `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`. **Crie um segredo JWT novo em cada ambiente** e preencha `JWT_SECRET` (não use um valor do repositório):

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

O servidor **não inicia sem JWT_SECRET com no mínimo 32 bytes**. Se o segredo antigo já apareceu no Git público, considere todos os tokens antigos comprometidos; nunca reutilize esse segredo. O `.env` nunca deve ser enviado ao Git.

### Banco de dados

O arquivo `Ressonance-backend/schema.sql` cria o banco e todas as tabelas de um **banco novo**, incluindo as FKs, índices e constraints.

```bash
mysql -u root -p < schema.sql
```

No Windows/PowerShell, abra `schema.sql` no MySQL Workbench e execute-o (o redirecionamento `<` acima é para shells como Bash/CMD).

**Banco já existente:** execute `SHOW CREATE TABLE utilizadores;`, `SHOW CREATE TABLE albuns;`, `SHOW CREATE TABLE resenhas;`, `SHOW CREATE TABLE faixas;` e `SHOW CREATE TABLE utilizadores_generos;` e compare com `schema.sql` antes de modificar sua base. É necessário acrescentar `token_version` em `utilizadores` para a revogação do logout. Se faltar a coluna, aplique **uma única vez** `Ressonance-backend/migrations/001_token_version.sql` no banco selecionado (`mysql -u root -p ressonance_data < migrations/001_token_version.sql` a partir da pasta backend). Faça backup antes de qualquer migração. Não execute scripts `reset-db.js` ou `seed-resenhas.js` em dados de produção: **eles apagam dados**.

### Inicialização

```bash
cd Ressonance-backend
npm start
```

A API fica em `http://localhost:3000`. Em outro terminal, a partir da raiz `ProjetoIndividual/`:

```bash
node serve-frontend.js
```

Abra `http://127.0.0.1:5500/index.html`. Use o servidor incluído (`serve-frontend.js`), que permite apenas os arquivos públicos e **bloqueia acesso ao backend, `.env`, logs e `.git`**. Não utilize `python -m http.server` na raiz, pois ele expõe os diretórios privados. Em outro domínio/porta, atualize `CORS_ORIGINS` no `.env` e os endereços da API no frontend.

### Criar administrador

O cadastro público só cria usuários (`perfil='usuario'`). A criação de administrador é feita **exclusivamente por comando local**, com senha forte fornecida no ambiente. Não há senha nem admin padrão.

```bash
# Linux/macOS (não copiar valores reais para scripts versionados):
ADMIN_EMAIL=seu-email@exemplo.com ADMIN_NAME=Administrador ADMIN_PASSWORD='defina-sua-senha-forte' npm run admin:create
```

No Windows/PowerShell, defina as variáveis em `$env:ADMIN_EMAIL`, `$env:ADMIN_NAME`, `$env:ADMIN_PASSWORD`, execute `npm run admin:create` e remova-as do ambiente. O comando **não sobrescreve contas preexistentes**; ao tentar reutilizar um email retornará conflito.

### Testes

```bash
cd Ressonance-backend
npm test
```

São **20 testes automatizados**, incluindo registros, autenticação, autorização, logout, validação, SQL Injection, XSS e tratamento de erros. Eles usam repositório de dados simulado e não exigem conexão ao MySQL; para validar a integração real, siga `docs/TESTES_E_SEGURANCA.md`. O resultado da execução verificada acompanha `docs/evidencias/testes-automatizados.txt`.

## Organização

```text
ProjetoIndividual/
├── index.html, album.html, login.html, admin.html, ...   # interface
├── script.js, album.js, minhas-resenhas.js, ...          # controladores do frontend
├── ui.js, serve-frontend.js                               # XSS e servidor estático seguro
├── img/                                                  # capas locais
├── Ressonance-backend/
│   ├── server.js                                         # inicialização
│   ├── app.js                                            # rotas e autenticação HTTP
│   ├── schemas.js                                        # esquemas Zod
│   ├── repository.js                                     # consultas SQL parametrizadas
│   ├── db.js, config.js, logger.js                        # infraestrutura
│   ├── schema.sql, migrations/                           # estrutura de banco
│   ├── tests/                                            # testes Node.js
│   ├── .env.example, package.json, package-lock.json
│   └── criar-admin.js                                    # bootstrap de admin via CLI
└── docs/
    ├── ARQUITETURA.md
    ├── API.md
    ├── TESTES_E_SEGURANCA.md
    ├── CHECKLIST.md
    └── RELATORIO_TECNICO.md
```

## Segurança e cuidados

- Tokens JWT HS256 com segredo **obrigatório** em `.env`, expiração de duas horas, emissor e audiência verificados, e versão de token no banco. O logout invalida todas as sessões anteriores daquele usuário.
- Autorização de administrador/autor consultada no banco a cada requisição protegida; nenhum papel informado pelo navegador é aceito para cadastro.
- Senhas armazenadas com bcrypt (custo 12); validação e limites de entrada com Zod 4; consultas SQL com placeholders; saída HTML escapada e URLs de imagem filtradas.
- A aplicação usa Bearer token no cabeçalho `Authorization`, não cookies automáticos de sessão; por isso o fluxo padrão não sofre CSRF por cookie. **Evite colocar tokens em URLs.** Como a interface original usa `localStorage`, qualquer XSS novo pode comprometer a sessão: manter escape e revisar dependências é essencial. Para produção, preferir TLS/HTTPS e arquitetura de autenticação endurecida.
- Logs são gravados em `Ressonance-backend/logs/app.log`, ignorados pelo Git. Os logs não incluem senhas ou tokens. Erros técnicos aparecem apenas na resposta quando `NODE_ENV=development`.

**Atenção Git:** `Ressonance-backend/app.log` já estava rastreado no repositório original. No repositório local real, execute `git rm --cached Ressonance-backend/app.log` e faça commit; `.gitignore` não remove arquivos já rastreados. Segredos antigos ainda podem permanecer no histórico Git mesmo após a correção — rotacione-os. Instruções de branches, tags e evidências em `docs/CHECKLIST.md`.

## Documentação

Consulte `docs/API.md` para **todos os endpoints**, `docs/ARQUITETURA.md` para o padrão em camadas e matriz de permissões, `docs/TESTES_E_SEGURANCA.md` para cenários e evidências, `docs/CHECKLIST.md` para pontos da avaliação e `docs/RELATORIO_TECNICO.md` como relatório técnico-base.

## Limitações verificadas

A correção e os testes automatizados foram executados sem um serviço MySQL acessível neste ambiente. O script SQL foi derivado das consultas do projeto original, mas **a compatibilidade com um banco existente precisa ser comprovada com `SHOW CREATE TABLE`**. O frontend ainda depende da API em `http://localhost:3000`; para produção, configurar URL e TLS. Capturas, medidas reais de desempenho, vídeo e histórico Git publicado devem ser gerados durante a demonstração.
