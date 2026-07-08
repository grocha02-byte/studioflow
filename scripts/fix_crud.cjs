const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacements = [
  // Clientes
  [/(const handleAddCliente[\s\S]*?storage\.saveClientes\(atualizados\);\n  };)/g, "const handleAddCliente = async (novo: Omit<Cliente, 'id'>) => { await addDocData('clientes', { ...novo, dataCadastro: new Date().toISOString().substring(0, 10) }); };"],
  [/(const handleEditCliente[\s\S]*?storage\.saveClientes\(atualizados\);\n  };)/g, "const handleEditCliente = async (editado: Cliente) => { await updateDocData('clientes', editado.id!, editado); };"],
  [/(const handleDeleteCliente[\s\S]*?storage\.saveClientes\(atualizados\);\n  };)/g, "const handleDeleteCliente = async (id: string) => { await deleteDocData('clientes', id); };"],

  // Profissionais
  [/(const handleAddProfissional[\s\S]*?storage\.saveProfissionais\(atualizados\);\n  };)/g, "const handleAddProfissional = async (novo: Omit<Profissional, 'id'>) => { await addDocData('profissionais', novo); };"],
  [/(const handleEditProfissional[\s\S]*?storage\.saveProfissionais\(atualizados\);\n  };)/g, "const handleEditProfissional = async (editado: Profissional) => { await updateDocData('profissionais', editado.id!, editado); };"],
  [/(const handleDeleteProfissional[\s\S]*?storage\.saveProfissionais\(atualizados\);\n  };)/g, "const handleDeleteProfissional = async (id: string) => { await deleteDocData('profissionais', id); };"],

  // Servicos
  [/(const handleAddServico[\s\S]*?storage\.saveServicos\(atualizados\);\n  };)/g, "const handleAddServico = async (novo: Omit<Servico, 'id'>) => { await addDocData('servicos', novo); };"],
  [/(const handleEditServico[\s\S]*?storage\.saveServicos\(atualizados\);\n  };)/g, "const handleEditServico = async (editado: Servico) => { await updateDocData('servicos', editado.id!, editado); };"],
  [/(const handleDeleteServico[\s\S]*?storage\.saveServicos\(atualizados\);\n  };)/g, "const handleDeleteServico = async (id: string) => { await deleteDocData('servicos', id); };"],

  // Agendamentos
  [/(const handleAddAgendamento[\s\S]*?storage\.saveAgendamentos\(atualizados\);\n  };)/g, "const handleAddAgendamento = async (novo: Omit<Agendamento, 'id'>) => { await addDocData('agendamentos', novo); };"],
  [/(const handleEditAgendamento[\s\S]*?storage\.saveAgendamentos\(atualizados\);\n  };)/g, "const handleEditAgendamento = async (editado: Agendamento) => { await updateDocData('agendamentos', editado.id!, editado); };"],
  [/(const handleDeleteAgendamento[\s\S]*?storage\.saveAgendamentos\(atualizados\);\n  };)/g, "const handleDeleteAgendamento = async (id: string) => { await deleteDocData('agendamentos', id); };"],

  // Produtos
  [/(const handleAddProduto[\s\S]*?storage\.saveProdutos\(atualizados\);\n  };)/g, "const handleAddProduto = async (novo: Omit<Produto, 'id'>) => { await addDocData('produtos', novo); };"],
  [/(const handleEditProduto[\s\S]*?storage\.saveProdutos\(atualizados\);\n  };)/g, "const handleEditProduto = async (editado: Produto) => { await updateDocData('produtos', editado.id!, editado); };"],
  [/(const handleDeleteProduto[\s\S]*?storage\.saveProdutos\(atualizados\);\n  };)/g, "const handleDeleteProduto = async (id: string) => { await deleteDocData('produtos', id); };"],

  // Movimentacoes
  [/(const handleAddMovimentacao[\s\S]*?storage\.saveMovimentacoes\(movAt\);\n  };)/g, `const handleAddMovimentacao = async (nova: Omit<MovimentacaoEstoque, 'id'>) => {
    await addDocData('movimentacoes', nova);
    const prod = produtos.find(p => p.id === nova.produtoId);
    if(prod) {
      await updateDocData('produtos', prod.id!, { quantidade: nova.tipo === 'entrada' ? prod.quantidade + nova.quantidade : prod.quantidade - nova.quantidade });
    }
  };`],

  // Configuracao
  [/(const handleSaveConfiguracao[\s\S]*?storage\.saveConfiguracao\(nova\);\n  };)/g, `const handleSaveConfiguracao = async (nova: Configuracao) => {
    if (!dbStore.configuracao.salaoId) return;
    await setDocData('configuracoes', dbStore.configuracao.salaoId, nova);
  };`],

  // Caixa Transacoes
  [/(const handleEditCaixaTransacao[\s\S]*?storage\.saveCaixaTransacoes\(atualizadas\);\n  };)/g, `const handleEditCaixaTransacao = async (editada: CaixaTransacao) => {
    await updateDocData('caixa_transacoes', editada.id!, editada);
  };`],
  [/(const handleAddCaixaTransacao[\s\S]*?storage\.saveCaixaTransacoes\(atualizadas\);\n  };)/g, `const handleAddCaixaTransacao = async (nova: Omit<CaixaTransacao, 'id'>) => {
    await addDocData('caixa_transacoes', nova);
    const value = nova.tipo === 'entrada' ? nova.valor : -nova.valor;
    if (caixaStatus?.aberto) {
      await updateDocData('caixa_status', dbStore.configuracao.salaoId!, {
        saldoAcumulado: (caixaStatus.saldoAcumulado || 0) + value
      });
    }
  };`],
  [/(const handleCancelarCaixaTransacao[\s\S]*?storage\.saveCaixaTransacoes\(atualizadas\);\n  };)/g, `const handleCancelarCaixaTransacao = async (id: string) => {
    const t = caixaTransacoes.find(x => x.id === id);
    if (t) {
      await updateDocData('caixa_transacoes', id, { cancelada: true });
      if (caixaStatus?.aberto) {
        const reverseValue = t.tipo === 'entrada' ? -t.valor : t.valor;
        await updateDocData('caixa_status', dbStore.configuracao.salaoId!, {
          saldoAcumulado: (caixaStatus.saldoAcumulado || 0) + reverseValue
        });
      }
    }
  };`],
  [/(const handleAbrirCaixa[\s\S]*?storage\.saveCaixaStatus\(novoStatus\);\n  };)/g, `const handleAbrirCaixa = async (saldoInicial: number) => {
    await setDocData('caixa_status', dbStore.configuracao.salaoId!, {
      aberto: true,
      saldoAbertura: saldoInicial,
      saldoAcumulado: saldoInicial,
      dataAbertura: new Date().toISOString()
    });
  };`],
  [/(const handleFecharCaixa[\s\S]*?storage\.saveCaixaStatus\(novoStatus\);\n  };)/g, `const handleFecharCaixa = async () => {
    await updateDocData('caixa_status', dbStore.configuracao.salaoId!, {
      aberto: false,
      dataFechamento: new Date().toISOString()
    });
  };`],

  // Complex functions
  [/(const handleConcluirAgendamento = \(agendamentoId: string, formaPagamento: string\) => {[\s\S]*?storage\.saveCaixaStatus\(cStatus\);\n      }\n    }\n  };)/g, `const handleConcluirAgendamento = async (agendamentoId: string, formaPagamento: string) => {
    const agendamento = agendamentos.find(a => a.id === agendamentoId);
    if (!agendamento) return;
    await updateDocData('agendamentos', agendamentoId, { status: 'concluido' });
    const servico = servicos.find(s => s.id === agendamento.servicoId);
    const valor = servico?.valor || 0;
    
    if (caixaStatus?.aberto) {
      const nova: Omit<CaixaTransacao, 'id'> = {
        data: new Date().toISOString().substring(0, 10),
        hora: new Date().toTimeString().substring(0, 5),
        tipo: 'entrada',
        valor,
        descricao: \`Serviço: \${servico?.nome || 'Diversos'} - Cliente: \${clientes.find(c => c.id === agendamento.clienteId)?.nome || 'Avulso'}\`,
        categoria: 'Serviço',
        formaPagamento: formaPagamento as any,
        agendamentoId
      };
      await addDocData('caixa_transacoes', nova);
      await updateDocData('caixa_status', dbStore.configuracao.salaoId!, {
        saldoAcumulado: (caixaStatus.saldoAcumulado || 0) + valor
      });
    }
  };`],

  [/(const handleVendaProduto = \(produtoId: string, quantidade: number, formaPagamento: 'PIX' \| 'Cartão' \| 'Dinheiro'\) => {[\s\S]*?storage\.saveCaixaStatus\(cStatus\);\n    }\n  };)/g, `const handleVendaProduto = async (produtoId: string, quantidade: number, formaPagamento: 'PIX' | 'Cartão' | 'Dinheiro') => {
    const produto = produtos.find(p => p.id === produtoId);
    if (!produto || produto.quantidade < quantidade) return;
    
    await updateDocData('produtos', produtoId, { quantidade: produto.quantidade - quantidade });
    
    const mov: Omit<MovimentacaoEstoque, 'id'> = {
      produtoId,
      tipo: 'saida',
      quantidade,
      dataHora: new Date().toISOString(),
      motivo: 'Venda avulsa PDV'
    };
    await addDocData('movimentacoes', mov);
    
    if (caixaStatus?.aberto) {
      const total = produto.precoVenda * quantidade;
      const trans: Omit<CaixaTransacao, 'id'> = {
        data: new Date().toISOString().substring(0, 10),
        hora: new Date().toTimeString().substring(0, 5),
        tipo: 'entrada',
        valor: total,
        descricao: \`Venda: \${quantidade}x \${produto.nome}\`,
        categoria: 'Venda de Produto',
        formaPagamento: formaPagamento
      };
      await addDocData('caixa_transacoes', trans);
      await updateDocData('caixa_status', dbStore.configuracao.salaoId!, {
        saldoAcumulado: (caixaStatus.saldoAcumulado || 0) + total
      });
    }
  };`]
];

replacements.forEach(([regex, replacement]) => {
  code = code.replace(regex, replacement);
});

fs.writeFileSync('src/App.tsx', code);
