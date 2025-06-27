# 🚀 Guia de Deploy - SEI-Com AI Production

## 📋 Visão Geral

Este guia fornece instruções completas para fazer deploy do sistema SEI-Com AI em produção usando Docker e PostgreSQL.

## 🏗️ Arquitetura de Produção

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   PostgreSQL    │
│   (React+Nginx) │────│   (FastAPI)     │────│   Database      │
│   Port: 3000    │    │   Port: 8000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                        ┌─────────────────┐
                        │   Redis Cache   │
                        │   Port: 6379    │
                        └─────────────────┘
```

## 🐳 1. Deploy com Docker Compose

### Pré-requisitos

- **Docker** 20.10+
- **Docker Compose** 2.0+
- **2GB RAM** mínimo
- **5GB** espaço em disco

### Comando de Deploy

```bash
# 1. Clone o repositório
git clone <seu-repositorio>
cd SEI-Com-AI

# 2. Configurar variáveis de ambiente
cp backend/.env.example backend/.env
# Edite backend/.env com suas configurações

# 3. Build e start completo
docker-compose up -d --build

# 4. Verificar status
docker-compose ps
```

### Logs e Monitoramento

```bash
# Ver todos os logs
docker-compose logs -f

# Logs específicos por serviço
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Health checks
curl http://localhost:8000/health  # Backend
curl http://localhost:3000/health  # Frontend
```

## 🗄️ 2. Configuração PostgreSQL

### Variáveis de Ambiente Padrão

```bash
POSTGRES_DB=sei_scraper
POSTGRES_USER=sei_user
POSTGRES_PASSWORD=sei_password  # ALTERE EM PRODUÇÃO!
```

### Inicialização do Banco

O banco é inicializado automaticamente via `init-db.sql`:

```sql
-- Criação de schemas e configurações iniciais
-- Ver arquivo: init-db.sql
```

### Backup e Restore

```bash
# Backup
docker-compose exec postgres pg_dump -U sei_user sei_scraper > backup.sql

# Restore
docker-compose exec -T postgres psql -U sei_user sei_scraper < backup.sql
```

## ⚙️ 3. Configurações de Ambiente

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://sei_user:sei_password@postgres:5432/sei_scraper

# Security
SECRET_KEY=your-super-secret-key-here-minimum-32-characters
DEBUG=false

# CORS
CORS_ORIGINS=http://localhost:3000,https://seu-dominio.com

# LLM
DEFAULT_LLM_PROVIDER=openai
DEFAULT_LLM_MODEL=gpt-3.5-turbo
OPENAI_API_KEY=sk-your-openai-key-here
```

### Frontend (nginx.conf)

```nginx
# Proxy reverso configurado para /api/
location /api/ {
    proxy_pass http://backend:8000/api/;
}
```

## 🔧 4. Configuração Nginx Avançada

### SSL/HTTPS (Produção)

```nginx
server {
    listen 443 ssl http2;
    server_name seu-dominio.com;
    
    ssl_certificate /etc/ssl/certs/seu-cert.pem;
    ssl_certificate_key /etc/ssl/private/sua-key.pem;
    
    location / {
        proxy_pass http://frontend:80;
    }
    
    location /api/ {
        proxy_pass http://backend:8000/api/;
    }
}
```

### Load Balancer

```nginx
upstream backend_servers {
    server backend1:8000;
    server backend2:8000;
    server backend3:8000;
}

location /api/ {
    proxy_pass http://backend_servers/api/;
}
```

## 📊 5. Monitoramento e Saúde

### Health Checks Configurados

- **Backend:** `GET /health` - Retorna status da API e banco
- **Frontend:** `GET /health` - Retorna "healthy"
- **PostgreSQL:** `pg_isready` - Verificação conexão
- **Redis:** `redis-cli ping` - Verificação cache

### Métricas Importantes

```bash
# Uso de recursos
docker stats

# Espaço em disco
docker system df

# Logs de erro
docker-compose logs --tail=100 | grep ERROR
```

## 🔒 6. Segurança em Produção

### Configurações Essenciais

1. **Alterar senhas padrão**
   ```bash
   POSTGRES_PASSWORD=senha-super-forte-aqui
   SECRET_KEY=chave-secreta-32-caracteres-minimo
   ```

