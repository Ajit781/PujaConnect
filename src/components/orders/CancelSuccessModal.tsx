import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Colors } from '../../constants/Colors';

interface Props {
  visible: boolean;
  itemTitle: string;
  onClose: () => void;
}

export default function CancelSuccessModal({
  visible,
  itemTitle,
  onClose,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.iconContainer}>
            <View style={styles.iconBg}>
              <Text style={styles.iconEmoji}>❌</Text>
            </View>
          </View>

          <Text style={styles.title}>Cancelled</Text>
          <Text style={styles.subtitle}>
            Your booking for {itemTitle} has been successfully cancelled.
          </Text>

          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: { marginBottom: 16 },
  iconBg: {
    width: 64,
    height: 64,
    backgroundColor: Colors.tagRed,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: { fontSize: 32 },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dangerRed,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  doneBtn: {
    backgroundColor: Colors.dangerRed,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneBtnText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },
});
