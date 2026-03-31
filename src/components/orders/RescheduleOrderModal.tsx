import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useReschedulePujaMutation } from '../../store/api/pujaApi';
import { useAlert } from '../../context/AlertContext';
import CustomTimePickerModal from '../common/CustomTimePickerModal';
import { Colors } from '../../constants/Colors';
import { formatTo12Hr, formatTo24Hr } from '../../utils/timeUtils';

const BRAND_TEXT = Colors.textMain;
const SUCCESS_GREEN = '#16A34A';
const SUCCESS_BG = '#F0FDF4';

interface Props {
  visible: boolean;
  orderId: string;
  item: any;
  onClose: () => void;
  onSuccess: (updatedItem: any) => void;
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
  const { showErrorAlert } = useAlert();
  const user = useSelector((state: RootState) => state.auth.user);
  const [reschedulePuja, { isLoading }] = useReschedulePujaMutation();

  // Helper to convert YYYY-MM-DD to DD/MM/YYYY for display
  const toDisplayDate = (ymd: string) => {
    if (!ymd || !ymd.includes('-')) return ymd;
    const [y, m, d] = ymd.split('-');
    return `${d}/${m}/${y}`;
  };

  const [dateStr, setDateStr] = useState(
    toDisplayDate(item.scheduledDate) || '',
  ); // Display format
  const [apiDate, setApiDate] = useState(item.scheduledDate || ''); // YYYY-MM-DD
  const [timeStr, setTimeStr] = useState(item.scheduledTime || '');

  // Picker states from Cart logic
  const [activeDateDropdown, setActiveDateDropdown] = useState<string | null>(
    null,
  );
  const [activeTimeDropdown, setActiveTimeDropdown] = useState<string | null>(
    null,
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const MONTHS_EN = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const MONTHS_BN = [
    'জানুয়ারী',
    'ফেব্রুয়ারি',
    'মার্চ',
    'এপ্রিল',
    'মে',
    'জুন',
    'জুলাই',
    'আগস্ট',
    'সেপ্টেম্বর',
    'অক্টোবর',
    'নভেম্বর',
    'ডিসেম্বর',
  ];
  const DAYS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const getMonthYearText = (d: Date) => {
    const m = isBn ? MONTHS_BN[d.getMonth()] : MONTHS_EN[d.getMonth()];
    return `${m} ${d.getFullYear()}`;
  };

  const handleDateSelect = (d: Date) => {
    const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(d.getDate()).padStart(2, '0')}`;
    const display = `${String(d.getDate()).padStart(2, '0')}/${String(
      d.getMonth() + 1,
    ).padStart(2, '0')}/${d.getFullYear()}`;

    setDateStr(display);
    setApiDate(ymd);
    setActiveDateDropdown(null);
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calDayBox} />);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        '0',
      )}-${String(d.getDate()).padStart(2, '0')}`;

      // Ensure we compare only the YYYY-MM-DD part
      const cleanApiDate = apiDate ? apiDate.split(' ')[0] : '';
      const isSelected = cleanApiDate === dayKey;

      const isPast = d < today;

      days.push(
        <TouchableOpacity
          key={i}
          style={[styles.calDayBox, isSelected && styles.calDayActive]}
          disabled={isPast}
          onPress={() => handleDateSelect(d)}
        >
          <Text
            style={[
              styles.calDayText,
              isSelected && styles.calDayTextActive,
              isPast && styles.calDayPast,
            ]}
          >
            {i}
          </Text>
        </TouchableOpacity>,
      );
    }

