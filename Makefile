# Makefile para SEI Scraper

.PHONY: help setup test test-coverage lint format clean dev build up down logs

help:  ## Mostra esta ajuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

setup:  ## Setup inicial do projeto
	@echo "🚀 Configurando ambiente de desenvolvimento..."
	cd backend && pip install -r requirements.txt
	@echo "✅ Setup concluído!"

test:  ## Executa todos os testes
	@echo "🧪 Executando testes..."
	cd backend && python -m pytest -v

test-unit:  ## Executa apenas testes unitários  
	@echo "🧪 Executando testes unitários..."
	cd backend && python -m pytest -v -m unit

test-db:  ## Executa testes de banco de dados
	@echo "🧪 Executando testes de banco..."
	cd backend && python -m pytest -v -m db

test-integration:  ## Executa testes de integração
	@echo "🧪 Executando testes de integração..." 
	cd backend && python -m pytest -v -m integration

test-coverage:  ## Executa testes com coverage
	@echo "📊 Executando testes com coverage..."
	cd backend && python -m pytest --cov=app --cov-report=html --cov-report=term-missing

lint:  ## Executa linting do código
	@echo "🔍 Executando linting..."
	cd backend && python -m flake8 app/
	cd backend && python -m mypy app/ --ignore-missing-imports

format:  ## Formata o código
	@echo "✨ Formatando código..."
	cd backend && python -m black app/
	cd backend && python -m isort app/

clean:  ## Limpa arquivos temporários
	@echo "🧹 Limpando arquivos temporários..."
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name ".pytest_cache" -delete
	rm -rf backend/htmlcov/
	rm -f backend/.coverage

dev:  ## Inicia desenvolvimento local
	@echo "🚀 Iniciando desenvolvimento..."
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

build:  ## Build das imagens Docker
	@echo "🐳 Fazendo build das imagens..."
	docker-compose build

up:  ## Sobe os serviços com Docker Compose
	@echo "🐳 Subindo serviços..."
	docker-compose up -d

down:  ## Para os serviços Docker
	@echo "🐳 Parando serviços..."
	docker-compose down

logs:  ## Mostra logs dos serviços
	docker-compose logs -f

test-docker:  ## Executa testes no container Docker
	@echo "🐳 Executando testes no Docker..."
	docker-compose exec backend python -m pytest -v

# Comandos de banco de dados
db-create:  ## Cria as tabelas do banco
	@echo "📦 Criando tabelas do banco..."
	cd backend && python -c "from app.database.connection import create_tables; create_tables()"

db-drop:  ## Remove as tabelas do banco  
	@echo "🗑️ Removendo tabelas do banco..."
	cd backend && python -c "from app.database.connection import drop_tables; drop_tables()"

db-reset:  ## Reseta o banco (drop + create)
	@echo "🔄 Resetando banco de dados..."
	make db-drop
	make db-create

# Fase 1 - Validação
validate-phase1:  ## Valida se Fase 1 está completa
	@echo "✅ Validando Fase 1: Infraestrutura Base..."
	@echo "📋 Checklist Fase 1:"
	@echo "  1. Estrutura do projeto criada"
	@echo "  2. Modelos de dados implementados" 
	@echo "  3. Configuração do banco funcionando"
	@echo "  4. Executando testes..."
	make test-unit
	make test-db
	@echo "🎉 Fase 1 concluída com sucesso!"

# Utilitários
install-dev-tools:  ## Instala ferramentas de desenvolvimento
	cd backend && pip install black isort flake8 mypy pytest-cov

check-requirements:  ## Verifica se todas as dependências estão instaladas
	cd backend && pip check 