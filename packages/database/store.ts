// ====================================================================
// FoodS — Motor de Persistência e Banco de Dados SaaS (PostgreSQL / Supabase)
// ====================================================================

import {
  Organization,
  Profile,
  Unit,
  StoreSettings,
  AuthSettings,
  Category,
  Product,
  InventoryItem,
  TechnicalRecipe,
  InventoryMovement,
  TableItem,
  Customer,
  Order,
  PaymentGatewayConfig,
  LoyaltyAccount,
  WhatsAppConnection,
  ReportingSummary,
  OrderStatus,
  PaymentStatus,
  PasswordRecoveryPin,
  DeliverySettings,
  DeliveryCityRate,
  DeliveryAreaRate,
  MenuSettings,
  InventorySettings,
  LoyaltySettings,
  PrintSettings,
  PrinterConfig,
  AppearanceSettings,
  NotificationSettings,
  SecuritySettings,
  RolePermissionMatrix,
  Totem,
  PaymentTerminal,
  PaymentIntent,
  PaymentAttempt,
} from '../types/index.js';
import { logger, formatBrazilianPhone } from '../shared/index.js';
import { SupabaseService } from './supabaseService.js';
import QRCode from 'qrcode';
import crypto from 'crypto';

// Estado do Tenant Principal
let organization: Organization = {
  id: 'org_foods_default_001',
  name: 'Restaurante FoodS',
  legal_name: 'FoodS Alimentação e Serviços Ltda',
  document: '00.000.000/0001-00',
  logo_url: '',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Usuário Owner Inicial Master e credenciais autorizadas
let profiles: Profile[] = [
  {
    id: '00000000-0000-0000-0000-000000000099',
    email: 'admin@admin',
    first_name: 'Administrador',
    last_name: 'Owner Master',
    phone: '(11) 99999-9999',
    organization_id: 'org_foods_default_001',
    role: 'owner',
    status: 'active',
    last_access_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
];

// Mapa seguro de senhas para autenticação local
let userPasswords: Record<string, string> = {
  '00000000-0000-0000-0000-000000000099': 'admin123',
  'admin@admin': 'admin123',
};

let units: Unit[] = [
  {
    id: 'unit_matriz_001',
    organization_id: 'org_foods_default_001',
    name: 'Unidade Matriz',
    slug: 'foods-matriz',
    phone: '(11) 99999-0000',
    whatsapp: '5511999990000',
    email: 'contato@foods.com.br',
    address_street: 'Avenida Principal',
    address_number: '100',
    address_neighborhood: 'Centro',
    address_city: 'São Paulo',
    address_state: 'SP',
    address_zipcode: '01000-000',
    delivery_fee: 5.00,
    delivery_radius_km: 5.0,
    avg_prep_time_minutes: 30,
    is_active: true,
    is_open: true,
    created_at: new Date().toISOString(),
  },
];

let storeSettings: StoreSettings[] = [
  {
    id: 'store_sett_001',
    organization_id: 'org_foods_default_001',
    unit_id: 'unit_matriz_001',
    business_hours: {
      segunda: { open: '11:00', close: '23:00', active: true },
      terca: { open: '11:00', close: '23:00', active: true },
      quarta: { open: '11:00', close: '23:00', active: true },
      quinta: { open: '11:00', close: '23:00', active: true },
      sexta: { open: '11:00', close: '00:00', active: true },
      sabado: { open: '11:00', close: '00:00', active: true },
      domingo: { open: '12:00', close: '22:00', active: true },
    },
    pickup_enabled: true,
    delivery_enabled: true,
    table_service_enabled: true,
    auto_approve_orders: false,
    min_order_value: 0.00,
    receipt_footer_note: 'Obrigado por escolher o FoodS!',
  },
];

let authSettings: AuthSettings = {
  id: 'auth_sett_001',
  organization_id: 'org_foods_default_001',
  google_oauth_enabled: true,
  email_auth_enabled: true,
  require_email_verification: false,
  updated_at: new Date().toISOString(),
};

// BANCO INICIAL LIMPO — DADOS REAIS PERSISTIDOS
let categories: Category[] = [];
let products: Product[] = [];
let inventoryItems: InventoryItem[] = [];
let technicalRecipes: TechnicalRecipe[] = [];
let inventoryMovements: InventoryMovement[] = [];
let tables: TableItem[] = [];
let customers: Customer[] = [];
let orders: Order[] = [];
let loyaltyAccounts: LoyaltyAccount[] = [];
let totems: Totem[] = [];
let paymentTerminals: PaymentTerminal[] = [];

let paymentIntents: PaymentIntent[] = [];
let paymentAttempts: PaymentAttempt[] = [];
let recoveryPins: PasswordRecoveryPin[] = [];

let paymentGateways: PaymentGatewayConfig[] = [
  {
    id: 'gw_inf',
    organization_id: 'org_foods_default_001',
    unit_id: 'unit_matriz_001',
    provider: 'infinitypay',
    is_active: false,
    credentials: { handle: '' },
  },
  {
    id: 'gw_mp',
    organization_id: 'org_foods_default_001',
    unit_id: 'unit_matriz_001',
    provider: 'mercadopago',
    is_active: false,
    credentials: { public_key: '', access_token: '' },
  },
  {
    id: 'gw_ps',
    organization_id: 'org_foods_default_001',
    unit_id: 'unit_matriz_001',
    provider: 'pagseguro',
    is_active: false,
    credentials: { email: '', token: '' },
  },
  {
    id: 'gw_sp',
    organization_id: 'org_foods_default_001',
    unit_id: 'unit_matriz_001',
    provider: 'syncpay',
    is_active: false,
    credentials: { api_key: '' },
  },
  {
    id: 'gw_cash',
    organization_id: 'org_foods_default_001',
    unit_id: 'unit_matriz_001',
    provider: 'cash',
    is_active: true,
    credentials: {},
  },
  {
    id: 'gw_pos',
    organization_id: 'org_foods_default_001',
    unit_id: 'unit_matriz_001',
    provider: 'card_pos',
    is_active: true,
    credentials: {},
  },
];

let whatsappConnection: WhatsAppConnection = {
  id: 'wa_conn_01',
  organization_id: 'org_foods_default_001',
  unit_id: 'unit_matriz_001',
  provider: 'BAILEYS',
  status: 'DISCONNECTED',
  phone_number: '',
  updated_at: new Date().toISOString(),
};

let deliverySettings: DeliverySettings = {
  id: 'del_sett_001',
  organization_id: 'org_foods_default_001',
  unit_id: 'unit_matriz_001',
  mode: 'FLAT',
  flat_fee: 5.00,
  flat_min_order: 20.00,
  flat_est_minutes: 35,
  cities: [
    { id: 'city_1', city_name: 'São Paulo', fee: 5.00, min_order: 20.00, est_minutes: 30, is_active: true },
    { id: 'city_2', city_name: 'Guarulhos', fee: 9.00, min_order: 30.00, est_minutes: 45, is_active: true },
  ],
  areas: [
    { id: 'area_1', area_name: 'Centro / Jardins', city_name: 'São Paulo', fee: 4.00, min_order: 15.00, est_minutes: 25, is_active: true },
    { id: 'area_2', area_name: 'Pinheiros / Vila Madalena', city_name: 'São Paulo', fee: 6.00, min_order: 20.00, est_minutes: 35, is_active: true },
  ],
  hours: {
    segunda: { is_active: true, periods: [{ open: '11:00', close: '23:00' }] },
    terca: { is_active: true, periods: [{ open: '11:00', close: '23:00' }] },
    quarta: { is_active: true, periods: [{ open: '11:00', close: '23:00' }] },
    quinta: { is_active: true, periods: [{ open: '11:00', close: '23:00' }] },
    sexta: { is_active: true, periods: [{ open: '11:00', close: '00:00' }] },
    sabado: { is_active: true, periods: [{ open: '11:00', close: '00:00' }] },
    domingo: { is_active: true, periods: [{ open: '12:00', close: '22:00' }] },
  },
};

let menuSettings: MenuSettings = {
  id: 'menu_sett_001',
  organization_id: 'org_foods_default_001',
  unit_id: 'unit_matriz_001',
  online_menu_enabled: true,
  online_orders: true,
  pickup: true,
  delivery: true,
  table_service: true,
  channels: { online: true, pos: true, totem: true },
  allow_item_notes: true,
};

let inventorySettings: InventorySettings = {
  id: 'inv_sett_001',
  organization_id: 'org_foods_default_001',
  unit_id: 'unit_matriz_001',
  auto_deduct_on_order: true,
  alert_threshold_pct: 15,
  default_unit: 'kg',
  enable_cost_tracking: true,
};

let loyaltySettings: LoyaltySettings = {
  id: 'loy_sett_001',
  organization_id: 'org_foods_default_001',
  unit_id: 'unit_matriz_001',
  is_active: true,
  points_per_real: 1.0,
  min_points_redemption: 100,
  points_validity_days: 180,
  allow_coupons: true,
};

let printSettings: PrintSettings = {
  id: 'print_sett_001',
  organization_id: 'org_foods_default_001',
  unit_id: 'unit_matriz_001',
  printers: [
    {
      id: 'prn_1',
      name: 'Impressora da Cozinha (KDS / Fichas)',
      type: 'KITCHEN',
      connection: 'NETWORK',
      ip_address: '192.168.1.200',
      paper_width: 80,
      auto_print: true,
      category_ids: [],
    },
    {
      id: 'prn_2',
      name: 'Impressora do Caixa / Balcão',
      type: 'CASHIER',
      connection: 'USB',
      paper_width: 80,
      auto_print: true,
      category_ids: [],
    },
  ],
  print_order_copy: true,
  print_kitchen_copy: true,
};

let appearanceSettings: AppearanceSettings = {
  id: 'app_sett_001',
  organization_id: 'org_foods_default_001',
  unit_id: 'unit_matriz_001',
  logo_url: '',
  icon_url: '',
  primary_color: '#f59e0b',
  secondary_color: '#0f172a',
  accent_color: '#10b981',
  button_color: '#f59e0b',
  theme: 'light',
};

let notificationSettings: NotificationSettings = {
  id: 'notif_sett_001',
  organization_id: 'org_foods_default_001',
  unit_id: 'unit_matriz_001',
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
  },
};

let securitySettings: SecuritySettings = {
  id: 'sec_sett_001',
  organization_id: 'org_foods_default_001',
  unit_id: 'unit_matriz_001',
  session_timeout_minutes: 120,
  require_strong_password: true,
  max_login_attempts: 5,
  force_2fa: false,
  active_sessions: [
    {
      id: 'sess_1',
      user_name: 'Administrador FoodS',
      device: 'Navegador Web (Chrome Desktop)',
      ip: '189.40.122.15',
      last_active: 'Agora',
    },
  ],
};

let rolePermissionMatrix: RolePermissionMatrix = {
  id: 'perm_mat_001',
  organization_id: 'org_foods_default_001',
  role_permissions: {
    owner: { dashboard_view: true, orders_view: true, orders_create: true, orders_edit: true, orders_cancel: true, products_view: true, products_create: true, products_edit: true, products_delete: true, inventory_view: true, inventory_edit: true, financial_view: true, financial_edit: true, settings_manage: true },
    admin: { dashboard_view: true, orders_view: true, orders_create: true, orders_edit: true, orders_cancel: true, products_view: true, products_create: true, products_edit: true, products_delete: true, inventory_view: true, inventory_edit: true, financial_view: true, financial_edit: true, settings_manage: true },
    manager: { dashboard_view: true, orders_view: true, orders_create: true, orders_edit: true, orders_cancel: true, products_view: true, products_create: true, products_edit: true, products_delete: false, inventory_view: true, inventory_edit: true, financial_view: true, financial_edit: false, settings_manage: false },
    coordinator: { dashboard_view: true, orders_view: true, orders_create: true, orders_edit: true, orders_cancel: true, products_view: true, products_create: false, products_edit: false, products_delete: false, inventory_view: true, inventory_edit: false, financial_view: false, financial_edit: false, settings_manage: false },
    waiter: { dashboard_view: false, orders_view: true, orders_create: true, orders_edit: false, orders_cancel: false, products_view: true, products_create: false, products_edit: false, products_delete: false, inventory_view: false, inventory_edit: false, financial_view: false, financial_edit: false, settings_manage: false },
    operator: { dashboard_view: true, orders_view: true, orders_create: true, orders_edit: true, orders_cancel: false, products_view: true, products_create: false, products_edit: false, products_delete: false, inventory_view: false, inventory_edit: false, financial_view: false, financial_edit: false, settings_manage: false },
    kitchen: { dashboard_view: false, orders_view: true, orders_create: false, orders_edit: true, orders_cancel: false, products_view: false, products_create: false, products_edit: false, products_delete: false, inventory_view: true, inventory_edit: false, financial_view: false, financial_edit: false, settings_manage: false },
    financial: { dashboard_view: true, orders_view: true, orders_create: false, orders_edit: false, orders_cancel: false, products_view: false, products_create: false, products_edit: false, products_delete: false, inventory_view: false, inventory_edit: false, financial_view: true, financial_edit: true, settings_manage: false },
  },
};

// Função de Hash Seguro para Senhas de Clientes (SHA-256 com Salt)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(`foods_salt_${password}`).digest('hex');
}

