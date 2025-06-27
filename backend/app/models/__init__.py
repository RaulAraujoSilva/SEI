"""
Modelos de dados para o sistema SEI Scraper
"""
from .processo import (
    Processo,
    Autuacao, 
    Documento,
    DocumentoTag,
    DocumentoEntidade,
    Andamento
)

__all__ = [
    "Processo",
    "Autuacao",
    "Documento", 
    "DocumentoTag",
    "DocumentoEntidade",
    "Andamento"
] 