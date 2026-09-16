import { Text } from 'react-native'
import type { ApiJobStatus } from '../../lib/features/jobs/types'

const META: Record<ApiJobStatus, { label: string; bg: string; text: string }> = {
  // amber Open / blue Assigned / emerald Done
  Open: { label: 'Đang tìm Tasker', bg: 'bg-amber-50', text: 'text-amber-600' },
  Assigned: { label: 'Đang thực hiện', bg: 'bg-blue-50', text: 'text-blue-600' },
  Done: { label: 'Hoàn thành', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  Cancelled: { label: 'Đã huỷ', bg: 'bg-gray-100', text: 'text-gray-500' },
}

export function StatusBadge({ status }: { status: ApiJobStatus }) {
  const m = META[status]
  return (
    <Text className={`text-[10px] font-bold ${m.bg} ${m.text} px-2 py-0.5 rounded-full overflow-hidden`}>
      {m.label}
    </Text>
  )
}
