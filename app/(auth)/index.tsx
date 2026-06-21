import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FontAwesome } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

const FEATURES = [
  { icon: 'shield' as const, text: 'Thanh toán ký quỹ an toàn, chỉ giải ngân khi xong việc' },
  { icon: 'map-marker' as const, text: 'Gợi ý Tasker gần bạn theo bán kính GPS' },
  { icon: 'star' as const, text: 'Đánh giá minh bạch hai chiều, bảo vệ cả hai bên' },
]

export default function WelcomeScreen() {
  const router = useRouter()

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1 bg-orange-500 relative overflow-hidden">
        <View className="absolute -right-24 -bottom-24 w-72 h-72 rounded-full bg-white/10" />
        <View className="absolute -left-16 top-20 w-44 h-44 rounded-full bg-white/5" />
        <View className="absolute right-10 top-32 w-16 h-16 rounded-2xl bg-white/10 rotate-12" />

        <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 justify-between p-7">
            <View className="flex-row items-center justify-between pt-4">
              <Text className="text-xs font-bold tracking-wider uppercase bg-white/20 px-3 py-1 rounded-full text-white">
                Dự án GiGood
              </Text>
              <FontAwesome name="bolt" size={20} color="rgba(255,255,255,0.8)" />
            </View>

            <View className="space-y-5">
              <View className="space-y-2">
                <Text className="text-5xl font-extrabold text-white">
                  GiGood
                </Text>
                <Text className="text-sm text-white/90 leading-relaxed max-w-[280px]">
                  Kết nối việc vặt tức thì & bảo chứng niềm tin hai chiều, ngay trong khu vực của bạn.
                </Text>
              </View>

              <View className="space-y-3 pt-2">
                {FEATURES.map((f, i) => (
                  <View key={i} className="flex-row items-center space-x-3">
                    <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
                      <FontAwesome name={f.icon} size={12} color="white" />
                    </View>
                    <Text className="flex-1 text-xs text-white">{f.text}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className="space-y-3">
              <TouchableOpacity
                onPress={() => router.push('/(auth)/role-select')}
                className="w-full bg-white py-3.5 rounded-2xl items-center justify-center flex-row space-x-2 active:opacity-90"
              >
                <Text className="font-bold text-sm text-orange-500">Bắt đầu ngay</Text>
                <FontAwesome name="arrow-right" size={12} color="#ea580c" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push('/(auth)/login')} className="py-2 items-center">
                <Text className="text-white/90 text-xs font-semibold underline underline-offset-2">
                  Tôi đã có tài khoản
                </Text>
              </TouchableOpacity>

              <Text className="text-[10px] text-white/60 text-center pt-1">
                © 2026 GiGood Inc. — Bản demo mô phỏng UX/UI
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}
