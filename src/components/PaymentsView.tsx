import React, { useEffect, useState } from 'react';
import { PaymentGatewayConfig } from '../../packages/types';
import { apiFetch } from '../lib/supabase';
import { 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Key, 
  ExternalLink,
  Globe
} from 'lucide-react';

export const PaymentsView: React.FC = () => {
  const [gateways, setGateways] = useState<PaymentGatewayConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGatewayConfig | null>(null);
  const [credentialsForm, setCredentialsForm] = useState<Record<string, string>>({});

  useEffect(() => {
    loadGateways();
  }, []);

  const loadGateways = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<PaymentGatewayConfig[]>('/payments/gateways');
      setGateways(data);
    } catch (err) {
      console.error('Erro ao carregar gateways:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (gw: PaymentGatewayConfig) => {
    try {
      await apiFetch(`/payments/gateways/${gw.provider}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !gw.is_active }),
      });
      loadGateways();
    } catch (err: any) {
      alert(`Erro ao alterar status do gateway: ${err.message}`);
    }
  };

  const handleOpenConfigModal = (gw: PaymentGatewayConfig) => {
    setSelectedGateway(gw);
    setCredentialsForm(gw.credentials || {});
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGateway) return;

    try {
      await apiFetch(`/payments/gateways/${selectedGateway.provider}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: true, credentials: credentialsForm }),
      });
      setSelectedGateway(null);
      loadGateways();
      alert(`Credenciais do ${selectedGateway.provider} atualizadas com sucesso!`);
    } catch (err: any) {
      alert(`Erro ao salvar credenciais: ${err.message}`);
    }
  };

  const getProviderInfo = (provider: string) => {
    switch (provider) {
      case 'infinitypay':
        return {
          title: 'InfinityPay',
          badge: 'Cobrança via Handle / PIX Instantâneo',
          desc: 'Cobranças PIX via Infinity Handle com confirmação instantânea de pagamento.',
          fields: [
            { key: 'handle', label: 'Infinity Handle da Loja', placeholder: 'ex: foods_gourmet_store' },
            { key: 'webhook_secret', label: 'Chave Secreta do Webhook', placeholder: 'sec_inf_...' },
          ],
        };
      case 'mercadopago':
        return {
          title: 'Mercado Pago',
          badge: 'Checkout transparente & PIX',
          desc: 'Processamento de cartões de crédito e PIX Mercado Pago.',
          fields: [
            { key: 'public_key', label: 'Public Key', placeholder: 'APP_USR-...' },
            { key: 'access_token', label: 'Access Token de Produção', placeholder: 'APP_USR-SECRET...' },
          ],
        };
      case 'pagseguro':
        return {
          title: 'PagBank / PagSeguro',
          badge: 'PIX e Cartões',
          desc: 'Integração de pagamentos PagBank v3.',
          fields: [
            { key: 'email', label: 'E-mail da Conta', placeholder: 'pagamentos@foods.com.br' },
            { key: 'token', label: 'Token de Segurança', placeholder: 'token_pagseguro_...' },
          ],
        };
      case 'syncpay':
        return {
          title: 'Sync Pay',
          badge: 'Gateway Multi-adquirente',
          desc: 'Roteamento inteligente de transações online.',
          fields: [
            { key: 'api_key', label: 'API Key Sync Pay', placeholder: 'sp_live_...' },
          ],
        };
      default:
        return {
          title: provider.toUpperCase(),
          badge: 'Pagamento Presencial',
          desc: 'Método aceito diretamente na entrega ou na mesa.',
          fields: [],
        };
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-500" />
            <span>Gateways de Pagamento & Webhooks</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Ative múltiplos provedores simultâneos para pagamentos online e presenciais
          </p>
        </div>
      </div>

      {/* Grid de Gateways */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gateways.map(gw => {
          const info = getProviderInfo(gw.provider);

          return (
            <div
              key={gw.id}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{info.title}</h3>
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded-full">
                      {info.badge}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleActive(gw)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      gw.is_active
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                    }`}
                  >
                    {gw.is_active ? 'ATIVADO' : 'DESATIVADO'}
                  </button>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">{info.desc}</p>
              </div>

              {/* URL do Webhook Oficial */}
              {info.fields.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl text-[11px] font-mono text-slate-600 dark:text-slate-300 space-y-1">
                  <span className="font-bold text-slate-400 uppercase text-[9px] block">URL de Webhook Oficial:</span>
                  <div className="truncate select-all text-amber-600 dark:text-amber-400 font-bold">
                    /api/webhooks/{gw.provider}
                  </div>
                </div>
              )}

              {/* Botão Configurar Credenciais */}
              {info.fields.length > 0 && (
                <button
                  onClick={() => handleOpenConfigModal(gw)}
                  className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5 text-amber-500" />
                  <span>Configurar Chaves & Credenciais</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Configurar Credenciais */}
      {selectedGateway && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSaveCredentials} className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white capitalize">
              Credenciais — {selectedGateway.provider}
            </h3>

            <div className="space-y-3 text-xs">
              {getProviderInfo(selectedGateway.provider).fields.map(f => (
                <div key={f.key}>
                  <label className="text-slate-500 font-medium">{f.label}</label>
                  <input
                    type="text"
                    placeholder={f.placeholder}
                    value={credentialsForm[f.key] || ''}
                    onChange={(e) => setCredentialsForm({ ...credentialsForm, [f.key]: e.target.value })}
                    className="w-full p-2.5 mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={() => setSelectedGateway(null)} className="px-3 py-1.5 text-xs">Cancelar</button>
              <button type="submit" className="px-4 py-1.5 text-xs font-bold text-white bg-amber-500 rounded-lg">
                Salvar Configuração
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
