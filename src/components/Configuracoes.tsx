/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Building2, 
  Phone, 
  MapPin, 
  Save, 
  Download, 
  Upload, 
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Configuracao } from '../types';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

interface ConfiguracoesProps {
  configuracao: Configuracao;
  onSaveConfiguracao: (c: Configuracao) => void;
  onResetData?: () => void;
}

const DEFAULT_HORARIOS = [
  { dia: 'Segunda-feira', aberto: true, abertura: '09:00', fechamento: '18:00', intervaloInicio: '12:00', intervaloFim: '13:00' },
  { dia: 'Terça-feira', aberto: true, abertura: '09:00', fechamento: '18:00', intervaloInicio: '12:00', intervaloFim: '13:00' },
  { dia: 'Quarta-feira', aberto: true, abertura: '09:00', fechamento: '18:00', intervaloInicio: '12:00', intervaloFim: '13:00' },
  { dia: 'Quinta-feira', aberto: true, abertura: '09:00', fechamento: '18:00', intervaloInicio: '12:00', intervaloFim: '13:00' },
  { dia: 'Sexta-feira', aberto: true, abertura: '09:00', fechamento: '18:00', intervaloInicio: '12:00', intervaloFim: '13:00' },
  { dia: 'Sábado', aberto: true, abertura: '09:00', fechamento: '14:00', intervaloInicio: '', intervaloFim: '' },
  { dia: 'Domingo', aberto: false, abertura: '09:00', fechamento: '13:00', intervaloInicio: '', intervaloFim: '' },
];

