import { useState } from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";
import type { Job, Role } from "@/types";

interface Props {
  visible: boolean;
  job: Job | null;
  currentRole: Role;
  onSubmit: (rating: number) => void;
  onClose: () => void;
}

export function Rating({ visible, job, currentRole, onSubmit, onClose }: Props) {
  const [rating, setRating] = useState(0);
  const targetName = job
    ? currentRole === "seeker"
      ? job.taskerName ?? "Người làm"
      : job.seekerName
    : "";

  const handleSubmit = () => {
    if (rating === 0) return;
    onSubmit(rating);
    setRating(0);
  };

  const handleClose = () => {
    setRating(0);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View className="flex-1 bg-black/50 justify-center items-center px-6">
        <View className="bg-white rounded-2xl w-full p-6 items-center">
          <Text className="text-lg font-bold text-gray-800 mb-1">Đánh giá</Text>
          {targetName ? (
            <Text className="text-gray-500 text-sm mb-4">{targetName}</Text>
          ) : null}

          <View className="flex-row gap-2 mb-6">
            {[1, 2, 3, 4, 5].map(star => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Text className={`text-3xl ${star <= rating ? "opacity-100" : "opacity-20"}`}>
                  ⭐
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={rating === 0}
            className={`rounded-xl py-3 px-8 w-full items-center ${rating === 0 ? "bg-gray-300" : "bg-green-600"}`}
          >
            <Text className="text-white font-semibold text-base">Gửi đánh giá</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClose} className="rounded-xl py-3 items-center mt-1">
            <Text className="text-gray-500 font-semibold">Để sau</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
