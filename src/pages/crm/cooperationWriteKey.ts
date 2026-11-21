import { getAuthSessionId } from '../../services/authSession';
const volatileKeys = new Map<string, string>();
export async function writeKey(scope: string, body: object) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(body)));
  const hash = [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
  const name = 'im_deal_write:' + getAuthSessionId() + ':' + scope + ':' + hash;
  let key = volatileKeys.get(name);
  try { key = sessionStorage.getItem(name) || key; } catch { /* Optional storage. */ }
  if (!key) { key = crypto.randomUUID(); volatileKeys.set(name, key); try { sessionStorage.setItem(name, key); } catch { /* Memory preserves retries in this tab. */ } }
  return key;
}
