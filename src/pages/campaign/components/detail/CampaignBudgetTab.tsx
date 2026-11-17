import React from 'react';
import { Table, Button, Tag, Avatar, Modal, message } from 'antd';
import type { CampaignCreatorRow } from './CampaignMetricCards';

interface CampaignBudgetTabProps {
  campaignBudgetFormatted: string;
  allocatedBudget: number;
  remainingBudget: number;
  confirmedCreatorCount?: number;
  participatingCreators: CampaignCreatorRow[];
  campaignTitle: string;
}

export const CampaignBudgetTab: React.FC<CampaignBudgetTabProps> = ({
  campaignBudgetFormatted,
  allocatedBudget,
  remainingBudget,
  confirmedCreatorCount = 0,
  participatingCreators,
  campaignTitle,
}) => {
  return (
    <div className="cdetail-card-modern">
      <div className="cdetail-card-header">
        <div>
          <span className="cdetail-card-title">
            Quản lý Ngân sách & Tiến độ Hợp tác
          </span>
          <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 3 }}>
            Theo dõi hạn mức tài chính, ngân sách đã cam kết và danh sách Creator đã chốt thỏa thuận
          </div>
        </div>
      </div>

      {/* 4 Financial Tiles */}
      <div className="cdetail-finance-grid">
        <div className="cdetail-finance-tile plan">
          <span className="cdetail-finance-lbl">Ngân sách kế hoạch</span>
          <span className="cdetail-finance-val">{campaignBudgetFormatted}</span>
          <span className="cdetail-finance-desc">Tổng ngân sách thiết lập cho chiến dịch</span>
        </div>
        <div className="cdetail-finance-tile committed">
          <span className="cdetail-finance-lbl">Ngân sách đã cam kết</span>
          <span className="cdetail-finance-val">{allocatedBudget > 0 ? `${allocatedBudget.toLocaleString('vi-VN')} đ` : '0 đ'}</span>
          <span className="cdetail-finance-desc">Tổng phí hợp đồng các Creator đã xác nhận</span>
        </div>
        <div className="cdetail-finance-tile paid">
          <span className="cdetail-finance-lbl">Creator đã chốt hợp tác</span>
          <span className="cdetail-finance-val">{confirmedCreatorCount} Creator</span>
          <span className="cdetail-finance-desc">Đã đồng thuận qua điều khoản Deal</span>
        </div>
        <div className="cdetail-finance-tile remaining">
          <span className="cdetail-finance-lbl">Hạn mức còn lại</span>
          <span className="cdetail-finance-val">{remainingBudget > 0 ? `${remainingBudget.toLocaleString('vi-VN')} đ` : '0 đ'}</span>
          <span className="cdetail-finance-desc">Khả dụng để tuyển thêm Creator</span>
        </div>
      </div>

      {/* Bảng đợt thanh toán KOC */}
      <div style={{ marginTop: 24 }}>
        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13.5, marginBottom: 12 }}>
          Danh sách đợt thanh toán theo tiến độ ({participatingCreators.length})
        </div>
        <Table
          columns={[
            {
              title: 'Nhà sáng tạo',
              dataIndex: 'name',
              key: 'name',
              render: (text, record: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar src={record.avatar} size={34} />
                  <div>
                    <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 13 }}>{text}</div>
                    <div style={{ fontSize: 11.5, color: '#64748B' }}>{record.username}</div>
                  </div>
                </div>
              ),
            },
            {
              title: 'Hạng mục chi trả',
              key: 'milestone',
              render: (_, record: any) => (
                <div>
                  <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 12.5 }}>
                    {record.deliverableStatus || 'Video review sản phẩm'}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748B' }}>
                    Đợt 1: Cọc 50% • Đợt 2: Quyết toán sau nghiệm thu
                  </div>
                </div>
              ),
            },
            {
              title: 'Chi phí thỏa thuận',
              dataIndex: 'fee',
              key: 'fee',
              render: (fee) => <span style={{ fontWeight: 700, color: '#1D4ED8' }}>{fee}</span>,
            },
            {
              title: 'Phương thức',
              key: 'method',
              render: () => <Tag color="blue">VNPay / Số dư ví</Tag>,
            },
            {
              title: 'Trạng thái thanh toán',
              key: 'paymentStatus',
              render: (_, record: any) => {
                const isDone = record.stageText === 'Đã hoàn tất' || record.stageText === 'Đã lên bài';
                return (
                  <Tag color={isDone ? 'success' : 'processing'}>
                    {isDone ? 'ĐÃ HOÀN TẤT' : 'ĐÃ TẠM ỨNG 50%'}
                  </Tag>
                );
              },
            },
            {
              title: 'Thao tác',
              key: 'action',
              render: (_, record: any) => (
                <Button
                  size="small"
                  type="link"
                  style={{ color: '#1D4ED8', fontWeight: 600, padding: 0 }}
                  onClick={() => {
                    Modal.info({
                      title: `Ủy nhiệm chi: ${record.name}`,
                      content: (
                        <div style={{ fontSize: 13, marginTop: 8 }}>
                          <p><strong>Mã giao dịch:</strong> TXN_{String(record.id).slice(0, 8)}</p>
                          <p><strong>Số tiền:</strong> {record.fee}</p>
                          <p><strong>Người thụ hưởng:</strong> {record.name}</p>
                          <p><strong>Nội dung:</strong> Quyết toán chi phí hợp tác chiến dịch {campaignTitle}</p>
                          <p><strong>Trạng thái:</strong> <Tag color="green">Giao dịch thành công</Tag></p>
                        </div>
                      ),
                      okText: 'Đóng',
                    });
                  }}
                >
                  Xem chứng từ
                </Button>
              ),
            },
          ]}
          dataSource={participatingCreators}
          rowKey="id"
          pagination={false}
          locale={{ emptyText: 'Chưa có KOC trong danh sách chi trả' }}
        />
      </div>
    </div>
  );
};
