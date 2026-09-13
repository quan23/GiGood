import { Text } from 'react-native'

type Variant = 'finding' | 'assigned' | 'reported' | 'completed'

const META: Record<Variant, { label: string; bg: string; text: string }> = {
  finding: { label: 'Đang tìm Tasker', bg: 'bg-amber-50', text: 'text-amber-600' },
  assigned: { label: 'Đang thực hiện', bg: 'bg-blue-50', text: 'text-blue-600' },
  reported: { label: 'Tasker đã báo xong', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  completed: { label: 'Hoàn thành', bg: 'bg-emerald-50', text: 'text-emerald-600' },
}

export function StatusBadge({ variant }: { variant: Variant }) {
  const m = META[variant]
  return (
    <Text className={`text-[10px] font-bold ${m.bg} ${m.text} px-2 py-0.5 rounded-full overflow-hidden`}>
      {m.label}
    </Text>
  )
}
