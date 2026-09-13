import { View, TouchableOpacity } from 'react-native'
import { FontAwesome } from '@expo/vector-icons'

type Props = {
  value: number
  size?: number
  onChange: (n: number) => void
  color?: string
}

export function StarRow({ value, size = 24, onChange, color = '#f59e0b' }: Props) {
  return (
    <View className="flex-row items-center justify-center space-x-2">
      {[1, 2, 3, 4, 5].map(i => (
        <TouchableOpacity key={i} onPress={() => onChange(i)} activeOpacity={0.7}>
          <FontAwesome name="star" size={size} color={i <= value ? color : '#d1d5db'} />
        </TouchableOpacity>
      ))}
    </View>
  )
}
