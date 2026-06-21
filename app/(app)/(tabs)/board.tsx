import { View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { JobCard } from "@/components/ui/JobCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { useGiGood } from "@/lib/GiGoodContext";

export default function BoardScreen() {
  const { state } = useGiGood();
  const available = state.data.jobs.filter(j => j.status === "finding");

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-xl font-bold text-gray-800">Bảng việc</Text>
        <Text className="text-gray-500 text-sm">
          {available.length} việc đang chờ nhận
        </Text>
      </View>
      {available.length === 0 ? (
        <EmptyState
          icon="📄"
          title="Không có việc mới"
          subtitle="Quay lại sau để xem việc mới nhé"
        />
      ) : (
        <FlatList
          data={available}
          keyExtractor={item => item.id.toString()}
          contentContainerClassName="pb-4"
          renderItem={({ item }) => <JobCard job={item} />}
        />
      )}
    </SafeAreaView>
  );
}
