import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  Calendar,
  Clock,
  MapPin,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useReschedulePujaMutation, useGetUserDetailsQuery } from '../../store/api/pujaApi';
import CustomDatePickerModal from '../common/CustomDatePickerModal';
import { useToast } from '../../context/ToastContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  bookingId: number | string;
  orderId?: number | string;
  bookingNo?: string;
  currentDate?: string;
  currentTime?: string;
  currentAddressId?: number | string;
  onSuccess?: () => void;
}

const TIME_SLOTS = [
  { label: '06:00 AM', value: '06:00' },
  { label: '08:00 AM', value: '08:00' },
  { label: '09:00 AM', value: '09:00' },
  { label: '10:30 AM', value: '10:30' },
  { label: '12:00 PM', value: '12:00' },
  { label: '04:00 PM', value: '16:00' },
  { label: '06:00 PM', value: '18:00' },
];

// Formats YYYY-MM-DD to DD-MM-YYYY
function formatDateDDMMYYYY(dateStr: string) {
  if (!dateStr) return '05-09-2026';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}-${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

// Formats YYYY-MM-DD to Sat, 05 Sept, 2026
function formatFullDateStr(dateStr: string) {
  if (!dateStr) return 'Sat, 05 Sept, 2026';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    const dayName = days[d.getDay()];
    const monthName = months[d.getMonth()];
    const dayNum = String(d.getDate()).padStart(2, '0');
    return `${dayName}, ${dayNum} ${monthName}, ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

function format12h(time24: string) {
  if (!time24) return '09:00 AM';
  const slot = TIME_SLOTS.find(s => s.value === time24.slice(0, 5));
  if (slot) return slot.label;
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  if (isNaN(h)) return time24;
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const m = mStr || '00';
  return `${String(h12).padStart(2, '0')}:${m} ${ap}`;
}

export default function RescheduleModal({
  visible,
  onClose,
  bookingId,
  orderId = 0,
  bookingNo = 'PB-20260820-00001062',
  currentDate = '',
  currentTime = '09:00',
  currentAddressId = 0,
  onSuccess,
}: Props) {
  const user = useSelector((state: RootState) => state.auth.user);
  const { showToast } = useToast();
  const userId = Number(user?.user_id || user?.id || user?.ctzn_id || user?.citizen_id || 925);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedDate, setSelectedDate] = useState<string>(currentDate || '2026-09-05');
  const [selectedTime, setSelectedTime] = useState<string>(currentTime || '09:00');
  const [selectedAddressId, setSelectedAddressId] = useState<number | string>(currentAddressId || 0);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [reschedulePuja, { isLoading: isSubmitting }] = useReschedulePujaMutation();

  const { data: userDetails, isLoading: isAddrLoading } = useGetUserDetailsQuery(userId, {
    skip: !userId,
  });

  const addresses = useMemo(() => {
    let list: any[] = [];
    if (userDetails?.citizen_info?.address_list && Array.isArray(userDetails.citizen_info.address_list)) {
      list = [...list, ...userDetails.citizen_info.address_list];
    }
    if (Array.isArray(userDetails?.relative_info)) {
      userDetails.relative_info.forEach((rel: any) => {
        if (Array.isArray(rel.address_list)) {
          list = [...list, ...rel.address_list];
        }
      });
    }

    list = list.map((a: any) => ({
      ...a,
      address_id: a.address_id || a.ctzn_address_id || a.in_ctzn_address_id || a.id || 83,
    }));

    if (list.length === 0) {
      list.push({
        address_id: currentAddressId || 83,
        label: 'home1',
        address: 'baksara,howrah',
        street: 'baksara, borohma...',
        city: 'howrah',
        state_name: 'West Bengal',
        pincode: '711110',
        is_default: 1,
      });
    }
    return list;
  }, [userDetails, currentAddressId]);

  useEffect(() => {
    if (visible) {
      setStep(1);
      if (currentDate) setSelectedDate(currentDate);
      if (currentTime) setSelectedTime(currentTime);
      if (currentAddressId) setSelectedAddressId(currentAddressId);
    }
  }, [visible, currentDate, currentTime, currentAddressId]);

  const selectedAddress = addresses.find(
    (a: any) => String(a.address_id) === String(selectedAddressId),
  ) || (addresses.length > 0 ? addresses[0] : null);

  const maxDateNotice = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  })();

  const handleConfirmSubmit = async () => {
    console.log('==============================================');
    console.log('--- RESCHEDULE CONFIRM BUTTON CLICKED ---');
    console.log('Params:', {
      bookingId,
      orderId,
      userId,
      selectedDate,
      selectedTime,
      selectedAddressId,
      selectedAddress,
    });
    console.log('==============================================');

    if (!selectedDate) {
      showToast({ message: 'Please select a new puja date', type: 'error' });
      return;
    }
    if (!selectedTime) {
      showToast({ message: 'Please select a preferred time slot', type: 'error' });
      return;
    }

    try {
      console.log('Calling reschedulePuja mutation API...');
      const res = await reschedulePuja({
        bookingId,
        orderId,
        ctznId: userId,
        newDate: selectedDate,
        newTime: selectedTime,
        addressId: selectedAddress?.address_id || selectedAddressId,
      }).unwrap();

      console.log('==============================================');
      console.log('--- reschedulePuja MUTATION UNWRAPPED RESPONSE ---', res);
      console.log('==============================================');

      if (res && (res.status === 0 || res.status === '0')) {
        showToast({ message: 'Puja rescheduled successfully!', type: 'success' });
        if (onSuccess) onSuccess();
        onClose();
      } else {
        showToast({ message: res?.message || 'Failed to reschedule puja', type: 'error' });
      }
    } catch (err: any) {
      console.log('==============================================');
      console.error('--- reschedulePuja MUTATION ERROR ---', err);
      console.log('==============================================');
      showToast({ message: err?.data?.message || err?.message || 'Failed to reschedule puja. Please try again.', type: 'error' });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <LinearGradient
            colors={['#FF8A00', '#E8700A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerBanner}
          >
            <View style={styles.headerIconCircle}>
              <RefreshCw size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>RESCHEDULE BOOKING</Text>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {bookingNo}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>

          {/* Stepper Indicator Bar */}
          <View style={styles.stepperBar}>
            {[
              { num: 1, label: 'DATE' },
              { num: 2, label: 'TIME' },
              { num: 3, label: 'ADDRESS' },
            ].map((st, idx) => {
              const active = step === st.num;
              const done = step > st.num;
              return (
                <View key={st.num} style={styles.stepItemWrap}>
                  <View
                    style={[
                      styles.stepCircle,
                      active && styles.stepCircleActive,
                      done && styles.stepCircleDone,
                    ]}
                  >
                    {done ? (
                      <CheckCircle2 size={16} color="#FFFFFF" />
                    ) : (
                      <Text style={[styles.stepNumText, active && styles.stepNumTextActive]}>
                        {st.num}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.stepLabelText, active && styles.stepLabelTextActive]}>
                    {st.label}
                  </Text>
                  {idx < 2 && <View style={[styles.stepLine, done && styles.stepLineDone]} />}
                </View>
              );
            })}
          </View>

          <ScrollView style={styles.bodyScroll} contentContainerStyle={{ padding: 16 }}>
            {/* ── STEP 1: Date Selection ── */}
            {step === 1 && (
              <View style={styles.stepBody}>
                <View style={styles.sectionHeaderRow}>
                  <Calendar size={20} color="#E8700A" style={{ marginRight: 8 }} />
                  <Text style={styles.sectionTitle}>Choose a new date</Text>
                </View>

                <View style={styles.alertNoticeRow}>
                  <Text style={styles.alertNoticeText}>Select a date to continue</Text>
                  <View style={styles.maxDatePill}>
                    <AlertTriangle size={12} color="#D97706" style={{ marginRight: 4 }} />
                    <Text style={styles.maxDatePillText}>Up to {maxDateNotice}</Text>
                  </View>
                </View>

                <Text style={styles.sectionSub}>Select your preferred date for the service.</Text>

                {/* Date Input Field */}
                <TouchableOpacity
                  style={styles.inputFieldBox}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Calendar size={20} color="#E8700A" style={{ marginRight: 12 }} />
                  <Text style={styles.inputFieldValueText}>
                    {formatDateDDMMYYYY(selectedDate)}
                  </Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                    <Calendar size={18} color="#1C1917" />
                  </TouchableOpacity>
                </TouchableOpacity>

                {/* Selected Date Confirmation Card */}
                <View style={styles.selectedConfirmCard}>
                  <CheckCircle2 size={18} color="#E8700A" style={{ marginRight: 8 }} />
                  <Text style={styles.selectedConfirmText}>
                    {formatFullDateStr(selectedDate)}
                  </Text>
                </View>
              </View>
            )}

            {/* ── STEP 2: Time Selection ── */}
            {step === 2 && (
              <View style={styles.stepBody}>
                <View style={styles.sectionHeaderRow}>
                  <Clock size={20} color="#E8700A" style={{ marginRight: 8 }} />
                  <Text style={styles.sectionTitle}>Choose a preferred time</Text>
                </View>

                <Text style={styles.sectionSub}>Tap the field below to open the time picker.</Text>

                {/* Time Input Field */}
                <View style={styles.inputFieldBox}>
                  <Clock size={20} color="#E8700A" style={{ marginRight: 12 }} />
                  <Text style={styles.inputFieldValueText}>
                    {format12h(selectedTime)}
                  </Text>
                </View>

                {/* Selected Time Confirmation Card */}
                <View style={styles.selectedConfirmCard}>
                  <CheckCircle2 size={18} color="#E8700A" style={{ marginRight: 8 }} />
                  <Text style={styles.selectedConfirmText}>
                    {format12h(selectedTime)} selected
                  </Text>
                </View>

                {/* Time Slot Options Pills */}
                <Text style={[styles.sectionSub, { marginTop: 12, marginBottom: 6, fontWeight: '700' }]}>
                  Or pick from available slots:
                </Text>
                <View style={styles.timeSlotsGrid}>
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = selectedTime.slice(0, 5) === slot.value;
                    return (
                      <TouchableOpacity
                        key={slot.value}
                        style={[styles.timeSlotPill, isSelected && styles.timeSlotPillSelected]}
                        onPress={() => setSelectedTime(slot.value)}
                      >
                        <Clock size={14} color={isSelected ? '#FFFFFF' : '#854D0E'} style={{ marginRight: 6 }} />
                        <Text style={[styles.timeSlotText, isSelected && styles.timeSlotTextSelected]}>
                          {slot.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ── STEP 3: Service Address Selection ── */}
            {step === 3 && (
              <View style={styles.stepBody}>
                <View style={styles.sectionHeaderRow}>
                  <MapPin size={20} color="#E8700A" style={{ marginRight: 8 }} />
                  <Text style={styles.sectionTitle}>Choose service address</Text>
                </View>

                <Text style={styles.sectionSub}>Select the address where the service should be conducted.</Text>

                {addresses.map((addr: any) => {
                  const isSelected = String(addr.address_id) === String(selectedAddress?.address_id);
                  const label = addr.label || addr.address_type_name || 'Address';
                  const full = [addr.address, addr.street, addr.city, addr.state_name, addr.pincode].filter(Boolean).join(', ');

                  return (
                    <TouchableOpacity
                      key={addr.address_id}
                      style={[styles.addressCard, isSelected && styles.addressCardSelected]}
                      onPress={() => setSelectedAddressId(addr.address_id)}
                    >
                      {isSelected && <View style={styles.addressBarLeft} />}
                      <View style={[styles.addressIconWrap, isSelected && styles.addressIconWrapSelected]}>
                        <MapPin size={18} color={isSelected ? '#16A34A' : '#854D0E'} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <Text style={styles.addressLabel}>{label}</Text>
                          {isSelected && (
                            <View style={styles.selectedBadge}>
                              <Text style={styles.selectedBadgeText}>SELECTED</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.addressFull}>{full}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Summary Strip Box (Visible in Step 3) */}
          {step === 3 && (
            <View style={styles.summaryBox}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryLabel}>DATE</Text>
                <Text style={styles.summaryValue} numberOfLines={1}>
                  {formatFullDateStr(selectedDate)}
                </Text>
              </View>
              <View style={styles.summaryDiv} />
              <View style={styles.summaryCol}>
                <Text style={styles.summaryLabel}>TIME</Text>
                <Text style={styles.summaryValue} numberOfLines={1}>
                  {format12h(selectedTime)}
                </Text>
              </View>
              <View style={styles.summaryDiv} />
              <View style={styles.summaryCol}>
                <Text style={styles.summaryLabel}>ADDRESS</Text>
                <Text style={styles.summaryValue} numberOfLines={1}>
                  {selectedAddress?.label || selectedAddress?.city || 'baksara,ho...'}
                </Text>
              </View>
            </View>
          )}

          {/* Footer Action Buttons */}
          <View style={styles.footerWrap}>
            {step === 1 ? (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={onClose}
              >
                <Text style={styles.backBtnText}>Cancel</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => setStep(s => (s - 1) as any)}
              >
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
            )}

            {step < 3 ? (
              <TouchableOpacity
                style={styles.nextBtn}
                onPress={() => {
                  if (step === 1 && !selectedDate) {
                    showToast({ message: 'Please pick a date first', type: 'error' });
                    return;
                  }
                  setStep(s => (s + 1) as any);
                }}
              >
                <Text style={styles.nextBtnText}>Next</Text>
                <ChevronRight size={18} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirmSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <RefreshCw size={18} color="#FFFFFF" />
                    <Text style={styles.confirmBtnText}>Confirm Reschedule</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Date Picker Modal */}
      <CustomDatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        initialDate={selectedDate ? new Date(selectedDate) : new Date()}
        onSelect={(d) => {
          const formatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          setSelectedDate(formatted);
          setShowDatePicker(false);
        }}
        onSelectDate={(d) => {
          const formatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          setSelectedDate(formatted);
          setShowDatePicker(false);
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '92%',
    overflow: 'hidden',
  },
  headerBanner: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF8F0',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#FFFDF9',
    borderBottomWidth: 1,
    borderBottomColor: '#FED7AA',
  },
  stepItemWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    borderColor: '#FF6000',
    backgroundColor: '#FFFFFF',
  },
  stepCircleDone: {
    backgroundColor: '#FF6000',
    borderColor: '#FF6000',
  },
  stepNumText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9CA3AF',
  },
  stepNumTextActive: {
    color: '#FF6000',
  },
  stepLabelText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  stepLabelTextActive: {
    color: '#FF6000',
  },
  stepLine: {
    width: 24,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginLeft: 8,
  },
  stepLineDone: {
    backgroundColor: '#FF6000',
  },
  bodyScroll: {
    flex: 1,
  },
  stepBody: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1C1917',
  },
  alertNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertNoticeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D97706',
  },
  maxDatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  maxDatePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  sectionSub: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  inputFieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFD4B0',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputFieldValueText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1917',
  },
  selectedConfirmCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF5',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 10,
  },
  selectedConfirmText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#C84400',
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeSlotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  timeSlotPillSelected: {
    backgroundColor: '#FF6000',
    borderColor: '#FF6000',
  },
  timeSlotText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#854D0E',
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 10,
    position: 'relative',
    overflow: 'hidden',
    gap: 10,
  },
  addressCardSelected: {
    borderColor: '#86EFAC',
    backgroundColor: '#FFFFFF',
  },
  addressBarLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: '#16A34A',
  },
  addressIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  addressIconWrapSelected: {
    backgroundColor: '#DCFCE7',
  },
  addressLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1917',
  },
  selectedBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  selectedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  addressFull: {
    fontSize: 13,
    color: '#B45309',
    lineHeight: 18,
    fontWeight: '500',
  },
  summaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF7',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1C1917',
  },
  summaryDiv: {
    width: 1,
    height: 24,
    backgroundColor: '#FDE68A',
  },
  footerWrap: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  backBtn: {
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FF6000',
    gap: 6,
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  confirmBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FF6000',
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
