// @ts-nocheck -- isolated consumer UI fixture.
import React from 'react';
import {createRoot} from 'react-dom/client';
import PaginaPromocoes from '@/components/paginas/PaginaPromocoes';
import {BottomNav} from '@/components/layout/BottomNav';
import {Toaster} from 'sonner';
window.__promoCategories=[{id:'acai',name:'Açaí',products:[{id:'promo-1',name:'Açaí com frutas e granola',description:'Açaí cremoso com banana, morango e granola.',price:25,precoPromocional:19.9,image:'https://images.test/acai.svg',optionGroups:[{id:'tamanho',name:'Escolha o tamanho',required:true,min:1,max:1,items:[{id:'500',name:'500 ml',priceDelta:0}]}]},{id:'promo-2',name:'Açaí tradicional',description:'Seu açaí favorito.',price:15,precoPromocional:12.9}]},{id:'combos',name:'Combos',products:[{id:'combo-3',comboId:3,name:'Combo do dia',description:'Milkshake e água mineral.',price:22,precoPromocional:17,image:'https://images.test/acai.svg'},{id:'promo-4',name:'Milkshake de chocolate',description:'Chocolate com calda.',price:18,freteGratis:true,freteGratisPrazo:'Frete grátis até 30/10'}]}];
if(new URLSearchParams(location.search).has('comboOptions')) {
 const groups=[0,1].map(unit=>({id:'p1u'+unit+'g1',name:'Milkshake '+(unit+1)+'/2 · Sabor',productName:'Milkshake',sourceGroupName:'Sabor',comboUnitKey:'p1u'+unit,min:1,max:1,required:true,helper:'Escolha 1 opção',items:[{id:'1',name:'Morango',priceDelta:2},{id:'2',name:'Chocolate',priceDelta:0},{id:'3',name:'Baunilha',disponivel:false}]}));
 window.__promoCategories=[{id:'combos',name:'Combos',products:[{id:'combo-1',comboId:1,comboOptionsMode:'cliente',name:'Combo para escolher',description:'Dois milkshakes e água.',price:30,precoPromocional:20,optionGroups:groups},{id:'combo-2',comboId:2,comboOptionsMode:'fixo',name:'Combo sabores fixos',description:'Dois milkshakes e água.',price:30,precoPromocional:20,comboFixedChoices:[{id:'1',name:'Morango',price:0,groupId:groups[0].id,groupName:groups[0].name},{id:'2',name:'Chocolate',price:0,groupId:groups[1].id,groupName:groups[1].name}]}]}];
}
createRoot(document.getElementById('root')!).render(<><PaginaPromocoes/><BottomNav/><Toaster/></>);
