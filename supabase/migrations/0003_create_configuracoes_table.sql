-- Criar tabela de configurações da loja
CREATE TABLE IF NOT EXISTS configuracoes_loja (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  logo_url TEXT,
  banner_url TEXT,
  endereco TEXT,
  cidade VARCHAR(100),
  estado VARCHAR(2),
  telefone VARCHAR(20),
  whatsapp VARCHAR(20),
  instagram VARCHAR(255),
  facebook VARCHAR(255),
  horario_abertura TIME,
  horario_fechamento TIME,
  dias_funcionamento TEXT[], -- Array de strings: ["segunda", "terca", etc]
  taxa_entrega DECIMAL(10, 2),
  pedido_minimo DECIMAL(10, 2),
  tempo_entrega_min INTEGER,
  tempo_entrega_max INTEGER,
  esta_aberto BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_configuracoes_loja_esta_aberto ON configuracoes_loja(esta_aberto);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_configuracoes_loja_updated_at
  BEFORE UPDATE ON configuracoes_loja
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Inserir configuração padrão (se não existir)
INSERT INTO configuracoes_loja (
  nome,
  descricao,
  esta_aberto,
  taxa_entrega,
  pedido_minimo,
  tempo_entrega_min,
  tempo_entrega_max
) VALUES (
  'SoftShake',
  'Sua loja de açaí e milk shake',
  true,
  5.00,
  20.00,
  30,
  45
)
ON CONFLICT DO NOTHING;
