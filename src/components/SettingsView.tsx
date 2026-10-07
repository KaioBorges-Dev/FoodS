import React, { useEffect, useState } from 'react';
import { 
  StoreSettings, 
  AuthSettings, 
  Organization, 
  Unit, 
  Profile, 
  UserRole, 
  WhatsAppConnection,
  DeliverySettings,
  MenuSettings,
  InventorySettings,
  LoyaltySettings,
  PrintSettings,
  AppearanceSettings,
  NotificationSettings,
  SecuritySettings,
  RolePermissionMatrix,
  Totem,
  PaymentTerminal
} from '../../packages/types';
import { apiFetch } from '../lib/supabase';
import { ImageUploader } from './ImageUploader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faStore, 
  faBuilding, 
  faUsers, 
  faShieldHalved, 
  faKey, 
  faCreditCard, 
  faBell, 
  faTruck, 
  faBookOpen, 
  faBoxesStacked, 
  faAward, 
  faPrint, 
  faPalette, 
  faGlobe, 
  faLock,
  faPlus,
  faFloppyDisk,
  faRotateRight,
  faArrowLeft,
  faTrash,
  faPenToSquare,
  faCheck,
  faXmark,
  faCircleCheck,
  faCircleExclamation,
  faSliders,
  faMoneyBillWave,
  faMobileScreen,
  faQrcode,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';

