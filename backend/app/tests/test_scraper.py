"""
Testes para módulo de scraping SEI
Seguindo metodologia TDD - testes primeiro!
"""
import pytest
from bs4 import BeautifulSoup
from datetime import datetime, date
from app.scraper.parsers import SEIParser
from app.scraper.config import ScraperConfig
from app.models.schemas import ProcessoData, AutuacaoData, DocumentoData, AndamentoData


@pytest.mark.unit
class TestSEIParser:
    """Testes para parsers SEI"""
    
    def test_parse_autuacao_basic(self):
        """Testa parse básico da autuação"""
        # HTML mock de uma tabela de autuação típica do SEI
        html_autuacao = """
        <table class="infraTable">
            <tr>
                <td class="infraTdLabel">Processo:</td>
                <td class="infraTdDado">SEI-123456/789/2025</td>
            </tr>
            <tr>
                <td class="infraTdLabel">Tipo do Processo:</td>
                <td class="infraTdDado">Administrativo</td>
            </tr>
            <tr>
                <td class="infraTdLabel">Data de Geração:</td>
                <td class="infraTdDado">18/03/2025</td>
            </tr>
            <tr>
                <td class="infraTdLabel">Interessados:</td>
                <td class="infraTdDado">João da Silva</td>
            </tr>
        </table>
        """
        
        soup = BeautifulSoup(html_autuacao, 'html.parser')
        result = SEIParser.parse_autuacao_table(soup)
        
        assert result is not None
        assert result['numero_sei'] == 'SEI-123456/789/2025'
        assert result['tipo'] == 'Administrativo'
        assert result['data_geracao'] == date(2025, 3, 18)
        assert result['interessados'] == 'João da Silva'
    
    def test_parse_autuacao_missing_fields(self):
        """Testa parse de autuação com campos faltantes"""
        html_autuacao = """
        <table class="infraTable">
            <tr>
                <td class="infraTdLabel">Processo:</td>
                <td class="infraTdDado">SEI-123456/789/2025</td>
            </tr>
        </table>
        """
        
        soup = BeautifulSoup(html_autuacao, 'html.parser')
        result = SEIParser.parse_autuacao_table(soup)
        
        assert result is not None
        assert result['numero_sei'] == 'SEI-123456/789/2025'
        assert result.get('tipo') is None
        assert result.get('data_geracao') is None
        assert result.get('interessados') is None
    
    def test_parse_documentos_basic(self):
        """Testa parse básico da tabela de documentos"""
        html_documentos = """
        <table class="infraTable">
            <tr class="infraTrClara">
                <td>1</td>
                <td>12345</td>
                <td>Correspondência</td>
                <td>19/03/2025</td>
                <td>UENF/DIRCCH</td>
            </tr>
            <tr class="infraTrEscura">
                <td>2</td>
                <td>12346</td>
                <td>Despacho</td>
                <td>20/03/2025</td>
                <td>SEED/SUBGEP</td>
            </tr>
        </table>
        """
        
        soup = BeautifulSoup(html_documentos, 'html.parser')
        result = SEIParser.parse_documentos_table(soup)
        
        assert isinstance(result, list)
        assert len(result) == 2
        
        # Primeiro documento
        doc1 = result[0]
        assert doc1['numero_documento'] == '12345'
        assert doc1['tipo'] == 'Correspondência'
        assert doc1['data_documento'] == date(2025, 3, 19)
        assert doc1['unidade'] == 'UENF/DIRCCH'
        
        # Segundo documento
        doc2 = result[1]
        assert doc2['numero_documento'] == '12346'
        assert doc2['tipo'] == 'Despacho'
        assert doc2['data_documento'] == date(2025, 3, 20)
        assert doc2['unidade'] == 'SEED/SUBGEP'
    
    def test_parse_documentos_empty_table(self):
        """Testa parse de tabela de documentos vazia"""
        html_documentos = """
        <table class="infraTable">
            <tr>
                <td colspan="5">Nenhum documento encontrado</td>
            </tr>
        </table>
        """
        
        soup = BeautifulSoup(html_documentos, 'html.parser')
        result = SEIParser.parse_documentos_table(soup)
        
        assert isinstance(result, list)
        assert len(result) == 0
    
    def test_parse_andamentos_basic(self):
        """Testa parse básico da tabela de andamentos"""
        html_andamentos = """
        <table class="infraTable">
            <tr class="infraTrClara">
                <td>18/03/2025 17:04</td>
                <td>Processo criado por João da Silva</td>
                <td>UENF/DIRCCH</td>
            </tr>
            <tr class="infraTrEscura">
                <td>19/03/2025 09:15</td>
                <td>Documento assinado digitalmente</td>
                <td>SEED/SUBGEP</td>
            </tr>
        </table>
        """
        
        soup = BeautifulSoup(html_andamentos, 'html.parser')
        result = SEIParser.parse_andamentos_table(soup)
        
        assert isinstance(result, list)
        assert len(result) == 2
        
        # Primeiro andamento
        and1 = result[0]
        assert and1['data_hora'] == datetime(2025, 3, 18, 17, 4)
        assert and1['descricao'] == 'Processo criado por João da Silva'
        assert and1['unidade'] == 'UENF/DIRCCH'
        
        # Segundo andamento
        and2 = result[1]
        assert and2['data_hora'] == datetime(2025, 3, 19, 9, 15)
        assert and2['descricao'] == 'Documento assinado digitalmente'
        assert and2['unidade'] == 'SEED/SUBGEP'
    
    def test_parse_andamentos_chronological_order(self):
        """Testa que andamentos são retornados em ordem cronológica"""
        html_andamentos = """
        <table class="infraTable">
            <tr class="infraTrClara">
                <td>20/03/2025 10:30</td>
                <td>Processo encaminhado</td>
                <td>UENF/DIRCCH</td>
            </tr>
            <tr class="infraTrEscura">
                <td>18/03/2025 17:04</td>
                <td>Processo criado</td>
                <td>SEED/SUBGEP</td>
            </tr>
            <tr class="infraTrClara">
                <td>19/03/2025 09:15</td>
                <td>Documento anexado</td>
                <td>UENF/DIRCCH</td>
            </tr>
        </table>
        """
        
        soup = BeautifulSoup(html_andamentos, 'html.parser')
        result = SEIParser.parse_andamentos_table(soup)
        
        assert len(result) == 3
        
        # Deve estar em ordem cronológica crescente
        assert result[0]['data_hora'] == datetime(2025, 3, 18, 17, 4)
        assert result[1]['data_hora'] == datetime(2025, 3, 19, 9, 15)
        assert result[2]['data_hora'] == datetime(2025, 3, 20, 10, 30)
    
    def test_handle_malformed_html(self):
        """Testa tratamento de HTML malformado"""
        html_malformed = """
        <table class="infraTable">
            <tr>
                <td class="infraTdLabel">Processo:</td>
                <!-- Campo valor está ausente -->
            </tr>
            <tr>
                <!-- Linha incompleta -->
                <td class="infraTdLabel">Tipo:</td>
            </tr>
        """
        
        soup = BeautifulSoup(html_malformed, 'html.parser')
        
        # Não deve levantar exceção
        result = SEIParser.parse_autuacao_table(soup)
        assert isinstance(result, dict)
        
        # Campos ausentes devem ser None
        assert result.get('numero_sei') is None
        assert result.get('tipo') is None
    
    def test_handle_invalid_dates(self):
        """Testa tratamento de datas inválidas"""
        html_invalid_date = """
        <table class="infraTable">
            <tr>
                <td class="infraTdLabel">Data de Geração:</td>
                <td class="infraTdDado">data_inválida</td>
            </tr>
        </table>
        """
        
        soup = BeautifulSoup(html_invalid_date, 'html.parser')
        result = SEIParser.parse_autuacao_table(soup)
        
        # Data inválida deve retornar None
        assert result.get('data_geracao') is None
    
    def test_parse_empty_soup(self):
        """Testa parse de soup vazio"""
        empty_soup = BeautifulSoup('', 'html.parser')
        
        autuacao_result = SEIParser.parse_autuacao_table(empty_soup)
        docs_result = SEIParser.parse_documentos_table(empty_soup)
        ands_result = SEIParser.parse_andamentos_table(empty_soup)
        
        assert isinstance(autuacao_result, dict)
        assert isinstance(docs_result, list)
        assert isinstance(ands_result, list)
        assert len(docs_result) == 0
        assert len(ands_result) == 0


