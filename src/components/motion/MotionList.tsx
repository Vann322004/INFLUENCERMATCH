import React from 'react';
import { AnimatePresence, motion, type HTMLMotionProps } from 'motion/react';
import { useMotionTokens, useShouldReduceMotion } from '@animate-ui/react/utils/motion';

/**
 * Danh sách thêm / xóa phần tử (interactions/list.md).
 * Dùng:
 *   <MotionList>
 *     {items.map((it) => <MotionListItem key={it.id}>…</MotionListItem>)}
 *   </MotionList>
 *
 * - Phần tử mới: fade + trượt lên 8px.
 * - Phần tử bị xóa: mờ đi nhanh, các phần tử còn lại trượt vào chỗ trống (`layout`).
 * - `initial={false}`: lần render đầu không chạy, chỉ thay đổi về sau mới animate.
 */
export function MotionList({ children }: { children: React.ReactNode }) {
  return (
    <AnimatePresence initial={false} mode="popLayout">
      {children}
    </AnimatePresence>
  );
}

export const MotionListItem = React.forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(function MotionListItem(
  { children, ...rest },
  ref,
) {
  const { spring, transition } = useMotionTokens();
  const reduce = useShouldReduceMotion();

  return (
    <motion.div
      ref={ref}
      layout={reduce ? false : 'position'}
      initial={{ opacity: 0, transform: reduce ? 'none' : 'translateY(8px)' }}
      animate={{ opacity: 1, transform: 'translateY(0px)', transitionEnd: { transform: 'none' } }}
      exit={{ opacity: 0, transform: reduce ? 'none' : 'scale(0.96)', transition: transition.popOut }}
      transition={{ opacity: transition.reveal, transform: spring.entrance, layout: spring.reflow }}
      {...rest}
    >
      {children}
    </motion.div>
  );
});
