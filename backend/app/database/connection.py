"""
Configuração de conexão com banco de dados
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from typing import Generator

# Base para modelos SQLAlchemy
Base = declarative_base()

class DatabaseConfig:
    """Configuração do banco de dados"""
    
    def __init__(self):
        # Se estivermos em ambiente de teste, usar SQLite
        if os.getenv("ENVIRONMENT") == "test":
            self.database_url = "sqlite:///:memory:"
            self.test_database_url = "sqlite:///:memory:"
        else:
            self.database_url = os.getenv("DATABASE_URL", "postgresql://sei_user:sei_password@localhost:5432/sei_scraper")
            self.test_database_url = os.getenv("TEST_DATABASE_URL", "postgresql://sei_user:sei_password@localhost:5432/sei_scraper_test")
        
        self.echo = os.getenv("DB_ECHO", "false").lower() == "true"

    def get_engine(self, test: bool = False):
        """Cria engine do SQLAlchemy"""
        url = self.test_database_url if test else self.database_url
        
        if url.startswith("sqlite"):
            # Configuração especial para SQLite (testes)
            return create_engine(
                url,
                echo=self.echo,
                poolclass=StaticPool,
                connect_args={"check_same_thread": False}
            )
        else:
            # PostgreSQL
            return create_engine(
                url,
                echo=self.echo,
                pool_size=10,
                max_overflow=20,
                pool_pre_ping=True
            )

    def get_session_local(self, test: bool = False):
        """Cria SessionLocal"""
        engine = self.get_engine(test=test)
        return sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Instância global
db_config = DatabaseConfig()

# Para testes, sempre usar a configuração de teste
if os.getenv("ENVIRONMENT") == "test":
    SessionLocal = db_config.get_session_local(test=True)
    engine = db_config.get_engine(test=True)
else:
    SessionLocal = db_config.get_session_local()
    engine = db_config.get_engine()

TestSessionLocal = db_config.get_session_local(test=True)

def get_db() -> Generator:
    """Dependency para obter sessão do banco"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_test_db() -> Generator:
    """Dependency para obter sessão de teste"""
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables(test: bool = False):
    """Cria todas as tabelas"""
    engine = db_config.get_engine(test=test)
    Base.metadata.create_all(bind=engine)

def drop_tables(test: bool = False):
    """Drop todas as tabelas"""
    engine = db_config.get_engine(test=test)
    Base.metadata.drop_all(bind=engine)

def init_test_db():
    """Inicializa banco de teste - deve ser chamado após import dos modelos"""
    if os.getenv("ENVIRONMENT") == "test":
        # Importar modelos para registrar no metadata
        try:
            from app.models import processo  # Isso registra os modelos
            Base.metadata.create_all(bind=engine)
        except ImportError:
            pass  # Modelos podem não estar disponíveis ainda 