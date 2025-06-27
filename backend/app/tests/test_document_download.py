"""
Testes para serviços de download de documentos
Seguindo metodologia TDD - testes primeiro!
"""
import pytest
import aiofiles
import tempfile
import shutil
from datetime import datetime, date
from pathlib import Path
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from sqlalchemy.orm import Session

from app.services.document_download import DocumentDownloadService, DownloadResult, BatchDownloadResult
from app.models.processo import Processo, Documento
from app.models.schemas import DocumentoInDB


@pytest.mark.unit
class TestDocumentDownloadService:
    """Testes para serviço de download de documentos"""
    
    @pytest.fixture
    def db_session(self):
        """Mock da sessão do banco de dados"""
        return Mock(spec=Session)
    
    @pytest.fixture
    def temp_download_dir(self):
        """Diretório temporário para downloads"""
        temp_dir = tempfile.mkdtemp()
        yield temp_dir
        shutil.rmtree(temp_dir)
    
    @pytest.fixture
    def download_service(self, db_session, temp_download_dir):
        """Instância do serviço de download"""
        config = {
            'download_base_path': temp_download_dir,
            'timeout': 30,
            'chunk_size': 8192,
            'max_retries': 3,
            'delay_between_downloads': 1.0
        }
        return DocumentDownloadService(db_session, config)
    
    @pytest.fixture
    def sample_documento(self):
        """Documento de exemplo para testes"""
        return Documento(
            id=1,
            processo_id=1,
            numero_documento="95725517",
            tipo="Correspondência",
            data_documento=date(2025, 3, 19),
            unidade="UENF/DIRCCH",
            downloaded=False,
            arquivo_path=None
        )
    
    @pytest.fixture
    def sample_processo(self):
        """Processo de exemplo para testes"""
        processo = Mock()
        processo.id = 1
        processo.numero_sei = "SEI-260002/002172/2025"
        return processo
    
    @pytest.mark.asyncio
    async def test_download_document_success(self, download_service, sample_documento, sample_processo, db_session):
        """Testa download bem-sucedido de documento individual"""
        # Mock da URL de download
        download_url = "https://sei.rj.gov.br/sei/modulos/pesquisa/md_pesq_documento_consultar.php?YyfrUWrKEjCvwfFaGNfEtJ8rM8uD3Dsy7_rGkM-t8Jo="
        
        # Mock da resposta HTTP
        mock_response_data = b"PDF content here"
        
        with patch('app.services.document_download.aiohttp.ClientSession') as mock_session:
            mock_response = AsyncMock()
            mock_response.status = 200
            mock_response.headers = {'content-type': 'application/pdf'}
            
            # Mock do iter_chunked com async generator
            async def mock_iter_chunked(chunk_size):
                yield mock_response_data
            
            mock_response.content.iter_chunked = mock_iter_chunked
            
            mock_session.return_value.__aenter__.return_value.get.return_value.__aenter__.return_value = mock_response
            
            # Mock do processo associado
            db_session.query.return_value.filter.return_value.first.return_value = sample_processo
            db_session.commit = Mock()
            
            # Mock do arquivo path já que não vamos realmente escrever arquivo
            with patch('app.services.document_download.Path') as mock_path:
                mock_path.return_value.parent.mkdir = Mock()
                with patch('app.services.document_download.aiofiles.open') as mock_aiofiles:
                    mock_file = AsyncMock()
                    mock_aiofiles.return_value.__aenter__.return_value = mock_file
                    mock_file.write = AsyncMock()
                    
                    with patch.object(download_service, 'calculate_file_hash', return_value='abc123hash456'):
                        result = await download_service.download_document(sample_documento, download_url)
        
        # Verificações
        assert isinstance(result, DownloadResult)
        assert result.success is True
        assert result.documento_id == 1
        assert result.file_path is not None
        assert result.file_size > 0
        assert result.content_type == 'application/pdf'
        assert result.downloaded_at is not None
        assert result.error_message is None
        assert db_session.commit.called
    
    @pytest.mark.asyncio
    async def test_download_document_http_error(self, download_service, sample_documento, sample_processo, db_session):
        """Testa tratamento de erro HTTP 404"""
        download_url = "https://sei.rj.gov.br/sei/documento_nao_existe.php"
        
        # Mock do processo associado
        db_session.query.return_value.filter.return_value.first.return_value = sample_processo
        
        with patch('app.services.document_download.aiohttp.ClientSession') as mock_session:
            mock_response = AsyncMock()
            mock_response.status = 404
            mock_response.text = AsyncMock(return_value="Not Found")
            
            mock_session.return_value.__aenter__.return_value.get.return_value.__aenter__.return_value = mock_response
            
            result = await download_service.download_document(sample_documento, download_url)
        
        assert result.success is False
        assert result.error_message is not None
        assert result.file_path is None
    
    @pytest.mark.asyncio
    async def test_download_document_network_error(self, download_service, sample_documento, sample_processo, db_session):
        """Testa tratamento de erro de rede"""
        download_url = "https://sei.rj.gov.br/documento.php"
        
        # Mock do processo associado
        db_session.query.return_value.filter.return_value.first.return_value = sample_processo
        
        with patch('app.services.document_download.aiohttp.ClientSession') as mock_session:
            mock_session.return_value.__aenter__.return_value.get.side_effect = Exception("Network error")
            
            result = await download_service.download_document(sample_documento, download_url)
        
        assert result.success is False
        assert "Network error" in result.error_message
        assert result.file_path is None
    
    @pytest.mark.asyncio
    async def test_download_document_with_retry(self, download_service, sample_documento, sample_processo, db_session):
        """Testa mecanismo de retry em caso de falha temporária"""
        download_url = "https://sei.rj.gov.br/documento.php"
        
        # Mock da resposta com falha na primeira tentativa e sucesso na segunda
        mock_response_data = b"PDF content"
        
        with patch('aiohttp.ClientSession') as mock_session:
            # Primeira tentativa falha, segunda sucede
            mock_responses = [
                Exception("Temporary network error"),  # Primeira falha
                AsyncMock(status=200, headers={'content-type': 'application/pdf'}, read=AsyncMock(return_value=mock_response_data))  # Segunda tentativa sucesso
            ]
            
            mock_session.return_value.__aenter__.return_value.get.side_effect = mock_responses
            db_session.query.return_value.filter.return_value.first.return_value = sample_processo
            db_session.commit = Mock()
            
            result = await download_service.download_document(sample_documento, download_url)
        
        assert result.success is True
        assert result.retry_count > 0
    
    @pytest.mark.asyncio
    async def test_batch_download_success(self, download_service, db_session):
        """Testa download em lote bem-sucedido"""
        # Lista de documentos para download
        documentos_data = [
            {
                'documento': Documento(id=1, numero_documento="doc1", downloaded=False),
                'url': "https://sei.rj.gov.br/doc1.php"
            },
            {
                'documento': Documento(id=2, numero_documento="doc2", downloaded=False),
                'url': "https://sei.rj.gov.br/doc2.php"
            },
            {
                'documento': Documento(id=3, numero_documento="doc3", downloaded=False),
                'url': "https://sei.rj.gov.br/doc3.php"
            }
        ]
        
        # Mock das respostas HTTP
        with patch('aiohttp.ClientSession') as mock_session:
            mock_response = AsyncMock()
            mock_response.status = 200
            mock_response.headers = {'content-type': 'application/pdf'}
            mock_response.read = AsyncMock(return_value=b"PDF content")
            
            mock_session.return_value.__aenter__.return_value.get.return_value.__aenter__.return_value = mock_response
            
            # Mock do processo
            sample_processo = Mock()
            sample_processo.numero_sei = "SEI-123456/789/2025"
            db_session.query.return_value.filter.return_value.first.return_value = sample_processo
            db_session.commit = Mock()
            
            result = await download_service.batch_download(documentos_data)
        
        # Verificações
        assert isinstance(result, BatchDownloadResult)
        assert result.total_documents == 3
        assert result.successful_downloads == 3
        assert result.failed_downloads == 0
        assert len(result.results) == 3
        assert result.completed_at is not None
        assert all(r.success for r in result.results)
    
    @pytest.mark.asyncio
    async def test_batch_download_partial_failure(self, download_service, db_session):
        """Testa download em lote com falhas parciais"""
        documentos_data = [
            {
                'documento': Documento(id=1, numero_documento="doc1", downloaded=False),
                'url': "https://sei.rj.gov.br/doc1.php"
            },
            {
                'documento': Documento(id=2, numero_documento="doc2", downloaded=False),
                'url': "https://sei.rj.gov.br/doc2_erro.php"  # Este falhará
            }
        ]
        
        with patch('aiohttp.ClientSession') as mock_session:
            # Primeira requisição sucesso, segunda falha
            responses = [
                AsyncMock(status=200, headers={'content-type': 'application/pdf'}, read=AsyncMock(return_value=b"PDF content")),
                AsyncMock(status=404, text=AsyncMock(return_value="Not Found"))
            ]
            
            mock_session.return_value.__aenter__.return_value.get.return_value.__aenter__.side_effect = responses
            
            sample_processo = Mock()
            sample_processo.numero_sei = "SEI-123456/789/2025"
            db_session.query.return_value.filter.return_value.first.return_value = sample_processo
            db_session.commit = Mock()
            
            result = await download_service.batch_download(documentos_data)
        
        assert result.total_documents == 2
        assert result.successful_downloads == 1
        assert result.failed_downloads == 1
        assert len(result.results) == 2
        assert result.results[0].success is True
        assert result.results[1].success is False
    
    def test_organize_files_by_processo(self, download_service, temp_download_dir):
        """Testa organização de arquivos por processo"""
        processo_numero = "SEI-260002/002172/2025"
        
        # Testa criação da estrutura de diretórios
        organized_path = download_service.organize_files(processo_numero)
        
        expected_path = Path(temp_download_dir) / "SEI-260002" / "002172" / "2025"
        assert Path(organized_path) == expected_path
        assert expected_path.exists()
        assert expected_path.is_dir()
    
    def test_generate_file_path(self, download_service):
        """Testa geração do caminho do arquivo"""
        documento = Documento(
            numero_documento="95725517",
            tipo="Correspondência"
        )
        processo_numero = "SEI-260002/002172/2025"
        
        file_path = download_service.generate_file_path(documento, processo_numero)
        
        assert "95725517" in file_path
        assert ".pdf" in file_path
        assert "SEI-260002" in file_path
    
    def test_validate_download_url(self, download_service):
        """Testa validação de URLs de download"""
        # URL válida
        valid_url = "https://sei.rj.gov.br/sei/modulos/pesquisa/md_pesq_documento_consultar.php?id=123"
        assert download_service.validate_download_url(valid_url) is True
        
        # URL inválida
        invalid_url = "https://malicious-site.com/doc.php"
        assert download_service.validate_download_url(invalid_url) is False
        
        # URL vazia
        assert download_service.validate_download_url("") is False
        assert download_service.validate_download_url(None) is False
    
    def test_calculate_file_hash(self, download_service, temp_download_dir):
        """Testa cálculo de hash de arquivo para verificação de integridade"""
        # Cria arquivo temporário
        test_file = Path(temp_download_dir) / "test.pdf"
        test_content = b"Test PDF content"
        test_file.write_bytes(test_content)
        
        file_hash = download_service.calculate_file_hash(str(test_file))
        
        assert file_hash is not None
        assert len(file_hash) == 64  # SHA-256 em hex
        assert isinstance(file_hash, str)
    
    @pytest.mark.asyncio
    async def test_update_documento_status(self, download_service, sample_documento, db_session):
        """Testa atualização do status do documento após download"""
        file_path = "/downloads/SEI-260002/002172/2025/95725517.pdf"
        file_size = 1024
        file_hash = "abc123def456"
        
        await download_service.update_documento_status(
            sample_documento, 
            file_path, 
            file_size, 
            file_hash
        )
        
        # Verificações
        assert sample_documento.downloaded is True
        assert sample_documento.arquivo_path == file_path
        assert db_session.commit.called
    
    def test_get_download_statistics(self, download_service, db_session):
        """Testa obtenção de estatísticas de download"""
        # Mock das queries retornando números
        db_session.query.return_value.count.return_value = 20  # Total docs
        db_session.query.return_value.filter.return_value.count.return_value = 10  # Downloaded docs
        
        stats = download_service.get_download_statistics()
        
        assert hasattr(stats, 'total_documents')
        assert hasattr(stats, 'downloaded_documents')
        assert hasattr(stats, 'pending_downloads')
        assert hasattr(stats, 'download_percentage')
        assert stats.total_documents == 20
        assert stats.downloaded_documents == 10
        assert stats.pending_downloads == 10
        assert stats.download_percentage == 50.0
    
    @pytest.mark.asyncio
    async def test_cleanup_failed_downloads(self, download_service, temp_download_dir):
        """Testa limpeza de downloads incompletos/corrompidos"""
        # Cria arquivos de teste (um completo, um incompleto)
        complete_file = Path(temp_download_dir) / "complete.pdf"
        incomplete_file = Path(temp_download_dir) / "incomplete.pdf"
        
        complete_file.write_bytes(b"Complete PDF content")
        incomplete_file.write_bytes(b"Inc")  # Arquivo muito pequeno
        
        cleaned_count = await download_service.cleanup_failed_downloads(temp_download_dir)
        
        assert cleaned_count >= 0
        assert complete_file.exists()  # Arquivo completo deve permanecer


@pytest.mark.integration  
class TestDocumentDownloadIntegration:
    """Testes de integração para download de documentos"""
    
    @pytest.mark.asyncio
    async def test_full_download_workflow(self, test_db):
        """Testa fluxo completo de download"""
        # Este teste será implementado com dados reais do banco
        pass
    
    @pytest.mark.asyncio
    async def test_concurrent_downloads(self, test_db):
        """Testa downloads concorrentes"""
        # Teste de performance e concorrência
        pass
    
    @pytest.mark.asyncio
    async def test_large_file_download(self, test_db):
        """Testa download de arquivos grandes"""
        # Teste de performance com arquivos grandes
        pass 