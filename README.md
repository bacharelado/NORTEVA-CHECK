# NORTEVA CHECK

Diagnóstico prático de segurança digital para pequenas e médias empresas.

## Objetivo

O NORTEVA CHECK organiza uma avaliação autorizada da exposição digital e dos controles básicos de segurança de uma empresa, transformando achados técnicos em prioridades claras de correção.

## Princípios

- Só avaliar ativos com autorização do responsável.
- Registrar escopo e autorização antes da coleta técnica.
- Minimizar impacto nos sistemas avaliados.
- Não realizar exploração intrusiva, brute force, phishing, malware, persistência ou exfiltração como parte do diagnóstico padrão.
- Preservar evidências e dados sensíveis.
- Separar fato observado, risco e recomendação.

## Estrutura

- `docs/` — metodologia, escopo e autorização.
- `checklist/` — checklist operacional.
- `templates/` — relatório e proposta comercial.
- `prompts/` — prompts para análise e redação.
- `scripts/` — automações auxiliares seguras.

## Desenvolvimento local

1. Instale as dependências com `npm ci`.
2. Copie `.env.example` para `.env` e configure uma instância PostgreSQL local ou de desenvolvimento.
3. Gere o cliente com `npm run db:generate`.
4. Aplique as migrações com `npm run db:migrate:dev` em desenvolvimento ou `npm run db:migrate:deploy` em um ambiente de deploy.
5. Inicie a aplicação com `npm run dev`.

O sistema exige `DATABASE_URL` para executar operações de persistência e `SESSION_SECRET` para assinar o hash das sessões. O arquivo `.env.example` contém apenas placeholders; credenciais reais não devem ser versionadas.

O acesso inicial pode ser criado em `/login`. O cadastro cria uma organização e associa o primeiro usuário como `OWNER`. Os papéis são mínimos: `OWNER` e `ADMIN` podem autorizar diagnósticos e criar findings; `MEMBER` pode consultar diagnósticos da própria organização. As rotas verificam o membership no backend.

O aceite de autorização nesta fase registra usuário, organização, diagnóstico, escopo persistido, versão do termo, período e estado. Ele é um registro operacional rastreável e não representa uma assinatura digital ou uma conclusão jurídica.

`npm test` executa a suíte automatizada. Os testes de isolamento e autorização são executados quando `DATABASE_URL` e `TEST_DATABASE_URL` estão configuradas para um banco PostgreSQL de teste com as migrações aplicadas; sem essas variáveis, a suíte é explicitamente pulada.

## Status

**v0.1 — fundação do produto.**

O projeto ainda está em validação comercial e técnica. Nenhum resultado de mercado é garantido; a prioridade inicial é executar diagnósticos consistentes e obter os primeiros clientes autorizados.
