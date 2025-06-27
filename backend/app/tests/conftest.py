"""
Configurações e fixtures para testes
"""
import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import os
import tempfile
from app.database.connection import Base, get_db

# Importar todos os modelos para registrar no Base.metadata
import app.models.processo

# Configurar banco de teste em memória
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"


def _enable_foreign_keys(dbapi_connection, connection_record):
    """Habilita foreign keys no SQLite"""
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


@pytest.fixture
def test_engine():
    """Engine para testes - um banco novo para cada teste"""
    engine = create_engine(
        "sqlite:///:memory:",  # Banco em memória para cada teste
        poolclass=StaticPool,
        connect_args={"check_same_thread": False}
    )
    
    # Habilitar foreign keys no SQLite
    event.listen(engine, "connect", _enable_foreign_keys)
    
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def test_db(test_engine):
    """Sessão de banco de dados para testes"""
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    db = TestingSessionLocal()
    
    try:
        yield db
    finally:
        db.rollback()  # Garantir rollback de qualquer transação pendente
        db.close()


@pytest.fixture
def client(test_db):
    """Cliente de teste FastAPI"""
    from fastapi.testclient import TestClient
    from app.main import app
    
    def override_get_db():
        try:
            yield test_db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def temp_dir():
    """Diretório temporário para testes"""
    with tempfile.TemporaryDirectory() as tmpdirname:
        yield tmpdirname 