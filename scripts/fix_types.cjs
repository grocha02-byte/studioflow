const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/nova.tipo === 'entrada'/g, "nova.tipo === 'Entrada'");
code = code.replace(/tipo: 'saida'/g, "tipo: 'Saída'");
code = code.replace(/t\.tipo === 'entrada'/g, "t.tipo === 'Entrada'");
code = code.replace(/tipo: 'entrada'/g, "tipo: 'Entrada'");

// Add handleDeleteAgendamento if missing
if (!code.includes('const handleDeleteAgendamento = ')) {
  code = code.replace(
    /const handleConcluirAgendamento =/g,
    `const handleDeleteAgendamento = async (id: string) => { await deleteDocData('agendamentos', id); };\n  const handleConcluirAgendamento =`
  );
}

fs.writeFileSync('src/App.tsx', code);
