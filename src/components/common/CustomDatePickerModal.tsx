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

import { Colors } from '../../constants/Colors';

interface Props {
  visible: boolean;
  mode: 'date' | 'datetime' | 'time';
  initialDate?: Date;
  minimumDate?: Date;
  maximumDate?: Date;
  onSelect: (date: Date, time?: string) => void;
  onClose: () => void;
}

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
const MONTHS_BN = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বের',
  'ডিসেম্বর',
];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const YEARS = Array.from(
  { length: 131 },
  (_, i) => new Date().getFullYear() + 10 - i,
);

export default function CustomDatePickerModal({
  visible,
  mode,
  initialDate,
  minimumDate,
  maximumDate,
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
  const [viewMode, setViewMode] = useState<'calendar' | 'month' | 'year'>(
    'calendar',
  );

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

  const currentMonthName = isBn
    ? MONTHS_BN[currentMonthIdx]
    : MONTHS[currentMonthIdx];

  const handleYearSelect = (year: number) => {
    setCurrentMonth(new Date(year, currentMonthIdx, 1));
    setViewMode('calendar');
  };

  const handleMonthSelect = (idx: number) => {
    setCurrentMonth(new Date(currentYear, idx, 1));
    setViewMode('calendar');
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
          <View style={styles.monthSelectorRow}>
            <TouchableOpacity onPress={() => setViewMode('month')}>
              <Text style={styles.monthText}>{currentMonthName}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setViewMode('year')}>
              <Text style={styles.monthText}> {currentYear}</Text>
            </TouchableOpacity>
          </View>
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
            const currentCellDate = new Date(currentYear, currentMonthIdx, d);
            let isDisabled = false;

            if (minimumDate) {
              const minObj = new Date(minimumDate);
              minObj.setHours(0, 0, 0, 0);
              if (currentCellDate < minObj) isDisabled = true;
            }
            if (maximumDate) {
              const maxObj = new Date(maximumDate);
              maxObj.setHours(23, 59, 59, 999);
              if (currentCellDate > maxObj) isDisabled = true;
            }

            const isSelected =
              selectedDate &&
              selectedDate.getDate() === d &&
              selectedDate.getMonth() === currentMonthIdx &&
              selectedDate.getFullYear() === currentYear;

            return (
              <TouchableOpacity
                key={d}
                disabled={isDisabled}
                style={[
                  styles.cell,
                  isSelected && styles.cellSelected,
                  isDisabled && styles.cellDisabled,
                ]}
                onPress={() => handleDaySelect(d)}
              >
                <Text
                  style={[
                    styles.cellText,
                    isSelected && styles.cellTextSelected,
                    isDisabled && styles.cellTextDisabled,
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

  const renderMonthPicker = () => {
    const list = isBn ? MONTHS_BN : MONTHS;
    return (
      <View style={styles.pickerGrid}>
        {list.map((m, i) => (
          <TouchableOpacity
            key={m}
            style={[
              styles.pickerCell,
              i === currentMonthIdx && styles.pickerCellActive,
            ]}
            onPress={() => handleMonthSelect(i)}
          >
            <Text
              style={[
                styles.pickerCellText,
                i === currentMonthIdx && styles.pickerCellTextActive,
              ]}
            >
              {m}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderYearPicker = () => {
    return (
      <ScrollView
        style={styles.yearScroll}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        <View style={styles.pickerGrid}>
          {YEARS.map(y => (
            <TouchableOpacity
              key={y}
              style={[
                styles.pickerCell,
                y === currentYear && styles.pickerCellActive,
              ]}
              onPress={() => handleYearSelect(y)}
            >
              <Text
                style={[
                  styles.pickerCellText,
                  y === currentYear && styles.pickerCellTextActive,
                ]}
              >
                {y}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
            style={[styles.monthText, mode === 'time' && styles.monthTextTime]}
          >
            {isBn ? 'সময়' : 'Time'}
          </Text>
          <View
            style={
              mode === 'time' ? styles.timeSpacerHidden : styles.timeSpacer
            }
          />
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
            {viewMode === 'month'
              ? renderMonthPicker()
              : viewMode === 'year'
              ? renderYearPicker()
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
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    backgroundColor: Colors.lightOrange,
  },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.textMain },
  closeBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: { fontSize: 18, color: Colors.textMuted },
  body: { padding: 16 },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navBtn: {
    padding: 8,
    backgroundColor: Colors.ultraLightGray,
    borderRadius: 8,
  },
  navText: { fontSize: 16, fontWeight: 'bold', color: Colors.textMain },
  monthSelectorRow: { flexDirection: 'row', alignItems: 'center' },
  monthText: { fontSize: 16, fontWeight: 'bold', color: Colors.textMain },

  daysHeader: { flexDirection: 'row', marginBottom: 8 },
  dayHeadText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textMuted,
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
  cellText: { fontSize: 14, color: Colors.textMain },
  cellSelected: { backgroundColor: Colors.primary, borderRadius: 20 },
  cellTextSelected: { color: '#fff', fontWeight: 'bold' },
  cellDisabled: { opacity: 0.6 },
  calDayPast: { color: Colors.textMuted, opacity: 0.6 },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  backBtnText: { color: Colors.primary, fontWeight: 'bold' },

  timeScroll: { maxHeight: 200, marginBottom: 16 },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeBox: {
    width: '31%',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.disabled,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeBoxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeText: { fontSize: 13, color: Colors.textMain },
  timeTextSelected: { color: Colors.white, fontWeight: 'bold' },

  confirmBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmBtnText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },
  btnDisabled: { opacity: 0.5 },

  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 10,
  },
  pickerCell: {
    width: '31%',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: Colors.ultraLightGray || '#F5F5F5',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickerCellActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pickerCellText: { fontSize: 13, color: Colors.textMain, fontWeight: '600' },
  pickerCellTextActive: { color: Colors.white, fontWeight: '800' },
  yearScroll: { maxHeight: 300 },
  monthTextTime: { marginLeft: 16 },
  timeSpacer: { width: 60 },
  timeSpacerHidden: { width: 0 },
});
