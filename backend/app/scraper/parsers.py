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
        """Parse da tabela de autuação da página SEI"""
        result = {}
        
        try:
            # Procura pela primeira tabela com dados de autuação
            tables = soup.find_all('table')
            
            for table in tables:
                rows = table.find_all('tr')
                for row in rows:
                    cells = row.find_all('td')
                    
                    # Verifica se tem exatamente 2 colunas (label:value)
                    if len(cells) == 2:
                        label = cells[0].get_text(strip=True)
                        value = cells[1].get_text(strip=True)
                        
                        # Mapeia labels exatos da página SEI-RJ
                        if label == 'Processo:':
                            result['numero_sei'] = value
                        elif label == 'Tipo:':
                            result['tipo'] = value
                        elif label == 'Data de Geração:':
                            result['data_geracao'] = SEIParser._parse_date(value)
                        elif label == 'Interessados:':
                            result['interessados'] = value if value else None
                            
                # Se encontrou dados, para de procurar
                if result.get('numero_sei'):
                    break
                        
        except Exception as e:
            # Log do erro para debugging
            print(f"Erro no parse de autuação: {e}")
            
        return result
    
    @staticmethod
    def parse_documentos_table(table: BeautifulSoup) -> List[Dict]:
        """Parse da tabela de protocolos/documentos (tblCabecalho)"""
        result = []
        
        try:
            rows = table.find_all('tr')
            print(f"Debug: Analisando tabela de documentos com {len(rows)} linhas")
            
            for i, row in enumerate(rows):
                cells = row.find_all('td')
                
                # Pular cabeçalho (primeira linha geralmente)
                if i == 0 or len(cells) < 4:
                    continue
                
                # Estrutura da tabela: checkbox | link+tipo | tipo | data | data_inclusao | unidade
                # Procurar por links numéricos na segunda célula
                if len(cells) >= 4:
                    doc_cell = cells[1]  # Segunda célula
                    links = doc_cell.find_all('a')
                    
                    for link in links:
                        link_text = link.get_text(strip=True)
                        
                        # Verifica se é número de documento (8 dígitos)
                        if re.match(r'^\d{8}$', link_text):
                            numero_documento = link_text
                            
                            # Extrai tipo do título do link ou texto adjacente
                            tipo = link.get('title', '').strip(' "')
                            if not tipo:
                                # Procura texto após o link na mesma célula
                                remaining_text = doc_cell.get_text(strip=True)
                                remaining_text = remaining_text.replace(link_text, '').strip(' "')
                                tipo = remaining_text or 'Documento'
                            
                            # Extrai datas das próximas células
                            data_documento = None
                            data_inclusao = None
                            unidade = None
                            
                            # Terceira célula: tipo (alternativo)
                            if len(cells) > 2 and not tipo:
                                tipo = cells[2].get_text(strip=True)
                            
                            # Quarta célula: data
                            if len(cells) > 3:
                                data_text = cells[3].get_text(strip=True)
                                data_documento = SEIParser._parse_date(data_text)
                            
                            # Quinta célula: data de inclusão
                            if len(cells) > 4:
                                data_inc_text = cells[4].get_text(strip=True)
                                data_inclusao = SEIParser._parse_date(data_inc_text)
                            
                            # Sexta célula: unidade
                            if len(cells) > 5:
                                unidade = cells[5].get_text(strip=True)
                            
                            documento = {
                                'numero_documento': numero_documento,
                                'tipo': tipo or 'Documento',
                                'data_documento': data_documento,
                                'data_inclusao': data_inclusao,
                                'unidade': unidade
                            }
                            
                            result.append(documento)
            
            print(f"Debug: Extraídos {len(result)} documentos")
                        
        except Exception as e:
            print(f"Erro no parse de documentos: {e}")
            import traceback
            traceback.print_exc()
            
        return result
    
    @staticmethod
    def parse_andamentos_table(table: BeautifulSoup) -> List[Dict]:
        """Parse da tabela de histórico de andamentos (tblHistorico)"""
        result = []
        
        try:
            rows = table.find_all('tr')
            print(f"Debug: Analisando tabela de andamentos com {len(rows)} linhas")
            
            for i, row in enumerate(rows):
                cells = row.find_all('td')
                
                # Pular cabeçalho (primeira linha)
                if i == 0 or len(cells) < 2:
                    continue
                
                # Estrutura: Data/Hora | Unidade | Descrição
                if len(cells) >= 2:
                    first_cell_text = cells[0].get_text(strip=True)
                    
                    # Verifica padrão de data/hora: DD/MM/AAAA HH:MM
                    if re.match(r'\d{2}/\d{2}/\d{4} \d{2}:\d{2}', first_cell_text):
                        # Extrai data/hora
                        data_hora = SEIParser._parse_datetime(first_cell_text)
                        if not data_hora:
                            continue
                        
                        # Segunda célula: unidade
                        unidade = None
                        if len(cells) >= 2:
                            unidade = cells[1].get_text(strip=True) or None
                        
                        # Terceira célula: descrição
                        descricao = ""
                        if len(cells) >= 3:
                            descricao = cells[2].get_text(strip=True)
                        elif len(cells) >= 2:
                            # Se só tem 2 células, segunda é descrição
                            descricao = cells[1].get_text(strip=True)
                            unidade = None
                        
                        if descricao:  # Só adiciona se tem descrição
                            andamento = {
                                'data_hora': data_hora,
                                'descricao': descricao,
                                'unidade': unidade
                            }
                            result.append(andamento)
            
            # Remove duplicatas
            seen = set()
            unique_result = []
            for andamento in result:
                key = (andamento['data_hora'].isoformat(), andamento['descricao'])
                if key not in seen:
                    seen.add(key)
                    unique_result.append(andamento)
            
            # Ordena por data_hora (cronológico crescente)
            unique_result.sort(key=lambda x: x['data_hora'])
            
            print(f"Debug: Extraídos {len(unique_result)} andamentos únicos")
            return unique_result
                        
        except Exception as e:
            print(f"Erro no parse de andamentos: {e}")
            import traceback
            traceback.print_exc()
            
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