/* eslint-disable react-native/no-inline-styles */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '../../store';
import { useAlert } from '../../context/AlertContext';
import { showLoader, hideLoader } from '../../store/slices/loaderSlice';
import { useDispatch } from 'react-redux';

const BRAND_ORANGE = '#F97316';
const BRAND_TEXT = '#1F2937';
const BRAND_MUTED = '#6B7280';
const ERROR_COLOR = '#EF4444';

type Gender = 'Male' | 'Female' | 'Others';

interface RelativeProfile {
  id: string;
  relationType: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  dob: string;
  timeOfBirth: string;
  placeOfBirth: string;
  gotram: string;
}

interface ProfileErrors {
  firstName?: string;
  lastName?: string;
  dob?: string;
  timeOfBirth?: string;
  birthPlace?: string;
  gotro?: string;
}

interface RelErrors {
  firstName?: string;
  relationType?: string;
  dob?: string;
  timeOfBirth?: string;
}

const RELATION_TYPES = [
  'Father',
  'Mother',
  'Spouse',
  'Son',
  'Daughter',
  'Brother',
  'Sister',
  'Other',
];

// ── Reusable field components ─────────────────────────────────────────────────

function Field({
  label,
  required,
  value,
  onChange,
  placeholder,
  error,
  keyboardType,
  multiline,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: string;
  keyboardType?: any;
  multiline?: boolean;
}) {
  const hasErr = !!error;
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.fieldLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMulti,
          hasErr && styles.inputError,
        ]}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {hasErr && <Text style={styles.errorText}>⚠ {error}</Text>}
    </View>
  );
}

