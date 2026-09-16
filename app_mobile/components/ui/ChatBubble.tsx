import { Text, View } from "react-native";
import { formatChatTime } from "@/lib/features/chat/format";

/** Real `Message` shape (body + ISO createdAt) or a pre-formatted demo bubble. */
export type ChatBubbleMessage = {
  body: string;
  createdAt?: string;
  /** Pre-formatted `HH:mm` label (demo/seed messages). */
  time?: string;
};

interface Props {
  message: ChatBubbleMessage;
  isOwn: boolean;
  /** Accent for own bubbles: orange (seeker) / teal (tasker), matching the demo. */
  accent?: "orange" | "teal";
}

export function ChatBubble({ message, isOwn, accent = "orange" }: Props) {
  const ownBg = accent === "teal" ? "bg-teal-600" : "bg-orange-500";
  const time = message.createdAt ? formatChatTime(message.createdAt) : message.time ?? "";

  return (
    <View className={`mb-3 ${isOwn ? "items-end" : "items-start"}`}>
      <View
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${isOwn ? `${ownBg} rounded-tr-sm` : "bg-gray-100 rounded-tl-sm"}`}
      >
        <Text className={`text-base leading-5 ${isOwn ? "text-white" : "text-gray-900"}`}>{message.body}</Text>
      </View>
      <Text className={`text-xs text-gray-400 mt-1 ${isOwn ? "text-right" : "text-left"}`}>{time}</Text>
    </View>
  );
}
