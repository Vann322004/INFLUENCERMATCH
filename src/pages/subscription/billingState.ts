export interface PaymentState { status: string }

export function quotaTotal(primary?: number | null, fallback?: number | null): number {
  return primary ?? fallback ?? 0;
}

/** URL parameters only trigger reconciliation. They never prove a payment was settled. */
export async function reconcilePayment<T extends PaymentState>(
  reference: string,
  request: (reference: string, signal: AbortSignal) => Promise<T>,
  signal: AbortSignal,
  wait: (signal: AbortSignal) => Promise<void> = (signal) => new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException('Aborted', 'AbortError')); return; }
    const abort = () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, 2000);
    signal.addEventListener('abort', abort, { once: true });
  }),
): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    const payment = await request(reference, signal);
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    if (payment.status !== 'PENDING' || attempt === 5) return payment;
    await wait(signal);
  }
}

export function subscriptionIsActive(status: string, expirationDate: string, now = new Date()): boolean {
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return status === 'ACTIVE' && expirationDate >= today;
}
