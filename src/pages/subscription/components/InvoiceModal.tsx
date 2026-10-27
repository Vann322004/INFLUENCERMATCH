import React from 'react';
import { Modal, Button, Tag, Row, Col, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import type { PaymentInvoice } from '../../../data/mockData';
import { formatVND } from './HistoryTab';

interface InvoiceModalProps {
  open: boolean;
  invoice: PaymentInvoice | null;
  currentBrand?: { businessName?: string; location?: string } | null;
  storedUser?: { fullName?: string; email?: string } | null;
  onCancel: () => void;
}

export default function InvoiceModal({
  open,
  invoice,
  currentBrand,
  storedUser,
  onCancel,
}: InvoiceModalProps) {
  if (!invoice) return null;

  return (
    <Modal
      title="Hóa đơn điện tử VAT"
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="close" onClick={onCancel}>
          Đóng
        </Button>,
        <Button
          key="download"
          type="primary"
          icon={<DownloadOutlined />}
          style={{ background: '#5B5BF0' }}
          onClick={() => message.success('Đang tải hóa đơn PDF về máy...')}
        >
          Tải PDF
        </Button>,
      ]}
      width={580}
    >
      <div className="invoice-paper" style={{ marginTop: 12 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '1px solid #EEF0F6',
            paddingBottom: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#5B5BF0' }}>INFLUENCERMATCH CORP</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Mã số thuế: 0109887766</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>Tòa nhà TechHub, Q.1, TP. Hồ Chí Minh</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Tag color="success" style={{ fontWeight: 700, borderRadius: 6, margin: 0 }}>
              ĐÃ THANH TOÁN
            </Tag>
            <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#475569', marginTop: 4 }}>
              {invoice.code}
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 0', borderBottom: '1px solid #EEF0F6' }}>
          <Row gutter={16}>
            <Col span={12}>
              <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>
                Khách hàng:
              </div>
              <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                {currentBrand?.businessName || storedUser?.fullName || 'Tài khoản Doanh nghiệp'}
              </div>
              {currentBrand?.location && (
                <div style={{ fontSize: 12, color: '#64748B' }}>{currentBrand.location}</div>
              )}
              {storedUser?.email && (
                <div style={{ fontSize: 12, color: '#64748B' }}>Email: {storedUser.email}</div>
              )}
            </Col>
            <Col span={12} style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>
                Ngày phát hành:
              </div>
              <div style={{ fontWeight: 600, color: '#0F172A', marginTop: 2 }}>
                {invoice.date}
              </div>
              <div style={{ fontSize: 12, color: '#64748B' }}>
                PTTT: {invoice.method}
              </div>
            </Col>
          </Row>
        </div>

        <div style={{ padding: '16px 0' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 8,
              fontWeight: 600,
              color: '#475569',
              fontSize: 12,
            }}
          >
            <span>Nội dung dịch vụ</span>
            <span>Thành tiền</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#0F172A' }}>{invoice.planName}</div>
              <div style={{ fontSize: 12, color: '#64748B' }}>{invoice.billingPeriod}</div>
            </div>
            <div style={{ fontWeight: 700, color: '#0F172A' }}>
              {formatVND(invoice.amount)}
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: '2px dashed #E2E8F0',
            paddingTop: 14,
            marginTop: 10,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>Tổng cộng thanh toán (VAT 10%):</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#5B5BF0' }}>
            {formatVND(invoice.amount)}
          </span>
        </div>
      </div>
    </Modal>
  );
}
