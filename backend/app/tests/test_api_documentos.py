"""
Testes para API de Documentos - Fase 6
"""
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database.connection import get_db, Base
from app.models.processo import Processo, Documento, Andamento
from datetime import datetime, date

# Configurar ambiente de teste
os.environ["ENVIRONMENT"] = "test"

# Usar banco de teste em memória
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
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
def sample_processo_with_docs(db_session):
    """Processo com documentos para testes"""
    # Criar processo
    processo = Processo(
        numero="SEI-260002/002172/2025",
        tipo="Administrativo",
        assunto="Processo com documentos",
        interessado="Usuário Teste",
        situacao="Em tramitação",
        data_autuacao=date(2025, 1, 15),
        orgao_autuador="Secretaria de Teste",
        url_processo="https://sei.rj.gov.br/test",
        hash_conteudo="test_hash_123"
    )
    db_session.add(processo)
    db_session.commit()
    db_session.refresh(processo)
    
    # Criar documentos
    docs = []
    for i in range(3):
        doc = Documento(
            processo_id=processo.id,
            tipo=f"Documento {i+1}",
            numero=f"DOC-2025-00{i+1}",
            data_documento=date(2025, 1, 15 + i),
            descricao=f"Descrição do documento {i+1}",
            url_documento=f"https://sei.rj.gov.br/doc{i+1}",
            tamanho_arquivo=1024 * (i+1),
            hash_arquivo=f"hash_doc_{i+1}",
            detalhamento_status="concluido" if i == 0 else "pendente",
            detalhamento_texto=f"Texto do documento {i+1}" if i == 0 else None
        )
        db_session.add(doc)
        docs.append(doc)
    
    db_session.commit()
    for doc in docs:
        db_session.refresh(doc)
    
    return processo, docs

