# Catálogo — redesign

## Composição

Mesmo vocabulário visual do dashboard: Inter, roxo #4C258C, superfícies claras, bordas discretas e ações hierarquizadas. Cabeçalho “Produtos / Gerencie seu catálogo”, ação primária “Novo produto”, importação e exportação agrupadas no menu secundário. O comportamento de importação continua sendo o aviso preexistente de funcionalidade em breve; a exportação JSON mantém seu fluxo original.

Busca, disponibilidade e ordenação reunidas na barra da listagem. Abas de produtos, complementos, opções, combos e promoções preservadas. Categorias compactas no desktop; seletor em larguras menores, com botão Gerenciar para criação, edição, exclusão, duplicação e reordenação.

Tabela reduzida a produto, categoria, preço, disponibilidade e ações. Disponibilidade e ativação compartilham o mesmo controle e mantêm a lógica `esta_disponivel !== false`. Preço promocional e preço anterior seguem o cálculo existente. Atualização movida para o editor. Miniaturas têm fallback em caso de erro, sem imagens fictícias.

No celular, a mesma estrutura de dados recebe apresentação em linhas com miniatura, nome, preço, disponibilidade e menu; a tabela não exige rolagem horizontal. Altura acompanha o conteúdo. Carregamento incremental existente de 50 itens por vez preservado. Não foi alterado o limite de consulta já existente de 500 produtos no servidor.

Estados distintos para catálogo vazio, categoria vazia, busca/filtro sem resultado e falha de carregamento. Página tem skeleton compacto. Confirmação de exclusão preservada.

## Validação

Fixture isolada com componentes reais e dados fictícios, sem gravações na loja. Testados 320, 360, 375, 390, 430, 768, 820, 1024, 1280, 1440 e 1920 px: sem overflow da página ou erros de execução. Verificados busca, filtros, categorias, carregamento de 50 para 60 itens, menus, edição, novo produto, confirmação/cancelamento de exclusão e todas as abas.

Rodadas adicionais em 390 e 1440 px: fallback de imagem quebrada, chamada do manipulador existente de disponibilidade e estados vazio/erro. Capturas desktop/mobile revisadas. ESLint do catálogo e da rota passou. TypeScript global permanece bloqueado pelo erro preexistente em `src/app/api/auth/entrar/route.ts:78` (`deveCriarConta`).

Revisão baseada nas Web Interface Guidelines: foco visível, labels, controles sem dependência de hover, conteúdo longo, estados vazios e acesso por teclado. Teste reproduzível: `scripts/responsive/catalog-check.cjs`, após construir a fixture com `scripts/responsive/build.cjs`.

Safari, Firefox e aparelhos físicos não foram executados. Reordenação mantém os sensores e callbacks originais; esta rodada não automatizou o gesto de arraste. Autenticação, realtime integrado, persistência e exportação em produção não foram exercitados pela fixture.

## Extensão às demais abas

Complementos e Opções receberam navegação de grupos compacta, seletor mobile, ações de renomear/excluir agrupadas em menu e opções com divisórias discretas em lugar de cards repetidos. Cadastro de grupos, tags, edição de nomes/preços, disponibilidade e reordenação mantêm os callbacks existentes.

Combos e Promoções receberam painéis de criação recolhíveis (abertos inicialmente quando não há registros), formulários com hierarquia simplificada, bordas moderadas e remoção do cabeçalho promocional redundante. Seleção de itens, quantidades, cálculos, datas e envio mantêm a implementação anterior.

Produtos teve aumento moderado: nomes e preços para 14 px, miniaturas para 48 px, busca e filtros para 44 px de altura, além de títulos e textos auxiliares maiores.

Validação adicional de todas as cinco abas em 320, 390, 768, 1024, 1440 e 1920 px, sem overflow da página nem erros de execução. Testados menus de grupos, seleção mobile e abertura/fechamento dos formulários. Capturas desktop/mobile revisadas. Teste: `scripts/responsive/catalog-modules-check.cjs`.
