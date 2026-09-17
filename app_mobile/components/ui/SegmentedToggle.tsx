import { View, Text, TouchableOpacity } from 'react-native'
import { colors } from '@/constants/theme'

type Option = {
  value: string
  label: string
}

type Props = {
  options: [Option, Option]
  selected: string
  onSelect: (value: string) => void
  activeColor?: string
}

export function SegmentedToggle({ options, selected, onSelect, activeColor = colors.orange }: Props) {
  return (
    <View className="bg-gray-100 p-1 rounded-xl flex-row">
      {options.map(opt => {
        const isActive = opt.value === selected
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            accessibilityRole="button"
            accessibilityLabel={opt.label}
            accessibilityState={{ selected: isActive }}
            className="flex-1 py-2 rounded-lg items-center justify-center"
            style={isActive ? { backgroundColor: colors.white, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 } : {}}
          >
            <Text className="text-[11px] font-extrabold" style={{ color: isActive ? activeColor : colors.grayIcon }}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}
