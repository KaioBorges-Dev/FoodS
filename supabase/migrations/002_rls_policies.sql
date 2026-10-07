-- ====================================================================
-- FoodS — Políticas de Segurança RLS (Row Level Security)
-- Versão: 1.0.0
-- Descrição: Isolamento rigoroso de Multi-Tenant no PostgreSQL Supabase
-- ====================================================================

-- Ativar RLS em todas as tabelas
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Função utilitária para capturar organization_id do usuário logado
CREATE OR REPLACE FUNCTION public.get_auth_user_organization_id()
RETURNS UUID AS $$
DECLARE
    org_id UUID;
BEGIN
    SELECT organization_id INTO org_id
    FROM public.profiles
    WHERE id = auth.uid();
    RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Políticas de Profiles
CREATE POLICY "Usuários veem o próprio perfil e da sua organização"
    ON public.profiles FOR SELECT
    USING (
        id = auth.uid() OR
        organization_id = public.get_auth_user_organization_id()
    );

CREATE POLICY "Usuários atualizam o próprio perfil"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid());

-- 2. Políticas de Organizações
CREATE POLICY "Membros veem sua própria organização"
    ON public.organizations FOR SELECT
    USING (id = public.get_auth_user_organization_id());

-- 3. Políticas das tabelas Multi-Tenant (Unidades, Produtos, Pedidos, Estoque, Mesas, Clientes)
CREATE POLICY "Isolamento Tenant para Unidades"
    ON public.units FOR ALL
    USING (organization_id = public.get_auth_user_organization_id());

CREATE POLICY "Isolamento Tenant para Categorias"
    ON public.categories FOR ALL
    USING (organization_id = public.get_auth_user_organization_id());

CREATE POLICY "Isolamento Tenant para Produtos"
    ON public.products FOR ALL
    USING (organization_id = public.get_auth_user_organization_id());

CREATE POLICY "Isolamento Tenant para Estoque"
    ON public.inventory_items FOR ALL
    USING (organization_id = public.get_auth_user_organization_id());

CREATE POLICY "Isolamento Tenant para Mesas"
    ON public.tables FOR ALL
    USING (organization_id = public.get_auth_user_organization_id());

CREATE POLICY "Isolamento Tenant para Pedidos"
    ON public.orders FOR ALL
    USING (organization_id = public.get_auth_user_organization_id());

CREATE POLICY "Isolamento Tenant para Clientes"
    ON public.customers FOR ALL
    USING (organization_id = public.get_auth_user_organization_id());

CREATE POLICY "Isolamento Tenant para Conexões WhatsApp"
    ON public.whatsapp_connections FOR ALL
    USING (organization_id = public.get_auth_user_organization_id());

CREATE POLICY "Isolamento Tenant para Gateways Pagamento"
    ON public.payment_gateways FOR ALL
    USING (organization_id = public.get_auth_user_organization_id());

CREATE POLICY "Isolamento Tenant para Configurações da Loja"
    ON public.store_settings FOR ALL
    USING (organization_id = public.get_auth_user_organization_id());

-- Acesso Público para Cardápio Digital (Leitura)
CREATE POLICY "Cardápio Público de Produtos"
    ON public.products FOR SELECT
    USING (is_active = TRUE AND is_available = TRUE);

CREATE POLICY "Cardápio Público de Categorias"
    ON public.categories FOR SELECT
    USING (is_active = TRUE);
