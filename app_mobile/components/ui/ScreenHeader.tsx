import { Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { FontAwesome } from '@expo/vector-icons'
import { ReactNode } from 'react'
import { colors } from '@/constants/theme'

type Props = {
  title: string
  rightSlot?: ReactNode
  onBack?: () => void
  /**
   * Apply the device top inset to the bar. Defaults to `false` because app
   * screens sit inside the shell's `SafeAreaView` (which already pads the top);
   * enable this only for screens rendered outside the shell.
   */
  insetTop?: boolean
}

/**
 * Screen title bar. When `insetTop` is set it honours the device safe area
 * (`paddingTop = insets.top`), and when nested inside the shell's SafeAreaView
 * it adds no top padding so the inset is not applied twice.
 */
export function ScreenHeader({ title, rightSlot, onBack, insetTop = false }: Props) {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  return (
    <View
      style={insetTop ? { paddingTop: insets.top } : undefined}
      className="px-5 pb-4 flex-row items-center space-x-3 bg-white border-b border-gray-200"
    >
      <TouchableOpacity
        onPress={onBack || (() => router.back())}
        accessibilityRole="button"
        accessibilityLabel="Quay lại"
        className="w-9 h-9 rounded-full bg-stone-100 items-center justify-center"
      >
        <FontAwesome name="arrow-left" size={14} color={colors.grayIcon} />
      </TouchableOpacity>
      <Text className="font-bold text-base text-gray-800 flex-1">{title}</Text>
      {rightSlot}
    </View>
  )
}
