import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useGetPujaPolicyDetailsQuery, useCancelPujaMutation } from '../../store/api/pujaApi';
import { useAlert } from '../../context/AlertContext';
import { Colors } from '../../constants/Colors';

interface Props {
  visible: boolean;
  itemTitle: string;
  orderId: string | number;
  bookingId: string | number;
  packageId: string | number;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CancelPolicyModal({
  visible,
  itemTitle,
  orderId,
  bookingId,
  packageId,
  onClose,
  onSuccess,
}: Props) {
  const user = useSelector((state: RootState) => state.auth.user);
  const { showAlert } = useAlert();
  
  const [cancelPujaApi, { isLoading: isCancelling }] = useCancelPujaMutation();
  
  const { data, isLoading: isPoliciesLoading } = useGetPujaPolicyDetailsQuery(
    { 
      orderId, 
      bookingId, 
      packageId, 
      loginUserId: user?.user_id || 0 
    },
    { skip: !visible }
  );

  const policies = data?.policies || [];
  const globalRefundAmt = data?.actual_refund_amount || '0';

  const [isConsentChecked, setIsConsentChecked] = useState(false);
  const [reason, setReason] = useState('');

  const handleConfirmCancel = async () => {
    try {
      const payload = {
        order_id: Number(orderId) || 0,
        package_id: Number(packageId) || 0,
        booking_id: Number(bookingId) || 0,
        reason: reason,
        ctzn_id: user?.user_id || 0,
      };

      console.log('--- CANCEL PAYLOAD ---', JSON.stringify(payload, null, 2));

      const res = await cancelPujaApi(payload).unwrap();
      
      if (res && (res.status === 0 || res.status === '0')) {
        showAlert({
          title: 'Success',
          message: 'Cancelled successfully!',
        });
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setTimeout(() => {
          Alert.alert('Error', res?.message || 'Could not cancel booking');
        }, 500);
      }
    } catch (e: any) {
      setTimeout(() => {
        const errMsg = e?.data?.message || (typeof e?.data === 'string' ? e.data : null) || e?.message || 'Server error occurred';
        Alert.alert('Error', typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg);
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
                <Text style={styles.iconText}>ℹ️</Text>
              </View>
              <View>
                <Text style={styles.modalTitleLabel}>CANCELLATION POLICY</Text>
                <Text style={styles.modalSubRef}>{itemTitle}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✖</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.bodyContent} bounces={false}>
            <Text style={styles.helpText}>
              Please review the cancellation policy before proceeding.
            </Text>

            {isPoliciesLoading ? (
              <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 20 }} />
            ) : policies && policies.length > 0 ? (
              <View style={styles.policyListContainer}>
                {policies.map((p: any, index: number) => {
                  const isActive = p.active_policy === 1 || p.active_policy === true || p.active_policy === '1';
                  const refundAmtStr = p.refund_amount || globalRefundAmt;
                  
                  return (
                    <View key={p.policy_id || index} style={[styles.policyItem, isActive && styles.activePolicyItem]}>
                      <Text style={[styles.policyBullet, isActive && styles.activePolicyText]}>•</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.policyText, isActive && styles.activePolicyText]}>
                          {p.policy_display_text}
                        </Text>
                        {isActive && (
                          <Text style={styles.refundAmtText}>
                            Estimated Refund: ₹{refundAmtStr}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.noPolicyText}>No policies available at this time.</Text>
            )}

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setIsConsentChecked(!isConsentChecked)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, isConsentChecked && styles.checkboxChecked]}>
                {isConsentChecked && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                I accept the cancellation policy and refund terms.
              </Text>
            </TouchableOpacity>

            {isConsentChecked && (
              <View style={styles.reasonContainer}>
                <Text style={styles.reasonLabel}>Please specify the reason (Required):</Text>
                <TextInput
                  style={styles.reasonInput}
                  placeholder="Enter your reason here..."
                  placeholderTextColor={Colors.textMuted}
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                />
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.goBackBtn} onPress={onClose} disabled={isCancelling}>
              <Text style={styles.goBackBtnText}>Keep Booking</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.continueBtn,
                (!isConsentChecked || !reason.trim() || isPoliciesLoading || isCancelling) && styles.disabledContinueBtn,
              ]}
              onPress={handleConfirmCancel}
              disabled={!isConsentChecked || !reason.trim() || isPoliciesLoading || isCancelling}
            >
              {isCancelling ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.continueBtnText}>Confirm Cancel</Text>
              )}
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
    width: '94%',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  headerBox: {
    backgroundColor: '#F3F4F6',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
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
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: { fontSize: 20 },
  modalTitleLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    letterSpacing: 1,
  },
  modalSubRef: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textMain,
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
  closeBtnText: { color: Colors.textMuted, fontSize: 14 },
  bodyScroll: {
    flexShrink: 1,
  },
  bodyContent: {
    padding: 20,
    paddingBottom: 10,
  },
  helpText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 16,
    lineHeight: 20,
  },
  policyListContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  policyItem: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 8,
  },
  activePolicyItem: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderWidth: 1,
  },
  policyBullet: {
    fontSize: 14,
    color: Colors.textMuted,
    marginRight: 8,
    marginTop: 0,
  },
  policyText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
  },
  activePolicyText: {
    color: '#0284C7',
    fontWeight: 'bold',
  },
  refundAmtText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.success || '#059669',
    marginTop: 4,
  },
  noPolicyText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: Colors.disabled,
    borderRadius: 6,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  checkboxChecked: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  checkmark: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 10,
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
  goBackBtnText: { fontSize: 14, fontWeight: 'bold', color: Colors.textMain },
  continueBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.dangerRed,
    alignItems: 'center',
  },
  continueBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.white,
  },
  disabledContinueBtn: {
    backgroundColor: Colors.disabled,
  },
  reasonContainer: {
    marginTop: 10,
    marginBottom: 5,
  },
  reasonLabel: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 8,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
