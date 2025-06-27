"""
Testes para schemas Pydantic
"""
import pytest
from datetime import datetime, date
from decimal import Decimal
from pydantic import ValidationError
from app.models.schemas import (
    ProcessoCreate, ProcessoUpdate, ProcessoInDB,
    AutocaoCreate, AutocaoInDB,
    DocumentoCreate, DocumentoUpdate, DocumentoInDB,
    AndamentoCreate, AndamentoInDB,
    DocumentoTagCreate, DocumentoTagInDB,
    DocumentoEntidadeCreate, DocumentoEntidadeInDB,
    ProcessoData, ScrapingResult
)


@pytest.mark.unit
class TestProcessoSchemas:
    """Testes para schemas de Processo"""
    
    def test_processo_create_valid(self):
        """Testa criação válida de ProcessoCreate"""
        data = {
            "numero_sei": "SEI-260002/002172/2025",
            "url": "https://sei.rj.gov.br/sei/modulos/pesquisa/md_pesq_processo_exibir.php?test",
            "tipo": "Administrativo: Elaboração de Correspondência Interna",
            "data_geracao": "2025-03-18",
            "interessados": "Agência de Inovação da UENF DGA/UENF"
        }
        
        processo = ProcessoCreate(**data)
        
        assert processo.numero_sei == "SEI-260002/002172/2025"
        assert "sei.rj.gov.br" in processo.url
        assert processo.status == "ativo"  # valor padrão
        assert processo.data_geracao == date(2025, 3, 18)
    
    def test_processo_create_invalid_numero_sei(self):
        """Testa validação de número SEI inválido"""
        data = {
            "numero_sei": "123456/789/2025",  # Sem prefixo SEI-
            "url": "https://sei.rj.gov.br/test"
        }
        
        with pytest.raises(ValidationError) as exc_info:
            ProcessoCreate(**data)
        
        assert "deve começar com \"SEI-\"" in str(exc_info.value)
    
    def test_processo_create_empty_numero_sei(self):
        """Testa validação de número SEI vazio"""
        data = {
            "numero_sei": "",
            "url": "https://sei.rj.gov.br/test"
        }
        
        with pytest.raises(ValidationError) as exc_info:
            ProcessoCreate(**data)
        
        assert "não pode estar vazio" in str(exc_info.value)
    
    def test_processo_create_invalid_url(self):
        """Testa validação de URL inválida"""
        data = {
            "numero_sei": "SEI-123456/789/2025",
            "url": "https://google.com"  # URL não é do SEI RJ
        }
        
        with pytest.raises(ValidationError) as exc_info:
            ProcessoCreate(**data)
        
        assert "deve ser do sistema SEI do RJ" in str(exc_info.value)
    
    def test_processo_update_partial(self):
        """Testa atualização parcial de processo"""
        data = {
            "tipo": "Novo tipo",
            "status": "concluido"
        }
        
        processo_update = ProcessoUpdate(**data)
        
        assert processo_update.tipo == "Novo tipo"
        assert processo_update.status == "concluido"
        assert processo_update.data_geracao is None  # Não fornecido
    
    def test_processo_in_db_from_orm(self):
        """Testa ProcessoInDB com dados do ORM"""
        # Simular dados vindos do ORM
        orm_data = {
            "id": 1,
            "numero_sei": "SEI-123456/789/2025",
            "url": "https://sei.rj.gov.br/test",
            "tipo": "Administrativo",
            "data_geracao": date(2025, 3, 18),
            "interessados": "Teste",
            "status": "ativo",
            "created_at": datetime(2025, 1, 15, 10, 30),
            "updated_at": datetime(2025, 1, 15, 10, 30)
        }
        
        processo = ProcessoInDB(**orm_data)
        
        assert processo.id == 1
        assert processo.numero_sei == "SEI-123456/789/2025"
        assert isinstance(processo.created_at, datetime)


