const fs=require('fs'),path=require('path'),ts=require('typescript');
const root=path.resolve(__dirname,'../..');
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const routes=files(path.join(root,'src/app/admin')).filter(p=>/page\.tsx$/.test(p));
const components=files(path.join(root,'src/components/admin')).filter(p=>/\.tsx$/.test(p));
const seen=new Set();
function visit(file){
 if(seen.has(file))return;seen.add(file);
 const source=fs.readFileSync(file,'utf8');
 for(const {fileName}of ts.preProcessFile(source,true,true).importedFiles){
  const base=fileName.startsWith('@/')?path.join(root,'src',fileName.slice(2)):fileName.startsWith('.')?path.resolve(path.dirname(file),fileName):null;
  if(!base)continue;
  const resolved=[base,...['.tsx','.ts','/index.tsx','/index.ts'].map(ext=>base+ext)].find(p=>fs.existsSync(p)&&fs.statSync(p).isFile());
  if(resolved&&/\.tsx?$/.test(resolved))visit(resolved);
 }
}
routes.forEach(visit);visit(path.join(root,'src/app/admin/(dashboard)/layout.tsx'));
const relative=p=>path.relative(root,p).replaceAll('\\','/');
const rows=components.map(file=>{
 const source=fs.readFileSync(file,'utf8');
 const flags=[];
 if(/w-\[\d+px\]|min-w-\[/.test(source))flags.push('larguras explícitas');
 if(/overflow-(auto|x-auto|y-auto)/.test(source))flags.push('rolagem local');
 if(/grid-cols-/.test(source))flags.push('grid');
 if(/SheetContent|DialogContent|PopoverContent|DropdownMenuContent/.test(source))flags.push('flutuantes');
 if(/opacity-0.*group-hover|hidden.*group-hover/.test(source))flags.push('ação por hover');
 return `| ${relative(file)} | ${seen.has(file)?'Importado pelo conjunto de rotas':'Legado/sem importação pelas rotas'} | ${flags.join(', ')||'sem padrão rígido identificado'} |`;
});
fs.mkdirSync(path.join(root,'docs'),{recursive:true});
fs.writeFileSync(path.join(root,'docs/admin-responsive-inventory.md'),`# Inventário administrativo\n\nGerado por \`node scripts/responsive/inventory.cjs\`. Todos os ${components.length} componentes TSX administrativos foram lidos. O rastreamento inclui reexports; presença no grafo não implica montagem na tela. Componentes legados foram inventariados, sem reativar fluxos abandonados.\n\n## Rotas (${routes.length})\n\n${routes.map(p=>'- '+relative(p)).join('\n')}\n\n## Componentes\n\n| Arquivo | Dependência das rotas | Padrões para revisão |\n|---|---|---|\n${rows.join('\n')}\n`);
console.log(`${routes.length} routes, ${components.length} components inventoried`);
