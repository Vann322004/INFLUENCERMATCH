import { useEffect, useRef, useState } from 'react';
import { App, Button } from 'antd';
import { CameraOutlined } from '@ant-design/icons';
import { validateImageFile } from '../../services/api/imageUploadService';
import { getErrorMessage } from '../../services/apiClient';

interface Props {
  label?: string;
  disabled?: boolean;
  upload: (file: File, signal: AbortSignal) => Promise<void>;
  onBusyChange?: (busy: boolean) => void;
}

export default function ImageUploadButton({ label = 'Đổi ảnh', disabled, upload, onBusyChange }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false);
  const { message } = App.useApp();
  useEffect(() => () => { request.current?.abort(); }, []);
  async function choose(file?: File) {
    if (!file || disabled || request.current) return;
    try { validateImageFile(file); } catch (error) {
      message.error((error as Error).message); return;
    }
    const controller = new AbortController();
    request.current = controller;
    setBusy(true); onBusyChange?.(true);
    try {
      await upload(file, controller.signal);
      if (!controller.signal.aborted) message.success('Đã cập nhật ảnh.');
    } catch (error) {
      if (!controller.signal.aborted) message.error(getErrorMessage(error, 'Không tải được ảnh lên. Ảnh cũ được giữ nguyên.'));
    } finally {
      request.current = null;
      if (!controller.signal.aborted) { setBusy(false); onBusyChange?.(false); }
    }
  }
  return <>
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={disabled || busy}
      onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; void choose(file); }} />
    <Button icon={<CameraOutlined />} disabled={disabled || busy} loading={busy} onClick={() => input.current?.click()}>{label}</Button>
  </>;
}