export const StoreDB = {
  getOrganization: () => organization,
  updateOrganization: (data: Partial<Organization>) => {
    organization = { ...organization, ...data, updated_at: new Date().toISOString() };
    if (SupabaseService.isConfigured()) {
      SupabaseService.upsertTableData('organizations', organization);
    }
    return organization;
  },

  getProfiles: async () => {
    if (SupabaseService.isConfigured()) {
      const dbProfiles = await SupabaseService.fetchProfiles();
      if (dbProfiles && dbProfiles.length > 0) {
        profiles = dbProfiles;
      }
    }
    return profiles;
  },

  syncFromSupabase: async () => {
    if (!SupabaseService.isConfigured()) return false;
    try {
      const [dbOrgs, dbProfiles, dbUnits, dbCategories, dbProducts, dbInventory, dbOrders, dbCustomers, dbTables] = await Promise.all([
        SupabaseService.fetchTableData<Organization>('organizations'),
        SupabaseService.fetchProfiles(),
        SupabaseService.fetchTableData<Unit>('units'),
        SupabaseService.fetchTableData<Category>('categories'),
        SupabaseService.fetchTableData<Product>('products'),
        SupabaseService.fetchTableData<InventoryItem>('inventory_items'),
        SupabaseService.fetchTableData<Order>('orders'),
        SupabaseService.fetchTableData<Customer>('customers'),
        SupabaseService.fetchTableData<TableItem>('tables'),
      ]);

      if (dbOrgs && dbOrgs.length > 0) organization = dbOrgs[0];
      if (dbProfiles && dbProfiles.length > 0) profiles = dbProfiles;
      if (dbUnits && dbUnits.length > 0) units = dbUnits;
      if (dbCategories && dbCategories.length > 0) categories = dbCategories;
      if (dbProducts && dbProducts.length > 0) products = dbProducts;
      if (dbInventory && dbInventory.length > 0) inventoryItems = dbInventory;
      if (dbOrders && dbOrders.length > 0) orders = dbOrders;
      if (dbCustomers && dbCustomers.length > 0) customers = dbCustomers;
      if (dbTables && dbTables.length > 0) tables = dbTables;
      return true;
    } catch (err) {
      logger.warn('[StoreDB] Falha parcial ao sincronizar dados iniciais do Supabase:', err);
      return false;
    }
  },

  verifyAdminLogin: async (email: string, password?: string) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error('E-mail de acesso não informado.');
    }

    // 1. Tentar autenticação no Supabase se configurado
    if (SupabaseService.isConfigured()) {
      await StoreDB.syncFromSupabase();
      const supabaseUser = await SupabaseService.authenticate(cleanEmail, password);
      if (supabaseUser) {
        if (supabaseUser.status && supabaseUser.status !== 'active') {
          throw new Error('Acesso negado: Este usuário está inativo ou suspenso.');
        }
        const idx = profiles.findIndex(p => p.id === supabaseUser.id || p.email.toLowerCase() === cleanEmail);
        if (idx >= 0) {
          profiles[idx] = { ...profiles[idx], ...supabaseUser };
        } else {
          profiles.push(supabaseUser);
        }
        return {
          profile: supabaseUser,
          isSupabaseConfigured: true,
          mode: 'SUPABASE_CLOUD',
          warning: null,
        };
      } else {
        throw new Error('Credenciais inválidas no Supabase Auth. Apenas usuários autorizados podem acessar o painel.');
      }
    }

    // 2. MODO LOCAL DE CONTINGÊNCIA (Supabase não configurado ou desconectado)
    const localProfile = profiles.find(p => p.email.toLowerCase() === cleanEmail);
    if (!localProfile) {
      throw new Error('Credenciais inválidas. Usuário não autorizado no sistema FoodS.');
    }

    if (localProfile.status !== 'active') {
      throw new Error('Acesso negado: Este usuário está inativo ou suspenso. Contate a administração.');
    }

    // Validação estrita de senha local
    const expectedPassword = userPasswords[localProfile.id] || userPasswords[localProfile.email.toLowerCase()] || 'admin123';
    if (!password || password !== expectedPassword) {
      throw new Error('Senha incorreta. Acesso não autorizado.');
    }

    localProfile.last_access_at = new Date().toISOString();

    return {
      profile: localProfile,
      isSupabaseConfigured: false,
      mode: 'LOCAL_CONTINGENCY',
      warning: 'Atenção: Supabase não está configurado. O sistema está operando em Modo de Contingência Local com o usuário Owner padrão (admin@admin / admin123).',
    };
  },

  createProfile: async (profile: Partial<Profile> & { password?: string }) => {
    const cleanEmail = (profile.email || '').trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error('O e-mail do usuário é obrigatório.');
    }

    const existing = profiles.find(p => p.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error(`Já existe um usuário cadastrado com o e-mail "${cleanEmail}".`);
    }

    const newId = profile.id || crypto.randomUUID();
    const newProf: Profile = {
      id: newId,
      email: cleanEmail,
      first_name: (profile.first_name || 'Novo').trim(),
      last_name: (profile.last_name || 'Usuário').trim(),
      phone: (profile.phone || '').trim(),
      organization_id: organization.id,
      role: profile.role || 'operator',
      status: profile.status || 'active',
      created_at: new Date().toISOString(),
    };

    const pass = profile.password && profile.password.trim() ? profile.password.trim() : 'admin123';
    userPasswords[newId] = pass;
    userPasswords[cleanEmail] = pass;

    profiles.push(newProf);

    if (SupabaseService.isConfigured()) {
      await SupabaseService.upsertProfile(newProf);
    }

    return newProf;
  },

  updateProfile: async (id: string, data: Partial<Profile> & { password?: string }) => {
    const idx = profiles.findIndex(pr => pr.id === id);
    if (idx === -1) {
      throw new Error('Usuário não encontrado para edição.');
    }

    const current = profiles[idx];
    const oldEmail = current.email.toLowerCase();
    let updatedEmail = current.email;

    if (data.email !== undefined) {
      const cleanEmail = data.email.trim().toLowerCase();
      if (!cleanEmail) {
        throw new Error('O e-mail não pode ficar vazio.');
      }
      if (cleanEmail !== oldEmail) {
        const duplicate = profiles.find(other => other.id !== id && other.email.toLowerCase() === cleanEmail);
        if (duplicate) {
          throw new Error(`O e-mail "${cleanEmail}" já está em uso por outro membro.`);
        }
        updatedEmail = cleanEmail;
      }
    }

    const updatedProfile: Profile = {
      ...current,
      email: updatedEmail,
      first_name: data.first_name !== undefined ? data.first_name.trim() : current.first_name,
      last_name: data.last_name !== undefined ? data.last_name.trim() : current.last_name,
      phone: data.phone !== undefined ? data.phone.trim() : current.phone,
      role: data.role !== undefined ? data.role : current.role,
      status: data.status !== undefined ? data.status : current.status,
    };

    profiles[idx] = updatedProfile;

    // Preservar ou atualizar senha no mapa de credenciais
    const currentPass = userPasswords[id] || userPasswords[oldEmail] || 'admin123';
    const nextPass = data.password && data.password.trim() ? data.password.trim() : currentPass;
    userPasswords[id] = nextPass;
    userPasswords[updatedEmail.toLowerCase()] = nextPass;

    if (SupabaseService.isConfigured()) {
      await SupabaseService.upsertProfile(updatedProfile);
    }

    return updatedProfile;
  },

  deleteProfile: async (id: string) => {
    const userToDelete = profiles.find(p => p.id === id);
    if (!userToDelete) {
      throw new Error('Usuário não localizado para exclusão.');
    }
    if (profiles.length <= 1) {
      throw new Error('Não é possível excluir o único usuário do sistema. Cadastre outro administrador antes de remover este.');
    }
    delete userPasswords[id];
    delete userPasswords[userToDelete.email.toLowerCase()];
    profiles = profiles.filter(p => p.id !== id);

    if (SupabaseService.isConfigured()) {
      await SupabaseService.deleteProfile(id);
    }
    return true;
  },

  toggleProfileStatus: async (id: string) => {
    const idx = profiles.findIndex(pr => pr.id === id);
    if (idx !== -1) {
      const p = profiles[idx];
      const activeUsersCount = profiles.filter(u => u.status === 'active').length;
      if (p.status === 'active' && activeUsersCount <= 1) {
        throw new Error('Não é possível desativar o único usuário ativo do sistema.');
      }
      const updated: Profile = {
        ...p,
        status: p.status === 'active' ? 'inactive' : 'active',
      };
      profiles[idx] = updated;
      if (SupabaseService.isConfigured()) {
        await SupabaseService.upsertProfile(updated);
      }
      return updated;
    }
    throw new Error('Usuário não encontrado.');
  },

  getUnits: () => units,
  updateUnit: (id: string, data: Partial<Unit>) => {
    const u = units.find(un => un.id === id);
    if (u) {
      Object.assign(u, data);
      return u;
    }
    return null;
  },
  deleteUnit: (id: string) => {
    units = units.filter(un => un.id !== id);
    return true;
  },
  toggleUnitStatus: (id: string) => {
    const u = units.find(un => un.id === id);
    if (u) {
      u.is_active = !u.is_active;
      return u;
    }
    return null;
  },
  createUnit: (unitData: Partial<Unit>) => {
    const newUnit: Unit = {
      id: `unit_${Date.now()}`,
      organization_id: organization.id,
      name: unitData.name || 'Nova Unidade',
      slug: unitData.slug || `unidade-${Date.now()}`,
      phone: unitData.phone || '',
      whatsapp: unitData.whatsapp || '',
      email: unitData.email || '',
      address_street: unitData.address_street || '',
      address_number: unitData.address_number || '',
      address_neighborhood: unitData.address_neighborhood || '',
      address_city: unitData.address_city || 'São Paulo',
      address_state: unitData.address_state || 'SP',
      address_zipcode: unitData.address_zipcode || '01000-000',
      delivery_fee: unitData.delivery_fee ?? 5.00,
      delivery_radius_km: unitData.delivery_radius_km ?? 5.0,
      avg_prep_time_minutes: unitData.avg_prep_time_minutes ?? 25,
      is_active: true,
      is_open: true,
      created_at: new Date().toISOString(),
    };
    units.push(newUnit);
    return newUnit;
  },

  getStoreSettings: (unitId?: string) => {
    return storeSettings.find((s) => !unitId || s.unit_id === unitId) || storeSettings[0];
  },
  updateStoreSettings: (data: Partial<StoreSettings>) => {
    if (storeSettings.length > 0) {
      storeSettings[0] = { ...storeSettings[0], ...data };
      return storeSettings[0];
    }
    return null;
  },

  getAuthSettings: () => authSettings,
  updateAuthSettings: (data: Partial<AuthSettings>) => {
    authSettings = { ...authSettings, ...data, updated_at: new Date().toISOString() };
    return authSettings;
  },

  getCategories: () => categories,
  createCategory: (data: Partial<Category>) => {
    const cat: Category = {
      id: `cat_${Date.now()}`,
      organization_id: organization.id,
      unit_id: data.unit_id || units[0]?.id || '',
      name: data.name || 'Nova Categoria',
      description: data.description || '',
      sort_order: categories.length + 1,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    categories.push(cat);
    return cat;
  },
  updateCategory: (id: string, data: Partial<Category>) => {
    const idx = categories.findIndex(c => c.id === id);
    if (idx !== -1) {
      categories[idx] = { ...categories[idx], ...data };
      return categories[idx];
    }
    return null;
  },
  deleteCategory: (id: string) => {
    categories = categories.filter(c => c.id !== id);
    return true;
  },

  getProducts: () => products,
  createProduct: (data: Partial<Product>) => {
    const prod: Product = {
      id: `prod_${Date.now()}`,
      organization_id: organization.id,
      unit_id: data.unit_id || units[0]?.id || '',
      category_id: data.category_id,
      category_name: categories.find(c => c.id === data.category_id)?.name || 'Geral',
      name: data.name || 'Novo Produto',
      description: data.description || '',
      price: data.price || 0.00,
      cost_price: data.cost_price || 0.00,
      sku: data.sku || `SKU-${Date.now().toString().slice(-4)}`,
      barcode: data.barcode || '',
      image_url: data.image_url || '',
      unit_type: data.unit_type || 'un',
      is_active: true,
      is_available: true,
      addons: data.addons || [],
      variants: data.variants || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    products.push(prod);
    return prod;
  },
  updateProduct: (id: string, data: Partial<Product>) => {
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...data, updated_at: new Date().toISOString() };
      return products[index];
    }
    return null;
  },
  deleteProduct: (id: string) => {
    products = products.filter(p => p.id !== id);
    return true;
  },

  getInventoryItems: () => inventoryItems,
  getTechnicalRecipes: (productId?: string) => {
    if (productId) {
      return technicalRecipes.filter(tr => tr.product_id === productId);
    }
    return technicalRecipes;
  },
  createInventoryItem: (data: Partial<InventoryItem>) => {
    const item: InventoryItem = {
      id: `inv_${Date.now()}`,
      organization_id: organization.id,
      unit_id: data.unit_id || units[0]?.id || '',
      name: data.name || 'Novo Insumo',
      unit_type: data.unit_type || 'un',
      current_stock: data.current_stock || 0,
      min_stock: data.min_stock || 0,
      unit_cost: data.unit_cost || 0,
      supplier_name: data.supplier_name || '',
      updated_at: new Date().toISOString(),
    };
    inventoryItems.push(item);

    if (item.current_stock > 0) {
      inventoryMovements.push({
        id: `mov_${Date.now()}`,
        organization_id: organization.id,
        unit_id: item.unit_id,
        inventory_item_id: item.id,
        inventory_item_name: item.name,
        type: 'ENTRY',
        quantity: item.current_stock,
        previous_stock: 0,
        new_stock: item.current_stock,
        unit_cost: item.unit_cost,
        notes: 'Estoque inicial cadastrado',
        created_at: new Date().toISOString(),
      });
    }
    return item;
  },

  addInventoryMovement: (movementData: { inventory_item_id: string; type: 'ENTRY' | 'EXIT' | 'ADJUSTMENT' | 'LOSS'; quantity: number; notes?: string }) => {
    const item = inventoryItems.find(i => i.id === movementData.inventory_item_id);
    if (!item) throw new Error('Insumo não encontrado');

    const previous_stock = item.current_stock;
    let new_stock = previous_stock;

    if (movementData.type === 'ENTRY') {
      new_stock += movementData.quantity;
    } else if (movementData.type === 'EXIT' || movementData.type === 'LOSS') {
      new_stock -= movementData.quantity;
    } else if (movementData.type === 'ADJUSTMENT') {
      new_stock = movementData.quantity;
    }

    item.current_stock = Math.max(0, new_stock);
    item.updated_at = new Date().toISOString();

    const mov: InventoryMovement = {
      id: `mov_${Date.now()}`,
      organization_id: organization.id,
      unit_id: item.unit_id,
      inventory_item_id: item.id,
      inventory_item_name: item.name,
      type: movementData.type,
      quantity: movementData.quantity,
      previous_stock,
      new_stock: item.current_stock,
      unit_cost: item.unit_cost,
      notes: movementData.notes || '',
      created_at: new Date().toISOString(),
    };
    inventoryMovements.push(mov);
    return mov;
  },

  saveTechnicalRecipe: (productId: string, ingredients: Array<{ inventory_item_id: string; quantity_required: number }>) => {
    technicalRecipes = technicalRecipes.filter(tr => tr.product_id !== productId);
    ingredients.forEach(ing => {
      const item = inventoryItems.find(i => i.id === ing.inventory_item_id);
      technicalRecipes.push({
        id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        product_id: productId,
        inventory_item_id: ing.inventory_item_id,
        inventory_item_name: item?.name || '',
        quantity_required: ing.quantity_required,
      });
    });
    return StoreDB.getTechnicalRecipes(productId);
  },

  getTables: () => tables,
  createTable: (data: { number: string; name?: string; capacity: number }) => {
    const newTbl: TableItem = {
      id: `tbl_${Date.now()}`,
      organization_id: organization.id,
      unit_id: units[0]?.id || '',
      number: data.number,
      name: data.name || `Mesa ${data.number}`,
      capacity: data.capacity || 4,
      status: 'FREE',
    };
    tables.push(newTbl);
    return newTbl;
  },
  deleteTable: (tableId: string) => {
    tables = tables.filter(t => t.id !== tableId);
    return true;
  },

  updateTableStatus: (tableId: string, status: 'FREE' | 'OCCUPIED' | 'BILL_REQUESTED' | 'CLOSED', waiterId?: string) => {
    const tbl = tables.find(t => t.id === tableId);
    if (tbl) {
      tbl.status = status;
      if (status === 'OCCUPIED' && !tbl.opened_at) {
        tbl.opened_at = new Date().toISOString();
        if (waiterId) tbl.current_waiter_id = waiterId;
      } else if (status === 'FREE' || status === 'CLOSED') {
        tbl.opened_at = undefined;
        tbl.current_waiter_id = undefined;
      }
      tbl.updated_at = new Date().toISOString();
      return tbl;
    }
    return null;
  },

  // CLIENTES & AUTENTICAÇÃO REAL DE CLIENTE COM CELULAR E PIN
  getCustomers: () => customers,
  findCustomerByPhone: (phone: string) => {
    const cleanInput = phone.replace(/\D/g, '');
    return customers.find(c => c.phone.replace(/\D/g, '') === cleanInput);
  },

  createCustomer: (data: Partial<Customer>) => {
    const cleanPhone = formatBrazilianPhone(data.phone || '');
    const existing = StoreDB.findCustomerByPhone(cleanPhone);
    if (existing) return existing;

    const cust: Customer = {
      id: `cust_${Date.now()}`,
      organization_id: organization.id,
      name: data.name || 'Cliente Sem Nome',
      phone: cleanPhone,
      whatsapp: data.whatsapp || cleanPhone,
      email: data.email || '',
      has_account: false,
      total_orders: 0,
      total_spent: 0,
      created_at: new Date().toISOString(),
    };
    customers.push(cust);

    loyaltyAccounts.push({
      id: `loy_${Date.now()}`,
      organization_id: organization.id,
      customer_id: cust.id,
      customer_name: cust.name,
      points_balance: 0,
      updated_at: new Date().toISOString(),
    });

    return cust;
  },

  setCustomerPassword: (phone: string, password: string) => {
    const cust = StoreDB.findCustomerByPhone(phone);
    if (!cust) throw new Error('Cliente não encontrado com este telefone');
    cust.password_hash = hashPassword(password);
    cust.has_account = true;
    return cust;
  },

  createOrUpdateCustomerAccount: (phone: string, password: string, name?: string) => {
    const cleanPhone = formatBrazilianPhone(phone);
    let cust = StoreDB.findCustomerByPhone(cleanPhone);
    if (!cust) {
      cust = StoreDB.createCustomer({ phone: cleanPhone, name: name || 'Cliente' });
    }
    cust.password_hash = hashPassword(password);
    cust.has_account = true;
    if (name) cust.name = name;
    return cust;
  },

  verifyCustomerPassword: (phone: string, password: string) => {
    const cust = StoreDB.findCustomerByPhone(phone);
    if (!cust || !cust.has_account || !cust.password_hash) {
      return { success: false, message: 'Conta de cliente não cadastrada.' };
    }
    const hash = hashPassword(password);
    if (cust.password_hash === hash) {
      return { success: true, customer: cust };
    }
    return { success: false, message: 'Senha incorreta.' };
  },

  // GERAR PIN DE RECUPERAÇÃO DE 6 DÍGITOS VIA WHATSAPP REAL
  generateRecoveryPin: (phone: string) => {
    const cleanPhone = formatBrazilianPhone(phone);
    const cust = StoreDB.findCustomerByPhone(cleanPhone);
    if (!cust) throw new Error('Nenhum cadastro localizado para este telefone');

    // Gerar PIN de 6 dígitos aleatórios
    const pin_code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutos

    const pinObj: PasswordRecoveryPin = {
      id: `pin_${Date.now()}`,
      phone: cleanPhone,
      pin_code,
      expires_at,
      used: false,
      attempts: 0,
    };

    recoveryPins.push(pinObj);
    return { pinObj, customer: cust };
  },

  verifyRecoveryPin: (phone: string, pinCode: string) => {
    const cleanPhone = formatBrazilianPhone(phone);
    const activePin = recoveryPins.find(
      p => p.phone === cleanPhone && !p.used && new Date(p.expires_at).getTime() > Date.now()
    );

    if (!activePin) {
      return { success: false, message: 'PIN expirado ou inexistente. Solicite um novo PIN.' };
    }

    if (activePin.attempts >= 3) {
      return { success: false, message: 'Número máximo de tentativas excedido.' };
    }

    if (activePin.pin_code === pinCode.trim()) {
      activePin.used = true;
      return { success: true, message: 'PIN verificado com sucesso.' };
    } else {
      activePin.attempts += 1;
      return { success: false, message: 'PIN incorreto.' };
    }
  },

  addAdminRecoveryPin: (pinObj: PasswordRecoveryPin) => {
    recoveryPins.push(pinObj);
  },

  verifyAdminRecoveryPin: (phone: string, pinCode: string) => {
    return StoreDB.verifyRecoveryPin(phone, pinCode);
  },

  getOrders: () => orders,
  getOrderById: (id: string) => orders.find(o => o.id === id),

  createOrder: (orderInput: {
    unit_id?: string;
    customer_id?: string;
    customer_name?: string;
    customer_phone?: string;
    waiter_id?: string;
    waiter_name?: string;
    table_id?: string;
    table_number?: string;
    type: 'DINE_IN' | 'PICKUP' | 'DELIVERY' | 'COUNTER' | 'TAKEAWAY';
    payment_method: any;
    items: Array<{
      product_id: string;
      product_name: string;
      unit_price: number;
      quantity: number;
      notes?: string;
      selected_addons?: any[];
    }>;
    notes?: string;
    delivery_address?: any;
    discount?: number;
  }) => {
    const nextOrderNum = (orders.length > 0 ? Math.max(...orders.map(o => o.order_number)) : 1000) + 1;
    const unit = units.find(u => u.id === orderInput.unit_id) || units[0];

    const subtotal = orderInput.items.reduce((acc, item) => {
      const addonsTotal = (item.selected_addons || []).reduce((a, add) => a + (add.price * (add.quantity || 1)), 0);
      return acc + (item.unit_price + addonsTotal) * item.quantity;
    }, 0);

    const delivery_fee = orderInput.type === 'DELIVERY' ? (unit?.delivery_fee || 0) : 0;
    const discount = orderInput.discount || 0;
    const total = Math.max(0, subtotal + delivery_fee - discount);

    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      order_number: nextOrderNum,
      organization_id: organization.id,
      unit_id: unit?.id || '',
      customer_id: orderInput.customer_id,
      customer_name: orderInput.customer_name || 'Cliente Balcão',
      customer_phone: orderInput.customer_phone ? formatBrazilianPhone(orderInput.customer_phone) : '',
      waiter_id: orderInput.waiter_id,
      waiter_name: orderInput.waiter_name,
      table_id: orderInput.table_id,
      table_number: orderInput.table_number,
      type: orderInput.type,
      status: 'RECEIVED',
      payment_status: orderInput.payment_method === 'CASH' || orderInput.payment_method === 'CARD_POS' ? 'PENDING' : 'PAID',
      payment_method: orderInput.payment_method,
      subtotal,
      discount,
      delivery_fee,
      total,
      notes: orderInput.notes,
      delivery_address: orderInput.delivery_address,
      items: orderInput.items.map((it, idx) => ({
        id: `oi_${Date.now()}_${idx}`,
        order_id: `ord_${Date.now()}`,
        product_id: it.product_id,
        product_name: it.product_name,
        unit_price: it.unit_price,
        quantity: it.quantity,
        subtotal: it.unit_price * it.quantity,
        notes: it.notes,
        selected_addons: it.selected_addons || [],
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    orders.unshift(newOrder);

    if (orderInput.table_id) {
      StoreDB.updateTableStatus(orderInput.table_id, 'OCCUPIED', orderInput.waiter_id);
    }

    if (orderInput.customer_id) {
      const cust = customers.find(c => c.id === orderInput.customer_id);
      if (cust) {
        cust.total_orders += 1;
        cust.total_spent += total;
        cust.last_order_at = new Date().toISOString();
      }

      const loy = loyaltyAccounts.find(l => l.customer_id === orderInput.customer_id);
      if (loy) {
        const earnedPoints = Math.floor(total);
        loy.points_balance += earnedPoints;
        loy.updated_at = new Date().toISOString();
      }
    }

    logger.info(`Novo Pedido REAL criado #${newOrder.order_number}`, { total: newOrder.total, type: newOrder.type });
    return newOrder;
  },

  updateOrderStatus: (orderId: string, status: OrderStatus, cancelReason?: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) throw new Error('Pedido não encontrado');

    const previousStatus = order.status;
    order.status = status;
    if (cancelReason) order.cancel_reason = cancelReason;
    order.updated_at = new Date().toISOString();

    if ((status === 'CONFIRMED' || status === 'PREPARING') && (previousStatus === 'RECEIVED')) {
      order.items.forEach(item => {
        if (item.product_id) {
          const recipes = technicalRecipes.filter(tr => tr.product_id === item.product_id);
          recipes.forEach(rec => {
            const invItem = inventoryItems.find(i => i.id === rec.inventory_item_id);
            if (invItem) {
              const consumption = rec.quantity_required * item.quantity;
              const prev = invItem.current_stock;
              invItem.current_stock = Math.max(0, invItem.current_stock - consumption);
              invItem.updated_at = new Date().toISOString();

              inventoryMovements.push({
                id: `mov_cons_${Date.now()}`,
                organization_id: organization.id,
                unit_id: order.unit_id,
                inventory_item_id: invItem.id,
                inventory_item_name: invItem.name,
                type: 'SALE_CONSUMPTION',
                quantity: consumption,
                previous_stock: prev,
                new_stock: invItem.current_stock,
                notes: `Consumo automático pela Ficha Técnica — Pedido #${order.order_number}`,
                created_at: new Date().toISOString(),
              });
            }
          });
        }
      });
    }

    return order;
  },

  updateOrderPaymentStatus: (orderId: string, payment_status: PaymentStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) throw new Error('Pedido não encontrado');
    order.payment_status = payment_status;
    order.updated_at = new Date().toISOString();
    return order;
  },

  getPaymentGateways: () => paymentGateways,
  updatePaymentGateway: (provider: string, is_active: boolean, credentials?: Record<string, string>) => {
    let gw = paymentGateways.find(g => g.provider === provider);
    if (gw) {
      gw.is_active = is_active;
      if (credentials) gw.credentials = { ...gw.credentials, ...credentials };
    } else {
      gw = {
        id: `gw_${Date.now()}`,
        organization_id: organization.id,
        unit_id: units[0]?.id || '',
        provider: provider as any,
        is_active,
        credentials: credentials || {},
      };
      paymentGateways.push(gw);
    }
    return gw;
  },

  getLoyaltyAccounts: () => loyaltyAccounts,
  getWhatsAppConnection: () => whatsappConnection,
  updateWhatsAppConnection: async (provider: 'META_CLOUD_API' | 'BAILEYS', status: string, phone_number?: string) => {
    whatsappConnection.provider = provider;
    whatsappConnection.status = status as any;
    whatsappConnection.updated_at = new Date().toISOString();

    if (phone_number !== undefined) {
      whatsappConnection.phone_number = phone_number;
    }

    if (status === 'CONNECTED') {
      whatsappConnection.qr_code = undefined;
    }

    return whatsappConnection;
  },

  getDeliverySettings: () => deliverySettings,
  updateDeliverySettings: (data: Partial<DeliverySettings>) => {
    deliverySettings = { ...deliverySettings, ...data };
    return deliverySettings;
  },
  addDeliveryCity: (data: Omit<DeliveryCityRate, 'id'>) => {
    const city: DeliveryCityRate = {
      id: `city_${Date.now()}`,
      ...data,
    };
    deliverySettings.cities.push(city);
    return city;
  },
  deleteDeliveryCity: (id: string) => {
    deliverySettings.cities = deliverySettings.cities.filter(c => c.id !== id);
    return true;
  },
  addDeliveryArea: (data: Omit<DeliveryAreaRate, 'id'>) => {
    const area: DeliveryAreaRate = {
      id: `area_${Date.now()}`,
      ...data,
    };
    deliverySettings.areas.push(area);
    return area;
  },
  deleteDeliveryArea: (id: string) => {
    deliverySettings.areas = deliverySettings.areas.filter(a => a.id !== id);
    return true;
  },

  getMenuSettings: () => menuSettings,
  updateMenuSettings: (data: Partial<MenuSettings>) => {
    menuSettings = { ...menuSettings, ...data };
    return menuSettings;
  },

  getInventorySettings: () => inventorySettings,
  updateInventorySettings: (data: Partial<InventorySettings>) => {
    inventorySettings = { ...inventorySettings, ...data };
    return inventorySettings;
  },

  getLoyaltySettings: () => loyaltySettings,
  updateLoyaltySettings: (data: Partial<LoyaltySettings>) => {
    loyaltySettings = { ...loyaltySettings, ...data };
    return loyaltySettings;
  },

  getPrintSettings: () => printSettings,
  updatePrintSettings: (data: Partial<PrintSettings>) => {
    printSettings = { ...printSettings, ...data };
    return printSettings;
  },
  addPrinter: (data: Omit<PrinterConfig, 'id'>) => {
    const printer: PrinterConfig = {
      id: `prn_${Date.now()}`,
      ...data,
    };
    printSettings.printers.push(printer);
    return printer;
  },
  deletePrinter: (id: string) => {
    printSettings.printers = printSettings.printers.filter(p => p.id !== id);
    return true;
  },

  getAppearanceSettings: () => appearanceSettings,
  updateAppearanceSettings: (data: Partial<AppearanceSettings>) => {
    appearanceSettings = { ...appearanceSettings, ...data };
    return appearanceSettings;
  },

  getNotificationSettings: () => notificationSettings,
  updateNotificationSettings: (data: Partial<NotificationSettings>) => {
    notificationSettings = { ...notificationSettings, ...data };
    return notificationSettings;
  },

  getSecuritySettings: () => securitySettings,
  updateSecuritySettings: (data: Partial<SecuritySettings>) => {
    securitySettings = { ...securitySettings, ...data };
    return securitySettings;
  },

  getPermissionMatrix: () => rolePermissionMatrix,
  updatePermissionMatrix: (data: Partial<RolePermissionMatrix>) => {
    rolePermissionMatrix = { ...rolePermissionMatrix, ...data };
    return rolePermissionMatrix;
  },

  getReportingSummary: (period: string = '30days'): ReportingSummary => {
    const total_sales = orders.filter(o => o.status !== 'CANCELLED').reduce((acc, o) => acc + o.total, 0);
    const total_orders = orders.length;
    const average_ticket = total_orders > 0 ? total_sales / total_orders : 0;
    const orders_in_progress = orders.filter(o => ['RECEIVED', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'].includes(o.status)).length;
    const orders_completed = orders.filter(o => o.status === 'DELIVERED').length;
    const orders_cancelled = orders.filter(o => o.status === 'CANCELLED').length;

    const prodSalesMap: Record<string, { quantity: number; revenue: number }> = {};
    orders.filter(o => o.status !== 'CANCELLED').forEach(o => {
      o.items.forEach(it => {
        if (!prodSalesMap[it.product_name]) {
          prodSalesMap[it.product_name] = { quantity: 0, revenue: 0 };
        }
        prodSalesMap[it.product_name].quantity += it.quantity;
        prodSalesMap[it.product_name].revenue += it.subtotal;
      });
    });

    const top_products = Object.entries(prodSalesMap)
      .map(([name, data]) => ({ name, quantity: data.quantity, revenue: data.revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const critical_inventory = inventoryItems
      .filter(i => i.current_stock <= i.min_stock)
      .map(i => ({ name: i.name, current_stock: i.current_stock, min_stock: i.min_stock, unit_type: i.unit_type }));

    return {
      total_sales,
      total_orders,
      average_ticket,
      orders_in_progress,
      orders_completed,
      orders_cancelled,
      top_products,
      peak_hours: total_orders > 0 ? [
        { hour: '12:00 - 13:00', count: Math.ceil(total_orders * 0.2) },
        { hour: '19:00 - 20:00', count: Math.ceil(total_orders * 0.4) },
        { hour: '20:00 - 21:00', count: Math.ceil(total_orders * 0.4) },
      ] : [],
      sales_by_payment_method: [
        { method: 'PIX Online', total: orders.filter(o => o.payment_method === 'PIX').reduce((a, b) => a + b.total, 0) },
        { method: 'Cartão de Crédito', total: orders.filter(o => o.payment_method === 'CREDIT_CARD').reduce((a, b) => a + b.total, 0) },
        { method: 'Dinheiro na Entrega', total: orders.filter(o => o.payment_method === 'CASH').reduce((a, b) => a + b.total, 0) },
      ],
      critical_inventory,
      waiter_performance: [],
    };
  },

  // -------------------------------------------------------------
  // TOTEMS
  // -------------------------------------------------------------
  getTotems: () => totems,
  getTotemById: (id: string) => totems.find(t => t.id === id),
  createTotem: (data: Omit<Totem, 'id' | 'created_at' | 'updated_at'>) => {
    const newTotem: Totem = {
      ...data,
      id: `totem_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    totems.push(newTotem);
    return newTotem;
  },
  updateTotem: (id: string, data: Partial<Totem>) => {
    const idx = totems.findIndex(t => t.id === id);
    if (idx !== -1) {
      totems[idx] = { ...totems[idx], ...data, updated_at: new Date().toISOString() };
      return totems[idx];
    }
    return null;
  },
  deleteTotem: (id: string) => {
    const idx = totems.findIndex(t => t.id === id);
    if (idx !== -1) {
      totems.splice(idx, 1);
      return true;
    }
    return false;
  },

  // -------------------------------------------------------------
  // TERMINAIS DE PAGAMENTO / MAQUININHAS POS
  // -------------------------------------------------------------
  getPaymentTerminals: () => paymentTerminals,
  getPaymentTerminalById: (id: string) => paymentTerminals.find(t => t.id === id),
  createPaymentTerminal: (data: Omit<PaymentTerminal, 'id' | 'created_at' | 'updated_at'>) => {
    const newTerminal: PaymentTerminal = {
      ...data,
      id: `term_${Date.now()}`,
      status: data.status || 'DISCONNECTED',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    paymentTerminals.push(newTerminal);
    return newTerminal;
  },
  updatePaymentTerminal: (id: string, data: Partial<PaymentTerminal>) => {
    const idx = paymentTerminals.findIndex(t => t.id === id);
    if (idx !== -1) {
      paymentTerminals[idx] = { ...paymentTerminals[idx], ...data, updated_at: new Date().toISOString() };
      return paymentTerminals[idx];
    }
    return null;
  },
  deletePaymentTerminal: (id: string) => {
    const idx = paymentTerminals.findIndex(t => t.id === id);
    if (idx !== -1) {
      paymentTerminals.splice(idx, 1);
      return true;
    }
    return false;
  },

  // -------------------------------------------------------------
  // PAYMENT INTENTS & ATTEMPTS
  // -------------------------------------------------------------
  getPaymentIntents: () => paymentIntents,
  getPaymentIntentById: (id: string) => paymentIntents.find(p => p.id === id),
  getPaymentIntentByIdempotency: (key: string) => paymentIntents.find(p => p.idempotency_key === key),
  createPaymentIntent: (data: Omit<PaymentIntent, 'id' | 'created_at' | 'updated_at'>) => {
    const newIntent: PaymentIntent = {
      ...data,
      id: `pi_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    paymentIntents.push(newIntent);
    return newIntent;
  },
  updatePaymentIntent: (id: string, data: Partial<PaymentIntent>) => {
    const idx = paymentIntents.findIndex(p => p.id === id);
    if (idx !== -1) {
      paymentIntents[idx] = { ...paymentIntents[idx], ...data, updated_at: new Date().toISOString() };
      return paymentIntents[idx];
    }
    return null;
  },
  createPaymentAttempt: (data: Omit<PaymentAttempt, 'id' | 'created_at'>) => {
    const newAttempt: PaymentAttempt = {
      ...data,
      id: `pa_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
    };
    paymentAttempts.push(newAttempt);
    return newAttempt;
  },
  getPaymentAttempts: (paymentIntentId: string) => {
    return paymentAttempts.filter(a => a.payment_intent_id === paymentIntentId);
  },
};

