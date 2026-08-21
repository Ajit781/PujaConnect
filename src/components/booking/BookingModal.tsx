import React, { useState } from 'react';
import {
  Gift,
  Users,
  Clock,
  ShoppingCart,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  X,
  Check,
} from 'lucide-react-native';
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
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import CustomTimePickerModal from '../common/CustomTimePickerModal';
import PackageDetailsModal from './PackageDetailsModal';

const { width } = Dimensions.get('window');
import { Colors } from '../../constants/Colors';

const BRAND_TEXT = Colors.textMain;
const BRAND_MUTED = Colors.textMuted;

interface BookingModalProps {
  visible: boolean;
  onClose: () => void;
  puja: any;
  selectedPackage?: any;
  isBn: boolean;
  packagesData?: any[];
  onSelectPackage?: (id: string) => void;
}

export default function BookingModal({
  visible,
  onClose,
  puja,
  selectedPackage,
  isBn,
  packagesData,
  onSelectPackage,
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
  const [showPackageDropdown, setShowPackageDropdown] = useState(false);
  const [activeDetailsPkg, setActiveDetailsPkg] = useState<any>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const MONTHS_EN = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const MONTHS_BN = [
    'জানুয়ারী', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর',
  ];
  const DAYS_EN = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
  ];
  const DAYS_BN = [
    'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার',
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
    setShowPackageDropdown(false);
    setCurrentMonth(new Date());
  };

  const handleClose = () => {
    clearState();
    onClose();
  };

  const pId = puja.puja_type_id?.toString() || puja.puja_id?.toString() || puja.id;

  const pTitleEn =
    puja.puja_type_name || puja.puja_name || puja.name || puja.titleEn || 'Durga Puja';
  const pTitleBn =
    puja.puja_type_name ||
    puja.puja_name ||
    (isBn ? puja.nameBn : puja.name) ||
    (isBn ? puja.titleBn : puja.titleEn);

  const pPackageNameEn = selectedPackage
    ? selectedPackage.puja_package_name
    : 'Platinum Package';

  const pPrice = selectedPackage
    ? selectedPackage.puja_package_price
    : puja.puja_with_samagri_amount || puja.minimum_price || puja.exactPrice || 10000;

  const pPriceBn = selectedPackage
    ? `₹${selectedPackage.puja_package_price.toLocaleString('en-IN')}`
    : `₹${pPrice.toLocaleString('en-IN')}`;

  const pImage = puja.puja_type_id || puja.puja_id ? '🛕' : puja.imagePlaceholder;
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
        quantity: 1,
      };

      const result = await addPujaToCart(payload).unwrap();

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
    } catch (error: any) {
      console.error('Failed to add puja to cart:', error);
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
              {/* Header Box matching Screenshot Gradient */}
              <View style={styles.headerBox}>
                <View style={StyleSheet.absoluteFillObject}>
                  <Svg height="100%" width="100%">
                    <Defs>
                      <LinearGradient id="bookingHeaderGrad1" x1="0" y1="0" x2="1" y2="0">
                        <Stop offset="0" stopColor="#FF9933" />
                        <Stop offset="1" stopColor="#E07800" />
                      </LinearGradient>
                    </Defs>
                    <Rect width="100%" height="100%" fill="url(#bookingHeaderGrad1)" />
                  </Svg>
                </View>
                <View style={styles.headerTextCol}>
                  <Text style={styles.headerTitle}>
                    {isBn ? 'তারিখ ও সময় নির্বাচন করুন' : 'Select Date & Time'}
                  </Text>
                  <View style={styles.headerTitleLine} />
                  <Text style={styles.headerSub}>
                    {isBn
                      ? 'আপনি কখন এই পূজাটি বুক করতে চান?'
                      : 'When would you like to book this puja?'}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtnCircle}>
                  <X size={18} color="#FFFFFF" />
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

          {/* ── STEP CONFIRM matching Screenshot ── */}
          {step === 'CONFIRM' && (
            <View style={styles.contentWrap}>
              {/* Header Box matching Screenshot Gradient */}
              <View style={styles.headerBox}>
                <View style={StyleSheet.absoluteFillObject}>
                  <Svg height="100%" width="100%">
                    <Defs>
                      <LinearGradient id="bookingHeaderGrad2" x1="0" y1="0" x2="1" y2="0">
                        <Stop offset="0" stopColor="#FF9933" />
                        <Stop offset="1" stopColor="#E07800" />
                      </LinearGradient>
                    </Defs>
                    <Rect width="100%" height="100%" fill="url(#bookingHeaderGrad2)" />
                  </Svg>
                </View>

                <View style={styles.headerTextCol}>
                  <Text style={styles.headerTitle}>
                    {isBn ? 'আপনার বুকিং নিশ্চিত করুন' : 'Confirm your booking'}
                  </Text>
                  <View style={styles.headerTitleLine} />
                  <Text style={styles.headerSub}>
                    {isBn
                      ? 'আপনার পূজা প্যাকেজ বিবরণ পর্যালোচনা করুন'
                      : 'Review your puja package details'}
                  </Text>
                </View>

                <TouchableOpacity onPress={handleClose} style={styles.closeBtnCircle}>
                  <X size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.bodyScroll}
                showsVerticalScrollIndicator={false}
              >
                {/* Puja Name Card */}
                <View style={styles.pujaDetailsCard}>
                  <Text style={styles.pdTitle}>
                    {isBn ? pTitleBn : pTitleEn}
                  </Text>
                </View>

                {/* Package Dropdown Selector Box */}
                <View style={{ marginBottom: 16, zIndex: 20 }}>
                  <View style={styles.packageSelectorHeader}>
                    <Text style={styles.packageSelectorTitle}>
                      {isBn ? 'প্যাকেজ নির্বাচন করুন' : 'Select a package'}
                    </Text>
                    <Text style={styles.packageSelectorCount}>
                      {packagesData && packagesData.length > 0 ? `${packagesData.length} available` : '3 available'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.dropdownTriggerBtn}
                    onPress={() => setShowPackageDropdown(!showPackageDropdown)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.triggerIconSquare}>
                      <Gift color="#FFFFFF" size={20} />
                    </View>
                    <View style={styles.triggerTextCol}>
                      <Text style={styles.triggerTitle} numberOfLines={1}>
                        {pPackageNameEn}
                      </Text>
                      <Text style={styles.triggerPriceText}>
                        {pPriceBn || `₹${pPrice?.toLocaleString('en-IN')}`}
                      </Text>
                    </View>
                    <ChevronDown size={20} color="#57534E" />
                  </TouchableOpacity>

                  <Text style={styles.packageSelectorFooter}>
                    Package details and total update instantly.
                  </Text>

                  {/* Dropdown Menu List with TRANSPARENT backdrop fix */}
                  {showPackageDropdown && (
                    <>
                      <TouchableOpacity
                        style={styles.dropdownBackdropFix}
                        onPress={() => setShowPackageDropdown(false)}
                        activeOpacity={1}
                      />
                      <View style={styles.packageDropdownContainer}>
                        <ScrollView style={styles.dropdownScroll} bounces={false}>
                          {(packagesData && packagesData.length > 0
                            ? packagesData
                            : [
                              { puja_package_id: '1', puja_package_name: 'Platinum Package', puja_package_price: 10000, puja_duration: 2, pandit_count: 3 },
                              { puja_package_id: '2', puja_package_name: 'Silver Package', puja_package_price: 10000, puja_duration: 2, pandit_count: 3 },
                              { puja_package_id: '3', puja_package_name: 'Gold Package', puja_package_price: 10000, puja_duration: 3, pandit_count: 3 },
                            ]
                          ).map((pkg: any) => {
                            const isSelected = selectedPackage && selectedPackage.puja_package_id === pkg.puja_package_id;
                            return (
                              <TouchableOpacity
                                key={pkg.puja_package_id}
                                style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
                                onPress={() => {
                                  if (onSelectPackage) onSelectPackage(pkg.puja_package_id.toString());
                                  setShowPackageDropdown(false);
                                }}
                              >
                                <View style={styles.dropdownItemLeft}>
                                  <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                                    {isSelected && <View style={styles.radioInner} />}
                                  </View>
                                  <View>
                                    <Text style={[styles.dropdownItemName, isSelected && styles.dropdownItemNameSelected]}>
                                      {pkg.puja_package_name}
                                    </Text>
                                    <View style={styles.dropdownMetaRow}>
                                      <Clock size={12} color="#6B7280" />
                                      <Text style={styles.dropdownItemMetaText}>
                                        {pkg.puja_duration} hrs
                                      </Text>
                                      <Users size={12} color="#6B7280" style={{ marginLeft: 6 }} />
                                      <Text style={styles.dropdownItemMetaText}>
                                        {pkg.pandit_count || 3} pandits
                                      </Text>
                                    </View>
                                  </View>
                                </View>
                                <Text style={[styles.dropdownItemPrice, isSelected && styles.dropdownItemPriceSelected]}>
                                  ₹{pkg.puja_package_price.toLocaleString('en-IN')}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>
                    </>
                  )}
                </View>

                {/* Package Details Section matching Screenshot */}
                <Text style={styles.sectionHeaderTitle}>Package details</Text>

                <View style={styles.tableRowClean}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Gift size={16} color="#E8700A" />
                    <Text style={styles.tableLabelText}>Package</Text>
                  </View>
                  <Text style={styles.tableValueText}>{pPackageNameEn}</Text>
                </View>

                <View style={styles.tableRowClean}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Users size={16} color="#E8700A" />
                    <Text style={styles.tableLabelText}>Pandits</Text>
                  </View>
                  <Text style={styles.tableValueText}>
                    {selectedPackage ? selectedPackage.pandit_count || 3 : '3'}
                  </Text>
                </View>

                {/* Total price row matching Screenshot */}
                <View style={styles.totalRowClean}>
                  <Text style={styles.totalLabelText}>Total price</Text>
                  <Text style={styles.totalPriceBig}>
                    {pPriceBn || `₹${pPrice?.toLocaleString('en-IN')}`}
                  </Text>
                </View>

                {/* Booking Secure Info Box matching Screenshot */}
                <View style={styles.secureBoxClean}>
                  <ShieldCheck size={18} color="#2563EB" />
                  <Text style={styles.secureBoxTextClean}>
                    Your booking is secure. Certified pandits will conduct the ritual according to the package details.
                  </Text>
                </View>
              </ScrollView>

              {/* Action Buttons matching Screenshot */}
              <View style={styles.actionRowBottom}>
                <TouchableOpacity
                  style={styles.cancelBtnOutline}
                  onPress={handleClose}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.addToCartGradientBtn}
                  activeOpacity={0.9}
                  onPress={handleAddToCart}
                >
                  <View style={StyleSheet.absoluteFillObject}>
                    <Svg height="100%" width="100%">
                      <Defs>
                        <LinearGradient id="cartBtnGrad" x1="0" y1="0" x2="1" y2="0">
                          <Stop offset="0" stopColor="#FF9933" />
                          <Stop offset="1" stopColor="#E07800" />
                        </LinearGradient>
                      </Defs>
                      <Rect width="100%" height="100%" fill="url(#cartBtnGrad)" rx="16" />
                    </Svg>
                  </View>
                  <ShoppingCart size={18} color="#FFFFFF" />
                  <Text style={styles.addToCartBtnText}>Add to cart</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 'SUCCESS' && (
            <View style={styles.successContentWrap}>
              {/* Close Button Top Right matching Screenshot */}
              <TouchableOpacity onPress={handleClose} style={styles.successCloseBtn} activeOpacity={0.8}>
                <X size={18} color="#6B7280" />
              </TouchableOpacity>

              <View style={styles.successHeader}>
                <View style={styles.successIconRow}>
                  <View style={styles.purpleOmBox}>
                    <Text style={styles.purpleOmText}>ॐ</Text>
                  </View>
                  <View style={styles.yellowCheckCircle}>
                    <Check size={26} color="#EA580C" strokeWidth={3} />
                  </View>
                </View>
                <Text style={styles.successTitleOrange}>
                  {isBn ? 'আশীর্বাদপ্রাপ্ত এবং যোগ করা হয়েছে!' : 'Blessed & Added!'}
                </Text>
                <Text style={styles.successSubText}>
                  {isBn
                    ? 'আপনার পবিত্র পূজার অফার কার্টে যোগ করা হয়েছে।'
                    : 'Your sacred puja offering has been added to the cart.'}
                </Text>
              </View>

              <View style={styles.successCardClean}>
                <Text style={styles.scHeaderTag}>
                  🙏 {isBn ? 'পূজা নির্বাচিত' : 'Puja Selected'}
                </Text>
                <Text style={styles.scTitleBold}>{isBn ? pTitleBn : pTitleEn}</Text>
                <Text style={styles.scPackageNameText}>
                  {pPackageNameEn}
                </Text>
                <View style={styles.scLineDivider} />
                <View style={styles.scTotalRowClean}>
                  <Text style={styles.scTotalLabelText}>
                    {isBn ? 'পরিমাণ' : 'Amount'}
                  </Text>
                  <Text style={styles.scTotalValueOrange}>
                    {pPriceBn || `₹${pPrice?.toLocaleString('en-IN')}`}
                  </Text>
                </View>
              </View>

              <View style={styles.successActionCol}>
                <TouchableOpacity
                  style={styles.viewCartOrangeBtn}
                  activeOpacity={0.9}
                  onPress={handleViewCart}
                >
                  <ShoppingCart size={18} color="#FFFFFF" />
                  <Text style={styles.viewCartBtnText}>
                    {isBn ? 'কার্ট দেখুন' : 'View Cart'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.continueShoppingOutlineBtn}
                  activeOpacity={0.8}
                  onPress={handleClose}
                >
                  <Text style={styles.continueShoppingBtnText}>
                    {isBn ? 'কেনাকাটা চালিয়ে যান' : 'Continue Shopping'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>

      <PackageDetailsModal
        visible={!!activeDetailsPkg}
        pkg={activeDetailsPkg}
        onClose={() => setActiveDetailsPkg(null)}
        onSelect={() => {
          if (activeDetailsPkg && onSelectPackage) {
            onSelectPackage(activeDetailsPkg.puja_package_id.toString());
          }
          setActiveDetailsPkg(null);
          setShowPackageDropdown(false);
        }}
        isBn={isBn}
      />
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
    padding: 16,
  },
  modalContainer: {
    width: width - 32,
    backgroundColor: Colors.white,
    borderRadius: 24,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  contentWrap: { flexShrink: 1 },

  // Header matching Screenshot Gradient
  headerBox: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  headerTextCol: { flex: 1, paddingRight: 12, zIndex: 1 },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerTitleLine: {
    width: 48,
    height: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    marginTop: 4,
    marginBottom: 6,
  },
  headerSub: { color: 'rgba(255,255,255,0.9)', fontSize: 13 },
  closeBtnCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },

  bodyScroll: { padding: 18, flexShrink: 1 },

  pujaDetailsCard: {
    backgroundColor: '#FFFDF6',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  pdTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1917',
  },

  // Package Trigger Box matching Screenshot
  packageSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  packageSelectorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1917',
  },
  packageSelectorCount: {
    fontSize: 12,
    color: '#8A7A71',
  },
  dropdownTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 12,
    gap: 12,
  },
  triggerIconSquare: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E8700A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerTextCol: {
    flex: 1,
  },
  selectedLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8A7A71',
    letterSpacing: 0.5,
  },
  triggerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1917',
  },
  triggerPriceText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E8700A',
    marginTop: 2,
  },
  packageSelectorFooter: {
    fontSize: 11,
    color: '#8A7A71',
    marginTop: 6,
  },

  // TRANSPARENT Dropdown Overlay Fix
  dropdownBackdropFix: {
    position: 'absolute',
    top: -200,
    left: -200,
    right: -200,
    bottom: -200,
    backgroundColor: 'transparent',
    zIndex: 15,
  },
  packageDropdownContainer: {
    position: 'absolute',
    top: 76,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 200,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    zIndex: 20,
    overflow: 'hidden',
  },
  dropdownScroll: { paddingVertical: 4 },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemSelected: { backgroundColor: '#FFF8F0' },
  dropdownItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  radioOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: { borderColor: '#E8700A' },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E8700A' },
  dropdownItemName: { fontSize: 13, fontWeight: '600', color: '#1C1917' },
  dropdownItemNameSelected: { color: '#E8700A' },
  dropdownMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  dropdownItemMetaText: { fontSize: 11, color: '#6B7280' },
  dropdownItemPrice: { fontSize: 13, fontWeight: '700', color: '#1C1917' },
  dropdownItemPriceSelected: { color: '#E8700A' },

  // Package Details Section
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1917',
    marginBottom: 10,
  },
  tableRowClean: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableLabelText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  tableValueText: {
    fontSize: 14,
    color: '#1C1917',
    fontWeight: '600',
  },
  totalRowClean: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  totalLabelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1917',
  },
  totalPriceBig: {
    fontSize: 22,
    fontWeight: '800',
    color: '#E8700A',
  },

  secureBoxClean: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 16,
  },
  secureBoxTextClean: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 16,
    flex: 1,
  },

  // Action Buttons matching Screenshot
  actionRowBottom: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelBtnOutline: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  addToCartGradientBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  addToCartBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Steps
  inputLabel: { fontSize: 13, fontWeight: '600', color: BRAND_TEXT, marginBottom: 8 },
  lightLabel: { color: BRAND_MUTED, fontWeight: '400', fontSize: 11 },
  inputBox: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: 12, padding: 14, marginBottom: 16,
    backgroundColor: '#FAF6EF',
  },
  inputBoxActive: { borderColor: Colors.primary, backgroundColor: '#FFFDF6' },
  inputBoxDisabled: { opacity: 0.5 },
  inputText: { fontSize: 14, color: BRAND_TEXT, fontWeight: '500' },
  inputPlaceholder: { color: BRAND_MUTED },
  dropdownIcon: { fontSize: 10, color: BRAND_MUTED },
  dropdownMenu: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#FED7AA', padding: 12, marginBottom: 16 },
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  calArrow: { fontSize: 18, color: '#E8700A', fontWeight: '700', paddingHorizontal: 12 },
  calMonthText: { fontSize: 14, fontWeight: '700', color: '#1C1917' },
  calWeekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  calWeekText: { fontSize: 11, color: '#8A7A71', fontWeight: '600', width: 32, textAlign: 'center' },
  calDaysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDayBox: { width: '14.28%', height: 36, alignItems: 'center', justifyContent: 'center' },
  calDayActive: { backgroundColor: '#E8700A', borderRadius: 18 },
  calDayText: { fontSize: 13, color: '#1C1917', fontWeight: '500' },
  calDayTextActive: { color: '#FFFFFF', fontWeight: '700' },
  calDayPast: { color: '#D1D5DB' },
  summaryBox: { backgroundColor: '#FFF8F0', padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#FED7AA' },
  summaryTitle: { fontSize: 12, fontWeight: '700', color: '#C84400', marginBottom: 4 },
  summaryText: { fontSize: 12, color: '#4B5563', marginBottom: 2 },
  actionRow: { flexDirection: 'row', gap: 12, padding: 16 },
  flex1: { flex: 1 },
  btnPrimary: { backgroundColor: '#E8700A', paddingVertical: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  btnSecondary: { backgroundColor: '#F3F4F6', paddingVertical: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnSecondaryText: { color: '#374151', fontSize: 15, fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },
  // Step SUCCESS Styles matching user screenshot
  successContentWrap: {
    position: 'relative',
    paddingTop: 24,
    paddingBottom: 20,
  },
  successCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  successHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  purpleOmBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  purpleOmText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  yellowCheckCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FDE047',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
    zIndex: 2,
    elevation: 3,
  },
  successTitleOrange: {
    fontSize: 22,
    fontWeight: '700',
    color: '#E8700A',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  successSubText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  successCardClean: {
    backgroundColor: '#FFFDF9',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 18,
    marginBottom: 18,
  },
  scHeaderTag: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E8700A',
    marginBottom: 6,
  },
  scTitleBold: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 2,
  },
  scPackageNameText: {
    fontSize: 13,
    color: '#6B7280',
  },
  scLineDivider: {
    height: 1,
    backgroundColor: '#FED7AA',
    marginVertical: 12,
  },
  scTotalRowClean: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scTotalLabelText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  scTotalValueOrange: {
    fontSize: 20,
    fontWeight: '800',
    color: '#E8700A',
  },
  successActionCol: {
    paddingHorizontal: 20,
    gap: 10,
  },
  viewCartOrangeBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E8700A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  viewCartBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  continueShoppingOutlineBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueShoppingBtnText: {
    color: '#C84400',
    fontSize: 15,
    fontWeight: '600',
  },
  scTotalLabel: { fontSize: 13, color: '#6B7280' },
  scTotalValue: { fontSize: 16, fontWeight: '700', color: '#E8700A' },
  actionCol: { paddingHorizontal: 20, paddingBottom: 20, gap: 10 },
  btnSecondaryOuter: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB' },
});
