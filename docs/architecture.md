# Documentação de Arquitetura — FoodS SaaS

## 1. Visão Geral da Arquitetura

O **FoodS** adota uma arquitetura modular baseada em microsserviços integrados através de um **API Gateway central em Node.js com Express e TypeScript**, utilizando **Supabase PostgreSQL** como camada de persistência relacional com **Row Level Security (RLS)** para isolamento multi-tenant rigoroso.

---

## 2. Diagrama da Arquitetura em Seta de Eventos

```text
[ Cliente / Cardápio Online ] ──┐
[ Painel Web / Gestor ]     ──┼──> [ API Gateway Express / Port 3000 ]
[ Garçom / Tablet / App ]   ──┘                   │
                                                  ▼
                                ┌───────────────────────────────────┐
                                │          MICROSSERVIÇOS           │
                                ├───────────────────────────────────┤
                                │ • auth-service                    │
                                │ • restaurant-service              │
                                │ • catalog-service                 │
                                │ • order-service (KDS)             │
                                │ • payment-service (Gateways)      │
                                │ • inventory-service (Ficha Téc)   │
                                │ • whatsapp-service (Meta/Baileys) │
                                │ • reporting-service               │
                                └───────────────────────────────────┘
                                                  │
                                                  ▼
                                 ┌─────────────────────────────────┐
                                 │     SUPABASE POSTGRESQL DB      │
                                 │  (RLS Multi-Tenant Policies)    │
                                 └─────────────────────────────────┘
```

---

## 3. Fluxo de Dedução de Estoque pela Ficha Técnica

1. Garçom ou Cliente lança um pedido no sistema.
2. Pedido é registrado com status `RECEIVED`.
3. O gestor ou cozinha confirma o pedido (muda status para `CONFIRMED` ou `PREPARING`).
4. O `order-service` consulta as entradas na tabela `technical_recipes` cadastradas para cada produto do pedido.
5. O `inventory-service` deduz automaticamente as quantidades de insumos registradas (ex: 200g Carne Angus, 1 Pão Brioche).
6. É registrado um log de auditoria na tabela `inventory_movements` com o tipo `SALE_CONSUMPTION`.
7. O `whatsapp-service` dispara mensagem formatada para o cliente informando o novo status.
