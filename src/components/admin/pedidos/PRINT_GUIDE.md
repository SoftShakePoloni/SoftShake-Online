# 🖨️ Guia de Impressão de Pedidos

## Layout da Página Impressa

```
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║                         ┌───┐                              ║
║                         │ S │  Logo Circular               ║
║                         └───┘                              ║
║                       SoftShake                            ║
║                 Delivery de Milkshakes                     ║
║                                                            ║
║════════════════════════════════════════════════════════════║
║                                                            ║
║  Pedido #fdc01a46               Status: Preparando        ║
║  07/07/2026 às 14:18                                      ║
║                                                            ║
║────────────────────────────────────────────────────────────║
║                                                            ║
║  INFORMAÇÕES DO CLIENTE                                    ║
║  ┌──────────────────────────────────────────────────┐    ║
║  │ Nome: Matheus Terradas                            │    ║
║  │ Telefone: (11) 98765-4321                         │    ║
║  └──────────────────────────────────────────────────┘    ║
║                                                            ║
║  ENDEREÇO DE ENTREGA                                       ║
║  ┌──────────────────────────────────────────────────┐    ║
║  │ Rua das Flores, nº 123, Apt 45                    │    ║
║  │ Centro, São Paulo - SP                            │    ║
║  │ CEP: 01234-567                                    │    ║
║  └──────────────────────────────────────────────────┘    ║
║                                                            ║
║  ITENS DO PEDIDO                                           ║
║  ┌──────────────────────────────────────────────────┐    ║
║  │ Item             │ Qtd │ Preço Unit. │ Total      │    ║
║  ├──────────────────┼─────┼─────────────┼───────────┤    ║
║  │ Açaí            │  1  │  R$ 20,00   │ R$ 20,00  │    ║
║  │  + Choc. extra  │     │  +R$ 2,00   │           │    ║
║  │  + Granulado    │     │  +R$ 1,50   │           │    ║
║  │  Obs: Sem leite │     │             │           │    ║
║  └──────────────────┴─────┴─────────────┴───────────┘    ║
║                                                            ║
║  RESUMO FINANCEIRO                                         ║
║  ┌──────────────────────────────────────────────────┐    ║
║  │ Subtotal ............................. R$ 20,00   │    ║
║  │ Taxa de Entrega ......................  R$ 3,00   │    ║
║  │ ─────────────────────────────────────────────    │    ║
║  │ TOTAL ................................ R$ 23,00   │    ║
║  └──────────────────────────────────────────────────┘    ║
║                                                            ║
║  INFORMAÇÕES DE PAGAMENTO                                  ║
║  ┌──────────────────────────────────────────────────┐    ║
║  │ Forma de Pagamento: PIX                           │    ║
║  │ Tipo de Entrega: Delivery                         │    ║
║  └──────────────────────────────────────────────────┘    ║
║                                                            ║
║  OBSERVAÇÕES                                               ║
║  ┌──────────────────────────────────────────────────┐    ║
║  │ Deixar com o porteiro                             │    ║
║  └──────────────────────────────────────────────────┘    ║
║                                                            ║
║════════════════════════════════════════════════════════════║
║                                                            ║
║              Obrigado pela preferência!                    ║
║           SoftShake - Delivery de Milkshakes              ║
║         Impresso em: 07/07/2026 às 15:30                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

## Características do Layout

### 📐 Dimensões
- **Página**: A4 (210mm x 297mm)
- **Margens**: 2cm em todos os lados
- **Área útil**: 170mm x 257mm
- **Largura máxima**: 4xl (896px)

### 🎨 Estilos

**Cores:**
- Títulos: Cinza escuro (#111827)
- Texto: Cinza médio (#6B7280)
- Destaque: Roxo (#4C258C)
- Fundo: Branco puro
- Bordas: Cinza claro (#E5E7EB)

**Tipografia:**
- Fonte: Inter (sistema)
- Tamanhos:
  - Logo/Título: 3xl (30px)
  - Pedido #: 2xl (24px)
  - Seções: lg (18px)
  - Corpo: base (16px)
  - Detalhes: sm (14px) e xs (12px)

**Espaçamentos:**
- Entre seções: 24px (mb-6)
- Padding interno: 16px (p-4)
- Margens de página: 2cm

### 📋 Seções

1. **Header (Logo + Nome)**
   - Logo circular centralizada
   - Nome da empresa em destaque
   - Slogan/Descrição

2. **Identificação do Pedido**
   - Número do pedido
   - Data e hora
   - Status (badge)

3. **Cliente**
   - Nome completo
   - Telefone
   - Fundo cinza claro

4. **Endereço**
   - Endereço completo formatado
   - CEP, cidade, estado
   - Fundo cinza claro

5. **Itens**
   - Tabela formatada
   - Colunas: Item, Qtd, Preço Unit., Total
   - Adicionais identados
   - Observações em itálico

6. **Resumo Financeiro**
   - Subtotal
   - Taxa de entrega
   - **Total em destaque**
   - Fundo cinza claro

7. **Pagamento**
   - Forma de pagamento
   - Troco (se aplicável)
   - Tipo de entrega
   - Fundo cinza claro

8. **Observações**
   - Observações gerais do pedido
   - Fundo cinza claro
   - Condicional (só aparece se existir)

9. **Rodapé**
   - Mensagem de agradecimento
   - Nome da empresa
   - Data e hora da impressão

## 🖨️ Como Imprimir

### Pelo Navegador

1. Clique no botão "Imprimir" no canto superior direito
2. Na janela de impressão:
   - Selecione a impressora
   - Configure margens: 2cm
   - Orientação: Retrato
   - Tamanho: A4
3. Clique em "Imprimir"

### Salvar como PDF

1. Clique no botão "Imprimir"
2. Selecione "Salvar como PDF" ou "Microsoft Print to PDF"
3. Escolha o local para salvar
4. Clique em "Salvar"

### Atalhos de Teclado

- **Windows**: `Ctrl + P`
- **Mac**: `Cmd + P`

## ⚙️ Configurações Recomendadas

### Impressora Térmica (80mm)
```
Largura: 80mm
Sem margens
Fonte: Sans-serif 12pt
Densidade: Alta
```

### Impressora Laser/Jato
```
Papel: A4
Margens: 2cm
Qualidade: Normal
Modo: Preto e branco
Economizar toner: Sim
```

## 🎯 Casos de Uso

### Para a Cozinha
- ✅ Imprimir em papel comum
- ✅ Cole na área de preparo
- ✅ Risque itens prontos
- ✅ Descarte após conclusão

### Para Entrega
- ✅ Imprimir 2 vias
- ✅ 1 via com o entregador
- ✅ 1 via para o cliente
- ✅ Cliente assina recebimento

### Para Arquivo
- ✅ Salvar como PDF
- ✅ Nomear: `pedido-{id}-{data}.pdf`
- ✅ Organizar por data
- ✅ Backup em nuvem

## 🔧 Troubleshooting

### Impressão cortada
**Problema**: Conteúdo cortado nas bordas  
**Solução**: Aumentar margens para 2.5cm

### Fonte muito pequena
**Problema**: Texto ilegível  
**Solução**: Aumentar zoom para 110-120%

### Cores não imprimem
**Problema**: Badges e destaques em preto  
**Solução**: Ativar impressão em cores

### Página em branco
**Problema**: Nada imprime  
**Solução**: Verificar se JavaScript está ativado

### Layout quebrado
**Problema**: Elementos desalinhados  
**Solução**: Atualizar navegador ou usar Chrome/Edge

## 📊 Estatísticas

Economia estimada:
- **1 página** por pedido
- **~100 pedidos/mês** = 100 páginas
- **Modo econômico**: 50% economia de tinta
- **Custo estimado**: R$ 0,10/página

## 🌟 Melhorias Futuras

- [ ] QR Code para rastreamento
- [ ] Código de barras do pedido
- [ ] Logo customizável
- [ ] Templates de impressão
- [ ] Impressão em lote
- [ ] Integração com impressora térmica
- [ ] Envio automático para impressora
- [ ] Histórico de impressões

---

**Desenvolvido para SoftShake Online** 🚀
