/* eslint-disable react-native/no-inline-styles */
import React, { useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '../../store';
import { useAlert } from '../../context/AlertContext';
import { useToast } from '../../context/ToastContext';
import { Colors } from '../../constants/Colors';
import TopNavBar from '../../components/common/TopNavBar';
import Dropdown from '../../components/common/Dropdown';
import CustomDatePickerModal from '../../components/common/CustomDatePickerModal';
import CustomTimePickerModal from '../../components/common/CustomTimePickerModal';
import { showLoader, hideLoader } from '../../store/slices/loaderSlice';
import {
  useSaveRelativeDetailsMutation,
  useGetGotraDetailsQuery,
} from '../../store/api/pujaApi';
import {
  ArrowLeft,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  Save,
} from 'lucide-react-native';

const BRAND_ORANGE = '#c65316';
const BRAND_BG = '#FFF8F1';

type Gender = 'Male' | 'Female' | 'Others';

const SOCIAL_RELATIONS = [
  { id: 1, name: 'Father' },
  { id: 2, name: 'Mother' },
  { id: 3, name: 'Brother' },
  { id: 4, name: 'Sister' },
  { id: 5, name: 'Son' },
  { id: 6, name: 'Daughter' },
  { id: 9, name: 'Grandfather' },
  { id: 11, name: 'Cousin' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
const convertTo24Hour = (timeStr: string): string => {
  if (!timeStr) return '';
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return timeStr;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

const formatApiDate = (dateStr: string, timeStr: string): string => {
  if (!dateStr) return '';
  const [d, m, y] = dateStr.split('/');
  const time24 = convertTo24Hour(timeStr);
  return `${y}-${m}-${d}${time24 ? ' ' + time24 : ''}`;
};

const isAlphaText = (s: string): boolean =>
  /^[a-zA-Z\u0980-\u09FF\s.'-]+$/.test(s.trim());

// ── Field component ─────────────────────────────────────────────────────────
function Field({
  label,
  required,
  value,
  onChange,
  placeholder,
  error,
  keyboardType,
  prefix,
  hint,
  onPress,
  icon,
  editable = true,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: string;
  keyboardType?: any;
  prefix?: string;
  hint?: string;
  onPress?: () => void;
  icon?: React.ReactNode;
  editable?: boolean;
}) {
  const hasErr = !!error;
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={{ color: '#DC2626' }}> *</Text>}
      </Text>
      <TouchableOpacity activeOpacity={onPress ? 0.75 : 1} onPress={onPress}>
        <View
          style={[
            styles.inputWrap,
            hasErr && styles.inputWrapErr,
            !!onPress && { backgroundColor: '#FAFAFA' },
          ]}>
          {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
          {prefix ? (
            <View style={styles.prefixBox}>
              <Text style={styles.prefixText}>{prefix}</Text>
            </View>
          ) : null}
          <TextInput
            style={[styles.input, prefix && { paddingLeft: 8 }]}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            value={value}
            onChangeText={onChange}
            keyboardType={keyboardType}
            editable={editable && !onPress}
            pointerEvents={onPress ? 'none' : 'auto'}
          />
        </View>
      </TouchableOpacity>
      {hasErr && <Text style={styles.errText}>⚠ {error}</Text>}
      {hint && !hasErr && <Text style={styles.hintText}>{hint}</Text>}
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function AddFamilyMemberScreen({ navigation, route }: any) {
  const existingRelative = route?.params?.relative;
  const isEditMode = !!existingRelative;

  const insets = useSafeAreaInsets();
  const { i18n, t } = useTranslation();
  const isBn = i18n.language === 'bn';
  const { showToast } = useToast();
  const { showAlert, showErrorAlert } = useAlert();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const [saveRelativeMutation] = useSaveRelativeDetailsMutation();
  const { data: gotraList = [] } = useGetGotraDetailsQuery();

  // Form state
  const [firstName, setFirstName] = useState(existingRelative?.firstName || '');
  const [lastName, setLastName] = useState(existingRelative?.lastName || '');
  const [gender, setGender] = useState<Gender>(existingRelative?.gender || 'Male');
  const [dob, setDob] = useState(existingRelative?.dob || '');
  const [timeOfBirth, setTimeOfBirth] = useState(existingRelative?.timeOfBirth || '');
  const [dontKnowTime, setDontKnowTime] = useState(false);
  const [gotraId, setGotraId] = useState<number | null>(existingRelative?.gotraId || null);
  const [gotraName, setGotraName] = useState(existingRelative?.gotra || '');
  const [birthPlace, setBirthPlace] = useState(existingRelative?.placeOfBirth || '');
  const [relationTypeId, setRelationTypeId] = useState<number | null>(
    existingRelative?.relationTypeId || null,
  );
  const [phone, setPhone] = useState(existingRelative?.contact || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // ── Validate ──────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!firstName.trim())
      errs.firstName = isBn ? 'প্রথম নাম আবশ্যক' : 'First name is required';
    else if (firstName.trim().length < 2)
      errs.firstName = isBn ? 'অন্তত ২ অক্ষর দিন' : 'At least 2 characters required';
    else if (!isAlphaText(firstName))
      errs.firstName = isBn ? 'শুধু অক্ষর ব্যবহার করুন' : 'Only letters allowed';

    if (!dob.trim())
      errs.dob = isBn ? 'জন্ম তারিখ আবশ্যক' : 'Date of birth is required';

    if (!dontKnowTime && !timeOfBirth.trim())
      errs.timeOfBirth = isBn ? 'জন্ম সময় আবশ্যক' : 'Time of birth is required';

    if (!gotraId)
      errs.gotra = isBn ? 'গোত্র নির্বাচন করুন' : 'Please select a Gotra';

    if (!birthPlace.trim())
      errs.birthPlace = isBn ? 'জন্মস্থান আবশ্যক' : 'Birth place is required';

    if (!relationTypeId)
      errs.relationType = isBn ? 'সম্পর্ক নির্বাচন করুন' : 'Please select a relation';

    if (!phone.trim())
      errs.phone = isBn ? 'ফোন নম্বর আবশ্যক' : 'Phone number is required';
    else if (!/^\d{10}$/.test(phone.trim()))
      errs.phone = isBn ? 'সঠিক ১০ সংখ্যার নম্বর দিন' : 'Enter a valid 10-digit number';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      showToast({ message: t('common.connectionRequired'), type: 'error' });
      return;
    }
    if (!validate()) return;

    try {
      dispatch(showLoader());

      const relGenderNum = gender === 'Male' ? 1 : gender === 'Female' ? 2 : 3;
      const relDbIdForApi = existingRelative?.dbId ?? 0;

      const payload = [
        {
          relative_auth_id: relDbIdForApi,
          main_auth_id: user?.user_id || 0,
          full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          date_of_birth: formatApiDate(dob, dontKnowTime ? '' : timeOfBirth),
          place_of_birth: birthPlace.trim(),
          contact_no: phone.trim(),
          gender: relGenderNum,
          gotram: gotraId,
          created_by: 3,
        },
      ];

      console.log('=== ADD FAMILY MEMBER PAYLOAD ===', JSON.stringify(payload, null, 2));

      const result = await saveRelativeMutation({
        data: JSON.stringify({ enc_data: JSON.stringify(payload) }),
      }).unwrap();

      dispatch(hideLoader());

      if (result.status === 0) {
        showAlert({
          title: isBn ? 'সফল' : 'Success',
          message:
            result.message ||
            (isEditMode
              ? isBn
                ? 'পরিবারের সদস্য আপডেট হয়েছে'
                : 'Family member updated successfully'
              : isBn
              ? 'পরিবারের সদস্য যোগ হয়েছে'
              : 'Family member added successfully'),
          buttons: [{ text: 'OK', onPress: () => navigation.goBack() }],
        });
      } else {
        showErrorAlert(result.message || (isBn ? 'পরিবারের সদস্য যোগ/আপডেট করতে সমস্যা হয়েছে' : 'Failed to save family member. Please try again.'));
      }
    } catch (err: any) {
      dispatch(hideLoader());
      showErrorAlert(
        err?.data?.message || (isBn ? 'পরিবারের সদস্য যোগ/আপডেট করতে সমস্যা হয়েছে' : 'Failed to save family member. Please try again.'),
      );
    }
  };

  // suppress unused warning
  void gotraName;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND_ORANGE} />
      <TopNavBar showBack={true} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* Back link */}
          <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
            <ArrowLeft size={16} color={BRAND_ORANGE} />
            <Text style={styles.backText}>
              {isBn ? 'প্রোফাইলে ফিরুন' : 'Back to profile'}
            </Text>
          </TouchableOpacity>

          {/* Page header */}
          <Text style={styles.badge}>{isBn ? 'আমার অ্যাকাউন্ট' : 'MY ACCOUNT'}</Text>
          <Text style={styles.pageTitle}>
            {isEditMode
              ? isBn ? 'পরিবারের সদস্য সম্পাদনা' : 'Edit family member'
              : isBn ? 'পরিবারের সদস্য যোগ করুন' : 'Add family member'}
          </Text>
          <Text style={styles.pageSubtitle}>
            {isBn
              ? 'দ্রুত ভবিষ্যতে বুকিংয়ের জন্য পরিবারের তথ্য সংরক্ষণ করুন।'
              : 'Save accurate family details for faster future bookings.'}
          </Text>

          {/* Form card */}
          <View style={styles.card}>
            {/* Card header */}
            <View style={styles.cardHeader}>
              <View style={styles.cardIconBox}>
                <Users size={20} color={BRAND_ORANGE} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>
                  {isBn ? 'ব্যক্তিগত তথ্য' : 'Personal Details'}
                </Text>
                <Text style={styles.cardSubtitle}>
                  {isBn
                    ? 'তারকাচিহ্নিত ক্ষেত্রগুলো পূরণ করা আবশ্যক।'
                    : 'Fields marked with an asterisk are required.'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* First Name */}
            <Field
              label={isBn ? 'প্রথম নাম' : 'FIRST NAME'}
              required
              value={firstName}
              onChange={txt => {
                setFirstName(txt.replace(/[^a-zA-Z\u0980-\u09FF\s.'-]/g, ''));
                if (errors.firstName) setErrors(p => ({ ...p, firstName: '' }));
              }}
              placeholder={isBn ? 'প্রথম নাম লিখুন' : 'Enter first name'}
              error={errors.firstName}
            />

            {/* Last Name */}
            <Field
              label={isBn ? 'শেষ নাম' : 'LAST NAME'}
              value={lastName}
              onChange={txt =>
                setLastName(txt.replace(/[^a-zA-Z\u0980-\u09FF\s.'-]/g, ''))
              }
              placeholder={isBn ? 'শেষ নাম লিখুন' : 'Enter last name'}
              error={errors.lastName}
            />

            {/* Gender */}
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.label}>
                {isBn ? 'লিঙ্গ' : 'GENDER'}
                <Text style={{ color: '#DC2626' }}> *</Text>
              </Text>
              <View style={styles.genderRow}>
                {(['Male', 'Female', 'Others'] as Gender[]).map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                    onPress={() => setGender(g)}>
                    <Text
                      style={[
                        styles.genderBtnText,
                        gender === g && styles.genderBtnTextActive,
                      ]}>
                      {isBn
                        ? g === 'Male' ? 'পুরুষ' : g === 'Female' ? 'মহিলা' : 'অন্যান্য'
                        : g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Date of Birth */}
            <Field
              label={isBn ? 'জন্ম তারিখ' : 'DATE OF BIRTH'}
              required
              value={dob}
              onChange={() => {}}
              placeholder={isBn ? 'জন্ম তারিখ বেছে নিন' : 'Select date of birth'}
              error={errors.dob}
              onPress={() => setShowDatePicker(true)}
              icon={<Calendar size={18} color={BRAND_ORANGE} />}
            />

            {/* Time of Birth */}
            <Field
              label={isBn ? 'জন্ম সময়' : 'TIME OF BIRTH'}
              required
              value={timeOfBirth}
              onChange={() => {}}
              placeholder={isBn ? 'জন্ম সময় বেছে নিন' : 'Select time of birth'}
              error={dontKnowTime ? '' : errors.timeOfBirth}
              onPress={dontKnowTime ? undefined : () => setShowTimePicker(true)}
              icon={<Clock size={18} color={BRAND_ORANGE} />}
              editable={!dontKnowTime}
            />

            {/* Don't know birth time */}
            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => {
                setDontKnowTime(v => !v);
                if (!dontKnowTime) setTimeOfBirth('');
                setErrors(p => ({ ...p, timeOfBirth: '' }));
              }}>
              <View style={[styles.checkbox, dontKnowTime && styles.checkboxOn]}>
                {dontKnowTime && (
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>✓</Text>
                )}
              </View>
              <Text style={styles.checkLabel}>
                {isBn ? 'জন্ম সময় জানি না' : "I don't know the birth time"}
              </Text>
            </TouchableOpacity>

            {/* Gotra */}
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.label}>
                {isBn ? 'গোত্র' : 'GOTRA'}
                <Text style={{ color: '#DC2626' }}> *</Text>
              </Text>
              <Dropdown
                options={gotraList.map((g: any) => ({
                  id: g.gotra_id,
                  name: g.gotra_name,
                }))}
                value={gotraId}
                onSelect={(val: number) => {
                  setGotraId(val);
                  const found = gotraList.find((g: any) => g.gotra_id === val);
                  if (found) setGotraName(found.gotra_name);
                  setErrors(p => ({ ...p, gotra: '' }));
                }}
                placeholder={isBn ? 'গোত্র নির্বাচন করুন' : 'Select gotra'}
              />
              {errors.gotra ? <Text style={styles.errText}>⚠ {errors.gotra}</Text> : null}
            </View>

            {/* Birth Place */}
            <Field
              label={isBn ? 'জন্মস্থান' : 'BIRTH PLACE'}
              required
              value={birthPlace}
              onChange={txt => {
                setBirthPlace(txt);
                if (errors.birthPlace) setErrors(p => ({ ...p, birthPlace: '' }));
              }}
              placeholder={isBn ? 'জন্মস্থান লিখুন' : 'Enter birth place'}
              error={errors.birthPlace}
            />

            {/* Relation Type */}
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.label}>
                {isBn ? 'সম্পর্কের ধরন' : 'RELATION TYPE'}
                <Text style={{ color: '#DC2626' }}> *</Text>
              </Text>
              <Dropdown
                options={SOCIAL_RELATIONS.map(r => ({ id: r.id, name: r.name }))}
                value={relationTypeId}
                onSelect={(val: number) => {
                  setRelationTypeId(val);
                  setErrors(p => ({ ...p, relationType: '' }));
                }}
                placeholder={isBn ? 'সম্পর্ক নির্বাচন করুন' : 'Select Relation'}
              />
              {errors.relationType ? (
                <Text style={styles.errText}>⚠ {errors.relationType}</Text>
              ) : null}
            </View>

            {/* Phone */}
            <Field
              label={isBn ? 'ফোন' : 'PHONE'}
              required
              value={phone}
              onChange={txt => {
                setPhone(txt.replace(/[^0-9]/g, ''));
                if (errors.phone) setErrors(p => ({ ...p, phone: '' }));
              }}
              placeholder="XXXXXXXXXX"
              error={errors.phone}
              keyboardType="phone-pad"
              prefix="+91"
              hint={
                isBn
                  ? 'পরিবারের সদস্যের ১০ সংখ্যার মোবাইল নম্বর দিন।'
                  : "Enter the family member's 10-digit Indian mobile number."
              }
            />
          </View>

          {/* Review notice */}
          <View style={styles.reviewBox}>
            <CheckCircle2 size={20} color="#16A34A" style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.reviewTitle}>
                {isBn ? 'সংরক্ষণের আগে পর্যালোচনা করুন' : 'Review before saving'}
              </Text>
              <Text style={styles.reviewSub}>
                {isBn
                  ? 'এই পরিবারের সদস্য ভবিষ্যতের পূজা বুকিংয়ে পাওয়া যাবে।'
                  : 'This family member will be available for future puja bookings.'}
              </Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => navigation.goBack()}>
              <Text style={styles.cancelBtnText}>{isBn ? 'বাতিল' : 'Cancel'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Save size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.saveBtnText}>
                {isEditMode
                  ? isBn ? 'আপডেট করুন' : 'Update member'
                  : isBn ? 'সদস্য যোগ করুন' : 'Add family member'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: insets.bottom + 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomDatePickerModal
        mode="date"
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelect={(date: Date) => {
          const dd = date.getDate().toString().padStart(2, '0');
          const mm = (date.getMonth() + 1).toString().padStart(2, '0');
          const yyyy = date.getFullYear();
          setDob(`${dd}/${mm}/${yyyy}`);
          setErrors(p => ({ ...p, dob: '' }));
          setShowDatePicker(false);
        }}
      />

      <CustomTimePickerModal
        visible={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        onSelect={(time: string) => {
          setTimeOfBirth(time);
          setErrors(p => ({ ...p, timeOfBirth: '' }));
          setShowTimePicker(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BRAND_BG },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12 },

  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backText: { marginLeft: 6, fontSize: 14, color: BRAND_ORANGE, fontWeight: '500' },

  badge: {
    fontSize: 12,
    fontWeight: '700',
    color: BRAND_ORANGE,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  pageTitle: { fontSize: 26, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
  pageSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 20, lineHeight: 20 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  cardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFF3EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  cardSubtitle: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 16 },

  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B4C2A',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    height: 48,
    overflow: 'hidden',
  },
  inputWrapErr: { borderColor: '#DC2626' },
  input: { flex: 1, fontSize: 14, color: '#1F2937', height: '100%', paddingVertical: 0 },
  errText: { color: '#DC2626', fontSize: 12, marginTop: 4 },
  hintText: { color: '#6B7280', fontSize: 11, marginTop: 4 },

  prefixBox: {
    height: 48,
    justifyContent: 'center',
    paddingRight: 10,
    marginRight: 4,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  prefixText: { fontSize: 14, color: '#374151', fontWeight: '600' },

  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: {
    flex: 1,
    height: 44,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  genderBtnActive: { borderColor: BRAND_ORANGE, backgroundColor: '#FFF3EB' },
  genderBtnText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  genderBtnTextActive: { color: BRAND_ORANGE },

  checkRow: { flexDirection: 'row', alignItems: 'center', marginTop: -4, marginBottom: 16 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: '#FFF',
  },
  checkboxOn: { backgroundColor: BRAND_ORANGE, borderColor: BRAND_ORANGE },
  checkLabel: { fontSize: 13, color: '#374151' },

  reviewBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  reviewTitle: { fontSize: 13, fontWeight: '700', color: '#15803D', marginBottom: 2 },
  reviewSub: { fontSize: 12, color: '#16A34A', lineHeight: 18 },

  btnRow: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  saveBtn: {
    flex: 2,
    height: 50,
    borderRadius: 12,
    backgroundColor: BRAND_ORANGE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
