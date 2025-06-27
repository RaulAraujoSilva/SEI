"""
Serviço para persistência incremental de processos
"""
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.models.processo import Processo, Autuacao, Documento, Andamento
from app.models.schemas import (
    ProcessoData, ProcessoResult, AutuacaoData, DocumentoData, AndamentoData,
    ChangesSummary
)
from app.services.change_detection import ChangeDetectionService

logger = logging.getLogger(__name__)


class ProcessoPersistenceService:
    """Serviço para persistência incremental de processos"""
    
    def __init__(self, db_session: Session):
        """
        Inicializa o serviço
        
        Args:
            db_session: Sessão do banco de dados
        """
        self.db = db_session
        self.change_service = ChangeDetectionService()
    
    async def save_processo_data(self, processo_data: ProcessoData) -> ProcessoResult:
        """
        Salva dados do processo de forma incremental
        
        Args:
            processo_data: Dados do processo extraídos
            
        Returns:
            Resultado da operação de persistência
        """
        try:
            # Busca processo existente
            existing_processo = self._find_existing_processo(processo_data.autuacao.numero_sei)
            
            if existing_processo:
                # Atualiza processo existente
                return await self._update_existing_processo(existing_processo, processo_data)
            else:
                # Cria novo processo
                return await self._create_new_processo(processo_data)
                
        except IntegrityError as e:
            logger.error(f"Erro de integridade ao salvar processo: {e}")
            self.db.rollback()
            return ProcessoResult(
                success=False,
                error_message=f"Erro de integrity constraint: {str(e)}"
            )
        except SQLAlchemyError as e:
            logger.error(f"Erro de banco de dados: {e}")
            self.db.rollback()
            return ProcessoResult(
                success=False,
                error_message=f"Database error: {str(e)}"
            )
        except Exception as e:
            logger.error(f"Erro inesperado ao salvar processo: {e}")
            self.db.rollback()
            return ProcessoResult(
                success=False,
                error_message=f"Database error: {str(e)}"
            )
    
    async def get_last_update(self, processo_id: int) -> Optional[datetime]:
        """
        Retorna última atualização do processo
        
        Args:
            processo_id: ID do processo
            
        Returns:
            Datetime da última atualização ou None se não encontrado
        """
        processo = self.db.query(Processo).filter(Processo.id == processo_id).first()
        return processo.updated_at if processo else None
    
    async def merge_andamentos(self, processo_id: int, andamentos: List[AndamentoData]) -> int:
        """
        Mescla andamentos evitando duplicatas
        
        Args:
            processo_id: ID do processo
            andamentos: Lista de novos andamentos
            
        Returns:
            Número de andamentos inseridos
        """
        if not andamentos:
            return 0
        
        # Busca andamentos existentes
        existing_andamentos = self.db.query(Andamento).filter(
            Andamento.processo_id == processo_id
        ).all()
        
        # Converte para formato dict para comparação
        existing_dicts = [
            {
                'data_hora': a.data_hora,
                'descricao': a.descricao,
                'unidade': a.unidade
            }
            for a in existing_andamentos
        ]
        
        # Detecta novos andamentos
        current_dicts = [a.model_dump() for a in andamentos]
        new_andamentos = self.change_service.detect_new_andamentos(current_dicts, existing_dicts)
        
        if not new_andamentos:
            return 0
        
        # Cria objetos Andamento
        andamento_objects = []
        for and_data in new_andamentos:
            andamento = Andamento(
                processo_id=processo_id,
                data_hora=and_data['data_hora'],
                descricao=and_data.get('descricao'),
                unidade=and_data.get('unidade')
            )
            andamento_objects.append(andamento)
        
        # Insere no banco
        self.db.add_all(andamento_objects)
        self.db.commit()
        
        return len(andamento_objects)
    
    async def merge_documentos(self, processo_id: int, documentos: List[DocumentoData]) -> int:
        """
        Mescla documentos evitando duplicatas
        
        Args:
            processo_id: ID do processo
            documentos: Lista de novos documentos
            
        Returns:
            Número de documentos inseridos
        """
        if not documentos:
            return 0
        
        # Busca documentos existentes
        existing_documentos = self.db.query(Documento).filter(
            Documento.processo_id == processo_id
        ).all()
        
        # Converte para formato dict para comparação
        existing_dicts = [
            {
                'numero_documento': d.numero_documento,
                'tipo': d.tipo,
                'data_documento': d.data_documento,
                'unidade': d.unidade
            }
            for d in existing_documentos
        ]
        
        # Detecta novos documentos
        current_dicts = [d.model_dump() for d in documentos]
        new_documentos = self.change_service.detect_new_documents(current_dicts, existing_dicts)
        
        if not new_documentos:
            return 0
        
        # Cria objetos Documento
        documento_objects = []
        for doc_data in new_documentos:
            documento = Documento(
                processo_id=processo_id,
                numero_documento=doc_data['numero_documento'],
                tipo=doc_data.get('tipo'),
                data_documento=doc_data.get('data_documento'),
                data_inclusao=doc_data.get('data_inclusao'),
                unidade=doc_data.get('unidade')
            )
            documento_objects.append(documento)
        
        # Insere no banco
        self.db.add_all(documento_objects)
        self.db.commit()
        
        return len(documento_objects)
    
    def _find_existing_processo(self, numero_sei: str) -> Optional[Processo]:
        """
        Busca processo existente pelo número SEI
        
        Args:
            numero_sei: Número SEI do processo
            
        Returns:
            Processo existente ou None
        """
        return self.db.query(Processo).filter(
            Processo.numero_sei == numero_sei
        ).first()
    
    async def _create_new_processo(self, processo_data: ProcessoData) -> ProcessoResult:
        """
        Cria novo processo
        
        Args:
            processo_data: Dados do processo
            
        Returns:
            Resultado da operação
        """
        # Cria processo
        processo = Processo(
            numero_sei=processo_data.autuacao.numero_sei,
            url="",  # URL será definida posteriormente
            tipo=processo_data.autuacao.tipo,
            data_geracao=processo_data.autuacao.data_geracao,
            interessados=processo_data.autuacao.interessados
        )
        
        self.db.add(processo)
        self.db.commit()
        self.db.refresh(processo)
        
        # Cria autuação
        if processo_data.autuacao:
            autuacao = Autuacao(
                processo_id=processo.id,
                numero_sei=processo_data.autuacao.numero_sei,
                tipo=processo_data.autuacao.tipo,
                data_geracao=processo_data.autuacao.data_geracao,
                interessados=processo_data.autuacao.interessados
            )
            self.db.add(autuacao)
        
        # Insere documentos e andamentos
        doc_count = await self.merge_documentos(processo.id, processo_data.documentos)
        and_count = await self.merge_andamentos(processo.id, processo_data.andamentos)
        
        total_changes = 1 + doc_count + and_count  # 1 para o processo novo
        
        return ProcessoResult(
            success=True,
            processo_id=processo.id,
            was_updated=False,
            changes_detected=total_changes
        )
    
    async def _update_existing_processo(self, processo: Processo, processo_data: ProcessoData) -> ProcessoResult:
        """
        Atualiza processo existente
        
        Args:
            processo: Processo existente
            processo_data: Novos dados
            
        Returns:
            Resultado da operação
        """
        changes_count = 0
        
        # Atualiza dados básicos do processo se necessário
        updated = False
        if processo.tipo != processo_data.autuacao.tipo:
            processo.tipo = processo_data.autuacao.tipo
            updated = True
        if processo.interessados != processo_data.autuacao.interessados:
            processo.interessados = processo_data.autuacao.interessados
            updated = True
        
        if updated:
            processo.updated_at = datetime.now()
            changes_count += 1
        
        # Merge de documentos e andamentos
        doc_count = await self.merge_documentos(processo.id, processo_data.documentos)
        and_count = await self.merge_andamentos(processo.id, processo_data.andamentos)
        
        changes_count += doc_count + and_count
        
        if changes_count > 0:
            self.db.commit()
        
        return ProcessoResult(
            success=True,
            processo_id=processo.id,
            was_updated=True,
            changes_detected=changes_count
        )
    
    def _convert_to_dict(self, obj) -> Dict[str, Any]:
        """
        Converte objeto SQLAlchemy para dict
        
        Args:
            obj: Objeto a ser convertido
            
        Returns:
            Dicionário com dados do objeto
        """
        if hasattr(obj, '__dict__'):
            result = {}
            for key, value in obj.__dict__.items():
                if not key.startswith('_'):
                    result[key] = value
            return result
        return {} 