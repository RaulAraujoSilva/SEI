-- Script de inicialização do banco de dados para desenvolvimento

-- Criar banco de teste se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'sei_scraper_test') THEN
        CREATE DATABASE sei_scraper_test;
    END IF;
END
$$;

-- Extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Comentários nas tabelas (serão criadas pelo SQLAlchemy)
COMMENT ON SCHEMA public IS 'Schema principal do SEI Scraper';

-- Configurações de performance para desenvolvimento
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET work_mem = '8MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';

-- Recarregar configuração
SELECT pg_reload_conf(); 