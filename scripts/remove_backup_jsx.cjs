const fs = require('fs');
let code = fs.readFileSync('src/components/Configuracoes.tsx', 'utf8');

code = code.replace(
  /<div className="p-6 space-y-6">[\s\S]*?\{\/\* Reset Master \*\/\}/m,
  '<div className="p-6 space-y-6">\n          {/* Reset Master */}'
);

fs.writeFileSync('src/components/Configuracoes.tsx', code);