@pytest.mark.unit
class TestDocumentoSchemas:
    """Testes para schemas de Documento"""
    
    def test_documento_create_valid(self):
        """Testa criação válida de DocumentoCreate"""
        data = {
            "processo_id": 1,
            "numero_documento": "95725517",
            "tipo": "Correspondência Interna - NA",
            "data_documento": "2025-03-19",
            "data_inclusao": "2025-03-19",
            "unidade": "UENF/DIRCCH"
        }
        
        documento = DocumentoCreate(**data)
        
        assert documento.processo_id == 1
        assert documento.numero_documento == "95725517"
        assert documento.downloaded is False  # valor padrão
    
    def test_documento_update_llm_fields(self):
        """Testa atualização de campos LLM"""
        data = {
            "detalhamento_texto": "Resumo do documento gerado por LLM",
            "detalhamento_status": "concluido",
            "detalhamento_modelo": "gpt-4-turbo",
            "detalhamento_tokens": 250
        }
        
        documento_update = DocumentoUpdate(**data)
        
        assert documento_update.detalhamento_texto == "Resumo do documento gerado por LLM"
        assert documento_update.detalhamento_status == "concluido"
        assert documento_update.detalhamento_tokens == 250
    
    def test_documento_in_db_complete(self):
        """Testa DocumentoInDB com todos os campos"""
        data = {
            "id": 1,
            "processo_id": 1,
            "numero_documento": "95725517",
            "tipo": "Correspondência",
            "data_documento": date(2025, 3, 19),
            "data_inclusao": date(2025, 3, 19),
            "unidade": "UENF/DIRCCH",
            "arquivo_path": "/documents/95725517.pdf",
            "downloaded": True,
            "detalhamento_texto": "Resumo...",
            "detalhamento_status": "concluido",
            "detalhamento_data": datetime(2025, 3, 19, 15, 30),
            "detalhamento_modelo": "gpt-4-turbo",
            "detalhamento_tokens": 200,
            "created_at": datetime(2025, 3, 19, 10, 0),
            "updated_at": datetime(2025, 3, 19, 15, 30)
        }
        
        documento = DocumentoInDB(**data)
        
        assert documento.id == 1
        assert documento.downloaded is True
        assert documento.detalhamento_status == "concluido"
        assert documento.detalhamento_tokens == 200


@pytest.mark.unit
class TestAndamentoSchemas:
    """Testes para schemas de Andamento"""
    
    def test_andamento_create_valid(self):
        """Testa criação válida de AndamentoCreate"""
        data = {
            "processo_id": 1,
            "data_hora": "2025-03-18T17:04:00",
            "unidade": "UENF/DIRCCH",
            "descricao": "Processo público gerado"
        }
        
        andamento = AndamentoCreate(**data)
        
        assert andamento.processo_id == 1
        assert andamento.data_hora == datetime(2025, 3, 18, 17, 4)
        assert andamento.unidade == "UENF/DIRCCH"
    
    def test_andamento_create_minimal(self):
        """Testa criação com campos mínimos"""
        data = {
            "processo_id": 1,
            "data_hora": "2025-03-18T17:04:00"
        }
        
        andamento = AndamentoCreate(**data)
        
        assert andamento.processo_id == 1
        assert andamento.unidade is None
        assert andamento.descricao is None


@pytest.mark.unit
class TestDocumentoTagSchemas:
    """Testes para schemas de DocumentoTag"""
    
    def test_documento_tag_create_valid(self):
        """Testa criação válida de DocumentoTagCreate"""
        data = {
            "documento_id": 1,
            "tag": "despacho",
            "confianca": "0.95",
            "origem": "llm"
        }
        
        tag = DocumentoTagCreate(**data)
        
        assert tag.documento_id == 1
        assert tag.tag == "despacho"
        assert tag.confianca == Decimal("0.95")
        assert tag.origem == "llm"
    
    def test_documento_tag_create_defaults(self):
        """Testa valores padrão"""
        data = {
            "documento_id": 1,
            "tag": "importante"
        }
        
        tag = DocumentoTagCreate(**data)
        
        assert tag.origem == "llm"  # valor padrão
        assert tag.confianca is None


