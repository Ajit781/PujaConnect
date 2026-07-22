/* eslint-disable react-native/no-inline-styles */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Platform,
  Modal,
  KeyboardAvoidingView,
  Switch,
  ActivityIndicator,
  FlatList,
  ScrollView,
  PermissionsAndroid,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Geolocation from 'react-native-geolocation-service';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '../../store';
import { useAlert } from '../../context/AlertContext';
import Dropdown from '../../components/common/Dropdown';
import {
  Address,
  addAddress,
  updateAddress,
  deleteAddress,
} from '../../store/slices/addressSlice';
import NoDataFound from '../../components/common/NoDataFound';
import { showLoader, hideLoader } from '../../store/slices/loaderSlice';
import { useToast } from '../../context/ToastContext';
import { Colors } from '../../constants/Colors';
import {
  useSaveAddressV1Mutation,
  useGetAddressesQuery,
  useSaveDefaultAddressMutation,
  useDeleteAddressMutation,
  useGetUserDetailsQuery,
  useGetStateDetailsQuery,
  useGetAddressesCountQuery,
} from '../../store/api/pujaApi';

const ERROR_COLOR = Colors.red;
const BRAND_ORANGE = Colors.primary;

const SOCIAL_RELATIONS = [
  { id: 18, name: 'Self' },
  { id: 1, name: 'Father' },
  { id: 2, name: 'Mother' },
  { id: 3, name: 'Brother' },
  { id: 4, name: 'Sister' },
  { id: 5, name: 'Son' },
  { id: 6, name: 'Daughter' },
  { id: 9, name: 'Grandfather' },
  { id: 11, name: 'Cousin' },
];

// ─── Field Component ──────────────────────────────────────────────────────────
const Field = ({
  lab,
  req,
  val,
  setVal,
  place,
  err,
  kbd,
  maxLength,
  setErrors,
}: {
  lab: string;
  req?: boolean;
  val: string;
  setVal: (v: string) => void;
  place: string;
  err?: string;
  kbd?: string;
  maxLength?: number;
  setErrors?: (
    fn: (prev: Record<string, string>) => Record<string, string>,
  ) => void;
}) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>
      {lab}
      {req ? <Text style={{ color: ERROR_COLOR }}> *</Text> : null}
    </Text>
    <TextInput
      style={[styles.input, err ? styles.inputErr : null]}
      placeholder={place}
      placeholderTextColor={Colors.placeholder}
      value={val}
      maxLength={maxLength}
      onChangeText={text => {
        setVal(text);
        if (setErrors) setErrors(prev => ({ ...prev, [lab]: '' }));
      }}
      keyboardType={(kbd as any) || 'default'}
    />
    {err ? <Text style={styles.errTxt}>⚠ {err}</Text> : null}
  </View>
);

// ─── Address Type Badge ───────────────────────────────────────────────────────
const TypeBadge = ({ type }: { type: string }) => {
  const config: Record<string, { icon: string; bg: string; color: string }> = {
    Home: { icon: '🏠', bg: '#FFF3E0', color: '#E65100' },
    Work: { icon: '💼', bg: '#E3F2FD', color: '#1565C0' },
    Temple: { icon: '🛕', bg: '#F3E5F5', color: '#6A1B9A' },
    Other: { icon: '📍', bg: '#F5F5F5', color: '#424242' },
  };
  const c = config[type] || config.Other;
  return (
    <View style={[styles.typeBadge, { backgroundColor: c.bg }]}>
      <Text style={{ fontSize: 11 }}>{c.icon}</Text>
      <Text style={[styles.typeBadgeTxt, { color: c.color }]}>{type}</Text>
    </View>
  );
};

