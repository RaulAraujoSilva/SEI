"""
Scraper base para processos SEI
"""
import asyncio
import re
import aiohttp
import requests
from typing import Optional, Dict, List
from datetime import datetime
from bs4 import BeautifulSoup
import logging

from .config import ScraperConfig
from .parsers import SEIParser
from ..models.schemas import ProcessoData, ScrapingResult, AutuacaoData, DocumentoData, AndamentoData

logger = logging.getLogger(__name__)


class SEIScraper:
    """Classe base para scraping de processos SEI"""
    
    def __init__(self, config: ScraperConfig):
        self.config = config
        self.session: Optional[aiohttp.ClientSession] = None
        self.driver = None  # Para futuro uso com Selenium se necessário
    
    async def scrape_processo(self, url: str) -> ScrapingResult:
        """Extrai dados completos de um processo"""
        if not self.validate_url(url):
            return ScrapingResult(
                success=False,
                processo_data=None,
                error_message=f"URL inválida: {url}",
                scraped_at=datetime.now()
            )
        
        try:
            html_content = await self._fetch_html(url)
            if not html_content:
                return ScrapingResult(
                    success=False,
                    processo_data=None,
                    error_message="Não foi possível obter conteúdo HTML",
                    scraped_at=datetime.now()
                )
            
            # Parse do HTML
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Extrai dados usando os parsers
            autuacao_data = self.extract_autuacao(soup)
            documentos_data = self.extract_documentos(soup)
            andamentos_data = self.extract_andamentos(soup)
            
            # Cria ProcessoData
            processo_data = ProcessoData(
                autuacao=AutuacaoData(**autuacao_data),
                documentos=[DocumentoData(**doc) for doc in documentos_data],
                andamentos=[AndamentoData(**and_item) for and_item in andamentos_data]
            )
            
            return ScrapingResult(
                success=True,
                processo_data=processo_data,
                error_message=None,
                scraped_at=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"Erro ao fazer scraping de {url}: {str(e)}")
            return ScrapingResult(
                success=False,
                processo_data=None,
                error_message=str(e),
                scraped_at=datetime.now()
            )
    
    async def _fetch_html(self, url: str) -> Optional[str]:
        """Busca HTML da URL com retry e rate limiting"""
        for attempt in range(self.config.max_retries):
            try:
                # Rate limiting
                if attempt > 0:
                    await self.wait_delay()
                
                async with aiohttp.ClientSession(
                    timeout=aiohttp.ClientTimeout(total=self.config.timeout),
                    headers=self.get_headers()
                ) as session:
                    async with session.get(url) as response:
                        if response.status == 200:
                            return await response.text()
                        elif response.status in [500, 502, 503, 504] and attempt < self.config.max_retries - 1:
                            # Retry em caso de erro de servidor
                            logger.warning(f"Erro HTTP {response.status}, tentativa {attempt + 1}")
                            await asyncio.sleep(2 ** attempt)  # Backoff exponencial
                            continue
                        else:
                            raise Exception(f"HTTP {response.status}")
                            
            except Exception as e:
                if attempt == self.config.max_retries - 1:
                    raise e
                logger.warning(f"Erro na tentativa {attempt + 1}: {str(e)}")
                await asyncio.sleep(2 ** attempt)
        
        return None
    
    def extract_autuacao(self, soup: BeautifulSoup) -> dict:
        """Extrai dados da autuação"""
        # Procura primeiro por div específica, senão usa a primeira tabela
        autuacao_div = soup.find('div', id='divAutuacao')
        if autuacao_div:
            return SEIParser.parse_autuacao_table(autuacao_div)
        return SEIParser.parse_autuacao_table(soup)
    
    def extract_documentos(self, soup: BeautifulSoup) -> list:
        """Extrai lista de documentos"""
        # Busca pela tabela específica de cabeçalho (lista de protocolos)
        documentos_table = soup.find('table', id='tblCabecalho')
        if documentos_table:
            return SEIParser.parse_documentos_table(documentos_table)
        
        # Fallback: procura por tabelas que contêm dados de documentos
        tables = soup.find_all('table', class_='infraTable')
        for table in tables:
            # Verifica se a tabela contém links numéricos (documentos)
            links = table.find_all('a')
            numeric_links = [link for link in links if re.match(r'^\d+$', link.get_text(strip=True))]
            if len(numeric_links) > 10:  # Tabela com muitos documentos
                return SEIParser.parse_documentos_table(table)
        
        return []
    
    def extract_andamentos(self, soup: BeautifulSoup) -> list:
        """Extrai histórico de andamentos"""
        # Busca pela tabela específica de histórico
        andamentos_table = soup.find('table', id='tblHistorico')
        if andamentos_table:
            return SEIParser.parse_andamentos_table(andamentos_table)
        
        # Fallback: procura por tabelas que contêm padrões de data/hora
        tables = soup.find_all('table', class_='infraTable')
        for table in tables:
            # Verifica se a tabela contém muitos padrões de data/hora (andamentos)
            text = table.get_text()
            datetime_matches = re.findall(r'\d{2}/\d{2}/\d{4} \d{2}:\d{2}', text)
            if len(datetime_matches) > 10:  # Tabela com muitos andamentos
                return SEIParser.parse_andamentos_table(table)
        
        return []
    
    def validate_url(self, url: str) -> bool:
        """Valida se a URL é do SEI-RJ"""
        if not url:
            return False
        
        return "sei.rj.gov.br" in url.lower()
    
    def get_headers(self) -> dict:
        """Retorna headers para requisições"""
        return self.config.headers.copy()
    
    async def wait_delay(self):
        """Aplica delay entre requisições"""
        if self.config.delay > 0:
            await asyncio.sleep(self.config.delay)
    
    async def __aenter__(self):
        """Entrada do context manager"""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Saída do context manager"""
        if self.session:
            await self.session.close()
        
        if self.driver:
            self.driver.quit()


class ScraperSEI:
    """Versão síncrona do scraper para uso com o preview service"""
    
    def __init__(self, config: ScraperConfig):
        self.config = config
    
    def extract_dados_completos(self, url: str) -> Dict:
        """
        Extrai todos os dados de um processo sem salvar.
        Retorna estrutura para preview.
        
        Args:
            url: URL do processo no SEI-RJ
            
        Returns:
            Dict com autuacao, protocolos e andamentos
        """
        logger.info(f"Extraindo dados completos de: {url}")
        
        try:
            # Buscar HTML
            html_content = self._fetch_html_sync(url)
            if not html_content:
                raise Exception("Não foi possível obter conteúdo HTML")
            
            # Parse do HTML
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Extrair dados
            autuacao_data = self.extract_autuacao(soup)
            protocolos_data = self.extract_documentos(soup)
            andamentos_data = self.extract_andamentos(soup)
            
            return {
                "autuacao": autuacao_data,
                "protocolos": protocolos_data,
                "andamentos": andamentos_data
            }
            
        except Exception as e:
            logger.error(f"Erro ao extrair dados completos: {str(e)}")
            raise e
    
    def _fetch_html_sync(self, url: str) -> Optional[str]:
        """Versão síncrona do fetch HTML"""
        for attempt in range(self.config.max_retries):
            try:
                if attempt > 0:
                    import time
                    time.sleep(self.config.delay)
                
                response = requests.get(
                    url,
                    headers=self.get_headers(),
                    timeout=self.config.timeout
                )
                
                if response.status_code == 200:
                    return response.text
                elif response.status_code in [500, 502, 503, 504] and attempt < self.config.max_retries - 1:
                    logger.warning(f"Erro HTTP {response.status_code}, tentativa {attempt + 1}")
                    import time
                    time.sleep(2 ** attempt)
                    continue
                else:
                    raise Exception(f"HTTP {response.status_code}")
                    
            except Exception as e:
                if attempt == self.config.max_retries - 1:
                    raise e
                logger.warning(f"Erro na tentativa {attempt + 1}: {str(e)}")
                import time
                time.sleep(2 ** attempt)
        
        return None
    
    def extract_autuacao(self, soup: BeautifulSoup) -> dict:
        """Extrai dados da autuação"""
        # Procura primeiro por div específica, senão usa a primeira tabela
        autuacao_div = soup.find('div', id='divAutuacao')
        if autuacao_div:
            return SEIParser.parse_autuacao_table(autuacao_div)
        return SEIParser.parse_autuacao_table(soup)
    
    def extract_documentos(self, soup: BeautifulSoup) -> list:
        """Extrai lista de documentos/protocolos"""
        # Busca pela tabela específica de cabeçalho (lista de protocolos)
        documentos_table = soup.find('table', id='tblCabecalho')
        if documentos_table:
            return SEIParser.parse_documentos_table(documentos_table)
        
        # Fallback: procura por tabelas que contêm dados de documentos
        tables = soup.find_all('table', class_='infraTable')
        for table in tables:
            # Verifica se a tabela contém links numéricos (documentos)
            links = table.find_all('a')
            numeric_links = [link for link in links if re.match(r'^\d+$', link.get_text(strip=True))]
            if len(numeric_links) > 10:  # Tabela com muitos documentos
                return SEIParser.parse_documentos_table(table)
        
        return []
    
    def extract_andamentos(self, soup: BeautifulSoup) -> list:
        """Extrai histórico de andamentos"""
        # Busca pela tabela específica de histórico
        andamentos_table = soup.find('table', id='tblHistorico')
        if andamentos_table:
            return SEIParser.parse_andamentos_table(andamentos_table)
        
        # Fallback: procura por tabelas que contêm padrões de data/hora
        tables = soup.find_all('table', class_='infraTable')
        for table in tables:
            # Verifica se a tabela contém muitos padrões de data/hora (andamentos)
            text = table.get_text()
            datetime_matches = re.findall(r'\d{2}/\d{2}/\d{4} \d{2}:\d{2}', text)
            if len(datetime_matches) > 10:  # Tabela com muitos andamentos
                return SEIParser.parse_andamentos_table(table)
        
        return []
    
    def validate_url(self, url: str) -> bool:
        """Valida se a URL é do SEI-RJ"""
        if not url:
            return False
        return "sei.rj.gov.br" in url.lower()
    
    def get_headers(self) -> dict:
        """Retorna headers para requisições"""
        return self.config.headers.copy() 