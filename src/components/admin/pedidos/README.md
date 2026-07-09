# 📦 Tela de Gerenciamento de Pedidos

Interface profissional para gerenciamento de pedidos, inspirada em iFood Merchant, Rappi Partner, Shopify Admin, Stripe Dashboard e Linear.

## 🎨 Design

### Layout de 3 Painéis

```
┌─────────────────────────────────────────────────────────┐
│  [Lista]  │     [Detalhes do Pedido]      │  [Lateral] │
│  340px    │        Flex-1                 │   280px    │
└─────────────────────────────────────────────────────────┘
```

### Paleta de Cores

- **Primária**: `#4C258C` (roxo da marca)
- **Hover**: `#5E35B1`
- **Background**: `#F8F9FC`
- **Cards**: `#FFFFFF`
- **Texto Principal**: `#111827`
- **Texto Secundário**: `#6B7280`
- **Bordas**: `#E5E7EB`

## 📁 Estrutura de Componentes

### `PedidosManager.tsx`
Componente principal que gerencia o estado e integra todos os painéis.

**Props:**
- `pedidosIniciais`: Array de pedidos do Supabase

**Features:**
- Conversão automática de dados do Supabase para tipagem TypeScript
- Gerenciamento de seleção de pedido
- Animações suaves entre transições (200ms)
- Atualização de status

### `OrderList.tsx`
Lista lateral esquerda com todos os pedidos.

**Features:**
- Busca em tempo real (nome do cliente ou ID)
- Filtro por status (Todos, Recebidos, Preparando, etc.)
- Scroll infinito
- Contador de pedidos
- Destaque visual do pedido selecionado

### `OrderListItem.tsx`
Card individual de cada pedido na lista.

**Exibe:**
- Nome do cliente
- ID do pedido (8 primeiros caracteres)
- Hora do pedido
- Valor total
- Badge de status
- Tipo de entrega (ícone)
- Forma de pagamento (ícone)

**Estados:**
- Hover elegante
- Selecionado (fundo roxo claro + indicador lateral)

### `OrderDetailPanel.tsx`
Painel central com todos os detalhes do pedido.

**Seções:**

1. **Cabeçalho**
   - Número do pedido
   - Status
   - Data e hora
   - Tempo decorrido
   - Botões de ação (dinâmicos por status)

2. **Cliente**
   - Avatar
   - Nome
   - Telefone
   - Botões: Copiar telefone, WhatsApp

3. **Endereço**
   - Endereço completo
   - Botão "Abrir no Google Maps"

4. **Informações**
   - Tipo de entrega
   - Forma de pagamento
   - Troco (se aplicável)
   - Observações (se existir)

5. **Produtos**
   - Imagem do produto
   - Nome e quantidade
   - Preço unitário e subtotal
   - Complementos (se houver)
   - Observações do item

6. **Resumo Financeiro**
   - Subtotal
   - Taxa de entrega
   - **Total** (destaque)

7. **Linha do Tempo**
   - Pedido criado
   - Última atualização
   - Status atual

### `OrderSidePanel.tsx`
Painel direito com informações rápidas e ações.

**Cards:**
- Tempo decorrido
- Status atual
- Pagamento
- Tipo de entrega
- Informações do cliente

**Ações Rápidas:**
- Ligar
- WhatsApp
- Copiar endereço
- Imprimir pedido

### `EmptyState.tsx`
Estado vazio quando nenhum pedido está selecionado.

### `LoadingState.tsx`
Skeleton loading para carregamento inicial.

### `ErrorState.tsx`
Estado de erro com botão de retry.

## 🔄 Fluxo de Status

```
pendente → preparando → saiu_entrega → entregue
                ↓
           cancelado
```

**Botões Dinâmicos:**
- `pendente`: "Aceitar Pedido"
- `preparando`: "Saiu para Entrega"
- `saiu_entrega`: "Marcar como Entregue"
- Todos (exceto entregue/cancelado): "Cancelar"

## 📊 Dados Utilizados

### Interface `Pedido`

