export interface TopicPreset {
  id: string;
  label: string;
  keywords: string[];
}

export const TOPIC_PRESETS: TopicPreset[] = [
  {
    id: 'beauty',
    label: 'Làm đẹp & Mỹ phẩm',
    keywords: ['review mỹ phẩm', 'skincare review', 'makeup tutorial', 'son môi hot'],
  },
  {
    id: 'food',
    label: 'Ẩm thực & Nhà hàng',
    keywords: ['review đồ ăn', 'món ngon đường phố', 'quán ăn hà nội', 'food tour sài gòn'],
  },
  {
    id: 'tech',
    label: 'Công nghệ & Điện thoại',
    keywords: ['review công nghệ', 'đập hộp điện thoại', 'setup bàn làm việc', 'đồ chơi công nghệ'],
  },
  {
    id: 'fashion',
    label: 'Thời trang & Phối đồ',
    keywords: ['review thời trang', 'haul quần áo shopee', 'phối đồ đẹp', 'ootd vietnam'],
  },
  {
    id: 'travel',
    label: 'Du lịch & Trải nghiệm',
    keywords: ['review du lịch', 'check-in đà lạt', 'khám phá việt nam', 'kinh nghiệm du lịch'],
  },
  {
    id: 'lifestyle',
    label: 'Đời sống & Gia đình',
    keywords: ['review gia dụng', 'mẹo vặt cuộc sống', 'decor phòng ngủ', 'daily vlog'],
  },
];

