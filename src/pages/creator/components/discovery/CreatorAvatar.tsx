import React from 'react';
import { Avatar } from 'antd';

interface CreatorAvatarProps {
  src?: string;
  name?: string;
  size?: number;
  style?: React.CSSProperties;
}

export const CreatorAvatar: React.FC<CreatorAvatarProps> = ({ src, name, size = 48, style }) => {
  const cleanName = name || 'Creator';
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=4F46E5&color=fff&size=150&bold=true`;
  const initial = cleanName.trim().charAt(0).toUpperCase() || 'C';

  return (
    <Avatar
      src={
        src ? (
          <img
            src={src}
            alt={cleanName}
            referrerPolicy="no-referrer"
            onError={(e) => {
              const img = e.currentTarget;
              if (img.src !== fallbackUrl) {
                img.src = fallbackUrl;
              }
            }}
          />
        ) : (
          fallbackUrl
        )
      }
      size={size}
      style={{
        border: '2px solid #E2E8F0',
        flexShrink: 0,
        backgroundColor: '#4F46E5',
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

