import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { FontAwesome } from '@expo/vector-icons'
import { ReactNode } from 'react'

type Props = {
  title: string
  rightSlot?: ReactNode
  onBack?: () => void
}

export function ScreenHeader({ title, rightSlot, onBack }: Props) {
  const router = useRouter()
  return (
    <View className="pt-safe px-5 pb-4 flex-row items-center space-x-3 bg-white border-b border-gray-200">
      <TouchableOpacity onPress={onBack || (() => router.back())} className="w-9 h-9 rounded-full bg-stone-100 items-center justify-center">
        <FontAwesome name="arrow-left" size={14} color="#6b7280" />
      </TouchableOpacity>
      <Text className="font-bold text-base text-gray-800 flex-1">{title}</Text>
      {rightSlot}
    </View>
  )
}
