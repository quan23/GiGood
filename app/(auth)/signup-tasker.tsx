import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useGiGood } from "@/lib/GiGoodContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CategoryGrid } from "@/components/ui/CategoryGrid";
import { AVAILABILITY_LABEL, VEHICLE_LABEL } from "@/lib/categories";
import type { Category, Availability, Vehicle } from "@/types";

const AVAILABILITIES = Object.keys(AVAILABILITY_LABEL) as Availability[];
const VEHICLES = Object.keys(VEHICLE_LABEL) as Vehicle[];

interface SelectProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  selected: T | null;
  onSelect: (v: T) => void;
}

function Select<T extends string>({ label, options, selected, onSelect }: SelectProps<T>) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-gray-700 mb-2">{label}</Text>
      <View className="flex-row flex-wrap">
        {options.map(opt => {
          const isActive = selected === opt.value;
          return (
            <View key={opt.value} className="mr-2 mb-2">
              <Button
                title={opt.label}
                variant={isActive ? "primary" : "outline"}
                className="py-2 px-3"
                onPress={() => onSelect(opt.value)}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function SignupTaskerScreen() {
  const { dispatch } = useGiGood();
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState<Category[]>([]);
  const [bio, setBio] = useState("");
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  function toggleSkill(cat: Category) {
    setSkills(prev => (prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]));
  }

  function handleSubmit() {
    if (!name.trim() || !phone.trim() || !location.trim() || skills.length === 0 || !availability || !vehicle) return;
    dispatch({
      type: "FINISH_SIGNUP_TASKER",
      payload: { name: name.trim(), phone: phone.trim(), location: location.trim(), skills, bio: bio.trim(), availability, vehicle },
    });
    router.replace("/(app)" as any);
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView contentContainerClassName="px-6 py-6">
          <Text className="text-2xl font-bold text-gray-900 text-center">Đăng ký tài khoản</Text>
          <Text className="text-sm text-gray-500 text-center mb-6">Bạn muốn nhận việc và kiếm thêm thu nhập</Text>

          <Input label="Họ và tên" placeholder="Nhập họ và tên" value={name} onChangeText={setName} autoCapitalize="words" />
          <Input label="Số điện thoại" placeholder="Nhập số điện thoại" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Input label="Địa chỉ" placeholder="Nhập địa chỉ của bạn" value={location} onChangeText={setLocation} />

          <Text className="text-sm font-semibold text-gray-700 mb-2 mt-2">Kỹ năng của bạn</Text>
          <CategoryGrid selected={skills} onSelect={toggleSkill} multiple />

          <Input label="Giới thiệu bản thân" placeholder="Ví dụ: tôi có 3 năm kinh nghiệm..." value={bio} onChangeText={setBio} multiline />

          <Select<Availability>
            label="Thời gian rảnh"
            options={AVAILABILITIES.map(v => ({ value: v, label: AVAILABILITY_LABEL[v] }))}
            selected={availability}
            onSelect={setAvailability}
          />

          <Select<Vehicle>
            label="Phương tiện"
            options={VEHICLES.map(v => ({ value: v, label: VEHICLE_LABEL[v] }))}
            selected={vehicle}
            onSelect={setVehicle}
          />

          <View className="mt-4 mb-8">
            <Button title="Hoàn tất" onPress={handleSubmit} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
