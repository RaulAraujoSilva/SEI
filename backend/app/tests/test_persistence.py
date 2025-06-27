"""
Testes para serviços de persistência
Seguindo metodologia TDD - testes primeiro!
"""
import pytest
from datetime import datetime, date
from unittest.mock import Mock, AsyncMock, patch
from sqlalchemy.orm import Session
from app.services.persistence import ProcessoPersistenceService, ProcessoResult
from app.services.change_detection import ChangeDetectionService
from app.models.processo import Processo, Autuacao, Documento, Andamento
from app.models.schemas import ProcessoData, AutuacaoData, DocumentoData, AndamentoData


@pytest.mark.unit
class TestProcessoPersistenceService:
    """Testes para serviço de persistência de processos"""
    
    @pytest.fixture
    def db_session(self):
        """Mock da sessão do banco de dados"""
        return Mock(spec=Session)
    
    @pytest.fixture
    def persistence_service(self, db_session):
        """Instância do serviço de persistência"""
        return ProcessoPersistenceService(db_session)
    
    @pytest.fixture
    def sample_processo_data(self):
        """Dados de exemplo de um processo"""
        return ProcessoData(
            autuacao=AutuacaoData(
                numero_sei="SEI-123456/789/2025",
                tipo="Administrativo",
                data_geracao=date(2025, 3, 18),
                interessados="João da Silva"
            ),
            documentos=[
                DocumentoData(
                    numero_documento="12345",
                    tipo="Correspondência",
                    data_documento=date(2025, 3, 19),
                    unidade="UENF/DIRCCH"
                )
            ],
            andamentos=[
                AndamentoData(
                    data_hora=datetime(2025, 3, 18, 17, 4),
                    descricao="Processo criado",
                    unidade="UENF/DIRCCH"
                )
            ]
        )
    
    @pytest.mark.asyncio
    async def test_save_new_processo(self, persistence_service, sample_processo_data, db_session):
        """Testa salvamento de processo novo"""
        # Simula que o processo não existe ainda
        db_session.query.return_value.filter.return_value.first.return_value = None
        
        # Mock de criação do processo
        mock_processo = Mock()
        mock_processo.id = 1
        db_session.add = Mock()
        db_session.commit = Mock()
        
        # Mock do refresh para simular que o processo foi salvo e o ID foi atribuído
        def refresh_side_effect(obj):
            obj.id = 1
        db_session.refresh = Mock(side_effect=refresh_side_effect)
        
        # Mock das queries para documentos e andamentos existentes (vazios para processo novo)
        db_session.query.return_value.filter.return_value.all.return_value = []
        db_session.add_all = Mock()
        
        with patch('app.models.processo.Processo', return_value=mock_processo), \
             patch('app.models.processo.Autuacao'):
            result = await persistence_service.save_processo_data(sample_processo_data)
        
        # Verificações
        assert isinstance(result, ProcessoResult)
        assert result.success is True
        assert result.processo_id == 1
        assert result.was_updated is False  # Era novo
        assert result.changes_detected > 0
        assert db_session.add.called
        assert db_session.commit.called
    
    @pytest.mark.asyncio
    async def test_update_existing_processo(self, persistence_service, sample_processo_data, db_session):
        """Testa atualização de processo existente"""
        # Simula processo existente
        existing_processo = Mock()
        existing_processo.id = 1
        existing_processo.numero_sei = "SEI-123456/789/2025"
        existing_processo.updated_at = datetime(2025, 3, 17, 10, 0)
        existing_processo.tipo = "Administrativo"
        existing_processo.interessados = "João da Silva"
        
        db_session.query.return_value.filter.return_value.first.return_value = existing_processo
        
        # Mock das queries para documentos e andamentos existentes
        db_session.query.return_value.filter.return_value.all.return_value = []
        db_session.add_all = Mock()
        db_session.commit = Mock()
        
        result = await persistence_service.save_processo_data(sample_processo_data)
        
        assert result.success is True
        assert result.processo_id == 1
        assert result.was_updated is True
        assert result.changes_detected >= 0
        assert db_session.commit.called
    
    @pytest.mark.asyncio
    async def test_incremental_andamentos(self, persistence_service, db_session):
        """Testa inserção incremental de andamentos"""
        processo_id = 1
        new_andamentos = [
            AndamentoData(
                data_hora=datetime(2025, 3, 19, 10, 0),
                descricao="Novo andamento 1",
                unidade="SEED/SUBGEP"
            ),
            AndamentoData(
                data_hora=datetime(2025, 3, 19, 11, 0),
                descricao="Novo andamento 2",
                unidade="UENF/DIRCCH"
            )
        ]
        
        # Mock dos andamentos existentes
        existing_andamentos = []
        db_session.query.return_value.filter.return_value.all.return_value = existing_andamentos
        
        result = await persistence_service.merge_andamentos(processo_id, new_andamentos)
        
        assert result == 2  # 2 novos andamentos inseridos
        assert db_session.add_all.called
        assert db_session.commit.called
    
    @pytest.mark.asyncio
    async def test_no_duplicate_documents(self, persistence_service, db_session):
        """Testa que não há duplicação de documentos"""
        processo_id = 1
        
        # Documento que já existe
        existing_doc = Mock()
        existing_doc.numero_documento = "12345"
        
        new_documentos = [
            DocumentoData(
                numero_documento="12345",  # Duplicado
                tipo="Correspondência",
                data_documento=date(2025, 3, 19),
                unidade="UENF/DIRCCH"
            ),
            DocumentoData(
                numero_documento="12346",  # Novo
                tipo="Despacho",
                data_documento=date(2025, 3, 20),
                unidade="SEED/SUBGEP"
            )
        ]
        
        db_session.query.return_value.filter.return_value.all.return_value = [existing_doc]
        
        result = await persistence_service.merge_documentos(processo_id, new_documentos)
        
        assert result == 1  # Apenas 1 novo documento inserido (o outro era duplicado)
        assert db_session.add_all.called
    
    @pytest.mark.asyncio
    async def test_get_last_update(self, persistence_service, db_session):
        """Testa obtenção da última atualização do processo"""
        processo_id = 1
        expected_datetime = datetime(2025, 3, 18, 17, 4)
        
        mock_processo = Mock()
        mock_processo.updated_at = expected_datetime
        
        db_session.query.return_value.filter.return_value.first.return_value = mock_processo
        
        result = await persistence_service.get_last_update(processo_id)
        
        assert result == expected_datetime
    
    @pytest.mark.asyncio
    async def test_database_transaction_rollback(self, persistence_service, sample_processo_data, db_session):
        """Testa rollback em caso de erro na transação"""
        # Simula erro durante commit
        db_session.commit.side_effect = Exception("Database error")
        db_session.rollback = Mock()
        
        result = await persistence_service.save_processo_data(sample_processo_data)
        
        assert result.success is False
        assert "Database error" in result.error_message
        assert db_session.rollback.called
    
    @pytest.mark.asyncio
    async def test_concurrent_access_handling(self, persistence_service, sample_processo_data, db_session):
        """Testa tratamento de acesso concorrente"""
        # Simula conflito de concorrência
        from sqlalchemy.exc import IntegrityError
        
        # Configura mock para processo não existente primeiro
        db_session.query.return_value.filter.return_value.first.return_value = None
        db_session.query.return_value.filter.return_value.all.return_value = []
        db_session.add = Mock()
        db_session.add_all = Mock()
        db_session.refresh = Mock()
        
        # Simula erro de integridade no commit
        db_session.commit.side_effect = IntegrityError("", "", "")
        db_session.rollback = Mock()
        
        result = await persistence_service.save_processo_data(sample_processo_data)
        
        assert result.success is False
        assert "integrity" in result.error_message.lower()
        assert db_session.rollback.called


