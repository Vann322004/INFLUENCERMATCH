import { Link } from 'react-router-dom';
import BrandLogo from '../components/layout/BrandLogo';
import './PrivacyPolicyPage.css';

export default function PrivacyPolicyPage() {
  const contact = (import.meta.env.VITE_PRIVACY_CONTACT_EMAIL || '').trim();
  const validContact = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  return <main className="privacy-page">
    <header><BrandLogo href="/#top" /><Link to="/login">Đăng nhập</Link></header>
    <article>
      <p className="privacy-eyebrow">InfluencerMatch · Quyền riêng tư</p>
      <h1>Chính sách bảo mật</h1>
      <p>Cập nhật ngày 18/11/2026. Chính sách này giải thích việc xử lý dữ liệu khi sử dụng InfluencerMatch, đặc biệt khi kết nối Facebook và Instagram để xác minh quyền quản lý kênh.</p>
      <h2>1. Dữ liệu chúng tôi xử lý</h2>
      <p>Tài khoản InfluencerMatch có thể bao gồm họ tên, email, số điện thoại, thông tin thương hiệu hoặc hồ sơ nhà sáng tạo và việc chấp nhận chính sách.</p>
      <p>Khi bạn chủ động kết nối Facebook, hệ thống kiểm tra mã định danh người dùng, các quyền đã cấp và thời hạn truy cập. Hệ thống có thể nhận mã, tên và quyền quản lý các Trang Facebook; với Instagram liên kết Trang, hệ thống nhận mã tài khoản, tên người dùng và tên hiển thị mà Meta cung cấp.</p>
      <p>Với kết nối Instagram trực tiếp, hệ thống đọc mã định danh, tên người dùng và loại tài khoản chuyên nghiệp. Dữ liệu nhận được phụ thuộc phương thức kết nối, quyền bạn cho phép và tài khoản đáp ứng điều kiện của Meta.</p>
      <p>Hồ sơ yêu cầu nhận kênh có thể bao gồm liên kết bằng chứng, ghi chú, kênh được yêu cầu, người gửi, thời gian gửi, người xét duyệt, kết quả và lý do quyết định.</p>
      <h2>2. Mục đích sử dụng</h2>
      <p>Dữ liệu được dùng để xác nhận bạn có quyền quản lý đúng kênh, liên kết kênh với hồ sơ nhà sáng tạo, phát hiện tranh chấp hoặc trùng định danh và hỗ trợ xét duyệt. Kết quả này là xác minh trong InfluencerMatch, không phải cấp dấu xác minh của Facebook hoặc Instagram.</p>
      <p>Luồng xác minh hiện tại không yêu cầu nội dung tin nhắn riêng tư, danh sách bạn bè hoặc quyền đăng bài thay bạn. Việc tìm kiếm và đánh giá kênh trong InfluencerMatch là chức năng riêng, không đồng nghĩa việc kết nối Meta cho phép truy cập mọi dữ liệu tài khoản.</p>
      <h2>3. Dữ liệu được lưu và bảo vệ</h2>
      <p>Hệ thống lưu liên kết định danh kênh, hồ sơ sở hữu, phương thức xác minh, quyền đã cấp, thời điểm và trạng thái xác minh. Các quyết định kiểm duyệt được ghi nhận để xử lý hỗ trợ và tranh chấp.</p>
      <p>Trong quá trình OAuth, thông tin chứng minh truy cập được mã hóa trong phiên kết nối có giới hạn thời gian. Sau khi xác nhận liên kết thành công, bản ghi xác minh không lưu access token hoặc refresh token Meta; nội dung chứng minh trong phiên được xóa khi hoàn tất hoặc khi xử lý thất bại theo luồng tương ứng.</p>
      <p>Hồ sơ và dữ liệu vận hành được giữ trong thời gian cần thiết cho việc cung cấp dịch vụ, hỗ trợ, giải quyết tranh chấp và các nghĩa vụ áp dụng. Chính sách này không cam kết rằng mọi dữ liệu sẽ tự động bị xóa ngay khi phiên kết nối hết hạn.</p>
      <h2>4. Truy cập và chia sẻ</h2>
      <p>Meta xử lý việc cấp quyền trên hệ thống của Meta. InfluencerMatch trao đổi dữ liệu với Meta để thực hiện kết nối bạn yêu cầu. Người vận hành có quyền phù hợp được truy cập hồ sơ phục vụ xác minh; token và bằng chứng riêng tư không phải nội dung của hồ sơ kênh công khai.</p>
      <h2 id="data-deletion">5. Yêu cầu xóa dữ liệu hoặc hủy liên kết</h2>
      <p>Bạn có thể thu hồi quyền truy cập trong phần quản lý ứng dụng/kết nối của Facebook hoặc Instagram. Thu hồi quyền ở Meta không tự động xóa mọi hồ sơ đã được lưu tại InfluencerMatch.</p>
      <p>Để yêu cầu xóa dữ liệu hoặc hỗ trợ hủy liên kết, gửi yêu cầu đến địa chỉ bên dưới với tiêu đề “Yêu cầu xóa dữ liệu InfluencerMatch”, email tài khoản, nền tảng và URL hoặc mã kênh liên quan. Không gửi mật khẩu, token hoặc mã OTP. Chúng tôi cần xác minh người yêu cầu trước khi xử lý; dữ liệu cần giữ để giải quyết tranh chấp hoặc nghĩa vụ áp dụng sẽ được giải thích khi phản hồi.</p>
      <h2>6. Liên hệ</h2>
      {validContact ? <p>Email hỗ trợ quyền riêng tư: <a href={`mailto:${contact}`}>{contact}</a>.</p> : <p className="privacy-contact-pending">Địa chỉ tiếp nhận yêu cầu quyền riêng tư chưa được cấu hình. Trang cần được bổ sung email hỗ trợ trước khi sử dụng để xét duyệt ứng dụng Meta.</p>}
      <h2>7. Thay đổi chính sách</h2>
      <p>Chính sách có thể được cập nhật khi chức năng hoặc cách xử lý dữ liệu thay đổi. Phiên bản hiện hành và ngày cập nhật được công bố tại trang này.</p>
    </article>
    <footer><Link to="/#top">Về trang Khám phá</Link><span>© 2026 InfluencerMatch</span></footer>
  </main>;
}
