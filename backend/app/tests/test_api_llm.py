"""
Testes para API de LLM - Fase 6
"""
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from unittest.mock import Mock, patch
from app.main import app
from app.database.connection import get_db, Base
from app.models.processo import Processo, Documento, Andamento
from app.services.llm_service import LLMService
from datetime import datetime, date

# Configurar ambiente de teste
os.environ["ENVIRONMENT"] = "test"

# Usar o mesmo setup dos outros testes
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_api.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module")
def client():
    """Cliente de teste FastAPI"""
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session():
    """Sessão de banco para testes"""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def sample_documento_for_analysis(db_session):
    """Documento para análise com LLM"""
    # Criar processo
    processo = Processo(
        numero="SEI-260002/003333/2025",
        tipo="Administrativo",
        assunto="Processo para análise LLM",
        interessado="Sistema LLM",
        situacao="Em tramitação",
        data_autuacao=date(2025, 1, 15),
        orgao_autuador="Secretaria LLM",
        url_processo="https://sei.rj.gov.br/llm",
        hash_conteudo="llm_hash_123"
    )
    db_session.add(processo)
    db_session.commit()
    db_session.refresh(processo)
    
    # Criar documento para análise
    documento = Documento(
        processo_id=processo.id,
        tipo="Despacho",
        numero="DOC-LLM-001",
        data_documento=date(2025, 1, 15),
        descricao="Documento para análise LLM",
        url_documento="https://sei.rj.gov.br/llm-doc",
        tamanho_arquivo=2048,
        hash_arquivo="hash_llm_001",
        detalhamento_status="pendente",
        detalhamento_texto="Este é um texto de exemplo para análise com LLM. Contém informações sobre João Silva, CPF 123.456.789-00, e valor de R$ 1.500,00."
    )
    db_session.add(documento)
    db_session.commit()
    db_session.refresh(documento)
    
    return processo, documento

