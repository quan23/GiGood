import { useEffect } from "react";
import { View, Text, Animated } from "react-native";
import { useUi } from "@/hooks/useUi";

const VARIANTS = {
  info: "bg-blue-500",
  success: "bg-green-500",
  error: "bg-red-500",
};

export function Toast() {
  const { toast, hideToast } = useUi();

  useEffect(() => {
    if (toast?.visible) {
      const t = setTimeout(hideToast, 2500);
      return () => clearTimeout(t);
    }
  }, [toast, hideToast]);

  if (!toast?.visible) return null;

  return (
    <View className={`absolute bottom-24 left-4 right-4 z-50 rounded-xl px-5 py-3.5 ${VARIANTS[toast.variant]}`}>
      <Text className="text-white text-base font-semibold text-center">{toast.message}</Text>
    </View>
  );
}
