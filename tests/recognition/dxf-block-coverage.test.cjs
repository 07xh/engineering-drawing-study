'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {extractDxfForReview}=require('../../recognition/offline-dxf-review.cjs');
const pair=(k,v)=>String(k)+'\n'+String(v)+'\n';
const sec=(name,body)=>pair(0,'SECTION')+pair(2,name)+body+pair(0,'ENDSEC');
const entity=(kind,props)=>pair(0,kind)+props.map(([k,v])=>pair(k,v)).join('');
const line=()=>entity('LINE',[[8,'given'],[10,0],[20,0],[11,60],[21,0]]);
const base=part=>Buffer.from(
 sec('HEADER',pair(9,'$INSUNITS')+pair(70,4))+
 part+sec('ENTITIES',line())+pair(0,'EOF'),'utf8');
test('08 real CAD model may reference BLOCKS not present in ENTITIES: report incompleteness',()=>{
 const blocks=sec('BLOCKS',
  entity('BLOCK',[[2,'PROJECTION-LABEL'],[70,0],[10,0],[20,0]])+
  line()+entity('ENDBLK',[[8,'0']]));
 const out=extractDxfForReview(base(blocks));
 assert.equal(out.entities.length,1,'block member must not masquerade as independent given');
 assert.equal(out.blockCoverage.definitionCount,1);
 assert.equal(out.blockCoverage.memberEntityCount,1);
 assert.deepEqual(out.blockCoverage.definitions[0].memberEntityTypes,['LINE']);
 assert.equal(out.blockCoverage.definitions[0].name,'PROJECTION-LABEL');
 assert.equal(out.blockCoverage.sourceBlockGeometryUnexpanded,true);
 assert.equal(out.blockCoverage.cadEntityExtractionComplete,false);
 assert.equal(out.audit.unexpandedCADBlockEntityCount,1);
 assert.equal(out.audit.allRequiredCadEntitiesSupported,false);
 assert.equal(out.audit.allRequiredBlockGeometryExpanded,false);
 assert.equal(out.audit.readyForM3,false);
 assert.equal(out.audit.readyForV5,false);
});
test('09 even unreferenced block cannot be silently accepted as all CAD geometry decoded',()=>{
 const blocks=sec('BLOCKS',
  entity('BLOCK',[[2,'*Model_Space'],[70,0],[10,0],[20,0]])+
  entity('LINE',[[10,5],[20,0],[11,20],[21,0]])+
  entity('ENDBLK',[]));
 const out=extractDxfForReview(base(blocks));
 assert.equal(out.audit.allRequiredCadEntitiesSupported,false);
 assert.equal(out.blockCoverage.memberEntityCount,1);
 assert.equal(out.source.answerIsolationVerified,false);
});
test('08 INSERT references must be isolated until BLOCK transform and spatial ownership verified',()=>{
 const bytes=Buffer.from(
  sec('HEADER',pair(9,'$INSUNITS')+pair(70,4))+
  sec('BLOCKS',entity('BLOCK',[[2,'GEOMETRY']])+
   line()+entity('ENDBLK',[]))+
  sec('ENTITIES',line()+entity('INSERT',[[2,'GEOMETRY'],[10,0],[20,0]]))+
  pair(0,'EOF'));
 const out=extractDxfForReview(bytes);
 assert.equal(out.audit.unsupportedCount,1);
 assert.equal(out.blockCoverage.insertReferenceCount,1);
 assert.equal(out.blockCoverage.blockGeometryExpansionVerified,false);
 assert.equal(out.audit.insertionReferencesNeedingReview,1);
 assert.equal(out.audit.allRequiredCadEntitiesSupported,false);
 assert.equal(out.entities[1].status,'unsupported');
 assert.equal(out.entities[1].geometry,null);
 assert.equal(out.audit.readyForConstructionIntent,false);
});
test('09 fully empty block table does not forge a certified 3D model',()=>{
 const out=extractDxfForReview(base(sec('BLOCKS','')));
 assert.equal(out.blockCoverage.definitionCount,0);
 assert.equal(out.blockCoverage.memberEntityCount,0);
 assert.equal(out.blockCoverage.sourceBlockGeometryUnexpanded,false);
 assert.equal(out.audit.allRequiredCadEntitiesSupported,true);
 assert.equal(out.blockCoverage.cadEntityExtractionComplete,false);
 assert.equal(out.audit.modelMmConfirmed,false);
 assert.equal(out.audit.readyForM3,false);
});
test('09 malformed nested or orphan BLOCK definitions reject the whole imported DXF',()=>{
 const broken1=sec('BLOCKS',entity('BLOCK',[[2,'A']])+
  entity('BLOCK',[[2,'B']])+entity('ENDBLK',[]));
 const broken2=sec('BLOCKS',entity('ENDBLK',[]));
 const broken3=sec('BLOCKS',entity('BLOCK',[[2,'A']])+line());
 for(const broken of [broken1,broken2,broken3])
  assert.throws(()=>extractDxfForReview(base(broken)),/BLOCK|ENDBLK/);
});
