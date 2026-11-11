-- Banco de dados inicial (MySQL 8+ / MariaDB 10.5+).
-- ATENÇÃO: para banco preexistente, conferir SHOW CREATE TABLE e aplicar migrations/001_token_version.sql.
CREATE DATABASE IF NOT EXISTS ressonance_data CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ressonance_data;

CREATE TABLE IF NOT EXISTS utilizadores (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    perfil ENUM('usuario', 'admin') NOT NULL DEFAULT 'usuario',
    token_version INT UNSIGNED NOT NULL DEFAULT 0,
    UNIQUE KEY uq_utilizadores_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS albuns (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    artista VARCHAR(160) NOT NULL,
    ano SMALLINT UNSIGNED NOT NULL,
    genero VARCHAR(100) NOT NULL,
    capa VARCHAR(500) NULL,
    INDEX idx_albuns_genero (genero),
    INDEX idx_albuns_titulo (titulo)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS faixas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    album_id INT UNSIGNED NOT NULL,
    numero_faixa SMALLINT UNSIGNED NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    UNIQUE KEY uq_album_numero_faixa (album_id, numero_faixa),
    CONSTRAINT fk_faixas_album FOREIGN KEY (album_id) REFERENCES albuns(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS resenhas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    album_id INT UNSIGNED NOT NULL,
    utilizador_id INT UNSIGNED NOT NULL,
    nota DECIMAL(2,1) NOT NULL,
    texto TEXT NOT NULL,
    data_publicacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_resenhas_nota CHECK (nota BETWEEN 0 AND 5),
    CONSTRAINT fk_resenhas_album FOREIGN KEY (album_id) REFERENCES albuns(id) ON DELETE CASCADE,
    CONSTRAINT fk_resenhas_usuario FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id) ON DELETE CASCADE,
    INDEX idx_resenhas_album_data (album_id, data_publicacao),
    INDEX idx_resenhas_usuario (utilizador_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS utilizadores_generos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    utilizador_id INT UNSIGNED NOT NULL,
    genero VARCHAR(100) NOT NULL,
    UNIQUE KEY uq_usuario_genero (utilizador_id, genero),
    CONSTRAINT fk_generos_usuario FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id) ON DELETE CASCADE
) ENGINE=InnoDB;
