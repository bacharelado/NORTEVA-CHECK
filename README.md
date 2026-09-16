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

- `docs/` — metodologia, escopo, autorização e matriz de risco.
- `checklist/` — checklist operacional.
- `templates/` — relatório e proposta comercial.
- `prompts/` — prompts para análise e redação.
- `app/` — aplicação web e rotas da API.
- `lib/` — tipos, persistência Prisma e regras de sessão/segurança.
- `prisma/` — schema e migrações PostgreSQL.
- `.github/workflows/` — CI com PostgreSQL de teste.

## Desenvolvimento local

1. Instale as dependências com `npm ci`.
2. Copie `.env.example` para `.env` e configure uma instância PostgreSQL local ou de desenvolvimento.
3. Gere o cliente com `npm run db:generate`.
4. Em desenvolvimento, aplique as migrações com `npm run db:migrate:dev`.
5. Em deploy, aplique as migrações com `npm run db:migrate:deploy`.
6. Inicie a aplicação com `npm run dev`.

O sistema exige `DATABASE_URL` para executar operações de persistência e `SESSION_SECRET` para proteger os identificadores de sessão armazenados. O arquivo `.env.example` contém apenas placeholders; credenciais reais não devem ser versionadas.

## Segurança e acesso

O acesso inicial pode ser criado em `/login`. O cadastro cria uma organização e associa o primeiro usuário como `OWNER`. Os papéis são `OWNER`, `ADMIN` e `MEMBER`: `OWNER` e `ADMIN` podem autorizar diagnósticos e criar findings; `MEMBER` pode consultar diagnósticos da própria organização. As rotas verificam o membership no backend e não confiam em `companyId` enviado pelo frontend.

As sessões usam cookie HttpOnly, `SameSite=Lax` e `Secure` em produção. O identificador de sessão é aleatório no cookie e apenas seu hash é persistido no banco; as sessões expiram após o período configurado pelo sistema. Senhas são armazenadas com hash derivado por scrypt.

As rotas que alteram estado exigem cabeçalho `Origin` igual à origem da própria requisição. Ausência de `Origin` ou origem diferente resulta em `403`; isso complementa `SameSite=Lax` do cookie e reduz o risco de CSRF para a autenticação por cookie.

O aceite de autorização nesta fase registra usuário, organização, diagnóstico, escopo persistido, versão do termo, período e estado. Ele é um registro operacional rastreável e não representa uma assinatura digital ou uma conclusão jurídica.

O `AuditLog` registra ações sensíveis de autenticação, diagnósticos, autorizações e findings, vinculado ao usuário e à organização quando aplicável. O log não deve receber segredos ou credenciais.

## Estado atual

### Implementado

- PostgreSQL + Prisma com migrações versionadas.
- Autenticação por sessão e cadastro.
- Hash de senha com scrypt.
- Organização/tenant e membership.
- RBAC com `OWNER`, `ADMIN` e `MEMBER`.
- Isolamento de diagnósticos entre organizações.
- Autorização formal de diagnóstico com escopo, versões, período e estado.
- Audit log para ações sensíveis.
- Proteção CSRF por validação de `Origin` e cookie `SameSite=Lax`.
- Criação, consulta e autorização de diagnósticos.
- Findings básicos com nível e status.
- Testes automatizados de autenticação, logout, autorização, RBAC e isolamento entre tenants.
- CI com PostgreSQL efêmero, migrações, testes, TypeScript e build.

### Em desenvolvimento

- Rate limiting distribuído para login e cadastro.
- Recuperação de senha e verificação de e-mail.
- Gestão operacional completa de revogação e expiração de autorizações.
- Evidências estruturadas com origem, contexto e integridade.
- Coleta técnica autorizada.
- Motor de análise e classificação de riscos baseado em evidências.
- Dashboard operacional completo.
- Plano de correção e acompanhamento de remediação.
- Relatório executivo e exportação PDF.
- Monitoramento contínuo e funcionalidades recorrentes do produto.

## Limitações atuais

O MVP ainda não possui rate limiting distribuído para login ou cadastro. Antes de exposição pública, deve ser aplicada limitação por IP e por identificador de conta em um proxy/edge ou datastore compartilhado, com respostas uniformes e backoff progressivo.

A suíte de integração depende de PostgreSQL de teste: quando `DATABASE_URL` e `TEST_DATABASE_URL` estão configuradas e as migrações foram aplicadas, os testes de isolamento e autorização são executados; sem essas variáveis, a suíte é explicitamente pulada.

A fundação atual ainda não representa o fluxo completo de diagnóstico técnico. O campo `evidence` de um finding é atualmente textual; armazenamento e cadeia de custódia de evidências estruturadas serão tratados em etapa posterior.

Antes de produção também é necessário revisar vulnerabilidades de dependências, configurar PostgreSQL de produção, observabilidade, backup e retenção, além de definir a segregação adequada dos materiais de prospecção comercial em relação ao código público.

## Status

**v0.1 — fundação do produto.**

O projeto está em validação comercial e técnica. O núcleo de persistência, autenticação, tenant, autorização, RBAC, auditoria e proteção CSRF está implementado e coberto por CI/testes. A etapa seguinte é o endurecimento operacional e a construção do fluxo real de diagnóstico, evidências, remediação e relatório.

Nenhum resultado de mercado é garantido; a prioridade inicial é executar diagnósticos consistentes e obter os primeiros clientes autorizados.