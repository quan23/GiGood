import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useGiGood } from "@/lib/GiGoodContext";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RoleSelectScreen() {
  const { dispatch } = useGiGood();
  const router = useRouter();

  function pickRole(role: "seeker" | "tasker") {
    dispatch({ type: "REGISTER_ROLE", payload: role });
    router.push((role === "seeker" ? "/(auth)/signup-seeker" : "/(auth)/signup-tasker") as any);
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 justify-center">
        <Text className="text-3xl font-bold text-gray-900 text-center">Chào mừng đến với</Text>
        <Text className="text-4xl font-extrabold text-green-600 text-center mb-2">GiGood</Text>
        <Text className="text-base text-gray-500 text-center mb-10">
          Bạn muốn tham gia với vai trò nào?
        </Text>

        <TouchableOpacity
          onPress={() => pickRole("seeker")}
          activeOpacity={0.85}
          className="bg-orange-50 border-2 border-orange-200 rounded-3xl p-6 mb-5 items-center"
        >
          <Text className="text-5xl mb-3">{"\u{1F50D}"}</Text>
          <Text className="text-xl font-bold text-gray-800">Tôi cần thuê người</Text>
          <Text className="text-sm text-gray-500 mt-1 text-center">
            Đăng việc và tìm người giúp việc nhanh chóng
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => pickRole("tasker")}
          activeOpacity={0.85}
          className="bg-green-50 border-2 border-green-200 rounded-3xl p-6 items-center"
        >
          <Text className="text-5xl mb-3">{"\u{1F4AA}"}</Text>
          <Text className="text-xl font-bold text-gray-800">Tôi muốn nhận việc</Text>
          <Text className="text-sm text-gray-500 mt-1 text-center">
            Kiếm thêm thu nhập với công việc linh hoạt
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
