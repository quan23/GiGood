import { Tabs } from 'expo-router'
import { FontAwesome } from '@expo/vector-icons'
import { useAuth } from '../../../hooks/useAuth'

const SEEKER_TABS = [
  { name: 'post', label: 'Đăng việc', icon: 'plus-circle' as const },
  { name: 'jobs', label: 'Việc của tôi', icon: 'list' as const },
  { name: 'chat', label: 'Tin nhắn', icon: 'comments' as const },
  { name: 'history', label: 'Lịch sử', icon: 'file-text' as const },
]

const TASKER_TABS = [
  { name: 'board', label: 'Bảng việc', icon: 'map-marker' as const },
  { name: 'active', label: 'Đã nhận', icon: 'briefcase' as const },
  { name: 'chat', label: 'Tin nhắn', icon: 'comments' as const },
  { name: 'earnings', label: 'Thu nhập', icon: 'money' as const },
]

export default function TabLayout() {
  const { currentRole } = useAuth()
  const isSeeker = currentRole === 'seeker'
  const activeColor = isSeeker ? '#ea580c' : '#0f766e'
  const tabs = isSeeker ? SEEKER_TABS : TASKER_TABS

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e7e5e4',
          paddingBottom: 10,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      }}
    >
      {tabs.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ color, size }) => (
              <FontAwesome name={tab.icon} size={size || 18} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  )
}
