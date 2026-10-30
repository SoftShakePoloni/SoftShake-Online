const fs=require('fs'),path=require('path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../../.responsive-test');
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
try{
const page=await browser.newPage({reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('Runtime:',e.message)});
await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname==='images.test')return r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="#e9dcf4"/><circle cx="150" cy="150" r="70" fill="#6b3fa0"/></svg>'});if(u.hostname!=='responsive.test')return r.abort();const f=path.join(root,u.pathname==='/'?'index.html':path.basename(u.pathname));return r.fulfill({body:fs.readFileSync(f),contentType:f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'text/html'});});
const results=[];
for(const width of [320,360,375,390,430,768,820,1024,1280,1440,1920]){
await page.setViewportSize({width,height:844});await page.goto('http://responsive.test/?path=/promocoes');await page.getByRole('heading',{name:'Promoções',exact:true}).waitFor();
await page.getByRole('searchbox').fill('xyz');await page.getByText('Nenhuma promoção encontrada',{exact:true}).waitFor();await page.getByRole('button',{name:'Limpar filtros'}).click();
await page.getByRole('button',{name:'Combos',exact:true}).click();if(await page.locator('.offer-card').count()!==2)throw Error('Category filter');await page.getByRole('button',{name:'Todos',exact:true}).click();
await page.getByRole('button',{name:'Adicionar Açaí tradicional à sacola',exact:true}).click();if(!await page.evaluate(()=>window.__cartCalls?.[0].total===12.9))throw Error('Price changed');
await page.getByRole('button',{name:'Escolher opções de Açaí com frutas e granola',exact:true}).click();await page.getByRole('dialog').waitFor();await page.waitForTimeout(250);
const oldY=await page.evaluate(()=>scrollY);await page.getByRole('dialog').locator('.overflow-y-auto').evaluate(e=>e.scrollTop=e.scrollHeight);await page.mouse.wheel(0,500);if(await page.evaluate(()=>scrollY)!==oldY)throw Error('Background scrolled');await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});
if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Overflow '+width);
if([390,1440].includes(width))await page.screenshot({path:path.join(root,'offers-redesign-'+width+'.png'),fullPage:false,animations:'disabled'});
results.push({width,passed:true});console.log('Passed',width);
}
for(const state of ['empty','error','loading']){await page.goto('http://responsive.test/?path=/promocoes&'+state+'=1');if(state==='empty')await page.getByText('Nenhuma promoção disponível no momento',{exact:true}).waitFor();if(state==='error')await page.getByRole('alert').waitFor();if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('State overflow');}
console.log(JSON.stringify({results,errors}));if(errors.length)throw Error('Runtime errors');
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
