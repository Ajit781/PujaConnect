/* eslint-disable react-native/no-inline-styles */
import React, { useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  BackHandler,
  Image,
  StatusBar,
  Dimensions,
  FlatList,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { RootState } from '../../store';
import { performLogout } from '../../utils/authUtils';
import { clearNewLoginFlag } from '../../store/slices/authSlice';
import { useAlert } from '../../context/AlertContext';
import { useToast } from '../../context/ToastContext';
import { showLoader, hideLoader } from '../../store/slices/loaderSlice';
import { setCartItems } from '../../store/slices/cartSlice';
import { setFavorites } from '../../store/slices/wishlistSlice';
import {
  getSummaryCount,
  getAllPujaTags,
  getPujaByTag,
  PujaType,
  SummaryCount,
  PujaTag,
} from '../../service/api/dashboardService';
import {
  useGetPujaCartInfoQuery,
  useGetTagPujasQuery,
  useSavePujaTagMutation,
  useGetUserDetailsQuery,
} from '../../store/api/pujaApi';
import appLogo from '../../assets/images/Logo.png';
import NoDataFound from '../../components/common/NoDataFound';
import ProfileCompletionModal from '../../components/common/ProfileCompletionModal';
import ImagePlaceholder from '../../components/common/ImagePlaceholder';
import { Colors } from '../../constants/Colors';

const { width } = Dimensions.get('window');

const BRAND_PRIMARY = Colors.primary;
const BRAND_SECONDARY = Colors.splashRed;
const BRAND_BG = Colors.background;
const BRAND_TEXT = Colors.textMain;
const BRAND_MUTED = Colors.textMuted;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND_BG },

  // Header
  header: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    zIndex: 100,
  },
  headerInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoOm: { fontSize: 22, color: BRAND_TEXT },
  logoText: {
    fontSize: 22,
    fontWeight: '900',
    color: BRAND_TEXT,
    letterSpacing: -0.5,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  langPill: {
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  langPillText: { color: BRAND_TEXT, fontSize: 11, fontWeight: '700' },
  iconBtn: { padding: 6 },
  iconBtnText: { fontSize: 20, color: BRAND_TEXT },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BRAND_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF5F0',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarLoader: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: Colors.white, fontSize: 16, fontWeight: '900' },

  // Navigation chips
  navRow: { marginTop: 8, backgroundColor: Colors.white },
  navChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
    marginRight: 8,
  },
  navChipActive: { backgroundColor: BRAND_PRIMARY },
  navChipIcon: { fontSize: 14, marginRight: 5 },
  navChipLabel: { color: BRAND_MUTED, fontSize: 13, fontWeight: '500' },
  navChipLabelActive: { color: Colors.white, fontWeight: '700' },
  comingSoonBadge: {
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  comingSoonText: {
    color: '#E11D48',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // Body
  body: { flex: 1 },

  // Banner
  banner: {
    margin: 16,
    backgroundColor: BRAND_SECONDARY,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    overflow: 'hidden',
    height: 164,
  },
  bannerContent: { flex: 1 },
  bannerTitle: {
    color: Colors.background,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  bannerSub: {
    color: 'rgba(253,248,240,0.75)',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  bannerBtn: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  bannerBtnText: {
    color: BRAND_SECONDARY,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  bannerDecor: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 8,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  dot: { height: 6, borderRadius: 3, marginHorizontal: 4 },
  dotActive: { width: 18, backgroundColor: BRAND_PRIMARY },
  dotInactive: { width: 6, backgroundColor: Colors.cardBorder },

  // Stats
  horizontalScroll: {
    marginHorizontal: 16,
  },
  statsScrollContent: {
    paddingHorizontal: 8, // Room for shadows so they don't clip at the wall
    paddingVertical: 12,
    flexDirection: 'row',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 24,
    alignItems: 'center',
    marginRight: 16,
    width: 160,
    elevation: 6,
    shadowColor: BRAND_PRIMARY,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
    backgroundColor: '#FDF2F2',
    width: 50,
    height: 50,
    borderRadius: 25,
    textAlign: 'center',
    lineHeight: 50,
    overflow: 'hidden',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: BRAND_PRIMARY,
    letterSpacing: 0.2,
  },
  statLabel: {
    fontSize: 12,
    color: BRAND_MUTED,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '600',
  },

  // Section header
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: BRAND_TEXT,
    letterSpacing: -0.5,
  },
  sectionSub: {
    fontSize: 13,
    color: BRAND_MUTED,
    marginTop: 4,
    lineHeight: 18,
  },

  // Controls (Filter & Search)
  controlsWrap: { paddingHorizontal: 16, marginBottom: 16 },
  filterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  filterLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: BRAND_TEXT,
    marginRight: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginRight: 6,
    backgroundColor: Colors.white,
  },
  filterChipActive: {
    backgroundColor: BRAND_PRIMARY,
    borderColor: BRAND_PRIMARY,
  },
  filterChipText: { fontSize: 12, fontWeight: '600', color: BRAND_MUTED },
  filterChipTextActive: { color: Colors.white },
  countBadge: {
    backgroundColor: Colors.lightOrange,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: { fontSize: 10, fontWeight: '700', color: BRAND_PRIMARY },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: BRAND_TEXT },

  // Puja cards Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    overflow: 'hidden',
  },
  cardImgBox: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    padding: 6,
  },
  popularBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.gold,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  popularBadgeText: { color: Colors.white, fontSize: 10, fontWeight: '800' },
  cardBody: { padding: 12 },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: BRAND_TEXT,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 11,
    color: BRAND_MUTED,
    lineHeight: 16,
    marginBottom: 8,
  },
  durationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  durationIcon: { fontSize: 12, marginRight: 4 },
  durationText: { fontSize: 11, color: BRAND_MUTED, fontWeight: '500' },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    paddingTop: 8,
  },
  priceLabel: {
    fontSize: 9,
    color: BRAND_MUTED,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  priceValue: { fontSize: 13, fontWeight: '800', color: BRAND_TEXT },
  ratingValue: { fontSize: 12, fontWeight: '800', color: Colors.gold },
  bookBtn: {
    backgroundColor: BRAND_PRIMARY,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  bookBtnDisabled: { backgroundColor: Colors.disabled },
  bookBtnText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  bookBtnTextDisabled: { color: Colors.gray },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateEmoji: { fontSize: 40, marginBottom: 12 },
  emptyStateText: { color: BRAND_MUTED, fontSize: 14, textAlign: 'center' },

  // Popover Menu
  popoverOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)', // Very light dim
  },
  popoverBox: {
    position: 'absolute',
    top: 60, // Place it right below the header
    right: 16,
    width: 200,
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingVertical: 12,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 10,
  },
  popoverHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  popoverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.lightOrange,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#FFF',
    overflow: 'hidden',
  },
  popoverAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  popoverAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: BRAND_PRIMARY,
  },
  popoverUserName: { fontSize: 15, fontWeight: '800', color: BRAND_TEXT },
  popoverUserPhone: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 2,
    fontWeight: '500',
  },
  popoverDivider: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginVertical: 4,
  },

  popoverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  popoverItemIconOrange: { fontSize: 16, marginRight: 12, opacity: 0.8 },
  popoverItemText: {
    fontSize: 14,
    color: Colors.textMuted,
    flex: 1,
    fontWeight: '500',
  },
  redDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.red },

  popoverItemIconRed: { fontSize: 16, marginRight: 12, opacity: 0.8 },
  popoverItemTextRed: { fontSize: 14, color: Colors.red, fontWeight: '500' },

  headerLogo: { width: 110, height: 36, resizeMode: 'contain' },
  navRowContent: { paddingHorizontal: 8, paddingBottom: 12 },
  carouselContainer: { paddingTop: 16 },
  bannerWrapper: { width: width - 32 },
  bannerZeroMargin: { margin: 0, marginHorizontal: 8 },
  bannerIcon: { fontSize: 60 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  showMoreText: { color: BRAND_PRIMARY, fontSize: 13, fontWeight: '700' },
  featuredListContent: { paddingHorizontal: 8, paddingVertical: 4 },
  featuredCard: { width: 240, marginRight: 16, marginBottom: 4 },
  featuredImgText: { fontSize: 44 },
  ratingText: {
    fontSize: 11,
    color: Colors.gold,
    fontWeight: '700',
    marginLeft: 6,
  },
  heartIconText: { fontSize: 16 },
  ratingCol: { alignItems: 'flex-end' },
  bottomSpacer: { height: 40 },
  pujaIconImage: {
    width: '100%',
    height: '100%',
  },

  cartBtn: {
    position: 'relative',
    padding: 4,
  },
  cartIconText: { fontSize: 24 },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: Colors.red,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: { color: Colors.white, fontSize: 10, fontWeight: '800' },

  sectionLoaderBox: {
    padding: 30,
    width: 200,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  centeredSectionLoader: {
    width: '100%',
    height: 285,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  loaderText: {
    fontSize: 13,
    color: BRAND_MUTED,
    fontWeight: '500',
  },
  showMoreCard: {
    width: 140,
    height: 285,
    marginRight: 16,
    marginBottom: 4,
    justifyContent: 'center',
  },
  showMoreCardInner: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.redLight,
    borderStyle: 'dashed',
    borderRadius: 16,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  showMoreIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.tagRed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  showMoreIcon: {
    fontSize: 20,
    color: BRAND_PRIMARY,
    fontWeight: 'bold',
  },
  showMoreCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: BRAND_TEXT,
    textAlign: 'center',
  },
  showMoreCardSub: {
    fontSize: 11,
    color: BRAND_MUTED,
    marginTop: 2,
    fontWeight: '600',
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFD4B0',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  filterDropdownText: {
    fontSize: 14,
    fontWeight: '800',
    color: BRAND_PRIMARY,
  },
  dropdownArrow: {
    fontSize: 10,
    color: BRAND_PRIMARY,
    opacity: 0.8,
  },
});

