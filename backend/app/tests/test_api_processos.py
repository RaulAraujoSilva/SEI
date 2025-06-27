"""
Testes para API de Processos - Fase 6
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

# Configurar banco de teste em memória
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

@pytest.fixture(scope="function")
def db_session():
    """Sessão de banco para testes"""
    # Criar todas as tabelas
    Base.metadata.create_all(bind=engine)
    
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        # Limpar tabelas após cada teste
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    """Cliente de teste FastAPI"""
    with TestClient(app) as c:
        yield c

@pytest.fixture
def sample_processo(db_session):
    """Processo de exemplo para testes"""
    processo = Processo(
        numero="SEI-260002/002172/2025",
        tipo="Administrativo",
        assunto="Teste de API",
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
    return processo

class TestProcessosAPI:
    """Testes para endpoints de processos"""
    
    def test_list_processos_empty(self, client):
        """Testa listagem de processos vazia"""
        response = client.get("/api/v1/processos/")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "size" in data
        assert data["items"] == []
        assert data["total"] == 0
    
    def test_list_processos_with_data(self, client, sample_processo):
        """Testa listagem de processos com dados"""
        response = client.get("/api/v1/processos/")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["total"] == 1
        assert data["items"][0]["numero"] == "SEI-260002/002172/2025"
        assert data["items"][0]["tipo"] == "Administrativo"
    
    def test_list_processos_pagination(self, client, db_session):
        """Testa paginação da listagem"""
        # Criar múltiplos processos
        for i in range(5):
            processo = Processo(
                numero=f"SEI-260002/00{i:04d}/2025",
                tipo="Administrativo",
                assunto=f"Processo {i}",
                interessado="Teste",
                situacao="Em tramitação",
                data_autuacao=date(2025, 1, 15),
                orgao_autuador="Secretaria",
                url_processo=f"https://sei.rj.gov.br/test{i}",
                hash_conteudo=f"hash_{i}"
            )
            db_session.add(processo)
        db_session.commit()
        
        # Testar primeira página
        response = client.get("/api/v1/processos/?page=1&size=2")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert data["total"] == 5
        assert data["page"] == 1
        assert data["size"] == 2
        
        # Testar segunda página
        response = client.get("/api/v1/processos/?page=2&size=2")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert data["page"] == 2
    
    def test_get_processo_by_id(self, client, sample_processo):
        """Testa busca de processo por ID"""
        response = client.get(f"/api/v1/processos/{sample_processo.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_processo.id
        assert data["numero"] == "SEI-260002/002172/2025"
        assert data["tipo"] == "Administrativo"
    
    def test_get_processo_not_found(self, client):
        """Testa busca de processo inexistente"""
        response = client.get("/api/v1/processos/99999")
        assert response.status_code == 404
        assert "detail" in response.json()
    
    def test_create_processo(self, client):
        """Testa criação de processo"""
        processo_data = {
            "numero": "SEI-260002/001234/2025",
            "tipo": "Judicial",
            "assunto": "Novo processo via API",
            "interessado": "API User",
            "situacao": "Autuado",
            "data_autuacao": "2025-01-20",
            "orgao_autuador": "Secretaria API",
            "url_processo": "https://sei.rj.gov.br/api-test"
        }
        
        response = client.post("/api/v1/processos/", json=processo_data)
        assert response.status_code == 201
        data = response.json()
        assert data["numero"] == processo_data["numero"]
        assert data["tipo"] == processo_data["tipo"]
        assert "id" in data
        assert "created_at" in data
    
    def test_create_processo_duplicate_number(self, client, sample_processo):
        """Testa criação de processo com número duplicado"""
        processo_data = {
            "numero": "SEI-260002/002172/2025",  # Mesmo número do sample_processo
            "tipo": "Judicial",
            "assunto": "Processo duplicado",
            "interessado": "API User",
            "situacao": "Autuado",
            "data_autuacao": "2025-01-20",
            "orgao_autuador": "Secretaria API",
            "url_processo": "https://sei.rj.gov.br/duplicate"
        }
        
        response = client.post("/api/v1/processos/", json=processo_data)
        assert response.status_code == 400
        assert "detail" in response.json()
        assert "já existe" in response.json()["detail"].lower()
    
    def test_update_processo(self, client, sample_processo):
        """Testa atualização de processo"""
        update_data = {
            "assunto": "Assunto atualizado via API",
            "situacao": "Finalizado"
        }
        
        response = client.patch(f"/api/v1/processos/{sample_processo.id}", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["assunto"] == update_data["assunto"]
        assert data["situacao"] == update_data["situacao"]
        assert data["id"] == sample_processo.id
    
    def test_update_processo_not_found(self, client):
        """Testa atualização de processo inexistente"""
        update_data = {"assunto": "Não vai funcionar"}
        
        response = client.patch("/api/v1/processos/99999", json=update_data)
        assert response.status_code == 404
    
    def test_delete_processo(self, client, sample_processo):
        """Testa exclusão de processo"""
        response = client.delete(f"/api/v1/processos/{sample_processo.id}")
        assert response.status_code == 204
        
        # Verificar se foi realmente excluído
        response = client.get(f"/api/v1/processos/{sample_processo.id}")
        assert response.status_code == 404
    
    def test_delete_processo_not_found(self, client):
        """Testa exclusão de processo inexistente"""
        response = client.delete("/api/v1/processos/99999")
        assert response.status_code == 404
    
    def test_search_processos_by_numero(self, client, sample_processo):
        """Testa busca de processos por número"""
        response = client.get("/api/v1/processos/search?numero=SEI-260002")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) >= 1
        assert any(p["numero"] == sample_processo.numero for p in data["items"])
    
    def test_search_processos_by_tipo(self, client, sample_processo):
        """Testa busca de processos por tipo"""
        response = client.get("/api/v1/processos/search?tipo=Administrativo")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) >= 1
        assert all(p["tipo"] == "Administrativo" for p in data["items"])
    
    def test_search_processos_by_date_range(self, client, sample_processo):
        """Testa busca de processos por período"""
        response = client.get("/api/v1/processos/search?data_inicio=2025-01-01&data_fim=2025-01-31")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) >= 1
    
    def test_get_processo_statistics(self, client, sample_processo):
        """Testa estatísticas de processos"""
        response = client.get("/api/v1/processos/statistics")
        assert response.status_code == 200
        data = response.json()
        assert "total_processos" in data
        assert "por_tipo" in data
        assert "por_situacao" in data
        assert "por_orgao" in data
        assert data["total_processos"] >= 1
    
    def test_api_validation_errors(self, client):
        """Testa validação de dados de entrada"""
        # Dados inválidos
        invalid_data = {
            "numero": "",  # Número vazio
            "tipo": "TipoInválido",  # Tipo não permitido
            "data_autuacao": "data-inválida"  # Data inválida
        }
        
        response = client.post("/api/v1/processos/", json=invalid_data)
        assert response.status_code == 422
        assert "detail" in response.json() 