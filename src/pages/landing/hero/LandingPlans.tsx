import { useCallback, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import { useAsyncResource } from '../../../hooks/useAsyncResource';
import { subscriptionService } from '../../../services/api/subscriptionService';
import { getAccessToken, getAuthSessionId, getStoredUser, subscribeAuthSession } from '../../../services/authSession';
import type { PlanResponse } from '../../../types/api/subscription.types';

const authScope = () => JSON.stringify([getAuthSessionId(), !!getAccessToken(), getStoredUser()?.permissions]);
const quota = (value: number) => Number.isSafeInteger(value) && value >= 0 ? value.toLocaleString('vi-VN') : 'Chưa công bố';
const price = (plan: PlanResponse) => {
  if (typeof plan.price !== 'number' || !Number.isFinite(plan.price) || plan.price < 0 || !plan.currency) return 'Chưa công bố';
  if (plan.price === 0) return 'Miễn phí';
  try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: plan.currency, maximumFractionDigits: 2 }).format(plan.price); }
  catch { return 'Chưa công bố'; }
};

async function loadPlans(scope: string): Promise<PlanResponse[]> {
  const plans: PlanResponse[] = [];
  for (let page = 0; ; page++) {
    if (authScope() !== scope) throw new Error('Phiên đăng nhập đã thay đổi.');
    const response = await subscriptionService.getPlansPage(page, 50);
    if (authScope() !== scope) throw new Error('Phiên đăng nhập đã thay đổi.');
    for (const plan of response.items) {
      if (!plan || typeof plan.id !== 'string' || typeof plan.planName !== 'string' || typeof plan.status !== 'string') throw new Error('Dữ liệu gói dịch vụ không hợp lệ.');
      if (plan.status === 'ACTIVE') plans.push(plan);
    }
    if (page + 1 >= response.totalPages) return plans;
  }
}

export default function LandingPlans() {
  const scope = useSyncExternalStore(subscribeAuthSession, authScope);
  const signedIn = !!getAccessToken();
  const permissions: string[] = getStoredUser()?.permissions ?? [];
  const canView = signedIn && permissions.some(value => ['VIEW_PLAN', 'MANAGE_PLAN'].includes(value));
  const canSubscribe = permissions.includes('MANAGE_OWN_SUBSCRIPTION');
  const query = useCallback(() => loadPlans(scope), [scope]);
  const plans = useAsyncResource(query, canView);

  return (
    <section id="plans" className="nl-pricing" data-scroll-section aria-labelledby="landing-plans-title">
      <header className="nl-pricing-heading">
        <h2 id="landing-plans-title">Chọn gói phù hợp<br />với thương hiệu của bạn.</h2>
        <p>Linh hoạt theo nhu cầu và quy mô chiến dịch.</p>
      </header>
      {!canView ? (
        <div className={`nl-pricing-state${signedIn ? '' : ' nl-pricing-entry'}`}>
          {signedIn && <h3>Chưa thể xem gói dịch vụ</h3>}
          <p>{signedIn ? 'Tài khoản hiện tại chưa có quyền xem danh mục gói dịch vụ.' : 'Đăng nhập để xem giá và hạn mức, hoặc tạo tài khoản thương hiệu để bắt đầu.'}</p>
          {!signedIn && <div className="nl-pricing-state-actions"><Link to="/login" className="nl-btn fill">Đăng nhập xem gói</Link><Link to="/register" className="nl-btn ghost">Đăng ký thương hiệu</Link></div>}
        </div>
      ) : plans.status === 'loading' ? (
        <div className="nl-pricing-state" role="status" aria-live="polite">Đang tải các gói dịch vụ…</div>
      ) : plans.status === 'error' ? (
        <div className="nl-pricing-state" role="alert"><h3>Chưa tải được gói dịch vụ</h3><p>Vui lòng thử lại để xem giá và hạn mức hiện tại.</p><button type="button" className="nl-btn ghost" onClick={() => void plans.reload()}>Thử lại</button></div>
      ) : !plans.data?.length ? (
        <div className="nl-pricing-state"><h3>Chưa có gói dịch vụ đang mở đăng ký</h3><p>Danh mục sẽ hiển thị tại đây khi có gói được cung cấp.</p></div>
      ) : (
        <div className="nl-pricing-grid">{plans.data.map(plan => (
          <article className="nl-price-card" key={plan.id}>
            <h3>{plan.planName}</h3>
            {plan.description && <p className="nl-price-description">{plan.description}</p>}
            <div className="nl-price-amount">{price(plan)}</div>
            <p className="nl-price-period">{Number.isSafeInteger(plan.durationDays) && plan.durationDays > 0 ? `Chu kỳ ${plan.durationDays.toLocaleString('vi-VN')} ngày` : 'Chưa công bố thời hạn'}</p>
            <dl><div><dt>Hạn mức chiến dịch</dt><dd>{quota(plan.campaignQuota)}</dd></div><div><dt>Lượt chạy gợi ý</dt><dd>{quota(plan.recommendationQuota)}</dd></div><div><dt>Lượt cập nhật dữ liệu</dt><dd>{quota(plan.refreshQuota)}</dd></div></dl>
            <p className="nl-price-quota-note">Hạn mức theo chu kỳ của gói.</p>
            {canSubscribe ? <Link to="/subscription" className="nl-btn fill">Xem và đăng ký gói</Link> : permissions.includes('MANAGE_PLAN') ? <Link to="/admin/subscriptions" className="nl-btn ghost">Quản lý gói</Link> : <p className="nl-price-quota-note">Tài khoản hiện tại chưa có quyền đăng ký gói.</p>}
          </article>
        ))}</div>
      )}
    </section>
  );
}
