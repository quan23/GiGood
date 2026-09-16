import { FontAwesome } from "@expo/vector-icons";
import { Redirect, Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";
import { useWallet } from "../../hooks/useWallet";
import { CartProvider } from "../../lib/features/wallet/context/CartContext";
import { connectChatHub } from "../../lib/features/chat/hub";
import { connectNotificationHub } from "../../lib/features/notifications/hub";
import { formatNotificationTime } from "../../lib/features/notifications/format";
import { formatVnd } from "../../lib/format";

export default function AppLayout() {
  const { profile, currentRole, switchRole } = useAuth();
  const { balance, escrowHeld, isSeeker } = useWallet();
  const { notifications, unreadCount, clear } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const router = useRouter();

  // Foreground-only realtime: connect both hubs once the session is hydrated.
  // Best effort, never blocks the shell if a hub is unreachable.
  useEffect(() => {
    if (profile) {
      void connectChatHub();
      void connectNotificationHub();
    }
  }, [profile]);

  if (!profile) {
    return <Redirect href="/(auth)" />;
  }

  const toggleNotif = () => setNotifOpen(!notifOpen);

  return (
    <CartProvider>
      <SafeAreaView className="flex-1 bg-stone-50">
      {/* Sticky Header */}
      <View className="bg-white border-b border-gray-200 px-4 pb-3 relative z-30">
        {/* Top row */}
        <View className="flex-row items-center justify-between pt-3">
          <View className="flex-row items-center space-x-2">
            <Text className="text-orange-500 text-xl font-extrabold tracking-tight">
              GiGood
            </Text>
            <Text
              className={`${isSeeker ? "bg-orange-50 text-orange-500" : "bg-teal-50 text-teal-600"} text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide`}
            >
              {isSeeker ? "Seeker" : "Tasker"}
            </Text>
          </View>
          <View className="flex-row items-center space-x-2">
            <TouchableOpacity
              onPress={toggleNotif}
              className="w-9 h-9 rounded-xl bg-stone-50 border border-gray-200 items-center justify-center relative"
            >
              <FontAwesome name="bell" size={14} color="#6b7280" />
              {unreadCount > 0 && (
                <View className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-orange-500 rounded-full items-center justify-center">
                  <Text className="text-white text-[8px] font-bold">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/(app)/profile")}>
              <Image
                source={{ uri: profile.avatar }}
                className="w-9 h-9 rounded-xl border border-gray-200"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Role Switcher */}
        <View className="bg-gray-100 p-1 rounded-xl flex-row mt-3">
          <TouchableOpacity
            onPress={() => {
              if (currentRole !== "seeker") {
                router.replace("/(app)/(tabs)/post");
                switchRole("seeker");
              }
            }}
            className="flex-1 py-2 rounded-lg flex-row items-center justify-center space-x-1.5 relative overflow-hidden"
          >
            {currentRole === "seeker" && (
              <View className="absolute inset-0 bg-white shadow-sm rounded-lg" />
            )}
            <FontAwesome
              name="user"
              size={12}
              color={currentRole === "seeker" ? "#ea580c" : "#6b7280"}
            />
            <Text
              className={`text-[11px] font-extrabold ${currentRole === "seeker" ? "text-orange-500" : "text-gray-500"}`}
            >
              Người Thuê
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (currentRole !== "tasker") {
                router.replace("/(app)/(tabs)/board");
                switchRole("tasker");
              }
            }}
            className="flex-1 py-2 rounded-lg flex-row items-center justify-center space-x-1.5 relative overflow-hidden"
          >
            {currentRole === "tasker" && (
              <View className="absolute inset-0 bg-white shadow-sm rounded-lg" />
            )}
            <FontAwesome
              name="wrench"
              size={12}
              color={currentRole === "tasker" ? "#0f766e" : "#6b7280"}
            />
            <Text
              className={`text-[11px] font-extrabold ${currentRole === "tasker" ? "text-teal-600" : "text-gray-500"}`}
            >
              Người Nhận
            </Text>
          </TouchableOpacity>
        </View>

        {/* Wallet + Escrow cards */}
        <View className="flex-row gap-2 mt-3">
          <View className="flex-1 flex-row items-center space-x-2 bg-teal-50 border border-teal-200 px-3 py-2 rounded-xl">
            <FontAwesome name="shield" size={14} color="#0f766e" />
            <View>
              <Text className="text-[9px] text-gray-500 font-medium">
                Ký quỹ an toàn
              </Text>
              <Text className="text-[11px] text-teal-600 font-extrabold">
                {formatVnd(escrowHeld)}
              </Text>
            </View>
          </View>
          <View className="flex-1 flex-row items-center space-x-2 bg-stone-50 border border-gray-200 px-3 py-2 rounded-xl">
            <FontAwesome name="credit-card" size={14} color="#6b7280" />
            <View>
              <Text className="text-[9px] text-gray-500 font-medium">
                Ví của {profile.name.split(" ").pop()}
              </Text>
              <Text className="text-[11px] text-gray-900 font-extrabold">
                {formatVnd(balance)}
              </Text>
            </View>
          </View>
        </View>

        {/* Notification Dropdown Tray */}
        {notifOpen && (
          <View className="absolute right-3 top-[68px] w-[88%] bg-white rounded-2xl border border-gray-200 shadow-xl p-4 z-50">
            <View className="flex-row justify-between items-center border-b border-gray-100 pb-2">
              <Text className="font-extrabold text-xs text-gray-800">
                Thông báo của bạn
              </Text>
              <View className="flex-row items-center space-x-3">
                <TouchableOpacity
                  onPress={() => {
                    setNotifOpen(false);
                    router.push("/(app)/notifications");
                  }}
                >
                  <Text className="text-[10px] text-gray-400 font-bold">
                    Xem tất cả
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => void clear()}>
                  <Text className="text-[10px] text-orange-500 font-bold">
                    Xóa hết
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView style={{ maxHeight: 240 }} className="space-y-2.5">
              {notifications.length === 0 ? (
                <Text className="text-gray-400 text-center py-4 text-xs">
                  Không có thông báo mới nào.
                </Text>
              ) : (
                notifications.map((n) => (
                  <View
                    key={n.id}
                    className="flex-row items-start space-x-2.5 pb-2.5 border-b border-gray-50"
                  >
                    <View
                      className={`w-7 h-7 rounded-full items-center justify-center ${
                        n.read ? "bg-stone-100" : "bg-orange-50"
                      }`}
                    >
                      <FontAwesome
                        name="bell"
                        size={10}
                        color={n.read ? "#9ca3af" : "#ea580c"}
                      />
                    </View>
                    <View className="flex-1">
                      <Text
                        className={`text-xs leading-snug ${n.read ? "text-gray-500" : "text-gray-800 font-semibold"}`}
                        numberOfLines={2}
                      >
                        {n.title}
                      </Text>
                      <Text
                        className="text-[10px] text-gray-400 mt-0.5"
                        numberOfLines={2}
                      >
                        {n.body}
                      </Text>
                      <Text className="text-[10px] text-gray-400 mt-0.5">
                        {formatNotificationTime(n.createdAt)}
                      </Text>
                    </View>
                    {!n.read && (
                      <View className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5" />
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Content */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen
          name="notifications"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="job/[id]" options={{ headerShown: false }} />
      </Stack>
      </SafeAreaView>
    </CartProvider>
  );
}
