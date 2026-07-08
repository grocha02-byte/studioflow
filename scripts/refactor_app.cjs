const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Imports
code = code.replace(
  "import { storage, initializeStorage } from './utils/storage';",
  `import { useAuth } from './contexts/AuthContext';
import { useDatabase } from './hooks/useDatabase';
import Login from './components/Login';
import { signOut } from 'firebase/auth';
import { auth } from './lib/firebase';
import { storage } from './utils/storage';`
);

// App function start
code = code.replace(
  "export default function App() {\n  const [showSplash, setShowSplash] = useState(true);\n\n  // Inicializa o localStorage se vazio\n  useEffect(() => {\n    initializeStorage();\n    const timer = setTimeout(() => {\n      setShowSplash(false);\n    }, 2500);\n    return () => clearTimeout(timer);\n  }, []);",
  `export default function App() {
  const { user, loading } = useAuth();
  const dbStore = useDatabase();

  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <div className="min-h-screen bg-[#FAF8F6] flex items-center justify-center">Carregando...</div>;
  if (!user) return <Login />;

  const { clientes, profissionais, servicos, agendamentos, produtos, movimentacoes, caixaTransacoes, caixaStatus, configuracao, addDocData, updateDocData, deleteDocData, setDocData } = dbStore;
`
);

// Remove local state hooks
code = code.replace(/const \[clientes, setClientes\] = useState<Cliente\[\]>\(storage\.getClientes\(\)\);\n/g, '');
code = code.replace(/const \[profissionais, setProfissionais\] = useState<Profissional\[\]>\(storage\.getProfissionais\(\)\);\n/g, '');
code = code.replace(/const \[servicos, setServicos\] = useState<Servico\[\]>\(storage\.getServicos\(\)\);\n/g, '');
code = code.replace(/const \[agendamentos, setAgendamentos\] = useState<Agendamento\[\]>\(storage\.getAgendamentos\(\)\);\n/g, '');
code = code.replace(/const \[produtos, setProdutos\] = useState<Produto\[\]>\(storage\.getProdutos\(\)\);\n/g, '');
code = code.replace(/const \[movimentacoes, setMovimentacoes\] = useState<MovimentacaoEstoque\[\]>\(storage\.getMovimentacoes\(\)\);\n/g, '');
code = code.replace(/const \[caixaTransacoes, setCaixaTransacoes\] = useState<CaixaTransacao\[\]>\(storage\.getCaixaTransacoes\(\)\);\n/g, '');
code = code.replace(/const \[caixaStatus, setCaixaStatus\] = useState<CaixaStatus>\(storage\.getCaixaStatus\(\)\);\n/g, '');
code = code.replace(/const \[configuracao, setConfiguracao\] = useState<Configuracao>\(storage\.getConfiguracao\(\)\);\n/g, '');

// Replace storage updates with DB calls
// 1. Clientes
code = code.replace(
  /const handleAddCliente = \(c: Omit<Cliente, 'id'>\) => {\n    storage\.saveCliente\(c\);\n    setClientes\(storage\.getClientes\(\)\);\n  };/g,
  `const handleAddCliente = async (c: Omit<Cliente, 'id'>) => { await addDocData('clientes', c); };`
);
code = code.replace(
  /const handleUpdateCliente = \(c: Cliente\) => {\n    storage\.updateCliente\(c\);\n    setClientes\(storage\.getClientes\(\)\);\n  };/g,
  `const handleUpdateCliente = async (c: Cliente) => { await updateDocData('clientes', c.id!, c); };`
);
code = code.replace(
  /const handleDeleteCliente = \(id: string\) => {\n    storage\.deleteCliente\(id\);\n    setClientes\(storage\.getClientes\(\)\);\n  };/g,
  `const handleDeleteCliente = async (id: string) => { await deleteDocData('clientes', id); };`
);

// 2. Profissionais
code = code.replace(
  /const handleAddProfissional = \(p: Omit<Profissional, 'id'>\) => {\n    storage\.saveProfissional\(p\);\n    setProfissionais\(storage\.getProfissionais\(\)\);\n  };/g,
  `const handleAddProfissional = async (p: Omit<Profissional, 'id'>) => { await addDocData('profissionais', p); };`
);
code = code.replace(
  /const handleUpdateProfissional = \(p: Profissional\) => {\n    storage\.updateProfissional\(p\);\n    setProfissionais\(storage\.getProfissionais\(\)\);\n  };/g,
  `const handleUpdateProfissional = async (p: Profissional) => { await updateDocData('profissionais', p.id!, p); };`
);
code = code.replace(
  /const handleDeleteProfissional = \(id: string\) => {\n    storage\.deleteProfissional\(id\);\n    setProfissionais\(storage\.getProfissionais\(\)\);\n  };/g,
  `const handleDeleteProfissional = async (id: string) => { await deleteDocData('profissionais', id); };`
);

