"""
Serviço para download e gerenciamento de documentos
"""
import asyncio
import aiohttp
import aiofiles
import hashlib
import logging
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app.models.processo import Processo, Documento
from app.models.schemas import (
    DownloadResult, BatchDownloadResult, DownloadConfig, 
    DownloadStatistics, FileInfo
)

logger = logging.getLogger(__name__)


class DocumentDownloadService:
    """Serviço para download e gerenciamento de documentos"""
    
    def __init__(self, db_session: Session, config: Dict[str, Any]):
        """
        Inicializa o serviço de download
        
        Args:
            db_session: Sessão do banco de dados
            config: Configuração de download
        """
        self.db = db_session
        self.config = DownloadConfig(**config)
        self.session: Optional[aiohttp.ClientSession] = None
        
        # Cria diretório base se não existir
        Path(self.config.download_base_path).mkdir(parents=True, exist_ok=True)
    
    async def download_document(self, documento: Documento, download_url: str) -> DownloadResult:
        """
        Baixa documento individual
        
        Args:
            documento: Instância do documento
            download_url: URL para download
            
        Returns:
            Resultado do download
        """
        start_time = datetime.now()
        retry_count = 0
        
        # Validações iniciais
        if not self.validate_download_url(download_url):
            return DownloadResult(
                success=False,
                documento_id=documento.id,
                error_message=f"URL de download inválida: {download_url}",
                retry_count=retry_count
            )
        
        # Busca processo associado
        processo = self.db.query(Processo).filter(Processo.id == documento.processo_id).first()
        if not processo:
            return DownloadResult(
                success=False,
                documento_id=documento.id,
                error_message=f"Processo não encontrado para documento {documento.id}",
                retry_count=retry_count
            )
        
        # Gera caminho do arquivo
        file_path = self.generate_file_path(documento, processo.numero_sei)
        
        # Realiza download com retry
        for attempt in range(self.config.max_retries):
            try:
                result = await self._perform_download(download_url, file_path)
                
                if result['success']:
                    # Atualiza status do documento no banco
                    await self.update_documento_status(
                        documento, 
                        file_path, 
                        result['file_size'], 
                        result['file_hash']
                    )
                    
                    return DownloadResult(
                        success=True,
                        documento_id=documento.id,
                        file_path=file_path,
                        file_size=result['file_size'],
                        content_type=result['content_type'],
                        file_hash=result['file_hash'],
                        retry_count=retry_count,
                        downloaded_at=datetime.now()
                    )
                else:
                    retry_count += 1
                    if attempt < self.config.max_retries - 1:
                        await asyncio.sleep(2 ** attempt)  # Backoff exponencial
                    
            except Exception as e:
                retry_count += 1
                logger.warning(f"Tentativa {attempt + 1} falhou para documento {documento.id}: {str(e)}")
                
                if attempt < self.config.max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
                else:
                    return DownloadResult(
                        success=False,
                        documento_id=documento.id,
                        error_message=str(e),
                        retry_count=retry_count
                    )
        
        return DownloadResult(
            success=False,
            documento_id=documento.id,
            error_message=f"Falha após {self.config.max_retries} tentativas",
            retry_count=retry_count
        )
    
    async def batch_download(self, documentos_data: List[Dict]) -> BatchDownloadResult:
        """
        Download em lote de documentos
        
        Args:
            documentos_data: Lista com dicionários contendo 'documento' e 'url'
            
        Returns:
            Resultado do download em lote
        """
        start_time = datetime.now()
        results = []
        
        # Processa downloads em lotes menores para controlar concorrência
        batch_size = self.config.concurrent_downloads
        
        for i in range(0, len(documentos_data), batch_size):
            batch = documentos_data[i:i + batch_size]
            
            # Executa downloads concorrentes no lote
            tasks = []
            for item in batch:
                task = self.download_document(item['documento'], item['url'])
                tasks.append(task)
            
            # Aguarda conclusão do lote
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Processa resultados do lote
            for result in batch_results:
                if isinstance(result, Exception):
                    # Trata exceções não capturadas
                    logger.error(f"Erro não tratado no download: {result}")
                    results.append(DownloadResult(
                        success=False,
                        documento_id=0,
                        error_message=str(result)
                    ))
                else:
                    results.append(result)
            
            # Delay entre lotes
            if i + batch_size < len(documentos_data):
                await asyncio.sleep(self.config.delay_between_downloads)
        
        # Calcula estatísticas
        successful = sum(1 for r in results if r.success)
        failed = len(results) - successful
        
        return BatchDownloadResult(
            total_documents=len(documentos_data),
            successful_downloads=successful,
            failed_downloads=failed,
            results=results,
            started_at=start_time,
            completed_at=datetime.now()
        )
    
    def organize_files(self, processo_numero: str) -> str:
        """
        Organiza arquivos por processo criando estrutura de diretórios
        
        Args:
            processo_numero: Número do processo (ex: SEI-260002/002172/2025)
            
        Returns:
            Caminho do diretório organizado
        """
        # Parse do número do processo
        # Formato: SEI-XXXXXX/XXXXXX/XXXX
        parts = processo_numero.replace('SEI-', '').split('/')
        
        if len(parts) >= 3:
            # Cria estrutura: base_path/SEI-XXXXXX/XXXXXX/XXXX/
            dir_path = Path(self.config.download_base_path) / f"SEI-{parts[0]}" / parts[1] / parts[2]
        else:
            # Fallback para formato não padrão
            safe_name = processo_numero.replace('/', '_').replace('\\', '_')
            dir_path = Path(self.config.download_base_path) / safe_name
        
        # Cria diretórios se não existirem
        dir_path.mkdir(parents=True, exist_ok=True)
        
        return str(dir_path)
    
    def generate_file_path(self, documento: Documento, processo_numero: str) -> str:
        """
        Gera caminho completo do arquivo
        
        Args:
            documento: Instância do documento
            processo_numero: Número do processo
            
        Returns:
            Caminho completo do arquivo
        """
        # Organiza por processo
        base_dir = self.organize_files(processo_numero)
        
        # Nome do arquivo baseado no número do documento
        filename = f"{documento.numero_documento}.pdf"  # Assume PDF por padrão
        
        return str(Path(base_dir) / filename)
    
    def validate_download_url(self, url: str) -> bool:
        """
        Valida URL de download
        
        Args:
            url: URL a ser validada
            
        Returns:
            True se válida, False caso contrário
        """
        if not url:
            return False
        
        # Deve ser do domínio SEI-RJ
        return "sei.rj.gov.br" in url.lower()
    
    def calculate_file_hash(self, file_path: str) -> str:
        """
        Calcula hash SHA-256 do arquivo
        
        Args:
            file_path: Caminho do arquivo
            
        Returns:
            Hash SHA-256 em hexadecimal
        """
        sha256_hash = hashlib.sha256()
        
        with open(file_path, "rb") as f:
            # Lê arquivo em chunks para economizar memória
            for chunk in iter(lambda: f.read(4096), b""):
                sha256_hash.update(chunk)
        
        return sha256_hash.hexdigest()
    
    async def update_documento_status(self, documento: Documento, file_path: str, 
                                    file_size: int, file_hash: str):
        """
        Atualiza status do documento após download
        
        Args:
            documento: Instância do documento
            file_path: Caminho do arquivo baixado
            file_size: Tamanho do arquivo
            file_hash: Hash do arquivo
        """
        documento.downloaded = True
        documento.arquivo_path = file_path
        documento.updated_at = datetime.now()
        
        self.db.commit()
    
    def get_download_statistics(self) -> DownloadStatistics:
        """
        Obtém estatísticas de downloads
        
        Returns:
            Estatísticas de download
        """
        total_docs = self.db.query(Documento).count()
        downloaded_docs = self.db.query(Documento).filter(Documento.downloaded == True).count()
        pending_docs = total_docs - downloaded_docs
        
        download_percentage = (downloaded_docs / total_docs * 100) if total_docs > 0 else 0
        
        return DownloadStatistics(
            total_documents=total_docs,
            downloaded_documents=downloaded_docs,
            pending_downloads=pending_docs,
            failed_downloads=0,  # TODO: Implementar tracking de falhas
            download_percentage=download_percentage,
            total_file_size_mb=0.0,  # TODO: Calcular tamanho total
            last_download_at=None  # TODO: Implementar timestamp
        )
    
    async def cleanup_failed_downloads(self, directory: str) -> int:
        """
        Remove downloads incompletos ou corrompidos
        
        Args:
            directory: Diretório para limpeza
            
        Returns:
            Número de arquivos removidos
        """
        cleaned_count = 0
        dir_path = Path(directory)
        
        if not dir_path.exists():
            return cleaned_count
        
        # Processa todos os arquivos PDF
        for file_path in dir_path.rglob("*.pdf"):
            try:
                # Verifica se arquivo é muito pequeno (provavelmente incompleto)
                if file_path.stat().st_size < 100:  # Menos de 100 bytes
                    file_path.unlink()
                    cleaned_count += 1
                    logger.info(f"Arquivo removido (muito pequeno): {file_path}")
                    
            except Exception as e:
                logger.warning(f"Erro ao verificar arquivo {file_path}: {e}")
        
        return cleaned_count
    
    async def _perform_download(self, url: str, file_path: str) -> Dict[str, Any]:
        """
        Executa o download efetivo do arquivo
        
        Args:
            url: URL para download
            file_path: Caminho onde salvar o arquivo
            
        Returns:
            Dicionário com resultado do download
        """
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        timeout = aiohttp.ClientTimeout(total=self.config.timeout)
        
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(url, headers=headers) as response:
                
                if response.status != 200:
                    return {
                        'success': False,
                        'error': f"HTTP {response.status}: {await response.text()}"
                    }
                
                # Cria diretório do arquivo se necessário
                Path(file_path).parent.mkdir(parents=True, exist_ok=True)
                
                # Baixa arquivo
                file_size = 0
                async with aiofiles.open(file_path, 'wb') as f:
                    async for chunk in response.content.iter_chunked(self.config.chunk_size):
                        await f.write(chunk)
                        file_size += len(chunk)
                
                # Calcula hash do arquivo
                file_hash = self.calculate_file_hash(file_path)
                
                return {
                    'success': True,
                    'file_size': file_size,
                    'content_type': response.headers.get('content-type', 'application/octet-stream'),
                    'file_hash': file_hash
                } 