```typescript
{
  id: string;
  cliente_nome: string;
  cliente_telefone?: string;
  tipo_entrega: "delivery" | "retirada";
  endereco_completo?: string;
  meio_pagamento: string;
  troco_para?: number;
  subtotal: number;
  taxa_entrega: number;
  total: number;
  itens: PedidoItem[];
  status: "pendente" | "preparando" | "saiu_entrega" | "entregue" | "cancelado";
  observacoes?: string;
  created_at: string;
  updated_at: string;
}
```

### Interface `PedidoItem`

```typescript
{
  id: string;
  qty: number;
  total: number;
  observacoes?: string;
  produto: {
    id: string;
    name: string;
    price: number;
    image?: string;
  };
  selections?: Array<{
    name: string;
    price: number;
  }>;
}
```

## ✨ Microinterações

### Animações (200ms)
- Transição entre pedidos selecionados
- Fade suave ao trocar conteúdo
- Slide do painel lateral

### Hover States
- Cards de pedido: `hover:border-[#4C258C]`
- Botões: `hover:bg-[#5E35B1]`
- Produtos: `hover:bg-[#F8F9FC]`

### Estados Visuais
- Pedido selecionado: fundo `#EEE8FA` + borda roxa + indicador lateral
- Loading: Skeleton com pulse
- Empty: Ícone + mensagem centralizada
- Error: Ícone de alerta + botão retry

## 🎯 Tratamento de Dados

### Campos Opcionais

Quando um campo for `null` ou `undefined`, exibir:
- **Telefone**: ocultar botões de contato
- **Endereço**: ocultar seção inteira
- **Observações**: "Nenhuma observação"
- **Troco**: ocultar linha
- **Imagem do produto**: ícone de placeholder

### Fallbacks

```typescript
cliente_nome || "Cliente"
meio_pagamento || "Não informado"
tipo_entrega || "delivery"
subtotal || 0
taxa_entrega || 0
total || 0
itens || []
status || "pendente"
```

## 🚀 Performance

### Otimizações

1. **Memoization**: Filtros de pedidos usam `useMemo`
2. **Virtual Scroll**: Lista de pedidos com `ScrollArea`
3. **Lazy Loading**: Imagens dos produtos com Next.js Image
4. **Debounce**: Busca em tempo real (200ms)

### Responsividade

- **Desktop**: Layout completo de 3 painéis
- **Tablet**: Colapsar painel lateral
- **Mobile**: Layout empilhado (fora do escopo atual)

## 🔒 Segurança

### Validações

- Telefone formatado antes de enviar para WhatsApp
- Endereço encoded para URL do Google Maps
- IDs truncados para exibição (primeiros 8 caracteres)

### Permissões

- Ações de status devem validar permissões no backend
- Dados sensíveis do cliente protegidos

## 🛠️ Integração com API

### Atualizar Status

