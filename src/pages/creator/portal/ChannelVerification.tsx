import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Empty, Pagination, Space, Spin, Tag, Typography } from 'antd';
import { useSearchParams } from 'react-router-dom';
import { claimService } from '../../../services/api/claimService';
import {
  channelVerificationService as verification,
  type ConnectionOption, type LinkedChannel, type OAuthFlow, type OAuthPlatform, type OAuthSession,
} from '../../../services/api/channelVerificationService';
import { getAuthSessionId, getErrorMessage } from '../../../services/apiClient';
import type { ClaimResponse, ClaimStatus } from '../../../types/api/claim.types';
import ManualChannelClaim, { httpUrl } from './ManualChannelClaim';

const storageKey = 'creator.channel-oauth';
const claimLabels: Record<ClaimStatus, { label: string; color: string }> = {
  PENDING: { label: 'Chờ duyệt', color: 'warning' },
  APPROVED: { label: 'Đã duyệt', color: 'success' },
  REJECTED: { label: 'Từ chối', color: 'error' },
  REVOKED: { label: 'Đã thu hồi', color: 'default' },
};
const matchLabels = {
  AVAILABLE: 'Có thể liên kết',
  ALREADY_LINKED: 'Đã liên kết với bạn',
  UNMATCHED: 'Chưa khớp mã kênh trong hệ thống',
  UNAVAILABLE: 'Không thể liên kết do quyền sở hữu hoặc điều kiện kênh',
};

interface PendingOAuth {
  id: string;
  expiresAt: string;
  authSessionId: string;
  flow: OAuthFlow;
}

function readPendingOAuth(): PendingOAuth | null {
  try {
    const pending = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null') as PendingOAuth | null;
    return pending?.authSessionId === getAuthSessionId() && typeof pending.id === 'string'
        && pending.id && Number.isFinite(Date.parse(pending.expiresAt))
        && ['FACEBOOK_LOGIN', 'INSTAGRAM_LOGIN', 'TIKTOK_LOGIN'].includes(pending.flow)
      ? pending : null;
  } catch {
    return null;
  }
}

function getConsentUrl(raw: string, option: ConnectionOption) {
  const directInstagram = option.oauthFlow === 'INSTAGRAM_LOGIN';
  const tiktok = option.oauthFlow === 'TIKTOK_LOGIN';
  const provider = tiktok ? 'https://www.tiktok.com' : directInstagram ? 'https://www.instagram.com' : 'https://www.facebook.com';
  const path = '/api/v1/integrations/' + (tiktok ? 'tiktok' : directInstagram ? 'instagram' : 'meta') + '/callback';
  const url = new URL(raw);
  const callback = new URL(url.searchParams.get('redirect_uri') ?? '');
  if (url.origin !== provider || url.username || url.password
      || callback.href !== new URL(path, window.location.origin).href) {
    throw new Error('Địa chỉ chuyển hướng OAuth chưa khớp với trang hiện tại.');
  }
  return url.href;
}

function optionLabel(option: ConnectionOption) {
  if (option.platform === 'TIKTOK') return 'TikTok Sandbox';
  if (option.platform === 'FACEBOOK') return 'Facebook Page';
  return option.oauthFlow === 'INSTAGRAM_LOGIN' ? 'Instagram Professional' : 'Instagram qua Facebook Page';
}

function ClaimHistory() {
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<{ items: ClaimResponse[]; totalElements: number } | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setResult(null);
    setError('');
    claimService.getMyClaims(page, controller.signal)
      .then(data => { if (!controller.signal.aborted) setResult(data); })
      .catch(cause => {
        if (!controller.signal.aborted) setError(getErrorMessage(cause, 'Không tải được yêu cầu nhận kênh.'));
      });
    return () => controller.abort();
  }, [page, retry]);

  return (
    <Card title="Yêu cầu nhận kênh" className="creator-section-card"
      extra={<Button onClick={() => setRetry(value => value + 1)}>Tải lại</Button>}>
      {error ? <Alert type="error" showIcon title={error} /> : !result ? <Spin /> :
        result.items.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa gửi yêu cầu." /> :
          <Space orientation="vertical" style={{ width: '100%' }}>
            {result.items.map(claim => <div key={claim.id} className="creator-mini-row">
              <Space orientation="vertical" size={4} style={{ overflowWrap: 'anywhere' }}>
                <span>{claim.creatorName || claim.creatorHandle || 'Mã kênh: ' + claim.creatorId}</span>
                {claim.submittedAt && <Typography.Text type="secondary">
                  {new Date(claim.submittedAt).toLocaleString('vi-VN')}
                </Typography.Text>}
                {claim.reason && <span>Lý do: {claim.reason}</span>}
              </Space>
              <Tag color={claimLabels[claim.status].color}>{claimLabels[claim.status].label}</Tag>
            </div>)}
            <Pagination current={page + 1} total={result.totalElements} pageSize={10} showSizeChanger={false}
              hideOnSinglePage onChange={value => setPage(value - 1)} />
          </Space>}
    </Card>
  );
}