    return (
      <View style={styles.dropdownMenu}>
        <View style={styles.calHeader}>
          <TouchableOpacity
            onPress={() => setCurrentMonth(new Date(year, month - 1, 1))}
          >
            <Text style={styles.calArrow}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.calMonthText}>
            {getMonthYearText(currentMonth)}
          </Text>
          <TouchableOpacity
            onPress={() => setCurrentMonth(new Date(year, month + 1, 1))}
          >
            <Text style={styles.calArrow}>{'>'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.calWeekRow}>
          {DAYS_EN.map(w => (
            <Text key={w} style={styles.calWeekText}>
              {w}
            </Text>
          ))}
        </View>
        <View style={styles.calDaysGrid}>{days}</View>
      </View>
    );
  };

  const handleConfirm = async () => {
    try {
      const payload = {
        bookingId: item.bookingId || orderId,
        ctznId: user?.user_id || 0,
        packageId: item.packageId || 0,
        newDate: apiDate,
        newTime: formatTo24Hr(timeStr),
      };

      const result = await reschedulePuja(payload).unwrap();

      if (result && (result.status === 0 || result.status === '0')) {
        onSuccess({
          ...item,
          scheduledDate: apiDate,
          scheduledTime: timeStr,
        });
        onClose();
      } else {
        showErrorAlert(
          result?.message ||
            (isBn
              ? 'পুনর্নির্ধারণ করতে ব্যর্থ হয়েছে'
              : 'Failed to reschedule'),
        );
      }
    } catch (error: any) {
      console.error('Reschedule API error:', error);
      showErrorAlert(
        error?.data?.message ||
          (isBn ? 'সার্ভার ত্রুটি' : 'Server error occurred'),
      );
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
                <Text style={styles.modalTitleLabel}>
                  {isBn ? 'পূজা পুনঃনির্ধারণ' : 'RESCHEDULE PUJA'}
                </Text>
                <Text style={styles.modalSubRef}>
                  {isBn ? item.titleBn : item.titleEn}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✖</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            {/* Current Schedule Box */}
            <View style={styles.currentScheduleBox}>
              <Text style={styles.currentLabel}>
                📍 {isBn ? 'বর্তমান সময়সূচী' : 'Current Schedule'}
              </Text>
              <View style={styles.currentInfo}>
                <Text style={styles.currentText}>📅 {item.scheduledDate}</Text>
                <View style={styles.vDivider} />
                <Text style={styles.currentText}>
                  🕒 {formatTo12Hr(item.scheduledTime)}
                </Text>
              </View>
            </View>

            <View style={styles.scheduleCard}>
              <Text style={styles.inputLabel}>
                📅 {isBn ? 'নতুন তারিখ' : 'New Date'}
              </Text>
              <TouchableOpacity
                style={[
                  styles.inputBox,
                  activeDateDropdown === 'GLOBAL' && styles.inputBoxActive,
                ]}
                onPress={() =>
                  setActiveDateDropdown(
                    activeDateDropdown === 'GLOBAL' ? null : 'GLOBAL',
                  )
                }
              >
                <Text
                  style={[styles.inputText, !dateStr && styles.placeholderText]}
                >
                  {dateStr || 'mm/dd/yyyy'}
                </Text>
                <Text style={styles.dropdownIcon}>🗓️</Text>
              </TouchableOpacity>

              {activeDateDropdown && renderCalendar()}

              <Text style={styles.inputLabel}>
                🕒 {isBn ? 'পছন্দের সময়' : 'Preferred Time'}{' '}
                <Text style={styles.lightLabel}>(select a date first)</Text>
              </Text>
              <TouchableOpacity
                style={[
                  styles.inputBox,
                  activeTimeDropdown === 'GLOBAL' && styles.inputBoxActive,
                  !apiDate && styles.inputBoxDisabled,
                ]}
                disabled={!apiDate}
                onPress={() => setActiveTimeDropdown('GLOBAL')}
              >
                <Text
                  style={[styles.inputText, !timeStr && styles.placeholderText]}
                >
                  {timeStr
                    ? formatTo12Hr(timeStr)
                    : isBn
                    ? 'পছন্দসই সময় নির্বাচন করুন'
                    : 'Select preferred time'}
                </Text>
              </TouchableOpacity>

              <CustomTimePickerModal
                visible={activeTimeDropdown === 'GLOBAL'}
                onClose={() => setActiveTimeDropdown(null)}
                onSelect={t => setTimeStr(t)}
                initialTime={formatTo12Hr(timeStr) || '10:00 AM'}
              />
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                (!hasSelection || isLoading) && styles.confirmBtnDisabled,
              ]}
              disabled={!hasSelection || isLoading}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmBtnText}>
                {isLoading
                  ? isBn
                    ? 'প্রসেসিং...'
                    : 'Rescheduling...'
                  : isBn
                  ? '🔄 পুনঃনির্ধারণ নিশ্চিত করুন'
                  : '🔄 Confirm Reschedule'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
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
    backgroundColor: Colors.primary, // Using primary for consistency
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
  iconText: { fontSize: 20, color: Colors.white },
  modalTitleLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.white,
    letterSpacing: 1,
  },
  modalSubRef: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 2,
  },
  instructionText: {
    fontSize: 12,
    color: Colors.white,
    opacity: 0.9,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: { color: Colors.white, fontSize: 16 },

  body: { padding: 24, gap: 20 },
  inputBoxContainer: { gap: 12 },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND_TEXT,
    marginBottom: 8,
  },
  inputLabelLight: { fontWeight: 'normal', color: Colors.gray },
  inputField: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  inputText: { fontSize: 14, color: BRAND_TEXT },
  placeholderText: { color: Colors.gray },

  footer: { flexDirection: 'row', padding: 20, gap: 12 },
  confirmBtn: {
    flex: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBtnText: { fontSize: 14, fontWeight: 'bold', color: Colors.white },
  cancelBtn: {
    flex: 4,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: 'bold', color: Colors.primary },
  confirmBtnDisabled: { opacity: 0.5 },

  // Current Schedule Box
  currentScheduleBox: {
    backgroundColor: SUCCESS_BG,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    marginBottom: 4,
  },
  currentLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: SUCCESS_GREEN,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  currentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currentText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },
  vDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#A7F3D0',
  },

  // Cart logic styles
  scheduleCard: {
    backgroundColor: Colors.white,
    paddingVertical: 12,
  },
  inputBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: Colors.white,
  },
  inputBoxActive: { borderColor: Colors.primary, borderWidth: 1.5 },
  inputBoxDisabled: { backgroundColor: Colors.ultraLightGray, opacity: 0.7 },
  dropdownIcon: { fontSize: 14 },
  lightLabel: { color: Colors.textMuted, fontWeight: '400', fontSize: 10 },
  dropdownMenu: {
    marginTop: -8,
    marginBottom: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    elevation: 2,
  },
  calHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  calArrow: {
    fontSize: 18,
    color: Colors.textMain,
    padding: 4,
    fontWeight: 'bold',
  },
  calMonthText: { fontSize: 14, fontWeight: '700', color: Colors.textMain },
  calWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calWeekText: {
    width: '14%',
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  calDaysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDayBox: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  calDayActive: { backgroundColor: Colors.primary, borderRadius: 20 },
  calDayText: { fontSize: 13, color: Colors.textMain },
  calDayTextActive: { color: Colors.white, fontWeight: 'bold' },
  calDayPast: { color: Colors.textMuted, opacity: 0.3 },
});
