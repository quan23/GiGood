import '../global.css'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GiGoodProvider } from '../lib/GiGoodContext'
import { Toast } from '../components/ui/Toast'

export default function RootLayout() {
  return (
    <GiGoodProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
      <StatusBar style="dark" />
      <Toast />
    </GiGoodProvider>
  )
}
