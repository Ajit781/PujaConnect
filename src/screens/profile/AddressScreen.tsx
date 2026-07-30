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
import TopNavBar from '../../components/common/TopNavBar';
import {
  Address,
  addAddress,
  updateAddress,
  deleteAddress,
} from '../../store/slices/addressSlice';
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
import {
  MapPin,
  User,
  Users,
  Search,
  Plus,
  Pencil,
  Trash2,
  Phone,
  Home,
  Briefcase,
  Building2,
  Navigation,
  CheckCircle2,
  X,
  Star,
  Check,
} from 'lucide-react-native';

const ERROR_COLOR = Colors.red;
const BRAND_ORANGE = '#c65316';

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
      placeholderTextColor="#94A3B8"
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
  const config: Record<string, { icon: any; bg: string; color: string }> = {
    Home: { icon: <Home size={12} color="#c65316" />, bg: '#FFF3EB', color: '#c65316' },
    Work: { icon: <Briefcase size={12} color="#0284C7" />, bg: '#E0F2FE', color: '#0284C7' },
    Temple: { icon: <Building2 size={12} color="#7E22CE" />, bg: '#F3E8FF', color: '#7E22CE' },
    Other: { icon: <MapPin size={12} color="#475569" />, bg: '#F1F5F9', color: '#475569' },
  };
  const c = config[type] || config.Other;
  return (
    <View style={[styles.typeBadge, { backgroundColor: c.bg }]}>
      {c.icon}
      <Text style={[styles.typeBadgeTxt, { color: c.color }]}>{type}</Text>
    </View>
  );
};

