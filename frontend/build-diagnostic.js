#!/usr/bin/env node

/**
 * Build Diagnostic Script for Render Deployment
 * Helps identify issues with the build environment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 SEI-Com AI - Build Diagnostic Report');
console.log('='.repeat(50));

// Check Node.js version
console.log(`📋 Node.js Version: ${process.version}`);
console.log(`📋 Platform: ${process.platform} ${process.arch}`);
console.log(`📋 Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB used`);

// Check critical files
const criticalFiles = [
  'package.json',
  'webpack.config.js', 
  'webpack.prod.config.js',
  'public/index.html',
  'src/index.tsx',
  'tsconfig.json'
];

console.log('\n📁 Critical Files Check:');
criticalFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  const exists = fs.existsSync(fullPath);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists && file === 'public/index.html') {
    console.log(`    🔍 Debugging: Full path checked: ${fullPath}`);
    console.log(`    🔍 Current working directory: ${process.cwd()}`);
    console.log(`    🔍 __dirname: ${__dirname}`);
    // Try to list public directory
    const publicDir = path.join(__dirname, 'public');
    if (fs.existsSync(publicDir)) {
      console.log(`    📁 public directory exists, contents:`);
      const publicContents = fs.readdirSync(publicDir);
      publicContents.forEach(item => {
        console.log(`      - ${item}`);
      });
    } else {
      console.log(`    ❌ public directory does not exist at: ${publicDir}`);
    }
  }
});

// Check dependencies
console.log('\n📦 Critical Dependencies:');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const criticalDeps = [
  'react',
  'react-dom', 
  'webpack',
  'html-webpack-plugin',
  'typescript',
  'ts-loader'
];

criticalDeps.forEach(dep => {
  const version = packageJson.dependencies[dep] || packageJson.devDependencies[dep];
  console.log(`  ${version ? '✅' : '❌'} ${dep}: ${version || 'NOT FOUND'}`);
});

// Check environment variables
console.log('\n🌍 Environment Variables:');
const envVars = [
  'NODE_ENV',
  'REACT_APP_API_URL', 
  'NODE_OPTIONS',
  'CI'
];

envVars.forEach(envVar => {
  const value = process.env[envVar];
  console.log(`  ${value ? '✅' : '⚠️'} ${envVar}: ${value || 'not set'}`);
});

// Check webpack config
console.log('\n⚙️ Webpack Configuration:');
try {
  const webpackConfig = require('./webpack.prod.config.js');
  console.log(`  ✅ webpack.prod.config.js loaded successfully`);
  console.log(`  📝 Entry point: ${webpackConfig.entry}`);
  console.log(`  📝 Output path: ${webpackConfig.output.path}`);
  console.log(`  📝 Template: ${webpackConfig.plugins.find(p => p.constructor.name === 'HtmlWebpackPlugin')?.options?.template || 'not found'}`);
} catch (error) {
  console.log(`  ❌ Error loading webpack config: ${error.message}`);
}

// Check disk space (if available)
console.log('\n💾 Disk Space:');
try {
  const stats = fs.statSync('./');
  console.log(`  ✅ Current directory accessible`);
} catch (error) {
  console.log(`  ❌ Directory access error: ${error.message}`);
}

console.log('\n🏁 Diagnostic Complete');
console.log('='.repeat(50));

process.exit(0); 