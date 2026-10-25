import React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { useMotionTokens, useShouldReduceMotion } from '@animate-ui/react/utils/motion';

type MotionCardProps = HTMLMotionProps<'div'> & {
  /** Card có bấm được không (có press scale). Mặc định: có nếu truyền onClick. */
  pressable?: boolean;
};

/**
 * Card / ô / dòng bấm được (recipe card.md):
 * - Bấm: cả card co về 0.985 (`scale.choice`) trên `spring.press`.
 * - Hover KHÔNG scale – chỉ đổi bóng/viền qua class `.motion-card` trong custom.css.
 * - Reduced motion: không co, chỉ còn đổi bóng.
 */
export default function MotionCard({ pressable, onClick, className, children, ...rest }: MotionCardProps) {
  const { spring, scale } = useMotionTokens();
  const reduce = useShouldReduceMotion();
  const canPress = pressable ?? Boolean(onClick);
  const pressed = reduce || !canPress ? 'scale(1)' : `scale(${scale.choice})`;

  return (
    <motion.div
      initial={{ transform: 'scale(1)' }}
      whileTap={{ transform: pressed }}
      transition={spring.press}
      onClick={onClick}
      className={['motion-card', canPress ? 'motion-card--pressable' : '', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
