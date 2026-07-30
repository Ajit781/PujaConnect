/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Modal,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '../../store';
import { useAlert } from '../../context/AlertContext';
import { Colors } from '../../constants/Colors';
import TopNavBar from '../../components/common/TopNavBar';
import LinearGradient from 'react-native-linear-gradient';


import { RefreshCcw, Pencil, MapPin, User, Flame, CalendarDays, Plus, Users } from 'lucide-react-native';
import {
  useGetUserDetailsQuery,
  useSaveRelativeDetailsMutation,
  useDeleteRelativeDetailsMutation,
  useGetGotraDetailsQuery,
  useSaveAddressV1Mutation,
} from '../../store/api/pujaApi';
import CustomDatePickerModal from '../../components/common/CustomDatePickerModal';
import CustomTimePickerModal from '../../components/common/CustomTimePickerModal';
import Dropdown from '../../components/common/Dropdown';
import { showLoader, hideLoader } from '../../store/slices/loaderSlice';
import { useToast } from '../../context/ToastContext';

const BRAND_ORANGE = Colors.primary;
const BRAND_TEXT = Colors.textMain;
const BRAND_MUTED = Colors.textMuted;

type Gender = 'Male' | 'Female' | 'Others';

interface RelativeProfile {
  id: string;
  dbId?: number;
  relationType: string;
  relationTypeId?: number;
  firstName: string;
  lastName: string;
  gender: Gender;
  dob: string;
  timeOfBirth: string;
  placeOfBirth: string;
  gotra: string;
  gotraId?: number;
  contact?: string;
}

interface RelErrors {
  relationType?: string;
  firstName?: string;
  lastName?: string;
  dob?: string;
  timeOfBirth?: string;
  placeOfBirth?: string;
  gotra?: string;
}

const SOCIAL_RELATIONS = [
  { id: 1, name: 'Father' },
  { id: 2, name: 'Mother' },
  { id: 3, name: 'Brother' },
  { id: 4, name: 'Sister' },
  { id: 5, name: 'Spouse' },
  { id: 6, name: 'Son' },
  { id: 7, name: 'Daughter' },
  { id: 8, name: 'Grandfather' },
  { id: 9, name: 'Grandmother' },
  { id: 10, name: 'Grandson' },
  { id: 11, name: 'Granddaughter' },
  { id: 12, name: 'Uncle' },
  { id: 13, name: 'Aunt' },
  { id: 14, name: 'Nephew' },
  { id: 15, name: 'Niece' },
  { id: 16, name: 'Cousin' },
  { id: 17, name: 'Friend' },
  { id: 18, name: 'Other' },
];

