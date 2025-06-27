"""
Schemas Pydantic para API REST - Fase 6
"""
from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from decimal import Decimal

# ===== SCHEMAS BASE =====

class PaginatedResponse(BaseModel):
    """Resposta paginada padrão"""
    items: List[Any]
    total: int
    page: int = 1
    size: int = 100
    pages: int
    
    @field_validator('pages', mode='before')
    @classmethod
    def calculate_pages(cls, v, info):
        if info.data:
            total = info.data.get('total', 0)
            size = info.data.get('size', 100)
            return (total + size - 1) // size if size > 0 else 0
        return 0

class ResponseMessage(BaseModel):
    """Resposta com mensagem simples"""
    message: str
    success: bool = True

# ===== SCHEMAS DE PROCESSO =====

class ProcessoBase(BaseModel):
    """Schema base para processo"""
    numero: str = Field(..., description="Número do processo SEI")
    tipo: str = Field(..., description="Tipo do processo")
    assunto: str = Field(..., description="Assunto do processo")
    interessado: Optional[str] = Field(None, description="Interessado no processo")
    situacao: str = Field(..., description="Situação atual")
    data_autuacao: date = Field(..., description="Data de autuação")
    orgao_autuador: str = Field(..., description="Órgão autuador")
    url_processo: Optional[str] = Field(None, description="URL do processo no SEI")
    
    @field_validator('numero')
    @classmethod
    def validate_numero_processo(cls, v):
        """Valida formato do número do processo"""
        if v and not v.startswith('SEI-'):
            raise ValueError('Número do processo deve começar com SEI-')
        return v

class ProcessoCreate(ProcessoBase):
    """Schema para criação de processo"""
    pass

class ProcessoUpdate(BaseModel):
    """Schema para atualização de processo"""
    tipo: Optional[str] = None
    assunto: Optional[str] = None
    interessado: Optional[str] = None
    situacao: Optional[str] = None
    orgao_autuador: Optional[str] = None
    url_processo: Optional[str] = None

class ProcessoResponse(ProcessoBase):
    """Schema de resposta para processo"""
    id: int
    hash_conteudo: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Contadores relacionados
    total_documentos: Optional[int] = None
    total_andamentos: Optional[int] = None
    documentos_analisados: Optional[int] = None
    
    model_config = ConfigDict(from_attributes=True)

class ProcessoStatistics(BaseModel):
    """Estatísticas de processos"""
    total_processos: int
    por_tipo: Dict[str, int]
    por_situacao: Dict[str, int]
    por_orgao: Dict[str, int]
    processos_recentes: int  # Últimos 30 dias
    media_documentos_por_processo: float

# ===== SCHEMAS DE DOCUMENTO =====

class DocumentoBase(BaseModel):
    """Schema base para documento"""
    tipo: str = Field(..., description="Tipo do documento")
    numero: Optional[str] = Field(None, description="Número do documento")
    data_documento: date = Field(..., description="Data do documento")
    descricao: str = Field(..., description="Descrição do documento")
    url_documento: Optional[str] = Field(None, description="URL do documento")

class DocumentoResponse(DocumentoBase):
    """Schema de resposta para documento"""
    id: int
    processo_id: int
    tamanho_arquivo: Optional[int] = None
    hash_arquivo: Optional[str] = None
    caminho_arquivo: Optional[str] = None
    
    # Campos de análise LLM
    detalhamento_status: Optional[str] = None
    detalhamento_texto: Optional[str] = None
    detalhamento_modelo: Optional[str] = None
    detalhamento_tokens: Optional[int] = None
    detalhamento_data: Optional[datetime] = None
    
    # Relacionamentos (opcionais)
    tags: Optional[List[Dict[str, Any]]] = None
    entidades: Optional[List[Dict[str, Any]]] = None
    
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class DocumentoUpdate(BaseModel):
    """Schema para atualização de documento"""
    tipo: Optional[str] = None
    descricao: Optional[str] = None
    detalhamento_status: Optional[str] = None

class DocumentoStatistics(BaseModel):
    """Estatísticas de documentos"""
    total_documentos: int
    por_tipo: Dict[str, int]
    por_status_analise: Dict[str, int]
    documentos_analisados: int
    documentos_nao_analisados: int
    tamanho_medio_arquivo: int  # Número de documentos baixados como proxy

# ===== SCHEMAS DE ANDAMENTO =====

class AndamentoResponse(BaseModel):
    """Schema de resposta para andamento"""
    id: int
    processo_id: int
    data_andamento: date
    descricao: str
    unidade: Optional[str] = None
    usuario: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# ===== SCHEMAS DE LLM/ANÁLISE =====

