import { View, TextInput, Text, type TextInputProps } from "react-native";

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", ...props }: Props) {
  return (
    <View className="gap-1.5">
      {label && <Text className="text-sm font-medium text-gray-700">{label}</Text>}
      <TextInput
        className={`border rounded-xl px-4 py-3 text-base text-gray-900 bg-white ${error ? "border-red-500" : "border-gray-300"} ${className}`}
        placeholderTextColor="#9ca3af"
        {...props}
      />
      {error && <Text className="text-sm text-red-500">{error}</Text>}
    </View>
  );
}
