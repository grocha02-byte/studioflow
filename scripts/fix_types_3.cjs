const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/motivo:/g, "observacoes:");

if (!code.includes('const handleDeleteAgendamento = async')) {
  code = code.replace(
    /const handleConcluirAgendamento = /g,
    `const handleDeleteAgendamento = async (id: string) => { await deleteDocData('agendamentos', id); };\n  const handleConcluirAgendamento = `
  );
}

fs.writeFileSync('src/App.tsx', code);
