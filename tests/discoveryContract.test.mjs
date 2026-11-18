import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';

const source = readFileSync(new URL('../src/services/discoveryContract.ts', import.meta.url), 'utf8').replace('export function', 'function');
const context = vm.createContext({});
vm.runInContext(stripTypeScriptTypes(source) + '\nglobalThis.check = assertContextFilteredDiscovery;', context);

test('legacy broad/AI fallback results are not presented as campaign-filtered creators', () => {
  assert.throws(() => context.check({ content: [{ creatorId: 'salon', matchScore: 85 }] }));
  assert.throws(() => context.check({ content: [{ creatorId: 'home', aiScoreAvailable: false }] }));
});

test('current database-filtered results and an empty result set are accepted', () => {
  context.check({ content: [{ creatorId: 'skincare', aiScoreAvailable: false, discoveryPolicyVersion: 'context-db-v2' }] });
  context.check({ content: [] });
});

test('invalid or mixed-version data is rejected instead of merged with a catalogue fallback', () => {
  assert.throws(() => context.check(null));
  assert.throws(() => context.check({ items: [] }));
  assert.throws(() => context.check({ content: [null] }));
});

test('default discovery sorting preserves vector retrieval order rather than client match percentages', () => {
  const code = readFileSync(new URL('../src/pages/creator/components/discovery/discoveryFilters.ts', import.meta.url), 'utf8')
    .replace(/^import[^\n]*\n/gm, '').replace(/export /g, '');
  const sandbox = vm.createContext({});
  vm.runInContext(stripTypeScriptTypes(code) + '\nglobalThis.filter = filterDiscoveryCreators;', sandbox);
  const creators = [{ id: 'vector-best', matchRate: 0 }, { id: 'second', matchRate: 99 }];
  const results = sandbox.filter(creators, { search: '', platform: 'all', category: 'all',
    followerTier: 'all', engagementTier: 'all', priceTier: 'all', location: 'all', sortBy: 'match' });
  assert.deepEqual(Array.from(results, row => row.id), ['vector-best', 'second']);
});
