import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';

function load(path, names) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8').replace(/^import .*;\r?\n/gm, '').replace(/export /g, '');
  const context = vm.createContext({ getAuthSessionId: () => 'session' });
  vm.runInContext(stripTypeScriptTypes(source) + '\nglobalThis.api = {' + names.join(',') + '};', context);
  return context.api;
}
const { proposalPayload } = load('../src/pages/crm/proposalForm.ts', ['proposalPayload']);
const { assessmentItems, contactContext } = load('../src/services/contactContext.ts', ['assessmentItems', 'contactContext']);
const { completedRuns, coveringRun, evaluatedCreatorIds } = load('../src/services/recommendationHistory.ts', ['completedRuns', 'coveringRun', 'evaluatedCreatorIds']);
const deal = { revision: 3, channels: [{ creatorId: 'one' }, { creatorId: 'two' }] };
test('contact picker allows only eligible evaluated creators from completed runs of this campaign', () => {
  const run = {id:'r',campaignId:'c',status:'COMPLETED',createdAt:'2026-11-21T00:00:00Z',scoringSnapshot:[{creatorId:'main',recommendationTier:'HISTORY_SUPPORTED'},{creatorId:'ref',recommendationTier:'LIMITED_HISTORY'},{creatorId:'bad',recommendationTier:'EXCLUDED'}],runMetadata:{evaluatedCreatorIds:['main','ref','omitted','excluded','bad']},excludedCandidates:[{creatorId:'excluded'}]};
  const runs = [run,{...run,id:'failed',status:'FAILED',scoringSnapshot:[{creatorId:'failed'}],runMetadata:{}},{...run,id:'other',campaignId:'other',scoringSnapshot:[{creatorId:'other'}],runMetadata:{}}];
  assert.deepEqual(Array.from(evaluatedCreatorIds(runs,'c')).sort(),['main','omitted','ref']);
  assert.deepEqual(Array.from(evaluatedCreatorIds([], 'c')),[]);
});
const unit = creatorId => ({ creatorId, contentType: 'Video', quantity: 1, dueAt: '2026-12-01T10:30', checklist: 'Show product\nInclude disclosure', maxRevisionRounds: 2 });
const form = () => ({ fee: 5000000, terms: 'Cooperation terms', units: [unit('one'), unit('two')] });

test('proposal preserves expected revision and maps Vietnam deadlines to an instant', () => {
  const result = proposalPayload(form(), deal);
  assert.equal(result.expectedRevision, 3);
  assert.equal(result.currency, 'VND');
  assert.equal(result.deliverables[0].dueAt, '2026-12-01T03:30:00.000Z');
});
test('proposal requires all grouped channels and rejects unrelated channels', () => {
  assert.throws(() => proposalPayload({ ...form(), units: [unit('one')] }, deal));
  assert.throws(() => proposalPayload({ ...form(), units: [unit('other'), unit('two')] }, deal));
});
test('proposal rejects invalid fees, quantities, deadlines and duplicate checklist entries', () => {
  for (const fee of [0, -1, NaN, 1.5]) assert.throws(() => proposalPayload({ ...form(), fee }, deal));
  for (const change of [{ quantity: 0 }, { quantity: 101 }, { quantity: 1.5 }, { dueAt: '' }, { maxRevisionRounds: 11 }, { checklist: 'Same\nSame' }]) {
    const values = form(); values.units[0] = { ...values.units[0], ...change };
    assert.throws(() => proposalPayload(values, deal));
  }
});
test('handoff retains independent group positions and hides unpublished provisional scores', () => {
  const rows = assessmentItems([{ creatorId: 'one', finalScore: 10 }, { creatorId: 'two', finalScore: 99 }], [{ creatorId: 'three', finalScore: 95 }]);
  assert.equal(rows[0].creatorId, 'one'); assert.equal(rows[0].position, 1);
  assert.equal(rows[1].position, 2); assert.equal(rows[2].position, 1);
  assert.equal(rows[2].score, null);
  const state = contactContext('campaign', ['two', 'two'], { runId: 'saved', items: rows });
  assert.equal(state.contactContext.sessionId, 'session');
  assert.equal(state.contactContext.creatorIds.length, 1);
  assert.equal(state.recommendationRunIntent, undefined);
});

test('viewing picks latest completed run and coverage never merges unrelated runs', () => {
  const run = (id, createdAt, ids, status = 'COMPLETED') => ({ id, campaignId: 'campaign', createdAt, status, scoringSnapshot: ids.map(creatorId => ({ creatorId })) });
  const rows = [run('older-full','2026-11-20T10:00:00',['a','b']),run('newer-partial','2026-11-21T10:00:00',['a']),run('latest-failure','2026-11-21T12:00:00',['a','b'],'FAILED')];
  assert.equal(completedRuns(rows,'campaign')[0].id,'newer-partial');
  assert.equal(coveringRun(rows,'campaign',['a','b']).id,'older-full');
  assert.equal(coveringRun(rows,'other',['a']),null);
  assert.equal(coveringRun([run('a','2026-11-20T10:00:00Z',['a']),run('b','2026-11-21T10:00:00Z',['b'])],'campaign',['a','b']),null);
});

test('history compares instants correctly when timestamps carry different offsets', () => {
  const rows = [{id:'later',campaignId:'c',status:'COMPLETED',createdAt:'2026-11-21T02:00:00+07:00',scoringSnapshot:[]},{id:'earlier',campaignId:'c',status:'COMPLETED',createdAt:'2026-11-20T18:59:59Z',scoringSnapshot:[]}];
  assert.equal(completedRuns(rows,'c')[0].id,'later');
});
test('persisted coverage includes evaluated channels omitted from top-N without fabricating a score', () => {
  const rows = [{id:'run',campaignId:'c',status:'COMPLETED',createdAt:'2026-11-21T00:00:00Z',scoringSnapshot:[{creatorId:'shown',finalScore:70}],runMetadata:{evaluatedCreatorIds:['shown','omitted']}}];
  assert.equal(coveringRun(rows,'c',['omitted']).id,'run');
  assert.equal(rows[0].scoringSnapshot.some(item=>item.creatorId==='omitted'),false);
});
