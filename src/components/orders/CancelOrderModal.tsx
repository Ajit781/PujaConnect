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

const BRAND_TEXT = '#291811';
const BRAND_MUTED = '#6B5E59';

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
              placeholderTextColor="#9CA3AF"
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
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '90%',
    overflow: 'hidden',
  },
  headerBox: {
    backgroundColor: '#FEF2F2',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#FEE2E2',
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
    backgroundColor: '#FECACA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: { fontSize: 20, color: '#DC2626' },
  modalTitleLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#DC2626',
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    fontSize: 14,
    color: BRAND_TEXT,
    backgroundColor: '#F9FAFB',
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },

  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  goBackBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  goBackBtnText: { fontSize: 14, fontWeight: 'bold', color: BRAND_TEXT },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F87171',
    alignItems: 'center',
  },
  confirmCancelBtnText: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  disabledOpac: { opacity: 0.5 },
});
