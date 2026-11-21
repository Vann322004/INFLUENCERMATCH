import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
const source = readFileSync(new URL('../src/pages/crm/invitationDisplay.ts', import.meta.url), 'utf8').replace(/^import .*;\r?\n/gm, '').replace(/export /g, '');
const context = vm.createContext({});
vm.runInContext(stripTypeScriptTypes(source) + '\nglobalThis.display = invitationDisplay; globalThis.resend = emailResendState;', context);
const display = context.display;
const draft = {status:'NEGOTIATING',masterId:null,proposal:{revision:2,kind:'OFFER'},acceptedRevision:null};
test('resend remains visible with a reason when final, expired, rate limited or API fields are missing', () => {
  for (const [deal,delivery] of [[{...draft,status:'CONFIRMED'},{emailStatus:'CANCELLED',active:false}],[draft,{emailStatus:'SENT',active:false}],[draft,{emailStatus:'SENT',active:true,canResend:false}],[draft,{emailStatus:'SENT'}]]) {
    const state = context.resend(deal, delivery);
    assert.equal(state.visible,true); assert.equal(state.enabled,false); assert.ok(state.reason);
  }
  assert.equal(context.resend(draft,{emailStatus:'SENT',active:true,canResend:true}).enabled,true);
  assert.equal(context.resend(draft,{emailStatus:'MANUAL_REQUIRED',deliveryMethod:'MANUAL_LINK'}).visible,false);
  assert.equal(context.resend(draft,{emailStatus:'NOT_REQUESTED',deliveryMethod:'PORTAL_ONLY'}).visible,false);
});
test('saved proposal is distinct from a sent invitation', () => {
  const view = display(draft,null);
  assert.equal(view.dispatch,'Chưa gửi bản đề xuất này');
  assert.equal(view.action,'Xem lại & gửi');
});
test('unsent drafts use the backend planned route rather than guessing from missing delivery', () => {
  assert.equal(display({...draft,plannedContactChannel:'SYSTEM_EMAIL_OUTBOX'},null).route,'Email liên hệ');
  assert.equal(display({...draft,plannedContactChannel:'MANUAL_SOCIAL_LINK'},null).route,'Chia sẻ thủ công');
});
test('saved delivery method overrides recipient defaults and portal-only never claims email sent', () => {
  const emailOnly = display({...draft,masterId:'master'}, {deliveryMethod:'EMAIL_ONLY',emailStatus:'SENT'});
  assert.equal(emailOnly.route, 'Email liên hệ');
  const portalOnly = display({...draft,masterId:'master'}, {deliveryMethod:'PORTAL_ONLY',emailStatus:'NOT_REQUESTED',active:true});
  assert.equal(portalOnly.route, 'Thông báo Portal');
  assert.equal(portalOnly.dispatch, 'Đã tạo thông báo Portal');
  assert.equal(portalOnly.response, 'Chưa ghi nhận Creator đồng ý');
  assert.equal(display({...draft,availableDeliveryMethods:['EMAIL_ONLY','MANUAL_LINK']}, null).route, 'Brand chọn khi gửi · 2 cách');
});
test('manual delivery asks Brand to share; queued and sent never imply acceptance', () => {
  const manual = display(draft,{emailStatus:'MANUAL_REQUIRED',active:true});
  assert.equal(manual.route,'Chia sẻ thủ công');
  assert.equal(manual.action,'Chia sẻ lời mời');
  for (const emailStatus of ['QUEUED','PROCESSING','SENT']) {
    const view = display({...draft,masterId:'master'},{emailStatus,active:true});
    assert.equal(view.route,'Portal & email');
    assert.equal(view.response,'Chưa ghi nhận Creator đồng ý');
  }
});
test('failed and expired delivery show distinct recovery actions', () => {
  assert.equal(display(draft,{emailStatus:'FAILED',active:true,canRetry:true}).action,'Xử lý gửi lỗi');
  assert.equal(display(draft,{emailStatus:'SENT',active:false}).action,'Kiểm tra lời mời');
});
test('consent, counteroffer and confirmed deal override delivery actions', () => {
  assert.equal(display({...draft,acceptedRevision:2},{emailStatus:'SENT',active:false}).action,'Xác nhận hợp tác');
  assert.equal(display({...draft,proposal:{revision:3,kind:'COUNTEROFFER'}},null).action,'Xem đề xuất thay đổi');
  assert.equal(display({...draft,status:'CONFIRMED'},{emailStatus:'SENT',active:false}).action,'Xem thỏa thuận');
});
