const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/dataHora: new Date\(\)\.toISOString\(\),/g, "data: new Date().toISOString().substring(0, 10),");

if (!code.includes('const handleDeleteAgendamento = ')) {
  code = code.replace(
    /return \(\n    <div className="min-h-screen/g,
    `const handleDeleteAgendamento = async (id: string) => { await deleteDocData('agendamentos', id); };\n  return (\n    <div className="min-h-screen`
  );
}

fs.writeFileSync('src/App.tsx', code);
