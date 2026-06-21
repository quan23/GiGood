import { View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { JobCard } from "@/components/ui/JobCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { useGiGood } from "@/lib/GiGoodContext";
import { useJobs } from "@/hooks/useJobs";
import { useUi } from "@/hooks/useUi";
import { router } from "expo-router";

export default function JobsScreen() {
  const { state } = useGiGood();
  const { assignTasker } = useJobs();
  const { showToast } = useUi();
  const jobs = state.data.jobs.filter(j => j.status !== "completed");

  const handleAssign = (jobId: number) => {
    assignTasker(jobId);
    showToast("Đã tìm thấy tasker! Hãy nhắn tin trao đổi.", "success");
  };

  if (jobs.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="px-4 pt-4">
          <Text className="text-xl font-bold text-gray-800">Việc đã đăng</Text>
        </View>
        <EmptyState
          icon="📋"
          title="Chưa có việc nào"
          subtitle="Đăng việc mới để tìm người hỗ trợ"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-xl font-bold text-gray-800">Việc đã đăng</Text>
        <Text className="text-gray-500 text-sm">{jobs.length} việc đang mở</Text>
      </View>
      <FlatList
        data={jobs}
        keyExtractor={item => item.id.toString()}
        contentContainerClassName="pb-4"
        renderItem={({ item }) => (
          <JobCard
            job={item}
            actionLabel={item.status === "finding" ? "Tìm tasker" : undefined}
            onAction={item.status === "finding" ? () => handleAssign(item.id) : undefined}
          />
        )}
      />
    </SafeAreaView>
  );
}
