'use strict';
/** Run actual OCCT BRep HLR on a box; no source-edge attribution or V5 signing. */
(async()=>{
 const path=require('node:path');const {pathToFileURL}=require('node:url');
 const root=path.dirname(require.resolve('opencascade.js/package.json'));
 const {default:init}=await import(pathToFileURL(path.join(root,'dist/node.js')).href);
 const oc=await init();
 const constructors={};
 for(const key of ['BRepPrimAPI_MakeBox','HLRBRep_Algo','HLRBRep_HLRToShape','HLRAlgo_Projector','gp_Dir','gp_Pnt','gp_Ax2','gp_Ax3'])
  constructors[key]=Object.keys(oc).filter(x=>x===key||x.startsWith(key+'_'));
 console.log('OCCT constructors',JSON.stringify(constructors));
 const box=new oc.BRepPrimAPI_MakeBox_2(40,30,20);
 const shape=box.Shape();
 const algo=new oc.HLRBRep_Algo_1();
 console.log('OCCT algo methods',JSON.stringify(Object.getOwnPropertyNames(Object.getPrototypeOf(algo))));
 console.log('OCCT Add overload signatures',JSON.stringify(Object.keys(algo).filter(k=>k.startsWith('Add')).map(k=>({name:k,arity:algo[k].length,source:String(algo[k]).slice(0,1200)}))));
 console.log('OCCT overloads',JSON.stringify(['Add_1','Add_2','Projector','Update','Hide'].map(k=>({name:k,exists:typeof algo[k],arity:typeof algo[k]==='function'?algo[k].length:null}))));
 algo.Add_2(shape,0);
 const projector=new oc.HLRAlgo_Projector_1();
 algo.Projector(projector);algo.Update();algo.Hide();
 const result=new oc.HLRBRep_HLRToShape(algo);
 const visible=result.VCompound();
 const hidden=result.HCompound();
 if(!visible||!hidden)throw Error('OCCT HLR output compounds absent');
 console.log('REAL OCCT BOX HLR COMPUTED',JSON.stringify({box:[40,30,20],visibleShapeType:visible.ShapeType(),hiddenShapeType:hidden.ShapeType(),observer:'default projector only',sourceMappingVerified:false,v5Ready:false}));
})().catch(e=>{console.error('REAL OCCT HLR FAILED:',e);process.exitCode=1;});
