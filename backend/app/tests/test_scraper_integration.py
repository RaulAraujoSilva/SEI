"""
Testes de integração para o scraper SEI
Seguindo metodologia TDD - testes primeiro!
"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime, date
from app.scraper.base import SEIScraper
from app.scraper.config import ScraperConfig
from app.models.schemas import ProcessoData, ScrapingResult


@pytest.mark.integration
class TestSEIScraperIntegration:
    """Testes de integração do scraper SEI"""
    
    @pytest.fixture
    def scraper_config(self):
        """Configuração de teste para o scraper"""
        return ScraperConfig(
            delay=0,  # Sem delay para testes
            timeout=10,
            max_retries=2
        )
    
    @pytest.fixture
    def mock_html_response(self):
        """HTML mock de uma página SEI completa"""
        return """
        <!DOCTYPE html>
        <html>
        <head><title>SEI - Processo</title></head>
        <body>
            <div id="divAutuacao">
                <!-- Tabela de Autuação -->
                <table class="infraTable">
                    <tr>
                        <td class="infraTdLabel">Processo:</td>
                        <td class="infraTdDado">SEI-260002/002172/2025</td>
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
            </div>
            
            <div id="divDocumentos">
                <!-- Tabela de Documentos -->
                <table class="infraTable">
                    <tr class="infraTrClara">
                        <td>1</td>
                        <td>12345</td>
                        <td>Correspondência</td>
                        <td>19/03/2025</td>
                        <td>UENF/DIRCCH</td>
                    </tr>
                </table>
            </div>
            
            <div id="divAndamentos">
                <!-- Tabela de Andamentos -->
                <table class="infraTable">
                    <tr class="infraTrClara">
                        <td>18/03/2025 17:04</td>
                        <td>Processo criado</td>
                        <td>UENF/DIRCCH</td>
                    </tr>
                </table>
            </div>
        </body>
        </html>
        """
    
    def test_scraper_initialization(self, scraper_config):
        """Testa inicialização do scraper"""
        scraper = SEIScraper(scraper_config)
        
        assert scraper.config == scraper_config
        assert scraper.session is None
        assert scraper.driver is None
    
    @pytest.mark.asyncio
    @patch('aiohttp.ClientSession.get')
    async def test_scrape_processo_success(self, mock_get, scraper_config, mock_html_response):
        """Testa scraping bem-sucedido de um processo"""
        # Mock da resposta HTTP
        mock_response = Mock()
        mock_response.status = 200
        mock_response.text = AsyncMock(return_value=mock_html_response)
        mock_get.return_value.__aenter__.return_value = mock_response
        
        scraper = SEIScraper(scraper_config)
        
        # URL de teste
        test_url = "https://sei.rj.gov.br/sei/modulos/pesquisa/md_pesq_processo_exibir.php?test=123"
        
        result = await scraper.scrape_processo(test_url)
        
        assert isinstance(result, ScrapingResult)
        assert result.success is True
        assert result.processo_data is not None
        assert result.error_message is None
        
        # Verifica dados da autuação
        autuacao = result.processo_data.autuacao
        assert autuacao.numero_sei == "SEI-260002/002172/2025"
        assert autuacao.tipo == "Administrativo"
        assert autuacao.data_geracao == date(2025, 3, 18)
        assert autuacao.interessados == "João da Silva"
        
        # Verifica documentos
        assert len(result.processo_data.documentos) == 1
        doc = result.processo_data.documentos[0]
        assert doc.numero_documento == "12345"
        assert doc.tipo == "Correspondência"
        
        # Verifica andamentos
        assert len(result.processo_data.andamentos) == 1
        and_item = result.processo_data.andamentos[0]
        assert and_item.data_hora == datetime(2025, 3, 18, 17, 4)
        assert and_item.descricao == "Processo criado"
    
    @pytest.mark.asyncio
    @patch('aiohttp.ClientSession.get')
    async def test_scrape_processo_http_error(self, mock_get, scraper_config):
        """Testa tratamento de erro HTTP"""
        # Mock de erro HTTP
        mock_response = Mock()
        mock_response.status = 404
        mock_get.return_value.__aenter__.return_value = mock_response
        
        scraper = SEIScraper(scraper_config)
        test_url = "https://sei.rj.gov.br/sei/modulos/pesquisa/md_pesq_processo_exibir.php?test=404"
        
        result = await scraper.scrape_processo(test_url)
        
        assert isinstance(result, ScrapingResult)
        assert result.success is False
        assert result.processo_data is None
        assert "HTTP 404" in result.error_message
    
    @pytest.mark.asyncio
    @patch('aiohttp.ClientSession.get')
    async def test_scrape_processo_network_error(self, mock_get, scraper_config):
        """Testa tratamento de erro de rede"""
        # Mock de exceção de rede
        mock_get.side_effect = Exception("Connection timeout")
        
        scraper = SEIScraper(scraper_config)
        test_url = "https://sei.rj.gov.br/sei/modulos/pesquisa/md_pesq_processo_exibir.php?test=timeout"
        
        result = await scraper.scrape_processo(test_url)
        
        assert isinstance(result, ScrapingResult)
        assert result.success is False
        assert result.processo_data is None
        assert "Connection timeout" in result.error_message
    
    @pytest.mark.asyncio
    @patch('aiohttp.ClientSession.get')
    async def test_scrape_processo_retry_mechanism(self, mock_get, scraper_config):
        """Testa mecanismo de retry"""
        # Primeira tentativa falha, segunda sucede
        mock_response_fail = Mock()
        mock_response_fail.status = 500
        
        mock_response_success = Mock()
        mock_response_success.status = 200
        mock_response_success.text = AsyncMock(return_value="<html><body>Test</body></html>")
        
        mock_get.return_value.__aenter__.side_effect = [
            mock_response_fail,
            mock_response_success
        ]
        
        scraper = SEIScraper(scraper_config)
        test_url = "https://sei.rj.gov.br/sei/modulos/pesquisa/md_pesq_processo_exibir.php?test=retry"
        
        result = await scraper.scrape_processo(test_url)
        
        # Deve ter tentado 2 vezes
        assert mock_get.call_count == 2
        # O resultado pode falhar devido ao HTML simples, mas o retry funcionou
        assert result is not None
    
    def test_validate_url_sei_rj(self, scraper_config):
        """Testa validação de URL do SEI-RJ"""
        scraper = SEIScraper(scraper_config)
        
        # URLs válidas
        valid_urls = [
            "https://sei.rj.gov.br/sei/modulos/pesquisa/md_pesq_processo_exibir.php?test=1",
            "http://sei.rj.gov.br/sei/controlador.php?acao=processo_consulta"
        ]
        
        for url in valid_urls:
            assert scraper.validate_url(url) is True
        
        # URLs inválidas
        invalid_urls = [
            "https://google.com",
            "https://outro-sei.gov.br",
            "",
            None
        ]
        
        for url in invalid_urls:
            assert scraper.validate_url(url) is False


@pytest.mark.integration
class TestSEIScraperRealURLs:
    """Testes com URLs reais dos processos SEI (apenas se conectividade estiver disponível)"""
    
    @pytest.fixture
    def scraper_config(self):
        return ScraperConfig(delay=2, timeout=30, max_retries=3)
    
    @pytest.mark.asyncio
    @pytest.mark.skip_if_offline
    async def test_scrape_processo_exemplo_1(self, scraper_config):
        """Testa scraping do primeiro processo exemplo - SEI-260002/002172/2025"""
        url = "https://sei.rj.gov.br/sei/modulos/pesquisa/md_pesq_processo_exibir.php?rhvLNMLonhi2QStBSsTZGiGoQmCrLQaX2XhbnBMJ8pkwCR3ymzAH-pH3jSIrZ5qWOweyB9pzdjQy283MIK0o5-cJWO9VKQpl3AODK8ULDj2yxrNRHbZaxL8K6rICcSP0"
        
        scraper = SEIScraper(scraper_config)
        result = await scraper.scrape_processo(url)
        
        # Se conseguiu conectar, deve ter dados válidos
        if result.success:
            assert result.processo_data is not None
            assert result.processo_data.autuacao.numero_sei.startswith("SEI-")
        else:
            # Se falhou, deve ter erro registrado
            assert result.error_message is not None
    
    @pytest.mark.asyncio
    @pytest.mark.skip_if_offline
    async def test_scrape_processo_exemplo_2(self, scraper_config):
        """Testa scraping do segundo processo exemplo - SEI-170026/003203/2021"""
        url = "https://sei.rj.gov.br/sei/modulos/pesquisa/md_pesq_processo_exibir.php?IC2o8Z7ACQH4LdQ4jJLJzjPBiLtP6l2FsQacllhUf-duzEubalut9yvd8-CzYYNLu7pd-wiM0k633-D6khhQNZ_qiGkKibRuex0cZRG3mK6DEcyGb4bSG0LO-Vr0tbS-"
        
        scraper = SEIScraper(scraper_config)
        result = await scraper.scrape_processo(url)
        
        if result.success:
            assert result.processo_data is not None
            assert "SEI-170026/003203/2021" in result.processo_data.autuacao.numero_sei
    
    @pytest.mark.asyncio
    @pytest.mark.skip_if_offline
    async def test_scrape_processo_exemplo_3(self, scraper_config):
        """Testa scraping do terceiro processo exemplo - SEI-330004/000208/2024"""
        url = "https://sei.rj.gov.br/sei/modulos/pesquisa/md_pesq_processo_exibir.php?IC2o8Z7ACQH4LdQ4jJLJzjPBiLtP6l2FsQacllhUf-duzEubalut9yvd8-CzYYNLu7pd-wiM0k633-D6khhQNRa4OIKWDVoK-6-6mVqsrDoxmiYscU6ZnZZhRgdfoP-9"
        
        scraper = SEIScraper(scraper_config)
        result = await scraper.scrape_processo(url)
        
        if result.success:
            assert result.processo_data is not None
            assert "SEI-330004/000208/2024" in result.processo_data.autuacao.numero_sei


@pytest.mark.unit
class TestSEIScraperUtils:
    """Testes unitários para utilitários do scraper"""
    
    @pytest.fixture
    def scraper_config(self):
        """Configuração de teste para o scraper"""
        return ScraperConfig(delay=1, timeout=30, max_retries=3)
    
    def test_rate_limiting(self, scraper_config):
        """Testa implementação de rate limiting"""
        scraper = SEIScraper(scraper_config)
        
        # Deve ter método para controlar delay
        assert hasattr(scraper, 'wait_delay')
        
        # Delay deve respeitar configuração
        assert scraper.config.delay >= 0
    
    def test_headers_configuration(self, scraper_config):
        """Testa configuração de headers"""
        scraper = SEIScraper(scraper_config)
        
        headers = scraper.get_headers()
        
        assert "User-Agent" in headers
        assert "Accept" in headers
        assert "sei" not in headers["User-Agent"].lower()  # Não se identifica como bot do SEI 