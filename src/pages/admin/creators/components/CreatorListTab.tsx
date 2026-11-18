import { useEffect, useState } from 'react';
import { Alert, Avatar, Button, Descriptions, Drawer, Input, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { creatorService } from '../../../../services/api/creatorService';
import type { CreatorItem } from '../../../../types/api/creator.types';

export default function CreatorListTab() {
  const [items, setItems] = useState<CreatorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CreatorItem | null>(null);
  async function load(force = false) {
    setLoading(true); setError('');
    try {
      if (force) creatorService.getCreators.invalidate();
      setItems(await creatorService.getCreators());
    } catch { setError('Không tải được hồ sơ kênh.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  const columns: TableColumnsType<CreatorItem> = [
    { title:'Kênh', key:'channel', render:(_, row)=><div style={{display:'flex',gap:10,alignItems:'center'}}><Avatar src={row.avatarUrl} icon={<UserOutlined />} /><div><strong>{row.displayName || row.userName || 'Chưa có tên'}</strong><div>{row.userName || '—'}</div></div></div> },
    { title:'Nền tảng', dataIndex:'platform', render:value=>value ? <Tag>{value}</Tag> : '—' },
    { title:'Mã kênh trên nền tảng', dataIndex:'externalId', render:value=><span style={{overflowWrap:'anywhere'}}>{value || '—'}</span> },
    { title:'Người theo dõi', dataIndex:'followers', render:value=>typeof value==='number' ? value.toLocaleString('vi-VN') : 'Chưa có dữ liệu' },
    { title:'Xác minh InfluencerMatch', key:'verified', render:(_,row)=>row.verifiedByInfluencerMatch===true ? <Tag color="success">Đã xác minh</Tag> : row.verifiedByInfluencerMatch===false ? <Tag>Chưa xác minh</Tag> : 'Chưa có dữ liệu' },
    { title:'', key:'detail', render:(_,row)=><Button onClick={()=>setSelected(row)}>Xem hồ sơ</Button> },
  ];
  const q=search.trim().toLocaleLowerCase('vi');
  const filtered=items.filter(row=>[row.displayName,row.userName,row.externalId,row.platform].some(value=>value?.toLocaleLowerCase('vi').includes(q)));
  return <div>
    <div className="dm-flow-toolbar"><Input.Search aria-label="Tìm trong danh sách đã tải" placeholder="Tìm tên, mã kênh hoặc nền tảng trong danh sách đã tải" value={search} onChange={event=>setSearch(event.target.value)} allowClear /><Button loading={loading} onClick={()=>void load(true)}>Tải lại</Button></div>
    {error ? <Alert type="error" showIcon title={error} action={<Button onClick={()=>void load(true)}>Thử lại</Button>} /> :
    <Table<CreatorItem> columns={columns} rowKey="id" dataSource={filtered} loading={loading} scroll={{x:900}} pagination={{pageSize:10,showSizeChanger:false}} locale={{emptyText:'Chưa có hồ sơ kênh'}} />}
    <Drawer open={!!selected} onClose={()=>setSelected(null)} title="Hồ sơ định danh kênh" size="min(560px, 100vw)">
      {selected && <Descriptions column={1} items={[
        {key:'name',label:'Tên hiển thị',children:selected.displayName || '—'},
        {key:'platform',label:'Nền tảng',children:selected.platform || '—'},
        {key:'external',label:'Mã kênh nền tảng',children:selected.externalId || '—'},
        {key:'source',label:'Nguồn',children:selected.sourceType==='AUTHORIZED'?'Kênh đã được cấp quyền':selected.sourceType==='PUBLIC'?'Dữ liệu công khai':'Chưa có dữ liệu'},
        {key:'url',label:'Hồ sơ gốc',children:selected.profileUrl && /^https?:\/\//i.test(selected.profileUrl)?<a href={selected.profileUrl} target="_blank" rel="noopener noreferrer">Mở trên nền tảng</a>:'Chưa có dữ liệu'},
      ]} />}
    </Drawer>
  </div>;
}
