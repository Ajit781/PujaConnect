import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../store/slices/cartSlice';
import { showLoader, hideLoader } from '../../store/slices/loaderSlice';
import { useAddPujaToCartMutation } from '../../store/api/pujaApi';
import { RootState } from '../../store';

import CustomTimePickerModal from '../common/CustomTimePickerModal';

const { width } = Dimensions.get('window');
import { Colors } from '../../constants/Colors';

const BRAND_PRIMARY = Colors.primary;
const BRAND_TEXT = Colors.textMain;
const BRAND_MUTED = Colors.textMuted;

interface BookingModalProps {
  visible: boolean;
  onClose: () => void;
  puja: any;
  selectedPackage?: any;
  isBn: boolean;
}

export default function BookingModal({
  visible,
  onClose,
  puja,
  selectedPackage,
  isBn,
}: BookingModalProps) {
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  const user = useSelector((state: RootState) => state.auth.user);
  const [addPujaToCart] = useAddPujaToCartMutation();
  const [step, setStep] = useState<'DATETIME' | 'CONFIRM' | 'SUCCESS'>(
    'CONFIRM',
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>('12:00 PM');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
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
  const DAYS_EN = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const DAYS_BN = [
    'রবিবার',
    'সোমবার',
    'মঙ্গলবার',
    'বুধবার',
    'বৃহস্পতিবার',
    'শুক্রবার',
    'শনিবার',
  ];

  const formatDate = (d: Date | null) => {
    if (!d) return isBn ? 'একটি তারিখ নির্বাচন করুন' : 'Select a date';
    const dayName = isBn ? DAYS_BN[d.getDay()] : DAYS_EN[d.getDay()];
    const monthName = isBn ? MONTHS_BN[d.getMonth()] : MONTHS_EN[d.getMonth()];
    return `${dayName}, ${d.getDate()} ${monthName} ${d.getFullYear()}`;
  };

  const getMonthYearText = (d: Date) => {
    const m = isBn ? MONTHS_BN[d.getMonth()] : MONTHS_EN[d.getMonth()];
    return `${m} ${d.getFullYear()}`;
  };

  const clearState = () => {
    setStep('CONFIRM');
    setSelectedDate(new Date());
    setSelectedTime('12:00 PM');
    setShowCalendar(false);
    setShowTimePicker(false);
    setCurrentMonth(new Date());
  };

  const handleClose = () => {
    clearState();
    onClose();
  };

  // Helper to extract data from either the real API object or the dummy object
  const pId =
    puja.puja_type_id?.toString() || puja.puja_id?.toString() || puja.id;

  // Package name vs Puja name logic per user request:
  // "package name will be name of the puja"
  const pTitleEn =
    puja.puja_type_name || puja.puja_name || puja.name || puja.titleEn;
  const pTitleBn =
    puja.puja_type_name ||
    puja.puja_name ||
    (isBn ? puja.nameBn : puja.name) ||
    (isBn ? puja.titleBn : puja.titleEn);

  // Store actual package type separately to show as sub-detail
  const pPackageNameEn = selectedPackage
    ? selectedPackage.puja_package_name
    : pTitleEn;

  const pPrice = selectedPackage
    ? selectedPackage.puja_package_price
    : puja.puja_with_samagri_amount || puja.minimum_price || puja.exactPrice;

  const pPriceBn = selectedPackage
    ? `₹${selectedPackage.puja_package_price.toLocaleString('en-IN')}`
    : puja.puja_with_samagri_amount
    ? `₹${puja.puja_with_samagri_amount.toLocaleString('en-IN')}`
    : puja.minimum_price
    ? `₹${puja.minimum_price.toLocaleString('en-IN')}`
    : puja.exactPriceBn;

  const pImage =
    puja.puja_type_id || puja.puja_id ? '🛕' : puja.imagePlaceholder;
  const pColor = puja.puja_type_id || puja.puja_id ? Colors.tagRed : puja.color;

  const handleViewCart = () => {
    clearState();
    onClose();
    navigation.navigate('Cart');
  };

  const handleContinue = () => {
    if (selectedDate && selectedTime) {
      setStep('CONFIRM');
    }
  };

  const handleAddToCart = async () => {
    if (!selectedDate || !selectedTime) return;
    dispatch(showLoader());

    try {
      const dateForApi = `${selectedDate.getFullYear()}-${String(
        selectedDate.getMonth() + 1,
      ).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

      // Parse 12-hour time like "10:30 AM" to 24-hour format "10:30" or "22:30"
      let formattedTime = selectedTime;
      if (selectedTime && selectedTime.includes(' ')) {
        const [timePart, period] = selectedTime.split(' ');
        if (timePart && period) {
          let [hStr, mStr] = timePart.split(':');
          let h = parseInt(hStr, 10);
          if (period.toUpperCase() === 'PM' && h < 12) {
            h += 12;
          } else if (period.toUpperCase() === 'AM' && h === 12) {
            h = 0;
          }
          formattedTime = `${String(h).padStart(2, '0')}:${mStr}`;
        }
      }

      const payload = {
        ctzn_id: user?.user_id || 0,
        puja_id: Number(puja.puja_type_id || puja.puja_id || puja.id || 0),
        package_id: selectedPackage
          ? Number(selectedPackage.puja_package_id)
          : 0,
        p_preferred_date: dateForApi,
        p_preferred_time: formattedTime,
        quantity: 1, // Defaulting to 1 for bookings
      };

      console.log(
        '--- ADD TO CART PAYLOAD ---',
        JSON.stringify(payload, null, 2),
      );

      const result = await addPujaToCart(payload).unwrap();

      console.log('--- ADD TO CART RESPONSE ---', result);

      if (result && result.status === 0) {
        dispatch(
          addToCart({
            cartItemId: `${pId}-${selectedDate.toISOString()}-${selectedTime}`,
            pujaId: pId,
            titleEn: pTitleEn,
            titleBn: pTitleBn,
            exactPrice: pPrice,
            exactPriceBn: pPriceBn,
            selectedDate: selectedDate.toISOString(),
            selectedTime: selectedTime || '',
            imagePlaceholder: pImage,
            color: pColor,
            cart_id: result.data?.cart_id,
            cart_item_id: result.data?.cart_item_id,
          }),
        );
        setStep('SUCCESS');
      }
      // Note: non-zero status errors are now handled by the global API interceptor in pujaApi.ts
    } catch (error: any) {
      console.error('Failed to add puja to cart:', error);
      // HTTP errors (like 400, 500) are handled globally by handleApiHttpError
    } finally {
      dispatch(hideLoader());
    }
  };

  const renderCalendarGrid = () => {
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
      const isSelected = selectedDate?.toDateString() === d.toDateString();
      const isPast = d < today;

      days.push(
        <TouchableOpacity
          key={i}
          style={[styles.calDayBox, isSelected && styles.calDayActive]}
          disabled={isPast}
          onPress={() => {
            setSelectedDate(d);
            setShowCalendar(false);
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
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(w => (
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

  return (
    <View style={styles.absoluteOverlayFill}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {step === 'DATETIME' && (
            <View style={styles.contentWrap}>
              <View style={styles.headerBox}>
                <View style={styles.headerTextCol}>
                  <Text style={styles.headerTitle}>
                    {isBn ? 'তারিখ ও সময় নির্বাচন করুন' : 'Select Date & Time'}
                  </Text>
                  <Text style={styles.headerSub}>
                    {isBn
                      ? 'আপনি কখন এই পূজাটি বুক করতে চান?'
                      : 'When would you like to book this puja?'}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.bodyScroll}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.inputLabel}>
                  📅 {isBn ? 'তারিখ নির্বাচন করুন' : 'Select Date'}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.inputBox,
                    showCalendar && styles.inputBoxActive,
                  ]}
                  onPress={() => {
                    setShowCalendar(!showCalendar);
                    setShowTimePicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.inputText,
                      !selectedDate && styles.inputPlaceholder,
                    ]}
                  >
                    {formatDate(selectedDate)}
                  </Text>
                  <Text style={styles.dropdownIcon}>
                    {showCalendar ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>

                {showCalendar && renderCalendarGrid()}

                <Text style={styles.inputLabel}>
                  🕒 {isBn ? 'পছন্দের সময়' : 'Preferred Time'}{' '}
                  <Text style={styles.lightLabel}>
                    {isBn
                      ? '(প্রথমে একটি তারিখ নির্বাচন করুন)'
                      : '(select a date first)'}
                  </Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.inputBox,
                    showTimePicker && styles.inputBoxActive,
                    !selectedDate && styles.inputBoxDisabled,
                  ]}
                  disabled={!selectedDate}
                  onPress={() => {
                    setShowTimePicker(true);
                    setShowCalendar(false);
                  }}
                >
                  <Text
                    style={[
                      styles.inputText,
                      !selectedTime && styles.inputPlaceholder,
                    ]}
                  >
                    {selectedTime ||
                      (isBn
                        ? 'একটি সময় স্লট চয়ন করুন'
                        : 'Choose a time slot')}
                  </Text>
                  <Text style={styles.dropdownIcon}>
                    {showTimePicker ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>

                <CustomTimePickerModal
                  visible={showTimePicker}
                  onClose={() => setShowTimePicker(false)}
                  onSelect={t => setSelectedTime(t)}
                  initialTime={selectedTime || '12:00 PM'}
                />

                {selectedDate && selectedTime && (
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryTitle}>
                      ✓ {isBn ? 'আপনার নির্বাচন:' : 'Your Selection:'}
                    </Text>
                    <Text style={styles.summaryText}>
                      📅 {formatDate(selectedDate)}
                    </Text>
                    <Text style={styles.summaryText}>🕒 {selectedTime}</Text>
                  </View>
                )}
              </ScrollView>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[
                    styles.btnPrimary,
                    styles.flex1,
                    (!selectedDate || !selectedTime) && styles.btnDisabled,
                  ]}
                  disabled={!selectedDate || !selectedTime}
                  onPress={handleContinue}
                >
                  <Text style={styles.btnPrimaryText}>
                    {isBn ? 'চালিয়ে যান' : 'Continue'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnSecondary, styles.flex1]}
                  onPress={handleClose}
                >
                  <Text style={styles.btnSecondaryText}>
                    {isBn ? 'বাতিল করুন' : 'Cancel'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 'CONFIRM' && (
            <View style={styles.contentWrap}>
              <View style={styles.headerBox}>
                <View style={styles.headerTextCol}>
                  <Text style={styles.headerTitle}>
                    {isBn ? 'আপনার বুকিং নিশ্চিত করুন' : 'Confirm Your Booking'}
                  </Text>
                  <Text style={styles.headerSub}>
                    {isBn
                      ? 'আপনার পূজা প্যাকেজ বিবরণ পর্যালোচনা করুন'
                      : 'Review your puja package details'}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.bodyScroll}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.pujaDetailsCard}>
                  <Text style={styles.pdTitle}>
                    {isBn ? pTitleBn : pTitleEn}
                  </Text>
                  <Text style={styles.pdDesc} numberOfLines={2}>
                    {isBn
                      ? 'পবিত্র অনুষ্ঠান আপনার কাছাকাছি'
                      : 'Holy ceremony near you'}
                  </Text>
                </View>

                <Text style={styles.sectionHeading}>
                  {isBn ? 'প্যাকেজের বিশদ' : 'Package Details'}
                </Text>
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>
                    🎁 {isBn ? 'প্যাকেজ' : 'Package'}
                  </Text>
                  <Text style={styles.tableValue}>{pPackageNameEn}</Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>
                    🧘 {isBn ? 'পুরোহিত' : 'Pandits'}
                  </Text>
                  <Text style={styles.tableValue}>
                    {selectedPackage ? selectedPackage.pandit_count : '1'}
                  </Text>
                </View>
                {selectedPackage && (
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>
                      ⏱️ {isBn ? 'সময়কাল' : 'Duration'}
                    </Text>
                    <Text style={styles.tableValue}>
                      {selectedPackage.puja_duration} {isBn ? 'ঘন্টা' : 'Hrs'}
                    </Text>
                  </View>
                )}

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>
                    {isBn ? 'মোট মূল্য' : 'Total Price'}
                  </Text>
                  <Text style={styles.totalValue}>
                    {pPriceBn || `₹${pPrice?.toLocaleString('en-IN')}`}
                  </Text>
                </View>

                <View style={styles.secureBox}>
                  <Text style={styles.secureBoxIcon}>🛡️</Text>
                  <Text style={styles.secureBoxText}>
                    {isBn
                      ? 'আপনার বুকিং নিরাপদ। প্রত্যয়িত পুরোহিতরা আপনার প্যাকেজ অনুযায়ী খাঁটি বৈদিক আচার পরিচালনা করবেন।'
                      : 'Your booking is secure. Certified pandits will conduct authentic Vedic rituals as per your package.'}
                  </Text>
                </View>
              </ScrollView>

              <View style={styles.actionRowRev}>
                <TouchableOpacity
                  style={[styles.btnPrimary, styles.flex1]}
                  onPress={handleAddToCart}
                >
                  <Text style={styles.btnPrimaryText}>
                    🛒 {isBn ? 'কার্টে যোগ করুন' : 'Add to Cart'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnSecondary, styles.flex1]}
                  onPress={handleClose}
                >
                  <Text style={styles.btnSecondaryText}>
                    {isBn ? 'বাতিল করুন' : 'Cancel'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 'SUCCESS' && (
            <View style={styles.contentWrap}>
              <View style={styles.successHeader}>
                <View style={styles.successIconRow}>
                  <View style={styles.omIconBox}>
                    <Text style={styles.omIconText}>ॐ</Text>
                  </View>
                  <View style={styles.checkIconBox}>
                    <Text style={styles.checkIconText}>✓</Text>
                  </View>
                </View>
                <Text style={styles.successTitle}>
                  {isBn
                    ? 'আশীর্বাদপ্রাপ্ত এবং যোগ করা হয়েছে!'
                    : 'Blessed & Added!'}
                </Text>
                <Text style={styles.successSub}>
                  {isBn
                    ? 'আপনার পবিত্র পূজার অফার কার্টে যোগ করা হয়েছে।'
                    : 'Your sacred puja offering has been added to the cart.'}
                </Text>
              </View>

              <View style={styles.successCard}>
                <Text style={styles.scHeader}>
                  🙏 {isBn ? 'পূজা নির্বাচিত' : 'Puja Selected'}
                </Text>
                <Text style={styles.scTitle}>{isBn ? pTitleBn : pTitleEn}</Text>
                <Text style={styles.scDesc}>
                  {pPackageNameEn} {isBn ? 'প্যাকেজ' : 'Package'}
                </Text>
                <View style={styles.scDivider} />
                <View style={styles.scTotalRow}>
                  <Text style={styles.scTotalLabel}>
                    {isBn ? 'পরিমাণ' : 'Amount'}
                  </Text>
                  <Text style={styles.scTotalValue}>
                    {pPriceBn || `₹${pPrice?.toLocaleString('en-IN')}`}
                  </Text>
                </View>
              </View>

              <View style={styles.actionCol}>
                <TouchableOpacity
                  style={styles.btnPrimary}
                  onPress={handleViewCart}
                >
                  <Text style={styles.btnPrimaryText}>
                    🛒 {isBn ? 'কার্ট দেখুন' : 'View Cart'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnSecondary, styles.btnSecondaryOuter]}
                  onPress={handleClose}
                >
                  <Text style={styles.btnSecondaryText}>
                    {isBn ? 'কেনাকাটা চালিয়ে যান' : 'Continue Shopping'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: width - 40,
    backgroundColor: Colors.white,
    borderRadius: 24,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  contentWrap: { flexShrink: 1 },
  headerBox: {
    backgroundColor: Colors.primary, // Using primary for orange
    paddingHorizontal: 24,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTextCol: { flex: 1, paddingRight: 16 },
  headerTitle: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  headerSub: { color: 'rgba(255,255,255,0.9)', fontSize: 13 },
  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: Colors.white, fontSize: 12, fontWeight: '700' },

  bodyScroll: { padding: 24, flexShrink: 1 },

  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND_TEXT,
    marginBottom: 8,
  },
  lightLabel: { color: BRAND_MUTED, fontWeight: '400', fontSize: 11 },
  inputBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
    backgroundColor: Colors.white,
  },
  inputBoxActive: { borderColor: BRAND_PRIMARY, borderWidth: 1.5 },
  inputBoxDisabled: { backgroundColor: Colors.ultraLightGray, opacity: 0.7 },
  inputText: { fontSize: 14, color: BRAND_TEXT, fontWeight: '600' },
  inputPlaceholder: { color: Colors.textMuted, fontWeight: '400' },
  dropdownIcon: { fontSize: 12, color: BRAND_MUTED },

  dropdownMenu: {
    marginTop: -16,
    marginBottom: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    elevation: 3,
  },

  calHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  calArrow: { fontSize: 18, color: BRAND_TEXT, padding: 4, fontWeight: 'bold' },
  calMonthText: { fontSize: 14, fontWeight: '700', color: BRAND_TEXT },
  calWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calWeekText: {
    width: '14%',
    textAlign: 'center',
    fontSize: 12,
    color: BRAND_MUTED,
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
  calDayActive: { backgroundColor: BRAND_PRIMARY, borderRadius: 20 },
  calDayText: { fontSize: 13, color: BRAND_TEXT },
  calDayTextActive: { color: Colors.white, fontWeight: 'bold' },
  calDayPast: { color: Colors.textMuted, opacity: 0.6 },

  dropdownMenuVertical: {
    marginTop: -16,
    marginBottom: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    height: 200,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    elevation: 3,
    overflow: 'hidden',
  },
  timeSlotBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  timeSlotText: { fontSize: 14, color: BRAND_TEXT },
  timeSlotTextActive: { color: BRAND_PRIMARY, fontWeight: '700' },
  checkIcon: { color: BRAND_PRIMARY, fontWeight: '800' },

  summaryBox: {
    backgroundColor: Colors.greenLight,
    borderWidth: 1,
    borderColor: Colors.greenVeryLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.green,
    marginBottom: 8,
  },
  summaryText: { fontSize: 13, color: Colors.green, marginBottom: 4 },

  actionRow: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  actionRowRev: {
    flexDirection: 'row-reverse',
    padding: 24,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  actionCol: { padding: 24 },
  flex1: { flex: 1 },

  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: { color: Colors.white, fontSize: 14, fontWeight: '800' },
  btnSecondary: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  btnSecondaryText: { color: Colors.primary, fontSize: 14, fontWeight: '800' },
  btnSecondaryOuter: { marginTop: 12 },
  btnDisabled: { backgroundColor: Colors.border, opacity: 0.8 },

  pujaDetailsCard: {
    backgroundColor: Colors.warningBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  pdTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: BRAND_TEXT,
    marginBottom: 4,
  },
  pdDesc: { fontSize: 12, color: BRAND_MUTED, lineHeight: 18 },

  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: BRAND_TEXT,
    marginBottom: 12,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tableLabel: { fontSize: 13, color: BRAND_MUTED },
  tableValue: {
    fontSize: 13,
    color: BRAND_TEXT,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    paddingLeft: 16,
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginBottom: 24,
    alignItems: 'center',
  },
  totalLabel: { fontSize: 14, fontWeight: '700', color: BRAND_TEXT },
  totalValue: { fontSize: 20, fontWeight: '900', color: Colors.primary },

  secureBox: {
    flexDirection: 'row',
    backgroundColor: Colors.blueLight,
    borderWidth: 1,
    borderColor: Colors.blueBorder,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  secureBoxIcon: { fontSize: 18, marginRight: 12 },
  secureBoxText: { flex: 1, fontSize: 11, color: Colors.blue, lineHeight: 16 },

  successHeader: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: Colors.warningBackground,
  },
  successIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  omIconBox: {
    width: 50,
    height: 50,
    backgroundColor: '#4C1D95',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginRight: -10,
    zIndex: 2,
    borderWidth: 3,
    borderColor: Colors.white,
  },
  omIconText: { color: Colors.white, fontSize: 24, fontWeight: '800' },
  checkIconBox: {
    width: 60,
    height: 60,
    backgroundColor: '#FDE047',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    borderWidth: 4,
    borderColor: Colors.white,
  },
  checkIconText: { color: Colors.primary, fontSize: 30, fontWeight: '800' },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 8,
  },
  successSub: { fontSize: 13, color: BRAND_MUTED, textAlign: 'center' },

  successCard: {
    margin: 24,
    padding: 20,
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.lightOrange,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    elevation: 3,
  },
  scHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: BRAND_PRIMARY,
    marginBottom: 8,
    textAlign: 'center',
  },
  scTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: BRAND_TEXT,
    textAlign: 'center',
    marginBottom: 4,
  },
  scDesc: {
    fontSize: 12,
    color: BRAND_MUTED,
    textAlign: 'center',
    marginBottom: 2,
  },
  scDivider: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginVertical: 16,
  },
  scTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scTotalLabel: { fontSize: 14, fontWeight: '700', color: BRAND_MUTED },
  scTotalValue: { fontSize: 18, fontWeight: '800', color: Colors.primary },
});
