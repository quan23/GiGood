import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGiGood } from "@/lib/GiGoodContext";
import { formatVnd } from "@/lib/format";

export default function EarningsScreen() {
  const { state } = useGiGood();
  const completed = state.data.jobs.filter(j => j.status === "completed");
  const totalEarned = completed.reduce((sum, j) => sum + j.budget, 0);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerClassName="p-4">
        <Text className="text-xl font-bold text-gray-800 mb-4">Thu nhập</Text>

        <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <Text className="text-gray-500 text-sm">Số dư ví</Text>
          <Text className="text-3xl font-bold text-green-600 mt-1">
            {formatVnd(state.data.taskerWallet)}
          </Text>
          <View className="flex-row justify-between mt-4 pt-4 border-t border-gray-100">
            <View>
              <Text className="text-gray-500 text-xs">Đã nhận</Text>
              <Text className="text-lg font-semibold text-gray-800">{formatVnd(totalEarned)}</Text>
            </View>
            <View>
              <Text className="text-gray-500 text-xs">Đang giữ</Text>
              <Text className="text-lg font-semibold text-amber-600">
                {formatVnd(state.data.escrowHeldPool)}
              </Text>
            </View>
            <View>
              <Text className="text-gray-500 text-xs">Việc xong</Text>
              <Text className="text-lg font-semibold text-gray-800">{completed.length}</Text>
            </View>
          </View>
        </View>

        <Text className="text-base font-semibold text-gray-700 mb-2">Lịch sử thanh toán</Text>
        {completed.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 items-center">
            <Text className="text-4xl mb-2">💰</Text>
            <Text className="text-gray-500">Chưa có giao dịch nào</Text>
          </View>
        ) : (
          completed.map(job => (
            <View key={job.id} className="bg-white rounded-xl p-4 mb-2 flex-row justify-between items-center">
              <View className="flex-1 mr-3">
                <Text className="font-semibold text-gray-800" numberOfLines={1}>{job.title}</Text>
                <Text className="text-gray-400 text-xs">{job.seekerName} • {job.timeTag}</Text>
              </View>
              <Text className="font-bold text-green-600">+{formatVnd(job.budget)}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
