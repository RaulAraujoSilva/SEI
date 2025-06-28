"""
Service para preview de scraping e salvamento completo de processos.
Implementa a nova lógica onde o usuário visualiza os dados antes de salvar.
"""

from typing import Dict, List, Optional
from datetime import datetime
import logging

from ..models.api_schemas import (
    ScrapingPreviewResponse, 
    SalvarProcessoCompletoRequest,
    SalvarProcessoCompletoResponse,
    ProcessoInfoPreview,
    ProtocoloInfoPreview,
    AndamentoInfoPreview
)
from ..scraper.base import ScraperSEI
from ..scraper.config import ScraperConfig
from ..database.connection import SessionLocal
from ..models.processo import Processo, Documento, Andamento

logger = logging.getLogger(__name__)

class ScrapingPreviewService:
    """Service para gerenciar preview de scraping e salvamento completo"""
    
    def __init__(self):
        self.scraper_config = ScraperConfig()
    
    def preview_scraping(self, url: str) -> ScrapingPreviewResponse:
        """
        Executa scraping completo para preview sem salvar no banco.
        
        Args:
            url: URL do processo no SEI-RJ
            
        Returns:
            ScrapingPreviewResponse com todos os dados extraídos
            
        Raises:
            ValueError: Se URL for inválida
            Exception: Se houver erro no scraping
        """
        logger.info(f"Iniciando preview de scraping para URL: {url}")
        
        # Validar URL
        if not self._validar_url_sei(url):
            raise ValueError("URL inválida. Deve ser uma URL válida do SEI-RJ.")
        
        try:
            # Inicializar scraper
            scraper = ScraperSEI(self.scraper_config)
            
            # Executar scraping completo
            dados_extraidos = scraper.extract_dados_completos(url)
            
            # Converter para formato de preview
            autuacao = self._converter_autuacao(dados_extraidos.get("autuacao", {}))
            protocolos = self._converter_protocolos(dados_extraidos.get("protocolos", []))
            andamentos = self._converter_andamentos(dados_extraidos.get("andamentos", []))
            
            response = ScrapingPreviewResponse(
                autuacao=autuacao,
                protocolos=protocolos,
                andamentos=andamentos,
                url_original=url,
                total_protocolos=len(protocolos),
                total_andamentos=len(andamentos)
            )
            
            logger.info(f"Preview concluído: {len(protocolos)} protocolos, {len(andamentos)} andamentos")
            return response
            
        except Exception as e:
            logger.error(f"Erro no preview de scraping: {str(e)}")
            raise Exception(f"Erro ao extrair dados do SEI: {str(e)}")
    
    def salvar_processo_completo(self, dados: SalvarProcessoCompletoRequest) -> SalvarProcessoCompletoResponse:
        """
        Salva processo completo com todos os dados relacionados.
        
        Args:
            dados: Dados completos do processo para salvar
            
        Returns:
            SalvarProcessoCompletoResponse com resultado da operação
        """
        logger.info(f"Iniciando salvamento completo do processo: {dados.autuacao.numero}")
        
        try:
            db = SessionLocal()
            
            try:
                # Criar processo principal
                processo = Processo(
                    numero=dados.autuacao.numero,
                    tipo=dados.autuacao.tipo,
                    data_autuacao=self._parse_data_brasileira(dados.autuacao.data_autuacao),
                    interessado=dados.autuacao.interessado or "Não informado",
                    situacao="Importado do SEI",
                    url=dados.url
                )
                
                db.add(processo)
                db.flush()  # Para obter o ID
                processo_id = processo.id
                
                # 2. Salvar protocolos/documentos
                protocolos_salvos = 0
                for protocolo in dados.protocolos:
                    documento = Documento(
                        processo_id=processo_id,
                        numero=protocolo.numero,
                        tipo=protocolo.tipo,
                        descricao=protocolo.tipo,
                        data_documento=self._parse_data_brasileira(protocolo.data),
                        url_documento=protocolo.url
                    )
                    
                    db.add(documento)
                    protocolos_salvos += 1
                
                # 3. Salvar andamentos
                andamentos_salvos = 0
                for andamento in dados.andamentos:
                    andamento_obj = Andamento(
                        processo_id=processo_id,
                        data_hora=self._parse_datetime_brasileira(andamento.data_hora),
                        unidade=andamento.unidade,
                        descricao=andamento.descricao
                    )
                    
                    db.add(andamento_obj)
                    andamentos_salvos += 1
                
                # Confirmar transação
                db.commit()
                
                logger.info(f"Processo salvo com sucesso: ID {processo_id}")
                
                return SalvarProcessoCompletoResponse(
                    processo_id=processo_id,
                    protocolos_salvos=protocolos_salvos,
                    andamentos_salvos=andamentos_salvos,
                    sucesso=True,
                    mensagem=f"Processo {dados.autuacao.numero} importado com sucesso!"
                )
                
            except Exception as e:
                # Rollback em caso de erro
                db.rollback()
                raise e
            finally:
                db.close()
                    
        except Exception as e:
            logger.error(f"Erro ao salvar processo completo: {str(e)}")
            return SalvarProcessoCompletoResponse(
                processo_id=0,
                protocolos_salvos=0,
                andamentos_salvos=0,
                sucesso=False,
                mensagem=f"Erro ao salvar processo: {str(e)}"
            )
    
    def _validar_url_sei(self, url: str) -> bool:
        """Valida se a URL é do SEI-RJ"""
        return (
            url and 
            "sei.rj.gov.br" in url and 
            "md_pesq_processo_exibir.php" in url
        )
    
    def _converter_autuacao(self, dados_autuacao: Dict) -> ProcessoInfoPreview:
        """Converte dados de autuação para formato de preview"""
        return ProcessoInfoPreview(
            numero=dados_autuacao.get("numero", ""),
            tipo=dados_autuacao.get("tipo", ""),
            data_autuacao=dados_autuacao.get("data_autuacao", ""),
            interessado=dados_autuacao.get("interessado")
        )
    
    def _converter_protocolos(self, dados_protocolos: List[Dict]) -> List[ProtocoloInfoPreview]:
        """Converte dados de protocolos para formato de preview"""
        protocolos = []
        for protocolo in dados_protocolos:
            protocolos.append(ProtocoloInfoPreview(
                numero=protocolo.get("numero", ""),
                tipo=protocolo.get("tipo", ""),
                data=protocolo.get("data", ""),
                data_inclusao=protocolo.get("data_inclusao", protocolo.get("data", "")),
                unidade=protocolo.get("unidade", ""),
                url=protocolo.get("url")
            ))
        return protocolos
    
    def _converter_andamentos(self, dados_andamentos: List[Dict]) -> List[AndamentoInfoPreview]:
        """Converte dados de andamentos para formato de preview"""
        andamentos = []
        for andamento in dados_andamentos:
            andamentos.append(AndamentoInfoPreview(
                data_hora=andamento.get("data_hora", ""),
                unidade=andamento.get("unidade", ""),
                descricao=andamento.get("descricao", "")
            ))
        return andamentos
    
    def _parse_data_brasileira(self, data_str: str) -> datetime:
        """Converte data brasileira DD/MM/AAAA para datetime"""
        try:
            return datetime.strptime(data_str, "%d/%m/%Y")
        except ValueError:
            return datetime.now()
    
    def _parse_datetime_brasileira(self, datetime_str: str) -> datetime:
        """Converte datetime brasileiro DD/MM/AAAA HH:MM para datetime"""
        try:
            return datetime.strptime(datetime_str, "%d/%m/%Y %H:%M")
        except ValueError:
            return datetime.now() 