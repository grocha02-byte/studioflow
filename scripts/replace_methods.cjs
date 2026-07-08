const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

function replaceBlock(code, functionName, newBody) {
  const regex = new RegExp(`const ${functionName} = \\([\\s\\S]*?\\) => \\{[\\s\\S]*?\\n  \\};`, 'g');
  return code.replace(regex, `const ${functionName} = ${newBody}`);
}

code = replaceBlock(code, 'handleAddMovimentacao', `async (nova: Omit<MovimentacaoEstoque, 'id'>) => {
    await addDocData('movimentacoes', nova);
    const prod = produtos.find(p => p.id === nova.produtoId);
    if(prod) {
      await updateDocData('produtos', prod.id!, { quantidade: nova.tipo === 'entrada' ? prod.quantidade + nova.quantidade : prod.quantidade - nova.quantidade });
    }
  };`);

code = replaceBlock(code, 'handleSaveConfiguracao', `async (nova: Configuracao) => {
    if (!dbStore.configuracao.salaoId) return;
    await setDocData('configuracoes', dbStore.configuracao.salaoId, nova);
  };`);

code = replaceBlock(code, 'handleEditCaixaTransacao', `async (editada: CaixaTransacao) => {
    await updateDocData('caixa_transacoes', editada.id!, editada);
  };`);

code = replaceBlock(code, 'handleAddCaixaTransacao', `async (nova: Omit<CaixaTransacao, 'id'>) => {
    await addDocData('caixa_transacoes', nova);
    const value = nova.tipo === 'entrada' ? nova.valor : -nova.valor;
    if (caixaStatus?.aberto) {
      await updateDocData('caixa_status', dbStore.configuracao.salaoId!, {
        saldoAcumulado: (caixaStatus.saldoAcumulado || 0) + value
      });
    }
  };`);

code = replaceBlock(code, 'handleCancelarCaixaTransacao', `async (id: string) => {
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
  };`);

code = replaceBlock(code, 'handleConcluirAgendamento', `async (agendamentoId: string, formaPagamento: string) => {
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
  };`);

code = replaceBlock(code, 'handleVendaProduto', `async (produtoId: string, quantidade: number, formaPagamento: 'PIX' | 'Cartão' | 'Dinheiro', valorCustomizado?: number) => {
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
      const total = valorCustomizado !== undefined ? valorCustomizado : produto.precoVenda * quantidade;
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
  };`);

fs.writeFileSync('src/App.tsx', code);