@pytest.mark.unit
class TestDocumentoEntidadeSchemas:
    """Testes para schemas de DocumentoEntidade"""
    
    def test_documento_entidade_create_complete(self):
        """Testa criação completa de DocumentoEntidadeCreate"""
        data = {
            "documento_id": 1,
            "tipo_entidade": "pessoa",
            "valor": "João Silva",
            "contexto": "O requerente João Silva solicita...",
            "posicao_inicio": 12,
            "posicao_fim": 22,
            "confianca": "0.90"
        }
        
        entidade = DocumentoEntidadeCreate(**data)
        
        assert entidade.documento_id == 1
        assert entidade.tipo_entidade == "pessoa"
        assert entidade.valor == "João Silva"
        assert entidade.confianca == Decimal("0.90")
    
    def test_documento_entidade_create_minimal(self):
        """Testa criação com campos mínimos"""
        data = {
            "documento_id": 1,
            "tipo_entidade": "valor",
            "valor": "R$ 1000,00"
        }
        
        entidade = DocumentoEntidadeCreate(**data)
        
        assert entidade.documento_id == 1
        assert entidade.contexto is None
        assert entidade.posicao_inicio is None


@pytest.mark.unit
class TestScrapingSchemas:
    """Testes para schemas de scraping"""
    
    def test_processo_data_valid(self):
        """Testa ProcessoData válido"""
        data = {
            "autuacao": {
                "numero_sei": "SEI-123456/789/2025",
                "tipo": "Administrativo"
            },
            "documentos": [
                {
                    "numero_documento": "12345",
                    "tipo": "Correspondência"
                }
            ],
            "andamentos": [
                {
                    "data_hora": "2025-03-18T17:04:00",
                    "unidade": "UENF/DIRCCH"
                }
            ]
        }
        
        processo_data = ProcessoData(**data)
        
        assert processo_data.autuacao.numero_sei == "SEI-123456/789/2025"
        assert len(processo_data.documentos) == 1
        assert len(processo_data.andamentos) == 1
    
    def test_scraping_result_success(self):
        """Testa ScrapingResult de sucesso"""
        processo_data = {
            "autuacao": {"numero_sei": "SEI-123456/789/2025"},
            "documentos": [{"numero_documento": "12345"}],
            "andamentos": [{"data_hora": "2025-03-18T17:04:00"}]
        }
        
        data = {
            "success": True,
            "processo_data": processo_data,
            "scraped_at": "2025-03-18T17:04:00"
        }
        
        result = ScrapingResult(**data)
        
        assert result.success is True
        assert result.processo_data is not None
        assert result.error_message is None
    
    def test_scraping_result_error(self):
        """Testa ScrapingResult de erro"""
        data = {
            "success": False,
            "error_message": "Erro ao acessar página",
            "scraped_at": "2025-03-18T17:04:00"
        }
        
        result = ScrapingResult(**data)
        
        assert result.success is False
        assert result.processo_data is None
        assert result.error_message == "Erro ao acessar página"


@pytest.mark.unit
class TestSchemaValidation:
    """Testes para validações específicas"""
    
    def test_numero_sei_whitespace_handling(self):
        """Testa tratamento de espaços em branco no número SEI"""
        data = {
            "numero_sei": "  SEI-123456/789/2025  ",  # Com espaços
            "url": "https://sei.rj.gov.br/test"
        }
        
        processo = ProcessoCreate(**data)
        
        assert processo.numero_sei == "SEI-123456/789/2025"  # Sem espaços
    
    def test_date_validation(self):
        """Testa validação de datas"""
        # Data válida como string
        data1 = {
            "processo_id": 1,
            "data_hora": "2025-03-18T17:04:00"
        }
        andamento1 = AndamentoCreate(**data1)
        assert isinstance(andamento1.data_hora, datetime)
        
        # Data válida como datetime
        data2 = {
            "processo_id": 1,
            "data_hora": datetime(2025, 3, 18, 17, 4)
        }
        andamento2 = AndamentoCreate(**data2)
        assert isinstance(andamento2.data_hora, datetime)
    
    def test_decimal_validation(self):
        """Testa validação de campos decimais"""
        data = {
            "documento_id": 1,
            "tag": "teste",
            "confianca": 0.95  # float
        }
        
        tag = DocumentoTagCreate(**data)
        assert isinstance(tag.confianca, Decimal)
        assert tag.confianca == Decimal("0.95") 