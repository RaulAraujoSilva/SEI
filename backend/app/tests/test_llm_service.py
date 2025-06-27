"""
Testes para o serviço de LLM (Fase 5)
"""
import pytest
import json
from decimal import Decimal
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, AsyncMock
from sqlalchemy.orm import Session

from app.services.llm_service import LLMService
from app.models.processo import Processo, Documento, DocumentoTag, DocumentoEntidade
from app.models.schemas import (
    DocumentAnalysis, EntityExtractionResult, TagGenerationResult,
    LLMConfig, BatchLLMResult, LLMStatistics, CostEstimation
)


@pytest.fixture
def llm_config():
    """Configuração de teste para LLM"""
    return {
        "provider": "openai",
        "model": "gpt-4o-mini",
        "api_key": "test-key-123",
        "organization_id": "test-org",
        "max_tokens": 2000,
        "temperature": 0.1,
        "chunk_size": 4000,
        "max_chunks_per_document": 5,
        "cost_per_1k_input_tokens": Decimal("0.00015"),
        "cost_per_1k_output_tokens": Decimal("0.0006"),
        "timeout_seconds": 60
    }


@pytest.fixture
def sample_document_text():
    """Texto de documento de exemplo para testes"""
    return """
    DESPACHO
    
    Processo SEI-260002/002172/2025
    
    Trata-se de solicitação de Maria Silva (CPF: 123.456.789-00) para análise de 
    processo administrativo referente ao valor de R$ 15.000,00 (quinze mil reais).
    
    A empresa XYZ Ltda (CNPJ: 12.345.678/0001-90) apresentou documentação 
    em 15/01/2025, conforme protocolo nº 2025001234.
    
    Encaminho para análise da Secretaria de Fazenda do Estado do Rio de Janeiro.
    
    Rio de Janeiro, 20 de janeiro de 2025.
    
    João Santos
    Analista Judiciário
    """


