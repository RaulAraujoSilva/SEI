"""
Router para endpoints de LLM/Análises - Fase 6
"""
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_
from typing import Optional, List
from datetime import datetime, date, timedelta
from decimal import Decimal

from app.database.connection import get_db
from app.models.processo import Documento
from app.services.llm_service import LLMService
from app.models.api_schemas import (
    DocumentAnalysisResponse, BatchAnalysisRequest, BatchAnalysisResponse,
    LLMStatisticsResponse, CostEstimationResponse, LLMConfigResponse,
    LLMConfigUpdate, CleanupResponse, PaginatedDocumentos, ResponseMessage
)

router = APIRouter()

def get_llm_service(db: Session = Depends(get_db)) -> LLMService:
    """Dependency para obter instância do LLMService"""
    config = {
        "provider": "openai",
        "model": "gpt-4o-mini",
        "api_key": "test_key",  # Em produção, vir de env
        "max_tokens": 4000,
        "temperature": 0.1
    }
    return LLMService(db, config)

# ===== ENDPOINTS DE ANÁLISE INDIVIDUAL =====

@router.post("/documentos/{documento_id}/analyze", response_model=DocumentAnalysisResponse)
async def analyze_documento(
    documento_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    llm_service: LLMService = Depends(get_llm_service)
):
    """Analisa documento com LLM"""
    
    # Verificar se documento existe
    documento = db.query(Documento).filter(Documento.id == documento_id).first()
    if not documento:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    
    try:
        # Executar análise
        result = await llm_service.analyze_document(documento_id)
        
        # Converter para response
        return DocumentAnalysisResponse(
            documento_id=result.documento_id,
            success=result.success,
            analysis_text=result.analysis_text,
            summary=result.summary,
            extracted_entities=result.extracted_entities,
            generated_tags=result.generated_tags,
            confidence_score=result.confidence_score,
            model_used=result.model_used,
            tokens_used=result.tokens_used,
            processing_time_seconds=result.processing_time_seconds,
            cost_usd=result.cost_usd,
            processed_at=result.processed_at,
            error_message=result.error_message
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na análise: {str(e)}")

# ===== ENDPOINTS DE ESTATÍSTICAS =====

@router.get("/statistics", response_model=LLMStatisticsResponse)
async def get_llm_statistics(
    db: Session = Depends(get_db)
):
    """Estatísticas do LLM"""
    
    try:
        # Buscar estatísticas básicas dos documentos analisados
        total_docs = db.query(Documento).count()
        
        # Documentos com análise concluída
        docs_analisados = db.query(Documento).filter(
            Documento.detalhamento_status == 'concluido'
        ).count()
        
        # Documentos com falha na análise
        docs_com_falha = db.query(Documento).filter(
            Documento.detalhamento_status == 'erro'
        ).count()
        
        # Total de tokens (se disponível)
        tokens_result = db.query(func.sum(Documento.detalhamento_tokens)).filter(
            Documento.detalhamento_tokens.isnot(None)
        ).scalar()
        total_tokens = int(tokens_result) if tokens_result else 0
        
        # Custo total (estimado baseado em tokens)
        cost_per_1k_tokens = 0.0015  # Custo estimado
        total_cost = Decimal(str((total_tokens / 1000) * cost_per_1k_tokens))
        
        # Médias
        avg_tokens = float(total_tokens / docs_analisados) if docs_analisados > 0 else 0.0
        avg_cost = total_cost / docs_analisados if docs_analisados > 0 else Decimal('0.0')
        
        # Modelo mais usado
        modelo_result = db.query(
            Documento.detalhamento_modelo,
            func.count(Documento.id)
        ).filter(
            Documento.detalhamento_modelo.isnot(None)
        ).group_by(Documento.detalhamento_modelo).order_by(
            desc(func.count(Documento.id))
        ).first()
        
        most_used_model = modelo_result[0] if modelo_result else "gpt-4o-mini"
        
        # Última análise
        last_doc = db.query(Documento).filter(
            Documento.detalhamento_data.isnot(None)
        ).order_by(desc(Documento.detalhamento_data)).first()
        
        last_analysis = last_doc.detalhamento_data if last_doc else None
        
        # Percentual de processamento
        processing_percentage = float((docs_analisados / total_docs) * 100) if total_docs > 0 else 0.0
        
        return LLMStatisticsResponse(
            total_documents_processed=docs_analisados,
            successful_analyses=docs_analisados,
            failed_analyses=docs_com_falha,
            total_tokens_used=total_tokens,
            total_cost_usd=total_cost,
            average_tokens_per_document=avg_tokens,
            average_cost_per_document=avg_cost,
            most_used_model=most_used_model,
            last_analysis_at=last_analysis,
            processing_percentage=processing_percentage
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar estatísticas: {str(e)}")

@router.get("/cost-estimation", response_model=CostEstimationResponse)
async def get_cost_estimation(
    llm_service: LLMService = Depends(get_llm_service)
):
    """Estimativa de custos para documentos pendentes"""
    
    try:
        estimation = llm_service.estimate_processing_cost()
        
        return CostEstimationResponse(
            document_count=estimation.document_count,
            estimated_tokens_per_document=estimation.estimated_tokens_per_document,
            total_estimated_tokens=estimation.total_estimated_tokens,
            estimated_cost_usd=estimation.estimated_cost_usd,
            estimated_processing_time_minutes=estimation.estimated_processing_time_minutes
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao calcular estimativa: {str(e)}")

# ===== ENDPOINTS DE CONFIGURAÇÃO =====

@router.get("/config", response_model=LLMConfigResponse)
async def get_llm_config(
    llm_service: LLMService = Depends(get_llm_service)
):
    """Configuração atual do LLM"""
    
    config = llm_service.config
    
    return LLMConfigResponse(
        provider=config.get("provider", "openai"),
        model=config.get("model", "gpt-4o-mini"),
        max_tokens=config.get("max_tokens", 4000),
        temperature=config.get("temperature", 0.1),
        chunk_size=config.get("chunk_size", 8000),
        max_chunks_per_document=config.get("max_chunks_per_document", 5),
        cost_per_1k_input_tokens=Decimal(str(config.get("cost_per_1k_input_tokens", 0.00015))),
        cost_per_1k_output_tokens=Decimal(str(config.get("cost_per_1k_output_tokens", 0.0006))),
        timeout_seconds=config.get("timeout_seconds", 60)
    ) 