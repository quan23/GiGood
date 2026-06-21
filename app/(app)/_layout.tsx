import { useCallback, useRef } from "react";
import { Stack } from "expo-router";
import { router } from "expo-router";
import { useGiGood } from "@/lib/GiGoodContext";
import { MatchingOverlay } from "@/components/modals/MatchingOverlay";

export default function AppLayout() {
  const { state, dispatch } = useGiGood();
  const role = state.auth.currentRole;
  const navRef = useRef(false);

  const handleMatchingDismiss = useCallback(() => {
    dispatch({ type: "SET_MATCHING_JOB_ID", payload: null });
    if (!navRef.current) {
      navRef.current = true;
      router.push("/(app)/(tabs)" as any);
    }
  }, [dispatch]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="chat/[id]"
          options={{
            headerShown: true,
            headerTitle: "Tin nhắn",
            headerTintColor: "#16a34a",
          }}
        />
        <Stack.Screen
          name="notifications"
          options={{
            presentation: "modal",
            headerShown: true,
            headerTitle: "Thông báo",
            headerTintColor: "#16a34a",
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            headerShown: true,
            headerTitle: role === "seeker" ? "Hồ sơ của tôi" : "Hồ sơ tasker",
            headerTintColor: "#16a34a",
          }}
        />
      </Stack>
      <MatchingOverlay
        visible={state.ui.matchingJobIdRef !== null}
        onDismiss={handleMatchingDismiss}
      />
    </>
  );
}
