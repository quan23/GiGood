import { useState, useCallback, useEffect } from "react";
import { View, Text, FlatList, RefreshControl } from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { JobCard } from "@/components/ui/JobCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { useGiGood } from "@/lib/GiGoodContext";
import { useJobs } from "@/hooks/useJobs";
import { useUi } from "@/hooks/useUi";
import { router } from "expo-router";

export default function JobsScreen() {
  const { state } = useGiGood();
  const { assignTasker } = useJobs();
  const { showToast } = useUi();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const jobs = state.data.jobs.filter(j => j.status !== "completed");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const handleAssign = (jobId: number) => {
    assignTasker(jobId);
    showToast("Đã tìm thấy tasker! Hãy nhắn tin trao đổi.", "success");
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="px-4 pt-4 pb-2">
          <View className="h-7 w-28 bg-gray-200 rounded-lg mb-1" />
          <View className="h-4 w-36 bg-gray-200 rounded" />
        </View>
        <SkeletonCard />
        <SkeletonCard />
      </SafeAreaView>
    );
  }

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />}
        contentContainerClassName="pb-4"
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 60).springify()} exiting={FadeOutUp}>
            <JobCard
              job={item}
              actionLabel={item.status === "finding" ? "Tìm tasker" : undefined}
              onAction={item.status === "finding" ? () => handleAssign(item.id) : undefined}
            />
          </Animated.View>
        )}
      />
    </SafeAreaView>
  );
}
