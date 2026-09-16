import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { FontAwesome } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useJob, useJobs } from '../../../hooks/useJobs'
import { useAuth } from '../../../hooks/useAuth'
import { useUi } from '../../../hooks/useUi'
import { formatVnd } from '../../../lib/format'
import { CATEGORY_META } from '../../../lib/categories'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { EmptyState } from '../../../components/shared/EmptyState'
import { LoadingSpinner } from '../../../components/shared/LoadingSpinner'
import { getApiErrorMessage, resolveImageUrl } from '../../../lib/features/jobs/api'
import type { Category } from '../../../types'

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const jobId = typeof id === 'string' && id.length > 0 ? id : undefined
  const router = useRouter()
  const { profile } = useAuth()
  const { showToast } = useUi()
  const { job, loading } = useJob(jobId)
  const { updateJob, deleteJob, isUpdating, isDeleting } = useJobs()

  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('repair')
  const [price, setPrice] = useState('')
  const [location, setLocation] = useState('')

  const isOwner = !!job && !!profile && job.owner.id === profile.id

  const startEdit = () => {
    if (!job) return
    setTitle(job.title)
    setDescription(job.description)
    setCategory(job.category)
    setPrice(String(job.price))
    setLocation(job.locationText ?? '')
    setEditing(true)
  }

  const handleSave = async () => {
    if (!job || isUpdating) return
    if (title.trim().length < 5) {
      showToast('Tiêu đề phải có ít nhất 5 ký tự.', 'error')
      return
    }
    if (!description.trim()) {
      showToast('Vui lòng nhập mô tả.', 'error')
      return
    }
    const priceValue = parseInt(price.replace(/[^0-9]/g, ''), 10)
    if (isNaN(priceValue) || priceValue < 10000) {
      showToast('Mức giá không hợp lệ.', 'error')
      return
    }
    try {
      await updateJob({
        id: job.id,
        body: {
          title: title.trim(),
          description: description.trim(),
          category,
          price: priceValue,
          locationText: location.trim() || null,
        },
      })
      setEditing(false)
      showToast('Cập nhật công việc thành công.', 'success')
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể cập nhật công việc.'), 'error')
    }
  }

  const confirmDelete = async () => {
    if (!job) return
    try {
      await deleteJob(job.id)
      showToast('Đã xoá công việc.', 'success')
      router.back()
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Không thể xoá công việc.'), 'error')
    }
  }

  const handleDelete = () => {
    if (!job || isDeleting) return
    Alert.alert(
      'Xoá công việc',
      'Bạn chắc chắn muốn xoá công việc này? Hành động không thể hoàn tác.',
      [
        { text: 'Huỷ', style: 'cancel' },
        { text: 'Xoá', style: 'destructive', onPress: () => void confirmDelete() },
      ],
    )
  }

  const catEntries = Object.entries(CATEGORY_META) as [Category, { label: string; icon: string }][]

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-stone-50">
        <LoadingSpinner text="Đang tải công việc..." />
      </SafeAreaView>
    )
  }

  if (!job) {
    return (
      <SafeAreaView className="flex-1 bg-stone-50">
        <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-stone-100 items-center justify-center">
            <FontAwesome name="arrow-left" size={14} color="#6b7280" />
          </TouchableOpacity>
          <Text className="font-bold text-sm text-gray-800 ml-3">Chi tiết công việc</Text>
        </View>
        <EmptyState
          icon="🔎"
          title="Không tìm thấy công việc"
          subtitle="Công việc có thể đã bị xoá hoặc không tồn tại."
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-stone-50">
      <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-stone-100 items-center justify-center">
          <FontAwesome name="arrow-left" size={14} color="#6b7280" />
        </TouchableOpacity>
        <Text className="font-bold text-sm text-gray-800">Chi tiết công việc</Text>
        <StatusBadge status={job.status} />
      </View>

      <ScrollView className="flex-1 px-4 py-4" contentContainerStyle={{ paddingBottom: 32 }}>
        {job.images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {job.images.map(url => (
              <Image
                key={url}
                source={{ uri: resolveImageUrl(url) ?? '' }}
                className="w-56 h-40 rounded-2xl mr-3 bg-stone-100"
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        )}

        {editing ? (
          <View className="space-y-4">
            <View className="space-y-1.5">
              <Text className="text-xs font-bold text-gray-700">Tên công việc <Text className="text-red-500">*</Text></Text>
              <TextInput value={title} onChangeText={setTitle}
                placeholderTextColor="#9ca3af"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white" />
            </View>

            <View className="space-y-1.5">
              <Text className="text-xs font-bold text-gray-700">Nhóm công việc</Text>
              <View className="flex-row flex-wrap gap-2">
                {catEntries.map(([key, meta]) => (
                  <TouchableOpacity key={key} onPress={() => setCategory(key)}
                    className="px-3 py-2 rounded-xl border border-gray-200 bg-white"
                    style={category === key ? { backgroundColor: '#fff7ed', borderColor: '#fdba74' } : undefined}>
                    <Text className={`text-xs font-bold ${category === key ? 'text-orange-500' : 'text-gray-600'}`}>{meta.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="space-y-1.5">
              <Text className="text-xs font-bold text-gray-700">Mô tả công việc <Text className="text-red-500">*</Text></Text>
              <TextInput value={description} onChangeText={setDescription} multiline numberOfLines={3}
                placeholderTextColor="#9ca3af"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white"
                style={{ minHeight: 80, textAlignVertical: 'top' }} />
            </View>

            <View className="space-y-1.5">
              <Text className="text-xs font-bold text-gray-700">Mức giá đề xuất <Text className="text-red-500">*</Text></Text>
              <TextInput value={price} onChangeText={setPrice} keyboardType="number-pad"
                placeholderTextColor="#9ca3af"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white" />
            </View>

            <View className="space-y-1.5">
              <Text className="text-xs font-bold text-gray-700">Địa điểm thực hiện</Text>
              <TextInput value={location} onChangeText={setLocation}
                placeholderTextColor="#9ca3af"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white" />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => setEditing(false)}
                className="flex-1 bg-stone-100 py-3 rounded-2xl items-center">
                <Text className="text-gray-600 text-sm font-bold">Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} disabled={isUpdating}
                className={`flex-1 bg-orange-500 py-3 rounded-2xl items-center ${isUpdating ? 'opacity-60' : ''}`}>
                {isUpdating ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-sm font-bold">Lưu thay đổi</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="space-y-4">
            <View>
              <View className="flex-row items-start justify-between">
                <Text className="text-lg font-extrabold text-gray-900 flex-1 mr-2">{job.title}</Text>
                <Text className="text-lg font-extrabold text-teal-600 flex-shrink-0">{formatVnd(job.price)}</Text>
              </View>
              <View className="flex-row items-center mt-2">
                <View className="flex-row items-center bg-orange-50 px-2.5 py-1 rounded-full mr-2">
                  <FontAwesome name={(CATEGORY_META[job.category]?.icon || 'wrench') as keyof typeof FontAwesome.glyphMap} size={10} color="#ea580c" />
                  <Text className="text-[10px] font-bold text-orange-500 ml-1.5">{CATEGORY_META[job.category]?.label ?? job.category}</Text>
                </View>
                <Text className="text-[11px] text-gray-400">Đăng ngày {formatDate(job.createdAt)}</Text>
              </View>
            </View>

            <View className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2.5">
              <Text className="text-xs font-bold text-gray-700">Mô tả công việc</Text>
              <Text className="text-xs text-gray-500 leading-relaxed">{job.description}</Text>
              <View className="border-t border-gray-50 pt-2.5">
                <Text className="text-[11px] text-gray-500">
                  <FontAwesome name="map-marker" size={10} color="#9ca3af" /> {job.locationText || 'Chưa có địa chỉ'}
                </Text>
                {job.distanceKm != null && (
                  <Text className="text-[11px] text-gray-400 mt-1">
                    <FontAwesome name="location-arrow" size={10} color="#9ca3af" /> Cách bạn {job.distanceKm} km
                  </Text>
                )}
              </View>
            </View>

            <View className="bg-white border border-gray-200 rounded-2xl p-4 flex-row items-center space-x-3">
              {resolveImageUrl(job.owner.avatarUrl) ? (
                <Image
                  source={{ uri: resolveImageUrl(job.owner.avatarUrl) ?? '' }}
                  className="w-11 h-11 rounded-full border border-gray-200"
                />
              ) : (
                <View className="w-11 h-11 rounded-full bg-teal-50 items-center justify-center">
                  <Text className="text-teal-600 font-extrabold text-sm">
                    {(job.owner.name || 'G').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View className="flex-1">
                <Text className="font-bold text-sm text-gray-800">{job.owner.name}</Text>
                <Text className="text-[11px] text-amber-500 font-bold mt-0.5">
                  <FontAwesome name="star" size={10} />{' '}
                  {job.owner.ratingAvg > 0 ? job.owner.ratingAvg.toFixed(1) : 'Chưa có đánh giá'}
                </Text>
              </View>
              {isOwner && (
                <Text className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">Bạn</Text>
              )}
            </View>

            {isOwner && (
              <View className="flex-row gap-3">
                <TouchableOpacity onPress={startEdit}
                  className="flex-1 bg-orange-500 py-3 rounded-2xl items-center flex-row justify-center space-x-2">
                  <FontAwesome name="pencil" size={12} color="white" />
                  <Text className="text-white text-sm font-bold">Chỉnh sửa</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDelete} disabled={isDeleting}
                  className={`flex-1 bg-red-50 py-3 rounded-2xl items-center flex-row justify-center space-x-2 ${isDeleting ? 'opacity-60' : ''}`}>
                  {isDeleting ? (
                    <ActivityIndicator color="#ef4444" />
                  ) : (
                    <>
                      <FontAwesome name="trash" size={12} color="#ef4444" />
                      <Text className="text-red-500 text-sm font-bold">Xoá</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
