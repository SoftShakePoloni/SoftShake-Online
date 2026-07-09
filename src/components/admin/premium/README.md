# Premium Admin Dashboard Components

Dashboard administrativa premium para o sistema SoftShake Online, inspirada em produtos reais como iFood Merchant, Shopify Admin, Stripe Dashboard, Linear, Notion, Vercel Dashboard e Rappi Partner.

## 🎨 Design System

### Paleta de Cores

```typescript
const colors = {
  // Primárias
  primary: "#4C258C",          // Roxo principal
  primaryHover: "#5E35B1",     // Roxo hover
  primaryLight: "#EEE8FA",     // Roxo claro
  secondary: "#7C3AED",        // Roxo secundário
  
  // Neutras
  background: "#F7F8FC",       // Fundo da página
  card: "#FFFFFF",             // Fundo dos cards
  
  // Texto
  textPrimary: "#111827",      // Texto principal
  textSecondary: "#6B7280",    // Texto secundário
  
  // Feedback
  border: "#E5E7EB",           // Bordas
  success: "#22C55E",          // Sucesso
  error: "#EF4444",            // Erro
  warning: "#F59E0B",          // Aviso
};
```

### Princípios de Design

- **Minimalista**: Interface clean sem elementos desnecessários
- **Espaçamento generoso**: Muito espaço em branco para respirar
- **Tipografia impecável**: Hierarquia clara e legível
- **Roxo com propósito**: Usado apenas para destacar elementos importantes
- **Transições suaves**: Animações de 150-250ms
- **Microinterações**: Hover e states bem definidos

## 📦 Componentes

### Layout

#### PremiumSidebar
Sidebar fixa de 270px com navegação principal.

**Features:**
- Menu com destaque visual para item ativo
- Barra lateral vertical roxa no item ativo
- Perfil do administrador no rodapé
- Botão de logout
- Ícones do Lucide React

**Uso:**
```tsx
<PremiumSidebar adminEmail="admin@softshake.com" />
```

#### PremiumTopbar
Barra superior com busca, ações e informações do usuário.

**Features:**
- Campo de busca grande e destacado
- Botão "Nova Venda" em destaque
- Notificações com badge
- Botão de ajuda
- Avatar do usuário
- Data atual formatada

**Uso:**
```tsx
<PremiumTopbar 
  adminName="Administrador" 
  adminEmail="admin@softshake.com" 
/>
```

### Cards de Métricas

#### PremiumStatCard
Card de estatística com ícone, valor, trend e sparkline.

**Props:**
- `title`: Título do card
- `value`: Valor principal (string ou número)
- `icon`: Ícone do Lucide React
- `trend?`: Porcentagem de variação
- `trendLabel?`: Label do trend
- `sparklineData?`: Array de números para o gráfico
- `variant?`: "purple" | "blue" | "green" | "orange" | "pink"
- `subtitle?`: Texto adicional

**Uso:**
```tsx
<PremiumStatCard
  title="Receita do Mês"
  value="R$ 12.500,00"
  icon={DollarSign}
  trend={15.3}
  trendLabel="vs mês anterior"
  variant="purple"
  sparklineData={[65, 72, 68, 85, 92, 88, 95]}
/>
```

### Gráficos

#### PremiumRevenueChart
Gráfico de área para evolução da receita.

**Features:**
- Recharts com área preenchida
- Gradiente roxo
- Grid horizontal
- Tooltip customizado
- Animações suaves

**Uso:**
```tsx
<PremiumRevenueChart
  data={monthlyData}
  title="Evolução da Receita"
  description="Receita mensal dos últimos 6 meses"
/>
```

#### PremiumDonutChart
Gráfico de rosquinha para distribuições.

**Features:**
- Gráfico de pizza com furo central
- Legenda lateral interativa
- Cores customizáveis
- Tooltip com porcentagens

**Uso:**
```tsx
<PremiumDonutChart
  data={statusData}
  title="Status dos Pedidos"
  description="Distribuição por status"
/>
```

#### PremiumHourlyChart
Gráfico de barras para pedidos por horário.

