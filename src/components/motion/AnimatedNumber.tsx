import React from 'react';
import { CountingNumber } from '@animate-ui/react/primitives/texts/counting-number';

type AnimatedNumberProps = {
  /** Giá trị đích */
  value: number;
  /** Số chữ số thập phân (vd 4.8% → 1) */
  decimals?: number;
  /** Bắt đầu đếm từ đâu (vd 99.9% nên đếm từ 90 chứ không từ 0) */
  from?: number;
  /** Ký tự trước / sau số, giữ là text thường (₫, %, +, M…) */
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
};

/**
 * Số thống kê đếm lên khi cuộn tới (recipe page.md):
 * - `tabular-nums` để chiều rộng không giật khi đếm.
 * - Dấu phân cách nghìn kiểu Việt Nam (".") và thập phân (",").
 * - Reduced motion / screen reader: hiển thị luôn giá trị cuối.
 */
export default function AnimatedNumber({
  value,
  decimals = 0,
  from,
  prefix,
  suffix,
  style,
  className,
}: AnimatedNumberProps) {
  const safe = Number.isFinite(value) ? value : 0;
  return (
    <span className={className} style={{ fontVariantNumeric: 'tabular-nums', ...style }}>
      {prefix}
      <CountingNumber
        number={safe}
        fromNumber={from}
        decimalPlaces={decimals}
        thousandSeparator="."
        decimalSeparator=","
        inView
        inViewOnce
      />
      {suffix}
    </span>
  );
}
