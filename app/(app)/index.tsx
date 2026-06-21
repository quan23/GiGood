import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AppHome() {
  return (
    <SafeAreaView className="flex-1 bg-white justify-center items-center">
      <Text className="text-2xl font-bold text-green-600">GiGood</Text>
      <Text className="text-gray-500 mt-2">App chính sẽ được xây dựng ở Phase 5</Text>
    </SafeAreaView>
  );
}
