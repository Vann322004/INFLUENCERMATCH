import { Table } from 'antd';
import type { CampaignCreatorRow } from './campaignDetailTypes';
interface Props {
  campaignBudgetFormatted: string;
  allocatedBudget: number | null;
  remainingBudget: number | null;
  confirmedCreatorCount?: number | null;
  participatingCreators: CampaignCreatorRow[];
  campaignTitle: string;
  collaborationsError?: string | null;
}
const money = (value: number | null) => value == null ? 'Chưa có dữ liệu' : `${value.toLocaleString('vi-VN')} ₫`;
export const CampaignBudgetTab = ({ campaignBudgetFormatted, allocatedBudget, remainingBudget, confirmedCreatorCount, participatingCreators, collaborationsError }: Props) => (
  <div className="cdetail-card-modern">
    <div className="cdetail-card-header"><span className="cdetail-card-title">Ngân sách & thỏa thuận hợp tác</span></div>
    <div className="cdetail-finance-grid">
      {[
        ['Ngân sách kế hoạch', campaignBudgetFormatted],
        ['Ngân sách đã cam kết', money(allocatedBudget)],
        ['Nhà sáng tạo đã chốt', confirmedCreatorCount ?? 'Chưa có dữ liệu'],
        ['Ngân sách còn lại', money(remainingBudget)],
      ].map(([label, value]) => <div className="cdetail-finance-tile" key={label}><span className="cdetail-finance-lbl">{label}</span><span className="cdetail-finance-val">{value}</span></div>)}
    </div>
    <p>Chi phí thỏa thuận không đồng nghĩa đã thanh toán. Chưa có dữ liệu chứng từ thanh toán tại đây.</p>
    {collaborationsError ? <p>Không tải được danh sách hợp tác.</p> : <Table<CampaignCreatorRow> rowKey="id" dataSource={participatingCreators} pagination={false} scroll={{ x: 480 }}
      locale={{ emptyText: 'Chưa có hợp tác' }} columns={[
        { title: 'Nhà sáng tạo', dataIndex: 'name' },
        { title: 'Chi phí thỏa thuận', dataIndex: 'fee' },
        { title: 'Trạng thái hợp tác', dataIndex: 'stageText' },
      ]} />}
  </div>
);
