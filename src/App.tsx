import React, { useEffect, useState } from 'react';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { OrdersView } from './components/OrdersView';
import { PosView } from './components/PosView';
import { WaiterTablesView } from './components/WaiterTablesView';
import { CatalogView } from './components/CatalogView';
import { DigitalMenuView } from './components/DigitalMenuView';
import { InventoryView } from './components/InventoryView';
import { CustomersView } from './components/CustomersView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { TotemView } from './components/TotemView';
import { LoginView } from './components/LoginView';
import { ToastContainer, ToastMessage } from './components/Toast';
import { AppNotification } from './components/NotificationCenter';
import { Organization, Unit, Profile, AuthSettings } from '../packages/types';
import { apiFetch } from './lib/supabase';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showPublicMenu, setShowPublicMenu] = useState<boolean>(false);
  const [showTotem, setShowTotem] = useState<boolean>(false);

  // Dados padrão de inicialização para evitar tela travada
  const defaultOrg: Organization = {
    id: 'org_foods_default_001',
    name: 'FoodS Gastronomia & Restaurantes',
    legal_name: 'FoodS Matriz Ltda',
    document: '12.345.678/0001-90',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const defaultUnit: Unit = {
    id: 'unit_matriz_001',
    organization_id: 'org_foods_default_001',
    name: 'Unidade Principal - Matriz',
    slug: 'matriz-01',
    is_active: true,
    is_open: true,
    phone: '(11) 3000-0000',
    whatsapp: '(11) 99999-9999',
    email: 'matriz@foods.com.br',
    address_street: 'Avenida Paulista',
    address_number: '1000',
    address_complement: 'Térreo Gastronômico',
    address_neighborhood: 'Bela Vista',
    address_city: 'São Paulo',
    address_state: 'SP',
    address_zipcode: '01310-100',
    delivery_fee: 5.00,
    delivery_radius_km: 7.5,
    avg_prep_time_minutes: 30,
    created_at: new Date().toISOString(),
  };

  const [organization, setOrganization] = useState<Organization>(defaultOrg);
  const [units, setUnits] = useState<Unit[]>([defaultUnit]);
  const [currentUnit, setCurrentUnit] = useState<Unit>(defaultUnit);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [authSettings, setAuthSettings] = useState<AuthSettings>({
    id: 'auth_sett_001',
    organization_id: 'org_foods_default_001',
    google_oauth_enabled: true,
    email_auth_enabled: true,
    require_email_verification: false,
    updated_at: new Date().toISOString(),
  });
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [criticalInventoryCount, setCriticalInventoryCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  // Central de Notificações e Toast Interno
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'notif_1',
      title: 'Sistema Conectado ao Supabase',
      message: 'Banco de Dados PostgreSQL e RLS operando em Modo Claro.',
      time: 'Agora',
      type: 'system',
      read: false,
    },
  ]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    // REGRA ABSOLUTA: Modo claro por padrão e único tema ativo
    document.documentElement.classList.remove('dark');
    
    // Verificar sessão ativa salva no navegador
    const savedUserStr = localStorage.getItem('foods_admin_user');
    if (savedUserStr) {
      try {
        setCurrentUser(JSON.parse(savedUserStr));
      } catch (e) {
        localStorage.removeItem('foods_admin_user');
      }
    }

    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [orgData, unitsData, authSet, summaryData] = await Promise.all([
        apiFetch<Organization>('/restaurant/organization').catch(() => null),
        apiFetch<Unit[]>('/restaurant/units').catch(() => []),
        apiFetch<AuthSettings>('/auth/settings').catch(() => null),
        apiFetch<any>('/reporting/summary').catch(() => ({ orders_in_progress: 0, critical_inventory: [] })),
      ]);

      if (orgData) setOrganization(orgData);
      if (unitsData && unitsData.length > 0) {
        setUnits(unitsData);
        setCurrentUnit(unitsData[0]);
      }
      if (authSet) setAuthSettings(authSet);

      if (summaryData) {
        setOrdersCount(summaryData.orders_in_progress || 0);
        setCriticalInventoryCount(summaryData.critical_inventory?.length || 0);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do FoodS:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('foods_admin_user');
    setCurrentUser(null);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Se o usuário clicar em "Totem Autoatendimento"
  if (showTotem) {
    return (
      <TotemView
        onClose={() => setShowTotem(false)}
        organization={organization}
        currentUnit={currentUnit}
      />
    );
  }

  // Se o usuário clicar em "Cardápio Online" público
  if (showPublicMenu) {
    return <DigitalMenuView onClose={() => setShowPublicMenu(false)} />;
  }

  // REGRA ADMINISTRATIVA OBRIGATÓRIA: Tela de Login se não estiver autenticado
  if (!currentUser) {
    return (
      <LoginView
        authSettings={authSettings}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          localStorage.setItem('foods_admin_user', JSON.stringify(user));
          loadInitialData();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-50 flex flex-col items-center justify-center space-y-4 font-sans">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-slate-700">Carregando Plataforma FoodS SaaS...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* TopBar Limpo em Modo Claro */}
      <TopBar
        organization={organization}
        units={units}
        currentUnit={currentUnit}
        onSelectUnit={setCurrentUnit}
        currentUser={currentUser}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        openTotem={() => setShowTotem(true)}
        openPublicMenu={() => setShowPublicMenu(true)}
        onLogout={handleLogout}
        notifications={notifications}
        onMarkNotificationRead={markNotificationRead}
        onClearNotifications={clearNotifications}
      />

      {/* Conteúdo Principal sem Scrollbars Duplos ou Vazamento Horizontal */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          ordersCount={ordersCount}
          criticalInventoryCount={criticalInventoryCount}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 bg-slate-50">
          {activeTab === 'dashboard' && <DashboardView onNavigate={setActiveTab} />}
          {activeTab === 'orders' && <OrdersView onOrdersUpdated={loadInitialData} />}
          {activeTab === 'pos' && <PosView />}
          {activeTab === 'waiter' && <WaiterTablesView />}
          {activeTab === 'catalog' && <CatalogView />}
          {activeTab === 'inventory' && <InventoryView />}
          {activeTab === 'customers' && <CustomersView />}
          {activeTab === 'reports' && <ReportsView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Container do Toast de Feedback Visual Interno */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default App;
