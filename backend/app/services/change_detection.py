"""
Serviço para detecção de mudanças em processos
"""
import hashlib
import json
from datetime import datetime
from typing import Dict, List, Any, Optional
from app.models.schemas import ChangesSummary, ContentHash


class ChangeDetectionService:
    """Serviço para detectar mudanças nos dados de processos"""
    
    def calculate_content_hash(self, content: Dict[str, Any]) -> str:
        """
        Calcula hash SHA-256 do conteúdo de forma determinística
        
        Args:
            content: Dicionário com dados do conteúdo
            
        Returns:
            Hash SHA-256 em formato hexadecimal
        """
        # Converte para JSON de forma determinística
        # Ordena as chaves e trata valores None
        normalized_content = self._normalize_content(content)
        content_json = json.dumps(normalized_content, sort_keys=True, default=str)
        
        # Calcula hash SHA-256
        return hashlib.sha256(content_json.encode('utf-8')).hexdigest()
    
    def detect_new_documents(self, current_docs: List[Dict], stored_docs: List[Dict]) -> List[Dict]:
        """
        Detecta documentos novos comparando com os armazenados
        
        Args:
            current_docs: Lista de documentos atuais
            stored_docs: Lista de documentos já armazenados
            
        Returns:
            Lista de documentos novos
        """
        stored_numbers = {doc.get('numero_documento') for doc in stored_docs}
        
        new_docs = []
        for doc in current_docs:
            doc_number = doc.get('numero_documento')
            if doc_number and doc_number not in stored_numbers:
                new_docs.append(doc)
        
        return new_docs
    
    def detect_new_andamentos(self, current_andamentos: List[Dict], stored_andamentos: List[Dict]) -> List[Dict]:
        """
        Detecta andamentos novos comparando com os armazenados
        
        Args:
            current_andamentos: Lista de andamentos atuais
            stored_andamentos: Lista de andamentos já armazenados
            
        Returns:
            Lista de andamentos novos
        """
        # Cria conjunto de identificadores únicos dos andamentos armazenados
        stored_identifiers = set()
        for andamento in stored_andamentos:
            identifier = self._create_andamento_identifier(andamento)
            stored_identifiers.add(identifier)
        
        new_andamentos = []
        for andamento in current_andamentos:
            identifier = self._create_andamento_identifier(andamento)
            if identifier not in stored_identifiers:
                new_andamentos.append(andamento)
        
        return new_andamentos
    
    def detect_autuacao_changes(self, current_autuacao: Dict, stored_autuacao: Dict) -> bool:
        """
        Detecta mudanças na autuação
        
        Args:
            current_autuacao: Dados atuais da autuação
            stored_autuacao: Dados armazenados da autuação
            
        Returns:
            True se houver mudanças, False caso contrário
        """
        current_hash = self.calculate_content_hash(current_autuacao)
        stored_hash = self.calculate_content_hash(stored_autuacao)
        
        return current_hash != stored_hash
    
    def detect_changes(self, current_data: Dict, stored_data: Dict) -> ChangesSummary:
        """
        Detecta todas as mudanças entre dados atuais e armazenados
        
        Args:
            current_data: Dados atuais do processo
            stored_data: Dados armazenados do processo
            
        Returns:
            Resumo das mudanças detectadas
        """
        changes = ChangesSummary()
        
        # Detecta mudanças na autuação
        if 'autuacao' in current_data and 'autuacao' in stored_data:
            changes.updated_autuacao = self.detect_autuacao_changes(
                current_data['autuacao'], 
                stored_data['autuacao']
            )
        
        # Detecta novos documentos
        if 'documentos' in current_data and 'documentos' in stored_data:
            new_docs = self.detect_new_documents(
                current_data['documentos'], 
                stored_data['documentos']
            )
            changes.new_documentos = len(new_docs)
        
        # Detecta novos andamentos
        if 'andamentos' in current_data and 'andamentos' in stored_data:
            new_andamentos = self.detect_new_andamentos(
                current_data['andamentos'], 
                stored_data['andamentos']
            )
            changes.new_andamentos = len(new_andamentos)
        
        return changes
    
    def compare_datetime_safe(self, dt1: datetime, dt2: datetime) -> bool:
        """
        Compara datetime ignorando microssegundos
        
        Args:
            dt1: Primeiro datetime
            dt2: Segundo datetime
            
        Returns:
            True se são iguais (ignorando microssegundos)
        """
        # Trunca para segundos
        dt1_truncated = dt1.replace(microsecond=0)
        dt2_truncated = dt2.replace(microsecond=0)
        
        return dt1_truncated == dt2_truncated
    
    def _normalize_content(self, content: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normaliza conteúdo para hash consistente
        
        Args:
            content: Conteúdo a ser normalizado
            
        Returns:
            Conteúdo normalizado
        """
        normalized = {}
        
        for key, value in content.items():
            if value is None:
                normalized[key] = None
            elif isinstance(value, datetime):
                # Converte datetime para string ISO
                normalized[key] = value.isoformat()
            elif isinstance(value, (list, tuple)):
                # Ordena listas para consistência
                normalized[key] = sorted(value) if all(isinstance(x, (str, int, float)) for x in value) else list(value)
            else:
                normalized[key] = value
        
        return normalized
    
    def _create_andamento_identifier(self, andamento: Dict) -> str:
        """
        Cria identificador único para andamento
        
        Args:
            andamento: Dados do andamento
            
        Returns:
            Identificador único como string
        """
        # Usa data_hora + descrição como identificador único
        data_hora = andamento.get('data_hora', '')
        descricao = andamento.get('descricao', '')
        
        # Se data_hora é datetime, converte para string
        if isinstance(data_hora, datetime):
            data_hora = data_hora.isoformat()
        
        return f"{data_hora}|{descricao}" 