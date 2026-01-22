// backend/vercel-build.js
console.log('🚀 Configurando build para Vercel...');

// Forçar instalação de dependências nativas
const { execSync } = require('child_process');

try {
    console.log('📦 Instalando dependências...');
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Build concluído com sucesso!');
} catch (error) {
    console.error('❌ Erro no build:', error);
    process.exit(1);
}