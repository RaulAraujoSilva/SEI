"""
Testes unitários para modelos de dados
"""
import pytest
from datetime import datetime, date
from sqlalchemy.exc import IntegrityError
from app.models.processo import Processo, Autuacao, Documento, DocumentoTag, DocumentoEntidade, Andamento


@pytest.mark.unit
class TestProcessoModel:
    """Testes para o modelo Processo"""
    
    def test_create_processo_basic(self, test_db):
        """Testa criação básica de processo"""
        processo = Processo(
            numero_sei="SEI-260002/002172/2025",
            url="https://sei.rj.gov.br/sei/modulos/pesquisa/md_pesq_processo_exibir.php?test",
            tipo="Administrativo: Elaboração de Correspondência Interna",
            data_geracao=date(2025, 3, 18),
            interessados="Agência de Inovação da UENF DGA/UENF"
        )
        
        test_db.add(processo)
        test_db.commit()
        test_db.refresh(processo)
        
        assert processo.id is not None
        assert processo.numero_sei == "SEI-260002/002172/2025"
        assert processo.status == "ativo"  # valor padrão
        assert processo.created_at is not None
        assert processo.updated_at is not None
    
    def test_processo_numero_sei_unique(self, test_db):
        """Testa constraint de unicidade do número SEI"""
        # Primeiro processo
        processo1 = Processo(
            numero_sei="SEI-123456/123456/2025",
            url="https://sei.rj.gov.br/test1"
        )
        test_db.add(processo1)
        test_db.commit()
        
        # Segundo processo com mesmo número SEI deve falhar
        processo2 = Processo(
            numero_sei="SEI-123456/123456/2025",
            url="https://sei.rj.gov.br/test2"
        )
        test_db.add(processo2)
        
        with pytest.raises(IntegrityError):
            test_db.commit()
    
    def test_processo_repr(self, test_db):
        """Testa representação string do processo"""
        processo = Processo(
            numero_sei="SEI-123456/123456/2025",
            url="https://sei.rj.gov.br/test",
            status="ativo"
        )
        
        expected = "<Processo(numero_sei='SEI-123456/123456/2025', status='ativo')>"
        assert repr(processo) == expected


@pytest.mark.unit
class TestAutuacaoModel:
    """Testes para o modelo Autuacao"""
    
    def test_create_autuacao(self, test_db):
        """Testa criação de autuação"""
        # Criar processo primeiro
        processo = Processo(
            numero_sei="SEI-260002/002172/2025",
            url="https://sei.rj.gov.br/test"
        )
        test_db.add(processo)
        test_db.commit()
        test_db.refresh(processo)
        
        # Criar autuação
        autuacao = Autuacao(
            processo_id=processo.id,
            numero_sei="SEI-260002/002172/2025",
            tipo="Administrativo: Elaboração de Correspondência Interna",
            data_geracao=date(2025, 3, 18),
            interessados="Agência de Inovação da UENF DGA/UENF"
        )
        
        test_db.add(autuacao)
        test_db.commit()
        test_db.refresh(autuacao)
        
        assert autuacao.id is not None
        assert autuacao.processo_id == processo.id
        assert autuacao.numero_sei == "SEI-260002/002172/2025"
        assert autuacao.created_at is not None
    
    def test_autuacao_unique_per_processo(self, test_db):
        """Testa que só pode haver uma autuação por processo"""
        # Criar processo
        processo = Processo(
            numero_sei="SEI-123456/123456/2025",
            url="https://sei.rj.gov.br/test"
        )
        test_db.add(processo)
        test_db.commit()
        test_db.refresh(processo)
        
        # Primeira autuação
        autuacao1 = Autuacao(
            processo_id=processo.id,
            numero_sei="SEI-123456/123456/2025"
        )
        test_db.add(autuacao1)
        test_db.commit()
        
        # Segunda autuação para mesmo processo deve falhar
        autuacao2 = Autuacao(
            processo_id=processo.id,
            numero_sei="SEI-123456/123456/2025"
        )
        test_db.add(autuacao2)
        
        with pytest.raises(IntegrityError):
            test_db.commit()
    
    def test_autuacao_relationship(self, test_db):
        """Testa relacionamento entre processo e autuação"""
        # Criar processo com autuação
        processo = Processo(
            numero_sei="SEI-123456/123456/2025",
            url="https://sei.rj.gov.br/test"
        )
        test_db.add(processo)
        test_db.commit()
        test_db.refresh(processo)
        
        autuacao = Autuacao(
            processo_id=processo.id,
            numero_sei="SEI-123456/123456/2025"
        )
        test_db.add(autuacao)
        test_db.commit()
        
        # Testar relacionamento
        test_db.refresh(processo)
        assert processo.autuacao is not None
        assert processo.autuacao.numero_sei == "SEI-123456/123456/2025"
        
        # Testar relacionamento reverso
        test_db.refresh(autuacao)
        assert autuacao.processo is not None
        assert autuacao.processo.numero_sei == "SEI-123456/123456/2025"


