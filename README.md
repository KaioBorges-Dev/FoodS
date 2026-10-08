# FoodS — Plataforma SaaS de Nível de Produção para Restaurantes e Gestão Gastronômica

O **FoodS SaaS** é uma plataforma multi-tenant completa, moderna e escalável, projetada para a operação integral de restaurantes, bares, lanchonetes, pizzarias, hamburguerias, cafeterias, dark kitchens e franquias.

---

## 1. Apresentação e Explicação Completa do Sistema

O FoodS foi arquitetado para resolver de ponta a ponta todos os gargalos operacionais e financeiros do food service moderno, integrando salão, cozinha, delivery, caixa, autoatendimento e retaguarda administrativa em uma única plataforma em tempo real.

### 1.1. Arquitetura e Pilares Tecnológicos
- **Multi-Tenancy Nativo com Isolamento RLS**: Isolamento estrito de dados por Organização (`organization_id`) e Filiais/Unidades (`unit_id`), garantindo total privacidade e escalabilidade para redes e franquias.
- **Banco de Dados PostgreSQL Relacional & Supabase**: Estrutura com constraints, chaves estrangeiras, triggers de auditoria, logs de estoque e políticas de segurança Row Level Security (RLS).
- **Tempo Real (WebSockets / Realtime)**: Sincronização instantânea entre pedidos feitos no Salão, Totem ou Delivery com a Cozinha (KDS) e o Caixa (PDV).
- **Nível de Produção**: Sem dados fictícios ou placeholders; fluxos reais de pagamento, emissão de comandas e impressão térmica.

### 1.2. Módulos e Recursos Operacionais

#### 📊 Dashboard & Métricas em Tempo Real
- Visão executiva com faturamento do dia, ticket médio, quantidade de pedidos e ocupação do salão.
- Gráficos comparativos de desempenho financeiro, produtos mais vendidos (curva ABC) e canais de venda (Salão, Balcão, Totem, Delivery).

#### 🖥️ KDS — Kitchen Display System (Gestão de Cozinha e Bar)
- Visualização em colunas Kanban (*Recebido*, *Em Preparo*, *Pronto*, *Entregue*).
- Cronômetro de tempo de preparo com alertas visuais por cor para pedidos atrasados.
- Separação inteligente de itens por setor de produção (ex: Cozinha Quente vs. Bar/Bebidas).

#### 💳 PDV / Frente de Caixa Balcão
- Abertura, fechamento e sangria/suprimento de caixa com controle de operador.
- Lançamento ultra-rápido de pedidos com atalhos de teclado e busca preditiva.
- Múltiplos meios de pagamento por pedido (divisão de conta: dinheiro, PIX, cartões e vouchers).

#### 📱 Totem de Autoatendimento Touchscreen
- Interface intuitiva para terminais touchscreen verticais ou horizontais.
- Seleção de consumo: *Comer no Local* ou *Para Viagem*.
- Customização de itens (adicionais, remoção de ingredientes, observações).
- Pagamento integrado via Maquininha Mercado Pago Point (leitura de cartão/aproximação) e PIX Dinâmico.
- Encerramento automático de sessão por inatividade (2 minutos) ou após confirmação de pagamento e impressão da comanda.

#### 🍽️ Salão, Mesas e Comandas de Garçom
- Mapa visual de mesas com status em tempo real (*Livre*, *Ocupada*, *Conta Solicitada*, *Reservada*).
- Transferência e junção de mesas e comandas.
- Fechamento de conta com divisão por número de pessoas ou por itens consumidos.

#### 📖 Cardápio Digital Público & QR Code de Mesa
- Cardápio responsivo acessível via QR Code fixado na mesa ou link do restaurante.
- Atualização em tempo real de preços, fotos, disponibilidade e promoções.

#### 🥩 Engenharia de Cardápio & Ficha Técnica Proporcional (BOM)
- Composição detalhada de receitas e custos de insumos por prato/bebida.
- Baixa proporcional e automática de estoque no momento da confirmação do pedido.

#### 📦 Controle de Estoque, Insumos e Perdas
- Gestão de matérias-primas e produtos prontos com controle de lote e validade.
- Alertas de estoque mínimo e registro de perdas/desperdícios.

