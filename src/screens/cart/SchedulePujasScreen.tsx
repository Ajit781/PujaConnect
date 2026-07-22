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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker'; // datetimepicker लाइब्रेरी इम्पोर्ट की गई
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Colors } from '../../constants/Colors';
import { useAlert } from '../../context/AlertContext';

export interface ScheduleItemPayload {
  package_id: number;
  preferred_date: string;
  preferred_time: string;
  ctzn_address_id?: number;
  special_instruction?: string;
}

export default function SchedulePujasScreen({ navigation, route }: any) {
  const { i18n } = useTranslation();
  const isBn = i18n.language === 'bn';
  const { showAlert } = useAlert();

  const user = useSelector((state: RootState) => state.auth.user);
  // Use addresses passed from CartScreen which are already flattened
  const addresses = route.params?.addresses || [];
  const { cartItems = [] } = route.params || {};

  const [itemSchedules, setItemSchedules] = useState<
    Record<string, { date: Date | null; time: string | null; addressId: string | null; showInstructions: boolean; instructions: string }>
  >({});
  
  const [syncDateTime, setSyncDateTime] = useState(true);
  const [syncAddress, setSyncAddress] = useState(true);

  // DateTimePicker नियंत्रण के लिए स्टेट्स
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [pickerTarget, setPickerTarget] = useState<string | null>(null); // 'GLOBAL' या विशिष्ट item ID

  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [pendingAddressTarget, setPendingAddressTarget] = useState<string | null>(null);
  const [activeAddressTab, setActiveAddressTab] = useState<'Self' | 'Relative'>('Self');

  const [step, setStep] = useState(1);
  const [preparedPayload, setPreparedPayload] = useState<ScheduleItemPayload[]>([]);

  useEffect(() => {
    const initialSchedules: Record<string, { date: Date | null; time: string | null; addressId: string | null; showInstructions: boolean; instructions: string }> = {};
    cartItems.forEach((item: any) => {
      initialSchedules[item.cartItemId] = { date: null, time: null, addressId: null, showInstructions: false, instructions: '' };
    });
    setItemSchedules(initialSchedules);
  }, [cartItems]);

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

  // 12-घंटे के प्रारूप में समय फॉर्मेट करने का हेल्पर (जैसे: 10:00 AM)
  const formatTime12h = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // '0' को '12' में बदलता है
    const minutesStr = String(minutes).padStart(2, '0');
    return `${hours}:${minutesStr} ${ampm}`;
  };

  const renderAddressDisplay = (addrId: string | null) => {
    if (!addrId) return isBn ? 'একটি ডেলিভারি ঠিকানা চয়ন করুন' : 'Select a delivery address';
    const found = addresses?.find((a: any) => a.id?.toString() === addrId?.toString());
    if (!found) return 'Address not found';
    return `${found.type === 'Home' ? '🏠' : '📍'} ${found.addressLine1}, ${found.city}`;
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
      if (!sched || !sched.date || !sched.time || !sched.addressId) {
        showAlert({ title: 'Required', message: 'Please fill all fields for each puja.' });
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

    if (step === 1) {
      setPreparedPayload(payload);
      setStep(2);
    } else {
      navigation.navigate('MainTabs', {
        screen: 'CartTab',
        params: { confirmedSchedules: preparedPayload },
      });
    }
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
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.extraLightWarm }} edges={['top']}>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />

      {/* Top Header */}
      {step === 1 ? (
        <View style={styles.newHeaderBox}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnCircle}>
            <Text style={styles.backBtnArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.newHeaderTitle}>
            {isBn ? 'পূজার জন্য আপনার পছন্দের তারিখ, সময় এবং ঠিকানা নির্বাচন করুন।' : 'Select your preferred date, time, and address for the puja.'}
          </Text>
          <View style={styles.headerDividerRow}>
            <View style={styles.headerLine} />
            <Text style={styles.headerStar}>✦</Text>
            <View style={styles.headerLine} />
          </View>
        </View>
      ) : (
        <View style={styles.headerBox}>
          <View style={{ position: 'absolute', top: 10, left: 20 }}>
            <Text style={{ fontSize: 10, color: Colors.primary, fontWeight: '800' }}>STEP 2 OF 2</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <TouchableOpacity onPress={() => setStep(1)} style={{ marginRight: 8, padding: 4 }}>
              <Text style={{ fontSize: 18 }}>⬅️</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 22, marginRight: 8 }}>📋</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.textMain }}>
              {isBn ? 'শিডিউল রিভিউ' : 'Review Schedule'}
            </Text>
          </View>
        </View>
      )}

      {/* Body */}
      <ScrollView
        style={styles.bodyScroll}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}>
        {step === 1 ? (
          <View>
            <View style={styles.prefCard}>
              <View style={styles.prefHeaderRow}>
                <Text style={styles.prefTitle}>{isBn ? 'বুকিং পছন্দ' : 'Booking preferences'}</Text>
                <Text style={styles.prefSub}>{isBn ? 'সব পূজাতে প্রযোজ্য' : 'Apply your selections to every puja'}</Text>
              </View>
              <View style={styles.prefTogglesContainer}>
                <TouchableOpacity 
                  style={[styles.prefToggle, syncDateTime && styles.prefToggleActive]}
                  onPress={() => {
                    const next = !syncDateTime;
                    setSyncDateTime(next);
                    if (next && cartItems.length > 0) {
                      const firstItem = itemSchedules[cartItems[0].cartItemId];
                      if (firstItem) {
                        setItemSchedules(prev => {
                          const newSchedules = { ...prev };
                          Object.keys(newSchedules).forEach(k => {
                            newSchedules[k] = { ...newSchedules[k], date: firstItem.date, time: firstItem.time };
                          });
                          return newSchedules;
                        });
                      }
                    }
                  }}>
                  <View style={[styles.prefCheck, syncDateTime && styles.prefCheckActive]}>
                    {syncDateTime && <Text style={styles.prefCheckMark}>✓</Text>}
                  </View>
                  <Text style={[styles.prefToggleText, syncDateTime && styles.prefToggleTextActive]}>
                    {isBn ? 'সব পূজার জন্য একই তারিখ ও সময়' : 'Use the same date and time for all pujas'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.prefToggle, syncAddress && styles.prefToggleActive]}
                  onPress={() => {
                    const next = !syncAddress;
                    setSyncAddress(next);
                    if (next && cartItems.length > 0) {
                      const firstItem = itemSchedules[cartItems[0].cartItemId];
                      if (firstItem) {
                        setItemSchedules(prev => {
                          const newSchedules = { ...prev };
                          Object.keys(newSchedules).forEach(k => {
                            newSchedules[k] = { ...newSchedules[k], addressId: firstItem.addressId };
                          });
                          return newSchedules;
                        });
                      }
                    }
                  }}>
                  <View style={[styles.prefCheck, syncAddress && styles.prefCheckActive]}>
                    {syncAddress && <Text style={styles.prefCheckMark}>✓</Text>}
                  </View>
                  <Text style={[styles.prefToggleText, syncAddress && styles.prefToggleTextActive]}>
                    {isBn ? 'সব পূজার জন্য একই ঠিকানা' : 'Use the same address for all pujas'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.sectionDividerRow}>
              <Text style={styles.sectionDividerIcon}>📅</Text>
              <Text style={styles.sectionDividerText}>{isBn ? 'তারিখ ও সময়' : 'DATE & TIME'}</Text>
              <View style={styles.sectionLineFull} />
            </View>

            {cartItems.map((item: any, index: number) => {
              const id = item.cartItemId;
              const itemState = itemSchedules[id] || {};
              const showDateTimeForm = index === 0 || !syncDateTime;
              const showAddressForm = index === 0 || !syncAddress;
              
              return (
                <View key={id} style={styles.dateTimeCard}>
                  {showDateTimeForm && (
                    <View>
                      <Text style={styles.goldLabel}>📅 {isBn ? 'শুভ তারিখ' : 'AUSPICIOUS DATE'}</Text>
                      <TouchableOpacity
                        style={[styles.pillInput, showPicker && pickerTarget === id && pickerMode === 'date' && styles.pillInputActive]}
                        onPress={() => {
                          setPickerTarget(id);
                          setPickerMode('date');
                          setShowPicker(true);
                        }}>
                        <Text style={styles.pillIcon}>🗓️</Text>
                        <Text style={[styles.pillInputText, !itemState.date && styles.pillInputPlaceholder]}>
                          {itemState.date ? formatDate(itemState.date) : (isBn ? 'পছন্দের তারিখ নির্বাচন করুন' : 'Select preferred date')}
                        </Text>
                      </TouchableOpacity>

                      <Text style={[styles.greyLabel, !itemState.date && { opacity: 0.5 }]}>
                        🕒 {isBn ? 'পছন্দের সময় (প্রথমে তারিখ নির্বাচন করুন)' : 'PREFERRED TIME (select date first)'}
                      </Text>
                      <TouchableOpacity
                        style={[styles.pillInput, showPicker && pickerTarget === id && pickerMode === 'time' && styles.pillInputActive, !itemState.date && styles.pillInputDisabled]}
                        disabled={!itemState.date}
                        onPress={() => {
                          setPickerTarget(id);
                          setPickerMode('time');
                          setShowPicker(true);
                        }}>
                        <Text style={[styles.pillIcon, !itemState.date && {opacity: 0.5}]}>🕒</Text>
                        <Text style={[styles.pillInputText, !itemState.time && styles.pillInputPlaceholder]}>
                          {itemState.time || (isBn ? 'পছন্দের সময় নির্বাচন করুন' : 'Select preferred time')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  <View style={styles.pujaDetailsCard}>
                    <View style={styles.pujaTitleRow}>
                      <Text style={styles.pujaTitleEmoji}>🙏</Text>
                      <Text style={styles.pujaTitleText}>{isBn ? item.titleBn : item.titleEn}</Text>
                      <Text style={styles.pujaPackageText}>{item.package_name || 'Basic Package'}</Text>
                    </View>
                    
                    <TouchableOpacity
                      style={styles.instructionToggle}
                      onPress={() => {
                        setItemSchedules(prev => ({
                          ...prev,
                          [id]: { ...prev[id], showInstructions: !itemState.showInstructions },
                        }));
                      }}>
                      <View style={[styles.instructionCheckbox, itemState.showInstructions && styles.instructionCheckActive]}>
                        {itemState.showInstructions && <Text style={styles.instructionCheck}>✓</Text>}
                      </View>
                      <Text style={styles.instructionText}>
                         {isBn ? 'আমাদের জন্য বিশেষ নির্দেশাবলী যোগ করুন' : 'Add special instructions for us'}
                      </Text>
                    </TouchableOpacity>

                    {itemState.showInstructions && (
                      <View style={styles.instructionInputWrapper}>
                        <TextInput
                          style={styles.instructionInput}
                          placeholder="Enter special instructions..."
                          placeholderTextColor={Colors.textMuted}
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

                  {showAddressForm && (
                    <View style={styles.addressSection}>
                      <Text style={styles.goldLabel}>📍 {isBn ? 'ঠিকানা' : 'ADDRESS'}</Text>
                      <TouchableOpacity
                        style={itemState.addressId ? styles.addressSelectedCard : styles.addressSelectBtn}
                        onPress={() => {
                          navigation.navigate('Address', {
                            mode: 'select',
                            onSelect: (addrId: string) => {
                              setItemSchedules(prev => {
                                const newSchedules = { ...prev };
                                if (syncAddress) {
                                  Object.keys(newSchedules).forEach(k => {
                                    newSchedules[k] = { ...newSchedules[k], addressId: addrId };
                                  });
                                } else {
                                  newSchedules[id] = { ...newSchedules[id], addressId: addrId };
                                }
                                return newSchedules;
                              });
                            }
                          });
                        }}>
                        {itemState.addressId ? (
                          <View style={styles.addressSelectedInner}>
                            <View style={styles.addressSelectedIconBox}>
                              <Text style={{ fontSize: 18 }}>📍</Text>
                            </View>
                            <View style={styles.addressSelectedInfo}>
                              <Text style={styles.addressSelectedLabel}>{isBn ? 'নির্বাচিত ঠিকানা' : 'Selected Address'}</Text>
                              <Text style={styles.addressSelectedText} numberOfLines={2}>
                                {renderAddressDisplay(itemState.addressId).replace('🏠 ', '').replace('📍 ', '')}
                              </Text>
                            </View>
                            <View style={styles.addressChangeBtn}>
                              <Text style={styles.addressChangeBtnText}>{isBn ? 'পরিবর্তন' : 'Change'}</Text>
                            </View>
                          </View>
                        ) : (
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={styles.addressSelectBtnText}>
                              {isBn ? 'ডেলিভারি ঠিকানা নির্বাচন করুন' : 'Select Delivery Address'}
                            </Text>
                            <Text style={styles.addressSelectBtnIcon}>+</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          renderReviewStep()
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footerRow}>
        <TouchableOpacity
          style={[styles.confirmBtn, !isFormValid() && styles.btnDisabled]}
          disabled={!isFormValid()}
          onPress={handleConfirm}>
          <Text style={styles.confirmBtnText}>
            {step === 1 ? '✨ ' : '✅ '}
            {step === 1
              ? isBn ? 'সূচি নিশ্চিত করুন এবং অর্ডার পর্যালোচনা করুন' : 'Confirm Schedule & Review Order'
              : isBn ? 'সব কিছু ঠিক আছে, অর্ডার নিশ্চিত করুন' : 'Everything looks good, Confirm Order'}
          </Text>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backBtnCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5D5C5',
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  backBtnArrow: {
    fontSize: 16,
    color: '#3B2416',
    fontWeight: '500',
  },
  newHeaderTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#3b2416',
    marginBottom: 20,
    lineHeight: 30,
  },
  headerDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginBottom: 16,
  },
  sectionDividerIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  sectionDividerText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#3B2416',
    marginRight: 12,
    letterSpacing: 0.5,
  },
  sectionLineFull: {
    flex: 1,
    height: 1,
    backgroundColor: '#EED9C4',
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
    color: '#D4AF37',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  greyLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A68A7A',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  pillInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#EED9C4',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
  },
  pillInputActive: {
    backgroundColor: '#FFF8F3',
    borderColor: '#F97316',
    borderWidth: 1.5,
  },
  pillInputDisabled: {
    borderColor: '#EED9C4',
    backgroundColor: '#FDFBFA',
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
  bodyScroll: { flex: 1, padding: 16 },
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
    paddingBottom: 62, // Increased from 16 to move button up
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
  checkboxTextActive: {
    color: Colors.primary,
  },
});