```typescript
const handleStatusChange = async (newStatus: Pedido["status"]) => {
  // 1. Chamar API
  const response = await fetch(`/api/pedidos/${pedido.id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: newStatus })
  });

  // 2. Atualizar estado local
  setSelectedPedido({
    ...selectedPedido,
    status: newStatus,
    updated_at: new Date().toISOString(),
  });
};
```

### Real-time Updates

Para implementar atualizações em tempo real, você pode:

1. **Supabase Realtime**: Subscribe a mudanças na tabela
2. **Polling**: Atualizar a cada X segundos
3. **WebSocket**: Conexão bidirecional

## 📝 Próximos Passos

### Features Futuras

- [ ] Impressão otimizada de pedidos
- [ ] Notificações push para novos pedidos
- [ ] Filtros avançados (data, valor, cliente)
- [ ] Exportar relatórios (PDF, Excel)
- [ ] Histórico completo de mudanças de status
- [ ] Chat com o cliente
- [ ] Rastreamento de entrega em tempo real
- [ ] Analytics de pedidos

### Melhorias de UX

- [ ] Atalhos de teclado
- [ ] Drag & drop para reordenar prioridades
- [ ] Modo escuro
- [ ] Personalização de colunas
- [ ] Salvar filtros favoritos

## 🎓 Boas Práticas

### Código Limpo

- Componentes pequenos e focados
- Props tipadas com TypeScript
- Separação de concerns (UI vs lógica)
- Comentários apenas quando necessário

### Acessibilidade

- Textos alternativos em ícones
- Contraste adequado (WCAG AA)
- Navegação por teclado
- ARIA labels

### Manutenibilidade

- Tipos centralizados em `/types`
- Estilos consistentes com Tailwind
- Reutilização de componentes shadcn/ui
- Documentação inline

---

**Design System**: SoftShake Admin Premium  
**Inspiração**: iFood Merchant, Rappi Partner, Shopify Admin, Stripe, Linear  
**Versão**: 1.0.0


## 🖨️ Funcionalidade de Impressão

### PrintView Component

Componente dedicado para impressão de pedidos com layout profissional.

**Características:**
- Logo centralizada da empresa
- Informações completas do pedido
- Tabela de itens com adicionais
- Resumo financeiro destacado
- Informações de pagamento e entrega
- Observações do cliente
- Rodapé com data de impressão

**Como funciona:**
1. Componente fica oculto na tela normal (`hidden print:block`)
2. Ao clicar em "Imprimir", apenas o PrintView é exibido
3. CSS `@media print` garante formatação adequada
4. Margem de 2cm em todas as páginas

**Elementos exibidos na impressão:**
- ✅ Logo e nome da empresa
- ✅ Número e data do pedido
- ✅ Status do pedido
- ✅ Dados do cliente (nome e telefone)
- ✅ Endereço de entrega completo
- ✅ Tabela de produtos com:
  - Nome do produto
  - Quantidade
  - Preço unitário
  - **Adicionais (com preços)**
  - Observações do item
  - Subtotal do item
- ✅ Resumo financeiro:
  - Subtotal
  - Taxa de entrega
  - **Total em destaque**
- ✅ Informações de pagamento:
  - Forma de pagamento
  - Troco (se aplicável)
  - Tipo de entrega
- ✅ Observações do cliente
- ✅ Data e hora da impressão

**Uso:**
```tsx
<PrintView pedido={pedido} />
```

O componente é automaticamente incluído no `OrderDetailPanel` e acionado pelo botão "Imprimir".

## 🎨 Adicionais Melhorados

Os adicionais dos produtos agora são exibidos em um card destacado:

**Antes:**
```
+ Chocolate extra (R$ 2,00)
+ Granulado (R$ 1,50)
```

**Agora:**
```
┌─ Adicionais: ──────────────┐
│ + Chocolate extra  +R$ 2,00│
│ + Granulado       +R$ 1,50 │
└────────────────────────────┘
```

**Estilo:**
- Fundo branco destacado
- Label "Adicionais:" em roxo
- Lista com nome e preço alinhados
- Bordas arredondadas
- Padding adequado

### Localização dos Adicionais

**Na tela (Aba Resumo):**
- Exibidos abaixo de cada produto
- Card branco com destaque
- Preços alinhados à direita

**Na impressão:**
- Dentro da tabela de produtos
- Texto menor e identado
- Formato: `+ Nome (+R$ Valor)`

## 📋 Checklist de Impressão

Antes de imprimir, verifique:
- [ ] Dados do cliente corretos
- [ ] Endereço de entrega completo
- [ ] Todos os produtos listados
- [ ] Adicionais de cada produto
- [ ] Valores calculados corretamente
- [ ] Forma de pagamento
- [ ] Observações incluídas
- [ ] Status do pedido atualizado

## 🎯 Casos de Uso

### Impressão para Cozinha
- Imprimir assim que o pedido for aceito
- Cole na área de preparação
- Marque os itens conforme prepara

### Impressão para Entrega
- Imprimir antes da saída
- Anexar ao pedido
- Cliente assina o recebimento

### Impressão para Arquivo
- Salvar como PDF
- Arquivar digitalmente
- Consulta futura de pedidos

## 💡 Dicas

1. **Configurar impressora**: Configure margens de 2cm em todas as bordas
2. **Salvar como PDF**: Use "Imprimir para PDF" para arquivo digital
3. **Imprimir múltiplas vias**: Selecione número de cópias na impressora
4. **Modo econômico**: Configure impressora para economizar tinta

---

**Versão**: 1.1.0 (com Impressão)