// ─── Address Card (Web-style) ─────────────────────────────────────────────────
const AddressCard = React.memo(
  ({ addr, isBn, onEdit, onSetDefault, onDelete, isSelectMode, onSelect }: any) => (
    <TouchableOpacity
      activeOpacity={isSelectMode ? 0.8 : 1}
      onPress={() => {
        if (isSelectMode && onSelect) {
          onSelect(addr.id);
        }
      }}
      style={[styles.addrCard, addr.isDefault && styles.addrCardDef]}>
      {/* Top row: type badge + edit/delete icons */}
      <View style={styles.cardTopRow}>
        <TypeBadge type={addr.type} />
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => onEdit(addr)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.iconBtnTxt}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => onDelete(addr.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.iconBtnTxt}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Address text */}
      <Text style={styles.cardAddrMain} numberOfLines={2}>
        {addr.addressLine1}
      </Text>
      <Text style={styles.cardAddrSub} numberOfLines={2}>
        {[addr.streetArea, addr.landmark, addr.city].filter(Boolean).join(', ')}
      </Text>
      <Text style={styles.cardAddrSub}>
        {[addr.state, addr.pincode ? `– ${addr.pincode}` : '']
          .filter(Boolean)
          .join(' ')}
      </Text>

      {/* Phone */}
      {addr.contactNumber ? (
        <View style={styles.cardPhoneRow}>
          <Text style={styles.cardPhoneIcon}>📞</Text>
          <Text style={styles.cardPhone}>{addr.contactNumber}</Text>
        </View>
      ) : null}

      {/* Set as Default button */}
      {!addr.isDefault && (
        <TouchableOpacity
          style={styles.setDefaultBtn}
          onPress={() => onSetDefault(addr.id)}>
          <Text style={styles.setDefaultBtnTxt}>
            ☆ {isBn ? 'ডিফল্ট সেট করুন' : 'Set as Default'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Default badge */}
      {addr.isDefault && (
        <View style={styles.defaultBadgeRow}>
          <Text style={styles.defaultBadgeTxt}>★ DEFAULT</Text>
        </View>
      )}
    </TouchableOpacity>
  ),
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AddressScreen({ navigation, route }: any) {
  const isSelectMode = route?.params?.mode === 'select';
  const onSelectCallback = route?.params?.onSelect;
  const insets = useSafeAreaInsets();
  const { i18n, t } = useTranslation();
  const isBn = i18n.language === 'bn';
  const { showToast } = useToast();
  const dispatch = useDispatch();
  const { showAlert, showErrorAlert } = useAlert();
  const user = useSelector((state: RootState) => state.auth.user);
  const addresses = useSelector((state: RootState) => state.address.addresses);

  // ─── Active tab: 'my' | 'relatives' ───────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'my' | 'relatives'>('my');

  const [saveAddressV1Mutation] = useSaveAddressV1Mutation();
  const [saveDefaultAddressMutation] = useSaveDefaultAddressMutation();
  const [deleteAddressMutation] = useDeleteAddressMutation();
  const [pageNo] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const pageSize = 10;

  const {
    data: serverAddresses,
    refetch: refetchAddresses,
    isFetching: isFetchingAddresses,
  } = useGetAddressesQuery(
    { userId: user?.user_id || 0, pageNo, pageSize },
    { skip: !user?.user_id },
  );

  // Address count from new API
  const { data: addressCount } = useGetAddressesCountQuery(
    { ctznId: user?.user_id || 0 },
    { skip: !user?.user_id },
  );

  const [addressTypes, setAddressTypes] = useState<
    { id: number; type: string }[]
  >([]);
  const [, setIsLoadingTypes] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState('Home');
  const [label, setLabel] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [relationType, setRelationType] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [streetArea, setStreetArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isDefault, setIsDefaultState] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [addressCtznId, setAddressCtznId] = useState<number | null>(null);
  const [deliveryInstruction, setDeliveryInstruction] = useState('');

  // Selected relative state for the new horizontal list
  const [selectedRelativeId, setSelectedRelativeId] = useState<number | null>(null);

  // Relative selection modals
  const [showRelativeSelectModal, setShowRelativeSelectModal] = useState(false);

  const { data: userDetailsRaw } = useGetUserDetailsQuery(user?.user_id || 0, {
    skip: !user?.user_id,
  });

  // States dropdown
  const [stateId, setStateId] = useState<number | null>(null);
  const { data: statesList = [] } = useGetStateDetailsQuery();

  // Phone option for relative address
  const [phoneOption, setPhoneOption] = useState<'relative' | 'mine'>('relative');

  useEffect(() => {
    if (stateName && statesList.length > 0) {
      const matched = statesList.find(
        s => s.state_name.toLowerCase() === stateName.toLowerCase(),
      );
      if (matched) setStateId(matched.state_id);
    }
  }, [stateName, statesList]);

  const clearForm = () => {
    setType('Home');
    setLabel('');
    setContactName('');
    setContactNumber('');
    setRelationType('');
    setAddressLine1('');
    setStreetArea('');
    setLandmark('');
    setCity('');
    setStateName('');
    setStateId(null);
    setPincode('');
    setLatitude('');
    setLongitude('');
    setIsDefaultState(false);
    setDeliveryInstruction('');
    setErrors({});
    setEditingId(null);
    setPhoneOption('relative');
    setAddressCtznId(null);
  };

  const openAdd = async () => {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      showToast({ message: t('common.connectionRequired'), type: 'error' });
      return;
    }
    if (!userDetailsRaw?.ctnz_full_name) {
      showAlert({
        title: isBn ? 'অসম্পূর্ণ প্রোফাইল' : 'Profile Incomplete',
        message: isBn
          ? 'নতুন ঠিকানা যোগ করতে প্রোফাইল আপগ্রেড/আপডেট করুন'
          : 'Please complete your profile to add an address',
        buttons: [
          {
            text: isBn ? 'ঠিক আছে' : 'OK',
            onPress: () => navigation.navigate('EditProfile'),
          },
        ],
      });
      return;
    }
    if (activeTab === 'relatives') {
      // Directly open relative selection
      setShowRelativeSelectModal(true);
    } else {
      // Directly open form for Self
      clearForm();
      setRelationType('Self');
      setShowModal(true);
    }
  };

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
          title: isBn ? 'লোকেসন পাওয়া গেছে' : 'Location Found',
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

  const onRefresh = useCallback(async () => {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      showToast({ message: t('common.connectionRequired'), type: 'error' });
      return;
    }
    setRefreshing(true);
    try {
      await refetchAddresses();
    } catch (err) {
      console.error('Address refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  }, [refetchAddresses, showToast, t]);

  useEffect(() => {
    const fetchTypes = async () => {
      setIsLoadingTypes(true);
      try {
        const { getAllAddressTypes } = await import(
          '../../service/api/addressService'
        );
        const data = await getAllAddressTypes();
        setAddressTypes(
          data.map(d => ({ id: d.address_type_id, type: d.address_type })),
        );
        if (data.length > 0) setType(data[0].address_type);
      } catch (e) {
        console.error('Fetch Address Types failed:', e);
      } finally {
        setIsLoadingTypes(false);
      }
    };
    fetchTypes();
  }, []);

  // Set default selected relative when data is loaded
  useEffect(() => {
    if (activeTab === 'relatives' && !selectedRelativeId && serverAddresses?.relative_info?.length > 0) {
      setSelectedRelativeId(serverAddresses.relative_info[0].auth_id);
    }
  }, [serverAddresses, activeTab, selectedRelativeId]);

  const displayAddresses = useMemo(() => {
    if (!serverAddresses) return [];

    let allAddresses: any[] = [];

    // Parse Self Addresses
    if (
      serverAddresses.citizen_info &&
      Array.isArray(serverAddresses.citizen_info.address_list)
    ) {
      const citizen = serverAddresses.citizen_info;
      const selfAddrs = citizen.address_list
        .filter((a: any) => a && a.address && typeof a.address === 'string' && a.address.trim().length > 0)
        .map((a: any) => ({
          id: (a.address_id || a.ctzn_address_id || Date.now()).toString(),
          type: a.address_type || a.address_type_name || 'Home',
          label: a.label || '',
          contactName: citizen.full_name || '',
          contactNumber: a.delivery_contact_no || citizen.phone || '',
          relationType: 'Self',
          addressLine1: a.address || '',
          streetArea: a.street || '',
          landmark: a.landmark || '',
          city: a.city || '',
          state: a.state_name || a.state || '',
          pincode: a.pincode || '',
          latitude: a.latitude?.toString() || '',
          longitude: a.longitude?.toString() || '',
          isDefault:
            a.is_default === 1 || a.is_default === true || a.is_default === '1',
          ctzn_id: citizen.auth_id,
          deliveryInstruction: a.delivery_instruction || '',
        }));
      allAddresses = [...allAddresses, ...selfAddrs];
    }

    // Parse Relative Addresses
    if (Array.isArray(serverAddresses.relative_info)) {
      serverAddresses.relative_info.forEach((rel: any) => {
        if (Array.isArray(rel.address_list)) {
          const relAddrs = rel.address_list
            .filter((a: any) => a && a.address && typeof a.address === 'string' && a.address.trim().length > 0)
            .map((a: any) => ({
              id: (a.address_id || a.ctzn_address_id || Date.now()).toString(),
              type: a.address_type || a.address_type_name || 'Home',
              label: a.label || '',
              contactName: rel.full_name || '',
              contactNumber: a.delivery_contact_no || rel.phone || '',
              relationType: 'Relative',
              addressLine1: a.address || '',
              streetArea: a.street || '',
              landmark: a.landmark || '',
              city: a.city || '',
              state: a.state_name || a.state || '',
              pincode: a.pincode || '',
              latitude: a.latitude?.toString() || '',
              longitude: a.longitude?.toString() || '',
              isDefault:
                a.is_default === 1 ||
                a.is_default === true ||
                a.is_default === '1',
              ctzn_id: rel.auth_id,
              deliveryInstruction: a.delivery_instruction || '',
            }));
          allAddresses = [...allAddresses, ...relAddrs];
        }
      });
    }

    return allAddresses;
  }, [serverAddresses]);

  // Filter by tab and selected relative
  const filteredAddresses = useMemo(() => {
    if (!userDetailsRaw?.ctnz_full_name) {
      return [];
    }
    if (activeTab === 'relatives') {
      return displayAddresses.filter(
        a => a.relationType !== 'Self' && a.ctzn_id === selectedRelativeId
      );
    }
    return displayAddresses.filter(
      a => !a.relationType || a.relationType === 'Self',
    );
  }, [displayAddresses, activeTab, selectedRelativeId]);

  const openEdit = useCallback(
    async (addr: any) => {
      const state = await NetInfo.fetch();
      if (!state.isConnected) {
        showToast({ message: t('common.connectionRequired'), type: 'error' });
        return;
      }
      setType(addr.type);
      setLabel(addr.label);
      setContactName(addr.contactName);
      setContactNumber(addr.contactNumber);
      setRelationType(addr.relationType);
      setAddressLine1(addr.addressLine1);
      setStreetArea(addr.streetArea);
      setLandmark(addr.landmark);
      setCity(addr.city);
      setStateName(addr.state);
      setPincode(addr.pincode);
      setLatitude(addr.latitude || '');
      setLongitude(addr.longitude || '');
      setIsDefaultState(addr.isDefault || false);
      setDeliveryInstruction(addr.deliveryInstruction || '');
      setEditingId(addr.id);
      setAddressCtznId(addr.ctzn_id || null);

      const loginMobile =
        user?.mobile ||
        userDetailsRaw?.ctnz_mobile ||
        userDetailsRaw?.ctnz_phone ||
        '';
      if (
        addr.relationType !== 'Self' &&
        loginMobile &&
        addr.contactNumber === loginMobile
      ) {
        setPhoneOption('mine');
      } else {
        setPhoneOption('relative');
      }

      setErrors({});
      setShowModal(true);
    },
    [showToast, t, user, userDetailsRaw],
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (relationType !== 'Self' && phoneOption === 'relative') {
      if (!contactNumber.trim() || !/^\d{10}$/.test(contactNumber))
        e.contactNumber = isBn
          ? 'সঠিক ১০-সংখ্যার নম্বর লিখুন'
          : 'Valid 10-digit number required';
    }
    if (!addressLine1.trim())
      e.addressLine1 = isBn ? 'ঠিকানা আবশ্যক' : 'Address line required';
    if (!city.trim()) e.city = isBn ? 'শহর আবশ্যক' : 'City required';
    if (!pincode.trim() || !/^\d{6}$/.test(pincode))
      e.pincode = isBn ? 'সঠিক পিনকোড লিখুন' : 'Valid 6-digit pincode required';
    if (latitude && isNaN(Number(latitude)))
      e.latitude = isBn ? 'সঠিক অক্ষাংশ দিন' : 'Enter valid latitude';
    if (longitude && isNaN(Number(longitude)))
      e.longitude = isBn ? 'সঠিক দ্রাঘিমা দিন' : 'Enter valid longitude';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      showToast({ message: t('common.connectionRequired'), type: 'error' });
      return;
    }

    try {
      dispatch(showLoader());
      const relId =
        SOCIAL_RELATIONS.find(r => r.name === relationType)?.id || 0;
      const typeId = addressTypes.find(at => at.type === type)?.id || 1;

      const payload = {
        in_ctzn_address_id: (editingId && editingId.length < 10) ? parseInt(editingId, 10) : 0,
        ctzn_auth_id: addressCtznId || user?.user_id || 0,
        address_type_id: typeId,
        label,
        address: addressLine1,
        street: streetArea,
        landmark,
        city,
        state: stateId || 1,
        pincode,
        is_default: isDefault ? 1 : addresses.length === 0 ? 1 : 0,
        latitude: latitude ? parseFloat(latitude) : 0,
        longitude: longitude ? parseFloat(longitude) : 0,
        delivery_contact_no:
          relationType === 'Self'
            ? user?.mobile ||
            userDetailsRaw?.ctnz_mobile ||
            userDetailsRaw?.ctnz_phone ||
            userDetailsRaw?.mobile_no ||
            ''
            : phoneOption === 'mine'
              ? user?.mobile ||
              userDetailsRaw?.ctnz_mobile ||
              userDetailsRaw?.ctnz_phone ||
              userDetailsRaw?.mobile_no ||
              ''
              : contactNumber,
        delivery_instruction: deliveryInstruction,
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
            (isBn ? 'ঠিকানা সংরক্ষিত হয়েছে' : 'Address saved successfully'),
        });

        const addrData: Address = {
          id:
            result.data?.ctzn_address_id?.toString() ||
            editingId ||
            Date.now().toString(),
          type,
          label,
          contactName,
          contactNumber,
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

        if (editingId) {
          dispatch(updateAddress(addrData));
        } else {
          dispatch(addAddress(addrData));
        }

        setShowModal(false);
        clearForm();
        refetchAddresses();
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
        (isBn ? 'কিছু ভুল হয়েছে' : 'Something went wrong'),
      );
    }
  };

  const handleSetDefault = useCallback(
    async (addrId: string) => {
      const state = await NetInfo.fetch();
      if (!state.isConnected) {
        showToast({ message: t('common.connectionRequired'), type: 'error' });
        return;
      }
      try {
        dispatch(showLoader());
        const result = await saveDefaultAddressMutation({
          userId: user?.user_id || 0,
          addressId: parseInt(addrId, 10),
        }).unwrap();

        dispatch(hideLoader());
        if (result.status === 0) {
          showAlert({
            title: isBn ? 'সফল' : 'Success',
            message:
              result.message ||
              (isBn
                ? 'ডিফল্ট ঠিকানা সেট করা হয়েছে'
                : 'Default address set successfully'),
          });
          refetchAddresses();
        } else {
          showErrorAlert(
            result.message ||
            (isBn ? 'ব্যর্থ হয়েছে' : 'Failed to set default'),
          );
        }
      } catch (err: any) {
        dispatch(hideLoader());
        showErrorAlert(
          err?.data?.message ||
          (isBn ? 'কিছু ভুল হয়েছে' : 'Something went wrong'),
        );
      }
    },
    [
      dispatch,
      user,
      isBn,
      saveDefaultAddressMutation,
      showAlert,
      showErrorAlert,
      refetchAddresses,
      showToast,
      t,
    ],
  );

  const handleDeleteAddr = useCallback(
    (id: string) => {
      showAlert({
        title: isBn ? 'মুছে ফেলুন' : 'Delete Address',
        message: isBn
          ? 'এই ঠিকানাটি মুছে ফেলতে চান?'
          : 'Are you sure you want to delete this address?',
        buttons: [
          { text: isBn ? 'বাতিল' : 'Cancel', style: 'cancel' },
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
              dispatch(showLoader());
              try {
                const payload = {
                  enc_data: JSON.stringify({
                    ctzn_address_id: parseInt(id, 10),
                    ctzn_id: user?.user_id || 0,
                  }),
                };
                const result = await deleteAddressMutation({
                  data: JSON.stringify(payload),
                }).unwrap();

                dispatch(hideLoader());
                if (result.status === 0) {
                  showAlert({
                    title: isBn ? 'সফল' : 'Success',
                    message:
                      result.message ||
                      (isBn
                        ? 'ঠিকানাটি মুছে ফেলা হয়েছে'
                        : 'Address deleted successfully'),
                    buttons: [{ text: isBn ? 'ঠিক আছে' : 'OK' }],
                  });
                  dispatch(deleteAddress(id));
                  refetchAddresses();
                } else {
                  showErrorAlert(
                    result.message ||
                    (isBn
                      ? 'ঠিকানা মুছতে ব্যর্থ হয়েছে'
                      : 'Failed to delete address'),
                  );
                }
              } catch (err: any) {
                dispatch(hideLoader());
                showErrorAlert(
                  err?.data?.message ||
                  (isBn ? 'কিছু ভুল হয়েছে' : 'Something went wrong'),
                );
              }
            },
            style: 'destructive',
          },
        ],
      });
    },
    [
      dispatch,
      isBn,
      showAlert,
      showErrorAlert,
      deleteAddressMutation,
      user,
      refetchAddresses,
      showToast,
      t,
    ],
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  const renderHeader = () => (
    <View style={styles.listHeader}>
      {/* Tab pills */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'my' && styles.tabPillActive]}
          onPress={() => setActiveTab('my')}>
          <Text style={styles.tabPillIcon}>👤</Text>
          <Text
            style={[
              styles.tabPillTxt,
              activeTab === 'my' && styles.tabPillTxtActive,
            ]}>
            {isBn ? 'আমার ঠিকানা' : 'My Addresses'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabPill,
            activeTab === 'relatives' && styles.tabPillActive,
          ]}
          onPress={() => setActiveTab('relatives')}>
          <Text style={styles.tabPillIcon}>👥</Text>
          <Text
            style={[
              styles.tabPillTxt,
              activeTab === 'relatives' && styles.tabPillTxtActive,
            ]}>
            {isBn ? 'আত্মীয়' : 'Relatives'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conditional Content based on Tab */}
      {activeTab === 'relatives' ? (
        <View style={styles.relativesSection}>
          <View style={styles.relativesSectionHeader}>
            <Text style={styles.secHead}>{isBn ? 'আত্মীয় নির্বাচন করুন' : 'SELECT RELATIVE'}</Text>
            <TouchableOpacity style={styles.addBtnSmall} onPress={openAdd}>
              <Text style={styles.addBtnSmallTxt}>+ {isBn ? 'যোগ করুন' : 'Add Address'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relativesScroll}>
            {serverAddresses?.relative_info?.map((rel: any) => {
              const isSelected = selectedRelativeId === rel.auth_id;
              return (
                <TouchableOpacity
                  key={rel.auth_id}
                  style={[styles.relativeHCard, isSelected && styles.relativeHCardActive]}
                  onPress={() => setSelectedRelativeId(rel.auth_id)}
                >
                  <View style={[styles.relAvatarH, isSelected && styles.relAvatarHActive]}>
                    <Text style={[styles.relAvatarTxtH, isSelected && styles.relAvatarTxtHActive]}>
                      {rel.full_name ? rel.full_name.charAt(0).toUpperCase() : 'R'}
                    </Text>
                  </View>
                  <Text style={[styles.relNameH, isSelected && styles.relNameHActive]} numberOfLines={1}>
                    {rel.full_name}
                  </Text>
                  <Text style={[styles.relPhoneH, isSelected && styles.relPhoneHActive]}>
                    {rel.phone}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.listMeta}>
            <Text style={styles.addressCount}>
              {filteredAddresses.length} {isBn ? 'ঠিকানা' : 'addresses'}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.listMeta}>
          <Text style={styles.addressCount}>
            {filteredAddresses.length} {isBn ? 'ঠিকানা' : 'addresses'}
          </Text>
          <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
            <Text style={styles.addBtnTxt}>+ {isBn ? 'যোগ করুন' : 'Add Address'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {isFetchingAddresses && pageNo === 1 && (
        <ActivityIndicator
          size="small"
          color={Colors.primary}
          style={{ marginBottom: 12 }}
        />
      )}
    </View>
  );

  const renderFooter = () => (
    <View style={{ height: 40 }} />
  );

  return (
    <View style={styles.root}>
      <StatusBar
        backgroundColor="transparent"
        barStyle="light-content"
        translucent={true}
      />

      {/* Orange gradient header */}
      <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
        {/* Back button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnTxt}>←</Text>
        </TouchableOpacity>

        {/* Decorative circles */}
        <View style={styles.heroDeco1} />
        <View style={styles.heroDeco2} />

        <View style={styles.heroContent}>
          <View style={styles.heroIconWrap}>
            <Text style={{ fontSize: 22 }}>📍</Text>
          </View>
          <View>
            <Text style={styles.heroTitle}>
              {isBn ? 'সংরক্ষিত ঠিকানা' : 'Saved Addresses'}
            </Text>
            <Text style={styles.heroSub}>
              {isBn
                ? 'ডেলিভারি ও পূজা লোকেশন পরিচালনা করুন'
                : 'Manage your delivery & puja locations'}
            </Text>
          </View>
        </View>
      </View>

      {/* List */}
      <FlatList
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        data={filteredAddresses}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <AddressCard
            addr={item}
            isBn={isBn}
            onEdit={openEdit}
            onSetDefault={handleSetDefault}
            onDelete={handleDeleteAddr}
            isSelectMode={isSelectMode}
            onSelect={(id: string) => {
              if (onSelectCallback) {
                onSelectCallback(id);
              }
              navigation.goBack();
            }}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          !isFetchingAddresses ? (
            <NoDataFound
              message={
                !userDetailsRaw?.ctnz_full_name 
                  ? (isBn ? 'নতুন ঠিকানা যোগ করতে প্রোফাইল আপডেট করুন' : 'Please complete your profile to view and manage addresses') 
                  : (isBn ? 'কোনো ঠিকানা সংরক্ষিত নেই' : 'No addresses saved yet')
              }
              containerHeight={300} />
          ) : null
        }
        showsVerticalScrollIndicator={false}
        initialNumToRender={5}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={Platform.OS === 'android'}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[BRAND_ORANGE]}
            tintColor={BRAND_ORANGE}
          />
        }
      />


      {/* ─── Relative Selection Modal ──────────────────────────────────────── */}

      <Modal
        visible={showRelativeSelectModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRelativeSelectModal(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.sheet, { height: '60%' }]}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetHeadTitle}>
                {isBn ? 'আত্মীয় নির্বাচন করুন' : 'Select Relative'}
              </Text>
              <TouchableOpacity
                style={styles.sheetClose}
                onPress={() => setShowRelativeSelectModal(false)}>
                <Text style={styles.sheetCloseTxt}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 20 }}>
              {userDetailsRaw?.relative_details &&
                userDetailsRaw.relative_details.length > 0 ? (
                userDetailsRaw.relative_details.map((rel: any) => (
                  <TouchableOpacity
                    key={rel.relative_id || rel.relative_auth_id}
                    style={styles.relativeRow}
                    onPress={() => {
                      clearForm();
                      setContactName(rel.relative_full_name || '');
                      setRelationType(
                        rel.relation_type_name || 'Relative',
                      );
                      setContactNumber(
                        rel.relative_contact_no ||
                        rel.relative_mobile ||
                        rel.relative_phone ||
                        '',
                      );
                      setAddressCtznId(
                        Number(rel.relative_auth_id || rel.relative_id),
                      );
                      setShowRelativeSelectModal(false);
                      setShowModal(true);
                    }}>
                    <View style={styles.relAvatar}>
                      <Text style={styles.relAvatarTxt}>
                        {rel.relative_full_name
                          ? rel.relative_full_name.charAt(0).toUpperCase()
                          : 'R'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.relName}>
                        {rel.relative_full_name}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                        <View style={styles.relTypePill}>
                          <Text style={styles.relTypePillTxt}>
                            {rel.relation_type_name || 'Relative'}
                          </Text>
                        </View>
                        {(rel.relative_contact_no ||
                          rel.relative_mobile ||
                          rel.relative_phone) ? (
                          <Text style={styles.relPhone}>
                            •{' '}
                            {rel.relative_contact_no ||
                              rel.relative_mobile ||
                              rel.relative_phone}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <View style={styles.relArrow}>
                      <Text style={{ fontSize: 12, color: Colors.textMuted }}>
                        ➔
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <Text
                  style={{
                    textAlign: 'center',
                    color: Colors.textMuted,
                    marginTop: 40,
                  }}>
                  {isBn ? 'কোনো আত্মীয় পাওয়া যায়নি' : 'No relatives found'}
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── Add / Edit Address Modal ──────────────────────────────────────── */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBg}>
          <View style={styles.sheet}>
            <View style={styles.sheetHead}>
              <View style={styles.sheetHeadIcon}>
                <Text>🏠</Text>
              </View>
              <Text style={styles.sheetHeadTitle}>
                {editingId
                  ? isBn
                    ? 'ঠিকানা সম্পাদনা'
                    : 'Edit Address'
                  : isBn
                    ? 'নতুন ঠিকানা'
                    : 'New Address'}
              </Text>
              <TouchableOpacity
                style={styles.sheetClose}
                onPress={() => setShowModal(false)}>
                <Text style={styles.sheetCloseTxt}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.sheetScroll}
              showsVerticalScrollIndicator={false}>
              <View style={styles.sheetForm}>
                <Text style={styles.secHead}>
                  {isBn ? 'ঠিকানার ধরন' : 'ADDRESS TYPE'}
                </Text>
                <View style={styles.typeRow}>
                  {addressTypes.map(at => (
                    <TouchableOpacity
                      key={at.id}
                      style={[
                        styles.typeChip,
                        type === at.type && styles.typeChipOn,
                      ]}
                      onPress={() => setType(at.type)}>
                      <Text
                        style={[
                          styles.typeChipTxt,
                          type === at.type && styles.typeChipTxtOn,
                        ]}>
                        {at.type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Field
                  lab={
                    isBn
                      ? 'লেবেল (যেমন: হোম, অফিস)'
                      : 'Label (e.g. Home, Office)'
                  }
                  val={label}
                  setVal={setLabel}
                  place="Home / Office"
                />



                <Text style={styles.secHead}>
                  {isBn ? 'ঠিকানার বিবরণ' : 'ADDRESS DETAILS'}
                </Text>
                <Field
                  lab={isBn ? 'ঠিকানা (লাইন ১)' : 'Address line 1'}
                  req
                  val={addressLine1}
                  setVal={txt =>
                    setAddressLine1(txt.replace(/[^a-zA-Z0-9\s,.#\-/]/g, ''))
                  }
                  place="House No, Building"
                  err={errors.addressLine1}
                  setErrors={setErrors}
                />
                <Field
                  lab={isBn ? 'রাস্তা / এলাকা' : 'Street / Area'}
                  val={streetArea}
                  setVal={txt =>
                    setStreetArea(txt.replace(/[^a-zA-Z0-9\s,.#\-/]/g, ''))
                  }
                  place="Near mall, park"
                />
                <Field
                  lab={isBn ? 'ল্যান্ডমার্ক' : 'Landmark'}
                  val={landmark}
                  setVal={txt =>
                    setLandmark(txt.replace(/[^a-zA-Z0-9\s,.#\-/]/g, ''))
                  }
                  place="Near hospital"
                />

                <View style={styles.row}>
                  <Field
                    lab={isBn ? 'শহর' : 'City'}
                    req
                    val={city}
                    setVal={txt => setCity(txt.replace(/[^a-zA-Z\s.-]/g, ''))}
                    place="Kolkata"
                    err={errors.city}
                    setErrors={setErrors}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>
                      {isBn ? 'রাজ্য' : 'State'}
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
                      placeholder={
                        isBn ? 'রাজ্য নির্বাচন করুন' : 'Select State'
                      }
                    />
                  </View>
                </View>

                <Field
                  lab={isBn ? 'পিনকোড' : 'Pincode'}
                  req
                  val={pincode}
                  setVal={txt => setPincode(txt.replace(/[^0-9]/g, ''))}
                  place="700001"
                  kbd="number-pad"
                  maxLength={6}
                  err={errors.pincode}
                  setErrors={setErrors}
                />
                <TouchableOpacity
                  style={styles.useLocBtn}
                  onPress={handleUseMyLocation}>
                  <Text style={styles.useLocBtnIcon}>📍</Text>
                  <Text style={styles.useLocBtnText}>
                    {isBn
                      ? 'আমার বর্তমান অবস্থান ব্যবহার করুন'
                      : 'Use My Location'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.row}>
                  <Field
                    lab={isBn ? 'অক্ষাংশ' : 'Latitude'}
                    val={latitude}
                    setVal={setLatitude}
                    place="e.g. 22.5726"
                    kbd="numeric"
                    err={errors.latitude}
                    setErrors={setErrors}
                  />
                  <Field
                    lab={isBn ? 'দ্রাঘিমাংশ' : 'Longitude'}
                    val={longitude}
                    setVal={setLongitude}
                    place="e.g. 88.3639"
                    kbd="numeric"
                    err={errors.longitude}
                    setErrors={setErrors}
                  />
                </View>

                <View style={styles.div} />

                <Field
                  lab={
                    isBn ? 'ডেলিভারি নির্দেশাবলী' : 'Delivery Instruction'
                  }
                  val={deliveryInstruction}
                  setVal={setDeliveryInstruction}
                  place={
                    isBn ? 'যেমন: আসার আগে কল করুন' : 'e.g. call me before coming'
                  }
                />

                {relationType !== 'Self' && (
                  <>
                    <Text style={[styles.fieldLabel, { marginTop: 12, marginBottom: 8 }]}>
                      {isBn ? 'ফোন নম্বর বিকল্প' : 'Phone Number Option'}
                    </Text>

                    {/* Relative Phone radio */}
                    <TouchableOpacity
                      style={styles.radioRow}
                      onPress={() => setPhoneOption('relative')}>
                      <View style={styles.radioOuter}>
                        {phoneOption === 'relative' && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                      <Text style={styles.radioLabel}>
                        {isBn
                          ? "আত্মীয়ের ফোন নম্বর"
                          : "Relative's Phone Number"}{' '}
                        {contactNumber ? (
                          <Text style={styles.radioSub}>
                            ({contactNumber})
                          </Text>
                        ) : null}
                      </Text>
                    </TouchableOpacity>

                    {/* My Phone radio */}
                    <TouchableOpacity
                      style={[styles.radioRow, { marginBottom: 14 }]}
                      onPress={() => setPhoneOption('mine')}>
                      <View style={styles.radioOuter}>
                        {phoneOption === 'mine' && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                      <Text style={styles.radioLabel}>
                        {isBn ? 'আমার ফোন নম্বর' : 'My Phone Number'}{' '}
                        <Text style={styles.radioSub}>
                          (
                          {user?.mobile ||
                            userDetailsRaw?.ctnz_mobile ||
                            userDetailsRaw?.ctnz_phone ||
                            ''}
                          )
                        </Text>
                      </Text>
                    </TouchableOpacity>

                    {phoneOption === 'relative' && (
                      <Field
                        lab={isBn ? 'ফোন নম্বর' : 'Phone Number'}
                        req
                        val={contactNumber}
                        setVal={txt =>
                          setContactNumber(txt.replace(/[^0-9]/g, ''))
                        }
                        place="1234567890"
                        kbd="phone-pad"
                        maxLength={10}
                        err={errors.contactNumber}
                        setErrors={setErrors}
                      />
                    )}
                  </>
                )}

                <View style={styles.defaultRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.defaultTitle}>
                      {isBn ? 'ডিফল্ট হিসেবে সেট করুন' : 'Set as Default'}
                    </Text>
                    <Text style={styles.defaultSub}>
                      {isBn
                        ? 'এটি আপনার প্রধান পূজা লোকেশন হবে'
                        : 'This will be your primary puja location'}
                    </Text>
                  </View>
                  <Switch
                    value={isDefault}
                    onValueChange={setIsDefaultState}
                    trackColor={{
                      false: Colors.disabled,
                      true: Colors.primary,
                    }}
                    thumbColor={Colors.white}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.sheetFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowModal(false)}>
                <Text style={styles.cancelTxt}>
                  {isBn ? 'বাতিল' : 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveTxt}>
                  {editingId
                    ? isBn
                      ? 'আপডেট করুন'
                      : 'Update'
                    : isBn
                      ? 'সংরক্ষণ করুন'
                      : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F5' },

  // ─── Hero / Header ──────────────────────────────────────────────────────────
  hero: {
    backgroundColor: BRAND_ORANGE,
    paddingHorizontal: 20,
    paddingBottom: 28,
    position: 'relative',
    overflow: 'hidden',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backBtnTxt: { fontSize: 20, color: Colors.white, fontWeight: 'bold' },
  heroDeco1: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: -30,
    right: -40,
  },
  heroDeco2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: -20,
    right: 60,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    zIndex: 5,
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.white,
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 3,
  },

  // ─── List ───────────────────────────────────────────────────────────────────
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 40 },

  listHeader: { marginBottom: 16 },

  // Tab pills
  tabRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: Colors.white,
  },
  tabPillActive: {
    backgroundColor: BRAND_ORANGE,
    borderColor: BRAND_ORANGE,
  },
  tabPillIcon: { fontSize: 14 },
  tabPillTxt: { fontSize: 14, fontWeight: '700', color: '#666' },
  tabPillTxtActive: { color: Colors.white },

  // Count + Add
  listMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addressCount: { fontSize: 14, fontWeight: '600', color: '#555' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#FFE0B2',
    backgroundColor: '#FFF9F2',
  },
  addBtnTxt: { fontSize: 13, fontWeight: '700', color: BRAND_ORANGE },

  addBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    backgroundColor: '#FFF9F2',
  },
  addBtnSmallTxt: { fontSize: 12, fontWeight: '700', color: BRAND_ORANGE },

  // Relative Horizontal Picker
  relativesSection: {
    marginBottom: 8,
  },
  relativesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  relativesScroll: {
    paddingBottom: 16,
    gap: 12,
  },
  relativeHCard: {
    width: 140,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  relativeHCardActive: {
    borderColor: BRAND_ORANGE,
    backgroundColor: '#FFF9F2',
  },
  relAvatarH: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  relAvatarHActive: {
    backgroundColor: BRAND_ORANGE,
  },
  relAvatarTxtH: {
    fontSize: 16,
    fontWeight: '800',
    color: '#666',
  },
  relAvatarTxtHActive: {
    color: Colors.white,
  },
  relNameH: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMain,
    textAlign: 'center',
    marginBottom: 4,
  },
  relNameHActive: {
    color: Colors.textMain,
  },
  relPhoneH: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  relPhoneHActive: {
    color: '#888',
  },

  // ─── Address Card ────────────────────────────────────────────────────────────
  addrCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  addrCardDef: {
    borderColor: BRAND_ORANGE,
    backgroundColor: '#FFFAF5',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  typeBadgeTxt: { fontSize: 12, fontWeight: '700' },
  cardActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnTxt: { fontSize: 14 },

  cardAddrMain: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
    lineHeight: 22,
  },
  cardAddrSub: {
    fontSize: 13,
    color: '#777',
    lineHeight: 19,
  },
  cardPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  cardPhoneIcon: { fontSize: 13 },
  cardPhone: { fontSize: 13, color: '#444', fontWeight: '600' },

  setDefaultBtn: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#F0C070',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#FFFBF0',
  },
  setDefaultBtnTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C07800',
  },
  defaultBadgeRow: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: BRAND_ORANGE,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  defaultBadgeTxt: { fontSize: 11, color: Colors.white, fontWeight: '800' },

  addFirstBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  addFirstBtnTxt: { color: Colors.white, fontSize: 14, fontWeight: '700' },

  // ─── Modals ──────────────────────────────────────────────────────────────────
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    gap: 12,
  },
  sheetHeadIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.lightOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetHeadTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textMain,
    flex: 1,
  },
  sheetClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCloseTxt: { fontSize: 16, fontWeight: 'bold', color: Colors.textMuted },
  sheetScroll: { flex: 1 },
  sheetForm: { padding: 20 },
  secHead: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.disabled,
  },
  typeChipOn: {
    backgroundColor: Colors.lightOrange,
    borderColor: Colors.primary,
  },
  typeChipTxt: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  typeChipTxtOn: { color: Colors.primary, fontWeight: '700' },

  // Type selection cards in add modal
  typeCard: {
    flex: 1,
    backgroundColor: '#FFF9F2',
    borderColor: BRAND_ORANGE,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
  },
  typeCardTxt: { fontSize: 15, fontWeight: '800' },

  // Relative list
  relativeRow: {
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
  },
  relAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND_ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  relAvatarTxt: { color: Colors.white, fontSize: 16, fontWeight: '800' },
  relName: { fontSize: 15, fontWeight: '800', color: Colors.textMain },
  relTypePill: {
    backgroundColor: '#FFEFEB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  relTypePillTxt: { fontSize: 10, color: BRAND_ORANGE, fontWeight: '700' },
  relPhone: { fontSize: 12, color: Colors.textMuted },
  relArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F4F4F4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Radio buttons
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 4,
  },
  radioOuter: {
    height: 18,
    width: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: BRAND_ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: BRAND_ORANGE,
  },
  radioLabel: { fontSize: 14, color: Colors.textMain, fontWeight: '500' },
  radioSub: { fontSize: 12, color: Colors.textMuted },

  // Fields
  fieldWrap: { flex: 1, marginBottom: 16 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    fontSize: 14,
    color: Colors.textMain,
    borderWidth: 1,
    borderColor: Colors.transparent,
  },
  inputErr: { borderColor: Colors.red, backgroundColor: Colors.tagRed },
  errTxt: { fontSize: 11, color: Colors.red, marginTop: 4 },
  row: { flexDirection: 'row', gap: 12 },
  div: { height: 1, backgroundColor: Colors.lightGray, marginVertical: 20 },
  useLocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  useLocBtnIcon: { fontSize: 16 },
  useLocBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
  defaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  defaultTitle: { fontSize: 14, fontWeight: '700', color: Colors.textMain },
  defaultSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  sheetFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.disabled,
  },
  cancelTxt: { fontSize: 14, fontWeight: '700', color: Colors.textMuted },
  saveBtn: {
    flex: 2,
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveTxt: { fontSize: 14, fontWeight: '800', color: Colors.white },
});
