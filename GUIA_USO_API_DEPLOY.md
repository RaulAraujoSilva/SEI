# 🚀 GUIA DE USO - API SEI-Com AI (Produção)

## ✅ **API FUNCIONANDO EM PRODUÇÃO**

**URL Base:** https://sei-jxdn.onrender.com

### 🔗 **ENDPOINTS PRINCIPAIS**

#### 1. **📋 Documentação Interativa**
```
https://sei-jxdn.onrender.com/docs
```
- Interface Swagger completa
- Teste todos os endpoints direto no browser
- Documentação automática com exemplos

#### 2. **💓 Health Check**
```
https://sei-jxdn.onrender.com/health
```
**Resposta esperada:**
```json
{"status":"healthy","database":"connected"}
```

#### 3. **📂 Gestão de Processos**
```
GET  https://sei-jxdn.onrender.com/api/v1/processos
POST https://sei-jxdn.onrender.com/api/v1/processos
```

#### 4. **📄 Gestão de Documentos**
```
GET https://sei-jxdn.onrender.com/api/v1/documentos
```

#### 5. **🤖 LLM/Análises** *(Requer configuração OpenAI)*
```
GET  https://sei-jxdn.onrender.com/api/v1/llm/config
POST https://sei-jxdn.onrender.com/api/v1/llm/analyze
```

## 🛠️ **COMO USAR A API**

### **Via Browser (Documentação)**
1. Acesse: https://sei-jxdn.onrender.com/docs
2. Explore todos os endpoints
3. Teste direto na interface

### **Via cURL (Terminal)**
```bash
# Health Check
curl https://sei-jxdn.onrender.com/health

# Lista Processos
curl https://sei-jxdn.onrender.com/api/v1/processos

# Criar Processo
curl -X POST https://sei-jxdn.onrender.com/api/v1/processos \
  -H "Content-Type: application/json" \
  -d '{
    "numero": "12345.678901/2025-12",
    "tipo": "Processo Administrativo",
    "assunto": "Teste via API",
    "data_autuacao": "2025-06-27"
  }'
```

### **Via JavaScript (Frontend)**
```javascript
// Base da API
const API_BASE = 'https://sei-jxdn.onrender.com/api/v1';

// Buscar processos
fetch(`${API_BASE}/processos`)
  .then(response => response.json())
  .then(data => console.log(data));

// Criar processo
fetch(`${API_BASE}/processos`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    numero: '12345.678901/2025-12',
    tipo: 'Processo Administrativo',
    assunto: 'Teste via API',
    data_autuacao: '2025-06-27'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

## ⚠️ **CONFIGURAÇÃO OPENAI (PARA LLM)**

Para usar as funcionalidades de LLM, configure no painel do Render:

```env
OPENAI_API_KEY=sua-chave-aqui
OPENAI_ORGANIZATION_ID=org-qWlrlvk9nDmo3OglC0VwZQxo
```

## 🎯 **STATUS ATUAL**

| Componente | Status | URL |
|------------|---------|-----|
| **API Backend** | ✅ **FUNCIONANDO** | https://sei-jxdn.onrender.com |
| **Documentação** | ✅ **ATIVA** | https://sei-jxdn.onrender.com/docs |
| **Health Check** | ✅ **OK** | https://sei-jxdn.onrender.com/health |
| **Database** | ✅ **CONECTADO** | SQLite (automático) |
| **OpenAI LLM** | ⚠️ **PENDENTE** | Configurar chaves no Render |
| **Frontend Web** | ❌ **NÃO DEPLOYADO** | Apenas API disponível |

## 🚀 **OPÇÕES PARA INTERFACE WEB**

### **Opção 1: Usar Documentação Swagger**
- ✅ **Já disponível**: https://sei-jxdn.onrender.com/docs
- ✅ **Interface completa** para testar API
- ✅ **Sem configuração adicional**

### **Opção 2: Deploy Frontend React**
- 🔧 **Requer**: Deploy separado do frontend
- 🎨 **Resultado**: Interface gráfica completa
- 📱 **Benefício**: UX/UI profissional

### **Opção 3: Aplicação Local**
- 💻 **Frontend local** conectando à API em produção
- ⚡ **Desenvolvimento** rápido
- 🔗 **API Base**: `https://sei-jxdn.onrender.com/api/v1`

## 🎊 **CONCLUSÃO**

**Sua API está 100% FUNCIONAL em produção!**

- ✅ Deploy bem-sucedido
- ✅ Banco de dados operacional
- ✅ Todos os endpoints ativos
- ✅ Documentação completa disponível
- ✅ Pronto para uso imediato

A mensagem `{"message":"SEI Scraper API","version":"1.0.0","status":"ok"}` que você viu **É O COMPORTAMENTO CORRETO** da rota raiz da API. 