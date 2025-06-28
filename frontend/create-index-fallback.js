#!/usr/bin/env node

/**
 * Fallback script to ensure index.html exists
 * Creates index.html in public directory if it doesn't exist
 */

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const indexPath = path.join(publicDir, 'index.html');

console.log('🔧 Checking for index.html...');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  console.log('📁 Creating public directory...');
  fs.mkdirSync(publicDir, { recursive: true });
}

// Check if index.html exists
if (!fs.existsSync(indexPath)) {
  console.log('⚠️  index.html not found, creating fallback...');
  
  const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#1976d2" />
    <meta name="description" content="Sistema de análise inteligente para processos SEI do Rio de Janeiro" />
    <title>SEI-Com AI - Sistema de Análise Inteligente</title>
    
    <!-- Material-UI Roboto Font -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet" />
    
    <!-- Material Icons -->
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
    
    <style>
        body {
            margin: 0;
            font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Oxygen',
                'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
                sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        code {
            font-family: 'Roboto Mono', source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
                monospace;
        }
        
        /* Loading spinner inicial */
        #loading {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #f5f5f5;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #e0e0e0;
            border-top: 4px solid #1976d2;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <noscript>Você precisa habilitar o JavaScript para executar esta aplicação.</noscript>
    
    <!-- Loading inicial -->
    <div id="loading">
        <div class="spinner"></div>
    </div>
    
    <!-- Container principal da aplicação React -->
    <div id="root"></div>
    
    <script>
        // Remove loading quando a aplicação carregar
        window.addEventListener('load', function() {
            const loading = document.getElementById('loading');
            if (loading) {
                loading.style.display = 'none';
            }
        });
    </script>
</body>
</html>`;

  fs.writeFileSync(indexPath, htmlContent, 'utf8');
  console.log('✅ Fallback index.html created successfully!');
} else {
  console.log('✅ index.html exists, no action needed.');
}

console.log(`📍 Template path: ${indexPath}`); 