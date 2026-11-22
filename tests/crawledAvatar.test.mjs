import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';

const source = readFileSync(new URL('../src/services/crawledMedia.ts', import.meta.url), 'utf8').replace(/export /g, '');
const context = vm.createContext({});
vm.runInContext(stripTypeScriptTypes(source) + '\nglobalThis.merge = mergeCrawledAvatar;', context);
const previous = { status: 'success', platform: 'TIKTOK', username: '@alice', author_id: '123', avatar_url: 'https://cdn/old' };

test('recrawl keeps the old avatar when the same channel has no new image', () => {
  assert.equal(context.merge({ ...previous, username: 'ALICE', avatar_url: '' }, previous).avatar_url, previous.avatar_url);
});

test('a new image has the old same-channel image available as a load-error fallback', () => {
  const result = context.merge({ ...previous, avatar_url: 'https://cloud/new' }, previous);
  assert.equal(result.avatar_url, 'https://cloud/new');
  assert.equal(result.avatar_fallback_url, 'https://cdn/old');
});

test('never reuses an image belonging to a different username, platform or author ID', () => {
  for (const changes of [{ username: 'bob' }, { platform: 'INSTAGRAM' }, { author_id: 'other-author' }]) {
    const result = context.merge({ ...previous, ...changes, avatar_url: undefined }, previous);
    assert.equal(result.avatar_url, undefined);
    assert.equal(result.avatar_fallback_url, undefined);
  }
});

test('accepts either crawler avatar naming convention', () => {
  assert.equal(context.merge({ ...previous, avatar_url: '', avatarUrl: 'https://cdn/camel' }).avatar_url, 'https://cdn/camel');
});
