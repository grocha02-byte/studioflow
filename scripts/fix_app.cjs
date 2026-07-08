const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/const \[clientes, setClientes\].*\n/g, '');
code = code.replace(/const \[profissionais, setProfissionais\].*\n/g, '');
code = code.replace(/const \[servicos, setServicos\].*\n/g, '');
code = code.replace(/const \[agendamentos, setAgendamentos\].*\n/g, '');
code = code.replace(/const \[produtos, setProdutos\].*\n/g, '');
code = code.replace(/const \[movimentacoes, setMovimentacoes\].*\n/g, '');
code = code.replace(/const \[configuracao, setConfiguracao\].*\n/g, '');
code = code.replace(/const \[caixaTransacoes, setCaixaTransacoes\].*\n/g, '');
code = code.replace(/const \[caixaStatus, setCaixaStatus\].*\n/g, '');
code = code.replace(/  \/\/ Estados principais carregados reativamente do localStorage\n/g, '');

fs.writeFileSync('src/App.tsx', code);
