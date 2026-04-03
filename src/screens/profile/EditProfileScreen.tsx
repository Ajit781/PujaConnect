/* eslint-disable react-native/no-inline-styles */
import React, { useState, useCallback } from 'react';
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
import { launchImageLibrary } from 'react-native-image-picker';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '../../store';
import { useAlert } from '../../context/AlertContext';
import { Colors } from '../../constants/Colors';
import {
  useSaveUserProfileMutation,
  useGetUserDetailsQuery,
  useSaveRelativeDetailsMutation,
  useDeleteRelativeDetailsMutation,
} from '../../store/api/pujaApi';
import CustomDatePickerModal from '../../components/common/CustomDatePickerModal';
import CustomTimePickerModal from '../../components/common/CustomTimePickerModal';
import Dropdown from '../../components/common/Dropdown';
import { showLoader, hideLoader } from '../../store/slices/loaderSlice';

const BRAND_ORANGE = Colors.primary;
const BRAND_TEXT = Colors.textMain;
const BRAND_MUTED = Colors.textMuted;
const ERROR_COLOR = Colors.red;

type Gender = 'Male' | 'Female' | 'Others';

interface RelativeProfile {
  id: string;
  relationType: string;
  relationTypeId?: number;
  firstName: string;
  lastName: string;
  gender: Gender;
  dob: string;
  timeOfBirth: string;
  placeOfBirth: string;
  gotra: string;
}

