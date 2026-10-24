'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/architecture/m0-acceptance-inventory.json'),'utf8'));
// A real native route continues through the photograph UI; stopping static
// discovery at core/workbench would falsely report it as unconsumed.
const roots=['core','engines','workbench','labs','recognition',
 'integration','project','benchmark','scripts','tests'];
const extensions=new Set(['.cjs','.js','.mjs']);
function scan(dir,out=[]){
 if(!fs.existsSync(dir))return out;
 for(const item of fs.readdirSync(dir,{withFileTypes:true})){
  if(item.isDirectory()){
   if(!['node_modules','.git','dist','coverage','build'].includes(item.name))
    scan(path.join(dir,item.name),out);
  }else if(item.isFile()&&extensions.has(path.extname(item.name)))
   out.push(path.join(dir,item.name));
 }
 return out;
}
const relative=p=>path.relative(root,p).replace(/\\/g,'/');
function staticImports(file){
 const source=fs.readFileSync(file,'utf8'),found=[];
 const patterns=[
  /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /\b(?:from|import)\s*['"]([^'"]+)['"]/g
 ];
 for(const pattern of patterns){
  let match;
  while((match=pattern.exec(source))!==null){
   if(!match[1].startsWith('.'))continue;
   try{
    const full=require.resolve(path.resolve(path.dirname(file),match[1]));
    if(full.startsWith(root+path.sep))found.push(relative(full));
   }catch{ /* dynamic/unresolved imports are outside static evidence */ }
  }
 }
 return [...new Set(found)];
}
function verifyNativeRoutes(routes,imports,exists){
 if(!Array.isArray(routes)||routes.length===0)
  throw new Error('missing M0 native consumer acceptance routes');
 const names=new Set();
 return routes.map(route=>{
  if(!route||typeof route.name!=='string'||!route.name.trim()||
     names.has(route.name)||!Array.isArray(route.chain)||route.chain.length<2||
     !Array.isArray(route.regressionTests)||route.regressionTests.length<1)
   throw new Error('invalid or duplicate M0 native route');
  names.add(route.name);
  for(const file of route.chain)
   if(typeof file!=='string'||!exists(file))
    throw new Error('missing native route source: '+route.name+' '+file);
  for(let i=1;i<route.chain.length;i++){
   const consumer=route.chain[i],dependency=route.chain[i-1];
   if(!imports(consumer).includes(dependency))
    throw new Error('native M0 route disconnected: '+consumer+' -> '+dependency);
  }
  for(const evidence of route.regressionTests)
   if(typeof evidence!=='string'||!evidence.startsWith('tests/')||
      !evidence.endsWith('.test.cjs')||!exists(evidence))
    throw new Error('missing native source regression: '+route.name+' '+evidence);
  return {name:route.name,consumerEntry:route.chain.at(-1),
   chain:[...route.chain],regressionTests:[...route.regressionTests],
   staticImportChainConnected:true,executableEvidenceFilesPresent:true,
   currentSourceIndependentlyAuthenticated:false,
   fullM0ProofCertified:false};
 });
}
function audit(){
 const modules=manifest.modules;
 if(!Array.isArray(modules))throw new Error('missing M0 registry');
 const actual=fs.readdirSync(path.join(root,'core/numeric'))
  .filter(f=>f.endsWith('.cjs')).map(f=>'core/numeric/'+f).sort();
 const declared=modules.map(m=>m.path).sort();
 if(JSON.stringify(actual)!==JSON.stringify(declared))
  throw new Error('M0 module coverage drift: update every numeric acceptance entry');
 if(new Set(declared).size!==declared.length)
  throw new Error('duplicate M0 module entries');
 for(const item of modules){
  if(!manifest.statusDefinitions[item.status]||!item.proofScope||!item.remainingGate||
      !Array.isArray(item.regressionTests)||item.regressionTests.length===0)
   throw new Error('missing M0 proof range / blocker / status / regression: '+item.path);
  for(const test of item.regressionTests)
   if(!test.startsWith('tests/math/')||!test.endsWith('.test.cjs')||
       !fs.existsSync(path.join(root,test)))
    throw new Error('missing regression evidence: '+test);
 }
 const files=roots.flatMap(d=>scan(path.join(root,d)));
 const reverse=new Map();
 for(const file of files){
  const consumer=relative(file);
  for(const imported of staticImports(file)){
   if(!reverse.has(imported))reverse.set(imported,new Set());
   reverse.get(imported).add(consumer);
  }
 }
 const runtime=f=>!f.startsWith('tests/')&&!f.startsWith('scripts/');
 function transitive(key){
  const found=new Set(),todo=[key];
  while(todo.length){
   for(const by of reverse.get(todo.pop())||[]){
    if(!found.has(by)){found.add(by);todo.push(by);}
   }
  }
  return [...found].filter(runtime).sort();
 }
 const routes=verifyNativeRoutes(manifest.nativeRuntimeRoutes,
  file=>staticImports(path.join(root,file)),
  file=>fs.existsSync(path.join(root,file)));
 const entries=modules.map(item=>{
  const consumers=[...(reverse.get(item.path)||[])].sort();
  return {...item,
   directRuntimeConsumers:consumers.filter(runtime),
   directTestReferences:consumers.filter(c=>c.startsWith('tests/')),
   transitiveRuntimeConsumers:transitive(item.path)};
 });
 return {schema:'draftai-m0-static-acceptance-report/1',
  warning:'Literal static imports only, not executable paths, independent mathematical correctness, or production deployment',
  moduleCount:entries.length,
  statuses:Object.fromEntries(Object.keys(manifest.statusDefinitions)
   .map(k=>[k,entries.filter(x=>x.status===k).length])),
  noDirectRuntimeImporter:entries.filter(x=>x.directRuntimeConsumers.length===0).map(x=>x.path),
  nativeRuntimeRoutes:routes,
  entries};
}
if(require.main===module)process.stdout.write(JSON.stringify(audit(),null,2)+'\n');
module.exports={audit,verifyNativeRoutes};
