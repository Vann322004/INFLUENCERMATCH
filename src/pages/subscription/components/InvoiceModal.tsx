import React, { useState } from 'react';
import { Modal, Button, Tag, Row, Col, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import type { PaymentInvoice } from '../../../types/api/subscription.types';
import { formatVND } from './HistoryTab';
import { downloadReceipt } from '../downloadReceipt';

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
  const [downloading, setDownloading] = useState(false);
  if (!invoice || invoice.status !== 'success') return null;

  return (
    <Modal
      title="Biên lai thanh toán"
      open={open}
      centered
      onCancel={onCancel}
      footer={[
        <Button key="close" onClick={onCancel}>
          Đóng
        </Button>,
        <Button
          key="download"
          type="primary"
          icon={<DownloadOutlined />}
          style={{ background: '#7C3AED' }}
          loading={downloading}
          onClick={async () => {
            setDownloading(true);
            try {
              await downloadReceipt(invoice, { currentBrand, storedUser });
            } catch (err) {
              console.error('Lỗi khi tải biên lai PDF:', err);
              message.error('Không thể tải biên lai PDF. Vui lòng thử lại.');
            } finally {
              setDownloading(false);
            }
          }}
        >
          Tải biên lai PDF
        </Button>,
      ]}
      width={560}
      styles={{ body: { paddingTop: 8, paddingBottom: 8 } }}
    >
      <div className="invoice-paper">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 10,
            borderBottom: '1px solid #EEF0F6',
            paddingBottom: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>
              <span style={{ color: '#7C3AED' }}>InfluencerMatch</span> Platform
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Hệ thống quản trị và kết nối Influencer</div>
            <div style={{ fontSize: 11.5, color: '#94A3B8' }}>Xác nhận thanh toán dịch vụ trực tuyến</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Tag color={invoice.status === 'success' ? 'success' : invoice.status === 'pending' ? 'warning' : 'error'} style={{ fontWeight: 700, borderRadius: 6, margin: 0 }}>
              {invoice.statusText}
            </Tag>
            <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#475569', marginTop: 4, wordBreak: 'break-all' }}>
              {invoice.code}
            </div>
          </div>
        </div>

        <div style={{ padding: '12px 0', borderBottom: '1px solid #EEF0F6' }}>
          <Row gutter={[12, 10]}>
            <Col xs={24} sm={13}>
              <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>
                Khách hàng:
              </div>
              <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2, overflowWrap: 'anywhere' }}>
                {currentBrand?.businessName || storedUser?.fullName || 'Tài khoản Doanh nghiệp'}
              </div>
              {currentBrand?.location && (
                <div style={{ fontSize: 12, color: '#64748B' }}>{currentBrand.location}</div>
              )}
              {storedUser?.email && (
                <div style={{ fontSize: 12, color: '#64748B', overflowWrap: 'anywhere' }}>Email: {storedUser.email}</div>
              )}
            </Col>
            <Col xs={24} sm={11} style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>
                Ngày thanh toán:
              </div>
              <div style={{ fontWeight: 600, color: '#0F172A', marginTop: 2 }}>
                {invoice.date}
              </div>
              <div style={{ fontSize: 12, color: '#64748B' }}>
                Phương thức: {invoice.method}
              </div>
            </Col>
          </Row>
        </div>

        <div style={{ padding: '12px 0' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 6,
              fontWeight: 600,
              color: '#475569',
              fontSize: 12,
            }}
          >
            <span>Nội dung dịch vụ</span>
            <span>Số tiền</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, color: '#0F172A' }}>{invoice.planName}</div>
              <div style={{ fontSize: 12, color: '#64748B' }}>{invoice.billingPeriod}</div>
            </div>
            <div style={{ fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
              {formatVND(invoice.amount)}
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: '2px dashed #E2E8F0',
            paddingTop: 12,
            marginTop: 6,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>Tổng số tiền thanh toán:</span>
          <span style={{ fontSize: 19, fontWeight: 800, color: '#7C3AED', whiteSpace: 'nowrap' }}>
            {formatVND(invoice.amount)}
          </span>
        </div>
      </div>
    </Modal>
  );
}
