const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../../.responsive-test');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});try{
 const page=await browser.newPage({reducedMotion:'reduce'}),errors=[];let mode='missing',calls=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{const url=new URL(route.request().url());
  if(url.pathname==='/api/imagem/arquivo'){const logo=url.searchParams.get('path').includes('softshake_text');return route.fulfill({body:fs.readFileSync(path.join(root,logo?'auth-logo-original.png':'auth-product-original.webp')),contentType:logo?'image/png':'image/webp'});}
  if(url.pathname.startsWith('/api/auth/')){calls.push({url:url.pathname,body:route.request().postDataJSON()});await new Promise(resolve=>setTimeout(resolve,100));if(mode==='offline')return route.abort();const register=url.pathname.endsWith('registrar');return route.fulfill({status:register?(mode==='conflict'?409:201):404,contentType:'application/json',body:JSON.stringify(register?{}:{erro:'Conta não encontrada. Por favor, cadastre-se primeiro.',codigo:'USER_NOT_FOUND'})});}
  if(url.hostname!=='responsive.test')return route.abort();
  const file=path.join(root,url.pathname==='/'?'index.html':path.basename(url.pathname));return route.fulfill({body:fs.readFileSync(file),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});
 });
 for(const width of [320,360,375,390,430,768,820,1024,1280,1440,1920]){
  await page.setViewportSize({width,height:844});
  for(const route of ['entrar','cadastrar']){
   await page.goto('http://responsive.test/?path=/'+route);
   await page.getByRole('heading',{name:route==='entrar'?'Entre e aproveite.':'Vamos começar.',exact:true}).waitFor();
   assert.equal(await page.locator('form input').count(),route==='entrar'?1:2);
   const phone=page.getByRole('textbox',{name:'Telefone',exact:true});await phone.fill('17900000000');assert.equal(await phone.inputValue(),'(17) 90000-0000');
   if(route==='cadastrar')await page.getByRole('textbox',{name:'Nome completo',exact:true}).fill('Cliente de teste');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Overflow '+width+' '+route);
   const dimensions=await page.locator('.auth-logo').evaluate(img=>({ratio:img.getBoundingClientRect().width/img.getBoundingClientRect().height,native:img.naturalWidth/img.naturalHeight}));assert.ok(Math.abs(dimensions.ratio-dimensions.native)<0.03);
   if([320,390,768,1440,1920].includes(width))await page.screenshot({path:path.join(root,`auth-${route}-${width}.png`),fullPage:true});
  }
  console.log('Shared auth layout passed',width);
 }
 await page.goto('http://responsive.test/?path=/entrar');await page.getByRole('textbox',{name:'Telefone',exact:true}).fill('17900000000');
 await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.getByRole('alert').waitFor();assert.ok((await page.getByRole('alert').textContent()).includes('Conta não encontrada. Por favor, cadastre-se primeiro.'));
 await page.getByRole('alert').getByRole('link',{name:'Criar minha conta',exact:true}).click();await page.getByRole('heading',{name:'Vamos começar.',exact:true}).waitFor();assert.equal(await page.getByRole('textbox',{name:'Telefone',exact:true}).inputValue(),'(17) 90000-0000');
 const register=page.getByRole('button',{name:'Criar conta',exact:true});const before=calls.length;await register.click();await page.getByRole('alert').waitFor();assert.equal(calls.length,before);
 await page.getByRole('textbox',{name:'Nome completo',exact:true}).fill('Cliente de teste');
 await page.getByRole('textbox',{name:'Telefone',exact:true}).fill('123');await register.click();assert.equal(calls.length,before);
 await page.getByRole('textbox',{name:'Telefone',exact:true}).fill('17900000000');await register.click();assert.ok(await page.getByRole('button',{name:'Criando conta…',exact:true}).isDisabled());
 await page.getByRole('heading',{name:'Entre e aproveite.',exact:true}).waitFor();
 assert.deepEqual(calls.slice(-2).map(call=>call.url),['/api/auth/registrar','/api/auth/entrar']);assert.deepEqual(calls.at(-2).body,{nome:'Cliente de teste',telefone:'17900000000'});
 await page.getByRole('alert').waitFor();assert.ok((await page.getByRole('alert').textContent()).includes('Não foi possível entrar automaticamente'));
 mode='conflict';await page.getByRole('navigation',{name:'Acesso à conta'}).getByRole('link',{name:'Criar conta',exact:true}).click();await page.getByRole('textbox',{name:'Nome completo',exact:true}).fill('Cliente de teste');await register.click();await page.getByRole('heading',{name:'Entre e aproveite.',exact:true}).waitFor();assert.deepEqual(calls.slice(-2).map(call=>call.url),['/api/auth/registrar','/api/auth/entrar']);
 mode='offline';await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.getByRole('alert').waitFor();assert.ok((await page.getByRole('alert').textContent()).includes('Confira sua conexão'));
 await page.setViewportSize({width:320,height:360});await page.getByRole('textbox',{name:'Telefone',exact:true}).focus();await page.getByRole('button',{name:'Entrar',exact:true}).scrollIntoViewIfNeeded();const box=await page.getByRole('button',{name:'Entrar',exact:true}).boundingBox();assert.ok(box.y>=0&&box.y+box.height<=360);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);
}finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
