import { useState } from 'react'
import { Image, View, Text } from 'react-native'

type Props = {
  uri: string
  name: string
  size?: number
}

export function AvatarPill({ uri, name, size = 36 }: Props) {
  const [failed, setFailed] = useState(false)
  const initials = name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()
  return (
    <View style={{ width: size, height: size }} className="rounded-full overflow-hidden border border-gray-200">
      {failed ? (
        <View className="flex-1 items-center justify-center bg-gray-200">
          <Text className="text-xs font-bold text-gray-500">{initials}</Text>
        </View>
      ) : (
        <Image source={{ uri }} className="flex-1" onError={() => setFailed(true)} />
      )}
    </View>
  )
}
