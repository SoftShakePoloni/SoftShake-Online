# SoftShake — Relatório de Segurança (Produção)

**Data:** 2026-07-11  
**Stack:** Next.js 15 App Router · TypeScript · Supabase · JWT cliente  

---

## Resumo executivo

Foi implementada uma camada de segurança no código (middleware, API guards, rate limit, sanitização, headers, auditoria, RBAC base e correções de auth). O app fica **pronto para produção** desde que as **env vars**, **migrations SQL** e **infra** (Redis opcional, WAF, secrets) sejam configuradas no deploy.

---

## Nível de risco encontrado (antes → depois)

| Área | Antes | Depois | Severidade original |
|------|--------|--------|---------------------|
| Secrets hardcoded (JWT fallback, anon key no source) | Crítico | Mitigado (exige env; sem fallback de produção) | **Crítico** |
| Enumeração de login (cliente não encontrado) | Alto | Mensagem genérica | **Alto** |
| Rate limit ausente | Alto | In-memory + presets por rota | **Alto** |
| Headers de segurança | Médio | Middleware + next.config | **Médio** |
| Origin/CSRF em mutações | Médio | Validação de Origin/Referer | **Médio** |
| Admin API sem dual-check | Médio | Middleware + `requirePermissionApi` | **Médio** |
| Service role no server client | Alto (pelo desenho) | Mantido no server only; falha se env ausente | **Alto** (aceito com RLS) |
| Stack/errors expostos | Médio | `apiServerError` genérico | **Médio** |
| Path traversal `/api/imagem` | Médio | Sanitize + extensões allowlist | **Médio** |
| Auditoria | Baixo | `audit_logs` + logger JSON | **Baixo** |
| RBAC | Baixo | Roles + permissions (base) | **Baixo** |

---

## O que foi implementado no código

### 1. Rate limiting
- `src/lib/security/rate-limit.ts` — fixed window in-memory
- Presets: login 5/min · register 3/min · API 120/min · checkout 10/min · imagem 60/min · admin 100/min
- Integrado em middleware (auth + `/api/*`) e `withApiGuard`

### 2. Proteção de rotas
- Middleware: `/admin/*` exige Supabase Auth; APIs admin sem user → 401
- Server Actions admin: `requireAdmin` / `requirePermission`
- APIs admin: `requirePermissionApi` (sem redirect)

### 3. Validação / sanitização
- Zod nas rotas de auth e criar pedido
- `sanitizeText`, `sanitizePhone`, `sanitizeStoragePath`
- Observações e nomes sanitizados (anti-XSS markup)

### 4. API segura
- `withApiGuard` (método, rate limit, origin, erros seguros)
- Respostas padronizadas (`erro`, `codigo`) sem stack trace

### 5. Headers
- CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, COOP/CORP
- HSTS em produção

### 6. Cookies sessão cliente
- `httpOnly`, `secure` (prod), `SameSite=Lax`, maxAge 7d
- JWT com `jti` e secret obrigatório forte em produção

### 7. Anti-enumeração
- Login: sempre **"Credenciais inválidas."**

### 8. Logs + auditoria
- `securityLog` JSON estruturado
- `writeAudit` → tabela `audit_logs` (migration 0009)

### 9. RBAC base
- Roles: cliente · atendente · gerente · admin  
- Permissions por papel (`src/lib/security/rbac.ts`)  
- Role via `app_metadata.role` do Supabase Auth (default admin)

### 10. Upload / storage path
- `/api/imagem`: path sanitizado, só extensões de imagem

### 11. Health check
- `GET /api/health` — sem dados sensíveis

### 12. Config
- `poweredByHeader: false`
- Service role **não** hardcodada no client.server

---

## Migrations SQL a rodar no Supabase

1. `0007_produtos_preco_promocional.sql` (se ainda não)
2. `0008_enable_realtime_all_tables.sql`
3. **`0009_security_rls_audit.sql`** ← auditoria + RLS reforçado

---

## Variáveis de ambiente obrigatórias (produção)

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # NUNCA no client
AUTH_JWT_SECRET=                    # ≥ 32 chars aleatórios
NEXT_PUBLIC_APP_URL=https://seudominio.com
ALLOWED_ORIGINS=https://seudominio.com
# Opcional:
# CONTENT_SECURITY_POLICY=...
# UPSTASH_REDIS_REST_URL=           # rate limit multi-instância
# UPSTASH_REDIS_REST_TOKEN=
# SENTRY_DSN=
```

---

## Dependências de infraestrutura (não no código)

| Item | Status | Notas |
|------|--------|--------|
| WAF / Cloudflare | Pendente | Bot fight, IP ban |
| Upstash Redis rate limit | Pendente | Necessário com múltiplas instâncias serverless |
| Sentry / APM | Pendente | Integrar `SENTRY_DSN` |
| Captcha (hCaptcha/Turnstile) | Pendente | Após N falhas de login |
| Backup DB automático | Pendente | Supabase Pro / cron |
| Secrets rotation | Pendente | JWT + service role |
| Reauth para ações críticas admin | Parcial | Estrutura RBAC pronta; UI de reauth futura |
| Webhooks assinados | N/A | Ainda não há webhooks de pagamento |
| CDN/cache estático | Recomendado | Vercel/Cloudflare |

---

## Checklist OWASP Top 10 (2021) — cobertura

| Item | Cobertura |
|------|-----------|
| A01 Broken Access Control | Middleware + requireAdmin + policies |
| A02 Cryptographic Failures | Cookies secure, JWT secret, HTTPS headers |
| A03 Injection | Supabase client paramétrico + sanitize |
| A04 Insecure Design | Rate limit, least privilege, audit |
| A05 Security Misconfiguration | Headers, poweredBy off, env |
| A06 Vulnerable Components | Manter `npm audit` no CI |
| A07 Auth Failures | Rate limit, anti-enum, logout cookie clear |
| A08 Data Integrity | Origin check; webhooks N/A |
| A09 Logging Failures | securityLog + audit_logs |
| A10 SSRF | Path allowlist em imagem |

---

## Recomendações futuras (prioridade)

1. **Upstash Redis** no rate limit (substituir Map in-memory).
2. **Turnstile/hCaptcha** no login/cadastro após 3 falhas.
3. **Tabela `admins` com role** e checagem real (não só qualquer user Supabase Auth).
4. **Políticas RLS** pedidas por `cliente_id` quando migrar cliente para Supabase Auth.
5. **Reautenticação** (senha recente) em exclusões e config da loja.
6. **CSP sem `unsafe-inline`/`unsafe-eval`** após inventário de scripts.
7. **Sentry** + alertas de 401/429 em massa.

---

## Como validar antes do go-live

- [ ] Env de produção setadas (sem secrets no repositório)
- [ ] SQL 0008 + 0009 aplicados
- [ ] Login com telefone inexistente → “Credenciais inválidas”
- [ ] 6+ POSTs login em 1 min → 429
- [ ] `/admin` sem cookie → redirect login
- [ ] PATCH `/api/pedidos/atualizar-status` sem auth → 401
- [ ] Headers no response: `X-Frame-Options`, `CSP`
- [ ] `npm run build` green
- [ ] Nenhum `SUPABASE_SERVICE_ROLE` no bundle client (search source maps)

---

*Implementação de código em `src/lib/security/*`, middleware, rotas de API e migrations. Revisar e customizar CSP/origins por domínio real.*
