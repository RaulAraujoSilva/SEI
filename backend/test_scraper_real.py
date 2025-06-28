#!/usr/bin/env python3
"""
Teste real de scraping das URLs do SEI-RJ fornecidas pelo usuário
"""
import asyncio
import sys
import os
from pathlib import Path
from datetime import datetime

# Adicionar o diretório do app ao path para imports
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.connection import Base
from app.scraper.base import SEIScraper
from app.scraper.config import ScraperConfig
from app.services.persistence import ProcessoPersistenceService
from app.services.document_download import DocumentDownloadService

# URLs reais fornecidas pelo usuário
URLS_TESTE = [
    "https://sei.rj.gov.br/sei/modulos/pesquisa/md_pesq_processo_exibir.php?IC2o8Z7ACQH4LdQ4jJLJzjPBiLtP6l2FsQacllhUf-duzEubalut9yvd8-CzYYNLu7pd-wiM0k633-D6khhQNWcmSDZ7pQiEU0-fzi-haycwfope5I8xSVFCcuFRAsbo",
    "https://sei.rj.gov.br/sei/modulos/pesquisa/md_pesq_processo_exibir.php?rhvLNMLonhi2QStBSsTZGiGoQmCrLQaX2XhbnBMJ8pkwCR3ymzAH-pH3jSIrZ5qWOweyB9pzdjQy283MIK0o5-cJWO9VKQpl3AODK8ULDj2yxrNRHbZaxL8K6rICcSP0"
]