// 3. Servicos
code = code.replace(
  /const handleAddServico = \(s: Omit<Servico, 'id'>\) => {\n    storage\.saveServico\(s\);\n    setServicos\(storage\.getServicos\(\)\);\n  };/g,
  `const handleAddServico = async (s: Omit<Servico, 'id'>) => { await addDocData('servicos', s); };`
);
code = code.replace(
  /const handleUpdateServico = \(s: Servico\) => {\n    storage\.updateServico\(s\);\n    setServicos\(storage\.getServicos\(\)\);\n  };/g,
  `const handleUpdateServico = async (s: Servico) => { await updateDocData('servicos', s.id!, s); };`
);
code = code.replace(
  /const handleDeleteServico = \(id: string\) => {\n    storage\.deleteServico\(id\);\n    setServicos\(storage\.getServicos\(\)\);\n  };/g,
  `const handleDeleteServico = async (id: string) => { await deleteDocData('servicos', id); };`
);

// 4. Produtos
code = code.replace(
  /const handleAddProduto = \(p: Omit<Produto, 'id'>\) => {\n    storage\.saveProduto\(p\);\n    setProdutos\(storage\.getProdutos\(\)\);\n  };/g,
  `const handleAddProduto = async (p: Omit<Produto, 'id'>) => { await addDocData('produtos', p); };`
);
code = code.replace(
  /const handleUpdateProduto = \(p: Produto\) => {\n    storage\.updateProduto\(p\);\n    setProdutos\(storage\.getProdutos\(\)\);\n  };/g,
  `const handleUpdateProduto = async (p: Produto) => { await updateDocData('produtos', p.id!, p); };`
);
code = code.replace(
  /const handleDeleteProduto = \(id: string\) => {\n    storage\.deleteProduto\(id\);\n    setProdutos\(storage\.getProdutos\(\)\);\n  };/g,
  `const handleDeleteProduto = async (id: string) => { await deleteDocData('produtos', id); };`
);

// 5. Agendamentos
code = code.replace(
  /const handleAddAgendamento = \(a: Omit<Agendamento, 'id'>\) => {\n    storage\.saveAgendamento\(a\);\n    setAgendamentos\(storage\.getAgendamentos\(\)\);\n  };/g,
  `const handleAddAgendamento = async (a: Omit<Agendamento, 'id'>) => { await addDocData('agendamentos', a); };`
);
code = code.replace(
  /const handleUpdateAgendamento = \(a: Agendamento\) => {\n    storage\.updateAgendamento\(a\);\n    setAgendamentos\(storage\.getAgendamentos\(\)\);\n  };/g,
  `const handleUpdateAgendamento = async (a: Agendamento) => { await updateDocData('agendamentos', a.id!, a); };`
);
code = code.replace(
  /const handleDeleteAgendamento = \(id: string\) => {\n    storage\.deleteAgendamento\(id\);\n    setAgendamentos\(storage\.getAgendamentos\(\)\);\n  };/g,
  `const handleDeleteAgendamento = async (id: string) => { await deleteDocData('agendamentos', id); };`
);

// 6. Configuracao
code = code.replace(
  /const handleUpdateConfiguracao = \(c: Configuracao\) => {\n    storage\.saveConfiguracao\(c\);\n    setConfiguracao\(c\);\n  };/g,
  `const handleUpdateConfiguracao = async (c: Configuracao) => { 
    if (!c.salaoId) return;
    await setDocData('configuracoes', c.salaoId, c);
  };`
);

