import { Tabs } from "expo-router";
import { Text } from "react-native";
import { useGiGood } from "@/lib/GiGoodContext";

const TAB_ICONS: Record<string, string> = {
  post: "📋",
  jobs: "📄",
  board: "📋",
  active: "⚡",
  chat: "💬",
  history: "🕐",
  earnings: "💰",
};

export default function TabLayout() {
  const { state } = useGiGood();
  const role = state.auth.currentRole;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#16a34a",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: { paddingBottom: 4, height: 56 },
        tabBarLabelStyle: { fontSize: 11 },
        tabBarIcon: ({ focused, color }) => (
          <Text style={{ fontSize: 20 }}>{TAB_ICONS[focused ? "chat" : "chat"]}</Text>
        ),
      }}
    >
      {role === "seeker" ? (
        <>
          <Tabs.Screen
            name="post"
            options={{
              title: "Đăng việc",
              tabBarIcon: ({ focused }) => <Text style={{ fontSize: 20 }}>{focused ? "📝" : "📋"}</Text>,
            }}
          />
          <Tabs.Screen
            name="jobs"
            options={{
              title: "Việc làm",
              tabBarIcon: ({ focused }) => <Text style={{ fontSize: 20 }}>{focused ? "📄" : "📃"}</Text>,
            }}
          />
          <Tabs.Screen
            name="history"
            options={{
              title: "Lịch sử",
              tabBarIcon: ({ focused }) => <Text style={{ fontSize: 20 }}>{focused ? "🕐" : "⏳"}</Text>,
            }}
          />
        </>
      ) : (
        <>
          <Tabs.Screen
            name="board"
            options={{
              title: "Bảng việc",
              tabBarIcon: ({ focused }) => <Text style={{ fontSize: 20 }}>{focused ? "📋" : "📄"}</Text>,
            }}
          />
          <Tabs.Screen
            name="active"
            options={{
              title: "Đang làm",
              tabBarIcon: ({ focused }) => <Text style={{ fontSize: 20 }}>{focused ? "⚡" : "🔋"}</Text>,
            }}
          />
          <Tabs.Screen
            name="earnings"
            options={{
              title: "Thu nhập",
              tabBarIcon: ({ focused }) => <Text style={{ fontSize: 20 }}>{focused ? "💰" : "💳"}</Text>,
            }}
          />
        </>
      )}
      <Tabs.Screen
        name="chat"
        options={{
          title: "Tin nhắn",
          tabBarIcon: ({ focused }) => <Text style={{ fontSize: 20 }}>{focused ? "💬" : "✉️"}</Text>,
        }}
      />
    </Tabs>
  );
}
