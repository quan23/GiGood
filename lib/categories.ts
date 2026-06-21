import type { Availability, Vehicle } from "@/types";

export type CategoryMeta = {
  label: string;
  icon: string;
  accent: "orange" | "teal";
};

export const CATEGORIES = [
  { id: "sua-chua" as const, label: "Sửa chữa vặt" },
  { id: "don-dep" as const, label: "Dọn dẹp nhà cửa" },
  { id: "bao-tri" as const, label: "Bảo trì nhà cửa" },
  { id: "thue-do" as const, label: "Thuê đồ" },
  { id: "van-chuyen" as const, label: "Vận chuyển / Giao hàng" },
  { id: "gia-su" as const, label: "Gia sư" },
  { id: "lao-cong" as const, label: "Lao công" },
  { id: "khac" as const, label: "Khác" },
] as const;

export const CATEGORY_META: Record<string, CategoryMeta> = {
  "sua-chua": { label: "Sửa chữa vặt", icon: "wrench", accent: "orange" },
  "don-dep": { label: "Dọn dẹp nhà cửa", icon: "magic", accent: "teal" },
  "bao-tri": { label: "Bảo trì nhà cửa", icon: "home", accent: "orange" },
  "thue-do": { label: "Thuê đồ", icon: "gift", accent: "teal" },
  "van-chuyen": { label: "Vận chuyển/Giao hàng", icon: "motorcycle", accent: "orange" },
  "gia-su": { label: "Gia sư", icon: "book", accent: "teal" },
  "lao-cong": { label: "Lao công", icon: "handshake-o", accent: "orange" },
  "khac": { label: "Khác", icon: "ellipsis-h", accent: "teal" },
};

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  "all-day": "Cả ngày, linh hoạt",
  morning: "Buổi sáng (6h-12h)",
  afternoon: "Buổi chiều (12h-18h)",
  evening: "Buổi tối (18h-22h)",
  weekend: "Chỉ cuối tuần",
};

export const VEHICLE_LABEL: Record<Vehicle, string> = {
  motorbike: "Xe máy",
  car: "Ô tô",
  bike: "Xe đạp",
  none: "Đi bộ / không có xe",
};
