import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Empty, Modal, Pagination, Radio, Space, Spin, Tag, Typography } from 'antd';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  cooperationPath, pendingCooperation, pendingCooperationTarget,
} from '../../../services/cooperationContinuation';
import { dealService } from '../../../services/api/dealService';
import { claimService } from '../../../services/api/claimService';
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
          if (invitationToken && pending.flow === 'TIKTOK_LOGIN' && result.status === 'READY') {
            clearPending();
            navigate(cooperationPath(), { state: { channelOAuthResult: 'MANUAL_RESOLUTION' } });
          }
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

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      {invitationToken && <Alert type="info" title="Bạn đang xác minh kênh cho lời mời hợp tác"
        description={invitationTarget ? `Kênh mục tiêu: ${invitationTarget.platform} · @${invitationTarget.username}` : undefined}
        action={<Link to={cooperationPath()}><Button>Tiếp tục lời mời</Button></Link>} />}
      <h1 className="creator-page-title">Kênh liên kết</h1>
      {canVerify && <Card className="creator-section-card" title="Xác minh kênh">
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          {notice && <Alert showIcon type="success" title={notice} />}
          {error && !instagramDialogOpen && <Alert showIcon type="error" title={error} />}
          {optionsError && <Alert showIcon type="error" title={optionsError} action={
            <Button onClick={() => setOptionsRetry(value => value + 1)}>Thử lại</Button>
          } />}
          {invitationToken && invitationContextError && <Alert type="error" showIcon title={invitationContextError} />}
          {invitationToken && !invitationTarget && <Alert type="warning" showIcon
            title="Chọn kênh cụ thể từ trang lời mời trước khi xác minh." />}
          {invitationToken && invitationTarget && invitationContext && !targetChannel && <Alert type="error" showIcon
            title="Kênh đã chọn không còn thuộc lời mời này. Quay lại lời mời để kiểm tra lại." />}
          <Space wrap>
            <Button disabled={!!working || !canOpenManual} onClick={() => setManual({})}>Xác minh thủ công</Button>
            {!pending && options?.filter(option => !invitationToken || option.platform === targetChannel?.platform).map(option => <Button key={optionLabel(option)} type="primary"
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
              }}>Xác minh {optionLabel(option)}</Button>)}
            {!options && !optionsError && <Spin size="small" />}
          </Space>
          {!pending && options?.some(option => option.available || option.methods?.some(method => method.available)) &&
            <Typography.Text type="secondary">Nền tảng sẽ kiểm tra quyền của tài khoản và kênh trong bước cấp quyền.</Typography.Text>}
          {!pending && options && !options.some(option => option.available || option.methods?.some(method => method.available)) &&
            <Typography.Text type="secondary">Xác minh qua nền tảng hiện chưa khả dụng.</Typography.Text>}
          {pending && <>
            {checking && <Spin size="small" />}
            {(session?.status === 'NEW' || session?.status === 'EXCHANGING') && <Alert type="info" showIcon title="Đang chờ kết quả cấp quyền từ nền tảng." />}
            {session?.status === 'FAILED' && <Alert type="warning" showIcon title={
              session.failureCode === 'CHANNEL_PLATFORM_ALREADY_LINKED' ? matchReasons.CHANNEL_PLATFORM_ALREADY_LINKED
                : returnHint === 'cancelled' ? 'Bạn đã hủy cấp quyền.'
                : returnHint === 'conflict' ? 'Không thể liên kết vì có xung đột quyền sở hữu hoặc phiên xác minh.'
                : 'Nền tảng không hoàn tất cấp quyền.'
            } />}
            {session?.status === 'EXPIRED' && <Alert type="warning" showIcon title="Phiên xác minh đã hết hạn." />}
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
                {!checking && !checkingInvitation && !selectableAccounts.length && <Alert type="info" showIcon
                  title="Chưa có kênh đủ điều kiện liên kết."
                  description="Xem lý do ở từng kênh. Chọn Kiểm tra lại phiên để cập nhật, hoặc hủy phiên và cấp quyền lại." />}
                <Button type="primary" disabled={!selectedAccount || checking || !!working}
                  loading={!!selectedAccount && working === selectedAccount.accountId} onClick={() => void confirm()}>
                  {selectedAccount ? linkActions[selectedAccount.matchStatus] : 'Liên kết kênh'}
                </Button>
              </Space> : <Alert showIcon type="warning" title={pending.flow === 'INSTAGRAM_UNIFIED_LOGIN'
                ? 'Chưa có tài khoản Instagram được cấp quyền trong phiên này.'
                : session.platform === 'FACEBOOK' ? 'Facebook chưa trả về Trang nào cho phiên này.' : 'Nền tảng chưa trả về kênh đủ điều kiện.'}
                description={pending.flow === 'INSTAGRAM_UNIFIED_LOGIN'
                  ? 'Hủy phiên để cấp quyền lại với đúng tài khoản chuyên nghiệp và Business Portfolio, hoặc gửi bằng chứng thủ công.'
                  : session.platform === 'FACEBOOK'
                    ? 'Hủy phiên và cấp quyền lại bằng tài khoản có quyền quản lý Trang, hoặc chọn xác minh thủ công.'
                    : undefined} />
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
      {canVerify && <Card className="creator-section-card" title="Kênh đã liên kết"
        extra={<Button onClick={() => void reloadLinked()}>Tải lại</Button>}>
        {linkedError ? <Alert type="error" showIcon title={linkedError} /> : !linked ? <Spin /> :
          linked.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có kênh đã liên kết." /> :
            <Space orientation="vertical" style={{ width: '100%' }}>
              {new Set(linked.map(channel => channel.platform.toUpperCase())).size < linked.length
                && <Alert showIcon type="warning" title="Hãy gỡ các kênh trùng để mỗi nền tảng chỉ còn một kênh." />}
              {linked.map(channel => {
                const profile = httpUrl(channel.profileUrl);
                return <div className="creator-mini-row" style={{ flexWrap: 'wrap', gap: 8 }} key={channel.id}>
                  <Space orientation="vertical" size={2} style={{ overflowWrap: 'anywhere' }}>
                    <Typography.Text strong>{channel.displayName || channel.userName || channel.externalId}</Typography.Text>
                    <span>{channel.platform} · {channel.userName || channel.externalId}</span>
                    {profile && <a href={profile} target="_blank" rel="noreferrer">Mở kênh</a>}
                  </Space>
                  <Space wrap>
                    <Tag color={channel.verification?.environment === 'SANDBOX' ? 'warning'
                      : channel.verifiedByInfluencerMatch ? 'success' : 'default'}>{verificationLabel(channel)}</Tag>
                    <Button danger disabled={!!working} onClick={() => { setUnlinkError(''); setUnlinkTarget(channel); }}>
                      Gỡ liên kết
                    </Button>
                  </Space>
                </div>;
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
    </Space>
  );
}
