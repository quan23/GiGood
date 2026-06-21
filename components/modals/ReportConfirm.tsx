import { Modal, View, Text, TouchableOpacity } from "react-native";
import type { Job } from "../../types";
import { formatVnd } from "../../lib/format";

interface Props {
  visible: boolean;
  job: Job | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ReportConfirm({ visible, job, onConfirm, onCancel }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 bg-black/50 justify-center items-center px-6">
        <View className="bg-white rounded-2xl w-full p-6">
          <Text className="text-lg font-bold text-gray-800 text-center mb-1">Báo hoàn thành</Text>
          <Text className="text-gray-500 text-sm text-center mb-4">
            Xác nhận bạn đã hoàn thành việc này?
          </Text>

          {job && (
            <>
              <View className="bg-gray-50 rounded-xl p-3 mb-4">
                <Text className="font-semibold text-gray-800">{job.title}</Text>
                <Text className="text-green-600 font-bold text-lg mt-1">{formatVnd(job.budget)}</Text>
              </View>
            </>
          )}

          <TouchableOpacity
            onPress={onConfirm}
            className="bg-green-600 rounded-xl py-3 items-center mb-2"
          >
            <Text className="text-white font-semibold text-base">Xác nhận hoàn thành</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onCancel} className="rounded-xl py-3 items-center">
            <Text className="text-gray-500 font-semibold">Huỷ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