const DASHBOARD_BANNERS = [
  {
    id: '1',
    titleEn: 'Spiritual Guidance',
    titleBn: 'আধ্যাত্মিক নির্দেশনা',
    subEn: 'Connect with ancient traditions and wisdom',
    subBn: 'প্রাচীন ঐতিহ্য এবং জ্ঞানের সাথে সংযুক্ত হন',
    btnEn: 'Explore Now',
    btnBn: 'এখনই অন্বেষণ করুন',
    icon: '🕉️',
  },
  {
    id: '2',
    titleEn: 'Holy Ceremonies',
    titleBn: 'পবিত্র অনুষ্ঠান',
    subEn: 'Participate in sacred rituals near you',
    subBn: 'আপনার কাছাকাছি পবিত্র আচার-অনুষ্ঠানে অংশগ্রহণ করুন',
    btnEn: 'Join Now',
    btnBn: 'এখনই যোগ দিন',
    icon: '✨',
  },
  {
    id: '3',
    titleEn: 'Divine Pujas',
    titleBn: 'ঐশ্বরিক পূজা',
    subEn: 'Book authentic pandits for your home ceremonies',
    subBn: 'আপনার বাড়ির অনুষ্ঠানের জন্য প্রামাণ্য পণ্ডিত বুক করুন',
    btnEn: 'Book Puja',
    btnBn: 'পূজা বুক করুন',
    icon: '🌺',
  },
];

