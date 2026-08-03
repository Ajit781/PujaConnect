/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '../../store';
import { useAlert } from '../../context/AlertContext';
import { Colors } from '../../constants/Colors';
import TopNavBar from '../../components/common/TopNavBar';
import LinearGradient from 'react-native-linear-gradient';
import {
  useSaveUserProfileMutation,
  useSaveUserProfileImageMutation,
  uploadUserProfileImageDirectly,
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
import { ArrowLeft, User, Camera, Calendar, Clock, Check, Save, Upload, Image as ImageIcon, Trash2 } from 'lucide-react-native';
const BRAND_ORANGE = Colors.primary;
const BRAND_TEXT = Colors.textMain;
const BRAND_MUTED = Colors.textMuted;
const ERROR_COLOR = Colors.red;
type Gender = 'Male' | 'Female' | 'Others';
interface RelativeProfile {
  id: string;          // relative_auth_id (UI identifier)
  dbId?: number;       // relative_id (actual DB row ID — used for update API)
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
  contact?: string;    // Contact/Mobile number
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
const Field = React.memo(function Field({
  label,
  value,
  required,
  onChange,
  placeholder,
  error,
  keyboardType,
  multiline,
  onPress,
  editable,
  icon,
  autoCapitalize = 'words',
  autoComplete,
}: {
  label: string;
  value: string;
  required?: boolean;
  onChange: (v: string) => void;
  placeholder: string;
  error?: string;
  keyboardType?: any;
  multiline?: boolean;
  onPress?: () => void;
  editable?: boolean;
  icon?: React.ReactNode;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: any;
}) {
  const hasErr = !!error;
  const isPressable = !!onPress;
  const isEditable = editable ?? !isPressable;

  const [localVal, setLocalVal] = useState(value || '');
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (!isFocusedRef.current && value !== localVal) {
      setLocalVal(value || '');
    }
  }, [value]);

  const handleChangeText = (text: string) => {
    setLocalVal(text);
    onChange(text);
  };

  const inputContent = (
    <View
      style={[{
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: hasErr ? '#DC2626' : '#E5E7EB',
        borderRadius: 12,
        backgroundColor: isPressable ? '#F9FAFB' : '#FFF',
        paddingHorizontal: 12,
        height: multiline ? 100 : 48,
      }, multiline && { alignItems: 'flex-start', paddingTop: 12 }]}>
      {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
      <TextInput
        style={{
          flex: 1,
          fontSize: 14,
          color: '#1F2937',
          height: '100%',
          paddingVertical: 0,
        }}
        placeholder={placeholder}
        placeholderTextColor="#64748B"
        value={localVal}
        onChangeText={handleChangeText}
        onFocus={() => { isFocusedRef.current = true; }}
        onBlur={() => { isFocusedRef.current = false; }}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
        editable={isEditable}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        autoCorrect={true}
      />
    </View>
  );

  return (
    <View style={{ flex: 1, marginBottom: 4 }}>
      <Text style={styles.fieldLabel}>
        {label} {required && <Text style={{ color: '#DC2626' }}>*</Text>}
      </Text>
      {isPressable ? (
        <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
          {inputContent}
        </TouchableOpacity>
      ) : (
        inputContent
      )}
      {hasErr && <Text style={{ color: '#DC2626', fontSize: 12, marginTop: 4 }}>⚠ {error}</Text>}
    </View>
  );
});
const InputField = Field;
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
export default function UpdateProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { i18n, t } = useTranslation();
  const isBn = i18n.language === 'bn';
  const { showToast } = useToast();
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
  const [gotra, setGotra] = useState('');         // display name
  const [gotraId, setGotraId] = useState<number | null>(null); // numeric ID sent to API
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});
  const isEditing = true;
  const [address, setAddress] = useState('');
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
  const [saveProfileImage] = useSaveUserProfileImageMutation();
  const [saveRelativeMutation] = useSaveRelativeDetailsMutation();
  const [deleteRelativeMutation] = useDeleteRelativeDetailsMutation();
  const [saveAddressV1Mutation] = useSaveAddressV1Mutation();
  const { data: gotraList = [] } = useGetGotraDetailsQuery();
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
      // Robust Gender mapping (handles ctnz_gender_id and ctnz_gender_name)
      const rawGender = userDetailsRaw.ctnz_gender_id;
      if (rawGender === 1 || rawGender === '1' || userDetailsRaw.ctnz_gender_name === 'Male') {
        setGender('Male');
      } else if (rawGender === 2 || rawGender === '2' || userDetailsRaw.ctnz_gender_name === 'Female') {
        setGender('Female');
      } else if (rawGender === 3 || rawGender === '3' || userDetailsRaw.ctnz_gender_name === 'Others') {
        setGender('Others');
      } else {
        setGender('Male');
      }
      // Robust Gotra mapping (handles ctnz_gotra_id and ctnz_gotra_name)
      const gotraIdVal = userDetailsRaw.ctnz_gotra_id;
      const gotraNameVal = userDetailsRaw.ctnz_gotra_name;
      if (gotraIdVal) {
        setGotraId(Number(gotraIdVal));
      }
      if (gotraNameVal) {
        setGotra(gotraNameVal);
      }
      if (userDetailsRaw.ctnz_profile_image) {
        const rawImgUrl = userDetailsRaw.ctnz_profile_image;
        const freshUrl = rawImgUrl.includes('?')
          ? `${rawImgUrl}&t=${Date.now()}`
          : `${rawImgUrl}?t=${Date.now()}`;
        setProfileImageUri(freshUrl);
      }
      setBirthPlace(userDetailsRaw.ctnz_birth_place || '');
      setAddress(userDetailsRaw.ctnz_address || '');
      if (userDetailsRaw.ctnz_dob || userDetailsRaw.dob) {
        const rawDob = userDetailsRaw.ctnz_dob || userDetailsRaw.dob || '';
        const [dPart, tPart] = rawDob.includes('T') ? rawDob.split('T') : rawDob.split(' ');
        if (dPart) {
          const [y, m, d] = dPart.split('-');
          if (y && m && d) setDob(`${d}/${m}/${y}`);
        }
        const rawTime = userDetailsRaw.ctnz_tob || userDetailsRaw.tob || tPart;
        if (rawTime) {
          const [h, min] = rawTime.split(':');
          if (h && min) {
            let hr = parseInt(h, 10);
            const ampm = hr >= 12 ? 'PM' : 'AM';
            hr = hr % 12 || 12;
            setTimeOfBirth(`${hr.toString().padStart(2, '0')}:${min} ${ampm}`);
          }
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
          // API returns relative_auth_id but not relative_id as a DB row ID separately
          // Use relative_auth_id as the DB ID for update operations
          const relativeDbId = r.relative_id
            ? Number(r.relative_id)
            : r.relative_auth_id
              ? Number(r.relative_auth_id)
              : undefined;
          console.log('=== RELATIVE MAPPING ===', {
            relative_auth_id: r.relative_auth_id,
            relative_id: r.relative_id,
            usingAsId: relativeAuthId,
            dbId: relativeDbId,
          });
          return {
            id: relativeAuthId.toString(),
            dbId: relativeDbId,
            relationType: r.relation_type_name || SOCIAL_RELATIONS.find(m => m.id === r.relation_type_id)?.name || '',
            relationTypeId: r.relation_type_id,
            firstName: relParts[0] || '',
            lastName: relParts.slice(1).join(' ') || '',
            gender: r.relative_gender_name || (r.relative_gender_id === 1 ? 'Male' : r.relative_gender_id === 2 ? 'Female' : 'Others') || 'Male',
            dob: rDob,
            timeOfBirth: rTime,
            placeOfBirth: r.relative_birth_place || '',
            gotra: r.relative_gotra_name || r.relative_gotra || '',
            gotraId: r.relative_gotra_id ? Number(r.relative_gotra_id) : undefined,
            contact: r.relative_contact_no || r.relative_mobile || r.mobile_no || r.relative_phone || r.delivery_contact_no || '',
          };
        });
        const uniqueMappedRels: RelativeProfile[] = [];
        const seenKeys = new Set<string>();
        for (const rel of mappedRels) {
          const key = rel.dbId && rel.dbId !== 0
            ? `db_${rel.dbId}`
            : rel.id && rel.id !== '0'
              ? `id_${rel.id}`
              : `${rel.firstName.trim().toLowerCase()}_${rel.lastName.trim().toLowerCase()}_${rel.relationTypeId}_${rel.dob}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            uniqueMappedRels.push(rel);
          }
        }
        setRelatives(uniqueMappedRels);
      }
    }
  }, [userDetailsRaw, gotraList]);
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
  const formatOnlyDate = (dateStr: string): string => {
    // dateStr: DD/MM/YYYY -> YYYY-MM-DD
    if (!dateStr) return '';
    const [d, m, y] = dateStr.split('/');
    if (y && m && d) {
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return dateStr;
  };
  const formatOnlyTime = (timeStr: string): string => {
    // timeStr: HH:MM AM/PM -> HH:mm
    if (!timeStr) return '';
    return convertTo24Hour(timeStr) || '';
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
    // Date of Birth - Optional
    // Time of Birth - Optional
    // Birth Place - Optional
    // Gotra - Optional
    // Address field has been removed from UI, so skipping validation here.
    setProfileErrors(errs);
    return Object.keys(errs).length === 0;
  };
  const processPickedImage = async (result: any) => {
    if (result.didCancel) return;
    if (result.errorCode) {
      showErrorAlert(
        isBn ? 'ছবি নির্বাচন বা ক্যাপচার করা যায়নি' : 'Could not select or capture image',
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
      const fileName = asset.fileName || asset.uri?.split('/').pop() || 'photo.jpg';
      const extension = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() || 'jpg' : 'jpg';
      const validExtensions = ['png', 'jpg', 'jpeg', 'heic', 'webp'];
      if (!validExtensions.includes(extension)) {
        showAlert({
          title: isBn ? 'অবৈধ ফাইল' : 'Invalid File',
          message: isBn
            ? 'শুধুমাত্র .png, .jpg, এবং .jpeg ছবি সমর্থনযোগ্য'
            : 'Only .png, .jpg, and .jpeg images are supported.',
          buttons: [{ text: 'OK' }],
        });
        return;
      }
      const selectedFile = {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: fileName,
      };
      setProfileImageUri(asset.uri || null);
      setProfileImageFile(selectedFile);
    }
  };

  const handleDirectUploadPhoto = async () => {
    if (!profileImageFile) return;
    try {
      setIsImageLoading(true);
      dispatch(showLoader());
      const targetId = user?.user_id || 0;
      console.log('=== UPLOADING PHOTO via saveProfileImage mutation ===', targetId);
      const res = await saveProfileImage({
        authId: targetId,
        file: profileImageFile,
      }).unwrap();
      console.log('=== DIRECT UPLOAD PHOTO RESULT ===', res);
      if (res?.status === 0 || res?.status === '0') {
        await refetchUserDetails();
        showToast({
          message: isBn ? 'প্রোফাইল ছবি সফলভাবে আপডেট হয়েছে' : 'Profile photo updated successfully',
          type: 'success',
        });
        setProfileImageFile(null);
        setTimeout(() => {
          navigation.navigate('EditProfile');
        }, 300);
      } else {
        showErrorAlert(
          res?.message || (isBn ? 'ছবি সংরক্ষণ করা যায়নি' : 'Failed to save photo. Please try again.'),
        );
      }
    } catch (err: any) {
      console.log('Direct Upload Photo Error:', err);
      showErrorAlert(err?.data?.message || (isBn ? 'ছবি সংরক্ষণ করা যায়নি' : 'Failed to save photo. Please try again.'));
    } finally {
      setIsImageLoading(false);
      dispatch(hideLoader());
    }
  };

  const openCamera = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.4,
        maxWidth: 450,
        maxHeight: 450,
        cameraType: 'back',
        includeBase64: false,
        saveToPhotos: false,
        includeExtra: false,
      });

      if (result.didCancel) return;
      if (result.errorCode) {
        showErrorAlert(
          result.errorMessage ||
            (isBn ? 'ক্যামেরা খোলা সম্ভব হয়নি' : 'Could not open camera. Please try again.'),
        );
        return;
      }
      processPickedImage(result);
    } catch (error) {
      console.log('Error capturing photo:', error);
    }
  };

  const openGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.4,
        maxWidth: 450,
        maxHeight: 450,
        includeBase64: false,
        includeExtra: false,
      });
      if (result.didCancel || result.errorCode) return;
      processPickedImage(result);
    } catch (error) {
      console.log('Error selecting image from gallery:', error);
    }
  };

  const handleAvatarPress = () => {
    const buttons: any[] = [
      {
        text: isBn ? 'ক্যামেরা (ছবি তুলুন)' : 'Take Photo (Camera)',
        icon: <Camera size={18} color="#D97706" />,
        onPress: () => openCamera(),
      },
      {
        text: isBn ? 'গ্যালারি থেকে বেছে নিন' : 'Choose from Gallery',
        icon: <ImageIcon size={18} color="#D97706" />,
        onPress: () => openGallery(),
      },
    ];
    const isPlaceholder = profileImageUri?.includes('3A7BFF');
    const hasRealImage =
      (profileImageUri && !isPlaceholder) || profileImageFile;
    // Only show "Remove" option if a real image is currently present
    if (hasRealImage) {
      buttons.push({
        text: isBn ? 'ছবি সরিয়ে ফেলুন' : 'Remove Photo',
        icon: <Trash2 size={18} color="#DC2626" />,
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
      // Gender → numeric: 1=Male, 2=Female, 3=Others
      const genderNum = gender === 'Male' ? 1 : gender === 'Female' ? 2 : 3;
      const payload = {
        auth_id: user?.user_id || 0,
        full_name: `${firstName} ${lastName}`.trim(),
        gotra: gotraId ?? gotra, // send ID if available, else fallback to name
        gender: genderNum,
        dob: formatOnlyDate(dob),
        tob: formatOnlyTime(timeOfBirth),
        birthplace: birthPlace,
        entry_user_id: user?.user_id || 0,
        ctz_address: address,
        social_relation_id: 18,
        ctnz_profile_image: profileImageFile ? undefined : '',
      };
      console.log('==============================================');
      console.log('=== SAVE USER PROFILE: PAYLOAD OBJECT ===');
      console.log(JSON.stringify(payload, null, 2));
      console.log('==============================================');
      // Server always requires a file field in the multipart form.
      // Send the user's selected image if available, otherwise always send the placeholder.
      let fileData: any = profileImageFile;
      if (!profileImageFile) {
        const dummyPath = RNFS.DocumentDirectoryPath + '/empty_profile.png';
        const exists = await RNFS.exists(dummyPath);
        if (!exists) {
          await RNFS.writeFile(
            dummyPath,
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
            'base64',
          );
        }
        fileData = {
          uri: 'file://' + dummyPath,
          name: 'empty_profile.png',
          type: 'image/png',
        };
      }
      const result = await saveProfile({
        data: JSON.stringify({ enc_data: JSON.stringify(payload) }),
        file: fileData,
      }).unwrap();
      console.log('==============================================');
      console.log('=== SAVE USER PROFILE: API RESULT ===');
      console.log(JSON.stringify(result, null, 2));
      console.log('==============================================');
      if (profileImageFile) {
        try {
          console.log('=== UPLOADING USER PROFILE IMAGE via save_user_profile_image ===');
          const imgResult = await saveProfileImage({
            authId: user?.user_id || 0,
            file: profileImageFile,
          }).unwrap();
          console.log('=== SAVE USER PROFILE IMAGE RESULT ===', JSON.stringify(imgResult, null, 2));
        } catch (imgErr) {
          console.log('=== SAVE USER PROFILE IMAGE ERROR ===', JSON.stringify(imgErr, null, 2));
        }
      }
      if (result.status === 0) {
        await refetchUserDetails();
        showAlert({
          title: isBn ? 'সফল' : 'Success',
          message: isBn ? 'সফলভাবে সম্পাদনা করা হয়েছে' : 'Edit successfully',
          buttons: [{
            text: 'OK',
            onPress: () => {
              navigation.navigate('EditProfile');
            }
          }],
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
  };
  // ── Relative form ─────────────────────────────────────────────────────────
  const [relatives, setRelatives] = useState<RelativeProfile[]>([]);
  const [showAddRelative, setShowAddRelative] = useState(false);
  const [editingRelId, setEditingRelId] = useState<string | null>(null);
  const [editingDbId, setEditingDbId] = useState<number | null>(null); // actual DB row ID for update API
  const [relationType, setRelationType] = useState<number | null>(null);
  const [relFirstName, setRelFirstName] = useState('');
  const [relLastName, setRelLastName] = useState('');
  const [relGender, setRelGender] = useState<Gender>('Male');
  const [relDob, setRelDob] = useState('');
  const [relTimeOfBirth, setRelTimeOfBirth] = useState('');
  const [relPlaceOfBirth, setRelPlaceOfBirth] = useState('');
  const [relGotra, setRelGotra] = useState('');       // display name
  const [relGotraId, setRelGotraId] = useState<number | null>(null); // numeric ID sent to API
  const [relContact, setRelContact] = useState(''); // Contact number state for relative
  const [relErrors, setRelErrors] = useState<RelErrors>({});
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
          date_of_birth: formatOnlyDate(relDob),
          time_of_birth: formatOnlyTime(relTimeOfBirth),
          place_of_birth: relPlaceOfBirth,
          contact_no: relContact,
          gender: relGenderNum,
          gotram: relGotraId,
          created_by: user?.user_id || 0,
        },
      ];
      console.log('==============================================');
      console.log('=== SAVE RELATIVE DETAILS: PAYLOAD OBJECT ===');
      console.log('Mode:', editingRelId ? 'UPDATE' : 'ADD');
      console.log(JSON.stringify(payload, null, 2));
      console.log('==============================================');
      const result = await saveRelativeMutation({
        data: JSON.stringify({ enc_data: JSON.stringify(payload) }),
      }).unwrap();
      console.log('==============================================');
      console.log('=== SAVE RELATIVE DETAILS: API RESULT ===');
      console.log(JSON.stringify(result, null, 2));
      console.log('==============================================');
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
                  gotraId: relGotraId ?? undefined,
                  contact: relContact,
                }
                : r,
            ),
          );
        }
        clearRelForm();
        // Refetch from server so relatives list shows latest data directly from DB
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
        (isBn ? 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে' : 'Failed to update profile. Please try again.'),
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
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF6EF' }} edges={['bottom']}>
      {/* Header */}
      <TopNavBar
        showBack={true}
        onBackPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate('MainTabs');
          }
        }}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Back button */}
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('MainTabs');
            }
          }}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16 }}>
          <ArrowLeft size={20} color="#4B5563" />
          <Text style={{ marginLeft: 8, fontSize: 15, color: '#4B5563', fontWeight: '700' }}>{isBn ? 'প্রোফাইলে ফিরে যান' : 'Back to profile'}</Text>
        </TouchableOpacity>
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#D97706', marginBottom: 8, letterSpacing: 1 }}>
            {isBn ? 'আমার অ্যাকাউন্ট' : 'MY ACCOUNT'}
          </Text>
          <Text style={{ fontSize: 26, color: '#1F2937', fontWeight: '400', marginBottom: 12 }}>
            {isBn ? 'আপনার প্রোফাইল সম্পূর্ণ করুন' : 'Complete your profile'}
          </Text>
          <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 20 }}>
            {isBn ? 'দ্রুত এবং আরও সঠিক পূজা বুকিংয়ের জন্য আপনার ব্যক্তিগত বিবরণ একবার যোগ করুন।' : 'Add your personal details once for faster, more accurate puja bookings.'}
          </Text>
        </View>
        {/* Profile Photo Card */}
        <View style={{ margin: 16, backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <TouchableOpacity onPress={handleAvatarPress} style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 16, borderWidth: 4, borderColor: '#FDF7F1', overflow: 'hidden' }}>
              {profileImageUri ? (
                <Image source={{ uri: profileImageUri }} style={{ width: '100%', height: '100%', borderRadius: 36 }} resizeMode="cover" />
              ) : (
                <View style={{ width: '100%', height: '100%', borderRadius: 36, backgroundColor: '#F97316', justifyContent: 'center', alignItems: 'center' }}>
                  <User size={32} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, color: '#374151', marginBottom: 4, fontWeight: '700' }}>{isBn ? 'প্রোফাইল ছবি' : 'Profile photo'}</Text>
              <Text style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 18, marginBottom: 12 }}>
                {isBn ? '৫ এমবি পর্যন্ত একটি জেপিজি, পিএনজি বা ওয়েবপি ছবি ব্যবহার করুন।' : 'Use a JPG, PNG or WebP image up to 5 MB.'}
              </Text>
              <View style={{ gap: 8 }}>
                <TouchableOpacity
                  onPress={handleAvatarPress}
                  style={{
                    alignSelf: 'flex-start',
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#FDBA74',
                    backgroundColor: '#FFF7ED',
                  }}>
                  <Camera size={16} color="#9A3412" style={{ marginRight: 8 }} />
                  <Text style={{ color: '#9A3412', fontSize: 14, fontWeight: '800' }}>{isBn ? 'ছবি পরিবর্তন করুন' : 'Change photo'}</Text>
                </TouchableOpacity>

                {profileImageFile && (
                  <TouchableOpacity
                    onPress={handleDirectUploadPhoto}
                    disabled={isImageLoading}
                    style={{
                      alignSelf: 'flex-start',
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: '#FDBA74',
                      backgroundColor: isImageLoading ? '#F3F4F6' : '#FFF7ED',
                      opacity: isImageLoading ? 0.6 : 1,
                    }}>
                    <Upload size={16} color="#9A3412" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#9A3412', fontSize: 14, fontWeight: '800' }}>{isBn ? 'ছবি আপলোড করুন' : 'Upload Photo'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
        {/* Personal Details Card */}
        <View style={{ backgroundColor: '#FFF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E5E7EB' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
            <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <User size={20} color="#D97706" />
            </View>
            <View>
              <Text style={{ fontSize: 18, color: '#1F2937', marginBottom: 2 }}>{isBn ? 'ব্যক্তিগত বিবরণ' : 'Personal Details'}</Text>
              <Text style={{ fontSize: 13, color: '#9CA3AF' }}>{isBn ? 'তারকাচিহ্নিত ক্ষেত্রগুলো পূরণ করা আবশ্যক।' : 'Fields marked with an asterisk are required.'}</Text>
            </View>
          </View>
          <View style={{ padding: 16 }}>
            <Field
              label={isBn ? 'প্রথম নাম' : 'FIRST NAME'}
              required
              value={firstName}
              onChange={v => {
                setFirstName(v);
                if (profileErrors.firstName) setProfileErrors(p => ({ ...p, firstName: undefined }));
              }}
              placeholder={isBn ? 'আপনার প্রথম নাম লিখুন' : 'Enter first name'}
              error={profileErrors.firstName}
              autoCapitalize="words"
              autoComplete="name-given"
            />
            <View style={{ height: 16 }} />
            <Field
              label={isBn ? 'শেষ নাম' : 'LAST NAME'}
              value={lastName}
              onChange={v => {
                setLastName(v);
                if (profileErrors.lastName) setProfileErrors(p => ({ ...p, lastName: undefined }));
              }}
              placeholder={isBn ? 'আপনার শেষ নাম লিখুন' : 'Enter last name'}
              error={profileErrors.lastName}
              autoCapitalize="words"
              autoComplete="name-family"
            />
            <View style={{ height: 16 }} />
            <Text style={styles.fieldLabel}>{isBn ? 'লিঙ্গ' : 'GENDER'} <Text style={{ color: '#DC2626' }}>*</Text></Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['Male', 'Female', 'Others'] as Gender[]).map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                  onPress={() => setGender(g)}
                >
                  <Text style={[styles.genderBtnText, gender === g && styles.genderBtnTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ height: 16 }} />
            <Field
              label={isBn ? 'জন্ম তারিখ' : 'DATE OF BIRTH'}
              required
              value={dob}
              onChange={() => { }}
              onPress={() => {
                setPickerTarget('profile');
                setShowDatePicker(true);
              }}
              placeholder={isBn ? 'জন্ম তারিখ নির্বাচন করুন' : 'Select date of birth'}
              error={profileErrors.dob}
              icon={<Calendar size={20} color="#F97316" />}
            />
            <View style={{ height: 16 }} />
            <Field
              label={isBn ? 'জন্ম সময়' : 'TIME OF BIRTH'}
              value={timeOfBirth}
              onChange={() => { }}
              onPress={() => {
                setPickerTarget('profile');
                setShowTimePicker(true);
              }}
              placeholder={isBn ? 'জন্ম সময় নির্বাচন করুন' : 'Select time of birth'}
              error={profileErrors.timeOfBirth}
              icon={<Clock size={20} color="#9CA3AF" />}
            />
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginTop: -8, marginBottom: 16 }}>
              <View style={{ marginTop: 14, width: 20, height: 20, borderRadius: 4, backgroundColor: '#D97706', justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
                <Check size={14} color="#FFF" />
              </View>
              <Text style={{ marginTop: 14, fontSize: 14, color: '#4B5563', fontWeight: '700' }}>{isBn ? 'আমি জন্ম সময় জানি না' : "I don't know the birth time"}</Text>
            </TouchableOpacity>
            <View style={{ height: 8 }} />
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.fieldLabel}>
                {isBn ? 'গোত্র' : 'GOTRA'} <Text style={{ color: '#DC2626' }}>*</Text>
              </Text>
              <Dropdown
                options={gotraList.map(g => ({ id: g.gotra_id, name: g.gotra_name }))}
                value={gotraId}
                onSelect={(val: number) => {
                  setGotraId(val);
                  const found = gotraList.find(g => g.gotra_id === val);
                  if (found) setGotra(found.gotra_name);
                  if (profileErrors.gotra) setProfileErrors(p => ({ ...p, gotra: undefined }));
                }}
                placeholder={isBn ? 'গোত্র নির্বাচন করুন' : 'Select gotra'}
                error={profileErrors.gotra}
              />
            </View>
            <Field
              label={isBn ? 'জন্মস্থান' : 'BIRTH PLACE'}
              required
              value={birthPlace}
              onChange={v => {
                setBirthPlace(v);
                if (profileErrors.birthPlace) setProfileErrors(p => ({ ...p, birthPlace: undefined }));
              }}
              placeholder={isBn ? 'আপনার জন্মস্থান লিখুন' : 'Enter birth place (e.g. Kolkata)'}
              error={profileErrors.birthPlace}
              autoCapitalize="words"
            />
            <View style={{ height: 16 }} />
          </View>
          {/* Bottom Actions */}
          <View style={{ backgroundColor: '#FFFBF2', padding: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: '#16A34A', justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 2 }}>
                <Check size={14} color="#16A34A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, color: '#1F2937', fontWeight: '700', marginBottom: 4 }}>{isBn ? 'সংরক্ষণের আগে যাচাই করুন' : 'Review before saving'}</Text>
                <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 20 }}>{isBn ? 'আপনার সর্বশেষ সংরক্ষিত তথ্য ভবিষ্যতের বুকিংয়ের জন্য ব্যবহার করা হবে।' : 'Your latest saved information will be used for future bookings.'}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => {
                navigation.navigate('MainTabs');
              }} style={{ flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#FFF', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, color: '#4B5563', fontWeight: '800' }}>{isBn ? 'বাতিল' : 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={async () => await handleSaveProfile()} style={{ flex: 1 }}>
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 12, overflow: 'hidden' }}>
                  <Svg height="100%" width="100%">
                    <Defs>
                      <SvgLinearGradient id="saveBtnGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#FF9933" />
                        <Stop offset="100%" stopColor="#E07800" />
                      </SvgLinearGradient>
                    </Defs>
                    <Rect x="0" y="0" width="100%" height="100%" fill="url(#saveBtnGrad)" />
                  </Svg>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14 }}>
                  <Save size={20} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 16, color: '#FFF', fontWeight: '800' }}>{isBn ? 'সংরক্ষণ করুন' : 'Save Profile'}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
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
        initialTime={timeOfBirth}
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerBar: {
    backgroundColor: BRAND_ORANGE,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
  genderRow: { flexDirection: 'row', gap: 8 },
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
