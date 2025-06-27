"""
Configuração para o web scraper SEI
"""
import os
from typing import Optional
from pydantic import BaseModel


class ScraperConfig(BaseModel):
    """Configuração do scraper"""
    
    delay: int = 2  # Delay entre requisições em segundos
    timeout: int = 30  # Timeout das requisições em segundos
    max_retries: int = 3  # Máximo de tentativas por requisição
    user_agent: str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    
    # Headers padrão
    headers: dict = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
    }
    
    # Configurações do Selenium
    selenium_headless: bool = True
    selenium_window_size: tuple = (1920, 1080)
    selenium_page_load_timeout: int = 30
    
    def __init__(self, **data):
        super().__init__(**data)
        # Adiciona User-Agent ao headers se não existir
        if "User-Agent" not in self.headers:
            self.headers["User-Agent"] = self.user_agent
    
    @classmethod
    def from_env(cls) -> 'ScraperConfig':
        """Cria configuração a partir de variáveis de ambiente"""
        return cls(
            delay=int(os.getenv("SCRAPER_DELAY", "2")),
            timeout=int(os.getenv("SCRAPER_TIMEOUT", "30")),
            max_retries=int(os.getenv("SCRAPER_MAX_RETRIES", "3")),
            user_agent=os.getenv("SCRAPER_USER_AGENT", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"),
            selenium_headless=os.getenv("SELENIUM_HEADLESS", "true").lower() == "true"
        ) 