const NAV_ITEMS = [
  { key: 'puja', labelEn: 'Puja Service', labelBn: 'পূজা সার্ভিস', icon: '🔥' },
  {
    key: 'temple',
    labelEn: 'Temple Darshan',
    labelBn: 'মন্দির দর্শন',
    icon: '🛕',
    comingSoon: true,
  },
  {
    key: 'pujaPart',
    labelEn: 'Puja Participation',
    labelBn: 'পূজায় অংশগ্রহণ',
    icon: '🙏',
    comingSoon: true,
  },
  {
    key: 'astro',
    labelEn: 'Astrology',
    labelBn: 'জ্যোতিষ',
    icon: '⭐',
    comingSoon: true,
  },
  {
    key: 'help',
    labelEn: 'Help',
    labelBn: 'সাহায্য',
    icon: '💬',
    comingSoon: true,
  },
];

const BannerItem = React.memo(({ item, isBn, navigation }: any) => (
  <View style={styles.bannerWrapper}>
    <View style={[styles.banner, styles.bannerZeroMargin]}>
      <View style={styles.bannerContent}>
        <Text style={styles.bannerTitle}>
          {isBn ? item.titleBn : item.titleEn}
        </Text>
        <Text style={styles.bannerSub}>{isBn ? item.subBn : item.subEn}</Text>
        <TouchableOpacity
          style={styles.bannerBtn}
          onPress={() => navigation.navigate('AllPujas')}
        >
          <Text style={styles.bannerBtnText}>
            {isBn ? item.btnBn : item.btnEn}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.bannerDecor}>
        <Text style={styles.bannerIcon}>{item.icon}</Text>
      </View>
    </View>
  </View>
));

