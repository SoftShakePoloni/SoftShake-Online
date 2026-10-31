"use client";

import { useMenu } from "@/hooks/useCardapio";

import { ShoppingBag, Trash2, X, Clock, ChevronRight, User, Phone, MapPin, CreditCard, Banknote, Home, Truck } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { StorageImage as Image } from "@/components/ui/storage-image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useCarrinho, resumoOpcoes } from "@/context/CarrinhoContext";
import { resolveSelectionsFromProduct } from "@/lib/utils/pedido";
import { useLoja } from "@/hooks/useLoja";
import { formatBRL, getProductUnitPrice } from "@/data/tipos";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { customerAddresses } from "@/lib/enderecos-cliente";
import type { Endereco } from "@/types/endereco";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ModalSacola({ open, onOpenChange }: Props) {
  const { itens, removerItem, limpar, subtotal, cupomAplicado, setCupomAplicado } = useCarrinho();
  const { loja, isLoading: lojaLoading, error: lojaError, refresh: refreshLoja } = useLoja();
  const { cliente, session, loading } = useAuth();
  const [step, setStep] = useState<'cart' | 'info' | 'payment'>('cart');
  const router = useRouter();
  
  // Dados do formulário
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [enderecoSelecionado, setEnderecoSelecionado] = useState<string>("");
  const [enderecosDisponiveis, setEnderecosDisponiveis] = useState<Endereco[]>([]);
  const [tipoEntrega, setTipoEntrega] = useState<'entrega' | 'retirada'>('entrega');
  const [meioPagamento, setMeioPagamento] = useState<'dinheiro' | 'pix' | 'cartao'>('dinheiro');
  const [trocoPara, setTrocoPara] = useState("");
  const [enviandoPedido, setEnviandoPedido] = useState(false);
  const [codigoCupom, setCodigoCupom] = useState("");
  const cupomRequest = useRef(0);
  const resumeChecked = useRef(false);
  const [validandoCupom, setValidandoCupom] = useState(false);
  const [erroCupom, setErroCupom] = useState("");

  const { categories: currentCategories, isLoading: menuLoading } = useMenu();
  const temFreteGratis = itens.some(item => menuLoading ? item.produto.freteGratis : currentCategories.some(category => category.products.some(product => product.id === item.produto.id && product.disponivel !== false && product.freteGratis)));
  const frete = tipoEntrega === 'entrega' && !temFreteGratis ? (loja?.taxa_entrega ?? 3) : 0;
  const descontoCupom = cupomAplicado?.desconto ?? 0;
  const total = Math.max(0, subtotal - descontoCupom) + frete;

  useEffect(() => {
    const code = cupomAplicado?.codigo;
    if (!code || !open) { setValidandoCupom(false); return; }
    const request = ++cupomRequest.current;
    setValidandoCupom(true);
    setErroCupom("");
    let active = true;
    void fetch("/api/cupons/validar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo: code, subtotal }),
    }).then(async (resposta) => {
      const dados = await resposta.json();
      if (!active || request !== cupomRequest.current) return;
      if (!resposta.ok) {
        setCupomAplicado(null);
        setCodigoCupom("");
        setErroCupom(dados.erro || "O cupom não se aplica mais ao valor da sacola.");
        return;
      }
      setCupomAplicado(dados.cupom);
    }).catch(() => {
      if (active && request === cupomRequest.current) {
        setErroCupom("Não foi possível atualizar o desconto. Tente aplicar o cupom novamente.");
        setCupomAplicado(null);
      }
    }).finally(() => { if (active && request === cupomRequest.current) setValidandoCupom(false); });
    return () => { active = false; };
  }, [subtotal, cupomAplicado?.codigo, open, setCupomAplicado]);

  const aplicarCupom = async () => {
    const request = ++cupomRequest.current;
    setValidandoCupom(true);
    setErroCupom("");
    try {
      const resposta = await fetch("/api/cupons/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: codigoCupom, subtotal }),
      });
      const dados = await resposta.json();
      if (request !== cupomRequest.current) return;
      if (!resposta.ok) throw new Error(dados.erro || "Não foi possível validar o cupom.");
      setCupomAplicado(dados.cupom);
      setCodigoCupom(dados.cupom.codigo);
    } catch (error) {
      if (request !== cupomRequest.current) return;
      setCupomAplicado(null);
      setErroCupom(error instanceof Error ? error.message : "Cupom inválido.");
    } finally {
      if (request === cupomRequest.current) setValidandoCupom(false);
    }
  };

  const removerCupom = () => {
    cupomRequest.current++;
    setValidandoCupom(false);
    setCupomAplicado(null);
    setCodigoCupom("");
    setErroCupom("");
  };

  // Carrega dados do cliente quando muda para step info
  useEffect(() => {
    if (!open || step !== 'info') return;
    let cancelled = false;
    
    const loadClientData = async () => {
      // Aguarda o carregamento da sessão terminar
      if (loading) return;
      
      // Se não há sessão, não é um erro - apenas retorna
      if (!session || !session.user) return;

      try {
        // Usa dados do contexto (já vem da API de sessão)
        setNome(cliente?.nome || "");
        setTelefone(cliente?.telefone || "");

        // Busca endereços adicionais do banco
        const resposta = await fetch('/api/auth/sessao', { cache: 'no-store' });
        
        if (resposta.ok) {
          const dados = await resposta.json();
          if (cancelled) return;
          
          const enderecos = customerAddresses(dados.cliente || {});

          setEnderecosDisponiveis(enderecos);
          
          setEnderecoSelecionado(current => enderecos.some(address => address.id === current) ? current : (enderecos.find(address => address.principal)?.id || enderecos[0]?.id || ''));
        }
      } catch (error) {
        // Usa dados do contexto como fallback
        setNome(cliente?.nome || "");
        setTelefone(cliente?.telefone || "");
      }
    };

    void loadClientData();
    return () => { cancelled = true; };
  }, [open, step, loading, session, cliente]);

  // Reset step quando fechar modal
  useEffect(() => {
    if (!open) {
      setStep('cart');
      setEnderecosDisponiveis([]);
      setEnderecoSelecionado("");
      setTipoEntrega('entrega');
      setMeioPagamento('dinheiro');
      setTrocoPara("");
    }
  }, [open]);

  // Reabre modal após login se necessário
  useEffect(() => {
    if (!loading && !lojaLoading && loja && !lojaError && session && !open) {
      const shouldReopen = sessionStorage.getItem('reopenCart');
      const savedStep = sessionStorage.getItem('cartStep');
      
      if (shouldReopen === 'true') {
        if (!resumeChecked.current) { resumeChecked.current = true; void refreshLoja(); return; }
        sessionStorage.removeItem('reopenCart');
        sessionStorage.removeItem('cartStep');
        
        // Pequeno delay para garantir que o contexto está pronto
        setTimeout(() => {
          onOpenChange(true);
          if (savedStep === 'info') {
            setStep('info');
          }
        }, 100);
      }
    }
  }, [loading, lojaLoading, loja, lojaError, session, open, onOpenChange, refreshLoja]);

  const handleVoltar = () => {
    if (step === 'payment') {
      setStep('info');
    } else if (step === 'info') {
      setStep('cart');
    }
  };

  const handleConfirmarInfo = () => {
    if (lojaLoading || !loja || lojaError) {
      toast.info(lojaLoading ? "Aguarde, verificando o funcionamento da loja…" : "Não foi possível verificar a loja. Tente novamente.");
      if (!lojaLoading) void refreshLoja();
      return;
    }

    if (!lojaAberta) {
      toast.error('Loja fechada', {
        description: 'No momento não estamos aceitando pedidos.',
      });
      return;
    }

    // Se ainda está carregando, não faz nada
    if (loading) {
      toast.info('Aguarde, carregando suas informações...');
      return;
    }
    
    // Se não está logado, avança para tela de info de qualquer forma
    // A tela já tem o tratamento para mostrar opções de login
    setStep('info');
  };

  const handleAvancarParaPagamento = () => {
    // Valida se preencheu os campos obrigatórios
    if (!nome || !telefone) {
      toast.error('Preencha nome e telefone');
      return;
    }
    
    if (tipoEntrega === 'entrega' && !enderecoSelecionado) {
      toast.error('Selecione um endereço de entrega');
      return;
    }
    
    setStep('payment');
  };

  const adicionarEndereco = () => {
    sessionStorage.setItem('reopenCart', 'true');
    sessionStorage.setItem('cartStep', 'info');
    window.location.href = '/perfil/enderecos/novo';
  };

  const lojaConfirmada = !lojaLoading && !!loja && !lojaError;
  const lojaAberta = lojaConfirmada && Boolean(loja?.esta_aberto);

  const handleFinalizarPedido = async () => {
    if (lojaLoading || !loja || lojaError) {
      toast.info(lojaLoading ? "Aguarde, verificando o funcionamento da loja…" : "Não foi possível verificar a loja. Tente novamente.");
      if (!lojaLoading) void refreshLoja();
      return;
    }

    if (!lojaAberta) {
      toast.error("Loja fechada", {
        description: "No momento não estamos aceitando pedidos.",
      });
      return;
    }

    setEnviandoPedido(true);
    
    try {
      const enderecoAtual = enderecosDisponiveis.find(e => e.id === enderecoSelecionado);
      
      const pedidoData = {
        cliente_nome: nome,
        cliente_telefone: telefone,
        tipo_entrega: tipoEntrega,
        endereco_id: tipoEntrega === 'entrega' ? enderecoSelecionado : null,
        endereco_completo: tipoEntrega === 'entrega' ? enderecoAtual : null,
        meio_pagamento: meioPagamento,
        troco_para: meioPagamento === 'dinheiro' ? trocoPara : null,
        subtotal,
        taxa_entrega: frete,
        total,
        cupom_codigo: cupomAplicado?.codigo ?? null,
        itens: itens.map(item => {
          const adicionais = resolveSelectionsFromProduct(
            item.produto,
            item.selections
          );
          return {
            uid: item.uid,
            produto: {
              id: item.produto.id,
              comboId: item.produto.comboId,
              name: item.produto.name,
              // Preço unitário cobrado (promo se ativa)
              price: getProductUnitPrice(item.produto),
              image: item.produto.image,
            },
            qty: item.qty,
            selections: item.selections,
            adicionais,
            observacoes: item.observacoes,
            total: item.total,
          };
        }),
      };
      
      const resposta = await fetch('/api/pedidos/criar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pedidoData),
      });
      
      if (!resposta.ok) {
        const erro = await resposta.json();
        toast.error(erro.erro || 'Erro ao criar pedido');
        return;
      }
      
      const { pedido } = await resposta.json();
      
      toast.success('Pedido realizado com sucesso!', {
        description: `Pedido #${pedido.id.slice(0, 8)} · Total confirmado: ${formatBRL(Number(pedido.total))}`,
      });
      
      limpar();
      removerCupom();
      onOpenChange(false);
      
      // Redireciona para pedidos após 1s
      setTimeout(() => {
        router.push('/pedidos');
      }, 1000);
      
    } catch (error) {
      toast.error('Erro ao processar pedido');
    } finally {
      setEnviandoPedido(false);
    }
  };

  const enderecoAtual = enderecosDisponiveis.find(e => e.id === enderecoSelecionado);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent overlayClassName="z-[80] max-md:bottom-0" className="z-[90] flex h-dvh max-h-dvh w-full max-w-md flex-col gap-0 overflow-hidden border-0 p-0 top-0 translate-y-0 rounded-none md:top-[50%] md:translate-y-[-50%] md:h-[92dvh] md:max-h-[92dvh] md:rounded-2xl">
        <DialogTitle className="sr-only">Sacola</DialogTitle>

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between bg-card px-5 pb-4 pt-10 shadow-sm sm:pt-8">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              {step === 'cart' && 'Sua sacola'}
              {step === 'info' && 'Confirme seus dados'}
              {step === 'payment' && 'Pagamento e entrega'}
            </h2>
          </div>
          <div className="flex items-center gap-3 pr-8">
            {itens.length > 0 && step === 'cart' && (
              <button
                onClick={() => { limpar(); removerCupom(); }}
                className="text-xs font-semibold uppercase tracking-wide text-destructive hover:opacity-75"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Tempo de entrega */}
        {loja && (loja.tempo_entrega_min || loja.tempo_entrega_max) && (
          <div className="shrink-0 border-b border-border bg-muted/40 px-5 py-3">
            <button className="flex w-full items-center justify-between text-sm text-muted-foreground hover:text-foreground">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>
                  Entrega em <span className="font-semibold text-foreground">{loja.tempo_entrega_min}–{loja.tempo_entrega_max} min</span>
                </span>
              </span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-background">
          {step === 'cart' ? (
            // TELA 1: Carrinho
            <>
              {itens.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                  <div className="rounded-full bg-muted p-6">
                    <ShoppingBag className="h-12 w-12" strokeWidth={1.25} />
                  </div>
                  <p className="mt-4 font-medium">Sua sacola está vazia</p>
                  <p className="mt-1 text-xs">Adicione produtos para continuar</p>
                  <button
                    onClick={() => onOpenChange(false)}
                    className="mt-6 rounded-xl border border-primary px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5"
                  >
                    Ver cardápio
                  </button>
                </div>
              ) : (
                <>
                  {/* Lista de itens */}
                  <ul className="divide-y divide-border">
                    {itens.map((item) => {
                      const resumo = resumoOpcoes(item.produto, item.selections);
                      return (
                        <li key={item.uid} className="flex gap-3 bg-card px-5 py-4">
                          {item.produto.image ? (
                            <Image preset="thumbnail"
                              src={item.produto.image}
                              alt={item.produto.name}
                              width={64}
                              height={64}
                              className="h-16 w-16 shrink-0 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-muted">
                              <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm font-bold text-foreground">
                                {item.qty}x {item.produto.name}
                              </span>
                              <span className="shrink-0 text-sm font-bold text-foreground">
                                {formatBRL(item.total)}
                              </span>
                            </div>
                            {resumo && (
                              <p className="truncate text-xs text-muted-foreground">{resumo}</p>
                            )}
                            {item.produto.comboItems?.length ? (
                              <p className="text-xs text-muted-foreground">
                                Inclui {item.produto.comboItems.map((part) => `${part.quantity}× ${part.name}`).join(" · ")}
                              </p>
                            ) : null}
                            {item.observacoes && (
                              <p className="text-xs text-muted-foreground">
                                OBS: {item.observacoes}
                              </p>
                            )}
                            <button
                              onClick={() => removerItem(item.uid)}
                              className="mt-1.5 flex w-fit items-center gap-1 text-xs font-semibold text-destructive hover:opacity-75"
                            >
                              <Trash2 className="h-3 w-3" />
                              Remover
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {/* Adicionar mais */}
                  <div className="mx-5 mb-3 rounded-xl border border-border bg-card p-3.5">
                    <Label htmlFor="cupom-pedido" className="text-xs font-semibold">Cupom de desconto</Label>
                    {cupomAplicado ? (
                      <div role="status" className="mt-2 flex items-center justify-between gap-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                        <span className="min-w-0 truncate"><strong>{cupomAplicado.codigo}</strong> aplicado · você economizou {formatBRL(descontoCupom)}</span>
                        <button type="button" onClick={removerCupom} className="shrink-0 text-xs font-semibold underline">Remover</button>
                      </div>
                    ) : (
                      <div className="mt-2 flex gap-2">
                        <Input
                          id="cupom-pedido"
                          value={codigoCupom}
                          onChange={(event) => { cupomRequest.current++; setValidandoCupom(false); setCodigoCupom(event.target.value.toUpperCase()); setErroCupom(""); }}
                          placeholder="Digite seu código…"
                          autoCapitalize="characters"
                          spellCheck={false}
                          autoComplete="off"
                          name="cupom"
                          className="h-10 min-w-0 uppercase"
                        />
                        <button
                          type="button"
                          onClick={() => void aplicarCupom()}
                          disabled={validandoCupom || codigoCupom.trim().length < 3}
                          className="h-10 shrink-0 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                        >
                          {validandoCupom ? "Verificando" : "Aplicar"}
                        </button>
                      </div>
                    )}
                    {erroCupom && <p role="alert" className="mt-2 text-xs text-destructive">{erroCupom}</p>}
                  </div>

                  {/* Adicionar mais */}
                  <div className="px-5 py-3">
                    <button
                      onClick={() => onOpenChange(false)}
                      className="w-full rounded-xl border border-primary py-2.5 text-sm font-semibold text-primary hover:bg-primary/5"
                    >
                      + Adicionar mais itens
                    </button>
                  </div>
                </>
              )}
            </>
          ) : step === 'info' ? (
            // TELA 2: Informações do Cliente
            <>
              {loading ? (
                // Indicador de carregamento
                <div className="flex flex-col items-center justify-center py-24">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
                </div>
              ) : !session || !session.user ? (
                // Mensagem quando não há sessão
                <div className="flex flex-col items-center justify-center py-24 px-5 text-center">
                  <div className="rounded-full bg-muted p-6">
                    <User className="h-12 w-12 text-muted-foreground" strokeWidth={1.25} />
                  </div>
                  <p className="mt-4 font-medium text-foreground">Você precisa estar logado</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Para finalizar seu pedido, faça login ou crie uma conta
                  </p>
                  <p className="mt-2 text-xs text-primary font-medium">
                    Seu carrinho não será perdido
                  </p>
                  <button
                    onClick={() => {
                      sessionStorage.setItem('reopenCart', 'true');
                      sessionStorage.setItem('cartStep', 'info');
                      onOpenChange(false);
                      router.push('/entrar');
                    }}
                    className="mt-6 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                  >
                    Fazer login
                  </button>
                  <button
                    onClick={() => {
                      sessionStorage.setItem('reopenCart', 'true');
                      sessionStorage.setItem('cartStep', 'info');
                      onOpenChange(false);
                      router.push('/cadastrar');
                    }}
                    className="mt-3 rounded-xl border border-primary px-6 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5"
                  >
                    Criar conta
                  </button>
                </div>
              ) : (
                // Formulário de informações do cliente
                <div className="p-5 py-6 space-y-5">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Nome completo
                      </Label>
                      <Input
                        id="nome"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Seu nome"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Telefone
                      </Label>
                      <Input
                        id="telefone"
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                        placeholder="(00) 00000-0000"
                      />
                    </div>

                    {/* Tipo de Entrega */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Tipo de Entrega
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setTipoEntrega('entrega')}
                          className={`p-3 rounded-lg border-2 transition text-sm font-medium ${
                            tipoEntrega === 'entrega'
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <Truck className="h-5 w-5 mx-auto mb-1" />
                          Entrega
                        </button>
                        <button
                          type="button"
                          onClick={() => setTipoEntrega('retirada')}
                          className={`p-3 rounded-lg border-2 transition text-sm font-medium ${
                            tipoEntrega === 'retirada'
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <Home className="h-5 w-5 mx-auto mb-1" />
                          Retirada
                        </button>
                      </div>
                    </div>

                    {/* Endereço (apenas se entrega) */}
                    {tipoEntrega === 'entrega' && (
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Endereço de entrega
                        </Label>
                        
                        {enderecosDisponiveis.length > 0 ? (
                          <div className="space-y-2">
                            {enderecosDisponiveis.map((endereco) => (
                              <button
                                key={endereco.id}
                                type="button"
                                onClick={() => setEnderecoSelecionado(endereco.id)}
                                className={`w-full text-left p-3 rounded-lg border-2 transition ${
                                  enderecoSelecionado === endereco.id
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/50'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <p className="font-semibold text-sm">{endereco.apelido}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {endereco.logradouro}, {endereco.numero}
                                      {endereco.complemento && ` - ${endereco.complemento}`}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {endereco.bairro} - {endereco.cidade}/{endereco.estado}
                                    </p>
                                  </div>
                                  {endereco.principal && (
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                      Principal
                                    </span>
                                  )}
                                </div>
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={adicionarEndereco}
                              className="w-full text-center p-3 rounded-lg border-2 border-dashed border-border hover:border-primary text-sm text-muted-foreground hover:text-primary transition"
                            >
                              + Adicionar novo endereço
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={adicionarEndereco}
                            className="w-full text-center p-4 rounded-lg border-2 border-dashed border-primary text-sm text-primary hover:bg-primary/5 transition"
                          >
                            + Adicionar endereço
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            // TELA 3: Pagamento
            <div className="p-5 py-6 space-y-5">
              {cupomAplicado && <section aria-label="Cupom aplicado" className="border-b border-border pb-4">
                <p className="text-sm font-semibold text-primary">Cupom {cupomAplicado.codigo}</p>
                <p className="mt-1 text-sm text-muted-foreground">Você economizou {formatBRL(descontoCupom)}</p>
                <div className="mt-2 flex gap-4">
                  <button type="button" onClick={() => setStep('cart')} className="min-h-11 text-sm font-medium text-primary underline">Alterar cupom</button>
                  <button type="button" onClick={removerCupom} className="min-h-11 text-sm text-muted-foreground underline">Remover</button>
                </div>
              </section>}
              {erroCupom && <p role="alert" className="text-sm text-destructive">{erroCupom}</p>}
              <div className="space-y-4">
                {/* Meio de Pagamento */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Meio de Pagamento
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setMeioPagamento('dinheiro')}
                      className={`p-3 rounded-lg border-2 transition text-xs font-medium ${
                        meioPagamento === 'dinheiro'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Banknote className="h-5 w-5 mx-auto mb-1" />
                      Dinheiro
                    </button>
                    <button
                      type="button"
                      onClick={() => setMeioPagamento('pix')}
                      className={`p-3 rounded-lg border-2 transition text-xs font-medium ${
                        meioPagamento === 'pix'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <CreditCard className="h-5 w-5 mx-auto mb-1" />
                      PIX
                    </button>
                    <button
                      type="button"
                      onClick={() => setMeioPagamento('cartao')}
                      className={`p-3 rounded-lg border-2 transition text-xs font-medium ${
                        meioPagamento === 'cartao'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <CreditCard className="h-5 w-5 mx-auto mb-1" />
                      Cartão
                    </button>
                  </div>
                </div>

                {/* Troco (se pagamento for dinheiro) */}
                {meioPagamento === 'dinheiro' && (
                  <div className="space-y-2">
                    <Label htmlFor="troco">Troco para quanto? (opcional)</Label>
                    <Input
                      id="troco"
                      type="text"
                      placeholder="Ex: R$ 50,00"
                      value={trocoPara}
                      onChange={(e) => setTrocoPara(e.target.value)}
                    />
                  </div>
                )}

                {/* Resumo do Pedido */}
                <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-2">
                  <h3 className="font-semibold text-sm mb-3">Resumo do Pedido</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cliente:</span>
                      <span className="font-medium">{nome}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Telefone:</span>
                      <span className="font-medium">{telefone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo:</span>
                      <span className="font-medium capitalize">{tipoEntrega}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pagamento:</span>
                      <span className="font-medium capitalize">{meioPagamento}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer resumo + botões */}
        {itens.length > 0 && (
          <div className="shrink-0 border-t border-border bg-card px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatBRL(subtotal)}</span>
            </div>
            {cupomAplicado && (
              <div className="flex justify-between text-sm text-emerald-700">
                <span>Desconto ({cupomAplicado.codigo})</span>
                <span className="font-medium">− {formatBRL(descontoCupom)}</span>
              </div>
            )}
            {tipoEntrega === 'entrega' && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{temFreteGratis ? 'Frete grátis na sua sacola!' : 'Taxa de entrega'}</span>
                <span className={`font-medium ${temFreteGratis ? 'text-emerald-700' : ''}`}>{temFreteGratis ? 'GRÁTIS' : formatBRL(frete)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
              <span>Total</span>
              <span className="text-primary">{formatBRL(total)}</span>
            </div>
            
            {!lojaConfirmada && <div role="status" className="rounded-lg border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">{lojaLoading ? "Verificando o funcionamento da loja…" : <>Não foi possível consultar a loja. <button type="button" onClick={() => void refreshLoja()} className="min-h-9 font-medium text-primary underline">Tentar novamente</button></>}</div>}
            {lojaConfirmada && !lojaAberta && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                A loja está fechada e não está aceitando pedidos no momento.
              </div>
            )}

            {step === 'cart' ? (
              <button 
                onClick={handleConfirmarInfo}
                disabled={loading || validandoCupom || !lojaAberta}
                className="mt-1 w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md transition hover:opacity-95 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? 'Carregando...'
                  : !lojaConfirmada ? 'Verificando loja…' : !lojaAberta
                    ? 'Loja fechada'
                    : 'Confirmar informações'}
              </button>
            ) : step === 'info' ? (
              <div className="space-y-2 mt-2">
                <button 
                  onClick={handleAvancarParaPagamento}
                  disabled={!lojaAberta || !nome || !telefone || (tipoEntrega === 'entrega' && !enderecoSelecionado)}
                  className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md transition hover:opacity-95 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Avançar para pagamento
                </button>
                <button 
                  onClick={handleVoltar}
                  className="w-full rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
                >
                  Voltar para sacola
                </button>
              </div>
            ) : (
              <div className="space-y-2 mt-2">
                <button 
                  onClick={handleFinalizarPedido}
                  disabled={enviandoPedido || validandoCupom || !lojaAberta}
                  className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md transition hover:opacity-95 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {enviandoPedido
                    ? 'Enviando pedido...'
                    : !lojaConfirmada ? 'Verificando loja…' : !lojaAberta
                      ? 'Loja fechada'
                      : 'Finalizar pedido'}
                </button>
                <button 
                  onClick={handleVoltar}
                  disabled={enviandoPedido}
                  className="w-full rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50"
                >
                  Voltar
                </button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