@pytest.mark.unit
class TestLLMService:
    """Testes unitários para o serviço de LLM"""
    
    def test_llm_service_initialization(self, test_db, llm_config):
        """Testa inicialização do serviço LLM"""
        service = LLMService(test_db, llm_config)
        
        assert service.db == test_db
        assert service.config.provider == "openai"
        assert service.config.model == "gpt-4o-mini"
        assert service.config.max_tokens == 2000
        assert service.config.temperature == 0.1
    
    @patch('app.services.llm_service.openai.ChatCompletion.acreate')
    async def test_analyze_document_success(self, mock_openai, test_db, llm_config):
        """Testa análise bem-sucedida de documento"""
        # Setup: processo e documento
        processo = Processo(numero_sei="SEI-123456/123456/2025", url="https://test.com")
        test_db.add(processo)
        test_db.commit()
        test_db.refresh(processo)
        
        documento = Documento(
            processo_id=processo.id,
            numero_documento="12345",
            tipo="Despacho",
            detalhamento_texto="Texto do despacho para análise..."
        )
        test_db.add(documento)
        test_db.commit()
        test_db.refresh(documento)
        
        # Mock da resposta da OpenAI
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message = Mock()
        mock_response.choices[0].message.content = json.dumps({
            "summary": "Despacho de encaminhamento para análise",
            "entities": [
                {"type": "PESSOA", "value": "Maria Silva", "confidence": 0.95},
                {"type": "VALOR", "value": "R$ 15.000,00", "confidence": 0.90}
            ],
            "tags": ["despacho", "encaminhamento", "fazenda"],
            "confidence": 0.92
        })
        mock_response.usage = Mock()
        mock_response.usage.total_tokens = 450
        mock_response.usage.prompt_tokens = 350
        mock_response.usage.completion_tokens = 100
        mock_openai.return_value = mock_response
        
        # Executar análise
        service = LLMService(test_db, llm_config)
        result = await service.analyze_document(documento.id)
        
        # Verificações
        assert result.success == True
        assert result.documento_id == documento.id
        assert result.summary == "Despacho de encaminhamento para análise"
        assert len(result.extracted_entities) == 2
        assert len(result.generated_tags) == 3
        assert result.model_used == "gpt-4o-mini"
        assert result.tokens_used == 450
        assert result.cost_usd > 0
    
    async def test_analyze_document_not_found(self, test_db, llm_config):
        """Testa análise de documento inexistente"""
        service = LLMService(test_db, llm_config)
        result = await service.analyze_document(999)
        
        assert result.success == False
        assert result.error_message == "Documento com ID 999 não encontrado"
    
    async def test_analyze_document_no_text(self, test_db, llm_config):
        """Testa análise de documento sem texto"""
        # Setup: documento sem texto
        processo = Processo(numero_sei="SEI-123456/123456/2025", url="https://test.com")
        test_db.add(processo)
        test_db.commit()
        test_db.refresh(processo)
        
        documento = Documento(
            processo_id=processo.id,
            numero_documento="12345",
            detalhamento_texto=None  # Sem texto
        )
        test_db.add(documento)
        test_db.commit()
        test_db.refresh(documento)
        
        service = LLMService(test_db, llm_config)
        result = await service.analyze_document(documento.id)
        
        assert result.success == False
        assert "não possui texto para análise" in result.error_message
    
    @patch('app.services.llm_service.openai.ChatCompletion.acreate')
    async def test_analyze_document_api_error(self, mock_openai, test_db, llm_config):
        """Testa tratamento de erro da API"""
        # Setup documento
        processo = Processo(numero_sei="SEI-123456/123456/2025", url="https://test.com")
        test_db.add(processo)
        test_db.commit()
        test_db.refresh(processo)
        
        documento = Documento(
            processo_id=processo.id,
            numero_documento="12345",
            detalhamento_texto="Texto para análise"
        )
        test_db.add(documento)
        test_db.commit()
        test_db.refresh(documento)
        
        # Mock erro da API
        mock_openai.side_effect = Exception("API rate limit exceeded")
        
        service = LLMService(test_db, llm_config)
        result = await service.analyze_document(documento.id)
        
        assert result.success == False
        assert "API rate limit exceeded" in result.error_message
    
    def test_extract_entities_from_text(self, test_db, llm_config, sample_document_text):
        """Testa extração de entidades de texto"""
        service = LLMService(test_db, llm_config)
        
        with patch.object(service, '_call_llm_api') as mock_api:
            mock_api.return_value = {
                "entities": [
                    {"type": "PESSOA", "value": "Maria Silva", "confidence": 0.95},
                    {"type": "CPF", "value": "123.456.789-00", "confidence": 0.98},
                    {"type": "VALOR", "value": "R$ 15.000,00", "confidence": 0.90},
                    {"type": "EMPRESA", "value": "XYZ Ltda", "confidence": 0.92},
                    {"type": "DATA", "value": "15/01/2025", "confidence": 0.88}
                ],
                "tokens_used": 320
            }
            
            result = service.extract_entities(sample_document_text)
            
            assert len(result.entities) == 5
            assert result.tokens_used == 320
            assert result.processing_time_seconds > 0  # Tempo processamento é calculado internamente
            assert "PESSOA" in [e["type"] for e in result.entities]
            assert "Maria Silva" in [e["value"] for e in result.entities]
    
    def test_generate_tags_from_text(self, test_db, llm_config, sample_document_text):
        """Testa geração de tags de texto"""
        service = LLMService(test_db, llm_config)
        
        with patch.object(service, '_call_llm_api') as mock_api:
            mock_api.return_value = {
                "tags": ["despacho", "encaminhamento", "fazenda", "administrativo", "análise"],
                "confidence_scores": {
                    "despacho": 0.98,
                    "encaminhamento": 0.92,
                    "fazenda": 0.85,
                    "administrativo": 0.88,
                    "análise": 0.90
                },
                "tokens_used": 280,
                "processing_time": 1.2
            }
            
            result = service.generate_tags(sample_document_text)
            
            assert len(result.tags) == 5
            assert "despacho" in result.tags
            assert "encaminhamento" in result.tags
            assert result.confidence_scores["despacho"] == 0.98
            assert result.tokens_used == 280
    
    def test_calculate_cost_input_only(self, test_db, llm_config):
        """Testa cálculo de custo apenas para tokens de entrada"""
        service = LLMService(test_db, llm_config)
        
        cost = service.calculate_cost(input_tokens=1000, output_tokens=0)
        
        expected_cost = Decimal("0.00015") * 1  # 1000/1000 = 1
        assert cost == expected_cost
    
    def test_calculate_cost_input_and_output(self, test_db, llm_config):
        """Testa cálculo de custo para tokens de entrada e saída"""
        service = LLMService(test_db, llm_config)
        
        cost = service.calculate_cost(input_tokens=2000, output_tokens=500)
        
        input_cost = Decimal("0.00015") * Decimal("2")  # 2000/1000 = 2
        output_cost = Decimal("0.0006") * Decimal("0.5")  # 500/1000 = 0.5
        expected_cost = input_cost + output_cost
        
        assert cost == expected_cost
    
    def test_estimate_processing_cost(self, test_db, llm_config):
        """Testa estimativa de custo de processamento"""
        service = LLMService(test_db, llm_config)
        
        # Mock query de documentos
        with patch.object(test_db, 'query') as mock_query:
            mock_query.return_value.filter.return_value.count.return_value = 100
            
            estimation = service.estimate_processing_cost()
            
            assert estimation.document_count == 100
            assert estimation.estimated_tokens_per_document > 0
            assert estimation.total_estimated_tokens > 0
            assert estimation.estimated_cost_usd > 0
    
    async def test_batch_analyze_documents(self, test_db, llm_config):
        """Testa análise em lote de documentos"""
        # Setup: múltiplos documentos
        processo = Processo(numero_sei="SEI-123456/123456/2025", url="https://test.com")
        test_db.add(processo)
        test_db.commit()
        test_db.refresh(processo)
        
        documentos = []
        for i in range(3):
            doc = Documento(
                processo_id=processo.id,
                numero_documento=f"1234{i}",
                detalhamento_texto=f"Texto do documento {i}"
            )
            test_db.add(doc)
            documentos.append(doc)
        
        test_db.commit()
        for doc in documentos:
            test_db.refresh(doc)
        
        service = LLMService(test_db, llm_config)
        
        # Mock análises individuais
        with patch.object(service, 'analyze_document') as mock_analyze:
            mock_results = []
            for i, doc in enumerate(documentos):
                mock_result = DocumentAnalysis(
                    documento_id=doc.id,
                    success=True,
                    summary=f"Resumo do documento {i}",
                    extracted_entities=[],
                    generated_tags=[f"tag{i}"],
                    model_used="gpt-4o-mini",
                    tokens_used=300 + i * 50,
                    processing_time_seconds=1.5,
                    cost_usd=Decimal("0.001"),
                    processed_at=datetime.now()
                )
                mock_results.append(mock_result)
            
            mock_analyze.side_effect = mock_results
            
            documento_ids = [doc.id for doc in documentos]
            result = await service.batch_analyze_documents(documento_ids)
            
            assert result.total_documents == 3
            assert result.successful_analyses == 3
            assert result.failed_analyses == 0
            assert len(result.results) == 3
            assert result.total_tokens_used > 0
            assert result.total_cost_usd > 0
    
    def test_get_llm_statistics(self, test_db, llm_config):
        """Testa obtenção de estatísticas do LLM"""
        service = LLMService(test_db, llm_config)
        
        # Mock queries do banco - configuração específica para cada chamada
        def mock_query_side_effect(model_class):
            mock_query_result = Mock()
            
            if model_class.__name__ == "Documento":
                # Primeira chamada - total de documentos
                if not hasattr(mock_query_side_effect, 'call_count'):
                    mock_query_side_effect.call_count = 0
                
                mock_query_side_effect.call_count += 1
                
                if mock_query_side_effect.call_count == 1:
                    # Total documentos
                    mock_query_result.count.return_value = 150
                elif mock_query_side_effect.call_count == 2:
                    # Documentos processados
                    mock_query_result.filter.return_value.count.return_value = 120
                elif mock_query_side_effect.call_count == 3:
                    # Documentos com erro  
                    mock_query_result.filter.return_value.count.return_value = 30
                elif mock_query_side_effect.call_count == 4:
                    # Soma de tokens
                    mock_query_result.query.return_value.filter.return_value.scalar.return_value = 45000
                
            return mock_query_result
        
        with patch.object(test_db, 'query', side_effect=mock_query_side_effect):
            # Mock adicional para soma de tokens
            with patch.object(test_db, 'query') as mock_sum_query:
                mock_sum_query.return_value.filter.return_value.scalar.return_value = 45000
                
                stats = service.get_llm_statistics()
                
                assert stats.total_documents_processed == 150
                assert stats.successful_analyses == 120
                assert stats.failed_analyses == 30
                assert stats.total_tokens_used == 45000
                assert stats.processing_percentage == 80.0  # 120/150 * 100
    
    async def test_cleanup_failed_analyses(self, test_db, llm_config):
        """Testa limpeza de análises falhadas"""
        # Setup: documentos com falha
        processo = Processo(numero_sei="SEI-123456/123456/2025", url="https://test.com")
        test_db.add(processo)
        test_db.commit()
        test_db.refresh(processo)
        
        # Documento com erro
        doc_erro = Documento(
            processo_id=processo.id,
            numero_documento="ERROR1",
            detalhamento_status="erro",
            detalhamento_data=datetime.now() - timedelta(days=7)  # Erro antigo
        )
        test_db.add(doc_erro)
        
        # Documento processando há muito tempo
        doc_travado = Documento(
            processo_id=processo.id,
            numero_documento="STUCK1",
            detalhamento_status="processando",
            detalhamento_data=datetime.now() - timedelta(hours=25)  # Processando há 25h
        )
        test_db.add(doc_travado)
        
        test_db.commit()
        
        service = LLMService(test_db, llm_config)
        cleanup_count = await service.cleanup_failed_analyses()
        
        # Deve limpar documentos com erro ou travados
        assert cleanup_count >= 2
        
        # Verifica se status foi resetado
        test_db.refresh(doc_erro)
        test_db.refresh(doc_travado)
        assert doc_erro.detalhamento_status == "pendente"
        assert doc_travado.detalhamento_status == "pendente"
    
    def test_validate_llm_response(self, test_db, llm_config):
        """Testa validação de resposta do LLM"""
        service = LLMService(test_db, llm_config)
        
        # Resposta válida
        valid_response = {
            "summary": "Resumo do documento",
            "entities": [{"type": "PESSOA", "value": "João", "confidence": 0.95}],
            "tags": ["despacho", "importante"],
            "confidence": 0.92
        }
        
        assert service._validate_llm_response(valid_response) == True
        
        # Resposta inválida - faltando campos
        invalid_response = {
            "summary": "Resumo"
            # Faltam entities, tags, confidence
        }
        
        assert service._validate_llm_response(invalid_response) == False
    
    async def test_process_document_chunks(self, test_db, llm_config):
        """Testa processamento de documento em chunks"""
        service = LLMService(test_db, llm_config)
        
        # Texto longo que precisa ser dividido
        long_text = "Texto muito longo " * 1000  # Simula texto > chunk_size
        
        with patch.object(service, '_call_llm_api') as mock_api:
            mock_api.return_value = {
                "summary": "Resumo do chunk",
                "entities": [{"type": "TESTE", "value": "valor", "confidence": 0.9}],
                "tags": ["tag1"],
                "confidence": 0.85,
                "tokens_used": 200,
                "processing_time": 1.0
            }
            
            result = await service._process_document_chunks(long_text)
            
            assert result["success"] == True
            assert len(result["summary"]) > 0
            assert len(result["entities"]) > 0
            assert mock_api.call_count > 1  # Deve ter chamado para múltiplos chunks
    
    def test_merge_chunk_results(self, test_db, llm_config):
        """Testa merge de resultados de múltiplos chunks"""
        service = LLMService(test_db, llm_config)
        
        chunk_results = [
            {
                "summary": "Resumo parte 1",
                "entities": [{"type": "PESSOA", "value": "João", "confidence": 0.9}],
                "tags": ["despacho", "importante"],
                "confidence": 0.85
            },
            {
                "summary": "Resumo parte 2", 
                "entities": [{"type": "EMPRESA", "value": "ABC Ltd", "confidence": 0.95}],
                "tags": ["contrato", "importante"],
                "confidence": 0.90
            }
        ]
        
        merged = service._merge_chunk_results(chunk_results)
        
        assert "Resumo parte 1" in merged["summary"]
        assert "Resumo parte 2" in merged["summary"]
        assert len(merged["entities"]) == 2
        assert len(merged["tags"]) == 3  # despacho, importante, contrato (importante é único)
        assert merged["confidence"] == 0.875  # Média das confianças
    
    async def test_update_document_analysis_status(self, test_db, llm_config):
        """Testa atualização do status de análise no documento"""
        # Setup documento
        processo = Processo(numero_sei="SEI-123456/123456/2025", url="https://test.com")
        test_db.add(processo)
        test_db.commit()
        test_db.refresh(processo)
        
        documento = Documento(
            processo_id=processo.id,
            numero_documento="12345",
            detalhamento_status="pendente"
        )
        test_db.add(documento)
        test_db.commit()
        test_db.refresh(documento)
        
        service = LLMService(test_db, llm_config)
        
        # Atualiza para processando
        await service._update_document_status(documento.id, "processando", "gpt-4o-mini")
        test_db.refresh(documento)
        
        assert documento.detalhamento_status == "processando"
        assert documento.detalhamento_modelo == "gpt-4o-mini"
        assert documento.detalhamento_data is not None
        
        # Atualiza para concluído com tokens
        await service._update_document_status(documento.id, "concluido", "gpt-4o-mini", tokens=450)
        test_db.refresh(documento)
        
        assert documento.detalhamento_status == "concluido"
        assert documento.detalhamento_tokens == 450


