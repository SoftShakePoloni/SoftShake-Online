// Bundles real client components with test-only transport replacements, never a Next route.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const output = path.join(root, '.responsive-test');
fs.mkdirSync(output, {recursive:true});
const compiler = require('next/dist/compiled/webpack/webpack'); compiler.init();
const alias = {'next/link':path.join(__dirname,'next.tsx'), 'next/navigation':path.join(__dirname,'next.tsx'), 'next/image':path.join(__dirname,'image.tsx'), '@/lib/supabase/client':path.join(__dirname,'client.ts'), '@/integrations/supabase/client':path.join(__dirname,'client.ts')};
if(process.env.CONSUMER_FIXTURE)Object.assign(alias,{'@/hooks/useCardapio':path.join(__dirname,'consumer-mocks.ts'),'@/hooks/useLoja':path.join(__dirname,'consumer-mocks.ts'),'@/context/CarrinhoContext':path.join(__dirname,'consumer-mocks.ts'),'@/context/AuthContext':path.join(__dirname,'consumer-mocks.ts')});
compiler.webpack({mode:'development', plugins:[new compiler.webpack.DefinePlugin({'process.env':JSON.stringify({NODE_ENV:'development'})})], devtool:false, entry:path.join(__dirname,process.env.CONSUMER_FIXTURE?'consumer-fixture.tsx':'fixture.tsx'), output:{path:output, filename:'app.js'}, resolve:{extensions:['.tsx','.ts','.js'],alias:{...alias,'@':path.join(root,'src')}}, module:{rules:[{test:/\.(tsx?|css)$/,use:path.join(__dirname,'loader.cjs')}]}, performance:{hints:false}}, async (err, stats) => {
  if(err || stats.hasErrors()) { console.error(err || stats.toString({all:false,errors:true})); process.exitCode=1; return; }
  const postcss=require('postcss'); const tailwind=require('@tailwindcss/postcss');
  const css=await postcss([tailwind()]).process(fs.readFileSync(path.join(root,'src/styles.css'),'utf8'),{from:path.join(root,'src/styles.css')});
  fs.writeFileSync(path.join(output,'app.css'),css.css+'\n'+fs.readFileSync(path.join(root,'src/components/admin/premium/admin-responsive.css'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/components/admin/dashboard/dashboard.css'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/components/admin/catalogo/catalog.css'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/components/cardapio/promocoes/offers.css'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/components/admin/cupons/cupons.css'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/components/admin/relatorios/relatorios.css'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/components/auth/auth.css'),'utf8'));
  fs.writeFileSync(path.join(output,'index.html'),'<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/app.css"><body><div id="root"></div><script src="/app.js"></script></body></html>');
  console.log('Responsive fixture built');
});