export default function DashboardScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { showAlert } = useAlert();
  const { showToast } = useToast();
  const user = useSelector((state: RootState) => state.auth.user);
  const { favorites } = useSelector((state: RootState) => state.wishlist);
  const { items: cartItems } = useSelector((state: RootState) => state.cart);
  const { i18n, t } = useTranslation();
  const isBn = i18n.language === 'bn';

  const [activeBanner, setActiveBanner] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const [pujas, setPujas] = useState<PujaType[]>([]);
  const [pujaTags, setPujaTags] = useState<PujaTag[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<number>(1); // Default to 'All'
  const [summaryData, setSummaryData] = useState<SummaryCount | null>(null);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [isLoadingPujas, setIsLoadingPujas] = React.useState(false);
  const [headerImageLoading, setHeaderImageLoading] = React.useState(false);
  const [showProfileCompletionModal, setShowProfileCompletionModal] =
    useState(false);
  const flatListRef = React.useRef<FlatList>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  // Fetch user profile for full name in popover
  const {
    data: userDetails,
    isSuccess: userDetailsLoaded,
    isError: userDetailsError,
    refetch: refetchUserDetails,
  } = useGetUserDetailsQuery(user?.user_id ?? 0, {
    skip: !user?.user_id || user.user_id === 0,
    skipGlobalLoader: true,
  } as any);

  const { isNewLogin } = useSelector((state: RootState) => state.auth);

  // ── Profile Completion Modal ─────────────────────────────────────────────
  React.useEffect(() => {
    const userId = user?.user_id;

    // ONLY SHOW after a fresh login
    if (!isNewLogin) return;
    if (!userId) return;

    // Wait until the user details query definitively succeeds or fails
    if (!userDetailsLoaded && !userDetailsError) return;

    // We now have the definitive result. Check the percentage.
    const rawPct = userDetails?.ctnz_profile_progress_percent;
    const pct =
      rawPct !== null && rawPct !== undefined && rawPct !== ''
        ? parseFloat(String(rawPct))
        : null;

    console.log('[ProfileModal] check — pct:', pct, 'raw:', rawPct);

    // Disable the flag IMMEDIATELY so we never re-evaluate this login
    dispatch(clearNewLoginFlag());

    // If the profile is 100% complete, do NOT show the modal
    if (pct !== null && !isNaN(pct) && pct >= 100) {
      return; // done, won't show
    }

    // Otherwise, show the modal after a small delay for smooth UX
    setTimeout(() => {
      setShowProfileCompletionModal(true);
    }, 600);
  }, [
    user?.user_id,
    userDetailsLoaded,
    userDetailsError,
    userDetails,
    isNewLogin,
    dispatch,
  ]);

  // Sync cart from server
  const { data: serverCartItems, refetch: refetchCartInfo } =
    useGetPujaCartInfoQuery(
      {
        userId: user?.user_id || 0,
        pageNo: 1,
        limit: 1000,
      },
      { skip: !user?.user_id },
    );

  React.useEffect(() => {
    if (serverCartItems) {
      const mappedItems = serverCartItems.map(item => ({
        cartItemId: item.cart_item_id.toString(),
        pujaId: item.puja_id.toString(),
        titleEn: item.puja_name,
        titleBn: item.puja_name,
        exactPrice: item.pkg_price,
        exactPriceBn: `₹${item.pkg_price.toLocaleString('en-IN')}`,
        selectedDate: item.preferred_puja_date,
        selectedTime: item.preferred_puja_time,
        imagePlaceholder: item.icon || '🛕',
        color: Colors.white,
        cart_id: item.cart_id,
        cart_item_id: item.cart_item_id,
      }));
      dispatch(setCartItems(mappedItems));
    }
  }, [serverCartItems, dispatch]);

  // Sync favorites from server
  const WISHLIST_TAG_ID = 3;
  const { data: wishlistPujas, refetch: refetchWishlist } = useGetTagPujasQuery(
    {
      userId: user?.user_id || 0,
      tagId: WISHLIST_TAG_ID,
      pageNo: 1,
      limit: 100, // Fetch first 100 to sync local heart icons
    },
    { skip: !user?.user_id, skipGlobalLoader: true } as any,
  );

  const [savePujaTag] = useSavePujaTagMutation();

  React.useEffect(() => {
    if (wishlistPujas) {
      const favIds = wishlistPujas.map(p =>
        (p.puja_id || p.puja_type_id || '').toString(),
      );
      dispatch(setFavorites(favIds));
    }
  }, [wishlistPujas, dispatch]);

  const handleToggleFavoriteServer = async (pujaId: string) => {
    if (!user?.user_id) return;

    const isCurrentlyFav = favorites.includes(pujaId);
    // Optimistic toggle is now handled in pujaApi.ts via onQueryStarted

    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      showToast({
        message: t('common.connectionRequired'),
        type: 'error',
      });
      return;
    }

    try {
      await savePujaTag({
        userId: user.user_id,
        pujaId: parseInt(pujaId, 10),
        tagId: WISHLIST_TAG_ID,
        action: isCurrentlyFav ? 5 : 1,
        skipGlobalLoader: true,
      }).unwrap();

      showToast({
        message: isCurrentlyFav
          ? isBn
            ? 'ফেভারিট থেকে সরানো হয়েছে'
            : 'Removed from favourite'
          : isBn
          ? 'ফেভারিটে যোগ করা হয়েছে'
          : 'Added to favourite',
        type: 'success',
      });
    } catch (error) {
      console.error('Wishlist sync failed:', error);
      showToast({
        message: isBn
          ? 'ফেভারিট আপডেট করতে ব্যর্থ হয়েছে'
          : 'Failed to update favourite',
        type: 'error',
      });
      // Rollback is handled in pujaApi.ts onQueryStarted catch block
    }
  };

  // Build a large repeated array so we can scroll forward forever with no snap-back
  const REPEAT_COUNT = 20;
  const CAROUSEL_DATA = React.useMemo(() => {
    const arr: typeof DASHBOARD_BANNERS = [];
    for (let i = 0; i < REPEAT_COUNT; i++) {
      DASHBOARD_BANNERS.forEach((b, j) => arr.push({ ...b, id: `${i}_${j}` }));
    }
    return arr;
  }, []);
  const START_INDEX = Math.floor(REPEAT_COUNT / 2) * DASHBOARD_BANNERS.length;

  const onRefresh = React.useCallback(async () => {
    if (!user?.user_id) return;
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      showToast({
        message: t('common.connectionRequired'),
        type: 'error',
      });
      return;
    }
    setRefreshing(true);
    try {
      await Promise.all([
        refetchUserDetails(),
        refetchCartInfo(),
        refetchWishlist(),
        (async () => {
          const [summaryRes, tagsData] = await Promise.all([
            getSummaryCount(),
            getAllPujaTags(),
          ]);
          setSummaryData(summaryRes);
          setPujaTags(tagsData);
        })(),
        (async () => {
          const data = await getPujaByTag(user.user_id, selectedTagId, 1, 10);
          setPujas(data);
        })(),
      ]);
    } catch (err) {
      console.error('Dashboard refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  }, [
    user?.user_id,
    selectedTagId,
    refetchUserDetails,
    refetchCartInfo,
    refetchWishlist,
    showToast,
    t,
  ]);

  const isFirstConn = React.useRef(true);
  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (isFirstConn.current) {
        isFirstConn.current = false;
        return;
      }
      if (state.isConnected) {
        onRefresh();
      }
    });
    return () => unsubscribe();
  }, [onRefresh]);

  // Fetch initial data (summary and tags)
  React.useEffect(() => {
    const fetchInitialData = async () => {
      if (!user?.user_id) return;
      dispatch(showLoader());
      try {
        const [summaryRes, tagsData] = await Promise.all([
          getSummaryCount(),
          getAllPujaTags(),
        ]);
        setSummaryData(summaryRes);
        setPujaTags(tagsData);
      } catch (error) {
        console.error('Error fetching dashboard summary/tags:', error);
      } finally {
        dispatch(hideLoader());
      }
    };
    fetchInitialData();

    requestAnimationFrame(() => {
      flatListRef.current?.scrollToOffset({
        offset: START_INDEX * (width - 32),
        animated: false,
      });
    });
  }, [START_INDEX, dispatch, user?.user_id]);

  // Fetch pujas when tag changes
  React.useEffect(() => {
    const fetchPujas = async () => {
      if (!user?.user_id) return;
      setIsLoadingPujas(true);
      try {
        const data = await getPujaByTag(user.user_id, selectedTagId, 1, 10);
        setPujas(data);
      } catch (error) {
        console.error('Error fetching pujas by tag:', error);
      } finally {
        setIsLoadingPujas(false);
      }
    };
    fetchPujas();
  }, [user?.user_id, selectedTagId]);

  // Auto-scroll banners — just keep going forward, reset when near end
  const currentIndexRef = React.useRef(START_INDEX);
  React.useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      let idx = currentIndexRef.current + 1;

      // Perpetual loop logic: if we approach the end of CAROUSEL_DATA,
      // snap back to the equivalent in the middle without animation.
      if (idx >= CAROUSEL_DATA.length - 1) {
        idx = START_INDEX + (idx % DASHBOARD_BANNERS.length);
        flatListRef.current?.scrollToOffset({
          offset: idx * (width - 32),
          animated: false,
        });
      } else {
        flatListRef.current?.scrollToOffset({
          offset: idx * (width - 32),
          animated: true,
        });
      }

      currentIndexRef.current = idx;
      setActiveBanner(idx % DASHBOARD_BANNERS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused, CAROUSEL_DATA.length, START_INDEX]);

  // Back-button exits the app with a confirmation rather than going to login
  useFocusEffect(
    React.useCallback(() => {
      const onBack = () => {
        showAlert({
          title: 'Exit App',
          message: 'Do you want to exit the app?',
          buttons: [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Exit',
              style: 'destructive',
              onPress: () => BackHandler.exitApp(),
            },
          ],
        });
        return true; // prevent default (going back)
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => sub.remove();
    }, [showAlert]),
  );

  const handleLogout = () => {
    showAlert({
      title: isBn ? 'লগআউট' : 'Logout',
      message: isBn
        ? 'আপনি কি নিশ্চিত যে লগআউট করতে চান?'
        : 'Are you sure you want to logout?',
      buttons: [
        { text: isBn ? 'বাতিল' : 'Cancel', style: 'cancel' },
        {
          text: isBn ? 'লগআউট' : 'Logout',
          style: 'destructive',
          onPress: async () => {
            const state = await NetInfo.fetch();
            if (state.isConnected) {
              performLogout();
            } else {
              showToast({
                message: t('common.connectionRequired'),
                type: 'error',
              });
            }
          },
        },
      ],
    });
  };

  const showComingSoonMessage = (
    featureNameEn: string,
    featureNameBn: string,
  ) => {
    showAlert({
      title: isBn ? 'শীঘ্রই আসছে' : 'Coming Soon',
      message: isBn
        ? `${featureNameBn} বর্তমানে উন্নয়নাধীন। পরবর্তী আপডেটের জন্য সাথে থাকুন!`
        : `${featureNameEn} is currently under development. Stay tuned for updates!`,
      buttons: [{ text: isBn ? 'ঠিক আছে' : 'OK' }],
    });
  };

  // Filtering logic - since the API now does the heavy lifting, we just show what we got
  // However, we still need to handle 'Favourite' locally if the API doesn't filter it correctly
  // but the server should handle it based on puja_tag_id: 3.
  const filteredPujas = pujas;

  const getTagName = (tagId: number) => {
    const tagObj = pujaTags.find((tag: PujaTag) => tag.tag_id === tagId);
    if (!tagObj) return isBn ? 'বৈশিষ্ট্যযুক্ত' : 'Featured';

    if (isBn) {
      if (tagObj.tag_value === 'All') return 'সব';
      if (tagObj.tag_value === 'Featured') return 'বৈশিষ্ট্যযুক্ত';
      if (tagObj.tag_value === 'Favourite') return 'প্রিয়';
      if (tagObj.tag_value === 'Popular') return 'জনপ্রিয়';
    }
    return tagObj.tag_value;
  };

  const handleNavClick = (item: any) => {
    if (item.comingSoon) {
      showComingSoonMessage(item.labelEn, item.labelBn);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />
      {/* ── Top Header ── */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerInner}>
          {/* Logo */}
          <View style={styles.logoRow}>
            <Image source={appLogo} style={styles.headerLogo} />
          </View>

          {/* Right actions */}
          <View style={styles.headerActions}>
            {/* Language toggle */}
            {/* Header icons */}
            <TouchableOpacity
              onPress={async () => {
                const state = await NetInfo.fetch();
                if (state.isConnected) {
                  navigation.navigate('Wishlist');
                } else {
                  showToast({
                    message: t('common.connectionRequired'),
                    type: 'error',
                  });
                }
              }}
              style={styles.cartBtn}
            >
              <Text style={styles.iconBtnText}>❤️</Text>
              {favorites.length > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{favorites.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                const state = await NetInfo.fetch();
                if (state.isConnected) {
                  navigation.navigate('Cart');
                } else {
                  showToast({
                    message: t('common.connectionRequired'),
                    type: 'error',
                  });
                }
              }}
              style={styles.cartBtn}
            >
              <Text style={styles.iconBtnText}>🛒</Text>
              {cartItems.length > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            {/* User avatar - Updated logic */}
            <TouchableOpacity
              onPress={async () => {
                const state = await NetInfo.fetch();
                if (state.isConnected) {
                  setShowProfileMenu(true);
                } else {
                  showToast({
                    message: t('common.connectionRequired'),
                    type: 'error',
                  });
                }
              }}
              style={styles.avatar}
            >
              <Image
                source={
                  userDetails?.ctnz_profile_image || user?.profile_image
                    ? {
                        uri:
                          userDetails?.ctnz_profile_image ||
                          user?.profile_image,
                      }
                    : require('../../assets/Placeholder_Person_3A7BFF.png')
                }
                style={styles.avatarImage}
                onLoadStart={() => setHeaderImageLoading(true)}
                onLoadEnd={() => setHeaderImageLoading(false)}
              />
              {headerImageLoading && (
                <View style={[styles.avatarImage, styles.avatarLoader]}>
                  <ActivityIndicator size="small" color="#FF6F00" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Nav chips ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.navRow, styles.horizontalScroll]}
          contentContainerStyle={styles.navRowContent}
        >
          {NAV_ITEMS.map((item, idx) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.navChip, idx === 0 && styles.navChipActive]}
              onPress={() => handleNavClick(item)}
            >
              <Text style={styles.navChipIcon}>{item.icon}</Text>
              <Text
                style={[
                  styles.navChipLabel,
                  idx === 0 && styles.navChipLabelActive,
                ]}
              >
                {isBn ? item.labelBn : item.labelEn}
              </Text>
              {item.comingSoon && (
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>
                    {isBn ? 'শীঘ্রই' : 'SOON'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Body ── */}
      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[BRAND_PRIMARY]}
            tintColor={BRAND_PRIMARY}
          />
        }
      >
        {/* Banner Carousel */}
        <View style={styles.carouselContainer}>
          <FlatList
            ref={flatListRef}
            data={CAROUSEL_DATA}
            horizontal
            pagingEnabled
            style={styles.horizontalScroll}
            keyExtractor={item => item.id}
            getItemLayout={(data, index) => ({
              length: width - 32,
              offset: (width - 32) * index,
              index,
            })}
            renderItem={({ item }) => (
              <BannerItem
                item={item}
                isBn={isBn}
                width={width}
                navigation={navigation}
              />
            )}
            initialNumToRender={1}
            maxToRenderPerBatch={2}
            windowSize={3}
            removeClippedSubviews={Platform.OS === 'android'}
            onScrollBeginDrag={() => setIsPaused(true)}
            onScrollEndDrag={() => setIsPaused(false)}
            onMomentumScrollEnd={e => {
              const index = Math.round(
                e.nativeEvent.contentOffset.x / (width - 32),
              );
              currentIndexRef.current = index;
              setActiveBanner(index % DASHBOARD_BANNERS.length);
              setIsPaused(false);
            }}
          />
          {/* Pagination Dots */}
          <View style={styles.paginationRow}>
            {DASHBOARD_BANNERS.map((_, i) => {
              const isDotActive = i === activeBanner % DASHBOARD_BANNERS.length;
              return (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    isDotActive ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              );
            })}
          </View>
        </View>

        {/* Stats row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalScroll}
          contentContainerStyle={styles.statsScrollContent}
        >
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>👨‍👩‍👧‍👦</Text>
            <Text style={styles.statValue}>
              {summaryData?.total_user_qty || 0}
            </Text>
            <Text style={styles.statLabel}>
              {isBn ? 'সুখী পরিবার' : 'Happy Families'}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🧘</Text>
            <Text style={styles.statValue}>
              {summaryData?.total_registered_priest_qty || 0}
            </Text>
            <Text style={styles.statLabel}>
              {isBn ? 'যাচাইকৃত পুরোহিত' : 'Verified Priests'}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🛕</Text>
            <Text style={styles.statValue}>
              {summaryData?.total_temple_qty || 0}
            </Text>
            <Text style={styles.statLabel}>
              {isBn ? 'পার্টনার মন্দির' : 'Partner Temples'}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={styles.statValue}>
              {summaryData?.total_astrologer_qty || 0}
            </Text>
            <Text style={styles.statLabel}>
              {isBn ? 'জ্যোতিষী' : 'Astrologers'}
            </Text>
          </View>
        </ScrollView>

        {/* Featured Pujas Header */}
        <View style={[styles.sectionHeader, styles.sectionHeaderRow]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>
              {getTagName(selectedTagId)} {isBn ? 'পূজা' : 'Pujas'}
            </Text>
            <Text style={styles.sectionSub}>
              {isBn
                ? 'আপনার পছন্দের পূজাগুলো এখান থেকে বেছে নিন'
                : 'Select your preferred pujas from here'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.filterDropdown}
            onPress={async () => {
              const state = await NetInfo.fetch();
              if (state.isConnected) {
                setShowTagMenu(true);
              } else {
                showToast({
                  message: t('common.connectionRequired'),
                  type: 'error',
                });
              }
            }}
          >
            <Text style={styles.filterDropdownText}>
              {getTagName(selectedTagId)}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Horizontal Puja List */}
        {isLoadingPujas ? (
          <View style={styles.centeredSectionLoader}>
            <ActivityIndicator size="small" color={BRAND_PRIMARY} />
            <Text style={styles.loaderText}>
              {isBn ? 'লোড হচ্ছে...' : 'Loading...'}
            </Text>
          </View>
        ) : filteredPujas.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScroll}
            contentContainerStyle={styles.featuredListContent}
          >
            {filteredPujas.slice(0, 5).map(puja => {
              const pId = puja.puja_id || puja.puja_type_id;
              const pName = puja.puja_name || puja.puja_type_name;
              const pMinPrice =
                puja.minimum_price || puja.puja_with_samagri_amount;
              const pMaxPrice =
                puja.maximum_price || puja.puja_without_samagri_amount;
              const pPrice =
                pMinPrice === pMaxPrice
                  ? `₹${pMinPrice.toLocaleString('en-IN')}`
                  : `₹${pMinPrice.toLocaleString(
                      'en-IN',
                    )} - ₹${pMaxPrice.toLocaleString('en-IN')}`;
              const pDuration =
                puja.duration ||
                (puja.puja_duration ? puja.puja_duration.toString() : '');
              const pRating = puja.puja_rating || 5;

              return (
                <View
                  key={pId || Math.random()}
                  style={[styles.gridCard, styles.featuredCard]}
                >
                  <View style={styles.cardImgBox}>
                    {puja.icon ? (
                      <Image
                        source={{ uri: puja.icon }}
                        style={styles.pujaIconImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <ImagePlaceholder />
                    )}
                    <TouchableOpacity
                      style={styles.heartBtn}
                      onPress={async () => {
                        const state = await NetInfo.fetch();
                        if (state.isConnected) {
                          pId && handleToggleFavoriteServer(pId.toString());
                        } else {
                          showToast({
                            message: t('common.connectionRequired'),
                            type: 'error',
                          });
                        }
                      }}
                    >
                      <Text style={styles.heartIconText}>
                        {favorites.includes(pId.toString()) ? '❤️' : '🤍'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {pName}
                    </Text>
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {puja.description ||
                        puja.puja_description ||
                        (isBn
                          ? 'পবিত্র অনুষ্ঠান আপনার কাছাকাছি'
                          : 'Holy ceremony near you')}
                    </Text>

                    <View style={styles.priceRow}>
                      <View style={styles.durationRow}>
                        <Text style={styles.durationIcon}>⏱️</Text>
                        <Text style={styles.durationText}>
                          {pDuration} {isBn ? 'ঘন্টা' : 'Hrs'}
                        </Text>
                        <Text style={styles.ratingText}> ⭐{pRating}</Text>
                      </View>
                      <Text style={styles.priceValue}>{pPrice}</Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.bookBtn,
                        puja.puja_active_status === 0 && styles.bookBtnDisabled,
                      ]}
                      disabled={puja.puja_active_status === 0}
                      onPress={() => {
                        NetInfo.fetch().then(state => {
                          if (state.isConnected) {
                            navigation.navigate('PujaDetails', {
                              pujaId: pId.toString(),
                              pujaData: puja,
                            });
                          } else {
                            showToast({
                              message: t('common.connectionRequired'),
                              type: 'error',
                            });
                          }
                        });
                      }}
                    >
                      <Text
                        style={[
                          styles.bookBtnText,
                          puja.puja_active_status === 0 &&
                            styles.bookBtnTextDisabled,
                        ]}
                      >
                        {puja.puja_active_status === 0
                          ? isBn
                            ? 'উপলব্ধ নেই'
                            : 'Not Available'
                          : isBn
                          ? 'বুক করুন →'
                          : 'Book Now →'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {/* View All Card */}
            {filteredPujas.length > 5 && (
              <TouchableOpacity
                style={styles.showMoreCard}
                onPress={async () => {
                  const state = await NetInfo.fetch();
                  if (state.isConnected) {
                    navigation.navigate('AllPujas', {
                      initialTagId: selectedTagId,
                    });
                  } else {
                    showToast({
                      message: t('common.connectionRequired'),
                      type: 'error',
                    });
                  }
                }}
              >
                <View style={styles.showMoreCardInner}>
                  <View style={styles.showMoreIconCircle}>
                    <Text style={styles.showMoreIcon}>→</Text>
                  </View>
                  <Text style={styles.showMoreCardTitle}>
                    {isBn ? 'সব দেখুন' : 'View All'}
                  </Text>
                  <Text style={styles.showMoreCardSub}>
                    {filteredPujas.length - 5} {isBn ? 'আরো আছে' : 'more'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </ScrollView>
        ) : (
          <NoDataFound
            message={isBn ? 'কোনো পূজা পাওয়া যায়নি' : 'No pujas found'}
            containerHeight={250}
          />
        )}

        <View
          style={[
            styles.bottomSpacer,
            { height: Math.max(60, insets.bottom + 10) },
          ]}
        />
      </ScrollView>

      {/* Profile Popover Menu */}
      {showProfileMenu && (
        <View
          style={[StyleSheet.absoluteFill, { zIndex: 99999, elevation: 99999 }]}
        >
          <TouchableWithoutFeedback onPress={() => setShowProfileMenu(false)}>
            <View style={styles.popoverOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.popoverBox}>
                  <View style={styles.popoverHeader}>
                    <View
                      style={{
                        flex: 1,
                        alignItems: 'flex-start',
                        paddingLeft: 5,
                      }}
                    >
                      <Text style={styles.popoverUserName}>
                        {userDetails?.ctnz_full_name ||
                          user?.user_name ||
                          'User'}
                      </Text>
                      <Text style={styles.popoverUserPhone}>
                        {user?.user_name || ''}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.popoverDivider} />

                  <TouchableOpacity
                    style={styles.popoverItem}
                    onPress={async () => {
                      const state = await NetInfo.fetch();
                      if (state.isConnected) {
                        setShowProfileMenu(false);
                        navigation.navigate('EditProfile');
                      } else {
                        showToast({
                          message: t('common.connectionRequired'),
                          type: 'error',
                        });
                      }
                    }}
                  >
                    <Text style={styles.popoverItemIconOrange}>👤</Text>
                    <Text style={styles.popoverItemText}>
                      {isBn ? 'প্রোফাইল সম্পাদন' : 'Edit Profile'}
                    </Text>
                    <View style={styles.redDot} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.popoverItem}
                    onPress={async () => {
                      const state = await NetInfo.fetch();
                      if (state.isConnected) {
                        setShowProfileMenu(false);
                        navigation.navigate('Address');
                      } else {
                        showToast({
                          message: t('common.connectionRequired'),
                          type: 'error',
                        });
                      }
                    }}
                  >
                    <Text style={styles.popoverItemIconOrange}>📍</Text>
                    <Text style={styles.popoverItemText}>
                      {isBn ? 'সংরক্ষিত ঠিকানা' : 'Saved Addresses'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.popoverItem}
                    onPress={async () => {
                      const state = await NetInfo.fetch();
                      if (state.isConnected) {
                        setShowProfileMenu(false);
                        navigation.navigate('Orders');
                      } else {
                        showToast({
                          message: t('common.connectionRequired'),
                          type: 'error',
                        });
                      }
                    }}
                  >
                    <Text style={styles.popoverItemIconOrange}>🕔</Text>
                    <Text style={styles.popoverItemText}>
                      {isBn ? 'অর্ডার সমূহ' : 'Orders'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.popoverDivider} />

                  <TouchableOpacity
                    style={styles.popoverItem}
                    onPress={() => {
                      setShowProfileMenu(false);
                      handleLogout();
                    }}
                  >
                    <Text style={styles.popoverItemIconRed}>🚪</Text>
                    <Text style={styles.popoverItemTextRed}>
                      {isBn ? 'লগআউট' : 'Log out'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </View>
      )}

      {/* Tag Filter Popover Menu */}
      {showTagMenu && (
        <View
          style={[StyleSheet.absoluteFill, { zIndex: 99999, elevation: 99999 }]}
        >
          <TouchableWithoutFeedback onPress={() => setShowTagMenu(false)}>
            <View style={styles.popoverOverlay}>
              <TouchableWithoutFeedback>
                <View
                  style={[
                    styles.popoverBox,
                    { top: '50%', alignSelf: 'center', width: '80%' },
                  ]}
                >
                  <View style={styles.popoverHeader}>
                    <Text style={styles.popoverUserName}>
                      {isBn ? 'ফিল্টার নির্বাচন করুন' : 'Select Filter'}
                    </Text>
                  </View>
                  <View style={styles.popoverDivider} />

                  {pujaTags.map(tag => (
                    <TouchableOpacity
                      key={tag.tag_id}
                      style={styles.popoverItem}
                      onPress={() => {
                        setSelectedTagId(tag.tag_id);
                        setShowTagMenu(false);
                      }}
                    >
                      <Text style={styles.popoverItemIconOrange}>🏷️</Text>
                      <Text
                        style={[
                          styles.popoverItemText,
                          selectedTagId === tag.tag_id && {
                            color: BRAND_PRIMARY,
                            fontWeight: '800',
                          },
                        ]}
                      >
                        {isBn && tag.tag_value === 'All'
                          ? 'সব'
                          : isBn && tag.tag_value === 'Featured'
                          ? 'বৈশিষ্ট্যযুক্ত'
                          : isBn && tag.tag_value === 'Favourite'
                          ? 'প্রিয়'
                          : isBn && tag.tag_value === 'Popular'
                          ? 'জনপ্রিয়'
                          : tag.tag_value}
                      </Text>
                      {selectedTagId === tag.tag_id && (
                        <Text
                          style={{ color: BRAND_PRIMARY, fontWeight: 'bold' }}
                        >
                          ✓
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </View>
      )}

      {/* Profile Completion Modal */}
      <ProfileCompletionModal
        visible={showProfileCompletionModal}
        percentage={
          userDetails?.ctnz_profile_progress_percent
            ? parseFloat(userDetails.ctnz_profile_progress_percent)
            : 0
        }
        onClose={() => setShowProfileCompletionModal(false)}
        onComplete={() => {
          setShowProfileCompletionModal(false);
          navigation.navigate('EditProfile');
        }}
      />
    </View>
  );
}
