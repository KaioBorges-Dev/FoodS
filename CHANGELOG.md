# Changelog — FoodS SaaS

Todas as alterações notáveis deste projeto serão documentadas neste arquivo.

## [1.0.0] - 2026-10-07

### Adicionado
- Lançamento oficial do **FoodS SaaS**.
- API Gateway Node.js/Express integrado aos microsserviços do backend.
- Esquema PostgreSQL Supabase completo com migrations (`001_initial_schema.sql` e `002_rls_policies.sql`).
- Painel KDS em tempo real para controle de pedidos por etapas.
- Baixa automática de estoque por Ficha Técnica (BOM) ao confirmar pedidos.
- Interface mobile-first para Garçons com comandas, mesas e divisão de conta por pessoa.
- Cardápio Digital Público com carrinho e checkout.
- Adapters de pagamento para InfinityPay (Handle), Mercado Pago, PagSeguro, Sync Pay, Dinheiro e POS.
- Notificações automatizadas via WhatsApp (Meta Cloud API e Baileys Engine com QR Code real).
- CRM de Clientes e Programa de Fidelidade (R$ 1,00 = 1 Ponto).
- Painel de Configurações do SaaS com 16 submódulos e controle real do Google OAuth.
