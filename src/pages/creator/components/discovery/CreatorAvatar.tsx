import React, { useState } from 'react';
import { Avatar } from 'antd';
import { creatorProfileImage } from './discoveryUtils';

interface CreatorAvatarProps {
  src?: string;
  name?: string;
  size?: number;
  style?: React.CSSProperties;
}

export const CreatorAvatar: React.FC<CreatorAvatarProps> = ({ src, name, size = 48, style }) => {
  const cleanName = name || 'Creator';
  const imageUrl = creatorProfileImage(src);
  const [failedUrl, setFailedUrl] = useState('');
  const words = cleanName.trim().split(/\s+/).filter(Boolean);
  const initial = (words.length > 1 ? words[0][0] + words[words.length - 1][0] : cleanName.trim().slice(0, 2)).toLocaleUpperCase('vi-VN') || 'C';

  return (
    <Avatar
      src={
        imageUrl && imageUrl !== failedUrl ? (
          <img
            src={imageUrl}
            alt={cleanName}
            referrerPolicy="no-referrer"
            onError={() => setFailedUrl(imageUrl)}
          />
        ) : (
          undefined
        )
      }
      size={size}
      style={{
        border: '2px solid #E2E8F0',
        flexShrink: 0,
        backgroundColor: '#6D28D9',
        color: '#ffffff',
        fontWeight: 500,
        ...style,
      }}
    >
      {initial}
    </Avatar>
  );
};

export default CreatorAvatar;

