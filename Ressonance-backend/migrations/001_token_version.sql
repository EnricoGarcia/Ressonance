-- Executar uma única vez em bancos antigos sem a coluna token_version.
-- Confirmar antes: SHOW COLUMNS FROM utilizadores LIKE 'token_version';
ALTER TABLE utilizadores
ADD COLUMN token_version INT UNSIGNED NOT NULL DEFAULT 0;
