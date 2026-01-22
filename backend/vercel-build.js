// Arquivo de build para o Vercel
const fs = require('fs');
const path = require('path');

console.log('🚀 Preparando build para Vercel...');

// Verificar se a pasta frontend existe
const frontendPath = path.join(__dirname, '../frontend');
if (!fs.existsSync(frontendPath)) {
    console.error('❌ Pasta frontend não encontrada!');
    process.exit(1);
}

console.log('✅ Build configurado com sucesso!');