import React from 'react';
import { Modal } from 'antd';
import LiveCrawlTab from './LiveCrawlTab';
import type { LiveCrawlResult } from '../../../../types/api/crawler.types';

interface DirectCrawlModalProps {
  open: boolean;
  onClose: () => void;
  defaultInput?: string;
  onImportSuccess?: (result: LiveCrawlResult) => void;
}

export default function DirectCrawlModal({
  open,
  onClose,
  defaultInput = '',
  onImportSuccess,
}: DirectCrawlModalProps) {
  return (
    <Modal
      title="Cào dữ liệu KOC trực tiếp"
      open={open}
      onCancel={onClose}
      footer={null}
      width="min(980px, 95vw)"
      destroyOnClose
      style={{ top: 20, maxWidth: '95vw' }}
    >
      <div style={{ maxHeight: '80vh', overflowY: 'auto', paddingRight: 4 }}>
        <LiveCrawlTab
          defaultInput={defaultInput}
          onImportSuccess={(res) => {
            if (onImportSuccess) onImportSuccess(res);
            onClose();
          }}
        />
      </div>
    </Modal>
  );
}

