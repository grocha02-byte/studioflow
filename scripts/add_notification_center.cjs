const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "import Configuracoes from './components/Configuracoes';",
  "import Configuracoes from './components/Configuracoes';\nimport NotificationCenter from './components/NotificationCenter';"
);

code = code.replace(
  /<span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" \/>\n            <span className="tracking-wider uppercase">Nuvem Sincronizada<\/span>\n            <span className="text-gold-200">\|<\/span>/g,
  `<NotificationCenter />
            <span className="text-gold-200">|</span>
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="tracking-wider uppercase hidden sm:inline">Nuvem Sincronizada</span>
            <span className="text-gold-200 hidden sm:inline">|</span>`
);

fs.writeFileSync('src/App.tsx', code);
