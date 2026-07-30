const fs = require('fs');

const relativeLogic = fs.readFileSync('src/screens/profile/RelativeLogicBackup.ts', 'utf8');
const relativeUI = fs.readFileSync('src/screens/profile/RelativeUIBackup.tsx', 'utf8');

const newCode = `/* eslint-disable react-native/no-inline-styles */
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
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import { RefreshCcw, Pencil, MapPin, User, Flame, CalendarDays, Plus, Users } from 'lucide-react-native';
import {
  useGetUserDetailsQuery,
  useSaveRelativeDetailsMutation,
  useDeleteRelativeDetailsMutation,
  useGetGotraDetailsQuery,
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

  // APIs
  const { data: userDetails, isLoading, refetch } = useGetUserDetailsQuery(user?.user_id || 0, {
    skip: !user?.user_id,
  });
  const [saveRelativeMutation] = useSaveRelativeDetailsMutation();
  const [deleteRelativeMutation] = useDeleteRelativeDetailsMutation();
  const { data: gotraList = [] } = useGetGotraDetailsQuery();

  const userProfile = userDetails?.user_details || {};
  const userAddresses = userDetails?.user_addresses || [];

  // Routing Logic
  useEffect(() => {
    if (userDetails && userProfile) {
      if (!userProfile.first_name) {
        // First time save -> Redirect to UpdateProfileScreen
        navigation.replace('UpdateProfile');
      }
    }
  }, [userDetails, userProfile, navigation]);

  // Calculate completion percentage manually
  let filledFields = 0;
  const totalFields = 6;
  if (userProfile.first_name) filledFields++;
  if (userProfile.gender) filledFields++;
  if (userProfile.dob) filledFields++;
  if (userProfile.birth_place) filledFields++;
  if (userProfile.gotra_id) filledFields++;
  if (userAddresses.length > 0) filledFields++;
  
  const completionPercentage = Math.round((filledFields / totalFields) * 100);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Populate relatives when API loads
  useEffect(() => {
    if (userDetails?.user_relatives && Array.isArray(userDetails.user_relatives)) {
      const mapped: RelativeProfile[] = userDetails.user_relatives.map((r: any) => ({
        id: String(r.relative_id),
        dbId: r.relative_id,
        relationType: r.relation_type,
        relationTypeId: r.relation_id,
        firstName: r.first_name,
        lastName: r.last_name,
        gender: r.gender === 1 ? 'Male' : r.gender === 2 ? 'Female' : 'Others',
        dob: r.dob,
        timeOfBirth: r.time_of_birth,
        placeOfBirth: r.birth_place,
        gotra: r.gotra,
        gotraId: r.gotra_id,
        contact: r.mobile_no || '',
      }));
      setRelatives(mapped);
    }
  }, [userDetails]);

${relativeLogic}

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
        <TopNavBar />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={BRAND_ORANGE} />
        </View>
      </View>
    );
  }

  // If redirecting, render nothing to avoid flicker
  if (userDetails && !userProfile.first_name) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
        <TopNavBar />
      </View>
    );
  }

  const avatarInitial = userProfile.first_name ? userProfile.first_name.charAt(0).toUpperCase() : 'U';
  if (userProfile.last_name) {
     // avatarInitial += userProfile.last_name.charAt(0).toUpperCase();
  }
  
  const fullName = [userProfile.first_name, userProfile.last_name].filter(Boolean).join(' ') || 'User';

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" translucent={true} />
      <TopNavBar />

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

          {/* Profile Overview Card */}
          <View style={styles.overviewCard}>
            <View style={styles.overviewCardBg}>
              <Svg height="100%" width="100%">
                <Defs>
                  <SvgLinearGradient id="overviewGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#F97316" />
                    <Stop offset="100%" stopColor="#C2410C" />
                  </SvgLinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill="url(#overviewGrad)" />
              </Svg>
            </View>
            
            <View style={styles.overviewContent}>
              <View style={styles.overviewTop}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{avatarInitial}</Text>
                </View>
                <View style={styles.overviewTextWrap}>
                  <Text style={styles.overviewName}>{fullName}</Text>
                  {user?.mobile_no && <Text style={styles.overviewPhone}>📞 {user.mobile_no}</Text>}
                </View>
              </View>

              <View style={styles.progressWrap}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>{isBn ? 'প্রোফাইল সমাপ্তি' : 'Profile completion'}</Text>
                  <Text style={styles.progressValue}>{completionPercentage}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: \`\${completionPercentage}%\` }]} />
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
            <View style={styles.attentionCard}>
              <Text style={styles.attentionTitle}>{isBn ? 'আপনার প্রোফাইল সেট আপ শেষ করুন' : 'Finish setting up your profile'}</Text>
              <Text style={styles.attentionSub}>{isBn ? 'কিছু প্রোফাইল ক্ষেত্রের আপনার মনোযোগ প্রয়োজন।' : 'Some profile fields need your attention.'}</Text>
              <TouchableOpacity style={styles.attentionBtn} onPress={() => navigation.navigate('UpdateProfile')}>
                <Text style={styles.attentionBtnText}>{isBn ? 'প্রোফাইল সম্পূর্ণ করুন' : 'Complete profile'}</Text>
              </TouchableOpacity>
            </View>
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
              <DetailRow icon={<CalendarDays size={18} color="#D1D5DB" />} label={isBn ? 'জন্ম তারিখ' : 'DATE OF BIRTH'} value={userProfile.dob || (isBn ? 'প্রদান করা হয়নি' : 'Not provided')} />
              <DetailRow icon={<MapPin size={18} color="#D1D5DB" />} label={isBn ? 'জন্মস্থান' : 'BIRTH PLACE'} value={userProfile.birth_place || (isBn ? 'প্রদান করা হয়নি' : 'Not provided')} />
              <DetailRow icon={<User size={18} color="#D1D5DB" />} label={isBn ? 'লিঙ্গ' : 'GENDER'} value={userProfile.gender === 1 ? 'Male' : userProfile.gender === 2 ? 'Female' : userProfile.gender === 3 ? 'Others' : (isBn ? 'প্রদান করা হয়নি' : 'Not provided')} />
              <DetailRow icon={<Flame size={18} color="#D1D5DB" />} label={isBn ? 'গোত্র' : 'GOTRA'} value={userProfile.gotra || (isBn ? 'প্রদান করা হয়নি' : 'Not provided')} />
              <DetailRow icon={<MapPin size={18} color="#D1D5DB" />} label={isBn ? 'সংরক্ষিত ঠিকানা' : 'SAVED ADDRESS'} value={userAddresses.length > 0 ? \`\${userAddresses[0].house_no}, \${userAddresses[0].city}\` : (isBn ? 'প্রদান করা হয়নি' : 'Not provided')} />
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
                resetRelForm();
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
                    resetRelForm();
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
                      <TouchableOpacity onPress={() => handleDeleteRelative(rel.id, rel.dbId)} style={styles.relActionBtn}>
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

${relativeUI}

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
  pageTitle: { fontSize: 24, fontWeight: '300', color: BRAND_TEXT },
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
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  attentionTitle: { fontSize: 14, fontWeight: '800', color: '#9A3412', marginBottom: 4 },
  attentionSub: { fontSize: 12, color: BRAND_MUTED, marginBottom: 12 },
  attentionBtn: {
    backgroundColor: '#C2410C',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  attentionBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },

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
\`;

fs.writeFileSync('src/screens/profile/EditProfileScreen.tsx', newCode);
console.log('Successfully generated new EditProfileScreen.tsx');
