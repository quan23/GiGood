import { View, TouchableOpacity } from 'react-native'
import { FontAwesome } from '@expo/vector-icons'
import { colors } from '@/constants/theme'

type Props = {
  value: number
  size?: number
  onChange: (n: number) => void
  color?: string
}

export function StarRow({ value, size = 24, onChange, color = colors.amber }: Props) {
  return (
    <View className="flex-row items-center justify-center space-x-2">
      {[1, 2, 3, 4, 5].map(i => (
        <TouchableOpacity
          key={i}
          onPress={() => onChange(i)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${i} sao`}
          accessibilityState={{ selected: i <= value }}
        >
          <FontAwesome name="star" size={size} color={i <= value ? color : colors.grayDisabled} />
        </TouchableOpacity>
      ))}
    </View>
  )
}