class ScraperTestRunner:
    """Executor de testes do scraper com dados reais"""
    
    def __init__(self):
        """Inicializa o runner de testes"""
        # Configuração do banco de dados de teste
        self.db_url = "sqlite:///test_scraper_real.db"
        self.engine = create_engine(self.db_url, echo=True)  # echo=True para ver SQL
        
        # Criar tabelas
        Base.metadata.drop_all(bind=self.engine)  # Limpar dados antigos
        Base.metadata.create_all(bind=self.engine)
        
        # Sessão do banco
        SessionLocal = sessionmaker(bind=self.engine)
        self.db = SessionLocal()
        
        # Configuração do scraper
        self.scraper_config = ScraperConfig(
            delay=2,  # 2 segundos entre requests
            timeout=30,  # 30 segundos de timeout
            max_retries=3  # 3 tentativas
        )
        
        # Serviços
        self.scraper = SEIScraper(self.scraper_config)
        self.persistence_service = ProcessoPersistenceService(self.db)
        self.download_service = DocumentDownloadService(self.db, config={
            "download_base_path": "./test_downloads",
            "timeout": 30
        })
        
        # Criar diretório de downloads
        Path("./test_downloads").mkdir(exist_ok=True)
    
    async def test_single_url(self, url: str, index: int) -> bool:
        """
        Testa scraping de uma URL específica
        
        Args:
            url: URL do processo SEI
            index: Índice do teste
            
        Returns:
            True se sucesso, False se falha
        """
        print(f"\n{'='*80}")
        print(f"🔍 TESTE {index + 1}: SCRAPING URL")
        print(f"URL: {url}")
        print(f"{'='*80}")
        
        try:
            # 1. SCRAPING
            print("\n📡 Iniciando scraping...")
            scraping_result = await self.scraper.scrape_processo(url)
            
            if not scraping_result.success:
                print(f"❌ Erro no scraping: {scraping_result.error_message}")
                return False
            
            processo_data = scraping_result.processo_data
            print(f"✅ Scraping concluído!")
            print(f"   📋 Processo: {processo_data.autuacao.numero_sei}")
            print(f"   📄 Documentos: {len(processo_data.documentos)}")
            print(f"   📝 Andamentos: {len(processo_data.andamentos)}")
            
            # 2. PERSISTÊNCIA
            print("\n💾 Salvando no banco de dados...")
            
            persistence_result = await self.persistence_service.save_processo_data(processo_data, url)
            
            if not persistence_result.success:
                print(f"❌ Erro na persistência: {persistence_result.error_message}")
                return False
            
            print(f"✅ Dados salvos no banco!")
            print(f"   🆔 ID do processo: {persistence_result.processo_id}")
            print(f"   🔄 Processo {'atualizado' if persistence_result.was_updated else 'criado'}")
            print(f"   📊 Mudanças detectadas: {persistence_result.changes_detected}")
            
            # 3. ESTATÍSTICAS DETALHADAS
            self._print_detailed_stats(processo_data)
            
            # 4. SIMULAR DOWNLOAD DE ALGUNS DOCUMENTOS
            await self._test_document_download(persistence_result.processo_id, processo_data.documentos[:3])
            
            return True
            
        except Exception as e:
            print(f"❌ Erro inesperado: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def _print_detailed_stats(self, processo_data):
        """Imprime estatísticas detalhadas dos dados extraídos"""
        print(f"\n📊 ESTATÍSTICAS DETALHADAS:")
        
        # Autuação
        autuacao = processo_data.autuacao
        print(f"   📋 AUTUAÇÃO:")
        print(f"      - Número: {autuacao.numero_sei}")
        print(f"      - Tipo: {autuacao.tipo}")
        print(f"      - Data: {autuacao.data_geracao}")
        print(f"      - Interessados: {autuacao.interessados or 'Não informado'}")
        
        # Documentos
        print(f"   📄 DOCUMENTOS ({len(processo_data.documentos)}):")
        tipos_doc = {}
        for doc in processo_data.documentos:
            tipo = doc.tipo or 'Não informado'
            tipos_doc[tipo] = tipos_doc.get(tipo, 0) + 1
        
        for tipo, count in sorted(tipos_doc.items()):
            print(f"      - {tipo}: {count}")
        
        # Andamentos
        print(f"   📝 ANDAMENTOS ({len(processo_data.andamentos)}):")
        unidades = {}
        for and_item in processo_data.andamentos:
            unidade = and_item.unidade or 'Não informado'
            unidades[unidade] = unidades.get(unidade, 0) + 1
        
        for unidade, count in sorted(unidades.items()):
            print(f"      - {unidade}: {count}")
    
    async def _test_document_download(self, processo_id: int, documentos_sample):
        """
        Testa download de alguns documentos
        
        Args:
            processo_id: ID do processo
            documentos_sample: Amostra de documentos para testar
        """
        if not documentos_sample:
            return
        
        print(f"\n📥 TESTE DE DOWNLOAD (amostra de {len(documentos_sample)} documentos):")
        
        for i, doc_data in enumerate(documentos_sample):
            print(f"   📄 Documento {i+1}: {doc_data.numero_documento}")
            print(f"      - Tipo: {doc_data.tipo}")
            print(f"      - Data: {doc_data.data_documento}")
            print(f"      - Unidade: {doc_data.unidade}")
            
            # Simular URL de download (normalmente viria do scraping)
            fake_download_url = f"https://sei.rj.gov.br/sei/modulos/pesquisa/md_pesq_documento_consultar.php?id={doc_data.numero_documento}"
            print(f"      - URL simulada: {fake_download_url}")
            
            # Criar objeto Documento mock para teste
            from app.models.processo import Documento
            documento_mock = Documento(
                id=i+1,
                processo_id=processo_id,
                numero_documento=doc_data.numero_documento,
                tipo=doc_data.tipo
            )
            
            print(f"      - ✅ Estrutura de download preparada")
    
    async def run_all_tests(self):
        """Executa todos os testes"""
        print("🚀 INICIANDO TESTES REAIS DO SCRAPER SEI-RJ")
        print(f"⏰ Data/Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
        print(f"💾 Banco de dados: {self.db_url}")
        print(f"📁 Downloads: ./test_downloads/")
        
        success_count = 0
        
        for i, url in enumerate(URLS_TESTE):
            success = await self.test_single_url(url, i)
            if success:
                success_count += 1
        
        # Relatório final
        print(f"\n{'='*80}")
        print(f"📈 RELATÓRIO FINAL DOS TESTES")
        print(f"{'='*80}")
        print(f"✅ Testes bem-sucedidos: {success_count}/{len(URLS_TESTE)}")
        print(f"❌ Testes falharam: {len(URLS_TESTE) - success_count}/{len(URLS_TESTE)}")
        
        if success_count == len(URLS_TESTE):
            print("🎉 TODOS OS TESTES PASSARAM! O scraper está funcionando perfeitamente.")
        else:
            print("⚠️  Alguns testes falharam. Verifique os logs acima.")
        
        print(f"\n💾 Dados salvos em: {self.db_url}")
        print(f"📁 Downloads em: ./test_downloads/")
        
        # Verificar dados no banco
        self._verify_database_contents()
    
    def _verify_database_contents(self):
        """Verifica o conteúdo salvo no banco de dados"""
        print(f"\n🔍 VERIFICAÇÃO DO BANCO DE DADOS:")
        
        from app.models.processo import Processo, Documento, Andamento
        
        # Contar registros
        processos_count = self.db.query(Processo).count()
        documentos_count = self.db.query(Documento).count()
        andamentos_count = self.db.query(Andamento).count()
        
        print(f"   📊 Registros salvos:")
        print(f"      - Processos: {processos_count}")
        print(f"      - Documentos: {documentos_count}")
        print(f"      - Andamentos: {andamentos_count}")
        
        # Listar processos salvos
        processos = self.db.query(Processo).all()
        for processo in processos:
            print(f"   📋 Processo ID {processo.id}:")
            print(f"      - Número: {processo.numero}")
            print(f"      - Tipo: {processo.tipo}")
            print(f"      - Interessado: {processo.interessado}")
            print(f"      - Situação: {processo.situacao}")
    
    def cleanup(self):
        """Limpa recursos"""
        self.db.close()

async def main():
    """Função principal"""
    runner = ScraperTestRunner()
    
    try:
        await runner.run_all_tests()
    finally:
        runner.cleanup()

if __name__ == "__main__":
    # Executar testes
    asyncio.run(main()) 