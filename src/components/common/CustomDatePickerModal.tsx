import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';

interface Props {
  visible: boolean;
  mode: 'date' | 'datetime' | 'time';
  initialDate?: Date;
  onSelect: (date: Date, time?: string) => void;
  onClose: () => void;
}

const BRAND_PRIMARY = '#F97316';
const BRAND_TEXT = '#291811';
const BRAND_MUTED = '#6B5E59';

const TIME_SLOTS = [
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
  '07:00 PM',
];

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function CustomDatePickerModal({
  visible,
  mode,
  initialDate,
  onSelect,
  onClose,
}: Props) {
  const { i18n } = useTranslation();
  const isBn = i18n.language === 'bn';

  const [currentMonth, setCurrentMonth] = useState(
    initialDate ? new Date(initialDate) : new Date(),
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    initialDate || new Date(),
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(
    mode === 'datetime' || mode === 'time' ? TIME_SLOTS[0] : null,
  );
  const [showTimePicker, setShowTimePicker] = useState(mode === 'time');

  useEffect(() => {
    if (visible && initialDate) {
      setCurrentMonth(new Date(initialDate));
      setSelectedDate(initialDate);
    }
  }, [visible, initialDate]);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const currentYear = currentMonth.getFullYear();
  const currentMonthIdx = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(currentYear, currentMonthIdx);
  const firstDayOfMonth = new Date(currentYear, currentMonthIdx, 1).getDay();

  const handlePrevMonth = () =>
    setCurrentMonth(new Date(currentYear, currentMonthIdx - 1, 1));
  const handleNextMonth = () =>
    setCurrentMonth(new Date(currentYear, currentMonthIdx + 1, 1));

  const handleDaySelect = (day: number) => {
    const d = new Date(currentYear, currentMonthIdx, day);
    setSelectedDate(d);

    if (mode === 'date') {
      onSelect(d);
      onClose();
    } else {
      setShowTimePicker(true);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleConfirmDateTime = () => {
    if (selectedDate && selectedTime) {
      onSelect(selectedDate, selectedTime);
      onClose();
    }
  };

  const renderCalendar = () => {
    const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <View>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
            <Text style={styles.navText}>&lt;</Text>
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {MONTHS[currentMonthIdx]} {currentYear}
          </Text>
          <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
            <Text style={styles.navText}>&gt;</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.daysHeader}>
          {DAYS.map((d, i) => (
            <Text key={i} style={styles.dayHeadText}>
              {d}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {blanks.map(i => (
            <View key={`blank-${i}`} style={styles.cell} />
          ))}
          {days.map(d => {
            const isSelected =
              selectedDate &&
              selectedDate.getDate() === d &&
              selectedDate.getMonth() === currentMonthIdx &&
              selectedDate.getFullYear() === currentYear;

            return (
              <TouchableOpacity
                key={d}
                style={[styles.cell, isSelected && styles.cellSelected]}
                onPress={() => handleDaySelect(d)}
              >
                <Text
                  style={[
                    styles.cellText,
                    isSelected && styles.cellTextSelected,
                  ]}
                >
                  {d}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderTimePicker = () => {
    return (
      <View>
        <View style={styles.titleRow}>
          {mode !== 'time' && (
            <TouchableOpacity
              onPress={() => setShowTimePicker(false)}
              style={styles.backBtn}
            >
              <Text style={styles.backBtnText}>
                ← {isBn ? 'তারিখ' : 'Date'}
              </Text>
            </TouchableOpacity>
          )}
          <Text
            style={[styles.monthText, mode === 'time' && { marginLeft: 16 }]}
          >
            {isBn ? 'সময়' : 'Time'}
          </Text>
          <View style={{ width: mode === 'time' ? 0 : 60 }} />
        </View>

        <ScrollView style={styles.timeScroll} nestedScrollEnabled>
          <View style={styles.timeGrid}>
            {TIME_SLOTS.map(t => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.timeBox,
                  selectedTime === t && styles.timeBoxSelected,
                ]}
                onPress={() => handleTimeSelect(t)}
              >
                <Text
                  style={[
                    styles.timeText,
                    selectedTime === t && styles.timeTextSelected,
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[styles.confirmBtn, !selectedTime && styles.btnDisabled]}
          disabled={!selectedTime}
          onPress={handleConfirmDateTime}
        >
          <Text style={styles.confirmBtnText}>
            {isBn ? 'নিশ্চিত করুন' : 'Confirm'}
          </Text>
        </TouchableOpacity>
      </View>
    );
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
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {(mode === 'datetime' && showTimePicker) || mode === 'time'
                ? isBn
                  ? 'একটি সময় চয়ন করুন'
                  : 'Choose a Time'
                : isBn
                ? 'একটি তারিখ নির্বাচন করুন'
                : 'Select a Date'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            {mode === 'date'
              ? renderCalendar()
              : mode === 'time' || showTimePicker
              ? renderTimePicker()
              : renderCalendar()}
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
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFF7ED',
  },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: BRAND_TEXT },
  closeBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: { fontSize: 18, color: BRAND_MUTED },
  body: { padding: 16 },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navBtn: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 8 },
  navText: { fontSize: 16, fontWeight: 'bold', color: BRAND_TEXT },
  monthText: { fontSize: 16, fontWeight: 'bold', color: BRAND_TEXT },

  daysHeader: { flexDirection: 'row', marginBottom: 8 },
  dayHeadText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: BRAND_MUTED,
    fontWeight: 'bold',
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  cellText: { fontSize: 14, color: BRAND_TEXT },
  cellSelected: { backgroundColor: BRAND_PRIMARY, borderRadius: 20 },
  cellTextSelected: { color: '#fff', fontWeight: 'bold' },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  backBtnText: { color: BRAND_PRIMARY, fontWeight: 'bold' },

  timeScroll: { maxHeight: 200, marginBottom: 16 },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeBox: {
    width: '31%',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    alignItems: 'center',
  },
  timeBoxSelected: {
    backgroundColor: BRAND_PRIMARY,
    borderColor: BRAND_PRIMARY,
  },
  timeText: { fontSize: 13, color: BRAND_TEXT },
  timeTextSelected: { color: '#fff', fontWeight: 'bold' },

  confirmBtn: {
    backgroundColor: BRAND_PRIMARY,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  btnDisabled: { opacity: 0.5 },
});
