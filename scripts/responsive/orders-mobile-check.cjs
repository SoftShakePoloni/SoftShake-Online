const fs=require('fs'),path=require('path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../../.responsive-test');
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
try{
const page=await browser.newPage({reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('Runtime:',e.message)});
await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='responsive.test')return r.abort();const f=path.join(root,u.pathname==='/'?'index.html':path.basename(u.pathname));return r.fulfill({body:fs.readFileSync(f),contentType:f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'text/html'});});
const results=[];
for(const width of [320,390,768,1440]){
await page.setViewportSize({width,height:844});await page.goto('http://responsive.test/?path=/admin/pedidos');await page.locator('input[type=search]').waitFor();
if(width<768){
if(await page.locator('.admin-kanban-column:visible').count()!==4)throw Error('All stages must appear initially');
await page.locator('#mobile-order-stage').selectOption('em_producao');
if(await page.locator('.admin-kanban-column:visible').count()!==1)throw Error('Stage selection failed');
if(await page.getByRole('button',{name:'Atualizar pedidos'}).isVisible())throw Error('Options not collapsed');
await page.locator('summary').click();await page.getByRole('button',{name:'Atualizar pedidos'}).waitFor({state:'visible'});await page.locator('summary').click();
}
if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Overflow');
results.push({width,passed:true});
if(width===390)await page.screenshot({path:path.join(root,'orders-mobile-clean.png'),fullPage:true,animations:'disabled'});
}
console.log(JSON.stringify({results,errors}));if(errors.length)throw Error('Runtime errors');
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
