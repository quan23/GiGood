import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useGiGood } from "@/lib/GiGoodContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function SignupSeekerScreen() {
  const { dispatch } = useGiGood();
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");

  function handleSubmit() {
    if (!name.trim() || !phone.trim() || !location.trim()) return;
    dispatch({ type: "FINISH_SIGNUP_SEEKER", payload: { name: name.trim(), phone: phone.trim(), location: location.trim() } });
    router.replace("/(app)" as any);
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView contentContainerClassName="flex-1 px-6 justify-center">
          <Text className="text-2xl font-bold text-gray-900 text-center">Đăng ký tài khoản</Text>
          <Text className="text-sm text-gray-500 text-center mb-8">Bạn đang cần thuê người giúp việc</Text>

          <Input label="Họ và tên" placeholder="Nhập họ và tên" value={name} onChangeText={setName} autoCapitalize="words" />
          <Input label="Số điện thoại" placeholder="Nhập số điện thoại" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Input label="Địa chỉ" placeholder="Nhập địa chỉ của bạn" value={location} onChangeText={setLocation} />

          <View className="mt-6">
            <Button title="Bắt đầu" onPress={handleSubmit} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
