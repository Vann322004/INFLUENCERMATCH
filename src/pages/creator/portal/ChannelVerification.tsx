import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Empty, Modal, Pagination, Radio, Space, Spin, Tag, Typography } from 'antd';
import { CheckCircleFilled, ExportOutlined, ReloadOutlined } from '@ant-design/icons';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  cooperationPath, pendingCooperation, pendingCooperationTarget,
} from '../../../services/cooperationContinuation';
import { dealService } from '../../../services/api/dealService';
import { claimService } from '../../../services/api/claimService';
import {
  creatorPortalService,
  type ChannelReachItem,
} from '../../../services/api/creatorPortalService';
import CreatorAvatar from '../components/discovery/CreatorAvatar';
import {
  channelVerificationService as verification,
  type ConnectionOption, type LinkedChannel, type OAuthFlow, type OAuthPlatform, type OAuthSession,
} from '../../../services/api/channelVerificationService';
import { getAuthSessionId, getErrorMessage } from '../../../services/apiClient';
import { consentUrl } from '../../../services/channelOAuthContract';
import type { ClaimResponse, ClaimStatus } from '../../../types/api/claim.types';
import ManualChannelClaim, { httpUrl } from './ManualChannelClaim';

const storageKey = 'creator.channel-oauth';
const instagramChoices = [
  { flow: 'INSTAGRAM_LOGIN', label: 'Đăng nhập trực tiếp bằng Instagram',
    description: 'Dùng tài khoản Instagram chuyên nghiệp. Không cần liên kết Facebook Page.' },
  { flow: 'FACEBOOK_LOGIN', label: 'Qua Facebook Page',
    description: 'Dùng Trang Facebook đã liên kết với tài khoản Instagram.' },
  { flow: 'INSTAGRAM_UNIFIED_LOGIN', label: 'Qua Meta Business Portfolio',
    description: 'Chọn tài khoản Instagram trong danh mục doanh nghiệp bạn quản lý.' },
] as const;
const claimLabels: Record<ClaimStatus, { label: string; color: string }> = {
  PENDING: { label: 'Chờ duyệt', color: 'warning' },
  APPROVED: { label: 'Đã duyệt', color: 'success' },
  REJECTED: { label: 'Từ chối', color: 'error' },
  REVOKED: { label: 'Đã thu hồi', color: 'default' },
};
const matchLabels = {
  AVAILABLE: 'Có thể liên kết',
  CAN_CREATE: 'Kênh đã cấp quyền và có thể tạo hồ sơ mới.',
  ALREADY_LINKED: 'Đã liên kết với bạn',
  UNMATCHED: 'Chưa khớp mã kênh trong hệ thống',
  UNAVAILABLE: 'Không thể liên kết do quyền sở hữu hoặc điều kiện kênh',
  INSUFFICIENT_EVIDENCE: 'OAuth chưa đủ bằng chứng về quyền phù hợp; cần xác minh thủ công',
};
const linkActions: Partial<Record<keyof typeof matchLabels, string>> = {
  AVAILABLE: 'Liên kết kênh',
  CAN_CREATE: 'Tạo và liên kết kênh',
  ALREADY_LINKED: 'Xác minh lại',
};
const matchReasons = {
  CHANNEL_PLATFORM_ALREADY_LINKED: 'Gỡ kênh đang liên kết trên nền tảng này trước khi liên kết kênh khác.',
  CHANNEL_NOT_FOUND: 'Mã kênh chưa khớp hồ sơ trong hệ thống.',
  UNSTABLE_CHANNEL_ID: 'Hồ sơ hiện chưa có mã kênh chính thức để đối chiếu.',
  MISSING_PAGE_MANAGEMENT: 'Tài khoản Facebook chưa có quyền quản lý Trang cần thiết.',
  TARGET_MISMATCH: 'Tài khoản này quản lý kênh khác với kênh được mời.',
  OWNERSHIP_CONFLICT: 'Kênh đang thuộc tài khoản khác hoặc có xung đột sở hữu.',
};

