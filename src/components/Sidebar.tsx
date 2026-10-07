import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Calculator, 
  UtensilsCrossed, 
  BookOpen, 
  Package, 
  Users, 
  BarChart3, 
  Settings, 
  Layers
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  ordersCount: number;
  criticalInventoryCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  ordersCount,
  criticalInventoryCount,
}) => {
  // Módulos Estritamente Operacionais
  const operationalItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Pedidos em Tempo Real', icon: ShoppingBag, badge: ordersCount > 0 ? ordersCount : undefined },
    { id: 'pos', label: 'POS / Atendimento Presencial', icon: Calculator },
    { id: 'waiter', label: 'Garçom & Mesas', icon: UtensilsCrossed },
    { id: 'catalog', label: 'Cardápio & Produtos', icon: BookOpen },
    { id: 'inventory', label: 'Estoque & Ficha Técnica', icon: Package, badge: criticalInventoryCount > 0 ? `${criticalInventoryCount} Alerta` : undefined, badgeColor: 'bg-red-500' },
    { id: 'customers', label: 'Clientes & Fidelidade', icon: Users },
    { id: 'reports', label: 'Relatórios & Métricas', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col shrink-0 font-sans shadow-2xs">
      
      {/* Seção 1: Módulos Operacionais */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2">
          <Layers className="w-3.5 h-3.5" />
          <span>Módulos de Operação</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {operationalItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${item.badgeColor || 'bg-amber-600'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Divisor Visual de Configurações */}
        <div className="pt-4 pb-2">
          <div className="border-t border-slate-100 my-1"></div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
            Configurações
          </p>

          <button
            onClick={() => onSelectTab('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Settings className={`w-4 h-4 ${activeTab === 'settings' ? 'text-white' : 'text-slate-400'}`} />
            <span>Configurações</span>
          </button>
        </div>
      </nav>

      {/* Rodapé do Menu */}
      <div className="p-3.5 border-t border-slate-200 bg-slate-50">
        <div className="text-[11px] text-slate-500 space-y-1">
          <p className="font-bold text-slate-700">FoodS SaaS v2.0.0</p>
          <p className="text-[10px] leading-tight text-slate-500">
            Copyright{' '}
            <a 
              href="https://dev.kaioborges.com.br" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-semibold text-amber-600 hover:text-amber-700 hover:underline"
            >
              Kaio Borges Dev
            </a>
            {' '}-{' '}
            <a 
              href="https://instagram.com/5ebrasil" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-semibold text-amber-600 hover:text-amber-700 hover:underline"
            >
              5E Group (@5ebrasil)
            </a>
            {' '}todos os direitos reservados.
          </p>
        </div>
      </div>
    </aside>
  );
};
