import React from 'react';
import { Link } from 'react-router-dom';
import { Alert, Select, Tag, Input, Slider, Button } from 'antd';
import type { Niche } from '../../../../../services/api/nicheService';

const { Option } = Select;
const { TextArea } = Input;

const PLATFORM_LABELS: Record<string, string> = {
  ALL: 'TikTok & Facebook',
  TIKTOK: 'TikTok',
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
};

export interface HunterSetupCardProps {
  topics: Niche[];
  topicsLoading: boolean;
  topicsError: string;
  topicsManagementPath: string;
  onReloadTopics: () => void;
  mode: 'category' | 'custom';
  platform: string;
  selectedTopic: string;
  activeKeywords: string[];
  customUsernames: string;
  onCustomUsernamesChange: (val: string) => void;
  maxKocs: number;
  loading: boolean;
  onPlatformChange: (p: string) => void;
  onSelectTopic: (topicId: string) => void;
  onKeywordsChange: (keywords: string[]) => void;
  onMaxKocsChange: (val: number) => void;
  onStartHunting: () => void;
}

export default function HunterSetupCard({
  topics,
  topicsLoading,
  topicsError,
  topicsManagementPath,
  mode,
  platform,
  selectedTopic,
  activeKeywords,
  customUsernames,
  onCustomUsernamesChange,
  maxKocs,
  loading,
  onPlatformChange,
  onSelectTopic,
  onKeywordsChange,
  onMaxKocsChange,
  onStartHunting,
}: HunterSetupCardProps) {
  const [customInput, setCustomInput] = React.useState('');
  const platforms = mode === 'category' ? ['ALL', 'TIKTOK', 'FACEBOOK'] : ['TIKTOK', 'FACEBOOK', 'INSTAGRAM'];
  const effectivePlatform = platforms.includes(platform) ? platform : mode === 'category' ? 'ALL' : 'TIKTOK';
  React.useEffect(() => {
    if (effectivePlatform !== platform) onPlatformChange(effectivePlatform);
  }, [effectivePlatform, platform, onPlatformChange]);

  const handleAddKeyword = () => {
    const kw = customInput.trim().replace(/^#/, '');
    if (!loading && kw && activeKeywords.length < 30 && !activeKeywords.includes(kw)) {
      onKeywordsChange([...activeKeywords, kw]);
      setCustomInput('');
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    onKeywordsChange(activeKeywords.filter((k) => k !== kw));
  };

  const accounts = customUsernames.split(/[\n,]+/).map(value => value.trim()).filter(Boolean);
  const selected = topics.find(topic => topic.id === selectedTopic);
  const platformLabel = PLATFORM_LABELS[effectivePlatform] || effectivePlatform;
  const blockedReason = loading ? '' : mode === 'category'
    ? topicsLoading ? 'Đang tải danh sách lĩnh vực…'
      : topicsError ? 'Tải lại lĩnh vực để tiếp tục.'
      : !selected ? 'Chọn một lĩnh vực để bắt đầu.'
      : !activeKeywords.length ? 'Thêm ít nhất một từ khóa để bắt đầu.' : ''
    : !accounts.length ? 'Nhập ít nhất một tài khoản để bắt đầu.' : '';

  return <section className="collection-hunter-setup">
    <div className="collection-config-main">
      <header className="collection-config-title">
        <h2>{mode === 'category' ? 'Thiết lập tìm kiếm' : 'Thêm tài khoản cần thu thập'}</h2>
        <p>{mode === 'category' ? 'Tìm kênh mới theo lĩnh vực và từ khóa bạn chọn.' : 'Nhập một hoặc nhiều kênh trên cùng nền tảng.'}</p>
      </header>

      <div className="collection-platform-field">
        <label htmlFor={`platform-${mode}`}>Nền tảng</label>
        <Select id={`platform-${mode}`} aria-label="Nền tảng" disabled={loading} value={effectivePlatform}
          onChange={onPlatformChange} size="large">
          {mode === 'category' && <Option value="ALL">TikTok và Facebook</Option>}
          <Option value="TIKTOK">TikTok</Option>
          <Option value="FACEBOOK">Facebook</Option>
          {mode === 'custom' && <Option value="INSTAGRAM">Instagram</Option>}
        </Select>
      </div>

      {mode === 'category' ? <>
        <section className="collection-field-section">
          <div className="collection-field-heading"><h3>Lĩnh vực</h3><Link to={topicsManagementPath}>Quản lý lĩnh vực ↗</Link></div>
          {topicsLoading ? <p className="collection-field-help">Đang tải lĩnh vực…</p>
            : topicsError ? <Alert type="error" showIcon title="Không tải được lĩnh vực" description={topicsError}
              action={<Button disabled={loading} onClick={onReloadTopics}>Thử lại</Button>} />
            : !topics.length ? <Alert type="info" showIcon title="Chưa có lĩnh vực đang bật"
              description={<Link to={topicsManagementPath}>Thêm hoặc bật lĩnh vực để tìm kiếm</Link>} />
            : <div className="collection-topic-grid">{topics.map(topic =>
              <Button key={topic.id} className={topic.id === selectedTopic ? 'is-selected' : ''}
                aria-pressed={topic.id === selectedTopic} disabled={loading} onClick={() => onSelectTopic(topic.id)}>
                <span className="collection-topic-indicator" aria-hidden="true">{topic.id === selectedTopic ? '✓' : ''}</span>
                <span>{topic.name}</span>
              </Button>)}</div>}
        </section>

        <section className="collection-field-section collection-keywords">
          <div className="collection-field-heading"><h3>Từ khóa tìm kiếm</h3><span>{activeKeywords.length}/30</span></div>
          <p className="collection-field-help">Từ khóa được gợi ý theo lĩnh vực. Có thể chỉnh cho lượt này.</p>
          <div className="collection-keyword-editor">
            <div className="collection-keyword-tags">
              {activeKeywords.map(kw => <Tag key={kw} closable={!loading} onClose={() => handleRemoveKeyword(kw)}>#{kw}</Tag>)}
              {!activeKeywords.length && <span className="collection-keyword-empty">Chưa có từ khóa. Thêm từ khóa bên dưới.</span>}
            </div>
            <div className="collection-keyword-entry">
              <Input aria-label="Thêm từ khóa" variant="borderless" placeholder="Nhập từ khóa hoặc hashtag…"
                value={customInput} disabled={loading || activeKeywords.length >= 30}
                onChange={event => setCustomInput(event.target.value)} onPressEnter={handleAddKeyword} />
              <Button type="text" onClick={handleAddKeyword}
                disabled={loading || !customInput.trim().replace(/^#/, '') || activeKeywords.length >= 30}>+ Thêm</Button>
            </div>
          </div>
        </section>
      </> : <section className="collection-field-section">
        <div className="collection-field-heading"><h3>Tài khoản hoặc đường dẫn kênh</h3><span>{accounts.length} kênh</span></div>
        <p className="collection-field-help">Mỗi dòng một tài khoản, hoặc ngăn cách bằng dấu phẩy.</p>
        <TextArea aria-label="Danh sách tài khoản" rows={7} disabled={loading} value={customUsernames}
          placeholder={'@schannelvn\n@duytham\nhttps://www.tiktok.com/@linh.beauty'}
          onChange={event => onCustomUsernamesChange(event.target.value)} />
      </section>}
    </div>

    <aside className="collection-config-sidebar">
      <div className="collection-sidebar-body">
        <div className="collection-sidebar-heading">
          <h3>Phạm vi thu thập</h3>
          <p className="collection-sidebar-copy">Chọn số kênh tối đa cho lượt này.</p>
        </div>

        <div className="collection-scope-card">
          <div className="collection-channel-row">
            <span className="collection-channel-label">Số kênh tối đa</span>
            <div className="collection-channel-count"><strong>{maxKocs}</strong><span>kênh / lượt</span></div>
          </div>
          <Slider
            aria-label="Số kênh thu thập tối đa"
            min={1}
            max={20}
            step={1}
            marks={{ 1: '1', 5: '5', 10: '10', 15: '15', 20: '20' }}
            value={maxKocs}
            disabled={loading}
            onChange={onMaxKocsChange}
          />
        </div>

        <div className="collection-summary-list">
          <div className="collection-summary-row">
            <span>Nền tảng</span>
            <strong>{platformLabel}</strong>
          </div>
          {mode === 'category' ? <>
            <div className="collection-summary-row">
              <span>Lĩnh vực</span>
              <strong>{selected?.name || 'Chưa chọn'}</strong>
            </div>
            <div className="collection-summary-row">
              <span>Từ khóa</span>
              <strong>{activeKeywords.length} từ khóa</strong>
            </div>
          </> : <>
            <div className="collection-summary-row">
              <span>Đã nhập</span>
              <strong>{accounts.length} tài khoản</strong>
            </div>
            <div className="collection-summary-row">
              <span>Sẽ xử lý</span>
              <strong>{Math.min(accounts.length, maxKocs)} kênh</strong>
            </div>
          </>}
        </div>

        <p className="collection-limit-note">{mode === 'category'
          ? 'Số kênh thực tế phụ thuộc vào kết quả tìm kiếm phù hợp.'
          : `Xử lý tối đa ${Math.min(accounts.length, maxKocs)} trong ${accounts.length} kênh đã nhập.`}</p>
      </div>

      <div className="collection-start-section">
        <Button type="primary" size="large" block loading={loading} disabled={!!blockedReason} onClick={onStartHunting}>
          {loading ? 'Đang thu thập…' : 'Bắt đầu thu thập'}
        </Button>
        <p className={blockedReason ? 'collection-start-hint' : 'collection-ready-hint'} aria-live="polite">
          {blockedReason || (loading ? 'Kết quả sẽ hiển thị bên dưới khi hoàn tất.' : 'Đã đủ thông tin để bắt đầu.')}
        </p>
      </div>
    </aside>
  </section>;
}

