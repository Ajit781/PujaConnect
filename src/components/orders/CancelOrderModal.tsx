import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { cancelOrder, cancelOrderItem } from '../../store/slices/orderSlice';
import { Colors } from '../../constants/Colors';

const BRAND_TEXT = Colors.textMain;
const BRAND_MUTED = Colors.textMuted;

interface Props {
  visible: boolean;
  orderId: string;
  itemTitle: string;
  itemId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CancelOrderModal({
  visible,
  orderId,
  itemTitle,
  itemId,
  onClose,
  onSuccess,
}: Props) {
  const dispatch = useDispatch();

  const [reason, setReason] = useState('');

  const handleConfirmCancel = () => {
    if (itemId) {
      dispatch(cancelOrderItem({ orderId, itemId, reason }));
    } else {
      dispatch(cancelOrder({ orderId, reason }));
    }
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.headerBox}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>✖</Text>
              </View>
              <View>
                <Text style={styles.modalTitleLabel}>CANCEL PUJA</Text>
                <Text style={styles.modalSubRef}>{itemTitle}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✖</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <Text style={styles.helpText}>
              Help us understand why you're cancelling. Your feedback matters to
              us.
            </Text>

            <TextInput
              style={styles.reasonInput}
              placeholder="Describe your reason for cancellation..."
              placeholderTextColor={Colors.placeholder}
              multiline
              numberOfLines={4}
              value={reason}
              onChangeText={setReason}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{reason.length} characters</Text>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.goBackBtn} onPress={onClose}>
              <Text style={styles.goBackBtnText}>Go Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmCancelBtn,
                !reason.trim() && styles.disabledOpac,
              ]}
              disabled={!reason.trim()}
              onPress={handleConfirmCancel}
            >
              <Text style={styles.confirmCancelBtnText}>Confirm Cancel</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: Colors.white,
    borderRadius: 24,
    width: '90%',
    overflow: 'hidden',
  },
  headerBox: {
    backgroundColor: Colors.redToastBg,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.redLight,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.tagRed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: { fontSize: 20, color: Colors.dangerRed },
  modalTitleLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.dangerRed,
    letterSpacing: 1,
  },
  modalSubRef: {
    fontSize: 16,
    fontWeight: 'bold',
    color: BRAND_TEXT,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.disabled,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: { color: BRAND_MUTED, fontSize: 14 },

  body: {
    padding: 20,
  },
  helpText: {
    fontSize: 14,
    color: BRAND_MUTED,
    marginBottom: 16,
    lineHeight: 20,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: Colors.disabled,
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    fontSize: 14,
    color: BRAND_TEXT,
    backgroundColor: Colors.inputBg,
  },
  charCount: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 8,
  },

  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  goBackBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.disabled,
    alignItems: 'center',
  },
  goBackBtnText: { fontSize: 14, fontWeight: 'bold', color: BRAND_TEXT },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.dangerRed,
    alignItems: 'center',
  },
  confirmCancelBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.white,
  },
  disabledOpac: { opacity: 0.5 },
});
