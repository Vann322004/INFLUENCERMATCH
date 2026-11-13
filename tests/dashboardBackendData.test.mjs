import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

async function service(file, name, get) {
  const context = vm.createContext({ console, Date, Math });
  const client = new vm.SyntheticModule(['default'], function () {
    this.setExport('default', { get });
  }, { context });
  const source = stripTypeScriptTypes(await readFile(new URL(`../src/services/api/${file}.ts`, import.meta.url), 'utf8'));
  const module = new vm.SourceTextModule(source, { context });
  await module.link(specifier => {
    assert.equal(specifier, '../apiClient');
    return client;
  });
  await module.evaluate();
  return module.namespace[name];
}

test('dashboard accepts a real empty claim queue without sample records', async () => {
  const api = await service('claimService', 'claimService', async () => ({ data: { data: { items: [], totalElements: 0 } } }));
  const page = await api.getClaims({ status: 'PENDING' }, { requireBackend: true });
  assert.equal(page.items.length, 0);
  assert.equal(page.totalElements, 0);
});

test('dashboard claim failures propagate instead of returning sample records', async () => {
  const error = new Error('backend unavailable');
  const api = await service('claimService', 'claimService', async () => { throw error; });
  await assert.rejects(api.getClaims({}, { requireBackend: true }), error);
});

test('dashboard rejects malformed claim responses', async () => {
  const api = await service('claimService', 'claimService', async () => ({ data: { data: {} } }));
  await assert.rejects(api.getClaims({}, { requireBackend: true }), /không hợp lệ/);
});

test('dashboard distinguishes an empty quality queue from backend failure', async () => {
  const empty = await service('adminService', 'adminService', async () => ({ data: { data: { items: [] } } }));
  assert.equal((await empty.getPendingClaims({}, { requireBackend: true })).length, 0);
  const error = new Error('quality unavailable');
  const failed = await service('adminService', 'adminService', async () => { throw error; });
  await assert.rejects(failed.getPendingClaims({}, { requireBackend: true }), error);
});
