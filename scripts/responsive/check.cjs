const fs=require('fs'),path=require('path'),http=require('http');
const runtime=process.env.PLAYWRIGHT_MODULE || 'playwright';
const {chromium,firefox,webkit}=require(runtime);
const root=path.resolve(__dirname,'../../.responsive-test');
const widths=process.env.WIDTHS?process.env.WIDTHS.split(',').map(Number):[320,360,375,390,430,768,820,1024,1280,1440,1920];
const routes=['/admin/login','/admin','/admin/pedidos','/admin/produtos','/admin/clientes','/admin/cupons','/admin/relatorios','/admin/estabelecimento','/admin/configuracoes'];
const server=http.createServer((req,res)=>{const file=path.join(root,req.url.split('?')[0]==='/'?'index.html':path.basename(req.url.split('?')[0]));res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));});
async function overflow(page,label,results){
 const result=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.right>innerWidth+2&&!e.closest('[data-radix-popper-content-wrapper]')&&!function clipped(n){for(let p=n.parentElement;p;p=p.parentElement){if(['auto','scroll','hidden'].includes(getComputedStyle(p).overflowX))return true;}return false;}(e);}).slice(0,8).map(e=>({tag:e.tagName,class:e.className,text:e.textContent.slice(0,50)}))}));
 results.push({label,...result});if(result.scroll>result.width+2)console.log('OVERFLOW',label,JSON.stringify(result));
}
(async()=>{
 await new Promise(r=>server.listen(4173,'127.0.0.1',r));
 const engine=process.env.BROWSER || 'chromium';
 const browser=await ({chromium,firefox,webkit}[engine]).launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
 await page.route('**/*',route=>{
   const url=new URL(route.request().url());
   if(url.hostname!=='responsive.test')return route.abort();
   const file=path.join(root,url.pathname==='/'?'index.html':path.basename(url.pathname));
   return route.fulfill({body:fs.readFileSync(file),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});
 });
 const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message)});
 const results=[];
 for(const width of widths){
  await page.setViewportSize({width,height:width<768?844:900});
  for(const route of routes){
   await page.goto('http://responsive.test/?path='+route);await page.waitForTimeout(300);
   await overflow(page,`${route}@${width}`,results);
   if(width===390||width===1440)await page.screenshot({animations:'disabled',path:path.join(root,`${route.replaceAll('/','_')}-${width}.png`),fullPage:true});
  }
 }
 const interactions=[];
 const open=async(route)=>{await page.goto('http://responsive.test/?path='+route);await page.waitForTimeout(250);};
 for(const width of widths){
  await page.setViewportSize({width,height:width<768?844:900});
  await open('/admin/pedidos');
  if(width<1280){
   await page.getByRole('button',{name:'Abrir menu',exact:true}).click();
   await page.getByRole('dialog').waitFor();await page.waitForTimeout(550);
   await overflow(page,`menu@${width}`,results);
   await page.keyboard.press('Escape');
   if(await page.getByRole('dialog').count())await page.getByRole('dialog').waitFor({state:'hidden'});
  }
  if(width<768){
   await page.getByRole('button',{name:/Em preparo 6/}).click();
   if(await page.locator('.admin-kanban-column:visible').count()!==1)throw Error('Mobile must show one status column');
  }
  await page.locator('.admin-kanban-column:visible button').filter({hasText:/#10/}).first().click();
  await page.getByRole('dialog').waitFor();await page.waitForTimeout(550);
  await overflow(page,`pedido-detalhe@${width}`,results);
  if(width===390)await page.screenshot({animations:'disabled',path:path.join(root,'pedido-detalhe-390.png')});
  const panel=page.getByRole('dialog');
  const focused=await page.evaluate(()=>!!document.activeElement?.closest('[role="dialog"]'));
  if(!focused)throw Error('Order panel did not receive focus');
  await panel.locator('.overflow-y-auto').evaluate(e=>e.scrollTop=e.scrollHeight);
  const advance=panel.getByRole('button',{name:width<768?'Saiu para entrega':'Aceitar',exact:true});
  await advance.click();
  await page.waitForTimeout(100);
  if(!await page.evaluate(()=>window.__mutations?.some(m=>m.name==='updatePedidoStatus')))throw Error('Order action did not reach existing status handler');
  await page.keyboard.press('Escape');
  await panel.waitFor({state:'hidden'});
  await open('/admin/clientes');
  await page.getByRole('button').filter({hasText:/Maria Aparecida/}).first().click();
  await page.waitForTimeout(250);
  await overflow(page,`cliente-detalhe@${width}`,results);
  for(const name of ['Endereços','Estatísticas']){
   await page.getByRole('tab',{name,exact:true}).click();
   await overflow(page,`cliente-${name}@${width}`,results);
  }
  if(width===390)await page.screenshot({animations:'disabled',path:path.join(root,'cliente-detalhe-390.png'),fullPage:true});
  await open('/admin/produtos');
  await page.getByRole('button',{name:'Novo produto',exact:true}).click();
  await page.getByRole('dialog').waitFor();await page.waitForTimeout(550);
  await overflow(page,`produto-drawer@${width}`,results);
  if(width===390)await page.screenshot({animations:'disabled',path:path.join(root,'produto-drawer-390.png')});
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor({state:'hidden'});
  for(const name of ['Complementos','Opções','Combos','Promoções']){
   await page.getByRole('tab',{name,exact:true}).click();await page.waitForTimeout(150);
   await overflow(page,`catalogo-${name}@${width}`,results);
   if(width===390)await page.screenshot({animations:'disabled',path:path.join(root,`catalogo-${name}-390.png`),fullPage:true});
  }
  for(const [route,sections]of [['/admin/estabelecimento',['Aparência','Endereço','Contato','Horários','Delivery']],['/admin/configuracoes',['Notificações','Impressão','Geral','Segurança','Usuários','Integrações','API','Backup','Assinatura','Conta']]]){
   await open(route);
   for(const name of sections){
    if(width<768){await page.getByRole('combobox').first().click();await page.getByRole('option',{name,exact:true}).click();}
    else await page.getByRole('button',{name,exact:true}).first().click();
    await page.waitForTimeout(100);await overflow(page,`${route}-${name}@${width}`,results);
   }
  }
  interactions.push({width,passed:true});
  console.log('Interactions passed',width);
 }
 fs.writeFileSync(path.join(root,`${engine}-results.json`),JSON.stringify({results,errors,interactions},null,2));
 console.log(JSON.stringify({engine,checks:results.length,overflows:results.filter(r=>r.scroll>r.width+2).length,errors:[...new Set(errors)]}));
 await browser.close();server.close();
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
