import { useState } from 'react';
import type { CSSProperties } from 'react';

interface Props { src?: string | null; alt?: string; className?: string; style?: CSSProperties; onClick?: () => void }
export default function CampaignImage({ src, alt = 'Ảnh chiến dịch', className, style, onClick }: Props) {
  const [failed, setFailed] = useState('');
  return <img src={src && src !== failed ? src : '/images/campaign-placeholder.svg'} alt={alt}
    className={className} style={style} onClick={onClick} referrerPolicy="no-referrer"
    onError={() => { if (src && src !== failed) setFailed(src); }} />;
}