@pytest.mark.unit
class TestDocumentoModel:
    """Testes para o modelo Documento"""
    
    def test_create_documento(self, test_db):
        """Testa criação de documento"""
        # Criar processo primeiro
        processo = Processo(
            numero_sei="SEI-260002/002172/2025",
            url="https://sei.rj.gov.br/test"
        )
        test_db.add(processo)
        test_db.commit()
        test_db.refresh(processo)
        
        # Criar documento
        documento = Documento(
            processo_id=processo.id,
            numero_documento="95725517",
            tipo="Correspondência Interna - NA",
            data_documento=date(2025, 3, 19),
            data_inclusao=date(2025, 3, 19),
            unidade="UENF/DIRCCH",
            downloaded=False
        )
        
        test_db.add(documento)
        test_db.commit()
        test_db.refresh(documento)
        
        assert documento.id is not None
        assert documento.processo_id == processo.id
        assert documento.numero_documento == "95725517"
        assert documento.detalhamento_status == "pendente"  # valor padrão
        assert documento.downloaded is False
        assert documento.created_at is not None
    
    def test_documento_unique_per_processo(self, test_db):
        """Testa constraint de unicidade documento por processo"""
        # Criar processo
        processo = Processo(
            numero_sei="SEI-123456/123456/2025",
            url="https://sei.rj.gov.br/test"
        )
        test_db.add(processo)
        test_db.commit()
        test_db.refresh(processo)
        
        # Primeiro documento
        doc1 = Documento(
            processo_id=processo.id,
            numero_documento="12345"
        )
        test_db.add(doc1)
        test_db.commit()
        
        # Segundo documento mesmo número no mesmo processo deve falhar
        doc2 = Documento(
            processo_id=processo.id,
            numero_documento="12345"
        )
        test_db.add(doc2)
        
        with pytest.raises(IntegrityError):
            test_db.commit()
    
    def test_documento_llm_fields(self, test_db):
        """Testa campos relacionados ao LLM"""
        processo = Processo(
            numero_sei="SEI-123456/123456/2025",
            url="https://sei.rj.gov.br/test"
        )
        test_db.add(processo)
        test_db.commit()
        test_db.refresh(processo)
        
        documento = Documento(
            processo_id=processo.id,
            numero_documento="12345",
            detalhamento_texto="Resumo do documento...",
            detalhamento_status="concluido",
            detalhamento_modelo="gpt-4-turbo",
            detalhamento_tokens=150
        )
        
        test_db.add(documento)
        test_db.commit()
        test_db.refresh(documento)
        
        assert documento.detalhamento_texto == "Resumo do documento..."
        assert documento.detalhamento_status == "concluido"
        assert documento.detalhamento_modelo == "gpt-4-turbo"
        assert documento.detalhamento_tokens == 150


@pytest.mark.unit
class TestAndamentoModel:
    """Testes para o modelo Andamento"""
    
    def test_create_andamento(self, test_db):
        """Testa criação de andamento"""
        # Criar processo primeiro
        processo = Processo(
            numero_sei="SEI-260002/002172/2025",
            url="https://sei.rj.gov.br/test"
        )
        test_db.add(processo)
        test_db.commit()
        test_db.refresh(processo)
        
        # Criar andamento
        andamento = Andamento(
            processo_id=processo.id,
            data_hora=datetime(2025, 3, 18, 17, 4),
            unidade="UENF/DIRCCH",
            descricao="Processo público gerado"
        )
        
        test_db.add(andamento)
        test_db.commit()
        test_db.refresh(andamento)
        
        assert andamento.id is not None
        assert andamento.processo_id == processo.id
        assert andamento.data_hora == datetime(2025, 3, 18, 17, 4)
        assert andamento.unidade == "UENF/DIRCCH"
        assert andamento.created_at is not None
    
    def test_andamento_unique_constraint(self, test_db):
        """Testa constraint de unicidade completa do andamento"""
        processo = Processo(
            numero_sei="SEI-123456/123456/2025",
            url="https://sei.rj.gov.br/test"
        )
        test_db.add(processo)
        test_db.commit()
        test_db.refresh(processo)
        
        data_hora = datetime(2025, 3, 18, 17, 4)
        
        # Primeiro andamento
        andamento1 = Andamento(
            processo_id=processo.id,
            data_hora=data_hora,
            unidade="UENF/DIRCCH",
            descricao="Processo público gerado"
        )
        test_db.add(andamento1)
        test_db.commit()
        
        # Andamento duplicado deve falhar
        andamento2 = Andamento(
            processo_id=processo.id,
            data_hora=data_hora,
            unidade="UENF/DIRCCH",
            descricao="Processo público gerado"
        )
        test_db.add(andamento2)
        
        with pytest.raises(IntegrityError):
            test_db.commit()
    
    def test_andamento_relationship(self, test_db):
        """Testa relacionamento entre processo e andamentos"""
        processo = Processo(
            numero_sei="SEI-123456/123456/2025",
            url="https://sei.rj.gov.br/test"
        )
        test_db.add(processo)
        test_db.commit()
        test_db.refresh(processo)
        
        # Criar múltiplos andamentos
        andamento1 = Andamento(
            processo_id=processo.id,
            data_hora=datetime(2025, 3, 18, 17, 4),
            unidade="UENF/DIRCCH",
            descricao="Primeiro andamento"
        )
        
        andamento2 = Andamento(
            processo_id=processo.id,
            data_hora=datetime(2025, 3, 19, 10, 30),
            unidade="UENF/DGA",
            descricao="Segundo andamento"
        )
        
        test_db.add_all([andamento1, andamento2])
        test_db.commit()
        
        # Testar relacionamento
        test_db.refresh(processo)
        assert len(processo.andamentos) == 2
        assert processo.andamentos[0].descricao in ["Primeiro andamento", "Segundo andamento"]


