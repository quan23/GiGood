import { Stack } from "expo-router";
import { useGiGood } from "@/lib/GiGoodContext";

export default function AppLayout() {
  const { state } = useGiGood();
  const role = state.auth.currentRole;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="chat/[id]"
        options={{
          headerShown: true,
          headerTitle: "Tin nhắn",
          headerTintColor: "#16a34a",
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          presentation: "modal",
          headerShown: true,
          headerTitle: "Thông báo",
          headerTintColor: "#16a34a",
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          headerShown: true,
          headerTitle: role === "seeker" ? "Hồ sơ của tôi" : "Hồ sơ tasker",
          headerTintColor: "#16a34a",
        }}
      />
    </Stack>
  );
}
