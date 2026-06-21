import { View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { JobCard } from "@/components/ui/JobCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { useGiGood } from "@/lib/GiGoodContext";

export default function HistoryScreen() {
  const { state } = useGiGood();
  const completed = state.data.jobs.filter(j => j.status === "completed");

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-xl font-bold text-gray-800">Lịch sử</Text>
        <Text className="text-gray-500 text-sm">
          {completed.length} việc đã hoàn thành
        </Text>
      </View>
      {completed.length === 0 ? (
        <EmptyState
          icon="🕐"
          title="Chưa có lịch sử"
          subtitle="Các việc đã hoàn thành sẽ hiển thị ở đây"
        />
      ) : (
        <FlatList
          data={completed}
          keyExtractor={item => item.id.toString()}
          contentContainerClassName="pb-4"
          renderItem={({ item }) => <JobCard job={item} />}
        />
      )}
    </SafeAreaView>
  );
}
