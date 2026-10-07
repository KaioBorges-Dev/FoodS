import React, { useEffect, useState } from 'react';
import { ReportingSummary } from '../../packages/types';
import { formatBRL } from '../../packages/shared';
import { apiFetch } from '../lib/supabase';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  PieChart, 
  UserCheck, 
  Award,
  TrendingUp
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [summary, setSummary] = useState<ReportingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const data = await apiFetch<ReportingSummary>('/reporting/summary?period=30days');
      setSummary(data);
    } catch (err) {
      console.error('Erro ao carregar relatórios:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!summary) return;
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Métrica,Valor\n';
    csvContent += `Vendas Totais,${summary.total_sales}\n`;
    csvContent += `Total Pedidos,${summary.total_orders}\n`;
    csvContent += `Ticket Médio,${summary.average_ticket}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_foods_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !summary) {
    return <div className="p-8 text-xs font-bold text-slate-500">Carregando relatórios analíticos...</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans text-slate-900">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            <span>Relatórios Operacionais e Faturamento</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dados analíticos extraídos diretamente do PostgreSQL Supabase
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors"
        >
          <Download className="w-4 h-4 text-amber-500" />
          <span>Exportar Relatório CSV</span>
        </button>
      </div>

      {/* Grid de Relatórios */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vendas por Meio de Pagamento */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-amber-500" />
            <span>Vendas por Meio de Pagamento</span>
          </h2>

          <div className="space-y-3">
            {summary.sales_by_payment_method.map((pm, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">{pm.method}</span>
                <span className="font-mono font-bold text-emerald-600 tabular-nums">
                  {formatBRL(pm.total)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Desempenho dos Garçons */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-500" />
            <span>Desempenho da Equipe de Garçons</span>
          </h2>

          <div className="space-y-3">
            {summary.waiter_performance.map((w, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800">{w.waiter_name}</p>
                  <p className="text-[10px] text-slate-500">{w.orders_count} comandas atendidas</p>
                </div>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {formatBRL(w.total_sales)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Produtos Faturamento */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-500" />
            <span>Top Produtos por Receita</span>
          </h2>

          <div className="space-y-3">
            {summary.top_products.map((p, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800">{p.name}</p>
                  <p className="text-[10px] text-slate-500">{p.quantity} unidades vendidas</p>
                </div>
                <span className="font-mono font-bold text-amber-600 tabular-nums">
                  {formatBRL(p.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
