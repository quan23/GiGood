export type Role = 'seeker' | 'tasker'
export type Category = 'repair' | 'cleaning' | 'delivery' | 'helper'
export type Availability = 'all-day' | 'morning' | 'afternoon' | 'evening' | 'weekend'
export type Vehicle = 'motorbike' | 'car' | 'bike' | 'none'
export type JobStatus = 'finding' | 'assigned' | 'completed'
export type ToastVariant = 'success' | 'error' | 'info'
export type SeekerSubTab = 'post' | 'jobs' | 'chat' | 'history'
export type TaskerSubTab = 'board' | 'active' | 'chat' | 'earnings'

export type TaskerProfile = {
  skills: Category[]
  bio: string
  availability: Availability
  vehicle: Vehicle
  verified: boolean
}

export type UserProfile = {
  name: string
  avatar: string
  role: Role
  phone: string
  location: string
  taskerProfile: TaskerProfile | null
}

export type ChatMessage = {
  sender: Role
  text: string
  time: string
}

export type Job = {
  id: number
  title: string
  category: Category
  budget: number
  location: string
  description: string
  status: JobStatus
  seekerName: string
  taskerName: string | null
  timeTag: string
  chats: ChatMessage[]
  seekerRating: number | null
  taskerRating: number | null
  isCompletedReportedByTasker: boolean
  mapX: string
  mapY: string
}

export type Notification = {
  id: number
  text: string
  time: string
  read: boolean
}

export type ToastState = {
  message: string
  variant: ToastVariant
  visible: boolean
} | null

export type GiGoodState = {
  auth: {
    profile: UserProfile | null
    currentRole: Role
    pendingSignupRole: Role
    pendingBasicInfo: { name: string; phone: string; location: string; password: string } | null
    hydrated: boolean
  }
  ui: {
    activeSeekerSubTab: SeekerSubTab
    activeTaskerSubTab: TaskerSubTab
    activeChatId: number | null
    chatDetailOpen: boolean
    notifOpen: boolean
    notifBadge: boolean
    matchingJobIdRef: number | null
    toast: ToastState
  }
  data: {
    jobs: Job[]
    notifications: Notification[]
    seekerWallet: number
    taskerWallet: number
    escrowHeldPool: number
  }
}
