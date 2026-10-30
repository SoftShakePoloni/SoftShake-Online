# Promoções — experiência do consumidor

## Revisão após avaliação visual

A composição abaixo foi substituída por grade de ofertas consistente, sem banner separado: duas colunas em smartphones a partir de 360 px, uma coluna em telas menores e três no desktop. Artes completas com `object-contain`, dimensões de imagem (`sizes`) correspondentes à grade e qualidade 90. Preço e botão de compra alinhados na base, tipografia e contraste reforçados. Não há reconstrução ou aumento artificial da resolução original das imagens.

Nova rodada nas 11 larguras passou, incluindo compra, filtros, personalização e bloqueio de rolagem do fundo.

Cabeçalho compacto, descrição curta, busca de 44 px e filtros neutros. Destaque orientado ao produto, com imagem cadastrada, preço real e economia calculada pelas funções existentes. Exibido apenas para uma oferta com imagem e desconto/combo; sem urgência artificial. O produto destacado não se repete na lista e volta à listagem se a imagem do destaque falhar.

Ofertas em lista no celular e duas colunas em telas maiores: imagem controlada, nome, descrição curta, preço anterior quando aplicável, preço atual, um único indicador de benefício e ação compacta. Fallback para imagem indisponível. Datas aparecem apenas quando fornecidas pelo cadastro.

Carrinho, preços, disponibilidade e personalização mantêm os manipuladores existentes. A barra inferior conserva Início, Promoções, Pedidos e Perfil; removida a animação e o gradiente do contador de promoções, com item ativo semântico e área de toque consistente. A página reserva espaço inferior para não encobrir as últimas ofertas.

## Validação

Fixture do consumidor com componentes reais, dados fictícios e transporte isolado. Testados 320, 360, 375, 390, 430, 768, 820, 1024, 1280, 1440 e 1920 px: sem overflow da página ou erros de execução. Busca sem resultados, limpeza de filtros, categoria, adição com preço promocional, abertura do produto com opções, bloqueio de scroll do fundo, Escape, estados vazio/erro/carregamento. Capturas desktop/mobile revisadas.

ESLint dos componentes alterados aprovado. TypeScript global continua apontando o erro preexistente da API de login (`deveCriarConta`, `src/app/api/auth/entrar/route.ts:78`). Não foram executados Safari/Firefox, aparelhos físicos ou compras reais.

Teste: construir `scripts/responsive/build.cjs` com `CONSUMER_FIXTURE=1` e executar `scripts/responsive/offers-check.cjs`. As imagens geométricas da fixture são exclusivas do teste; os componentes em produção usam apenas as imagens cadastradas.
