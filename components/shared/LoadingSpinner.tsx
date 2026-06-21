import { View, ActivityIndicator, Text } from "react-native";

interface Props {
  text?: string;
}

export function LoadingSpinner({ text = "Đang tải..." }: Props) {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" color="#16a34a" />
      <Text className="mt-3 text-sm text-gray-500">{text}</Text>
    </View>
  );
}
