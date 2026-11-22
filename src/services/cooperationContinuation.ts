const key = 'im.pendingCooperationInvitation';
const targetKey = 'im.pendingCooperationTarget';
export interface CooperationTarget { creatorId: string; platform: string; username: string }
export const validCooperationToken = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
export function rememberCooperation(token: string) { if (validCooperationToken(token)) sessionStorage.setItem(key, token); }
export function pendingCooperation(): string | null { const token = sessionStorage.getItem(key); return validCooperationToken(token) ? token : null; }
export function rememberCooperationTarget(target: CooperationTarget) {
  if (target.creatorId && /^[A-Z_]{2,20}$/.test(target.platform)) sessionStorage.setItem(targetKey, JSON.stringify(target));
}
export function pendingCooperationTarget(): CooperationTarget | null {
  try {
    const target = JSON.parse(sessionStorage.getItem(targetKey) ?? 'null') as CooperationTarget | null;
    return target && typeof target.creatorId === 'string' && target.creatorId.length > 0
      && typeof target.platform === 'string' && /^[A-Z_]{2,20}$/.test(target.platform)
      && typeof target.username === 'string' ? target : null;
  } catch { return null; }
}
export function forgetCooperation() { sessionStorage.removeItem(key); sessionStorage.removeItem(targetKey); }
export const cooperationPath = () => '/cooperation-invitations';
