const fs=require('fs'),path=require('path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../../.responsive-test');
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
try{
const page=await browser.newPage({reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('Runtime:',e.message)});
await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='responsive.test')return r.abort();const f=path.join(root,u.pathname==='/'?'index.html':path.basename(u.pathname));return r.fulfill({body:fs.readFileSync(f),contentType:f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'text/html'});});
const results=[];
for(const width of [320,360,375,390,430,768,820,1024,1280,1440,1920]){
 await page.setViewportSize({width,height:900});await page.goto('http://responsive.test/?path=/admin');await page.getByRole('heading',{name:'Visão geral',exact:true}).waitFor();
 for(const tab of ['Pagamentos','Atividade','Produtos','Pedidos','Receita']){await page.getByRole('tab',{name:tab,exact:true}).click();}
 const rows=await page.locator('.dashboard-orders-table tbody tr').count();if(rows!==6)throw Error('Recent orders not limited');
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);if(overflow)throw Error('Overflow '+width);
 await page.getByRole('button',{name:'7 dias',exact:true}).click();await page.waitForTimeout(100);
 if(await page.getByRole('button',{name:'7 dias',exact:true}).getAttribute('aria-pressed')!=='true')throw Error('Period failed');
 if([390,1440].includes(width))await page.screenshot({path:path.join(root,`dashboard-redesign-${width}.png`),fullPage:true,animations:'disabled'});
 results.push({width,overflow,rows});
}
await page.goto('http://responsive.test/?path=/admin&empty=1');
await page.getByText('Nenhum pedido por aqui ainda.').waitFor();
if(await page.locator('.dashboard-chart').count())throw Error('Empty dashboard reserves chart height');
await page.screenshot({path:path.join(root,'dashboard-empty.png'),fullPage:true,animations:'disabled'});
await page.goto('http://responsive.test/?path=/admin&error=1');
await page.getByRole('button',{name:'7 dias',exact:true}).click();
await page.getByRole('alert').waitFor();
if(await page.locator('.dashboard-orders-table tbody tr').count()!==6)throw Error('Error discarded last data');
await page.goto('http://responsive.test/?path=/admin/pedidos&pedido=1000');
await page.getByRole('dialog').waitFor();
await page.getByRole('dialog').getByRole('heading',{name:'#1000'}).waitFor();
console.log(JSON.stringify({results,errors,empty:true,error:true,orderDetail:true}));if(errors.length)throw Error('Runtime errors');
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
