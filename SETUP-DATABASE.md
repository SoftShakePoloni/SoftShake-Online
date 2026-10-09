# 🗄️ Configuração do Banco de Dados - SoftShake Online

## ⚠️ PROBLEMA IDENTIFICADO

O erro `400 (Bad Request)` ao acessar a tabela `perfis` indica que **as tabelas do banco de dados ainda não foram criadas** no seu projeto Supabase.

## ✅ SOLUÇÃO: Executar as Migrations SQL

### Opção 1: Usar o Supabase Dashboard (Recomendado)

1. **Acesse seu projeto no Supabase:**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Abra o SQL Editor:**
   - No menu lateral, clique em **SQL Editor**
   - Clique em **+ New Query**

3. **Execute as migrations na ordem correta:**

#### Migration 1: Estrutura Básica
```sql
-- Crie as tabelas básicas primeiro (se ainda não existem)

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text,
  email text,
  telefone text,
  endereco text,
  enderecos_adicionais jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de categorias
CREATE TABLE IF NOT EXISTS public.categorias (
  id serial PRIMARY KEY,
  nome text NOT NULL,
  ordem integer
);

-- Tabela de tags
CREATE TABLE IF NOT EXISTS public.tags (
  id serial PRIMARY KEY,
  nome text NOT NULL,
  cor_fundo text NOT NULL,
  cor_texto text
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS public.produtos (
  id serial PRIMARY KEY,
  nome text NOT NULL,
  descricao text,
  preco_base numeric(10,2) NOT NULL,
  preco_promocional numeric(10,2),
  imagem_url text,
  categoria_id integer REFERENCES public.categorias(id) ON DELETE SET NULL,
  tag_id integer REFERENCES public.tags(id) ON DELETE SET NULL,
  esta_disponivel boolean DEFAULT true,
  ordem integer
);

-- Tabela de grupos de opções
CREATE TABLE IF NOT EXISTS public.grupos_opcoes (
  id serial PRIMARY KEY,
  nome text NOT NULL,
  min_escolha integer DEFAULT 0,
  max_escolha integer NOT NULL,
  tag_id integer REFERENCES public.tags(id) ON DELETE SET NULL
);

-- Tabela de opções
CREATE TABLE IF NOT EXISTS public.opcoes (
  id serial PRIMARY KEY,
  nome text NOT NULL,
  preco_adicional numeric(10,2) DEFAULT 0,
  grupo_id integer REFERENCES public.grupos_opcoes(id) ON DELETE CASCADE,
  tag_id integer REFERENCES public.tags(id) ON DELETE SET NULL,
  ordem integer,
  status text DEFAULT 'disponivel',
  esta_disponivel boolean DEFAULT true
);

-- Tabela intermediária produto-grupos
CREATE TABLE IF NOT EXISTS public.produto_grupos (
  produto_id integer REFERENCES public.produtos(id) ON DELETE CASCADE,
  grupo_id integer REFERENCES public.grupos_opcoes(id) ON DELETE CASCADE,
  ordem integer,
  PRIMARY KEY (produto_id, grupo_id)
);

-- Tabela de configurações da loja
CREATE TABLE IF NOT EXISTS public.configuracoes_loja (
  id serial PRIMARY KEY,
  nome text NOT NULL DEFAULT 'Minha Loja',
  descricao text,
  logo_url text,
  banner_url text,
  telefone text,
  whatsapp text,
  instagram text,
  facebook text,
  endereco text,
  cidade text,
  estado text,
  horario_abertura text,
  horario_fechamento text,
  dias_funcionamento text,
  esta_aberto boolean DEFAULT true,
  aceitando_pedidos boolean DEFAULT true,
  aceitar_pedidos_automaticamente boolean DEFAULT false,
  pedido_minimo numeric(10,2) DEFAULT 0,
  taxa_entrega numeric(10,2) DEFAULT 0,
  tempo_entrega_min integer DEFAULT 30,
  tempo_entrega_max integer DEFAULT 60
);

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS public.pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  cliente_nome text NOT NULL,
  cliente_telefone text NOT NULL,
  tipo_entrega text NOT NULL,
  endereco_id uuid,
  endereco_completo jsonb,
  meio_pagamento text NOT NULL,
  troco_para text,
  subtotal numeric(10,2) NOT NULL,
  taxa_entrega numeric(10,2) DEFAULT 0,
  total numeric(10,2) NOT NULL,
  itens jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insere configuração padrão se não existir
INSERT INTO public.configuracoes_loja (id, nome)
VALUES (1, 'SoftShake Online')
ON CONFLICT (id) DO NOTHING;
```

