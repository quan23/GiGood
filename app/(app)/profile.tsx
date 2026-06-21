import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FontAwesome } from '@expo/vector-icons'
import { useAuth } from '../../hooks/useAuth'
import { useWallet } from '../../hooks/useWallet'
import { useRouter } from 'expo-router'
import { CATEGORY_META } from '../../lib/categories'
import { formatVnd } from '../../lib/format'

export default function ProfileScreen() {
  const { profile, currentRole, signOut } = useAuth()
  const { wallet, escrowHeldPool } = useWallet()
  const router = useRouter()

  if (!profile) {
    router.replace('/(auth)/welcome')
    return null
  }

  const isSeeker = currentRole === 'seeker'
  const p = profile
  const tp = p.taskerProfile

  const handleLogout = () => {
    signOut()
    router.replace('/(auth)/welcome')
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-5 pb-4 flex-row items-center space-x-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-stone-100 items-center justify-center">
          <FontAwesome name="arrow-left" size={14} color="#6b7280" />
        </TouchableOpacity>
        <Text className="font-bold text-base text-gray-800">Hồ sơ của tôi</Text>
      </View>

      <ScrollView className="flex-1 px-5 py-6" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="flex-row items-center space-x-4 mb-5">
          <Image source={{ uri: p.avatar }} className="w-16 h-16 rounded-2xl border-2 border-orange-500" />
          <View>
            <Text className="font-extrabold text-lg text-gray-800">{p.name}</Text>
            <Text className={`text-xs font-bold ${isSeeker ? 'text-orange-500' : 'text-teal-600'}`}>
              {isSeeker ? 'Người Thuê (Seeker)' : 'Người Nhận Việc (Tasker)'}
            </Text>
            <Text className="text-[11px] text-amber-500 font-bold mt-0.5">
              <FontAwesome name="star" size={11} /> Thành viên Đồng
            </Text>
          </View>
        </View>

        {/* Wallet stats */}
        <View className="flex-row gap-2 mb-5">
          <View className="flex-1 bg-stone-50 border border-gray-200 rounded-2xl p-3 items-center">
            <Text className="text-[10px] text-gray-500">Ví của bạn</Text>
            <Text className="text-sm font-extrabold text-gray-800">{formatVnd(wallet)}</Text>
          </View>
          <View className="flex-1 bg-teal-50 border border-teal-200 rounded-2xl p-3 items-center">
            <Text className="text-[10px] text-gray-500">Ký quỹ</Text>
            <Text className="text-sm font-extrabold text-teal-600">{formatVnd(escrowHeldPool)}</Text>
          </View>
        </View>

        {!isSeeker && tp && (
          <View className="space-y-3 mb-5">
            <View className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2.5">
              <Text className="text-xs font-bold text-gray-700">Chân dung năng lực</Text>
              <View className="flex-row flex-wrap gap-1.5">
                {tp.skills.map(s => {
                  const meta = CATEGORY_META[s]
                  return (
                    <Text key={s} className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full overflow-hidden">
                      <FontAwesome name={(meta?.icon || 'wrench') as keyof typeof FontAwesome.glyphMap} size={10} /> {meta?.label}
                    </Text>
                  )
                })}
              </View>
              {tp.bio ? <Text className="text-xs text-gray-500 leading-relaxed">{tp.bio}</Text> : null}
              <View className="flex-row gap-2 text-[11px] text-gray-500">
                <Text className="flex-1"><FontAwesome name="clock-o" size={10} color="#9ca3af" /> {tp.availability}</Text>
                <Text className="flex-1"><FontAwesome name="motorcycle" size={10} color="#9ca3af" /> {tp.vehicle}</Text>
              </View>
            </View>
            <View className="bg-stone-50 border border-gray-200 rounded-2xl p-3.5 flex-row items-center justify-between">
              <View className="flex-row items-center space-x-2.5">
                <FontAwesome name="id-card" size={14} color="#9ca3af" />
                <Text className="text-xs font-bold text-gray-700">Xác thực danh tính</Text>
              </View>
              <Text className="text-[10px] font-bold text-amber-500">Chưa xác thực</Text>
            </View>
          </View>
        )}

        <View className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 mb-5">
          <View className="px-4 py-3.5 flex-row items-center justify-between">
            <Text className="text-xs font-bold text-gray-700">Số điện thoại</Text>
            <Text className="text-xs text-gray-500">{p.phone || '—'}</Text>
          </View>
          <View className="px-4 py-3.5 flex-row items-center justify-between">
            <Text className="text-xs font-bold text-gray-700">Khu vực</Text>
            <Text className="text-xs text-gray-500">{p.location || '—'}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleLogout}
          className="w-full bg-red-50 py-3.5 rounded-2xl flex-row items-center justify-center space-x-2">
          <FontAwesome name="sign-out" size={12} color="#ef4444" />
          <Text className="text-red-500 text-sm font-bold">Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}
