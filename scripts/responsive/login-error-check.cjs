const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../../.responsive-test');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});try{
 const page=await browser.newPage();let mode='missing',requests=0;
 await page.route('**/*',route=>{const url=new URL(route.request().url());if(url.pathname==='/api/auth/entrar'){requests++;return mode==='offline'?route.abort():route.fulfill({status:mode==='missing'?404:429,contentType:'application/json',body:JSON.stringify(mode==='missing'?{erro:'Conta não encontrada. Por favor, cadastre-se primeiro.',codigo:'USER_NOT_FOUND'}:{erro:'Muitas tentativas. Aguarde um momento e tente de novo.',codigo:'RATE_LIMIT'})})}if(url.hostname!=='responsive.test')return route.abort();if(url.pathname.startsWith('/api/imagem'))return route.abort();const file=path.join(root,url.pathname==='/'?'index.html':path.basename(url.pathname));return route.fulfill({body:fs.readFileSync(file),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});});
 for(const width of [320,390,1440]){
  await page.setViewportSize({width,height:900});await page.goto('http://responsive.test/?path=/entrar');
  const phone=page.getByRole('textbox',{name:'Telefone',exact:true});await phone.fill('17900000000');
  await page.getByRole('button',{name:'Entrar',exact:true}).click();
  const alert=page.getByRole('alert');await alert.waitFor();assert.ok((await alert.textContent()).includes('Conta não encontrada. Por favor, cadastre-se primeiro.'));
  await alert.getByRole('link',{name:'Criar minha conta',exact:true}).waitFor();
  assert.equal(await phone.getAttribute('aria-invalid'),'true');
  await page.waitForTimeout(200);assert.ok(await alert.isVisible());
  if(width===390)await page.screenshot({path:path.join(root,'login-account-not-found.png'),fullPage:true});
  await phone.fill('17900000001');assert.equal(await page.getByRole('alert').count(),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  console.log('Login inline error passed',width);
 }
 for(const error of ['limit','offline']){mode=error;await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.getByRole('alert').waitFor();assert.ok((await page.getByRole('alert').textContent()).includes(error==='limit'?'Muitas tentativas':'Confira sua conexão'));await page.getByRole('textbox',{name:'Telefone',exact:true}).fill('17900000002');}
 assert.equal(requests,5);
}finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
