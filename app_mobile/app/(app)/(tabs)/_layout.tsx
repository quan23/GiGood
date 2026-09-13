import { Tabs } from 'expo-router'
import { FontAwesome } from '@expo/vector-icons'
import { useAuth } from '../../../hooks/useAuth'

type Role = 'seeker' | 'tasker'

const ALL_TABS: { name: string; label: string; icon: React.ComponentProps<typeof FontAwesome>['name']; roles: Role[] }[] = [
  { name: 'post',     label: 'Đăng việc',    icon: 'plus-circle', roles: ['seeker'] },
  { name: 'jobs',     label: 'Việc của tôi', icon: 'list',        roles: ['seeker'] },
  { name: 'chat',     label: 'Tin nhắn',     icon: 'comments',    roles: ['seeker', 'tasker'] },
  { name: 'history',  label: 'Lịch sử',      icon: 'file-text',   roles: ['seeker'] },
  { name: 'board',    label: 'Bảng việc',    icon: 'map-marker',  roles: ['tasker'] },
  { name: 'active',   label: 'Đã nhận',      icon: 'briefcase',   roles: ['tasker'] },
  { name: 'earnings', label: 'Thu nhập',     icon: 'money',       roles: ['tasker'] },
]

export default function TabLayout() {
  const { currentRole } = useAuth()
  const isSeeker = currentRole === 'seeker'
  const activeColor = isSeeker ? '#ea580c' : '#0f766e'

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
      {ALL_TABS.map(tab => {
        const isActive = tab.roles.includes(currentRole as Role)
        return (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.label,
              href: isActive ? undefined : null,
              tabBarIcon: ({ color, size }) => (
                <FontAwesome name={tab.icon} size={size || 18} color={color} />
              ),
            }}
          />
        )
      })}
    </Tabs>
  )
}