#### 💬 WhatsApp Oficial (Meta Cloud API & QR Code)
- Notificações automáticas de status de pedido para o cliente (*Confirmado*, *Em Preparo*, *Saiu para Entrega*).
- Central de atendimento e disparos promocionais segmentados.

#### ⚙️ Central de Configurações Multi-Tenant (17 Áreas Integradas)
Configuração profunda e granular de todos os aspectos do restaurante:
1. **Loja**: Dados cadastrais, CNPJ, logo, horários de funcionamento e regras gerais.
2. **Unidades**: Gerenciamento multi-filiais, matriz e filiais com cardápios independentes.
3. **Usuários**: Cadastro de funcionários, operadores e administradores.
4. **Permissões**: Controle de acesso por papéis (RBAC: *Owner*, *Admin*, *Manager*, *Cashier*, *Waiter*, *Cook*).
5. **Autenticação**: Políticas de login, autenticação em duas etapas e Google OAuth.
6. **Pagamentos**: Integração de gateways (Mercado Pago, InfinityPay, PagSeguro, Sync Pay, PIX e Maquininhas).
7. **WhatsApp**: Conexão com a API Oficial da Meta e configurações de templates.
8. **Notificações**: Gatilhos de avisos sonoros e notificações push para salão e cozinha.
9. **Entregas**: Taxas por bairro, raio de distância em KM e regras de frete.
10. **Cardápio**: Categorias, adicionais, tags de alérgenos e destaques.
11. **Estoque**: Parâmetros de reposição, unidades de medida e centros de custo.
12. **Fidelidade**: Regras de cashback, acúmulo de pontos e resgate de brindes.
13. **Impressão**: Configuração de impressoras térmicas (ESC/POS 80mm e 58mm) por setor.
14. **Aparência**: Cores primárias, logotipo, banner, tipografia e temas claro/escuro.
15. **Integrações**: Webhooks para sistemas externos, iFood, ERPs e APIs REST.
16. **Segurança**: Auditoria de logs, sessões ativas e restrições de IP.
17. **Totens**: Registro e parametrização de cada terminal de autoatendimento.

---

## 2. 🔑 Credenciais Padrão de Acesso (Administrador Owner Master)

Para acessar o painel de gerenciamento com acesso irrestrito a todas as funcionalidades e configurações:

| Campo | Valor de Acesso | Descrição |
| :--- | :--- | :--- |
| **E-mail** | `admin@admin` | Usuário Proprietário / Owner |
| **Senha** | `admin123` | Senha administrativa padrão |
| **Nível / Role** | `owner` (Proprietário) | Permissões totais (RBAC completo) |
| **Acesso ao Painel** | `http://localhost:3000` | Interface Administrativa |

> **Dica de Segurança em Produção**: Após o primeiro acesso ou ao realizar o deploy em ambiente público, altere a senha nas configurações de Usuários (`/configuracoes/usuarios`).

---

## 3. 📸 Demonstração Visual do Sistema (Screenshots)

Configure as URLs dos arquivos `.png` das capturas de tela no arquivo `.env` ou visualize as telas principais:

