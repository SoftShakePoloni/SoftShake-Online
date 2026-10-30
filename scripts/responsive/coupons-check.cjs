const fs=require('fs'),path=require('path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../../.responsive-test');
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
try{
const page=await browser.newPage({reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('Runtime:',e.message)});
await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='responsive.test')return r.abort();const f=path.join(root,u.pathname==='/'?'index.html':path.basename(u.pathname));return r.fulfill({body:fs.readFileSync(f),contentType:f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'text/html'});});
const results=[];
for(const width of (process.env.WIDTHS?process.env.WIDTHS.split(",").map(Number):[320,360,375,390,430,768,820,1024,1280,1440,1920])){
await page.setViewportSize({width,height:900});await page.goto('http://responsive.test/?path=/admin/cupons');await page.getByRole('heading',{name:'Cupons',exact:true}).waitFor();
if(await page.locator('#coupon-form').isVisible())throw Error('Creation must be contextual');
await page.getByRole('searchbox',{name:'Buscar cupons'}).fill('xyz');await page.getByText('Nenhum cupom encontrado',{exact:true}).waitFor();await page.getByRole('button',{name:'Limpar filtros'}).click();
for(const status of ['Ativo','Agendado','Expirado','Esgotado','Inativo']){await page.getByRole('combobox',{name:'Status dos cupons'}).click();await page.getByRole('option',{name:status,exact:true}).click();if(await page.locator('.coupons-table tbody tr').count()!==6)throw Error('Status filter '+status);}
await page.getByRole('combobox',{name:'Status dos cupons'}).click();await page.getByRole('option',{name:'Todos os status'}).click();
if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Overflow '+width);
if([390,1440].includes(width))await page.screenshot({path:path.join(root,'coupons-redesign-'+width+'.png'),fullPage:false,animations:'disabled'});
await page.getByRole('button',{name:'Detalhes do cupom CUPOM0',exact:true}).click();await page.getByRole('dialog').getByText('Ilimitado',{exact:true}).count();await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});
await page.getByRole('button',{name:'Ações do cupom CUPOM0',exact:true}).click();await page.getByRole('menuitem',{name:'Excluir',exact:true}).click();await page.getByRole('alertdialog').waitFor();await page.getByRole('button',{name:'Cancelar',exact:true}).click();
if(await page.evaluate(()=>window.__mutations?.some(m=>m.name==='deleteCupom')))throw Error('Cancel deleted coupon');
await page.getByRole('button',{name:'Novo cupom',exact:true}).click();await page.getByRole('dialog').waitFor();await page.waitForTimeout(550);
const bounds=await page.getByRole('dialog').boundingBox();if(!bounds||Math.abs(bounds.width-Math.min(540,width))>2||Math.abs(bounds.x+bounds.width-width)>2)throw Error('Drawer bounds');
await page.getByLabel('Código do cupom',{exact:true}).fill('NOVO');await page.getByLabel('Nome interno',{exact:true}).fill('Primeira compra');
await page.getByRole('combobox',{name:'Tipo de desconto'}).click();await page.getByRole('option',{name:'Valor fixo (R$)',exact:true}).click();
await page.getByLabel('Desconto (R$)',{exact:true}).fill('1.234,56');await page.getByLabel('Pedido mínimo (R$)',{exact:true}).fill('20,50');
if(width===390)await page.screenshot({path:path.join(root,'coupon-drawer-390.png'),fullPage:false,animations:'disabled'});
await page.getByRole('button',{name:'Criar cupom',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
const payload=await page.evaluate(()=>window.__mutations.find(m=>m.name==='createCupom').args[0]);if(payload.valor!==1234.56||payload.valor_minimo!==20.5||payload.limite_usos!==null)throw Error('Payload changed '+JSON.stringify(payload));
if(await page.locator('.coupons-table tbody tr').count()!==31)throw Error('Created coupon missing');
await page.getByRole('button',{name:'Ações do cupom NOVO',exact:true}).click();await page.getByRole('menuitem',{name:'Excluir',exact:true}).click();await page.getByRole('button',{name:'Excluir cupom',exact:true}).click();await page.getByRole('alertdialog').waitFor({state:'hidden'});if(await page.locator('.coupons-table tbody tr').count()!==30)throw Error('Confirmed deletion failed');
results.push({width,passed:true});console.log('Passed',width);
}
await page.goto('http://responsive.test/?path=/admin/cupons&empty=1');await page.getByText('Nenhum cupom cadastrado',{exact:true}).waitFor();
await page.goto('http://responsive.test/?path=/admin/cupons&error=1');await page.getByRole('alert').waitFor();
console.log(JSON.stringify({results,errors}));if(errors.length)throw Error('Runtime errors');
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
