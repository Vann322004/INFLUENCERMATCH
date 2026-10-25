import React from 'react';
import { Effects } from '@animate-ui/react/primitives/effects/effect';

/**
 * Các khối trong trang xuất hiện lần lượt (recipe page.md):
 * fade + trượt 16px + blur nhẹ, cách nhau 80ms, chạy khi khối cuộn vào màn hình (1 lần).
 *
 * `asChild`: dùng trong grid/flex để các con vẫn là item của layout.
 */
export default function StaggerIn({
  children,
  asChild,
  delay = 0,
  gap = 80,
}: {
  children: React.ReactElement | React.ReactElement[];
  asChild?: boolean;
  delay?: number;
  gap?: number;
}) {
  return (
    <Effects
      asChild={asChild}
      delay={delay}
      holdDelay={gap}
      fade
      slide={{ direction: 'up', offset: 16 }}
      blur={{ initialBlur: 4 }}
      inView
      inViewOnce
    >
      {children}
    </Effects>
  );
}
