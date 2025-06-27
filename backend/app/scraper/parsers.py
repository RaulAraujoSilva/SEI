"""
Parsers para extrair dados das páginas SEI
"""
import re
from datetime import datetime, date
from typing import Dict, List, Optional
from bs4 import BeautifulSoup


class SEIParser:
    """Parser para páginas SEI do RJ"""
    
    @staticmethod
    def parse_autuacao_table(soup: BeautifulSoup) -> Dict:
        """Parse da tabela de autuação"""
        result = {}
        
        try:
            # Procura por tabelas com classe infraTable
            table = soup.find('table', class_='infraTable')
            if not table:
                return result
            
            # Processa cada linha da tabela
            rows = table.find_all('tr')
            for row in rows:
                cells = row.find_all('td')
                if len(cells) >= 2:
                    label_cell = cells[0]
                    value_cell = cells[1]
                    
                    label = label_cell.get_text(strip=True)
                    value = value_cell.get_text(strip=True)
                    
                    # Mapeia labels para campos
                    if 'Processo:' == label:
                        result['numero_sei'] = value
                    elif 'Tipo do Processo:' == label:
                        result['tipo'] = value
                    elif 'Data de Geração:' == label:
                        result['data_geracao'] = SEIParser._parse_date(value)
                    elif 'Interessados:' == label:
                        result['interessados'] = value
                        
        except Exception:
            # Em caso de erro, retorna dicionário vazio ou parcial
            pass
            
        return result
    
    @staticmethod
    def parse_documentos_table(soup: BeautifulSoup) -> List[Dict]:
        """Parse da tabela de documentos"""
        result = []
        
        try:
            # Procura por tabelas com classe infraTable
            table = soup.find('table', class_='infraTable')
            if not table:
                return result
            
            # Processa cada linha da tabela (exceto cabeçalho)
            rows = table.find_all('tr')
            for row in rows:
                cells = row.find_all('td')
                
                # Verifica se é uma linha de dados (não cabeçalho ou mensagem vazia)
                if len(cells) >= 5:
                    # Ignora se contém mensagem de "Nenhum documento encontrado"
                    first_cell_text = cells[0].get_text(strip=True)
                    if 'Nenhum documento' in first_cell_text or 'encontrado' in first_cell_text:
                        continue
                    
                    # Extrai dados das células (assumindo ordem: seq, numero, tipo, data, unidade)
                    documento = {
                        'numero_documento': cells[1].get_text(strip=True),
                        'tipo': cells[2].get_text(strip=True),
                        'data_documento': SEIParser._parse_date(cells[3].get_text(strip=True)),
                        'unidade': cells[4].get_text(strip=True)
                    }
                    
                    # Só adiciona se tiver número do documento
                    if documento['numero_documento']:
                        result.append(documento)
                        
        except Exception:
            # Em caso de erro, retorna lista vazia
            pass
            
        return result
    
    @staticmethod
    def parse_andamentos_table(soup: BeautifulSoup) -> List[Dict]:
        """Parse da tabela de andamentos"""
        result = []
        
        try:
            # Procura por tabelas com classe infraTable
            table = soup.find('table', class_='infraTable')
            if not table:
                return result
            
            # Processa cada linha da tabela
            rows = table.find_all('tr')
            for row in rows:
                cells = row.find_all('td')
                
                # Verifica se é uma linha de dados com 3 colunas (data_hora, descricao, unidade)
                if len(cells) >= 3:
                    data_hora_text = cells[0].get_text(strip=True)
                    descricao = cells[1].get_text(strip=True)
                    unidade = cells[2].get_text(strip=True)
                    
                    # Parse da data e hora
                    data_hora = SEIParser._parse_datetime(data_hora_text)
                    
                    if data_hora:  # Só adiciona se conseguir fazer parse da data
                        andamento = {
                            'data_hora': data_hora,
                            'descricao': descricao,
                            'unidade': unidade
                        }
                        result.append(andamento)
            
            # Ordena por data_hora (cronológico crescente)
            result.sort(key=lambda x: x['data_hora'])
                        
        except Exception:
            # Em caso de erro, retorna lista vazia
            pass
            
        return result
    
    @staticmethod
    def _parse_date(date_str: str) -> Optional[date]:
        """Parse de string de data para objeto date"""
        if not date_str or date_str.strip() == '':
            return None
            
        try:
            # Tenta formato brasileiro dd/mm/yyyy
            date_str = date_str.strip()
            if re.match(r'\d{2}/\d{2}/\d{4}', date_str):
                return datetime.strptime(date_str, '%d/%m/%Y').date()
        except Exception:
            pass
            
        return None
    
    @staticmethod
    def _parse_datetime(datetime_str: str) -> Optional[datetime]:
        """Parse de string de data/hora para objeto datetime"""
        if not datetime_str or datetime_str.strip() == '':
            return None
            
        try:
            # Tenta formato brasileiro dd/mm/yyyy hh:mm
            datetime_str = datetime_str.strip()
            if re.match(r'\d{2}/\d{2}/\d{4} \d{2}:\d{2}', datetime_str):
                return datetime.strptime(datetime_str, '%d/%m/%Y %H:%M')
        except Exception:
            pass
            
        return None 