### Painel Principal (Dashboard & Métricas em Tempo Real)
![Dashboard FoodS](https://i.imgur.com/ACdavQh.jpeg)

### KDS — Kitchen Display System (Gestão de Pedidos em Cozinha)
![KDS Cozinha](https://i.imgur.com/V9qRCD4.jpeg)

### PDV / Caixa Balcão (Frente de Caixa Rápida)
![PDV Caixa](https://i.imgur.com/TYU3XCf.jpeg)

### Totem de Autoatendimento Touchscreen (Integração Mercado Pago Point)
![Totem Autoatendimento](https://i.imgur.com/WhfybR8.jpeg)

### Cardápio Digital & Engenharia de Produtos
![Cardápio Digital](https://i.imgur.com/WSwprcd.jpeg)

### Controle de Estoque & Ficha Técnica Proporcional (BOM)
![Estoque e Ficha Técnica](https://i.imgur.com/gQeMZFe.jpeg)

### Salão & Comandas de Garçom (Gestão de Mesas em Tempo Real)
![Gestão de Mesas](https://i.imgur.com/pPrT4Tx.jpeg)

### Central de Configurações Multi-Tenant (17 Áreas Integradas)
![Configurações Globais](https://i.imgur.com/INWiuag.jpeg)

---

## 4. 📁 Estrutura Real do Código-Fonte

Abaixo está o mapeamento exato da arquitetura de pastas e arquivos que compõem o repositório do **FoodS SaaS**:

```text
foods/
├── apps/
│   ├── api-gateway/
│   │   └── index.ts               # Gateway unificado de APIs REST e rotas de microsserviços Express
│   ├── payment-service/
│   │   └── index.ts               # Módulo de pagamentos, Mercado Pago Point API, PIX e webhooks
│   └── whatsapp-service/
│       └── index.ts               # Integração oficial Meta WhatsApp Cloud API e notificações
│
├── packages/
│   ├── database/
│   │   └── store.ts               # Camada StoreDB, queries de persistência e fallback em memória
│   ├── shared/
│   │   └── index.ts               # Utilitários compartilhados, formatação BRL, loggers e helpers
│   └── types/
│       └── index.ts               # Definições completas de tipos TypeScript de todo o ecossistema
│
├── src/
│   ├── components/                # Telas operacionais e componentes da interface
│   │   ├── CatalogView.tsx        # Cardápio Digital, Categorias, Produtos e Ficha Técnica
│   │   ├── CustomersView.tsx      # Gestão de Clientes (CRM) e Histórico de Consumo
│   │   ├── DashboardView.tsx      # Painel Principal, Faturamento e Métricas em Tempo Real
│   │   ├── DigitalMenuView.tsx    # Cardápio Digital Público para Clientes e QR Code de Mesa
│   │   ├── ImageUploader.tsx      # Upload de Imagens de Produtos e Logos
│   │   ├── InventoryView.tsx      # Controle de Estoque, Lotes, Perdas e Baixa Automática
│   │   ├── LoginView.tsx          # Tela de Login Administrativo e Operacional
│   │   ├── NotificationCenter.tsx # Central de Notificações, Alertas e Webhooks
│   │   ├── OrdersView.tsx         # KDS (Cozinha) e Monitor de Pedidos em Tempo Real
│   │   ├── PaymentsView.tsx       # Gestão Financeira, Conciliação e Gateways de Pagamento
│   │   ├── PosView.tsx            # PDV Balcão / Frente de Caixa Rápida
│   │   ├── ReportsView.tsx        # Relatórios Financeiros, ABC de Produtos e DRE Simplificado
│   │   ├── SettingsView.tsx       # Central com as 17 Abas de Configurações
│   │   ├── Sidebar.tsx            # Navegação Lateral Responsiva com Controle de Acesso
│   │   ├── Toast.tsx              # Sistema de Notificações Toast na Interface
│   │   ├── TopBar.tsx             # Barra Superior com Perfil do Usuário e Notificações
│   │   ├── TotemView.tsx          # Totem de Autoatendimento Touchscreen com Maquininha Point
│   │   ├── WaiterTablesView.tsx   # Gestão de Salão, Mesas e Comandas de Garçom
│   │   └── WhatsAppView.tsx       # Central de Disparos e Mensagens WhatsApp
│   ├── lib/
│   │   └── supabase.ts            # Cliente Supabase JS e conectores do banco
│   ├── App.tsx                    # Componente Raiz da Aplicação e Roteamento
│   ├── index.css                  # Estilos Globais e Configuração Tailwind CSS
│   └── main.tsx                   # Ponto de Entrada da Aplicação React SPA
│
├── supabase/
│   ├── migrations/                # Migrações versionadas do banco de dados
│   │   ├── 001_initial_schema.sql # Schema relacional completo com tabelas e índices
│   │   └── 002_rls_policies.sql   # Políticas de segurança Row Level Security (RLS)
│   ├── schema.sql                 # DDL consolidado do PostgreSQL com triggers e funções
│   ├── seed.sql                   # Carga de dados iniciais e usuário Owner Master (admin@admin)
│   └── README.md                  # Documentação do banco Supabase
│
├── docs/
│   └── architecture.md            # Documentação técnica e fluxos arquiteturais
│
├── .env.example                   # Modelo completo de variáveis de ambiente com documentação
├── .gitignore                     # Configuração de arquivos ignorados pelo Git
├── CHANGELOG.md                   # Histórico de versões e alterações
├── CONTRIBUTING.md                # Diretrizes para novos colaboradores
├── Dockerfile                     # Dockerfile multi-stage para produção em Alpine Linux
├── docker-compose.yml             # Orquestração do contêiner com variáveis de ambiente
├── index.html                     # Entrypoint HTML do Vite
├── LICENSE                        # Licença MIT Open-Source
├── metadata.json                  # Metadados da aplicação AI Studio
├── package.json                   # Dependências e scripts do projeto
├── SECURITY.md                    # Política de segurança do projeto
├── server.ts                      # Servidor backend Express + Vite middlewares
├── tsconfig.json                  # Configuração TypeScript
└── vite.config.ts                 # Configuração de build do Vite
```

---

## 5. 🛠️ Tutoriais e Guias Passo a Passo de Configuração

### 5.1. Guia: Como Obter as API Keys e Configurar o `.env`

Todas as variáveis devem ser definidas no arquivo `.env` localizado na raiz do projeto (crie a partir de `cp .env.example .env`).

#### 1. Supabase (Banco de Dados PostgreSQL, Auth e Realtime)
1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard) e faça login.
2. Clique em **New Project**, defina um nome (ex: `foods-saas`) e defina a senha do banco (`Database Password`).
3. Após a criação do projeto:
   - Vá em **Project Settings** > **API**:
     - Copie a **Project URL** ➔ Coloque em `VITE_SUPABASE_URL`
     - Copie a chave **anon / public** ➔ Coloque em `VITE_SUPABASE_ANON_KEY`
     - Copie a chave **service_role (secret)** ➔ Coloque em `SUPABASE_SERVICE_ROLE_KEY`
   - Vá em **Project Settings** > **Database** > **Connection string** (URI):
     - Copie o endereço `postgresql://postgres:[SUA-SENHA]@db.[SEU-PROJETO].supabase.co:5432/postgres` ➔ Coloque em `DATABASE_URL`
4. **Onde estão os arquivos da Database para Upload**:
   - Diretório no projeto: `supabase/` e `supabase/migrations/`
   - **Arquivo 1 (Estrutura e Tabelas)**: `supabase/schema.sql` (ou `supabase/migrations/001_initial_schema.sql` e `002_rls_policies.sql`)
   - **Arquivo 2 (Carga Inicial e Admin)**: `supabase/seed.sql`
5. **Como fazer o Upload no SQL Editor do Supabase**:
   - No menu lateral esquerdo do Supabase Dashboard, clique no ícone **SQL Editor** (ou `Ctrl+K` e digite SQL).
   - Clique em **+ New Query**.
   - Abra o arquivo `supabase/schema.sql` do repositório, copie todo o conteúdo, cole no editor do Supabase e clique no botão verde **Run** (ou `Ctrl+Enter`).
   - Clique em **+ New Query** novamente.
   - Abra o arquivo `supabase/seed.sql`, copie o conteúdo, cole no editor e clique em **Run** (isto criará a organização demo e o usuário master `admin@admin` com senha `admin123`).

---

#### 2. Mercado Pago (PIX Dinâmico e Maquininhas Point para Totem / POS)
1. Acesse o [Portal de Desenvolvedores do Mercado Pago](https://www.mercadopago.com.br/developers/panel).
2. Clique em **Criar aplicação**, selecione **Pagamentos presenciais / Checkout Transparente**.
3. No painel da aplicação, acesse **Credenciais de Produção**:
   - Copie o **Access Token** (`APP_USR-...`) ➔ Coloque em `MERCADOPAGO_ACCESS_TOKEN`
   - Copie a **Public Key** (`APP_USR-...`) ➔ Coloque em `MERCADOPAGO_PUBLIC_KEY`
4. No menu **Webhooks**, configure a URL de notificação: `https://seu-dominio.com.br/api/webhooks/mercadopago` e selecione os tópicos `payment_intent.point` e `payments`.

---

#### 3. Meta Cloud API (WhatsApp Oficial do Restaurante)
1. Acesse o [Meta for Developers](https://developers.facebook.com/).
2. Crie ou selecione seu aplicativo do tipo **Empresa (Business)**.
3. Adicione o produto **WhatsApp** ao aplicativo.
4. No painel do WhatsApp > **Configuração da API**:
   - Copie o **Token de Acesso Temporário ou Permanente** ➔ Coloque em `META_WHATSAPP_TOKEN`
   - Copie a **Identificação do número de telefone (Phone Number ID)** ➔ Coloque em `META_WHATSAPP_PHONE_NUMBER_ID`
   - Copie a **Identificação da conta do WhatsApp Business** ➔ Coloque em `META_WHATSAPP_BUSINESS_ACCOUNT_ID`
5. No menu **Configuração**, configure o Webhook com a URL: `https://seu-dominio.com.br/api/webhooks/whatsapp` e defina o token de verificação (`META_WHATSAPP_VERIFY_TOKEN="foods_wa_verify_token_secure"`).

---

#### 4. InfinityPay (Infinity Handle & Checkout Integrado)
1. Acesse sua conta na [InfinitePay](https://www.infinitepay.io/) ou o aplicativo oficial.
2. Copie apenas a sua **InfiniteTag / Handle** (ex: `$seurestaurante`).
3. Coloque em `INFINITYPAY_HANDLE` no `.env` ou diretamente no painel em **Configurações > Pagamentos > InfinityPay** (não é necessário configurar webhook ou chaves adicionais).

---

#### 5. Google OAuth 2.0 (Login Social de Funcionários e Clientes)
1. Acesse o [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Crie uma credencial do tipo **ID do cliente OAuth 2.0** (Tipo de aplicativo: *Aplicativo Web*).
3. Em **URIs de redirecionamento autorizados**, adicione:
   - `https://<seu-projeto-supabase>.supabase.co/auth/v1/callback`
   - `http://localhost:3000`
4. Copie o **Client ID** ➔ Coloque em `GOOGLE_CLIENT_ID`
5. Copie a **Chave Secreta do Cliente (Client Secret)** ➔ Coloque em `GOOGLE_CLIENT_SECRET`

---

### 5.2. 🗄️ Localização da Database e Guia de Upload no Supabase

Todos os arquivos SQL e migrações do banco de dados relacional PostgreSQL estão localizados no diretório raiz `/supabase/` do projeto:

| Arquivo | Caminho Relativo | Descrição |
| :--- | :--- | :--- |
| **Schema Consolidado** | `supabase/schema.sql` | Contém a DDL completa: extensões (`uuid-ossp`, `pgcrypto`), todas as tabelas relacionais (`organizations`, `units`, `profiles`, `roles`, `categories`, `products`, `orders`, `order_items`, `payment_terminals`, `payment_intents`, `fiscal_invoices`, `whatsapp_messages`, `stock_items`, etc.), índices de performance, funções em PL/pgSQL e triggers automáticos. |
| **Carga Inicial / Seed** | `supabase/seed.sql` | Cria a organização padrão, unidades operacionais, cardápio inicial e o **Usuário Owner Master** (`admin@admin` com senha `admin123`). |
| **Migração 001** | `supabase/migrations/001_initial_schema.sql` | Migração base versionada para ferramentas de CI/CD ou Supabase CLI. |
| **Migração 002 (RLS)** | `supabase/migrations/002_rls_policies.sql` | Políticas ativas de segurança Row Level Security para isolamento multi-tenant estrito. |
| **Documentação Interna** | `supabase/README.md` | Documentação técnica dos tipos e arquitetura de dados do banco. |

#### Como Fazer o Upload e Executar os Scripts no Supabase:

##### Opção 1: Pelo Console Web do Supabase (Mais Rápido / Sem Instalação)
1. Acesse o seu projeto em [https://supabase.com/dashboard/projects](https://supabase.com/dashboard/projects).
2. No menu lateral esquerdo, clique no ícone **SQL Editor** (ou pressione `Ctrl + K` e digite `SQL Editor`).
3. Clique no botão **+ New Query**.
4. Abra o arquivo `supabase/schema.sql` do projeto, copie todo o código e cole no editor do Supabase.
5. Clique no botão **Run** (canto inferior direito ou `Ctrl + Enter`). Aguarde a mensagem *Success. No rows returned*.
6. Clique novamente em **+ New Query**.
7. Abra o arquivo `supabase/seed.sql` do projeto, copie todo o código e cole no editor.
8. Clique em **Run**. Isso criará imediatamente o banco populado e o usuário `admin@admin` (`admin123`).

##### Opção 2: Via Supabase CLI (Linha de Comando)
```bash
# 1. Faça login na CLI do Supabase
npx supabase login

# 2. Vincule seu projeto remoto
npx supabase link --project-ref seu-project-ref-aqui

# 3. Aplique as migrações e o seed
npx supabase db push
npx supabase db reset # Ou aplique o seed.sql
```

---

### 5.3. Tutorial Completo: Como Conectar a Maquininha Mercado Livre / Mercado Pago Point ao Totem de Autoatendimento

Este guia descreve o procedimento oficial de ponta a ponta para conectar os terminais **Mercado Pago Point (Point Pro, Point Pro 2, Point Smart, Point Air)** ao FoodS SaaS para cobranças automáticas no Totem de Autoatendimento e no Caixa (POS).

#### 1. Pré-Requisitos e Obtenção de Credenciais Oficiais
1. Acesse o [Portal de Desenvolvedores do Mercado Pago](https://www.mercadopago.com.br/developers/panel).
2. Crie ou selecione sua aplicação de integração.
3. No menu **Credenciais de Produção**, copie:
   - **Access Token** (inicia com `APP_USR-...`)
   - **Public Key** (inicia com `APP_USR-...`)
4. Verifique se sua maquininha Point está ligada, conectada à internet (Wi-Fi ou chip 4G) e vinculada à mesma conta Mercado Pago onde a aplicação foi criada.

#### 2. Configurar o Gateway Mercado Pago no Painel FoodS
1. Acesse o painel administrativo do FoodS: `/configuracoes/pagamentos`.
2. Selecione a aba **Mercado Pago**.
3. Ative o slide switch **Mercado Pago**: `Ativo`.
4. Preencha os campos:
   - **Access Token**: Cole seu token oficial `APP_USR-...`.
   - **Public Key**: Cole sua chave pública oficial.
   - **Ambiente**: Selecione `Produção` (ou `Sandbox` para testes com credenciais de teste).
5. Clique em **Salvar Credenciais do Mercado Pago**.

#### 3. Cadastrar e Vincular o Terminal Point
Existem dois métodos para registrar a maquininha:

##### Método A: Escaneamento Automático (Recomendado)
1. Dentro de `/configuracoes/pagamentos`, vá na sub-aba **Presencial** -> **Terminais & Maquininhas POS**.
2. Clique no botão **Escanear Maquininhas na Conta MP**.
3. O FoodS se conectará à API do Mercado Pago (`GET /v1/point/integration-api/devices`) e listará todos os terminais ativos da sua conta.
4. Clique em **Importar Terminal** na maquininha desejada (ex: `POINT_SMART_001`).

##### Método B: Cadastro Manual pelo Serial Number
1. No verso ou na caixa da sua maquininha Point, localize o **Device ID / Número de Série** (ex: `PAX_A910__123456789`).
2. No FoodS em `/configuracoes/pagamentos` -> **Presencial**, clique em **Nova Maquininha**.
3. Preencha:
   - **Nome Identificador**: Ex: `Point Smart Totem Entrada`.
   - **Provedor**: `Mercado Pago Point`.
   - **Modelo**: Selecione `Point Smart`, `Point Pro 2` ou `Point Air`.
   - **Device ID / Serial Number**: Digite o identificador exato da maquininha.
   - **Unidade**: Selecione a filial correspondente.
4. Clique em **Salvar Terminal**.

#### 4. Vincular o Terminal ao Totem de Autoatendimento
1. Acesse `/configuracoes/totens`.
2. Clique no Totem desejado (ou clique em **Novo Totem**).
3. No formulário do Totem:
   - **Nome**: Ex: `Totem Entrada Principal 01`.
   - **Identificador de Rota**: `totem-01`.
   - **Maquininha POS Vinculada**: Selecione a maquininha Point cadastrada no passo anterior.
   - **Métodos de Pagamento Permitidos**: Marque `Cartão (Débito/Crédito na Maquininha)` e `PIX Dinâmico QR Code`.
   - **Impressão Automática de Comprovante**: `Ativo`.
4. Clique em **Salvar Totem**.

#### 5. Fluxo Operacional de Cobrança em Tempo Real

```text
[Cliente no Totem]
       │
       ▼
1. Seleciona os itens e clica em "Pagar com Cartão na Maquininha"
       │
       ▼
2. O Totem envia POST /api/terminals/{terminal_id}/payment-intent
   - Criação do Payment Intent oficial no Mercado Pago:
     POST https://api.mercadopago.com/v1/point/integration-api/devices/{device_id}/payment-intents
     { "amount": 49.90, "description": "Pedido FoodS #104", "payment_mode": "seller_device" }
       │
       ▼
3. A Maquininha Point apita, acende a tela e exibe:
   "Total: R$ 49,90 - Insira ou aproxime o cartão"
       │
       ▼
4. O Totem entra em polling automático aguardando a resposta do hardware:
   GET https://api.mercadopago.com/v1/point/integration-api/payment-intents/{intent_id}
       │
       ▼
5. Cliente insere a senha e o pagamento é aprovado:
   - Status muda para CLOSED / PROCESSED.
   - O Totem emite o comprovante na impressora térmica, confirma o pedido e envia para a Cozinha (KDS).
```

#### 6. Configuração de Webhooks do Mercado Pago
Para confirmação instantânea em caso de oscilação de rede:
1. No painel do Mercado Pago Developers, configure a URL de notificação:
   `https://seu-dominio.com.br/api/payments/webhook/mercadopago`
2. Selecione os tópicos: `payment_intent.point` e `payments`.

---

## 6. 🚀 Como Executar o Projeto

### 6.1. Desenvolvimento Local
```bash
# 1. Instalar dependências
npm install

# 2. Iniciar o servidor integrado (Express + Vite)
npm run dev
```
O servidor estará acessível em: `http://localhost:3000`

### 6.2. Build e Produção
```bash
# Gerar build otimizada do frontend e backend
npm run build

# Iniciar servidor de produção
npm start
```

### 6.3. Executando com Docker e Docker Compose

O **FoodS SaaS** possui suporte nativo a contêineres Docker com build multi-stage leve em Alpine Linux.

#### A. Subindo com Docker Compose (Recomendado)
```bash
# 1. Configurar as variáveis no arquivo .env
cp .env.example .env

# 2. Construir e iniciar os contêineres em segundo plano
docker-compose up -d --build

# 3. Visualizar os logs da aplicação em tempo real
docker-compose logs -f foods-app

# 4. Parar os contêineres
docker-compose down
```

#### B. Construindo e Rodando a Imagem Manualmente com Docker CLI
```bash
# 1. Construir a imagem de produção
docker build -t foods-saas:latest .

# 2. Executar o contêiner mapeando a porta 3000
docker run -d \
  --name foods-production \
  -p 3000:3000 \
  -e PORT=3000 \
  -e NODE_ENV=production \
  -e VITE_SUPABASE_URL=https://sua-url-supabase.co \
  -e VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui \
  --restart always \
  foods-saas:latest

# 3. Verificar o status do contêiner
docker ps

# 4. Acessar o terminal interativo do contêiner (caso necessário)
docker exec -it foods-production sh
```

#### C. Deploy em Servidores VPS e Plataformas Cloud
Para implantar em servidores VPS (Ubuntu, Debian, Coolify, EasyPanel, Portainer ou CapRover):
1. Clone o repositório no servidor: `git clone <repo_url> && cd foods`.
2. Configure seu domínio com proxy reverso (Nginx, Traefik ou Caddy com SSL Let's Encrypt apontando para `localhost:3000`).
3. Execute `docker-compose up -d --build`.

---

## 7. 📄 Licença e Direitos de Uso (MIT License)

Este projeto é um software livre e de código aberto (*open-source*) distribuído sob os termos da licença **MIT License**.

```text
MIT License

Copyright (c) 2026 Kaio Borges Dev - 5E Group

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 8. 👥 Créditos e Mantenedores

**FoodS SaaS v2.0.0**  
Copyright © **Kaio Borges Dev** ([dev.kaioborges.com.br](https://dev.kaioborges.com.br)) — **5E Group** ([@5ebrasil](https://instagram.com/5ebrasil)). Todos os direitos reservados.

