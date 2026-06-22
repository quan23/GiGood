import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "../../components/shared/EmptyState";
import { useGiGood } from "../../lib/GiGoodContext";

export default function NotificationsScreen() {
  const { state, dispatch } = useGiGood();
  const notifs = state.data.notifications;

  const markAllRead = () => {
    dispatch({ type: "SET_NOTIF_BADGE", payload: false });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row justify-between items-center px-4 pt-4 pb-2">
        <Text className="text-xl font-bold text-gray-800">Thông báo</Text>
        {notifs.length > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text className="text-green-600 text-sm font-semibold">Đã đọc tất cả</Text>
          </TouchableOpacity>
        )}
      </View>
      {notifs.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="Không có thông báo"
          subtitle="Bạn sẽ nhận thông báo khi có việc mới"
        />
      ) : (
        <FlatList
          data={notifs}
          keyExtractor={item => item.id.toString()}
          contentContainerClassName="p-4 pt-0"
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => dispatch({ type: 'MARK_NOTIF_READ', payload: item.id })}
              className={`rounded-xl p-4 mb-2 ${item.read ? "bg-white" : "bg-green-50 border border-green-200"}`}>
              <View className="flex-row justify-between">
                <Text className={`flex-1 ${item.read ? "text-gray-600" : "text-gray-800 font-medium"}`}>
                  {item.text}
                </Text>
                {!item.read && <View className="w-2 h-2 rounded-full bg-green-600 mt-2" />}
              </View>
              <Text className="text-xs text-gray-400 mt-1">{item.time}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
