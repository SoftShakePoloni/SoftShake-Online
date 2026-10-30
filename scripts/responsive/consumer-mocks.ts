// @ts-nocheck -- isolated consumer UI transport; no production calls.
export function useMenu(){const p=new URLSearchParams(location.search);return {categories:p.has('empty')?[]:window.__promoCategories,isLoading:p.has('loading'),error:p.has('error')?'Erro simulado':null};}
export function usePromocoesCount(){return {count:4};}
export function useCarrinho(){return {adicionarItem:(item)=>{window.__cartCalls=(window.__cartCalls||[]).concat(item)}};}
export function useLoja(){return {loja:{esta_aberto:!new URLSearchParams(location.search).has('closed')},isLoading:false};}
export function useAuth(){return {cliente:null,loading:false};}
