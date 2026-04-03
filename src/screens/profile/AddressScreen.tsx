/* eslint-disable react-native/no-inline-styles */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
import { Colors } from '../../constants/Colors';
import {
  useSaveAddressMutation,
  useGetAddressesQuery,
  useSaveDefaultAddressMutation,
  useDeleteAddressMutation,
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
      onChangeText={t => {
        setVal(t);
        if (setErrors) setErrors(prev => ({ ...prev, [lab]: '' }));
      }}
      keyboardType={(kbd as any) || 'default'}
    />
    {err ? <Text style={styles.errTxt}>⚠ {err}</Text> : null}
  </View>
);

const AddressCard = React.memo(
  ({ addr, isBn, onEdit, onSetDefault, onDelete }: any) => {
    const typeIcon = (t: string) =>
      t === 'Home' ? '🏠' : t === 'Work' ? '💼' : t === 'Temple' ? '🛕' : '📍';

    return (
      <View style={[styles.addrCard, addr.isDefault && styles.addrCardDef]}>
        {addr.isDefault && (
          <View style={styles.defBadge}>
            <Text style={styles.defBadgeTxt}>
              ★ {isBn ? 'ডিফল্ট' : 'DEFAULT'}
            </Text>
          </View>
        )}
        <View style={styles.addrTop}>
          <View
            style={[
              styles.addrTypeBox,
              addr.isDefault && { backgroundColor: Colors.lightOrange },
            ]}
          >
            <Text style={{ fontSize: 18 }}>{typeIcon(addr.type)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            {addr.label ? (
              <View style={styles.labelChip}>
                <Text style={styles.labelChipTxt}>🏷 {addr.label}</Text>
              </View>
            ) : null}
            <Text style={styles.addrName}>
              {addr.contactName}{' '}
              {addr.relationType ? (
                <Text style={styles.relTag}>({addr.relationType})</Text>
              ) : null}
            </Text>
            <Text style={styles.addrPhone}>📞 {addr.contactNumber}</Text>
          </View>
        </View>
        <View style={styles.addrBody}>
          <Text style={styles.addrMain}>{addr.addressLine1}</Text>
          <Text style={styles.addrSub}>
            {[
              addr.streetArea,
              addr.landmark,
              addr.city,
              addr.state,
              addr.pincode,
            ]
              .filter(Boolean)
              .join(', ')}
          </Text>
          {addr.latitude || addr.longitude ? (
            <Text style={styles.coords}>
              📌 {addr.latitude ? `Lat: ${addr.latitude}` : ''}
              {addr.latitude && addr.longitude ? ', ' : ''}
              {addr.longitude ? `Lng: ${addr.longitude}` : ''}
            </Text>
          ) : null}
        </View>
        <View style={styles.addrFooter}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={styles.acBtn} onPress={() => onEdit(addr)}>
              <Text style={styles.acBtnTxt}>
                📝 {isBn ? 'সম্পাদনা' : 'Edit'}
              </Text>
            </TouchableOpacity>
            {!addr.isDefault && (
              <TouchableOpacity
                style={styles.acBtn}
                onPress={() => onSetDefault(addr.id)}
              >
                <Text style={styles.acBtnTxt}>
                  ★ {isBn ? 'ডিফল্ট' : 'Set Default'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.acBtn, styles.acBtnRed]}
              onPress={() => onDelete(addr.id)}
            >
              <Text style={[styles.acBtnTxt, { color: Colors.white }]}>
                🗑 {isBn ? 'মুছুন' : 'Delete'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  },
);

export default function AddressScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { i18n } = useTranslation();
  const isBn = i18n.language === 'bn';
  const dispatch = useDispatch();
  const { showAlert, showErrorAlert } = useAlert();
  const user = useSelector((state: RootState) => state.auth.user);
  const addresses = useSelector((state: RootState) => state.address.addresses);

  const [saveAddressMutation] = useSaveAddressMutation();
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

  useEffect(() => {
    console.log(
      '--- AddressScreen: user from state ---',
      JSON.stringify(user, null, 2),
    );
  }, [user]);

  useEffect(() => {
    if (serverAddresses) {
      console.log(
        '--- AddressScreen: serverAddresses from API ---',
        JSON.stringify(serverAddresses, null, 2),
      );
    }
  }, [serverAddresses, pageNo]);

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
    setPincode('');
    setLatitude('');
    setLongitude('');
    setIsDefaultState(false);
    setErrors({});
    setEditingId(null);
  };

  const openAdd = () => {
    clearForm();
    setShowModal(true);
  };

  const handleUseMyLocation = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: isBn ? 'অবস্থান অনুমতি' : 'Location Permission',
            message: isBn
              ? 'আপনার সঠিক অবস্থান পেতে এই অ্যাপটির অবস্থানের অনুমতি প্রয়োজন'
              : 'This app needs location permission to get your precise address.',
            buttonNeutral: isBn ? 'পরে' : 'Ask Me Later',
            buttonNegative: isBn ? 'বাতিল' : 'Cancel',
            buttonPositive: isBn ? 'ঠিক আছে' : 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          showErrorAlert(
            isBn
              ? 'অবস্থান অনুমতি ছাড়া ঠিকানা পাওয়া সম্ভব নয়'
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
          message: isBn
            ? `অক্ষাংশ: ${lat.toFixed(6)}, দ্রাঘিমাংশ: ${lng.toFixed(6)}`
            : `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`,
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
    setRefreshing(true);
    try {
      await refetchAddresses();
    } catch (err) {
      console.error('Address refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  }, [refetchAddresses]);

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

  const displayAddresses = useMemo(() => {
    if (!serverAddresses || !Array.isArray(serverAddresses)) return [];
    return serverAddresses.map((a: any) => ({
      id: (a.address_id || a.ctzn_address_id || Date.now()).toString(),
      type: a.address_type || a.address_type_name || 'Home',
      label: a.label || '',
      contactName: a.full_name || a.name || '',
      contactNumber: a.phone || a.contact_no || '',
      relationType: a.relation_type || a.relation_type_name || '',
      addressLine1: a.address || '',
      streetArea: a.street || '',
      landmark: a.landmark || '',
      city: a.city || '',
      state: a.state || '',
      pincode: a.pincode || '',
      latitude: a.latitude?.toString() || '',
      longitude: a.longitude?.toString() || '',
      isDefault: a.is_default === 1 || a.is_default === true,
    }));
  }, [serverAddresses]);

  const openEdit = useCallback((addr: Address) => {
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
    setEditingId(addr.id);
    setErrors({});
    setShowModal(true);
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!contactName.trim())
      e.contactName = isBn ? 'নাম আবশ্যক' : 'Name required';
    if (!contactNumber.trim() || !/^\d{10}$/.test(contactNumber))
      e.contactNumber = isBn
        ? 'সঠিক ১০-সংখ্যার নম্বর লিখুন'
        : 'Valid 10-digit number required';
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

    try {
      dispatch(showLoader());
      const relId =
        SOCIAL_RELATIONS.find(r => r.name === relationType)?.id || 0;
      const typeId = addressTypes.find(t => t.type === type)?.id || 1;

      const payload = {
        in_ctzn_address_id: editingId ? parseInt(editingId, 10) : 0,
        ctzn_id: user?.user_id || 0,
        relation_type_id: relId,
        address_type_id: typeId,
        label: label,
        name: contactName,
        contact_no: contactNumber,
        address: addressLine1,
        street: streetArea,
        landmark: landmark,
        city: city,
        state: stateName,
        pincode: pincode,
        is_default: isDefault ? 1 : addresses.length === 0 ? 1 : 0,
        latitude: latitude ? parseFloat(latitude) : 0,
        longitude: longitude ? parseFloat(longitude) : 0,
      };

      const result = await saveAddressMutation({
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
        console.error('Save Default Address Error:', err);
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
                console.error('Delete Address Error:', err);
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
    ],
  );

  const renderHeader = () => (
    <View>
      <View style={styles.hero}>
        <View style={styles.heroInner}>
          <View style={styles.heroIcon}>
            <Text style={{ fontSize: 22 }}>📍</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>
              {isBn ? 'সংরক্ষিত ঠিকানা' : 'Saved Addresses'}
            </Text>
            <Text style={styles.heroSub} numberOfLines={1}>
              {isBn
                ? 'পূজা লোকেশন পরিচালনা করুন'
                : 'Manage your puja locations'}
            </Text>
          </View>
        </View>
        <View style={styles.deco1} />
        <View style={styles.deco2} />
      </View>

      <View style={styles.listHead}>
        <Text style={styles.listTitle}>
          {isBn ? 'আপনার ঠিকানা' : 'Your Addresses'}{' '}
          <Text style={styles.listCount}>({displayAddresses.length})</Text>
        </Text>
        <TouchableOpacity style={styles.addNewBtn} onPress={openAdd}>
          <Text style={styles.addNewBtnTxt}>+ {isBn ? 'নতুন' : 'Add New'}</Text>
        </TouchableOpacity>
      </View>

      {isFetchingAddresses && pageNo === 1 && (
        <ActivityIndicator
          size="small"
          color={Colors.primary}
          style={{ marginBottom: 16 }}
        />
      )}
    </View>
  );

  const renderFooter = () => (
    <View>
      {displayAddresses.length > 0 && (
        <TouchableOpacity style={styles.addMoreBtn} onPress={openAdd}>
          <Text style={styles.addMoreBtnTxt}>
            + {isBn ? 'আরও ঠিকানা যোগ করুন' : 'Add More Address'}
          </Text>
        </TouchableOpacity>
      )}
      <View style={{ height: 40 }} />
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar
        backgroundColor={Colors.background}
        barStyle="dark-content"
        translucent={true}
      />

      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 12, paddingBottom: 14 },
        ]}
      >
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.navBtnIcon}>←</Text>
          <Text style={styles.navBtnTxt}>{isBn ? 'ফিরে যান' : 'Back'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navBtn, { borderColor: Colors.border }]}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <Text style={styles.navBtnIcon}>🏠</Text>
          <Text style={[styles.navBtnTxt, { color: Colors.primary }]}>
            {isBn ? 'ড্যাশবোর্ড' : 'Dashboard'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        data={displayAddresses}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <AddressCard
            addr={item}
            isBn={isBn}
            onEdit={openEdit}
            onSetDefault={handleSetDefault}
            onDelete={handleDeleteAddr}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <NoDataFound
            message={isBn ? 'এখনও কোনো ঠিকানা নেই' : 'No addresses saved yet'}
            containerHeight={350}
          >
            <TouchableOpacity style={styles.addFirstBtn} onPress={openAdd}>
              <Text style={styles.addFirstBtnTxt}>
                + {isBn ? 'প্রথম ঠিকানা যোগ করুন' : 'Add First Address'}
              </Text>
            </TouchableOpacity>
          </NoDataFound>
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

      {/* Modal for Add/Edit Address */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBg}
        >
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
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.sheetCloseTxt}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.sheetScroll}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.sheetForm}>
                <Text style={styles.secHead}>
                  {isBn ? 'ঠিকানার ধরন' : 'ADDRESS TYPE'}
                </Text>
                <View style={styles.typeRow}>
                  {addressTypes.map(t => (
                    <TouchableOpacity
                      key={t.id}
                      style={[
                        styles.typeChip,
                        type === t.type && styles.typeChipOn,
                      ]}
                      onPress={() => setType(t.type)}
                    >
                      <Text
                        style={[
                          styles.typeChipTxt,
                          type === t.type && styles.typeChipTxtOn,
                        ]}
                      >
                        {t.type}
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
                  {isBn ? 'যোগাযোগের তথ্য' : 'CONTACT INFO'}
                </Text>
                <Field
                  lab={isBn ? 'পুরো নাম' : 'Full Name'}
                  req
                  val={contactName}
                  setVal={t => setContactName(t.replace(/[^a-zA-Z\s.-]/g, ''))}
                  place="John Doe"
                  err={errors.contactName}
                  setErrors={setErrors}
                />
                <Field
                  lab={isBn ? 'ফোন নম্বর' : 'Phone Number'}
                  req
                  val={contactNumber}
                  setVal={t => setContactNumber(t.replace(/[^0-9]/g, ''))}
                  place="1234567890"
                  kbd="phone-pad"
                  maxLength={10}
                  err={errors.contactNumber}
                  setErrors={setErrors}
                />

                <Text style={styles.fieldLabel}>
                  {isBn ? 'সম্পর্ক' : 'RELATION'}
                </Text>
                <Dropdown
                  options={SOCIAL_RELATIONS}
                  value={
                    SOCIAL_RELATIONS.find(r => r.name === relationType)?.id ||
                    null
                  }
                  onSelect={id => {
                    const name =
                      SOCIAL_RELATIONS.find(r => r.id === id)?.name || '';
                    setRelationType(name);
                    setErrors(prev => ({ ...prev, relationType: '' }));
                  }}
                  placeholder={
                    isBn ? 'সম্পর্ক নির্বাচন করুন' : 'Select Relation'
                  }
                />

                <View style={styles.div} />

                <Text style={styles.secHead}>
                  {isBn ? 'ঠিকানার বিবরণ' : 'ADDRESS DETAILS'}
                </Text>
                <Field
                  lab={isBn ? 'ঠিকানা (লাইন ১)' : 'Address line 1'}
                  req
                  val={addressLine1}
                  setVal={t =>
                    setAddressLine1(t.replace(/[^a-zA-Z0-9\s,.#\-/]/g, ''))
                  }
                  place="House No, Building"
                  err={errors.addressLine1}
                  setErrors={setErrors}
                />
                <Field
                  lab={isBn ? 'রাস্তা / এলাকা' : 'Street / Area'}
                  val={streetArea}
                  setVal={t =>
                    setStreetArea(t.replace(/[^a-zA-Z0-9\s,.#\-/]/g, ''))
                  }
                  place="Near mall, park"
                />
                <Field
                  lab={isBn ? 'ল্যান্ডমার্ক' : 'Landmark'}
                  val={landmark}
                  setVal={t =>
                    setLandmark(t.replace(/[^a-zA-Z0-9\s,.#\-/]/g, ''))
                  }
                  place="Near hospital"
                />

                <View style={styles.row}>
                  <Field
                    lab={isBn ? 'শহর' : 'City'}
                    req
                    val={city}
                    setVal={t => setCity(t.replace(/[^a-zA-Z\s.-]/g, ''))}
                    place="Kolkata"
                    err={errors.city}
                    setErrors={setErrors}
                  />
                  <Field
                    lab={isBn ? 'রাজ্য' : 'State'}
                    val={stateName}
                    setVal={t => setStateName(t.replace(/[^a-zA-Z\s.-]/g, ''))}
                    place="West Bengal"
                  />
                </View>

                <Field
                  lab={isBn ? 'পিনকোড' : 'Pincode'}
                  req
                  val={pincode}
                  setVal={t => setPincode(t.replace(/[^0-9]/g, ''))}
                  place="700001"
                  kbd="number-pad"
                  maxLength={6}
                  err={errors.pincode}
                  setErrors={setErrors}
                />

                <TouchableOpacity
                  style={styles.useLocBtn}
                  onPress={handleUseMyLocation}
                >
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
                onPress={() => setShowModal(false)}
              >
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
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    // paddingVertical removed to allow insets in component
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.disabled,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  navBtnIcon: { fontSize: 16, color: Colors.textMain },
  navBtnTxt: { fontSize: 13, fontWeight: '700', color: Colors.textMain },

  body: { flex: 1 },
  bodyContent: { padding: 20, paddingBottom: 40 },

  hero: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.disabled,
    overflow: 'hidden',
    position: 'relative',
  },
  heroInner: { flexDirection: 'row', alignItems: 'center', gap: 16, zIndex: 5 },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: Colors.lightOrange,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heroTitle: { fontSize: 24, fontWeight: '900', color: Colors.textMain },
  heroSub: { fontSize: 14, color: Colors.textMuted, marginTop: 4 },
  deco1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.warningBackground,
    bottom: -40,
    right: -20,
    opacity: 0.6,
  },
  deco2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.lightOrange,
    bottom: 20,
    right: 40,
    opacity: 0.3,
  },

  listHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listTitle: { fontSize: 18, fontWeight: '800', color: Colors.textMain },
  listCount: { color: Colors.gray, fontWeight: '600' },
  addNewBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addNewBtnTxt: { color: Colors.white, fontSize: 13, fontWeight: '700' },

  addrCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.disabled,
    marginBottom: 16,
    position: 'relative',
  },
  addrCardDef: {
    borderColor: Colors.primary,
    backgroundColor: Colors.warningBackground,
  },
  defBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  defBadgeTxt: { fontSize: 10, color: Colors.white, fontWeight: '800' },
  addrTop: { flexDirection: 'row', gap: 14, marginBottom: 14 },
  addrTypeBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelChip: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  labelChipTxt: { fontSize: 10, color: Colors.textMuted, fontWeight: '700' },
  addrName: { fontSize: 16, fontWeight: '800', color: Colors.textMain },
  relTag: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  addrPhone: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  addrBody: { marginBottom: 16 },
  addrMain: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textMain,
    marginBottom: 4,
  },
  addrSub: { fontSize: 13, color: Colors.textMuted, lineHeight: 18 },
  coords: {
    fontSize: 11,
    color: Colors.gray,
    marginTop: 6,
    fontStyle: 'italic',
  },
  addrFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    paddingTop: 14,
  },
  acBtn: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  acBtnRed: { backgroundColor: Colors.red },
  acBtnTxt: { fontSize: 12, fontWeight: '700', color: Colors.textMain },

  addMoreBtn: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  addMoreBtnTxt: { color: Colors.primary, fontSize: 14, fontWeight: '700' },

  addFirstBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  addFirstBtnTxt: { color: Colors.white, fontSize: 14, fontWeight: '700' },

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

  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    gap: 12,
  },
  mapBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapBackIcon: { fontSize: 20, color: Colors.textMain },
  mapTitle: { fontSize: 16, fontWeight: '800', color: Colors.textMain },
  mapSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  mapFooter: {
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  confirmMapBtn: {
    backgroundColor: Colors.primary,
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: Colors.black,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  confirmMapBtnTxt: { color: Colors.white, fontSize: 16, fontWeight: '800' },
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
