# Política de Segurança — FoodS SaaS

## Relato de Vulnerabilidades

Se você identificar uma vulnerabilidade de segurança no FoodS, solicitamos que nos envie um e-mail confidencial para:

`equipe@kaioborges.com.br`

Por favor, inclua um passo a passo para reprodução da falha antes de realizar qualquer divulgação pública.

## Práticas de Segurança no FoodS

* Multi-tenant isolado via Supabase Row Level Security (RLS).
* Nenhuma `service_role_key` ou secret privada mantida no frontend.
* Sanitização e validação de requisições no API Gateway.