@pytest.mark.unit
class TestChangeDetectionService:
    """Testes para serviço de detecção de mudanças"""
    
    @pytest.fixture
    def change_service(self):
        """Instância do serviço de detecção de mudanças"""
        return ChangeDetectionService()
    
    def test_calculate_content_hash(self, change_service):
        """Testa cálculo de hash do conteúdo"""
        content = {
            "numero_sei": "SEI-123456/789/2025",
            "tipo": "Administrativo",
            "data_geracao": "2025-03-18"
        }
        
        hash1 = change_service.calculate_content_hash(content)
        hash2 = change_service.calculate_content_hash(content)
        
        # Hash deve ser consistente
        assert hash1 == hash2
        assert isinstance(hash1, str)
        assert len(hash1) > 0
        
        # Hash deve mudar se conteúdo mudar
        modified_content = content.copy()
        modified_content["tipo"] = "Judicial"
        hash3 = change_service.calculate_content_hash(modified_content)
        
        assert hash1 != hash3
    
    def test_detect_new_documents(self, change_service):
        """Testa detecção de novos documentos"""
        stored_docs = [
            {"numero_documento": "12345", "tipo": "Correspondência"},
            {"numero_documento": "12346", "tipo": "Despacho"}
        ]
        
        current_docs = [
            {"numero_documento": "12345", "tipo": "Correspondência"},  # Existente
            {"numero_documento": "12346", "tipo": "Despacho"},         # Existente
            {"numero_documento": "12347", "tipo": "Ofício"}            # Novo
        ]
        
        new_docs = change_service.detect_new_documents(current_docs, stored_docs)
        
        assert len(new_docs) == 1
        assert new_docs[0]["numero_documento"] == "12347"
    
    def test_detect_new_andamentos(self, change_service):
        """Testa detecção de novos andamentos"""
        stored_andamentos = [
            {
                "data_hora": datetime(2025, 3, 18, 17, 4),
                "descricao": "Processo criado",
                "unidade": "UENF/DIRCCH"
            }
        ]
        
        current_andamentos = [
            {
                "data_hora": datetime(2025, 3, 18, 17, 4),
                "descricao": "Processo criado",
                "unidade": "UENF/DIRCCH"
            },
            {
                "data_hora": datetime(2025, 3, 19, 10, 0),
                "descricao": "Documento anexado",
                "unidade": "SEED/SUBGEP"
            }
        ]
        
        new_andamentos = change_service.detect_new_andamentos(current_andamentos, stored_andamentos)
        
        assert len(new_andamentos) == 1
        assert new_andamentos[0]["descricao"] == "Documento anexado"
    
    def test_detect_autuacao_changes(self, change_service):
        """Testa detecção de mudanças na autuação"""
        stored_autuacao = {
            "numero_sei": "SEI-123456/789/2025",
            "tipo": "Administrativo",
            "interessados": "João da Silva"
        }
        
        current_autuacao = {
            "numero_sei": "SEI-123456/789/2025",
            "tipo": "Administrativo",
            "interessados": "João da Silva, Maria Santos"  # Mudança
        }
        
        has_changes = change_service.detect_autuacao_changes(current_autuacao, stored_autuacao)
        
        assert has_changes is True
    
    def test_compare_datetime_precision(self, change_service):
        """Testa comparação de datetime com diferentes precisões"""
        dt1 = datetime(2025, 3, 18, 17, 4, 30)
        dt2 = datetime(2025, 3, 18, 17, 4, 30, 123456)  # Com microssegundos
        
        # Deve considerar iguais (ignorando microssegundos)
        assert change_service.compare_datetime_safe(dt1, dt2) is True
    
    def test_handle_null_values(self, change_service):
        """Testa tratamento de valores nulos na comparação"""
        content1 = {"field1": "value1", "field2": None}
        content2 = {"field1": "value1", "field2": None}
        content3 = {"field1": "value1", "field2": "value2"}
        
        hash1 = change_service.calculate_content_hash(content1)
        hash2 = change_service.calculate_content_hash(content2)
        hash3 = change_service.calculate_content_hash(content3)
        
        assert hash1 == hash2
        assert hash1 != hash3


@pytest.mark.integration
class TestPersistenceIntegration:
    """Testes de integração para persistência"""
    
    @pytest.mark.asyncio
    async def test_full_processo_lifecycle(self, test_db):
        """Testa ciclo completo de vida de um processo"""
        # Este teste usaria o banco real de teste
        # Implementação será feita após os serviços estarem prontos
        pass
    
    @pytest.mark.asyncio
    async def test_concurrent_updates(self, test_db):
        """Testa atualizações concorrentes do mesmo processo"""
        # Teste de concorrência real
        pass
    
    @pytest.mark.asyncio
    async def test_large_batch_processing(self, test_db):
        """Testa processamento de grandes lotes de dados"""
        # Teste de performance com grandes volumes
        pass 