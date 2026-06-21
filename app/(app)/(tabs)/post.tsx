import { useState } from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Button } from "@/components/ui/Button";
import { CATEGORIES, CATEGORY_META } from "@/lib/categories";
import { formatVnd } from "@/lib/format";
import { useJobs } from "@/hooks/useJobs";
import { useUi } from "@/hooks/useUi";
import type { Category } from "@/types";

export default function PostJobScreen() {
  const { postJob, allJobs } = useJobs();
  const { showToast } = useUi();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!title.trim() || !description.trim() || !budget.trim() || !location.trim() || !category) {
      Alert.alert("Thiếu thông tin", "Vui lòng điền đầy đủ các trường bắt buộc.");
      return;
    }
    const budgetNum = parseInt(budget.replace(/\D/g, ""), 10);
    if (isNaN(budgetNum) || budgetNum < 10000) {
      Alert.alert("Ngân sách không hợp lệ", "Vui lòng nhập số tiền tối thiểu 10.000₫.");
      return;
    }
    setSubmitting(true);
    postJob({
      title: title.trim(),
      description: description.trim(),
      budget: budgetNum,
      location: location.trim(),
      category,
      timeTag: "Vừa xong",
      mapX: "50%",
      mapY: "50%",
    });
    showToast("Đã đăng việc thành công!", "success");
    setTitle("");
    setDescription("");
    setBudget("");
    setLocation("");
    setCategory(null);
    setSubmitting(false);
    router.push("/(app)/(tabs)/jobs" as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerClassName="p-4 pb-8">
        <Text className="text-xl font-bold text-gray-800 mb-2">Đăng việc mới</Text>
        <Text className="text-gray-500 mb-5">Điền thông tin công việc bạn cần hỗ trợ</Text>

        <Text className="text-sm font-semibold text-gray-700 mb-1">Danh mục *</Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {CATEGORIES.map(cat => {
            const meta = CATEGORY_META[cat.id];
            const active = category === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setCategory(cat.id)}
                className={`rounded-full px-4 py-2 ${active ? "bg-green-600" : "bg-white border border-gray-300"}`}
              >
                <Text className={`text-sm ${active ? "text-white" : "text-gray-700"}`}>
                  {meta?.label ?? cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text className="text-sm font-semibold text-gray-700 mb-1">Tiêu đề *</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="VD: Khơi thông bồn rửa bát"
          className="bg-white border border-gray-300 rounded-xl px-4 py-3 mb-4 text-gray-800"
        />

        <Text className="text-sm font-semibold text-gray-700 mb-1">Mô tả *</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Mô tả chi tiết công việc..."
          multiline
          numberOfLines={4}
          className="bg-white border border-gray-300 rounded-xl px-4 py-3 mb-4 text-gray-800"
          style={{ minHeight: 100 }}
        />

        <Text className="text-sm font-semibold text-gray-700 mb-1">Ngân sách *</Text>
        <TextInput
          value={budget}
          onChangeText={t => setBudget(t.replace(/[^0-9]/g, ""))}
          placeholder="150000"
          keyboardType="numeric"
          className="bg-white border border-gray-300 rounded-xl px-4 py-3 mb-2 text-gray-800"
        />
        {budget ? (
          <Text className="text-green-600 text-sm mb-4">Ngân sách: {formatVnd(parseInt(budget || "0", 10))}</Text>
        ) : null}

        <Text className="text-sm font-semibold text-gray-700 mb-1">Địa điểm *</Text>
        <TextInput
          value={location}
          onChangeText={setLocation}
          placeholder="VD: 120 Nguyễn Huệ, Quận 1"
          className="bg-white border border-gray-300 rounded-xl px-4 py-3 mb-6 text-gray-800"
        />

        <Button
          title={submitting ? "Đang đăng..." : "Đăng việc"}
          loading={submitting}
          onPress={handleSubmit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
