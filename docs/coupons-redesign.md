# Cupons — redesign administrativo

Listagem em largura principal, cabeçalho sem card e uma ação “Novo cupom”. Busca por código/nome e filtro pelos estados reais: Ativo, Agendado, Expirado, Esgotado e Inativo. Classificação de apresentação baseada em `ativo`, datas e limite de usos, com data atual no fuso de São Paulo, conforme a validação existente do checkout. Nenhuma regra do backend foi alterada.

Criação em painel à direita com 540 px no desktop e largura total no celular. Cabeçalho e rodapé fixos, conteúdo com rolagem interna. Campos agrupados em Identificação, Configuração do desconto e Período de validade. Valores monetários aceitam formato brasileiro e são convertidos em números para a mesma ação de servidor. Limite vazio continua enviando `null`.

Menu contextual com detalhes e exclusão; não foi adicionada edição, pois não existe ação de edição no backend. Detalhes apresentam os campos completos. Exclusão exige confirmação e preserva a mensagem de erro em caso de falha. Estados de catálogo vazio, busca vazia, falha de carregamento e skeleton específico da rota.

Ajustada a regra compartilhada de overflow para os painéis de produto e cupom: somente o conteúdo interno deve rolar, evitando deslocar o cabeçalho quando o campo recebe foco.

## Validação

Fixture isolada com componentes reais e transporte fictício: 320, 360, 375, 390, 430, 768, 820, 1024, 1280, 1440 e 1920 px, sem overflow da página nem erros de execução. Busca, cinco filtros de status, detalhes, abertura/fechamento do painel, dimensões e criação verificadas. Valor `1.234,56` enviado como `1234.56`, mínimo `20,50` como `20.5` e limite vazio como `null`. Rodada final em 390 e 1440 px confirmou exclusão efetiva após confirmação e cancelamento sem chamada destrutiva.

Capturas mobile/desktop revisadas. ESLint dos componentes alterados aprovado. TypeScript global bloqueado apenas pelo erro preexistente em `src/app/api/auth/entrar/route.ts:78` (`deveCriarConta`). Teste reproduzível: `scripts/responsive/coupons-check.cjs`, após `scripts/responsive/build.cjs`.

Sem criação ou exclusão de cupons reais. Safari/Firefox, teclado virtual em aparelhos físicos e integração de checkout não foram executados nesta rodada.
