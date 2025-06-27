"""
Router para endpoints de Documentos - Fase 6
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import RedirectResponse, FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_
from typing import Optional, List
from datetime import datetime, date

from app.database.connection import get_db
from app.models.processo import Processo, Documento, DocumentoTag, DocumentoEntidade
from app.models.api_schemas import (
    DocumentoResponse, DocumentoUpdate, DocumentoStatistics,
    PaginatedDocumentos, ResponseMessage
)

router = APIRouter()

# ===== ENDPOINTS DE LISTAGEM =====

@router.get("/", response_model=PaginatedDocumentos)
async def list_documentos(
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(100, ge=1, le=1000, description="Tamanho da página"),
    tipo: Optional[str] = Query(None, description="Filtro por tipo"),
    status_analise: Optional[str] = Query(None, description="Filtro por status de análise"),
    processo_id: Optional[int] = Query(None, description="Filtro por processo"),
    db: Session = Depends(get_db)
):
    """Lista todos os documentos com filtros"""
    
    # Query base
    query = db.query(Documento)
    
    # Aplicar filtros
    if tipo:
        query = query.filter(Documento.tipo.ilike(f"%{tipo}%"))
    
    if status_analise:
        query = query.filter(Documento.detalhamento_status == status_analise)
    
    if processo_id:
        query = query.filter(Documento.processo_id == processo_id)
    
    # Contar total
    total = query.count()
    
    # Aplicar paginação
    offset = (page - 1) * size
    documentos = (
        query.order_by(desc(Documento.created_at))
        .offset(offset)
        .limit(size)
        .all()
    )
    
    # Converter para response
    items = [DocumentoResponse.model_validate(doc) for doc in documentos]
    
    pages = (total + size - 1) // size if size > 0 else 0
    
    return PaginatedDocumentos(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages
    )

# ===== ENDPOINTS DE BUSCA E ESTATÍSTICAS (ANTES DOS ESPECÍFICOS) =====

@router.get("/search", response_model=PaginatedDocumentos)
async def search_documentos(
    q: str = Query(..., description="Termo de busca no conteúdo"),
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(100, ge=1, le=1000, description="Tamanho da página"),
    db: Session = Depends(get_db)
):
    """Busca documentos por conteúdo"""
    
    # Buscar em múltiplos campos
    query = db.query(Documento).filter(
        or_(
            Documento.descricao.ilike(f"%{q}%"),
            Documento.detalhamento_texto.ilike(f"%{q}%"),
            Documento.numero.ilike(f"%{q}%"),
            Documento.tipo.ilike(f"%{q}%")
        )
    )
    
    # Contar total
    total = query.count()
    
    # Aplicar paginação
    offset = (page - 1) * size
    documentos = (
        query.order_by(desc(Documento.created_at))
        .offset(offset)
        .limit(size)
        .all()
    )
    
    # Converter para response
    items = [DocumentoResponse.model_validate(doc) for doc in documentos]
    
    pages = (total + size - 1) // size if size > 0 else 0
    
    return PaginatedDocumentos(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages
    )

@router.get("/statistics", response_model=DocumentoStatistics)
async def get_documento_statistics(db: Session = Depends(get_db)):
    """Retorna estatísticas de documentos"""
    
    # Total de documentos
    total_documentos = db.query(Documento).count()
    
    # Por tipo
    por_tipo = {}
    tipos = db.query(Documento.tipo, func.count(Documento.id)).group_by(Documento.tipo).all()
    for tipo, count in tipos:
        por_tipo[tipo or "Não informado"] = count
    
    # Por status de análise
    por_status = {}
    status_list = db.query(Documento.detalhamento_status, func.count(Documento.id)).group_by(Documento.detalhamento_status).all()
    for status, count in status_list:
        por_status[status or "Não informado"] = count
    
    # Documentos analisados vs não analisados
    analisados = db.query(Documento).filter(Documento.detalhamento_status == 'concluido').count()
    nao_analisados = total_documentos - analisados
    
    # Tamanho médio (baseado em documentos baixados)
    documentos_baixados = db.query(Documento).filter(Documento.downloaded == True).count()
    
    return DocumentoStatistics(
        total_documentos=total_documentos,
        por_tipo=por_tipo,
        por_status_analise=por_status,
        documentos_analisados=analisados,
        documentos_nao_analisados=nao_analisados,
        tamanho_medio_arquivo=documentos_baixados  # Usando como proxy para tamanho
    )

# ===== ENDPOINTS ESPECÍFICOS POR ID (DEVEM VIR APÓS OS ENDPOINTS NOMEADOS) =====

@router.get("/{documento_id}", response_model=DocumentoResponse)
async def get_documento(
    documento_id: int,
    include_content: bool = Query(False, description="Incluir tags e entidades"),
    db: Session = Depends(get_db)
):
    """Busca documento por ID"""
    
    documento = db.query(Documento).filter(Documento.id == documento_id).first()
    if not documento:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    
    # Converter para dict
    doc_dict = documento.__dict__.copy()
    
    # Incluir tags e entidades se solicitado
    if include_content:
        # Buscar tags
        tags = (
            db.query(DocumentoTag)
            .filter(DocumentoTag.documento_id == documento_id)
            .all()
        )
        doc_dict['tags'] = [
            {
                'tag': tag.tag,
                'confidence_score': float(tag.confidence_score) if tag.confidence_score else None
            }
            for tag in tags
        ]
        
        # Buscar entidades
        entidades = (
            db.query(DocumentoEntidade)
            .filter(DocumentoEntidade.documento_id == documento_id)
            .all()
        )
        doc_dict['entidades'] = [
            {
                'tipo': ent.tipo,
                'valor': ent.valor,
                'confidence_score': float(ent.confidence_score) if ent.confidence_score else None
            }
            for ent in entidades
        ]
    
    return DocumentoResponse.model_validate(doc_dict)

@router.patch("/{documento_id}", response_model=DocumentoResponse)
async def update_documento(
    documento_id: int,
    update_data: DocumentoUpdate,
    db: Session = Depends(get_db)
):
    """Atualiza documento"""
    
    documento = db.query(Documento).filter(Documento.id == documento_id).first()
    if not documento:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    
    # Atualizar campos fornecidos
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(documento, field, value)
    
    documento.updated_at = datetime.now()
    
    db.commit()
    db.refresh(documento)
    
    return DocumentoResponse.model_validate(documento)

# ===== ENDPOINTS DE PROCESSO =====

@router.get("/processo/{processo_id}/documentos/", response_model=PaginatedDocumentos)
async def list_documentos_by_processo(
    processo_id: int,
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(100, ge=1, le=1000, description="Tamanho da página"),
    db: Session = Depends(get_db)
):
    """Lista documentos de um processo específico"""
    
    # Verificar se processo existe
    processo = db.query(Processo).filter(Processo.id == processo_id).first()
    if not processo:
        raise HTTPException(status_code=404, detail="Processo não encontrado")
    
    # Query documentos do processo
    query = db.query(Documento).filter(Documento.processo_id == processo_id)
    
    # Contar total
    total = query.count()
    
    # Aplicar paginação
    offset = (page - 1) * size
    documentos = (
        query.order_by(desc(Documento.created_at))
        .offset(offset)
        .limit(size)
        .all()
    )
    
    # Converter para response
    items = [DocumentoResponse.model_validate(doc) for doc in documentos]
    
    pages = (total + size - 1) // size if size > 0 else 0
    
    return PaginatedDocumentos(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages
    )

# ===== ENDPOINTS DE DOWNLOAD E CONTEÚDO =====

@router.get("/{documento_id}/download")
async def download_documento(documento_id: int, db: Session = Depends(get_db)):
    """Download do arquivo do documento"""
    
    documento = db.query(Documento).filter(Documento.id == documento_id).first()
    if not documento:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    
    if not documento.url_download:
        raise HTTPException(status_code=404, detail="URL de download não disponível")
    
    # Redirecionar para URL original
    return RedirectResponse(url=documento.url_download)

@router.get("/{documento_id}/tags")
async def get_documento_tags(documento_id: int, db: Session = Depends(get_db)):
    """Busca tags do documento"""
    
    documento = db.query(Documento).filter(Documento.id == documento_id).first()
    if not documento:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    
    tags = (
        db.query(DocumentoTag)
        .filter(DocumentoTag.documento_id == documento_id)
        .all()
    )
    
    return {
        "documento_id": documento_id,
        "tags": [
            {
                "tag": tag.tag,
                "confidence_score": float(tag.confidence_score) if tag.confidence_score else None
            }
            for tag in tags
        ]
    }

@router.get("/{documento_id}/entidades")
async def get_documento_entidades(documento_id: int, db: Session = Depends(get_db)):
    """Busca entidades do documento"""
    
    documento = db.query(Documento).filter(Documento.id == documento_id).first()
    if not documento:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    
    entidades = (
        db.query(DocumentoEntidade)
        .filter(DocumentoEntidade.documento_id == documento_id)
        .all()
    )
    
    return {
        "documento_id": documento_id,
        "entidades": [
            {
                "tipo": ent.tipo,
                "valor": ent.valor,
                "confidence_score": float(ent.confidence_score) if ent.confidence_score else None
            }
            for ent in entidades
        ]
    }

@router.get("/{documento_id}/analysis-history")
async def get_analysis_history(documento_id: int, db: Session = Depends(get_db)):
    """Histórico de análises do documento"""
    
    documento = db.query(Documento).filter(Documento.id == documento_id).first()
    if not documento:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    
    # Simular histórico baseado nos campos disponíveis
    history = []
    
    if documento.detalhamento_status:
        history.append({
            "timestamp": documento.updated_at or documento.created_at,
            "action": "status_update",
            "status": documento.detalhamento_status,
            "details": f"Status atualizado para: {documento.detalhamento_status}"
        })
    
    if documento.detalhamento_texto:
        history.append({
            "timestamp": documento.created_at,
            "action": "text_analysis",
            "status": "completed",
            "details": f"Análise de texto concluída ({len(documento.detalhamento_texto)} caracteres)"
        })
    
    return {
        "documento_id": documento_id,
        "history": sorted(history, key=lambda x: x["timestamp"], reverse=True)
    } 