Clique em **Run** e aguarde a confirmação.

#### Migration 2: Segurança e RLS
Cole o conteúdo do arquivo: `supabase/migrations/0009_security_rls_audit.sql`

Clique em **Run** e aguarde a confirmação.

#### Migration 3: Preferências do Estabelecimento
Cole o conteúdo do arquivo: `supabase/migrations/0010_estabelecimento_preferencias.sql`

Clique em **Run** e aguarde a confirmação.

#### Migration 4: Perfis e RBAC
Cole o conteúdo do arquivo: `supabase/migrations/0011_profiles_rbac.sql`

Clique em **Run** e aguarde a confirmação.

#### Migration 5: Campanhas de Frete Grátis
Cole o conteúdo do arquivo: `supabase/migrations/0012_promocoes_frete_gratis.sql`

Clique em **Run** e aguarde a confirmação. Esta migration habilita o agendamento de frete grátis por produto ou para todo o cardápio.

#### Migration 6: Horários das Campanhas de Frete
Cole o conteúdo do arquivo: `supabase/migrations/0013_promocoes_frete_horario.sql`

Clique em **Run** e aguarde a confirmação. Ela acrescenta horários de início e término às campanhas já existentes; os registros atuais permanecem válidos como campanhas de dia inteiro.

#### Migration 7: Cupons e Combos
Cole o conteúdo do arquivo: `supabase/migrations/0014_cupons_combos.sql`

Clique em **Run** e aguarde a confirmação. Ela cria o cadastro de cupons e combos, relaciona os produtos dos combos e aplica o desconto de cupons de forma transacional ao gravar o pedido.

### Opção 2: Usar o Supabase CLI

Se você preferir usar o CLI:

```bash
# Instale o Supabase CLI (se ainda não tiver)
npm install -g supabase

# Conecte ao seu projeto
supabase link --project-ref juzlblaxwybssbyddnwj

# Execute as migrations
supabase db push
```

## 🔐 Criar seu Primeiro Usuário Admin

Após executar as migrations, você precisa criar um usuário admin:

1. **No Supabase Dashboard:**
   - Vá em **Authentication** > **Users**
   - Clique em **Add user** > **Create new user**
   - Preencha email e senha
   - Copie o **User UID** gerado

2. **No SQL Editor, execute:**

```sql
-- Substitua 'USER_UID_AQUI' pelo UUID do usuário criado
INSERT INTO public.perfis (id, nome, email, role, acessos)
VALUES (
  'USER_UID_AQUI',
  'Administrador',
  'seu-email@exemplo.com',
  'admin',
  ARRAY['dashboard', 'pedidos', 'produtos', 'categorias', 'clientes', 'configuracoes', 'relatorios']::text[]
);
```

## ✅ Verificar se Funcionou

Depois de executar as migrations, teste a aplicação:

```bash
npm run dev
```

Acesse `http://localhost:3000/admin/login` e faça login com as credenciais do usuário criado.

## 🔧 Configurações Adicionais no .env.local

Se você quiser usar seu próprio projeto Supabase (não o padrão hardcoded):

1. **Obtenha suas credenciais:**
   - No Supabase Dashboard, vá em **Settings** > **API**
   - Copie a **Project URL** e **anon public** key

2. **Atualize o .env.local:**
```env
NEXT_PUBLIC_SUPABASE_URL=sua-url-aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-aqui
```

## 📝 Notas Importantes

- As migrations são **idempotentes** (podem ser executadas múltiplas vezes sem problema)
- O projeto usa **Row Level Security (RLS)** para proteger os dados
- Usuários clientes usam JWT customizado (não Supabase Auth)
- Apenas staff do painel admin usa Supabase Auth
- Rate limiting em desenvolvimento usa memória (não precisa do Redis)

## ❓ Problemas Comuns

### "relation 'perfis' does not exist"
→ Execute a migration 4 (perfis RBAC)

### "permission denied for table perfis"
→ Verifique se as policies RLS foram criadas corretamente

### Não consigo fazer login no admin
→ Certifique-se de ter criado um usuário no Supabase Auth E inserido o registro na tabela perfis

## 📚 Próximos Passos

Após configurar o banco:

1. ✅ Criar usuário admin
2. ✅ Fazer login no painel `/admin/login`
3. ✅ Configurar informações da loja em Estabelecimento
4. ✅ Criar categorias, produtos e começar a usar!

---

**Dúvidas?** Verifique os logs do Supabase ou o console do navegador para mais detalhes sobre erros.