**Features:**
- Barras verticais com cantos arredondados
- Grid horizontal
- Tooltip customizado
- Cores roxas

**Uso:**
```tsx
<PremiumHourlyChart />
```

### Tabelas

#### PremiumOrdersTable
Tabela de pedidos recentes.

**Features:**
- Responsiva com colunas que ocultam em telas menores
- Badges de status coloridas
- Ações por linha (visualizar, baixar, menu)
- Hover destacado
- Link "Ver todos"

**Uso:**
```tsx
<PremiumOrdersTable 
  orders={orders}
  title="Pedidos Recentes"
/>
```

### Listas e Feeds

#### PremiumActivityFeed
Feed de atividades recentes.

**Features:**
- Timeline visual com linha conectora
- Ícones coloridos por tipo de atividade
- Indicador de prioridade
- Timestamps relativos
- Indicador "em tempo real"

**Uso:**
```tsx
<PremiumActivityFeed />
```

#### PremiumTopProducts
Lista de produtos mais vendidos.

**Features:**
- Ranking visual (1º, 2º, 3º)
- Imagem do produto
- Barra de progresso
- Gradientes para os top 3

**Uso:**
```tsx
<PremiumTopProducts products={products} />
```

#### PremiumRecentCustomers
Lista de clientes recentes.

**Features:**
- Avatar com iniciais
- Badges de tipo (Novo, Recorrente, VIP)
- Total gasto e pedidos
- Último pedido

**Uso:**
```tsx
<PremiumRecentCustomers />
```

### Resumos

#### PremiumFinancialSummary
Resumo financeiro do período.

**Features:**
- Entradas, saídas, lucro, taxas
- Ícones indicativos
- Cores por tipo
- Saldo total destacado

**Uso:**
```tsx
<PremiumFinancialSummary data={financialData} />
```

#### PremiumPaymentMethods
Distribuição por métodos de pagamento.

**Features:**
- Ícones por tipo de pagamento
- Barras de progresso com gradientes
- Porcentagens e valores
- Total processado

**Uso:**
```tsx
<PremiumPaymentMethods />
```

## 🎯 Responsividade

Todos os componentes são totalmente responsivos:

- **Desktop (1280px+)**: Layout completo com 3 colunas
- **Tablet (768px - 1279px)**: Layout adaptado com 2 colunas
- **Mobile (<768px)**: Layout empilhado com 1 coluna

### Breakpoints

```typescript
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

## 🔄 Animações

Todas as animações seguem princípios de UX:

- Duração: 150-250ms
- Easing: `ease-in-out` ou `cubic-bezier`
- Hover: Scale, cor, sombra
- Transições entre estados
- Loading skeletons

## 🚀 Performance

- Componentes client-side apenas quando necessário
- Server Components por padrão
- Lazy loading de dados
- Skeleton loading states
- Imagens otimizadas com Next.js Image

## 📱 Mobile First

Componentes desenvolvidos com abordagem mobile-first:

1. Design para mobile primeiro
2. Progressive enhancement para tablets
3. Funcionalidades completas no desktop

## ✨ Microinterações

- Hover suave em cards e botões
- Scale em ícones ao passar o mouse
- Fade in/out
- Skeleton loading
- Toast notifications
- Tooltips

## 🎨 Ícones

Todos os ícones são do **Lucide React**:
- Consistentes e modernos
- Peso uniforme
- Tamanhos padrão (16px, 20px, 24px)

## 📊 Dados

Os componentes aceitam dados reais ou usam dados de exemplo para demonstração. Substitua os dados fictícios pelos dados reais do seu backend.

## 🛠️ Tecnologias

- **Next.js 15**: Framework React
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Recharts**: Gráficos
- **Lucide React**: Ícones
- **date-fns**: Formatação de datas
- **Radix UI**: Componentes acessíveis

## 📝 Notas

- Todos os componentes são acessíveis (WCAG 2.1)
- Suporte a temas claro/escuro pode ser adicionado
- Componentes podem ser facilmente customizados via props
- Design system facilmente extensível
