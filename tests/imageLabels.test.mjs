import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('image controls keep Vietnamese diacritics in UTF-8 source', () => {
  const profile = readFileSync(new URL('../src/pages/brand/BrandProfilePage.tsx', import.meta.url), 'utf8');
  assert.ok(profile.includes('label="Đổi ảnh bìa"'));
  assert.ok(profile.includes('label="Đổi logo"'));
  assert.ok(profile.includes('alt="Ảnh bìa thương hiệu"'));
  const creator = readFileSync(new URL('../src/pages/creator/portal/CreatorPortalPage.tsx', import.meta.url), 'utf8');
  assert.ok(creator.includes('label="Đổi ảnh"'));
  for (const text of [profile, creator]) {
    assert.ok(!text.includes('??i'));
    assert.ok(!text.includes('\uFFFD'));
  }
});
