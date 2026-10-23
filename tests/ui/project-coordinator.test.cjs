'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  FORMAT, VERSION, newProject, validateProject,
  importProject, exportProject, createCoordinator
} = require('../../project/project-coordinator.cjs');

const point = (id = 'P1') => ({
  id, kind: 'point', projections: {V: [id + '_V'], H: [id + '_H'], W: [id + '_W']},
  spatialId: id + '_3D'
});
const condition = (id = 'c1') => ({
  id, objectId: 'P1', sourceCandidateId: 'cand1', confirmed: false,
  value: {type: 'coordinate', units: 'mm', xyz: [12, 8, 5]}
});
const make = () => createCoordinator(newProject({id: 'project1', task: 'projection'}));

test('new projects start with no image, no false history, no solve result and supported version', () => {
  const p = newProject({id: 'project1'});
  assert.equal(p.format, FORMAT);
  assert.equal(p.version, VERSION);
  assert.equal(p.revision, 0);
  assert.deepEqual(p.conditions, []);
  assert.equal(p.source.imageId, null);
  assert.equal(validateProject(p).ok, true);
  assert.equal(Object.hasOwn(p, 'solveResult'), false);
  assert.equal(Object.hasOwn(p, 'verified'), false);
});

test('selecting an object in V, H, W or 3D returns the same stable object', () => {
  const c = make();
  c.putObject(point());
  for (const [view, representation] of [
    ['V', 'P1_V'], ['H', 'P1_H'], ['W', 'P1_W'], ['3D', 'P1_3D']
  ]) {
    c.selectRepresentation(view, representation);
    assert.equal(c.snapshot().view.selectedObjectId, 'P1');
    assert.equal(c.correspondence().projections.H[0], 'P1_H');
  }
  assert.equal(c.snapshot().revision, 1, 'selection does not rerun mathematics');
  c.selectRepresentation('V', 'unknown');
  assert.equal(c.correspondence(), null);
});

test('duplicates, unknown objects, nonfinite data and nonserializable values fail closed', () => {
  const c = make();
  c.putObject(point());
  assert.throws(() => c.putObject({...point('P2'), projections: {
    V: ['P1_V'], H: ['P2_H'], W: ['P2_W']
  }}), /视图图元归属重复/);
  assert.equal(c.snapshot().objects.length, 1);
  assert.throws(() => c.putCondition({...condition(), value: {distance: Infinity}}));
  assert.throws(() => c.putCondition({...condition(), objectId: 'MISSING'}), /条件或来源信息无效/);
  assert.equal(c.snapshot().revision, 1);
});

test('candidate conditions must be explicitly confirmed, and image geometry revokes confirmations', () => {
  const c = make();
  c.putObject(point());
  c.putCondition(condition());
  assert.equal(c.snapshot().conditions[0].confirmed, false);
  c.confirmCondition('c1');
  assert.equal(c.snapshot().conditions[0].confirmed, true);
  c.setImage('img42');
  assert.equal(c.snapshot().conditions[0].confirmed, false);
  c.confirmCondition('c1');
  c.setImageGeometry({rotationDeg: 90, calibration: {mmPerPixel: .12, confirmedBy: 'user1'}});
  assert.equal(c.snapshot().conditions[0].confirmed, false);
  assert.equal(c.snapshot().source.calibration.mmPerPixel, .12);
});

test('view zoom and spatial camera changes do not change source coordinates or invalidate solver revision', () => {
  const c = make();
  c.putObject(point());
  c.putCondition(condition());
  const before = c.snapshot().revision;
  c.setViewport({zoom: 3.5, panX: -140, panY: 24});
  c.setCamera({yaw: 70, pitch: 31});
  c.setOverlays({projections: false});
  c.setMode('3d');
  assert.equal(c.snapshot().revision, before);
  assert.deepEqual(c.snapshot().conditions[0].value.xyz, [12, 8, 5]);
  assert.equal(c.snapshot().view.camera.yaw, 70);
  assert.equal(c.snapshot().view.overlays.guides, true);
});

test('only canonical solver adapter may provide result and input edits stop old playback', () => {
  const c = make();
  const actions = [], listeners = [];
  let result = null;
  const adapter = {
    loadInputs: x => actions.push(['load', x.revision, x.conditions.length]),
    readSnapshot: () => result,
    subscribe: cb => { listeners.push(cb); return () => actions.push(['unsubscribe']); },
    invalidate: () => actions.push(['invalidate']),
    stopPlayback: () => actions.push(['stop']),
    dispose: () => actions.push(['dispose'])
  };
  c.attachSolver(adapter);
  assert.equal(c.canExport(), false);
  c.putObject(point());
  c.putCondition(condition());
  const version = c.snapshot().revision;
  result = {projectId: 'project1', inputRevision: version, verified: true, status: 'unique'};
  assert.equal(c.canExport(), true);
  c.confirmCondition('c1');
  assert.equal(c.canExport(), false);
  assert.deepEqual(actions.slice(-3), [
    ['stop'], ['invalidate'], ['load', version + 1, 1]
  ]);
  result = {projectId: 'project1', inputRevision: version + 1, verified: false};
  assert.equal(c.currentResult(), null);
  c.dispose();
  assert.deepEqual(actions.slice(-2), [['unsubscribe'], ['dispose']]);
});

test('undo and redo never restore old solver results or earlier valid math revisions', () => {
  const c = make();
  c.putObject(point());
  c.putCondition(condition());
  const rev = c.snapshot().revision;
  c.undo();
  assert.equal(c.snapshot().revision, rev + 1);
  assert.equal(c.snapshot().conditions.length, 0);
  c.redo();
  assert.equal(c.snapshot().revision, rev + 2);
  assert.equal(c.snapshot().conditions.length, 1);
  assert.equal(c.canExport(), false);
});

test('project files roundtrip data but reject forged verification claims and unsupported versions', () => {
  const c = make();
  c.putObject(point());
  c.putCondition(condition());
  const exported = exportProject(c.snapshot());
  assert.deepEqual(importProject(exported), c.snapshot());
  for (const malicious of [
    {...c.snapshot(), verified: true},
    {...c.snapshot(), solveResult: {status: 'unique'}},
    {...c.snapshot(), version: 999},
    {...c.snapshot(), view: {...c.snapshot().view, selectedObjectId: 'forged'}}
  ]) {
    assert.throws(() => importProject(JSON.stringify(malicious)));
  }
  assert.throws(() => importProject('{invalid json}'), /JSON/);
  assert.throws(() => importProject(' '.repeat(2000001)), /过大/);
});

test('deleted objects clear their conditions and selected identity', () => {
  const c = make();
  c.putObject(point());
  c.putCondition(condition());
  c.selectObject('P1');
  c.deleteObject('P1');
  assert.deepEqual(c.snapshot().objects, []);
  assert.deepEqual(c.snapshot().conditions, []);
  assert.equal(c.snapshot().view.selectedObjectId, null);
});

test('saved project data cannot restore a verified claim; source image bytes remain outside JSON', () => {
  const c = make();
  c.setImage('imgReference');
  const file = exportProject(c.snapshot());
  assert.ok(file.includes('imgReference'));
  assert.ok(!file.includes('data:image/'));
  assert.ok(!file.includes('isVerified'));
  assert.equal(createCoordinator(importProject(file)).canExport(), false);
});
