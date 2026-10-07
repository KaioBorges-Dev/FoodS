-- ====================================================================
-- FoodS — Seed Inicial Limpo para Inicialização de Tenant
-- ====================================================================

-- Inserção do Tenant Padrão Inicial (Caso não exista)
INSERT INTO public.organizations (id, name, legal_name, document, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'FoodS Restaurante & Gastronomia',
    'FoodS Restaurante e Serviços de Alimentação Ltda',
    '00.000.000/0001-00',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Unidade Matriz Padrão
INSERT INTO public.units (id, organization_id, name, slug, address_street, address_number, address_neighborhood, address_city, address_state, address_zipcode, is_active, is_open)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Unidade Matriz',
    'matriz',
    'Av. Principal',
    '100',
    'Centro',
    'São Paulo',
    'SP',
    '01000-000',
    TRUE,
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- Configurações de Loja Iniciais
INSERT INTO public.store_settings (id, organization_id, unit_id, pickup_enabled, delivery_enabled, table_service_enabled, auto_approve_orders, min_order_value)
VALUES (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    0.00
) ON CONFLICT DO NOTHING;

-- ====================================================================
-- Usuário Owner Pré-definido no Supabase Auth & Profiles
-- E-mail: admin@admin | Senha: admin123 | Role: owner
-- ====================================================================
DO $$
DECLARE
    v_user_id UUID := '00000000-0000-0000-0000-000000000099';
    v_org_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- Inserção no auth.users do Supabase se a tabela existir
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            v_user_id,
            'authenticated',
            'authenticated',
            'admin@admin',
            crypt('admin123', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"first_name":"Administrador","last_name":"Owner Master","role":"owner"}',
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO NOTHING;
    END IF;

    -- Inserção do Perfil Público com Nível de Acesso Owner
    INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
        phone,
        organization_id,
        role,
        status,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        'admin@admin',
        'Administrador',
        'Owner Master',
        '(11) 99999-9999',
        v_org_id,
        'owner',
        'active',
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        role = 'owner',
        status = 'active',
        email = 'admin@admin';
END $$;


