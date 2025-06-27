# 🚀 Deploy SEI-Com AI no Render.com

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
- **API:** `https://sei-com-ai.onrender.com`
- **Docs:** `https://sei-com-ai.onrender.com/docs`
- **Health:** `https://sei-com-ai.onrender.com/health`

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
DATABASE_URL=postgresql://[render-fornece]
CORS_ORIGINS=https://[your-frontend].onrender.com
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
CORS_ORIGINS=https://seu-frontend.onrender.com

# Opcional - LLM
OPENAI_API_KEY=sk-your-key-here
DEFAULT_LLM_MODEL=gpt-3.5-turbo
```

### 2. **URLs Típicas do Render**
```
Backend:  https://sei-com-ai.onrender.com
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
curl https://seu-app.onrender.com/health

# API Docs
https://seu-app.onrender.com/docs

# Processos (exemplo)
https://seu-app.onrender.com/api/v1/processos
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
🌐 API: https://[seu-app].onrender.com
📚 Docs: https://[seu-app].onrender.com/docs
💚 Health: https://[seu-app].onrender.com/health
``` 