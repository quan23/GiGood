import { Text, TouchableOpacity, View } from 'react-native'
import { FontAwesome } from '@expo/vector-icons'
import { useAuth } from '../../../../hooks/useAuth'
import { useJobRatings } from '../../../../hooks/useRatings'
import { colors } from '../../../../constants/theme'

interface Props {
  jobId: string
  /** The signed-in user is a participant who may still review this done job. */
  canRate?: boolean
  onRate?: () => void
}

function ReadOnlyStars({ value, size = 11 }: { value: number; size?: number }) {
  return (
    <View className="flex-row items-center space-x-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <FontAwesome
          key={star}
          name="star"
          size={size}
          color={star <= value ? colors.amber : colors.grayDisabled}
        />
      ))}
    </View>
  )
}

/**
 * Read-only rating summary for a completed job row (both directions); when the
 * caller can still review the job it offers the `Đánh giá` trigger.
 */
export function JobRatingBlock({ jobId, canRate = false, onRate }: Props) {
  const { profile } = useAuth()
  const { reviews, loading } = useJobRatings(jobId)

  if (loading) return null

  const mine = reviews.find((review) => review.reviewer.id === profile?.id)
  const received = reviews.find((review) => review.reviewer.id !== profile?.id)

  if (!mine && !received && !canRate) return null

  return (
    <View className="pt-1.5 mt-0.5 border-t border-gray-50 space-y-1">
      {mine ? (
        <View className="flex-row items-center justify-between">
          <Text className="text-[10px] text-gray-400">Bạn đã đánh giá</Text>
          <ReadOnlyStars value={mine.rate} />
        </View>
      ) : null}
      {received ? (
        <View className="flex-row items-center justify-between">
          <Text className="text-[10px] text-gray-400">Đánh giá nhận được</Text>
          <ReadOnlyStars value={received.rate} />
        </View>
      ) : null}
      {!mine && canRate && onRate ? (
        <TouchableOpacity
          onPress={onRate}
          className="self-start bg-orange-50 px-2.5 py-1 rounded-full"
        >
          <Text className="text-[10px] font-bold text-orange-500">Đánh giá</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}
