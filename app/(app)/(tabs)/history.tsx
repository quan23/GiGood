import { useState, useCallback, useEffect } from "react";
import { View, Text, FlatList, RefreshControl } from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { JobCard } from "@/components/ui/JobCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Rating } from "@/components/modals/Rating";
import { useGiGood } from "@/lib/GiGoodContext";
import { useJobs } from "@/hooks/useJobs";
import type { Job } from "@/types";

export default function HistoryScreen() {
  const { state } = useGiGood();
  const { rateSeeker, rateTasker } = useJobs();
  const [rateJob, setRateJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const completed = state.data.jobs.filter(j => j.status === "completed");
  const role = state.auth.currentRole;

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const needsRating = (job: Job) =>
    role === "seeker" ? job.taskerRating === null : job.seekerRating === null;

  const handleRate = (job: Job) => setRateJob(job);

  const handleRateSubmit = (rating: number) => {
    if (!rateJob) return;
    if (role === "seeker") {
      rateTasker(rateJob.id, rating);
    } else {
      rateSeeker(rateJob.id, rating);
    }
    setRateJob(null);
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
        <SkeletonCard />
      </SafeAreaView>
    );
  }

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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />}
          contentContainerClassName="pb-4"
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 60).springify()} exiting={FadeOutUp}>
              <JobCard
                job={item}
                actionLabel={needsRating(item) ? "Đánh giá" : undefined}
                onAction={needsRating(item) ? () => handleRate(item) : undefined}
              />
            </Animated.View>
          )}
        />
      )}
      <Rating
        visible={rateJob !== null}
        job={rateJob}
        currentRole={role}
        onSubmit={handleRateSubmit}
        onClose={() => setRateJob(null)}
      />
    </SafeAreaView>
  );
}
