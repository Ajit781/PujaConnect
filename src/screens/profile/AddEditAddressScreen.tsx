/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  Switch,
  ScrollView,
  PermissionsAndroid,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Geolocation from 'react-native-geolocation-service';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '../../store';
import { useAlert } from '../../context/AlertContext';
import Dropdown from '../../components/common/Dropdown';
import TopNavBar from '../../components/common/TopNavBar';
import {
  Address,
  addAddress,
  updateAddress,
} from '../../store/slices/addressSlice';
import { showLoader, hideLoader } from '../../store/slices/loaderSlice';
import { useToast } from '../../context/ToastContext';
import { Colors } from '../../constants/Colors';
import {
  useSaveAddressV1Mutation,
  useGetUserDetailsQuery,
  useGetStateDetailsQuery,
} from '../../store/api/pujaApi';
import {
  ArrowLeft,
  MapPin,
  Navigation,
} from 'lucide-react-native';

const ERROR_COLOR = Colors.red;
const BRAND_ORANGE = '#c65316';

export default function AddEditAddressScreen({ navigation, route }: any) {
  const editAddr = route?.params?.address;
  const isEditMode = !!(editAddr && editAddr.id);
  const insets = useSafeAreaInsets();
  const { i18n, t } = useTranslation();
  const isBn = i18n.language === 'bn';
  const { showToast } = useToast();
  const dispatch = useDispatch();
  const { showAlert, showErrorAlert } = useAlert();
  const user = useSelector((state: RootState) => state.auth.user);

  const [saveAddressV1Mutation] = useSaveAddressV1Mutation();
  const { data: userDetailsRaw } = useGetUserDetailsQuery(user?.user_id || 0, {
    skip: !user?.user_id,
  });
  const { data: statesList = [] } = useGetStateDetailsQuery();

  // Address Type
  const [addressTypes, setAddressTypes] = useState<{ id: number; type: string }[]>([]);
  const [type, setType] = useState(editAddr?.type || 'Home');
  const [label, setLabel] = useState(editAddr?.label || '');
  const [contactName, setContactName] = useState(editAddr?.contactName || '');
  const [contactNumber, setContactNumber] = useState(editAddr?.contactNumber || '');
  const [relationType, setRelationType] = useState(editAddr?.relationType || route?.params?.relationType || 'Self');
  const [addressLine1, setAddressLine1] = useState(editAddr?.addressLine1 || '');
  const [streetArea, setStreetArea] = useState(editAddr?.streetArea || '');
  const [landmark, setLandmark] = useState(editAddr?.landmark || '');
  const [city, setCity] = useState(editAddr?.city || '');
  const [stateName, setStateName] = useState(editAddr?.state || '');
  const [stateId, setStateId] = useState<number | null>(null);
  const [pincode, setPincode] = useState(editAddr?.pincode || '');
  const [latitude, setLatitude] = useState(editAddr?.latitude || '');
  const [longitude, setLongitude] = useState(editAddr?.longitude || '');
  const [isDefault, setIsDefaultState] = useState(editAddr?.isDefault || false);
  const [deliveryInstruction, setDeliveryInstruction] = useState(editAddr?.deliveryInstruction || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Delivery Phone option: 'mine' | 'custom'
  const myPhoneNumber =
    user?.mobile ||
    userDetailsRaw?.ctnz_mobile ||
    userDetailsRaw?.ctnz_phone ||
    '';

  const [phoneOption, setPhoneOption] = useState<'mine' | 'custom'>(
    editAddr?.contactNumber && editAddr?.contactNumber !== myPhoneNumber
      ? 'custom'
      : 'mine',
  );

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const { getAllAddressTypes } = await import(
          '../../service/api/addressService'
        );
        const data = await getAllAddressTypes();
        setAddressTypes(
          data.map(d => ({ id: d.address_type_id, type: d.address_type })),
        );
      } catch (e) {
        console.error('Fetch Address Types failed:', e);
      }
    };
    fetchTypes();
  }, []);

  useEffect(() => {
    if (stateName && statesList.length > 0) {
      const matched = statesList.find(
        s => s.state_name.toLowerCase() === stateName.toLowerCase(),
      );
      if (matched) setStateId(matched.state_id);
    }
  }, [stateName, statesList]);

  const handleUseMyLocation = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: isBn ? 'অবস্থান অনুমতি' : 'Location Permission',
            message: isBn
              ? 'আপনার সঠিক অবস্থান পেতে এই অ্যাপটির অবস্থানের অনুমতি প্রয়োজন'
              : 'This app needs location permission to get your precise address.',
            buttonNeutral: isBn ? 'পরে' : 'Ask Me Later',
            buttonNegative: isBn ? 'বাতিল' : 'Cancel',
            buttonPositive: isBn ? 'ঠিক আছে' : 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          showErrorAlert(
            isBn
              ? 'অবস্থান অনুমতি ছাড়া ঠিকানা পাওয়া সম্ভব নয়'
              : 'Location permission is required to fetch your position.',
          );
          return;
        }
      } catch (err) {
        console.warn(err);
      }
    }
    dispatch(showLoader());
    Geolocation.getCurrentPosition(
      (position: any) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat.toFixed(6));
        setLongitude(lng.toFixed(6));
        dispatch(hideLoader());
        showAlert({
          title: isBn ? 'লোকেশন পাওয়া গেছে' : 'Location Captured',
          message: `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`,
        });
      },
      (error: any) => {
        dispatch(hideLoader());
        console.error('Location Error:', error);
        showErrorAlert(
          isBn
            ? 'আপনার অবস্থান পাওয়া যায়নি। GPS চালু আছে কিনা নিশ্চিত করুন।'
            : 'Could not get your location. Please ensure GPS is enabled.',
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!addressLine1.trim())
      errs.addressLine1 = isBn
        ? 'ফ্ল্যাট/বাড়ি নম্বর আবশ্যক'
        : 'Flat/house number is required';

    if (!city.trim()) errs.city = isBn ? 'শহর আবশ্যক' : 'City is required';

    if (!pincode.trim()) {
      errs.pincode = isBn ? 'পিনকোড আবশ্যক' : 'Pincode is required';
    } else if (!/^\d{6}$/.test(pincode.trim())) {
      errs.pincode = isBn
        ? 'সঠিক ৬ সংখ্যার পিনকোড দিন'
        : 'Enter a valid 6-digit pincode';
    }

    if (phoneOption === 'custom') {
      if (!contactNumber.trim()) {
        errs.contactNumber = isBn
          ? 'ফোন নম্বর আবশ্যক'
          : 'Phone number is required';
      } else if (!/^\d{10}$/.test(contactNumber.trim())) {
        errs.contactNumber = isBn
          ? 'সঠিক ১০ সংখ্যার মোবাইল নম্বর দিন'
          : 'Enter a valid 10-digit mobile number';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      showToast({ message: t('common.connectionRequired'), type: 'error' });
      return;
    }
    if (!validate()) return;

    try {
      dispatch(showLoader());
      const selectedTypeObj = addressTypes.find(at => at.type === type);
      const addressTypeId = selectedTypeObj ? selectedTypeObj.id : 1;

      let finalDeliveryContact = myPhoneNumber;
      if (phoneOption === 'custom') {
        finalDeliveryContact = contactNumber.trim();
      }

      const targetCtznId = route?.params?.targetCtznId || user?.user_id || 0;

      console.log('=== FAMILY MEMBER CITIZEN ID ===', targetCtznId);
      console.log('=== RELATION TYPE ===', relationType);

      const payload: any = {
        in_ctzn_address_id: isEditMode && editAddr?.id ? parseInt(editAddr.id, 10) : 0,
        ctzn_auth_id: targetCtznId,
        ctzn_id: targetCtznId,
        address_type_id: addressTypeId,
        label: label.trim() || type,
        address: addressLine1.trim() || 'N/A',
        street: streetArea.trim() || addressLine1.trim() || city.trim() || 'Main Street',
        landmark: landmark.trim(),
        city: city.trim() || 'N/A',
        state: stateId || 1,
        pincode: pincode.trim() || '700001',
        latitude: latitude.trim() ? parseFloat(latitude.trim()) : 0,
        longitude: longitude.trim() ? parseFloat(longitude.trim()) : 0,
        delivery_contact_no: finalDeliveryContact,
        delivery_instruction: deliveryInstruction.trim(),
        is_default: isDefault ? 1 : 0,
      };

      const result = await saveAddressV1Mutation({
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
                ? 'ঠিকানা সফলভাবে আপডেট করা হয়েছে'
                : 'Address updated successfully'
              : isBn
                ? 'ঠিকানা সফলভাবে যোগ করা হয়েছে'
                : 'Address saved successfully'),
          buttons: [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ],
        });

        const addrData: Address = {
          id:
            result.data?.ctzn_address_id?.toString() ||
            editAddr?.id ||
            Date.now().toString(),
          type,
          label,
          contactName,
          contactNumber: finalDeliveryContact,
          relationType,
          addressLine1,
          streetArea,
          landmark,
          city,
          state: stateName,
          pincode,
          latitude,
          longitude,
          isDefault: payload.is_default === 1,
        };

        if (isEditMode) {
          dispatch(updateAddress(addrData));
        } else {
          dispatch(addAddress(addrData));
        }
      } else {
        showErrorAlert(
          result.message || (isBn ? 'সংরক্ষণ ব্যর্থ হয়েছে' : 'Save failed'),
        );
      }
    } catch (err: any) {
      dispatch(hideLoader());
      console.error('Save Address Error:', err);
      showErrorAlert(
        err?.data?.message ||
        (isBn ? 'ঠিকানা সেভ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।' : 'Failed to save address. Please try again.'),
      );
    }
  };

  const typesList = ['Home', 'Office', 'Other'];

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor="#ef7d16" barStyle="light-content" translucent={true} />
      <TopNavBar showBack={true} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>

            {/* Back Button Link */}
            <TouchableOpacity
              style={styles.backLink}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <ArrowLeft size={18} color="#374151" style={{ marginRight: 6 }} />
              <Text style={styles.backLinkTxt}>
                {isBn ? 'ঠিকানায় ফিরে যান' : 'Back to addresses'}
              </Text>
            </TouchableOpacity>

            {/* Header Title Section */}
            <View style={styles.headerSection}>
              <Text style={styles.categoryBadge}>{isBn ? 'ঠিকানা বই' : 'ADDRESS BOOK'}</Text>
              <Text style={styles.pageTitle}>
                {isEditMode
                  ? isBn
                    ? 'ঠিকানা সম্পাদনা করুন'
                    : 'Edit address'
                  : isBn
                    ? 'নতুন ঠিকানা যোগ করুন'
                    : 'Add a new address'}
              </Text>
              <Text style={styles.pageSub}>
                {isBn
                  ? 'মসৃণ সেবার জন্য সঠিক অবস্থান এবং যোগাযোগের বিবরণ যোগ করুন।'
                  : 'Add accurate location and contact details for smooth service.'}
              </Text>
              <Text style={styles.requiredNote}>
                * {isBn ? 'আবশ্যক ক্ষেত্রসমূহ' : 'Required fields'}
              </Text>

              {relationType === 'Relative' && contactName ? (
                <View style={{ backgroundColor: '#FFF3EB', padding: 12, borderRadius: 8, marginTop: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#FED7AA' }}>
                  <Text style={{ fontSize: 14, color: '#c65316', fontWeight: '500' }}>
                    {isBn ? 'এর জন্য ঠিকানা যোগ করা হচ্ছে: ' : 'Saving address for: '}
                    <Text style={{ fontWeight: '800' }}>{contactName}</Text>
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Main Form Card Container */}
            <View style={styles.formCard}>

              {/* Address Type */}
              <View style={styles.fieldBlock}>
                <Text style={styles.labelTitle}>{isBn ? 'ঠিকানার ধরন' : 'Address type'}</Text>
                <View style={styles.chipRow}>
                  {typesList.map(tName => {
                    const isSelected = type === tName;
                    return (
                      <TouchableOpacity
                        key={tName}
                        style={[styles.chip, isSelected && styles.chipSelected]}
                        onPress={() => setType(tName)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.chipTxt, isSelected && styles.chipTxtSelected]}>
                          {tName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.cardDivider} />

              {/* Address Label */}
              <View style={styles.fieldBlock}>
                <Text style={styles.labelTitle}>
                  {isBn ? 'ঠিকানার লেবেল' : 'Address label'} <Text style={styles.star}>*</Text>
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={isBn ? 'যেমন: আমার বাড়ি বা মা-বাবার বাড়ি' : 'e.g. My home or Parents\' house'}
                  placeholderTextColor="#9CA3AF"
                  value={label}
                  onChangeText={setLabel}
                />
              </View>

              {/* State */}
              <View style={styles.fieldBlock}>
                <Text style={styles.labelTitle}>
                  {isBn ? 'রাজ্য' : 'State'} <Text style={styles.star}>*</Text>
                </Text>
                <Dropdown
                  options={statesList.map(s => ({
                    id: s.state_id,
                    name: s.state_name,
                  }))}
                  value={stateId}
                  onSelect={(val: number) => {
                    setStateId(val);
                    const found = statesList.find(s => s.state_id === val);
                    if (found) setStateName(found.state_name);
                  }}
                  placeholder={isBn ? 'রাজ্য নির্বাচন করুন' : 'Select state'}
                />
              </View>

              {/* City */}
              <View style={styles.fieldBlock}>
                <Text style={styles.labelTitle}>
                  {isBn ? 'শহর' : 'City'} <Text style={styles.star}>*</Text>
                </Text>
                <TextInput
                  style={[styles.textInput, errors.city ? styles.inputErr : null]}
                  placeholder={isBn ? 'শহর লিখুন' : 'Enter city'}
                  placeholderTextColor="#9CA3AF"
                  value={city}
                  onChangeText={txt => {
                    setCity(txt.replace(/[^a-zA-Z\s.-]/g, ''));
                    if (errors.city) setErrors(prev => ({ ...prev, city: '' }));
                  }}
                />
                {errors.city ? <Text style={styles.errTxt}>⚠ {errors.city}</Text> : null}
              </View>

              {/* Pincode */}
              <View style={styles.fieldBlock}>
                <Text style={styles.labelTitle}>
                  {isBn ? 'পিনকোড' : 'Pincode'} <Text style={styles.star}>*</Text>
                </Text>
                <TextInput
                  style={[styles.textInput, errors.pincode ? styles.inputErr : null]}
                  placeholder="700001"
                  placeholderTextColor="#9CA3AF"
                  value={pincode}
                  keyboardType="number-pad"
                  maxLength={6}
                  onChangeText={txt => {
                    setPincode(txt.replace(/[^0-9]/g, ''));
                    if (errors.pincode) setErrors(prev => ({ ...prev, pincode: '' }));
                  }}
                />
                {errors.pincode ? <Text style={styles.errTxt}>⚠ {errors.pincode}</Text> : null}
              </View>

              {/* Flat, house or building */}
              <View style={styles.fieldBlock}>
                <Text style={styles.labelTitle}>
                  {isBn ? 'ফ্ল্যাট, বাড়ি বা বিল্ডিং' : 'Flat, house or building'} <Text style={styles.star}>*</Text>
                </Text>
                <TextInput
                  style={[styles.textInputMultiline, errors.addressLine1 ? styles.inputErr : null]}
                  placeholder={isBn ? 'ফ্ল্যাট / বাড়ি নম্বর এবং বিল্ডিং নাম' : 'Flat / house number and building name'}
                  placeholderTextColor="#9CA3AF"
                  value={addressLine1}
                  multiline={true}
                  numberOfLines={3}
                  onChangeText={txt => {
                    setAddressLine1(txt.replace(/[^a-zA-Z0-9\s,.#\-/]/g, ''));
                    if (errors.addressLine1) setErrors(prev => ({ ...prev, addressLine1: '' }));
                  }}
                />
                {errors.addressLine1 ? <Text style={styles.errTxt}>⚠ {errors.addressLine1}</Text> : null}
              </View>

              {/* Street / area */}
              <View style={styles.fieldBlock}>
                <Text style={styles.labelTitle}>{isBn ? 'রাস্তা / এলাকা' : 'Street / area'}</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={isBn ? 'রাস্তা, লোকালিটি বা এলাকা' : 'Street, locality or area'}
                  placeholderTextColor="#9CA3AF"
                  value={streetArea}
                  onChangeText={txt => setStreetArea(txt.replace(/[^a-zA-Z0-9\s,.#\-/]/g, ''))}
                />
              </View>

              {/* Landmark */}
              <View style={styles.fieldBlock}>
                <Text style={styles.labelTitle}>{isBn ? 'ল্যান্ডমার্ক' : 'Landmark'}</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={isBn ? 'কাছাকাছি ল্যান্ডমার্ক' : 'Nearby landmark'}
                  placeholderTextColor="#9CA3AF"
                  value={landmark}
                  onChangeText={txt => setLandmark(txt.replace(/[^a-zA-Z0-9\s,.#\-/]/g, ''))}
                />
              </View>

              {/* Location Coordinates Box */}
              <View style={styles.locationBox}>
                <View style={styles.locationHeaderRow}>
                  <View style={styles.locIconWrap}>
                    <MapPin size={20} color={BRAND_ORANGE} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.locTitle}>{isBn ? 'অবস্থান স্থানাঙ্ক' : 'Location coordinates'}</Text>
                    <Text style={styles.locSub}>
                      {isBn
                        ? 'ঐচ্ছিক। পরিষেবা দল যাতে সহজে পৌঁছাতে পারে তার জন্য আপনার স্থানাঙ্ক ক্যাপচার করুন।'
                        : 'Optional. Capture your current coordinates to help the service team find the location.'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.captureBtn}
                  onPress={handleUseMyLocation}
                  activeOpacity={0.8}
                >
                  <Navigation size={16} color={BRAND_ORANGE} style={{ marginRight: 6 }} />
                  <Text style={styles.captureBtnTxt}>
                    {isBn ? 'অবস্থান ক্যাপচার করুন' : 'Capture location'}
                  </Text>
                </TouchableOpacity>

                {latitude && longitude ? (
                  <Text style={styles.coordsCapturedTxt}>
                    ✓ Lat: {latitude}, Lng: {longitude}
                  </Text>
                ) : null}
              </View>

              {/* Delivery instructions */}
              <View style={styles.fieldBlock}>
                <View style={styles.labelRow}>
                  <Text style={styles.labelTitle}>{isBn ? 'ডেলিভারি নির্দেশাবলী' : 'Delivery instructions'}</Text>
                  <Text style={styles.optionalTag}>{isBn ? 'ঐচ্ছিক' : 'Optional'}</Text>
                </View>
                <TextInput
                  style={styles.textInputMultiline}
                  placeholder={isBn ? 'গেটের বিবরণ, দিকনির্দেশ বা কখন কল করবেন' : 'Gate details, directions, or when to call'}
                  placeholderTextColor="#9CA3AF"
                  value={deliveryInstruction}
                  multiline={true}
                  numberOfLines={4}
                  maxLength={300}
                  onChangeText={setDeliveryInstruction}
                />
                <Text style={styles.charCounter}>
                  {deliveryInstruction.length} / 300 {isBn ? 'অক্ষর' : 'characters'}
                </Text>
              </View>

              {/* Delivery phone */}
              <View style={styles.fieldBlock}>
                <Text style={styles.labelTitle}>
                  {isBn ? 'ডেলিভারি ফোন' : 'Delivery phone'} <Text style={styles.star}>*</Text>
                </Text>

                {/* Option 1: My account number */}
                <TouchableOpacity
                  style={[styles.phoneCard, phoneOption === 'mine' && styles.phoneCardSelected]}
                  onPress={() => setPhoneOption('mine')}
                  activeOpacity={0.85}
                >
                  <View style={[styles.radioOuter, phoneOption === 'mine' && styles.radioOuterSelected]}>
                    {phoneOption === 'mine' && <View style={styles.radioInner} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.phoneCardTitle}>
                      {isBn ? 'আমার অ্যাকাউন্ট নম্বর' : 'My account number'}
                    </Text>
                    <Text style={styles.phoneCardSub}>
                      {myPhoneNumber || 'N/A'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Option 2: Use another number */}
                <TouchableOpacity
                  style={[styles.phoneCard, phoneOption === 'custom' && styles.phoneCardSelected]}
                  onPress={() => setPhoneOption('custom')}
                  activeOpacity={0.85}
                >
                  <View style={[styles.radioOuter, phoneOption === 'custom' && styles.radioOuterSelected]}>
                    {phoneOption === 'custom' && <View style={styles.radioInner} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.phoneCardTitle}>
                      {isBn ? 'অন্য নম্বর ব্যবহার করুন' : 'Use another number'}
                    </Text>
                    <Text style={styles.phoneCardSub}>
                      {isBn ? 'অন্য একটি ডেলিভারি পরিচিতি লিখুন' : 'Enter a different delivery contact'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {phoneOption === 'custom' && (
                  <View style={{ marginTop: 10 }}>
                    <TextInput
                      style={[styles.textInput, errors.contactNumber ? styles.inputErr : null]}
                      placeholder={isBn ? '১০ সংখ্যার মোবাইল নম্বর লিখুন' : 'Enter 10-digit mobile number'}
                      placeholderTextColor="#9CA3AF"
                      value={contactNumber}
                      keyboardType="phone-pad"
                      maxLength={10}
                      onChangeText={txt => {
                        setContactNumber(txt.replace(/[^0-9]/g, ''));
                        if (errors.contactNumber) setErrors(prev => ({ ...prev, contactNumber: '' }));
                      }}
                    />
                    {errors.contactNumber ? <Text style={styles.errTxt}>⚠ {errors.contactNumber}</Text> : null}
                  </View>
                )}
              </View>

              {/* Use as default address */}
              <View style={styles.defaultSection}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.defaultTitle}>
                    {isBn ? 'ডিফল্ট ঠিকানা হিসেবে ব্যবহার করুন' : 'Use as default address'}
                  </Text>
                  <Text style={styles.defaultSub}>
                    {isBn
                      ? 'আপনার প্রথম ঠিকানাটি ডিফল্ট হিসেবে সংরক্ষিত হবে।'
                      : 'Your first address will be saved as the default.'}
                  </Text>
                </View>
                <Switch
                  value={isDefault}
                  onValueChange={setIsDefaultState}
                  trackColor={{
                    false: '#D1D5DB',
                    true: BRAND_ORANGE,
                  }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Bottom Actions Row */}
              <View style={styles.bottomBtnRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => navigation.goBack()}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelBtnTxt}>{isBn ? 'বাতিল' : 'Cancel'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSave}
                  activeOpacity={0.85}
                >
                  <Text style={styles.saveBtnTxt}>
                    {isEditMode
                      ? isBn
                        ? 'ঠিকানা আপডেট করুন'
                        : 'Update address'
                      : isBn
                        ? 'ঠিকানা সংরক্ষণ করুন'
                        : 'Save address'}
                  </Text>
                </TouchableOpacity>
              </View>

            </View>

            <View style={{ height: 40 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAFAFA' },
  container: { flex: 1 },
  content: { padding: 16 },

  // Back Link
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    marginBottom: 12,
  },
  backLinkTxt: { fontSize: 14, fontWeight: '700', color: '#374151' },

  // Header Section
  headerSection: { marginBottom: 20 },
  categoryBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: BRAND_ORANGE,
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  pageTitle: { fontSize: 26, fontWeight: '400', color: '#1F2937', marginBottom: 6 },
  pageSub: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
  requiredNote: { fontSize: 12, fontWeight: '700', color: BRAND_ORANGE, marginTop: 8 },

  // Main Form Card
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },

  cardDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 14 },

  fieldBlock: { marginBottom: 18 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  labelTitle: { fontSize: 14, fontWeight: '800', color: '#1F2937', marginBottom: 6 },
  star: { color: BRAND_ORANGE, fontWeight: '800' },
  optionalTag: { fontSize: 12, color: '#6B7280', fontWeight: '500' },

  // Type Chips
  chipRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  chip: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  chipSelected: {
    borderColor: BRAND_ORANGE,
    backgroundColor: '#FFF8F1',
  },
  chipTxt: { fontSize: 14, fontWeight: '700', color: '#374151' },
  chipTxtSelected: { color: BRAND_ORANGE, fontWeight: '800' },

  // Inputs
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  textInputMultiline: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputErr: { borderColor: Colors.red, backgroundColor: '#FEF2F2' },
  errTxt: { fontSize: 11, color: Colors.red, marginTop: 4, fontWeight: '500' },
  charCounter: { fontSize: 11, color: '#9CA3AF', textAlign: 'right', marginTop: 4 },

  // Location Box
  locationBox: {
    backgroundColor: '#FFF8F1',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  locationHeaderRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  locIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locTitle: { fontSize: 14, fontWeight: '800', color: '#1F2937', marginBottom: 4 },
  locSub: { fontSize: 12, color: '#6B7280', lineHeight: 17 },
  captureBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnTxt: { fontSize: 14, fontWeight: '800', color: BRAND_ORANGE },
  coordsCapturedTxt: { fontSize: 12, color: '#059669', fontWeight: '700', marginTop: 8, textAlign: 'center' },

  // Phone Selector Cards
  phoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  phoneCardSelected: {
    borderColor: BRAND_ORANGE,
    backgroundColor: '#FFF8F1',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioOuterSelected: {
    borderColor: BRAND_ORANGE,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BRAND_ORANGE,
  },
  phoneCardTitle: { fontSize: 14, fontWeight: '800', color: '#1F2937', marginBottom: 2 },
  phoneCardSub: { fontSize: 13, color: '#6B7280' },

  // Default Address Switch
  defaultSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginVertical: 14,
  },
  defaultTitle: { fontSize: 14, fontWeight: '800', color: '#1F2937', marginBottom: 2 },
  defaultSub: { fontSize: 12, color: '#6B7280' },

  // Bottom Buttons
  bottomBtnRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  cancelBtnTxt: { fontSize: 15, fontWeight: '700', color: '#374151' },
  saveBtn: {
    flex: 1.2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: BRAND_ORANGE,
    alignItems: 'center',
  },
  saveBtnTxt: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
});
