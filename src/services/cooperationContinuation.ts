const key = 'im.pendingCooperationInvitation';
export const validCooperationToken = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
export function rememberCooperation(token: string) { if (validCooperationToken(token)) sessionStorage.setItem(key, token); }
export function pendingCooperation(): string | null { const token = sessionStorage.getItem(key); return validCooperationToken(token) ? token : null; }
export function forgetCooperation() { sessionStorage.removeItem(key); }
export const cooperationPath = (token: string) => '/cooperation-invitations?token=' + encodeURIComponent(token);