interface Props {
  canVerify: boolean;
  canViewClaims: boolean;
  linked: LinkedChannel[] | null;
  linkedError: string;
  reloadLinked: (signal?: AbortSignal) => Promise<LinkedChannel[] | null>;
}

export default function ChannelVerification({ canVerify, canViewClaims, linked, linkedError, reloadLinked }: Props) {
  const [params, setParams] = useSearchParams();
  const [options, setOptions] = useState<ConnectionOption[] | null>(null);
  const [optionsError, setOptionsError] = useState('');
  const [optionsRetry, setOptionsRetry] = useState(0);
  const [pending, setPending] = useState(readPendingOAuth);
  const [returnHint, setReturnHint] = useState(() => params.get('oauth'));
  const [session, setSession] = useState<OAuthSession | null>(null);
  const [checking, setChecking] = useState(false);
  const [statusRetry, setStatusRetry] = useState(0);
  const [working, setWorking] = useState('');
  const busy = useRef(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [manual, setManual] = useState<{ platform?: OAuthPlatform; query?: string } | null>(null);
  const [historyVersion, setHistoryVersion] = useState(0);

  useEffect(() => {
    const returned = ['return', 'cancelled', 'conflict'].includes(params.get('oauth') ?? '');
    const openClaim = params.get('claim') === 'new';
    if (!returned && !openClaim) return;
    if (returned && !readPendingOAuth()) setError('Không tìm thấy phiên xác minh của tài khoản này. Hãy bắt đầu lại.');
    if (openClaim && canVerify) setManual({});
    const nextParams = new URLSearchParams(params);
    if (returned) nextParams.delete('oauth');
    if (openClaim) nextParams.delete('claim');
    setParams(nextParams, { replace: true });
  }, [canVerify, params, setParams]);

  useEffect(() => {
    if (!canVerify) return;
    const controller = new AbortController();
    setOptionsError('');
    verification.options(controller.signal)
      .then(items => { if (!controller.signal.aborted) setOptions(items); })
      .catch(cause => {
        if (!controller.signal.aborted) setOptionsError(getErrorMessage(cause, 'Không tải được phương thức xác minh.'));
      });
    return () => controller.abort();
  }, [canVerify, optionsRetry]);

  function clearPending() {
    sessionStorage.removeItem(storageKey);
    setPending(null);
    setReturnHint(null);
    setSession(null);
    setChecking(false);
  }

  useEffect(() => {
    if (!canVerify || !pending) return;
    const controller = new AbortController();
    setChecking(true);
    // Let the BE report COMPLETED even if the initial consent window has since expired.
    verification.readSession(pending.id, pending.flow, controller.signal)
      .then(async result => {
        if (controller.signal.aborted || pending.authSessionId !== getAuthSessionId()) return;
        if (result.status === 'COMPLETED') {
          const updated = await reloadLinked(controller.signal);
          if (controller.signal.aborted || pending.authSessionId !== getAuthSessionId()) return;
          if (!updated || (result.creatorId && !updated.some(channel => channel.id === result.creatorId))) {
            setError('BE đã xác nhận phiên. Chưa đọc được kênh vừa liên kết, hãy kiểm tra lại phiên.');
            return;
          }
          clearPending();
          setError('');
          setNotice('Kênh đã được liên kết.');
        } else {
          setSession(result);
        }
      })
      .catch(cause => {
        if (!controller.signal.aborted && pending.authSessionId === getAuthSessionId()) {
          setError(getErrorMessage(cause, 'Không đọc được phiên xác minh. Hãy thử tải lại hoặc bắt đầu lại.'));
        }
      })
      .finally(() => { if (!controller.signal.aborted) setChecking(false); });
    return () => controller.abort();
  }, [canVerify, pending, reloadLinked, statusRetry]);

  async function start(option: ConnectionOption) {
    if (busy.current) return;
    busy.current = true;
    setWorking(optionLabel(option));
    setNotice('');
    setError('');
    const authSessionId = getAuthSessionId();
    try {
      const result = await verification.start(option);
      if (getAuthSessionId() !== authSessionId) return;
      const url = getConsentUrl(result.authorizationUrl, option);
      if (!result.sessionId || !Number.isFinite(Date.parse(result.expiresAt))) {
        throw new Error('Phiên xác minh mới không hợp lệ.');
      }
      sessionStorage.setItem(storageKey, JSON.stringify({ id: result.sessionId, expiresAt: result.expiresAt,
        authSessionId, flow: option.oauthFlow }));
      window.location.assign(url);
    } catch (cause) {
      setError(getErrorMessage(cause, 'Không bắt đầu được xác minh.'));
    } finally {
      busy.current = false;
      setWorking('');
    }
  }

  async function confirm(accountId: string) {
    if (!pending || session?.status !== 'READY' || busy.current) return;
    busy.current = true;
    setWorking(accountId);
    setNotice('');
    setError('');
    try {
      const channelId = await verification.confirm(pending.id, accountId);
      if (pending.authSessionId !== getAuthSessionId()) return;
      const updated = await reloadLinked();
      if (pending.authSessionId !== getAuthSessionId()) return;
      if (!updated?.some(channel => channel.id === channelId)) {
        setSession(null);
        setError('BE đã xác nhận phiên. Chưa đọc được kênh vừa liên kết, hãy kiểm tra lại phiên.');
        return;
      }
      clearPending();
      setNotice('Kênh đã được liên kết.');
    } catch (cause) {
      if (pending.authSessionId === getAuthSessionId()) {
        setError(getErrorMessage(cause, 'Chưa xác nhận được liên kết.'));
        setStatusRetry(value => value + 1);
      }
    } finally {
      busy.current = false;
      setWorking('');
    }
  }

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      <h1 className="creator-page-title">Kênh liên kết</h1>
      {canVerify && <Card className="creator-section-card" title="Xác minh kênh">
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          {notice && <Alert showIcon type="success" title={notice} />}
          {error && <Alert showIcon type="error" title={error} />}
          {optionsError && <Alert showIcon type="error" title={optionsError} action={
            <Button onClick={() => setOptionsRetry(value => value + 1)}>Thử lại</Button>
          } />}
          <Space wrap>
            <Button disabled={!!working} onClick={() => setManual({})}>Gửi bằng chứng thủ công</Button>
            {!pending && options?.map(option => <Button key={optionLabel(option)} type="primary"
              loading={working === optionLabel(option)}
              disabled={!option.available || (!!working && working !== optionLabel(option))}
              title={option.available ? undefined : 'Phương thức này chưa được cấu hình'}
              onClick={() => void start(option)}>Xác minh {optionLabel(option)}</Button>)}
            {!options && !optionsError && <Spin size="small" />}
          </Space>
          {!pending && options && !options.some(option => option.available) &&
            <Typography.Text type="secondary">Xác minh qua nền tảng hiện chưa khả dụng.</Typography.Text>}
          {pending && <>
            {checking && <Spin size="small" />}
            {(session?.status === 'NEW' || session?.status === 'EXCHANGING') && <Alert type="info" showIcon title="Đang chờ kết quả cấp quyền từ nền tảng." />}
            {session?.status === 'FAILED' && <Alert type="warning" showIcon title={
              returnHint === 'cancelled' ? 'Bạn đã hủy cấp quyền.'
                : returnHint === 'conflict' ? 'Không thể liên kết vì có xung đột quyền sở hữu hoặc phiên xác minh.'
                : 'Nền tảng không hoàn tất cấp quyền.'
            } />}
            {session?.status === 'EXPIRED' && <Alert type="warning" showIcon title="Phiên xác minh đã hết hạn." />}
            {session?.status === 'READY' && pending.flow === 'TIKTOK_LOGIN' && <Alert type="warning" showIcon
              title="Tài khoản TikTok được cấp quyền chưa khớp kênh cần xác minh."
              description={session.account?.username || session.account?.displayName} />}
            {session?.status === 'READY' && pending.flow !== 'TIKTOK_LOGIN' && (
              session.accounts.length ? <Space orientation="vertical" style={{ width: '100%' }}>
                <Typography.Text strong>Chọn kênh đã cấp quyền</Typography.Text>
                {session.accounts.map(account => <div className="creator-mini-row" key={account.accountId}
                  style={{ flexWrap: 'wrap', gap: 8 }}>
                  <Space orientation="vertical" size={2} style={{ overflowWrap: 'anywhere' }}>
                    <Typography.Text strong>{account.name || account.username || account.accountId}</Typography.Text>
                    <span>{account.username && account.name ? '@' + account.username.replace(/^@/, '') + ' · ' : ''}
                      {account.accountId}</span>
                    <Typography.Text type="secondary">{matchLabels[account.matchStatus]}</Typography.Text>
                  </Space>
                  {(account.matchStatus === 'AVAILABLE' || account.matchStatus === 'ALREADY_LINKED') && <Button
                    type={account.matchStatus === 'AVAILABLE' ? 'primary' : 'default'}
                    disabled={checking || (!!working && working !== account.accountId)}
                    loading={working === account.accountId} onClick={() => void confirm(account.accountId)}>
                    {account.matchStatus === 'AVAILABLE' ? 'Liên kết kênh' : 'Xác minh lại'}
                  </Button>}
                  {account.matchStatus === 'UNMATCHED' && <Button disabled={!!working} onClick={() => setManual({
                    platform: session.platform, query: account.username ?? account.accountId,
                  })}>Gửi bằng chứng</Button>}
                </div>)}
              </Space> : <Alert showIcon type="warning" title="Nền tảng chưa trả về kênh đủ điều kiện." />
            )}
            <Space wrap>
              <Button disabled={checking || !!working} onClick={() => {
                setError('');
                setStatusRetry(value => value + 1);
              }}>Kiểm tra lại phiên</Button>
              <Button disabled={!!working} onClick={() => { clearPending(); setError(''); }}>
                Kết thúc phiên
              </Button>
            </Space>
          </>}
        </Space>
      </Card>}
      {!canVerify && <Alert type="info" showIcon title="Tài khoản chưa có quyền xác minh kênh." />}
      {canVerify && <Card className="creator-section-card" title="Kênh đã liên kết"
        extra={<Button onClick={() => void reloadLinked()}>Tải lại</Button>}>
        {linkedError ? <Alert type="error" showIcon title={linkedError} /> : !linked ? <Spin /> :
          linked.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có kênh đã liên kết." /> :
            <Space orientation="vertical" style={{ width: '100%' }}>
              {linked.map(channel => {
                const profile = httpUrl(channel.profileUrl);
                return <div className="creator-mini-row" style={{ flexWrap: 'wrap', gap: 8 }} key={channel.id}>
                  <Space orientation="vertical" size={2} style={{ overflowWrap: 'anywhere' }}>
                    <Typography.Text strong>{channel.displayName || channel.userName || channel.externalId}</Typography.Text>
                    <span>{channel.platform} · {channel.userName || channel.externalId}</span>
                    {profile && <a href={profile} target="_blank" rel="noreferrer">Mở kênh</a>}
                  </Space>
                  {channel.verifiedByInfluencerMatch && <Tag color="success">Đã xác minh trên InfluencerMatch</Tag>}
                </div>;
              })}
            </Space>}
      </Card>}
      {canViewClaims && <ClaimHistory key={historyVersion} />}
      {manual && canVerify && <ManualChannelClaim initialPlatform={manual.platform} initialQuery={manual.query}
        onClose={() => setManual(null)} onSubmitted={() => {
          setManual(null);
          setNotice('Đã gửi bằng chứng. Yêu cầu đang chờ duyệt.');
          setHistoryVersion(value => value + 1);
        }} />}
    </Space>
  );
}
