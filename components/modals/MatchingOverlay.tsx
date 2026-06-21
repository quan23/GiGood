import { useEffect, useRef } from "react";
import { Modal, View, Text, Animated } from "react-native";

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export function MatchingOverlay({ visible, onDismiss }: Props) {
  const dotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    );
    anim.start();
    const timer = setTimeout(onDismiss, 2500);
    return () => {
      anim.stop();
      clearTimeout(timer);
    };
  }, [visible]);

  const dotsOpacity = dotAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/60 justify-center items-center">
        <Animated.Text className="text-white text-5xl mb-4" style={{ opacity: dotsOpacity }}>
          🔍
        </Animated.Text>
        <Text className="text-white text-xl font-bold">Đang tìm người làm</Text>
        <Animated.Text className="text-white/70 text-base mt-1" style={{ opacity: dotsOpacity }}>
          Vui lòng chờ giây lát...
        </Animated.Text>
      </View>
    </Modal>
  );
}
