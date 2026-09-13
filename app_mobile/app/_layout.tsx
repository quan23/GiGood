import '../global.css'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClientProvider } from '@tanstack/react-query'
import { GiGoodProvider } from '../lib/GiGoodContext'
import { queryClient } from '../lib/core/query/queryClient'
import { Toast } from '../components/ui/Toast'

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GiGoodProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
        <StatusBar style="dark" />
        <Toast />
      </GiGoodProvider>
    </QueryClientProvider>
  )
}
