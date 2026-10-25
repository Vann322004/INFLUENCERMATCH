import React from 'react';
import { AnimateUIProvider } from '@animate-ui/react/provider';
import { ReducedMotionConfig } from '@animate-ui/react/utils/motion';

/**
 * Gốc chuyển động của toàn app.
 * - AnimateUIProvider: `tempo` nhân toàn bộ thời lượng animation (1 = mặc định,
 *   0.85 nhanh hơn, 1.15 chậm hơn) – đổi một chỗ là cả app theo.
 * - ReducedMotionConfig: tôn trọng cài đặt "giảm chuyển động" của hệ điều hành
 *   (nội dung vẫn fade, không di chuyển).
 */
export default function MotionRoot({ children, tempo = 1 }: { children: React.ReactNode; tempo?: number }) {
  return (
    <AnimateUIProvider tempo={tempo} reducedMotion="user">
      <ReducedMotionConfig>{children}</ReducedMotionConfig>
    </AnimateUIProvider>
  );
}
