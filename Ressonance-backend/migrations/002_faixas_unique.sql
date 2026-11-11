
-- Migração 002: Unicidade da numeração das faixas
-- Projeto Ressonance
--
-- Objetivo:
-- Impedir que um álbum possua duas faixas
-- com o mesmo numero_faixa.
--
-- Pré-requisitos:
-- 1. Verificar se existem registros duplicados.
-- 2. Realizar backup do banco.
-- 3. Confirmar que não existe índice UNIQUE equivalente.
--
-- Esta migração destina-se a bancos antigos.
-- Não executar novamente em bancos já atualizados.

ALTER TABLE faixas
ADD CONSTRAINT uq_faixas_album_numero
UNIQUE (album_id, numero_faixa);