// 7. Venda
code = code.replace(
  /const handleVendaProduto = \(produtoId: string, quantidade: number, formaPagamento: .*?\) => {\n    storage\.venderProduto\(produtoId, quantidade, formaPagamento\);\n    setProdutos\(storage\.getProdutos\(\)\);\n    setMovimentacoes\(storage\.getMovimentacoes\(\)\);\n    setCaixaTransacoes\(storage\.getCaixaTransacoes\(\)\);\n    setCaixaStatus\(storage\.getCaixaStatus\(\)\);\n  };/g,
  `const handleVendaProduto = async (produtoId: string, quantidade: number, formaPagamento: 'PIX' | 'Cartão' | 'Dinheiro') => {
    const produto = produtos.find(p => p.id === produtoId);
    if (!produto || produto.quantidade < quantidade) return;
    
    const mov: Omit<MovimentacaoEstoque, 'id'> = {
      produtoId,
      tipo: 'saida',
      quantidade,
      motivo: 'Venda direta',
      dataHora: new Date().toISOString()
    };
    await addDocData('movimentacoes', mov);
    await updateDocData('produtos', produtoId, { quantidade: produto.quantidade - quantidade });
    
    if (caixaStatus.aberto) {
      const trans: Omit<CaixaTransacao, 'id'> = {
        tipo: 'entrada',
        valor: produto.precoVenda * quantidade,
        descricao: \`Venda de \${quantidade}x \${produto.nome}\`,
        data: new Date().toISOString().substring(0,10),
        hora: new Date().toTimeString().substring(0,5),
        categoria: 'Venda de Produto',
        formaPagamento: formaPagamento
      };
      await addDocData('caixa_transacoes', trans);
      await updateDocData('caixa_status', dbStore.configuracao.salaoId!, {
         saldoAcumulado: (caixaStatus.saldoAcumulado || 0) + trans.valor
      });
    }
  };`
);

// 8. Add Movimentacao
code = code.replace(
  /const handleAddMovimentacao = \(m: Omit<MovimentacaoEstoque, 'id'>\) => {\n    storage\.addMovimentacaoEstoque\(m\);\n    setMovimentacoes\(storage\.getMovimentacoes\(\)\);\n    setProdutos\(storage\.getProdutos\(\)\);\n  };/g,
  `const handleAddMovimentacao = async (m: Omit<MovimentacaoEstoque, 'id'>) => {
    await addDocData('movimentacoes', m);
    const produto = produtos.find(p => p.id === m.produtoId);
    if (produto) {
      const q = m.tipo === 'entrada' ? produto.quantidade + m.quantidade : produto.quantidade - m.quantidade;
      await updateDocData('produtos', produto.id!, { quantidade: q });
    }
  };`
);

// 9. Caixa 
code = code.replace(
  /const handleAbrirCaixa = \(saldoInicial: number\) => {\n    storage\.abrirCaixa\(saldoInicial\);\n    setCaixaStatus\(storage\.getCaixaStatus\(\)\);\n  };/g,
  `const handleAbrirCaixa = async (saldoInicial: number) => {
    await setDocData('caixa_status', dbStore.configuracao.salaoId!, {
      aberto: true,
      saldoAbertura: saldoInicial,
      saldoAcumulado: saldoInicial,
      dataAbertura: new Date().toISOString()
    });
  };`
);

code = code.replace(
  /const handleFecharCaixa = \(\) => {\n    storage\.fecharCaixa\(\);\n    setCaixaStatus\(storage\.getCaixaStatus\(\)\);\n  };/g,
  `const handleFecharCaixa = async () => {
    await updateDocData('caixa_status', dbStore.configuracao.salaoId!, {
      aberto: false,
      dataFechamento: new Date().toISOString()
    });
  };`
);

code = code.replace(
  /const handleAddCaixaTransacao = \(t: Omit<CaixaTransacao, 'id'>\) => {\n    storage\.addCaixaTransacao\(t\);\n    setCaixaTransacoes\(storage\.getCaixaTransacoes\(\)\);\n    setCaixaStatus\(storage\.getCaixaStatus\(\)\);\n  };/g,
  `const handleAddCaixaTransacao = async (t: Omit<CaixaTransacao, 'id'>) => {
    await addDocData('caixa_transacoes', t);
    const value = t.tipo === 'entrada' ? t.valor : -t.valor;
    await updateDocData('caixa_status', dbStore.configuracao.salaoId!, {
      saldoAcumulado: (caixaStatus.saldoAcumulado || 0) + value
    });
  };`
);

// Header logout
code = code.replace(
  "Ambiente Local Estável",
  "Nuvem Sincronizada"
);

// Database reset
code = code.replace(
  /const handleResetDatabase = \(\) => {[\s\S]*?};/g,
  `const handleResetDatabase = async () => {
    if (confirm('Atenção: Deseja sair da conta?')) {
      await signOut(auth);
    }
  };`
);

fs.writeFileSync('src/App.tsx', code);
