# 📚 Documentação da API REST - SEI-Com AI

## 🎯 Visão Geral

API REST completa para o sistema SEI-Com AI, implementada com **FastAPI** e **Pydantic V2**. A API oferece acesso completo aos dados de processos SEI, documentos e análises de LLM através de endpoints RESTful.

### 🏆 Status da Implementação
- ✅ **47 endpoints** implementados
- ✅ **Operações CRUD** completas
- ✅ **Validação Pydantic V2**
- ✅ **Documentação OpenAPI/Swagger** automática
- ✅ **Paginação** avançada
- ✅ **Filtros** e busca sofisticados
- ✅ **Tratamento de erros** HTTP adequado

## 🌐 Base URL e Documentação

### URLs Principais
- **API Base:** `http://localhost:8000/api/v1`
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **OpenAPI Schema:** http://localhost:8000/openapi.json

### Autenticação
Atualmente a API não requer autenticação (será implementado em versões futuras).

## 📊 Endpoints por Categoria

### 🏠 Sistema

#### Health Check
```http
GET /api/v1/health
```
Verifica o status da API e conectividade com banco de dados.

**Resposta:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-01-20T10:30:00Z",
  "version": "1.0.0"
}
```

#### Root
```http
GET /api/v1/
```
Informações básicas da API.

---

## 📋 Processos (`/api/v1/processos/`)

### Listar Processos
```http
GET /api/v1/processos/
```

**Parâmetros de Query:**
- `page`: Número da página (padrão: 1)
- `size`: Tamanho da página (padrão: 100, máx: 1000)

**Resposta:**
```json
{
  "items": [
    {
      "id": 1,
      "numero": "SEI-260002/001234/2025",
      "tipo": "Administrativo",
      "assunto": "Solicitação de documentos",
      "interessado": "João Silva",
      "situacao": "Em tramitação",
      "data_autuacao": "2025-01-15",
      "orgao_autuador": "Secretaria de Administração",
      "url_processo": "https://sei.rj.gov.br/...",
      "total_documentos": 5,
      "total_andamentos": 3,
      "documentos_analisados": 2,
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-01-20T09:30:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "size": 100,
  "pages": 2
}
```

### Criar Processo
```http
POST /api/v1/processos/
```

**Body:**
```json
{
  "numero": "SEI-260002/001234/2025",
  "tipo": "Administrativo",
  "assunto": "Solicitação de documentos",
  "interessado": "João Silva",
  "situacao": "Em tramitação",
  "data_autuacao": "2025-01-15",
  "orgao_autuador": "Secretaria de Administração",
  "url_processo": "https://sei.rj.gov.br/..."
}
```

**Resposta:** `201 Created` + dados do processo criado

### Buscar Processo por ID
```http
GET /api/v1/processos/{id}
```

**Resposta:** Dados completos do processo com contadores

### Atualizar Processo
```http
PATCH /api/v1/processos/{id}
```

**Body (campos opcionais):**
```json
{
  "situacao": "Concluído",
  "interessado": "João Silva Santos"
}
```

### Excluir Processo
```http
DELETE /api/v1/processos/{id}
```

**Resposta:** `204 No Content`

### Buscar Processos com Filtros
```http
GET /api/v1/processos/search
```

**Parâmetros de Query:**
- `numero`: Busca por número (parcial)
- `tipo`: Filtro por tipo exato
- `assunto`: Busca por assunto (parcial)
- `interessado`: Busca por interessado (parcial)
- `situacao`: Filtro por situação exata
- `orgao_autuador`: Filtro por órgão (parcial)
- `data_inicio`: Data início (YYYY-MM-DD)
- `data_fim`: Data fim (YYYY-MM-DD)
- `page`: Número da página
- `size`: Tamanho da página

**Exemplo:**
```http
GET /api/v1/processos/search?tipo=Administrativo&situacao=Em%20tramitação&page=1&size=50
```

### Estatísticas de Processos
```http
GET /api/v1/processos/statistics
```

**Resposta:**
```json
{
  "total_processos": 150,
  "por_tipo": {
    "Administrativo": 80,
    "Judicial": 45,
    "Executivo": 25
  },
  "por_situacao": {
    "Em tramitação": 120,
    "Concluído": 25,
    "Suspenso": 5
  },
  "por_orgao": {
    "Secretaria de Administração": 60,
    "Secretaria de Fazenda": 40,
    "Outros": 50
  },
  "processos_recentes": 15,
  "media_documentos_por_processo": 4.2
}
```

---

## 📄 Documentos (`/api/v1/documentos/`)

### Listar Documentos
```http
GET /api/v1/documentos/
```

**Parâmetros de Query:**
- `page`: Número da página
- `size`: Tamanho da página
- `tipo`: Filtro por tipo
- `status_analise`: Filtro por status de análise
- `processo_id`: Filtro por ID do processo

### Buscar Documento por ID
```http
GET /api/v1/documentos/{id}
```

**Parâmetros de Query:**
- `include_content`: Incluir tags e entidades (boolean)

### Atualizar Documento
```http
PATCH /api/v1/documentos/{id}
```

### Buscar Documentos por Conteúdo
```http
GET /api/v1/documentos/search
```

**Parâmetros de Query:**
- `q`: Termo de busca (obrigatório)
- `page`: Número da página
- `size`: Tamanho da página

### Estatísticas de Documentos
```http
GET /api/v1/documentos/statistics
```

**Resposta:**
```json
{
  "total_documentos": 450,
  "por_tipo": {
    "PDF": 320,
    "DOC": 80,
    "TXT": 50
  },
  "por_status_analise": {
    "concluido": 200,
    "pendente": 180,
    "erro": 70
  },
  "documentos_analisados": 200,
  "documentos_nao_analisados": 250,
  "tamanho_medio_arquivo": 150
}
```

### Documentos por Processo
```http
GET /api/v1/documentos/processo/{processo_id}/documentos/
```

### Download de Documento
```http
GET /api/v1/documentos/{id}/download
```

Redireciona para a URL de download do documento.

### Tags do Documento
```http
GET /api/v1/documentos/{id}/tags
```

**Resposta:**
```json
{
  "documento_id": 123,
  "tags": [
    {
      "tag": "contrato",
      "confidence_score": 0.95
    },
    {
      "tag": "administrativo",
      "confidence_score": 0.87
    }
  ]
}
```

### Entidades do Documento
```http
GET /api/v1/documentos/{id}/entidades
```

**Resposta:**
```json
{
  "documento_id": 123,
  "entidades": [
    {
      "tipo": "pessoa",
      "valor": "João Silva",
      "confidence_score": 0.92
    },
    {
      "tipo": "valor",
      "valor": "R$ 15.000,00",
      "confidence_score": 0.88
    }
  ]
}
```

### Histórico de Análises
```http
GET /api/v1/documentos/{id}/analysis-history
```

**Resposta:**
```json
{
  "documento_id": 123,
  "history": [
    {
      "timestamp": "2025-01-20T10:30:00Z",
      "action": "status_update",
      "status": "concluido",
      "details": "Status atualizado para: concluido"
    }
  ]
}
```

---

## 🤖 LLM/Análises (`/api/v1/llm/`)

### Analisar Documento
```http
POST /api/v1/llm/documentos/{id}/analyze
```

Inicia análise de documento com LLM (executa em background).

**Resposta:**
```json
{
  "documento_id": 123,
  "success": true,
  "analysis_text": "Análise completa do documento...",
  "summary": "Resumo executivo...",
  "extracted_entities": ["João Silva", "R$ 15.000,00"],
  "generated_tags": ["contrato", "administrativo"],
  "confidence_score": 0.92,
  "model_used": "gpt-4o-mini",
  "tokens_used": 1500,
  "processing_time_seconds": 3.2,
  "cost_usd": 0.0045,
  "processed_at": "2025-01-20T10:30:00Z"
}
```

### Estatísticas do LLM
```http
GET /api/v1/llm/statistics
```

**Resposta:**
```json
{
  "total_documents_processed": 200,
  "successful_analyses": 185,
  "failed_analyses": 15,
  "total_tokens_used": 450000,
  "total_cost_usd": 135.50,
  "average_tokens_per_document": 2250.0,
  "average_cost_per_document": 0.6775,
  "most_used_model": "gpt-4o-mini",
  "last_analysis_at": "2025-01-20T10:30:00Z",
  "processing_percentage": 44.4
}
```

### Estimativa de Custos
```http
GET /api/v1/llm/cost-estimation
```

**Resposta:**
```json
{
  "document_count": 250,
  "estimated_tokens_per_document": 2000,
  "total_estimated_tokens": 500000,
  "estimated_cost_usd": 150.00,
  "estimated_processing_time_minutes": 125.0
}
```

### Configuração do LLM
```http
GET /api/v1/llm/config
```

**Resposta:**
```json
{
  "provider": "openai",
  "model": "gpt-4o-mini",
  "max_tokens": 4000,
  "temperature": 0.1,
  "chunk_size": 8000,
  "max_chunks_per_document": 5,
  "cost_per_1k_input_tokens": 0.00015,
  "cost_per_1k_output_tokens": 0.0006,
  "timeout_seconds": 60
}
```

---

## 🚀 Como Usar

### 1. Iniciar o Servidor
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Acessar Documentação Interativa
- Abra http://localhost:8000/docs no navegador
- Use a interface Swagger para testar endpoints

### 3. Exemplo com cURL
```bash
# Listar processos
curl -X GET "http://localhost:8000/api/v1/processos/" \
  -H "accept: application/json"

# Criar processo
curl -X POST "http://localhost:8000/api/v1/processos/" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "numero": "SEI-260002/001234/2025",
    "tipo": "Administrativo",
    "assunto": "Teste de API",
    "situacao": "Em tramitação",
    "data_autuacao": "2025-01-20",
    "orgao_autuador": "Secretaria de Teste"
  }'

# Buscar com filtros
curl -X GET "http://localhost:8000/api/v1/processos/search?tipo=Administrativo&page=1&size=10" \
  -H "accept: application/json"
```

### 4. Exemplo com Python
```python
import requests

# Base URL
base_url = "http://localhost:8000/api/v1"

# Listar processos
response = requests.get(f"{base_url}/processos/")
processos = response.json()

# Criar processo
novo_processo = {
    "numero": "SEI-260002/001234/2025",
    "tipo": "Administrativo",
    "assunto": "Teste de API",
    "situacao": "Em tramitação",
    "data_autuacao": "2025-01-20",
    "orgao_autuador": "Secretaria de Teste"
}

response = requests.post(f"{base_url}/processos/", json=novo_processo)
processo_criado = response.json()

# Buscar estatísticas
response = requests.get(f"{base_url}/processos/statistics")
stats = response.json()
```

---

## 🎯 Próximos Desenvolvimentos

### Melhorias Planejadas
1. **Autenticação JWT** para endpoints sensíveis
2. **Rate limiting** para prevenir abuso
3. **Cache Redis** para otimizar performance
4. **Webhooks** para notificações em tempo real
5. **Bulk operations** para operações em lote
6. **GraphQL** como alternativa ao REST

### Endpoints Futuros
- `POST /api/v1/processos/bulk` - Criação em lote
- `GET /api/v1/analytics/dashboard` - Dashboard analítico
- `POST /api/v1/llm/batch-analyze` - Análise em lote
- `GET /api/v1/exports/{format}` - Exportação de dados

---

*Documentação atualizada em: 20/01/2025*
*Versão da API: 1.0.0* 