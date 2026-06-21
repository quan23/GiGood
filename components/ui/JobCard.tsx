import { View, Text, TouchableOpacity } from "react-native";
import type { Job } from "@/types";
import { formatVnd } from "@/lib/format";

interface Props {
  job: Job;
  onPress?: () => void;
  showActions?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  finding: "Đang tìm",
  assigned: "Đã nhận",
  completed: "Hoàn thành",
};

const STATUS_BADGE: Record<string, string> = {
  finding: "bg-yellow-100 text-yellow-700",
  assigned: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
};

export function JobCard({ job, onPress, showActions, actionLabel, onAction }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl p-4 mx-4 mb-3 shadow-sm border border-gray-100"
      activeOpacity={0.7}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-base font-bold text-gray-900 flex-1">{job.title}</Text>
        <View className={`rounded-full px-3 py-1 ${STATUS_BADGE[job.status]}`}>
          <Text className={`text-xs font-semibold`}>{STATUS_LABEL[job.status]}</Text>
        </View>
      </View>
      <Text className="text-sm text-gray-500 mb-1">{job.category}</Text>
      <Text className="text-sm text-gray-500 mb-1">{job.location}</Text>
      <View className="flex-row items-center justify-between mt-2">
        <Text className="text-lg font-bold text-green-600">{formatVnd(job.budget)}</Text>
        {showActions && actionLabel && onAction && (
          <TouchableOpacity onPress={onAction} className="bg-green-600 rounded-lg px-4 py-2">
            <Text className="text-white font-semibold text-sm">{actionLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}
