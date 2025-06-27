"""
Testes para configuração e conexão do banco de dados
"""
import pytest
import os
from sqlalchemy import text
from sqlalchemy.exc import OperationalError, IntegrityError
from app.database.connection import DatabaseConfig, create_tables, drop_tables, get_db, get_test_db


@pytest.mark.unit
class TestDatabaseConfig:
    """Testes para configuração do banco"""
    
    def test_database_config_init(self):
        """Testa inicialização da configuração"""
        config = DatabaseConfig()
        
        assert config.database_url is not None
        assert config.test_database_url is not None
        assert isinstance(config.echo, bool)
    
    def test_get_engine_sqlite(self):
        """Testa criação de engine SQLite"""
        config = DatabaseConfig()
        # Temporarily override the URL to test SQLite
        original_url = config.test_database_url
        config.test_database_url = "sqlite:///test.db"
        
        engine = config.get_engine(test=True)
        
        assert engine is not None
        assert "sqlite" in str(engine.url)
        
        # Restore original URL
        config.test_database_url = original_url
    
    def test_get_session_local(self):
        """Testa criação de SessionLocal"""
        config = DatabaseConfig()
        session_local = config.get_session_local(test=True)
        
        assert session_local is not None
        # Test that we can create a session
        session = session_local()
        assert session is not None
        session.close()


@pytest.mark.db
class TestDatabaseConnection:
    """Testes para conexão com banco"""
    
    def test_database_connection(self, test_db):
        """Testa conectividade básica"""
        # Execute uma query simples
        result = test_db.execute(text("SELECT 1 as test_value"))
        row = result.fetchone()
        
        assert row is not None
        assert row[0] == 1
    
    def test_database_transaction(self, test_db):
        """Testa transações do banco"""
        from app.models.processo import Processo
        
        # Criar um processo
        processo = Processo(
            numero_sei="SEI-TRANSACTION-TEST/2025",
            url="https://sei.rj.gov.br/test"
        )
        
        test_db.add(processo)
        test_db.commit()
        
        # Verificar se foi salvo
        saved_processo = test_db.query(Processo).filter(
            Processo.numero_sei == "SEI-TRANSACTION-TEST/2025"
        ).first()
        
        assert saved_processo is not None
        assert saved_processo.numero_sei == "SEI-TRANSACTION-TEST/2025"
    
    def test_database_rollback(self, test_db):
        """Testa rollback de transações"""
        from app.models.processo import Processo
        
        # Contar processos antes
        count_before = test_db.query(Processo).count()
        
        # Tentar adicionar processo e fazer rollback
        processo = Processo(
            numero_sei="SEI-ROLLBACK-TEST/2025",
            url="https://sei.rj.gov.br/test"
        )
        
        test_db.add(processo)
        test_db.rollback()  # Rollback explícito
        
        # Verificar que não foi salvo
        count_after = test_db.query(Processo).count()
        assert count_after == count_before
        
        # Verificar que processo não existe
        saved_processo = test_db.query(Processo).filter(
            Processo.numero_sei == "SEI-ROLLBACK-TEST/2025"
        ).first()
        
        assert saved_processo is None


@pytest.mark.db
class TestDatabaseOperations:
    """Testes para operações do banco"""
    
    def test_create_and_drop_tables(self, test_engine):
        """Testa criação e remoção de tabelas"""
        from app.database.connection import Base
        
        # Drop all tables first
        Base.metadata.drop_all(bind=test_engine)
        
        # Verify tables don't exist by trying to query
        with pytest.raises(OperationalError):
            with test_engine.connect() as conn:
                conn.execute(text("SELECT * FROM processos LIMIT 1"))
        
        # Create tables
        Base.metadata.create_all(bind=test_engine)
        
        # Verify tables exist by querying
        with test_engine.connect() as conn:
            result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
            tables = [row[0] for row in result.fetchall()]
            
            expected_tables = [
                'processos', 'autuacoes', 'documentos', 
                'documento_tags', 'documento_entidades', 'andamentos'
            ]
            
            for table in expected_tables:
                assert table in tables
    
    def test_dependency_get_db(self):
        """Testa dependency get_db"""
        db_generator = get_db()
        db = next(db_generator)
        
        assert db is not None
        
        # Cleanup
        try:
            next(db_generator)
        except StopIteration:
            pass  # Expected
    
    def test_dependency_get_test_db(self):
        """Testa dependency get_test_db"""
        db_generator = get_test_db()
        db = next(db_generator)
        
        assert db is not None
        
        # Cleanup  
        try:
            next(db_generator)
        except StopIteration:
            pass  # Expected