function GenderPicker({
  value,
  onChange,
}: {
  value: Gender;
  onChange: (g: Gender) => void;
}) {
  return (
    <View style={styles.genderRow}>
      {(['Male', 'Female', 'Others'] as Gender[]).map(g => (
        <TouchableOpacity
          key={g}
          style={[styles.genderBtn, value === g && styles.genderBtnActive]}
          onPress={() => onChange(g)}
        >
          <Text
            style={[
              styles.genderBtnText,
              value === g && styles.genderBtnTextActive,
            ]}
          >
            {g}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function EditProfileScreen({ navigation }: any) {
  const { i18n } = useTranslation();
  const isBn = i18n.language === 'bn';
  const { showAlert } = useAlert();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  // ── Profile form ──────────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [timeOfBirth, setTimeOfBirth] = useState('');
  const [gender, setGender] = useState<Gender>('Male');
  const [birthPlace, setBirthPlace] = useState('');
  const [gotro, setGotro] = useState('');
  const [address, setAddress] = useState('');
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});

  // ── Helpers ───────────────────────────────────────────────────────────────
  const isValidCalendarDate = (ddmmyyyy: string): boolean => {
    const parts = ddmmyyyy.split('/');
    if (parts.length !== 3) return false;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 1900 || year > new Date().getFullYear()) return false;
    const date = new Date(year, month - 1, day);
    if (date > new Date()) return false; // DOB must be in the past
    return date.getDate() === day && date.getMonth() === month - 1;
  };

  const isValidTimeFormat = (t: string): boolean => {
    // Accepts: HH:MM AM/PM or H:MM AM/PM (e.g. 09:30 AM, 3:00 PM)
    return /^([01]?\d|2[0-3]):[0-5]\d\s?(AM|PM|am|pm)$/i.test(t.trim());
  };

  const isAlphaText = (s: string): boolean =>
    /^[a-zA-Z\u0980-\u09FF\s.'-]+$/.test(s.trim());

  // ── Profile validation ────────────────────────────────────────────────────
  const validateProfile = (): boolean => {
    const errs: ProfileErrors = {};

    // First Name
    if (!firstName.trim())
      errs.firstName = isBn ? 'প্রথম নাম আবশ্যক' : 'First name is required';
    else if (firstName.trim().length < 2)
      errs.firstName = isBn
        ? 'অন্তত ২টি অক্ষর আবশ্যক'
        : 'At least 2 characters required';
    else if (!isAlphaText(firstName))
      errs.firstName = isBn
        ? 'শুধুমাত্র অক্ষর ব্যবহার করুন'
        : 'Only letters allowed';

    // Last Name
    if (!lastName.trim())
      errs.lastName = isBn ? 'শেষ নাম আবশ্যক' : 'Last name is required';
    else if (lastName.trim().length < 2)
      errs.lastName = isBn
        ? 'অন্তত ২টি অক্ষর আবশ্যক'
        : 'At least 2 characters required';
    else if (!isAlphaText(lastName))
      errs.lastName = isBn
        ? 'শুধুমাত্র অক্ষর ব্যবহার করুন'
        : 'Only letters allowed';

    // Date of Birth
    if (!dob.trim())
      errs.dob = isBn ? 'জন্ম তারিখ আবশ্যক' : 'Date of birth is required';
    else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dob))
      errs.dob = isBn ? 'সঠিক ফরম্যাট: DD/MM/YYYY' : 'Format: DD/MM/YYYY';
    else if (!isValidCalendarDate(dob))
      errs.dob = isBn ? 'বৈধ অতীত তারিখ লিখুন' : 'Enter a valid past date';

    // Time of Birth
    if (!timeOfBirth.trim())
      errs.timeOfBirth = isBn
        ? 'জন্ম সময় আবশ্যক'
        : 'Time of birth is required';
    else if (!isValidTimeFormat(timeOfBirth))
      errs.timeOfBirth = isBn
        ? 'সঠিক ফরম্যাট: HH:MM AM/PM'
        : 'Format: HH:MM AM or PM';

    // Birth Place
    if (!birthPlace.trim())
      errs.birthPlace = isBn ? 'জন্মস্থান আবশ্যক' : 'Birth place is required';
    else if (birthPlace.trim().length < 2)
      errs.birthPlace = isBn
        ? 'অন্তত ২টি অক্ষর আবশ্যক'
        : 'At least 2 characters required';

    // Gotro
    if (!gotro.trim()) errs.gotro = isBn ? 'গোত্র আবশ্যক' : 'Gotro is required';
    else if (gotro.trim().length < 2)
      errs.gotro = isBn
        ? 'অন্তত ২টি অক্ষর আবশ্যক'
        : 'At least 2 characters required';

    setProfileErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveProfile = () => {
    if (!validateProfile()) return;
    dispatch(showLoader());
    setTimeout(() => {
      dispatch(hideLoader());
      showAlert({
        title: isBn ? 'সফল' : 'Profile Saved',
        message: isBn
          ? 'আপনার প্রোফাইল সফলভাবে সংরক্ষিত হয়েছে।'
          : 'Your profile has been saved successfully.',
        buttons: [{ text: 'OK' }],
      });
    }, 800);
  };

  // ── Relative form ─────────────────────────────────────────────────────────
  const [relatives, setRelatives] = useState<RelativeProfile[]>([]);
  const [showAddRelative, setShowAddRelative] = useState(false);
  const [relationType, setRelationType] = useState('');
  const [relFirstName, setRelFirstName] = useState('');
  const [relLastName, setRelLastName] = useState('');
  const [relGender, setRelGender] = useState<Gender>('Male');
  const [relDob, setRelDob] = useState('');
  const [relTimeOfBirth, setRelTimeOfBirth] = useState('');
  const [relPlaceOfBirth, setRelPlaceOfBirth] = useState('');
  const [relGotram, setRelGotram] = useState('');
  const [relErrors, setRelErrors] = useState<RelErrors>({});

  // ── Relative validation ───────────────────────────────────────────────────
  const validateRelative = (): boolean => {
    const errs: RelErrors = {};

    // Relation Type
    if (!relationType.trim())
      errs.relationType = isBn
        ? 'সম্পর্কের ধরন নির্বাচন করুন'
        : 'Please select a relation type';

    // First Name
    if (!relFirstName.trim())
      errs.firstName = isBn ? 'প্রথম নাম আবশ্যক' : 'First name is required';
    else if (relFirstName.trim().length < 2)
      errs.firstName = isBn
        ? 'অন্তত ২টি অক্ষর আবশ্যক'
        : 'At least 2 characters required';

    // Date of Birth
    if (!relDob.trim())
      errs.dob = isBn ? 'জন্ম তারিখ আবশ্যক' : 'Date of birth is required';
    else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(relDob))
      errs.dob = isBn ? 'সঠিক ফরম্যাট: DD/MM/YYYY' : 'Format: DD/MM/YYYY';
    else if (!isValidCalendarDate(relDob))
      errs.dob = isBn ? 'বৈধ অতীত তারিখ লিখুন' : 'Enter a valid past date';

    // Time of Birth (optional but if filled must be valid format)
    if (relTimeOfBirth.trim() && !isValidTimeFormat(relTimeOfBirth))
      errs.timeOfBirth = isBn
        ? 'সঠিক ফরম্যাট: HH:MM AM/PM'
        : 'Format: HH:MM AM or PM';

    setRelErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveRelative = () => {
    if (!validateRelative()) return;
    dispatch(showLoader());
    setTimeout(() => {
      setRelatives(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          relationType,
          firstName: relFirstName,
          lastName: relLastName,
          gender: relGender,
          dob: relDob,
          timeOfBirth: relTimeOfBirth,
          placeOfBirth: relPlaceOfBirth,
          gotram: relGotram,
        },
      ]);
      setRelationType('');
      setRelFirstName('');
      setRelLastName('');
      setRelGender('Male');
      setRelDob('');
      setRelTimeOfBirth('');
      setRelPlaceOfBirth('');
      setRelGotram('');
      setRelErrors({});
      setShowAddRelative(false);
      dispatch(hideLoader());
    }, 600);
  };

  const clearRelForm = () => {
    setRelErrors({});
    setShowAddRelative(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={BRAND_ORANGE} barStyle="light-content" />
      <SafeAreaView>
        <View style={styles.headerBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerBackBtn}
          >
            <Text style={styles.headerBackText}>
              ← {isBn ? 'ফিরে যান' : 'Back to Dashboard'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarOuter}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>
                {(user?.user_name ?? 'U').toString().slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity style={styles.cameraBtn}>
              <Text style={styles.cameraIcon}>📷</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarName}>{user?.user_name || 'User'}</Text>
          <Text style={styles.avatarPhone}>{user?.mobile || ''}</Text>
        </View>

        {/* ── Profile Form Card ── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {isBn ? 'মৌলিক তথ্য' : 'Basic Information'}
          </Text>

          <View style={styles.rowTwo}>
            <Field
              label={isBn ? 'প্রথম নাম' : 'FIRST NAME'}
              required
              value={firstName}
              onChange={v => {
                setFirstName(v);
                if (profileErrors.firstName)
                  setProfileErrors(p => ({ ...p, firstName: undefined }));
              }}
              placeholder={isBn ? 'প্রথম নাম লিখুন' : 'Enter first name'}
              error={profileErrors.firstName}
            />
            <Field
              label={isBn ? 'শেষ নাম' : 'LAST NAME'}
              required
              value={lastName}
              onChange={v => {
                setLastName(v);
                if (profileErrors.lastName)
                  setProfileErrors(p => ({ ...p, lastName: undefined }));
              }}
              placeholder={isBn ? 'শেষ নাম লিখুন' : 'Enter last name'}
              error={profileErrors.lastName}
            />
          </View>

          <View style={styles.sectionDivider} />
          <Text style={styles.sectionTitle}>
            {isBn ? 'ব্যক্তিগত বিবরণ' : 'Personal Details'}
          </Text>

          <View style={styles.rowTwo}>
            <Field
              label={isBn ? 'জন্ম তারিখ' : 'DATE OF BIRTH'}
              required
              value={dob}
              onChange={v => {
                setDob(v);
                if (profileErrors.dob)
                  setProfileErrors(p => ({ ...p, dob: undefined }));
              }}
              placeholder="DD/MM/YYYY"
              keyboardType="numeric"
              error={profileErrors.dob}
            />
            <Field
              label={isBn ? 'জন্ম সময়' : 'TIME OF BIRTH'}
              required
              value={timeOfBirth}
              onChange={v => {
                setTimeOfBirth(v);
                if (profileErrors.timeOfBirth)
                  setProfileErrors(p => ({ ...p, timeOfBirth: undefined }));
              }}
              placeholder="HH:MM AM/PM"
              error={profileErrors.timeOfBirth}
            />
          </View>

          <Text style={styles.fieldLabel}>{isBn ? 'লিঙ্গ' : 'GENDER'}</Text>
          <GenderPicker value={gender} onChange={setGender} />

          <View style={styles.rowTwo}>
            <Field
              label={isBn ? 'জন্মস্থান' : 'BIRTH PLACE'}
              required
              value={birthPlace}
              onChange={v => {
                setBirthPlace(v);
                if (profileErrors.birthPlace)
                  setProfileErrors(p => ({ ...p, birthPlace: undefined }));
              }}
              placeholder={isBn ? 'জন্মস্থান লিখুন' : 'Enter birth place'}
              error={profileErrors.birthPlace}
            />
            <Field
              label={isBn ? 'গোত্র' : 'GOTRO'}
              required
              value={gotro}
              onChange={v => {
                setGotro(v);
                if (profileErrors.gotro)
                  setProfileErrors(p => ({ ...p, gotro: undefined }));
              }}
              placeholder={isBn ? 'গোত্র লিখুন' : 'Enter gotro'}
              error={profileErrors.gotro}
            />
          </View>

          <Text style={styles.fieldLabel}>{isBn ? 'ঠিকানা' : 'ADDRESS'}</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            placeholder={isBn ? 'আপনার ঠিকানা লিখুন' : 'Enter your address'}
            placeholderTextColor="#9CA3AF"
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Save Profile Footer */}
          <View style={styles.saveBox}>
            <View style={styles.saveBoxLeft}>
              <View style={styles.saveIconCircle}>
                <Text style={styles.saveIcon}>👤</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.saveBoxTitle}>
                  {isBn ? 'প্রোফাইল সংরক্ষণ' : 'Save Profile'}
                </Text>
                <Text style={styles.saveBoxSub}>
                  {isBn
                    ? 'শুধু ব্যক্তিগত তথ্য আপডেট হবে।'
                    : 'Updates your personal information only.'}
                </Text>
              </View>
            </View>
            <View style={styles.saveBoxBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.cancelBtnText}>
                  {isBn ? 'বাতিল' : 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveProfile}
              >
                <Text style={styles.saveBtnText}>
                  {isBn ? 'সংরক্ষণ' : 'Save Profile'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Relation Details Card ── */}
        <View style={styles.card}>
          <View style={styles.relationHeader}>
            <Text style={styles.sectionTitle}>
              {isBn ? 'সম্পর্কের বিবরণ' : 'Relation Details'}
            </Text>
            <TouchableOpacity
              style={styles.addRelBtn}
              onPress={() => {
                setRelErrors({});
                setShowAddRelative(true);
              }}
            >
              <Text style={styles.addRelBtnText}>
                + {isBn ? 'সম্পর্ক যোগ' : 'Add Relation'}
              </Text>
            </TouchableOpacity>
          </View>

          {relatives.map(rel => (
            <View key={rel.id} style={styles.relativeCard}>
              <Text style={styles.relativeCardTitle}>
                {rel.firstName} {rel.lastName}
              </Text>
              <Text style={styles.relativeCardSub}>
                {rel.relationType} · {rel.gender} · {rel.dob}
              </Text>
            </View>
          ))}

          {showAddRelative && (
            <View style={styles.addRelForm}>
              <Text style={styles.addRelFormTitle}>
                {isBn ? 'নতুন আত্মীয় প্রোফাইল' : 'New Relative Profile'}
              </Text>

              <Text style={styles.fieldLabel}>
                {isBn ? 'সম্পর্কের ধরন' : 'RELATION TYPE'}{' '}
                <Text style={styles.required}>*</Text>
              </Text>
              <View
                style={[
                  styles.relationPickerBox,
                  relErrors.relationType ? styles.relationPickerBoxError : null,
                ]}
              >
                {RELATION_TYPES.map(r => (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.relationOption,
                      relationType === r && styles.relationOptionActive,
                    ]}
                    onPress={() => {
                      setRelationType(r);
                      if (relErrors.relationType)
                        setRelErrors(p => ({ ...p, relationType: undefined }));
                    }}
                  >
                    <Text
                      style={[
                        styles.relationOptionText,
                        relationType === r && styles.relationOptionTextActive,
                      ]}
                    >
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {relErrors.relationType && (
                <Text
                  style={[
                    styles.errorText,
                    { marginBottom: 16, marginTop: -8 },
                  ]}
                >
                  ⚠ {relErrors.relationType}
                </Text>
              )}

              <View style={styles.rowTwo}>
                <Field
                  label={isBn ? 'প্রথম নাম' : 'FIRST NAME'}
                  required
                  value={relFirstName}
                  onChange={v => {
                    setRelFirstName(v);
                    if (relErrors.firstName)
                      setRelErrors(p => ({ ...p, firstName: undefined }));
                  }}
                  placeholder={isBn ? 'প্রথম নাম' : 'Enter first name'}
                  error={relErrors.firstName}
                />
                <Field
                  label={isBn ? 'শেষ নাম' : 'LAST NAME'}
                  value={relLastName}
                  onChange={setRelLastName}
                  placeholder={isBn ? 'শেষ নাম' : 'Enter last name'}
                />
              </View>

              <Text style={styles.fieldLabel}>{isBn ? 'লিঙ্গ' : 'GENDER'}</Text>
              <GenderPicker value={relGender} onChange={setRelGender} />

              <View style={styles.rowTwo}>
                <Field
                  label={isBn ? 'জন্ম তারিখ' : 'DATE OF BIRTH'}
                  required
                  value={relDob}
                  onChange={v => {
                    setRelDob(v);
                    if (relErrors.dob)
                      setRelErrors(p => ({ ...p, dob: undefined }));
                  }}
                  placeholder="DD/MM/YYYY"
                  keyboardType="numeric"
                  error={relErrors.dob}
                />
                <Field
                  label={isBn ? 'জন্ম সময়' : 'TIME OF BIRTH'}
                  value={relTimeOfBirth}
                  onChange={v => {
                    setRelTimeOfBirth(v);
                    if (relErrors.timeOfBirth)
                      setRelErrors(p => ({ ...p, timeOfBirth: undefined }));
                  }}
                  placeholder="HH:MM AM/PM"
                  error={relErrors.timeOfBirth}
                />
              </View>

              <View style={styles.rowTwo}>
                <Field
                  label={isBn ? 'জন্মস্থান' : 'PLACE OF BIRTH'}
                  value={relPlaceOfBirth}
                  onChange={setRelPlaceOfBirth}
                  placeholder={isBn ? 'জন্মস্থান' : 'Enter place of birth'}
                />
                <Field
                  label={isBn ? 'গোত্র' : 'GOTRAM'}
                  value={relGotram}
                  onChange={setRelGotram}
                  placeholder={isBn ? 'গোত্র' : 'Enter gotram'}
                />
              </View>

              <View style={styles.relFormBtnsRow}>
                <TouchableOpacity
                  style={styles.relCancelBtn}
                  onPress={clearRelForm}
                >
                  <Text style={styles.relCancelBtnText}>
                    {isBn ? 'বাতিল' : 'Cancel'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.relSaveBtn}
                  onPress={handleSaveRelative}
                >
                  <Text style={styles.relSaveBtnText}>
                    {isBn ? 'আত্মীয় সংরক্ষণ করুন' : 'Save Relative'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF8F0' },
  headerBar: {
    backgroundColor: BRAND_ORANGE,
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingTop: Platform.OS === 'android' ? 36 : 14,
  },
  headerBackBtn: { flexDirection: 'row', alignItems: 'center' },
  headerBackText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  body: { flex: 1 },

  avatarSection: {
    backgroundColor: BRAND_ORANGE,
    alignItems: 'center',
    paddingBottom: 32,
    paddingTop: 8,
  },
  avatarOuter: { position: 'relative', marginBottom: 10 },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF8C3A',
    borderWidth: 3,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: '#FFF', fontSize: 36, fontWeight: '900' },
  cameraBtn: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cameraIcon: { fontSize: 13 },
  avatarName: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  avatarPhone: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: BRAND_TEXT,
    marginBottom: 16,
  },
  sectionDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 20 },

  rowTwo: { flexDirection: 'row', gap: 12, marginBottom: 16 },

  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: BRAND_MUTED,
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  required: { color: ERROR_COLOR },

  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: BRAND_TEXT,
    backgroundColor: '#FAFAFA',
  },
  inputError: { borderColor: ERROR_COLOR, backgroundColor: '#FFF5F5' },
  inputMulti: { height: 80, textAlignVertical: 'top', marginBottom: 16 },
  errorText: {
    fontSize: 11,
    color: ERROR_COLOR,
    marginTop: 4,
    fontWeight: '500',
  },

  genderRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  genderBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  genderBtnActive: { backgroundColor: BRAND_ORANGE, borderColor: BRAND_ORANGE },
  genderBtnText: { fontSize: 13, fontWeight: '600', color: BRAND_MUTED },
  genderBtnTextActive: { color: '#FFF', fontWeight: '700' },

  saveBox: {
    backgroundColor: '#FFFBF5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 12,
    marginTop: 8,
    gap: 10,
  },
  saveBoxLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  saveIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveIcon: { fontSize: 18 },
  saveBoxTitle: { fontSize: 13, fontWeight: '700', color: BRAND_TEXT },
  saveBoxSub: { fontSize: 10, color: BRAND_MUTED, marginTop: 2 },
  saveBoxBtns: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  cancelBtn: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelBtnText: { fontSize: 13, color: BRAND_MUTED, fontWeight: '600' },
  saveBtn: {
    backgroundColor: BRAND_ORANGE,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveBtnText: { fontSize: 13, color: '#FFF', fontWeight: '700' },

  relationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addRelBtn: {
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#FFFBF5',
  },
  addRelBtnText: { fontSize: 12, color: BRAND_ORANGE, fontWeight: '700' },

  relativeCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  relativeCardTitle: { fontSize: 14, fontWeight: '700', color: BRAND_TEXT },
  relativeCardSub: { fontSize: 11, color: BRAND_MUTED, marginTop: 4 },

  addRelForm: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
    marginTop: 8,
  },
  addRelFormTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: BRAND_TEXT,
    marginBottom: 16,
  },

  relationPickerBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  relationPickerBoxError: {
    padding: 8,
    borderWidth: 1,
    borderColor: ERROR_COLOR,
    borderRadius: 12,
    backgroundColor: '#FFF5F5',
  },
  relationOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
  },
  relationOptionActive: {
    backgroundColor: BRAND_ORANGE,
    borderColor: BRAND_ORANGE,
  },
  relationOptionText: { fontSize: 12, color: BRAND_MUTED, fontWeight: '600' },
  relationOptionTextActive: { color: '#FFF', fontWeight: '700' },

  relFormBtnsRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  relCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  relCancelBtnText: { fontSize: 14, color: BRAND_MUTED, fontWeight: '600' },
  relSaveBtn: {
    flex: 2,
    backgroundColor: BRAND_TEXT,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  relSaveBtnText: { fontSize: 14, color: '#FFF', fontWeight: '700' },

  bottomSpacer: { height: 60 },
});
