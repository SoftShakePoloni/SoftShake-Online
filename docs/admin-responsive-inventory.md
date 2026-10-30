# Inventário administrativo

Gerado por `node scripts/responsive/inventory.cjs`. Todos os 119 componentes TSX administrativos foram lidos. O rastreamento inclui reexports; presença no grafo não implica montagem na tela. Componentes legados foram inventariados, sem reativar fluxos abandonados.

## Rotas (12)

- src/app/admin/(dashboard)/adicionais/page.tsx
- src/app/admin/(dashboard)/categorias/page.tsx
- src/app/admin/(dashboard)/clientes/page.tsx
- src/app/admin/(dashboard)/configuracoes/page.tsx
- src/app/admin/(dashboard)/cupons/page.tsx
- src/app/admin/(dashboard)/estabelecimento/page.tsx
- src/app/admin/(dashboard)/financeiro/page.tsx
- src/app/admin/(dashboard)/page.tsx
- src/app/admin/(dashboard)/pedidos/page.tsx
- src/app/admin/(dashboard)/produtos/page.tsx
- src/app/admin/(dashboard)/relatorios/page.tsx
- src/app/admin/login/page.tsx

## Componentes

| Arquivo | Dependência das rotas | Padrões para revisão |
|---|---|---|
| src/components/admin/AccessGuard.tsx | Importado pelo conjunto de rotas | sem padrão rígido identificado |
| src/components/admin/ActivityFeed.tsx | Legado/sem importação pelas rotas | sem padrão rígido identificado |
| src/components/admin/adicionais/AdicionaisManager.tsx | Legado/sem importação pelas rotas | larguras explícitas, rolagem local, flutuantes |
| src/components/admin/adicionais/NovoOpcaoDialog.tsx | Legado/sem importação pelas rotas | larguras explícitas, flutuantes |
| src/components/admin/adicionais/OpcaoDetailPanel.tsx | Legado/sem importação pelas rotas | larguras explícitas, grid, flutuantes |
| src/components/admin/adicionais/OpcaoList.tsx | Legado/sem importação pelas rotas | sem padrão rígido identificado |
| src/components/admin/catalogo/CatalogEmpty.tsx | Importado pelo conjunto de rotas | sem padrão rígido identificado |
| src/components/admin/catalogo/CatalogoHeader.tsx | Importado pelo conjunto de rotas | sem padrão rígido identificado |
| src/components/admin/catalogo/CatalogoManager.tsx | Importado pelo conjunto de rotas | larguras explícitas, flutuantes |
| src/components/admin/catalogo/CatalogoTabs.tsx | Importado pelo conjunto de rotas | rolagem local |
| src/components/admin/catalogo/CatalogSkeleton.tsx | Importado pelo conjunto de rotas | larguras explícitas |
| src/components/admin/catalogo/CatalogTagBadge.tsx | Importado pelo conjunto de rotas | sem padrão rígido identificado |
| src/components/admin/catalogo/CategoriasSidebar.tsx | Importado pelo conjunto de rotas | rolagem local, flutuantes |
| src/components/admin/catalogo/CombosTab.tsx | Importado pelo conjunto de rotas | rolagem local, grid |
| src/components/admin/catalogo/ComingSoonTab.tsx | Legado/sem importação pelas rotas | sem padrão rígido identificado |
| src/components/admin/catalogo/ComplementosTab.tsx | Importado pelo conjunto de rotas | larguras explícitas, rolagem local |
| src/components/admin/catalogo/ProdutoComplementosPanel.tsx | Importado pelo conjunto de rotas | rolagem local, grid |
| src/components/admin/catalogo/ProdutoDrawer.tsx | Importado pelo conjunto de rotas | larguras explícitas, flutuantes |
| src/components/admin/catalogo/ProdutoRow.tsx | Importado pelo conjunto de rotas | flutuantes |
| src/components/admin/catalogo/ProdutosArea.tsx | Importado pelo conjunto de rotas | larguras explícitas, rolagem local |
| src/components/admin/catalogo/ProdutoStatusBadge.tsx | Legado/sem importação pelas rotas | sem padrão rígido identificado |
| src/components/admin/catalogo/ProdutoTagsPanel.tsx | Importado pelo conjunto de rotas | sem padrão rígido identificado |
| src/components/admin/catalogo/PromocoesFreteTab.tsx | Importado pelo conjunto de rotas | larguras explícitas, rolagem local, grid |
| src/components/admin/catalogo/TagSelectPopover.tsx | Importado pelo conjunto de rotas | larguras explícitas, rolagem local, flutuantes |
| src/components/admin/categorias/CategoriasManager.tsx | Legado/sem importação pelas rotas | rolagem local, flutuantes |
| src/components/admin/charts/OrderStatusChart.tsx | Legado/sem importação pelas rotas | sem padrão rígido identificado |
| src/components/admin/charts/RevenueLineChart.tsx | Legado/sem importação pelas rotas | sem padrão rígido identificado |
| src/components/admin/clientes/ClienteDetailPanel.tsx | Importado pelo conjunto de rotas | rolagem local, grid |
| src/components/admin/clientes/ClienteList.tsx | Importado pelo conjunto de rotas | sem padrão rígido identificado |
| src/components/admin/clientes/ClienteListItem.tsx | Importado pelo conjunto de rotas | sem padrão rígido identificado |
| src/components/admin/clientes/ClienteSidePanel.tsx | Importado pelo conjunto de rotas | larguras explícitas, rolagem local |
| src/components/admin/clientes/ClientesManager.tsx | Importado pelo conjunto de rotas | larguras explícitas, rolagem local |
| src/components/admin/clientes/EmptyState.tsx | Importado pelo conjunto de rotas | sem padrão rígido identificado |
| src/components/admin/configuracoes/cards/AparenciaCard.tsx | Legado/sem importação pelas rotas | larguras explícitas |
| src/components/admin/configuracoes/cards/ContatoCard.tsx | Legado/sem importação pelas rotas | sem padrão rígido identificado |
| src/components/admin/configuracoes/cards/DeliveryCard.tsx | Legado/sem importação pelas rotas | grid |
| src/components/admin/configuracoes/cards/EnderecoCard.tsx | Legado/sem importação pelas rotas | grid |
| src/components/admin/configuracoes/cards/FuncionamentoCard.tsx | Legado/sem importação pelas rotas | grid |
| src/components/admin/configuracoes/cards/InformacoesGerais.tsx | Legado/sem importação pelas rotas | sem padrão rígido identificado |
| src/components/admin/configuracoes/ConfiguracoesForm.tsx | Legado/sem importação pelas rotas | sem padrão rígido identificado |
| src/components/admin/configuracoes/ConfiguracoesManager.tsx | Legado/sem importação pelas rotas | rolagem local, grid |
| src/components/admin/configuracoes/PreviewLoja.tsx | Legado/sem importação pelas rotas | grid |
| src/components/admin/configuracoes/StatusCards.tsx | Legado/sem importação pelas rotas | grid |
| src/components/admin/cupons/CuponsManager.tsx | Importado pelo conjunto de rotas | larguras explícitas, rolagem local, grid |
| src/components/admin/dashboard/DashboardView.tsx | Importado pelo conjunto de rotas | larguras explícitas, rolagem local, grid |
| src/components/admin/DetalhesPedido.tsx | Legado/sem importação pelas rotas | rolagem local, grid |
| src/components/admin/estabelecimento/EstabelecimentoManager.tsx | Importado pelo conjunto de rotas | larguras explícitas |
| src/components/admin/estabelecimento/NumeracaoPedidosCard.tsx | Importado pelo conjunto de rotas | flutuantes |
| src/components/admin/estabelecimento/SoundSettingsCard.tsx | Importado pelo conjunto de rotas | grid |
| src/components/admin/FinancialSummary.tsx | Legado/sem importação pelas rotas | sem padrão rígido identificado |
| src/components/admin/Header.tsx | Legado/sem importação pelas rotas | sem padrão rígido identificado |
| src/components/admin/LatestOrdersTable.tsx | Legado/sem importação pelas rotas | rolagem local, ação por hover |
| src/components/admin/OrderDetailsModal.tsx | Legado/sem importação pelas rotas | flutuantes |
| src/components/admin/OrdersTable.tsx | Legado/sem importação pelas rotas | larguras explícitas, grid, flutuantes |
| src/components/admin/pedidos/AutoAcceptSwitch.tsx | Legado/sem importação pelas rotas | sem padrão rígido identificado |
| src/components/admin/pedidos/EmptyState.tsx | Legado/sem importação pelas rotas | sem padrão rígido identificado |
| src/components/admin/pedidos/ErrorState.tsx | Legado/sem importação pelas rotas | sem padrão rígido identificado |
| src/components/admin/pedidos/LoadingState.tsx | Legado/sem importação pelas rotas | larguras explícitas |
| src/components/admin/pedidos/OrderCard.tsx | Legado/sem importação pelas rotas | sem padrão rígido identificado |
| src/components/admin/pedidos/OrderDetailPanel.tsx | Legado/sem importação pelas rotas | larguras explícitas, flutuantes |
| src/components/admin/pedidos/OrderDetailView.tsx | Legado/sem importação pelas rotas | larguras explícitas, flutuantes |
| src/components/admin/pedidos/OrderElapsedTimer.tsx | Importado pelo conjunto de rotas | sem padrão rígido identificado |
| src/components/admin/pedidos/OrderGroup.tsx | Legado/sem importação pelas rotas | larguras explícitas |
| src/components/admin/pedidos/OrderList.tsx | Legado/sem importação pelas rotas | larguras explícitas |
| src/components/admin/pedidos/OrderListItem.tsx | Legado/sem importação pelas rotas | sem padrão rígido identificado |
| src/components/admin/pedidos/OrderPrint.tsx | Importado pelo conjunto de rotas | sem padrão rígido identificado |
| src/components/admin/pedidos/OrdersEmptyDetail.tsx | Legado/sem importação pelas rotas | sem padrão rígido identificado |
| src/components/admin/pedidos/OrderSidePanel.tsx | Legado/sem importação pelas rotas | larguras explícitas, rolagem local |
| src/components/admin/pedidos/OrdersPanel.tsx | Legado/sem importação pelas rotas | larguras explícitas, rolagem local, grid |
| src/components/admin/pedidos/OrdersSkeleton.tsx | Importado pelo conjunto de rotas | larguras explícitas |
| src/components/admin/pedidos/PedidoDetailDrawer.tsx | Legado/sem importação pelas rotas | rolagem local, flutuantes |
| src/components/admin/pedidos/PedidoDetailPanel.tsx | Importado pelo conjunto de rotas | larguras explícitas, rolagem local, flutuantes |
| src/components/admin/pedidos/PedidoKanbanCard.tsx | Importado pelo conjunto de rotas | larguras explícitas, flutuantes |
| src/components/admin/pedidos/PedidoKanbanColumn.tsx | Importado pelo conjunto de rotas | larguras explícitas, rolagem local |
| src/components/admin/pedidos/PedidosManager.tsx | Importado pelo conjunto de rotas | larguras explícitas, rolagem local, grid, flutuantes |
| src/components/admin/pedidos/PedidosToolbar.tsx | Importado pelo conjunto de rotas | larguras explícitas |
| src/components/admin/pedidos/StatusCounters.tsx | Legado/sem importação pelas rotas | sem padrão rígido identificado |
| src/components/admin/PedidosLista.tsx | Legado/sem importação pelas rotas | larguras explícitas, rolagem local, flutuantes |
| src/components/admin/premium/AdminShell.tsx | Importado pelo conjunto de rotas | flutuantes |
| src/components/admin/premium/PedidosPageContent.tsx | Legado/sem importação pelas rotas | larguras explícitas, grid |
| src/components/admin/premium/PremiumActivityFeed.tsx | Legado/sem importação pelas rotas | sem padrão rígido identificado |
| src/components/admin/premium/PremiumDonutChart.tsx | Legado/sem importação pelas rotas | sem padrão rígido identificado |
| src/components/admin/premium/PremiumEmptyState.tsx | Legado/sem importação pelas rotas | sem padrão rígido identificado |
| src/components/admin/premium/PremiumFilterBar.tsx | Legado/sem importação pelas rotas | sem padrão rígido identificado |
| src/components/admin/premium/PremiumFinancialSummary.tsx | Legado/sem importação pelas rotas | sem padrão rígido identificado |
| src/components/admin/premium/PremiumHourlyChart.tsx | Legado/sem importação pelas rotas | sem padrão rígido identificado |
| src/components/admin/premium/PremiumOrdersTable.tsx | Legado/sem importação pelas rotas | larguras explícitas, rolagem local |
| src/components/admin/premium/PremiumPageHeader.tsx | Legado/sem importação pelas rotas | sem padrão rígido identificado |
| src/components/admin/premium/PremiumPaymentMethods.tsx | Legado/sem importação pelas rotas | sem padrão rígido identificado |
| src/components/admin/premium/PremiumRecentCustomers.tsx | Legado/sem importação pelas rotas | sem padrão rígido identificado |
| src/components/admin/premium/PremiumRevenueChart.tsx | Legado/sem importação pelas rotas | sem padrão rígido identificado |
| src/components/admin/premium/PremiumSidebar.tsx | Importado pelo conjunto de rotas | larguras explícitas, rolagem local |
| src/components/admin/premium/PremiumSkeleton.tsx | Legado/sem importação pelas rotas | larguras explícitas, grid |
| src/components/admin/premium/PremiumStatCard.tsx | Legado/sem importação pelas rotas | sem padrão rígido identificado |
| src/components/admin/premium/PremiumTopbar.tsx | Importado pelo conjunto de rotas | larguras explícitas |
| src/components/admin/premium/PremiumTopProducts.tsx | Legado/sem importação pelas rotas | ação por hover |
| src/components/admin/premium/StoreStatusCard.tsx | Importado pelo conjunto de rotas | flutuantes |
| src/components/admin/produto-image-upload.tsx | Importado pelo conjunto de rotas | sem padrão rígido identificado |
| src/components/admin/produtos/EmptyState.tsx | Legado/sem importação pelas rotas | sem padrão rígido identificado |
| src/components/admin/produtos/NovoProdutoDialog.tsx | Legado/sem importação pelas rotas | larguras explícitas, grid, flutuantes |
| src/components/admin/produtos/ProdutoDetailPanel.tsx | Legado/sem importação pelas rotas | grid, flutuantes |
| src/components/admin/produtos/ProdutoList.tsx | Legado/sem importação pelas rotas | larguras explícitas |
| src/components/admin/produtos/ProdutoListItem.tsx | Legado/sem importação pelas rotas | sem padrão rígido identificado |
| src/components/admin/produtos/ProdutoSidePanel.tsx | Legado/sem importação pelas rotas | larguras explícitas, rolagem local |
| src/components/admin/produtos/ProdutosManager.tsx | Legado/sem importação pelas rotas | sem padrão rígido identificado |
| src/components/admin/relatorios/RelatorioCharts.tsx | Importado pelo conjunto de rotas | sem padrão rígido identificado |
| src/components/admin/relatorios/RelatorioKpiCards.tsx | Importado pelo conjunto de rotas | sem padrão rígido identificado |
| src/components/admin/relatorios/RelatoriosManager.tsx | Importado pelo conjunto de rotas | larguras explícitas, rolagem local, grid |
| src/components/admin/relatorios/RelatorioTables.tsx | Importado pelo conjunto de rotas | larguras explícitas, rolagem local, grid |
| src/components/admin/settings/SettingsCategoryNav.tsx | Legado/sem importação pelas rotas | rolagem local |
| src/components/admin/settings/SettingsComingSoon.tsx | Legado/sem importação pelas rotas | sem padrão rígido identificado |
| src/components/admin/settings/SettingsPageHeader.tsx | Legado/sem importação pelas rotas | sem padrão rígido identificado |
| src/components/admin/settings/SettingsSaveIndicator.tsx | Legado/sem importação pelas rotas | sem padrão rígido identificado |
| src/components/admin/settings/SettingsSection.tsx | Legado/sem importação pelas rotas | sem padrão rígido identificado |
| src/components/admin/settings/SettingsToggleCard.tsx | Legado/sem importação pelas rotas | larguras explícitas |
| src/components/admin/Sidebar.tsx | Legado/sem importação pelas rotas | rolagem local |
| src/components/admin/sistema/SistemaConfigManager.tsx | Importado pelo conjunto de rotas | larguras explícitas |
| src/components/admin/sistema/UsuariosSection.tsx | Importado pelo conjunto de rotas | larguras explícitas, rolagem local, grid |
| src/components/admin/StatCard.tsx | Legado/sem importação pelas rotas | ação por hover |
