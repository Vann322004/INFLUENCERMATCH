import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useMotionTokens, useShouldReduceMotion } from '@animate-ui/react/utils/motion';

/**
 * Đổi nội dung tại chỗ (recipe swap.md): loading → dữ liệu, tab → tab, trạng thái A → B.
 * Nội dung cũ mờ đi nhanh, nội dung mới hiện ra qua một chút blur – không scale, không trượt xa.
 */
export default function FadeSwap({
  swapKey,
  children,
  style,
  className,
}: {
  swapKey: React.Key;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  const { transition, blur } = useMotionTokens();
  const reduce = useShouldReduceMotion();
  const hidden = { opacity: 0, filter: reduce ? 'none' : blur.icon };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={swapKey}
        style={style}
        className={className}
        initial={hidden}
        animate={{ opacity: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
        exit={{ ...hidden, transition: transition.swap }}
        transition={transition.fade}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
