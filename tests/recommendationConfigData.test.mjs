import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

const source = stripTypeScriptTypes(await readFile(new URL('../src/pages/admin/scoring/configDisplay.ts', import.meta.url), 'utf8'));
const module = new vm.SourceTextModule(source);
await module.link(() => { throw new Error('Unexpected dependency'); });
await module.evaluate();
const { numberLabel, percentLabel, textLabel } = module.namespace;

test('missing configuration fields never become frozen sample values', () => {
  assert.equal(numberLabel(undefined), 'Chưa cung cấp');
  assert.equal(numberLabel(null), 'Chưa cung cấp');
  assert.equal(numberLabel(NaN), 'Chưa cung cấp');
  assert.equal(percentLabel(undefined), '—');
  assert.equal(textLabel(undefined), 'Chưa cung cấp');
});

test('real zero values remain visible and percentages follow the API value', () => {
  assert.equal(numberLabel(0), '0');
  assert.equal(percentLabel(0), '0%');
  assert.equal(percentLabel(0.42), '42%');
  assert.equal(percentLabel(0.63), '63%');
});