class DocumentAnalysisResponse(BaseModel):
    """Resposta de análise de documento"""
    model_config = ConfigDict(protected_namespaces=())
    
    documento_id: int
    success: bool
    analysis_text: Optional[str] = None
    summary: Optional[str] = None
    extracted_entities: Optional[List[str]] = None
    generated_tags: Optional[List[str]] = None
    confidence_score: Optional[float] = None
    model_used: Optional[str] = None
    tokens_used: Optional[int] = None
    processing_time_seconds: Optional[float] = None
    cost_usd: Optional[Decimal] = None
    processed_at: Optional[datetime] = None
    error_message: Optional[str] = None

class BatchAnalysisRequest(BaseModel):
    """Requisição para análise em lote"""
    documento_ids: List[int] = Field(..., min_length=1, description="IDs dos documentos")
    max_concurrent: int = Field(3, ge=1, le=10, description="Máximo de análises simultâneas")

class BatchAnalysisResponse(BaseModel):
    """Resposta de análise em lote"""
    total_documents: int
    successful_analyses: int
    failed_analyses: int
    results: List[DocumentAnalysisResponse]
    total_tokens_used: int
    total_cost_usd: Decimal
    started_at: datetime
    completed_at: Optional[datetime] = None

class LLMStatisticsResponse(BaseModel):
    """Estatísticas do LLM"""
    total_documents_processed: int
    successful_analyses: int
    failed_analyses: int
    total_tokens_used: int
    total_cost_usd: Decimal
    average_tokens_per_document: float
    average_cost_per_document: Decimal
    most_used_model: Optional[str] = None
    last_analysis_at: Optional[datetime] = None
    processing_percentage: float

class CostEstimationResponse(BaseModel):
    """Estimativa de custos"""
    document_count: int
    estimated_tokens_per_document: int
    total_estimated_tokens: int
    estimated_cost_usd: Decimal
    estimated_processing_time_minutes: float

class LLMConfigResponse(BaseModel):
    """Configuração do LLM"""
    provider: str
    model: str
    max_tokens: int
    temperature: float
    chunk_size: int
    max_chunks_per_document: int
    cost_per_1k_input_tokens: Decimal
    cost_per_1k_output_tokens: Decimal
    timeout_seconds: int

class LLMConfigUpdate(BaseModel):
    """Atualização de configuração do LLM"""
    max_tokens: Optional[int] = Field(None, ge=100, le=50000)
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    chunk_size: Optional[int] = Field(None, ge=1000, le=50000)
    max_chunks_per_document: Optional[int] = Field(None, ge=1, le=20)
    timeout_seconds: Optional[int] = Field(None, ge=10, le=300)

class CleanupResponse(BaseModel):
    """Resposta de limpeza"""
    cleaned_analyses: int
    message: str

# ===== SCHEMAS DE BUSCA =====

class ProcessoSearchParams(BaseModel):
    """Parâmetros de busca para processos"""
    numero: Optional[str] = None
    tipo: Optional[str] = None
    assunto: Optional[str] = None
    interessado: Optional[str] = None
    situacao: Optional[str] = None
    orgao_autuador: Optional[str] = None
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None
    page: int = Field(1, ge=1)
    size: int = Field(100, ge=1, le=1000)

class DocumentoSearchParams(BaseModel):
    """Parâmetros de busca para documentos"""
    tipo: Optional[str] = None
    numero: Optional[str] = None
    descricao: Optional[str] = None
    status_analise: Optional[str] = None
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None
    processo_id: Optional[int] = None
    q: Optional[str] = Field(None, description="Busca por conteúdo")
    page: int = Field(1, ge=1)
    size: int = Field(100, ge=1, le=1000)

# ===== SCHEMAS DE PAGINAÇÃO =====

class PaginatedProcessos(PaginatedResponse):
    """Resposta paginada de processos"""
    items: List[ProcessoResponse]

class PaginatedDocumentos(PaginatedResponse):
    """Resposta paginada de documentos"""
    items: List[DocumentoResponse]

class PaginatedAndamentos(PaginatedResponse):
    """Resposta paginada de andamentos"""
    items: List[AndamentoResponse]

# ===== SCHEMAS DE HEALTH CHECK =====

class HealthCheckResponse(BaseModel):
    """Resposta do health check"""
    status: str
    database: str
    llm_service: Optional[str] = None
    timestamp: datetime
    version: str = "1.0.0"
    uptime_seconds: Optional[float] = None

class SystemInfoResponse(BaseModel):
    """Informações do sistema"""
    version: str
    environment: str
    database_url: str  # Sem credenciais
    total_processos: int
    total_documentos: int
    total_analyses: int
    last_scraping: Optional[datetime] = None
    system_status: str

# ===== VALIDADORES PERSONALIZADOS =====

# Aplicar validador aos schemas relevantes - será implementado em cada classe conforme necessário 