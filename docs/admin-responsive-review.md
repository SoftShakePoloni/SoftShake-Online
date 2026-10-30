# Refinamento responsivo do administrativo

## Escopo e direção

Inventário: 12 rotas e 119 componentes administrativos, listado em [admin-responsive-inventory.md](admin-responsive-inventory.md). Categorias e adicionais redirecionam para o catálogo; financeiro continua sendo uma página informativa em desenvolvimento. Componentes legados sem uso pelas rotas foram inventariados, sem reativação.

Preservados Inter, roxo #4C258C, acento #7C3AED, superfícies #FFFFFF/#F7F8FC e texto #111827. O código existente utiliza superfícies claras; este trabalho não cria um novo tema escuro.

## Alterações

- Navegação lateral fixa a partir de 1280 px, recolhível com preferência existente. Em larguras menores, menu acionável com foco controlado, Escape e fechamento ao navegar.
- Kanban com quatro colunas e rolagem horizontal localizada em tablets/desktop; no celular, seleção de etapa com contadores e lista de cards. Ações existentes de status permanecem disponíveis. Arraste com mouse e ações explícitas no toque permitem rolar sem arrastar pedidos acidentalmente.
- Detalhes de pedidos em painel contextual no desktop e tela inteira no celular, com conteúdo rolável, ações acessíveis e retorno de foco.
- Clientes: lista ocupando a largura no celular, detalhe com retorno à lista e resumo empilhado; três colunas apenas quando existe espaço.
- Catálogo: gerenciamento de categorias disponível no celular, exportação acessível, abas sem compressão e com setas/Home/End por teclado, ações visíveis sem hover, editor com altura dinâmica e safe areas.
- Complementos reorganizados com espaço para nomes extensos; campos de promoções/combos empilhados quando necessário.
- Configurações e estabelecimento: linhas adaptadas à largura real do conteúdo via container queries, controles abaixo das descrições em espaços menores.
- Indicadores, relatórios, tabelas, carregamento, login, menus, foco, redução de movimento e alvos de toque revisados. Tabelas densas usam rolagem local mantendo fonte legível.

## Validação

371 verificações automatizadas em Chromium, sem overflow horizontal da página ou erros de execução no ambiente isolado, nas larguras 320, 360, 375, 390, 430, 768, 820, 1024, 1280, 1440 e 1920 px. Incluem as telas principais, login, menu, seleção de etapa, detalhes de pedidos, chamada do manipulador existente de atualização de status, abas de clientes, editor de produto, todas as abas do catálogo e seções do estabelecimento/configurações.

Dados fictícios: 60 produtos/clientes, 24 pedidos, 15 itens por pedido, nomes e endereços extensos. Capturas revisadas durante a implementação. ESLint dos arquivos administrativos alterados passou. Revisão orientada pelas Web Interface Guidelines: foco, semântica, teclado, conteúdo longo, toque, safe areas e redução de movimento.

O ambiente usa os componentes reais com substituição apenas do transporte de dados e navegação Next, sem credenciais ou gravações na loja. Não equivale a um teste integrado de autenticação, APIs, persistência ou realtime em produção. O inventário é reproduzível com `node scripts/responsive/inventory.cjs`; a fixture com `node scripts/responsive/build.cjs` e `node scripts/responsive/check.cjs` (Playwright disponível no ambiente).

## Limitações

- TypeScript global bloqueado por erro já presente em `src/app/api/auth/entrar/route.ts:78`: propriedade `deveCriarConta` incompatível com o tipo esperado. Nenhuma alteração de autenticação foi feita neste trabalho.
- Safari/WebKit, Firefox, Edge e dispositivos físicos iOS/Android não foram executados. Teclado virtual, impressão física e orientação em aparelhos reais ainda precisam de homologação.
- Estados vazios/erro/carregamento foram inspecionados no código e adaptados quando necessário; a matriz automatizada principal usa dados preenchidos.
- Alterações locais preexistentes do projeto foram preservadas.