@pytest.mark.unit
class TestDocumentoTagModel:
    """Testes para o modelo DocumentoTag"""
    
    def test_create_documento_tag(self, test_db):
        """Testa criação de tag de documento"""
        # Setup: processo e documento
        processo = Processo(
            numero_sei="SEI-123456/123456/2025",
            url="https://sei.rj.gov.br/test"
        )
        test_db.add(processo)
        test_db.commit()
        test_db.refresh(processo)
        
        documento = Documento(
            processo_id=processo.id,
            numero_documento="12345"
        )
        test_db.add(documento)
        test_db.commit()
        test_db.refresh(documento)
        
        # Criar tag
        tag = DocumentoTag(
            documento_id=documento.id,
            tag="despacho",
            confianca=0.95,
            origem="llm"
        )
        
        test_db.add(tag)
        test_db.commit()
        test_db.refresh(tag)
        
        assert tag.id is not None
        assert tag.documento_id == documento.id
        assert tag.tag == "despacho"
        assert float(tag.confianca) == 0.95
        assert tag.origem == "llm"
    
    def test_documento_tag_unique_constraint(self, test_db):
        """Testa constraint de unicidade de tag por documento"""
        # Setup
        processo = Processo(numero_sei="SEI-123456/123456/2025", url="https://sei.rj.gov.br/test")
        test_db.add(processo)
        test_db.commit()
        test_db.refresh(processo)
        
        documento = Documento(processo_id=processo.id, numero_documento="12345")
        test_db.add(documento)
        test_db.commit()
        test_db.refresh(documento)
        
        # Primeira tag
        tag1 = DocumentoTag(documento_id=documento.id, tag="despacho")
        test_db.add(tag1)
        test_db.commit()
        
        # Tag duplicada deve falhar
        tag2 = DocumentoTag(documento_id=documento.id, tag="despacho")
        test_db.add(tag2)
        
        with pytest.raises(IntegrityError):
            test_db.commit()


@pytest.mark.unit
class TestDocumentoEntidadeModel:
    """Testes para o modelo DocumentoEntidade"""
    
    def test_create_documento_entidade(self, test_db):
        """Testa criação de entidade de documento"""
        # Setup
        processo = Processo(numero_sei="SEI-123456/123456/2025", url="https://sei.rj.gov.br/test")
        test_db.add(processo)
        test_db.commit()
        test_db.refresh(processo)
        
        documento = Documento(processo_id=processo.id, numero_documento="12345")
        test_db.add(documento)
        test_db.commit()
        test_db.refresh(documento)
        
        # Criar entidade
        entidade = DocumentoEntidade(
            documento_id=documento.id,
            tipo_entidade="pessoa",
            valor="João Silva",
            contexto="O requerente João Silva solicita...",
            posicao_inicio=12,
            posicao_fim=22,
            confianca=0.90
        )
        
        test_db.add(entidade)
        test_db.commit()
        test_db.refresh(entidade)
        
        assert entidade.id is not None
        assert entidade.documento_id == documento.id
        assert entidade.tipo_entidade == "pessoa"
        assert entidade.valor == "João Silva"
        assert entidade.contexto == "O requerente João Silva solicita..."
        assert entidade.posicao_inicio == 12
        assert entidade.posicao_fim == 22
        assert float(entidade.confianca) == 0.90 