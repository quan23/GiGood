import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native'
import { FontAwesome } from '@expo/vector-icons'
import { useJobs } from '../../../hooks/useJobs'
import { useUi } from '../../../hooks/useUi'
import { useState } from 'react'
import { Category } from '../../../types'
import { CATEGORY_META } from '../../../lib/categories'

const TEMPLATES = [
  { cat: 'repair' as Category, title: 'Sửa vòi nước bị rò rỉ', budget: 150000 },
  { cat: 'cleaning' as Category, title: 'Dọn dẹp nhà 2 phòng ngủ', budget: 200000 },
  { cat: 'delivery' as Category, title: 'Giao đồ gấp trong khu vực', budget: 50000 },
  { cat: 'helper' as Category, title: 'Cần người bê vác đồ đạc', budget: 120000 },
]

export default function PostScreen() {
  const { postJob } = useJobs()
  const { showToast, setSeekerSubTab } = useUi()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('repair')
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('')
  const [location, setLocation] = useState('')
  const [urgent, setUrgent] = useState(false)

  const applyTemplate = (cat: Category, t: string, b: number) => {
    setCategory(cat)
    setTitle(t)
    setBudget(String(b))
  }

  const handlePost = () => {
    if (!title || !description || !budget || !location) {
      showToast('Vui lòng điền đầy đủ thông tin bắt buộc.', 'error')
      return
    }
    const b = parseInt(budget, 10)
    if (isNaN(b) || b < 10000) {
      showToast('Mức giá không hợp lệ.', 'error')
      return
    }
    postJob(title + (urgent ? ' (Cần liền)' : ''), category, description, b, location)
    showToast('Đăng việc thành công! Đang tìm Tasker phù hợp...', 'success')
    setSeekerSubTab('jobs')
  }

  const catEntries = Object.entries(CATEGORY_META) as [Category, { label: string; icon: string }][]

  return (
    <ScrollView className="flex-1 px-4 py-4" contentContainerStyle={{ paddingBottom: 24 }}>
      <View className="mb-4">
        <Text className="text-lg font-extrabold text-gray-800">Đăng việc mới</Text>
        <Text className="text-xs text-gray-500">Mô tả rõ để Tasker phù hợp nhất nhận việc nhanh hơn</Text>
      </View>

      <View className="space-y-2 mb-4">
        <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Mẫu việc nhanh</Text>
        <View className="flex-row flex-wrap">
          {TEMPLATES.map(t => (
            <TouchableOpacity key={t.cat} onPress={() => applyTemplate(t.cat, t.title, t.budget)}
              className="p-3 rounded-xl border border-gray-200 bg-white active:border-orange-500 mb-2.5 mr-2.5"
              style={{ width: '47%' }}>
              <FontAwesome name={(CATEGORY_META[t.cat]?.icon || 'wrench') as keyof typeof FontAwesome.glyphMap} size={14} color="#ea580c" style={{ marginBottom: 6 }} />
              <Text className="text-[11px] font-bold text-gray-700 leading-tight">{t.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="space-y-4">
        <View className="space-y-1.5">
          <Text className="text-xs font-bold text-gray-700">Tên công việc <Text className="text-red-500">*</Text></Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="Ví dụ: Tìm thợ thông đường ống nước bồn rửa"
            placeholderTextColor="#9ca3af" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm" />
        </View>

        <View className="space-y-1.5">
          <Text className="text-xs font-bold text-gray-700">Nhóm công việc</Text>
          <View className="flex-row flex-wrap gap-2">
            {catEntries.map(([key, meta]) => (
              <TouchableOpacity key={key} onPress={() => setCategory(key)}
                className={`px-3 py-2 rounded-xl border ${category === key ? 'bg-orange-50 border-orange-300' : 'border-gray-200'}`}>
                <Text className={`text-xs font-bold ${category === key ? 'text-orange-500' : 'text-gray-600'}`}>{meta.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="space-y-1.5">
          <Text className="text-xs font-bold text-gray-700">Mô tả công việc chi tiết <Text className="text-red-500">*</Text></Text>
          <TextInput value={description} onChangeText={setDescription} placeholder="Ghi rõ yêu cầu để Tasker chuẩn bị dụng cụ phù hợp..."
            placeholderTextColor="#9ca3af" multiline numberOfLines={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm" style={{ minHeight: 80, textAlignVertical: 'top' }} />
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 space-y-1.5">
            <Text className="text-xs font-bold text-gray-700">Mức giá đề xuất <Text className="text-red-500">*</Text></Text>
            <View className="relative">
              <TextInput value={budget} onChangeText={setBudget} placeholder="100,000" placeholderTextColor="#9ca3af"
                keyboardType="number-pad" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm" />
              <Text className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold">VND</Text>
            </View>
          </View>
          <View className="flex-1 space-y-1.5">
            <Text className="text-xs font-bold text-gray-700">Mức độ ưu tiên</Text>
            <TouchableOpacity onPress={() => setUrgent(!urgent)}
              className={`w-full px-3 py-3 rounded-xl border items-center justify-center ${urgent ? 'bg-orange-50 border-orange-300' : 'border-gray-200'}`}
              style={{ minHeight: 44 }}>
              <Text className={`text-xs font-bold ${urgent ? 'text-orange-500' : 'text-gray-600'}`}>
                {urgent ? 'Cần liền (phụ phí)' : 'Bình thường'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="space-y-1.5">
          <Text className="text-xs font-bold text-gray-700">Địa điểm thực hiện <Text className="text-red-500">*</Text></Text>
          <View className="relative">
            <View className="absolute left-4 top-0 bottom-0 justify-center z-10">
              <FontAwesome name="map-marker" size={12} color="#9ca3af" />
            </View>
            <TextInput value={location} onChangeText={setLocation} placeholder="Số nhà, đường, quận..."
              placeholderTextColor="#9ca3af" className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm" />
          </View>
        </View>

        <View className="bg-teal-50 border border-teal-100 rounded-xl p-3 flex-row items-start space-x-2.5">
          <FontAwesome name="shield" size={14} color="#0f766e" style={{ marginTop: 2 }} />
          <Text className="text-[11px] text-teal-800 leading-relaxed flex-1">
            Số tiền sẽ được GiGood giữ ký quỹ an toàn ngay khi có Tasker nhận việc, chỉ giải ngân khi bạn xác nhận hoàn thành.
          </Text>
        </View>

        <TouchableOpacity onPress={handlePost}
          className="w-full bg-orange-500 py-3.5 rounded-2xl flex-row items-center justify-center space-x-2 active:opacity-90">
          <FontAwesome name="paper-plane" size={12} color="white" />
          <Text className="text-white text-sm font-bold">Đăng việc & Tìm Tasker ngay</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}
