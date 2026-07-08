const fs = require('fs');
let code = fs.readFileSync('src/components/Configuracoes.tsx', 'utf8');

code = code.replace(/const handleExportBackup = \(\) => \{[\s\S]*?const handleImportBackup = \(e: React\.ChangeEvent<HTMLInputElement>\) => \{[\s\S]*?catch \(err\) \{\s*alert\('Erro ao importar arquivo\. Verifique o formato\.'\);\s*\}\s*\}\s*\};/m, '');

code = code.replace(/\{!-- Backup & Segurança --\}[\s\S]*?\{!-- Reset Master --\}/m, '{/* Reset Master */}');

fs.writeFileSync('src/components/Configuracoes.tsx', code);