export default function EditProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { i18n, t } = useTranslation();
  const isBn = i18n.language === 'bn';
  const { showToast } = useToast();
  const { showAlert } = useAlert();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const [refreshing, setRefreshing] = useState(false);

  // Modals for relative
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'profile' | 'relative'>('relative');

  // Relative Logic States
  const [relatives, setRelatives] = useState<RelativeProfile[]>([]);
  const [showAddRelative, setShowAddRelative] = useState(false);
  const [editingRelId, setEditingRelId] = useState<string | null>(null);
  const [editingDbId, setEditingDbId] = useState<number | null>(null);
  const [relationType, setRelationType] = useState<number | null>(null);
  const [relFirstName, setRelFirstName] = useState('');
  const [relLastName, setRelLastName] = useState('');
  const [relGender, setRelGender] = useState<Gender>('Male');
  const [relDob, setRelDob] = useState('');
  const [relTimeOfBirth, setRelTimeOfBirth] = useState('');
  const [relPlaceOfBirth, setRelPlaceOfBirth] = useState('');
  const [relGotra, setRelGotra] = useState('');
  const [relGotraId, setRelGotraId] = useState<number | null>(null);
  const [relContact, setRelContact] = useState('');
  const [relErrors, setRelErrors] = useState<RelErrors>({});
  const [timeOfBirth, setTimeOfBirth] = useState('');

  // APIs
  const { data: userDetails, isLoading, refetch: refetchUserDetails } = useGetUserDetailsQuery(user?.user_id || 0, {
    skip: !user?.user_id,
    refetchOnMountOrArgChange: true,
  });
  const [saveRelativeMutation] = useSaveRelativeDetailsMutation();
  const [deleteRelativeMutation] = useDeleteRelativeDetailsMutation();
  const [saveAddressV1Mutation] = useSaveAddressV1Mutation();
  const { data: gotraList = [] } = useGetGotraDetailsQuery();

  // Map raw API data to usable format
  const fullName = userDetails?.ctnz_full_name || '';
  const nameParts = fullName.trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Routing Logic — only redirect if API loaded AND profile is genuinely new (no name)
  useEffect(() => {
    if (!isLoading && userDetails !== undefined) {
      if (!userDetails?.ctnz_full_name) {
        // Use InteractionManager or setTimeout to prevent 'addViewAt' crash on Android
        // This ensures the screen transition animation finishes before we replace the screen
        setTimeout(() => {
          navigation.replace('UpdateProfile');
        }, 150);
      }
    }
  }, [isLoading, userDetails, navigation]);

  // Calculate completion percentage using correct API field names
  let filledFields = 0;
  const totalFields = 5;
  if (userDetails?.ctnz_full_name) filledFields++;
  if (userDetails?.ctnz_gender_id) filledFields++;
  if (userDetails?.ctnz_dob) filledFields++;
  if (userDetails?.ctnz_birth_place) filledFields++;
  if (userDetails?.ctnz_gotra_id) filledFields++;

  const completionPercentage = Math.round((filledFields / totalFields) * 100);

  // Populate relatives when API loads — use correct field: relative_details
  useEffect(() => {
    if (userDetails?.relative_details && Array.isArray(userDetails.relative_details)) {
      const mapped: RelativeProfile[] = userDetails.relative_details.map((r: any) => {
        let rDob = '';
        let rTime = '';
        if (r.relative_dob && r.relative_dob.trim()) {
          const parts = r.relative_dob.includes('T') ? r.relative_dob.split('T') : r.relative_dob.split(' ');
          if (parts[0]) {
            const [y, m, d] = parts[0].split('-');
            if (y && m && d) rDob = `${d}/${m}/${y}`;
          }
          if (parts[1]) {
            const [h, min] = parts[1].split(':');
            if (h && min) {
              let hr = parseInt(h, 10);
              const ampm = hr >= 12 ? 'PM' : 'AM';
              hr = hr % 12 || 12;
              rTime = `${hr.toString().padStart(2, '0')}:${min} ${ampm}`;
            }
          }
        }
        const relParts = (r.relative_full_name || '').split(' ');
        const relativeAuthId = r.relative_auth_id || r.relative_id || '';
        const relativeDbId = r.relative_id
          ? Number(r.relative_id)
          : r.relative_auth_id ? Number(r.relative_auth_id) : undefined;

        return {
          id: relativeAuthId.toString(),
          dbId: relativeDbId,
          relationType: r.relation_type_name || SOCIAL_RELATIONS.find(m => m.id === r.relation_type_id)?.name || '',
          relationTypeId: r.relation_type_id,
          firstName: relParts[0] || '',
          lastName: relParts.slice(1).join(' ') || '',
          gender: r.relative_gender_name || (r.relative_gender_id === 1 ? 'Male' : r.relative_gender_id === 2 ? 'Female' : 'Others') as Gender,
          dob: rDob,
          timeOfBirth: rTime,
          placeOfBirth: r.relative_birth_place || '',
          gotra: r.relative_gotra_name || '',
          gotraId: r.relative_gotra_id ? Number(r.relative_gotra_id) : undefined,
          contact: r.relative_contact_no || r.relative_mobile || '',
        };
      });
      setRelatives(mapped);
    }
  }, [userDetails]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchUserDetails();
    setRefreshing(false);
  }, [refetchUserDetails]);

  const handleDateSelect = (date: Date) => {

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const formatted = `${day}/${month}/${year}`;
    setRelDob(formatted);
    if (relErrors.dob) setRelErrors(p => ({ ...p, dob: undefined }));
  };

  const handleTimeSelect = (time: string) => {
    setRelTimeOfBirth(time);
    if (relErrors.timeOfBirth) setRelErrors(p => ({ ...p, timeOfBirth: undefined }));
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
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

  const showErrorAlert = (msg: string) =>
    showAlert({ title: isBn ? 'ত্রুটি' : 'Error', message: msg, buttons: [{ text: 'OK' }] });

  const handleEditRelative = (rel: RelativeProfile) => {
    setEditingRelId(rel.id);
    setEditingDbId(rel.dbId ?? null);
    setRelationType(rel.relationTypeId || null);
    setRelFirstName(rel.firstName);
    setRelLastName(rel.lastName);
    setRelGender(rel.gender);
    setRelDob(rel.dob);
    setRelTimeOfBirth(rel.timeOfBirth);
    setRelPlaceOfBirth(rel.placeOfBirth);
    setRelGotra(rel.gotra);
    setRelGotraId(rel.gotraId ?? null);
    setRelContact(rel.contact || '');
    setRelErrors({});
    setShowAddRelative(true);
  };

  const handleDeleteRelative = (id: string) => {
    showAlert({
      title: isBn ? 'মুছে ফেলুন' : 'Delete Relative',
      message: isBn
        ? 'আপনি কি নিশ্চিত?'
        : 'Are you sure you want to delete this relative?',
      buttons: [
        { text: isBn ? 'বাতিল' : 'Cancel' },
        {
          text: isBn ? 'মুছুন' : 'Delete',
          onPress: async () => {
            const state = await NetInfo.fetch();
            if (!state.isConnected) {
              showToast({
                message: t('common.connectionRequired'),
                type: 'error',
              });
              return;
            }
            try {
              dispatch(showLoader());
              const payload = { relative_id: parseInt(id, 10) };
              const result = await deleteRelativeMutation({
                data: JSON.stringify({ enc_data: JSON.stringify(payload) }),
              }).unwrap();

              if (result.status === 0) {
                setRelatives(prev => prev.filter(r => r.id !== id));
                showAlert({
                  title: isBn ? 'সফল' : 'Success',
                  message:
                    result.message ||
                    (isBn
                      ? 'আত্মীয় প্রোফাইল মুছে ফেলা হয়েছে'
                      : 'Relative profile deleted successfully'),
                  buttons: [{ text: 'OK' }],
                });
              }
            } catch (err: any) {
              showErrorAlert(
                err?.data?.message ||
                (isBn ? 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে' : 'Failed to update profile. Please try again.'),
              );
            } finally {
              dispatch(hideLoader());
            }
          },
        },
      ],
    });
  };

  // ── Relative validation ───────────────────────────────────────────────────
  const validateRelative = (): boolean => {
    const errs: RelErrors = {};

    // Relation Type - Commented out validation as dropdown is commented in UI
    /*
    if (relationType === null)
      errs.relationType = isBn
        ? 'সম্পর্কের ধরন নির্বাচন করুন'
        : 'Please select a relation type';
    */

    // First Name
    if (!relFirstName.trim())
      errs.firstName = isBn ? 'প্রথম নাম আবশ্যক' : 'First name is required';
    else if (relFirstName.trim().length < 2)
      errs.firstName = isBn
        ? 'অন্তত ২টি অক্ষর আবশ্যক'
        : 'At least 2 characters required';
    else if (!isAlphaText(relFirstName))
      errs.firstName = isBn
        ? 'শুধুমাত্র অক্ষর ব্যবহার করুন'
        : 'Only letters allowed';

    // Last Name
    if (!relLastName.trim())
      errs.lastName = isBn ? 'শেষ নাম আবশ্যক' : 'Last name is required';
    else if (relLastName.trim().length < 2)
      errs.lastName = isBn
        ? 'অন্তত ২টি অক্ষর আবশ্যক'
        : 'At least 2 characters required';
    else if (!isAlphaText(relLastName))
      errs.lastName = isBn
        ? 'শুধুমাত্র অক্ষর ব্যবহার করুন'
        : 'Only letters allowed';

    // Date of Birth
    if (!relDob.trim())
      errs.dob = isBn ? 'জন্ম তারিখ আবশ্যক' : 'Date of birth is required';

    // Time of Birth
    if (!relTimeOfBirth.trim())
      errs.timeOfBirth = isBn
        ? 'জন্ম সময় আবশ্যক'
        : 'Time of birth is required';

    // Birth Place
    if (!relPlaceOfBirth.trim())
      errs.placeOfBirth = isBn ? 'জন্মস্থান আবশ্যক' : 'Birth place is required';
    else if (relPlaceOfBirth.trim().length < 2)
      errs.placeOfBirth = isBn
        ? 'অন্তত ২টি অক্ষর আবশ্যক'
        : 'At least 2 characters required';

    // Gotra (dropdown - check numeric ID)
    if (!relGotraId)
      errs.gotra = isBn ? 'গোত্র নির্বাচন করুন' : 'Please select a Gotra';

    setRelErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveRelative = async () => {
    if (!validateRelative()) return;

    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      showToast({
        message: t('common.connectionRequired'),
        type: 'error',
      });
      return;
    }

    try {
      dispatch(showLoader());
      const relName =
        SOCIAL_RELATIONS.find(r => r.id === relationType)?.name || '';

      // Gender → numeric: 1=Male, 2=Female, 3=Others
      const relGenderNum = relGender === 'Male' ? 1 : relGender === 'Female' ? 2 : 3;

      // For UPDATE: use actual DB row ID (dbId), NOT the auth_id (editingRelId)
      const relDbIdForApi = editingDbId ?? 0;

      const payload = [
        {
          relative_auth_id: relDbIdForApi || 0,
          main_auth_id: user?.user_id || 0,
          full_name: `${relFirstName} ${relLastName}`.trim(),
          date_of_birth: formatApiDate(relDob, relTimeOfBirth),
          place_of_birth: relPlaceOfBirth,
          contact_no: relContact,
          gender: relGenderNum,
          gotram: relGotraId,
          created_by: 3,
        },
      ];

      console.log('=== SAVE RELATIVE ===');
      console.log('Mode:', editingRelId ? 'UPDATE' : 'ADD');
      console.log('editingRelId (auth_id):', editingRelId);
      console.log('editingDbId  (DB row):', editingDbId);
      console.log('relative_id sent to API:', relDbIdForApi);
      console.log('Relative Payload:', JSON.stringify(payload, null, 2));

      const result = await saveRelativeMutation({
        data: JSON.stringify({ enc_data: JSON.stringify(payload) }),
      }).unwrap();

      console.log('=== SAVE RELATIVE RESULT ===', JSON.stringify(result, null, 2));

      if (result.status === 0) {
        // Call save_address_v1 — same payload for both add AND update
        try {
          const addressPayload = {
            in_ctzn_address_id: 0,
            ctzn_auth_id: user?.user_id || 0,
            address_type_id: 1,
            label: '',
            address: relPlaceOfBirth,
            street: '',
            landmark: '',
            city: relPlaceOfBirth,
            state: 1,
            pincode: '',
            is_default: 1,
            latitude: 0,
            longitude: 0,
            delivery_contact_no: relContact,
            delivery_instruction: '',
          };
          console.log('=== SAVE ADDRESS V1 PAYLOAD ===', JSON.stringify(addressPayload, null, 2));
          const addrResult = await saveAddressV1Mutation({
            data: JSON.stringify({ enc_data: JSON.stringify(addressPayload) }),
          }).unwrap();
          console.log('=== SAVE ADDRESS V1 RESULT ===', JSON.stringify(addrResult, null, 2));
        } catch (addrErr: any) {
          console.log('=== SAVE ADDRESS V1 ERROR ===', JSON.stringify(addrErr, null, 2));
        }

        if (editingRelId) {
          setRelatives(prev =>
            prev.map(r =>
              r.id === editingRelId
                ? {
                  id: editingRelId,
                  relationType: relName,
                  relationTypeId: relationType ?? undefined,
                  firstName: relFirstName,
                  lastName: relLastName,
                  gender: relGender,
                  dob: relDob,
                  timeOfBirth: relTimeOfBirth,
                  placeOfBirth: relPlaceOfBirth,
                  gotra: relGotra,
                  gotraId: relGotraId ?? undefined,
                  contact: relContact,
                }
                : r,
            ),
          );
        } else {
          // Fallback optimistically if we don't have the new ID
          setRelatives(prev => [
            ...prev,
            {
              id: Date.now().toString(),
              relationType: relName,
              relationTypeId: relationType ?? undefined,
              firstName: relFirstName,
              lastName: relLastName,
              gender: relGender,
              dob: relDob,
              timeOfBirth: relTimeOfBirth,
              placeOfBirth: relPlaceOfBirth,
              gotra: relGotra,
              gotraId: relGotraId ?? undefined,
              contact: relContact,
            },
          ]);
        }

        clearRelForm();

        // Refetch from server so relatives list shows latest data
        try { await refetchUserDetails(); } catch (_) { }

        const isUpdate = !!editingRelId;
        const successMsgEn = isUpdate ? 'Edit successfully' : 'New relative successfully added';
        const successMsgBn = isUpdate ? 'সফলভাবে সম্পাদনা করা হয়েছে' : 'নতুন আত্মীয় সফলভাবে যোগ করা হয়েছে';

        showAlert({
          title: isBn ? 'সফল' : 'Success',
          message: isBn ? successMsgBn : successMsgEn,
          buttons: [{ text: 'OK' }],
        });
      }
    } catch (err: any) {
      console.log('Save Relative Error:', err);
      showErrorAlert(
        err?.data?.message ||
        (isBn ? 'কিছু ভুল হয়েছে' : 'Something went wrong'),
      );
    } finally {
      dispatch(hideLoader());
    }
  };

  const clearRelForm = () => {
    setEditingRelId(null);
    setEditingDbId(null);
    setRelationType(null);
    setRelFirstName('');
    setRelLastName('');
    setRelGender('Male');
    setRelDob('');
    setRelTimeOfBirth('');
    setRelPlaceOfBirth('');
    setRelGotra('');
    setRelGotraId(null);
    setRelContact('');
    setRelErrors({});
    setShowAddRelative(false);
  };


  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
        <TopNavBar showBack={true} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={BRAND_ORANGE} />
        </View>
      </View>
    );
  }

  // If redirecting to UpdateProfile, show blank briefly
  if (!isLoading && userDetails !== undefined && !userDetails?.ctnz_full_name) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
        <TopNavBar showBack={true} />
      </View>
    );
  }

  const avatarInitial = firstName ? firstName.charAt(0).toUpperCase() : 'U';
  const displayName = fullName || 'User';


  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" translucent={true} />
      <TopNavBar showBack={true} />

      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BRAND_ORANGE]} />}
      >
        <View style={styles.content}>
          <Text style={styles.pageTitle}>{isBn ? 'আমার প্রোফাইল' : 'My Profile'}</Text>
          <Text style={styles.pageSubtitle}>
            {isBn ? 'আপনার পূজা বুকিংয়ের জন্য ব্যবহৃত বিশদ বিবরণ পর্যালোচনা এবং পরিচালনা করুন।' : 'Review and manage the details used for your puja bookings.'}
          </Text>

          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <RefreshCcw size={14} color={BRAND_TEXT} />
            <Text style={styles.refreshBtnText}>{isBn ? 'রিফ্রেশ' : 'Refresh'}</Text>
          </TouchableOpacity>

          {/* Profile Overview Card — Orange + Rainbow Aurora */}
          <View style={styles.overviewCard}>
            {/* Exact orange gradient base: 110deg, #f47c20 0%, #d75a0a 60%, #b94308 100% */}
            <LinearGradient
              colors={['#f47c20', '#d75a0a', '#b94308']}
              locations={[0, 0.6, 1]}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
            {/* Warm rainbow blobs — blend naturally with orange */}
            <View style={{
              position: 'absolute', top: -40, right: -20,
              width: 140, height: 140, borderRadius: 70,
              backgroundColor: 'rgba(251, 191, 36, 0.25)',
            }} />
            <View style={{
              position: 'absolute', top: 5, right: 50,
              width: 90, height: 90, borderRadius: 45,
              backgroundColor: 'rgba(254, 240, 138, 0.18)',
            }} />
            <View style={{
              position: 'absolute', bottom: -25, left: -15,
              width: 120, height: 120, borderRadius: 60,
              backgroundColor: 'rgba(185, 28, 28, 0.3)',
            }} />
            <View style={{
              position: 'absolute', bottom: 5, left: 90,
              width: 80, height: 80, borderRadius: 40,
              backgroundColor: 'rgba(253, 186, 116, 0.2)',
            }} />
            <View style={{
              position: 'absolute', top: 30, left: 30,
              width: 60, height: 60, borderRadius: 30,
              backgroundColor: 'rgba(252, 211, 77, 0.15)',
            }} />

            <View style={styles.overviewContent}>
              <View style={styles.overviewTop}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{avatarInitial}</Text>
                </View>
                <View style={styles.overviewTextWrap}>
                  <Text style={styles.overviewName}>{displayName}</Text>
                  {user?.mobile_no && <Text style={styles.overviewPhone}>📞 {user.mobile_no}</Text>}
                </View>
              </View>

              <View style={styles.progressWrap}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>{isBn ? 'প্রোফাইল সমাপ্তি' : 'Profile completion'}</Text>
                  <Text style={styles.progressValue}>{completionPercentage}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <LinearGradient
                    colors={['#ef7d16', '#f3a33a', '#10b981']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressBarFill, { width: `${completionPercentage}%` }]}
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.completeBtn} onPress={() => navigation.navigate('UpdateProfile')}>
                <Pencil size={14} color="#92400E" style={{ marginRight: 6 }} />
                <Text style={styles.completeBtnText}>{isBn ? 'প্রোফাইল সম্পূর্ণ করুন' : 'Complete profile'}</Text>
              </TouchableOpacity>
            </View>
          </View>


          {/* Attention Card (If < 100%) */}
          {completionPercentage < 100 && (
            <LinearGradient
              colors={['#f97316', '#facc15']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.attentionCard}
            >
              <Text style={styles.attentionTitle}>{isBn ? 'আপনার প্রোফাইল সেট আপ শেষ করুন' : 'Finish setting up your profile'}</Text>
              <Text style={styles.attentionSub}>{isBn ? 'কিছু প্রোফাইল ক্ষেত্রের আপনার মনোযোগ প্রয়োজন।' : '1 profile field needs your attention.'}</Text>
              <TouchableOpacity style={styles.attentionBtn} onPress={() => navigation.navigate('UpdateProfile')} activeOpacity={0.85}>
                <Text style={styles.attentionBtnText}>{isBn ? 'প্রোফাইল সম্পূর্ণ করুন' : 'Complete profile'}</Text>
              </TouchableOpacity>
            </LinearGradient>
          )}

          {/* Personal Details Card */}
          <View style={styles.detailsCard}>
            <View style={styles.detailsHeader}>
              <View style={styles.detailsHeaderLeft}>
                <View style={styles.detailsIconWrap}>
                  <User size={16} color={BRAND_ORANGE} />
                </View>
                <Text style={styles.detailsTitle}>{isBn ? 'ব্যক্তিগত বিবরণ' : 'PERSONAL DETAILS'}</Text>
              </View>
              <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('UpdateProfile')}>
                <Pencil size={12} color={BRAND_ORANGE} />
                <Text style={styles.editBtnText}>{isBn ? 'সম্পাদনা' : 'Edit'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.divider} />

            <View style={styles.detailsBody}>
              <DetailRow icon={<CalendarDays size={18} color="#D1D5DB" />} label={isBn ? 'জন্ম তারিখ' : 'DATE OF BIRTH'} value={(() => { if (!userDetails?.ctnz_dob) return isBn ? 'প্রদান করা হয়নি' : 'Not provided'; const [dPart] = userDetails.ctnz_dob.split('T'); if (!dPart) return userDetails.ctnz_dob; const [y, m, d] = dPart.split('-'); return `${d}/${m}/${y}`; })()} />
              <DetailRow icon={<MapPin size={18} color="#D1D5DB" />} label={isBn ? 'জন্মস্থান' : 'BIRTH PLACE'} value={userDetails?.ctnz_birth_place || (isBn ? 'প্রদান করা হয়নি' : 'Not provided')} />
              <DetailRow icon={<User size={18} color="#D1D5DB" />} label={isBn ? 'লিঙ্গ' : 'GENDER'} value={userDetails?.ctnz_gender_name || (userDetails?.ctnz_gender_id === 1 ? 'Male' : userDetails?.ctnz_gender_id === 2 ? 'Female' : userDetails?.ctnz_gender_id === 3 ? 'Others' : (isBn ? 'প্রদান করা হয়নি' : 'Not provided'))} />
              <DetailRow icon={<Flame size={18} color="#D1D5DB" />} label={isBn ? 'গোত্র' : 'GOTRA'} value={userDetails?.ctnz_gotra_name || (isBn ? 'প্রদান করা হয়নি' : 'Not provided')} />
            </View>
          </View>

          {/* Family Members Card */}
          <View style={styles.detailsCard}>
            <View style={styles.detailsHeader}>
              <View style={styles.detailsHeaderLeft}>
                <View style={styles.detailsIconWrap}>
                  <Users size={16} color={BRAND_ORANGE} />
                </View>
                <Text style={styles.detailsTitle}>{isBn ? 'পরিবারের সদস্য' : 'FAMILY MEMBERS'}</Text>
              </View>
              <TouchableOpacity style={styles.addBtn} onPress={() => {
                clearRelForm();
                setShowAddRelative(true);
              }}>
                <Plus size={14} color="#FFF" />
                <Text style={styles.addBtnText}>{isBn ? 'যোগ করুন' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.divider} />

            <View style={styles.detailsBody}>
              {relatives.length === 0 ? (
                <View style={styles.emptyRelState}>
                  <View style={styles.emptyRelIconWrap}>
                    <Text style={{ fontSize: 30 }}>👨‍👩‍👧‍👦</Text>
                  </View>
                  <Text style={styles.emptyRelTitle}>{isBn ? 'কোন পরিবারের সদস্য যোগ করা হয়নি' : 'No family members added'}</Text>
                  <Text style={styles.emptyRelSub}>{isBn ? 'পূজা বুকিংয়ের সময় তাদের বিবরণ পুনরায় ব্যবহার করতে পরিবারের সদস্যদের যোগ করুন।' : 'Add family members to reuse their details during puja bookings.'}</Text>
                  <TouchableOpacity style={styles.emptyRelBtn} onPress={() => {
                    clearRelForm();
                    setShowAddRelative(true);
                  }}>
                    <Plus size={14} color="#FFF" />
                    <Text style={styles.emptyRelBtnText}>{isBn ? 'পরিবারের সদস্য যোগ করুন' : 'Add family member'}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                relatives.map((rel, index) => (
                  <View key={rel.id} style={styles.relativeItem}>
                    <View style={styles.relLeft}>
                      <Text style={styles.relName}>{rel.firstName} {rel.lastName}</Text>
                      <Text style={styles.relType}>{rel.relationType}</Text>
                    </View>
                    <View style={styles.relActions}>
                      <TouchableOpacity onPress={() => handleEditRelative(rel)} style={styles.relActionBtn}>
                        <Pencil size={16} color={BRAND_ORANGE} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteRelative(rel.id)} style={styles.relActionBtn}>
                        <Text style={{ fontSize: 16, color: Colors.red }}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      <Modal
        visible={showAddRelative}
        animationType="slide"
        transparent={true}
        onRequestClose={clearRelForm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.addRelFormTitle}>
                {editingRelId
                  ? isBn
                    ? 'আত্মীয় প্রোফাইল আপডেট করুন'
                    : 'Edit Relative Profile'
                  : isBn
                    ? 'নতুন আত্মীয় প্রোফাইল'
                    : 'New Relative Profile'}
              </Text>
              <TouchableOpacity onPress={clearRelForm}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {/* <Dropdown
                label={isBn ? 'সম্পর্কের ধরন' : 'RELATION TYPE'}
                required
                placeholder={isBn ? 'সম্পর্ক নির্বাচন করুন' : 'Select relation'}
                options={SOCIAL_RELATIONS}
                value={relationType}
                onSelect={setRelationType}
                isLoading={false}
                error={relErrors.relationType}
              /> */}

              <View style={styles.rowTwo}>
                <Field
                  label={isBn ? 'প্রথম নাম' : 'FIRST NAME'}
                  required
                  value={relFirstName}
                  onChange={v => {
                    setRelFirstName(v.replace(/[^a-zA-Z\s.-]/g, ''));
                    if (relErrors.firstName)
                      setRelErrors(p => ({ ...p, firstName: undefined }));
                  }}
                  placeholder={isBn ? 'প্রথম নাম' : 'Enter first name'}
                  error={relErrors.firstName}
                />
                <Field
                  label={isBn ? 'শেষ নাম' : 'LAST NAME'}
                  required
                  value={relLastName}
                  onChange={v => {
                    setRelLastName(v.replace(/[^a-zA-Z\s.-]/g, ''));
                    if (relErrors.lastName)
                      setRelErrors(p => ({ ...p, lastName: undefined }));
                  }}
                  placeholder={isBn ? 'শেষ নাম' : 'Enter last name'}
                  error={relErrors.lastName}
                />
              </View>

              <Text style={styles.fieldLabel}>{isBn ? 'লিঙ্গ' : 'GENDER'}</Text>
              <GenderPicker value={relGender} onChange={setRelGender} />

              <View style={styles.rowTwo}>
                <Field
                  label={isBn ? 'জন্ম তারিখ' : 'DATE OF BIRTH'}
                  required
                  value={relDob}
                  onChange={() => { }}
                  onPress={() => {
                    setPickerTarget('relative');
                    setShowDatePicker(true);
                  }}
                  placeholder="DD/MM/YYYY"
                  error={relErrors.dob}
                />
                <Field
                  label={isBn ? 'জন্ম সময়' : 'TIME OF BIRTH'}
                  value={relTimeOfBirth}
                  onChange={() => { }}
                  onPress={() => {
                    setPickerTarget('relative');
                    setShowTimePicker(true);
                  }}
                  placeholder="HH:MM AM/PM"
                  error={relErrors.timeOfBirth}
                />
              </View>

              <View style={styles.rowTwo}>
                <Field
                  label={isBn ? 'জন্মস্থান' : 'PLACE OF BIRTH'}
                  required
                  value={relPlaceOfBirth}
                  onChange={v => {
                    setRelPlaceOfBirth(v.replace(/[^a-zA-Z0-9\s,.#\-/]/g, ''));
                    if (relErrors.placeOfBirth)
                      setRelErrors(p => ({ ...p, placeOfBirth: undefined }));
                  }}
                  placeholder={isBn ? 'জন্মস্থান' : 'Enter place of birth'}
                  error={relErrors.placeOfBirth}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>
                    {isBn ? 'গোত্র' : 'GOTRA'}{' '}
                    <Text style={styles.required}>*</Text>
                  </Text>
                  <Dropdown
                    options={gotraList.map(g => ({
                      id: g.gotra_id,
                      name: g.gotra_name,
                    }))}
                    value={relGotraId}
                    onSelect={(val: number) => {
                      setRelGotraId(val);
                      const found = gotraList.find(g => g.gotra_id === val);
                      if (found) setRelGotra(found.gotra_name);
                      if (relErrors.gotra)
                        setRelErrors(p => ({ ...p, gotra: undefined }));
                    }}
                    placeholder={isBn ? 'গোত্র নির্বাচন করুন' : 'Select Gotra'}
                    error={relErrors.gotra}
                  />
                </View>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Field
                  label={isBn ? 'যোগাযোগ নম্বর' : 'CONTACT NUMBER'}
                  value={relContact}
                  onChange={v => setRelContact(v.replace(/[^0-9]/g, ''))}
                  placeholder={isBn ? 'যোগাযোগ নম্বর লিখুন' : 'Enter contact number'}
                  keyboardType="numeric"
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
                    {editingRelId
                      ? isBn
                        ? 'আপডেট করুন'
                        : 'Update Relative'
                      : isBn
                        ? 'আত্মীয় সংরক্ষণ করুন'
                        : 'Save Relative'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <CustomDatePickerModal
        visible={showDatePicker}
        mode="date"
        onSelect={handleDateSelect}
        onClose={() => setShowDatePicker(false)}
      />
      <CustomTimePickerModal
        visible={showTimePicker}
        onSelect={handleTimeSelect}
        onClose={() => setShowTimePicker(false)}
        initialTime={pickerTarget === 'profile' ? timeOfBirth : relTimeOfBirth}
      />
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIconBox}>{icon}</View>
      <View style={styles.detailTextWrap}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  body: { flex: 1 },
  content: { padding: 16 },
  pageTitle: { fontSize: 24, fontWeight: '300', color: BRAND_TEXT, marginTop: 10 },
  pageSubtitle: { fontSize: 13, color: BRAND_MUTED, marginTop: 4, lineHeight: 18 },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 20,
  },
  refreshBtnText: { fontSize: 13, fontWeight: '700', color: BRAND_TEXT },

  overviewCard: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
    elevation: 4,
    shadowColor: BRAND_ORANGE,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  overviewCardBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  overviewContent: { padding: 20 },
  overviewTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  overviewTextWrap: { flex: 1 },
  overviewName: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  overviewPhone: { fontSize: 13, color: '#FFF', marginTop: 4, fontWeight: '600' },

  progressWrap: { marginBottom: 16 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, color: '#FFF', fontWeight: '500' },
  progressValue: { fontSize: 12, color: '#FFF', fontWeight: '800' },
  progressBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#FFF', borderRadius: 3 },

  completeBtn: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeBtnText: { fontSize: 14, fontWeight: '800', color: '#92400E' },

  attentionCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#f97316',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  attentionTitle: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  attentionSub: { fontSize: 13, color: 'rgba(255, 255, 255, 0.9)', marginBottom: 14, fontWeight: '500' },
  attentionBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  attentionBtnText: { color: '#C2410C', fontWeight: '800', fontSize: 14 },

  detailsCard: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  detailsHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailsIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsTitle: { fontSize: 14, fontWeight: '800', color: BRAND_TEXT },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editBtnText: { fontSize: 13, fontWeight: '700', color: '#9A3412' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#C2410C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  divider: { height: 1, backgroundColor: '#E5E7EB' },
  detailsBody: { padding: 16, paddingTop: 8 },

  detailRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 12 },
  detailIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailTextWrap: { flex: 1, justifyContent: 'center' },
  detailLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', marginBottom: 2 },
  detailValue: { fontSize: 13, fontWeight: '700', color: BRAND_TEXT },

  emptyRelState: { alignItems: 'center', paddingVertical: 20 },
  emptyRelIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyRelTitle: { fontSize: 15, fontWeight: '600', color: BRAND_TEXT, marginBottom: 6 },
  emptyRelSub: { fontSize: 12, color: BRAND_MUTED, textAlign: 'center', paddingHorizontal: 20, marginBottom: 16, lineHeight: 18 },
  emptyRelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#C2410C',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyRelBtnText: { fontSize: 13, fontWeight: '700', color: '#FFF' },

  relativeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  relLeft: { flex: 1 },
  relName: { fontSize: 14, fontWeight: '700', color: BRAND_TEXT },
  relType: { fontSize: 12, color: BRAND_MUTED, marginTop: 2 },
  relActions: { flexDirection: 'row', gap: 12 },
  relActionBtn: { padding: 4 },

  // Inherited Modal Styles
  addRelForm: { marginTop: 8 },
  addRelFormTitle: { fontSize: 16, fontWeight: '800', color: BRAND_TEXT },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  closeIcon: { fontSize: 22, color: BRAND_MUTED, fontWeight: '700' },
  relFormBtnsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  relCancelBtn: { flex: 1, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  relCancelBtnText: { fontSize: 14, color: '#4B5563', fontWeight: '600' },
  relSaveBtn: { flex: 2, backgroundColor: BRAND_ORANGE, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  relSaveBtnText: { fontSize: 14, color: Colors.white, fontWeight: '700' },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: BRAND_MUTED, letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' },
  required: { color: Colors.red },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: BRAND_TEXT, backgroundColor: '#F9FAFB' },
  inputError: { borderColor: Colors.red, backgroundColor: '#FEF2F2' },
  errorText: { fontSize: 11, color: Colors.red, marginTop: 4, fontWeight: '500' },
  genderRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  genderBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center', backgroundColor: '#FFF' },
  genderBtnActive: { backgroundColor: BRAND_ORANGE, borderColor: BRAND_ORANGE },
  genderBtnText: { fontSize: 13, fontWeight: '600', color: BRAND_MUTED },
  genderBtnTextActive: { color: Colors.white, fontWeight: '700' },
  rowTwo: { flexDirection: 'row', gap: 12, marginBottom: 16 },
});

// Helper component required by RelativeLogicBackup
function Field({
  label,
  required,
  value,
  onChange,
  placeholder,
  error,
  keyboardType,
  multiline,
  onPress,
  editable,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange?: (val: string) => void;
  placeholder?: string;
  error?: string;
  keyboardType?: any;
  multiline?: boolean;
  onPress?: () => void;
  editable?: boolean;
}) {
  return (
    <View style={{ flex: 1, marginBottom: 16 }}>
      <Text style={styles.fieldLabel}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TouchableOpacity activeOpacity={onPress ? 0.7 : 1} onPress={onPress}>
        <TextInput
          style={[styles.input, error ? styles.inputError : null, multiline && { height: 80, textAlignVertical: 'top' }]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType={keyboardType}
          multiline={multiline}
          editable={editable !== false && !onPress}
          pointerEvents={onPress ? 'none' : 'auto'}
        />
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
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