// ─── Address Card ─────────────────────────────────────────────────────────────
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TypeBadge type={addr.type} />
          {addr.isDefault && (
            <View style={styles.defaultBadgeRow}>
              <CheckCircle2 size={12} color="#16A34A" />
              <Text style={styles.defaultBadgeTxt}>DEFAULT</Text>
            </View>
          )}
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => onEdit(addr)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Pencil size={15} color="#475569" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => onDelete(addr.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Trash2 size={15} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Address text */}
      <Text style={styles.cardAddrMain} numberOfLines={2}>
        {addr.label || addr.type}
      </Text>
      <Text style={styles.cardAddrSub} numberOfLines={2}>
        {[addr.addressLine1, addr.streetArea, addr.landmark].filter(Boolean).join(', ')}
      </Text>
      <Text style={styles.cardAddrSub}>
        {[addr.city, addr.state].filter(Boolean).join(', ')} {addr.pincode ? `— ${addr.pincode}` : ''}
      </Text>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 }} />

      {/* Phone */}
      {addr.contactNumber ? (
        <View style={styles.cardPhoneRow}>
          <Phone size={14} color="#64748B" />
          <Text style={styles.cardPhone}>
            <Text style={{fontWeight: '700', color: '#475569'}}>{isBn ? 'ডেলিভারি ফোন: ' : 'Delivery phone: '}</Text>
            {addr.contactNumber}
          </Text>
        </View>
      ) : null}

      {/* Instructions */}
      {addr.deliveryInstruction ? (
        <View style={styles.cardPhoneRow}>
          <MapPin size={14} color="#64748B" />
          <Text style={styles.cardPhone}>
            <Text style={{fontWeight: '700', color: '#475569'}}>{isBn ? 'নির্দেশনা: ' : 'Instructions: '}</Text>
            {addr.deliveryInstruction}
          </Text>
        </View>
      ) : null}

      {/* Set as Default button */}
      {!addr.isDefault && (
        <TouchableOpacity
          style={styles.setDefaultBtnOutline}
          onPress={() => onSetDefault(addr.id)}>
          <Star size={16} color="#475569" style={{ marginRight: 6 }} />
          <Text style={styles.setDefaultBtnOutlineTxt}>
            {isBn ? 'ডিফল্ট সেট করুন' : 'Set as default'}
          </Text>
        </TouchableOpacity>
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
  const [searchQuery, setSearchQuery] = useState('');
  const [relativeSearchQuery, setRelativeSearchQuery] = useState('');

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

  // Address count from API
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

  // Selected relative state for horizontal relative list
  const [selectedRelativeId, setSelectedRelativeId] = useState<number | null>(null);

  // Relative selection modal
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
      if (selectedRelativeId && serverAddresses?.relative_info) {
        const selectedRel = serverAddresses.relative_info.find(
          (rel: any) => rel.auth_id === selectedRelativeId
        );
        if (selectedRel) {
          navigation.navigate('AddEditAddress', {
            relationType: 'Relative',
            targetCtznId: selectedRel.auth_id,
            address: {
              contactName: selectedRel.full_name,
              contactNumber: selectedRel.phone,
            },
          });
          return;
        }
      }
      // Fallback if somehow they try to add an address without selecting a relative
      showErrorAlert(isBn ? 'প্রথমে একজন আত্মীয় নির্বাচন করুন' : 'Please select a family member first');
    } else {
      navigation.navigate('AddEditAddress', { relationType: 'Self' });
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

  const filteredAddresses = useMemo(() => {
    let list = displayAddresses;

    if (activeTab === 'relatives') {
      list = list.filter((a: any) => a.relationType !== 'Self');
      if (selectedRelativeId) {
        list = list.filter((a: any) => a.ctzn_id === selectedRelativeId);
      }
    } else {
      list = list.filter((a: any) => a.relationType === 'Self');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a: any) =>
          a.addressLine1?.toLowerCase().includes(q) ||
          a.streetArea?.toLowerCase().includes(q) ||
          a.city?.toLowerCase().includes(q) ||
          a.pincode?.toLowerCase().includes(q) ||
          a.contactName?.toLowerCase().includes(q) ||
          a.type?.toLowerCase().includes(q),
      );
    }

    return list;
  }, [displayAddresses, activeTab, selectedRelativeId, searchQuery]);

  const openEdit = (addr: any) => {
    navigation.navigate('AddEditAddress', { address: addr });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!addressLine1.trim())
      errs.addressLine1 = isBn
        ? 'ঠিকানা লাইন ১ আবশ্যক'
        : 'Address line 1 is required';

    if (!city.trim()) errs.city = isBn ? 'শহর আবশ্যক' : 'City is required';

    if (!pincode.trim()) {
      errs.pincode = isBn ? 'পিনকোড আবশ্যক' : 'Pincode is required';
    } else if (!/^\d{6}$/.test(pincode.trim())) {
      errs.pincode = isBn
        ? 'সঠিক ৬ সংখ্যার পিনকোড দিন'
        : 'Enter a valid 6-digit pincode';
    }

    if (latitude && !/^-?\d+(\.\d+)?$/.test(latitude.trim())) {
      errs.latitude = isBn ? 'সঠিক অক্ষাংশ দিন' : 'Enter valid latitude';
    }
    if (longitude && !/^-?\d+(\.\d+)?$/.test(longitude.trim())) {
      errs.longitude = isBn ? 'সঠিক দ্রাঘিমাংশ দিন' : 'Enter valid longitude';
    }

    if (relationType !== 'Self' && phoneOption === 'relative') {
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

      let finalDeliveryContact = contactNumber.trim();
      if (relationType !== 'Self' && phoneOption === 'mine') {
        finalDeliveryContact =
          user?.mobile ||
          userDetailsRaw?.ctnz_mobile ||
          userDetailsRaw?.ctnz_phone ||
          '';
      }

      const targetCtznId = addressCtznId || user?.user_id || 0;

      const payload: any = {
        in_ctzn_address_id: editingId ? parseInt(editingId, 10) : 0,
        ctzn_auth_id: user?.user_id || 0,
        ctzn_id: targetCtznId,
        address_type_id: addressTypeId,
        label: label.trim() || type,
        address: addressLine1.trim(),
        street: streetArea.trim(),
        landmark: landmark.trim(),
        city: city.trim(),
        state: stateId || 1,
        pincode: pincode.trim(),
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
            (editingId
              ? isBn
                ? 'ঠিকানা সফলভাবে আপডেট করা হয়েছে'
                : 'Address updated successfully'
              : isBn
                ? 'ঠিকানা সফলভাবে যোগ করা হয়েছে'
                : 'Address saved successfully'),
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
        (isBn ? 'ঠিকানা প্রসেস করতে ব্যর্থ হয়েছে' : 'Failed to process address. Please try again.'),
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
          (isBn ? 'ঠিকানা প্রসেস করতে ব্যর্থ হয়েছে' : 'Failed to process address. Please try again.'),
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
                  (isBn ? 'ঠিকানা প্রসেস করতে ব্যর্থ হয়েছে' : 'Failed to process address. Please try again.'),
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

  // ─── Render Header Component Inside Main Card ────────────────────────────────
  const renderHeader = () => (
    <View style={styles.cardHeaderArea}>
      {/* Tab toggle container */}
      <View style={styles.tabToggleBox}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'my' && styles.tabBtnActive]}
          onPress={() => setActiveTab('my')}
          activeOpacity={0.85}
        >
          <User size={16} color={activeTab === 'my' ? '#FFFFFF' : '#475569'} style={{ marginRight: 6 }} />
          <Text style={[styles.tabBtnTxt, activeTab === 'my' && styles.tabBtnTxtActive]}>
            {isBn ? 'আমার ঠিকানা' : 'My addresses'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'relatives' && styles.tabBtnActive]}
          onPress={() => setActiveTab('relatives')}
          activeOpacity={0.85}
        >
          <Users size={16} color={activeTab === 'relatives' ? '#FFFFFF' : '#475569'} style={{ marginRight: 6 }} />
          <Text style={[styles.tabBtnTxt, activeTab === 'relatives' && styles.tabBtnTxtActive]}>
            {isBn ? 'আত্মীয়দের ঠিকানা' : 'Family addresses'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Action Button */}
      {activeTab === 'relatives' ? (
        <TouchableOpacity style={styles.mainAddBtn} onPress={() => navigation.navigate('AddFamilyMember')} activeOpacity={0.85}>
          <Plus size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.mainAddBtnTxt}>{isBn ? 'পরিবারের সদস্য যোগ করুন' : 'Add family member'}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.mainAddBtn} onPress={openAdd} activeOpacity={0.85}>
          <Plus size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.mainAddBtnTxt}>{isBn ? 'ঠিকানা যোগ করুন' : 'Add address'}</Text>
        </TouchableOpacity>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Relatives selector horizontal bar if activeTab === 'relatives' */}
      {activeTab === 'relatives' && (
        <View style={styles.relativesSection}>
          <View style={styles.relativesSectionHeader}>
            <View>
              <Text style={styles.secHead}>{isBn ? 'আত্মীয় নির্বাচন করুন' : 'Select a family member'}</Text>
              {(!serverAddresses?.relative_info || serverAddresses.relative_info.length === 0) && (
                <Text style={styles.noFamilySub}>{isBn ? 'কোনো আত্মীয় যোগ করা হয়নি' : 'No family members added'}</Text>
              )}
            </View>
            {(!serverAddresses?.relative_info || serverAddresses.relative_info.length === 0) && (
              <TouchableOpacity style={styles.addFamilyOutlineBtn} onPress={() => navigation.navigate('AddFamilyMember')}>
                <Plus size={14} color="#0F172A" style={{ marginRight: 4 }} />
                <Text style={styles.addFamilyOutlineBtnTxt}>{isBn ? 'সদস্য যোগ করুন' : 'Add family member'}</Text>
              </TouchableOpacity>
            )}
          </View>

          {serverAddresses?.relative_info?.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relativesScroll}>
              {serverAddresses.relative_info.map((rel: any) => {
                const isSelected = selectedRelativeId === rel.auth_id;
                return (
                  <TouchableOpacity
                    key={rel.auth_id}
                    style={[styles.relativeHCard, isSelected && styles.relativeHCardActive]}
                    onPress={() => setSelectedRelativeId(rel.auth_id)}
                  >
                    {/* Tick Mark on Corner when Selected */}
                    {isSelected && (
                      <View style={styles.relCheckBadge}>
                        <Check size={10} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    )}
                    
                    <View style={[styles.relAvatarH, isSelected && styles.relAvatarHActive]}>
                      <Text style={[styles.relAvatarTxtH, isSelected && styles.relAvatarTxtHActive]}>
                        {rel.full_name ? rel.full_name.charAt(0).toUpperCase() : 'R'}
                      </Text>
                    </View>
                    <View style={styles.relTextContainer}>
                      <View style={styles.relInfoRow}>
                        <User size={12} color={isSelected ? '#c65316' : '#94A3B8'} style={{ marginRight: 4 }} />
                        <Text style={[styles.relNameH, isSelected && styles.relNameHActive]} numberOfLines={1}>
                          {rel.full_name}
                        </Text>
                      </View>
                      <View style={styles.relInfoRow}>
                        <Phone size={12} color={isSelected ? '#c65316' : '#94A3B8'} style={{ marginRight: 4 }} />
                        <Text style={[styles.relPhoneH, isSelected && styles.relPhoneHActive]}>
                          {rel.phone}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}

      {/* Count & Search Box */}
      <View style={styles.searchSection}>
        <Text style={styles.addressCountTxt}>
          {filteredAddresses.length} {isBn ? 'ঠিকানা' : (filteredAddresses.length === 1 ? 'address' : 'addresses')}
        </Text>

        <View style={styles.searchBox}>
          <Search size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder={isBn ? 'সংরক্ষিত ঠিকানা খুঁজুন' : 'Search saved addresses'}
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color="#64748B" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {isFetchingAddresses && pageNo === 1 && (
        <ActivityIndicator
          size="small"
          color={BRAND_ORANGE}
          style={{ marginVertical: 16 }}
        />
      )}
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor="#ef7d16" barStyle="light-content" translucent={true} />
      <TopNavBar showBack={true} />

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BRAND_ORANGE]} />
        }
      >
        <View style={styles.content}>

          {/* Sub Header / Page Banner */}
          <View style={styles.pageHeader}>
            <Text style={styles.accountBadge}>{isBn ? 'আমার অ্যাকাউন্ট' : 'MY ACCOUNT'}</Text>
            
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconCircle}>
                <MapPin size={22} color={BRAND_ORANGE} />
              </View>
              <View style={styles.headerTextWrap}>
                <Text style={styles.pageTitle}>{isBn ? 'সংরক্ষিত ঠিকানা' : 'Saved addresses'}</Text>
                <Text style={styles.pageSub}>
                  {isBn
                    ? 'পূজা সেবা এবং ডেলিভারির জন্য লোকেশন পরিচালনা করুন।'
                    : 'Manage locations used for puja services and deliveries.'}
                </Text>
              </View>
            </View>
          </View>

          {/* Main White Card Container */}
          <View style={styles.mainCard}>
            {renderHeader()}

            {/* List or Empty State */}
            {filteredAddresses.length > 0 ? (
              <View style={styles.listWrapper}>
                {filteredAddresses.map(item => (
                  <AddressCard
                    key={item.id}
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
                ))}
              </View>
            ) : (
              !isFetchingAddresses && (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <MapPin size={32} color={BRAND_ORANGE} />
                  </View>
                  
                  {activeTab === 'relatives' && (!serverAddresses?.relative_info || serverAddresses.relative_info.length === 0) ? (
                    <>
                      <Text style={styles.emptyTitle}>
                        {isBn ? 'কোনো পরিবারের সদস্য যোগ করা হয়নি' : 'No family members added'}
                      </Text>
                      <Text style={styles.emptySub}>
                        {isBn
                          ? 'প্রথমে পরিবারের সদস্য যোগ করুন, তারপর ঠিকানা যোগ করুন।'
                          : 'Add a family member first, then save an address for them.'}
                      </Text>

                      <TouchableOpacity style={styles.addFirstBtn} onPress={() => navigation.navigate('AddFamilyMember')} activeOpacity={0.85}>
                        <Plus size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.addFirstBtnTxt}>
                          {isBn ? 'পরিবারের সদস্য যোগ করুন' : 'Add family member'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <Text style={styles.emptyTitle}>
                        {isBn ? 'কোনো ঠিকানা সংরক্ষিত নেই' : 'No addresses saved yet'}
                      </Text>
                      <Text style={styles.emptySub}>
                        {isBn
                          ? 'ভবিষ্যতের বুকিং দ্রুত করতে বাড়ি, কর্মস্থল বা সেবার ঠিকানা যোগ করুন।'
                          : 'Add a home, work, or service address to make future bookings faster.'}
                      </Text>

                      <TouchableOpacity style={styles.addFirstBtn} onPress={openAdd} activeOpacity={0.85}>
                        <Plus size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.addFirstBtnTxt}>
                          {isBn ? 'প্রথম ঠিকানা যোগ করুন' : 'Add first address'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )
            )}
          </View>
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* ─── Relative Selection Modal ───────────────────────────────────────── */}
      <Modal
        visible={showRelativeSelectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRelativeSelectModal(false)}>
        <View style={styles.modalBg}>
          <View style={styles.relSelectSheet}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetHeadTitle}>
                {isBn ? 'আত্মীয় নির্বাচন করুন' : 'Select Relative'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowRelativeSelectModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300, marginVertical: 12 }}>
              {serverAddresses?.relative_info?.map((rel: any) => (
                <TouchableOpacity
                  key={rel.auth_id}
                  style={styles.relSelectItem}
                  onPress={() => {
                    setShowRelativeSelectModal(false);
                    navigation.navigate('AddEditAddress', {
                      relationType: 'Relative',
                      targetCtznId: rel.auth_id,
                      address: { contactName: rel.full_name, contactNumber: rel.phone },
                    });
                  }}>
                  <View style={styles.relSelectAvatar}>
                    <Text style={styles.relSelectAvatarTxt}>
                      {rel.full_name ? rel.full_name.charAt(0).toUpperCase() : 'R'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.relSelectName}>{rel.full_name}</Text>
                    <Text style={styles.relSelectPhone}>{rel.phone}</Text>
                  </View>
                </TouchableOpacity>
              ))}

              {(!serverAddresses?.relative_info ||
                serverAddresses.relative_info.length === 0) && (
                <Text style={{ textAlign: 'center', color: '#64748B', padding: 20 }}>
                  {isBn ? 'কোনো আত্মীয় পাওয়া যায়নি' : 'No relatives found'}
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAFAFA' },
  container: { flex: 1 },
  content: { padding: 16 },

  // Page Sub Header
  pageHeader: { marginBottom: 20, paddingTop: 4 },
  accountBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: '#C2410C',
    letterSpacing: 1,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFF3EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: { flex: 1 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: '#0F172A', letterSpacing: -0.3 },
  pageSub: { fontSize: 13, color: '#64748B', marginTop: 3, lineHeight: 18 },

  // Main White Card Container
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },

  cardHeaderArea: { marginBottom: 8 },

  // Tab Toggle Box
  tabToggleBox: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#c65316',
  },
  tabBtnTxt: { fontSize: 14, fontWeight: '700', color: '#475569' },
  tabBtnTxtActive: { color: '#FFFFFF' },

  // Main Add Button
  mainAddBtn: {
    backgroundColor: '#c65316',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  mainAddBtnTxt: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },

  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 16 },

  // Count & Search
  searchSection: { marginBottom: 16 },
  addressCountTxt: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 10 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A', padding: 0 },

  // Relative Picker
  relativesSection: { marginBottom: 16 },
  relativesSectionHeader: { marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  secHead: { fontSize: 13, color: '#0F172A' },
  noFamilySub: { fontSize: 12, color: '#64748B', marginTop: 4 },
  addFamilyOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  addFamilyOutlineBtnTxt: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  relativesScroll: { gap: 10 },
  relativeHCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingRight: 20,
    minWidth: 160,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  relativeHCardActive: { borderColor: '#c65316', backgroundColor: '#FFF3EB' },
  relCheckBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#c65316',
    borderRadius: 10,
    padding: 2,
    zIndex: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  relAvatarH: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  relAvatarHActive: { backgroundColor: '#c65316' },
  relAvatarTxtH: { fontSize: 14, fontWeight: '800', color: '#64748B' },
  relAvatarTxtHActive: { color: '#FFFFFF' },
  relTextContainer: { justifyContent: 'center', flexShrink: 1 },
  relInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  relNameH: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  relNameHActive: { color: '#0F172A' },
  relPhoneH: { fontSize: 13, color: '#475569', fontWeight: '500' },
  relPhoneHActive: { color: '#c65316' },

  // Address Cards List
  listWrapper: { gap: 14 },
  addrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  addrCardDef: { borderColor: '#FED7AA', backgroundColor: '#FFFCF9' },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeTxt: { fontSize: 11, fontWeight: '800' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { padding: 4 },
  cardAddrMain: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 4, lineHeight: 20 },
  cardAddrSub: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  cardPhoneRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 8 },
  cardPhone: { fontSize: 13, color: '#475569', fontWeight: '500', flex: 1 },
  setDefaultBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  setDefaultBtnOutlineTxt: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  defaultBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  defaultBadgeTxt: { fontSize: 10, fontWeight: '800', color: '#16A34A' },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF3EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 6, textAlign: 'center' },
  emptySub: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 18, marginBottom: 20, maxWidth: 280 },
  addFirstBtn: {
    backgroundColor: '#c65316',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFirstBtnTxt: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },

  // Form Fields & Sheet Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sheetHeadIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFF3EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sheetHeadTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: '#0F172A' },
  sheetClose: { padding: 4 },
  sheetScroll: { paddingHorizontal: 20 },
  sheetForm: { paddingVertical: 16 },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 11, fontWeight: '800', color: '#64748B', marginBottom: 6, textTransform: 'uppercase' },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  inputErr: { borderColor: Colors.red, backgroundColor: '#FEF2F2' },
  errTxt: { fontSize: 11, color: Colors.red, marginTop: 4 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 16, marginTop: 6 },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  typeChipOn: { backgroundColor: '#c65316', borderColor: '#c65316' },
  typeChipTxt: { fontSize: 12, fontWeight: '700', color: '#475569' },
  typeChipTxtOn: { color: '#FFFFFF' },
  row: { flexDirection: 'row', gap: 12 },
  useLocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FED7AA',
    backgroundColor: '#FFF3EB',
    marginBottom: 14,
  },
  useLocBtnText: { fontSize: 13, fontWeight: '700', color: '#c65316' },
  div: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 14 },
  radioRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#c65316',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#c65316' },
  radioLabel: { fontSize: 13, fontWeight: '600', color: '#0F172A' },
  radioSub: { fontSize: 12, color: '#64748B' },
  defaultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  defaultTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  defaultSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  sheetFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  cancelTxt: { fontSize: 14, fontWeight: '700', color: '#475569' },
  saveBtn: { flex: 2, paddingVertical: 12, borderRadius: 10, backgroundColor: '#c65316', alignItems: 'center' },
  saveTxt: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },

  // Relative Selector Sheet
  relSelectSheet: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, width: '90%' },
  relSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  relSelectAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF3EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  relSelectAvatarTxt: { fontSize: 14, fontWeight: '800', color: '#c65316' },
  relSelectName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  relSelectPhone: { fontSize: 12, color: '#64748B' },
});
