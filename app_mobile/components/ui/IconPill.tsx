import { View, Text } from 'react-native'
import { FontAwesome } from '@expo/vector-icons'
import { colors } from '@/constants/theme'

type Props = {
  icon: keyof typeof FontAwesome.glyphMap
  label: string
  value: string
  bgColor?: string
  iconColor?: string
  borderColor?: string
}

export function IconPill({ icon, label, value, bgColor = 'bg-teal-50', iconColor = colors.teal, borderColor = 'border-teal-200' }: Props) {
  return (
    <View className={`flex-row items-center space-x-2 ${bgColor} border ${borderColor} px-3 py-2 rounded-xl`}>
      <FontAwesome name={icon} size={14} color={iconColor} />
      <View className="text-left">
        <Text className="text-[9px] text-gray-500 font-medium">{label}</Text>
        <Text className="text-[11px] font-extrabold" style={{ color: iconColor }}>{value}</Text>
      </View>
    </View>
  )
}
