import fs from "fs";
let content = fs.readFileSync("src/hooks/useDatabase.ts", "utf8");

content = content.replace("CaixaTransacao, CaixaStatus, Notificacao", "CaixaTransacao, CaixaStatus, Notificacao, ContaReceber");

content = content.replace("const [caixaStatus, setCaixaStatus] = useState<CaixaStatus>({ aberto: false, saldoAbertura: 0 });", 
  "const [caixaStatus, setCaixaStatus] = useState<CaixaStatus>({ aberto: false, saldoAbertura: 0 });\n  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([]);");

content = content.replace("const unsubCaixaTransacoes = onSnapshot(qCaixaTransacoes, (snap) => setCaixaTransacoes(snap.docs.map(d => ({ id: d.id, ...d.data() } as CaixaTransacao))), (err) => console.error(\"Error in caixa_transacoes:\", err));",
  `const unsubCaixaTransacoes = onSnapshot(qCaixaTransacoes, (snap) => setCaixaTransacoes(snap.docs.map(d => ({ id: d.id, ...d.data() } as CaixaTransacao))), (err) => console.error("Error in caixa_transacoes:", err));
    const qContasReceber = query(collection(db, 'contas_receber'), where('salaoId', '==', salaoId));
    const unsubContasReceber = onSnapshot(qContasReceber, (snap) => setContasReceber(snap.docs.map(d => ({ id: d.id, ...d.data() } as ContaReceber))), (err) => console.error("Error in contas_receber:", err));`);

content = content.replace("unsubCaixaTransacoes();", "unsubCaixaTransacoes();\n      unsubContasReceber();");

content = content.replace("caixaTransacoes, caixaStatus, configuracao, notificacoes,", "caixaTransacoes, caixaStatus, configuracao, notificacoes, contasReceber,");

fs.writeFileSync("src/hooks/useDatabase.ts", content);
