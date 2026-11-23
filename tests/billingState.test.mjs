import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const source = readFileSync(new URL('../src/pages/subscription/billingState.ts', import.meta.url), 'utf8');
const outputText = stripTypeScriptTypes(source);
const { getPaymentReturn, reconcilePayment } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

test('PayOS return preserves large order codes as strings', () => {
  assert.deepEqual(getPaymentReturn(new URLSearchParams('status=PAID&orderCode=17954999999999999&code=00')), {
    reference: '17954999999999999', cancelled: false,
  });
});

test('PayOS cancellation and legacy VNPay returns are recognized', () => {
  assert.deepEqual(getPaymentReturn(new URLSearchParams('payment=cancelled&cancel=true&orderCode=123')), { reference: '123', cancelled: true });
  assert.deepEqual(getPaymentReturn(new URLSearchParams('payment=success&txnRef=VNP123')), { reference: 'VNP123', cancelled: false });
  assert.equal(getPaymentReturn(new URLSearchParams('tab=history')), null);
  assert.equal(getPaymentReturn(new URLSearchParams('payment=cancelled')).reference, null);
});

test('reconciliation waits for server settlement', async () => {
  const statuses = ['PENDING', 'PENDING', 'PAID'];
  let calls = 0;
  const result = await reconcilePayment('123', async ref => {
    assert.equal(ref, '123');
    return { status: statuses[calls++] };
  }, new AbortController().signal, async () => {});
  assert.equal(result.status, 'PAID');
  assert.equal(calls, 3);
});

test('an unconfirmed payment stays pending after bounded polling', async () => {
  let calls = 0;
  const result = await reconcilePayment('123', async () => {
    calls++;
    return { status: 'PENDING' };
  }, new AbortController().signal, async () => {});
  assert.equal(result.status, 'PENDING');
  assert.equal(calls, 6);
});