// Componente Reutilizável de Slide Switch
const SlideSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}> = ({ checked, onChange, label, description, disabled = false }) => {
  return (
    <div className="flex items-center justify-between py-2">
      {label && (
        <div className="pr-4 space-y-0.5">
          <p className="text-xs font-bold text-slate-900">{label}</p>
          {description && <p className="text-[11px] text-slate-500">{description}</p>}
        </div>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
          disabled ? 'opacity-50 cursor-not-allowed bg-slate-200' : checked ? 'bg-amber-500' : 'bg-slate-300'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-2xs ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

export const SettingsView: React.FC = () => {
  // Aba Ativa das 16 Áreas
  const [activeTab, setActiveTab] = useState<string>('loja');
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);

  // Estados para exclusão segura sem depender de confirm() que é bloqueado pelo iframe
  const [unitToDeleteId, setUnitToDeleteId] = useState<string | null>(null);
  const [userToDeleteId, setUserToDeleteId] = useState<string | null>(null);

  // Sub-Aba de Pagamentos
  const [paymentSubTab, setPaymentSubTab] = useState<string>('overview');

  // Estados dos Modos de Sub-Páginas (Zero Popups)
  const [unitViewMode, setUnitViewMode] = useState<'LIST' | 'FORM'>('LIST');
  const [userViewMode, setUserViewMode] = useState<'LIST' | 'FORM'>('LIST');

  // Estados com valores padrão de produção para renderização instantânea (sem telas brancas)
  const [org, setOrg] = useState<Organization>({
    id: 'org_001',
    name: 'FoodS Gastronomia & Tecnologia',
    legal_name: 'FoodS Gastronomia Ltda',
    document: '12.345.678/0001-90',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  const [units, setUnits] = useState<Unit[]>([
    {
      id: 'unit_matriz',
      organization_id: 'org_001',
      name: 'Matriz - Jardins',
      slug: 'matriz-jardins',
      phone: '(11) 3456-7890',
      whatsapp: '(11) 98765-4321',
      delivery_fee: 5.0,
      delivery_radius_km: 7.0,
      avg_prep_time_minutes: 25,
      is_active: true,
      is_open: true,
      created_at: new Date().toISOString(),
      address_city: 'São Paulo',
      address_state: 'SP'
    }
  ]);

  const [profiles, setProfiles] = useState<Profile[]>([
    {
      id: 'prof_admin',
      organization_id: 'org_001',
      first_name: 'Administrador',
      last_name: 'FoodS',
      email: 'admin@foods.com.br',
      role: 'owner',
      status: 'active',
      created_at: new Date().toISOString()
    }
  ]);

  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    id: 'store_001',
    organization_id: 'org_001',
    unit_id: 'unit_matriz',
    phone: '(11) 3456-7890',
    whatsapp: '(11) 98765-4321',
    email: 'contato@foods.com.br',
    address_zipcode: '01310-100',
    address_street: 'Avenida Paulista',
    address_number: '1000',
    address_neighborhood: 'Bela Vista',
    address_city: 'São Paulo',
    address_state: 'SP',
    min_order_value: 20.0,
    avg_prep_time_minutes: 25,
    delivery_enabled: true,
    pickup_enabled: true,
    table_service_enabled: true,
    auto_approve_orders: true,
    business_hours: {
      segunda: { active: true, open: '11:00', close: '23:00' },
      terca: { active: true, open: '11:00', close: '23:00' },
      quarta: { active: true, open: '11:00', close: '23:00' },
      quinta: { active: true, open: '11:00', close: '23:00' },
      sexta: { active: true, open: '11:00', close: '23:59' },
      sabado: { active: true, open: '11:00', close: '23:59' },
      domingo: { active: true, open: '11:00', close: '22:00' },
    }
  });

  const [authSettings, setAuthSettings] = useState<AuthSettings>({
    id: 'auth_001',
    organization_id: 'org_001',
    google_oauth_enabled: true,
    email_auth_enabled: true,
    require_email_verification: false,
    updated_at: new Date().toISOString()
  });

  const [gateways, setGateways] = useState<any[]>([
    { provider: 'infinitypay', is_active: false, credentials: {} },
    { provider: 'mercadopago', is_active: true, credentials: { public_key: '', access_token: '', environment: 'production' } },
    { provider: 'pagseguro', is_active: false, credentials: {} },
    { provider: 'syncpay', is_active: false, credentials: {} },
    { provider: 'cash', is_active: true },
    { provider: 'card_pos', is_active: true },
    { provider: 'pix_presential', is_active: true }
  ]);

  const [waConnection, setWaConnection] = useState<WhatsAppConnection>({
    id: 'wa_001',
    organization_id: 'org_001',
    unit_id: 'unit_matriz',
    provider: 'BAILEYS',
    status: 'DISCONNECTED',
    phone_number: '(11) 98765-4321',
    updated_at: new Date().toISOString(),
    meta_config: {
      phone_number_id: '',
      business_account_id: '',
      access_token: '',
      verify_token: 'foods_wa_verify_token_secure'
    }
  });

  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>({
    id: 'del_001',
    organization_id: 'org_001',
    unit_id: 'unit_matriz',
    mode: 'FLAT',
    flat_fee: 6.5,
    flat_min_order: 20.0,
    flat_est_minutes: 35,
    cities: [
      { id: 'city_01', city_name: 'São Paulo', fee: 6.5, min_order: 20.0, est_minutes: 35, is_active: true }
    ],
    areas: [
      { id: 'area_01', area_name: 'Bela Vista / Jardins', city_name: 'São Paulo', fee: 5.0, min_order: 15.0, est_minutes: 25, is_active: true }
    ],
    hours: {}
  });

  const [menuSettings, setMenuSettings] = useState<MenuSettings>({
    id: 'menu_001',
    organization_id: 'org_001',
    unit_id: 'unit_matriz',
    online_menu_enabled: true,
    online_orders: true,
    pickup: true,
    delivery: true,
    table_service: true,
    channels: { online: true, pos: true, totem: true },
    allow_item_notes: true
  });

  const [inventorySettings, setInventorySettings] = useState<InventorySettings>({
    id: 'inv_001',
    organization_id: 'org_001',
    unit_id: 'unit_matriz',
    auto_deduct_on_order: true,
    alert_threshold_pct: 15,
    default_unit: 'un',
    enable_cost_tracking: true
  });

  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings>({
    id: 'loy_001',
    organization_id: 'org_001',
    unit_id: 'unit_matriz',
    is_active: true,
    points_per_real: 1.0,
    min_points_redemption: 100,
    points_validity_days: 180,
    allow_coupons: true
  });

  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    id: 'prn_001',
    organization_id: 'org_001',
    unit_id: 'unit_matriz',
    print_order_copy: true,
    print_kitchen_copy: true,
    printers: [
      { id: 'prn_kitch', name: 'Impressora Cozinha KDS', type: 'KITCHEN', connection: 'NETWORK', ip_address: '192.168.1.200', paper_width: 80, auto_print: true, category_ids: [] },
      { id: 'prn_bar', name: 'Impressora Balcão & Bar', type: 'BAR', connection: 'USB', ip_address: '', paper_width: 80, auto_print: true, category_ids: [] }
    ]
  });

  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
    id: 'app_001',
    organization_id: 'org_001',
    unit_id: 'unit_matriz',
    theme: 'light',
    primary_color: '#f59e0b',
    secondary_color: '#10b981',
    accent_color: '#6366f1',
    button_color: '#f59e0b',
    logo_url: '',
    icon_url: ''
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    id: 'notif_001',
    organization_id: 'org_001',
    unit_id: 'unit_matriz',
    whatsapp_events: {
      order_received: true,
      order_confirmed: true,
      order_preparing: true,
      order_ready: true,
      order_out_for_delivery: true,
      order_delivered: true,
      order_cancelled: true,
    },
    system_events: {
      order_created: true,
      stock_alert: true,
      payment_received: true,
      customer_signup: true,
      system_alert: true,
      whatsapp_disconnected: true,
    }
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    id: 'sec_001',
    organization_id: 'org_001',
    unit_id: 'unit_matriz',
    session_timeout_minutes: 1440,
    max_login_attempts: 5,
    require_strong_password: true,
    force_2fa: false,
    active_sessions: [
      { id: 'sess_01', user_name: 'Admin FoodS', ip: '127.0.0.1', device: 'Chrome Web POS', last_active: 'Agora' }
    ]
  });

  const defaultRolePerms = {
    dashboard_view: true,
    orders_view: true,
    orders_create: true,
    orders_edit: true,
    orders_cancel: true,
    products_view: true,
    products_create: true,
    products_edit: true,
    products_delete: true,
    inventory_view: true,
    inventory_edit: true,
    financial_view: true,
    financial_edit: true,
    settings_manage: true
  };

  const [permissionMatrix, setPermissionMatrix] = useState<RolePermissionMatrix>({
    id: 'perm_001',
    organization_id: 'org_001',
    role_permissions: {
      owner: { ...defaultRolePerms },
      admin: { ...defaultRolePerms },
      manager: { ...defaultRolePerms, products_delete: false, settings_manage: false },
      coordinator: { ...defaultRolePerms, products_delete: false, settings_manage: false, financial_edit: false },
      waiter: { ...defaultRolePerms, dashboard_view: false, products_view: false, products_create: false, products_edit: false, products_delete: false, inventory_view: false, inventory_edit: false, financial_view: false, financial_edit: false, settings_manage: false },
      operator: { ...defaultRolePerms, dashboard_view: false, products_view: false, products_create: false, products_edit: false, products_delete: false, inventory_view: false, inventory_edit: false, financial_view: false, financial_edit: false, settings_manage: false },
      kitchen: { ...defaultRolePerms, dashboard_view: false, orders_create: false, products_view: false, products_create: false, products_edit: false, products_delete: false, financial_view: false, financial_edit: false, settings_manage: false },
      financial: { ...defaultRolePerms, orders_create: false, products_create: false, products_edit: false, products_delete: false, inventory_edit: false, settings_manage: false }
    }
  });

  const [totems, setTotems] = useState<Totem[]>([]);
  const [paymentTerminals, setPaymentTerminals] = useState<PaymentTerminal[]>([]);
  const [totemViewMode, setTotemViewMode] = useState<'LIST' | 'FORM'>('LIST');
  const [terminalViewMode, setTerminalViewMode] = useState<'LIST' | 'FORM'>('LIST');
  const [editingTotem, setEditingTotem] = useState<Partial<Totem>>({});
  const [editingTerminal, setEditingTerminal] = useState<Partial<PaymentTerminal>>({});

  const [loading, setLoading] = useState(false);

  // Formulários de Edição de Unidade e Usuário
  const [editingUnit, setEditingUnit] = useState<Partial<Unit>>({});
  const [editingUser, setEditingUser] = useState<Partial<Profile>>({});

  // Formulários Temporários de Cidades / Áreas / Impressoras
  const [newCity, setNewCity] = useState({ city_name: '', fee: 5.0, min_order: 20.0, est_minutes: 30 });
  const [newArea, setNewArea] = useState({ area_name: '', city_name: 'São Paulo', fee: 4.0, min_order: 15.0, est_minutes: 25 });
  const [newPrinter, setNewPrinter] = useState({ name: '', type: 'KITCHEN' as any, connection: 'NETWORK' as any, ip_address: '192.168.1.200', paper_width: 80 as 58 | 80, auto_print: true, category_ids: [] });

  // Credenciais InfinityPay / Mercado Pago / PagSeguro / Sync Pay
  const [infinityHandle, setInfinityHandle] = useState('');
  const [mpPublicKey, setMpPublicKey] = useState('');
  const [mpAccessToken, setMpAccessToken] = useState('');
  const [mpEnv, setMpEnv] = useState<'production' | 'sandbox'>('production');
  const [psEmail, setPsEmail] = useState('');
  const [psToken, setPsToken] = useState('');
  const [syncKey, setSyncKey] = useState('');

  // WhatsApp Meta form
  const [metaPhoneId, setMetaPhoneId] = useState('');
  const [metaAccountId, setMetaAccountId] = useState('');
  const [metaToken, setMetaToken] = useState('');
  const [metaVerifyToken, setMetaVerifyToken] = useState('');

  useEffect(() => {
    loadAllConfigurations();
  }, []);

  const showSuccessFeedback = (msg: string) => {
    setSavedFeedback(msg);
    setTimeout(() => setSavedFeedback(null), 3500);
  };

  const showErrorFeedback = (msg: string) => {
    setErrorFeedback(msg);
    setTimeout(() => setErrorFeedback(null), 5000);
  };

  const loadAllConfigurations = async () => {
    try {
      const results = await Promise.allSettled([
        apiFetch<Organization>('/settings/organization'),
        apiFetch<Unit[]>('/settings/units'),
        apiFetch<Profile[]>('/users/profiles'),
        apiFetch<StoreSettings>('/settings/store'),
        apiFetch<AuthSettings>('/auth/settings'),
        apiFetch<any[]>('/payments/gateways'),
        apiFetch<WhatsAppConnection>('/whatsapp/connection'),
        apiFetch<DeliverySettings>('/settings/delivery'),
        apiFetch<MenuSettings>('/settings/menu'),
        apiFetch<InventorySettings>('/settings/inventory'),
        apiFetch<LoyaltySettings>('/settings/loyalty'),
        apiFetch<PrintSettings>('/settings/print'),
        apiFetch<AppearanceSettings>('/settings/appearance'),
        apiFetch<NotificationSettings>('/settings/notifications'),
        apiFetch<SecuritySettings>('/settings/security'),
        apiFetch<RolePermissionMatrix>('/settings/permissions'),
        apiFetch<Totem[]>('/totems'),
        apiFetch<PaymentTerminal[]>('/terminals'),
      ]);

      if (results[0].status === 'fulfilled' && results[0].value) setOrg(results[0].value);
      if (results[1].status === 'fulfilled' && results[1].value) setUnits(results[1].value);
      if (results[2].status === 'fulfilled' && results[2].value) setProfiles(results[2].value);
      if (results[3].status === 'fulfilled' && results[3].value) setStoreSettings(results[3].value);
      if (results[4].status === 'fulfilled' && results[4].value) setAuthSettings(results[4].value);
      if (results[5].status === 'fulfilled' && results[5].value) {
        const gatewaysData = results[5].value;
        setGateways(gatewaysData);
        const inf = gatewaysData.find(g => g.provider === 'infinitypay');
        if (inf?.credentials?.handle) setInfinityHandle(inf.credentials.handle);

        const mp = gatewaysData.find(g => g.provider === 'mercadopago');
        if (mp?.credentials) {
          setMpPublicKey(mp.credentials.public_key || '');
          setMpAccessToken(mp.credentials.access_token || '');
          setMpEnv(mp.credentials.environment || 'production');
        }

        const ps = gatewaysData.find(g => g.provider === 'pagseguro');
        if (ps?.credentials) {
          setPsEmail(ps.credentials.email || '');
          setPsToken(ps.credentials.token || '');
        }

        const sp = gatewaysData.find(g => g.provider === 'syncpay');
        if (sp?.credentials?.api_key) setSyncKey(sp.credentials.api_key);
      }
      if (results[6].status === 'fulfilled' && results[6].value) {
        const waData = results[6].value;
        setWaConnection(waData);
        if (waData?.meta_config) {
          setMetaPhoneId(waData.meta_config.phone_number_id || '');
          setMetaAccountId(waData.meta_config.business_account_id || '');
          setMetaToken(waData.meta_config.access_token || '');
          setMetaVerifyToken(waData.meta_config.verify_token || '');
        }
      }
      if (results[7].status === 'fulfilled' && results[7].value) setDeliverySettings(results[7].value);
      if (results[8].status === 'fulfilled' && results[8].value) setMenuSettings(results[8].value);
      if (results[9].status === 'fulfilled' && results[9].value) setInventorySettings(results[9].value);
      if (results[10].status === 'fulfilled' && results[10].value) setLoyaltySettings(results[10].value);
      if (results[11].status === 'fulfilled' && results[11].value) setPrintSettings(results[11].value);
      if (results[12].status === 'fulfilled' && results[12].value) setAppearanceSettings(results[12].value);
      if (results[13].status === 'fulfilled' && results[13].value) setNotificationSettings(results[13].value);
      if (results[14].status === 'fulfilled' && results[14].value) setSecuritySettings(results[14].value);
      if (results[15].status === 'fulfilled' && results[15].value) setPermissionMatrix(results[15].value);
      if (results[16].status === 'fulfilled' && results[16].value) setTotems(results[16].value);
      if (results[17].status === 'fulfilled' && results[17].value) setPaymentTerminals(results[17].value);
    } catch (err) {
      console.error('Erro ao sincronizar configurações gerais:', err);
    }
  };

  // 1. SALVAR LOJA
  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org || !storeSettings) return;
    try {
      await Promise.all([
        apiFetch('/restaurant/organization', { method: 'PUT', body: JSON.stringify(org) }),
        apiFetch('/settings/store', { method: 'PUT', body: JSON.stringify(storeSettings) }),
      ]);
      showSuccessFeedback('Dados da Loja salvos com sucesso no Supabase!');
    } catch (err: any) {
      alert(`Erro ao salvar loja: ${err.message}`);
    }
  };

  // 2. UNIDADES CRUD
  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUnit.id) {
        await apiFetch(`/restaurant/units/${editingUnit.id}`, {
          method: 'PUT',
          body: JSON.stringify(editingUnit),
        });
      } else {
        await apiFetch('/restaurant/units', {
          method: 'POST',
          body: JSON.stringify(editingUnit),
        });
      }
      setUnitViewMode('LIST');
      loadAllConfigurations();
      showSuccessFeedback('Unidade gravada com sucesso!');
    } catch (err: any) {
      showErrorFeedback(`Erro ao salvar unidade: ${err.message}`);
    }
  };

  const handleDeleteUnit = async (id: string) => {
    try {
      await apiFetch(`/restaurant/units/${id}`, { method: 'DELETE' });
      loadAllConfigurations();
      showSuccessFeedback('Unidade removida com sucesso!');
      setUnitToDeleteId(null);
    } catch (err: any) {
      showErrorFeedback(`Erro ao remover unidade: ${err.message}`);
    }
  };

  // 3. USUÁRIOS CRUD
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser.id) {
        await apiFetch(`/users/profiles/${editingUser.id}`, {
          method: 'PUT',
          body: JSON.stringify(editingUser),
        });
      } else {
        await apiFetch('/users/profiles', {
          method: 'POST',
          body: JSON.stringify(editingUser),
        });
      }
      setUserViewMode('LIST');
      loadAllConfigurations();
      showSuccessFeedback('Usuário gravado com sucesso!');
    } catch (err: any) {
      showErrorFeedback(`Erro ao salvar usuário: ${err.message}`);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await apiFetch(`/users/profiles/${id}`, { method: 'DELETE' });
      loadAllConfigurations();
      showSuccessFeedback('Usuário removido com sucesso!');
      setUserToDeleteId(null);
    } catch (err: any) {
      showErrorFeedback(`Erro ao excluir usuário: ${err.message}`);
    }
  };

  const handleToggleUserStatus = async (id: string) => {
    try {
      await apiFetch(`/users/profiles/${id}/toggle`, { method: 'PUT' });
      loadAllConfigurations();
      showSuccessFeedback('Status do usuário atualizado!');
    } catch (err: any) {
      showErrorFeedback(`Erro ao alterar status: ${err.message}`);
    }
  };

  // 4. PERMISSÕES RBAC
  const handleSavePermissions = async () => {
    if (!permissionMatrix) return;
    try {
      await apiFetch('/settings/permissions', {
        method: 'PUT',
        body: JSON.stringify(permissionMatrix),
      });
      showSuccessFeedback('Matriz de Permissões RBAC atualizada!');
    } catch (err: any) {
      alert(`Erro ao salvar permissões: ${err.message}`);
    }
  };

  // 5. AUTENTICAÇÃO
  const handleSaveAuthSettings = async () => {
    if (!authSettings) return;
    try {
      await apiFetch('/auth/settings', {
        method: 'POST',
        body: JSON.stringify(authSettings),
      });
      showSuccessFeedback('Configurações de Autenticação salvas!');
    } catch (err: any) {
      alert(`Erro ao salvar autenticação: ${err.message}`);
    }
  };

  // 6. PAGAMENTOS & GATEWAYS
  const handleSaveGateway = async (provider: string, isActive: boolean, creds: any) => {
    try {
      await apiFetch(`/payments/gateways/${provider}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: isActive, credentials: creds }),
      });
      loadAllConfigurations();
      showSuccessFeedback(`Gateway ${provider.toUpperCase()} atualizado!`);
    } catch (err: any) {
      alert(`Erro ao salvar gateway: ${err.message}`);
    }
  };

  // 7. WHATSAPP
  const handleConnectBaileys = async (forceRefresh: boolean = false) => {
    try {
      const conn = await apiFetch<WhatsAppConnection>('/whatsapp/connect', {
        method: 'POST',
        body: JSON.stringify({ provider: 'BAILEYS', status: 'CONNECTING', forceRefresh }),
      });
      setWaConnection(conn);
      showSuccessFeedback('Sessão Baileys iniciada! Leia o QR Code.');
    } catch (err: any) {
      alert(`Erro ao conectar Baileys: ${err.message}`);
    }
  };

  const handleSaveMetaConfig = async () => {
    try {
      const conn = await apiFetch<WhatsAppConnection>('/whatsapp/connect', {
        method: 'POST',
        body: JSON.stringify({
          provider: 'META_CLOUD_API',
          status: 'CONNECTED',
          meta_config: {
            phone_number_id: metaPhoneId,
            business_account_id: metaAccountId,
            access_token: metaToken,
            verify_token: metaVerifyToken,
          },
        }),
      });
      setWaConnection(conn);
      showSuccessFeedback('Credenciais da Meta Cloud API salvas!');
    } catch (err: any) {
      alert(`Erro ao salvar Meta API: ${err.message}`);
    }
  };

  // 8. NOTIFICAÇÕES
  const handleSaveNotifications = async () => {
    if (!notificationSettings) return;
    try {
      await apiFetch('/settings/notifications', {
        method: 'PUT',
        body: JSON.stringify(notificationSettings),
      });
      showSuccessFeedback('Configurações de Notificações salvas!');
    } catch (err: any) {
      alert(`Erro ao salvar notificações: ${err.message}`);
    }
  };

  // 9. ENTREGAS
  const handleSaveDeliverySettings = async () => {
    if (!deliverySettings) return;
    try {
      await apiFetch('/settings/delivery', {
        method: 'PUT',
        body: JSON.stringify(deliverySettings),
      });
      showSuccessFeedback('Regras e Taxas de Entrega salvas!');
    } catch (err: any) {
      alert(`Erro ao salvar entrega: ${err.message}`);
    }
  };

  const handleAddCityRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCity.city_name) return;
    try {
      await apiFetch('/settings/delivery/cities', {
        method: 'POST',
        body: JSON.stringify({ ...newCity, is_active: true }),
      });
      setNewCity({ city_name: '', fee: 5.0, min_order: 20.0, est_minutes: 30 });
      loadAllConfigurations();
      showSuccessFeedback('Taxa por Cidade cadastrada com sucesso!');
    } catch (err: any) {
      alert(`Erro ao adicionar cidade: ${err.message}`);
    }
  };

  const handleDeleteCityRate = async (id: string) => {
    try {
      await apiFetch(`/settings/delivery/cities/${id}`, { method: 'DELETE' });
      loadAllConfigurations();
      showSuccessFeedback('Taxa de cidade removida!');
    } catch (err: any) {
      alert(`Erro ao excluir taxa: ${err.message}`);
    }
  };

  const handleAddAreaRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArea.area_name) return;
    try {
      await apiFetch('/settings/delivery/areas', {
        method: 'POST',
        body: JSON.stringify({ ...newArea, is_active: true }),
      });
      setNewArea({ area_name: '', city_name: 'São Paulo', fee: 4.0, min_order: 15.0, est_minutes: 25 });
      loadAllConfigurations();
      showSuccessFeedback('Taxa por Bairro/Área cadastrada!');
    } catch (err: any) {
      alert(`Erro ao adicionar área: ${err.message}`);
    }
  };

  const handleDeleteAreaRate = async (id: string) => {
    try {
      await apiFetch(`/settings/delivery/areas/${id}`, { method: 'DELETE' });
      loadAllConfigurations();
      showSuccessFeedback('Taxa de área removida!');
    } catch (err: any) {
      alert(`Erro ao excluir taxa: ${err.message}`);
    }
  };

  // 10. CARDÁPIO
  const handleSaveMenuSettings = async () => {
    if (!menuSettings) return;
    try {
      await apiFetch('/settings/menu', {
        method: 'PUT',
        body: JSON.stringify(menuSettings),
      });
      showSuccessFeedback('Parâmetros do Cardápio salvos!');
    } catch (err: any) {
      alert(`Erro ao salvar cardápio: ${err.message}`);
    }
  };

  // 11. ESTOQUE
  const handleSaveInventorySettings = async () => {
    if (!inventorySettings) return;
    try {
      await apiFetch('/settings/inventory', {
        method: 'PUT',
        body: JSON.stringify(inventorySettings),
      });
      showSuccessFeedback('Parâmetros de Estoque e Ficha Técnica salvos!');
    } catch (err: any) {
      alert(`Erro ao salvar estoque: ${err.message}`);
    }
  };

  // 12. FIDELIDADE
  const handleSaveLoyaltySettings = async () => {
    if (!loyaltySettings) return;
    try {
      await apiFetch('/settings/loyalty', {
        method: 'PUT',
        body: JSON.stringify(loyaltySettings),
      });
      showSuccessFeedback('Programa de Fidelidade e Pontos salvo!');
    } catch (err: any) {
      alert(`Erro ao salvar fidelidade: ${err.message}`);
    }
  };

  // 13. IMPRESSÃO
  const handleSavePrintSettings = async () => {
    if (!printSettings) return;
    try {
      await apiFetch('/settings/print', {
        method: 'PUT',
        body: JSON.stringify(printSettings),
      });
      showSuccessFeedback('Configurações de Impressoras salvas!');
    } catch (err: any) {
      alert(`Erro ao salvar impressão: ${err.message}`);
    }
  };

  const handleAddPrinter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrinter.name) return;
    try {
      await apiFetch('/settings/print/printers', {
        method: 'POST',
        body: JSON.stringify(newPrinter),
      });
      setNewPrinter({ name: '', type: 'KITCHEN', connection: 'NETWORK', ip_address: '192.168.1.200', paper_width: 80, auto_print: true, category_ids: [] });
      loadAllConfigurations();
      showSuccessFeedback('Impressora vinculada com sucesso!');
    } catch (err: any) {
      alert(`Erro ao adicionar impressora: ${err.message}`);
    }
  };

  const handleDeletePrinter = async (id: string) => {
    try {
      await apiFetch(`/settings/print/printers/${id}`, { method: 'DELETE' });
      loadAllConfigurations();
      showSuccessFeedback('Impressora removida!');
    } catch (err: any) {
      alert(`Erro ao remover impressora: ${err.message}`);
    }
  };

  // 14. APARÊNCIA
  const handleSaveAppearanceSettings = async () => {
    if (!appearanceSettings) return;
    try {
      await apiFetch('/settings/appearance', {
        method: 'PUT',
        body: JSON.stringify(appearanceSettings),
      });
      showSuccessFeedback('Personalização Visual salva com sucesso!');
    } catch (err: any) {
      alert(`Erro ao salvar aparência: ${err.message}`);
    }
  };

  // 16. SEGURANÇA
  const handleSaveSecuritySettings = async () => {
    if (!securitySettings) return;
    try {
      await apiFetch('/settings/security', {
        method: 'PUT',
        body: JSON.stringify(securitySettings),
      });
      showSuccessFeedback('Políticas de Segurança salvas!');
    } catch (err: any) {
      alert(`Erro ao salvar segurança: ${err.message}`);
    }
  };

  // 17. TOTENS
  const handleSaveTotem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTotem.name || !editingTotem.identifier) return;
    try {
      if (editingTotem.id) {
        await apiFetch(`/totems/${editingTotem.id}`, {
          method: 'PUT',
          body: JSON.stringify(editingTotem),
        });
        showSuccessFeedback('Totem atualizado com sucesso!');
      } else {
        await apiFetch('/totems', {
          method: 'POST',
          body: JSON.stringify({
            name: editingTotem.name,
            identifier: editingTotem.identifier,
            unit_id: editingTotem.unit_id || units[0]?.id || '',
            terminal_id: editingTotem.terminal_id || undefined,
            payment_methods_enabled: editingTotem.payment_methods_enabled || { pix: true, card: true, cash: false },
            require_phone: editingTotem.require_phone || false,
            auto_print_receipt: editingTotem.auto_print_receipt !== false,
            auto_reset_seconds: editingTotem.auto_reset_seconds || 30,
            status: 'ONLINE',
            is_active: true,
          }),
        });
        showSuccessFeedback('Novo Totem cadastrado com sucesso!');
      }
      setTotemViewMode('LIST');
      setEditingTotem({});
      loadAllConfigurations();
    } catch (err: any) {
      alert(`Erro ao salvar totem: ${err.message}`);
    }
  };

  const handleDeleteTotem = async (id: string) => {
    try {
      await apiFetch(`/totems/${id}`, { method: 'DELETE' });
      loadAllConfigurations();
      showSuccessFeedback('Totem removido!');
    } catch (err: any) {
      alert(`Erro ao excluir totem: ${err.message}`);
    }
  };

  const handleToggleTotemStatus = async (id: string, current: boolean) => {
    try {
      await apiFetch(`/totems/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !current }),
      });
      loadAllConfigurations();
      showSuccessFeedback('Status do Totem atualizado!');
    } catch (err: any) {
      alert(`Erro ao alterar status: ${err.message}`);
    }
  };

  // MAQUININHAS TERMINAIS POS
  const handleSaveTerminal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTerminal.name || !editingTerminal.external_terminal_id) return;
    try {
      if (editingTerminal.id) {
        await apiFetch(`/terminals/${editingTerminal.id}`, {
          method: 'PUT',
          body: JSON.stringify(editingTerminal),
        });
        showSuccessFeedback('Terminal atualizado com sucesso!');
      } else {
        await apiFetch('/terminals', {
          method: 'POST',
          body: JSON.stringify({
            name: editingTerminal.name,
            model: editingTerminal.model || 'Mercado Pago Point Smart',
            external_terminal_id: editingTerminal.external_terminal_id.trim(),
            provider: 'mercadopago_point',
            unit_id: editingTerminal.unit_id || units[0]?.id || '',
            status: 'CONNECTED',
            last_seen_at: new Date().toISOString(),
          }),
        });
        showSuccessFeedback('Maquininha cadastrada e conectada com sucesso!');
      }
      setTerminalViewMode('LIST');
      setEditingTerminal({});
      loadAllConfigurations();
    } catch (err: any) {
      alert(`Erro ao salvar terminal: ${err.message}`);
    }
  };

  const handleDeleteTerminal = async (id: string) => {
    try {
      await apiFetch(`/terminals/${id}`, { method: 'DELETE' });
      loadAllConfigurations();
      showSuccessFeedback('Terminal removido com sucesso!');
    } catch (err: any) {
      alert(`Erro ao excluir terminal: ${err.message}`);
    }
  };

  const handleScanMercadoPagoTerminals = async () => {
    try {
      const devices = await apiFetch<any[]>('/terminals/mercadopago/scan');
      if (!devices || devices.length === 0) {
        alert('Nenhum terminal encontrado na conta do Mercado Pago configurada ou credenciais ainda não cadastradas.');
      } else {
        showSuccessFeedback(`${devices.length} maquininha(s) encontrada(s) na conta Mercado Pago!`);
      }
    } catch (err: any) {
      alert(`Erro ao escanear maquininhas: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-xs font-bold text-slate-500 flex items-center gap-2">
        <FontAwesomeIcon icon={faRotateRight} className="animate-spin text-amber-500" />
        <span>Carregando Central Completa de Configurações do FoodS...</span>
      </div>
    );
  }

  // 16 Áreas do Menu Obrigatório
  const menuItems = [
    { id: 'loja', label: 'Loja', icon: faStore },
    { id: 'unidades', label: 'Unidades', icon: faBuilding },
    { id: 'usuarios', label: 'Usuários', icon: faUsers },
    { id: 'permissoes', label: 'Permissões', icon: faShieldHalved },
    { id: 'autenticacao', label: 'Autenticação', icon: faKey },
    { id: 'pagamentos', label: 'Pagamentos', icon: faCreditCard },
    { id: 'whatsapp', label: 'WhatsApp', icon: faWhatsapp },
    { id: 'notificacoes', label: 'Notificações', icon: faBell },
    { id: 'entregas', label: 'Entregas', icon: faTruck },
    { id: 'cardapio', label: 'Cardápio', icon: faBookOpen },
    { id: 'estoque', label: 'Estoque', icon: faBoxesStacked },
    { id: 'fidelidade', label: 'Fidelidade', icon: faAward },
    { id: 'impressao', label: 'Impressão', icon: faPrint },
    { id: 'aparencia', label: 'Aparência', icon: faPalette },
    { id: 'integracoes', label: 'Integrações', icon: faGlobe },
    { id: 'seguranca', label: 'Segurança', icon: faLock },
    { id: 'totens', label: 'Totens', icon: faMobileScreen },
  ];

  const infinityGateway = gateways.find(g => g.provider === 'infinitypay') || { is_active: false };
  const mpGateway = gateways.find(g => g.provider === 'mercadopago') || { is_active: false };
  const psGateway = gateways.find(g => g.provider === 'pagseguro') || { is_active: false };
  const spGateway = gateways.find(g => g.provider === 'syncpay') || { is_active: false };
  const cashGateway = gateways.find(g => g.provider === 'cash') || { is_active: true };
  const posGateway = gateways.find(g => g.provider === 'card_pos') || { is_active: true };
  const pixPresGateway = gateways.find(g => g.provider === 'pix_presential') || { is_active: true };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-900">
      
      {/* Toast de Feedback Interno */}
      {savedFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-xs font-bold flex items-center justify-between shadow-2xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faCircleCheck} className="text-emerald-600 w-4 h-4" />
            <span>{savedFeedback}</span>
          </div>
          <button onClick={() => setSavedFeedback(null)} className="text-emerald-600 hover:text-emerald-900">
            <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorFeedback && (
        <div className="p-3 bg-red-50 border border-red-300 text-red-800 rounded-2xl text-xs font-bold flex items-center justify-between shadow-2xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faCircleExclamation} className="text-red-600 w-4 h-4" />
            <span>{errorFeedback}</span>
          </div>
          <button onClick={() => setErrorFeedback(null)} className="text-red-600 hover:text-red-900">
            <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header com Breadcrumb */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            <span>Configurações</span>
            <span>/</span>
            <span className="text-amber-600 capitalize">{activeTab}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <FontAwesomeIcon icon={menuItems.find(m => m.id === activeTab)?.icon || faSliders} className="text-amber-500 w-5 h-5" />
            <span>Configurações do Sistema • {menuItems.find(m => m.id === activeTab)?.label}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Gestão de parâmetros de produção integrados ao PostgreSQL Supabase</p>
        </div>
      </div>

      {/* Grid Principal: Submenu Vertical à Esquerda + Conteúdo Completo à Direita */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* SUBMENU VERTICAL DAS 16 ÁREAS */}
        <div className="bg-white p-3 rounded-3xl border border-slate-200 space-y-1 h-fit shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5">
            Módulos de Configuração
          </p>
          {menuItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setUnitViewMode('LIST');
                  setUserViewMode('LIST');
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <FontAwesomeIcon icon={item.icon} className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* ÁREA DE CONTEÚDO PRINCIPAL (16 PÁGINAS FUNCIONAIS COMPLETAS) */}
        <div className="md:col-span-3 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
          
          {/* ========================================================================= */}
          {/* 1. LOJA */}
          {/* ========================================================================= */}
          {activeTab === 'loja' && org && storeSettings && (
            <form onSubmit={handleSaveStore} className="space-y-6 text-xs">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">Identificação da Empresa & Endereço</h2>
                <p className="text-slate-500 text-[11px]">Dados cadastrais da matriz exibidos no rodapé do comprovante</p>
              </div>

              {/* Identificação */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nome Fantasia *</label>
                  <input
                    type="text"
                    required
                    value={org.name}
                    onChange={(e) => setOrg({ ...org, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Razão Social</label>
                  <input
                    type="text"
                    value={org.legal_name || ''}
                    onChange={(e) => setOrg({ ...org, legal_name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">CNPJ / CPF *</label>
                  <input
                    type="text"
                    value={org.document || ''}
                    onChange={(e) => setOrg({ ...org, document: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Telefone Principal</label>
                  <input
                    type="text"
                    value={storeSettings.phone || ''}
                    onChange={(e) => setStoreSettings({ ...storeSettings, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">WhatsApp de Contato</label>
                  <input
                    type="text"
                    value={storeSettings.whatsapp || ''}
                    onChange={(e) => setStoreSettings({ ...storeSettings, whatsapp: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">E-mail Comercial</label>
                  <input
                    type="email"
                    value={storeSettings.email || ''}
                    onChange={(e) => setStoreSettings({ ...storeSettings, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h3 className="font-bold text-slate-800 text-xs">Endereço da Matriz</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">CEP</label>
                    <input
                      type="text"
                      placeholder="01000-000"
                      value={storeSettings.address_zipcode || ''}
                      onChange={(e) => setStoreSettings({ ...storeSettings, address_zipcode: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">Rua / Avenida</label>
                    <input
                      type="text"
                      placeholder="Av. Paulista"
                      value={storeSettings.address_street || ''}
                      onChange={(e) => setStoreSettings({ ...storeSettings, address_street: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Número</label>
                    <input
                      type="text"
                      placeholder="1000"
                      value={storeSettings.address_number || ''}
                      onChange={(e) => setStoreSettings({ ...storeSettings, address_number: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Bairro</label>
                    <input
                      type="text"
                      placeholder="Bela Vista"
                      value={storeSettings.address_neighborhood || ''}
                      onChange={(e) => setStoreSettings({ ...storeSettings, address_neighborhood: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Cidade / Estado</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="São Paulo"
                        value={storeSettings.address_city || ''}
                        onChange={(e) => setStoreSettings({ ...storeSettings, address_city: e.target.value })}
                        className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                      <input
                        type="text"
                        placeholder="SP"
                        value={storeSettings.address_state || ''}
                        onChange={(e) => setStoreSettings({ ...storeSettings, address_state: e.target.value })}
                        className="w-14 p-2.5 bg-slate-50 border border-slate-200 rounded-xl uppercase font-mono text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Operação e Switches */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h3 className="font-bold text-slate-800 text-xs">Canais de Operação e Pedido Mínimo</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Pedido Mínimo (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={storeSettings.min_order_value}
                      onChange={(e) => setStoreSettings({ ...storeSettings, min_order_value: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tempo Médio de Preparo (minutos)</label>
                    <input
                      type="number"
                      value={storeSettings.avg_prep_time_minutes || 25}
                      onChange={(e) => setStoreSettings({ ...storeSettings, avg_prep_time_minutes: parseInt(e.target.value) || 25 })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <SlideSwitch
                    checked={storeSettings.delivery_enabled}
                    onChange={(val) => setStoreSettings({ ...storeSettings, delivery_enabled: val })}
                    label="Habilitar Serviço de Delivery / Entregas"
                    description="Permite que clientes selecionem endereço e recebam pedidos em domicílio."
                  />
                  <SlideSwitch
                    checked={storeSettings.pickup_enabled}
                    onChange={(val) => setStoreSettings({ ...storeSettings, pickup_enabled: val })}
                    label="Habilitar Retirada no Balcão / Takeaway"
                    description="Permite que clientes façam pedidos online e retirem pessoalmente na loja."
                  />
                  <SlideSwitch
                    checked={storeSettings.table_service_enabled}
                    onChange={(val) => setStoreSettings({ ...storeSettings, table_service_enabled: val })}
                    label="Habilitar Atendimento de Mesas e Comandas"
                    description="Ativa o módulo de garçons e lançamento de consumo presencial."
                  />
                </div>
              </div>

              {/* Horários de Funcionamento por Dia */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h3 className="font-bold text-slate-800 text-xs">Horários de Funcionamento por Dia</h3>
                <div className="space-y-2">
                  {['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'].map((day) => {
                    const dayObj = storeSettings.business_hours?.[day] || { active: true, open: '11:00', close: '23:00' };
                    return (
                      <div key={day} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-bold capitalize w-20 text-slate-800">{day}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${dayObj.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                            {dayObj.active ? 'Aberto' : 'Fechado'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={dayObj.open}
                            onChange={(e) => {
                              const copy = { ...storeSettings.business_hours };
                              copy[day] = { ...dayObj, open: e.target.value };
                              setStoreSettings({ ...storeSettings, business_hours: copy });
                            }}
                            className="p-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                          />
                          <span>às</span>
                          <input
                            type="time"
                            value={dayObj.close}
                            onChange={(e) => {
                              const copy = { ...storeSettings.business_hours };
                              copy[day] = { ...dayObj, close: e.target.value };
                              setStoreSettings({ ...storeSettings, business_hours: copy });
                            }}
                            className="p-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const copy = { ...storeSettings.business_hours };
                              copy[day] = { ...dayObj, active: !dayObj.active };
                              setStoreSettings({ ...storeSettings, business_hours: copy });
                            }}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs ml-2 ${dayObj.active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                          >
                            {dayObj.active ? 'Desativar Dia' : 'Ativar Dia'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-2 shadow-2xs"
                >
                  <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
                  <span>Salvar Dados da Loja</span>
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* 2. UNIDADES */}
          {/* ========================================================================= */}
          {activeTab === 'unidades' && (
            unitViewMode === 'FORM' ? (
              <form onSubmit={handleSaveUnit} className="space-y-6 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      {editingUnit.id ? `Editar Unidade: ${editingUnit.name}` : 'Cadastrar Nova Unidade / Filial'}
                    </h2>
                    <p className="text-slate-500 text-[11px]">Configuração completa de filial sem popups flutuantes</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUnitViewMode('LIST')}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faArrowLeft} className="w-3.5 h-3.5" />
                    <span>Voltar para Unidades</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nome da Filial *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Filial Jardins"
                      value={editingUnit.name || ''}
                      onChange={(e) => setEditingUnit({ ...editingUnit, name: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Slug na URL</label>
                    <input
                      type="text"
                      placeholder="filial-jardins"
                      value={editingUnit.slug || ''}
                      onChange={(e) => setEditingUnit({ ...editingUnit, slug: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Telefone da Filial</label>
                    <input
                      type="text"
                      value={editingUnit.phone || ''}
                      onChange={(e) => setEditingUnit({ ...editingUnit, phone: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">WhatsApp da Filial</label>
                    <input
                      type="text"
                      value={editingUnit.whatsapp || ''}
                      onChange={(e) => setEditingUnit({ ...editingUnit, whatsapp: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Taxa de Entrega Padrão (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingUnit.delivery_fee ?? 5.0}
                      onChange={(e) => setEditingUnit({ ...editingUnit, delivery_fee: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Raio de Entrega (KM)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={editingUnit.delivery_radius_km ?? 5.0}
                      onChange={(e) => setEditingUnit({ ...editingUnit, delivery_radius_km: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setUnitViewMode('LIST')}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-2 shadow-2xs"
                  >
                    <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
                    <span>Salvar Unidade</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Unidades e Filiais Registradas</h2>
                    <p className="text-slate-500 text-[11px]">Gerenciamento de estoque, cardápio e atendimento por unidade</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingUnit({ name: '', slug: '', phone: '', whatsapp: '', delivery_fee: 5.0, delivery_radius_km: 5.0 });
                      setUnitViewMode('FORM');
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-2 shadow-2xs"
                  >
                    <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
                    <span>Nova Unidade</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {units.map((u) => (
                    <div key={u.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 text-sm">{u.name}</p>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                            {u.is_active ? 'Operando' : 'Inativa'}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          {u.address_city || 'São Paulo'} - {u.address_state || 'SP'} • Taxa: {u.delivery_fee ? `R$ ${u.delivery_fee.toFixed(2)}` : 'Grátis'} • Raio: {u.delivery_radius_km}km
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {unitToDeleteId === u.id ? (
                          <div className="flex items-center gap-1.5 bg-red-50 p-1.5 rounded-xl border border-red-200">
                            <span className="text-red-800 font-bold text-[10px]">Excluir?</span>
                            <button
                              onClick={() => handleDeleteUnit(u.id)}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[9px] transition-colors"
                            >
                              Sim
                            </button>
                            <button
                              onClick={() => setUnitToDeleteId(null)}
                              className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold text-[9px] transition-colors"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingUnit(u);
                                setUnitViewMode('FORM');
                              }}
                              className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl"
                              title="Editar Unidade"
                            >
                              <FontAwesomeIcon icon={faPenToSquare} className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setUnitToDeleteId(u.id)}
                              className="p-2 bg-white hover:bg-red-50 border border-slate-200 text-red-500 rounded-xl"
                              title="Excluir Unidade"
                            >
                              <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          {/* ========================================================================= */}
          {/* 3. USUÁRIOS */}
          {/* ========================================================================= */}
          {activeTab === 'usuarios' && (
            userViewMode === 'FORM' ? (
              <form onSubmit={handleSaveUser} className="space-y-6 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      {editingUser.id ? `Editar Membro: ${editingUser.first_name}` : 'Cadastrar Novo Usuário da Equipe'}
                    </h2>
                    <p className="text-slate-500 text-[11px]">Atribuição de papel, unidade de trabalho e acesso ao sistema</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUserViewMode('LIST')}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faArrowLeft} className="w-3.5 h-3.5" />
                    <span>Voltar para Usuários</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nome *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nome"
                      value={editingUser.first_name || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, first_name: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Sobrenome</label>
                    <input
                      type="text"
                      placeholder="Sobrenome"
                      value={editingUser.last_name || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, last_name: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">E-mail de Login *</label>
                    <input
                      type="text"
                      required
                      placeholder="email@foods.com.br"
                      value={editingUser.email || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="(11) 98888-0000"
                      value={editingUser.phone || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Papel / Função RBAC *</label>
                    <select
                      value={editingUser.role || 'operator'}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    >
                      <option value="owner">Proprietário (Owner)</option>
                      <option value="admin">Administrador (Admin)</option>
                      <option value="manager">Gerente (Manager)</option>
                      <option value="coordinator">Coordenador (Coordinator)</option>
                      <option value="waiter">Garçom (Waiter)</option>
                      <option value="operator">Atendente / Operador (Operator)</option>
                      <option value="kitchen">Cozinha / KDS (Kitchen)</option>
                      <option value="financial">Financeiro (Financial)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {editingUser.id ? 'Nova Senha (deixe em branco para manter)' : 'Senha de Acesso *'}
                    </label>
                    <input
                      type="password"
                      placeholder={editingUser.id ? 'Manter senha atual' : 'Defina a senha do usuário'}
                      value={(editingUser as any).password || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value } as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setUserViewMode('LIST')}
                    className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-2 shadow-2xs"
                  >
                    <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
                    <span>Salvar Usuário</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Membros da Equipe</h2>
                    <p className="text-slate-500 text-[11px]">Gerenciamento de acessos administrativos e operacionais</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingUser({ first_name: '', last_name: '', email: '', phone: '', role: 'operator' });
                      setUserViewMode('FORM');
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-2 shadow-2xs"
                  >
                    <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
                    <span>Novo Usuário</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {profiles.map((p) => (
                    <div key={p.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center">
                          {p.first_name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{p.first_name} {p.last_name}</p>
                          <p className="text-[11px] text-slate-500">{p.email} {p.phone ? `• ${p.phone}` : ''}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {userToDeleteId === p.id ? (
                          <div className="flex items-center gap-1.5 bg-red-50 p-1.5 rounded-xl border border-red-200">
                            <span className="text-red-800 font-bold text-[10px]">Excluir?</span>
                            <button
                              onClick={() => handleDeleteUser(p.id)}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[9px] transition-colors"
                            >
                              Sim
                            </button>
                            <button
                              onClick={() => setUserToDeleteId(null)}
                              className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold text-[9px] transition-colors"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px] capitalize">
                              {p.role}
                            </span>
                            <button
                              onClick={() => handleToggleUserStatus(p.id)}
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${p.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}
                            >
                              {p.status === 'active' ? 'Ativo' : 'Inativo'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingUser(p);
                                setUserViewMode('FORM');
                              }}
                              className="p-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100"
                              title="Editar"
                            >
                              <FontAwesomeIcon icon={faPenToSquare} className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setUserToDeleteId(p.id)}
                              className="p-1.5 bg-white border border-slate-200 text-red-500 rounded-lg hover:bg-red-50"
                              title="Excluir"
                            >
                              <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          {/* ========================================================================= */}
          {/* 4. PERMISSÕES RBAC */}
          {/* ========================================================================= */}
          {activeTab === 'permissoes' && permissionMatrix && (
            <div className="space-y-6 text-xs">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">Matriz de Permissões e Acessos (RBAC Real)</h2>
                <p className="text-slate-500 text-[11px]">Configure privilégios específicos para cada uma das 8 funções do sistema</p>
              </div>

              <div className="space-y-4 overflow-x-auto">
                {(['owner', 'admin', 'manager', 'coordinator', 'waiter', 'operator', 'kitchen', 'financial'] as UserRole[]).map((role) => {
                  const perm = permissionMatrix.role_permissions[role];
                  return (
                    <div key={role} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="font-bold text-slate-900 uppercase text-xs tracking-wider">
                          Função: {role}
                        </span>
                        <span className="text-[10px] text-slate-500">Privilégios no Supabase</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                          <input
                            type="checkbox"
                            checked={perm?.dashboard_view}
                            onChange={(e) => {
                              const copy = { ...permissionMatrix };
                              copy.role_permissions[role].dashboard_view = e.target.checked;
                              setPermissionMatrix(copy);
                            }}
                            className="rounded text-amber-500"
                          />
                          <span>Ver Dashboard</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                          <input
                            type="checkbox"
                            checked={perm?.orders_create}
                            onChange={(e) => {
                              const copy = { ...permissionMatrix };
                              copy.role_permissions[role].orders_create = e.target.checked;
                              setPermissionMatrix(copy);
                            }}
                            className="rounded text-amber-500"
                          />
                          <span>Criar Pedidos</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                          <input
                            type="checkbox"
                            checked={perm?.products_delete}
                            onChange={(e) => {
                              const copy = { ...permissionMatrix };
                              copy.role_permissions[role].products_delete = e.target.checked;
                              setPermissionMatrix(copy);
                            }}
                            className="rounded text-amber-500"
                          />
                          <span>Excluir Produtos</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                          <input
                            type="checkbox"
                            checked={perm?.financial_edit}
                            onChange={(e) => {
                              const copy = { ...permissionMatrix };
                              copy.role_permissions[role].financial_edit = e.target.checked;
                              setPermissionMatrix(copy);
                            }}
                            className="rounded text-amber-500"
                          />
                          <span>Editar Financeiro</span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  onClick={handleSavePermissions}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-2 shadow-2xs"
                >
                  <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
                  <span>Salvar Matriz RBAC</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. AUTENTICAÇÃO */}
          {/* ========================================================================= */}
          {activeTab === 'autenticacao' && authSettings && (
            <div className="space-y-6 text-xs">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">Configurações de Autenticação & Google OAuth</h2>
                <p className="text-slate-500 text-[11px]">Gerenciamento de login seguro via Supabase Auth</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <SlideSwitch
                    checked={authSettings.google_oauth_enabled}
                    onChange={(val) => setAuthSettings({ ...authSettings, google_oauth_enabled: val })}
                    label="Login com Google (Google OAuth)"
                    description="Exibe o botão 'Continuar com Google' na tela de login /login e no cardápio online."
                  />
                  <div className="text-[11px] text-slate-500 bg-white p-3 rounded-xl border border-slate-200">
                    <p className="font-bold text-slate-800 flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faLock} className="text-amber-500" />
                      <span>Armazenamento Seguro de Credenciais:</span>
                    </p>
                    <p className="mt-1">
                      As credenciais do Google OAuth (Client ID e Client Secret) são gerenciadas exclusivamente no ambiente seguro do backend e do Supabase Auth, sem expor chaves no navegador.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <SlideSwitch
                    checked={authSettings.email_auth_enabled}
                    onChange={(val) => setAuthSettings({ ...authSettings, email_auth_enabled: val })}
                    label="Autenticação por E-mail e Senha"
                    description="Permite login com e-mail cadastrado e senha criptografada."
                  />
                  <SlideSwitch
                    checked={authSettings.require_email_verification}
                    onChange={(val) => setAuthSettings({ ...authSettings, require_email_verification: val })}
                    label="Exigir Verificação de E-mail para Novos Membros"
                    description="Envia link de confirmação do Supabase antes de permitir acesso."
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  onClick={handleSaveAuthSettings}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-2 shadow-2xs"
                >
                  <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
                  <span>Salvar Configurações de Login</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 6. PAGAMENTOS */}
          {/* ========================================================================= */}
          {activeTab === 'pagamentos' && (
            <div className="space-y-6 text-xs">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">Gateways de Pagamento & Métodos Presenciais</h2>
                <p className="text-slate-500 text-[11px]">Configure provedores oficiais online e recebimentos no balcão</p>
              </div>

              {/* Submenu de Provedores */}
              <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-slate-100">
                {[
                  { id: 'overview', label: 'Visão Geral' },
                  { id: 'infinitypay', label: 'InfinityPay' },
                  { id: 'mercadopago', label: 'Mercado Pago' },
                  { id: 'pagseguro', label: 'PagSeguro' },
                  { id: 'syncpay', label: 'Sync Pay' },
                  { id: 'presencial', label: 'Presencial (Caixa/POS)' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setPaymentSubTab(tab.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      paymentSubTab === tab.id ? 'bg-amber-500 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Visão Geral */}
              {paymentSubTab === 'overview' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { name: 'InfinityPay', is_active: infinityGateway.is_active, desc: 'PIX e Checkout com Infinity Handle' },
                    { name: 'Mercado Pago', is_active: mpGateway.is_active, desc: 'PIX e Cartão com Public/Access Key' },
                    { name: 'PagSeguro', is_active: psGateway.is_active, desc: 'Checkout Transparente e PIX' },
                    { name: 'Sync Pay', is_active: spGateway.is_active, desc: 'API Gateway de Pagamentos' },
                    { name: 'Dinheiro na Entrega / Caixa', is_active: cashGateway.is_active, desc: 'Presencial balcão e delivery' },
                    { name: 'Cartão na Maquininha (POS)', is_active: posGateway.is_active, desc: 'Presencial balcão' },
                    { name: 'PIX Presencial (Placa QR)', is_active: pixPresGateway.is_active, desc: 'Presencial balcão' },
                  ].map((g, i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{g.name}</p>
                        <p className="text-[11px] text-slate-500">{g.desc}</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${g.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                        {g.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* InfinityPay */}
              {paymentSubTab === 'infinitypay' && (
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">InfinityPay — Integração Oficial</h3>
                      <p className="text-slate-500 text-[11px]">Utiliza o Infinity Handle oficial do restaurante</p>
                    </div>
                    <SlideSwitch
                      checked={infinityGateway.is_active}
                      onChange={(act) => handleSaveGateway('infinitypay', act, { handle: infinityHandle })}
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Infinity Handle *</label>
                    <input
                      type="text"
                      placeholder="ex: restaurante_foods"
                      value={infinityHandle}
                      onChange={(e) => setInfinityHandle(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Identificador exclusivo para checkout e PIX da InfinityPay.</p>
                  </div>

                  <button
                    onClick={() => handleSaveGateway('infinitypay', infinityGateway.is_active, { handle: infinityHandle })}
                    className="px-5 py-2.5 bg-amber-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-2xs"
                  >
                    <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
                    <span>Salvar InfinityPay</span>
                  </button>
                </div>
              )}

              {/* Mercado Pago */}
              {paymentSubTab === 'mercadopago' && (
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-bold text-slate-900 text-sm">Mercado Pago</h3>
                    <SlideSwitch
                      checked={mpGateway.is_active}
                      onChange={(act) => handleSaveGateway('mercadopago', act, { public_key: mpPublicKey, access_token: mpAccessToken, environment: mpEnv })}
                    />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Public Key *</label>
                      <input
                        type="text"
                        placeholder="APP_USR-..."
                        value={mpPublicKey}
                        onChange={(e) => setMpPublicKey(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Access Token *</label>
                      <input
                        type="password"
                        placeholder="APP_USR-..."
                        value={mpAccessToken}
                        onChange={(e) => setMpAccessToken(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Ambiente</label>
                      <select
                        value={mpEnv}
                        onChange={(e) => setMpEnv(e.target.value as any)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold"
                      >
                        <option value="production">Produção (Live)</option>
                        <option value="sandbox">Sandbox (Testes)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSaveGateway('mercadopago', mpGateway.is_active, { public_key: mpPublicKey, access_token: mpAccessToken, environment: mpEnv })}
                    className="px-5 py-2.5 bg-amber-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-2xs"
                  >
                    <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
                    <span>Salvar Mercado Pago</span>
                  </button>
                </div>
              )}

              {/* PagSeguro */}
              {paymentSubTab === 'pagseguro' && (
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-bold text-slate-900 text-sm">PagSeguro</h3>
                    <SlideSwitch
                      checked={psGateway.is_active}
                      onChange={(act) => handleSaveGateway('pagseguro', act, { email: psEmail, token: psToken })}
                    />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">E-mail da Conta PagSeguro *</label>
                      <input
                        type="email"
                        value={psEmail}
                        onChange={(e) => setPsEmail(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Token de Segurança *</label>
                      <input
                        type="password"
                        value={psToken}
                        onChange={(e) => setPsToken(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleSaveGateway('pagseguro', psGateway.is_active, { email: psEmail, token: psToken })}
                    className="px-5 py-2.5 bg-amber-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-2xs"
                  >
                    <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
                    <span>Salvar PagSeguro</span>
                  </button>
                </div>
              )}

              {/* Sync Pay */}
              {paymentSubTab === 'syncpay' && (
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-bold text-slate-900 text-sm">Sync Pay</h3>
                    <SlideSwitch
                      checked={spGateway.is_active}
                      onChange={(act) => handleSaveGateway('syncpay', act, { api_key: syncKey })}
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">API Key do Sync Pay *</label>
                    <input
                      type="password"
                      value={syncKey}
                      onChange={(e) => setSyncKey(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono"
                    />
                  </div>

                  <button
                    onClick={() => handleSaveGateway('syncpay', spGateway.is_active, { api_key: syncKey })}
                    className="px-5 py-2.5 bg-amber-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-2xs"
                  >
                    <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
                    <span>Salvar Sync Pay</span>
                  </button>
                </div>
              )}

              {/* Presencial & Maquininhas */}
              {paymentSubTab === 'presencial' && (
                <div className="space-y-6">
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <h3 className="font-bold text-slate-900 text-sm border-b pb-2">Métodos Presenciais de Balcão e POS</h3>
                    <SlideSwitch
                      checked={cashGateway.is_active}
                      onChange={(val) => handleSaveGateway('cash', val, {})}
                      label="Dinheiro Físico / Troco"
                      description="Disponibiliza pagamento em dinheiro no POS e entrega."
                    />
                    <SlideSwitch
                      checked={posGateway.is_active}
                      onChange={(val) => handleSaveGateway('card_pos', val, {})}
                      label="Cartão na Maquininha (Crédito / Débito)"
                      description="Disponibiliza passagem de cartão na maquininha do estabelecimento."
                    />
                    <SlideSwitch
                      checked={pixPresGateway.is_active}
                      onChange={(val) => handleSaveGateway('pix_presential', val, {})}
                      label="PIX Presencial (QR Code no Balcão)"
                      description="Disponibiliza QR Code físico impresso para leitura do cliente no balcão."
                    />
                  </div>

                  {/* Gerenciamento de Maquininhas Físicas POS */}
                  <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">Maquininhas de Cartão POS (Mercado Pago Point)</h3>
                        <p className="text-slate-500 text-[11px]">Terminais físicos vinculados aos Totens e Caixas para cobrança presencial</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleScanMercadoPagoTerminals}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 text-[11px]"
                        >
                          <FontAwesomeIcon icon={faRotateRight} />
                          <span>Escanear Conta Mercado Pago</span>
                        </button>

                        <button
                          onClick={() => {
                            setEditingTerminal({ name: '', model: 'Mercado Pago Point Smart', external_terminal_id: '', unit_id: units[0]?.id || '' });
                            setTerminalViewMode('FORM');
                          }}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-1.5 text-[11px] shadow-2xs"
                        >
                          <FontAwesomeIcon icon={faPlus} />
                          <span>Nova Maquininha</span>
                        </button>
                      </div>
                    </div>

                    {terminalViewMode === 'FORM' ? (
                      <form onSubmit={handleSaveTerminal} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <h4 className="font-bold text-slate-800 text-xs">Cadastrar Terminal Físico POS</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Nome do Terminal *</label>
                            <input
                              type="text"
                              placeholder="Ex: Maquininha Totem 01"
                              value={editingTerminal.name || ''}
                              onChange={(e) => setEditingTerminal({ ...editingTerminal, name: e.target.value })}
                              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl"
                              required
                            />
                          </div>
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Modelo do Terminal</label>
                            <select
                              value={editingTerminal.model || 'Mercado Pago Point Smart'}
                              onChange={(e) => setEditingTerminal({ ...editingTerminal, model: e.target.value })}
                              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold"
                            >
                              <option value="Mercado Pago Point Smart">Mercado Pago Point Smart (Android)</option>
                              <option value="Mercado Pago Point Pro 2">Mercado Pago Point Pro 2</option>
                              <option value="Mercado Pago Point Air">Mercado Pago Point Air</option>
                              <option value="Outro Terminal POS">Outro Terminal POS Integrado</option>
                            </select>
                          </div>
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Device ID Oficial (Mercado Pago) *</label>
                            <input
                              type="text"
                              placeholder="Ex: PAX_A910__12345678"
                              value={editingTerminal.external_terminal_id || ''}
                              onChange={(e) => setEditingTerminal({ ...editingTerminal, external_terminal_id: e.target.value })}
                              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono"
                              required
                            />
                            <p className="text-[10px] text-slate-400 mt-0.5">Identificador do terminal obtido na API do Mercado Pago Point.</p>
                          </div>
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Unidade / Filial</label>
                            <select
                              value={editingTerminal.unit_id || ''}
                              onChange={(e) => setEditingTerminal({ ...editingTerminal, unit_id: e.target.value })}
                              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl"
                            >
                              {units.map((u) => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t">
                          <button
                            type="button"
                            onClick={() => setTerminalViewMode('LIST')}
                            className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 bg-amber-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-2xs"
                          >
                            <FontAwesomeIcon icon={faFloppyDisk} />
                            <span>Salvar Maquininha</span>
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-2">
                        {paymentTerminals.length === 0 ? (
                          <div className="text-center py-6 text-slate-400">
                            <p>Nenhuma maquininha POS cadastrada.</p>
                            <p className="text-[11px] mt-1">Clique em "Nova Maquininha" para conectar seu terminal físico Mercado Pago Point.</p>
                          </div>
                        ) : (
                          paymentTerminals.map((term) => (
                            <div key={term.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                  <FontAwesomeIcon icon={faCreditCard} />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900">{term.name} • {term.model}</p>
                                  <p className="text-[11px] font-mono text-slate-500">Device ID: {term.external_terminal_id} {term.last_seen_at ? `• Última Comunicação: ${new Date(term.last_seen_at).toLocaleTimeString()}` : ''}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${term.status === 'CONNECTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                                  {term.status === 'CONNECTED' ? 'Conectada' : term.status === 'PROCESSING' ? 'Processando' : 'Desconectada'}
                                </span>
                                <button
                                  onClick={() => handleDeleteTerminal(term.id)}
                                  className="p-1.5 bg-white border border-slate-200 text-red-500 rounded-lg hover:bg-red-50"
                                  title="Excluir Maquininha"
                                >
                                  <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 7. WHATSAPP */}
          {/* ========================================================================= */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-6 text-xs">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">WhatsApp Engine — Baileys & Meta Cloud API</h2>
                <p className="text-slate-500 text-[11px]">Conexão real via QR Code ou API oficial da Meta</p>
              </div>

              {/* Conexão Baileys com QR Code Real */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${waConnection?.status === 'CONNECTED' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                    <span className="font-bold text-slate-900 text-sm">
                      Baileys WhatsApp: {waConnection?.status === 'CONNECTED' ? 'Conectado e Operando' : 'Aguardando Leitura'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleConnectBaileys(true)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-2 shadow-2xs"
                  >
                    <FontAwesomeIcon icon={faRotateRight} className="w-3.5 h-3.5" />
                    <span>Gerar Novo QR Code Real</span>
                  </button>
                </div>

                {waConnection?.status === 'CONNECTED' ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-emerald-900 font-bold">
                    <p className="text-sm">✓ Dispositivo Conectado com Sucesso!</p>
                    <p className="text-xs font-mono">Número Conectado: {waConnection.phone_number}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
                    <div className="w-48 h-48 bg-white border border-slate-300 p-2 rounded-xl flex items-center justify-center">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(waConnection?.qrPayload || 'FOODS_BAILEYS_SOCKET_CONNECT')}`}
                        alt="WhatsApp QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="font-bold text-slate-800">Abra o WhatsApp → Aparelhos Conectados → Conectar um Aparelho</p>
                  </div>
                )}
              </div>

              {/* Meta Cloud API */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="font-bold text-slate-900 text-sm border-b pb-2">Meta WhatsApp Cloud API (Oficial)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Phone Number ID</label>
                    <input
                      type="text"
                      value={metaPhoneId}
                      onChange={(e) => setMetaPhoneId(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">WhatsApp Business Account ID</label>
                    <input
                      type="text"
                      value={metaAccountId}
                      onChange={(e) => setMetaAccountId(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">Permanent Access Token</label>
                    <input
                      type="password"
                      value={metaToken}
                      onChange={(e) => setMetaToken(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveMetaConfig}
                  className="px-5 py-2.5 bg-amber-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-2xs"
                >
                  <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
                  <span>Salvar Meta Cloud API</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 8. NOTIFICAÇÕES */}
          {/* ========================================================================= */}
          {activeTab === 'notificacoes' && notificationSettings && (
            <div className="space-y-6 text-xs">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">Disparos de Notificação em Tempo Real</h2>
                <p className="text-slate-500 text-[11px]">Automação de mensagens de WhatsApp para clientes e alertas internos</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <h3 className="font-bold text-slate-900 text-xs mb-2">Eventos de Pedido via WhatsApp ao Cliente</h3>
                  <SlideSwitch
                    checked={notificationSettings.whatsapp_events.order_received}
                    onChange={(val) => setNotificationSettings({ ...notificationSettings, whatsapp_events: { ...notificationSettings.whatsapp_events, order_received: val } })}
                    label="Disparar quando Pedido for Recebido"
                  />
                  <SlideSwitch
                    checked={notificationSettings.whatsapp_events.order_confirmed}
                    onChange={(val) => setNotificationSettings({ ...notificationSettings, whatsapp_events: { ...notificationSettings.whatsapp_events, order_confirmed: val } })}
                    label="Disparar quando Pedido for Confirmado"
                  />
                  <SlideSwitch
                    checked={notificationSettings.whatsapp_events.order_preparing}
                    onChange={(val) => setNotificationSettings({ ...notificationSettings, whatsapp_events: { ...notificationSettings.whatsapp_events, order_preparing: val } })}
                    label="Disparar quando Pedido entrar Em Preparo (Cozinha)"
                  />
                  <SlideSwitch
                    checked={notificationSettings.whatsapp_events.order_ready}
                    onChange={(val) => setNotificationSettings({ ...notificationSettings, whatsapp_events: { ...notificationSettings.whatsapp_events, order_ready: val } })}
                    label="Disparar quando Pedido estiver Pronto"
                  />
                  <SlideSwitch
                    checked={notificationSettings.whatsapp_events.order_out_for_delivery}
                    onChange={(val) => setNotificationSettings({ ...notificationSettings, whatsapp_events: { ...notificationSettings.whatsapp_events, order_out_for_delivery: val } })}
                    label="Disparar quando Pedido Sair para Entrega (com Entregador)"
                  />
                  <SlideSwitch
                    checked={notificationSettings.whatsapp_events.order_delivered}
                    onChange={(val) => setNotificationSettings({ ...notificationSettings, whatsapp_events: { ...notificationSettings.whatsapp_events, order_delivered: val } })}
                    label="Disparar quando Pedido for Entregue com Sucesso"
                  />
                  <SlideSwitch
                    checked={notificationSettings.whatsapp_events.order_cancelled}
                    onChange={(val) => setNotificationSettings({ ...notificationSettings, whatsapp_events: { ...notificationSettings.whatsapp_events, order_cancelled: val } })}
                    label="Disparar quando Pedido for Cancelado"
                  />
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <h3 className="font-bold text-slate-900 text-xs mb-2">Alertas Internos do Sistema FoodS</h3>
                  <SlideSwitch
                    checked={notificationSettings.system_events.order_created}
                    onChange={(val) => setNotificationSettings({ ...notificationSettings, system_events: { ...notificationSettings.system_events, order_created: val } })}
                    label="Avisar no Painel quando Novo Pedido Chegar"
                  />
                  <SlideSwitch
                    checked={notificationSettings.system_events.stock_alert}
                    onChange={(val) => setNotificationSettings({ ...notificationSettings, system_events: { ...notificationSettings.system_events, stock_alert: val } })}
                    label="Avisar no Painel quando Insumo Atingir Estoque Crítico"
                  />
                  <SlideSwitch
                    checked={notificationSettings.system_events.payment_received}
                    onChange={(val) => setNotificationSettings({ ...notificationSettings, system_events: { ...notificationSettings.system_events, payment_received: val } })}
                    label="Avisar no Painel quando Pagamento for Confirmado"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  onClick={handleSaveNotifications}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-2 shadow-2xs"
                >
                  <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
                  <span>Salvar Regras de Notificação</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 9. ENTREGAS */}
          {/* ========================================================================= */}
          {activeTab === 'entregas' && deliverySettings && (
            <div className="space-y-6 text-xs">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">Taxas e Zonas de Entrega (Delivery)</h2>
                <p className="text-slate-500 text-[11px]">Gerenciamento por taxa fixa, taxas por município ou taxas por bairro</p>
              </div>

              {/* Modo de Cobrança */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <label className="font-bold text-slate-700 block">Modo de Cálculo da Taxa de Entrega:</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'FLAT', label: 'Taxa Única Fixa' },
                    { id: 'CITY', label: 'Taxa por Cidade' },
                    { id: 'AREA', label: 'Taxa por Bairro / Zona' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setDeliverySettings({ ...deliverySettings, mode: m.id as any })}
                      className={`p-3 rounded-xl font-bold border transition-all text-center ${
                        deliverySettings.mode === m.id ? 'bg-amber-500 text-white border-amber-500 shadow-2xs' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {deliverySettings.mode === 'FLAT' && (
                  <div className="grid grid-cols-3 gap-3 pt-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Taxa Fixa (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={deliverySettings.flat_fee}
                        onChange={(e) => setDeliverySettings({ ...deliverySettings, flat_fee: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Pedido Mínimo (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={deliverySettings.flat_min_order}
                        onChange={(e) => setDeliverySettings({ ...deliverySettings, flat_min_order: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Tempo Estimado (min)</label>
                      <input
                        type="number"
                        value={deliverySettings.flat_est_minutes}
                        onChange={(e) => setDeliverySettings({ ...deliverySettings, flat_est_minutes: parseInt(e.target.value) || 30 })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* CRUD de Cidades */}
              {deliverySettings.mode === 'CITY' && (
                <div className="space-y-4">
                  <form onSubmit={handleAddCityRate} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <h3 className="font-bold text-slate-900 text-xs">Cadastrar Taxa por Cidade</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <input
                        type="text"
                        required
                        placeholder="Nome da Cidade"
                        value={newCity.city_name}
                        onChange={(e) => setNewCity({ ...newCity, city_name: e.target.value })}
                        className="p-2.5 bg-white border rounded-xl"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Taxa (R$)"
                        value={newCity.fee}
                        onChange={(e) => setNewCity({ ...newCity, fee: parseFloat(e.target.value) || 0 })}
                        className="p-2.5 bg-white border rounded-xl font-mono font-bold"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Ped. Mínimo"
                        value={newCity.min_order}
                        onChange={(e) => setNewCity({ ...newCity, min_order: parseFloat(e.target.value) || 0 })}
                        className="p-2.5 bg-white border rounded-xl font-mono"
                      />
                      <button type="submit" className="px-4 py-2.5 bg-amber-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-2xs">
                        <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
                        <span>Adicionar Cidade</span>
                      </button>
                    </div>
                  </form>

                  <div className="space-y-2">
                    {deliverySettings.cities.map((c) => (
                      <div key={c.id} className="p-3.5 bg-slate-50 rounded-2xl border flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900">{c.city_name}</p>
                          <p className="text-[11px] text-slate-500">Taxa: R$ {c.fee.toFixed(2)} • Mínimo: R$ {c.min_order.toFixed(2)} • {c.est_minutes} min</p>
                        </div>
                        <button onClick={() => handleDeleteCityRate(c.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl">
                          <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CRUD de Áreas / Bairros */}
              {deliverySettings.mode === 'AREA' && (
                <div className="space-y-4">
                  <form onSubmit={handleAddAreaRate} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <h3 className="font-bold text-slate-900 text-xs">Cadastrar Taxa por Bairro / Área</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <input
                        type="text"
                        required
                        placeholder="Bairro / Área"
                        value={newArea.area_name}
                        onChange={(e) => setNewArea({ ...newArea, area_name: e.target.value })}
                        className="p-2.5 bg-white border rounded-xl"
                      />
                      <input
                        type="text"
                        placeholder="Cidade"
                        value={newArea.city_name}
                        onChange={(e) => setNewArea({ ...newArea, city_name: e.target.value })}
                        className="p-2.5 bg-white border rounded-xl"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Taxa (R$)"
                        value={newArea.fee}
                        onChange={(e) => setNewArea({ ...newArea, fee: parseFloat(e.target.value) || 0 })}
                        className="p-2.5 bg-white border rounded-xl font-mono font-bold"
                      />
                      <button type="submit" className="px-4 py-2.5 bg-amber-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-2xs">
                        <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
                        <span>Adicionar Bairro</span>
                      </button>
                    </div>
                  </form>

                  <div className="space-y-2">
                    {deliverySettings.areas.map((a) => (
                      <div key={a.id} className="p-3.5 bg-slate-50 rounded-2xl border flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900">{a.area_name} ({a.city_name})</p>
                          <p className="text-[11px] text-slate-500">Taxa: R$ {a.fee.toFixed(2)} • Mínimo: R$ {a.min_order.toFixed(2)}</p>
                        </div>
                        <button onClick={() => handleDeleteAreaRate(a.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl">
                          <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  onClick={handleSaveDeliverySettings}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-2 shadow-2xs"
                >
                  <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
                  <span>Salvar Configurações de Entrega</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 10. CARDÁPIO */}
          {/* ========================================================================= */}
          {activeTab === 'cardapio' && menuSettings && (
            <div className="space-y-6 text-xs">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">Parâmetros do Cardápio & Canais de Venda</h2>
                <p className="text-slate-500 text-[11px]">Controle de disponibilidade no Cardápio Online, Frente de Caixa (POS) e Totem</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <SlideSwitch
                  checked={menuSettings.online_menu_enabled}
                  onChange={(val) => setMenuSettings({ ...menuSettings, online_menu_enabled: val })}
                  label="Cardápio Digital Público Ativo"
                  description="Permite que clientes acessem o cardápio no navegador."
                />
                <SlideSwitch
                  checked={menuSettings.channels.online}
                  onChange={(val) => setMenuSettings({ ...menuSettings, channels: { ...menuSettings.channels, online: val } })}
                  label="Canal: Cardápio Online Ativo"
                />
                <SlideSwitch
                  checked={menuSettings.channels.pos}
                  onChange={(val) => setMenuSettings({ ...menuSettings, channels: { ...menuSettings.channels, pos: val } })}
                  label="Canal: Frente de Caixa (POS) Ativo"
                />
                <SlideSwitch
                  checked={menuSettings.channels.totem}
                  onChange={(val) => setMenuSettings({ ...menuSettings, channels: { ...menuSettings.channels, totem: val } })}
                  label="Canal: Autoatendimento Totem Ativo"
                />
                <SlideSwitch
                  checked={menuSettings.allow_item_notes}
                  onChange={(val) => setMenuSettings({ ...menuSettings, allow_item_notes: val })}
                  label="Permitir Observações Personalizadas por Item"
                  description="Ex: sem cebola, ponto da carne, etc."
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  onClick={handleSaveMenuSettings}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-2 shadow-2xs"
                >
                  <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
                  <span>Salvar Parâmetros do Cardápio</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 11. ESTOQUE */}
          {/* ========================================================================= */}
          {activeTab === 'estoque' && inventorySettings && (
            <div className="space-y-6 text-xs">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">Parâmetros de Estoque & Ficha Técnica Automática</h2>
                <p className="text-slate-500 text-[11px]">Baixa automática de insumos após confirmação de pedidos no KDS</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <SlideSwitch
                  checked={inventorySettings.auto_deduct_on_order}
                  onChange={(val) => setInventorySettings({ ...inventorySettings, auto_deduct_on_order: val })}
                  label="Baixa Automática de Estoque por Ficha Técnica"
                  description="Ao confirmar o pedido na cozinha, os insumos vinculados ao produto têm baixa instantânea no PostgreSQL."
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Percentual de Margem de Alerta (%)</label>
                    <input
                      type="number"
                      value={inventorySettings.alert_threshold_pct}
                      onChange={(e) => setInventorySettings({ ...inventorySettings, alert_threshold_pct: parseInt(e.target.value) || 10 })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Unidade Padrão de Medida</label>
                    <input
                      type="text"
                      value={inventorySettings.default_unit}
                      onChange={(e) => setInventorySettings({ ...inventorySettings, default_unit: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <SlideSwitch
                  checked={inventorySettings.enable_cost_tracking}
                  onChange={(val) => setInventorySettings({ ...inventorySettings, enable_cost_tracking: val })}
                  label="Controle de Custo Médio e CMV"
                  description="Calcula a margem de lucro real de cada prato vendido."
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  onClick={handleSaveInventorySettings}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-2 shadow-2xs"
                >
                  <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
                  <span>Salvar Parâmetros de Estoque</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 12. FIDELIDADE */}
          {/* ========================================================================= */}
          {activeTab === 'fidelidade' && loyaltySettings && (
            <div className="space-y-6 text-xs">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">Programa de Fidelidade & Pontuação de Clientes</h2>
                <p className="text-slate-500 text-[11px]">Acúmulo automático de pontos por consumo e resgate no checkout</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <SlideSwitch
                  checked={loyaltySettings.is_active}
                  onChange={(val) => setLoyaltySettings({ ...loyaltySettings, is_active: val })}
                  label="Programa de Fidelidade Ativo"
                  description="Clientes acumulam pontos a cada pedido faturado."
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Pontos por R$ 1,00 Gasto</label>
                    <input
                      type="number"
                      step="0.1"
                      value={loyaltySettings.points_per_real}
                      onChange={(e) => setLoyaltySettings({ ...loyaltySettings, points_per_real: parseFloat(e.target.value) || 1.0 })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Pontos Mínimos para Resgate</label>
                    <input
                      type="number"
                      value={loyaltySettings.min_points_redemption}
                      onChange={(e) => setLoyaltySettings({ ...loyaltySettings, min_points_redemption: parseInt(e.target.value) || 100 })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Validade dos Pontos (dias)</label>
                    <input
                      type="number"
                      value={loyaltySettings.points_validity_days}
                      onChange={(e) => setLoyaltySettings({ ...loyaltySettings, points_validity_days: parseInt(e.target.value) || 180 })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <SlideSwitch
                  checked={loyaltySettings.allow_coupons}
                  onChange={(val) => setLoyaltySettings({ ...loyaltySettings, allow_coupons: val })}
                  label="Permitir Combinação com Cupons Promocionais"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  onClick={handleSaveLoyaltySettings}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-2 shadow-2xs"
                >
                  <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
                  <span>Salvar Regras de Fidelidade</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 13. IMPRESSÃO */}
          {/* ========================================================================= */}
          {activeTab === 'impressao' && printSettings && (
            <div className="space-y-6 text-xs">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">Impressoras Térmicas & Fichas de Cozinha</h2>
                <p className="text-slate-500 text-[11px]">Roteamento de pedidos por impressora (Cozinha 80mm / Balcão 58mm)</p>
              </div>

              <form onSubmit={handleAddPrinter} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 text-xs">Vincular Nova Impressora Térmica</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Nome da Impressora"
                    value={newPrinter.name}
                    onChange={(e) => setNewPrinter({ ...newPrinter, name: e.target.value })}
                    className="p-2.5 bg-white border rounded-xl"
                  />
                  <select
                    value={newPrinter.type}
                    onChange={(e) => setNewPrinter({ ...newPrinter, type: e.target.value as any })}
                    className="p-2.5 bg-white border rounded-xl font-bold"
                  >
                    <option value="KITCHEN">Cozinha / KDS</option>
                    <option value="CASHIER">Caixa / Balcão</option>
                    <option value="BAR">Bar / Bebidas</option>
                  </select>
                  <input
                    type="text"
                    placeholder="IP (ex: 192.168.1.200)"
                    value={newPrinter.ip_address}
                    onChange={(e) => setNewPrinter({ ...newPrinter, ip_address: e.target.value })}
                    className="p-2.5 bg-white border rounded-xl font-mono"
                  />
                  <button type="submit" className="px-4 py-2.5 bg-amber-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-2xs">
                    <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
                    <span>Adicionar Impressora</span>
                  </button>
                </div>
              </form>

              <div className="space-y-3">
                {printSettings.printers.map((prn) => (
                  <div key={prn.id} className="p-4 bg-slate-50 rounded-2xl border flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 text-sm">{prn.name}</p>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">
                          {prn.type} • {prn.paper_width}mm
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">Conexão: {prn.connection} • IP: {prn.ip_address || 'USB Local'}</p>
                    </div>

                    <button onClick={() => handleDeletePrinter(prn.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl">
                      <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  onClick={handleSavePrintSettings}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-2 shadow-2xs"
                >
                  <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
                  <span>Salvar Configurações de Impressão</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 14. APARÊNCIA */}
          {/* ========================================================================= */}
          {activeTab === 'aparencia' && appearanceSettings && (
            <div className="space-y-6 text-xs">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">Personalização Visual & Logotipo</h2>
                <p className="text-slate-500 text-[11px]">Uploads armazenados no Supabase Storage e definição de cores</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="font-bold text-slate-700 block mb-2">Logotipo do Restaurante</label>
                  <ImageUploader
                    value={appearanceSettings.logo_url || ''}
                    onChange={(url) => setAppearanceSettings({ ...appearanceSettings, logo_url: url })}
                    label="Upload de Logo (Supabase Storage)"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-2">Ícone / Favicon do Sistema</label>
                  <ImageUploader
                    value={appearanceSettings.icon_url || ''}
                    onChange={(url) => setAppearanceSettings({ ...appearanceSettings, icon_url: url })}
                    label="Upload de Ícone (Favicon)"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 text-xs">Paleta de Cores e Tema</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Cor Primária</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={appearanceSettings.primary_color}
                        onChange={(e) => setAppearanceSettings({ ...appearanceSettings, primary_color: e.target.value })}
                        className="w-9 h-9 rounded-xl border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={appearanceSettings.primary_color}
                        onChange={(e) => setAppearanceSettings({ ...appearanceSettings, primary_color: e.target.value })}
                        className="w-24 p-2 bg-white border rounded-xl font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Cor Secundária</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={appearanceSettings.secondary_color}
                        onChange={(e) => setAppearanceSettings({ ...appearanceSettings, secondary_color: e.target.value })}
                        className="w-9 h-9 rounded-xl border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={appearanceSettings.secondary_color}
                        onChange={(e) => setAppearanceSettings({ ...appearanceSettings, secondary_color: e.target.value })}
                        className="w-24 p-2 bg-white border rounded-xl font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Cor de Destaque</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={appearanceSettings.accent_color}
                        onChange={(e) => setAppearanceSettings({ ...appearanceSettings, accent_color: e.target.value })}
                        className="w-9 h-9 rounded-xl border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={appearanceSettings.accent_color}
                        onChange={(e) => setAppearanceSettings({ ...appearanceSettings, accent_color: e.target.value })}
                        className="w-24 p-2 bg-white border rounded-xl font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tema Padrão</label>
                    <select
                      value={appearanceSettings.theme}
                      onChange={(e) => setAppearanceSettings({ ...appearanceSettings, theme: e.target.value as any })}
                      className="w-full p-2 bg-white border rounded-xl font-bold"
                    >
                      <option value="light">Modo Claro (Padrão Oficial)</option>
                      <option value="dark">Modo Escuro (Opcional)</option>
                      <option value="auto">Automático (Sistema)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  onClick={handleSaveAppearanceSettings}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-2 shadow-2xs"
                >
                  <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
                  <span>Salvar Aparência</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 15. INTEGRAÇÕES */}
          {/* ========================================================================= */}
          {activeTab === 'integracoes' && (
            <div className="space-y-6 text-xs">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">Hub Central de Integrações do FoodS</h2>
                <p className="text-slate-500 text-[11px]">Status em tempo real de cada serviço conectado</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'Supabase PostgreSQL', status: 'Conectado', type: 'Banco & RLS', tab: 'seguranca' },
                  { name: 'WhatsApp Baileys Engine', status: waConnection?.status === 'CONNECTED' ? 'Conectado' : 'Aguardando', type: 'Mensagens', tab: 'whatsapp' },
                  { name: 'Meta WhatsApp Cloud API', status: metaPhoneId ? 'Configurado' : 'Pendente', type: 'Mensagens', tab: 'whatsapp' },
                  { name: 'InfinityPay', status: infinityGateway.is_active ? 'Ativo' : 'Inativo', type: 'Gateway de Pagamento', tab: 'pagamentos' },
                  { name: 'Mercado Pago', status: mpGateway.is_active ? 'Ativo' : 'Inativo', type: 'Gateway de Pagamento', tab: 'pagamentos' },
                  { name: 'PagSeguro', status: psGateway.is_active ? 'Ativo' : 'Inativo', type: 'Gateway de Pagamento', tab: 'pagamentos' },
                  { name: 'Sync Pay', status: spGateway.is_active ? 'Ativo' : 'Inativo', type: 'Gateway de Pagamento', tab: 'pagamentos' },
                ].map((integ, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{integ.name}</p>
                      <p className="text-[11px] text-slate-500">{integ.type}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${integ.status === 'Conectado' || integ.status === 'Ativo' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                        {integ.status}
                      </span>
                      <button
                        onClick={() => setActiveTab(integ.tab)}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 text-[11px]"
                      >
                        Configurar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 16. SEGURANÇA */}
          {/* ========================================================================= */}
          {activeTab === 'seguranca' && securitySettings && (
            <div className="space-y-6 text-xs">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">Políticas de Segurança, Sessão e RLS</h2>
                <p className="text-slate-500 text-[11px]">Parâmetros de proteção do PostgreSQL Supabase e auditoria de sessões</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Duração da Sessão (Minutos)</label>
                    <input
                      type="number"
                      value={securitySettings.session_timeout_minutes}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, session_timeout_minutes: parseInt(e.target.value) || 60 })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tentativas Máximas de Login</label>
                    <input
                      type="number"
                      value={securitySettings.max_login_attempts}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, max_login_attempts: parseInt(e.target.value) || 5 })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <SlideSwitch
                  checked={securitySettings.require_strong_password}
                  onChange={(val) => setSecuritySettings({ ...securitySettings, require_strong_password: val })}
                  label="Exigir Senhas Fortes com Letras, Números e Símbolos"
                />
                <SlideSwitch
                  checked={securitySettings.force_2fa}
                  onChange={(val) => setSecuritySettings({ ...securitySettings, force_2fa: val })}
                  label="Autenticação em Duas Etapas Obrigatória (2FA)"
                />
              </div>

              {/* Sessões Ativas */}
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 text-xs">Sessões Ativas Registradas</h3>
                {securitySettings.active_sessions.map((sess) => (
                  <div key={sess.id} className="p-3 bg-slate-50 rounded-2xl border flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{sess.user_name} • {sess.device}</p>
                      <p className="text-[10px] text-slate-500">IP: {sess.ip} • Última Atividade: {sess.last_active}</p>
                    </div>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                      Sessão Ativa
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  onClick={handleSaveSecuritySettings}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-2 shadow-2xs"
                >
                  <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
                  <span>Salvar Políticas de Segurança</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 17. TOTENS DE AUTOATENDIMENTO */}
          {/* ========================================================================= */}
          {activeTab === 'totens' && (
            <div className="space-y-6 text-xs">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Totens de Autoatendimento</h2>
                  <p className="text-slate-500 text-[11px]">Gerencie dispositivos, terminais POS associados e parâmetros de checkout presencial</p>
                </div>

                {totemViewMode === 'LIST' && (
                  <button
                    onClick={() => {
                      setEditingTotem({
                        name: '',
                        identifier: `TOTEM_0${totems.length + 1}`,
                        unit_id: units[0]?.id || '',
                        terminal_id: paymentTerminals[0]?.id || '',
                        payment_methods_enabled: { pix: true, card: true, cash: false },
                        require_phone: false,
                        auto_print_receipt: true,
                        auto_reset_seconds: 30,
                      });
                      setTotemViewMode('FORM');
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-2 shadow-2xs"
                  >
                    <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
                    <span>Novo Totem</span>
                  </button>
                )}
              </div>

              {totemViewMode === 'FORM' ? (
                <form onSubmit={handleSaveTotem} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <h3 className="font-bold text-slate-900 text-sm">
                    {editingTotem.id ? 'Editar Totem de Autoatendimento' : 'Cadastrar Novo Totem'}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Nome do Totem *</label>
                      <input
                        type="text"
                        placeholder="Ex: Totem Entrada Principal"
                        value={editingTotem.name || ''}
                        onChange={(e) => setEditingTotem({ ...editingTotem, name: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Identificador / Código *</label>
                      <input
                        type="text"
                        placeholder="Ex: TOTEM_01"
                        value={editingTotem.identifier || ''}
                        onChange={(e) => setEditingTotem({ ...editingTotem, identifier: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Unidade / Filial</label>
                      <select
                        value={editingTotem.unit_id || ''}
                        onChange={(e) => setEditingTotem({ ...editingTotem, unit_id: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold"
                      >
                        {units.map((u) => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Maquininha de Cartão Vinculada (POS Point)</label>
                      <select
                        value={editingTotem.terminal_id || ''}
                        onChange={(e) => setEditingTotem({ ...editingTotem, terminal_id: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold"
                      >
                        <option value="">Nenhuma maquininha vinculada</option>
                        {paymentTerminals.map((term) => (
                          <option key={term.id} value={term.id}>
                            {term.name} ({term.external_terminal_id})
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 mt-0.5">Terminal físico que receberá as cobranças de cartão deste Totem.</p>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Tempo de Inatividade para Reset (Segundos)</label>
                      <input
                        type="number"
                        value={editingTotem.auto_reset_seconds || 30}
                        onChange={(e) => setEditingTotem({ ...editingTotem, auto_reset_seconds: parseInt(e.target.value) || 30 })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl"
                        min={10}
                        max={300}
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                    <p className="font-bold text-slate-800 text-xs mb-1">Formas de Pagamento Habilitadas no Totem</p>
                    <SlideSwitch
                      checked={editingTotem.payment_methods_enabled?.pix !== false}
                      onChange={(val) => setEditingTotem({
                        ...editingTotem,
                        payment_methods_enabled: { ...editingTotem.payment_methods_enabled, pix: val, card: editingTotem.payment_methods_enabled?.card !== false, cash: !!editingTotem.payment_methods_enabled?.cash }
                      })}
                      label="Pagamento com PIX (Mercado Pago QR Code Real)"
                    />
                    <SlideSwitch
                      checked={editingTotem.payment_methods_enabled?.card !== false}
                      onChange={(val) => setEditingTotem({
                        ...editingTotem,
                        payment_methods_enabled: { ...editingTotem.payment_methods_enabled, card: val, pix: editingTotem.payment_methods_enabled?.pix !== false, cash: !!editingTotem.payment_methods_enabled?.cash }
                      })}
                      label="Pagamento com Cartão na Maquininha POS"
                    />
                    <SlideSwitch
                      checked={!!editingTotem.payment_methods_enabled?.cash}
                      onChange={(val) => setEditingTotem({
                        ...editingTotem,
                        payment_methods_enabled: { ...editingTotem.payment_methods_enabled, cash: val, pix: editingTotem.payment_methods_enabled?.pix !== false, card: editingTotem.payment_methods_enabled?.card !== false }
                      })}
                      label="Permitir Pagamento em Dinheiro (Aguardar confirmação no Caixa)"
                    />
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                    <SlideSwitch
                      checked={!!editingTotem.require_phone}
                      onChange={(val) => setEditingTotem({ ...editingTotem, require_phone: val })}
                      label="Solicitar Telefone do Cliente no Checkout"
                    />
                    <SlideSwitch
                      checked={editingTotem.auto_print_receipt !== false}
                      onChange={(val) => setEditingTotem({ ...editingTotem, auto_print_receipt: val })}
                      label="Imprimir Comprovante / Senha Automaticamente"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => setTotemViewMode('LIST')}
                      className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-2xs"
                    >
                      <FontAwesomeIcon icon={faFloppyDisk} />
                      <span>Salvar Totem</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  {totems.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 border border-slate-200 rounded-2xl p-6 text-slate-400">
                      <FontAwesomeIcon icon={faMobileScreen} className="text-3xl mb-2 text-slate-300" />
                      <p className="font-bold text-slate-700">Nenhum Totem cadastrado</p>
                      <p className="text-[11px] mt-1">Cadastre seu primeiro Totem de autoatendimento para que seus clientes façam pedidos diretamente na loja.</p>
                    </div>
                  ) : (
                    totems.map((totem) => {
                      const linkedTerm = paymentTerminals.find(t => t.id === totem.terminal_id);
                      return (
                        <div key={totem.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg font-bold">
                              <FontAwesomeIcon icon={faMobileScreen} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-900 text-sm">{totem.name}</p>
                                <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-mono font-bold rounded-md text-[10px]">
                                  {totem.identifier}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Maquininha POS: <span className="font-semibold text-slate-700">{linkedTerm ? `${linkedTerm.name} (${linkedTerm.external_terminal_id})` : 'Nenhuma vinculada'}</span> • Reset: {totem.auto_reset_seconds}s
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleTotemStatus(totem.id, totem.is_active)}
                              className={`px-3 py-1 rounded-xl text-xs font-bold ${
                                totem.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {totem.is_active ? 'Ativo' : 'Inativo'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingTotem(totem);
                                setTotemViewMode('FORM');
                              }}
                              className="p-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-100"
                              title="Editar Totem"
                            >
                              <FontAwesomeIcon icon={faPenToSquare} className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTotem(totem.id)}
                              className="p-2 bg-white border border-slate-200 text-red-500 rounded-xl hover:bg-red-50"
                              title="Excluir Totem"
                            >
                              <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
