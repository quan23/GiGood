import type { GiGoodState, Job } from "@/types";

const SAMPLE_TASKERS = [
  { name: "Minh Quân T.", avatar: "https://placehold.co/100x100/0f766e/ffffff?text=QT" },
  { name: "Anh Hào D.", avatar: "https://placehold.co/100x100/0f766e/ffffff?text=HD" },
  { name: "Thành Long P.", avatar: "https://placehold.co/100x100/0f766e/ffffff?text=LP" },
];

export const SEEKER_AVATAR = "https://placehold.co/100x100/ea580c/ffffff?text=KV";
export const TASKER_AVATAR = "https://placehold.co/100x100/0f766e/ffffff?text=Qu";

export const SEED_JOBS: Job[] = [
  {
    id: 201,
    title: "Khơi thông thoát sàn toilet tràn nước",
    category: "sua-chua",
    budget: 150000,
    location: "120 Nguyễn Huệ, Phường Bến Nghé, Quận 1",
    description:
      "Đường thoát nước phòng tắm bị tắc rác bẩn gây tràn. Cần thợ đem theo dây thông tắc lò xo dài tối thiểu 3m xử lý triệt để.",
    status: "assigned",
    seekerName: "Khánh Vy",
    taskerName: "Minh Quân T.",
    timeTag: "25 phút trước",
    chats: [
      { sender: "tasker", text: "Chào chị Vy, em vừa nhận đơn thông thoát sàn của mình. Em chuẩn bị đồ đạc rồi chạy qua liền đây chị nha.", time: "10:42" },
      { sender: "seeker", text: "Chào em, nhớ mang theo máy thông tắc lò xo loại lớn nhé. Đường cống nhà chị dài lắm.", time: "10:44" },
      { sender: "tasker", text: "Dạ vâng ạ, máy lò xo em bỏ sẵn sau xe rồi, tầm 10 phút nữa em có mặt chị ạ.", time: "10:45" },
    ],
    seekerRating: null,
    taskerRating: null,
    isCompletedReportedByTasker: false,
    mapX: "20%",
    mapY: "45%",
  },
  {
    id: 202,
    title: "Giao gấp hộp bánh ngọt cho khách hàng",
    category: "van-chuyen",
    budget: 45000,
    location: "88 Pasteur, Quận 1 đến Quận 3",
    description:
      "Cần một bạn shipper chạy cẩn thận bọc màng khí tránh va đập hư hỏng trang trí mặt bánh.",
    status: "finding",
    seekerName: "Khánh Vy",
    taskerName: null,
    timeTag: "2 giờ trước",
    chats: [],
    seekerRating: null,
    taskerRating: null,
    isCompletedReportedByTasker: false,
    mapX: "70%",
    mapY: "35%",
  },
];

export const SEEKER_WALLET_INITIAL = 1_420_000;
export const TASKER_WALLET_INITIAL = 2_850_000;
export const ESCROW_POOL_INITIAL = 150_000;

export const SEED_STATE: GiGoodState = {
  auth: {
    profile: null,
    currentRole: "seeker",
    pendingSignupRole: "seeker",
  },
  ui: {
    activeSeekerSubTab: "post",
    activeTaskerSubTab: "board",
    activeChatId: null,
    chatDetailOpen: false,
    notifOpen: false,
    notifBadge: false,
    matchingJobIdRef: null,
    toast: null,
  },
  data: {
    jobs: SEED_JOBS,
    notifications: [],
    seekerWallet: SEEKER_WALLET_INITIAL,
    taskerWallet: TASKER_WALLET_INITIAL,
    escrowHeldPool: ESCROW_POOL_INITIAL,
  },
};

export { SAMPLE_TASKERS };