2. **Configurar CORS corretamente**
   ```bash
   CORS_ORIGINS=https://seu-dominio.com,https://app.seu-dominio.com
   ```

3. **Headers de segurança** (já configurados no nginx)
   - X-Frame-Options
   - X-XSS-Protection
   - Content-Security-Policy

4. **Firewall**
   ```bash
   # Abrir apenas portas necessárias
   ufw allow 80    # HTTP
   ufw allow 443   # HTTPS
   ufw allow 22    # SSH
   ```

## 🚦 7. Comandos de Gestão

### Start/Stop Sistema

```bash
# Iniciar todos os serviços
docker-compose up -d

# Parar todos os serviços
docker-compose down

# Restart específico
docker-compose restart backend
docker-compose restart frontend
```

### Atualizações

```bash
# Pull latest images
docker-compose pull

# Rebuild e restart
docker-compose up -d --build

# Zero downtime update (com load balancer)
docker-compose up -d --no-deps backend
```

### Limpeza

```bash
# Remover containers parados
docker container prune

# Remover imagens não utilizadas
docker image prune

# Limpeza completa (CUIDADO!)
docker system prune -a
```

## 📈 8. Escalabilidade

### Horizontal Scaling

```yaml
# docker-compose.yml
services:
  backend:
    scale: 3  # 3 instâncias do backend
    
  frontend:
    scale: 2  # 2 instâncias do frontend
```

### Vertical Scaling

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
```

## 🔍 9. Troubleshooting

### Problemas Comuns

#### Backend não conecta no PostgreSQL

```bash
# Verificar status do PostgreSQL
docker-compose logs postgres

# Testar conexão manual
docker-compose exec backend python -c "
from app.database.connection import get_db_connection
print('✅ Conexão OK' if get_db_connection() else '❌ Erro conexão')
"
```

#### Frontend não carrega

```bash
# Verificar build
docker-compose logs frontend

# Rebuild frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

#### Erro de CORS

```bash
# Verificar configuração
docker-compose exec backend env | grep CORS

# Logs de CORS
docker-compose logs backend | grep CORS
```

### Logs Detalhados

```bash
# Debug completo
docker-compose up --build

# Logs específicos com timestamps
docker-compose logs -f -t backend 2>&1 | grep ERROR
```

## 📋 10. Checklist de Deploy

### Pré-Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Senhas de produção definidas
- [ ] Domínio e DNS configurados
- [ ] SSL/TLS certificados instalados
- [ ] Firewall configurado

### Deploy

- [ ] `docker-compose up -d --build` executado
- [ ] Health checks passando
- [ ] Frontend acessível via browser
- [ ] Backend API respondendo
- [ ] PostgreSQL conectando

### Pós-Deploy

- [ ] Backup inicial criado
- [ ] Monitoramento configurado
- [ ] Logs sendo coletados
- [ ] Performance baseline estabelecida
- [ ] Documentação atualizada

## 🎯 URLs de Produção

| Serviço | URL | Porta |
|---------|-----|-------|
| **Frontend** | http://localhost:3000 | 3000 |
| **Backend API** | http://localhost:8000 | 8000 |
| **API Docs** | http://localhost:8000/docs | 8000 |
| **PostgreSQL** | localhost:5432 | 5432 |
| **Redis** | localhost:6379 | 6379 |

## 📞 Suporte

### Comandos de Diagnóstico

```bash
# Status geral
./scripts/health-check.sh

# Informações do sistema
docker version
docker-compose version
docker info
```

### Contatos de Emergência

- **DevOps:** devops@sefaz.rj.gov.br
- **Backend:** backend@sefaz.rj.gov.br  
- **Frontend:** frontend@sefaz.rj.gov.br

---

## ✅ Deploy Concluído

Após seguir este guia, você deve ter:

- ✅ **Sistema completo** rodando em containers
- ✅ **PostgreSQL** configurado e funcionando
- ✅ **Frontend** servido via Nginx otimizado
- ✅ **Backend** API disponível e documentada
- ✅ **Monitoramento** básico funcionando
- ✅ **Segurança** configurações aplicadas

**🎉 SEI-Com AI em produção com sucesso!** 🚀 