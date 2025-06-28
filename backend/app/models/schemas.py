"""
Schemas Pydantic para validação de dados
"""
from pydantic import BaseModel, HttpUrl, validator, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from decimal import Decimal


# Schemas base
class ProcessoBase(BaseModel):
    numero_sei: str
    url: str
    tipo: Optional[str] = None
    data_geracao: Optional[date] = None
    interessados: Optional[str] = None
    status: str = 'ativo'
    
    @validator('numero_sei')
    def validate_numero_sei(cls, v):
        """Valida formato do número SEI"""
        if not v or len(v.strip()) == 0:
            raise ValueError('Número SEI não pode estar vazio')
        # Remove espaços primeiro
        v_clean = v.strip()
        # Formato esperado: SEI-XXXXXX/XXXXXX/XXXX
        if not v_clean.startswith('SEI-'):
            raise ValueError('Número SEI deve começar com "SEI-"')
        return v_clean
    
    @validator('url')
    def validate_url(cls, v):
        """Valida URL do processo"""
        if not v or 'sei.rj.gov.br' not in v:
            raise ValueError('URL deve ser do sistema SEI do RJ')
        return v

class ProcessoCreate(ProcessoBase):
    pass

class ProcessoUpdate(BaseModel):
    tipo: Optional[str] = None
    data_geracao: Optional[date] = None
    interessados: Optional[str] = None
    status: Optional[str] = None