class TestLLMAPI:
    """Testes para endpoints de LLM/Análises"""
    
    @patch('app.services.llm_service.LLMService.analyze_document')
    def test_analyze_documento(self, mock_analyze, client, sample_documento_for_analysis):
        """Testa análise de documento com LLM"""
        processo, documento = sample_documento_for_analysis
        
        # Mock da resposta do LLM
        mock_analyze.return_value = Mock(
            documento_id=documento.id,
            success=True,
            analysis_text="Resumo: Documento administrativo sobre João Silva",
            summary="Documento administrativo",
            extracted_entities=["João Silva", "123.456.789-00", "R$ 1.500,00"],
            generated_tags=["administrativo", "despacho"],
            confidence_score=0.95,
            model_used="gpt-4o-mini",
            tokens_used=150,
            processing_time_seconds=2.5,
            cost_usd=0.0001,
            processed_at=datetime.now(),
            error_message=None
        )
        
        response = client.post(f"/api/v1/documentos/{documento.id}/analyze")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["documento_id"] == documento.id
        assert "analysis_text" in data
        assert "extracted_entities" in data
        assert "generated_tags" in data
    
    def test_analyze_documento_not_found(self, client):
        """Testa análise de documento inexistente"""
        response = client.post("/api/v1/documentos/99999/analyze")
        assert response.status_code == 404
        assert "detail" in response.json()
    
    @patch('app.services.llm_service.LLMService.batch_analyze_documents')
    def test_batch_analyze_documentos(self, mock_batch, client, sample_documento_for_analysis):
        """Testa análise em lote de documentos"""
        processo, documento = sample_documento_for_analysis
        
        # Mock da resposta do batch
        mock_batch.return_value = Mock(
            total_documents=1,
            successful_analyses=1,
            failed_analyses=0,
            results=[],
            total_tokens_used=150,
            total_cost_usd=0.0001,
            started_at=datetime.now(),
            completed_at=datetime.now()
        )
        
        batch_data = {
            "documento_ids": [documento.id],
            "max_concurrent": 2
        }
        
        response = client.post("/api/v1/llm/batch-analyze", json=batch_data)
        assert response.status_code == 200
        data = response.json()
        assert data["total_documents"] == 1
        assert data["successful_analyses"] == 1
        assert data["failed_analyses"] == 0
    
    def test_batch_analyze_empty_list(self, client):
        """Testa análise em lote com lista vazia"""
        batch_data = {
            "documento_ids": [],
            "max_concurrent": 2
        }
        
        response = client.post("/api/v1/llm/batch-analyze", json=batch_data)
        assert response.status_code == 400
        assert "detail" in response.json()
    
    @patch('app.services.llm_service.LLMService.get_llm_statistics')
    def test_get_llm_statistics(self, mock_stats, client):
        """Testa estatísticas do LLM"""
        mock_stats.return_value = Mock(
            total_documents_processed=10,
            successful_analyses=8,
            failed_analyses=2,
            total_tokens_used=1500,
            total_cost_usd=0.001,
            average_tokens_per_document=150,
            average_cost_per_document=0.0001,
            most_used_model="gpt-4o-mini",
            last_analysis_at=datetime.now(),
            processing_percentage=80.0
        )
        
        response = client.get("/api/v1/llm/statistics")
        assert response.status_code == 200
        data = response.json()
        assert data["total_documents_processed"] == 10
        assert data["successful_analyses"] == 8
        assert data["failed_analyses"] == 2
        assert data["processing_percentage"] == 80.0
    
    @patch('app.services.llm_service.LLMService.estimate_processing_cost')
    def test_get_cost_estimation(self, mock_estimate, client):
        """Testa estimativa de custos"""
        mock_estimate.return_value = Mock(
            document_count=5,
            estimated_tokens_per_document=200,
            total_estimated_tokens=1000,
            estimated_cost_usd=0.0005,
            estimated_processing_time_minutes=2.5
        )
        
        response = client.get("/api/v1/llm/cost-estimation")
        assert response.status_code == 200
        data = response.json()
        assert data["document_count"] == 5
        assert data["estimated_cost_usd"] == 0.0005
        assert data["estimated_processing_time_minutes"] == 2.5
    
    @patch('app.services.llm_service.LLMService.cleanup_failed_analyses')
    def test_cleanup_failed_analyses(self, mock_cleanup, client):
        """Testa limpeza de análises falhadas"""
        mock_cleanup.return_value = 3  # 3 análises limpas
        
        response = client.post("/api/v1/llm/cleanup")
        assert response.status_code == 200
        data = response.json()
        assert data["cleaned_analyses"] == 3
        assert "message" in data
    
    def test_get_analysis_history(self, client, sample_documento_for_analysis):
        """Testa histórico de análises"""
        processo, documento = sample_documento_for_analysis
        
        response = client.get(f"/api/v1/documentos/{documento.id}/analysis-history")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Pode estar vazio se não houver histórico
    
    def test_get_pending_documents(self, client, sample_documento_for_analysis):
        """Testa listagem de documentos pendentes de análise"""
        processo, documento = sample_documento_for_analysis
        
        response = client.get("/api/v1/llm/pending-documents")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        # Deve incluir nosso documento pendente
        assert data["total"] >= 1
    
    def test_get_failed_documents(self, client):
        """Testa listagem de documentos com falha na análise"""
        response = client.get("/api/v1/llm/failed-documents")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        # Pode estar vazio se não houver falhas
    
    def test_retry_failed_analysis(self, client, db_session):
        """Testa retry de análise falhada"""
        # Criar documento com falha
        processo = Processo(
            numero="SEI-260002/004444/2025",
            tipo="Administrativo",
            assunto="Processo com falha",
            interessado="Sistema",
            situacao="Em tramitação",
            data_autuacao=date(2025, 1, 15),
            orgao_autuador="Secretaria",
            url_processo="https://sei.rj.gov.br/fail",
            hash_conteudo="fail_hash"
        )
        db_session.add(processo)
        db_session.commit()
        db_session.refresh(processo)
        
        documento = Documento(
            processo_id=processo.id,
            tipo="Documento",
            numero="DOC-FAIL-001",
            data_documento=date(2025, 1, 15),
            descricao="Documento com falha",
            url_documento="https://sei.rj.gov.br/fail-doc",
            hash_arquivo="hash_fail",
            detalhamento_status="erro",
            detalhamento_texto="Erro na análise anterior"
        )
        db_session.add(documento)
        db_session.commit()
        db_session.refresh(documento)
        
        response = client.post(f"/api/v1/documentos/{documento.id}/retry-analysis")
        # Pode retornar 200 (sucesso) ou 202 (aceito para processamento)
        assert response.status_code in [200, 202]
    
    def test_get_analysis_config(self, client):
        """Testa busca de configuração do LLM"""
        response = client.get("/api/v1/llm/config")
        assert response.status_code == 200
        data = response.json()
        assert "provider" in data
        assert "model" in data
        assert "max_tokens" in data
        assert "temperature" in data
    
    def test_update_analysis_config(self, client):
        """Testa atualização de configuração do LLM"""
        config_data = {
            "max_tokens": 5000,
            "temperature": 0.2,
            "chunk_size": 10000
        }
        
        response = client.patch("/api/v1/llm/config", json=config_data)
        assert response.status_code == 200
        data = response.json()
        assert data["max_tokens"] == 5000
        assert data["temperature"] == 0.2
    
    def test_get_model_performance(self, client):
        """Testa métricas de performance por modelo"""
        response = client.get("/api/v1/llm/model-performance")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Pode estar vazio se não houver dados
    
    def test_validate_analysis_input(self, client):
        """Testa validação de entrada para análise"""
        # Dados inválidos
        invalid_data = {
            "documento_ids": "não é uma lista",
            "max_concurrent": "não é um número"
        }
        
        response = client.post("/api/v1/llm/batch-analyze", json=invalid_data)
        assert response.status_code == 422
        assert "detail" in response.json() 