class TestDocumentosAPI:
    """Testes para endpoints de documentos"""
    
    def test_list_documentos_by_processo(self, client, sample_processo_with_docs):
        """Testa listagem de documentos por processo"""
        processo, docs = sample_processo_with_docs
        
        response = client.get(f"/api/v1/processos/{processo.id}/documentos/")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert len(data["items"]) == 3
        assert data["total"] == 3
        
        # Verificar ordem por data
        doc_dates = [doc["data_documento"] for doc in data["items"]]
        assert doc_dates == sorted(doc_dates)
    
    def test_list_documentos_empty_processo(self, client, db_session):
        """Testa listagem de documentos de processo sem documentos"""
        # Criar processo sem documentos
        processo = Processo(
            numero="SEI-260002/999999/2025",
            tipo="Administrativo",
            assunto="Processo vazio",
            interessado="Teste",
            situacao="Em tramitação",
            data_autuacao=date(2025, 1, 15),
            orgao_autuador="Secretaria",
            url_processo="https://sei.rj.gov.br/empty",
            hash_conteudo="empty_hash"
        )
        db_session.add(processo)
        db_session.commit()
        db_session.refresh(processo)
        
        response = client.get(f"/api/v1/processos/{processo.id}/documentos/")
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0
    
    def test_get_documento_by_id(self, client, sample_processo_with_docs):
        """Testa busca de documento por ID"""
        processo, docs = sample_processo_with_docs
        doc = docs[0]
        
        response = client.get(f"/api/v1/documentos/{doc.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == doc.id
        assert data["numero"] == doc.numero
        assert data["tipo"] == doc.tipo
        assert data["processo_id"] == processo.id
    
    def test_get_documento_not_found(self, client):
        """Testa busca de documento inexistente"""
        response = client.get("/api/v1/documentos/99999")
        assert response.status_code == 404
        assert "detail" in response.json()
    
    def test_get_documento_with_content(self, client, sample_processo_with_docs):
        """Testa busca de documento com conteúdo analisado"""
        processo, docs = sample_processo_with_docs
        doc = docs[0]  # Primeiro documento tem status "concluido"
        
        response = client.get(f"/api/v1/documentos/{doc.id}?include_content=true")
        assert response.status_code == 200
        data = response.json()
        assert data["detalhamento_status"] == "concluido"
        assert data["detalhamento_texto"] is not None
        assert "tags" in data
        assert "entidades" in data
    
    def test_list_all_documentos_with_filters(self, client, sample_processo_with_docs):
        """Testa listagem geral de documentos com filtros"""
        processo, docs = sample_processo_with_docs
        
        # Filtro por tipo
        response = client.get("/api/v1/documentos/?tipo=Documento 1")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["tipo"] == "Documento 1"
        
        # Filtro por status de análise
        response = client.get("/api/v1/documentos/?status_analise=concluido")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["detalhamento_status"] == "concluido"
    
    def test_download_documento(self, client, sample_processo_with_docs):
        """Testa download de documento"""
        processo, docs = sample_processo_with_docs
        doc = docs[0]
        
        response = client.get(f"/api/v1/documentos/{doc.id}/download")
        # Como não temos arquivo real, deve retornar erro 404 ou redirect
        assert response.status_code in [404, 302, 307]
    
    def test_get_documento_statistics(self, client, sample_processo_with_docs):
        """Testa estatísticas de documentos"""
        processo, docs = sample_processo_with_docs
        
        response = client.get("/api/v1/documentos/statistics")
        assert response.status_code == 200
        data = response.json()
        assert "total_documentos" in data
        assert "por_tipo" in data
        assert "por_status_analise" in data
        assert "tamanho_total" in data
        assert data["total_documentos"] >= 3
    
    def test_search_documentos_by_content(self, client, sample_processo_with_docs):
        """Testa busca de documentos por conteúdo"""
        processo, docs = sample_processo_with_docs
        
        response = client.get("/api/v1/documentos/search?q=Texto do documento")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) >= 1
        
        # Busca que não deve retornar nada
        response = client.get("/api/v1/documentos/search?q=TextoInexistente123")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 0
    
    def test_update_documento_status(self, client, sample_processo_with_docs):
        """Testa atualização de status de documento"""
        processo, docs = sample_processo_with_docs
        doc = docs[1]  # Documento com status "pendente"
        
        update_data = {
            "detalhamento_status": "processando"
        }
        
        response = client.patch(f"/api/v1/documentos/{doc.id}", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["detalhamento_status"] == "processando"
    
    def test_get_documento_tags(self, client, sample_processo_with_docs):
        """Testa busca de tags de documento"""
        processo, docs = sample_processo_with_docs
        doc = docs[0]  # Documento analisado
        
        response = client.get(f"/api/v1/documentos/{doc.id}/tags")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Pode estar vazio se não houver tags
    
    def test_get_documento_entidades(self, client, sample_processo_with_docs):
        """Testa busca de entidades de documento"""
        processo, docs = sample_processo_with_docs
        doc = docs[0]  # Documento analisado
        
        response = client.get(f"/api/v1/documentos/{doc.id}/entidades")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Pode estar vazio se não houver entidades
    
    def test_list_documentos_pagination(self, client, db_session):
        """Testa paginação de documentos"""
        # Criar processo
        processo = Processo(
            numero="SEI-260002/888888/2025",
            tipo="Administrativo",
            assunto="Processo para paginação",
            interessado="Teste",
            situacao="Em tramitação",
            data_autuacao=date(2025, 1, 15),
            orgao_autuador="Secretaria",
            url_processo="https://sei.rj.gov.br/pag",
            hash_conteudo="pag_hash"
        )
        db_session.add(processo)
        db_session.commit()
        db_session.refresh(processo)
        
        # Criar 10 documentos
        for i in range(10):
            doc = Documento(
                processo_id=processo.id,
                tipo=f"Doc {i}",
                numero=f"DOC-PAG-{i:03d}",
                data_documento=date(2025, 1, 15),
                descricao=f"Documento {i}",
                url_documento=f"https://sei.rj.gov.br/pag{i}",
                hash_arquivo=f"hash_pag_{i}"
            )
            db_session.add(doc)
        db_session.commit()
        
        # Testar paginação
        response = client.get("/api/v1/documentos/?page=1&size=5")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 5
        assert data["page"] == 1
        assert data["size"] == 5
        assert data["total"] >= 10 