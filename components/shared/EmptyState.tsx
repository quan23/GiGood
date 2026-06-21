import { View, Text } from "react-native";

interface Props {
  icon?: string;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon = "\u{1F4ED}", title, subtitle }: Props) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Text className="text-5xl mb-4">{icon}</Text>
      <Text className="text-lg font-semibold text-gray-800 text-center mb-2">{title}</Text>
      {subtitle && <Text className="text-sm text-gray-400 text-center leading-5">{subtitle}</Text>}
    </View>
  );
}
