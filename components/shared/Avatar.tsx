import { View, Text, Image } from "react-native";

interface Props {
  uri?: string;
  name: string;
  size?: "sm" | "md" | "lg";
  online?: boolean;
}

const SIZES = { sm: 32, md: 44, lg: 64 };
const TEXTS = { sm: "text-sm", md: "text-lg", lg: "text-2xl" };
const DOTS = { sm: 2.5, md: 3, lg: 4 };

export function Avatar({ uri, name, size = "md", online }: Props) {
  const px = SIZES[size];
  const initials = name
    .split(" ")
    .map(w => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View className="relative">
      {uri ? (
        <Image source={{ uri }} style={{ width: px, height: px }} className="rounded-full" />
      ) : (
        <View
          style={{ width: px, height: px }}
          className="rounded-full bg-green-100 items-center justify-center"
        >
          <Text className={`font-bold text-green-700 ${TEXTS[size]}`}>{initials}</Text>
        </View>
      )}
      {online && (
        <View
          style={{ width: DOTS[size], height: DOTS[size], right: 0, top: 0 }}
          className="absolute bg-green-500 rounded-full border-2 border-white"
        />
      )}
    </View>
  );
}
