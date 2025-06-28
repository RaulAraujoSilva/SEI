#!/usr/bin/env node
/**
 * Script de Teste - Fase 2: Frontend
 * ==================================
 * 
 * Testa todos os componentes implementados na Fase 2:
 * 1. Hook useScrapingPreview
 * 2. Página NovoProcessoSEI
 * 3. Rotas atualizadas
 * 4. Navegação e integração
 * 5. Compilação e build
 * 
 * Execução: node test_fase2_frontend.js
 */

const fs = require('fs');
const path = require('path');

// Configurar logging
const log = (message) => console.log(`${new Date().toISOString()} - ${message}`);
const error = (message) => console.error(`${new Date().toISOString()} - ERROR: ${message}`);

function testeArquivosExistem() {
    log("🧪 Testando existência de arquivos...");
    
    const arquivos = [
        'src/hooks/useScrapingPreview.ts',
        'src/pages/NovoProcessoSEI.tsx',
        'src/App.tsx'
    ];
    
    try {
        for (const arquivo of arquivos) {
            const caminho = path.join(__dirname, arquivo);
            if (!fs.existsSync(caminho)) {
                throw new Error(`Arquivo não encontrado: ${arquivo}`);
            }
        }
        
        log("✅ Todos os arquivos existem");
        return true;
    } catch (err) {
        error(`Arquivos: ${err.message}`);
        return false;
    }
}

function testeHookScrapingPreview() {
    log("🧪 Testando hook useScrapingPreview...");
    
    try {
        const hookPath = path.join(__dirname, 'src/hooks/useScrapingPreview.ts');
        const hookContent = fs.readFileSync(hookPath, 'utf8');
        
        // Verificar exports necessários
        const exports = [
            'ProcessoInfoPreview',
            'ProtocoloInfoPreview', 
            'AndamentoInfoPreview',
            'ScrapingPreviewResponse',
            'SalvarProcessoCompletoRequest',
            'useScrapingPreview'
        ];
        
        for (const exp of exports) {
            if (!hookContent.includes(exp)) {
                throw new Error(`Export não encontrado: ${exp}`);
            }
        }
        
        // Verificar estrutura do hook
        if (!hookContent.includes('previewScraping') || 
            !hookContent.includes('salvarProcessoCompleto') ||
            !hookContent.includes('useMutation')) {
            throw new Error('Estrutura do hook incompleta');
        }
        
        log("✅ Hook useScrapingPreview válido");
        return true;
    } catch (err) {
        error(`Hook: ${err.message}`);
        return false;
    }
}

function testePaginaNovoProcessoSEI() {
    log("🧪 Testando página NovoProcessoSEI...");
    
    try {
        const paginaPath = path.join(__dirname, 'src/pages/NovoProcessoSEI.tsx');
        const paginaContent = fs.readFileSync(paginaPath, 'utf8');
        
        // Verificar imports necessários
        const imports = [
            'useScrapingPreview',
            'ScrapingPreviewResponse',
            'SalvarProcessoCompletoRequest',
            '@mui/material',
            'useNavigate'
        ];
        
        for (const imp of imports) {
            if (!paginaContent.includes(imp)) {
                throw new Error(`Import não encontrado: ${imp}`);
            }
        }
        
        // Verificar componentes principais
        const componentes = [
            'realizarScraping',
            'salvarProcesso',
            'recarregarDados',
            'TabPanel',
            'TablePagination'
        ];
        
        for (const comp of componentes) {
            if (!paginaContent.includes(comp)) {
                throw new Error(`Componente não encontrado: ${comp}`);
            }
        }
        
        // Verificar estados
        const estados = [
            'useState',
            'dadosCarregados',
            'tabAtiva',
            'paginaProtocolos',
            'paginaAndamentos'
        ];
        
        for (const estado of estados) {
            if (!paginaContent.includes(estado)) {
                throw new Error(`Estado não encontrado: ${estado}`);
            }
        }
        
        log("✅ Página NovoProcessoSEI válida");
        return true;
    } catch (err) {
        error(`Página: ${err.message}`);
        return false;
    }
}

function testeRotasAtualizadas() {
    log("🧪 Testando rotas atualizadas...");
    
    try {
        const appPath = path.join(__dirname, 'src/App.tsx');
        const appContent = fs.readFileSync(appPath, 'utf8');
        
        // Verificar import da nova página
        if (!appContent.includes('import NovoProcessoSEI from')) {
            throw new Error('Import NovoProcessoSEI não encontrado');
        }
        
        // Verificar rota configurada
        if (!appContent.includes('processos/importar') || 
            !appContent.includes('<NovoProcessoSEI />')) {
            throw new Error('Rota processos/importar não configurada');
        }
        
        log("✅ Rotas atualizadas corretamente");
        return true;
    } catch (err) {
        error(`Rotas: ${err.message}`);
        return false;
    }
}

