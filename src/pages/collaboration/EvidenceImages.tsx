import { useEffect, useState } from 'react';
import { Alert, Button, Card, Empty, Image, Space, Spin } from 'antd';
import ImageUploadButton from '../../components/common/ImageUploadButton';
import { collaborationService, type EvidenceImage } from '../../services/api/collaborationService';

export default function EvidenceImages({ id, canUpload }: { id: string; canUpload: boolean }) {
  const [images, setImages] = useState<EvidenceImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(false);
    collaborationService.evidence(id, controller.signal)
      .then(rows => { if (!controller.signal.aborted) setImages(rows.filter(row => row.assetType === 'INSIGHTS_SCREENSHOT')); })
      .catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, attempt]);
  return <Card title="Ảnh minh chứng & bàn giao" extra={canUpload && <ImageUploadButton label="Tải ảnh minh chứng"
    disabled={loading || error} upload={async (file, signal) => {
      const saved = await collaborationService.uploadEvidenceImage(id, file, signal);
      if (!signal.aborted) setImages(previous => [saved, ...previous]);
    }} />}>
    <Spin spinning={loading}>
      {error ? <Alert type="error" title="Không tải được ảnh minh chứng."
        action={<Button onClick={() => setAttempt(value => value + 1)}>Thử lại</Button>} />
        : images.length ? <Image.PreviewGroup><Space wrap>{images.map(image => <Image key={image.id}
          src={image.storageUrl} alt="Ảnh minh chứng hợp tác" width={120} height={90} style={{ objectFit: 'contain' }}
          referrerPolicy="no-referrer" fallback="/images/campaign-placeholder.svg" />)}</Space></Image.PreviewGroup>
        : !loading && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có ảnh minh chứng" />}
    </Spin>
  </Card>;
}
