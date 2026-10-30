// @ts-nocheck -- isolated browser fixture; never imported by the application.
import React from 'react';
import {createRoot} from 'react-dom/client';
import {AdminShell} from '@/components/admin/premium/AdminShell';
import {DashboardView} from '@/components/admin/dashboard/DashboardView';
import {PedidosManager} from '@/components/admin/pedidos/PedidosManager';
import {CatalogoManager} from '@/components/admin/catalogo/CatalogoManager';
import {ClientesManager} from '@/components/admin/clientes/ClientesManager';
import {CuponsManager} from '@/components/admin/cupons/CuponsManager';
import {RelatoriosManager} from '@/components/admin/relatorios/RelatoriosManager';
import {EstabelecimentoManager} from '@/components/admin/estabelecimento/EstabelecimentoManager';
import {SistemaConfigManager} from '@/components/admin/sistema/SistemaConfigManager';
import {DEFAULT_PREFERENCIAS_ESTABELECIMENTO} from '@/types/estabelecimento-settings';
import {normalizeConfiguracao} from '@/types/configuracoes';
import {ALL_ADMIN_PAGES} from '@/lib/security/rbac';
import AdminLoginPage from '@/app/admin/login/page';
import CustomerLoginPage from '@/app/entrar/page';
import CustomerRegisterPage from '@/app/cadastrar/page';
import {Toaster} from 'sonner';