interface ProfileErrors {
  firstName?: string;
  lastName?: string;
  dob?: string;
  timeOfBirth?: string;
  birthPlace?: string;
  gotra?: string;
  address?: string;
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

// RELATION_TYPES replaced by API or SOCIAL_RELATIONS below

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
  onPress,
  editable,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: string;
  keyboardType?: any;
  multiline?: boolean;
  onPress?: () => void;
  editable?: boolean;
}) {
  const hasErr = !!error;
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.fieldLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TouchableOpacity activeOpacity={onPress ? 0.7 : 1} onPress={onPress}>
        <TextInput
          style={[
            styles.input,
            multiline && styles.inputMulti,
            hasErr && styles.inputError,
            !editable && onPress && { color: Colors.textMain }, // Show value clearly even if not keyboard editable
          ]}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          textAlignVertical={multiline ? 'top' : 'center'}
          editable={editable ?? !onPress}
          pointerEvents={onPress ? 'none' : 'auto'}
        />
      </TouchableOpacity>
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

export default function EditProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { i18n } = useTranslation();
  const isBn = i18n.language === 'bn';
  const { showAlert, showErrorAlert } = useAlert();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const [refreshing, setRefreshing] = useState(false);

  // ── Profile form ──────────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [timeOfBirth, setTimeOfBirth] = useState('');
  const [gender, setGender] = useState<Gender>('Male');
  const [birthPlace, setBirthPlace] = useState('');
  const [gotra, setGotra] = useState('');
  const [address, setAddress] = useState('');
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});

  React.useEffect(() => {
    // No logging
  }, [user?.user_id]);

  const [profileImageFile, setProfileImageFile] = useState<any>(null);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);

  // ── Modals / Pickers State ──────────────────────────────────────────────────
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'profile' | 'relative'>(
    'profile',
  );

  // -- API Hooks --
  const { data: userDetailsRaw, refetch: refetchUserDetails } =
    useGetUserDetailsQuery(user?.user_id || 0, {
      skip: !user?.user_id,
      refetchOnMountOrArgChange: true,
    });
  const [saveProfile] = useSaveUserProfileMutation();
  const [saveRelativeMutation] = useSaveRelativeDetailsMutation();
  const [deleteRelativeMutation] = useDeleteRelativeDetailsMutation();

  React.useEffect(() => {
    if (userDetailsRaw) {
      console.log(
        '--- EDIT PROFILE: FETCHED USER DETAILS ---',
        JSON.stringify(userDetailsRaw, null, 2),
      );
      if (userDetailsRaw.ctnz_profile_image) {
        // Add a cache-buster timestamp to ensure the latest image is always shown
        const timestamp = new Date().getTime();
        setProfileImageUri(
          `${userDetailsRaw.ctnz_profile_image}?t=${timestamp}`,
        );
      }
    }
  }, [userDetailsRaw]);

  // ── Auto-fill Profile Data ────────────────────────────────────────────────
  React.useEffect(() => {
    if (userDetailsRaw) {
      // Parse main profile
      const fullName = userDetailsRaw.ctnz_full_name || '';
      const nameParts = fullName.split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');

      setGender((userDetailsRaw.ctnz_gender as Gender) || 'Male');
      setGotra(userDetailsRaw.ctnz_gotra || '');
      setBirthPlace(userDetailsRaw.ctnz_birth_place || '');
      setAddress(userDetailsRaw.ctnz_address || '');

      if (userDetailsRaw.ctnz_dob) {
        const [dPart, tPart] = userDetailsRaw.ctnz_dob.split('T');
        if (dPart) {
          const [y, m, d] = dPart.split('-');
          setDob(`${d}/${m}/${y}`);
        }
        if (tPart) {
          const [h, min] = tPart.split(':');
          let hr = parseInt(h, 10);
          const ampm = hr >= 12 ? 'PM' : 'AM';
          hr = hr % 12 || 12;
          setTimeOfBirth(`${hr.toString().padStart(2, '0')}:${min} ${ampm}`);
        }
      }

      // Parse relatives
      if (
        userDetailsRaw.relative_details &&
        Array.isArray(userDetailsRaw.relative_details)
      ) {
        const mappedRels = userDetailsRaw.relative_details.map((r: any) => {
          let rDob = '';
          let rTime = '';
          if (r.relative_dob && r.relative_dob.trim()) {
            // Updated to handle space between date and time
            const parts = r.relative_dob.split(' ');
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
          const masterRelName =
            SOCIAL_RELATIONS.find(m => m.id === r.relation_type_id)?.name || '';

          return {
            id: r.relative_id.toString(),
            relationType: r.relation_type_name || masterRelName,
            relationTypeId: r.relation_type_id,
            firstName: relParts[0] || '',
            lastName: relParts.slice(1).join(' ') || '',
            gender: r.relative_gender || 'Male',
            dob: rDob,
            timeOfBirth: rTime,
            placeOfBirth: r.relative_birth_place || '',
            gotra: r.relative_gotra || '',
          };
        });
        setRelatives(mappedRels);
      }
    }
  }, [userDetailsRaw]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchUserDetails();
    } catch (err) {
      console.error('Profile refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  }, [refetchUserDetails]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  // Removed unused isValidCalendarDate helper logic

  const convertTo24Hour = (timeStr: string): string => {
    // Expected: "HH:MM AM/PM"
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
    // dateStr: DD/MM/YYYY, timeStr: HH:MM AM/PM
    if (!dateStr) return '';
    const [d, m, y] = dateStr.split('/');
    const time24 = convertTo24Hour(timeStr);
    return `${y}-${m}-${d}${time24 ? ' ' + time24 : ''}`;
  };

  const handleDateSelect = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const formatted = `${day}/${month}/${year}`;

    if (pickerTarget === 'profile') {
      setDob(formatted);
      if (profileErrors.gotra)
        setProfileErrors(p => ({ ...p, gotra: undefined }));
    } else {
      setRelDob(formatted);
      if (relErrors.dob) setRelErrors(p => ({ ...p, dob: undefined }));
    }
  };

  const handleTimeSelect = (time: string) => {
    // time is "HH:MM AM/PM"
    if (pickerTarget === 'profile') {
      setTimeOfBirth(time);
      if (profileErrors.timeOfBirth)
        setProfileErrors(p => ({ ...p, timeOfBirth: undefined }));
    } else {
      setRelTimeOfBirth(time);
      if (relErrors.timeOfBirth)
        setRelErrors(p => ({ ...p, timeOfBirth: undefined }));
    }
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

    // Time of Birth
    if (!timeOfBirth.trim())
      errs.timeOfBirth = isBn
        ? 'জন্ম সময় আবশ্যক'
        : 'Time of birth is required';

    // Birth Place
    if (!birthPlace.trim())
      errs.birthPlace = isBn ? 'জন্মস্থান আবশ্যক' : 'Birth place is required';
    else if (birthPlace.trim().length < 2)
      errs.birthPlace = isBn
        ? 'অন্তত ২টি অক্ষর আবশ্যক'
        : 'At least 2 characters required';

    // Gotra
    if (!gotra.trim()) errs.gotra = isBn ? 'গোত্র আবশ্যক' : 'Gotra is required';
    else if (gotra.trim().length < 2)
      errs.gotra = isBn
        ? 'অন্তত ২টি অক্ষর আবশ্যক'
        : 'At least 2 characters required';

    // Address
    if (!address.trim())
      errs.address = isBn ? 'ঠিকানা আবশ্যক' : 'Address is required';
    else if (address.trim().length < 5)
      errs.address = isBn
        ? 'অন্তত ৫টি অক্ষর আবশ্যক'
        : 'At least 5 characters required';

    setProfileErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSelectImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.didCancel) return;
      if (result.errorCode) {
        showErrorAlert(
          isBn ? 'ছবি নির্বাচন করা যায়নি' : 'Could not select image',
        );
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        // 5MB Validation (5 * 1024 * 1024 bytes)
        const MAX_SIZE = 5 * 1024 * 1024;
        if (asset.fileSize && asset.fileSize > MAX_SIZE) {
          showAlert({
            title: isBn ? 'সতর্কতা' : 'Warning',
            message: isBn
              ? 'ছবির আকার ৫এমবি-র বেশি হওয়া উচিত নয়'
              : 'Image size should not exceed 5MB',
            buttons: [{ text: 'OK' }],
          });
          return;
        }

        // Extension Validation
        const extension = asset.fileName?.split('.').pop()?.toLowerCase();
        const validExtensions = ['png', 'jpg', 'jpeg'];
        if (!extension || !validExtensions.includes(extension)) {
          showAlert({
            title: isBn ? 'অবৈধ ফাইল' : 'Invalid File',
            message: isBn
              ? 'শুধুমাত্র .png, .jpg, এবং .jpeg ছবি সমর্থনযোগ্য'
              : 'Only .png, .jpg, and .jpeg images are supported.',
            buttons: [{ text: 'OK' }],
          });
          return;
        }

        setProfileImageUri(asset.uri || null);
        setProfileImageFile({
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || 'profile.jpg',
        });
      }
    } catch (error) {
      console.log('Error selecting image:', error);
    }
  };

  const handleAvatarPress = () => {
    const buttons: any[] = [
      {
        text: isBn ? 'গ্যালারি থেকে বেছে নিন' : 'Choose from Gallery',
        onPress: () => handleSelectImage(),
      },
    ];

    const isPlaceholder = profileImageUri?.includes('3A7BFF');
    const hasRealImage =
      (profileImageUri && !isPlaceholder) || profileImageFile;

    // Only show "Remove" option if a real image is currently present
    if (hasRealImage) {
      buttons.push({
        text: isBn ? 'ছবি সরান' : 'Remove Photo',
        style: 'destructive',
        onPress: () => handleRemoveImage(),
      });
    }

    buttons.push({
      text: isBn ? 'বাতিল' : 'Cancel',
      style: 'cancel',
    });

    showAlert({
      title: isBn ? 'প্রোফাইল ছবি' : 'Profile Photo',
      message: isBn ? 'একটি বিকল্প বেছে নিন' : 'Choose an option',
      buttons,
    });
  };

  const handleRemoveImage = () => {
    console.log('--- handleRemoveImage executing ---');
    setProfileImageUri(null);
    setProfileImageFile(null);
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) return;

    try {
      dispatch(showLoader());
      const payload = {
        auth_id: user?.user_id || 0,
        full_name: `${firstName} ${lastName}`.trim(),
        gotra: gotra,
        gender: gender,
        dob: formatApiDate(dob, timeOfBirth),
        birthplace: birthPlace,
        entry_user_id: user?.user_id || 0,
        ctz_address: address,
        social_relation_id: 18, // 18 is 'Self'
        // Send blank string ONLY if no user photo exists (removal or never had one)
        ctnz_profile_image:
          !profileImageFile && !profileImageUri ? '' : undefined,
      };

      let fileData = profileImageFile || undefined;

      // If NO image is selected AND no existing photo exists, send the local placeholder asset as a file.
      // If profileImageUri exists but profileImageFile is null, fileData remains undefined (preserving existing photo).
      if (!profileImageUri && !profileImageFile) {
        const placeholderSource = Image.resolveAssetSource(
          require('../../assets/Placeholder_Person_3A7BFF.png'),
        );
        fileData = {
          uri: placeholderSource.uri,
          name: 'Placeholder_Person_3A7BFF.png',
          type: 'image/png',
        };
      }

      const result = await saveProfile({
        data: JSON.stringify({ enc_data: JSON.stringify(payload) }),
        file: fileData,
      }).unwrap();

      if (result.status === 0) {
        showAlert({
          title: isBn ? 'সফল' : 'Success',
          message:
            result.message ||
            (isBn ? 'সংরক্ষিত হয়েছে' : 'Profile saved successfully'),
          buttons: [{ text: 'OK' }],
        });
      }
    } catch (err: any) {
      showErrorAlert(
        err?.data?.message ||
          (isBn ? 'কিছু ভুল হয়েছে' : 'Something went wrong'),
      );
    } finally {
      dispatch(hideLoader());
    }
  };

  // ── Relative form ─────────────────────────────────────────────────────────
  const [relatives, setRelatives] = useState<RelativeProfile[]>([]);
  const [showAddRelative, setShowAddRelative] = useState(false);
  const [editingRelId, setEditingRelId] = useState<string | null>(null);
  const [relationType, setRelationType] = useState<number | null>(null);
  const [relFirstName, setRelFirstName] = useState('');
  const [relLastName, setRelLastName] = useState('');
  const [relGender, setRelGender] = useState<Gender>('Male');
  const [relDob, setRelDob] = useState('');
  const [relTimeOfBirth, setRelTimeOfBirth] = useState('');
  const [relPlaceOfBirth, setRelPlaceOfBirth] = useState('');
  const [relGotra, setRelGotra] = useState('');
  const [relErrors, setRelErrors] = useState<RelErrors>({});

  const handleEditRelative = (rel: RelativeProfile) => {
    setEditingRelId(rel.id);
    setRelationType(rel.relationTypeId || null);
    setRelFirstName(rel.firstName);
    setRelLastName(rel.lastName);
    setRelGender(rel.gender);
    setRelDob(rel.dob);
    setRelTimeOfBirth(rel.timeOfBirth);
    setRelPlaceOfBirth(rel.placeOfBirth);
    setRelGotra(rel.gotra);
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
                  (isBn ? 'কিছু ভুল হয়েছে' : 'Something went wrong'),
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

    // Relation Type
    if (relationType === null)
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

    // Gotra
    if (!relGotra.trim())
      errs.gotra = isBn ? 'গোত্র আবশ্যক' : 'Gotra is required';
    else if (relGotra.trim().length < 2)
      errs.gotra = isBn
        ? 'অন্তত ২টি অক্ষর আবশ্যক'
        : 'At least 2 characters required';

    setRelErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveRelative = async () => {
    if (!validateRelative()) return;

    try {
      dispatch(showLoader());
      const relName =
        SOCIAL_RELATIONS.find(r => r.id === relationType)?.name || '';

      const payload = [
        {
          relative_id: editingRelId ? parseInt(editingRelId, 10) : 0,
          relation_type_id: relationType,
          full_name: `${relFirstName} ${relLastName}`.trim(),
          date_of_birth: formatApiDate(relDob, relTimeOfBirth),
          place_of_birth: relPlaceOfBirth,
          gender: relGender,
          gotram: relGotra,
          created_by: user?.user_id || 0,
        },
      ];

      const result = await saveRelativeMutation({
        data: JSON.stringify({ enc_data: JSON.stringify(payload) }),
      }).unwrap();

      if (result.status === 0) {
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
            },
          ]);
        }

        clearRelForm();

        showAlert({
          title: isBn ? 'সফল' : 'Success',
          message:
            result.message ||
            (isBn
              ? 'আত্মীয় প্রোফাইল সংরক্ষিত হয়েছে'
              : 'Relative profile saved successfully'),
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
    setRelationType(null);
    setRelFirstName('');
    setRelLastName('');
    setRelGender('Male');
    setRelDob('');
    setRelTimeOfBirth('');
    setRelPlaceOfBirth('');
    setRelGotra('');
    setRelErrors({});
    setShowAddRelative(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={Colors.primary}
        barStyle="light-content"
        translucent={true}
      />
      <View>
        <View
          style={[
            styles.headerBar,
            { paddingTop: insets.top + 12, paddingBottom: 14 },
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerBackBtn}
          >
            <Text style={styles.headerBackText}>
              ← {isBn ? 'ফিরে যান' : 'Back to Dashboard'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[BRAND_ORANGE]}
            tintColor={BRAND_ORANGE}
          />
        }
      >
        <View style={styles.avatarSection}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleAvatarPress}
            style={styles.avatarOuter}
          >
            <Image
              source={
                profileImageUri
                  ? { uri: profileImageUri }
                  : require('../../assets/Placeholder_Person_3A7BFF.png')
              }
              style={styles.avatarCircle}
              onLoadStart={() => setIsImageLoading(true)}
              onLoadEnd={() => setIsImageLoading(false)}
            />
            {isImageLoading && (
              <View style={styles.imageLoaderOverlay}>
                <ActivityIndicator size="small" color="#FF6F00" />
              </View>
            )}
            <View style={styles.cameraBtn}>
              <Text style={styles.cameraIcon}>📷</Text>
            </View>
          </TouchableOpacity>

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
                setFirstName(v.replace(/[^a-zA-Z\s.-]/g, ''));
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
                setLastName(v.replace(/[^a-zA-Z\s.-]/g, ''));
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
              onChange={() => {}}
              onPress={() => {
                setPickerTarget('profile');
                setShowDatePicker(true);
              }}
              placeholder="DD/MM/YYYY"
              error={profileErrors.dob}
            />
            <Field
              label={isBn ? 'জন্ম সময়' : 'TIME OF BIRTH'}
              required
              value={timeOfBirth}
              onChange={() => {}}
              onPress={() => {
                setPickerTarget('profile');
                setShowTimePicker(true);
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
                setBirthPlace(v.replace(/[^a-zA-Z0-9\s,.#\-/]/g, ''));
                if (profileErrors.birthPlace)
                  setProfileErrors(p => ({ ...p, birthPlace: undefined }));
              }}
              placeholder={isBn ? 'জন্মস্থান লিখুন' : 'Enter birth place'}
              error={profileErrors.birthPlace}
            />
            <Field
              label={isBn ? 'গোত্র' : 'GOTRA'}
              required
              value={gotra}
              onChange={v => {
                setGotra(v.replace(/[^a-zA-Z\s.-]/g, ''));
                if (profileErrors.gotra)
                  setProfileErrors(p => ({ ...p, gotra: undefined }));
              }}
              placeholder={isBn ? 'গোত্র লিখুন' : 'Enter gotra'}
              error={profileErrors.gotra}
            />
          </View>

          <Field
            label={isBn ? 'ঠিকানা' : 'ADDRESS'}
            required
            multiline
            value={address}
            onChange={v => {
              setAddress(v.replace(/[^a-zA-Z0-9\s,.#\-/]/g, ''));
              if (profileErrors.address)
                setProfileErrors(p => ({ ...p, address: undefined }));
            }}
            placeholder={isBn ? 'আপনার ঠিকানা লিখুন' : 'Enter your address'}
            error={profileErrors.address}
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
        {(userDetailsRaw?.ctnz_profile_progress_percent || 0) > 0 && (
          <View style={styles.card}>
            <View style={styles.relationHeader}>
              <Text style={styles.sectionTitle}>
                {isBn ? 'সম্পর্কের বিবরণ' : 'Relation Details'}
              </Text>
              {/* If relatives exist, show the small header button */}
              {relatives.length > 0 && (
                <TouchableOpacity
                  style={styles.addRelBtn}
                  onPress={() => {
                    setRelErrors({});
                    setShowAddRelative(true);
                  }}
                >
                  <Text style={styles.addRelBtnText}>
                    + {isBn ? 'সম্পর্ক যোগ' : 'Add Relative'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* If NO relatives yet, show the nudge banner */}
            {relatives.length === 0 && (
              <>
                {/* Dashed line as shown in image */}
                <View style={styles.dashedDivider} />

                {/* New Promo Style Add Relative Container */}
                <View style={styles.promoCard}>
                  <View style={styles.promoContent}>
                    <Text style={styles.promoIcon}>👨‍👩‍👧‍👦</Text>
                    <Text style={styles.promoText}>
                      {isBn
                        ? 'আপনি কি আপনার পরিবারের সদস্যদের যোগ করতে চান? '
                        : 'Would you like to add your family members? '}
                      <Text style={styles.promoHighlight}>
                        {isBn
                          ? 'আত্মীয়দের যোগ করা আপনার পূজার অভিজ্ঞতাকে ব্যক্তিগতকৃত করতে সহায়তা করে।'
                          : 'Adding relatives helps personalise your puja experience.'}
                      </Text>
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.promoAddBtn}
                    onPress={() => {
                      setRelErrors({});
                      setShowAddRelative(true);
                    }}
                  >
                    <Text style={styles.promoAddBtnText}>
                      + {isBn ? 'সম্পর্ক যোগ' : 'Add Relative'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {relatives.length > 0 && !showAddRelative && (
              <View style={{ marginTop: 20 }}>
                <Text style={styles.fieldLabel}>
                  {isBn ? 'যোগ করা আত্মীয়' : 'Added Relations'} (
                  {relatives.length})
                </Text>
                <ScrollView
                  style={{ maxHeight: 420, marginTop: 8 }}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                >
                  {relatives.map(rel => (
                    <View key={rel.id} style={styles.relativeCard}>
                      <View style={styles.relCardHeader}>
                        <Text style={styles.relativeCardTitle}>
                          {rel.firstName} {rel.lastName}
                        </Text>
                        <View style={styles.relCardActions}>
                          <TouchableOpacity
                            onPress={() => handleEditRelative(rel)}
                            style={{ padding: 4 }}
                          >
                            <Text style={{ fontSize: 13 }}>✏️</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteRelative(rel.id)}
                            style={{ padding: 4 }}
                          >
                            <Text style={{ fontSize: 13 }}>🗑️</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={styles.relCardDetails}>
                        <View style={styles.relPill}>
                          <Text style={styles.relPillText}>
                            {rel.relationType}
                          </Text>
                        </View>
                        <Text style={styles.relativeCardSub}>
                          {' '}
                          • {rel.gender}{' '}
                          {rel.dob
                            ? `• ${rel.dob.split('/').reverse().join('-')}`
                            : ''}
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Pickers & Modals */}
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
              <Dropdown
                label={isBn ? 'সম্পর্কের ধরন' : 'RELATION TYPE'}
                required
                placeholder={isBn ? 'সম্পর্ক নির্বাচন করুন' : 'Select relation'}
                options={SOCIAL_RELATIONS}
                value={relationType}
                onSelect={setRelationType}
                isLoading={false}
                error={relErrors.relationType}
              />

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
                  onChange={() => {}}
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
                  onChange={() => {}}
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
                <Field
                  label={isBn ? 'গোত্র' : 'GOTRA'}
                  required
                  value={relGotra}
                  onChange={v => {
                    setRelGotra(v.replace(/[^a-zA-Z\s.-]/g, ''));
                    if (relErrors.gotra)
                      setRelErrors(p => ({ ...p, gotra: undefined }));
                  }}
                  placeholder={isBn ? 'গোত্র' : 'Enter gotra'}
                  error={relErrors.gotra}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerBar: {
    backgroundColor: BRAND_ORANGE,
    paddingHorizontal: 16,
    paddingVertical: 14,
    // paddingTop removed to allow insets in component
  },
  headerBackBtn: { flexDirection: 'row', alignItems: 'center' },
  headerBackText: { color: Colors.white, fontSize: 14, fontWeight: '600' },
  body: { flex: 1 },

  avatarSection: {
    backgroundColor: BRAND_ORANGE,
    alignItems: 'center',
    paddingBottom: 32,
    paddingTop: 8,
  },
  avatarOuter: {
    position: 'relative',
    marginBottom: 10,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.splashBg,
    borderWidth: 3,
    borderColor: Colors.primary, // Changed from white to primary to remove white gap appearance
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: Colors.white, fontSize: 36, fontWeight: '900' },
  cameraBtn: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.disabled,
  },
  cameraIcon: { fontSize: 13 },
  trashBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF4D4D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    elevation: 4,
  },
  trashIcon: { fontSize: 13 },
  avatarName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
    marginTop: 10,
  },
  avatarPhone: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },

  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 20,
    padding: 20,
    shadowColor: Colors.black,
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
  sectionDivider: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginVertical: 20,
  },

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
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: BRAND_TEXT,
    backgroundColor: Colors.ultraLightGray,
  },
  inputError: { borderColor: ERROR_COLOR, backgroundColor: Colors.tagRed },
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
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
  },
  genderBtnActive: { backgroundColor: BRAND_ORANGE, borderColor: BRAND_ORANGE },
  genderBtnText: { fontSize: 13, fontWeight: '600', color: BRAND_MUTED },
  genderBtnTextActive: { color: Colors.white, fontWeight: '700' },

  saveBox: {
    backgroundColor: Colors.lightOrange,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 12,
    marginTop: 8,
    gap: 10,
  },
  saveBoxLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  saveIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveIcon: { fontSize: 18 },
  saveBoxTitle: { fontSize: 13, fontWeight: '700', color: BRAND_TEXT },
  saveBoxSub: { fontSize: 10, color: BRAND_MUTED, marginTop: 2 },
  saveBoxBtns: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  cancelBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
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
  saveBtnText: { fontSize: 13, color: Colors.white, fontWeight: '700' },

  relationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addRelBtn: {
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: Colors.lightOrange,
  },
  addRelBtnText: { fontSize: 12, color: BRAND_ORANGE, fontWeight: '700' },
  dashedDivider: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#FFE4C4',
    borderStyle: 'dashed',
    marginVertical: 12,
  },
  promoCard: {
    backgroundColor: '#FFF9F2',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#FFE4C4',
    marginTop: 4,
  },
  promoContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  promoIcon: { fontSize: 22 },
  promoText: { fontSize: 12, color: BRAND_TEXT, flex: 1, lineHeight: 18 },
  promoHighlight: { color: BRAND_ORANGE, fontWeight: '700' },
  promoAddBtn: {
    backgroundColor: BRAND_ORANGE,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
    elevation: 2,
    shadowColor: BRAND_ORANGE,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
  },
  promoAddBtnText: { color: Colors.white, fontSize: 11, fontWeight: '800' },

  relativeCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  relCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  relCardActions: { flexDirection: 'row', gap: 6 },
  relativeCardTitle: { fontSize: 14, fontWeight: '800', color: BRAND_TEXT },
  relativeCardSub: { fontSize: 12, color: BRAND_MUTED, paddingTop: 1 },
  relCardDetails: { flexDirection: 'row', alignItems: 'center' },
  relPill: {
    backgroundColor: Colors.lightOrange,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  relPillText: { fontSize: 11, color: BRAND_ORANGE, fontWeight: '700' },

  addRelForm: {
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    paddingTop: 16,
    marginTop: 8,
  },
  addRelFormTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: BRAND_TEXT,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeIcon: {
    fontSize: 22,
    color: BRAND_MUTED,
    fontWeight: '700',
  },

  relFormBtnsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  relCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.disabled,
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
  relSaveBtnText: { fontSize: 14, color: Colors.white, fontWeight: '700' },

  imageLoaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 40,
  },
  bottomSpacer: { height: 60 },
});
