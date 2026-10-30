# Dashboard — redesign

## Composição

Cabeçalho “Visão geral”, descrição contextual e filtro de período. Removidos os atalhos redundantes, data duplicada, notificação decorativa e botão de atualização manual. O dashboard continua recebendo atualizações de pedidos em tempo real.

Quatro indicadores, com pedidos em aberto destacados em roxo e acesso à operação. Percentuais retirados da apresentação para reduzir ruído; cálculos e dados do servidor permanecem intactos.

Pedidos recentes limitados visualmente aos seis últimos registros. Uma única ação “Ver todos”; cada linha possui um link acessível que abre o pedido correspondente no painel existente através de `?pedido=ID`.

Desempenho agrupado em receita/volume e produtos/pagamentos/atividade. Estados vazios compactos, gráfico sem animação decorativa, erro com repetição da consulta e manutenção dos últimos dados exibidos.

Mantidos Inter, roxo #4C258C, neutros e status semânticos. Refinamento discreto da sidebar, sem gradientes nos avatares. Assinaturas realtime isoladas por montagem, inclusive em acesso HTTP de rede local.

## Validação

- Chromium com componentes reais e transporte isolado: 320, 360, 375, 390, 430, 768, 820, 1024, 1280, 1440 e 1920 px.
- Sem overflow horizontal da página e sem erros de execução.
- Abas de análises, filtro de período, seis linhas recentes, estado vazio, falha de consulta preservando dados e abertura de pedido por ID aprovados.
- Capturas desktop/mobile revisadas. Revisão segundo Web Interface Guidelines: teclado, foco, conteúdo longo, semântica, toque e redução de movimento.
- ESLint dos arquivos alterados aprovado.
- TypeScript global aponta erro preexistente em `src/app/api/auth/entrar/route.ts:78` (`deveCriarConta`).

Os testes utilizam dados fictícios exclusivamente em `scripts/responsive/fixture.tsx`, sem inserções em produção. O teste dedicado é `scripts/responsive/dashboard-check.cjs`. Safari, Firefox e dispositivos físicos não foram executados.
