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
        # Obter URL do banco de dados
        self.database_url = os.getenv("DATABASE_URL", "sqlite:///./sei_scraper.db")
        
        # Se estivermos em ambiente de teste, sempre usar SQLite em memória
        if os.getenv("ENVIRONMENT") == "test":
            self.database_url = "sqlite:///:memory:"
            self.test_database_url = "sqlite:///:memory:"
        else:
            self.test_database_url = "sqlite:///:memory:"
        
        # Configurações de debug
        self.echo = os.getenv("DB_ECHO", "false").lower() == "true"
        
    def get_engine(self, test: bool = False):
        """Cria engine do SQLAlchemy com fallback para SQLite"""
        url = self.test_database_url if test else self.database_url
        
        # Se URL começa com postgres mas não temos psycopg2, usar SQLite
        if url.startswith(("postgresql://", "postgres://")):
            try:
                import psycopg2
                # Converter postgresql:// para postgresql+psycopg2://
                if url.startswith("postgresql://"):
                    url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
                elif url.startswith("postgres://"):
                    url = url.replace("postgres://", "postgresql+psycopg2://", 1)
                
                # Tentar criar engine PostgreSQL
                engine = create_engine(
                    url,
                    echo=self.echo,
                    pool_size=10,
                    max_overflow=20,
                    pool_pre_ping=True,
                    pool_recycle=300
                )
                
                # Testar conexão
                with engine.connect() as conn:
                    pass
                
                print(f"✅ Conectado ao PostgreSQL: {url[:30]}...")
                return engine
                
            except (ImportError, Exception) as e:
                print(f"⚠️ PostgreSQL não disponível ({e}), usando SQLite como fallback")
                url = "sqlite:///./sei_scraper.db"
        
        # Configuração para SQLite (desenvolvimento/fallback)
        if url.startswith("sqlite"):
            engine = create_engine(
                url,
                echo=self.echo,
                poolclass=StaticPool,
                connect_args={"check_same_thread": False}
            )
            print(f"✅ Conectado ao SQLite: {url}")
            return engine
        
        # Fallback final para SQLite
        print("⚠️ Configuração de banco inválida, usando SQLite como fallback final")
        return create_engine(
            "sqlite:///./sei_scraper.db",
            echo=self.echo,
            poolclass=StaticPool,
            connect_args={"check_same_thread": False}
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
    """Dependency para obter sessão de banco"""
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
    try:
        engine = db_config.get_engine(test=test)
        Base.metadata.create_all(bind=engine)
        print("✅ Tabelas criadas com sucesso")
    except Exception as e:
        print(f"⚠️ Erro ao criar tabelas: {e}")
        # Em produção, continua mesmo com erro de banco
        if os.getenv("ENVIRONMENT") != "production":
            raise e

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