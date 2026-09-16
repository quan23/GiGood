import { View, Text, TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import type { JobModel } from "@/lib/features/jobs/types";
import { CATEGORY_META } from "@/lib/categories";
import { formatVnd } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";

interface Props {
  job: JobModel;
  onPress?: () => void;
  selected?: boolean;
  showActions?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

export function JobCard({ job, onPress, selected, showActions, actionLabel, onAction }: Props) {
  const meta = CATEGORY_META[job.category]

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`bg-white rounded-2xl p-4 mx-4 mb-3 shadow-sm border ${
        selected ? "border-teal-500" : "border-gray-100"
      }`}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-base font-bold text-gray-900 flex-1 mr-2">{job.title}</Text>
        <StatusBadge status={job.status} />
      </View>
      <View className="flex-row items-center mb-1">
        <FontAwesome
          name={(meta?.icon || "wrench") as keyof typeof FontAwesome.glyphMap}
          size={11}
          color="#9ca3af"
        />
        <Text className="text-sm text-gray-500 ml-1.5">{meta?.label ?? job.category}</Text>
        {job.distanceKm != null && (
          <Text className="text-sm text-gray-400 ml-1.5">· {job.distanceKm} km</Text>
        )}
      </View>
      <Text className="text-sm text-gray-500 mb-1" numberOfLines={1}>
        <FontAwesome name="map-marker" size={11} color="#9ca3af" />{" "}
        {job.locationText || "Chưa có địa chỉ"}
      </Text>
      <View className="flex-row items-center justify-between mt-2">
        <Text className="text-lg font-bold text-green-600">{formatVnd(job.price)}</Text>
        {showActions && actionLabel && onAction && (
          <TouchableOpacity onPress={onAction} className="bg-green-600 rounded-lg px-4 py-2">
            <Text className="text-white font-semibold text-sm">{actionLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}
