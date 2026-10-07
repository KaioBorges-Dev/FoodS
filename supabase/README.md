# FoodS — Documentação de Banco de Dados Supabase (PostgreSQL)

## 📌 Visão Geral da Arquitetura de Dados

O FoodS utiliza o PostgreSQL hospedado no **Supabase** como banco de dados transacional relacional com suporte a:
- **Multi-Tenant:** Isolamento por `organizations` e filiais `units`.
- **Row-Level Security (RLS):** Proteção direta nas tabelas impedindo vazamento de dados entre empresas.
- **Auditoria de Pagamentos & Idempotência:** Tabelas `payment_intents` e `payment_attempts`.
- **Canais Integrados:** POS / Balcão, Garçom / Mesas, Cardápio Online e **Totens de Autoatendimento**.
- **Hardware & Terminais:** Tabela `payment_terminals` para gerenciamento de Maquininhas POS físicas (Mercado Pago Point Smart/Pro).

---

## 🚀 Como Executar o Schema no Supabase

1. Acesse seu painel no [Supabase Console](https://supabase.com/dashboard).
2. Vá até a seção **SQL Editor**.
3. Abra o arquivo `supabase/schema.sql` deste projeto.
4. Cole o conteúdo no editor e clique em **Run**.
5. (Opcional) Para carregar dados iniciais de inicialização de tenant, execute `supabase/seed.sql`.

---

## 🔒 Variáveis de Ambiente

No seu arquivo `.env` ou nas configurações do ambiente, certifique-se de configurar:

```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-publica
```
