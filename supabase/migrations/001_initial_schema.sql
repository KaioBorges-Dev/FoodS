-- ====================================================================
-- FoodS — Schema Inicial PostgreSQL Supabase
-- Versão: 1.0.0
-- Descrição: Estrutura completa de tabelas para SaaS de Restaurantes
-- ====================================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizações (Tenants)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    document VARCHAR(20), -- CNPJ / CPF
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Perfis de Usuários (Vinculados ao Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url TEXT,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'operator', -- owner, admin, manager, coordinator, waiter, operator, kitchen, financial
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended
    last_access_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Unidades (Filiais)
CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- 4. Membros da Organização e Permissões
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
    role VARCHAR(50) NOT NULL,
    permissions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- 5. Configurações da Loja
CREATE TABLE IF NOT EXISTS public.store_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- 6. Configurações de Autenticação (ex: Google OAuth toggle)
CREATE TABLE IF NOT EXISTS public.auth_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
    google_oauth_enabled BOOLEAN DEFAULT TRUE,
    email_auth_enabled BOOLEAN DEFAULT TRUE,
    require_email_verification BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Categorias de Produtos
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Produtos
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2) DEFAULT 0.00,
    sku VARCHAR(100),
    barcode VARCHAR(100),
    image_url TEXT,
    unit_type VARCHAR(20) DEFAULT 'un', -- un, kg, g, ml, l
    is_active BOOLEAN DEFAULT TRUE,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Variações e Adicionais de Produtos
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price_override DECIMAL(10,2),
    sku VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.product_addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    max_quantity INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE
);

-- 10. Insumos de Estoque (Inventory Items)
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    unit_type VARCHAR(20) NOT NULL, -- g, kg, ml, l, un
    current_stock DECIMAL(12,4) DEFAULT 0.0000,
    min_stock DECIMAL(12,4) DEFAULT 0.0000,
    unit_cost DECIMAL(10,2) DEFAULT 0.00,
    supplier_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Ficha Técnica (Technical Recipes / Bill of Materials)
CREATE TABLE IF NOT EXISTS public.technical_recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    quantity_required DECIMAL(12,4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, inventory_item_id)
);

-- 12. Movimentações de Estoque
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- ENTRY, EXIT, ADJUSTMENT, LOSS, SALE_CONSUMPTION
    quantity DECIMAL(12,4) NOT NULL,
    previous_stock DECIMAL(12,4) NOT NULL,
    new_stock DECIMAL(12,4) NOT NULL,
    unit_cost DECIMAL(10,2),
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Mesas e Comandas
CREATE TABLE IF NOT EXISTS public.tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
    number VARCHAR(20) NOT NULL,
    name VARCHAR(100),
    capacity INT DEFAULT 4,
    status VARCHAR(30) DEFAULT 'FREE', -- FREE, OCCUPIED, BILL_REQUESTED, CLOSED
    current_waiter_id UUID REFERENCES public.profiles(id),
    opened_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Clientes (CRM)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    whatsapp VARCHAR(20),
    email VARCHAR(255),
    notes TEXT,
    total_orders INT DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    last_order_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    street VARCHAR(255) NOT NULL,
    number VARCHAR(20) NOT NULL,
    complement VARCHAR(100),
    neighborhood VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    zipcode VARCHAR(10) NOT NULL,
    reference_point TEXT,
    is_default BOOLEAN DEFAULT FALSE
);

-- 15. Pedidos (Orders)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number SERIAL,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    waiter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
    type VARCHAR(30) NOT NULL, -- DINE_IN, PICKUP, DELIVERY
    status VARCHAR(30) NOT NULL DEFAULT 'RECEIVED', -- RECEIVED, CONFIRMED, PREPARING, READY, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
    payment_status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, AUTHORIZED, PAID, FAILED, REFUNDED, CANCELLED
    subtotal DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0.00,
    delivery_fee DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL,
    notes TEXT,
    delivery_address JSONB,
    cancel_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. Itens do Pedido
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    subtotal DECIMAL(10,2) NOT NULL,
    notes TEXT,
    selected_addons JSONB DEFAULT '[]'::jsonb,
    selected_variant JSONB DEFAULT '{}'::jsonb
);

-- 17. Pagamentos e Gateways
CREATE TABLE IF NOT EXISTS public.payment_gateways (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- infinitypay, mercadopago, pagseguro, syncpay, cash, card_pos, pix_presential
    is_active BOOLEAN DEFAULT FALSE,
    credentials JSONB DEFAULT '{}'::jsonb, -- encrypted / stored safely
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    gateway_provider VARCHAR(50) NOT NULL,
    method VARCHAR(50) NOT NULL, -- PIX, CREDIT_CARD, DEBIT_CARD, CASH, VOUCHER
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    transaction_id VARCHAR(255),
    qr_code_url TEXT,
    qr_code_payload TEXT,
    raw_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 18. Programa de Fidelidade
CREATE TABLE IF NOT EXISTS public.loyalty_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    points_balance INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, customer_id)
);

CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES public.loyalty_accounts(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL, -- EARN, REDEEM, EXPIRE, ADJUSTMENT
    points INT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 19. Conexões WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
    provider VARCHAR(30) NOT NULL DEFAULT 'BAILEYS', -- META_CLOUD_API, BAILEYS
    status VARCHAR(30) DEFAULT 'DISCONNECTED', -- DISCONNECTED, CONNECTING, CONNECTED, FAILED
    phone_number VARCHAR(30),
    qr_code TEXT,
    session_data JSONB,
    meta_config JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, unit_id)
);

-- 20. Webhook Events (Auditoria de Eventos de Pagamentos e WhatsApp)
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) NOT NULL,
    event_type VARCHAR(100),
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 21. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255),
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