const query=new URLSearchParams(location.search), empty=query.has('empty'), error=query.has('error');
const long='Maria Aparecida de Albuquerque e Vasconcelos';
const today=new Date().toISOString();
const products=Array.from({length:60},(_,i)=>({id:i+1,nome:`Açaí especial com morango e complementos ${i+1}`,descricao:'Descrição detalhada '.repeat(15),preco_base:1234.56,categoria_id:1,esta_disponivel:true,created_at:today,updated_at:today,imagem_url:query.has('broken')&&i===0?'https://broken.test/product.png':null}));
const categories=Array.from({length:12},(_,i)=>({id:i+1,nome:`Categoria de produtos artesanais ${i+1}`,ordem:i}));
const orders=Array.from({length:24},(_,i)=>({id:String(1000+i),cliente_nome:long,cliente_telefone:'11999999999',status:['pendente','preparando','saiu_entrega','entregue'][i%4],tipo_entrega:'delivery',subtotal:1234.56,total:1239.56,taxa_entrega:5,meio_pagamento:'pix',created_at:today,updated_at:today,endereco_completo:'Rua das Palmeiras, 123, Apartamento 456, Bairro de nome extenso, São Paulo',observacoes:'Observações do pedido '.repeat(20),itens:Array.from({length:15},(_,n)=>({id:n,uid:String(n),qty:2,produto:{id:n,name:products[n].nome,price:12.5},total:25,opcoes:[],observacoes:'Sem açúcar, embalagem separada'}))}));
const customers=Array.from({length:60},(_,i)=>({id:String(i),nome:`${long} ${i}`,email:'cliente-com-endereco-de-email-extenso@example.com',telefone:'11999999999',created_at:today,total_pedidos:123,total_gasto:123456.78,ticket_medio:1234.56,status_cliente:'vip',enderecos_adicionais:[]}));
const store=normalizeConfiguracao({id:1,nome:'SoftShake',descricao:'Loja de açaí e milkshakes',esta_aberto:true});
const dashboard={storeName:'SoftShake',period:'hoje',generatedAt:today,kpis:{pedidos:1234,pedidosChange:12,faturamento:123456.78,faturamentoChange:12,ticketMedio:123.45,ticketMedioChange:8,emAberto:8},salesByDay:Array.from({length:12},(_,i)=>({label:`${i+1}h`,receita:200+i*100,pedidos:3+i})),hourly:Array.from({length:12},(_,i)=>({hora:`${i+1}h`,pedidos:i+1})),payments:[{name:'Cartão de crédito',value:300,percentage:50},{name:'Pix',value:300,percentage:50}],topProducts:products.slice(0,5).map(p=>({nome:p.nome,quantidade:120,receita:12345})),recentOrders:orders.map(o=>({id:o.id,cliente:o.cliente_nome,pagamento:o.meio_pagamento,status:o.status,createdAt:today,valor:o.total}))};
const series=Array.from({length:30},(_,i)=>({date:`2026-10-${String(i+1).padStart(2,'0')}`,label:`${i+1}/10`,faturamento:1000+i*100,faturamentoAnterior:800,pedidos:i+1}));
const report={range:{from:today,to:today,label:'Últimos 30 dias'},prevRange:{from:today,to:today},kpis:Array.from({length:8},(_,i)=>({key:String(i),label:'Indicador de desempenho',value:'R$ 123.456,78',variant:'purple',icon:'DollarSign'})),faturamentoDiario:series,pedidosDiarios:series,pagamentos:[{name:'Pix',value:12345}],status:[{name:'Entregue',value:24}],produtos:products.map(p=>({nome:p.nome,quantidade:100,faturamento:1000,participacao:10})),sabores:[],tamanhos:[],adicionais:[],clientes:customers.map(c=>({nome:c.nome,telefone:c.telefone,pedidos:12,totalGasto:1234,ticketMedio:120,ultimaCompra:today})),porHora:dashboard.hourly,porDiaSemana:[],receitaMensal:[],comparativos:[],entregaVsRetirada:[{name:'Delivery',value:24}],tempoMedioMinutos:30,totalPedidosPeriodo:24,cidades:['São Paulo'],bairros:['Centro'],meiosPagamento:['pix'],produtosDisponiveis:products.map(p=>p.nome),financeiro:{faturamentoBruto:12345,descontos:20,taxaEntrega:50,totalLiquido:12375,pagamentoMaisUsado:'Pix'},pedidosLista:[],destaques:{maiorVenda:100,menorVenda:10,horarioPico:'18h',diaMaisPedidos:'Sexta',produtoCampeao:products[0].nome,clienteTop:long},empresa:{nome:'SoftShake'},observacoes:null};
window.__tables={configuracoes_loja:[store],produtos:products,categorias:categories,pedidos:orders,grupos_opcoes:[{id:1,nome:'Complementos e acompanhamentos especiais',min_selecoes:0,max_selecoes:5,obrigatorio:false}],opcoes:Array.from({length:20},(_,i)=>({id:i+1,grupo_id:1,nome:`Complemento com nome extenso ${i+1}`,preco_adicional:2.5,esta_disponivel:true,ordem:i})),tags:[]};
window.__fixtureAction=async(name,args)=>{
 if(name.startsWith('update')||name.startsWith('create')||name.startsWith('delete')||name.startsWith('set')||name.startsWith('reorder')||name.startsWith('reiniciar')) {
   window.__mutations=(window.__mutations||[]).concat({name,args});
   if(name==='createCombo')return {id:999,ativa:true,...args[0],itens:args[0].itens.map(item=>({...item,nome:products.find(p=>p.id===item.produto_id).nome,preco_base:1234.56}))};
   if(name==='createCupom')return {id:999,usos:0,ativo:true,...args[0]};
   if(name==='updatePedidoStatus')return {...orders.find(o=>o.id===args[0]),status:args[1]};
   return {};
 }
 if(query.has('loading')) await new Promise(resolve=>setTimeout(resolve,5000));
 if(name==='getDashboardData'){if(error)throw Error('Falha simulada no dashboard');return dashboard;}
 if(name==='getRelatorios'){
  window.__reportCalls=(window.__reportCalls||[]).concat(args[0]);
  if(error)throw Error('Falha simulada ao carregar relatório');
  const filters=args[0],result=structuredClone(report);
  result.kpis=[{key:'faturamento',label:'Faturamento',value:'R$ 12.345,67',trend:100,comparisonBase:0},{key:'pedidos',label:'Pedidos',value:'24',trend:20,comparisonBase:20},{key:'ticket',label:'Ticket médio',value:'R$ 514,40',trend:-5,comparisonBase:540},{key:'clientes',label:'Clientes',value:'20',trend:null,comparisonBase:0}];
  if(filters.preset==='custom'){result.range={from:filters.from+'T03:00:00.000Z',to:filters.to+'T23:59:59.000-03:00',label:filters.from+' a '+filters.to};}
  if(empty){result.kpis=result.kpis.map(k=>({...k,value:k.key==='faturamento'||k.key==='ticket'?'R$ 0,00':'0',trend:null}));for(const key of ['faturamentoDiario','pagamentos','produtos','clientes','porHora','status','entregaVsRetirada'])result[key]=[];}
  if(query.has('low'))result.faturamentoDiario=[{date:'2026-10-01',label:'01/10',faturamento:19.9,pedidos:1}];
  return result;
 }

 if(name==='getComboProductOptions' && query.has('comboOptions'))return args[0].flatMap(item=>Array.from({length:item.quantidade},(_,unit)=>({id:'p'+item.produto_id+'u'+unit+'g1',name:products.find(p=>p.id===item.produto_id).nome+' '+(unit+1)+' · Sabor',productName:products.find(p=>p.id===item.produto_id).nome,sourceGroupName:'Sabor',comboUnitKey:'p'+item.produto_id+'u'+unit,min:1,max:1,required:true,helper:'Escolha 1 opção',items:[{id:'1',name:'Morango',priceDelta:2},{id:'2',name:'Chocolate',priceDelta:0},{id:'3',name:'Baunilha',disponivel:false}]})));
 if(name==='getStoreSettings')return {auto_accept_orders:false};
 if(name==='listProfiles')return [{id:'1',nome:long,email:customers[0].email,role:'admin',acessos:ALL_ADMIN_PAGES,permissoes:[]}];
 if(name==='listPedidosAdmin')return orders;
 return [];
};
const path=query.get('path')||'/admin';
let content;
switch(path){
case '/admin/pedidos':content=<PedidosManager pedidosIniciais={empty?[]:orders} canManageStore/>;break;
case '/admin/produtos':content=<CatalogoManager loadError={error} produtosIniciais={empty?[]:products} categoriasIniciais={categories} promocoesFreteIniciais={[]} promocoesFreteErro={error?'Falha simulada de campanhas':null} combosIniciais={[]} combosErro={null}/>;break;
case '/admin/clientes':content=<ClientesManager clientesIniciais={empty?[]:customers}/>;break;
case '/admin/cupons':content=<CuponsManager initial={empty?[]:Array.from({length:30},(_,i)=>({id:String(i),codigo:`CUPOM${i}`,nome:'Promoção de inauguração da loja',tipo:'percentual',valor:10,valor_minimo:20,usos:10,limite_usos:100,ativo:i%5!==4,data_inicio:i%5===1?'2099-01-01':'2020-01-01',data_fim:i%5===2?'2020-01-02':null,limite_usos:i%5===3?10:100}))} loadError={error?'Falha simulada no carregamento':null}/>;break;
case '/admin/relatorios':content=<RelatoriosManager/>;break;
case '/admin/estabelecimento':content=<EstabelecimentoManager configuracaoInicial={store}/>;break;
case '/admin/configuracoes':content=<SistemaConfigManager preferenciasIniciais={DEFAULT_PREFERENCIAS_ESTABELECIMENTO}/>;break;
default:content=<DashboardView initialData={empty?{...dashboard,kpis:{pedidos:0,pedidosChange:0,faturamento:0,faturamentoChange:0,ticketMedio:0,ticketMedioChange:0,emAberto:0},recentOrders:[],topProducts:[],salesByDay:[],payments:[],hourly:[]}:dashboard}/>;
}
createRoot(document.getElementById('root')!).render(path==='/cadastrar'?<CustomerRegisterPage/>:path==='/entrar'?<CustomerLoginPage/>:path==='/admin/login'?<AdminLoginPage/>:<><AdminShell adminEmail="admin@example.com" adminName="Administrador" roleLabel="Administrador" acessos={ALL_ADMIN_PAGES} canManageStore>{content}</AdminShell><Toaster/></>);
