import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  BackHandler,
  Alert,
  Image,
  StatusBar,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { RootState } from '../../store';
import { performLogout } from '../../utils/authUtils';
import { useAlert } from '../../context/AlertContext';
import { toggleFavorite } from '../../store/slices/wishlistSlice';
import { FEATURED_PUJAS } from '../../data/dummyData';
import appLogo from '../../assets/images/Logo.png';

const { width } = Dimensions.get('window');

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

const QUICK_STATS = [
  {
    labelEn: 'Happy Families',
    labelBn: 'সুখী পরিবার',
    value: '26+',
    icon: '👨‍👩‍👧‍👦',
  },
  {
    labelEn: 'Verified Priests',
    labelBn: 'যাচাইকৃত পুরোহিত',
    value: '19+',
    icon: '🧘',
  },
  {
    labelEn: 'Partner Temples',
    labelBn: 'পার্টনার মন্দির',
    value: '10+',
    icon: '🛕',
  },
];

export default function DashboardScreen({ navigation }: any) {
  const { i18n } = useTranslation();
  const { showAlert } = useAlert();
  const user = useSelector((state: RootState) => state.auth.user);
  const favorites = useSelector(
    (state: RootState) => state.wishlist?.favorites || [],
  );
  const dispatch = useDispatch();
  const isBn = i18n.language === 'bn';

  const [activeBanner, setActiveBanner] = React.useState(0);
  const flatListRef = React.useRef<FlatList>(null);

  const CAROUSEL_DATA = [
    ...DASHBOARD_BANNERS,
    { ...DASHBOARD_BANNERS[0], id: 'clone' },
  ];

  // Auto-scroll banners
  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveBanner(prev => {
        let current = prev;
        // Failsafe: if we're already at clone, snap back first instantly
        if (current === DASHBOARD_BANNERS.length) {
          flatListRef.current?.scrollToIndex({ index: 0, animated: false });
          current = 0;
        }

        const next = current + 1;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });

        // If we just scrolled to the clone, silently snap back after animation finishes
        if (next === DASHBOARD_BANNERS.length) {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: 0, animated: false });
            setActiveBanner(0);
          }, 600); // Wait for the forward animation to finish
        }

        return next;
      });
    }, 4500); // 4.5 seconds per slide
    return () => clearInterval(timer);
  }, []);

  const toggleLanguage = () => i18n.changeLanguage(isBn ? 'en' : 'bn');

  // Back-button exits the app with a confirmation rather than going to login
  useFocusEffect(
    React.useCallback(() => {
      const onBack = () => {
        Alert.alert('Exit App', 'Do you want to exit the app?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Exit',
            style: 'destructive',
            onPress: () => BackHandler.exitApp(),
          },
        ]);
        return true; // prevent default (going back)
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => sub.remove();
    }, []),
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
          onPress: performLogout,
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

  const handleNavClick = (item: any) => {
    if (item.comingSoon) {
      showComingSoonMessage(item.labelEn, item.labelBn);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      {/* ── Top Header ── */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerInner}>
            {/* Logo */}
            <View style={styles.logoRow}>
              <Image source={appLogo} style={styles.headerLogo} />
            </View>

            {/* Right actions */}
            <View style={styles.headerActions}>
              {/* Language toggle */}
              <TouchableOpacity
                onPress={toggleLanguage}
                style={styles.langPill}
              >
                <Text style={styles.langPillText}>
                  {i18n.language.toUpperCase()}
                </Text>
              </TouchableOpacity>
              {/* Header icons */}
              <TouchableOpacity
                onPress={() => navigation.navigate('Wishlist')}
                style={styles.iconBtn}
              >
                <Text style={styles.iconBtnText}>❤️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn}>
                <Text style={styles.iconBtnText}>🔔</Text>
              </TouchableOpacity>
              {/* User avatar */}
              <TouchableOpacity onPress={handleLogout} style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user?.user_name ?? 'U').toString().slice(0, 1)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Nav chips ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.navRow}
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
        </SafeAreaView>
      </View>

      {/* ── Body ── */}
      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Banner Carousel */}
        <View style={styles.carouselContainer}>
          <FlatList
            ref={flatListRef}
            data={CAROUSEL_DATA}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.bannerWrapper}>
                <View style={[styles.banner, styles.bannerZeroMargin]}>
                  <View style={styles.bannerContent}>
                    <Text style={styles.bannerTitle}>
                      {isBn ? item.titleBn : item.titleEn}
                    </Text>
                    <Text style={styles.bannerSub}>
                      {isBn ? item.subBn : item.subEn}
                    </Text>
                    <TouchableOpacity style={styles.bannerBtn}>
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
            )}
            onMomentumScrollEnd={e => {
              let index = Math.round(e.nativeEvent.contentOffset.x / width);
              if (index === DASHBOARD_BANNERS.length) {
                flatListRef.current?.scrollToIndex({
                  index: 0,
                  animated: false,
                });
                index = 0;
              }
              setActiveBanner(index);
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
        <View style={styles.statsRow}>
          {QUICK_STATS.map(stat => (
            <View key={stat.labelEn} style={styles.statCard}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>
                {isBn ? stat.labelBn : stat.labelEn}
              </Text>
            </View>
          ))}
        </View>

        {/* Featured Pujas Header */}
        <View style={[styles.sectionHeader, styles.sectionHeaderRow]}>
          <View>
            <Text style={styles.sectionTitle}>
              {isBn ? 'বৈশিষ্ট্যযুক্ত পূজা' : 'Featured Pujas'}
            </Text>
            <Text style={styles.sectionSub}>
              {isBn
                ? 'আমাদের সবচেয়ে জনপ্রিয় এবং প্রস্তাবিত পূজা'
                : 'Discover our most popular and recommended pujas'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('AllPujas')}>
            <Text style={styles.showMoreText}>
              {isBn ? 'আরও দেখুন →' : 'Show More →'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Horizontal Puja List */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredListContent}
        >
          {FEATURED_PUJAS.map(puja => (
            <View key={puja.id} style={[styles.gridCard, styles.featuredCard]}>
              <View
                style={[styles.cardImgBox, { backgroundColor: puja.color }]}
              >
                <Text style={styles.featuredImgText}>
                  {puja.imagePlaceholder}
                </Text>
                <TouchableOpacity
                  style={styles.heartBtn}
                  onPress={() => dispatch(toggleFavorite(puja.id))}
                >
                  <Text style={styles.heartIconText}>
                    {favorites.includes(puja.id) ? '❤️' : '🤍'}
                  </Text>
                </TouchableOpacity>
                {puja.isPopular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>
                      ✨ {isBn ? 'জনপ্রিয়' : 'Popular'}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>
                  {isBn ? puja.titleBn : puja.titleEn}
                </Text>
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {isBn ? puja.descBn : puja.descEn}
                </Text>

                <View style={styles.durationRow}>
                  <Text style={styles.durationIcon}>⏱️</Text>
                  <Text style={styles.durationText}>
                    {isBn ? puja.durationBn : puja.durationEn}
                  </Text>
                </View>

                <View style={styles.priceRow}>
                  <View>
                    <Text style={styles.priceLabel}>
                      {isBn ? 'মূল্য পরিসীমা' : 'PRICE RANGE'}
                    </Text>
                    <Text style={styles.priceValue}>
                      {isBn ? puja.priceBn : puja.priceEn}
                    </Text>
                  </View>
                  <View style={styles.ratingCol}>
                    <Text style={styles.priceLabel}>
                      {isBn ? 'রেটিং' : 'RATING'}
                    </Text>
                    <Text style={styles.ratingValue}>
                      {isBn ? puja.ratingBn : puja.ratingEn}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.bookBtn,
                    !puja.isAvailable && styles.bookBtnDisabled,
                  ]}
                  disabled={!puja.isAvailable}
                  onPress={() =>
                    navigation.navigate('PujaDetails', { pujaId: puja.id })
                  }
                >
                  <Text
                    style={[
                      styles.bookBtnText,
                      !puja.isAvailable && styles.bookBtnTextDisabled,
                    ]}
                  >
                    {puja.isAvailable
                      ? isBn
                        ? 'বুক করুন →'
                        : 'Book Now →'
                      : isBn
                      ? 'এখন উপলব্ধ নয়'
                      : 'Not Available Now'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const BRAND_PRIMARY = '#F97316';
const BRAND_SECONDARY = '#7F1D1D';
const BRAND_BG = '#FDF8F0';
const BRAND_TEXT = '#291811';
const BRAND_MUTED = '#6B5E59';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND_BG },

  // Header
  header: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  headerInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
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
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  langPillText: { color: BRAND_TEXT, fontSize: 11, fontWeight: '700' },
  iconBtn: { padding: 6 },
  iconBtnText: { fontSize: 20, color: BRAND_TEXT },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: BRAND_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFF', fontSize: 15, fontWeight: '800' },

  // Navigation chips
  navRow: { marginTop: 4, backgroundColor: '#FFFFFF' },
  navChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  navChipActive: { backgroundColor: BRAND_PRIMARY },
  navChipIcon: { fontSize: 14, marginRight: 5 },
  navChipLabel: { color: BRAND_MUTED, fontSize: 13, fontWeight: '500' },
  navChipLabelActive: { color: '#FFF', fontWeight: '700' },
  comingSoonBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  comingSoonText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
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
    color: '#FDF8F0',
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
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  bannerBtnText: { color: BRAND_SECONDARY, fontSize: 13, fontWeight: '700' },
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
  dotInactive: { width: 6, backgroundColor: '#E5DFD7' },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '900', color: BRAND_PRIMARY },
  statLabel: {
    fontSize: 10,
    color: BRAND_MUTED,
    textAlign: 'center',
    marginTop: 2,
  },

  // Section header
  sectionHeader: { paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: BRAND_TEXT },
  sectionSub: { fontSize: 12, color: BRAND_MUTED, marginTop: 2 },

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
    borderColor: '#E5DFD7',
    marginRight: 6,
    backgroundColor: '#FFF',
  },
  filterChipActive: {
    backgroundColor: BRAND_PRIMARY,
    borderColor: BRAND_PRIMARY,
  },
  filterChipText: { fontSize: 12, fontWeight: '600', color: BRAND_MUTED },
  filterChipTextActive: { color: '#FFF' },
  countBadge: {
    backgroundColor: '#FFF0E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: { fontSize: 10, fontWeight: '700', color: BRAND_PRIMARY },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#FDE1D3',
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
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
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
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  popularBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
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
    borderTopColor: '#F3F4F6',
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
  ratingValue: { fontSize: 12, fontWeight: '800', color: '#F59E0B' },
  bookBtn: {
    backgroundColor: BRAND_PRIMARY,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  bookBtnDisabled: { backgroundColor: '#E5E7EB' },
  bookBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  bookBtnTextDisabled: { color: '#9CA3AF' },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateEmoji: { fontSize: 40, marginBottom: 12 },
  emptyStateText: { color: BRAND_MUTED, fontSize: 14, textAlign: 'center' },

  headerLogo: { width: 110, height: 36, resizeMode: 'contain' },
  navRowContent: { paddingHorizontal: 16, paddingBottom: 12 },
  carouselContainer: { paddingTop: 16 },
  bannerWrapper: { width: width, paddingHorizontal: 16 },
  bannerZeroMargin: { margin: 0 },
  bannerIcon: { fontSize: 60 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  showMoreText: { color: BRAND_PRIMARY, fontSize: 13, fontWeight: '700' },
  featuredListContent: { paddingHorizontal: 16 },
  featuredCard: { width: 240, marginRight: 16, marginBottom: 4 },
  featuredImgText: { fontSize: 44 },
  heartIconText: { fontSize: 16 },
  ratingCol: { alignItems: 'flex-end' },
  bottomSpacer: { height: 40 },
});