@pytest.mark.integration
class TestLLMServiceIntegration:
    """Testes de integração para o serviço de LLM"""
    
    async def test_full_document_analysis_workflow(self, test_db, llm_config):
        """Testa fluxo completo de análise de documento"""
        # Setup completo
        processo = Processo(numero_sei="SEI-123456/123456/2025", url="https://test.com")
        test_db.add(processo)
        test_db.commit()
        test_db.refresh(processo)
        
        documento = Documento(
            processo_id=processo.id,
            numero_documento="12345",
            tipo="Despacho",
            detalhamento_texto="Despacho de teste para análise completa com LLM."
        )
        test_db.add(documento)
        test_db.commit()
        test_db.refresh(documento)
        
        service = LLMService(test_db, llm_config)
        
        with patch('app.services.llm_service.openai.ChatCompletion.acreate') as mock_openai:
            # Mock resposta completa
            mock_response = Mock()
            mock_response.choices = [Mock()]
            mock_response.choices[0].message = Mock()
            mock_response.choices[0].message.content = json.dumps({
                "summary": "Despacho de encaminhamento para análise técnica",
                "entities": [
                    {"type": "DOCUMENTO", "value": "Despacho", "confidence": 0.98}
                ],
                "tags": ["despacho", "encaminhamento"],
                "confidence": 0.95
            })
            mock_response.usage = Mock()
            mock_response.usage.total_tokens = 350
            mock_response.usage.prompt_tokens = 280
            mock_response.usage.completion_tokens = 70
            mock_openai.return_value = mock_response
            
            # Executa análise completa
            result = await service.analyze_document(documento.id)
            
            # Verifica resultado
            assert result.success == True
            assert result.documento_id == documento.id
            
            # Verifica se documento foi atualizado
            test_db.refresh(documento)
            assert documento.detalhamento_status == "concluido"
            assert documento.detalhamento_tokens == 350
            assert documento.detalhamento_modelo == "gpt-4o-mini"
            
            # Verifica se tags foram salvas
            tags_count = test_db.query(DocumentoTag).filter(
                DocumentoTag.documento_id == documento.id
            ).count()
            assert tags_count > 0
    
    async def test_concurrent_document_analysis(self, test_db, llm_config):
        """Testa análises concorrentes de documentos"""
        # Setup múltiplos documentos
        processo = Processo(numero_sei="SEI-123456/123456/2025", url="https://test.com")
        test_db.add(processo)
        test_db.commit()
        test_db.refresh(processo)
        
        documentos = []
        for i in range(5):
            doc = Documento(
                processo_id=processo.id,
                numero_documento=f"DOC{i:03d}",
                detalhamento_texto=f"Texto do documento {i} para análise"
            )
            test_db.add(doc)
            documentos.append(doc)
        
        test_db.commit()
        for doc in documentos:
            test_db.refresh(doc)
        
        service = LLMService(test_db, llm_config)
        
        with patch('app.services.llm_service.openai.ChatCompletion.acreate') as mock_openai:
            # Mock respostas
            mock_response = Mock()
            mock_response.choices = [Mock()]
            mock_response.choices[0].message = Mock()
            mock_response.choices[0].message.content = json.dumps({
                "summary": "Análise de documento",
                "entities": [],
                "tags": ["documento"],
                "confidence": 0.8
            })
            mock_response.usage = Mock()
            mock_response.usage.total_tokens = 200
            mock_response.usage.prompt_tokens = 150
            mock_response.usage.completion_tokens = 50
            mock_openai.return_value = mock_response
            
            # Executa análises concorrentes
            documento_ids = [doc.id for doc in documentos]
            result = await service.batch_analyze_documents(documento_ids, max_concurrent=3)
            
            assert result.total_documents == 5
            assert result.successful_analyses == 5
            assert result.failed_analyses == 0
            
            # Verifica se todos foram processados
            for doc in documentos:
                test_db.refresh(doc)
                assert doc.detalhamento_status == "concluido" 