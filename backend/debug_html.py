#!/usr/bin/env python3
"""
Script para debugging do HTML das páginas SEI
"""
import asyncio
import aiohttp
from pathlib import Path
from bs4 import BeautifulSoup

# URLs reais fornecidas pelo usuário
URLS_TESTE = [
    "https://sei.rj.gov.br/sei/modulos/pesquisa/md_pesq_processo_exibir.php?IC2o8Z7ACQH4LdQ4jJLJzjPBiLtP6l2FsQacllhUf-duzEubalut9yvd8-CzYYNLu7pd-wiM0k633-D6khhQNWcmSDZ7pQiEU0-fzi-haycwfope5I8xSVFCcuFRAsbo",
]

async def fetch_and_save_html(url: str, filename: str):
    """Baixa e salva HTML da URL"""
    print(f"🔍 Baixando HTML de: {url}")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    async with aiohttp.ClientSession(
        timeout=aiohttp.ClientTimeout(total=30),
        headers=headers
    ) as session:
        async with session.get(url) as response:
            if response.status == 200:
                html = await response.text()
                
                # Salvar HTML
                with open(filename, 'w', encoding='utf-8') as f:
                    f.write(html)
                print(f"✅ HTML salvo em: {filename}")
                
                return html
            else:
                print(f"❌ Erro HTTP {response.status}")
                return None

def analyze_html_structure(html: str, filename: str):
    """Analisa estrutura do HTML"""
    print(f"\n🔍 ANALISANDO ESTRUTURA: {filename}")
    
    soup = BeautifulSoup(html, 'html.parser')
    
    # 1. Buscar tabelas
    tables = soup.find_all('table')
    print(f"📊 Total de tabelas encontradas: {len(tables)}")
    
    for i, table in enumerate(tables):
        print(f"\n   📋 TABELA {i + 1}:")
        
        # Verificar atributos
        attrs = dict(table.attrs) if table.attrs else {}
        if attrs:
            print(f"      - Atributos: {attrs}")
        
        # Contar linhas e colunas
        rows = table.find_all('tr')
        print(f"      - Linhas: {len(rows)}")
        
        if rows:
            # Analisar primeira linha
            first_row = rows[0]
            cells = first_row.find_all(['td', 'th'])
            print(f"      - Colunas (primeira linha): {len(cells)}")
            
            # Mostrar primeiras 3 células da primeira linha
            for j, cell in enumerate(cells[:3]):
                text = cell.get_text(strip=True)[:50]  # Primeiros 50 chars
                print(f"        - Célula {j+1}: {text}")
        
        # Verificar se tem dados de data/hora (andamentos)
        datetime_pattern = r'\d{2}/\d{2}/\d{4} \d{2}:\d{2}'
        if any(re.search(datetime_pattern, row.get_text()) for row in rows):
            print(f"      - 🕒 CONTÉM PADRÃO DATA/HORA (possível tabela de andamentos)")
        
        # Verificar se tem links numericos (documentos)
        links = table.find_all('a')
        numeric_links = [link for link in links if re.match(r'^\d+$', link.get_text(strip=True))]
        if numeric_links:
            print(f"      - 📄 CONTÉM LINKS NUMÉRICOS: {len(numeric_links)} (possível tabela de documentos)")
    
    # 2. Buscar texto "Lista de Protocolos"
    lista_protocolos = soup.find(text=re.compile(r'Lista de Protocolos'))
    if lista_protocolos:
        print(f"\n📄 ENCONTRADO: 'Lista de Protocolos' no HTML")
    else:
        print(f"\n❌ NÃO ENCONTRADO: 'Lista de Protocolos' no HTML")
    
    # 3. Procurar padrões específicos
    text = soup.get_text()
    
    # Contar números de protocolo
    protocol_numbers = re.findall(r'\b\d{8}\b', text)  # 8 dígitos
    print(f"\n📄 Números de protocolo encontrados: {len(set(protocol_numbers))}")
    
    # Contar padrões de data/hora
    datetime_matches = re.findall(r'\d{2}/\d{2}/\d{4} \d{2}:\d{2}', text)
    print(f"🕒 Padrões de data/hora encontrados: {len(datetime_matches)}")
    
    # Buscar palavras-chave
    keywords = ['Processo recebido', 'Processo remetido', 'unidade', 'documento', 'protocolo']
    for keyword in keywords:
        count = text.lower().count(keyword.lower())
        if count > 0:
            print(f"🔑 Palavra-chave '{keyword}': {count} ocorrências")

async def main():
    """Função principal"""
    print("🚀 INICIANDO DEBUGGING HTML DAS PÁGINAS SEI")
    
    # Criar diretório para HTMLs
    Path("debug_html").mkdir(exist_ok=True)
    
    for i, url in enumerate(URLS_TESTE):
        filename = f"debug_html/sei_page_{i+1}.html"
        
        # Baixar HTML
        html = await fetch_and_save_html(url, filename)
        
        if html:
            # Analisar estrutura
            analyze_html_structure(html, filename)
        
        print(f"\n{'='*80}")

if __name__ == "__main__":
    import re
    asyncio.run(main()) 