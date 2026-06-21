import { Category, Availability, Vehicle } from '../types'

export const CATEGORY_META: Record<Category, { label: string; icon: string }> = {
  repair: { label: 'Sửa chữa vặt', icon: 'wrench' },
  cleaning: { label: 'Dọn dẹp nhà cửa', icon: 'trash' },
  delivery: { label: 'Vận chuyển/Giao hàng', icon: 'motorcycle' },
  helper: { label: 'Hỗ trợ/Nhờ việc vặt', icon: 'handshake-o' },
}

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  'all-day': 'Cả ngày, linh hoạt',
  morning: 'Buổi sáng (6h-12h)',
  afternoon: 'Buổi chiều (12h-18h)',
  evening: 'Buổi tối (18h-22h)',
  weekend: 'Chỉ cuối tuần',
}

export const VEHICLE_LABEL: Record<Vehicle, string> = {
  motorbike: 'Xe máy',
  car: 'Ô tô',
  bike: 'Xe đạp',
  none: 'Đi bộ / không có xe',
}
