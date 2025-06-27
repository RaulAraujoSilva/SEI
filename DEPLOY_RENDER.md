# 🚀 Deploy no Render.com - SEI-Com AI

## 📋 Visão Geral

Este guia fornece instruções para fazer deploy do SEI-Com AI no Render.com usando o plano gratuito.

## 🔧 Configuração Preparada

### ✅ Arquivos Criados
- `Dockerfile` - Container principal para o backend
- `render.yaml` - Configuração automática dos serviços
- Este guia de deploy

## 🚀 Deploy Rápido (Opção 1 - Serviço Único)

### 1. **Backend Only (Mais Simples)**

1. **Acesse o Render.com** e faça login
2. **Clique em "New +"** → **"Web Service"**
3. **Conecte seu repositório** GitHub (https://github.com/RaulAraujoSilva/SEI)
4. **Configure o serviço:**
   ```
   Name: sei-com-ai
   Environment: Docker
   Plan: Free
   ```

5. **Variáveis de Ambiente:**
   ```
   ENVIRONMENT=production
   DATABASE_URL=sqlite:///./sei_scraper.db
   DEBUG=false
   CORS_ORIGINS=*
   ```

6. **Deploy automático!** ✅

### URLs de Acesso:
- **API:** `https://sei-jxdn.onrender.com`
- **Docs:** `https://sei-jxdn.onrender.com/docs`
- **Health:** `https://sei-jxdn.onrender.com/health`

## 🏗️ Deploy Completo (Opção 2 - Multi-Serviços)

### 1. **Deploy via render.yaml**

1. **Push o render.yaml** para seu repositório
2. **No Render Dashboard** → **"New +"** → **"Blueprint"**
3. **Conecte seu repositório**
4. **Render criará automaticamente:**
   - Backend API
   - Frontend Static Site
   - PostgreSQL Database
   - Redis Cache

### 2. **Configuração Manual (Alternativa)**

#### **Backend API:**
```yaml
Name: sei-com-ai-backend
Environment: Python 3.11
Build Command: pip install -r backend/requirements.txt
Start Command: cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
Health Check Path: /health
```

**Environment Variables:**
```
ENVIRONMENT=production
DEBUG=false
DATABASE_URL=sqlite:///./sei_scraper.db  # Fallback SQLite
CORS_ORIGINS=https://sei-jxdn.onrender.com
```

#### **Frontend (Opcional):**
```yaml
Name: sei-com-ai-frontend
Environment: Static Site
Build Command: cd frontend && npm install && npm run build
Publish Directory: frontend/build
```

## 🔄 Configurações Específicas Render

### 1. **Variáveis de Ambiente Essenciais**

```bash
# Essenciais
ENVIRONMENT=production
PORT=10000  # Render define automaticamente
DEBUG=false

# Database (escolha uma)
DATABASE_URL=sqlite:///./sei_scraper.db  # Simples
# OU
DATABASE_URL=postgresql://[render-db-url]  # Avançado

# CORS (ajuste seu domínio)
CORS_ORIGINS=https://sei-jxdn.onrender.com

# Opcional - LLM
OPENAI_API_KEY=sk-your-key-here
DEFAULT_LLM_MODEL=gpt-3.5-turbo
```

### 2. **URLs Típicas do Render**
```
Backend:  https://sei-jxdn.onrender.com
Frontend: https://sei-com-ai-frontend.onrender.com
```

## ⚡ Solução do Erro Atual

### **Problema:** `no such file or directory: Dockerfile`

✅ **Solucionado!** Agora temos `Dockerfile` na raiz do projeto.

### **Passos para Re-deploy:**

1. **Commit e Push** as mudanças:
   ```bash
   git add .
   git commit -m "feat: Add Render.com deploy configuration"
   git push origin main
   ```

2. **No Render:** Clique em **"Manual Deploy"** ou aguarde deploy automático

3. **Verifique logs** na dashboard do Render

## 🔍 Troubleshooting

### **Build Errors Comuns:**

#### 1. **ModuleNotFoundError: No module named 'app'**
✅ **Resolvido:** Dockerfile agora configura PYTHONPATH corretamente

#### 2. **Port Binding Error**
✅ **Resolvido:** Usando variável `$PORT` do Render

#### 3. **Database Connection Error**
- **SQLite:** Funciona automaticamente
- **PostgreSQL:** Configure DATABASE_URL com credentials do Render

### **Logs Úteis:**
```bash
# No Render Dashboard
1. Acesse seu serviço
2. Clique na aba "Logs"
3. Monitore build e runtime
```

## 📊 Monitoramento

### **Health Checks Configurados:**
- **Endpoint:** `/health`
- **Interval:** 30s
- **Timeout:** 10s

### **URLs de Teste:**
```bash
# API Status
curl https://sei-jxdn.onrender.com/health

# API Docs
https://sei-jxdn.onrender.com/docs

# Processos (exemplo)
https://sei-jxdn.onrender.com/api/v1/processos
```

## 🎯 Otimizações Render

### **1. Performance**
- ✅ Health check configurado
- ✅ Variáveis ambiente otimizadas
- ✅ Build cache habilitado

### **2. Custos**
- ✅ Plano Free configurado
- ✅ SQLite para reduzir dependências
- ✅ Sleep mode automático (inatividade)

### **3. Segurança**
- ✅ DEBUG=false em produção
- ✅ CORS configurado
- ✅ Environment variables protegidas

## 📋 Checklist Deploy

### **Pré-Deploy:**
- [x] Dockerfile criado na raiz
- [x] render.yaml configurado
- [x] Variáveis ambiente definidas
- [x] CORS configurado
- [x] Health check implementado

### **Deploy:**
- [ ] Serviço criado no Render
- [ ] Repositório conectado
- [ ] Build concluído com sucesso
- [ ] Health check passando
- [ ] API respondendo

### **Pós-Deploy:**
- [ ] URLs testadas
- [ ] Logs verificados
- [ ] Performance monitorada
- [ ] Documentação atualizada

## 🆘 Suporte

### **Problemas Comuns:**

1. **Build Timeout**
   - Render Free tem limite de 10min
   - Otimizar requirements.txt

2. **Sleep Mode**
   - Render Free "dorme" após 15min inatividade
   - Primeiro request pode ser lento

3. **Database Limits**
   - PostgreSQL Free: 1GB storage
   - SQLite: Sem limites, mas não persistente

### **Monitoramento:**
- **Status Page:** status.render.com
- **Logs:** Dashboard → Logs tab
- **Metrics:** Dashboard → Metrics tab

---

## ✅ Deploy Concluído

Após seguir este guia:

- ✅ **SEI-Com AI** rodando no Render
- ✅ **API** acessível via HTTPS
- ✅ **Documentação** disponível em /docs
- ✅ **Health checks** funcionando
- ✅ **Logs** sendo coletados

**🎉 Sistema em produção no Render.com!** 🚀

### **URLs Finais:**
```
🌐 API: https://sei-jxdn.onrender.com
�� Docs: https://sei-jxdn.onrender.com/docs
💚 Health: https://sei-jxdn.onrender.com/health
```

## ✅ **CONFIGURAÇÃO COMPLETA DO DEPLOY**

### 🔗 **URLs do Projeto**
- **API:** https://sei-jxdn.onrender.com
- **Docs:** https://sei-jxdn.onrender.com/docs
- **Health:** https://sei-jxdn.onrender.com/health

### 📝 **Status:** ✅ **PRONTO PARA DEPLOY**

## 🛠️ **Instruções de Deploy**

### 1. **Conectar Repositório**
```bash
# No painel do Render.com:
1. New Web Service
2. Connect GitHub: seu-usuario/SEI-Com-AI
3. Name: sei-com-ai-backend  
4. Environment: Python
5. Build Command: pip install -r backend/requirements.txt
6. Start Command: cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### 2. **⚠️ CONFIGURAR VARIÁVEIS DE AMBIENTE MANUALMENTE**

**No painel do Render.com → Environment Variables:**

```bash
# 🔐 OpenAI Configuration (OBRIGATÓRIO)
OPENAI_API_KEY=sua-chave-openai-aqui
OPENAI_ORGANIZATION_ID=org-your-organization-id-here

# 🔒 Security (opcional)
SECRET_KEY=sei-com-ai-super-secret-key-production-2025-render-deploy-secure

# 🌐 CORS (opcional - já configurado no render.yaml)
CORS_ORIGINS=https://sei-jxdn.onrender.com,https://seu-frontend.com
```

### 3. **Database - SQLite Fallback**
O sistema está configurado para usar **SQLite como fallback** automaticamente.
- ✅ **Não precisa criar banco PostgreSQL**
- ✅ **Funciona imediatamente com SQLite**
- ✅ **Fallback automático em caso de erro**

### 4. **Deploy Automático**
O `render.yaml` está configurado para deploy automático.

## 🔧 **Configuração render.yaml**

```yaml
services:
  - type: web
    name: sei-com-ai-backend
    env: python
    plan: free
    buildCommand: "pip install -r backend/requirements.txt"
    startCommand: "cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT"
    healthCheckPath: /health
    envVars:
      - key: ENVIRONMENT
        value: production
      - key: DATABASE_URL
        value: sqlite:///./sei_scraper.db  # Fallback SQLite
      - key: CORS_ORIGINS
        value: "https://sei-jxdn.onrender.com"
      - key: DEFAULT_LLM_MODEL
        value: gpt-4.1-mini-2025-04-14
```

## 🔐 **Segurança**

### ✅ **Boas Práticas Implementadas**
1. **Chaves OpenAI** protegidas (não commitadas no código)
2. **SQLite fallback** automático (sem dependência PostgreSQL)
3. **Environment** específico para produção
4. **CORS** configurado para URL real

### ⚠️ **Configurações Obrigatórias**
- `OPENAI_API_KEY` - **DEVE ser configurada manualmente**
- `OPENAI_ORGANIZATION_ID` - **DEVE ser configurada manualmente**

## 🧪 **Testes**

### Endpoints de Teste:
```bash
# Health Check
curl https://sei-jxdn.onrender.com/health

# API Docs
https://sei-jxdn.onrender.com/docs

# Configuração LLM
curl https://sei-jxdn.onrender.com/api/v1/llm/config

# Estatísticas LLM
curl https://sei-jxdn.onrender.com/api/v1/llm/statistics
```

## 🔄 **Auto-Deploy**

Configurado para deploy automático a cada push na branch `main`:
- ✅ Build automático
- ✅ Variáveis de ambiente preservadas
- ✅ SQLite funciona imediatamente
- ✅ Health checks configurados

## 📊 **Monitoramento**

### Logs de Deploy:
```bash
# Ver logs no painel do Render
https://dashboard.render.com/
```

### Verificação de Funcionamento:
1. **API Health:** ✅ `/health`
2. **Database:** ✅ SQLite (fallback automático)
3. **OpenAI:** ⚠️ Configurar chaves manualmente
4. **CORS:** ✅ Configurado para produção

## 🆘 **Solução de Problemas**

### Erro: "OPENAI_API_KEY não configurada"
1. Acesse painel do Render
2. Environment Variables
3. Adicione `OPENAI_API_KEY` com sua chave

### Erro: Database Connection
- ✅ **Não deve acontecer** - SQLite fallback automático
- Se acontecer, verifique logs para detalhes

### Erro: Application Startup Failed
1. Verifique environment variables obrigatórias
2. Confirme que health check responde
3. Consulte logs detalhados no painel

---

**Status:** ✅ **DEPLOY CONFIGURADO COM FALLBACK SEGURO** - Configure as chaves OpenAI e deploy! 