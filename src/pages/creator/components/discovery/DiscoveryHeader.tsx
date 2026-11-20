import React from 'react';


export const DiscoveryHeader: React.FC = () => {


  return (
    <>
      {/* 2. Tiêu đề trang */}
      <div className="cdiscovery-header-section">
        <h1 className="cdiscovery-header-title">Khám phá Nhà sáng tạo</h1>
        <p className="cdiscovery-header-sub">
          Tìm kiếm Nhà sáng tạo phù hợp theo tên, ngành hàng, tương tác và phong cách nội dung.
        </p>
      </div>
    </>
  );
};

export default DiscoveryHeader;

