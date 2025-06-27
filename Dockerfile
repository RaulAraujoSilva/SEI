# Dockerfile para Deploy Render.com - SEI-Com AI
FROM python:3.11-slim

# Definir diretório de trabalho
WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements primeiro (para cache do Docker)
COPY backend/requirements.txt .

# Instalar dependências Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código da aplicação backend
COPY backend/ .

# Criar diretório para documentos
RUN mkdir -p /app/documents

# Variáveis de ambiente para produção
ENV PYTHONPATH=/app
ENV ENVIRONMENT=production
ENV PORT=8000

# Expor porta (Render usa a variável PORT)
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:$PORT/health || exit 1

# Comando de start - Render define a PORT automaticamente
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT 