import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  TextInput,
  Keyboard,
  Platform,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import CustomTimePickerModal from '../common/CustomTimePickerModal';
import { useAlert } from '../../context/AlertContext';

const { width } = Dimensions.get('window');
const { height: screenHeight } = Dimensions.get('screen');

export interface ScheduleItemPayload {
  package_id: number;
  preferred_date: string;
  preferred_time: string;
  ctzn_address_id?: number;
}

interface SchedulePujasModalProps {
  visible: boolean;
  onClose: () => void;
  cartItems: any[];
  addresses: any[];
  isBn: boolean;
  onConfirmSchedule: (schedules: ScheduleItemPayload[]) => void;
  onAddNewAddress: () => void;
}

export default function SchedulePujasModal({
  visible,
  onClose,
  cartItems,
  addresses,
  isBn,
  onConfirmSchedule,
  onAddNewAddress,
}: SchedulePujasModalProps) {
  const { showAlert } = useAlert();
  const [isSameDay, setIsSameDay] = useState(true);

  // Global Schedule State
  const [globalDate, setGlobalDate] = useState<Date | null>(null);
  const [globalTime, setGlobalTime] = useState<string | null>(null);
  const [globalAddressId, setGlobalAddressId] = useState<string | null>(null);

  // Individual Schedule State
  const [itemSchedules, setItemSchedules] = useState<
    Record<
      string,
      { date: Date | null; time: string | null; addressId: string | null }
    >
  >({});

  // UI States
  const [activeDateDropdown, setActiveDateDropdown] = useState<string | null>(
    null,
  );
  const [activeTimeDropdown, setActiveTimeDropdown] = useState<string | null>(
    null,
  );
  const [activeAddressDropdown, setActiveAddressDropdown] = useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [kbHeight, setKbHeight] = useState(0);

  const [step, setStep] = useState(1);
  const [preparedPayload, setPreparedPayload] = useState<ScheduleItemPayload[]>(
    [],
  );

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, e =>
      setKbHeight(e.endCoordinates.height),
    );
    const hideSub = Keyboard.addListener(hideEvent, () => setKbHeight(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    // Initialize item schedules when cart items change
    const initialSchedules: Record<
      string,
      { date: Date | null; time: string | null; addressId: string | null }
    > = {};
    cartItems.forEach(item => {
      initialSchedules[item.cartItemId] = {
        date: null,
        time: null,
        addressId: null,
      };
    });
    setItemSchedules(initialSchedules);
  }, [cartItems]);

  useEffect(() => {
    if (!visible) {
      setActiveDateDropdown(null);
      setActiveTimeDropdown(null);
      setActiveAddressDropdown(null);
      setSearchQuery('');
      setStep(1);

      // Clear all selection data when modal is closed
      setGlobalDate(null);
      setGlobalTime(null);
      setGlobalAddressId(null);
      setPreparedPayload([]);
      setCurrentMonth(new Date());

      // Reset individual schedules
      const initialSchedules: Record<
        string,
        { date: Date | null; time: string | null; addressId: string | null }
      > = {};
      cartItems.forEach(item => {
        initialSchedules[item.cartItemId] = {
          date: null,
          time: null,
          addressId: null,
        };
      });
      setItemSchedules(initialSchedules);
    }
  }, [visible, cartItems]);

  useEffect(() => {
    // Reset search query when dropdown changes
    if (!activeAddressDropdown) {
      setSearchQuery('');
    }
  }, [activeAddressDropdown]);

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
    if (!d) return 'mm/dd/yyyy';
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
      if (!globalDate || !globalTime || !globalAddressId) return;
      cartItems.forEach(item => {
        payload.push({
          package_id: item.packageId || 0,
          preferred_date: formatPayloadDate(globalDate),
          preferred_time: formatPayloadTime(globalTime),
          ctzn_address_id: parseInt(globalAddressId, 10),
        });
      });
    } else {
      for (const item of cartItems) {
        const sched = itemSchedules[item.cartItemId];
        if (!sched || !sched.date || !sched.time || !sched.addressId) return;
        payload.push({
          package_id: item.packageId || 0,
          preferred_date: formatPayloadDate(sched.date),
          preferred_time: formatPayloadTime(sched.time),
          ctzn_address_id: parseInt(sched.addressId, 10),
        });
      }
    }

    if (step === 1) {
      setPreparedPayload(payload);
      setStep(2);
    } else {
      onConfirmSchedule(preparedPayload);
    }
  };

  const isFormValid = () => {
    if (step === 2) return true;
    if (isSameDay) return !!(globalDate && globalTime && globalAddressId);
    return cartItems.every(
      item =>
        itemSchedules[item.cartItemId]?.date &&
        itemSchedules[item.cartItemId]?.time &&
        itemSchedules[item.cartItemId]?.addressId,
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

  const renderAddressSelection = (
    id: string,
    selectedId: string | null,
    onSelect: (addrId: string) => void,
  ) => {
    if (!addresses || addresses.length === 0) {
      return (
        <View style={styles.dropdownMenu}>
          <Text style={styles.noAddressInfo}>
            {isBn
              ? 'কোনো সংরক্ষিত ঠিকানা নেই। অনুগ্রহ করে প্রথমে একটি যোগ করুন।'
              : 'No saved address found. Please add one first.'}
          </Text>
          <TouchableOpacity
            style={styles.addAddressInlineBtn}
            onPress={() => {
              onClose();
              onAddNewAddress();
            }}
          >
            <Text style={styles.addAddressInlineText}>
              + {isBn ? 'নতুন ঠিকানা যোগ করুন' : 'Add New Address'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    const q = searchQuery.toLowerCase();
    const filteredAddresses = addresses.filter(
      addr =>
        (addr.contactName && addr.contactName.toLowerCase().includes(q)) ||
        (addr.addressLine1 && addr.addressLine1.toLowerCase().includes(q)) ||
        (addr.city && addr.city.toLowerCase().includes(q)),
    );

    return (
      <View style={[styles.dropdownMenu, styles.addressDropdownMax]}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={
              isBn
                ? 'নাম বা ঠিকানা দিয়ে খুঁজুন...'
                : 'Search by name or address...'
            }
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          {filteredAddresses.length === 0 ? (
            <Text style={[styles.noAddressInfo, styles.noAddressInfoSearch]}>
              {isBn ? 'কোনো ফলাফল পাওয়া যায়নি' : 'No results found'}
            </Text>
          ) : (
            filteredAddresses.map(addr => {
              const isSelected = selectedId === addr.id;
              return (
                <TouchableOpacity
                  key={addr.id}
                  style={[
                    styles.addrOptionCard,
                    isSelected && styles.addrOptionActive,
                  ]}
                  onPress={() => {
                    onSelect(addr.id);
                    setActiveAddressDropdown(null);
                  }}
                >
                  <View style={styles.addrOptionHeader}>
                    <Text style={styles.addrIcon}>
                      {addr.type === 'Home'
                        ? '🏠'
                        : addr.type === 'Work'
                        ? '💼'
                        : '📍'}
                    </Text>
                    <View style={styles.addrTextContainer}>
                      <Text style={styles.addrName} numberOfLines={1}>
                        {addr.contactName}
                      </Text>
                      <Text style={styles.addrDetail} numberOfLines={2}>
                        {addr.addressLine1}, {addr.city}
                      </Text>
                    </View>
                    {isSelected && <Text style={styles.checkIcon}>✅</Text>}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    );
  };

  const renderAddressDisplay = (addrId: string | null) => {
    if (!addrId)
      return isBn
        ? 'একটি ডেলিভারি ঠিকানা চয়ন করুন'
        : 'Select a delivery address';
    const found = addresses?.find((a: any) => a.id === addrId);
    if (!found) return 'Address not found';
    return `${found.type === 'Home' ? '🏠' : '📍'} ${found.addressLine1}, ${
      found.city
    }`;
  };

  const handleApplySameAddressToAll = () => {
    if (cartItems.length <= 1) return;
    const modelItem = cartItems[0];
    const addressToCopy = itemSchedules[modelItem.cartItemId]?.addressId;
    if (!addressToCopy) {
      showAlert({
        title: isBn ? 'দয়া করে নির্বাচন করুন' : 'Please select',
        message: isBn
          ? 'প্রথমে প্রথম আইটেমের জন্য একটি ঠিকানা নির্বাচন করুন।'
          : 'Please select an address for the first item first.',
      });
      return;
    }

    setItemSchedules(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(itemId => {
        next[itemId] = { ...next[itemId], addressId: addressToCopy };
      });
      return next;
    });
  };

  const renderReviewStep = () => {
    return (
      <View style={styles.reviewContainer}>
        <View style={styles.reviewHeaderRow}>
          <Text style={styles.reviewMainTitle}>
            {isBn ? 'আপনার সময়সূচী পর্যালোচনা করুন' : 'Review Your Schedule'}
          </Text>
          <Text style={styles.reviewSubTitle}>
            {isBn
              ? 'নিশ্চিত করার আগে আপনার বিবরণ চেক করুন'
              : 'Please check your details before confirming'}
          </Text>
        </View>

        <View style={styles.reviewSummaryBanner}>
          <Text style={styles.reviewSummaryBannerIcon}>🛒</Text>
          <Text style={styles.reviewSummaryBannerText}>
            {isBn ? 'মোট' : 'TOTAL'} {cartItems.length}{' '}
            {isBn ? 'টি পূজা নির্ধারণ করা হয়েছে' : 'PUJAS SCHEDULED'}
          </Text>
        </View>

        {cartItems.map((item, idx) => {
          const sched = preparedPayload[idx];
          if (!sched) return null;
          const address = addresses.find(
            a => a.id.toString() === sched.ctzn_address_id?.toString(),
          );

          return (
            <View key={item.cartItemId} style={styles.reviewCard}>
              <View style={styles.reviewCardAccent} />
              <View style={styles.reviewCardMain}>
                <Image
                  source={{
                    uri: item.packageImage || 'https://via.placeholder.com/60',
                  }}
                  style={styles.reviewPkgImage}
                />
                <View style={styles.reviewInfoRight}>
                  <Text style={styles.reviewItemTitle} numberOfLines={2}>
                    {isBn ? item.titleBn : item.titleEn}
                  </Text>
                  <View style={styles.reviewStatusPill}>
                    <Text style={styles.reviewStatusPillText}>
                      {isBn ? 'শিডিউলড' : 'SCHEDULED'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.reviewSectionDivider} />

              <View style={styles.reviewDetailsGrid}>
                <View style={styles.reviewDetailItem}>
                  <Text style={styles.reviewLabel}>
                    📅 {isBn ? 'তারিখ' : 'DATE'}
                  </Text>
                  <Text style={styles.reviewValue}>{sched.preferred_date}</Text>
                </View>
                <View style={styles.reviewSeparatorCol} />
                <View style={styles.reviewDetailItem}>
                  <Text style={styles.reviewLabel}>
                    🕒 {isBn ? 'সময়' : 'TIME'}
                  </Text>
                  <Text style={styles.reviewValue}>{sched.preferred_time}</Text>
                </View>
              </View>

              <View style={styles.reviewAddrGroup}>
                <Text style={styles.reviewLabel}>
                  📍 {isBn ? 'ডেলিভারি ঠিকানা' : 'DELIVERY ADDRESS'}
                </Text>
                <View style={styles.reviewAddrContent}>
                  <Text style={styles.reviewAddrType}>
                    {address?.type?.toUpperCase() || 'ADDRESS'}
                  </Text>
                  <Text style={styles.reviewAddrText} numberOfLines={2}>
                    {address?.addressLine1}, {address?.city}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
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
              <Text style={styles.stepText}>STEP {step} OF 2</Text>
            </View>
            <View style={styles.headerTitleRow}>
              {step === 2 && (
                <TouchableOpacity
                  onPress={() => setStep(1)}
                  style={styles.backBtn}
                >
                  <Text style={styles.backBtnText}>⬅️</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.headerIcon}>{step === 1 ? '📅' : '📋'}</Text>
              <Text style={styles.headerTitle}>
                {step === 1
                  ? isBn
                    ? 'আপনার পূজা নির্ধারণ করুন'
                    : 'Schedule Your Pujas'
                  : isBn
                  ? 'শিডিউল রিভিউ'
                  : 'Review Schedule'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={
              kbHeight > 0
                ? styles.bodyScrollKeyboard
                : styles.bodyScrollContent
            }
            showsVerticalScrollIndicator={false}
          >
            {step === 1 ? (
              <>
                {cartItems.length > 1 && (
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
                )}

                {isSameDay || cartItems.length === 1 ? (
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
                        activeDateDropdown === 'GLOBAL' &&
                          styles.inputBoxActive,
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
                      <Text style={styles.lightLabel}>
                        (select a date first)
                      </Text>
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.inputBox,
                        activeTimeDropdown === 'GLOBAL' &&
                          styles.inputBoxActive,
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

                    <Text style={styles.inputLabel}>
                      📍 {isBn ? 'ডেলিভারি ঠিকানা' : 'Delivery Address'}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.inputBox,
                        activeAddressDropdown === 'GLOBAL' &&
                          styles.inputBoxActive,
                      ]}
                      onPress={() =>
                        setActiveAddressDropdown(
                          activeAddressDropdown === 'GLOBAL' ? null : 'GLOBAL',
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.inputText,
                          !globalAddressId && styles.inputPlaceholder,
                        ]}
                        numberOfLines={1}
                      >
                        {renderAddressDisplay(globalAddressId)}
                      </Text>
                      <Text style={styles.dropdownIcon}>▼</Text>
                    </TouchableOpacity>

                    {activeAddressDropdown === 'GLOBAL' &&
                      renderAddressSelection(
                        'GLOBAL',
                        globalAddressId,
                        addrId => setGlobalAddressId(addrId),
                      )}
                  </View>
                ) : (
                  <View style={styles.multiMatchContainer}>
                    <TouchableOpacity
                      style={styles.applySameBox}
                      onPress={handleApplySameAddressToAll}
                    >
                      <Text style={styles.applySameIcon}>📋</Text>
                      <Text style={styles.applySameText}>
                        {isBn
                          ? 'সবগুলোর জন্য প্রথম আইটেমের ঠিকানা ব্যবহার করুন'
                          : 'Use first item address for all'}
                      </Text>
                    </TouchableOpacity>

                    {cartItems.map(item => {
                      const id = item.cartItemId;
                      const itemState = itemSchedules[id] || {};

                      return (
                        <View key={id} style={styles.scheduleCard}>
                          <View style={styles.itemHeader}>
                            <Image
                              source={{
                                uri:
                                  item.packageImage ||
                                  'https://via.placeholder.com/50',
                              }}
                              style={styles.pkgImage}
                            />
                            <Text style={styles.itemTitle} numberOfLines={1}>
                              {isBn ? item.titleBn : item.titleEn}
                            </Text>
                          </View>

                          <Text style={styles.inputLabel}>
                            📅 {isBn ? 'তারিখ' : 'Date'}
                          </Text>
                          <TouchableOpacity
                            style={[
                              styles.inputBox,
                              activeDateDropdown === id &&
                                styles.inputBoxActive,
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
                            renderCalendar(id, itemState.date, d => {
                              setItemSchedules(prev => ({
                                ...prev,
                                [id]: { ...prev[id], date: d },
                              }));
                            })}

                          <Text style={styles.inputLabel}>
                            🕒 {isBn ? 'সময়' : 'Time'}
                          </Text>
                          <TouchableOpacity
                            style={[
                              styles.inputBox,
                              activeTimeDropdown === id &&
                                styles.inputBoxActive,
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
                                (isBn ? 'সময় চয়ন করুন' : 'Select time')}
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

                          <Text style={styles.inputLabel}>
                            📍 {isBn ? 'ঠিকানা' : 'Address'}
                          </Text>
                          <TouchableOpacity
                            style={[
                              styles.inputBox,
                              activeAddressDropdown === id &&
                                styles.inputBoxActive,
                            ]}
                            onPress={() =>
                              setActiveAddressDropdown(
                                activeAddressDropdown === id ? null : id,
                              )
                            }
                          >
                            <Text
                              style={[
                                styles.inputText,
                                !itemState.addressId && styles.inputPlaceholder,
                              ]}
                              numberOfLines={1}
                            >
                              {renderAddressDisplay(itemState.addressId)}
                            </Text>
                            <Text style={styles.dropdownIcon}>▼</Text>
                          </TouchableOpacity>

                          {activeAddressDropdown === id &&
                            renderAddressSelection(
                              id,
                              itemState.addressId,
                              addrId => {
                                setItemSchedules(prev => ({
                                  ...prev,
                                  [id]: { ...prev[id], addressId: addrId },
                                }));
                              },
                            )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </>
            ) : (
              renderReviewStep()
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
                {step === 1 ? '✨ ' : '✅ '}
                {step === 1
                  ? isBn
                    ? 'সূচি নিশ্চিত করুন এবং অর্ডার পর্যালোচনা করুন'
                    : 'Confirm Schedule & Review Order'
                  : isBn
                  ? 'সব কিছু ঠিক আছে, অর্ডার নিশ্চিত করুন'
                  : 'Everything looks good, Confirm Order'}
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: screenHeight,
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
    maxHeight: screenHeight * 0.85,
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
  firstItemBadge: {
    position: 'absolute',
    top: -12,
    left: -12,
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 1,
  },
  firstItemBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '800',
  },
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
  calDayPast: { color: Colors.textMuted, opacity: 0.6 },

  // Address selection styles
  addrOptionCard: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ultraLightGray,
  },
  addrOptionActive: {
    backgroundColor: Colors.lightOrange,
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  addrOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addrTextContainer: { flex: 1, marginLeft: 8 },
  addrIcon: { fontSize: 18 },
  addrName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMain,
  },
  addrDetail: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 14,
    marginTop: 2,
  },
  checkIcon: {
    fontSize: 14,
    marginLeft: 8,
  },
  noAddressInfo: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 8,
  },
  addAddressInlineBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  addAddressInlineText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  applySameBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  applySameBoxMargin: { marginBottom: 16 },
  applySameIcon: { fontSize: 16, marginRight: 8 },
  applySameText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  addressDropdownMax: {
    maxHeight: 250,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderColor: Colors.ultraLightGray,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 13,
    color: Colors.textMain,
  },
  noAddressInfoSearch: {
    marginTop: 16,
  },
  bodyScrollContent: {
    paddingBottom: 20,
  },
  bodyScrollKeyboard: {
    paddingBottom: 200,
  },
  reviewContainer: { paddingHorizontal: 20, paddingTop: 12 },
  reviewHeaderRow: { marginBottom: 16 },
  reviewMainTitle: { fontSize: 18, fontWeight: '800', color: Colors.textMain },
  reviewSubTitle: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  reviewCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 3,
    shadowColor: Colors.black,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
  },
  reviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ultraLightGray,
    paddingBottom: 8,
  },
  blueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
    marginRight: 8,
  },
  reviewItemTitle: { fontSize: 14, fontWeight: '700', color: Colors.textMain },
  reviewGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  reviewInfoItem: { flex: 1 },
  reviewLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  reviewValue: {
    fontSize: 13,
    color: Colors.textMain,
    fontWeight: '600',
    marginTop: 2,
  },
  reviewAddrBox: {
    backgroundColor: Colors.extraLightWarm || '#FDFBF7',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  reviewAddrType: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '800',
    marginBottom: 2,
  },
  backBtn: { marginRight: 12, padding: 4 },
  backBtnText: { fontSize: 18 },
  reviewCardMain: { flexDirection: 'row', alignItems: 'center' },
  reviewPkgImage: { width: 52, height: 52, borderRadius: 10, marginRight: 12 },
  reviewInfoRight: { flex: 1 },
  reviewStatusPill: {
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  reviewStatusPillText: {
    fontSize: 9,
    color: '#3B82F6',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  reviewSectionDivider: {
    height: 1.5,
    backgroundColor: Colors.extraLightWarm || '#FDFBF7',
    marginVertical: 12,
  },
  reviewDetailsGrid: { flexDirection: 'row', alignItems: 'center' },
  reviewDetailItem: { flex: 1 },
  reviewSeparatorCol: {
    width: 1,
    height: 20,
    backgroundColor: Colors.ultraLightGray,
    marginHorizontal: 12,
  },
  reviewAddrGroup: { marginTop: 12 },
  reviewAddrContent: {
    marginTop: 6,
    padding: 10,
    backgroundColor: Colors.extraLightWarm || '#FDFBF7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.ultraLightGray,
  },
  reviewAddrText: {
    fontSize: 13,
    color: Colors.textMain,
    lineHeight: 18,
    fontWeight: '600',
  },
  multiMatchContainer: {
    paddingBottom: 20,
  },
  reviewSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  reviewCountBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reviewCountText: { color: Colors.white, fontSize: 10, fontWeight: '800' },
  reviewCardAccent: {
    position: 'absolute',
    left: 0,
    top: 16,
    bottom: 16,
    width: 4,
    backgroundColor: Colors.primary,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  reviewSummaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  reviewSummaryBannerIcon: { fontSize: 16, marginRight: 8 },
  reviewSummaryBannerText: {
    color: '#92400E',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
