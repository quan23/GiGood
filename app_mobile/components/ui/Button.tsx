import { TouchableOpacity, Text, View, ActivityIndicator, type TouchableOpacityProps } from "react-native";
import { colors } from "@/constants/theme";

interface Props extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  loading?: boolean;
  icon?: React.ReactNode;
}

const STYLES = {
  primary: "bg-green-600 active:bg-green-700",
  secondary: "bg-gray-100 active:bg-gray-200",
  outline: "border border-green-600 active:bg-green-50",
  ghost: "active:bg-gray-100",
};

const TEXT = {
  primary: "text-white",
  secondary: "text-gray-800",
  outline: "text-green-600",
  ghost: "text-green-600",
};

export function Button({ title, variant = "primary", loading, icon, disabled, className = "", ...props }: Props) {
  return (
    <TouchableOpacity
      disabled={disabled || loading}
      className={`flex-row items-center justify-center rounded-xl py-3.5 px-5 ${STYLES[variant]} ${disabled ? "opacity-50" : ""} ${className}`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? colors.white : "#16a34a"} />
      ) : (
        <>
          {icon && <View className="mr-2">{icon}</View>}
          <Text className={`font-semibold text-base ${TEXT[variant]}`}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
