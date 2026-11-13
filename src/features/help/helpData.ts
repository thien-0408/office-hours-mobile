export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const FAQS: FaqItem[] = [
  {
    id: 'booking',
    question: 'Đặt lịch với giảng viên thế nào?',
    answer:
      'Chọn giảng viên từ danh sách hoặc tìm kiếm theo khoa, bấm vào slot trống phù hợp, điền chủ đề cần trao đổi và gửi yêu cầu. Giảng viên sẽ duyệt yêu cầu và hệ thống sẽ gửi thông báo đến bạn.',
  },
  {
    id: 'cancel',
    question: 'Vì sao không hủy được lịch hẹn?',
    answer:
      'Trong vòng 24 giờ trước buổi hẹn, lịch không thể hủy hay đổi trên ứng dụng nhằm đảm bảo thời gian chuẩn bị cho giảng viên. Nếu có việc đột xuất, hãy nhắn tin trực tiếp cho giảng viên trong phòng chat của buổi hẹn.',
  },
  {
    id: 'waitlist',
    question: 'Hàng đợi hoạt động ra sao?',
    answer:
      'Khi một slot đã kín chỗ, bạn có thể tham gia hàng đợi. Nếu người đặt trước hủy lịch hoặc đổi giờ, slot trống sẽ tự động được gửi tới người đứng đầu hàng đợi để xác nhận trong thời hạn quy định.',
  },
  {
    id: 'location-timing',
    question: 'App dùng vị trí của tôi khi nào?',
    answer:
      'Vị trí chỉ được kích hoạt khi cả hai bên cùng bật chia sẻ, trong khung giờ hẹn trực tiếp và tối đa 15 phút sau giờ kết thúc. Khi app ở chế độ nền hoặc sau buổi hẹn, định vị sẽ tự động ngắt hoàn toàn.',
  },
];

export const PRIVACY_POINTS: string[] = [
  'Chỉ chia sẻ trong khung giờ hẹn trực tiếp và tối đa 15 phút sau giờ kết thúc.',
  'Chỉ hoạt động khi cả sinh viên và giảng viên cùng đồng ý bật chia sẻ vị trí.',
  'Dữ liệu vị trí chỉ truyền tạm thời qua Firebase Realtime Database và tự động xóa sau buổi hẹn, không lưu trữ lên máy chủ hệ thống.',
  'Chỉ cập nhật khi ứng dụng đang mở ở tiền cảnh, tự động dừng ngay khi tắt màn hình hoặc chuyển app.',
];

export const APP_INFO = {
  version: '0.1.0 (beta)',
  mapAttribution: '© OpenStreetMap contributors, ODbL 1.0',
  mapUrl: 'https://www.openstreetmap.org/copyright',
  footer: 'officehours · EIU · CSW434',
};
