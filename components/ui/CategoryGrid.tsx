import { View, Text, TouchableOpacity } from "react-native";
import type { Category } from "../../types";
import { CATEGORY_META } from "../../lib/categories";

interface Props {
  selected?: Category[];
  onSelect: (category: Category) => void;
  multiple?: boolean;
}

const ICONS: Record<string, string> = {
  "sua-chua": "\u{1F527}",
  "don-dep": "\u{1F9F9}",
  "bao-tri": "\u{1F9F0}",
  "thue-do": "\u{1F381}",
  "van-chuyen": "\u{1F69A}",
  "gia-su": "\u{1F4DA}",
  "lao-cong": "\u{1F4AA}",
  "khac": "\u{1F4AC}",
};

export function CategoryGrid({ selected = [], onSelect, multiple = true }: Props) {
  const entries = Object.entries(CATEGORY_META) as [Category, { label: string; icon: string }][]
  return (
    <View className="flex-row flex-wrap px-4">
      {entries.map(([key, meta]) => (
        <View key={key} className="w-1/4 p-1.5">
          <TouchableOpacity
            onPress={() => onSelect(key)}
            className={`items-center justify-center rounded-2xl p-3 border-2 ${selected.includes(key) ? "border-green-500 bg-green-50" : "border-gray-200 bg-white"}`}
            activeOpacity={0.7}
          >
            <Text className="text-2xl mb-1">{ICONS[key] ?? ICONS["khac"]}</Text>
            <Text className={`text-xs font-medium text-center ${selected.includes(key) ? "text-green-700" : "text-gray-600"}`}>{meta.label}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}
