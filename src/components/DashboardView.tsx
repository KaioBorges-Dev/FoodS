import React, { useEffect, useState } from 'react';
import { ReportingSummary } from '../../packages/types';
import { formatBRL } from '../../packages/shared';
import { apiFetch } from '../lib/supabase';
import { 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  Award, 
  ArrowUpRight,
  Filter,
  Plus
} from 'lucide-react';

export const DashboardView: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const [summary, setSummary] = useState<ReportingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30days');

  useEffect(() => {
    loadSummary();
  }, [period]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<ReportingSummary>(`/reporting/summary?period=${period}`);
      setSummary(data);
    } catch (err) {
      console.error('Erro ao carregar métricas do dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !summary) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const hasNoData = summary.total_orders === 0 && summary.total_sales === 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans text-slate-900">
      {/* Cabeçalho do Dashboard em Modo Claro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Painel Geral de Vendas e Operação
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Métricas operacionais consolidadas em tempo real do banco de dados Supabase
          </p>
        </div>

        {/* Filtros de Período */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
          {[
            { id: 'today', label: 'Hoje' },
            { id: '7days', label: '7 dias' },
            { id: '30days', label: '30 dias' },
            { id: 'month', label: 'Este Mês' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                period === p.id
                  ? 'bg-white text-slate-900 border border-slate-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Principais de Indicadores Reais sem Sombras */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Vendas Totais</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 font-mono tabular-nums">
              {formatBRL(summary.total_sales)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Consolidado de pedidos pagos reais
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total de Pedidos</span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 font-mono tabular-nums">
              {summary.total_orders}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {summary.orders_in_progress} em andamento · {summary.orders_completed} concluídos
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Ticket Médio</span>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 font-mono tabular-nums">
              {formatBRL(summary.average_ticket)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Média por pedido finalizado
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Estoque Crítico</span>
            <div className="p-2 bg-red-50 rounded-xl text-red-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 font-mono tabular-nums">
              {summary.critical_inventory.length}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Insumos abaixo do estoque mínimo
            </p>
          </div>
        </div>
      </div>

      {/* Empty State Claro sem Sombras */}
      {hasNoData && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Seu restaurante ainda não possui vendas registradas</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Cadastre os primeiros produtos no cardápio e abra comandas ou acesse o cardápio digital para começar a receber pedidos reais.
          </p>
          {onNavigate && (
            <button
              onClick={() => onNavigate('catalog')}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs"
            >
              Cadastrar Primeiros Produtos
            </button>
          )}
        </div>
      )}

      {/* Tabela de Produtos Mais Vendidos Reais */}
      {summary.top_products.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Produtos Mais Vendidos</span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-2">Produto</th>
                  <th className="py-2.5 px-2 text-center">Qtd Vendida</th>
                  <th className="py-2.5 px-2 text-right">Faturamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.top_products.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-2 font-bold text-slate-800">{p.name}</td>
                    <td className="py-3 px-2 text-center font-mono tabular-nums text-slate-600">{p.quantity} un</td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums font-bold text-slate-900">{formatBRL(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
