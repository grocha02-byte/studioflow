const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "const MENU_ITEMS = [",
  `const role = usuarioData?.role || 'admin';
  const isAdminOrProp = role === 'admin' || role === 'proprietario';
  const isGerente = role === 'gerente';
  const isRecepcao = role === 'recepcionista';
  const isProfissional = role === 'profissional';

  const ALL_MENU_ITEMS = [`
);

code = code.replace(
  "  ];\n\n  const renderActiveComponent = () => {",
  `  ];

  const MENU_ITEMS = ALL_MENU_ITEMS.filter(item => {
    if (isAdminOrProp) return true;
    if (isGerente) return item.id !== 'configuracoes';
    if (isRecepcao) return ['dashboard', 'agenda', 'clientes', 'profissionais', 'servicos', 'estoque'].includes(item.id);
    if (isProfissional) return ['dashboard', 'agenda', 'clientes', 'servicos'].includes(item.id);
    return false;
  });

  const renderActiveComponent = () => {`
);

fs.writeFileSync('src/App.tsx', code);
