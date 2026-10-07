import React, { useState, useEffect } from 'react';
import { Profile, AuthSettings } from '../../packages/types';
import { apiFetch } from '../lib/supabase';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertTriangle, CheckCircle, Database, Phone, Key, HelpCircle } from 'lucide-react';

interface LoginViewProps {
  authSettings: AuthSettings | null;
  onLoginSuccess: (user: Profile) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ authSettings, onLoginSuccess }) => {
  const [viewMode, setViewMode] = useState<'LOGIN' | 'RECOVERY_REQUEST' | 'RECOVERY_VERIFY'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSavedFeedback] = useState('');

  // Password recovery states
  const [recoveryEmailOrPhone, setRecoveryEmailOrPhone] = useState('');
  const [recoveryTargetPhone, setRecoveryTargetPhone] = useState('');
  const [recoveryPinCode, setRecoveryPinCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [systemStatus, setSystemStatus] = useState<{
    supabase?: { configured: boolean; mode: string; message: string };
  } | null>(null);

  useEffect(() => {
    // Verificar status do Supabase ao carregar a tela de Login
    apiFetch<any>('/system/status')
      .then((data) => setSystemStatus(data))
      .catch(() => null);
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSavedFeedback('');

    try {
      const response = await apiFetch<{ profile: Profile; isSupabaseConfigured?: boolean; warning?: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });

      onLoginSuccess(response.profile);
    } catch (err: any) {
      setErrorMessage(err.message || 'Acesso negado. Verifique seu e-mail e senha.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSavedFeedback('');

    try {
      const res = await apiFetch<any>('/auth/admin/recover-request', {
        method: 'POST',
        body: JSON.stringify({
          emailOrPhone: recoveryEmailOrPhone,
          targetPhone: recoveryTargetPhone,
        }),
      });

      setSavedFeedback(res.message || 'PIN enviado com sucesso para o WhatsApp!');
      setViewMode('RECOVERY_VERIFY');
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao enviar código de verificação. Verifique se o e-mail está cadastrado.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSavedFeedback('');

    try {
      const res = await apiFetch<any>('/auth/admin/recover-confirm', {
        method: 'POST',
        body: JSON.stringify({
          emailOrPhone: recoveryEmailOrPhone,
          pin_code: recoveryPinCode,
          new_password: newPassword,
          targetPhone: recoveryTargetPhone,
        }),
      });

      setSavedFeedback(res.message || 'Senha administrativa redefinida com sucesso!');
      setViewMode('LOGIN');
      setPassword('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao redefinir senha. Verifique se o PIN inserido está correto.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillAdminCredentials = () => {
    setEmail('admin@admin');
    setPassword('admin123');
    setErrorMessage('');
    setSavedFeedback('');
  };

  const isSupabaseConnected = systemStatus?.supabase?.configured;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans text-slate-900">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-slate-200 space-y-6 shadow-sm">
        
        {/* Cabeçalho de Autenticação */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-amber-500 text-white rounded-2xl mb-2 shadow-xs">
            <span className="font-black text-xl tracking-wider">FoodS</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Painel Administrativo FoodS</h1>
          <p className="text-xs text-slate-500">
            {viewMode === 'LOGIN' && 'Entre com suas credenciais cadastradas para gerenciar a operação'}
            {viewMode === 'RECOVERY_REQUEST' && 'Esqueceu a senha? Solicite um PIN temporário no seu WhatsApp'}
            {viewMode === 'RECOVERY_VERIFY' && 'Insira o PIN de 6 dígitos enviado ao seu WhatsApp e defina sua nova senha'}
          </p>
        </div>

        {/* Banner Informativo de Status do Supabase */}
        {viewMode === 'LOGIN' && systemStatus && (
          isSupabaseConnected ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-[11px] text-emerald-800 flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Supabase PostgreSQL Conectado</span>
                <span>Autenticação e dados sincronizados em tempo real na nuvem.</span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Aviso: Supabase Não Configurado</span>
                <span>O sistema está operando em <b>Modo de Contingência Local</b>. O acesso está restrito aos usuários autorizados (Owner padrão: <code className="font-bold text-amber-950">admin@admin</code>).</span>
              </div>
            </div>
          )
        )}

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-700 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-700 flex items-center gap-2 animate-pulse">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* MODO 1: LOGIN TRADICIONAL */}
        {viewMode === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">E-mail de Acesso</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="ex: admin@admin"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 outline-none font-medium text-slate-800"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">Senha</label>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('RECOVERY_REQUEST');
                    setErrorMessage('');
                    setSavedFeedback('');
                  }}
                  className="font-bold text-amber-600 hover:text-amber-700 text-[10px]"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 outline-none font-medium text-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              {loading ? (
                <span>Verificando credenciais...</span>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* MODO 2: REQUISIÇÃO DE PIN DE RECUPERAÇÃO VIA WHATSAPP */}
        {viewMode === 'RECOVERY_REQUEST' && (
          <form onSubmit={handleRequestPinSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">E-mail do Administrador</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="ex: admin@admin"
                  value={recoveryEmailOrPhone}
                  onChange={(e) => setRecoveryEmailOrPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 outline-none font-medium text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Seu Telefone WhatsApp de Recebimento</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="ex: 11999999999"
                  value={recoveryTargetPhone}
                  onChange={(e) => setRecoveryTargetPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 outline-none font-medium text-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              {loading ? (
                <span>Enviando PIN de Segurança...</span>
              ) : (
                <>
                  <span>Enviar PIN via WhatsApp</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('LOGIN');
                setErrorMessage('');
                setSavedFeedback('');
              }}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-center"
            >
              Voltar para o Login
            </button>
          </form>
        )}

        {/* MODO 3: INSERIR PIN E REDEFINIR SENHA */}
        {viewMode === 'RECOVERY_VERIFY' && (
          <form onSubmit={handleVerifyConfirmSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">PIN de Verificação (6 dígitos)</label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="ex: 123456"
                  value={recoveryPinCode}
                  onChange={(e) => setRecoveryPinCode(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 outline-none font-medium text-slate-800 tracking-widest text-center text-sm"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Nova Senha de Acesso</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="Digite sua nova senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 outline-none font-medium text-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              {loading ? (
                <span>Atualizando Senha...</span>
              ) : (
                <>
                  <span>Confirmar e Redefinir Senha</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('RECOVERY_REQUEST');
                setErrorMessage('');
                setSavedFeedback('');
              }}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-center"
            >
              Voltar para Solicitar PIN
            </button>
          </form>
        )}

        {/* Atalho para preenchimento de Owner Padrão */}
        {viewMode === 'LOGIN' && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={handleFillAdminCredentials}
              className="text-[11px] font-bold text-slate-500 hover:text-amber-600 inline-flex items-center gap-1.5 transition-colors"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Preencher Credenciais Owner (admin@admin)</span>
            </button>
          </div>
        )}

        <div className="text-center pt-2 text-[11px] text-slate-400 border-t border-slate-100">
          <p className="font-medium">FoodS SaaS • Sistema Protegido</p>
          <p className="mt-0.5 text-[10px]">Autenticação restrita e políticas de segurança militar ativas</p>
        </div>
      </div>
    </div>
  );
};
