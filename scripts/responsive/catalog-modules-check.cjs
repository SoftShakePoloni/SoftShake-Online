const fs=require('fs'),path=require('path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../../.responsive-test');
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
try{
const page=await browser.newPage({reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('Runtime:',e.message)});
await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='responsive.test')return r.abort();const f=path.join(root,u.pathname==='/'?'index.html':path.basename(u.pathname));return r.fulfill({body:fs.readFileSync(f),contentType:f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'text/html'});});
const results=[];
for(const width of [320,390,768,1024,1440,1920]){
await page.setViewportSize({width,height:900});await page.goto('http://responsive.test/?path=/admin/produtos');await page.getByRole('heading',{name:'Produtos',exact:true}).waitFor();
for(const tab of ['Produtos','Complementos','Opções','Combos','Promoções']){
 await page.getByRole('tab',{name:tab,exact:true}).click();await page.waitForTimeout(100);
 if(['Complementos','Opções'].includes(tab)){
 await page.locator('.catalog-option-row').first().waitFor();
 await page.getByRole('button',{name:'Ações do grupo',exact:true}).click();await page.getByRole('menuitem',{name:'Renomear',exact:true}).waitFor();await page.keyboard.press('Escape');
 if(width<1024)await page.locator('.catalog-group-selector select').selectOption('1');
 }
 if(['Combos','Promoções'].includes(tab)){
 const summary=page.locator('.catalog-create-panel > summary');await summary.click();if(await page.locator('.catalog-create-panel form').isVisible())throw Error('Form did not close');await summary.click();await page.locator('.catalog-create-panel form').waitFor({state:'visible'});
 }
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Overflow '+tab+' '+width);
 if([390,1440].includes(width))await page.screenshot({path:path.join(root,'catalog-module-'+tab+'-'+width+'.png'),fullPage:false,animations:'disabled'});
}
results.push({width,passed:true});console.log('Passed',width);
}
console.log(JSON.stringify({results,errors}));if(errors.length)throw Error('Runtime errors');
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
