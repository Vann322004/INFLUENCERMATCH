const SKIP_KEY_PREFIX = 'im_brand_onboarding_skipped:';
const skippedForCurrentPage = new Set<string>();

export function hasDeferredBrandOnboarding(userId: string): boolean {
  try {
    return localStorage.getItem(SKIP_KEY_PREFIX + userId) === '1';
  } catch {
    return skippedForCurrentPage.has(userId);
  }
}

export function deferBrandOnboarding(userId: string): void {
  try {
    localStorage.setItem(SKIP_KEY_PREFIX + userId, '1');
  } catch {
    skippedForCurrentPage.add(userId);
  }
}
