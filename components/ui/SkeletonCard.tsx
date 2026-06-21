import { useEffect, useRef } from "react";
import { View } from "react-native";
import Animated, {
  withRepeat,
  withTiming,
  useSharedValue,
  useAnimatedStyle,
  Easing,
} from "react-native-reanimated";

export function SkeletonCard() {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const Block = ({ className = "" }: { className?: string }) => (
    <Animated.View
      style={animStyle}
      className={`rounded-lg bg-gray-200 ${className}`}
    />
  );

  return (
    <View className="bg-white rounded-2xl p-4 mx-4 mb-3 shadow-sm border border-gray-100">
      <View className="flex-row items-center justify-between mb-3">
        <Block className="h-5 w-2/3" />
        <Block className="h-6 w-16 rounded-full" />
      </View>
      <Block className="h-3.5 w-1/3 mb-2" />
      <Block className="h-3.5 w-1/2 mb-3" />
      <View className="flex-row items-center justify-between mt-1">
        <Block className="h-6 w-24" />
        <Block className="h-8 w-24 rounded-lg" />
      </View>
    </View>
  );
}
