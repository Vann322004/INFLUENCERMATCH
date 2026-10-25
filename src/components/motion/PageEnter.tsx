import React from 'react';
import { motion } from 'motion/react';
import { useLocation } from 'react-router-dom';
import {
  ReducedMotionConfig,
  useMotionTokens,
  useShouldReduceMotion,
} from '@animate-ui/react/utils/motion';

/**
 * Hiệu ứng vào trang (recipe page.md, mức subtle):
 * nội dung trang mới fade lên từ 8px + bỏ blur nhẹ khi đổi route.
 *
 * - Key theo `pathname` (không theo query) → chỉ chạy khi đổi trang, không chạy khi đổi bộ lọc trên URL.
 * - Khi xong, `transform` và `filter` được trả về `none`: nếu để lại `translateY(0)` / `blur(0)`
 *   thì các phần tử `position: fixed` bên trong trang (thanh hành động dưới, nút AI tròn…)
 *   sẽ bị định vị theo khung này thay vì theo màn hình.
 */
function PageEnterInner({ children }: { children: React.ReactNode }) {
  const { spring, transition, blur } = useMotionTokens();
  const reduce = useShouldReduceMotion();

  return (
    <motion.div
      initial={{
        opacity: 0,
        transform: reduce ? 'none' : 'translateY(8px)',
        filter: reduce ? 'none' : blur.icon,
      }}
      animate={{
        opacity: 1,
        transform: reduce ? 'none' : 'translateY(0px)',
        filter: reduce ? 'none' : 'blur(0px)',
        transitionEnd: { transform: 'none', filter: 'none' },
      }}
      transition={{
        opacity: transition.reveal,
        filter: transition.reveal,
        transform: spring.entrance,
      }}
    >
      {children}
    </motion.div>
  );
}

export default function PageEnter({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return (
    <ReducedMotionConfig remount>
      <PageEnterInner key={pathname}>{children}</PageEnterInner>
    </ReducedMotionConfig>
  );
}