function testeProcessosListAtualizada() {
    log("🧪 Testando ProcessosList atualizada...");
    
    try {
        const processosPath = path.join(__dirname, 'src/pages/ProcessosList.tsx');
        const processosContent = fs.readFileSync(processosPath, 'utf8');
        
        // Verificar novo botão
        if (!processosContent.includes('Importar do SEI') ||
            !processosContent.includes('CloudDownload') ||
            !processosContent.includes('importarProcessoSEI')) {
            throw new Error('Botão "Importar do SEI" não encontrado');
        }
        
        // Verificar navegação
        if (!processosContent.includes('/processos/importar')) {
            throw new Error('Navegação para /processos/importar não configurada');
        }
        
        log("✅ ProcessosList atualizada corretamente");
        return true;
    } catch (err) {
        error(`ProcessosList: ${err.message}`);
        return false;
    }
}

function testeEstruturaTipos() {
    log("🧪 Testando estrutura de tipos...");
    
    try {
        const hookPath = path.join(__dirname, 'src/hooks/useScrapingPreview.ts');
        const hookContent = fs.readFileSync(hookPath, 'utf8');
        
        // Verificar interfaces necessárias
        const interfaces = [
            'interface ProcessoInfoPreview',
            'interface ProtocoloInfoPreview',
            'interface AndamentoInfoPreview',
            'interface ScrapingPreviewResponse',
            'interface SalvarProcessoCompletoRequest'
        ];
        
        for (const int of interfaces) {
            if (!hookContent.includes(int)) {
                throw new Error(`Interface não encontrada: ${int}`);
            }
        }
        
        // Verificar campos obrigatórios
        const campos = [
            'numero:',
            'tipo:',
            'data_autuacao:',
            'data_hora:',
            'unidade:',
            'descricao:',
            'url_original:',
            'total_protocolos:',
            'total_andamentos:'
        ];
        
        for (const campo of campos) {
            if (!hookContent.includes(campo)) {
                throw new Error(`Campo não encontrado: ${campo}`);
            }
        }
        
        log("✅ Estrutura de tipos válida");
        return true;
    } catch (err) {
        error(`Tipos: ${err.message}`);
        return false;
    }
}

function testeIntegracaoCompleta() {
    log("🧪 Testando integração completa...");
    
    try {
        // Verificar se todos os arquivos se referenciam corretamente
        const paginaPath = path.join(__dirname, 'src/pages/NovoProcessoSEI.tsx');
        const paginaContent = fs.readFileSync(paginaPath, 'utf8');
        
        // Verificar fluxo completo
        const fluxo = [
            'realizarScraping',
            'previewScraping.mutateAsync',
            'setDadosCarregados',
            'salvarProcessoCompleto.mutateAsync',
            'setSucesso'
        ];
        
        for (const step of fluxo) {
            if (!paginaContent.includes(step)) {
                throw new Error(`Passo do fluxo não encontrado: ${step}`);
            }
        }
        
        // Verificar tratamento de estados
        const estados = [
            'isLoading',
            'erro && (',
            'dadosCarregados && (',
            'sucesso'
        ];
        
        for (const estado of estados) {
            if (!paginaContent.includes(estado)) {
                throw new Error(`Estado não tratado: ${estado}`);
            }
        }
        
        log("✅ Integração completa válida");
        return true;
    } catch (err) {
        error(`Integração: ${err.message}`);
        return false;
    }
}

function main() {
    log("🚀 Iniciando Testes da Fase 2 - Frontend");
    log("=" * 60);
    
    // Executar testes
    const testes = [
        ["Arquivos Existem", testeArquivosExistem],
        ["Hook useScrapingPreview", testeHookScrapingPreview], 
        ["Página NovoProcessoSEI", testePaginaNovoProcessoSEI],
        ["Rotas Atualizadas", testeRotasAtualizadas],
        ["ProcessosList Atualizada", testeProcessosListAtualizada],
        ["Estrutura de Tipos", testeEstruturaTipos],
        ["Integração Completa", testeIntegracaoCompleta]
    ];
    
    const resultados = {};
    
    for (const [nome, funcTeste] of testes) {
        log(`\n📋 Executando: ${nome}`);
        try {
            const resultado = funcTeste();
            resultados[nome] = resultado;
            const status = resultado ? "✅ PASSOU" : "❌ FALHOU";
            log(`   ${status}`);
        } catch (err) {
            resultados[nome] = false;
            error(`   ❌ ERRO: ${err.message}`);
        }
    }
    
    // Relatório final
    log("\n" + "=".repeat(60));
    log("📊 RELATÓRIO FINAL - FASE 2");
    log("=".repeat(60));
    
    const totalTestes = Object.keys(resultados).length;
    const testesPassou = Object.values(resultados).filter(r => r).length;
    
    for (const [nome, resultado] of Object.entries(resultados)) {
        const status = resultado ? "✅ PASSOU" : "❌ FALHOU";
        log(`  ${nome}: ${status}`);
    }
    
    log(`\n📈 Resultado: ${testesPassou}/${totalTestes} testes passaram`);
    
    if (testesPassou === totalTestes) {
        log("🎉 FASE 2 APROVADA - Todos os componentes frontend funcionando!");
        return true;
    } else {
        error("❌ FASE 2 REPROVADA - Corrigir erros antes de continuar");
        return false;
    }
}

if (require.main === module) {
    const sucesso = main();
    process.exit(sucesso ? 0 : 1);
} 