"""
Serviço para processamento com LLM (Fase 5)
"""
import asyncio
import json
import logging
import re
import time
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Optional, Dict, Any, Union

import openai
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.models.processo import Documento, DocumentoTag, DocumentoEntidade
from app.models.schemas import (
    DocumentAnalysis, EntityExtractionResult, TagGenerationResult,
    LLMConfig, BatchLLMResult, LLMStatistics, CostEstimation
)

logger = logging.getLogger(__name__)


class LLMService:
    """Serviço para processamento com LLM"""
    
    def __init__(self, db_session: Session, config: Dict[str, Any]):
        """
        Inicializa o serviço de LLM
        
        Args:
            db_session: Sessão do banco de dados
            config: Configuração do LLM
        """
        self.db = db_session
        self.config = LLMConfig(**config)
        
        # Configura cliente OpenAI
        if self.config.provider == "openai":
            openai.api_key = self.config.api_key
            if self.config.organization_id:
                openai.organization = self.config.organization_id
    
    async def analyze_document(self, documento_id: int) -> DocumentAnalysis:
        """
        Analisa documento com LLM
        
        Args:
            documento_id: ID do documento
            
        Returns:
            Resultado da análise
        """
        start_time = time.time()
        
        try:
            # Busca documento
            documento = self.db.query(Documento).filter(Documento.id == documento_id).first()
            if not documento:
                return DocumentAnalysis(
                    documento_id=documento_id,
                    success=False,
                    model_used=self.config.model,
                    tokens_used=0,
                    processing_time_seconds=0,
                    cost_usd=Decimal("0"),
                    processed_at=datetime.now(),
                    error_message=f"Documento com ID {documento_id} não encontrado"
                )
            
            # Verifica se há texto para análise
            if not documento.detalhamento_texto:
                return DocumentAnalysis(
                    documento_id=documento_id,
                    success=False,
                    model_used=self.config.model,
                    tokens_used=0,
                    processing_time_seconds=0,
                    cost_usd=Decimal("0"),
                    processed_at=datetime.now(),
                    error_message="Documento não possui texto para análise"
                )
            
            # Atualiza status para processando
            await self._update_document_status(documento_id, "processando", self.config.model)
            
            # Processa documento (pode ser dividido em chunks)
            text = documento.detalhamento_texto
            if len(text) > self.config.chunk_size:
                analysis_result = await self._process_document_chunks(text)
            else:
                analysis_result = await self._process_single_chunk(text)
            
            if not analysis_result["success"]:
                await self._update_document_status(documento_id, "erro", self.config.model)
                return DocumentAnalysis(
                    documento_id=documento_id,
                    success=False,
                    model_used=self.config.model,
                    tokens_used=0,
                    processing_time_seconds=time.time() - start_time,
                    cost_usd=Decimal("0"),
                    processed_at=datetime.now(),
                    error_message=analysis_result.get("error", "Erro no processamento")
                )
            
            # Calcula custo
            cost = self.calculate_cost(
                input_tokens=analysis_result["prompt_tokens"],
                output_tokens=analysis_result["completion_tokens"]
            )
            
            # Salva entidades e tags no banco
            await self._save_analysis_results(documento_id, analysis_result)
            
            # Atualiza status para concluído
            await self._update_document_status(
                documento_id, 
                "concluido", 
                self.config.model, 
                tokens=analysis_result["total_tokens"]
            )
            
            processing_time = time.time() - start_time
            
            return DocumentAnalysis(
                documento_id=documento_id,
                success=True,
                analysis_text=analysis_result.get("full_text"),
                summary=analysis_result.get("summary"),
                extracted_entities=analysis_result.get("entities", []),
                generated_tags=analysis_result.get("tags", []),
                confidence_score=Decimal(str(analysis_result.get("confidence", 0))),
                model_used=self.config.model,
                tokens_used=analysis_result["total_tokens"],
                processing_time_seconds=processing_time,
                cost_usd=cost,
                processed_at=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"Erro na análise do documento {documento_id}: {str(e)}")
            
            # Atualiza status para erro
            await self._update_document_status(documento_id, "erro", self.config.model)
            
            return DocumentAnalysis(
                documento_id=documento_id,
                success=False,
                model_used=self.config.model,
                tokens_used=0,
                processing_time_seconds=time.time() - start_time,
                cost_usd=Decimal("0"),
                processed_at=datetime.now(),
                error_message=str(e)
            )
    
    def extract_entities(self, text: str) -> EntityExtractionResult:
        """
        Extrai entidades do texto
        
        Args:
            text: Texto para análise
            
        Returns:
            Resultado da extração de entidades
        """
        start_time = time.time()
        
        prompt = f"""
        Analise o seguinte texto e extraia as entidades relevantes:

        TEXTO:
        {text}

        Extraia as seguintes entidades quando presentes:
        - PESSOA: Nomes de pessoas físicas
        - EMPRESA: Nomes de empresas ou organizações
        - CPF: Números de CPF
        - CNPJ: Números de CNPJ
        - VALOR: Valores monetários
        - DATA: Datas
        - DOCUMENTO: Números de documentos, processos, protocolos
        - LOCAL: Endereços, cidades, estados
        - EMAIL: Endereços de email
        - TELEFONE: Números de telefone
        
        Retorne APENAS um JSON válido no formato:
        {{
            "entities": [
                {{"type": "TIPO", "value": "valor", "confidence": 0.95}},
                ...
            ]
        }}
        """
        
        try:
            result = self._call_llm_api(prompt, max_tokens=1000)
            
            return EntityExtractionResult(
                entities=result.get("entities", []),
                processing_time_seconds=time.time() - start_time,
                confidence_scores={e["value"]: e["confidence"] for e in result.get("entities", [])},
                model_used=self.config.model,
                tokens_used=result.get("tokens_used", 0)
            )
            
        except Exception as e:
            logger.error(f"Erro na extração de entidades: {str(e)}")
            return EntityExtractionResult(
                entities=[],
                processing_time_seconds=time.time() - start_time,
                confidence_scores={},
                model_used=self.config.model,
                tokens_used=0
            )
    
    def generate_tags(self, text: str) -> TagGenerationResult:
        """
        Gera tags automáticas para o texto
        
        Args:
            text: Texto para análise
            
        Returns:
            Resultado da geração de tags
        """
        start_time = time.time()
        
        prompt = f"""
        Analise o seguinte texto e gere tags de classificação relevantes:

        TEXTO:
        {text}

        Gere tags que classifiquem o documento por:
        - Tipo de documento (despacho, ofício, parecer, etc.)
        - Área/assunto (administrativo, jurídico, financeiro, etc.)
        - Status/situação (urgente, importante, rotina, etc.)
        - Ação necessária (análise, aprovação, encaminhamento, etc.)
        
        Retorne APENAS um JSON válido no formato:
        {{
            "tags": ["tag1", "tag2", "tag3", ...],
            "confidence_scores": {{
                "tag1": 0.95,
                "tag2": 0.88,
                ...
            }}
        }}
        
        Use tags curtas, em português, sem acentos preferencialmente.
        """
        
        try:
            result = self._call_llm_api(prompt, max_tokens=500)
            
            return TagGenerationResult(
                tags=result.get("tags", []),
                confidence_scores=result.get("confidence_scores", {}),
                processing_time_seconds=time.time() - start_time,
                model_used=self.config.model,
                tokens_used=result.get("tokens_used", 0)
            )
            
        except Exception as e:
            logger.error(f"Erro na geração de tags: {str(e)}")
            return TagGenerationResult(
                tags=[],
                confidence_scores={},
                processing_time_seconds=time.time() - start_time,
                model_used=self.config.model,
                tokens_used=0
            )
    
    def calculate_cost(self, input_tokens: int, output_tokens: int = 0) -> Decimal:
        """
        Calcula custo do processamento
        
        Args:
            input_tokens: Tokens de entrada
            output_tokens: Tokens de saída
            
        Returns:
            Custo total em USD
        """
        input_cost = (Decimal(input_tokens) / 1000) * self.config.cost_per_1k_input_tokens
        output_cost = (Decimal(output_tokens) / 1000) * self.config.cost_per_1k_output_tokens
        
        return input_cost + output_cost
    
    def estimate_processing_cost(self) -> CostEstimation:
        """
        Estima custo de processamento de documentos pendentes
        
        Returns:
            Estimativa de custo
        """
        # Conta documentos pendentes
        pending_count = self.db.query(Documento).filter(
            Documento.detalhamento_status == 'pendente',
            Documento.detalhamento_texto.isnot(None)
        ).count()
        
        # Estima tokens por documento (baseado em média histórica ou valor padrão)
        avg_tokens_per_doc = self._get_average_tokens_per_document()
        if avg_tokens_per_doc == 0:
            avg_tokens_per_doc = 1000  # Valor padrão conservador
        
        total_tokens = pending_count * avg_tokens_per_doc
        estimated_cost = self.calculate_cost(input_tokens=int(total_tokens * 0.8), 
                                           output_tokens=int(total_tokens * 0.2))
        
        # Estima tempo de processamento (baseado em 1 doc/segundo)
        estimated_time_minutes = pending_count / 60
        
        return CostEstimation(
            document_count=pending_count,
            estimated_tokens_per_document=avg_tokens_per_doc,
            total_estimated_tokens=total_tokens,
            estimated_cost_usd=estimated_cost,
            estimated_processing_time_minutes=estimated_time_minutes
        )
    
    async def batch_analyze_documents(self, documento_ids: List[int], 
                                    max_concurrent: int = 3) -> BatchLLMResult:
        """
        Processa múltiplos documentos em lote
        
        Args:
            documento_ids: Lista de IDs dos documentos
            max_concurrent: Máximo de análises concorrentes
            
        Returns:
            Resultado do lote
        """
        start_time = datetime.now()
        results = []
        
        # Processa em lotes menores para controlar concorrência
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def analyze_with_semaphore(doc_id):
            async with semaphore:
                return await self.analyze_document(doc_id)
        
        # Executa análises concorrentes
        tasks = [analyze_with_semaphore(doc_id) for doc_id in documento_ids]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Processa resultados
        successful = 0
        failed = 0
        total_tokens = 0
        total_cost = Decimal("0")
        final_results = []
        
        for result in results:
            if isinstance(result, Exception):
                logger.error(f"Erro não tratado na análise: {result}")
                failed += 1
                # Cria resultado de erro
                error_result = DocumentAnalysis(
                    documento_id=0,
                    success=False,
                    model_used=self.config.model,
                    tokens_used=0,
                    processing_time_seconds=0,
                    cost_usd=Decimal("0"),
                    processed_at=datetime.now(),
                    error_message=str(result)
                )
                final_results.append(error_result)
            else:
                if result.success:
                    successful += 1
                    total_tokens += result.tokens_used
                    total_cost += result.cost_usd
                else:
                    failed += 1
                final_results.append(result)
        
        return BatchLLMResult(
            total_documents=len(documento_ids),
            successful_analyses=successful,
            failed_analyses=failed,
            results=final_results,
            total_tokens_used=total_tokens,
            total_cost_usd=total_cost,
            started_at=start_time,
            completed_at=datetime.now()
        )
    
    def get_llm_statistics(self) -> LLMStatistics:
        """
        Obtém estatísticas de uso do LLM
        
        Returns:
            Estatísticas de uso
        """
        # Total de documentos
        total_docs = self.db.query(Documento).count()
        
        # Documentos processados (com sucesso)
        processed_docs = self.db.query(Documento).filter(
            Documento.detalhamento_status == 'concluido'
        ).count()
        
        # Documentos com erro
        failed_docs = self.db.query(Documento).filter(
            Documento.detalhamento_status == 'erro'
        ).count()
        
        # Total de tokens usados
        total_tokens = self.db.query(func.sum(Documento.detalhamento_tokens)).filter(
            Documento.detalhamento_tokens.isnot(None)
        ).scalar() or 0
        
        # Modelo mais usado
        most_used_model = self.db.query(Documento.detalhamento_modelo).filter(
            Documento.detalhamento_modelo.isnot(None)
        ).group_by(Documento.detalhamento_modelo).order_by(
            func.count(Documento.detalhamento_modelo).desc()
        ).first()
        
        # Último processamento
        last_analysis = self.db.query(Documento).filter(
            Documento.detalhamento_data.isnot(None)
        ).order_by(desc(Documento.detalhamento_data)).first()
        
        # Calcula custo total estimado
        total_cost = self.calculate_cost(input_tokens=int(total_tokens * 0.8), 
                                       output_tokens=int(total_tokens * 0.2))
        
        # Médias
        avg_tokens = float(total_tokens / processed_docs) if processed_docs > 0 else None
        avg_cost = total_cost / processed_docs if processed_docs > 0 else None
        
        return LLMStatistics(
            total_documents_processed=total_docs,
            successful_analyses=processed_docs,
            failed_analyses=failed_docs,
            total_tokens_used=total_tokens,
            total_cost_usd=total_cost,
            average_tokens_per_document=avg_tokens,
            average_cost_per_document=avg_cost,
            most_used_model=most_used_model[0] if most_used_model else None,
            last_analysis_at=last_analysis.detalhamento_data if last_analysis else None,
            processing_percentage=float(processed_docs / total_docs * 100) if total_docs > 0 else 0
        )
    
    async def cleanup_failed_analyses(self) -> int:
        """
        Limpa análises falhadas ou travadas
        
        Returns:
            Número de limpezas realizadas
        """
        cleanup_count = 0
        
        # Documentos com erro há mais de 1 dia
        old_errors = self.db.query(Documento).filter(
            Documento.detalhamento_status == 'erro',
            Documento.detalhamento_data < datetime.now() - timedelta(days=1)
        ).all()
        
        for doc in old_errors:
            doc.detalhamento_status = 'pendente'
            doc.detalhamento_data = None
            doc.detalhamento_modelo = None
            doc.detalhamento_tokens = None
            cleanup_count += 1
        
        # Documentos "processando" há mais de 1 hora (provavelmente travados)
        stuck_processing = self.db.query(Documento).filter(
            Documento.detalhamento_status == 'processando',
            Documento.detalhamento_data < datetime.now() - timedelta(hours=1)
        ).all()
        
        for doc in stuck_processing:
            doc.detalhamento_status = 'pendente'
            doc.detalhamento_data = None
            doc.detalhamento_modelo = None
            doc.detalhamento_tokens = None
            cleanup_count += 1
        
        self.db.commit()
        
        logger.info(f"Limpeza de análises: {cleanup_count} documentos resetados")
        return cleanup_count
    
    # Métodos privados
    
    def _call_llm_api(self, prompt: str, max_tokens: int = None) -> Dict[str, Any]:
        """
        Chama a API do LLM
        
        Args:
            prompt: Prompt para enviar
            max_tokens: Máximo de tokens na resposta
            
        Returns:
            Resultado da API
        """
        if max_tokens is None:
            max_tokens = self.config.max_tokens
        
        if self.config.provider == "openai":
            response = openai.ChatCompletion.create(
                model=self.config.model,
                messages=[
                    {"role": "system", "content": "Você é um assistente especializado em análise de documentos administrativos. Sempre responda apenas com JSON válido."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=self.config.temperature,
                timeout=self.config.timeout_seconds
            )
            
            content = response.choices[0].message.content
            
            # Tenta extrair JSON da resposta
            try:
                # Remove markdown code blocks se presentes
                content = re.sub(r'```json\s*|\s*```', '', content)
                result = json.loads(content)
            except json.JSONDecodeError:
                logger.warning(f"Resposta não é JSON válido: {content}")
                result = {"error": "Resposta inválida do LLM"}
            
            # Adiciona informações de uso
            result["tokens_used"] = response.usage.total_tokens
            result["prompt_tokens"] = response.usage.prompt_tokens
            result["completion_tokens"] = response.usage.completion_tokens
            
            return result
        
        else:
            raise ValueError(f"Provider '{self.config.provider}' não suportado")
    
    async def _process_single_chunk(self, text: str) -> Dict[str, Any]:
        """
        Processa um único chunk de texto
        
        Args:
            text: Texto para processar
            
        Returns:
            Resultado do processamento
        """
        prompt = f"""
        Analise o seguinte documento administrativo:

        DOCUMENTO:
        {text}

        Realize uma análise completa e retorne APENAS um JSON válido com:
        1. Um resumo executivo do documento (summary)
        2. Entidades relevantes extraídas (entities)
        3. Tags de classificação apropriadas (tags)  
        4. Nível de confiança da análise (confidence)

        Formato JSON:
        {{
            "summary": "Resumo executivo do documento...",
            "entities": [
                {{"type": "PESSOA", "value": "Nome da Pessoa", "confidence": 0.95}},
                {{"type": "VALOR", "value": "R$ 1.000,00", "confidence": 0.90}}
            ],
            "tags": ["despacho", "administrativo", "urgente"],
            "confidence": 0.92
        }}
        """
        
        try:
            result = self._call_llm_api(prompt)
            
            if self._validate_llm_response(result):
                result["success"] = True
                result["full_text"] = text
                result["total_tokens"] = result.get("tokens_used", 0)
                return result
            else:
                return {"success": False, "error": "Resposta do LLM inválida"}
                
        except Exception as e:
            logger.error(f"Erro no processamento: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _process_document_chunks(self, text: str) -> Dict[str, Any]:
        """
        Processa documento dividido em chunks
        
        Args:
            text: Texto completo do documento
            
        Returns:
            Resultado consolidado
        """
        # Divide texto em chunks
        chunks = self._split_text_into_chunks(text)
        
        if len(chunks) > self.config.max_chunks_per_document:
            chunks = chunks[:self.config.max_chunks_per_document]
        
        # Processa cada chunk
        chunk_results = []
        total_tokens = 0
        
        for i, chunk in enumerate(chunks):
            try:
                result = await self._process_single_chunk(chunk)
                if result["success"]:
                    chunk_results.append(result)
                    total_tokens += result.get("total_tokens", 0)
                
                # Pequeno delay para evitar rate limiting
                if i < len(chunks) - 1:
                    await asyncio.sleep(0.5)
                    
            except Exception as e:
                logger.warning(f"Erro no chunk {i}: {str(e)}")
                continue
        
        if not chunk_results:
            return {"success": False, "error": "Nenhum chunk processado com sucesso"}
        
        # Consolida resultados
        consolidated = self._merge_chunk_results(chunk_results)
        consolidated["success"] = True
        consolidated["full_text"] = text
        consolidated["total_tokens"] = total_tokens
        consolidated["prompt_tokens"] = int(total_tokens * 0.8)  # Estimativa
        consolidated["completion_tokens"] = int(total_tokens * 0.2)  # Estimativa
        
        return consolidated
    
    def _split_text_into_chunks(self, text: str) -> List[str]:
        """
        Divide texto em chunks menores
        
        Args:
            text: Texto para dividir
            
        Returns:
            Lista de chunks
        """
        chunks = []
        words = text.split()
        current_chunk = []
        current_size = 0
        
        for word in words:
            word_size = len(word) + 1  # +1 para espaço
            
            if current_size + word_size > self.config.chunk_size and current_chunk:
                # Finaliza chunk atual
                chunks.append(' '.join(current_chunk))
                current_chunk = [word]
                current_size = word_size
            else:
                current_chunk.append(word)
                current_size += word_size
        
        # Adiciona último chunk se não vazio
        if current_chunk:
            chunks.append(' '.join(current_chunk))
        
        return chunks
    
    def _merge_chunk_results(self, chunk_results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Consolida resultados de múltiplos chunks
        
        Args:
            chunk_results: Lista de resultados dos chunks
            
        Returns:
            Resultado consolidado
        """
        # Consolida summaries
        summaries = [r.get("summary", "") for r in chunk_results if r.get("summary")]
        merged_summary = " ".join(summaries)
        
        # Consolida entidades (remove duplicatas)
        all_entities = []
        seen_entities = set()
        
        for result in chunk_results:
            for entity in result.get("entities", []):
                entity_key = f"{entity['type']}:{entity['value']}"
                if entity_key not in seen_entities:
                    all_entities.append(entity)
                    seen_entities.add(entity_key)
        
        # Consolida tags (remove duplicatas e mantém únicas)
        all_tags = []
        seen_tags = set()
        
        for result in chunk_results:
            for tag in result.get("tags", []):
                if tag not in seen_tags:
                    all_tags.append(tag)
                    seen_tags.add(tag)
        
        # Calcula confiança média
        confidences = [r.get("confidence", 0) for r in chunk_results if r.get("confidence")]
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0
        
        return {
            "summary": merged_summary,
            "entities": all_entities,
            "tags": all_tags,
            "confidence": avg_confidence
        }
    
    def _validate_llm_response(self, response: Dict[str, Any]) -> bool:
        """
        Valida resposta do LLM
        
        Args:
            response: Resposta para validar
            
        Returns:
            True se válida, False caso contrário
        """
        required_fields = ["summary", "entities", "tags", "confidence"]
        
        for field in required_fields:
            if field not in response:
                return False
        
        # Valida tipos
        if not isinstance(response["summary"], str):
            return False
        if not isinstance(response["entities"], list):
            return False
        if not isinstance(response["tags"], list):
            return False
        if not isinstance(response["confidence"], (int, float)):
            return False
        
        return True
    
    async def _save_analysis_results(self, documento_id: int, analysis_result: Dict[str, Any]):
        """
        Salva resultados da análise no banco
        
        Args:
            documento_id: ID do documento
            analysis_result: Resultado da análise
        """
        # Salva tags
        for tag_name in analysis_result.get("tags", []):
            existing_tag = self.db.query(DocumentoTag).filter(
                DocumentoTag.documento_id == documento_id,
                DocumentoTag.tag == tag_name
            ).first()
            
            if not existing_tag:
                tag = DocumentoTag(
                    documento_id=documento_id,
                    tag=tag_name,
                    origem="llm"
                )
                self.db.add(tag)
        
        # Salva entidades
        for entity in analysis_result.get("entities", []):
            existing_entity = self.db.query(DocumentoEntidade).filter(
                DocumentoEntidade.documento_id == documento_id,
                DocumentoEntidade.tipo_entidade == entity["type"],
                DocumentoEntidade.valor == entity["value"]
            ).first()
            
            if not existing_entity:
                entidade = DocumentoEntidade(
                    documento_id=documento_id,
                    tipo_entidade=entity["type"],
                    valor=entity["value"],
                    confianca=Decimal(str(entity.get("confidence", 0)))
                )
                self.db.add(entidade)
        
        self.db.commit()
    
    async def _update_document_status(self, documento_id: int, status: str, 
                                    model: str, tokens: int = None):
        """
        Atualiza status do documento
        
        Args:
            documento_id: ID do documento
            status: Novo status
            model: Modelo usado
            tokens: Tokens usados (opcional)
        """
        documento = self.db.query(Documento).filter(Documento.id == documento_id).first()
        if documento:
            documento.detalhamento_status = status
            documento.detalhamento_data = datetime.now()
            documento.detalhamento_modelo = model
            if tokens:
                documento.detalhamento_tokens = tokens
            
            self.db.commit()
    
    def _get_average_tokens_per_document(self) -> int:
        """
        Obtém média de tokens por documento processado
        
        Returns:
            Média de tokens
        """
        avg_tokens = self.db.query(func.avg(Documento.detalhamento_tokens)).filter(
            Documento.detalhamento_tokens.isnot(None)
        ).scalar()
        
        return int(avg_tokens) if avg_tokens else 0 