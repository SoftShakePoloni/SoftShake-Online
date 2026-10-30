const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../../.responsive-test');
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
try {
const page=await browser.newPage({reducedMotion:'reduce'}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='responsive.test')return r.abort();const f=path.join(root,u.pathname==='/'?'index.html':path.basename(u.pathname));return r.fulfill({body:fs.readFileSync(f),contentType:f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'text/html'});});
for(const width of [320,390,768,1440]) {
 await page.setViewportSize({width,height:900});
 if(process.env.CONSUMER_FIXTURE) {
  await page.goto('http://responsive.test/?path=/promocoes&comboOptions=1');
  await page.getByRole('button',{name:'Escolher opções de Combo para escolher',exact:true}).click();
  const dialog=page.getByRole('dialog');await dialog.waitFor();
  const add=dialog.getByRole('button',{name:/^Adicionar/});assert.ok(await add.isDisabled());
  await dialog.getByRole('button',{name:/Morango/}).nth(0).click();
  assert.ok(await add.isDisabled());
  await dialog.getByRole('button',{name:/Chocolate/}).nth(1).click();
  assert.ok(await add.isEnabled());await add.click();
  const call=await page.evaluate(()=>window.__cartCalls[0]);assert.equal(call.total,22);assert.equal(Object.keys(call.selections).length,2);
  await page.getByRole('button',{name:'Adicionar Combo sabores fixos à sacola',exact:true}).click();
  const fixed=await page.evaluate(()=>window.__cartCalls[1]);assert.equal(fixed.total,20);assert.equal(fixed.produto.comboFixedChoices.length,2);
 } else {
  await page.goto('http://responsive.test/?path=/admin/produtos&comboOptions=1');
  await page.getByRole('tab',{name:'Combos',exact:true}).click();
  await page.getByLabel('Nome do combo',{exact:true}).fill('Combo teste');
  await page.getByRole('checkbox',{name:'Incluir Açaí especial com morango e complementos 1',exact:true}).check();
  await page.getByRole('checkbox',{name:'Incluir Açaí especial com morango e complementos 2',exact:true}).check();
  await page.getByLabel('Quantidade de Açaí especial com morango e complementos 1',{exact:true}).fill('2');
  await page.getByRole('radio',{name:/Opções fixas/}).check();
  await page.getByRole('checkbox',{name:/Morango/}).nth(2).waitFor();
  assert.ok(await page.getByRole('button',{name:'Criar combo',exact:true}).isDisabled());
  await page.getByRole('checkbox',{name:/Morango/}).nth(0).check();
  await page.getByRole('checkbox',{name:/Chocolate/}).nth(1).check();
  await page.getByRole('checkbox',{name:/Chocolate/}).nth(2).check();
  await page.getByLabel('Preço do combo',{exact:true}).fill('20');
  assert.ok(await page.getByRole('button',{name:'Criar combo',exact:true}).isEnabled());
  if(width===390)await page.screenshot({path:path.join(root,'combo-fixed-390.png'),fullPage:true});
  await page.getByRole('button',{name:'Criar combo',exact:true}).click();
  await page.getByText('Combo teste',{exact:true}).waitFor();
  const payload=await page.evaluate(()=>window.__mutations.find(x=>x.name==='createCombo').args[0]);assert.equal(payload.opcoes_config.modo,'fixo');assert.equal(Object.keys(payload.opcoes_config.selecoes).length,3);
  await page.getByRole('radio',{name:/Cliente escolhe/}).check();
  await page.getByLabel('Nome do combo',{exact:true}).fill('Combo cliente');
  await page.getByRole('checkbox',{name:'Incluir Açaí especial com morango e complementos 1',exact:true}).check();
  await page.getByRole('checkbox',{name:'Incluir Açaí especial com morango e complementos 2',exact:true}).check();
  await page.getByLabel('Preço do combo',{exact:true}).fill('20');
  await page.getByRole('button',{name:'Criar combo',exact:true}).click();
  await page.getByText('Combo cliente',{exact:true}).waitFor();
  const customer=await page.evaluate(()=>window.__mutations.filter(x=>x.name==='createCombo')[1].args[0]);assert.equal(customer.opcoes_config.modo,'cliente');assert.deepEqual(customer.opcoes_config.selecoes,{});

 }
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Overflow at '+width);
 console.log('Combo UI passed',width);
}
assert.deepEqual(errors,[]);
} finally {await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
