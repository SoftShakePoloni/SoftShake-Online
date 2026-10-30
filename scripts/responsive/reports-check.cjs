const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../../.responsive-test');
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
try{
const page=await browser.newPage({reducedMotion:'reduce'}),errors=[];
await page.addInitScript(()=>{const original=URL.createObjectURL.bind(URL),blobs=new Map();window.__downloads=[];URL.createObjectURL=blob=>{const url=original(blob);blobs.set(url,blob);return url};document.addEventListener('click',event=>{const link=event.target.closest('a[download]');if(link){event.preventDefault();window.__downloads.push({name:link.download,blob:blobs.get(link.href)})}},true)});page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',route=>{const url=new URL(route.request().url());if(url.hostname!=='responsive.test')return route.abort();const file=path.join(root,url.pathname==='/'?'index.html':path.basename(url.pathname));return route.fulfill({body:fs.readFileSync(file),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});});
for(const width of [320,360,390,430,768,820,1024,1280,1440,1920]){
 await page.setViewportSize({width,height:900});await page.goto('http://responsive.test/?path=/admin/relatorios');
 await page.getByRole('heading',{name:'Relatórios',exact:true}).waitFor();await page.locator('.report-kpis dd').first().waitFor();
 assert.equal(await page.locator('.report-kpis>div').count(),4);
 assert.equal(await page.locator('.report-kpis>div').first().textContent().then(s=>s.includes('100%')),false);
 for(const name of ['Operacional','Comercial','Visão geral']){await page.getByRole('tab',{name,exact:true}).click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Overflow '+width+' '+name);}
 if([390,1440].includes(width))await page.screenshot({path:path.join(root,'reports-'+width+'.png'),fullPage:true});
 await page.getByLabel('Período',{exact:true}).selectOption('custom');
 await page.getByLabel('De',{exact:true}).fill('2026-10-01');await page.getByLabel('Até',{exact:true}).fill('2026-10-15');
 assert.ok(await page.getByRole('button',{name:'Exportar',exact:true}).isDisabled());
 await page.getByRole('button',{name:'Aplicar período',exact:true}).click();
 await page.getByText('2026-10-01 a 2026-10-15',{exact:true}).waitFor();
 if(width<768)await page.getByRole('button',{name:/^Filtros/}).click();
 await page.getByLabel('Status',{exact:true}).selectOption('entregue');
 await page.getByLabel('Pagamento',{exact:true}).selectOption('pix');
 await page.getByLabel('Canal',{exact:true}).selectOption('retirada');
 await page.waitForFunction(()=>window.__reportCalls.at(-1).tipo_entrega==='retirada');
 const payload=await page.evaluate(()=>window.__reportCalls.at(-1));assert.equal(payload.from,'2026-10-01');assert.equal(payload.to,'2026-10-15');assert.equal(payload.status,'entregue');assert.equal(payload.meio_pagamento,'pix');
 await page.getByRole('button',{name:'Exportar',exact:true}).click();
 for(const name of ['Exportar PDF','Exportar Excel','Exportar CSV'])await page.getByRole('menuitem',{name,exact:true}).waitFor();
 await page.keyboard.press('Escape');
 if(width===390){
  await page.getByRole('button',{name:'Exportar',exact:true}).click();await page.getByRole('menuitem',{name:'Exportar PDF',exact:true}).click();await page.waitForFunction(()=>window.__downloads.length===1);const file=await page.evaluate(async()=>({name:window.__downloads[0].name,bytes:Array.from(new Uint8Array(await window.__downloads[0].blob.arrayBuffer()))}));assert.equal(file.name,'SoftShake_Relatorio_2026-10-01_a_2026-10-15.pdf');fs.writeFileSync(path.join(root,'reports-filtered-ui.pdf'),Buffer.from(file.bytes));
  for(const format of ['Excel','CSV']){const count=await page.evaluate(()=>window.__downloads.length);await page.getByRole('button',{name:'Exportar',exact:true}).click();await page.getByRole('menuitem',{name:'Exportar '+format,exact:true}).click();await page.waitForFunction(count=>window.__downloads.length>count,count);const csv=await page.evaluate(()=>window.__downloads.at(-1).name);assert.ok(csv.endsWith('.csv'));}

 }
 await page.getByRole('button',{name:'Limpar filtros',exact:true}).click();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Filtered overflow '+width);
 console.log('Reports passed',width);
}
for(const state of ['empty','low','error','loading']){
 await page.goto('http://responsive.test/?path=/admin/relatorios&'+state+'=1');
 if(state==='empty')await page.getByText('Nenhum produto vendido no período.',{exact:true}).waitFor();
 if(state==='error')await page.getByRole('alert').waitFor();
 if(state==='low')await page.locator('.report-chart-small').first().waitFor();
 if(state==='loading')await page.getByRole('status',{name:'Carregando relatórios'}).waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
}
assert.deepEqual(errors,[]);
}finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
