import { getStoredUser } from './authSession';
const key = () => `im_campaign:${getStoredUser()?.id ?? 'anonymous'}`;
const pointers = new Map<string, string>();
export const activeCampaignId = () => { try { return sessionStorage.getItem(key()) || pointers.get(key()) || ''; } catch { return pointers.get(key()) || ''; } };
export function rememberCampaign(id: string) {
  pointers.set(key(), id);
  try { sessionStorage.setItem(key(), id); sessionStorage.setItem('current_campaign_id', id); } catch { /* Optional navigation storage must not turn a successful API write into a failed save. */ }
}
export function forgetCampaign() {
  pointers.delete(key());
  try { sessionStorage.removeItem(key()); sessionStorage.removeItem('current_campaign_id'); } catch { /* Navigation pointers only. */ }
}
export function campaignPath(path: string, id: string, extra: Record<string, string> = {}) {
  const params = new URLSearchParams(extra); if (id) params.set('campaignId', id);
  return `${path}${params.size ? '?' + params : ''}`;
}
