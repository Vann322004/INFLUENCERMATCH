import { useEffect, useRef, useState } from 'react';
import { Button, Input } from 'antd';
import { UploadOutlined, DeleteOutlined, PictureOutlined } from '@ant-design/icons';
import { campaignService } from '../../../../services/api/campaignService';

interface Props {
  value: string;
  onChange: (url: string) => void;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
}

export default function CampaignImagePicker({ value, onChange, disabled, onBusyChange }: Props) {
  const [mode, setMode] = useState<'upload' | 'link'>('upload');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [failedUrl, setFailedUrl] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => { request.current?.abort(); }, []);
  const preview = /^https:\/\//i.test(value.trim()) && value.trim() !== failedUrl ? value.trim() : '';

  const upload = async (file?: File) => {
    if (!file || disabled || request.current) return;
    setError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size === 0 || file.size > 5 * 1024 * 1024) {
      setError('Chọn ảnh JPG, PNG hoặc WEBP, tối đa 5 MB.');
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    onBusyChange(true);
    try {
      const url = await campaignService.uploadImage(file, controller.signal);
      if (!controller.signal.aborted) { setFailedUrl(''); onChange(url); }
    } catch (error: unknown) {
      if (!controller.signal.aborted) {
        const response = (error as { response?: { status?: number; data?: { code?: string } } }).response;
        setError(response?.data?.code === 'CAMPAIGN_IMAGE_UNAVAILABLE'
          ? 'Chưa thể tải ảnh lên. Bạn có thể dán đường link hoặc thử lại sau.'
          : response?.status === 413 ? 'Ảnh vượt giới hạn tải lên. Chọn ảnh nhỏ hơn 5 MB.'
          : 'Không thể tải ảnh lên. Ảnh hiện tại vẫn được giữ; vui lòng thử lại.');
      }
    } finally {
      request.current = null;
      if (!controller.signal.aborted) { setBusy(false); onBusyChange(false); }
    }
  };

  return <section className="workflow-panel campaign-image-picker">
    <div className="campaign-image-heading"><h3>Ảnh chiến dịch <span>(không bắt buộc)</span></h3>
      <div className="campaign-image-tabs" role="group" aria-label="Cách chọn ảnh">
        <Button type={mode === 'upload' ? 'primary' : 'text'} size="small" disabled={disabled || busy} aria-pressed={mode === 'upload'} onClick={() => { setMode('upload'); setError(''); }}>Tải ảnh lên</Button>
        <Button type={mode === 'link' ? 'primary' : 'text'} size="small" disabled={disabled || busy} aria-pressed={mode === 'link'} onClick={() => { setMode('link'); setError(''); }}>Dán đường link</Button>
      </div>
    </div>
    <div className="campaign-image-content">
      <div className="campaign-image-preview">{preview ? <img src={preview} alt="Xem trước ảnh chiến dịch" referrerPolicy="no-referrer" onError={() => setFailedUrl(preview)} /> : <PictureOutlined aria-label="Chưa có ảnh xem trước" />}</div>
      <div className="campaign-image-controls">
        {mode === 'upload' ? <><input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={disabled || busy} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; void upload(file); }} />
          <Button icon={<UploadOutlined />} loading={busy} disabled={disabled || busy} onClick={() => fileInput.current?.click()}>{busy ? 'Đang tải ảnh' : value ? 'Đổi ảnh' : 'Chọn ảnh'}</Button><span className="campaign-image-hint">JPG, PNG, WEBP · Tối đa 5 MB</span></>
          : <Input aria-label="Đường link ảnh chiến dịch" type="url" maxLength={2048} value={value} disabled={disabled || busy} placeholder="https://…" onChange={event => { setError(''); onChange(event.target.value); }} />}
        {value && <Button type="text" icon={<DeleteOutlined />} disabled={disabled || busy} onClick={() => { onChange(''); setError(''); }}>Bỏ ảnh</Button>}
        {error && <p className="campaign-image-error" role="alert">{error}</p>}
        {value && value.trim() === failedUrl && <p className="campaign-image-hint">Không tải được ảnh xem trước. Kiểm tra lại đường link.</p>}
      </div>
    </div>
  </section>;
}