export default function Configuracoes({
  configuracao,
  onSaveConfiguracao,
  onResetData
}: ConfiguracoesProps) {
  const [formState, setFormState] = useState<Configuracao>({
    ...configuracao,
    horarioFuncionamento: Array.isArray(configuracao.horarioFuncionamento) 
      ? configuracao.horarioFuncionamento 
      : DEFAULT_HORARIOS
  });
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackError, setFeedbackError] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleHorarioChange = (index: number, field: string, value: any) => {
    setFormState(prev => {
      const newHorarios = [...(prev.horarioFuncionamento as any[])];
      newHorarios[index] = { ...newHorarios[index], [field]: value };
      return { ...prev, horarioFuncionamento: newHorarios };
    });
  };

  const copyHorarioToAll = (sourceIndex: number) => {
    setFormState(prev => {
      const source = (prev.horarioFuncionamento as any[])[sourceIndex];
      const newHorarios = (prev.horarioFuncionamento as any[]).map(h => ({
        ...h,
        aberto: source.aberto,
        abertura: source.abertura,
        fechamento: source.fechamento,
        intervaloInicio: source.intervaloInicio,
        intervaloFim: source.intervaloFim
      }));
      return { ...prev, horarioFuncionamento: newHorarios };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.nomeSalao.trim()) {
      setFeedbackError('O nome do salão é obrigatório.');
      return;
    }

    onSaveConfiguracao(formState);

    setFeedbackError('');
    setFeedbackMsg('Configurações salvas com sucesso!');
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  // Exportar backup completo em JSON
  const handleExportBackup = () => {
    try {
      const keys = [
        'salao_clientes',
        'salao_profissionais',
        'salao_servicos',
        'salao_produtos',
        'salao_agendamentos',
        'salao_movimentacoes',
        'salao_configuracao'
      ];
      const backup: Record<string, string | null> = {};
      keys.forEach(k => {
        backup[k] = localStorage.getItem(k);
      });

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_studioflow_${new Date().toISOString().substring(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Erro ao gerar arquivo de backup.');
    }
  };

  // Importar backup completo em JSON
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (window.confirm('ATENÇÃO: Importar um arquivo de backup substituirá COMPLETAMENTE todos os dados atuais do sistema. Deseja prosseguir?')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const backup = JSON.parse(event.target?.result as string) as Record<string, string>;
          Object.entries(backup).forEach(([key, value]) => {
            if (value !== null) {
              localStorage.setItem(key, value);
            }
          });
          setFeedbackError('');
          setFeedbackMsg('Backup restaurado com sucesso! Atualizando sistema...');
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } catch (err) {
          setFeedbackError('Formato de arquivo inválido para backup.');
        }
      };
      reader.readAsText(file);
    }
  };

  // Resetar banco de dados completo (dados sementes)
  const handleResetClick = () => {
    if (window.confirm('AVISO CRÍTICO: Tem certeza que deseja redefinir o sistema para as configurações originais de fábrica? Isso apagará todas as suas modificações atuais.')) {
      if (onResetData) {
        onResetData();
        setFeedbackError('');
        setFeedbackMsg('Sistema reiniciado com dados sementes com sucesso!');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
      
      {/* Cabeçalho */}
      <div>
        <h2 className="text-2xl font-serif font-semibold text-gray-800">Configurações</h2>
        <p className="text-sm text-gray-500">Personalize o cabeçalho das impressões, salve cópias de segurança e controle os arquivos locais.</p>
      </div>

      {/* Formulário de Configuração Geral */}
      <div className="bg-white rounded-2xl border border-gold-100 shadow-xs overflow-hidden">
        
        <div className="p-5 border-b border-gold-50 bg-gold-50/10 flex items-center gap-2 text-gold-700 font-serif font-semibold">
          <Sparkles className="w-5 h-5 text-gold-500" />
          <span>Informações do Estabelecimento</span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {feedbackMsg && (
            <div className="p-3.5 bg-green-50 border border-green-200 text-green-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-medium">{feedbackMsg}</span>
            </div>
          )}

          {feedbackError && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium">{feedbackError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome do Salão */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome Comercial do Salão *</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="nomeSalao"
                  required
                  placeholder="Ex: Simone Hair Studio"
                  value={formState.nomeSalao}
                  onChange={handleChange}
                  className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2.5 pl-9 pr-4 text-sm text-gray-800 focus:outline-none focus:border-gold-300"
                />
              </div>
            </div>
            {/* Segmento */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Segmento de Atuação</label>
              <div className="relative">
                <select
                  name="segmento"
                  value={formState.segmento || 'Salão de Beleza'}
                  onChange={handleChange}
                  className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2.5 px-4 text-sm text-gray-800 focus:outline-none focus:border-gold-300 appearance-none"
                >
                  <option value="Salão de Beleza">Salão de Beleza</option>
                  <option value="Barbearia">Barbearia</option>
                  <option value="Clínica de Estética">Clínica de Estética</option>
                  <option value="Nail Designer">Nail Designer</option>
                  <option value="Spa">Spa</option>
                  <option value="Podologia">Podologia</option>
                  <option value="Depilação">Depilação</option>
                  <option value="Harmonização Facial">Harmonização Facial</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Razão Social</label>
              <input
                type="text"
                name="razaoSocial"
                value={formState.razaoSocial || ''}
                onChange={handleChange}
                className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2.5 px-4 text-sm text-gray-800 focus:outline-none focus:border-gold-300"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">CNPJ</label>
              <input
                type="text"
                name="cnpj"
                value={formState.cnpj || ''}
                onChange={handleChange}
                className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2.5 px-4 text-sm text-gray-800 focus:outline-none focus:border-gold-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Telefone */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Telefone Principal *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="telefone"
                  required
                  placeholder="Ex: (11) 3456-7890"
                  value={formState.telefone}
                  onChange={handleChange}
                  className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2.5 pl-9 pr-4 text-sm text-gray-800 focus:outline-none focus:border-gold-300"
                />
              </div>
            </div>
            {/* WhatsApp */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">WhatsApp</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="whatsapp"
                  value={formState.whatsapp || ''}
                  onChange={handleChange}
                  className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2.5 pl-9 pr-4 text-sm text-gray-800 focus:outline-none focus:border-gold-300"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Instagram</label>
              <input
                type="text"
                name="instagram"
                value={formState.instagram || ''}
                onChange={handleChange}
                className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2.5 px-4 text-sm text-gray-800 focus:outline-none focus:border-gold-300"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Facebook</label>
              <input
                type="text"
                name="facebook"
                value={formState.facebook || ''}
                onChange={handleChange}
                className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2.5 px-4 text-sm text-gray-800 focus:outline-none focus:border-gold-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">E-mail</label>
              <input
                type="email"
                name="email"
                value={formState.email || ''}
                onChange={handleChange}
                className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2.5 px-4 text-sm text-gray-800 focus:outline-none focus:border-gold-300"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Site</label>
              <input
                type="text"
                name="site"
                value={formState.site || ''}
                onChange={handleChange}
                className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2.5 px-4 text-sm text-gray-800 focus:outline-none focus:border-gold-300"
              />
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block border-b border-gray-200 pb-2">
              Horários de Funcionamento
            </label>
            <div className="space-y-3">
              {(formState.horarioFuncionamento as any[] || []).map((h, i) => (
                <div key={h.dia} className="flex flex-col md:flex-row md:items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between md:w-36">
                    <span className="text-sm font-medium text-gray-700">{h.dia}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={h.aberto} onChange={e => handleHorarioChange(i, 'aberto', e.target.checked)} />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gold-500"></div>
                    </label>
                  </div>
                  
                  {h.aberto ? (
                    <div className="flex flex-wrap items-center gap-2 flex-1">
                      <input type="time" value={h.abertura} onChange={e => handleHorarioChange(i, 'abertura', e.target.value)} className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm focus:border-gold-300 focus:outline-none" />
                      <span className="text-gray-400 text-sm">até</span>
                      <input type="time" value={h.fechamento} onChange={e => handleHorarioChange(i, 'fechamento', e.target.value)} className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm focus:border-gold-300 focus:outline-none" />
                      
                      <div className="w-px h-6 bg-gray-300 mx-2 hidden md:block"></div>
                      
                      <div className="flex items-center gap-2">
                         <span className="text-xs text-gray-500">Pausa:</span>
                         <input type="time" value={h.intervaloInicio || ''} onChange={e => handleHorarioChange(i, 'intervaloInicio', e.target.value)} className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm focus:border-gold-300 focus:outline-none w-24" />
                         <span className="text-gray-400 text-sm">-</span>
                         <input type="time" value={h.intervaloFim || ''} onChange={e => handleHorarioChange(i, 'intervaloFim', e.target.value)} className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm focus:border-gold-300 focus:outline-none w-24" />
                      </div>
                      
                      {i === 0 && (
                        <button type="button" onClick={() => copyHorarioToAll(i)} className="ml-auto text-xs text-gold-600 hover:text-gold-700 font-medium">
                          Copiar para todos
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center">
                      <span className="text-sm text-gray-400 italic">Fechado</span>
                      {i === 0 && (
                        <button type="button" onClick={() => copyHorarioToAll(i)} className="ml-auto text-xs text-gold-600 hover:text-gold-700 font-medium">
                          Copiar para todos
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Logo do Salão</label>
            <div className="flex items-center gap-4">
              {formState.logoUrl ? (
                <div className="relative group">
                  <img src={formState.logoUrl} alt="Logo preview" className="w-24 h-24 object-contain bg-white rounded-xl border border-gray-200" />
                  <button 
                    type="button"
                    onClick={() => setFormState(prev => ({ ...prev, logoUrl: '' }))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remover Logo"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 text-gray-400">
                  <span className="text-xs">Sem Logo</span>
                </div>
              )}
              <div className="flex-1 space-y-2">
                <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gold-200 text-gold-700 text-sm font-medium rounded-xl hover:bg-gold-50 transition-colors">
                  <Upload className="w-4 h-4" />
                  {uploadingLogo ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : 'Selecionar Imagem (PNG, JPG, WEBP)'}
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadingLogo(true);
                        
                        // Fallback imediato para preview e salvar local
                        const reader = new FileReader();
                        reader.onloadend = async () => {
                          const base64 = reader.result as string;
                          setFormState(prev => ({ ...prev, logoUrl: base64 }));
                          
                          // Tenta enviar pro storage se configurado, mas com timeout
                          if (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) {
                            try {
                              const storageRef = ref(storage, `logos/${configuracao.salaoId}_${Date.now()}_${file.name}`);
                              
                              // Promise with timeout
                              const uploadTask = uploadBytes(storageRef, file);
                              const timeoutTask = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000));
                              
                              await Promise.race([uploadTask, timeoutTask]);
                              const url = await getDownloadURL(storageRef);
                              
                              // Substitui Base64 pela URL oficial
                              setFormState(prev => ({ ...prev, logoUrl: url }));
                            } catch (err) {
                              console.warn("Falha no upload para o Storage, usando Base64. Error:", err);
                            }
                          }
                          setUploadingLogo(false);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
                <p className="text-xs text-gray-500">
                  Para melhor exibição, utilize uma imagem com fundo transparente ou escuro dependendo do seu tema. O arquivo será salvo na nuvem.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 pb-2">
             <h3 className="text-sm font-bold text-gray-800 font-serif border-b border-gold-50 pb-2">Identidade Visual (Temas)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cor Principal</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  name="primaryColor"
                  value={formState.primaryColor || '#D8B780'}
                  onChange={handleChange}
                  className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                />
                <input
                  type="text"
                  name="primaryColor"
                  value={formState.primaryColor || ''}
                  onChange={handleChange}
                  placeholder="#Hex"
                  className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-none focus:border-gold-300 uppercase"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cor Secundária</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  name="secondaryColor"
                  value={formState.secondaryColor || '#1F2937'}
                  onChange={handleChange}
                  className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                />
                <input
                  type="text"
                  name="secondaryColor"
                  value={formState.secondaryColor || ''}
                  onChange={handleChange}
                  placeholder="#Hex"
                  className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-none focus:border-gold-300 uppercase"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cor Destaque</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  name="accentColor"
                  value={formState.accentColor || '#FBBF24'}
                  onChange={handleChange}
                  className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                />
                <input
                  type="text"
                  name="accentColor"
                  value={formState.accentColor || ''}
                  onChange={handleChange}
                  placeholder="#Hex"
                  className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-none focus:border-gold-300 uppercase"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tema</label>
              <div className="relative">
                <select
                  name="theme"
                  value={formState.theme || 'light'}
                  onChange={handleChange}
                  className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2 px-4 text-sm text-gray-800 focus:outline-none focus:border-gold-300 appearance-none h-10"
                >
                  <option value="light">Claro (Padrão)</option>
                  <option value="dark">Escuro</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 pb-2">
             <h3 className="text-sm font-bold text-gray-800 font-serif border-b border-gold-50 pb-2">Localização</h3>
          </div>

          {/* Endereço */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Endereço Comercial *</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <textarea
                name="endereco"
                rows={3}
                required
                placeholder="Rua, número, complemento, bairro, cidade e estado"
                value={formState.endereco}
                onChange={handleChange}
                className="w-full bg-gold-50/10 border border-gold-100 rounded-xl py-2 pl-9 pr-4 text-sm text-gray-800 focus:outline-none focus:border-gold-300 resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-gold-50">
            <button
              type="submit"
              className="px-5 py-2.5 bg-gold-500 hover:bg-gold-600 text-white font-semibold text-sm rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Configurações</span>
            </button>
          </div>

        </form>

      </div>

      {/* Backup e Administração do Sistema */}
      <div className="bg-white rounded-2xl border border-gold-100 shadow-xs overflow-hidden">
        
        <div className="p-5 border-b border-gold-50 bg-gold-50/10 text-gray-700 font-serif font-semibold">
          Administração & Cópias de Segurança
        </div>

        <div className="p-6 space-y-6">
          {/* Reset Master */}
          {onResetData && (
            <div className="pt-4 border-t border-gold-50 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h5 className="text-xs font-semibold text-red-700 uppercase tracking-wider">Redefinir Banco de Dados</h5>
                <p className="text-[11px] text-gray-400">Restaura todas as tabelas aos dados originais de simulação.</p>
              </div>
              <button
                type="button"
                onClick={handleResetClick}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5 inline mr-1" />
                Limpar & Restaurar Padrões
              </button>
            </div>
          )}

        </div>

      </div>

      
      {/* Minha Conta / Sair */}
      <div className="bg-white rounded-2xl border border-red-100 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-red-50 bg-red-50/30 text-red-700 font-serif font-semibold">
          Minha Conta
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h5 className="text-sm font-semibold text-gray-900">Encerrar Sessão</h5>
              <p className="text-xs text-gray-500 mt-1">Deseja sair da sua conta? Você precisará fazer login novamente para acessar o painel.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                import('../lib/firebase').then(({ auth }) => {
                  import('firebase/auth').then(({ signOut }) => signOut(auth));
                });
              }}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm shrink-0 flex items-center justify-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              Sair do Sistema
            </button>
          </div>
        </div>
      </div>

      {/* Sobre o Sistema */}
      <div className="bg-white rounded-2xl border border-gold-100 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gold-50 bg-gold-50/10 text-gray-700 font-serif font-semibold">
          Sobre o Sistema
        </div>
        <div className="p-6 flex flex-col items-center justify-center space-y-4 text-center">
          {formState.logoUrl ? (
            <img src={formState.logoUrl} alt="Logo" className="w-20 h-20 object-contain mb-2" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-gold-400 to-gold-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-8 h-8" />
            </div>
          )}
          <div>
            <h3 className="font-serif font-bold text-xl text-gray-900">{formState.nomeSalao}</h3>
            <p className="text-sm text-gray-500 uppercase tracking-widest mt-1">Powered by StudioFlow®</p>
          </div>
          <div className="bg-gold-50/20 px-4 py-2 rounded-lg border border-gold-100">
            <p className="text-xs text-gray-600 font-mono">Versão 1.0 (Build 2026.07) - Offline Edition</p>
            <p className="text-[10px] text-gray-400 mt-1">Todos os direitos reservados.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