function verificationLabel(channel: LinkedChannel) {
  const proof = channel.verification;
  if (proof?.status === 'SIMULATED') return 'Xác minh mô phỏng';
  if (proof?.status === 'LEGACY_UNVERIFIED') return 'Chưa đủ bằng chứng xác minh';
  if (proof?.status !== 'VERIFIED') return channel.verifiedByInfluencerMatch
    ? 'Đã xác minh trên InfluencerMatch' : 'Chưa xác minh';
  return proof.environment === 'SANDBOX' ? 'Đã xác minh · TikTok Sandbox'
    : proof.environment === 'MANUAL' ? 'Đã xác minh · Duyệt thủ công'
    : 'Đã xác minh · API nền tảng';
}

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
        && ['FACEBOOK_LOGIN', 'INSTAGRAM_LOGIN', 'INSTAGRAM_UNIFIED_LOGIN', 'TIKTOK_LOGIN'].includes(pending.flow)
      ? pending : null;
  } catch {
    return null;
  }
}

function optionLabel(option: ConnectionOption) {
  if (option.platform === 'TIKTOK') return 'TikTok Sandbox';
  return option.platform === 'FACEBOOK' ? 'Facebook' : 'Instagram';
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
                {(claim.revokeReason || claim.reason) && <span>Lý do: {claim.revokeReason ?? claim.reason}</span>}
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
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const invitationToken = pendingCooperation();
  const invitationTarget = pendingCooperationTarget();
  const [options, setOptions] = useState<ConnectionOption[] | null>(null);
  const [showInstagram, setShowInstagram] = useState(false);
  const [optionsError, setOptionsError] = useState('');
  const [optionsRetry, setOptionsRetry] = useState(0);
  const [pending, setPending] = useState(readPendingOAuth);
  const [returnHint, setReturnHint] = useState(() => params.get('oauth'));
  const [session, setSession] = useState<OAuthSession | null>(null);
  const [selection, setSelection] = useState<{ sessionId: string; accountId: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const [statusRetry, setStatusRetry] = useState(0);
  const [working, setWorking] = useState('');
  const busy = useRef(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [unlinkTarget, setUnlinkTarget] = useState<LinkedChannel | null>(null);
  const [unlinkError, setUnlinkError] = useState('');
  const [manual, setManual] = useState<{ platform?: OAuthPlatform; query?: string } | null>(null);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [reachMap, setReachMap] = useState<Record<string, ChannelReachItem>>({});
  useEffect(() => {
    if (!canVerify) return;
    const controller = new AbortController();
    void creatorPortalService.fetchAggregatedReach(controller.signal).then((data) => {
      if (controller.signal.aborted || !data?.platformBreakdown) return;
      const next: Record<string, ChannelReachItem> = {};
      for (const item of data.platformBreakdown) {
        if (item.channelId) next[item.channelId] = item;
      }
      setReachMap(next);
    });
    return () => controller.abort();
  }, [canVerify, linked]);
  const [invitationContext, setInvitationContext] = useState<{
    status: string;
    channels?: { creatorId: string; platform: string; username: string }[];
  } | null>(null);
  const [invitationContextError, setInvitationContextError] = useState('');
  const targetChannel = invitationContext?.channels?.find(
    channel => channel.creatorId === invitationTarget?.creatorId
      && channel.platform === invitationTarget?.platform,
  );
  const manualInvitation = invitationToken && targetChannel && invitationContext?.status === 'NEEDS_CHANNEL_VERIFICATION'
    ? { token: invitationToken, target: targetChannel } : undefined;
  const canOpenManual = !invitationToken || !!manualInvitation;

  useEffect(() => {
    const returned = ['return', 'cancelled', 'conflict'].includes(params.get('oauth') ?? '');
    const openClaim = params.get('claim') === 'new';
    if (!returned && !openClaim) return;
    if (returned && !readPendingOAuth()) setError('Không tìm thấy phiên xác minh của tài khoản này. Hãy bắt đầu lại.');
    if (openClaim && canVerify && canOpenManual) setManual({});
    if (openClaim && invitationToken && !invitationContext && !invitationContextError && !returned) return;
    const nextParams = new URLSearchParams(params);
    if (returned) nextParams.delete('oauth');
    if (openClaim) nextParams.delete('claim');
    setParams(nextParams, { replace: true });
  }, [canVerify, canOpenManual, invitationContext, invitationContextError, invitationToken, params, setParams]);

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

  useEffect(() => {
    if (!canVerify || !invitationToken) {
      setInvitationContext(null);
      setInvitationContextError('');
      return;
    }
    let active = true;
    setInvitationContext(null);
    setInvitationContextError('');
    dealService.invitationContext(invitationToken)
      .then(result => { if (active) setInvitationContext(result); })
      .catch(cause => {
        if (active) setInvitationContextError(
          getErrorMessage(cause, 'Không kiểm tra được kênh trong lời mời. Hãy quay lại lời mời và thử lại.'),
        );
      });
    return () => { active = false; };
  }, [canVerify, invitationToken]);

  function clearPending() {
    sessionStorage.removeItem(storageKey);
    setPending(null);
    setReturnHint(null);
    setSession(null);
    setSelection(null);
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
          if (!updated
              || (pending.flow === 'TIKTOK_LOGIN' && !result.creatorId)
              || (result.creatorId && !updated.some(channel => channel.id === result.creatorId))) {
            setError('BE đã xác nhận phiên. Chưa đọc được kênh vừa liên kết, hãy kiểm tra lại phiên.');
            return;
          }
          clearPending();
          setError('');
          setNotice('Kênh đã được liên kết.');
          if (invitationToken) {
            navigate(cooperationPath(), { state: { channelOAuthResult: 'VERIFIED' } });
          }
        } else {
          setSession(result);
          setSelection(current => result.status === 'READY' && current?.sessionId === result.sessionId
            && result.accounts.some(account => account.accountId === current.accountId
              && !!linkActions[account.matchStatus]) ? current : null);
        }
      })
      .catch(cause => {
        if (!controller.signal.aborted && pending.authSessionId === getAuthSessionId()) {
          setSession(null);
          setSelection(null);
          setError(getErrorMessage(cause, 'Không đọc được phiên xác minh. Hãy thử tải lại hoặc bắt đầu lại.'));
        }
      })
      .finally(() => { if (!controller.signal.aborted) setChecking(false); });
    return () => controller.abort();
  }, [canVerify, invitationToken, navigate, pending, reloadLinked, statusRetry]);

  const instagramOption = options?.find(option => option.platform === 'INSTAGRAM');
  const canUsePlatform = (platform: OAuthPlatform) => !invitationToken
    || (targetChannel?.platform === platform && invitationContext?.status === 'NEEDS_CHANNEL_VERIFICATION');
  const checkingInvitation = !!invitationToken && !invitationContext && !invitationContextError;
  const selectableAccounts = canVerify && pending && pending.flow !== 'TIKTOK_LOGIN'
    && session?.status === 'READY' && session.sessionId === pending.id
    ? session.accounts.filter(account => !!linkActions[account.matchStatus]
      && canUsePlatform(session.platform) && (!invitationToken || account.creatorId === targetChannel?.creatorId))
    : [];
  const selectedAccount = selection && selection.sessionId === session?.sessionId
    ? selectableAccounts.find(account => account.accountId === selection.accountId) : undefined;
  const instagramDialogOpen = showInstagram && canVerify && !pending
    && !!instagramOption && canUsePlatform('INSTAGRAM');
  const instagramMethods = instagramChoices.map(choice => ({
    ...choice,
    option: instagramOption?.methods
      ? instagramOption.methods.find(method => method.oauthFlow === choice.flow)
      : instagramOption?.oauthFlow === choice.flow ? instagramOption : undefined,
  }));

  async function start(option: ConnectionOption) {
    const flow = option.oauthFlow;
    if (busy.current || !option.available || !flow || !canUsePlatform(option.platform)) return;
    busy.current = true;
    setWorking(option.platform === 'INSTAGRAM' ? flow : optionLabel(option));
    setNotice('');
    setError('');
    const authSessionId = getAuthSessionId();
    try {
      if (invitationToken && (!invitationTarget || !targetChannel
          || targetChannel.platform !== option.platform)) {
        throw new Error('Chưa xác nhận được kênh đích trong lời mời. Hãy chọn lại kênh từ trang lời mời.');
      }
      const startContext = invitationToken && targetChannel
        ? { creatorId: targetChannel.creatorId, cooperationInvitationToken: invitationToken }
        : {};
      const result = await verification.start({ ...option, oauthFlow: flow }, startContext);
      if (getAuthSessionId() !== authSessionId) return;
      const url = consentUrl(result.authorizationUrl, flow, window.location.origin);
      if (!result.sessionId || !Number.isFinite(Date.parse(result.expiresAt))) {
        throw new Error('Phiên xác minh mới không hợp lệ.');
      }
      sessionStorage.setItem(storageKey, JSON.stringify({ id: result.sessionId, expiresAt: result.expiresAt,
        authSessionId, flow, targetCreatorId: targetChannel?.creatorId ?? null }));
      window.location.assign(url);
    } catch (cause) {
      setError(getErrorMessage(cause, 'Không bắt đầu được xác minh.'));
    } finally {
      busy.current = false;
      setWorking('');
    }
  }

  async function confirm() {
    if (!pending || !selectedAccount || checking || busy.current
        || pending.authSessionId !== getAuthSessionId()) return;
    const accountId = selectedAccount.accountId;
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
      if (invitationToken) navigate(cooperationPath(), { state: { channelOAuthResult: 'VERIFIED' } });
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

  async function unlinkChannel() {
    if (!unlinkTarget || busy.current) return;
    const accountSession = getAuthSessionId();
    const channel = unlinkTarget;
    busy.current = true;
    setWorking('unlink');
    setUnlinkError('');
    setNotice('');
    try {
      await verification.unlink(channel.id);
      if (accountSession !== getAuthSessionId()) return;
      if (pending && (pending.flow === 'TIKTOK_LOGIN' ? 'TIKTOK' : session?.platform) === channel.platform) {
        clearPending();
      } else if (pending) {
        setStatusRetry(value => value + 1);
      }
      setUnlinkTarget(null);
      setHistoryVersion(value => value + 1);
      setNotice('Đã gỡ liên kết kênh.');
      await reloadLinked();
    } catch (cause) {
      if (accountSession === getAuthSessionId())
        setUnlinkError(getErrorMessage(cause, 'Không gỡ được liên kết kênh.'));
    } finally {
      busy.current = false;
      setWorking('');
    }
  }

  async function cancelSession() {
    if (!pending || busy.current) return;
    const current = pending;
    busy.current = true;
    setWorking('cancel');
    setError('');
    try {
      const result = await verification.cancel(current.id, current.flow);
      if (current.authSessionId !== getAuthSessionId()) return;
      if (result.status === 'COMPLETED') {
        const updated = await reloadLinked();
        if (current.authSessionId !== getAuthSessionId()) return;
        if (!updated) throw new Error('Phiên đã hoàn tất. Chưa tải được danh sách kênh, hãy kiểm tra lại.');
        setNotice('Phiên đã hoàn tất trước khi hủy. Liên kết kênh được giữ nguyên.');
      } else setNotice('Đã hủy phiên xác minh.');
      clearPending();
    } catch (cause) {
      if (current.authSessionId === getAuthSessionId())
        setError(getErrorMessage(cause, 'Không hủy được phiên. Hãy kiểm tra lại trước khi bắt đầu phiên mới.'));
    } finally {
      busy.current = false;
      setWorking('');
    }
  }

  const verifiedChannels = (linked ?? []).filter(c => c.verifiedByInfluencerMatch || c.verification?.status === 'VERIFIED');
  const verifiedPlatforms = [...new Set(verifiedChannels.map(c => c.platform))];
  const fmtMetric = (n?: number | null) => {
    if (n == null || !Number.isFinite(n)) return '—';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString('vi-VN');
  };

  return (
    <div className="creator-admin-rate-page" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {invitationToken && <Alert type="info" title="Bạn đang xác minh kênh cho lời mời hợp tác"
        description={invitationTarget ? `Kênh mục tiêu: ${invitationTarget.platform} · @${invitationTarget.username}` : undefined}
        action={<Link to={cooperationPath()}><Button>Tiếp tục lời mời</Button></Link>} />}
      <header className="creator-admin-rate-header" style={{ marginBottom: 0 }}>
        <div>
          <h1>Kênh liên kết & Xác minh sở hữu</h1>
          <p>Kết nối và xác minh quyền quản lý kênh mạng xã hội để đồng bộ chỉ số thật và nhận lời mời hợp tác từ Thương hiệu.</p>
        </div>
        {canVerify && (
          <Button icon={<ReloadOutlined />} onClick={() => void reloadLinked()}>
            Làm mới kênh
          </Button>
        )}
      </header>

      {canVerify && (
        <div className="creator-admin-rate-stats" style={{ marginBottom: 0 }}>
          <section>
            <span>Kênh đã xác minh</span>
            <strong>{verifiedChannels.length} kênh</strong>
            <small>{linked ? `Tổng ${linked.length} kênh đã gắn với tài khoản` : 'Đang tải danh sách kênh'}</small>
          </section>
          <section>
            <span>Nền tảng đã kích hoạt</span>
            <strong>{verifiedPlatforms.length ? verifiedPlatforms.join(', ') : 'Chưa có'}</strong>
            <small>Đủ điều kiện nhận lời mời hợp tác từ Brand</small>
          </section>
          <section>
            <span>Trạng thái hồ sơ</span>
            <strong>{verifiedChannels.length > 0 ? 'Sẵn sàng' : 'Chờ xác minh'}</strong>
            <small>Hỗ trợ OAuth trực tiếp hoặc gửi bằng chứng thủ công</small>
          </section>
        </div>
      )}

      {canVerify && <Card className="creator-admin-rate-table" styles={{ header: { background: '#f8fafc', borderBottom: '1px solid #e2e8f0' } }} title="Kết nối & Xác minh thêm kênh">
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          {notice && (
            <Alert
              showIcon
              type="success"
              title={notice}
              action={invitationToken ? (
                <Button size="small" type="primary" onClick={() => navigate(cooperationPath())}>
                  Quay lại lời mời hợp tác
                </Button>
              ) : undefined}
            />
          )}
          {error && !instagramDialogOpen && <Alert showIcon type="error" title={error} />}
          {optionsError && <Alert showIcon type="error" title={optionsError} action={
            <Button onClick={() => setOptionsRetry(value => value + 1)}>Thử lại</Button>
          } />}
          {invitationToken && targetChannel && (
            <Alert
              type="info"
              showIcon
              title={`Đang xác minh kênh cho lời mời hợp tác: ${targetChannel.platform} · @${(targetChannel.username || targetChannel.creatorId).replace(/^@+/, '')}`}
              action={
                <Button size="small" onClick={() => navigate(cooperationPath())}>
                  Quay lại lời mời
                </Button>
              }
            />
          )}
          {invitationToken && invitationContextError && <Alert type="error" showIcon title={invitationContextError} />}
          {invitationToken && !invitationTarget && <Alert type="warning" showIcon
            title="Chọn kênh cụ thể từ trang lời mời trước khi xác minh." />}
          {invitationToken && invitationTarget && invitationContext && !targetChannel && <Alert type="error" showIcon
            title="Kênh đã chọn không còn thuộc lời mời này. Quay lại lời mời để kiểm tra lại." />}
          <Space wrap>
            <Button disabled={!!working || !canOpenManual} onClick={() => setManual({})}>Xác minh thủ công</Button>
            {!pending && options?.filter(option => !invitationToken || option.platform === targetChannel?.platform).map(option => {
              const alreadyVerified = verifiedPlatforms.includes(option.platform);
              return (
                <Button key={optionLabel(option)} type={alreadyVerified ? 'default' : 'primary'}
                  icon={alreadyVerified ? <CheckCircleFilled style={{ color: '#10B981' }} /> : undefined}
                  loading={working === optionLabel(option)}
                  disabled={(option.platform !== 'INSTAGRAM' && !option.available) || !!working || !canUsePlatform(option.platform)}
                  title={option.platform === 'INSTAGRAM' || option.available ? undefined
                    : option.unavailableReason === 'NOT_CONFIGURED' ? 'Phương thức này chưa được cấu hình đầy đủ'
                    : 'Phương thức này chưa được bật trong môi trường hiện tại'}
                  onClick={() => {
                    if (option.platform === 'INSTAGRAM') {
                      setError('');
                      setShowInstagram(true);
                    } else {
                      void start(option);
                    }
                  }}>
                  {alreadyVerified ? `Đã xác minh ${optionLabel(option)} · Liên kết thêm` : `Xác minh ${optionLabel(option)}`}
                </Button>
              );
            })}
            {!options && !optionsError && <Spin size="small" />}
          </Space>
          {!pending && options?.some(option => option.available || option.methods?.some(method => method.available)) &&
            <Typography.Text type="secondary">Nền tảng sẽ kiểm tra quyền của tài khoản và kênh trong bước cấp quyền.</Typography.Text>}
          {!pending && options && !options.some(option => option.available || option.methods?.some(method => method.available)) &&
            <Typography.Text type="secondary">Xác minh qua nền tảng hiện chưa khả dụng.</Typography.Text>}
          {pending && <>
            {checking && <Spin size="small" />}
            {(session?.status === 'NEW' || session?.status === 'EXCHANGING') && <Alert type="info" showIcon title="Đang chờ kết quả cấp quyền từ nền tảng." />}
            {session?.status === 'FAILED' && (
              <Alert
                type="warning"
                showIcon
                title={
                  session.failureCode === 'CHANNEL_PLATFORM_ALREADY_LINKED'
                    ? matchReasons.CHANNEL_PLATFORM_ALREADY_LINKED
                    : returnHint === 'cancelled' ? 'Bạn đã hủy cấp quyền.'
                    : returnHint === 'conflict' ? 'Không thể liên kết vì có xung đột quyền sở hữu hoặc phiên xác minh.'
                    : 'Nền tảng không hoàn tất cấp quyền.'
                }
                action={canOpenManual ? (
                  <Button size="small" disabled={!!working} onClick={() => setManual({
                    platform: pending.flow === 'TIKTOK_LOGIN' ? 'TIKTOK' : session.platform,
                    query: targetChannel?.username?.replace(/^@+/, '') ?? '',
                  })}>Xác minh thủ công</Button>
                ) : undefined}
              />
            )}
            {session?.status === 'EXPIRED' && (
              <Alert
                type="warning"
                showIcon
                title="Phiên xác minh đã hết hạn."
                action={canOpenManual ? (
                  <Button size="small" disabled={!!working} onClick={() => setManual({
                    platform: pending.flow === 'TIKTOK_LOGIN' ? 'TIKTOK' : session.platform,
                    query: targetChannel?.username?.replace(/^@+/, '') ?? '',
                  })}>Xác minh thủ công</Button>
                ) : undefined}
              />
            )}
            {session?.status === 'READY' && pending.flow === 'TIKTOK_LOGIN' && <>
              <Alert type="warning" showIcon
                title={invitationToken
                  ? 'TikTok chưa xác nhận được tài khoản đã cấp quyền khớp với kênh được mời.'
                  : 'TikTok đã cấp quyền, nhưng hệ thống chưa đối chiếu được mã kênh. Hãy hủy phiên để thử lại.'}
                description={session.account?.username || session.account?.displayName} />
              <Button disabled={!!working || !canOpenManual} onClick={() => setManual({
                platform: 'TIKTOK', query: session.account?.username ?? '',
              })}>Tiếp tục xác minh thủ công</Button>
            </>}
            {session?.status === 'READY' && pending.flow !== 'TIKTOK_LOGIN' && (
              session.accounts.length ? <Space orientation="vertical" style={{ width: '100%' }}>
                <Typography.Text strong id="oauth-channel-choice">Chọn kênh đã cấp quyền</Typography.Text>
                <Radio.Group name="oauth-account" aria-labelledby="oauth-channel-choice"
                  value={selectedAccount?.accountId ?? ''} disabled={checking || !!working}
                  style={{ width: '100%' }}
                  onChange={event => {
                    const accountId = event.target.value;
                    if (selectableAccounts.some(account => account.accountId === accountId)) {
                      setSelection({ sessionId: session.sessionId, accountId });
                    }
                  }}>
                  <Space orientation="vertical" style={{ width: '100%' }}>
                    {session.accounts.map(account => {
                      const canSelect = selectableAccounts.includes(account);
                      const canSubmitEvidence = account.matchStatus === 'INSUFFICIENT_EVIDENCE'
                        && (!!account.creatorId || account.matchReason === 'UNSTABLE_CHANNEL_ID');
                      const wrongTarget = !!invitationToken && !!targetChannel && !!linkActions[account.matchStatus]
                        && account.creatorId !== targetChannel.creatorId;
                      const reason = wrongTarget ? matchReasons.TARGET_MISMATCH
                        : (account.matchReason && matchReasons[account.matchReason]) || matchLabels[account.matchStatus];
                      return <div className="creator-mini-row" key={account.accountId}
                        style={{ flexWrap: 'wrap', gap: 8 }}>
                        <Radio value={account.accountId} disabled={canSelect ? undefined : true}
                          style={{ flex: '1 1 180px', minWidth: 0, marginInlineEnd: 0 }}>
                          <span style={{ display: 'flex', flexDirection: 'column', gap: 2, overflowWrap: 'anywhere' }}>
                            <Typography.Text strong>{account.name || account.username || account.accountId}</Typography.Text>
                            <Typography.Text>
                              {account.username && account.name ? '@' + account.username.replace(/^@/, '') + ' · ' : ''}
                              {account.accountId}
                            </Typography.Text>
                            <Typography.Text type="secondary">{reason}</Typography.Text>
                          </span>
                        </Radio>
                        {canSubmitEvidence && <Button disabled={checking || !!working || !canOpenManual} onClick={() => setManual({
                          platform: session.platform, query: account.username ?? account.accountId,
                        })}>Gửi bằng chứng</Button>}
                      </div>;
                    })}
                  </Space>
                </Radio.Group>
                {!checking && !checkingInvitation && !selectableAccounts.length && (
                  <Alert
                    type="info"
                    showIcon
                    title="Chưa có kênh đủ điều kiện liên kết."
                    description="Xem lý do ở từng kênh. Chọn Kiểm tra lại phiên để cập nhật, hủy phiên để cấp quyền lại, hoặc gửi bằng chứng thủ công."
                    action={canOpenManual ? (
                      <Button size="small" disabled={!!working} onClick={() => setManual({
                        platform: session.platform,
                        query: targetChannel?.username?.replace(/^@+/, '') || session.accounts[0]?.username || '',
                      })}>Tiếp tục xác minh thủ công</Button>
                    ) : undefined}
                  />
                )}
                <Button type="primary" disabled={!selectedAccount || checking || !!working}
                  loading={!!selectedAccount && working === selectedAccount.accountId} onClick={() => void confirm()}>
                  {selectedAccount ? linkActions[selectedAccount.matchStatus] : 'Liên kết kênh'}
                </Button>
              </Space> : (
                <Alert
                  showIcon
                  type="warning"
                  title={pending.flow === 'INSTAGRAM_UNIFIED_LOGIN'
                    ? 'Chưa có tài khoản Instagram được cấp quyền trong phiên này.'
                    : session.platform === 'FACEBOOK' ? 'Facebook chưa trả về Trang nào cho phiên này.' : 'Nền tảng chưa trả về kênh đủ điều kiện.'}
                  description={pending.flow === 'INSTAGRAM_UNIFIED_LOGIN'
                    ? 'Hủy phiên để cấp quyền lại với đúng tài khoản chuyên nghiệp và Business Portfolio, hoặc gửi bằng chứng thủ công.'
                    : session.platform === 'FACEBOOK'
                      ? 'Hủy phiên và cấp quyền lại bằng tài khoản có quyền quản lý Trang, hoặc chọn xác minh thủ công.'
                      : undefined}
                  action={canOpenManual ? (
                    <Button size="small" disabled={!!working} onClick={() => setManual({
                      platform: session.platform,
                      query: targetChannel?.username?.replace(/^@+/, '') ?? '',
                    })}>Tiếp tục xác minh thủ công</Button>
                  ) : undefined}
                />
              )
            )}
            <Space wrap>
              <Button disabled={checking || !!working} onClick={() => {
                setError('');
                setStatusRetry(value => value + 1);
              }}>Kiểm tra lại phiên</Button>
              <Button disabled={checking || !!working} loading={working === 'cancel'} onClick={() => void cancelSession()}>
                Hủy phiên xác minh
              </Button>
            </Space>
          </>}
        </Space>
      </Card>}
      {!canVerify && <Alert type="info" showIcon title="Tài khoản chưa có quyền xác minh kênh." />}
      {canVerify && <Card className="creator-admin-rate-table" styles={{ header: { background: '#f8fafc', borderBottom: '1px solid #e2e8f0' } }} title="Kênh đã liên kết"
        extra={<Button size="small" icon={<ReloadOutlined />} onClick={() => void reloadLinked()}>Tải lại</Button>}>
        {linkedError ? <Alert type="error" showIcon title={linkedError} /> : !linked ? <Spin /> :
          linked.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có kênh đã liên kết." /> :
            <Space orientation="vertical" size={12} style={{ width: '100%' }}>
              {new Set(linked.map(channel => channel.platform.toUpperCase())).size < linked.length
                && <Alert showIcon type="warning" title="Hãy gỡ các kênh trùng để mỗi nền tảng chỉ còn một kênh." />}
              {linked.map(channel => {
                const profile = httpUrl(channel.profileUrl);
                const metrics = reachMap[channel.id];
                const erVal = metrics?.engagementRate != null
                  ? (metrics.engagementRate <= 1 ? metrics.engagementRate * 100 : metrics.engagementRate)
                  : null;
                const verifiedAt = channel.verification?.verifiedAt;
                return (
                  <div
                    key={channel.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 14,
                      padding: '14px 16px',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 220, flex: 1 }}>
                      <CreatorAvatar size={44} src={(channel.avatarUrl || metrics?.avatarUrl) ?? undefined} name={(channel.displayName || channel.userName) ?? undefined} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <strong style={{ color: '#182230', fontSize: 14.5 }}>
                            {channel.displayName || channel.userName || channel.externalId}
                          </strong>
                          <Tag color="geekblue" style={{ margin: 0, fontWeight: 600 }}>{channel.platform}</Tag>
                        </div>
                        <div style={{ fontSize: 12.5, color: '#667085', marginTop: 2 }}>
                          {channel.userName ? `@${channel.userName.replace(/^@+/, '')}` : channel.externalId}
                          {verifiedAt && ` · Xác minh lúc ${new Date(verifiedAt).toLocaleDateString('vi-VN')}`}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: 16, fontSize: 12.5, color: '#475467' }}>
                        <div><span style={{ color: '#667085' }}>Followers:</span> <strong>{fmtMetric(metrics?.followers)}</strong></div>
                        <div><span style={{ color: '#667085' }}>Views TB:</span> <strong>{fmtMetric(metrics?.avgViews)}</strong></div>
                        <div><span style={{ color: '#667085' }}>ER:</span> <strong>{erVal != null ? `${erVal.toFixed(2)}%` : '—'}</strong></div>
                      </div>
                      <Space size={6} wrap>
                        <Tag
                          color={channel.verification?.environment === 'SANDBOX' ? 'warning'
                            : channel.verifiedByInfluencerMatch || channel.verification?.status === 'VERIFIED' ? 'success' : 'default'}
                          style={{ margin: 0, fontWeight: 600 }}
                        >
                          {verificationLabel(channel)}
                        </Tag>
                        {profile && (
                          <Button size="small" icon={<ExportOutlined />} href={profile} target="_blank" rel="noreferrer">
                            Mở kênh
                          </Button>
                        )}
                        <Button size="small" danger disabled={!!working} onClick={() => { setUnlinkError(''); setUnlinkTarget(channel); }}>
                          Gỡ liên kết
                        </Button>
                      </Space>
                    </div>
                  </div>
                );
              })}
            </Space>}
      </Card>}
      {canViewClaims && <ClaimHistory key={historyVersion} />}
      <Modal title="Gỡ liên kết kênh" open={!!unlinkTarget && canVerify}
        okText="Gỡ liên kết" cancelText="Giữ liên kết" okButtonProps={{ danger: true }}
        confirmLoading={working === 'unlink'} closable={working !== 'unlink'}
        mask={{ closable: working !== 'unlink' }} keyboard={working !== 'unlink'}
        onCancel={() => { if (!busy.current) setUnlinkTarget(null); }} onOk={() => void unlinkChannel()}>
        <p>Gỡ liên kết với <strong>{unlinkTarget?.displayName || unlinkTarget?.userName || unlinkTarget?.externalId}</strong>?
          Bạn sẽ cần xác minh lại nếu muốn liên kết kênh này.</p>
        {unlinkError && <Alert showIcon type="error" title={unlinkError} />}
      </Modal>
      <Modal title="Chọn cách xác minh Instagram" open={instagramDialogOpen} footer={null}
        closable={!working} mask={{ closable: !working }} keyboard={!working}
        onCancel={() => { setShowInstagram(false); setError(''); }}>
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          {error && <Alert showIcon type="error" title={error} />}
          {instagramMethods.map(({ flow, label, description, option }) => (
            <Space key={flow} orientation="vertical" size={4} style={{ width: '100%' }}>
              {flow === 'INSTAGRAM_LOGIN' && <Tag color="blue">Khuyên dùng</Tag>}
              <Button block disabled={!option?.available || !!working} loading={working === flow}
                type={flow === 'INSTAGRAM_LOGIN' ? 'primary' : 'default'}
                style={{ whiteSpace: 'normal', height: 'auto', minHeight: 32 }}
                onClick={() => void start({
                  platform: 'INSTAGRAM', oauthFlow: flow, supported: true, available: option?.available === true,
                })}>{label}</Button>
              <Typography.Text type="secondary">{description}</Typography.Text>
              {!option?.available && <Typography.Text type="secondary">
                {option?.unavailableReason === 'NOT_CONFIGURED'
                  ? 'Phương thức này chưa được cấu hình đầy đủ.'
                  : 'Phương thức này chưa được bật trong môi trường hiện tại.'}
              </Typography.Text>}
            </Space>
          ))}
          {!instagramMethods.some(({ option }) => option?.available) && canOpenManual && (
            <Button onClick={() => { setShowInstagram(false); setError(''); setManual({ platform: 'INSTAGRAM' }); }}>
              Xác minh thủ công
            </Button>
          )}
        </Space>
      </Modal>
      {manual && canVerify && canOpenManual && <ManualChannelClaim
        key={manualInvitation?.target.creatorId ?? 'portal-claim'}
        initialPlatform={manual.platform} initialQuery={manual.query} invitation={manualInvitation}
        onClose={() => setManual(null)} onSubmitted={() => {
          setManual(null);
          setNotice('Đã gửi bằng chứng. Yêu cầu đang chờ duyệt.');
          setHistoryVersion(value => value + 1);
        }} />}
    </div>
  );
}
