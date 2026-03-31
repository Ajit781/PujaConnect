import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import CustomTimePickerModal from '../common/CustomTimePickerModal';

const { width } = Dimensions.get('window');

export interface ScheduleItemPayload {
  package_id: number;
  preferred_date: string;
  preferred_time: string;
}

interface SchedulePujasModalProps {
  visible: boolean;
  onClose: () => void;
  cartItems: any[];
  isBn: boolean;
  onConfirmSchedule: (schedules: ScheduleItemPayload[]) => void;
}

export default function SchedulePujasModal({
  visible,
  onClose,
  cartItems,
  isBn,
  onConfirmSchedule,
}: SchedulePujasModalProps) {
  const [isSameDay, setIsSameDay] = useState(true);

  // Global Schedule State
  const [globalDate, setGlobalDate] = useState<Date | null>(null);
  const [globalTime, setGlobalTime] = useState<string | null>(null);

  // Individual Schedule State
  const [itemSchedules, setItemSchedules] = useState<
    Record<string, { date: Date | null; time: string | null }>
  >({});

  // UI States
  const [activeDateDropdown, setActiveDateDropdown] = useState<string | null>(
    null,
  );
  const [activeTimeDropdown, setActiveTimeDropdown] = useState<string | null>(
    null,
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    // Initialize item schedules when cart items change
    const initialSchedules: Record<
      string,
      { date: Date | null; time: string | null }
    > = {};
    cartItems.forEach(item => {
      initialSchedules[item.cartItemId] = { date: null, time: null };
    });
    setItemSchedules(initialSchedules);
  }, [cartItems]);

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

  const formatDate = (d: Date | null) => {
    if (!d) return isBn ? 'mm/dd/yyyy' : 'mm/dd/yyyy';
    return `${String(d.getDate()).padStart(2, '0')}/${String(
      d.getMonth() + 1,
    ).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const formatPayloadDate = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getMonthYearText = (d: Date) => {
    const m = isBn ? MONTHS_BN[d.getMonth()] : MONTHS_EN[d.getMonth()];
    return `${m} ${d.getFullYear()}`;
  };

  // Parses 12hr time back to 24hr string for API without trailing space
  const formatPayloadTime = (time12: string) => {
    if (!time12 || !time12.includes(' ')) return '12:00';
    let [timePart, period] = time12.split(' ');
    if (!timePart || !period) return '12:00';
    let [hStr, mStr] = timePart.split(':');
    let h = parseInt(hStr, 10);
    if (period.toUpperCase() === 'PM' && h < 12) h += 12;
    if (period.toUpperCase() === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${mStr}`;
  };

  const handleConfirm = () => {
    const payload: ScheduleItemPayload[] = [];
    if (isSameDay) {
      if (!globalDate || !globalTime) return;
      cartItems.forEach(item => {
        payload.push({
          package_id: item.packageId || 0,
          preferred_date: formatPayloadDate(globalDate),
          preferred_time: formatPayloadTime(globalTime),
        });
      });
    } else {
      for (const item of cartItems) {
        const sched = itemSchedules[item.cartItemId];
        if (!sched || !sched.date || !sched.time) return;
        payload.push({
          package_id: item.packageId || 0,
          preferred_date: formatPayloadDate(sched.date),
          preferred_time: formatPayloadTime(sched.time),
        });
      }
    }
    onConfirmSchedule(payload);
  };

  const isFormValid = () => {
    if (isSameDay) return !!(globalDate && globalTime);
    return cartItems.every(
      item =>
        itemSchedules[item.cartItemId]?.date &&
        itemSchedules[item.cartItemId]?.time,
    );
  };

  const renderCalendar = (
    id: string,
    selected: Date | null,
    onSelect: (d: Date) => void,
  ) => {
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
    const limitDate = new Date();
    limitDate.setFullYear(today.getFullYear() + 1); // rough limit

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const isSelected = selected?.toDateString() === d.toDateString();
      const isPast = d < today;

      days.push(
        <TouchableOpacity
          key={i}
          style={[styles.calDayBox, isSelected && styles.calDayActive]}
          disabled={isPast}
          onPress={() => {
            onSelect(d);
            setActiveDateDropdown(null);
          }}
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

  if (!visible) return null;

  const namesList = cartItems
    .map(i => (isBn ? i.titleBn : i.titleEn))
    .join(', ')
    .toUpperCase();

  return (
    <View style={styles.absoluteOverlayFill}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.headerBox}>
            <View style={styles.stepBox}>
              <Text style={styles.stepText}>STEP 1 OF 2</Text>
            </View>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerIcon}>📅</Text>
              <Text style={styles.headerTitle}>
                {isBn ? 'আপনার পূজা নির্ধারণ করুন' : 'Schedule Your Pujas'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.bodyScroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.toggleCard}>
              <Text style={styles.yourPujasText}>
                {isBn ? 'আপনার পূজাসমূহ ' : 'YOUR PUJAS '}
                {namesList}
              </Text>
              <Text style={styles.questionText}>
                {isBn
                  ? 'আপনি কি একই দিনে সব পূজা করতে চান?'
                  : 'Do you want to perform all pujas on the same day?'}
              </Text>

              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    isSameDay && styles.toggleBtnActive,
                  ]}
                  onPress={() => setIsSameDay(true)}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      isSameDay && styles.toggleBtnTextActive,
                    ]}
                  >
                    {isSameDay ? '✅ ' : '🗓️ '}
                    {isBn ? 'হ্যাঁ, একই দিন' : 'Yes, Same Day'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    !isSameDay && styles.toggleBtnActive,
                  ]}
                  onPress={() => setIsSameDay(false)}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      !isSameDay && styles.toggleBtnTextActive,
                    ]}
                  >
                    {!isSameDay ? '✅ ' : '🗓️ '}
                    {isBn ? 'না, আলাদা দিন' : 'No, Different Days'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {isSameDay ? (
              <View style={styles.scheduleCard}>
                <Text style={styles.scdTitle}>
                  {isBn
                    ? 'আপনার পূজার জন্য তারিখ ও সময়'
                    : 'Date & Time for your pujas'}
                </Text>

                <Text style={styles.inputLabel}>
                  📅 {isBn ? 'তারিখ নির্বাচন করুন' : 'Select Date'}
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
                    style={[
                      styles.inputText,
                      !globalDate && styles.inputPlaceholder,
                    ]}
                  >
                    {formatDate(globalDate)}
                  </Text>
                  <Text style={styles.dropdownIcon}>🗓️</Text>
                </TouchableOpacity>

                {activeDateDropdown === 'GLOBAL' &&
                  renderCalendar('GLOBAL', globalDate, setGlobalDate)}

                <Text style={styles.warnText}>
                  ⚠️{' '}
                  {isBn
                    ? 'শুধুমাত্র ৩০ জুন ২০২৬ পর্যন্ত বুকিং পাওয়া যায়।'
                    : 'Bookings available up to 30 June 2026 only.'}
                </Text>

                <Text style={styles.inputLabel}>
                  🕒 {isBn ? 'পছন্দের সময়' : 'Preferred Time'}{' '}
                  <Text style={styles.lightLabel}>(select a date first)</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.inputBox,
                    activeTimeDropdown === 'GLOBAL' && styles.inputBoxActive,
                    !globalDate && styles.inputBoxDisabled,
                  ]}
                  disabled={!globalDate}
                  onPress={() => setActiveTimeDropdown('GLOBAL')}
                >
                  <Text
                    style={[
                      styles.inputText,
                      !globalTime && styles.inputPlaceholder,
                    ]}
                  >
                    {globalTime ||
                      (isBn
                        ? 'একটি সময় স্লট চয়ন করুন'
                        : 'Select preferred time')}
                  </Text>
                </TouchableOpacity>

                <CustomTimePickerModal
                  visible={activeTimeDropdown === 'GLOBAL'}
                  onClose={() => setActiveTimeDropdown(null)}
                  onSelect={t => setGlobalTime(t)}
                  initialTime={globalTime || '10:00 AM'}
                />
              </View>
            ) : (
              <View>
                {cartItems.map(item => {
                  const id = item.cartItemId;
                  const itemState = itemSchedules[id] || {
                    date: null,
                    time: null,
                  };
                  return (
                    <View key={id} style={styles.scheduleCard}>
                      <View style={styles.itemHeader}>
                        <View style={styles.cardImgPlaceholder}>
                          {item.imagePlaceholder &&
                          item.imagePlaceholder.startsWith('http') ? (
                            <Image
                              source={{ uri: item.imagePlaceholder }}
                              style={styles.pkgImage}
                            />
                          ) : (
                            <Text style={styles.pkgImageText}>
                              {item.imagePlaceholder || '🛕'}
                            </Text>
                          )}
                        </View>
                        <View>
                          <Text style={styles.itemTitle}>
                            {isBn ? item.titleBn : item.titleEn}
                          </Text>
                          <Text style={styles.itemSubtitle}>
                            {item.pkg_name}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.inputLabel}>
                        📅 {isBn ? 'তারিখ নির্বাচন করুন' : 'Select Date'}
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.inputBox,
                          activeDateDropdown === id && styles.inputBoxActive,
                        ]}
                        onPress={() =>
                          setActiveDateDropdown(
                            activeDateDropdown === id ? null : id,
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.inputText,
                            !itemState.date && styles.inputPlaceholder,
                          ]}
                        >
                          {formatDate(itemState.date)}
                        </Text>
                        <Text style={styles.dropdownIcon}>🗓️</Text>
                      </TouchableOpacity>

                      {activeDateDropdown === id &&
                        renderCalendar(id, itemState.date, date => {
                          setItemSchedules(prev => ({
                            ...prev,
                            [id]: { ...prev[id], date },
                          }));
                        })}

                      <Text style={styles.inputLabel}>
                        🕒 {isBn ? 'পছন্দের সময়' : 'Preferred Time'}
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.inputBox,
                          activeTimeDropdown === id && styles.inputBoxActive,
                          !itemState.date && styles.inputBoxDisabled,
                        ]}
                        disabled={!itemState.date}
                        onPress={() => setActiveTimeDropdown(id)}
                      >
                        <Text
                          style={[
                            styles.inputText,
                            !itemState.time && styles.inputPlaceholder,
                          ]}
                        >
                          {itemState.time ||
                            (isBn
                              ? 'একটি সময় স্লট চয়ন করুন'
                              : 'Select preferred time')}
                        </Text>
                      </TouchableOpacity>

                      <CustomTimePickerModal
                        visible={activeTimeDropdown === id}
                        onClose={() => setActiveTimeDropdown(null)}
                        onSelect={t => {
                          setItemSchedules(prev => ({
                            ...prev,
                            [id]: { ...prev[id], time: t },
                          }));
                        }}
                        initialTime={itemState.time || '10:00 AM'}
                      />
                    </View>
                  );
                })}
              </View>
            )}
            <View style={styles.bottomSpacer} />
          </ScrollView>

          <View style={styles.footerRow}>
            <TouchableOpacity
              style={[styles.confirmBtn, !isFormValid() && styles.btnDisabled]}
              disabled={!isFormValid()}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmBtnText}>
                ✨{' '}
                {isBn
                  ? 'সূচি নিশ্চিত করুন এবং অর্ডার পর্যালোচনা করুন'
                  : 'Confirm Schedule & Review Order'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  absoluteOverlayFill: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: width - 32,
    backgroundColor: Colors.extraLightWarm || '#FDFBF7',
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '85%',
  },
  pkgImage: { width: 32, height: 32, borderRadius: 16 },
  pkgImageText: { fontSize: 20 },
  bottomSpacer: { height: 20 },
  headerBox: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBox: { position: 'absolute', top: 12, left: 20 },
  stepText: { fontSize: 10, color: Colors.primary, fontWeight: '800' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  headerIcon: { fontSize: 22, marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.textMain },
  closeBtn: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.ultraLightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: Colors.textMuted, fontSize: 14, fontWeight: 'bold' },
  bodyScroll: { padding: 16 },
  toggleCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightOrange,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  yourPujasText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '800',
    marginBottom: 4,
  },
  questionText: {
    fontSize: 13,
    color: Colors.textMain,
    fontWeight: '600',
    marginBottom: 16,
  },
  toggleRow: { flexDirection: 'row', gap: 12 },
  toggleBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  toggleBtnActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  toggleBtnText: {
    fontSize: 12,
    color: Colors.textMain,
    fontWeight: '600',
    textAlign: 'center',
  },
  toggleBtnTextActive: { color: Colors.white },
  scheduleCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightOrange,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  scdTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMain,
    marginBottom: 16,
  },
  itemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardImgPlaceholder: {
    backgroundColor: Colors.lightGray,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemTitle: { fontSize: 14, fontWeight: '800', color: Colors.textMain },
  itemSubtitle: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMain,
    marginBottom: 8,
  },
  lightLabel: { color: Colors.textMuted, fontWeight: '400', fontSize: 10 },
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
  inputText: { fontSize: 14, color: Colors.textMain, fontWeight: '500' },
  inputPlaceholder: { color: Colors.textMuted },
  dropdownIcon: { fontSize: 14 },
  warnText: { fontSize: 11, color: '#D97706', marginBottom: 16 },
  btnDisabled: { opacity: 0.5 },
  footerRow: {
    padding: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmBtnText: { color: Colors.white, fontSize: 15, fontWeight: '800' },

  // Calendar styles
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
  calDayPast: { color: Colors.textMuted },
});
