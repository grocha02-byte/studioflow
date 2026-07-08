import React, { useEffect } from 'react';
import { Bell, Check, Clock, AlertTriangle, Info } from 'lucide-react';
import { Notificacao, Agendamento, Cliente, Profissional } from '../types';
import { useDatabase } from '../hooks/useDatabase';

export default function NotificationCenter() {
  const { notificacoes, agendamentos, clientes, profissionais, updateDocData, addDocData, configuracao } = useDatabase();

  // Background checker for notifications
  useEffect(() => {
    if (!configuracao.salaoId) return;
    
    const checkInterval = setInterval(() => {
      const now = new Date();
      
      agendamentos.forEach(async (a) => {
        if (a.status !== 'agendado') return;
        
        const dataHoraSplit = a.data.split('-');
        const horaSplit = a.hora.split(':');
        
        const agendamentoDate = new Date(
          parseInt(dataHoraSplit[0]),
          parseInt(dataHoraSplit[1]) - 1,
          parseInt(dataHoraSplit[2]),
          parseInt(horaSplit[0]),
          parseInt(horaSplit[1])
        );

        const diffMs = agendamentoDate.getTime() - now.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        
        const cliente = clientes.find(c => c.id === a.clienteId);
        const prof = profissionais.find(p => p.id === a.profissionalId);
        
        // Helper
        const criarNotificacao = async (msg: string, tipo: Notificacao['tipo']) => {
          // Check if similar exists
          const exists = notificacoes.find(n => n.agendamentoId === a.id && n.mensagem === msg);
          if (!exists) {
            await addDocData('notificacoes', {
              tipo,
              mensagem: msg,
              dataHora: new Date().toISOString(),
              lida: false,
              agendamentoId: a.id,
              destinatarioId: null // Global
            });
            
            // Push Notification to Browser if permitted
            if (Notification.permission === 'granted') {
              new Notification('StudioFlow Notificação', { body: msg });
            }
          }
        };

        // 20 minutes before
        if (diffMins <= 20 && diffMins > 18) {
          criarNotificacao(`Lembrete: Faltam 20 min para o agendamento de ${cliente?.nome || 'Cliente'} com ${prof?.nome || 'Profissional'}.`, 'lembrete');
        }
        
        // Exact time
        if (diffMins <= 0 && diffMins > -2) {
          criarNotificacao(`Atenção: O agendamento de ${cliente?.nome || 'Cliente'} é agora!`, 'agendamento');
        }
        
        // 10 mins late
        if (diffMins <= -10 && diffMins > -12) {
          criarNotificacao(`Atraso: O cliente ${cliente?.nome || 'Cliente'} está atrasado 10 minutos.`, 'atraso');
        }
      });
    }, 60000); // Check every minute

    return () => clearInterval(checkInterval);
  }, [agendamentos, notificacoes, clientes, profissionais, configuracao.salaoId, addDocData]);

  // Request browser permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const pending = notificacoes.filter(n => !n.lida).sort((a,b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
  const maxDisplay = 5;

  const markAsRead = async (id: string) => {
    await updateDocData('notificacoes', id, { lida: true });
  };

  if (pending.length === 0) {
    return (
      <div className="relative group">
        <button className="p-2 rounded-full hover:bg-gold-50/50 transition-colors relative">
          <Bell className="w-5 h-5 text-gray-500" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative group">
      <button className="p-2 rounded-full hover:bg-gold-50/50 transition-colors relative">
        <Bell className="w-5 h-5 text-gray-700" />
        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white animate-pulse" />
      </button>

      <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gold-100 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <div className="p-4 border-b border-gold-50 bg-gold-50/20 flex justify-between items-center">
          <h4 className="font-serif font-bold text-gray-800 text-sm">Notificações</h4>
          <span className="text-xs font-semibold text-gold-600 bg-gold-100 px-2 py-0.5 rounded-full">{pending.length} novas</span>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {pending.slice(0, maxDisplay).map(n => (
            <div key={n.id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-3">
              <div className="mt-0.5">
                {n.tipo === 'lembrete' && <Clock className="w-4 h-4 text-blue-500" />}
                {n.tipo === 'agendamento' && <Info className="w-4 h-4 text-green-500" />}
                {n.tipo === 'atraso' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                {n.tipo === 'sistema' && <Bell className="w-4 h-4 text-gold-500" />}
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-700 leading-tight">{n.mensagem}</p>
                <p className="text-[9px] text-gray-400 mt-1">{new Date(n.dataHora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              </div>
              <button onClick={() => markAsRead(n.id!)} className="text-gray-400 hover:text-green-500 transition-colors">
                <Check className="w-4 h-4" />
              </button>
            </div>
          ))}
          {pending.length > maxDisplay && (
            <div className="p-3 text-center bg-gray-50">
              <span className="text-xs text-gray-500 font-medium">+ {pending.length - maxDisplay} outras notificações</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
