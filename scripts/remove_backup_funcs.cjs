const fs = require('fs');
let code = fs.readFileSync('src/components/Configuracoes.tsx', 'utf8');

code = code.replace(/const handleExportBackup = \(\) => \{[\s\S]*?catch \(err\) \{\s*alert\('Erro ao importar arquivo\. Verifique o formato\.'\);\s*\}\s*\}\s*\};/m, '');

fs.writeFileSync('src/components/Configuracoes.tsx', code);
