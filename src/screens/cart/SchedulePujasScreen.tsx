/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  StatusBar,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Colors } from '../../constants/Colors';
import { useAlert } from '../../context/AlertContext';
import LinearGradient from 'react-native-linear-gradient';
import {
  ShieldCheck,
  Shield,
  ChevronRight,
  Check,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Receipt,
  CheckCircle2,
  Users,
  ShoppingCart,
  CreditCard,
} from 'lucide-react-native';
import TopNavBar from '../../components/common/TopNavBar';
import { useFocusEffect } from '@react-navigation/native';
import { useGetAddressesQuery } from '../../store/api/pujaApi';

export interface ScheduleItemPayload {
  package_id: number;
  preferred_date: string;
  preferred_time: string;
  ctzn_address_id?: number;
  special_instruction?: string;
}

export default function SchedulePujasScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { i18n } = useTranslation();
  const isBn = i18n.language === 'bn';
  const user = useSelector((state: RootState) => state.auth.user);
  const paramAddresses = route.params?.addresses || [];
  const { cartItems = [] } = route.params || {};

  const subtotal = React.useMemo(() => {
    return cartItems.reduce((acc: number, item: any) => {
      const price = Number(item.price) || 1501;
      return acc + price;
    }, 0);
  }, [cartItems]);

  const platformFee = 17.8;
  const gst = 3.2;
  const grandTotal = subtotal + platformFee + gst;
  const payOnlineAmount = 21;
  const cashOnDeliveryAmount = grandTotal > 21 ? grandTotal - 21 : 0;

  const { data: serverAddressesData, refetch: refetchAddresses } = useGetAddressesQuery(
    { userId: user?.user_id || 0, pageNo: 1, pageSize: 50 },
    { skip: !user?.user_id, refetchOnMountOrArgChange: true },
  );

  useFocusEffect(
    React.useCallback(() => {
      if (user?.user_id) {
        refetchAddresses();
      }
    }, [user?.user_id, refetchAddresses]),
  );

  const addresses = React.useMemo(() => {
    let list: any[] = [...paramAddresses];

    if (serverAddressesData) {
      const citizen = serverAddressesData.citizen_info || serverAddressesData.citizen;
      if (citizen && Array.isArray(citizen.address_list)) {
        const selfAddrs = citizen.address_list
          .filter((a: any) => a && (a.address || a.street))
          .map((a: any, idx: number) => {
            const stableId = (a.address_id || a.ctzn_address_id || a.in_ctzn_address_id || a.id || `self_${idx}_${a.pincode || ''}`).toString();
            return {
              id: stableId,
              address_id: (a.address_id || a.ctzn_address_id || a.in_ctzn_address_id || stableId).toString(),
              ctzn_address_id: (a.address_id || a.ctzn_address_id || a.in_ctzn_address_id || stableId).toString(),
              type: a.address_type || a.address_type_name || a.label || 'Home',
              label: a.label || a.address_type || '',
              contactName: citizen.full_name || '',
              contactNumber: a.delivery_contact_no || citizen.phone || '',
              relationType: 'Self',
              addressLine1: a.address || a.street || '',
              streetArea: a.street || '',
              landmark: a.landmark || '',
              city: a.city || '',
              state: a.state_name || a.state || '',
              pincode: a.pincode || '',
              isDefault: a.is_default === 1 || a.is_default === true || a.is_default === '1',
            };
          });
        list = [...list, ...selfAddrs];
      }
      if (Array.isArray(serverAddressesData.relative_info)) {
        serverAddressesData.relative_info.forEach((rel: any, relIdx: number) => {
          if (Array.isArray(rel.address_list)) {
            const relAddrs = rel.address_list
              .filter((a: any) => a && (a.address || a.street))
              .map((a: any, idx: number) => {
                const stableId = (a.address_id || a.ctzn_address_id || a.in_ctzn_address_id || a.id || `rel_${relIdx}_${idx}_${a.pincode || ''}`).toString();
                return {
                  id: stableId,
                  address_id: (a.address_id || a.ctzn_address_id || a.in_ctzn_address_id || stableId).toString(),
                  ctzn_address_id: (a.address_id || a.ctzn_address_id || a.in_ctzn_address_id || stableId).toString(),
                  type: a.address_type || a.address_type_name || a.label || 'Home',
                  label: a.label || a.address_type || '',
                  contactName: rel.full_name || '',
                  contactNumber: a.delivery_contact_no || rel.phone || '',
                  relationType: 'Relative',
                  addressLine1: a.address || a.street || '',
                  streetArea: a.street || '',
                  landmark: a.landmark || '',
                  city: a.city || '',
                  state: a.state_name || a.state || '',
                  pincode: a.pincode || '',
                  isDefault: a.is_default === 1 || a.is_default === true || a.is_default === '1',
                };
              });
            list = [...list, ...relAddrs];
          }
        });
      }
    }

    const uniqueMap = new Map();
    list.forEach(a => {
      const key = (a.id || a.ctzn_address_id || a.address_id)?.toString();
      if (key && !uniqueMap.has(key)) {
        uniqueMap.set(key, a);
      }
    });

    return Array.from(uniqueMap.values());
  }, [serverAddressesData, paramAddresses]);

  const [itemSchedules, setItemSchedules] = useState<
    Record<string, { date: Date | null; time: string | null; addressId: string | null; showInstructions: boolean; instructions: string }>
  >({});

  const [syncDateTime, setSyncDateTime] = useState(true);
  const [syncAddress, setSyncAddress] = useState(true);

  // DateTimePicker
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [pickerTarget, setPickerTarget] = useState<string | null>(null);

  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [pendingAddressTarget, setPendingAddressTarget] = useState<string | null>(null);
  const [activeAddressTab, setActiveAddressTab] = useState<'Self' | 'Relative'>('Self');

  const [step, setStep] = useState(1);
  const [preparedPayload, setPreparedPayload] = useState<ScheduleItemPayload[]>([]);

  useEffect(() => {
    if (!addresses || addresses.length === 0) return;
    const defaultAddr = addresses.find((a: any) => a.isDefault || a.is_default || a.is_default_address) || addresses[0];
    const defaultAddrId = defaultAddr ? (defaultAddr.id || defaultAddr.ctzn_address_id || defaultAddr.address_id)?.toString() : null;

    setItemSchedules(prev => {
      const updated = { ...prev };
      cartItems.forEach((item: any) => {
        const existing = updated[item.cartItemId];
        const chosenAddrId = existing?.addressId || null;
        updated[item.cartItemId] = {
          date: existing?.date || null,
          time: existing?.time || null,
          addressId: chosenAddrId,
          showInstructions: existing?.showInstructions || false,
          instructions: existing?.instructions || '',
        };
      });
      return updated;
    });
  }, [cartItems, addresses]);

  const formatDate = (d: Date | null) => {
    if (!d) return 'mm/dd/yyyy';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const formatPayloadDate = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

  const formatTime12h = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = String(minutes).padStart(2, '0');
    return `${hours}:${minutesStr} ${ampm}`;
  };

  const renderAddressDisplay = (addrId: string | null) => {
    if (!addrId) return isBn ? 'একটি ডেলিভারি ঠিকানা চয়ন করুন' : 'Select a delivery address';
    const found = addresses?.find(
      (a: any) =>
        a.id?.toString() === addrId?.toString() ||
        a.ctzn_address_id?.toString() === addrId?.toString() ||
        a.address_id?.toString() === addrId?.toString()
    );
    if (!found) return '🏠 Home — Address Selected';
    
    const rawType = found.type || found.label || 'Home';
    const icon = rawType.toLowerCase().includes('home') ? '🏠' : rawType.toLowerCase().includes('office') || rawType.toLowerCase().includes('work') ? '💼' : '📍';
    const typeLabel = rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase();
    const city = found.city || found.state || '';
    const pin = found.pincode ? ` — ${found.pincode}` : '';

    return `${icon} ${typeLabel}${city ? ', ' + city : ''}${pin}`;
  };

  // Picker की वैल्यू बदलने पर हैंडलर
  const onChangePicker = (event: any, selectedValue?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedValue) {
      if (pickerMode === 'date') {
        if (pickerTarget) {
          setItemSchedules(prev => {
            const newSchedules = { ...prev };
            if (syncDateTime) {
              Object.keys(newSchedules).forEach(id => {
                newSchedules[id] = { ...newSchedules[id], date: selectedValue };
              });
            } else {
              newSchedules[pickerTarget] = { ...newSchedules[pickerTarget], date: selectedValue };
            }
            return newSchedules;
          });
        }
      } else {
        const timeString = formatTime12h(selectedValue);
        if (pickerTarget) {
          setItemSchedules(prev => {
            const newSchedules = { ...prev };
            if (syncDateTime) {
              Object.keys(newSchedules).forEach(id => {
                newSchedules[id] = { ...newSchedules[id], time: timeString };
              });
            } else {
              newSchedules[pickerTarget] = { ...newSchedules[pickerTarget], time: timeString };
            }
            return newSchedules;
          });
        }
      }
    }
  };

  const handleConfirm = () => {
    const payload: ScheduleItemPayload[] = [];
    for (const item of cartItems) {
      const sched = itemSchedules[item.cartItemId];
      if (!sched || !sched.addressId) {
        showAlert({
          title: isBn ? 'ডিফল্ট ঠিকানা দরকার' : 'Default Address Missing',
          message: isBn
            ? 'আপনি একটি ডিফল্ট ঠিকানা নির্বাচন করেননি। পেমেন্টে এগিয়ে যাওয়ার আগে একটি বিতরণ ঠিকানা নির্বাচন করুন।'
            : 'You have not selected a default delivery address. Please select or add an address before proceeding to payment.',
        });
        return;
      }
      if (!sched.date || !sched.time) {
        showAlert({
          title: isBn ? 'তারিখ ও সময় দরকার' : 'Date & Time Required',
          message: isBn
            ? 'দয়া করে প্রতিটি পূজার জন্য তারিখ এবং সময় নির্দেশ করুন।'
            : 'Please select a preferred date and time for each puja before proceeding to payment.',
        });
        return;
      }
      payload.push({
        package_id: item.packageId || 0,
        preferred_date: formatPayloadDate(sched.date),
        preferred_time: formatPayloadTime(sched.time),
        ctzn_address_id: parseInt(sched.addressId, 10),
        special_instruction: sched.showInstructions && sched.instructions ? sched.instructions : undefined,
      });
    }

    // Skip Step 2 and immediately go to CartTab for payment
    navigation.navigate('MainTabs', {
      screen: 'CartTab',
      params: { confirmedSchedules: payload },
    });
  };

  const isFormValid = () => {
    if (step === 2) return true;
    return cartItems.every((item: any) => {
      const s = itemSchedules[item.cartItemId];
      return s?.date && s?.time && s?.addressId;
    });
  };

  const renderReviewStep = () => (
    <View style={styles.reviewContainer}>
      <View style={styles.reviewHeaderRow}>
        <Text style={styles.reviewMainTitle}>{isBn ? 'আপনার সময়সূচী পর্যালোচনা করুন' : 'Review Your Schedule'}</Text>
        <Text style={styles.reviewSubTitle}>{isBn ? 'নিশ্চিত করার আগে আপনার বিবরণ চেক করুন' : 'Please check your details before confirming'}</Text>
      </View>
      <View style={styles.reviewSummaryBanner}>
        <Text style={styles.reviewSummaryBannerIcon}>🛒</Text>
        <Text style={styles.reviewSummaryBannerText}>
          {isBn ? 'মোট' : 'TOTAL'} {cartItems.length} {isBn ? 'টি পূজা নির্ধারণ করা হয়েছে' : 'PUJAS SCHEDULED'}
        </Text>
      </View>
      {cartItems.map((item: any, idx: number) => {
        const sched = preparedPayload[idx];
        if (!sched) return null;
        const address = addresses.find((a: any) => a.id.toString() === sched.ctzn_address_id?.toString());
        return (
          <View key={item.cartItemId} style={styles.reviewCard}>
            <View style={styles.reviewCardMain}>
              <Image source={{ uri: item.packageImage || item.imagePlaceholder || 'https://via.placeholder.com/60' }} style={styles.reviewPkgImage} />
              <View style={styles.reviewInfoRight}>
                <Text style={styles.reviewItemTitle} numberOfLines={2}>{isBn ? item.titleBn : item.titleEn}</Text>
                <View style={styles.reviewStatusPill}>
                  <Text style={styles.reviewStatusPillText}>{isBn ? 'শিডিউলড' : 'SCHEDULED'}</Text>
                </View>
              </View>
            </View>
            <View style={styles.reviewSectionDivider} />
            <View style={styles.reviewDetailsGrid}>
              <View style={styles.reviewDetailItem}>
                <Text style={styles.reviewLabel}>📅 {isBn ? 'তারিখ' : 'DATE'}</Text>
                <Text style={styles.reviewValue}>{sched.preferred_date}</Text>
              </View>
              <View style={styles.reviewSeparatorCol} />
              <View style={styles.reviewDetailItem}>
                <Text style={styles.reviewLabel}>🕒 {isBn ? 'সময়' : 'TIME'}</Text>
                <Text style={styles.reviewValue}>{sched.preferred_time}</Text>
              </View>
            </View>
            <View style={styles.reviewAddrGroup}>
              <Text style={styles.reviewLabel}>📍 {isBn ? 'ডেলিভারি ঠিকানা' : 'DELIVERY ADDRESS'}</Text>
              <View style={styles.reviewAddrContent}>
                <Text style={styles.reviewAddrType}>{address?.type?.toUpperCase() || 'ADDRESS'}</Text>
                <Text style={styles.reviewAddrText} numberOfLines={2}>{address?.addressLine1}, {address?.city}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );



  const namesList = cartItems.map((i: any) => (isBn ? i.titleBn : i.titleEn)).join(', ').toUpperCase();

  // DateTimePicker से संबंधित रेंडर फंक्शन (iOS के लिए सपोर्टिव मोडल के साथ)
  const renderDatePicker = () => {
    if (!showPicker) return null;

    const pickerValue = pickerMode === 'date'
      ? (itemSchedules[pickerTarget || '']?.date || new Date())
      : new Date();

    const today = new Date();
    today.setHours(0, 0, 0, 0); // To prevent crash if pickerValue is slightly before minimumDate
    const maxDate = new Date(2026, 5, 30); // 30 June 2026

    const pickerComponent = (
      <DateTimePicker
        value={pickerValue}
        mode={pickerMode}
        is24Hour={false}
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        onChange={onChangePicker}
      />
    );

    if (Platform.OS === 'ios') {
      return (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showPicker}
          onRequestClose={() => setShowPicker(false)}>
          <View style={styles.iosPickerContainer}>
            <View style={styles.iosPickerHeader}>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.iosPickerDoneText}>{isBn ? 'সম্পন্ন' : 'Done'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.iosPickerBody}>
              {pickerComponent}
            </View>
          </View>
        </Modal>
      );
    }

    return pickerComponent;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.extraLightWarm }} edges={['bottom']}>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />
      <TopNavBar showBack={true} />

      {/* Body ScrollView (Whole Page Scrolls Together!) */}
      <ScrollView
        style={styles.bodyScroll}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: Math.max(140, insets.bottom + 100),
        }}
        showsVerticalScrollIndicator={false}>
        {step === 1 ? (
          <View>
            {/* Top Header Inside ScrollView */}
            <View style={styles.newHeaderBox}>
              {/* Stepper */}
              <View style={styles.stepperWrapper}>
                <View style={styles.stepperNode}>
                  <View style={styles.stepCircleInactive}>
                    <ShoppingCart color="#9CA3AF" size={16} />
                  </View>
                  <Text style={styles.stepLabelInactive}>Cart</Text>
                </View>
                <View style={styles.stepLineInactive} />

                <View style={styles.stepperNode}>
                  <View style={styles.stepCircleActiveOuter}>
                    <View style={styles.stepCircleActiveInner}>
                      <Calendar color="#FFFFFF" size={16} />
                    </View>
                  </View>
                  <Text style={styles.stepLabelActive}>Schedule</Text>
                </View>
                <View style={styles.stepLineInactive} />

                <View style={styles.stepperNode}>
                  <View style={styles.stepCircleInactive}>
                    <CreditCard color="#D1D5DB" size={16} />
                  </View>
                  <Text style={styles.stepLabelInactive}>Payment</Text>
                </View>
              </View>

              {/* Header Title Section */}
              <View style={styles.headerTitleSection}>
                <View style={styles.headerTextWrapper}>
                  <Text style={styles.stepCountText}>STEP 2 OF 3</Text>
                  <Text style={styles.mainHeading}>Schedule your puja</Text>
                  <Text style={styles.subHeading}>Choose when and where you would like the ceremony performed.</Text>
                </View>
              </View>
            </View>
            {/* Section 1: DATE & TIME */}
            <View style={styles.sectionDividerRow}>
              <Calendar size={18} color="#C84400" style={{ marginRight: 8 }} />
              <Text style={styles.sectionDividerText}>{isBn ? 'তারিখ ও সময়' : 'DATE & TIME'}</Text>
              <View style={styles.sectionLineFull} />
            </View>

            {(() => {
              const firstId = cartItems[0]?.cartItemId;
              const firstState = itemSchedules[firstId] || {};

              return (
                <View style={styles.sectionCardWhite}>
                  <Text style={styles.goldLabel}>📅 {isBn ? 'শুভ তারিখ' : 'AUSPICIOUS DATE'}</Text>
                  <TouchableOpacity
                    style={[styles.pillInput, showPicker && pickerTarget === firstId && pickerMode === 'date' && styles.pillInputActive]}
                    onPress={() => {
                      setPickerTarget(firstId);
                      setPickerMode('date');
                      setShowPicker(true);
                    }}>
                    <Calendar size={20} color="#EA580C" style={{ marginRight: 12 }} />
                    <Text style={[styles.pillInputText, !firstState.date && styles.pillInputPlaceholder]}>
                      {firstState.date ? formatDate(firstState.date) : (isBn ? 'পছন্দের তারিখ নির্বাচন করুন' : 'Select preferred date')}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.dateAvailableHelperText}>
                    Available from 27 Aug to 20 Nov 2026
                  </Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, marginBottom: 8 }}>
                    <Text style={[styles.greyLabel, !firstState.date && { opacity: 0.7 }]}>
                      ⏱ {isBn ? 'পছন্দের সময়' : 'PREFERRED TIME'}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '500' }}>
                      {isBn ? 'প্রথমে তারিখ নির্বাচন করুন' : 'Select a date first'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.pillInput, showPicker && pickerTarget === firstId && pickerMode === 'time' && styles.pillInputActive, !firstState.date && styles.pillInputDisabled]}
                    disabled={!firstState.date}
                    onPress={() => {
                      setPickerTarget(firstId);
                      setPickerMode('time');
                      setShowPicker(true);
                    }}>
                    <Clock size={20} color={firstState.date ? "#EA580C" : "#9CA3AF"} style={{ marginRight: 12 }} />
                    <Text style={[styles.pillInputText, !firstState.time && styles.pillInputPlaceholder]}>
                      {firstState.time || (isBn ? 'পছন্দের সময় নির্বাচন করুন' : 'Select preferred time')}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })()}

            {/* Section 2: PUJA LOCATION */}
            <View style={styles.sectionDividerRow}>
              <MapPin size={18} color="#C84400" style={{ marginRight: 8 }} />
              <Text style={styles.sectionDividerText}>{isBn ? 'পূজা লোকেশন' : 'PUJA LOCATION'}</Text>
              <View style={styles.sectionLineFull} />
            </View>

            {(() => {
              const firstId = cartItems[0]?.cartItemId;
              const firstState = itemSchedules[firstId] || {};
              const selectedAddrText = firstState.addressId ? renderAddressDisplay(firstState.addressId) : null;

              return (
                <View style={styles.sectionCardWhite}>
                  <TouchableOpacity
                    style={styles.dashedAddressBtn}
                    activeOpacity={0.85}
                    onPress={() => {
                      navigation.navigate('Address', {
                        mode: 'select',
                        onSelect: (addrId: string) => {
                          setItemSchedules(prev => {
                            const newSchedules = { ...prev };
                            Object.keys(newSchedules).forEach(k => {
                              newSchedules[k] = { ...newSchedules[k], addressId: addrId };
                            });
                            return newSchedules;
                          });
                        }
                      });
                    }}>
                    <View style={styles.dashedAddressInner}>
                      <View style={styles.dashedIconCircle}>
                        <MapPin size={22} color="#C84400" />
                      </View>
                      <View style={{ flex: 1, paddingHorizontal: 12 }}>
                        <Text style={styles.dashedAddressTitle}>
                          {selectedAddrText ? (isBn ? 'নির্বাচিত পূজা লোকেশন' : 'Selected Puja Location') : (isBn ? 'পূজার জায়গা চয়ন করুন' : 'Select Puja Location')}
                        </Text>
                        <Text style={styles.dashedAddressSub} numberOfLines={2}>
                          {selectedAddrText || (isBn ? 'কোথায় পূজা করা হবে?' : 'Where should the puja be performed?')}
                        </Text>
                      </View>
                      <ChevronRight size={20} color="#F59E0B" />
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })()}

            {/* Section 3: SPECIAL INSTRUCTIONS (Below Puja Location!) */}
            <View style={styles.sectionDividerRow}>
              <Sparkles size={18} color="#C84400" style={{ marginRight: 8 }} />
              <Text style={styles.sectionDividerText}>{isBn ? 'বিশেষ নির্দেশাবলী' : 'SPECIAL INSTRUCTIONS'}</Text>
              <View style={styles.optionalBadge}>
                <Text style={styles.optionalBadgeText}>OPTIONAL</Text>
              </View>
              <View style={styles.sectionLineFull} />
            </View>

            <View style={styles.sectionCardWhite}>
              <Text style={styles.instructionsHeaderSubText}>
                {isBn
                  ? 'অনুষ্ঠানের পছন্দগুলি শেয়ার করুন। আপনি প্রতিটি পূজার জন্য একটি পৃথক নোট যোগ করতে পারেন।'
                  : 'Share ceremony preferences or accessibility needs. You can add a separate note for each puja.'}
              </Text>

              {cartItems.map((item: any) => {
                const id = item.cartItemId;
                const itemState = itemSchedules[id] || {};
                return (
                  <View key={id} style={styles.pujaInstructionCard}>
                    <Text style={styles.pujaTitleBold}>{isBn ? item.titleBn : item.titleEn}</Text>
                    <Text style={styles.pujaPkgSub}>{item.package_name || (item.titleEn + ' Verification Package')}</Text>

                    <TouchableOpacity
                      style={[styles.instructionBtnOutline, itemState.showInstructions && styles.instructionBtnOutlineActive]}
                      onPress={() => {
                        setItemSchedules(prev => ({
                          ...prev,
                          [id]: { ...prev[id], showInstructions: !itemState.showInstructions },
                        }));
                      }}>
                      <View style={[styles.instructionBoxCheck, itemState.showInstructions && styles.instructionBoxCheckActive]}>
                        {itemState.showInstructions && <Text style={styles.instructionCheckMark}>✓</Text>}
                      </View>
                      <Text style={styles.instructionBtnText}>
                        {isBn ? 'আমাদের জন্য বিশেষ নির্দেশাবলী যোগ করুন' : 'Add special instructions for us'}
                      </Text>
                    </TouchableOpacity>

                    {itemState.showInstructions && (
                      <View style={styles.instructionInputWrapper}>
                        <TextInput
                          style={styles.instructionInput}
                          placeholder="Enter special instructions..."
                          placeholderTextColor="#9CA3AF"
                          multiline
                          value={itemState.instructions}
                          onChangeText={txt => {
                            setItemSchedules(prev => ({
                              ...prev,
                              [id]: { ...prev[id], instructions: txt },
                            }));
                          }}
                        />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Section 4: ORDER DETAILS */}
            {(() => {
              const firstId = cartItems[0]?.cartItemId;
              const firstState = itemSchedules[firstId] || {};

              return (
                <View style={{ marginTop: 4 }}>
                  <View style={styles.sectionDividerRow}>
                    <Receipt size={18} color="#C84400" style={{ marginRight: 8 }} />
                    <Text style={styles.sectionDividerText}>{isBn ? 'অর্ডার বিবরণ' : 'Order Details'}</Text>
                    <View style={styles.sectionLineFull} />
                  </View>

                  {/* 1. BOOKING READINESS */}
                  <View style={styles.readinessCard}>
                    <Text style={styles.readinessCardTitle}>BOOKING READINESS</Text>
                    <View style={styles.readinessGrid}>
                      <View style={[styles.readinessGridBox, firstState?.date && firstState?.time && styles.readinessGridBoxDone]}>
                        <Calendar size={18} color={firstState?.date && firstState?.time ? "#059669" : "#C84400"} />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.readinessBoxTitle}>Date and time</Text>
                          <Text style={[styles.readinessBoxStatus, firstState?.date && firstState?.time ? { color: '#059669' } : { color: '#EF4444' }]}>
                            {firstState?.date && firstState?.time ? 'Selected' : 'Required'}
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.readinessGridBox, firstState?.addressId && styles.readinessGridBoxDone]}>
                        <MapPin size={18} color={firstState?.addressId ? "#059669" : "#C84400"} />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.readinessBoxTitle}>Puja location</Text>
                          <Text style={[styles.readinessBoxStatus, firstState?.addressId ? { color: '#059669' } : { color: '#EF4444' }]}>
                            {firstState?.addressId ? 'Selected' : 'Required'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* 2. 1 PUJA SELECTED */}
                  <View style={styles.selectedPujasCard}>
                    <View style={styles.selectedPujasHeaderBanner}>
                      <Text style={styles.selectedPujasBannerText}>{cartItems.length} PUJA SELECTED</Text>
                    </View>
                    {cartItems.map((item: any) => (
                      <View key={item.cartItemId} style={styles.selectedPujaRow}>
                        <Image source={{ uri: item.packageImage || item.imagePlaceholder || 'https://via.placeholder.com/60' }} style={styles.selectedPujaImg} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={styles.selectedPujaName}>{isBn ? item.titleBn : item.titleEn}</Text>
                            <Text style={styles.selectedPujaPrice}>₹{item.price?.toLocaleString('en-IN') || '1,501'}</Text>
                          </View>
                          <Text style={styles.selectedPujaPkgName}>{item.package_name || (item.titleEn + ' Verification Package')}</Text>
                          <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                            <View style={styles.pillSmall}><Users size={12} color="#C84400" /><Text style={styles.pillSmallText}>1</Text></View>
                            <View style={styles.pillSmall}><Clock size={12} color="#C84400" /><Text style={styles.pillSmallText}>2h</Text></View>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* 3. PRICE BREAKDOWN */}
                  <View style={styles.priceBreakdownCard}>
                    <View style={styles.priceHeaderBanner}>
                      <Text style={styles.priceBannerText}>PRICE BREAKDOWN</Text>
                    </View>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabelOrange}>Puja services</Text>
                      <Text style={styles.priceValBold}>₹{subtotal.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabelOrange}>Platform Fee</Text>
                      <Text style={styles.priceValBold}>₹{platformFee.toFixed(2)}</Text>
                    </View>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabelOrange}>GST (18%)</Text>
                      <Text style={styles.priceValBold}>₹{gst.toFixed(2)}</Text>
                    </View>
                    <View style={styles.priceDivider} />
                    <View style={styles.priceGrandTotalRow}>
                      <Text style={styles.grandTotalLabelLarge}>Grand Total</Text>
                      <Text style={styles.grandTotalValLarge}>₹{grandTotal.toLocaleString('en-IN')}</Text>
                    </View>
                  </View>

                  {/* 4. DUAL SPLIT PAYMENT CARDS */}
                  <View style={styles.dualPaymentContainer}>
                    <View style={styles.payNowBoxBlue}>
                      <Text style={styles.payNowTitleBlue}>💳 PAY NOW</Text>
                      <Text style={styles.payNowAmountBlue}>₹{payOnlineAmount || 21}</Text>
                      <Text style={styles.payNowSubBlue}>Secure booking payment</Text>
                    </View>
                    <View style={styles.duringServiceBoxGreen}>
                      <Text style={styles.duringServiceTitleGreen}>🏠 DURING SERVICE</Text>
                      <Text style={styles.duringServiceAmountGreen}>₹{cashOnDeliveryAmount?.toLocaleString('en-IN') || '1,501'}</Text>
                      <Text style={styles.duringServiceSubGreen}>Remaining balance</Text>
                    </View>
                  </View>

                  {/* 5. SECURE BOOKING CARD */}
                  <View style={styles.secureBookingCardOutline}>
                    <CheckCircle2 size={20} color="#059669" style={{ marginTop: 2 }} />
                    <Text style={styles.secureBookingText}>
                      <Text style={styles.secureBookingBold}>Secure Booking — </Text>
                      Certified pandits and authentic Vedic rituals.
                    </Text>
                  </View>
                </View>
              );
            })()}
          </View>
        ) : (
          renderReviewStep()
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Footer Bar */}
      <View style={[styles.fixedFooterBar, { paddingBottom: Math.max(12, insets.bottom + 8) }]}>
        <TouchableOpacity
          activeOpacity={0.88}
          disabled={!isFormValid()}
          style={{ width: '100%' }}
          onPress={handleConfirm}
        >
          {isFormValid() ? (
            <LinearGradient
              colors={['#FF9933', '#E07800']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueBtnGradientActive}
            >
              <View style={styles.footerBtnLeft}>
                <ShieldCheck size={20} color="#FFFFFF" />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.footerBtnTitleActive}>
                    {isBn ? 'পেমেন্টে এগিয়ে যান' : 'Continue to Payment'}
                  </Text>
                  <Text style={styles.footerBtnSubActive}>
                    ₹{payOnlineAmount || 21} now · ₹{cashOnDeliveryAmount?.toLocaleString('en-IN')} later
                  </Text>
                </View>
              </View>
              <ChevronRight size={22} color="#FFFFFF" />
            </LinearGradient>
          ) : (
            <View style={styles.continueBtnDisabledBox}>
              <View style={styles.footerBtnLeft}>
                <Shield size={20} color="#9CA3AF" />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.footerBtnTitleDisabled}>
                    {isBn ? 'পেমেন্টে এগিয়ে যান' : 'Continue to Payment'}
                  </Text>
                  <Text style={styles.footerBtnSubDisabled}>
                    {isBn ? 'প্রয়োজনীয় তারিখ এবং সময় নির্বাচন করুন' : 'Select the required date and time'}
                  </Text>
                </View>
              </View>
              <ChevronRight size={22} color="#9CA3AF" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Date & Time Picker Render */}
      {renderDatePicker()}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  newHeaderBox: {
    backgroundColor: Colors.extraLightWarm,
    paddingTop: 4,
    paddingBottom: 16,
    marginBottom: 8,
  },
  stepperWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  stepperNode: {
    alignItems: 'center',
    width: 60,
  },
  stepCircleCompleted: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepLabelCompleted: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '800',
  },
  stepLineCompleted: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.primary,
    marginHorizontal: 8,
    marginBottom: 20,
  },
  stepCircleInactive: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepIconInactive: {
    fontSize: 16,
    opacity: 0.2,
  },
  stepLabelInactive: {
    fontSize: 12,
    color: '#D1D5DB',
    fontWeight: '600',
  },
  stepLineInactive: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
    marginBottom: 20,
  },
  stepCircleActiveOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF0D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepCircleActiveInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconActive: {
    fontSize: 16,
    color: '#FFF',
  },
  stepLabelActive: {
    fontSize: 12,
    color: '#D1D5DB',
    fontWeight: '600',
  },
  headerTitleSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  backBtnCircleRow: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    marginTop: 8,
  },
  headerTextWrapper: {
    flex: 1,
  },
  stepCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F97316',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  mainHeading: {
    fontSize: 22,
    fontWeight: '900',
    color: '#3B2416',
    marginBottom: 6,
  },
  subHeading: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  backBtnCircle: {
  },
  headerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EED9C4',
  },
  headerStar: {
    color: '#F97316',
    marginHorizontal: 8,
    fontSize: 12,
  },
  prefCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EED9C4',
    padding: 16,
    marginBottom: 24,
  },
  prefHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  prefTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#3B2416',
  },
  prefSub: {
    fontSize: 11,
    color: '#A68A7A',
    fontWeight: '600',
  },
  prefTogglesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  prefToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#EED9C4',
    borderRadius: 8,
    padding: 12,
  },
  prefToggleActive: {
    backgroundColor: '#FFF8F3',
    borderColor: '#F97316',
  },
  prefCheck: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#EED9C4',
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  prefCheckActive: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  prefCheckMark: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  prefToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A68A7A',
    flex: 1,
  },
  prefToggleTextActive: {
    color: '#F97316',
  },
  sectionDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionDividerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1F2937',
    marginRight: 8,
    letterSpacing: 0.5,
  },
  sectionLineFull: {
    flex: 1,
    height: 1,
    backgroundColor: '#FED7AA',
  },
  dateTimeCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EED9C4',
    padding: 16,
    marginBottom: 16,
  },
  goldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#854D0E',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  greyLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pillInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 6,
  },
  pillInputActive: {
    backgroundColor: '#FFF8F0',
    borderColor: '#EA580C',
    borderWidth: 1.5,
  },
  pillInputDisabled: {
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
  },
  pillIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  pillInputText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B2416',
    flex: 1,
  },
  pillInputPlaceholder: {
    color: '#A68A7A',
  },
  pujaDetailsCard: {
    backgroundColor: '#FFFCF8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFF0D4',
    padding: 12,
    marginBottom: 16,
  },
  pujaTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pujaTitleEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  pujaTitleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#3B2416',
    marginRight: 6,
  },
  pujaPackageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F97316',
    flexShrink: 1,
  },
  instructionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  instructionCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#D4AF37',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  instructionCheckActive: {
    backgroundColor: '#D4AF37',
  },
  instructionCheck: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A68A7A',
  },
  instructionInputWrapper: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#EED9C4',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    height: 80,
  },
  instructionInput: {
    flex: 1,
    fontSize: 13,
    color: '#3B2416',
    textAlignVertical: 'top',
  },
  addressSection: {
    marginTop: 8,
  },

  headerBox: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  bodyScroll: { flex: 1 },
  toggleCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightOrange,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
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
  toggleBtnActive: { backgroundColor: '#FF6B6B', borderColor: '#FF6B6B' },
  toggleBtnText: { fontSize: 12, color: Colors.textMain, fontWeight: '600', textAlign: 'center' },
  toggleBtnTextActive: { color: Colors.white },
  scheduleCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightOrange,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  scdTitle: { fontSize: 13, fontWeight: '700', color: Colors.textMain, marginBottom: 16 },
  pkgImage: { width: 32, height: 32, borderRadius: 16, marginRight: 12 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMain, marginBottom: 8 },
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
  inputText: { fontSize: 14, color: Colors.textMain, fontWeight: '500', flex: 1 },
  inputPlaceholder: { color: Colors.textMuted },
  dropdownIcon: { fontSize: 14 },
  addressSelectBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    backgroundColor: '#FFF5EB',
    marginBottom: 12,
  },
  addressSelectBtnText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
    marginRight: 6,
  },
  addressSelectBtnIcon: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  addressSelectedCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.white,
    padding: 12,
    marginBottom: 12,
  },
  addressSelectedInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressSelectedIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3E5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressSelectedInfo: {
    flex: 1,
    paddingHorizontal: 12,
  },
  addressSelectedLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  addressSelectedText: {
    fontSize: 13,
    color: Colors.textMain,
    fontWeight: '500',
    lineHeight: 18,
  },
  addressChangeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FFF5EB',
    borderRadius: 6,
  },
  addressChangeBtnText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  footerRow: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24, // Reduced from 62 to move button down
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  btnContentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnTextWrapper: {
    marginLeft: 12,
  },
  btnMainTitle: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  btnSubTitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  btnDisabled: { opacity: 0.5 },
  // Review Styles
  reviewContainer: { paddingHorizontal: 4, paddingTop: 4 },
  reviewHeaderRow: { marginBottom: 16 },
  reviewMainTitle: { fontSize: 18, fontWeight: '800', color: Colors.textMain },
  reviewSubTitle: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  reviewSummaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightOrange,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  reviewSummaryBannerIcon: { fontSize: 18, marginRight: 10 },
  reviewSummaryBannerText: { fontSize: 13, fontWeight: '800', color: Colors.primary },
  reviewCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
  },
  reviewCardMain: { flexDirection: 'row', alignItems: 'center' },
  reviewPkgImage: { width: 52, height: 52, borderRadius: 10, marginRight: 12 },
  reviewInfoRight: { flex: 1 },
  reviewItemTitle: { fontSize: 14, fontWeight: '700', color: Colors.textMain },
  reviewStatusPill: { backgroundColor: '#EBF5FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginTop: 6 },
  reviewStatusPillText: { fontSize: 9, color: '#3B82F6', fontWeight: '800', letterSpacing: 0.5 },
  reviewSectionDivider: { height: 1.5, backgroundColor: Colors.extraLightWarm, marginVertical: 12 },
  reviewDetailsGrid: { flexDirection: 'row', alignItems: 'center' },
  reviewDetailItem: { flex: 1 },
  reviewSeparatorCol: { width: 1, height: 20, backgroundColor: Colors.ultraLightGray, marginHorizontal: 12 },
  reviewLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '700', textTransform: 'uppercase' },
  reviewValue: { fontSize: 13, color: Colors.textMain, fontWeight: '600', marginTop: 2 },
  reviewAddrGroup: { marginTop: 12 },
  reviewAddrContent: { marginTop: 6, padding: 10, backgroundColor: Colors.extraLightWarm, borderRadius: 8, borderWidth: 1, borderColor: Colors.ultraLightGray },
  reviewAddrType: { fontSize: 10, color: Colors.primary, fontWeight: '800', marginBottom: 2 },
  reviewAddrText: { fontSize: 13, color: Colors.textMain, lineHeight: 18, fontWeight: '600' },
  // iOS Picker custom styles
  iosPickerContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  iosPickerHeader: {
    backgroundColor: Colors.white,
    padding: 16,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  iosPickerDoneText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  iosPickerBody: {
    backgroundColor: Colors.white,
    paddingBottom: 40,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: Colors.white,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.disabled,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  checkboxCheck: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '900',
  },
  checkboxText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMain,
    flex: 1,
  },
  // Section & Card Base Styles
  sectionCardWhite: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 16,
    marginBottom: 20,
  },
  dateAvailableHelperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 14,
  },

  // Dashed Location Card (Matches user image 100%)
  dashedAddressBtn: {
    backgroundColor: '#FFFDF0',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#EAB308',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  addressSelectedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 16,
  },
  dashedAddressInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dashedIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dashedAddressTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#78350F',
    marginBottom: 2,
  },
  dashedAddressSub: {
    fontSize: 13,
    fontWeight: '500',
    color: '#D97706',
  },

  // Optional Badge & Instructions
  optionalBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  optionalBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
  },
  instructionsHeaderSubText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 14,
  },
  pujaInstructionCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 14,
    marginBottom: 10,
  },
  pujaTitleBold: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 2,
  },
  pujaPkgSub: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  instructionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  instructionBtnOutlineActive: {
    borderColor: '#EA580C',
    backgroundColor: '#FFF8F0',
  },
  instructionBoxCheck: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#FFFFFF',
  },
  instructionBoxCheckActive: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  instructionCheckMark: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  instructionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C84400',
  },

  // Booking Readiness Grid
  readinessCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 16,
    marginBottom: 16,
  },
  readinessCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  readinessGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  readinessGridBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 12,
  },
  readinessGridBoxDone: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  readinessBoxTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  readinessBoxStatus: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },

  // Puja Selected Card
  selectedPujasCard: {
    backgroundColor: '#FFFDF9',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FED7AA',
    overflow: 'hidden',
    marginBottom: 16,
  },
  selectedPujasHeaderBanner: {
    backgroundColor: '#FFF8F0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#FED7AA',
  },
  selectedPujasBannerText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#C84400',
    letterSpacing: 0.5,
  },
  selectedPujaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  selectedPujaImg: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  selectedPujaName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1917',
  },
  selectedPujaPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#C84400',
  },
  selectedPujaPkgName: {
    fontSize: 12,
    color: '#EA580C',
    marginTop: 2,
  },
  pillSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pillSmallText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C84400',
  },

  // Price Breakdown Card
  priceBreakdownCard: {
    backgroundColor: '#FFFDF9',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FED7AA',
    overflow: 'hidden',
    marginBottom: 16,
  },
  priceHeaderBanner: {
    backgroundColor: '#FFF8F0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#FED7AA',
  },
  priceBannerText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#C84400',
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  priceLabelOrange: {
    fontSize: 14,
    color: '#C84400',
    fontWeight: '600',
  },
  priceValBold: {
    fontSize: 15,
    color: '#1C1917',
    fontWeight: '700',
  },
  priceDivider: {
    height: 1,
    backgroundColor: '#FED7AA',
    marginHorizontal: 16,
    marginVertical: 4,
  },
  priceGrandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  grandTotalLabelLarge: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1917',
  },
  grandTotalValLarge: {
    fontSize: 26,
    fontWeight: '900',
    color: '#C84400',
  },

  // Dual Split Payment Container
  dualPaymentContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  payNowBoxBlue: {
    flex: 1,
    backgroundColor: '#F0F7FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
  },
  payNowTitleBlue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  payNowAmountBlue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0369A1',
    marginBottom: 2,
  },
  payNowSubBlue: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '600',
  },
  duringServiceBoxGreen: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
  },
  duringServiceTitleGreen: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  duringServiceAmountGreen: {
    fontSize: 22,
    fontWeight: '900',
    color: '#15803D',
    marginBottom: 2,
  },
  duringServiceSubGreen: {
    fontSize: 11,
    color: '#4ADE80',
    fontWeight: '600',
  },

  // Secure Booking Outline Card
  secureBookingCardOutline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
  },
  secureBookingText: {
    fontSize: 13,
    color: '#4B5563',
    flex: 1,
    lineHeight: 18,
  },
  secureBookingBold: {
    fontWeight: '700',
    color: '#059669',
  },

  // Sticky Fixed Footer Bar
  fixedFooterBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 10,
    paddingTop: 10,
    zIndex: 999,
    elevation: 10,
  },
  continueBtnGradientActive: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    width: '100%',
  },
  continueBtnDisabledBox: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    width: '100%',
  },
  footerBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  footerBtnTitleActive: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  footerBtnSubActive: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    fontWeight: '600',
  },
  footerBtnTitleDisabled: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '800',
  },
  footerBtnSubDisabled: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
  },
});
