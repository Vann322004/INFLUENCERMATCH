import { Alert, Button, Progress, Space } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../../services/apiClient';
import type { VideoPlayback } from '../../types/api/collaboration.types';

export const MAX_DRAFT_VIDEO_BYTES = 100_000_000;

function formatSize(bytes: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(bytes / 1_000_000) + ' MB';
}

export function DraftVideoField({ file, disabled, percent, onChange }: {
  file?: File;
  disabled: boolean;
  percent?: number;
  onChange: (file?: File) => void;
}) {
  const [preview, setPreview] = useState<string>();
  const [error, setError] = useState('');
  useEffect(() => {
    if (!file) {
      setPreview(undefined);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return <div className="execution-draft-video">
    <label htmlFor="collaboration-draft-file"><strong>Video bản nháp</strong></label>
    <input id="collaboration-draft-file" type="file" accept=".mp4,video/mp4" disabled={disabled}
      aria-describedby="collaboration-draft-format" onChange={event => {
        const selected = event.currentTarget.files?.[0];
        event.currentTarget.value = '';
        if (!selected) return;
        const invalid = !selected.name.toLowerCase().endsWith('.mp4') || selected.size === 0
          ? 'Hãy chọn tệp video MP4.' : selected.size > MAX_DRAFT_VIDEO_BYTES
            ? 'Video vượt quá 100 MB.' : '';
        setError(invalid);
        onChange(invalid ? undefined : selected);
      }} />
    <small id="collaboration-draft-format">Tệp MP4 tối đa 100 MB. Khuyến nghị H.264/AAC để phát trên trình duyệt.</small>
    {error && <Alert type="error" title={error} showIcon />}
    {file && <Space wrap>
      <span>{file.name} · {formatSize(file.size)}</span>
      <Button type="link" disabled={disabled} onClick={() => { onChange(undefined); setError(''); }}>Bỏ video</Button>
    </Space>}
    {preview && <video key={preview} src={preview} controls playsInline preload="metadata" aria-label="Xem trước video đã chọn" />}
    {percent != null && <>
      <Progress percent={percent} status="active" />
      <small>{percent === 100 ? 'Đang xác nhận bản nộp…' : 'Đang tải video…'}</small>
    </>}
  </div>;
}

export function DraftVideoPlayer({ name, size, request }: {
  name: string;
  size?: number | null;
  request: (signal: AbortSignal) => Promise<VideoPlayback>;
}) {
  const [playback, setPlayback] = useState<VideoPlayback>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = useRef<AbortController>(null);
  const resume = useRef({ time: 0, play: false });
  const position = useRef(0);
  useEffect(() => () => load.current?.abort(), []);

  async function open(video?: HTMLVideoElement, play?: boolean) {
    if (load.current) return;
    const controller = new AbortController();
    load.current = controller;
    setBusy(true);
    setError('');
    if (video) resume.current = { time: video.currentTime || position.current, play: play ?? !video.paused };
    try {
      const response = await request(controller.signal);
      if (!controller.signal.aborted) setPlayback(response);
    } catch (cause) {
      if (!controller.signal.aborted) setError(getErrorMessage(cause, 'Không mở được video. Vui lòng thử lại.'));
    } finally {
      load.current = null;
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  return <div className="execution-draft-video">
    <span>{name}{size != null && <> · {formatSize(size)}</>}</span>
    {error && <Alert type="error" showIcon title={error} />}
    {(!playback || error) && <div><Button size="small" loading={busy} onClick={() => void open()}>
      {error ? 'Thử mở lại video' : 'Xem video bản nháp'}
    </Button></div>}
    {playback && !error && <video key={playback.url} src={playback.url} controls playsInline preload="metadata"
      aria-label={name}
      onLoadedMetadata={event => {
        const video = event.currentTarget;
        if (resume.current.time > 0) video.currentTime = resume.current.time;
        if (resume.current.play) void video.play().catch(() => {});
        resume.current = { time: 0, play: false };
      }}
      onTimeUpdate={event => { position.current = event.currentTarget.currentTime; }}
      onPlay={event => {
        if (Date.parse(playback.expiresAt) <= Date.now()) void open(event.currentTarget, true);
      }}
      onSeeking={event => {
        if (Date.parse(playback.expiresAt) <= Date.now()) void open(event.currentTarget);
      }}
      onError={event => {
        if (Date.parse(playback.expiresAt) <= Date.now()) void open(event.currentTarget);
        else setError('Không phát được video. Hãy thử lại hoặc đề nghị Creator gửi video MP4 với H.264/AAC.');
      }} />}
  </div>;
}
