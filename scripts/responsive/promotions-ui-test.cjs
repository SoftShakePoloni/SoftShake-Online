const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),ts=require('typescript'),{createRequire}=require('node:module');
function load(file,mocks){const native=createRequire(path.resolve(file)),exports={};new Function('require','exports','window',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText)(name=>name in mocks?mocks[name]:name.startsWith('@/')?load('src/'+name.slice(2)+'.ts',mocks):name.startsWith('.')?load(path.join(path.dirname(file),name)+'.ts',mocks):native(name),exports,{setTimeout(){}});return exports;}
function find(node,predicate){if(!node||typeof node!=='object')return null;if(predicate(node))return node;for(const child of [].concat(node.props?.children??[])){const found=Array.isArray(child)?child.map(x=>find(x,predicate)).find(Boolean):find(child,predicate);if(found)return found}return null;}
test('promotion action opens unknown or required options and preserves direct-add prices for configured combos',()=>{
 let added=[],opened=[],storeOpen=true;
 const React=require('react');
 const mocks={react:{...React,useState:initial=>[initial,value=>{if(value===true)opened.push(true)}]},'@/hooks/useModalHistory':{useModalHistory(){}},'@/components/ui/storage-image':{StorageImage:'img'},'@/components/cardapio/ModalProduto':{ProductDetailDialog:'div'},'@/context/CarrinhoContext':{useCarrinho:()=>({adicionarItem:item=>added.push(item)})},'@/hooks/useLoja':{useLoja:()=>({loja:{esta_aberto:storeOpen},isLoading:false})},'@/lib/utils':{cn:(...values)=>values.filter(Boolean).join(' ')},sonner:{toast:{error(){},success(){}}}};
 const {PromoProductCard}=load('src/components/cardapio/promocoes/PromoProductCard.tsx',mocks);
 const click=product=>find(PromoProductCard({product}),node=>node.type==='button'&&node.props.className==='offer-add').props.onClick({stopPropagation(){}});
 const product={id:'42',name:'Milkshake',description:'',price:20,precoPromocional:15,disponivel:true,optionGroups:[{id:'obs',items:[]}]};
 click(product);assert.equal(added.length,0);assert.equal(opened.length,1,'lazy-loaded options must be checked in the product dialog');
 opened=[];click({...product,id:'configured',optionGroups:[{id:'flavor',required:true,items:[{id:'1'}]}]});assert.equal(added.length,0);assert.equal(opened.length,1);
 click({...product,id:'combo-1',comboId:1,comboOptionsMode:'fixo'});assert.equal(added.length,1);assert.equal(added[0].total,15);assert.equal(added[0].qty,1);
 storeOpen=false;click({...product,id:'combo-2',comboId:2,comboOptionsMode:'fixo'});assert.equal(added.length,1);
});
