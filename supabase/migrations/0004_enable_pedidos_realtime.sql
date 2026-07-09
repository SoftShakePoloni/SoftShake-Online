-- ============================================================
-- SoftShake · Realtime em pedidos (admin dashboard)
-- ============================================================
-- 1) Publica a tabela no Realtime
-- 2) REPLICA IDENTITY FULL → payload.new completo em UPDATE
-- 3) RLS: usuários autenticados (admins) leem todos os pedidos
--    (necessário para o Realtime entregar eventos ao browser)
-- ============================================================

-- 1. Publicação Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'pedidos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;
  END IF;
END $$;

-- 2. Payload completo em UPDATE/DELETE
ALTER TABLE public.pedidos REPLICA IDENTITY FULL;

-- 3. RLS: leitura para authenticated (sessão do admin)
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pedidos_select_authenticated" ON public.pedidos;
CREATE POLICY "pedidos_select_authenticated"
  ON public.pedidos
  FOR SELECT
  TO authenticated
  USING (true);

-- Clientes autenticados ainda podem inserir/ver os próprios pedidos
-- (ajuste se já existir policy mais restritiva de INSERT/SELECT por cliente_id)
DROP POLICY IF EXISTS "pedidos_insert_authenticated" ON public.pedidos;
CREATE POLICY "pedidos_insert_authenticated"
  ON public.pedidos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "pedidos_update_authenticated" ON public.pedidos;
CREATE POLICY "pedidos_update_authenticated"
  ON public.pedidos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
