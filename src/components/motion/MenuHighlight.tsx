import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useMotionTokens, useShouldReduceMotion } from '@animate-ui/react/utils/motion';

type Box = { x: number; y: number; w: number; h: number };

interface MenuHighlightProps {
  /** Key đang được chọn của antd Menu – đổi key thì nền highlight trượt sang mục mới. */
  activeKey: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Nền highlight trượt cho antd `Menu` (recipe indicator.md, token `spring.highlight`).
 *
 * antd không có primitive Highlight, nên ta đo `.ant-menu-item-selected` và đặt một lớp nền
 * phía sau Menu. Chỉ `transform` được animate; kích thước được gán thẳng (không animate width/height).
 * - Đổi trang  → trượt bằng spring.
 * - Submenu mở/đóng, sidebar thu gọn (ResizeObserver) → bám theo tức thì, không trượt.
 * - Mục được chọn bị ẩn (submenu đóng) → nền mờ đi, lần hiện lại không trượt từ vị trí cũ.
 */
export default function MenuHighlight({ activeKey, children, className }: MenuHighlightProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(false);
  const [box, setBox] = useState<Box | null>(null);
  const [visible, setVisible] = useState(false);
  const [instant, setInstant] = useState(true);
  const { spring } = useMotionTokens();
  const reduce = useShouldReduceMotion();

  const measure = useCallback((animate: boolean) => {
    const root = rootRef.current;
    if (!root) return;
    const el = root.querySelector<HTMLElement>('.ant-menu-item-selected');
    const r = el?.getBoundingClientRect();
    if (!el || !r || r.height === 0 || r.width === 0) {
      visibleRef.current = false;
      setVisible(false);
      return;
    }
    const p = root.getBoundingClientRect();
    // Không trượt nếu nền đang ẩn (tránh bay từ vị trí cũ đã lỗi thời).
    setInstant(!animate || !visibleRef.current);
    visibleRef.current = true;
    setVisible(true);
    setBox({ x: r.left - p.left, y: r.top - p.top, w: r.width, h: r.height });
  }, []);

  // Đổi mục chọn → trượt
  useLayoutEffect(() => {
    measure(true);
  }, [activeKey, measure]);

  // Thay đổi bố cục (submenu mở/đóng, thu gọn sidebar) → bám theo tức thì
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measure(false));
    ro.observe(root);
    return () => ro.disconnect();
  }, [measure]);

  const noMotion = instant || reduce;

  return (
    <div ref={rootRef} className={`menu-glide${className ? ` ${className}` : ''}`}>
      {box && (
        <motion.div
          aria-hidden
          className="menu-glide__indicator"
          initial={false}
          style={{ width: box.w, height: box.h }}
          animate={{ x: box.x, y: box.y, opacity: visible ? 1 : 0 }}
          transition={{
            x: noMotion ? { duration: 0 } : spring.highlight,
            y: noMotion ? { duration: 0 } : spring.highlight,
            opacity: { duration: 0.12 },
          }}
        />
      )}
      {children}
    </div>
  );
}