@pytest.mark.unit
class TestScraperConfig:
    """Testes para configuração do scraper"""
    
    def test_scraper_config_default(self):
        """Testa configuração padrão do scraper"""
        config = ScraperConfig()
        
        assert config.delay > 0
        assert config.timeout > 0
        assert config.max_retries >= 1
        assert config.user_agent is not None
        assert len(config.user_agent) > 0
    
    def test_scraper_config_custom(self):
        """Testa configuração customizada do scraper"""
        config = ScraperConfig(
            delay=3,
            timeout=45,
            max_retries=5,
            user_agent="CustomBot/1.0"
        )
        
        assert config.delay == 3
        assert config.timeout == 45
        assert config.max_retries == 5
        assert config.user_agent == "CustomBot/1.0"


@pytest.mark.unit  
class TestScraperValidation:
    """Testes para validação de dados do scraper"""
    
    def test_validate_processo_data_complete(self):
        """Testa validação de dados completos do processo"""
        processo_data = ProcessoData(
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
        
        # Deve validar sem erros
        assert processo_data.autuacao.numero_sei.startswith("SEI-")
        assert len(processo_data.documentos) == 1
        assert len(processo_data.andamentos) == 1
    
    def test_validate_processo_data_minimal(self):
        """Testa validação de dados mínimos do processo"""
        processo_data = ProcessoData(
            autuacao=AutuacaoData(numero_sei="SEI-123456/789/2025"),
            documentos=[],
            andamentos=[]
        )
        
        # Deve validar sem erros mesmo com dados mínimos
        assert processo_data.autuacao.numero_sei.startswith("SEI-")
        assert len(processo_data.documentos) == 0
        assert len(processo_data.andamentos) == 0 