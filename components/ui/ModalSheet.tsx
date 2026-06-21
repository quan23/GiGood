import { Modal, View, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native'
import { ReactNode } from 'react'

type Props = {
  visible: boolean
  onClose: () => void
  children: ReactNode
}

export function ModalSheet({ visible, onClose, children }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/50 justify-end">
          <TouchableWithoutFeedback onPress={() => {}}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View className="bg-white rounded-t-3xl p-6 space-y-5 max-h-[85%]">
                <View className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />
                {children}
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}
