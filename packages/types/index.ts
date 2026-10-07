// ====================================================================
// FoodS — Definções de Tipos TypeScript (Entidades SaaS)
// ====================================================================

export type UserRole = 
  | 'owner' 
  | 'admin' 
  | 'manager' 
  | 'coordinator' 
  | 'waiter' 
  | 'operator' 
  | 'kitchen' 
  | 'financial';

export type OrderStatus = 
  | 'RECEIVED' 
  | 'CONFIRMED' 
  | 'PREPARING' 
  | 'READY' 
  | 'OUT_FOR_DELIVERY' 
  | 'DELIVERED' 
  | 'CANCELLED';

export type PaymentStatus = 
  | 'PENDING' 
  | 'AUTHORIZED' 
  | 'PAID' 
  | 'FAILED' 
  | 'REFUNDED' 
  | 'CANCELLED';

export type PaymentMethod = 
  | 'PIX' 
  | 'CREDIT_CARD' 
  | 'DEBIT_CARD' 
  | 'CASH' 
  | 'CARD_POS' 
  | 'PIX_PRESENTIAL' 
  | 'VOUCHER';

export type PaymentGatewayProvider = 
  | 'infinitypay' 
  | 'mercadopago' 
  | 'pagseguro' 
  | 'syncpay' 
  | 'cash' 
  | 'card_pos' 
  | 'pix_presential';

export type WhatsAppProviderType = 'META_CLOUD_API' | 'BAILEYS';

export type OrderType = 'DINE_IN' | 'PICKUP' | 'DELIVERY' | 'COUNTER' | 'TAKEAWAY';

export interface Organization {
  id: string;
  name: string;
  legal_name?: string;
  document?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  organization_id: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'suspended';
  last_access_at?: string;
  created_at: string;
}

export interface Unit {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  address_city?: string;
  address_state?: string;
  address_zipcode?: string;
  delivery_fee: number;
  delivery_radius_km: number;
  avg_prep_time_minutes: number;
  is_active: boolean;
  is_open: boolean;
  created_at: string;
}

export interface StoreSettings {
  id: string;
  organization_id: string;
  unit_id: string;
  business_hours: Record<string, { open: string; close: string; active: boolean; periods?: Array<{ open: string; close: string }> }>;
  pickup_enabled: boolean;
  delivery_enabled: boolean;
  table_service_enabled: boolean;
  auto_approve_orders: boolean;
  min_order_value: number;
  avg_prep_time_minutes?: number;
  store_status?: 'OPEN' | 'CLOSED' | 'BUSY';
  receipt_footer_note?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  address_city?: string;
  address_state?: string;
  address_zipcode?: string;
}

export interface DeliveryCityRate {
  id: string;
  city_name: string;
  fee: number;
  min_order: number;
  est_minutes: number;
  is_active: boolean;
}

export interface DeliveryAreaRate {
  id: string;
  area_name: string;
  city_name: string;
  fee: number;
  min_order: number;
  est_minutes: number;
  is_active: boolean;
}

export interface DeliverySettings {
  id: string;
  organization_id: string;
  unit_id: string;
  mode: 'FLAT' | 'CITY' | 'AREA';
  flat_fee: number;
  flat_min_order: number;
  flat_est_minutes: number;
  cities: DeliveryCityRate[];
  areas: DeliveryAreaRate[];
  hours: Record<string, { is_active: boolean; periods: Array<{ open: string; close: string }> }>;
}

export interface MenuSettings {
  id: string;
  organization_id: string;
  unit_id: string;
  online_menu_enabled: boolean;
  online_orders: boolean;
  pickup: boolean;
  delivery: boolean;
  table_service: boolean;
  channels: { online: boolean; pos: boolean; totem: boolean };
  allow_item_notes: boolean;
}

export interface InventorySettings {
  id: string;
  organization_id: string;
  unit_id: string;
  auto_deduct_on_order: boolean;
  alert_threshold_pct: number;
  default_unit: string;
  enable_cost_tracking: boolean;
}

export interface LoyaltySettings {
  id: string;
  organization_id: string;
  unit_id: string;
  is_active: boolean;
  points_per_real: number;
  min_points_redemption: number;
  points_validity_days: number;
  allow_coupons: boolean;
}

