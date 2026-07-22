import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useCancelPujaMutation } from '../../store/api/pujaApi';
import { useAlert } from '../../context/AlertContext';
import { Colors } from '../../constants/Colors';

const BRAND_TEXT = Colors.textMain;
const BRAND_MUTED = Colors.textMuted;

interface Props {
  visible: boolean;
  orderId: string;
  bookingId: string;
  packageId: string;
  itemTitle: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CancelOrderModal({
  visible,
  orderId,
  bookingId,
  packageId,
  itemTitle,
  onClose,
  onSuccess,
}: Props) {
  const user = useSelector((state: RootState) => state.auth.user);
  const { showAlert, showErrorAlert } = useAlert();
  const [cancelPujaApi, { isLoading }] = useCancelPujaMutation();

  const [reason, setReason] = useState('');

  const handleConfirmCancel = async () => {
    try {
      const payload = {
        order_id: parseInt(orderId, 10) || 0,
        package_id: parseInt(packageId, 10) || 0,
        booking_id: parseInt(bookingId, 10) || 0,
        reason: reason,
        ctzn_id: user?.user_id || 0,
      };

      console.log('Cancel Payload Details:', JSON.stringify(payload, null, 2));

      const res = await cancelPujaApi(payload).unwrap();
      console.log('Cancel Puja Response: ', res);

      if (res && (res.status === 0 || res.status === '0')) {
        showAlert({
          title: 'Success',
          message: 'Cancelled successfully!',
        });
        if (onSuccess) onSuccess();
        onClose();
      } else {
        onClose();
        setTimeout(() => {
          Alert.alert('Error', res?.message || 'Could not cancel booking');
        }, 500);
      }
    } catch (e: any) {
      console.log('Cancel Booking Error: ', e);
      onClose();
      setTimeout(() => {
        Alert.alert('Error', e?.data?.message || 'Server error occurred');
      }, 500);
    }
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
                (!reason.trim() || isLoading) && styles.disabledOpac,
              ]}
              disabled={!reason.trim() || isLoading}
              onPress={handleConfirmCancel}
            >
              <Text style={styles.confirmCancelBtnText}>
                {isLoading ? 'Cancelling...' : 'Confirm Cancel'}
              </Text>
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