class ProcessoInDB(ProcessoBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Schemas para Autuação
class AutocaoBase(BaseModel):
    numero_sei: str
    tipo: Optional[str] = None
    data_geracao: Optional[date] = None
    interessados: Optional[str] = None

class AutocaoCreate(AutocaoBase):
    processo_id: int

class AutocaoInDB(AutocaoBase):
    id: int
    processo_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Schemas para Documento
class DocumentoBase(BaseModel):
    numero_documento: str
    tipo: Optional[str] = None
    data_documento: Optional[date] = None
    data_inclusao: Optional[date] = None
    unidade: Optional[str] = None
    arquivo_path: Optional[str] = None
    downloaded: bool = False

class DocumentoCreate(DocumentoBase):
    processo_id: int

class DocumentoUpdate(BaseModel):
    arquivo_path: Optional[str] = None
    downloaded: Optional[bool] = None
    detalhamento_texto: Optional[str] = None
    detalhamento_status: Optional[str] = None
    detalhamento_modelo: Optional[str] = None
    detalhamento_tokens: Optional[int] = None

class DocumentoInDB(DocumentoBase):
    id: int
    processo_id: int
    detalhamento_texto: Optional[str] = None
    detalhamento_status: str = 'pendente'
    detalhamento_data: Optional[datetime] = None
    detalhamento_modelo: Optional[str] = None
    detalhamento_tokens: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Schemas para Tags
class DocumentoTagBase(BaseModel):
    tag: str
    confianca: Optional[Decimal] = None
    origem: str = 'llm'

class DocumentoTagCreate(DocumentoTagBase):
    documento_id: int

class DocumentoTagInDB(DocumentoTagBase):
    id: int
    documento_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Schemas para Entidades
class DocumentoEntidadeBase(BaseModel):
    tipo_entidade: str
    valor: str
    contexto: Optional[str] = None
    posicao_inicio: Optional[int] = None
    posicao_fim: Optional[int] = None
    confianca: Optional[Decimal] = None

class DocumentoEntidadeCreate(DocumentoEntidadeBase):
    documento_id: int

class DocumentoEntidadeInDB(DocumentoEntidadeBase):
    id: int
    documento_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Schemas para Andamentos
class AndamentoBase(BaseModel):
    data_hora: datetime
    unidade: Optional[str] = None
    descricao: Optional[str] = None

class AndamentoCreate(AndamentoBase):
    processo_id: int

class AndamentoInDB(AndamentoBase):
    id: int
    processo_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Schemas compostos para responses
class ProcessoResponse(ProcessoInDB):
    autuacao: Optional[AutocaoInDB] = None
    documentos: List[DocumentoInDB] = []
    andamentos: List[AndamentoInDB] = []

class DocumentoResponse(DocumentoInDB):
    tags: List[DocumentoTagInDB] = []
    entidades: List[DocumentoEntidadeInDB] = []


# Schemas específicos para scraping de dados
class AutuacaoData(BaseModel):
    """Dados de autuação extraídos do scraping"""
    numero_sei: str
    tipo: Optional[str] = None
    data_geracao: Optional[date] = None
    interessados: Optional[str] = None

class DocumentoData(BaseModel):
    """Dados de documento extraídos do scraping"""
    numero_documento: str
    tipo: Optional[str] = None
    data_documento: Optional[date] = None
    data_inclusao: Optional[date] = None
    unidade: Optional[str] = None

class AndamentoData(BaseModel):
    """Dados de andamento extraídos do scraping"""
    data_hora: datetime
    unidade: Optional[str] = None
    descricao: Optional[str] = None

# Schemas para scraping
class ProcessoData(BaseModel):
    """Dados extraídos do scraping"""
    autuacao: AutuacaoData
    documentos: List[DocumentoData]
    andamentos: List[AndamentoData]

class ScrapingResult(BaseModel):
    """Resultado do scraping"""
    success: bool
    processo_data: Optional[ProcessoData] = None
    error_message: Optional[str] = None
    scraped_at: datetime


# Schemas específicos da Fase 3 - Persistência
class ProcessoResult(BaseModel):
    """Resultado de operação de persistência de processo"""
    success: bool
    processo_id: Optional[int] = None
    was_updated: bool = False
    changes_detected: int = 0
    error_message: Optional[str] = None
    processed_at: datetime = Field(default_factory=datetime.now)

class ChangesSummary(BaseModel):
    """Resumo das mudanças detectadas"""
    new_andamentos: int = 0
    new_documentos: int = 0
    updated_autuacao: bool = False
    total_changes: int = 0
    
    @validator('total_changes', always=True)
    def calculate_total(cls, v, values):
        """Calcula total de mudanças"""
        return values.get('new_andamentos', 0) + values.get('new_documentos', 0) + (1 if values.get('updated_autuacao', False) else 0)

class BatchProcessResult(BaseModel):
    """Resultado de processamento em lote"""
    total_processed: int
    successful: int
    failed: int
    results: List[ProcessoResult]
    started_at: datetime
    completed_at: datetime
    
    @validator('failed', always=True)
    def calculate_failed(cls, v, values):
        """Calcula quantidade de falhas"""
        return values.get('total_processed', 0) - values.get('successful', 0)

class ContentHash(BaseModel):
    """Hash de conteúdo para detecção de mudanças"""
    content_type: str  # 'autuacao', 'documento', 'andamento'
    content_id: str
    hash_value: str
    created_at: datetime = Field(default_factory=datetime.now)

class MergeOperation(BaseModel):
    """Operação de merge de dados"""
    operation_type: str  # 'insert', 'update', 'skip'
    content_type: str
    content_id: str
    reason: Optional[str] = None


# Schemas específicos da Fase 4 - Download de Documentos
class DownloadResult(BaseModel):
    """Resultado de download de documento individual"""
    success: bool
    documento_id: int
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    content_type: Optional[str] = None
    file_hash: Optional[str] = None
    retry_count: int = 0
    downloaded_at: Optional[datetime] = None
    error_message: Optional[str] = None

class BatchDownloadResult(BaseModel):
    """Resultado de download em lote"""
    total_documents: int
    successful_downloads: int = 0
    failed_downloads: int = 0
    results: List[DownloadResult] = []
    started_at: datetime
    completed_at: Optional[datetime] = None
    
    @validator('failed_downloads', always=True)
    def calculate_failed(cls, v, values):
        """Calcula quantidade de downloads que falharam"""
        return values.get('total_documents', 0) - values.get('successful_downloads', 0)

class DownloadConfig(BaseModel):
    """Configuração para download de documentos"""
    download_base_path: str = "./downloads"
    timeout: int = 30
    chunk_size: int = 8192
    max_retries: int = 3
    delay_between_downloads: float = 1.0
    concurrent_downloads: int = 5
    allowed_extensions: List[str] = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.png']
    max_file_size_mb: int = 100

class DownloadStatistics(BaseModel):
    """Estatísticas de downloads"""
    total_documents: int
    downloaded_documents: int
    pending_downloads: int
    failed_downloads: int
    download_percentage: float
    total_file_size_mb: float
    last_download_at: Optional[datetime] = None

class FileInfo(BaseModel):
    """Informações de um arquivo baixado"""
    file_path: str
    file_size: int
    file_hash: str
    content_type: str
    created_at: datetime
    is_valid: bool = True


# Schemas específicos da Fase 5 - Integração com LLM
class DocumentAnalysis(BaseModel):
    """Resultado de análise de documento com LLM"""
    documento_id: int
    success: bool
    analysis_text: Optional[str] = None
    summary: Optional[str] = None
    extracted_entities: List[Dict[str, Any]] = []
    generated_tags: List[str] = []
    confidence_score: Optional[Decimal] = None
    model_used: str
    tokens_used: int
    processing_time_seconds: float
    cost_usd: Decimal
    processed_at: datetime
    error_message: Optional[str] = None
    
    model_config = {"protected_namespaces": ()}

class EntityExtractionResult(BaseModel):
    """Resultado de extração de entidades"""
    entities: List[Dict[str, Any]]
    processing_time_seconds: float
    confidence_scores: Dict[str, float]
    model_used: str
    tokens_used: int
    
    model_config = {"protected_namespaces": ()}

class TagGenerationResult(BaseModel):
    """Resultado de geração de tags"""
    tags: List[str]
    confidence_scores: Dict[str, float]
    processing_time_seconds: float
    model_used: str
    tokens_used: int
    
    model_config = {"protected_namespaces": ()}

class LLMConfig(BaseModel):
    """Configuração do serviço LLM"""
    provider: str = "openai"  # openai, anthropic, local
    model: str = "gpt-4o-mini"
    api_key: str
    organization_id: Optional[str] = None
    max_tokens: int = 4000
    temperature: float = 0.1
    chunk_size: int = 8000
    max_chunks_per_document: int = 10
    cost_per_1k_input_tokens: Decimal = Decimal("0.00015")
    cost_per_1k_output_tokens: Decimal = Decimal("0.0006")
    timeout_seconds: int = 120

class BatchLLMResult(BaseModel):
    """Resultado de processamento em lote com LLM"""
    total_documents: int
    successful_analyses: int
    failed_analyses: int
    results: List[DocumentAnalysis]
    total_tokens_used: int
    total_cost_usd: Decimal
    started_at: datetime
    completed_at: datetime

class LLMStatistics(BaseModel):
    """Estatísticas de uso do LLM"""
    total_documents_processed: int
    successful_analyses: int
    failed_analyses: int
    total_tokens_used: int
    total_cost_usd: Decimal
    average_tokens_per_document: Optional[float] = None
    average_cost_per_document: Optional[Decimal] = None
    most_used_model: Optional[str] = None
    last_analysis_at: Optional[datetime] = None
    processing_percentage: float

class CostEstimation(BaseModel):
    """Estimativa de custo para processamento"""
    document_count: int
    estimated_tokens_per_document: int
    total_estimated_tokens: int
    estimated_cost_usd: Decimal
    estimated_processing_time_minutes: float 