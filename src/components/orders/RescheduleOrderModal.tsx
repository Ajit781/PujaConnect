import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { rescheduleOrderItem, OrderItem } from '../../store/slices/orderSlice';
import CustomDatePickerModal from '../common/CustomDatePickerModal';

const BRAND_TEXT = '#291811';

interface Props {
  visible: boolean;
  orderId: string;
  item: OrderItem;
  onClose: () => void;
  onSuccess: (updatedItem: OrderItem) => void;
}

export default function RescheduleOrderModal({
  visible,
  orderId,
  item,
  onClose,
  onSuccess,
}: Props) {
  const { i18n } = useTranslation();
  const isBn = i18n.language === 'bn';
  const dispatch = useDispatch();

  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [showPickerMode, setShowPickerMode] = useState<
    'date' | 'datetime' | 'time' | null
  >(null);

  const handlePickerSelect = (d: Date, t?: string) => {
    const fd = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(
      d.getDate(),
    ).padStart(2, '0')}/${d.getFullYear()}`;
    setDateStr(fd);
    if (t) setTimeStr(t);
  };

  const handleConfirm = () => {
    const updatedItem = {
      ...item,
      scheduledDate: dateStr, // Typically ISO string, but formatting works for UI demo
      scheduledTime: timeStr,
    };
    dispatch(
      rescheduleOrderItem({
        orderId,
        itemId: item.id,
        newDate: newDateIsoFromStr(dateStr),
        newTime: timeStr,
      }),
    );

    // Pass back the predicted item for the success modal
    onSuccess({ ...updatedItem, scheduledDate: newDateIsoFromStr(dateStr) });
    onClose();
  };

  const newDateIsoFromStr = (dStr: string) => {
    try {
      const [m, d, y] = dStr.split('/');
      return new Date(parseInt(y), parseInt(m) - 1, parseInt(d)).toISOString();
    } catch {
      return new Date().toISOString();
    }
  };

  const hasSelection = dateStr && timeStr;

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
                <Text style={styles.iconText}>🔄</Text>
              </View>
              <View>
                <Text style={styles.modalTitleLabel}>RESCHEDULE PUJA</Text>
                <Text style={styles.modalSubRef}>
                  {isBn ? item.titleBn : item.titleEn}
                </Text>
                <Text style={styles.instructionText}>
                  Pick a new date and time for your puja
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✖</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <View style={styles.inputBoxContainer}>
              <Text style={styles.inputLabel}>📅 New Date</Text>
              <TouchableOpacity
                style={styles.inputField}
                onPress={() => setShowPickerMode('date')}
              >
                <Text
                  style={[styles.inputText, !dateStr && styles.placeholderText]}
                >
                  {dateStr || 'Select a new date'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputBoxContainer}>
              <Text style={styles.inputLabel}>
                🕒 New Preferred Time{' '}
                <Text style={styles.inputLabelLight}>
                  (select a date first)
                </Text>
              </Text>
              <TouchableOpacity
                style={[
                  styles.inputField,
                  !dateStr && { backgroundColor: '#F9FAFB' },
                ]}
                disabled={!dateStr}
                onPress={() => setShowPickerMode('time')}
              >
                <Text
                  style={[styles.inputText, !timeStr && styles.placeholderText]}
                >
                  {timeStr || 'Select preferred time'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.confirmBtn, !hasSelection && { opacity: 0.5 }]}
              disabled={!hasSelection}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmBtnText}>🔄 Confirm Reschedule</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {showPickerMode && (
        <CustomDatePickerModal
          visible={!!showPickerMode}
          mode={showPickerMode}
          onSelect={handlePickerSelect}
          onClose={() => setShowPickerMode(null)}
        />
      )}
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
    backgroundColor: '#ffb703', // yellow-orange theme from screenshot
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconCircle: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: { fontSize: 20, color: '#fff' },
  modalTitleLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  modalSubRef: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 2,
  },
  instructionText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 16 },

  body: { padding: 24, gap: 20 },
  inputBoxContainer: { gap: 8 },
  inputLabel: { fontSize: 12, fontWeight: 'bold', color: BRAND_TEXT },
  inputLabelLight: { fontWeight: 'normal', color: '#9CA3AF' },
  inputField: {
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputText: { fontSize: 14, color: BRAND_TEXT },
  placeholderText: { color: '#9CA3AF' },

  footer: { flexDirection: 'row', padding: 20, gap: 12 },
  confirmBtn: {
    flex: 6,
    backgroundColor: '#fda470',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBtnText: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  cancelBtn: {
    flex: 4,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fda470',
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: 'bold', color: '#E65100' },
});