export interface PrinterConfig {
  id: string;
  name: string;
  type: 'KITCHEN' | 'CASHIER' | 'BAR';
  connection: 'NETWORK' | 'USB' | 'BLUETOOTH';
  ip_address?: string;
  paper_width: 58 | 80;
  auto_print: boolean;
  category_ids: string[];
}

export interface PrintSettings {
  id: string;
  organization_id: string;
  unit_id: string;
  printers: PrinterConfig[];
  print_order_copy: boolean;
  print_kitchen_copy: boolean;
}

export interface AppearanceSettings {
  id: string;
  organization_id: string;
  unit_id: string;
  logo_url?: string;
  icon_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  button_color: string;
  theme: 'light' | 'dark' | 'auto';
}

export interface NotificationSettings {
  id: string;
  organization_id: string;
  unit_id: string;
  whatsapp_events: {
    order_received: boolean;
    order_confirmed: boolean;
    order_preparing: boolean;
    order_ready: boolean;
    order_out_for_delivery: boolean;
    order_delivered: boolean;
    order_cancelled: boolean;
  };
  system_events: {
    order_created: boolean;
    stock_alert: boolean;
    payment_received: boolean;
    customer_signup: boolean;
    system_alert: boolean;
    whatsapp_disconnected: boolean;
  };
}

export interface SecuritySettings {
  id: string;
  organization_id: string;
  unit_id: string;
  session_timeout_minutes: number;
  require_strong_password: boolean;
  max_login_attempts: number;
  force_2fa: boolean;
  active_sessions: Array<{
    id: string;
    user_name: string;
    device: string;
    ip: string;
    last_active: string;
  }>;
}

export interface RolePermissionMatrix {
  id: string;
  organization_id: string;
  role_permissions: Record<UserRole, {
    dashboard_view: boolean;
    orders_view: boolean;
    orders_create: boolean;
    orders_edit: boolean;
    orders_cancel: boolean;
    products_view: boolean;
    products_create: boolean;
    products_edit: boolean;
    products_delete: boolean;
    inventory_view: boolean;
    inventory_edit: boolean;
    financial_view: boolean;
    financial_edit: boolean;
    settings_manage: boolean;
  }>;
}

export interface AuthSettings {
  id: string;
  organization_id: string;
  google_oauth_enabled: boolean;
  email_auth_enabled: boolean;
  require_email_verification: boolean;
  updated_at: string;
}

