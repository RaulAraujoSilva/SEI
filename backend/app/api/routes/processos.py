"""
Router para endpoints de Processos - Fase 6
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, case
from typing import Optional, List
from datetime import datetime, date, timedelta

from app.database.connection import get_db
from app.models.processo import Processo, Documento, Andamento
from app.models.api_schemas import (
    ProcessoCreate, ProcessoUpdate, ProcessoResponse, ProcessoStatistics,
    PaginatedProcessos, ProcessoSearchParams, ResponseMessage
)

router = APIRouter()

# ===== ENDPOINTS CRUD =====

@router.get("/", response_model=PaginatedProcessos)
async def list_processos(
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(100, ge=1, le=1000, description="Tamanho da página"),
    db: Session = Depends(get_db)
):
    """Lista processos com paginação"""
    
    # Calcular offset
    offset = (page - 1) * size
    
    # Contar total
    total = db.query(Processo).count()
    
    # Buscar processos com paginação simples
    processos = (
        db.query(Processo)
        .order_by(desc(Processo.created_at))
        .offset(offset)
        .limit(size)
        .all()
    )
    
    # Montar resposta
    items = []
    for processo in processos:
        # Contar documentos e andamentos para cada processo
        total_docs = db.query(Documento).filter(Documento.processo_id == processo.id).count()
        total_and = db.query(Andamento).filter(Andamento.processo_id == processo.id).count()
        docs_analisados = db.query(Documento).filter(
            Documento.processo_id == processo.id,
            Documento.detalhamento_status == 'concluido'
        ).count()
        
        processo_dict = {
            **processo.__dict__,
            'total_documentos': total_docs,
            'total_andamentos': total_and,
            'documentos_analisados': docs_analisados
        }
        items.append(ProcessoResponse.model_validate(processo_dict))
    
    pages = (total + size - 1) // size if size > 0 else 0
    
    return PaginatedProcessos(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages
    )

@router.post("/", response_model=ProcessoResponse, status_code=201)
async def create_processo(
    processo_data: ProcessoCreate,
    db: Session = Depends(get_db)
):
    """Cria novo processo"""
    
    # Verificar se processo já existe
    existing = db.query(Processo).filter(
        Processo.numero == processo_data.numero
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Processo com número {processo_data.numero} já existe"
        )
    
    # Criar processo
    processo = Processo(
        **processo_data.model_dump(),
        hash_conteudo=f"hash_{processo_data.numero}_{datetime.now().timestamp()}"
    )
    
    db.add(processo)
    db.commit()
    db.refresh(processo)
    
    # Retornar com contadores zerados
    processo_dict = {
        **processo.__dict__,
        'total_documentos': 0,
        'total_andamentos': 0,
        'documentos_analisados': 0
    }
    
    return ProcessoResponse.model_validate(processo_dict)

# ===== ENDPOINTS DE BUSCA E ESTATÍSTICAS (ANTES DOS ESPECÍFICOS) =====

@router.get("/search", response_model=PaginatedProcessos)
async def search_processos(
    numero: Optional[str] = Query(None, description="Busca por número"),
    tipo: Optional[str] = Query(None, description="Filtro por tipo"),
    assunto: Optional[str] = Query(None, description="Busca por assunto"),
    interessado: Optional[str] = Query(None, description="Busca por interessado"),
    situacao: Optional[str] = Query(None, description="Filtro por situação"),
    orgao_autuador: Optional[str] = Query(None, description="Filtro por órgão"),
    data_inicio: Optional[date] = Query(None, description="Data início"),
    data_fim: Optional[date] = Query(None, description="Data fim"),
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(100, ge=1, le=1000, description="Tamanho da página"),
    db: Session = Depends(get_db)
):
    """Busca processos com filtros"""
    
    # Query base
    query = db.query(Processo)
    
    # Aplicar filtros
    if numero:
        query = query.filter(Processo.numero.ilike(f"%{numero}%"))
    
    if tipo:
        query = query.filter(Processo.tipo == tipo)
    
    if assunto:
        query = query.filter(Processo.assunto.ilike(f"%{assunto}%"))
    
    if interessado:
        query = query.filter(Processo.interessado.ilike(f"%{interessado}%"))
    
    if situacao:
        query = query.filter(Processo.situacao == situacao)
    
    if orgao_autuador:
        query = query.filter(Processo.orgao_autuador.ilike(f"%{orgao_autuador}%"))
    
    if data_inicio:
        query = query.filter(Processo.data_autuacao >= data_inicio)
    
    if data_fim:
        query = query.filter(Processo.data_autuacao <= data_fim)
    
    # Contar total
    total = query.count()
    
    # Aplicar paginação
    offset = (page - 1) * size
    processos = query.order_by(desc(Processo.created_at)).offset(offset).limit(size).all()
    
    # Buscar contadores para cada processo
    items = []
    for processo in processos:
        # Contar documentos e andamentos para cada processo
        total_docs = db.query(Documento).filter(Documento.processo_id == processo.id).count()
        total_and = db.query(Andamento).filter(Andamento.processo_id == processo.id).count()
        docs_analisados = db.query(Documento).filter(
            Documento.processo_id == processo.id,
            Documento.detalhamento_status == 'concluido'
        ).count()
        
        processo_dict = {
            **processo.__dict__,
            'total_documentos': total_docs,
            'total_andamentos': total_and,
            'documentos_analisados': docs_analisados
        }
        
        items.append(ProcessoResponse.model_validate(processo_dict))
    
    pages = (total + size - 1) // size if size > 0 else 0
    
    return PaginatedProcessos(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages
    )

@router.get("/statistics", response_model=ProcessoStatistics)
async def get_processo_statistics(db: Session = Depends(get_db)):
    """Retorna estatísticas de processos"""
    
    # Total de processos
    total_processos = db.query(Processo).count()
    
    # Por tipo
    por_tipo = {}
    tipos = db.query(Processo.tipo, func.count(Processo.id)).group_by(Processo.tipo).all()
    for tipo, count in tipos:
        por_tipo[tipo or "Não informado"] = count
    
    # Por situação
    por_situacao = {}
    situacoes = db.query(Processo.situacao, func.count(Processo.id)).group_by(Processo.situacao).all()
    for situacao, count in situacoes:
        por_situacao[situacao or "Não informado"] = count
    
    # Por órgão
    por_orgao = {}
    orgaos = db.query(Processo.orgao_autuador, func.count(Processo.id)).group_by(Processo.orgao_autuador).all()
    for orgao, count in orgaos:
        por_orgao[orgao or "Não informado"] = count
    
    # Processos recentes (últimos 30 dias)
    data_limite = date.today() - timedelta(days=30)
    processos_recentes = db.query(Processo).filter(
        Processo.data_autuacao >= data_limite
    ).count()
    
    # Média de documentos por processo (simplificada)
    total_docs = db.query(Documento).count()
    media_documentos_por_processo = float(total_docs / total_processos) if total_processos > 0 else 0.0
    
    return ProcessoStatistics(
        total_processos=total_processos,
        por_tipo=por_tipo,
        por_situacao=por_situacao,
        por_orgao=por_orgao,
        processos_recentes=processos_recentes,
        media_documentos_por_processo=media_documentos_por_processo
    )

# ===== ENDPOINTS ESPECÍFICOS POR ID (DEVEM VIR APÓS OS ENDPOINTS NOMEADOS) =====

@router.get("/{processo_id}", response_model=ProcessoResponse)
async def get_processo(processo_id: int, db: Session = Depends(get_db)):
    """Busca processo por ID"""
    
    processo = db.query(Processo).filter(Processo.id == processo_id).first()
    if not processo:
        raise HTTPException(status_code=404, detail="Processo não encontrado")
    
    # Contar documentos e andamentos
    total_docs = db.query(Documento).filter(Documento.processo_id == processo.id).count()
    total_and = db.query(Andamento).filter(Andamento.processo_id == processo.id).count()
    docs_analisados = db.query(Documento).filter(
        Documento.processo_id == processo.id,
        Documento.detalhamento_status == 'concluido'
    ).count()
    
    processo_dict = {
        **processo.__dict__,
        'total_documentos': total_docs,
        'total_andamentos': total_and,
        'documentos_analisados': docs_analisados
    }
    
    return ProcessoResponse.model_validate(processo_dict)

@router.patch("/{processo_id}", response_model=ProcessoResponse)
async def update_processo(
    processo_id: int,
    update_data: ProcessoUpdate,
    db: Session = Depends(get_db)
):
    """Atualiza processo"""
    
    processo = db.query(Processo).filter(Processo.id == processo_id).first()
    if not processo:
        raise HTTPException(status_code=404, detail="Processo não encontrado")
    
    # Atualizar campos fornecidos
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(processo, field, value)
    
    processo.updated_at = datetime.now()
    
    db.commit()
    db.refresh(processo)
    
    # Buscar contadores atualizados
    total_docs = db.query(Documento).filter(Documento.processo_id == processo.id).count()
    total_and = db.query(Andamento).filter(Andamento.processo_id == processo.id).count()
    docs_analisados = db.query(Documento).filter(
        Documento.processo_id == processo.id,
        Documento.detalhamento_status == 'concluido'
    ).count()
    
    processo_dict = {
        **processo.__dict__,
        'total_documentos': total_docs,
        'total_andamentos': total_and,
        'documentos_analisados': docs_analisados
    }
    
    return ProcessoResponse.model_validate(processo_dict)

@router.delete("/{processo_id}", status_code=204)
async def delete_processo(processo_id: int, db: Session = Depends(get_db)):
    """Exclui processo"""
    
    processo = db.query(Processo).filter(Processo.id == processo_id).first()
    if not processo:
        raise HTTPException(status_code=404, detail="Processo não encontrado")
    
    db.delete(processo)
    db.commit()
    
    return None 