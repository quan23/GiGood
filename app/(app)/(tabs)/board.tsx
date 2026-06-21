import { useState, useCallback, useEffect } from "react";
import { View, Text, FlatList, RefreshControl } from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { JobCard } from "@/components/ui/JobCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { useGiGood } from "@/lib/GiGoodContext";

export default function BoardScreen() {
  const { state } = useGiGood();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const available = state.data.jobs.filter(j => j.status === "finding");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />}
          contentContainerClassName="pb-4"
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 60).springify()} exiting={FadeOutUp}>
              <JobCard job={item} />
            </Animated.View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
