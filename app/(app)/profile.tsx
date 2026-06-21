import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Avatar } from "@/components/shared/Avatar";
import { Button } from "@/components/ui/Button";
import { useGiGood } from "@/lib/GiGoodContext";
import { formatVnd } from "@/lib/format";
import { CATEGORY_META } from "@/lib/categories";
import { AVAILABILITY_LABEL, VEHICLE_LABEL } from "@/lib/categories";

export default function ProfileScreen() {
  const { state } = useGiGood();
  const profile = state.auth.profile;
  const role = state.auth.currentRole;
  const completedJobs = state.data.jobs.filter(j => j.status === "completed");

  if (!profile) return null;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerClassName="p-4">
        <View className="items-center mb-6">
          <Avatar name={profile.name} size={80} />
          <Text className="text-xl font-bold text-gray-800 mt-3">{profile.name}</Text>
          <Text className="text-gray-500">{profile.phone}</Text>
          <Text className="text-gray-400 text-sm">{profile.location}</Text>
          <View className="mt-2 bg-green-100 px-3 py-1 rounded-full">
            <Text className="text-green-700 text-sm font-medium">
              {role === "seeker" ? "Người thuê việc" : "Người làm việc"}
            </Text>
          </View>
        </View>

        {role === "tasker" && profile.taskerProfile && (
          <View className="bg-white rounded-2xl p-4 mb-4">
            <Text className="font-semibold text-gray-800 mb-2">Kỹ năng</Text>
            <View className="flex-row flex-wrap gap-2 mb-3">
              {profile.taskerProfile.skills.map(skill => (
                <View key={skill} className="bg-gray-100 rounded-full px-3 py-1">
                  <Text className="text-sm text-gray-700">
                    {CATEGORY_META[skill]?.label ?? skill}
                  </Text>
                </View>
              ))}
            </View>

            {profile.taskerProfile.bio ? (
              <>
                <Text className="font-semibold text-gray-800 mb-1">Giới thiệu</Text>
                <Text className="text-gray-600 mb-3">{profile.taskerProfile.bio}</Text>
              </>
            ) : null}

            <View className="flex-row gap-4">
              <View>
                <Text className="text-xs text-gray-400">Thời gian</Text>
                <Text className="text-sm font-medium text-gray-700">
                  {AVAILABILITY_LABEL[profile.taskerProfile.availability]}
                </Text>
              </View>
              <View>
                <Text className="text-xs text-gray-400">Phương tiện</Text>
                <Text className="text-sm font-medium text-gray-700">
                  {VEHICLE_LABEL[profile.taskerProfile.vehicle]}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="font-semibold text-gray-800 mb-2">Thống kê</Text>
          <View className="flex-row justify-between">
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-green-600">{completedJobs.length}</Text>
              <Text className="text-xs text-gray-400">Việc xong</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-amber-600">
                {role === "tasker" ? formatVnd(state.data.taskerWallet) : formatVnd(state.data.seekerWallet)}
              </Text>
              <Text className="text-xs text-gray-400">Số dư</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-gray-800">
                {role === "seeker" ? formatVnd(state.data.escrowHeldPool) : "0₫"}
              </Text>
              <Text className="text-xs text-gray-400">Đang cọc</Text>
            </View>
          </View>
        </View>

        <Button
          title="Xem thông báo"
          variant="outline"
          onPress={() => {
            router.back();
            setTimeout(() => router.push("/(app)/notifications" as any), 100);
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
