import '../global.css'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { GiGoodProvider } from '../lib/GiGoodContext'
import { queryClient } from '../lib/core/query/queryClient'
import { Toast } from '../components/ui/Toast'
import { useAuth } from '../hooks/useAuth'

function AuthGate() {
  const { hydrate, hydrated } = useAuth()

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  if (!hydrated) {
    return null
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
      <StatusBar style="dark" />
      <Toast />
    </>
  )
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GiGoodProvider>
        <AuthGate />
      </GiGoodProvider>
    </QueryClientProvider>
  )
}
