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
  Platform,
  Modal,
  KeyboardAvoidingView,
  Switch,
} from 'react-native';
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
  setDefaultAddress,
} from '../../store/slices/addressSlice';
import NoDataFound from '../../components/common/NoDataFound';
import { showLoader, hideLoader } from '../../store/slices/loaderSlice';
import { Colors } from '../../constants/Colors';

const ERROR_COLOR = Colors.red;

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

export default function AddressScreen({ navigation }: any) {
  const { i18n } = useTranslation();
  const isBn = i18n.language === 'bn';
  const dispatch = useDispatch();
  const { showAlert } = useAlert();
  const addresses = useSelector((state: RootState) => state.address.addresses);

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

  const handleUseMyLocation = () => {
    // Attempt to use navigator.geolocation which is polyfilled in many RN environments
    // or provide instructions if it fails.
    const nav = navigator as any;
    if (!nav?.geolocation) {
      showAlert({
        title: isBn ? 'সতর্কতা' : 'Warning',
        message: isBn
          ? 'আপনার ডিভাইসে জিপিএস উপলব্ধ নেই'
          : 'Geolocation is not supported on this device',
      });
      return;
    }

    dispatch(showLoader());
    nav.geolocation.getCurrentPosition(
      (position: any) => {
        setLatitude(position.coords.latitude.toString());
        setLongitude(position.coords.longitude.toString());
        dispatch(hideLoader());
      },
      (error: any) => {
        dispatch(hideLoader());
        console.error('Location Error:', error);
        showAlert({
          title: isBn ? 'ত্রুটি' : 'Error',
          message: isBn
            ? 'আপনার অবস্থান পাওয়া যায়নি'
            : 'Could not fetch your location. Please ensure GPS is on.',
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  // Fetch Address Types on mount
  React.useEffect(() => {
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

  const openEdit = (addr: Address) => {
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
    setEditingId(addr.id);
    setErrors({});
    setShowModal(true);
  };

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

  const handleSave = () => {
    if (!validate()) return;
    dispatch(showLoader());
    setTimeout(() => {
      const addrData: Address = {
        id: editingId || Date.now().toString(),
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
        isDefault: isDefault,
      };
      if (editingId) {
        // Honor the switch, but if it was already default, keep it default
        const old = addresses.find(a => a.id === editingId);
        if (old?.isDefault) addrData.isDefault = true;
        dispatch(updateAddress(addrData));
      } else {
        // First address is always default, or if the switch was toggled
        if (addresses.length === 0) addrData.isDefault = true;
        dispatch(addAddress(addrData));
      }
      dispatch(hideLoader());
      setShowModal(false);
      clearForm();
    }, 600);
  };

  const handleDelete = (id: string) => {
    showAlert({
      title: isBn ? 'মুছে ফেলুন' : 'Delete Address',
      message: isBn
        ? 'এই ঠিকানাটি মুছে ফেলতে চান?'
        : 'Are you sure you want to delete this address?',
      buttons: [
        { text: isBn ? 'বাতিল' : 'Cancel', style: 'cancel' },
        {
          text: isBn ? 'মুছুন' : 'Delete',
          onPress: () => dispatch(deleteAddress(id)),
          style: 'destructive',
        },
      ],
    });
  };

  const typeIcon = (t: string) =>
    t === 'Home' ? '🏠' : t === 'Work' ? '💼' : t === 'Temple' ? '🛕' : '📍';

  return (
    <View style={styles.root}>
      <StatusBar
        backgroundColor={Colors.background}
        barStyle="dark-content"
        translucent={false}
      />

      {/* Sticky top header */}
      <View style={styles.header}>
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

      {/* Scrollable page body */}
      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.bodyContent}
      >
        {/* Hero */}
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

        {/* Card */}
        <View style={styles.card}>
          {addresses.length === 0 ? (
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
          ) : (
            <>
              <View style={styles.listHead}>
                <Text style={styles.listTitle}>
                  {isBn ? 'আপনার ঠিকানা' : 'Your Addresses'}{' '}
                  <Text style={styles.listCount}>({addresses.length})</Text>
                </Text>
                <TouchableOpacity style={styles.addNewBtn} onPress={openAdd}>
                  <Text style={styles.addNewBtnTxt}>
                    + {isBn ? 'নতুন' : 'Add New'}
                  </Text>
                </TouchableOpacity>
              </View>

              {addresses.map(addr => (
                <View
                  key={addr.id}
                  style={[
                    styles.addrCard,
                    addr.isDefault && styles.addrCardDef,
                  ]}
                >
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
                        addr.isDefault && {
                          backgroundColor: Colors.lightOrange,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 18 }}>
                        {typeIcon(addr.type)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      {addr.label ? (
                        <View style={styles.labelChip}>
                          <Text style={styles.labelChipTxt}>
                            🏷 {addr.label}
                          </Text>
                        </View>
                      ) : null}
                      <Text style={styles.addrName}>
                        {addr.contactName}{' '}
                        {addr.relationType ? (
                          <Text style={styles.relTag}>
                            ({addr.relationType})
                          </Text>
                        ) : null}
                      </Text>
                      <Text style={styles.addrPhone}>
                        📞 {addr.contactNumber}
                      </Text>
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
                        {addr.latitude && addr.longitude ? '  ' : ''}
                        {addr.longitude ? `Lng: ${addr.longitude}` : ''}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.addrFooter}>
                    <TouchableOpacity
                      style={[
                        styles.defBtn,
                        addr.isDefault && styles.defBtnActive,
                      ]}
                      onPress={() => dispatch(setDefaultAddress(addr.id))}
                      disabled={addr.isDefault}
                    >
                      <Text
                        style={[
                          styles.defBtnTxt,
                          addr.isDefault && {
                            color: Colors.primary,
                            fontWeight: '700',
                          },
                        ]}
                      >
                        {addr.isDefault ? '★ Default' : '☆ Set Default'}
                      </Text>
                    </TouchableOpacity>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        style={styles.acBtn}
                        onPress={() => openEdit(addr)}
                      >
                        <Text>✏️</Text>
                        <Text style={styles.acBtnTxt}>
                          {isBn ? 'সম্পাদনা' : 'Edit'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.acBtn, styles.acBtnRed]}
                        onPress={() => handleDelete(addr.id)}
                      >
                        <Text>🗑</Text>
                        <Text style={[styles.acBtnTxt, { color: Colors.red }]}>
                          {isBn ? 'মুছুন' : 'Delete'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}

              <TouchableOpacity style={styles.addMoreBtn} onPress={openAdd}>
                <Text style={styles.addMoreBtnTxt}>
                  + {isBn ? 'আরেকটি ঠিকানা যোগ করুন' : 'Add Another Address'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Modal — uses flex layout so footer is always visible */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalBg}>
            {/* Sheet: flex column, constrained height */}
            <View style={styles.sheet}>
              {/* Fixed header */}
              <View style={styles.sheetHead}>
                <View style={styles.sheetHeadIcon}>
                  <Text style={{ fontSize: 18 }}>📝</Text>
                </View>
                <Text style={styles.sheetHeadTitle}>
                  {editingId
                    ? isBn
                      ? 'ঠিকানা আপডেট'
                      : 'Edit Address'
                    : isBn
                    ? 'নতুন ঠিকানা'
                    : 'New Address'}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowModal(false)}
                  style={styles.sheetClose}
                >
                  <Text style={styles.sheetCloseTxt}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Scrollable form — flex:1 keeps it inside the sheet */}
              <ScrollView
                style={styles.sheetScroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.sheetForm}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.secHead}>
                  {isBn ? '📋 ঠিকানার ধরন ও লেবেল' : '📋 ADDRESS TYPE & LABEL'}
                </Text>
                <View style={styles.row}>
                  <View style={styles.fieldWrap}>
                    <Dropdown
                      label={isBn ? 'ঠিকানার ধরন' : 'ADDRESS TYPE'}
                      required
                      placeholder={isBn ? 'ধরন নির্বাচন করুন' : 'Select type'}
                      options={addressTypes.map(t => ({
                        id: t.type,
                        name: t.type,
                      }))}
                      value={type}
                      onSelect={v => setType(v)}
                      error={errors.type}
                    />
                  </View>
                  <Field
                    lab={isBn ? 'লেবেল (ঐচ্ছিক)' : 'LABEL (OPTIONAL)'}
                    val={label}
                    setVal={setLabel}
                    place="e.g. My Home, Office..."
                  />
                </View>

                <View style={styles.div} />
                <Text style={styles.secHead}>
                  {isBn ? '👤 যোগাযোগের তথ্য' : '👤 CONTACT INFORMATION'}
                </Text>
                <Field
                  lab={isBn ? 'পুরো নাম' : 'FULL NAME'}
                  req
                  val={contactName}
                  setVal={setContactName}
                  place="e.g. Ramesh"
                  err={errors.contactName}
                />
                <View style={styles.row}>
                  <Field
                    lab={isBn ? 'মোবাইল' : 'MOBILE'}
                    req
                    val={contactNumber}
                    setVal={setContactNumber}
                    place="10-digit mobile"
                    kbd="number-pad"
                    maxLength={10}
                    err={errors.contactNumber}
                  />
                  <View style={styles.fieldWrap}>
                    <Dropdown
                      label={isBn ? 'সম্পর্ক' : 'RELATION TYPE'}
                      placeholder={
                        isBn ? 'সম্পর্ক নির্বাচন করুন' : 'Select relation'
                      }
                      options={SOCIAL_RELATIONS}
                      value={relationType}
                      onSelect={v => setRelationType(v)}
                      error={errors.relationType}
                    />
                  </View>
                </View>

                <View style={styles.div} />
                <Text style={styles.secHead}>
                  {isBn ? '🏘 ঠিকানার বিস্তারিত' : '🏘 ADDRESS DETAILS'}
                </Text>
                <Field
                  lab={isBn ? 'ঠিকানা লাইন' : 'ADDRESS LINE'}
                  req
                  val={addressLine1}
                  setVal={setAddressLine1}
                  place="Flat / House no, Building name"
                  err={errors.addressLine1}
                />
                <View style={styles.row}>
                  <Field
                    lab={isBn ? 'রাস্তা / এরিয়া' : 'STREET / AREA'}
                    val={streetArea}
                    setVal={setStreetArea}
                    place="Street or locality"
                  />
                  <Field
                    lab={isBn ? 'ল্যান্ডমার্ক' : 'LANDMARK'}
                    val={landmark}
                    setVal={setLandmark}
                    place="Near temple, park..."
                  />
                </View>
                <View style={styles.row}>
                  <Field
                    lab={isBn ? 'শহর' : 'CITY'}
                    req
                    val={city}
                    setVal={setCity}
                    place="city"
                    err={errors.city}
                  />
                  <Field
                    lab={isBn ? 'রাজ্য' : 'STATE'}
                    val={stateName}
                    setVal={setStateName}
                    place="state"
                  />
                  <Field
                    lab={isBn ? 'পিনকোড' : 'PINCODE'}
                    req
                    val={pincode}
                    setVal={setPincode}
                    place="pincode"
                    kbd="number-pad"
                    maxLength={6}
                    err={errors.pincode}
                  />
                </View>

                <View style={styles.div} />
                <Text style={styles.secHead}>
                  {isBn ? '🗺 অবস্থান স্থানাঙ্ক' : '🗺 LOCATION COORDINATES'}
                </Text>

                <View style={styles.row}>
                  <Field
                    lab={isBn ? 'অক্ষাংশ (Latitude)' : 'LATITUDE'}
                    val={latitude}
                    setVal={setLatitude}
                    place="e.g. 22.5726"
                    kbd="decimal-pad"
                    err={errors.latitude}
                  />
                  <Field
                    lab={isBn ? 'দ্রাঘিমাংশ (Longitude)' : 'LONGITUDE'}
                    val={longitude}
                    setVal={setLongitude}
                    place="e.g. 88.3639"
                    kbd="decimal-pad"
                    err={errors.longitude}
                  />
                </View>

                <TouchableOpacity
                  style={styles.useLocBtn}
                  onPress={handleUseMyLocation}
                >
                  <Text style={styles.useLocBtnIcon}>🧭</Text>
                  <Text style={styles.useLocBtnText}>
                    {isBn ? 'আমার অবস্থান ব্যবহার করুন' : 'Use My Location'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.div} />
                <View style={styles.defaultRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.defaultTitle}>
                      {isBn
                        ? 'ডিফল্ট হিসেবে সেট করুন'
                        : 'Set as Default Address'}
                    </Text>
                    <Text style={styles.defaultSub}>
                      {isBn
                        ? 'সব পূজা বুকিং এর জন্য ডিফল্ট হিসেবে ব্যবহার করা হবে'
                        : 'Used by default for all puja bookings'}
                    </Text>
                  </View>
                  <Switch
                    value={isDefault}
                    onValueChange={setIsDefaultState}
                    trackColor={{ false: Colors.divider, true: Colors.primary }}
                    thumbColor={Colors.white}
                  />
                </View>

                <View style={{ height: 24 }} />
              </ScrollView>

              {/* Footer — always at bottom of the sheet because sheet is flex column */}
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
                        ? '✓ আপডেট'
                        : '✓ Update'
                      : isBn
                      ? '✓ সংরক্ষণ'
                      : '✓ Save Address'}
                  </Text>
                </TouchableOpacity>
              </View>
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
    gap: 10,
    paddingHorizontal: 16,
    paddingTop:
      Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 10,
    paddingBottom: 10,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightOrange,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  navBtnIcon: { fontSize: 14, color: Colors.textMuted },
  navBtnTxt: { fontSize: 13, fontWeight: '700', color: Colors.textMain },

  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 40 },

  hero: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  heroInner: { flexDirection: 'row', alignItems: 'center', gap: 14, zIndex: 2 },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 2,
  },
  heroSub: { fontSize: 11, color: 'rgba(255,255,255,0.88)' },
  deco1: {
    position: 'absolute',
    right: -28,
    top: -24,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  deco2: {
    position: 'absolute',
    right: 20,
    bottom: -32,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },

  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    overflow: 'visible',
    shadowColor: Colors.shadow,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.lightOrange,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textMain,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  addFirstBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addFirstBtnTxt: { color: Colors.white, fontSize: 14, fontWeight: '700' },

  listHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  listTitle: { fontSize: 15, fontWeight: '800', color: Colors.textMain },
  listCount: { fontSize: 13, color: Colors.gray },
  addNewBtn: {
    backgroundColor: Colors.lightOrange,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addNewBtnTxt: { color: Colors.primary, fontSize: 12, fontWeight: '700' },

  addrCard: {
    borderWidth: 1,
    borderColor: Colors.disabled,
    borderRadius: 14,
    padding: 16,
    marginTop: 14,
    backgroundColor: Colors.ultraLightGray,
    position: 'relative',
  },
  addrCardDef: {
    borderColor: Colors.border,
    backgroundColor: Colors.warningBackground,
  },
  defBadge: {
    position: 'absolute',
    right: 14,
    top: -11,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  defBadgeTxt: { fontSize: 10, color: Colors.primary, fontWeight: '800' },

  addrTop: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  addrTypeBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
  addrName: { fontSize: 15, fontWeight: '800', color: Colors.textMain },
  addrPhone: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  relTag: { fontSize: 11, color: Colors.primary, fontWeight: '700' },

  addrBody: { paddingLeft: 54, marginBottom: 14 },
  addrMain: {
    fontSize: 14,
    color: Colors.textMain,
    fontWeight: '500',
    marginBottom: 3,
  },
  addrSub: { fontSize: 13, color: Colors.textMuted, lineHeight: 18 },
  coords: {
    fontSize: 11,
    color: Colors.gray,
    marginTop: 6,
    fontStyle: 'italic',
  },

  addrFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    paddingTop: 12,
  },
  defBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  defBtnActive: { backgroundColor: Colors.lightOrange },
  defBtnTxt: { fontSize: 12, color: Colors.gray, fontWeight: '600' },
  acBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.inputBg,
  },
  acBtnRed: { backgroundColor: Colors.tagRed },
  acBtnTxt: { fontSize: 11, fontWeight: '700', color: Colors.textMain },

  addMoreBtn: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: Colors.warningBackground,
    marginTop: 4,
  },
  addMoreBtnTxt: { color: Colors.primary, fontSize: 13, fontWeight: '700' },

  // Modal
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.52)',
    justifyContent: 'flex-end',
  },

  // Sheet: fixed height so flex:1 on the inner ScrollView has a parent height to work within.
  // maxHeight alone doesn't give the ScrollView a bounded height — it collapses the fields.
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    flexDirection: 'column',
  },

  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  sheetHeadIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.lightOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetHeadTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textMain,
  },
  sheetClose: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCloseTxt: { fontSize: 13, color: Colors.textMuted, fontWeight: 'bold' },

  // flex:1 on ScrollView means it expands to fill sheet height but won't push out the sticky footer
  sheetScroll: { flex: 1 },
  sheetForm: { padding: 20, paddingBottom: 8 },

  secHead: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    marginBottom: 14,
    letterSpacing: 0.4,
  },
  div: { height: 1, backgroundColor: Colors.lightGray, marginVertical: 20 },

  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.disabled,
    backgroundColor: Colors.ultraLightGray,
  },
  typeChipOn: {
    borderColor: Colors.primary,
    backgroundColor: Colors.lightOrange,
  },
  typeChipTxt: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  typeChipTxtOn: { color: Colors.primary, fontWeight: '700' },

  row: { flexDirection: 'row', gap: 10 },
  fieldWrap: { flex: 1, marginBottom: 14 },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 14,
    color: Colors.textMain,
    backgroundColor: Colors.ultraLightGray,
  },
  inputErr: { borderColor: ERROR_COLOR, backgroundColor: Colors.tagRed },
  errTxt: { fontSize: 11, color: ERROR_COLOR, marginTop: 4, fontWeight: '500' },

  locInfo: {
    backgroundColor: Colors.warningBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  locInfoTxt: { fontSize: 12, color: Colors.warningText, lineHeight: 18 },

  sheetFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    backgroundColor: Colors.white,
    // Extra padding at bottom for devices with home indicator
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.disabled,
    alignItems: 'center',
  },
  cancelTxt: { fontSize: 14, fontWeight: '700', color: Colors.textMuted },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  saveTxt: { fontSize: 14, fontWeight: '800', color: Colors.white },

  useLocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 10,
  },
  useLocBtnIcon: { fontSize: 16 },
  useLocBtnText: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  defaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningBackground,
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  defaultTitle: { fontSize: 14, fontWeight: '800', color: Colors.textMain },
  defaultSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
});
