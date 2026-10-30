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
await page.setViewportSize({width,height:900});await page.goto('http://responsive.test/?path=/admin/produtos');await page.getByRole('heading',{name:'Produtos',exact:true}).waitFor();await page.waitForTimeout(100);
if(await page.locator('.catalog-product-row').count()!==50)throw Error('Initial page size');
await page.getByRole('button',{name:/Carregar mais/}).click();if(await page.locator('.catalog-product-row').count()!==60)throw Error('Load more');
await page.getByRole('searchbox',{name:'Buscar produtos'}).fill('inexistente');await page.getByRole('heading',{name:'Nenhum resultado'}).waitFor();
await page.getByRole('searchbox',{name:'Buscar produtos'}).fill('');
if(width<1280){await page.locator('#catalog-category').selectOption('2');await page.getByRole('heading',{name:'Nenhum produto nesta categoria'}).waitFor();await page.locator('#catalog-category').selectOption('__all__');await page.getByRole('button',{name:'Gerenciar',exact:true}).click();await page.getByRole('button',{name:'Nova categoria'}).waitFor({state:'visible'});await page.getByRole('button',{name:'Gerenciar',exact:true}).click();}
await page.getByRole('combobox',{name:'Disponibilidade',exact:true}).click();await page.getByRole('option',{name:'Indisponíveis',exact:true}).click();await page.getByRole('heading',{name:'Nenhum resultado'}).waitFor();await page.getByRole('combobox',{name:'Disponibilidade',exact:true}).click();await page.getByRole('option',{name:'Todos',exact:true}).click();
await page.getByRole('button',{name:'Mais ações do catálogo'}).click();await page.getByRole('menuitem',{name:'Exportar',exact:true}).waitFor();await page.keyboard.press('Escape');
if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Overflow '+width);
if([390,1440].includes(width))await page.screenshot({path:path.join(root,'catalog-redesign-'+width+'.png'),fullPage:false,animations:'disabled'});
await page.locator('.catalog-product-cell button').first().click();await page.getByRole('dialog').waitFor();await page.waitForTimeout(550);const bounds=await page.getByRole('dialog').boundingBox();if(!bounds||Math.abs(bounds.width-Math.min(520,width))>2||Math.abs(bounds.x+bounds.width-width)>2)throw Error('Editor not docked right');await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});
await page.locator('.catalog-product-actions button').first().click();await page.getByRole('menuitem',{name:'Excluir',exact:true}).click();await page.getByRole('alertdialog').waitFor();await page.getByRole('button',{name:'Cancelar',exact:true}).click();
await page.getByRole('button',{name:'Novo produto',exact:true}).click();await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});
for(const tab of ['Complementos','Opções','Combos','Promoções','Produtos']){await page.getByRole('tab',{name:tab,exact:true}).click();}
results.push({width,passed:true});console.log('Passed',width);
}
await page.goto('http://responsive.test/?path=/admin/produtos&broken=1');
await page.locator('.catalog-product-row').first().waitFor();await page.waitForTimeout(200);
if(await page.locator('.catalog-product-cell').first().locator('img').count())throw Error('Broken thumbnail did not fall back');
await page.getByRole('switch').first().click();await page.waitForTimeout(100);
if(!await page.evaluate(()=>window.__mutations?.some(m=>m.name==='updateProduto' && m.args[1].esta_disponivel===false)))throw Error('Availability handler lost');
await page.goto('http://responsive.test/?path=/admin/produtos&empty=1');await page.getByRole('heading',{name:'Seu catálogo está vazio'}).waitFor();
await page.goto('http://responsive.test/?path=/admin/produtos&error=1');await page.getByRole('alert').filter({hasText:'Não foi possível carregar o catálogo'}).waitFor();
console.log(JSON.stringify({results,errors,thumbnailFallback:true,availability:true,empty:true,error:true}));if(errors.length)throw Error('Runtime errors');
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
