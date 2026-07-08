import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Cliente, Profissional, Servico, Agendamento, Produto, 
  MovimentacaoEstoque, Configuracao, CaixaTransacao, CaixaStatus, Notificacao, ContaReceber
} from '../types';

export function useDatabase() {
  const { user, usuarioData } = useAuth();
  const salaoId = usuarioData?.salaoId;
  const empresaId = usuarioData?.empresaId || usuarioData?.salaoId;

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);
  const [caixaTransacoes, setCaixaTransacoes] = useState<CaixaTransacao[]>([]);
  const [caixaStatus, setCaixaStatus] = useState<CaixaStatus>({ aberto: false, saldoAbertura: 0 });
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([]);
  const [configuracao, setConfiguracao] = useState<Configuracao>({
    nomeSalao: "Carregando...",
    telefone: "",
    endereco: ""
  });
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);

  useEffect(() => {
    if (!salaoId) return;

    const qClientes = query(collection(db, 'clientes'), where('salaoId', '==', salaoId));
    const unsubClientes = onSnapshot(qClientes, (snap) => setClientes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Cliente))), (err) => console.error("Error in clientes:", err));

    const qProfissionais = query(collection(db, 'profissionais'), where('salaoId', '==', salaoId));
    const unsubProfissionais = onSnapshot(qProfissionais, (snap) => setProfissionais(snap.docs.map(d => ({ id: d.id, ...d.data() } as Profissional))), (err) => console.error("Error in profissionais:", err));

    const qServicos = query(collection(db, 'servicos'), where('salaoId', '==', salaoId));
    const unsubServicos = onSnapshot(qServicos, (snap) => setServicos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Servico))), (err) => console.error("Error in servicos:", err));

    const qAgendamentos = query(collection(db, 'agendamentos'), where('salaoId', '==', salaoId));
    const unsubAgendamentos = onSnapshot(qAgendamentos, (snap) => setAgendamentos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Agendamento))), (err) => console.error("Error in agendamentos:", err));

    const qProdutos = query(collection(db, 'produtos'), where('salaoId', '==', salaoId));
    const unsubProdutos = onSnapshot(qProdutos, (snap) => setProdutos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Produto))), (err) => console.error("Error in produtos:", err));

    const qMovimentacoes = query(collection(db, 'movimentacoes'), where('salaoId', '==', salaoId));
    const unsubMovimentacoes = onSnapshot(qMovimentacoes, (snap) => setMovimentacoes(snap.docs.map(d => ({ id: d.id, ...d.data() } as MovimentacaoEstoque))), (err) => console.error("Error in movimentacoes:", err));

    const qCaixaTransacoes = query(collection(db, 'caixa_transacoes'), where('salaoId', '==', salaoId));
    const unsubCaixaTransacoes = onSnapshot(qCaixaTransacoes, (snap) => setCaixaTransacoes(snap.docs.map(d => ({ id: d.id, ...d.data() } as CaixaTransacao))), (err) => console.error("Error in caixa_transacoes:", err));
    const qContasReceber = query(collection(db, 'contas_receber'), where('salaoId', '==', salaoId));
    const unsubContasReceber = onSnapshot(qContasReceber, (snap) => setContasReceber(snap.docs.map(d => ({ id: d.id, ...d.data() } as ContaReceber))), (err) => console.error("Error in contas_receber:", err));

    const unsubConfig = onSnapshot(doc(db, 'configuracoes', salaoId), (docSnap) => {
      if (docSnap.exists()) {
        setConfiguracao({ id: docSnap.id, ...docSnap.data() } as Configuracao);
      } else {
        setConfiguracao({
          nomeSalao: "Meu Salão",
          theme: 'light',
          primaryColor: '#D8B780',
          secondaryColor: '#1F2937',
          accentColor: '#FBBF24',
          endereco: '',
          telefone: ''
        });
      }
    }, (err) => console.error("Error in configuracoes:", err));

    const unsubCaixaStatus = onSnapshot(doc(db, 'caixa_status', salaoId), (docSnap) => {
      if (docSnap.exists()) {
        setCaixaStatus({ id: docSnap.id, ...docSnap.data() } as CaixaStatus);
      } else {
        setCaixaStatus({ aberto: false, saldoAbertura: 0 });
      }
    }, (err) => console.error("Error in caixa_status:", err));

    const qNotificacoes = query(collection(db, 'notificacoes'), where('salaoId', '==', salaoId));
    const unsubNotificacoes = onSnapshot(qNotificacoes, (snap) => setNotificacoes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notificacao))), (err) => console.error("Error in notificacoes:", err));

    return () => {
      unsubClientes();
      unsubProfissionais();
      unsubServicos();
      unsubAgendamentos();
      unsubProdutos();
      unsubMovimentacoes();
      unsubCaixaTransacoes();
      unsubContasReceber();
      unsubConfig();
      unsubCaixaStatus();
      unsubNotificacoes();
    };
  }, [salaoId]);

  // Funções de CRUD genéricas
  const addDocData = async (col: string, data: any) => {
    if (!salaoId) return;
    const ref = collection(db, col);
    const newDoc = await addDoc(ref, { ...data, salaoId, empresaId });
    // Update data object with generated ID if necessary
    await updateDoc(newDoc, { id: newDoc.id });
  };

  const setDocData = async (col: string, id: string, data: any) => {
    if (!salaoId) return;
    await setDoc(doc(db, col, id), { ...data, salaoId, empresaId, id });
  };

  const updateDocData = async (col: string, id: string, data: any) => {
    if (!salaoId) return;
    await setDoc(doc(db, col, id), data, { merge: true });
  };

  const deleteDocData = async (col: string, id: string) => {
    if (!salaoId) return;
    await deleteDoc(doc(db, col, id));
  };

  return {
    clientes, profissionais, servicos, agendamentos, produtos, movimentacoes,
    caixaTransacoes, caixaStatus, configuracao, notificacoes, contasReceber,
    addDocData, setDocData, updateDocData, deleteDocData
  };
}
