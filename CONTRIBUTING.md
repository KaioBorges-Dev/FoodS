# Diretrizes de Contribuição — FoodS SaaS

Obrigado pelo seu interesse em contribuir com o **FoodS**!

## Como Contribuir

1. Faça um Fork do repositório.
2. Crie uma branch para a sua feature (`git checkout -b feature/minha-feature`).
3. Certifique-se de seguir as convenções de código com TypeScript e ESLint (`npm run lint`).
4. Abra um Pull Request detalhado com os motivos das alterações.

## Padrões de Código

* Todas as mensagens de commits devem ser descritivas.
* Nunca adicione dados mockados ou chaves privadas no repositório.
* Utilize Row Level Security (RLS) para qualquer nova tabela multi-tenant no Supabase.
