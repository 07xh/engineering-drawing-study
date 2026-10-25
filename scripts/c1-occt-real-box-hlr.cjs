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
 console.log('OCCT projection and hide methods',JSON.stringify(['Projector','Projector_1','SetProjector','SetProjector_1','Update','Hide','Hide_1','Hide_2'].map(k=>({name:k,type:typeof algo[k],arity:typeof algo[k]==='function'?algo[k].length:null}))));
 algo.Projector_1(projector);algo.Update();algo.Hide_1();
 const handles=Object.keys(oc).filter(k=>k.startsWith('Handle_HLRBRep_Algo'));
 console.log('HLR algo handles',JSON.stringify(handles));
 if(!handles.length)throw Error('Missing typed Handle_HLRBRep_Algo constructor');
 const Handle=oc[handles.find(k=>k.endsWith('_1'))||handles[0]];
 const handle=new Handle(algo);
 const result=new oc.HLRBRep_HLRToShape(handle);
 const visible=result.VCompound();
 const hidden=result.HCompound();
 if(!visible||!hidden)throw Error('OCCT HLR output compounds absent');
 console.log('REAL OCCT BOX HLR COMPUTED',JSON.stringify({box:[40,30,20],visibleShapeType:visible.ShapeType(),hiddenShapeType:hidden.ShapeType(),observer:'default projector only',sourceMappingVerified:false,v5Ready:false}));
})().catch(e=>{console.error('REAL OCCT HLR FAILED:',e);process.exitCode=1;});