export interface Category {
  id: string;
  organization_id: string;
  unit_id: string;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ProductAddon {
  id: string;
  product_id: string;
  name: string;
  price: number;
  max_quantity: number;
  is_active: boolean;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price_override?: number;
  sku?: string;
  is_active: boolean;
}

export interface Product {
  id: string;
  organization_id: string;
  unit_id: string;
  category_id?: string;
  category_name?: string;
  name: string;
  description?: string;
  price: number;
  cost_price: number;
  sku?: string;
  barcode?: string;
  image_url?: string;
  unit_type: string;
  is_active: boolean;
  is_available: boolean;
  variants?: ProductVariant[];
  addons?: ProductAddon[];
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  organization_id: string;
  unit_id: string;
  name: string;
  unit_type: string;
  current_stock: number;
  min_stock: number;
  unit_cost: number;
  supplier_name?: string;
  updated_at: string;
}

export interface TechnicalRecipe {
  id: string;
  product_id: string;
  inventory_item_id: string;
  inventory_item_name?: string;
  quantity_required: number;
}

export interface InventoryMovement {
  id: string;
  organization_id: string;
  unit_id: string;
  inventory_item_id: string;
  inventory_item_name?: string;
  type: 'ENTRY' | 'EXIT' | 'ADJUSTMENT' | 'LOSS' | 'SALE_CONSUMPTION';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  unit_cost?: number;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface TableItem {
  id: string;
  organization_id: string;
  unit_id: string;
  number: string;
  name?: string;
  capacity: number;
  status: 'FREE' | 'OCCUPIED' | 'BILL_REQUESTED' | 'CLOSED';
  current_waiter_id?: string;
  opened_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  organization_id: string;
  name: string;
  phone: string; // E.164 ou normalizado
  whatsapp?: string;
  email?: string;
  password_hash?: string;
  has_account: boolean;
  notes?: string;
  total_orders: number;
  total_spent: number;
  last_order_at?: string;
  created_at: string;
}

export interface PasswordRecoveryPin {
  id: string;
  phone: string;
  pin_code: string; // 6 dígitos
  expires_at: string;
  used: boolean;
  attempts: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  notes?: string;
  selected_addons?: Array<{ name: string; price: number; quantity: number }>;
  selected_variant?: { name: string; price_override?: number };
}

export interface Order {
  id: string;
  order_number: number;
  organization_id: string;
  unit_id: string;
  totem_id?: string;
  order_channel?: 'ONLINE' | 'POS' | 'TOTEM' | 'WAITER' | 'WHATSAPP';
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  waiter_id?: string;
  waiter_name?: string;
  table_id?: string;
  table_number?: string;
  type: OrderType;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method?: PaymentMethod;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  notes?: string;
  delivery_address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipcode: string;
  };
  cancel_reason?: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface PaymentTerminal {
  id: string;
  organization_id: string;
  unit_id: string;
  provider: 'mercadopago_point' | 'pagseguro_smart' | 'stone' | 'cielo';
  name: string;
  model?: string;
  external_terminal_id: string; // Ex: PAX_A910__123456 ou serial Mercado Pago Point
  status: 'CONNECTED' | 'DISCONNECTED' | 'PROCESSING' | 'UNAVAILABLE' | 'UNKNOWN';
  last_seen_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Totem {
  id: string;
  organization_id: string;
  unit_id: string;
  name: string;
  identifier: string; // Ex: TOTEM_01
  status: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'MAINTENANCE';
  terminal_id?: string; // Terminal de maquininha associado
  payment_methods_enabled: {
    pix: boolean;
    card: boolean;
    cash: boolean;
  };
  require_phone: boolean;
  auto_print_receipt: boolean;
  auto_reset_seconds: number;
  is_active: boolean;
  last_ping_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentIntent {
  id: string;
  organization_id: string;
  unit_id: string;
  totem_id?: string;
  order_id?: string;
  provider: PaymentGatewayProvider;
  method: PaymentMethod;
  amount: number;
  currency: string;
  status: 'CREATED' | 'PENDING' | 'PROCESSING' | 'APPROVED' | 'DECLINED' | 'CANCELLED' | 'EXPIRED' | 'REFUNDED';
  external_id?: string; // ID da cobrança no MP ou intent na Point API
  device_id?: string; // Terminal ID
  qr_code?: string;
  qr_code_base64?: string;
  ticket_url?: string;
  idempotency_key: string;
  error_message?: string;
  metadata?: Record<string, any>;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentAttempt {
  id: string;
  payment_intent_id: string;
  attempt_number: number;
  method: PaymentMethod;
  status: 'INITIATED' | 'PROCESSING' | 'SUCCESS' | 'DECLINED' | 'TIMEOUT' | 'CANCELLED';
  raw_response?: any;
  error_code?: string;
  error_details?: string;
  created_at: string;
}


export interface PaymentGatewayConfig {
  id: string;
  organization_id: string;
  unit_id: string;
  provider: PaymentGatewayProvider;
  is_active: boolean;
  credentials: Record<string, string>;
}

export interface LoyaltyAccount {
  id: string;
  organization_id: string;
  customer_id: string;
  customer_name: string;
  points_balance: number;
  updated_at: string;
}

export interface WhatsAppConnection {
  id: string;
  organization_id: string;
  unit_id: string;
  provider: WhatsAppProviderType;
  status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'FAILED';
  phone_number?: string;
  qr_code?: string;
  qrPayload?: string;
  meta_config?: {
    phone_number_id?: string;
    business_account_id?: string;
    access_token?: string;
    verify_token?: string;
  };
  updated_at: string;
}

export interface ReportingSummary {
  total_sales: number;
  total_orders: number;
  average_ticket: number;
  orders_in_progress: number;
  orders_completed: number;
  orders_cancelled: number;
  top_products: Array<{ name: string; quantity: number; revenue: number }>;
  peak_hours: Array<{ hour: string; count: number }>;
  sales_by_payment_method: Array<{ method: string; total: number }>;
  critical_inventory: Array<{ name: string; current_stock: number; min_stock: number; unit_type: string }>;
  waiter_performance: Array<{ waiter_name: string; orders_count: number; total_sales: number }>;
}

