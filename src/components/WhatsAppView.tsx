import React, { useEffect, useState } from 'react';
import { WhatsAppConnection, WhatsAppProviderType } from '../../packages/types';
import { apiFetch } from '../lib/supabase';
import { 
  MessageSquare, 
  QrCode, 
  CheckCircle2, 
  RefreshCw, 
  Smartphone, 
  Zap,
  Globe,
  Key,
  HelpCircle,
  Save,
  ExternalLink
} from 'lucide-react';

export const WhatsAppView: React.FC = () => {
  const [connection, setConnection] = useState<WhatsAppConnection | null>(null);
  const [provider, setProvider] = useState<WhatsAppProviderType>('BAILEYS');
  const [loading, setLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);

  const [metaForm, setMetaForm] = useState({
    phone_number_id: '',
    business_account_id: '',
    access_token: '',
    verify_token: 'foods_wa_verify_token_secure',
  });

  useEffect(() => {
    loadConnection();
    // Long polling a cada 4s enquanto estiver na tela conectando para receber QR Codes atualizados do WhatsApp Web
    const interval = setInterval(() => {
      if (provider === 'BAILEYS') {
        loadConnectionSilent();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [provider]);

  const loadConnection = async () => {
    setLoading(true);
    try {
      const conn = await apiFetch<WhatsAppConnection>('/whatsapp/connection');
      setConnection(conn);
      setProvider(conn.provider || 'BAILEYS');
      if (conn.meta_config) {
        setMetaForm({
          phone_number_id: conn.meta_config.phone_number_id || '',
          business_account_id: conn.meta_config.business_account_id || '',
          access_token: conn.meta_config.access_token || '',
          verify_token: conn.meta_config.verify_token || 'foods_wa_verify_token_secure',
        });
      }
    } catch (err) {
      console.error('Erro ao carregar conexão do WhatsApp:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadConnectionSilent = async () => {
    try {
      const conn = await apiFetch<WhatsAppConnection>('/whatsapp/connection');
      setConnection(conn);
    } catch (err) {
      // erro silencioso de polling
    }
  };

  const handleStartConnection = async (selectedProv: WhatsAppProviderType, forceRefresh: boolean = false) => {
    setLoading(true);
    try {
      const updated = await apiFetch<WhatsAppConnection>('/whatsapp/connect', {
        method: 'POST',
        body: JSON.stringify({ 
          provider: selectedProv, 
          status: selectedProv === 'META_CLOUD_API' ? 'CONNECTED' : 'CONNECTING',
          forceRefresh,
          meta_config: selectedProv === 'META_CLOUD_API' ? metaForm : undefined,
        }),
      });
      setConnection(updated);
    } catch (err: any) {
      alert(`Erro ao iniciar conexão com WhatsApp: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMetaCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await apiFetch<WhatsAppConnection>('/whatsapp/connect', {
        method: 'POST',
        body: JSON.stringify({
          provider: 'META_CLOUD_API',
          status: 'CONNECTED',
          meta_config: metaForm,
        }),
      });
      setConnection(updated);
      alert('Credenciais da Meta WhatsApp Cloud API salvas com sucesso!');
    } catch (err: any) {
      alert(`Erro ao salvar credenciais da Meta: ${err.message}`);
    }
  };

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto font-sans">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-500" />
            <span>Central de Notificações WhatsApp (Produção)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Notificação automática de pedidos diretamente no celular dos clientes
          </p>
        </div>
      </div>

      {/* Seleção do Provedor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Opção 1: Meta WhatsApp Cloud API */}
        <div className={`p-6 rounded-2xl border transition-all ${provider === 'META_CLOUD_API' ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500 shadow-xs' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>Meta WhatsApp Cloud API (Oficial)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">API corporativa oficial da Meta para envio por número comercial sem quedas</p>
            </div>
            <input
              type="radio"
              name="wa_provider"
              checked={provider === 'META_CLOUD_API'}
              onChange={() => { setProvider('META_CLOUD_API'); handleStartConnection('META_CLOUD_API'); }}
              className="accent-emerald-500 w-4 h-4 cursor-pointer"
            />
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <p>✔ Envio corporativo por templates homologados da Meta</p>
          </div>
        </div>

        {/* Opção 2: Baileys Engine (QR Code Real) */}
        <div className={`p-6 rounded-2xl border transition-all ${provider === 'BAILEYS' ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500 shadow-xs' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Baileys Engine (QR Code Real Produção)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Conexão Soquete WebSocket aos servidores oficiais do WhatsApp Web</p>
            </div>
            <input
              type="radio"
              name="wa_provider"
              checked={provider === 'BAILEYS'}
              onChange={() => { setProvider('BAILEYS'); handleStartConnection('BAILEYS'); }}
              className="accent-emerald-500 w-4 h-4 cursor-pointer"
            />
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <p>✔ Leitura direta pelo scanner do aplicativo WhatsApp no celular</p>
          </div>
        </div>
      </div>

      {/* PAINEL BAILEYS COM GERADOR DE QR CODE REAL */}
      {provider === 'BAILEYS' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-slate-400">Status Baileys:</span>
                <span className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                  connection?.status === 'CONNECTED'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : connection?.status === 'CONNECTING'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {connection?.status === 'CONNECTED' ? 'CONECTADO' : connection?.status === 'CONNECTING' ? 'AGUARDANDO LEITURA NO CELULAR' : 'DESCONECTADO'}
                </span>
              </div>

              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {connection?.status === 'CONNECTED'
                  ? `WhatsApp Pareado: ${connection.phone_number}`
                  : 'Gere o QR Code atualizado para parear o WhatsApp do restaurante:'}
              </h2>

              <p className="text-xs text-slate-500">
                Os QR Codes do WhatsApp expiram a cada 20 segundos por segurança da Meta. Se o aplicativo reportar QR Code inválido ou expirado, clique no botão para gerar um QR Code novo e limpo.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => handleStartConnection('BAILEYS', true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Gerar Novo QR Code Limpo</span>
                </button>
              </div>
            </div>

            {/* Renderização de Alta Resolução do QR Code Real */}
            {connection?.qr_code && connection?.status === 'CONNECTING' && (
              <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-3 shrink-0 shadow-xs">
                <div className="text-center space-y-0.5">
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-500" />
                    <span>WhatsApp no Celular</span>
                  </p>
                  <p className="text-[10px] text-slate-500">Dispositivos conectados ➔ Conectar um dispositivo</p>
                </div>

                {/* Imagem do QR Code em fundo branco puro com margem oficial de 4 módulos */}
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-md">
                  <img src={connection.qr_code} alt="QR Code WhatsApp Web Real" className="w-56 h-56 object-contain" />
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>Aguardando leitura do scanner...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FORMULÁRIO META CLOUD API QUANDO SELECIONADO */}
      {provider === 'META_CLOUD_API' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-emerald-500" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Credenciais de Produção Meta WhatsApp Cloud API
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowTutorial(!showTutorial)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-emerald-600" />
              <span>{showTutorial ? 'Ocultar Tutorial' : 'Como Configurar na Meta?'}</span>
            </button>
          </div>

          {showTutorial && (
            <div className="p-5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-2xl text-xs space-y-3 text-emerald-950 dark:text-emerald-200">
              <h4 className="font-extrabold text-sm flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>Passo a Passo: Como Obter as Credenciais na Meta</span>
              </h4>
              <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                <li>Acesse o <a href="https://developers.facebook.com/" target="_blank" rel="noreferrer" className="underline font-bold text-emerald-700 inline-flex items-center gap-0.5">Meta for Developers <ExternalLink className="w-3 h-3" /></a> e crie um app tipo <strong>"Empresa" (Business)</strong>.</li>
                <li>Adicione o produto <strong>WhatsApp</strong> ao aplicativo.</li>
                <li>Na aba <strong>WhatsApp ➔ API Setup</strong>, copie o <strong>Phone Number ID</strong>, <strong>Business Account ID</strong> e o <strong>Access Token</strong>.</li>
                <li>Na aba <strong>WhatsApp ➔ Configuration</strong>, configure a URL de Webhook: <strong className="select-all">{appUrl}/api/webhooks/whatsapp</strong> e o Token: <strong className="select-all">{metaForm.verify_token}</strong>.</li>
              </ol>
            </div>
          )}

          <form onSubmit={handleSaveMetaCredentials} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">ID do Número de Telefone (Phone Number ID)</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 109283746501928"
                  value={metaForm.phone_number_id}
                  onChange={(e) => setMetaForm({ ...metaForm, phone_number_id: e.target.value })}
                  className="w-full p-2.5 mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">ID da Conta Business (Business Account ID)</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 987654321012345"
                  value={metaForm.business_account_id}
                  onChange={(e) => setMetaForm({ ...metaForm, business_account_id: e.target.value })}
                  className="w-full p-2.5 mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Token de Acesso do Usuário (Access Token)</label>
              <textarea
                rows={3}
                required
                placeholder="Ex: EAAG..."
                value={metaForm.access_token}
                onChange={(e) => setMetaForm({ ...metaForm, access_token: e.target.value })}
                className="w-full p-2.5 mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
              ></textarea>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Credenciais da Meta</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