@pytest.mark.db
class TestDatabaseConstraints:
    """Testes para constraints do banco"""
    
    def test_foreign_key_constraints(self, test_db):
        """Testa foreign key constraints"""
        from app.models.processo import Processo, Autuacao
        
        # Tentar criar autuação sem processo deve falhar
        autuacao = Autuacao(
            processo_id=99999,  # ID que não existe
            numero_sei="SEI-123456/123456/2025"
        )
        
        test_db.add(autuacao)
        
        # Deve falhar devido ao foreign key constraint
        with pytest.raises(IntegrityError):
            test_db.commit()
    
    def test_unique_constraints(self, test_db):
        """Testa unique constraints"""
        from app.models.processo import Processo
        
        # Criar primeiro processo
        processo1 = Processo(
            numero_sei="SEI-UNIQUE-TEST/2025",
            url="https://sei.rj.gov.br/test1"
        )
        test_db.add(processo1)
        test_db.commit()
        
        # Tentar criar segundo processo com mesmo número SEI
        processo2 = Processo(
            numero_sei="SEI-UNIQUE-TEST/2025",
            url="https://sei.rj.gov.br/test2"
        )
        test_db.add(processo2)
        
        # Deve falhar devido ao unique constraint
        with pytest.raises(IntegrityError):
            test_db.commit()


@pytest.mark.integration  
class TestDatabaseIntegration:
    """Testes de integração do banco"""
    
    def test_full_processo_creation(self, test_db):
        """Testa criação completa de um processo com relacionamentos"""
        from app.models.processo import Processo, Autuacao, Documento, Andamento
        from datetime import datetime, date
        
        # Criar processo
        processo = Processo(
            numero_sei="SEI-INTEGRATION-TEST/2025",
            url="https://sei.rj.gov.br/integration-test",
            tipo="Administrativo",
            data_geracao=date(2025, 3, 18),
            interessados="Teste de Integração"
        )
        test_db.add(processo)
        test_db.commit()
        test_db.refresh(processo)
        
        # Criar autuação
        autuacao = Autuacao(
            processo_id=processo.id,
            numero_sei=processo.numero_sei,
            tipo=processo.tipo,
            data_geracao=processo.data_geracao,
            interessados=processo.interessados
        )
        test_db.add(autuacao)
        
        # Criar documento
        documento = Documento(
            processo_id=processo.id,
            numero_documento="12345",
            tipo="Correspondência",
            data_documento=date(2025, 3, 19),
            unidade="UENF/DIRCCH"
        )
        test_db.add(documento)
        
        # Criar andamento
        andamento = Andamento(
            processo_id=processo.id,
            data_hora=datetime(2025, 3, 18, 17, 4),
            unidade="UENF/DIRCCH",
            descricao="Processo criado"
        )
        test_db.add(andamento)
        
        test_db.commit()
        
        # Verificar relacionamentos
        test_db.refresh(processo)
        assert processo.autuacao is not None
        assert len(processo.documentos) == 1
        assert len(processo.andamentos) == 1
        
        assert processo.autuacao.numero_sei == processo.numero_sei
        assert processo.documentos[0].numero_documento == "12345"
        assert processo.andamentos[0].descricao == "Processo criado" 