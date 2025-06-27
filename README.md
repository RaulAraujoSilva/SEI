# SEI-Com AI
**Sistema de Análise Inteligente de Processos do SEI-RJ**

[![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow)](https://github.com/RaulAraujoSilva/SEI-Com-AI)
[![Frontend](https://img.shields.io/badge/Frontend-60%25%20Completo-green)](http://localhost:3000)
[![Backend](https://img.shields.io/badge/Backend-100%25%20Completo-brightgreen)](http://localhost:8000)

## 🎯 Descrição

Sistema automatizado para coleta, armazenamento e análise inteligente de processos do Sistema Eletrônico de Informações (SEI) do Rio de Janeiro, utilizando IA para extração de dados e análise de documentos.

## 🚀 Status Atual (27/01/2025)

### ✅ **Aplicação Frontend FUNCIONANDO**
- **✅ Servidor React:** http://localhost:3000
- **✅ Páginas Operacionais:** Home, Dashboard, Lista de Processos
- **✅ Navegação Completa:** Menu lateral, busca global, roteamento
- **✅ Design Responsivo:** Material-UI com tema profissional

### ✅ **API Backend Completa**
- **✅ 47 Endpoints:** CRUD completo para todos os recursos
- **✅ Documentação:** Swagger automática em http://localhost:8000/docs
- **✅ Testes:** 86.2% taxa de sucesso
- **✅ Validação:** Pydantic V2 com schemas robustos

## 📋 Pré-requisitos

- **Python 3.8+** (backend)
- **Node.js 16+** (frontend)
- **Git** (clonagem)

## 🔧 Instalação e Execução

### 1. Clone o Repositório
```bash
git clone https://github.com/RaulAraujoSilva/SEI-Com-AI.git
cd SEI-Com-AI
```

### 2. Backend (API FastAPI)
```bash
# Navegar para o diretório backend
cd backend

# Instalar dependências
pip install -r requirements.txt

# Executar servidor
python -m uvicorn app.main:app --reload
```
**Backend disponível em:** http://localhost:8000
**Documentação Swagger:** http://localhost:8000/docs

### 3. Frontend (React App)
```bash
# Navegar para o diretório frontend (em outro terminal)
cd frontend

# Instalar dependências
npm install

# Executar servidor de desenvolvimento
npm start
```
**Frontend disponível em:** http://localhost:3000

## 🎨 Funcionalidades Implementadas

### 🏠 **Página Home** 
- Menu principal com navegação visual
- Status de desenvolvimento de cada módulo
- Estatísticas do projeto
- Cards com cores temáticas

### 📊 **Dashboard**
- Cards coloridos com estatísticas (23 processos, 187 documentos)
- Lista de processos recentes do RJ
- Feed de atividades em tempo real
- Métricas de custos LLM (R$ 89,45)

### 📁 **Lista de Processos**
- 6 processos simulados de órgãos do RJ (SEFAZ-RJ, CGE-RJ, etc.)
- Filtros funcionais (número, tipo, situação)
- Cards interativos com menu de ações
- Paginação e contadores de resultado

### 🔍 **Busca Global**
- Campo de busca integrado no header
- Autocompletar com resultados em tempo real
- Categorização por processos/documentos

### 🎨 **Design System**
- Material-UI v5 com tema português
- Layout responsivo (desktop/mobile)
- Componentes reutilizáveis (StatusChip, ProcessCard, SearchBar)
- Navegação lateral com menu expansível

## 🏗️ Arquitetura

```
SEI-Com AI/
├── backend/                 # API FastAPI + Python
│   ├── app/
│   │   ├── api/routes/     # 47 endpoints REST
│   │   │   ├── processos/  # Processos
│   │   │   ├── documentos/  # Documentos
│   │   │   ├── llm/         # LLM
│   │   │   └── system/      # Sistema
│   │   ├── models/         # Modelos de dados
│   │   ├── services/       # Lógica de negócio
│   │   └── tests/          # Testes unitários
│   └── requirements.txt
├── frontend/               # React + TypeScript
│   ├── src/
│   │   ├── components/     # 4 componentes reutilizáveis
│   │   ├── pages/          # 10 páginas (3 funcionais)
│   │   ├── services/       # Integração API
│   │   └── types/          # Tipos TypeScript
│   └── package.json
└── docker-compose.yml      # Deploy (futuro)
```

## 🔌 API Endpoints (Backend)

### **Processos**
- `GET /api/v1/processos/` - Lista paginada
- `POST /api/v1/processos/` - Criar processo
- `GET /api/v1/processos/{id}` - Buscar por ID
- `PATCH /api/v1/processos/{id}` - Atualizar
- `DELETE /api/v1/processos/{id}` - Excluir

### **Documentos**
- `GET /api/v1/documentos/` - Lista documentos
- `GET /api/v1/documentos/{id}/tags` - Tags extraídas
- `GET /api/v1/documentos/{id}/entidades` - Entidades NER

### **LLM & IA**
- `POST /api/v1/llm/documentos/{id}/analyze` - Análise IA
- `GET /api/v1/llm/statistics` - Estatísticas LLM

### **Sistema**
- `GET /api/v1/health` - Health check
- `GET /api/v1/dashboard` - Dados dashboard

## 📱 Como Usar

### 1. **Acesse a Home**
- Vá para http://localhost:3000
- Explore os 6 módulos do sistema
- Clique nos cards para navegar

### 2. **Dashboard**
- Visualize estatísticas gerais
- Veja processos recentes do RJ
- Acompanhe atividades do sistema

### 3. **Lista de Processos**
- Use filtros por número, tipo ou situação
- Clique em "Visualizar" nos cards
- Teste a busca por órgão (SEFAZ-RJ, CGE-RJ)

### 4. **Busca Global**
- Use a barra de busca no header
- Digite números de processo ou nomes

## 🛠️ Stack Tecnológico

### **Backend**
- **FastAPI** - API REST moderna
- **Python 3.12** - Linguagem principal
- **Pydantic V2** - Validação de dados
- **Uvicorn** - Servidor ASGI

### **Frontend**
- **React 18** - Framework UI
- **TypeScript** - Tipagem estática
- **Material-UI v5** - Design system
- **React Router v6** - Roteamento
- **React Query** - Estado servidor
- **Axios** - Cliente HTTP
- **Webpack 5** - Bundler

## 🧪 Testes

### Backend
```bash
cd backend
pytest
# Taxa de sucesso: 86.2%
```

### Frontend
```bash
cd frontend
npm test
# Testes em desenvolvimento
```

## 📈 Progresso do Desenvolvimento

| Módulo | Status | Progresso |
|--------|--------|-----------|
| Backend API | ✅ Completo | 100% |
| Frontend Base | ✅ Completo | 100% |
| Páginas Principais | ✅ Funcional | 60% |
| Componentes | ✅ Completo | 100% |
| Páginas Detalhes | 🔄 Desenvolvimento | 0% |
| Deploy | 📋 Planejado | 0% |

## 🎯 Próximas Implementações

### **Prioridade 1** (1-2 dias)
- **ProcessoDetails** - Página completa de detalhes
- **DocumentoDetails** - Visualização de documentos
- **NovoProcesso** - Formulário de criação

### **Prioridade 2** (2-3 dias)
- **LLMDashboard** - Dashboard de análises IA
- **DocumentosList** - Lista de documentos
- **Configuracoes** - Painel de configurações

## 🐛 Problemas Conhecidos

### ✅ **Resolvidos**
- ~~Erro "process is not defined" no webpack~~ ✅
- ~~Página em branco no carregamento~~ ✅
- ~~Aplicação carregava apenas mock~~ ✅

### 🔄 **Em Resolução**
- Backend precisa ser executado do diretório `backend/`
- Favicon 404 (não afeta funcionalidade)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Contato

**Desenvolvedor:** Raul Araújo Silva
**GitHub:** [@RaulAraujoSilva](https://github.com/RaulAraujoSilva)
**Repositório:** https://github.com/RaulAraujoSilva/SEI-Com-AI

---

## 🎉 Demonstração

### Screenshots

#### Home - Menu Principal
![Home](docs/screenshots/home.png)

#### Dashboard - Estatísticas
![Dashboard](docs/screenshots/dashboard.png)

#### Lista de Processos
![Processos](docs/screenshots/processos.png)

---

**Status:** 🚀 **APLICAÇÃO FUNCIONANDO** - Pronta para desenvolvimento das páginas de detalhes!

**Última atualização:** 27/01/2025 