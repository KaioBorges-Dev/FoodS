-- ====================================================================
-- FoodS — Schema SQL Completo para Supabase (PostgreSQL)
-- Versão: 3.0.0 (Produção com Suporte a Totens, Terminais POS e Gateways)
-- Instruções: Copie todo este arquivo e execute no SQL Editor do Supabase.
-- ====================================================================

-- 1. Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabela de Organizações (Tenants)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    document VARCHAR(20),
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Perfis de Usuário (Vinculados ao auth.users do Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url TEXT,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'operator', -- owner, admin, manager, coordinator, waiter, operator, kitchen, financial
    status VARCHAR(20) DEFAULT 'active',
    last_access_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Unidades / Filiais
CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    email VARCHAR(255),
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(2),
    address_zipcode VARCHAR(10),
    delivery_fee DECIMAL(10,2) DEFAULT 0.00,
    delivery_radius_km DECIMAL(5,2) DEFAULT 5.00,
    avg_prep_time_minutes INT DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    is_open BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Terminais de Cartão / Maquininhas Físicas POS (Mercado Pago Point, etc)
CREATE TABLE IF NOT EXISTS public.payment_terminals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL DEFAULT 'mercadopago_point',
    name VARCHAR(100) NOT NULL,
    model VARCHAR(50),
    external_terminal_id VARCHAR(100) NOT NULL, -- Device ID na Point API (ex: PAX_A910__123456)
    status VARCHAR(30) NOT NULL DEFAULT 'DISCONNECTED', -- CONNECTED, DISCONNECTED, PROCESSING, UNAVAILABLE
    last_seen_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Totens de Autoatendimento
CREATE TABLE IF NOT EXISTS public.totems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    identifier VARCHAR(50) NOT NULL, -- Ex: TOTEM_01
    status VARCHAR(30) NOT NULL DEFAULT 'ONLINE', -- ONLINE, OFFLINE, BUSY, MAINTENANCE
    terminal_id UUID REFERENCES public.payment_terminals(id) ON DELETE SET NULL,
    payment_methods_enabled JSONB DEFAULT '{"pix": true, "card": true, "cash": false}'::jsonb,
    require_phone BOOLEAN DEFAULT FALSE,
    auto_print_receipt BOOLEAN DEFAULT TRUE,
    auto_reset_seconds INT DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    last_ping_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(unit_id, identifier)
);

-- 7. Configurações da Loja e Autenticação
CREATE TABLE IF NOT EXISTS public.store_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
    business_hours JSONB DEFAULT '{}'::jsonb,
    pickup_enabled BOOLEAN DEFAULT TRUE,
    delivery_enabled BOOLEAN DEFAULT TRUE,
    table_service_enabled BOOLEAN DEFAULT TRUE,
    auto_approve_orders BOOLEAN DEFAULT FALSE,
    min_order_value DECIMAL(10,2) DEFAULT 0.00,
    receipt_footer_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, unit_id)
);

CREATE TABLE IF NOT EXISTS public.auth_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
    google_oauth_enabled BOOLEAN DEFAULT TRUE,
    email_auth_enabled BOOLEAN DEFAULT TRUE,
    require_email_verification BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Cardápio: Categorias e Produtos
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    cost_price DECIMAL(10,2) DEFAULT 0.00,
    sku VARCHAR(50),
    barcode VARCHAR(50),
    image_url TEXT,
    unit_type VARCHAR(20) DEFAULT 'un',
    is_active BOOLEAN DEFAULT TRUE,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price_override DECIMAL(10,2),
    sku VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.product_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    max_quantity INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE
);

-- 9. Estoque e Ficha Técnica
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    unit_type VARCHAR(20) NOT NULL, -- kg, g, l, ml, un
    current_stock DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    min_stock DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    supplier_name VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.technical_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    quantity_required DECIMAL(12,3) NOT NULL,
    UNIQUE(product_id, inventory_item_id)
);

CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL, -- ENTRY, EXIT, ADJUSTMENT, LOSS, SALE_CONSUMPTION
    quantity DECIMAL(12,3) NOT NULL,
    previous_stock DECIMAL(12,3) NOT NULL,
    new_stock DECIMAL(12,3) NOT NULL,
    unit_cost DECIMAL(10,2),
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Mesas e Atendimento
CREATE TABLE IF NOT EXISTS public.tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    number VARCHAR(20) NOT NULL,
    name VARCHAR(100),
    capacity INT DEFAULT 4,
    status VARCHAR(30) DEFAULT 'FREE', -- FREE, OCCUPIED, BILL_REQUESTED, CLOSED
    current_waiter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    opened_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Clientes
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    whatsapp VARCHAR(20),
    email VARCHAR(255),
    password_hash TEXT,
    has_account BOOLEAN DEFAULT FALSE,
    notes TEXT,
    total_orders INT DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    last_order_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Pedidos & Itens do Pedido
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number BIGSERIAL,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    totem_id UUID REFERENCES public.totems(id) ON DELETE SET NULL,
    order_channel VARCHAR(30) DEFAULT 'POS', -- ONLINE, POS, TOTEM, WAITER, WHATSAPP
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    waiter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    waiter_name VARCHAR(255),
    table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
    table_number VARCHAR(20),
    type VARCHAR(30) NOT NULL DEFAULT 'COUNTER', -- DINE_IN, PICKUP, DELIVERY, COUNTER, TAKEAWAY
    status VARCHAR(30) NOT NULL DEFAULT 'RECEIVED', -- RECEIVED, CONFIRMED, PREPARING, READY, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
    payment_status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, AUTHORIZED, PAID, FAILED, REFUNDED, CANCELLED
    payment_method VARCHAR(50), -- PIX, CREDIT_CARD, DEBIT_CARD, CASH, CARD_POS, PIX_PRESENTIAL
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    delivery_address JSONB,
    cancel_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    subtotal DECIMAL(10,2) NOT NULL,
    notes TEXT,
    selected_addons JSONB DEFAULT '[]'::jsonb,
    selected_variant JSONB
);

-- 13. Intenções e Tentativas de Pagamento (Idempotência e Auditoria)
CREATE TABLE IF NOT EXISTS public.payment_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    totem_id UUID REFERENCES public.totems(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    provider VARCHAR(50) NOT NULL, -- infinitypay, mercadopago, pagseguro, syncpay, cash
    method VARCHAR(50) NOT NULL, -- PIX, CREDIT_CARD, DEBIT_CARD, CARD_POS
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'BRL',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- CREATED, PENDING, PROCESSING, APPROVED, DECLINED, CANCELLED, EXPIRED, REFUNDED
    external_id VARCHAR(255),
    device_id VARCHAR(100),
    qr_code TEXT,
    qr_code_base64 TEXT,
    ticket_url TEXT,
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_intent_id UUID NOT NULL REFERENCES public.payment_intents(id) ON DELETE CASCADE,
    attempt_number INT NOT NULL DEFAULT 1,
    method VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PROCESSING',
    raw_response JSONB,
    error_code VARCHAR(100),
    error_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Gateways de Pagamento
CREATE TABLE IF NOT EXISTS public.payment_gateways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- infinitypay, mercadopago, pagseguro, syncpay, cash, card_pos, pix_presential
    is_active BOOLEAN DEFAULT FALSE,
    credentials JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(unit_id, provider)
);

-- 15. Conexões do WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL DEFAULT 'BAILEYS',
    status VARCHAR(30) NOT NULL DEFAULT 'DISCONNECTED',
    phone_number VARCHAR(30),
    qr_code TEXT,
    meta_config JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(unit_id)
);

-- 16. Habilitação de RLS (Row Level Security) em Todas as Tabelas
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.totems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_connections ENABLE ROW LEVEL SECURITY;

-- 17. Policies RLS de Autenticação Segura
CREATE POLICY "Permitir leitura pública ou autenticada de produtos ativos" 
ON public.products FOR SELECT USING (is_active = true);

CREATE POLICY "Permitir leitura pública ou autenticada de categorias ativas" 
ON public.categories FOR SELECT USING (is_active = true);

CREATE POLICY "Membros da organização acessam unidades" 
ON public.units FOR ALL USING (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Membros da organização acessam pedidos" 
ON public.orders FOR ALL USING (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);
