/* eslint-disable react-native/no-inline-styles */
import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
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
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  PanResponder,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Path } from 'react-native-svg';
import RNLinearGradient from 'react-native-linear-gradient';
import {
  Search, SlidersHorizontal, ChevronDown, ChevronUp, Clock, Check, ShieldCheck,
  House, Gem, HeartPulse, UsersRound, GraduationCap, Orbit, PartyPopper, Sparkles,
  CalendarClock, BadgeCheck, Eye, Menu, LayoutGrid, ShoppingCart, User, Heart, Trash2, UserCircle2, X, MapPin, LogOut, Scale, RotateCcw
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, DrawerActions } from '@react-navigation/native';
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
  useGetPujaPackagesQuery,
  useLazyGetPujaPackagesQuery,
} from '../../store/api/pujaApi';
import TopNavBar from '../../components/common/TopNavBar';
import appLogo from '../../assets/images/Logo.webp';
import NoDataFound from '../../components/common/NoDataFound';
import ProfileCompletionModal from '../../components/common/ProfileCompletionModal';
import ImagePlaceholder from '../../components/common/ImagePlaceholder';
import PackageComparisonModal, { PackageComparisonItem } from '../../components/puja/PackageComparisonModal';
import { Colors } from '../../constants/Colors';

const PriceSlider = ({ value, onValueChange, maxLimit = 15000 }: any) => {
  const [width, setWidth] = useState(1);
  const widthRef = useRef(1);
  const position = useRef(new Animated.Value(0)).current;

  const isDragging = useRef(false);

  useEffect(() => {
    if (!isDragging.current) {
      const val = value ? parseInt(value) : maxLimit;
      const clampedVal = Math.max(0, Math.min(val, maxLimit));
      position.setValue((clampedVal / maxLimit) * width);
    }
  }, [value, maxLimit, width]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        isDragging.current = true;
        position.extractOffset();
      },
      onPanResponderMove: (e, gestureState) => {
        position.setValue(gestureState.dx);
        // Calculate real-time value using widthRef
        // @ts-ignore
        const offset = position._offset || 0;
        const currentX = offset + gestureState.dx;
        const currentWidth = widthRef.current;
        const boundedX = Math.max(0, Math.min(currentX, currentWidth));
        const newValue = Math.round((boundedX / currentWidth) * maxLimit);
        onValueChange(newValue.toString());
      },
      onPanResponderRelease: () => {
        isDragging.current = false;
        position.flattenOffset();
      },
    })
  ).current;

  const boundedTranslateX = position.interpolate({
    inputRange: [0, width],
    outputRange: [0, width],
    extrapolate: 'clamp',
  });

  return (
    <View style={{ marginTop: 24, paddingVertical: 10 }}>
      <View
        style={{ height: 6, backgroundColor: '#F4E8E1', borderRadius: 3, justifyContent: 'center' }}
        onLayout={(e) => {
          const newWidth = e.nativeEvent.layout.width || 1;
          setWidth(newWidth);
          widthRef.current = newWidth;
        }}
      >
        <Animated.View
          {...panResponder.panHandlers}
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: '#F97316',
            position: 'absolute',
            left: -12,
            borderWidth: 3,
            borderColor: '#FFF5F0',
            transform: [{ translateX: boundedTranslateX }],
            elevation: 3,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
          }}
        />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
        <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '700' }}>₹0</Text>
        <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '700' }}>Max: ₹{maxLimit}</Text>
      </View>
    </View>
  );
};

import { getRecentPujas, saveRecentPuja } from '../../utils/recentUtils';

const { width } = Dimensions.get('window');

const BRAND_PRIMARY = Colors.primary;
const BRAND_BG = Colors.background;
const BRAND_TEXT = Colors.textMain;
const BRAND_MUTED = Colors.textMuted;

// Categories for "Find a puja by purpose"
const CATEGORIES = [
  { id: 'All', labelEn: 'All', labelBn: 'সব', Icon: LayoutGrid },
  { id: 'Home', labelEn: 'Home', labelBn: 'বাড়ি', Icon: House },
  { id: 'Prosperity', labelEn: 'Prosperity', labelBn: 'সমৃদ্ধি', Icon: Gem },
  { id: 'Health', labelEn: 'Health', labelBn: 'স্বাস্থ্য', Icon: HeartPulse },
  { id: 'Family', labelEn: 'Family', labelBn: 'পরিবার', Icon: UsersRound },
  { id: 'Education', labelEn: 'Education', labelBn: 'শিক্ষা', Icon: GraduationCap },
  { id: 'Astrology', labelEn: 'Astrology', labelBn: 'জ্যোতিষ', Icon: Orbit },
  { id: 'Festivals', labelEn: 'Festivals', labelBn: 'উৎসব', Icon: PartyPopper, recommended: true },
];

const PURPOSE_PATTERNS: Record<string, RegExp> = {
  Home: /(griha|home|house|vastu|bhumi|property|kalash sthapana)/i,
  Prosperity: /(lakshmi|prosper|wealth|dhanteras|abundance|business|govardhan|kuber|ganesh|dhan)/i,
  Health: /(health|ayush|mrityunjaya|protection|hanuman|sundarkand|raksha|dhanvantari|roga)/i,
  Family: /(marriage|vivah|wedding|engagement|family|naamkaran|annaprashan|mundan|tulsi vivah|satyanarayan|sanskar)/i,
  Education: /(education|vidya|saraswati|vidyarambh|study|learning|gayatri|exam)/i,
  Astrology: /(navagraha|shani|mangal|kaal sarp|dosh|planet|graha|pitru|astrology)/i,
  Festivals: /(navratri|janmashtami|shivratri|raksha bandhan|dhanteras|durga|kali|karwa|ganesh|festival|utsav)/i,
};

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

  // State Variables
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [pujas, setPujas] = useState<PujaType[]>([]);
  const [pujaTags, setPujaTags] = useState<PujaTag[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<number>(1); // 1 is default 'All'
  const [searchQuery, setSearchQuery] = useState('');
  const [summaryData, setSummaryData] = useState<SummaryCount | null>(null);
  const [isLoadingPujas, setIsLoadingPujas] = useState(false);
  const [showProfileCompletionModal, setShowProfileCompletionModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recentPujas, setRecentPujas] = useState<any[]>([]);

  // Redesign State Variables
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('Recommended');
  const [showSortModal, setShowSortModal] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(12);

  // Packages Modal & Comparison State
  const [showPackagesModal, setShowPackagesModal] = useState(false);
  const [selectedPujaForPackages, setSelectedPujaForPackages] = useState<any>(null);
  const [openingPujaId, setOpeningPujaId] = useState<number | null>(null);
  const [comparePackages, setComparePackages] = useState<PackageComparisonItem[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  // Fetch Packages dynamically for the selected Puja
  const [fetchPackages, { data: modalPackagesData, isFetching: isLoadingModalPackages }] = useLazyGetPujaPackagesQuery();

  // Background Animation values
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0.35)).current;
  const blinkAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, { toValue: -20, duration: 3000, useNativeDriver: true }),
        Animated.timing(floatAnim1, { toValue: 0, duration: 3000, useNativeDriver: true })
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, { toValue: 15, duration: 3500, useNativeDriver: true }),
        Animated.timing(floatAnim2, { toValue: 0, duration: 3500, useNativeDriver: true })
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, { toValue: 0.55, duration: 2500, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0.35, duration: 2500, useNativeDriver: true })
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true })
      ])
    ).start();
  }, [floatAnim1, floatAnim2, opacityAnim, blinkAnim]);


  // Fetch user profile
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

  // Sync profile modal
  useEffect(() => {
    const userId = user?.user_id;
    if (!isNewLogin || !userId) return;
    if (!userDetailsLoaded && !userDetailsError) return;
    const rawPct = userDetails?.ctnz_profile_progress_percent;
    const pct = parseFloat(String(rawPct || '0'));
    dispatch(clearNewLoginFlag());
    if (pct >= 100) return;
    setTimeout(() => {
      setShowProfileCompletionModal(true);
    }, 600);
  }, [user?.user_id, userDetailsLoaded, userDetailsError, userDetails, isNewLogin, dispatch]);

  // Load Recent Pujas
  useFocusEffect(
    useCallback(() => {
      getRecentPujas().then(setRecentPujas);
    }, [])
  );

  // Sync cart
  const { data: serverCartItems, refetch: refetchCartInfo } = useGetPujaCartInfoQuery(
    { userId: user?.user_id || 0, pageNo: 1, limit: 1000 },
    { skip: !user?.user_id }
  );

  useEffect(() => {
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

  // Sync favorites
  const WISHLIST_TAG_ID = 3;
  const { data: wishlistPujas, refetch: refetchWishlist } = useGetTagPujasQuery(
    { userId: user?.user_id || 0, tagId: WISHLIST_TAG_ID, pageNo: 1, limit: 100 },
    { skip: !user?.user_id, skipGlobalLoader: true } as any
  );

  const [savePujaTag] = useSavePujaTagMutation();

  useEffect(() => {
    if (wishlistPujas) {
      const favIds = wishlistPujas.map(p => (p.puja_id || p.puja_type_id || '').toString());
      dispatch(setFavorites(favIds));
    }
  }, [wishlistPujas, dispatch]);

  const handleToggleFavoriteServer = async (pujaId: string) => {
    if (!user?.user_id) return;
    const isCurrentlyFav = favorites.includes(pujaId);
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      showToast({ message: t('common.connectionRequired'), type: 'error' });
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
          ? isBn ? 'ফেভারিট থেকে সরানো হয়েছে' : 'Removed from favourite'
          : isBn ? 'ফেভারিটে যোগ করা হয়েছে' : 'Added to favourite',
        type: 'success',
      });
    } catch (error) {
      console.error('Wishlist sync failed:', error);
      showToast({
        message: isBn ? 'ফেভারিট আপডেট করতে ব্যর্থ হয়েছে' : 'Failed to update favourite',
        type: 'error',
      });
    }
  };

  const onRefresh = useCallback(async () => {
    if (!user?.user_id) return;
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      showToast({ message: t('common.connectionRequired'), type: 'error' });
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
          const data = await getPujaByTag(user.user_id, selectedTagId, 1, 50); // Fetch more so frontend filtering works well
          setPujas(data);
        })(),
      ]);
    } catch (err: any) {
      console.warn('[DashboardScreen] Refresh warning:', err?.message || err);
    } finally {
      setRefreshing(false);
    }
  }, [user?.user_id, selectedTagId, refetchUserDetails, refetchCartInfo, refetchWishlist, showToast, t]);

  const isFirstConn = useRef(true);
  useEffect(() => {
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

  // Initial load
  useEffect(() => {
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
  }, [dispatch, user?.user_id]);

  // Fetch pujas when tag/collection changes
  useEffect(() => {
    const fetchPujas = async () => {
      if (!user?.user_id) return;
      setIsLoadingPujas(true);
      try {
        const data = await getPujaByTag(user.user_id, selectedTagId, 1, 50); // Larger list for frontend query
        setPujas(data);
      } catch (error) {
        console.error('Error fetching pujas by tag:', error);
      } finally {
        setIsLoadingPujas(false);
      }
    };
    fetchPujas();
  }, [user?.user_id, selectedTagId]);

  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        showAlert({
          title: 'Exit App',
          message: 'Do you want to exit the app?',
          buttons: [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() },
          ],
        });
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => sub.remove();
    }, [showAlert])
  );

  const handleLogout = () => {
    showAlert({
      title: isBn ? 'লগআউট' : 'Logout',
      message: isBn ? 'আপনি কি নিশ্চিত যে লগআউট করতে চান?' : 'Are you sure you want to logout?',
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
              showToast({ message: t('common.connectionRequired'), type: 'error' });
            }
          },
        },
      ],
    });
  };

  const showComingSoonMessage = (featureNameEn: string, featureNameBn: string) => {
    showAlert({
      title: isBn ? 'শীঘ্রই আসছে' : 'Coming Soon',
      message: isBn
        ? `${featureNameBn} বর্তমানে উন্নয়নাধীন। পরবর্তী আপডেটের জন্য সাথে থাকুন!`
        : `${featureNameEn} is currently under development. Stay tuned for updates!`,
      buttons: [{ text: isBn ? 'ঠিক আছে' : 'OK' }],
    });
  };

  // Redesign Filtering & Sorting Logic
  const finalFilteredPujas = useMemo(() => {
    let list = pujas;

    // 1. Search Query Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter((p) => {
        const pName = (p.puja_name || p.puja_type_name || '').toLowerCase();
        const pDesc = (p.description || p.puja_description || '').toLowerCase();
        return pName.includes(query) || pDesc.includes(query);
      });
    }

    // 2. Category (Purpose) Filter matching Web (pujaDiscovery.ts)
    if (selectedCategory !== 'All') {
      const pattern = PURPOSE_PATTERNS[selectedCategory];
      if (pattern) {
        list = list.filter((p: any) => {
          const searchableText = [
            p.puja_name,
            p.puja_type_name,
            p.puja_sub_name,
            p.description,
            p.puja_description,
            p.puja_benifit,
            p.puja_significance,
          ]
            .filter(Boolean)
            .join(' ');
          return pattern.test(searchableText);
        });
      }
    }

    // 3. Price Filter
    if (minPrice.trim()) {
      const min = parseFloat(minPrice);
      if (!isNaN(min)) {
        list = list.filter(p => {
          const price = p.minimum_price || p.puja_with_samagri_amount || 0;
          return price >= min;
        });
      }
    }
    if (maxPrice.trim()) {
      const max = parseFloat(maxPrice);
      if (!isNaN(max)) {
        list = list.filter(p => {
          const price = p.maximum_price || p.puja_with_samagri_amount || 0;
          return price <= max;
        });
      }
    }

    // 4. Sorting
    const sorted = [...list];
    if (sortBy === 'priceLow') {
      sorted.sort((a, b) => {
        const priceA = a.minimum_price || a.puja_with_samagri_amount || 0;
        const priceB = b.minimum_price || b.puja_with_samagri_amount || 0;
        return priceA - priceB;
      });
    } else if (sortBy === 'priceHigh') {
      sorted.sort((a, b) => {
        const priceA = a.minimum_price || a.puja_with_samagri_amount || 0;
        const priceB = b.minimum_price || b.puja_with_samagri_amount || 0;
        return priceB - priceA;
      });
    } else if (sortBy === 'rating') {
      sorted.sort((a, b) => {
        const ratingA = a.puja_rating || 5;
        const ratingB = b.puja_rating || 5;
        return ratingB - ratingA;
      });
    } else if (sortBy === 'nameAsc') {
      sorted.sort((a, b) => {
        const nameA = (a.puja_name || a.puja_type_name || '').toLowerCase();
        const nameB = (b.puja_name || b.puja_type_name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
    }

    return sorted;
  }, [pujas, searchQuery, selectedCategory, minPrice, maxPrice, sortBy]);

  const displayedPujas = useMemo(() => {
    return finalFilteredPujas.slice(0, displayLimit);
  }, [finalFilteredPujas, displayLimit]);

  const getSortLabel = () => {
    if (sortBy === 'Recommended') return isBn ? 'প্রস্তাবিত' : 'Recommended';
    if (sortBy === 'priceLow') return isBn ? 'মূল্য: কম থেকে বেশি' : 'Price: Low to High';
    if (sortBy === 'priceHigh') return isBn ? 'মূল্য: বেশি থেকে কম' : 'Price: High to Low';
    if (sortBy === 'nameAsc') return isBn ? 'নাম: A থেকে Z' : 'Name: A to Z';
    return isBn ? 'প্রস্তাবিত' : 'Recommended';
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#F97316" barStyle="light-content" />

      {/* Spiritual decorative elements (Animated Background) */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Animated.View
          style={{
            position: 'absolute',
            top: -100,
            left: -100,
            width: 300,
            height: 300,
            borderRadius: 150,
            backgroundColor: 'rgba(253, 186, 116, 0.4)', // orange-300
            transform: [{ translateY: floatAnim1 }],
            opacity: opacityAnim,
          }}
        />
        <Animated.View
          style={{
            position: 'absolute',
            bottom: -100,
            right: -100,
            width: 300,
            height: 300,
            borderRadius: 150,
            backgroundColor: 'rgba(253, 186, 116, 0.25)', // orange-300 lighter
            transform: [{ translateY: floatAnim2 }],
            opacity: opacityAnim,
          }}
        />
        <Animated.View
          style={{
            position: 'absolute',
            top: '33%',
            alignSelf: 'center',
            width: width * 0.75,
            height: 250,
            borderRadius: 125,
            backgroundColor: 'rgba(253, 224, 71, 0.15)', // yellow-300
            opacity: opacityAnim,
          }}
        />
      </View>

      <TopNavBar showBack={false} onProfilePress={async () => {
        const state = await NetInfo.fetch();
        if (state.isConnected) {
          setShowProfileMenu(true);
        } else {
          showToast({ message: t('common.connectionRequired'), type: 'error' });
        }
      }} />

      {/* ── Flex Wrapper to keep Modal Below Header ── */}
      <View style={{ flex: 1, position: 'relative' }}>

        {/* ── Search Bar Section (Lighter Orange Background) ── */}
        <View style={styles.searchSectionBackground}>
          {/* ── Pujora Search Bar ── */}
          <View style={styles.searchContainerHeader}>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 24, overflow: 'hidden' }}>
              <Svg height="100%" width="100%">
                <Defs>
                  <LinearGradient id="searchBoxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#FFFFFF" />
                    <Stop offset="100%" stopColor="#FFF4E6" />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill="url(#searchBoxGrad)" />
              </Svg>
            </View>
            <Search size={20} color={BRAND_PRIMARY} style={[styles.searchIcon, { zIndex: 1 }]} />
            <View style={[styles.searchInputWrapper, { zIndex: 1 }]}>
              <TextInput
                style={styles.searchInput}
                placeholder={isBn ? 'পবিত্র আচার অনুসন্ধান করুন...' : 'Search sacred rituals...'}
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={{ position: 'absolute', right: 16, zIndex: 1 }}>
                <Text style={{ fontSize: 14, color: BRAND_MUTED }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Main Scrollable Body ── */}
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

          {/* ── Banner Card: All Pujas ── */}
          <View style={styles.titleSectionCard}>
            <Text style={styles.titleServices}>{isBn ? 'সব পূজাসমূহ' : 'All Pujas'}</Text>
            <Animated.View style={{ opacity: blinkAnim, width: 75, height: 4, marginTop: 6, marginBottom: 16, borderRadius: 2, overflow: 'hidden' }}>
              <RNLinearGradient
                colors={['#f3a33a', '#ef7d16', '#e0600d']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1 }}
              />
            </Animated.View>

            {/* Verified priest and Secure booking badges */}
            <View style={styles.badgeRow}>
              <View style={styles.badgeItem}>
                <ShieldCheck size={16} color="#F97316" />
                <Text style={styles.badgeItemText}>{isBn ? 'যাচাইকৃত পুরোহিত' : 'Verified priests'}</Text>
              </View>
              <View style={styles.badgeItem}>
                <ShieldCheck size={16} color="#F97316" />
                <Text style={styles.badgeItemText}>{isBn ? 'নিরাপদ বুকিং' : 'Secure booking'}</Text>
              </View>
            </View>
          </View>

          {/* ── Find a Puja by Purpose (Categories) ── */}
          <View style={styles.purposeSection}>
            {/* Animated Glow Line on top border */}
            <Animated.View
              style={[
                styles.glowLine,
                { opacity: opacityAnim }
              ]}
            >
              <Svg height="3" width="100%">
                <Defs>
                  <LinearGradient id="glowGrad" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor="#F97316" stopOpacity="0" />
                    <Stop offset="0.5" stopColor="#F97316" stopOpacity="1" />
                    <Stop offset="1" stopColor="#F97316" stopOpacity="0" />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="3" fill="url(#glowGrad)" />
              </Svg>
            </Animated.View>
            <View style={styles.purposeHeaderRow}>
              <View style={styles.sparkIconContainer}>
                <Sparkles size={16} color={BRAND_PRIMARY} />
              </View>
              <Text style={styles.purposeTitle}>{isBn ? 'উদ্দেশ্য অনুযায়ী পূজা খুঁজুন' : 'Find a puja by purpose'}</Text>
            </View>

            {/* Categories Horizontal List */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContent}
              style={{ marginTop: 12 }}
            >
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => {
                      setSelectedCategory(cat.id);
                      setDisplayLimit(12);
                    }}
                    style={[
                      styles.categoryChip,
                      isActive && styles.categoryChipActive,
                    ]}
                  >
                    <View style={[styles.categoryChipIconContainer, isActive && styles.categoryChipIconContainerActive]}>
                      <cat.Icon size={14} color={isActive ? '#FFF' : '#F97316'} />
                    </View>
                    <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
                      {isBn ? cat.labelBn : cat.labelEn}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ── Count and Sort Dropdown Row ── */}
          <View style={styles.countSortRow}>
            <Text style={styles.totalPujasText}>
              {finalFilteredPujas.length} <Text style={{ color: '#8A7369', fontWeight: '600' }}>{isBn ? 'টি পূজা পরিষেবা' : 'puja services'}</Text>
            </Text>

            {/* Sort Dropdown Selector */}
            <TouchableOpacity
              onPress={() => setShowSortModal(true)}
              style={styles.sortDropdownBtn}
            >
              <Text style={styles.sortDropdownBtnText}>{getSortLabel()}</Text>
              <Text style={{ fontSize: 10, color: '#6B5E59', marginLeft: 4 }}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* ── Filters Bar Header ── */}
          <View style={styles.filterBarContainer}>
            <TouchableOpacity
              onPress={() => setShowFilters(true)}
              style={styles.filterBarHeader}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <SlidersHorizontal size={14} color="#291811" />
                <Text style={styles.filterBarHeaderText}>{isBn ? 'ফিল্টারসমূহ' : 'Filters'}</Text>
              </View>
              <ChevronDown size={16} color="#291811" />
            </TouchableOpacity>
          </View>

          {/* ── Filters Modal (Matching Screenshot 100%) ── */}
          <Modal
            visible={showFilters}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowFilters(false)}
          >
            <View style={styles.filterModalOverlay}>
              <View style={styles.filterModalContent}>
                {/* Header */}
                <View style={styles.filterModalHeaderRow}>
                  <View>
                    <Text style={styles.filterModalTitle}>{isBn ? 'পূজা ফিল্টার করুন' : 'Filter pujas'}</Text>
                    <Text style={styles.filterModalSubtitle}>{isBn ? 'উপলব্ধ পরিষেবাগুলি পরিমার্জন করুন' : 'Refine the available services'}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowFilters(false)} style={styles.filterModalCloseBtn} activeOpacity={0.7}>
                    <X size={18} color="#1C1917" />
                  </TouchableOpacity>
                </View>

                <View style={styles.filterModalDivider} />

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
                  {/* Collections */}
                  <Text style={styles.filterModalSectionTitle}>{isBn ? 'সংগ্রহসমূহ' : 'COLLECTIONS'}</Text>
                  <View style={styles.filterModalCollectionsContainer}>
                    {pujaTags.map((tag) => {
                      const isSelected = selectedTagId === tag.tag_id;
                      return (
                        <TouchableOpacity
                          key={tag.tag_id}
                          onPress={() => {
                            setSelectedTagId(tag.tag_id);
                            setDisplayLimit(30);
                          }}
                          style={styles.filterModalCollectionRow}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.filterModalCheckbox, isSelected && styles.filterModalCheckboxActive]}>
                            {isSelected && <Check size={14} color="#FFF" strokeWidth={3} />}
                          </View>
                          <Text style={[styles.filterModalCollectionText, isSelected && styles.filterModalCollectionTextActive]}>
                            {isBn && tag.tag_value === 'All' ? 'All pujas' :
                              isBn && tag.tag_value === 'Featured' ? 'বৈশিষ্ট্যযুক্ত' :
                                isBn && tag.tag_value === 'Favourite' ? 'প্রিয়' :
                                  isBn && tag.tag_value === 'Popular' ? 'জনপ্রিয়' : tag.tag_value === 'All' ? 'All pujas' : tag.tag_value}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>

                {/* Footer Buttons Stacked matching screenshot */}
                <View style={styles.filterModalFooter}>
                  {selectedTagId !== 1 && (
                    <TouchableOpacity
                      style={styles.filterModalResetBtn}
                      onPress={() => {
                        setSelectedTagId(1);
                        setMinPrice('');
                        setMaxPrice('');
                        setDisplayLimit(30);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.filterModalResetBtnText}>{isBn ? 'রিসেট ফিল্টার' : 'Reset Filters'}</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.filterModalApplyBtn}
                    onPress={() => setShowFilters(false)}
                    activeOpacity={0.8}
                  >
                    <RNLinearGradient
                      colors={['#EF6C00', '#D97706']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.filterModalApplyGradient}
                    >
                      <Text style={styles.filterModalApplyBtnText}>
                        {isBn ? `${finalFilteredPujas.length}টি পূজা দেখুন` : `Show ${finalFilteredPujas.length} pujas`}
                      </Text>
                    </RNLinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* ── Puja Cards List (Row-Split Layout matching screenshots) ── */}
          {isLoadingPujas ? (
            <View style={styles.centeredSectionLoader}>
              <ActivityIndicator size="small" color={BRAND_PRIMARY} />
              <Text style={styles.loaderText}>{isBn ? 'লোড হচ্ছে...' : 'Loading...'}</Text>
            </View>
          ) : displayedPujas.length > 0 ? (
            <View style={styles.pujasContainer}>
              {displayedPujas.map((puja) => {
                const pId = puja.puja_id || puja.puja_type_id;
                const pName = puja.puja_name || puja.puja_type_name;
                const pMinPrice = puja.minimum_price || puja.puja_with_samagri_amount || 0;
                const pMaxPrice = puja.maximum_price || puja.puja_without_samagri_amount || 0;
                const pPriceStr = pMinPrice === pMaxPrice
                  ? `₹${pMinPrice.toLocaleString('en-IN')}`
                  : `₹${pMinPrice.toLocaleString('en-IN')}`;
                let rawDuration = puja.duration || puja.puja_duration || '2';
                let pDuration = String(rawDuration).includes('hr') ? rawDuration : `${rawDuration} hr`;
                const pRating = puja.puja_rating || 5;

                return (
                  <View key={pId || Math.random()} style={styles.pujaCardRow}>
                    {/* Left Side: Square Image area */}
                    <View style={styles.cardImgLeftBox}>
                      {puja.icon ? (
                        <Image source={{ uri: puja.icon }} style={styles.pujaIconImage} resizeMode="cover" />
                      ) : (
                        <ImagePlaceholder />
                      )}
                    </View>

                    {/* Right Side: content details */}
                    <View style={styles.cardBodyRight}>
                      {/* Title and Heart Icon row */}
                      <View style={styles.titleHeartRow}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{pName}</Text>
                        <TouchableOpacity
                          style={styles.heartBtnOutline}
                          onPress={async () => {
                            const state = await NetInfo.fetch();
                            if (state.isConnected) {
                              pId && handleToggleFavoriteServer(pId.toString());
                            } else {
                              showToast({ message: t('common.connectionRequired'), type: 'error' });
                            }
                          }}
                        >
                          <Heart
                            size={16}
                            color={favorites.includes(String(pId)) ? Colors.red : '#9CA3AF'}
                            fill={favorites.includes(String(pId)) ? Colors.red : 'transparent'}
                          />
                        </TouchableOpacity>
                      </View>

                      {/* Duration, Rating and Compare row */}
                      <View style={styles.detailsRow}>
                        <View style={styles.durationRatingBox}>
                          <Clock size={12} color={BRAND_MUTED} style={{ marginRight: 3 }} />
                          <Text style={styles.durationText}>{pDuration}</Text>
                        </View>

                        {/* Compare Outline Button */}
                        <TouchableOpacity
                          style={styles.compareBtn}
                          onPress={() => showComingSoonMessage('Compare Pujas', 'পূজা তুলনা')}
                        >
                          <SlidersHorizontal size={10} color={BRAND_PRIMARY} />
                          <Text style={styles.compareBtnText}>{isBn ? 'তুলনা' : 'Compare'}</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Bottom Row: Packages from Price and View packages Orange Button with Eye Icon */}
                      <View style={styles.cardFooterRow}>
                        <View>
                          <Text style={styles.packagesFromLabel}>{isBn ? 'প্যাকেজ শুরু' : 'Packages from'}</Text>
                          <Text style={styles.priceValueText}>{pPriceStr}</Text>
                        </View>

                        <TouchableOpacity
                          style={[
                            styles.bookBtnContainer,
                            puja.puja_active_status === 0 && styles.bookBtnDisabled,
                          ]}
                          disabled={puja.puja_active_status === 0 || openingPujaId === puja.puja_id}
                          onPress={async () => {
                            setOpeningPujaId(puja.puja_id);
                            setSelectedPujaForPackages(puja);
                            await saveRecentPuja(puja); // Save recently viewed
                            try {
                              await fetchPackages(puja.puja_id.toString()).unwrap();
                            } catch (error) {
                              console.error('Failed to fetch packages:', error);
                            } finally {
                              setOpeningPujaId(null);
                              setShowPackagesModal(true);
                            }
                          }}
                        >
                          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 8, overflow: 'hidden' }}>
                            <Svg height="100%" width="100%">
                              <Defs>
                                <LinearGradient id="btnGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <Stop offset="0%" stopColor={puja.puja_active_status === 0 ? '#E5E7EB' : '#FF9933'} />
                                  <Stop offset="100%" stopColor={puja.puja_active_status === 0 ? '#D1D5DB' : '#E07800'} />
                                </LinearGradient>
                              </Defs>
                              <Rect x="0" y="0" width="100%" height="100%" fill="url(#btnGrad)" />
                            </Svg>
                          </View>
                          <View style={styles.bookBtn}>
                            {openingPujaId === puja.puja_id && (
                              <View style={[StyleSheet.absoluteFillObject, { justifyContent: 'center', alignItems: 'center', zIndex: 2 }]}>
                                <ActivityIndicator size="small" color="#FFF" />
                              </View>
                            )}
                            <View style={{ flexDirection: 'row', alignItems: 'center', opacity: openingPujaId === puja.puja_id ? 0 : 1 }}>
                              <Eye size={12} color="#FFF" style={{ marginRight: 6 }} />
                              <Text style={[
                                styles.bookBtnText,
                                puja.puja_active_status === 0 && styles.bookBtnTextDisabled,
                              ]}>
                                {puja.puja_active_status === 0
                                  ? isBn ? 'অনুপলব্ধ' : 'Not Available'
                                  : isBn ? 'প্যাকেজ দেখুন' : 'View packages'}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <NoDataFound
              message={isBn ? 'কোনো পূজা পাওয়া যায়নি' : 'No pujas found'}
              containerHeight={250}
            />
          )}

          {/* ── Footer Progress Indicator & Load More Button ── */}
          {!isLoadingPujas && finalFilteredPujas.length > 0 && (
            <View style={styles.footerPaginationContainer}>
              <View style={styles.paginationRow}>
                <View style={styles.paginationTextContainer}>
                  <Text style={styles.paginationText}>
                    {isBn
                      ? `${Math.min(displayLimit, finalFilteredPujas.length)} এর মধ্যে ${finalFilteredPujas.length}`
                      : `${Math.min(displayLimit, finalFilteredPujas.length)} of ${finalFilteredPujas.length}`}
                  </Text>
                  <Text style={styles.paginationSubText}>
                    {isBn ? 'টি পূজা পরিষেবা দেখানো হয়েছে' : 'puja services shown'}
                  </Text>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${(Math.min(displayLimit, finalFilteredPujas.length) / finalFilteredPujas.length) * 100}%` },
                    ]}
                  />
                </View>
              </View>

              {/* Load More Button */}
              {displayLimit < finalFilteredPujas.length && (
                <TouchableOpacity
                  style={styles.loadMoreBtn}
                  onPress={() => setDisplayLimit((prev) => prev + 12)}
                >
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                    <Svg height="100%" width="100%">
                      <Defs>
                        <LinearGradient id="btnGradLoadMore" x1="0%" y1="0%" x2="100%" y2="100%">
                          <Stop offset="0%" stopColor="#FF9933" />
                          <Stop offset="100%" stopColor="#E07800" />
                        </LinearGradient>
                      </Defs>
                      <Rect x="0" y="0" width="100%" height="100%" fill="url(#btnGradLoadMore)" />
                    </Svg>
                  </View>
                  <View style={{ paddingVertical: 14, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={styles.loadMoreBtnText}>
                      {isBn ? 'আরো ১২টি দেখান ▾' : 'Show 12 more ▾'}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ── Recently Viewed Section ── */}
          {recentPujas.length > 0 && (
            <View style={{ marginHorizontal: 16, marginTop: 24, backgroundColor: '#FFFDF6', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#FDBA74' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF5EB', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <CalendarClock size={20} color="#F97316" />
                  </View>
                  <View>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#F97316', letterSpacing: 0.5 }}>{isBn ? 'অনুসন্ধান চালিয়ে যান' : 'CONTINUE EXPLORING'}</Text>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#1F2937' }}>{isBn ? 'সম্প্রতি দেখা' : 'Recently viewed'}</Text>
                    <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{isBn ? 'যেখান থেকে ছেড়েছিলেন সেখান থেকে শুরু করুন।' : 'Pick up where you left off.'}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#FDBA74', justifyContent: 'center', alignItems: 'center' }}
                  onPress={async () => {
                    await import('../../utils/recentUtils').then(m => m.clearRecentPujas());
                    setRecentPujas([]);
                  }}
                >
                  <Trash2 size={16} color="#F97316" />
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {recentPujas.map((puja, index) => {
                  const pMinPrice = puja.minimum_price || puja.puja_with_samagri_amount || 0;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={{ width: 280, backgroundColor: '#FFF', borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#F3E8DF' }}
                      onPress={async () => {
                        setOpeningPujaId(puja.puja_id);
                        setSelectedPujaForPackages(puja);
                        try {
                          await fetchPackages(puja.puja_id.toString()).unwrap();
                        } catch (error) {
                          console.error('Failed to fetch packages:', error);
                        } finally {
                          setOpeningPujaId(null);
                          setShowPackagesModal(true);
                        }
                      }}
                    >
                      <View style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', backgroundColor: '#F3F4F6' }}>
                        {puja.icon ? (
                          <Image source={{ uri: puja.icon }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        ) : (
                          <ImagePlaceholder />
                        )}
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: '#1F2937', marginBottom: 4 }} numberOfLines={1}>{puja.puja_name || puja.puja_type_name}</Text>
                        <Text style={{ fontSize: 11, color: '#6B7280' }}>
                          {isBn ? 'প্যাকেজ শুরু' : 'Packages from '}
                          <Text style={{ fontWeight: '800', color: '#374151' }}>₹{pMinPrice}</Text>
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#F97316', marginRight: 4 }}>{isBn ? 'প্যাকেজ দেখুন' : 'View packages'}</Text>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#F97316' }}>→</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Spacer */}
          <View style={{ height: Math.max(120, insets.bottom + 80) }} />
        </ScrollView>

        {/* ── Sort Dropdown Menu Modal (Screenshot Matching) ── */}
        <Modal
          visible={showSortModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSortModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowSortModal(false)}>
            <View style={styles.sortModalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.sortDropdownMenuContainer}>
                  {/* Option: Recommended */}
                  <TouchableOpacity
                    style={[
                      styles.sortMenuItem,
                      sortBy === 'Recommended' && styles.sortMenuItemActive,
                    ]}
                    onPress={() => {
                      setSortBy('Recommended');
                      setShowSortModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.sortMenuItemText,
                        sortBy === 'Recommended' && styles.sortMenuItemTextActive,
                      ]}
                    >
                      {isBn ? 'প্রস্তাবিত' : 'Recommended'}
                    </Text>
                  </TouchableOpacity>

                  {/* Option: Price: Low to High */}
                  <TouchableOpacity
                    style={[
                      styles.sortMenuItem,
                      sortBy === 'priceLow' && styles.sortMenuItemActive,
                    ]}
                    onPress={() => {
                      setSortBy('priceLow');
                      setShowSortModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.sortMenuItemText,
                        sortBy === 'priceLow' && styles.sortMenuItemTextActive,
                      ]}
                    >
                      {isBn ? 'মূল্য: কম থেকে বেশি' : 'Price: Low to High'}
                    </Text>
                  </TouchableOpacity>

                  {/* Option: Price: High to Low */}
                  <TouchableOpacity
                    style={[
                      styles.sortMenuItem,
                      sortBy === 'priceHigh' && styles.sortMenuItemActive,
                    ]}
                    onPress={() => {
                      setSortBy('priceHigh');
                      setShowSortModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.sortMenuItemText,
                        sortBy === 'priceHigh' && styles.sortMenuItemTextActive,
                      ]}
                    >
                      {isBn ? 'মূল্য: বেশি থেকে কম' : 'Price: High to Low'}
                    </Text>
                  </TouchableOpacity>

                  {/* Option: Name: A to Z */}
                  <TouchableOpacity
                    style={[
                      styles.sortMenuItem,
                      sortBy === 'nameAsc' && styles.sortMenuItemActive,
                      { borderBottomWidth: 0 },
                    ]}
                    onPress={() => {
                      setSortBy('nameAsc');
                      setShowSortModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.sortMenuItemText,
                        sortBy === 'nameAsc' && styles.sortMenuItemTextActive,
                      ]}
                    >
                      {isBn ? 'নাম: A থেকে Z' : 'Name: A to Z'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Profile Popover Menu */}
        {showProfileMenu && (
          <View style={[StyleSheet.absoluteFill, { zIndex: 99999, elevation: 99999 }]}>
            <TouchableWithoutFeedback onPress={() => setShowProfileMenu(false)}>
              <View style={styles.popoverOverlay}>
                <TouchableWithoutFeedback>
                  <View style={styles.popoverBox}>
                    <View style={styles.popoverHeader}>
                      <View style={{ flex: 1, alignItems: 'flex-start', paddingLeft: 5 }}>
                        <Text style={styles.popoverUserName}>
                          {userDetails?.ctnz_full_name || user?.user_name || 'User'}
                        </Text>
                        <Text style={styles.popoverUserPhone}>{user?.user_name || ''}</Text>
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
                          showToast({ message: t('common.connectionRequired'), type: 'error' });
                        }
                      }}
                    >
                      <User size={16} color="#F97316" style={{ marginRight: 10, opacity: 0.8 }} />
                      <Text style={styles.popoverItemText}>
                        {isBn ? 'প্রোফাইল সম্পাদন' : 'Edit Profile'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.popoverItem}
                      onPress={async () => {
                        const state = await NetInfo.fetch();
                        if (state.isConnected) {
                          setShowProfileMenu(false);
                          navigation.navigate('Address');
                        } else {
                          showToast({ message: t('common.connectionRequired'), type: 'error' });
                        }
                      }}
                    >
                      <MapPin size={16} color="#F97316" style={{ marginRight: 10, opacity: 0.8 }} />
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
                          showToast({ message: t('common.connectionRequired'), type: 'error' });
                        }
                      }}
                    >
                      <Clock size={16} color="#F97316" style={{ marginRight: 10, opacity: 0.8 }} />
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
                      <LogOut size={16} color="#EF4444" style={{ marginRight: 10, opacity: 0.8 }} />
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

        {/* ── Packages Modal (Exact Screenshot Color Palette Match) ── */}
        {showPackagesModal && (
          <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}>
            <View style={styles.packagesModalOverlay}>
              {/* Header */}
              <View style={styles.packagesModalHeader}>
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' }}>
                  <Svg height="100%" width="100%">
                    <Defs>
                      <LinearGradient id="modalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#FF9933" />
                        <Stop offset="100%" stopColor="#E07800" />
                      </LinearGradient>
                    </Defs>
                    <Rect x="0" y="0" width="100%" height="100%" fill="url(#modalGrad)" />
                  </Svg>
                </View>

                <Text style={styles.packagesModalTitle} numberOfLines={1}>
                  {selectedPujaForPackages?.puja_name || 'Puja'} packages
                </Text>

                <TouchableOpacity
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: '#FFFFFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                  onPress={() => setShowPackagesModal(false)}
                >
                  <X size={20} color="#E8700A" />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }} style={{ flex: 1, backgroundColor: '#FFFDF6' }}>

                {isLoadingModalPackages ? (
                  <View style={{ padding: 40, alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#E65100" />
                    <Text style={{ marginTop: 10, color: '#6B7280' }}>Loading packages...</Text>
                  </View>
                ) : modalPackagesData && modalPackagesData.length > 0 ? (
                  modalPackagesData.map((pkg: any, index: number) => {
                    const price = pkg.puja_package_price || pkg.maximum_price || 0;
                    const duration = pkg.puja_duration || pkg.duration_hours || 2;
                    const panditCount = pkg.pandit_count || 1;
                    const includesSamagri = pkg.puja_include_samagri === 1 || pkg.includes_samagri === 1;
                    const pkgId = pkg.puja_package_id || index;
                    const isAlreadyAdded = comparePackages.some((p) => p.package_id === pkgId);

                    return (
                      <View
                        key={`pkg-${pkgId}`}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: 16,
                          borderWidth: 1,
                          borderColor: '#E5E7EB',
                          padding: 18,
                          marginBottom: 16,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.03,
                          shadowRadius: 4,
                          elevation: 1,
                        }}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1, textTransform: 'uppercase' }}>
                            PACKAGE
                          </Text>
                          <Text style={{ fontSize: 20, fontWeight: '900', color: '#E65100' }}>
                            ₹{price.toLocaleString('en-IN')}
                          </Text>
                        </View>

                        <Text style={{ fontSize: 18, fontWeight: '800', color: '#1C1917', marginBottom: 14 }}>
                          {pkg.puja_package_name || 'Package'}
                        </Text>

                        <View style={{ gap: 10, marginBottom: 18 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <CalendarClock size={16} color="#E65100" />
                            <Text style={{ fontSize: 13, color: '#374151', fontWeight: '600' }}>{duration} hr</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <ShieldCheck size={16} color="#E65100" />
                            <Text style={{ fontSize: 13, color: '#374151', fontWeight: '600' }}>
                              {panditCount} priest{panditCount > 1 ? 's' : ''}
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <ShieldCheck size={16} color="#E65100" />
                            <Text style={{ fontSize: 13, color: '#374151', fontWeight: '600' }}>
                              {includesSamagri ? 'Materials included' : 'Materials extra'}
                            </Text>
                          </View>
                        </View>

                        {/* Action Buttons Row matching screenshot */}
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                          {/* Select Button */}
                          <TouchableOpacity
                            style={{
                              flex: 1,
                              backgroundColor: '#E8700A',
                              paddingVertical: 12,
                              borderRadius: 12,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            activeOpacity={0.85}
                            onPress={() => {
                              setShowPackagesModal(false);
                              navigation.navigate('PujaDetails', {
                                pujaId: selectedPujaForPackages?.puja_id,
                                pujaData: selectedPujaForPackages,
                              });
                            }}
                          >
                            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>Select</Text>
                          </TouchableOpacity>

                          {/* Compare / Added Button */}
                          <TouchableOpacity
                            style={{
                              flex: 1,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              paddingVertical: 12,
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: isAlreadyAdded ? '#FDBA74' : '#D1D5DB',
                              backgroundColor: isAlreadyAdded ? '#FFF8F0' : '#FFFFFF',
                              gap: 6,
                            }}
                            activeOpacity={0.8}
                            onPress={() => {
                              if (isAlreadyAdded) {
                                setComparePackages((prev) => prev.filter((p) => p.package_id !== pkgId));
                              } else {
                                if (comparePackages.length >= 3) {
                                  showToast({ message: 'You can compare maximum 3 packages', type: 'error' });
                                  return;
                                }
                                const newPkg: PackageComparisonItem = {
                                  package_id: pkgId,
                                  package_name: pkg.puja_package_name || 'Puja Package',
                                  package_description: pkg.puja_package_description || '',
                                  package_price: price,
                                  pandit_count: panditCount,
                                  package_duration_hours: duration,
                                  includes_samagri: includesSamagri ? 1 : 0,
                                  procedure_involved: pkg.procedure_involved || pkg.puja_package_description || '',
                                };
                                setComparePackages((prev) => [...prev, newPkg]);
                              }
                            }}
                          >
                            <Scale size={16} color={isAlreadyAdded ? '#C84400' : '#4B5563'} />
                            <Text style={{ fontSize: 14, fontWeight: '700', color: isAlreadyAdded ? '#C84400' : '#374151' }}>
                              {isAlreadyAdded ? 'Added' : 'Compare'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#6B7280' }}>No packages found for this Puja.</Text>
                  </View>
                )}

              {/* ── Compare Tray Card inside Modal matching screenshot ── */}
              {comparePackages.length > 0 && (
                <View
                  style={{
                    backgroundColor: '#FFFDF9',
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: '#FDBA74',
                    padding: 12,
                    marginBottom: 10,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <Scale size={20} color="#E8700A" />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: '#1C1917' }}>
                        {comparePackages.length} of 3 selected
                      </Text>
                      <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }} numberOfLines={1}>
                        {comparePackages.map((p) => p.package_name).join(' • ')}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: '#D1D5DB',
                        paddingVertical: 10,
                        borderRadius: 10,
                        alignItems: 'center',
                      }}
                      onPress={() => setComparePackages([])}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>Clear</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{
                        flex: 1,
                        backgroundColor: comparePackages.length >= 2 ? '#E8700A' : '#9CA3AF',
                        paddingVertical: 10,
                        borderRadius: 10,
                        alignItems: 'center',
                      }}
                      disabled={comparePackages.length < 2}
                      onPress={() => setShowComparisonModal(true)}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>Compare now</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Schedule Confidence Info Box matching screenshot */}
              <View
                style={{
                  backgroundColor: '#FFFDF9',
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: '#FED7AA',
                  padding: 12,
                  marginBottom: 10,
                }}
              >
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  <CalendarClock size={20} color="#E8700A" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#1C1917', marginBottom: 2 }}>
                      Schedule with confidence
                    </Text>
                    <Text style={{ fontSize: 11, color: '#57534E', lineHeight: 16 }}>
                      Available dates and service coverage are confirmed for your address before payment.
                    </Text>
                  </View>
                </View>
              </View>

              {/* View Complete Details Button matching screenshot */}
              <TouchableOpacity
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: '#E8700A',
                  paddingVertical: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                  marginBottom: 10,
                }}
                onPress={() => {
                  setShowPackagesModal(false);
                  navigation.navigate('PujaDetails', {
                    pujaId: selectedPujaForPackages?.puja_id,
                    pujaData: selectedPujaForPackages,
                  });
                }}
              >
                <Eye size={18} color="#E8700A" />
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#E8700A' }}>
                  View complete puja details
                </Text>
              </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      )}

      <PackageComparisonModal
        visible={showComparisonModal}
        pujaTitle={selectedPujaForPackages?.puja_name || selectedPujaForPackages?.puja_type_name || 'Puja Services'}
        packages={comparePackages}
        onClose={() => {
          setShowComparisonModal(false);
          setComparePackages([]); // Unselect compare packages after coming back
        }}
        onSelectPackage={(pkg) => {
          setShowComparisonModal(false);
          setComparePackages([]); // Unselect compare packages after selecting
          setShowPackagesModal(false);
          navigation.navigate('PujaDetails', {
            pujaId: selectedPujaForPackages?.puja_id,
            pujaData: selectedPujaForPackages,
          });
        }}
      />

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND_BG },

  // Top header matching screenshot 4 (Solid Orange header)
  header: {
    backgroundColor: '#F0852D',
    zIndex: 100,
  },
  headerInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBtnText: { fontSize: 20, color: '#FFF' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBtn: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.red,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: { color: Colors.white, fontSize: 9, fontWeight: '800' },

  // Body
  body: { flex: 1 },

  // Search Bar Section Background
  searchSectionBackground: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 16,
  },

  searchIcon: {
    marginRight: 12,
  },
  searchInputWrapper: {
    flex: 1,
    height: '80%',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    backgroundColor: 'transparent',
  },

  // Title Banner Card matching screenshot 4
  titleSectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FDBA74',
    alignItems: 'flex-start',
  },
  titleSectionLine: {
    width: 60,
    height: 3,
    backgroundColor: BRAND_PRIMARY,
    marginTop: 6,
    marginBottom: 16,
    borderRadius: 2,
  },
  titleServices: {
    color: BRAND_TEXT,
    fontSize: 22,
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
  },
  badgeItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8F1',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  badgeItemText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#291811',
  },

  // Purpose Categories
  purposeSection: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FDBA74',
    overflow: 'visible', // allow the glow line to show on the border
  },
  glowLine: {
    position: 'absolute',
    top: -1.5,
    left: '10%',
    right: '10%',
    height: 3,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  purposeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sparkIconContainer: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purposeTitle: {
    color: BRAND_TEXT,
    fontSize: 13,
    fontWeight: '800',
  },
  categoriesContent: {
    paddingRight: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipActive: {
    backgroundColor: '#FFF8F1',
    borderColor: '#F97316',
  },
  categoryChipIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: '#FFF7ED',
  },
  categoryChipIconContainerActive: {
    backgroundColor: '#F97316',
  },
  categoryChipText: {
    fontSize: 13,
    color: BRAND_MUTED,
    fontWeight: '700',
    paddingRight: 6,
  },
  categoryChipTextActive: {
    color: '#F97316',
  },

  // Count and Sort row matching screenshot
  countSortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  totalPujasText: {
    fontSize: 16,
    color: '#291811',
    fontWeight: '800',
  },
  sortDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#F97316', // Orange border matching screenshot
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  sortDropdownBtnText: {
    fontSize: 13,
    color: '#291811',
    fontWeight: '700',
  },

  // Filters accordion
  filterBarContainer: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  filterBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#FDBA74',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterBarHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#291811',
  },
  filterPanelCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  filterSection: {
    marginBottom: 10,
  },
  filterSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: BRAND_TEXT,
    marginBottom: 6,
  },
  priceInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 34,
  },
  priceInputCurrency: {
    fontSize: 12,
    fontWeight: '700',
    color: BRAND_TEXT,
    marginRight: 3,
  },
  priceTextInput: {
    flex: 1,
    fontSize: 11,
    color: BRAND_TEXT,
    fontWeight: '600',
    padding: 0,
  },
  priceInputSeparator: {
    fontSize: 12,
    color: BRAND_MUTED,
  },
  clearPriceBtn: {
    paddingHorizontal: 6,
  },
  clearPriceBtnText: {
    fontSize: 10,
    color: Colors.red,
    fontWeight: '700',
  },
  collectionOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  collectionOptionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  collectionOptionChipActive: {
    backgroundColor: BRAND_PRIMARY,
  },
  collectionOptionChipText: {
    fontSize: 10,
    color: BRAND_MUTED,
    fontWeight: '500',
  },
  collectionOptionChipTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },

  // Puja Cards List (Horizontal Row split matching Screenshot 4)
  pujasContainer: {
    paddingHorizontal: 16,
    marginTop: 14,
    gap: 12,
  },
  pujaCardRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FDBA74', // changed to match other containers
    padding: 14,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 12,
  },
  cardImgLeftBox: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  pujaIconImage: {
    width: '100%',
    height: '100%',
  },
  cardBodyRight: {
    flex: 1,
  },
  titleHeartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: BRAND_TEXT,
    flex: 1,
    marginRight: 6,
  },
  heartBtnOutline: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 4,
    paddingBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F3F4F6',
  },
  durationRatingBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 10,
    color: BRAND_MUTED,
    fontWeight: '600',
  },
  compareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#FFFDFB',
    gap: 2,
  },
  compareBtnIcon: {
    fontSize: 10,
  },
  compareBtnText: {
    fontSize: 9,
    fontWeight: '700',
    color: BRAND_PRIMARY,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  packagesFromLabel: {
    fontSize: 8,
    color: BRAND_MUTED,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  priceValueText: {
    fontSize: 13,
    fontWeight: '900',
    color: BRAND_TEXT,
    marginTop: 1,
  },
  bookBtnContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  bookBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  bookBtnDisabled: {
    backgroundColor: Colors.disabled,
  },
  bookBtnText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  bookBtnTextDisabled: {
    color: Colors.gray,
  },

  // Loader
  centeredSectionLoader: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  loaderText: {
    fontSize: 12,
    color: BRAND_MUTED,
    fontWeight: '600',
  },

  // Pagination Footer
  footerPaginationContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#FFFDF6', // matching the subtle background
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  paginationTextContainer: {
    flexShrink: 0,
  },
  paginationText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '800',
  },
  paginationSubText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '600',
  },
  progressBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    marginLeft: 16,
    overflow: 'hidden',
  },
  searchContainerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 20,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FDBA74', // changed to match other cards
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F97316',
    borderRadius: 3,
  },
  loadMoreBtn: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  loadMoreBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // Sort Dropdown Menu Overlay matching screenshot
  sortModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 275 : 265, // Aligned directly underneath the sort button
    paddingRight: 16,
  },
  sortDropdownMenuContainer: {
    width: 210,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  sortMenuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sortMenuItemActive: {
    backgroundColor: '#555555', // Dark charcoal active state matching uploaded screenshot
  },
  sortMenuItemText: {
    fontSize: 14,
    color: '#0284C7', // Crisp blueish/slate font matching screenshot
    fontWeight: '600',
  },
  sortMenuItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Profile Popover
  popoverOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  popoverBox: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 180,
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 10,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 8,
  },
  popoverHeader: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  popoverUserName: { fontSize: 14, fontWeight: '800', color: BRAND_TEXT },
  popoverUserPhone: { fontSize: 11, color: Colors.gray, marginTop: 1, fontWeight: '500' },
  popoverDivider: { height: 0.5, backgroundColor: Colors.lightGray, marginVertical: 3 },
  popoverItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  popoverItemIconOrange: { fontSize: 14, marginRight: 10, opacity: 0.8 },
  popoverItemText: { fontSize: 13, color: Colors.textMuted, flex: 1, fontWeight: '500' },
  popoverItemIconRed: { fontSize: 14, marginRight: 10, opacity: 0.8 },
  popoverItemTextRed: { fontSize: 13, color: Colors.red, fontWeight: '500' },

  // ── Packages Modal Styles ──
  packagesModalOverlay: {
    flex: 1,
    backgroundColor: '#FFFDF6', // matching app background
  },
  packagesModalHeader: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  packagesModalTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    zIndex: 1,
  },
  packagesModalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  packagesModalCloseBtnText: {
    color: '#F97316',
    fontWeight: '900',
    fontSize: 16,
  },
  packagesModalContent: {
    padding: 16,
    gap: 16,
  },
  packageCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 16,
  },
  packageCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  packageCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 1,
  },
  packageCardPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: '#EA580C',
  },
  packageCardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 6,
  },
  packageCardDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 16,
  },
  packageFeatureList: {
    gap: 8,
    marginBottom: 16,
  },
  packageFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  packageFeatureText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  packageSelectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  packageSelectBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  packageCardActionText: {
    color: '#F97316',
    fontSize: 14,
    fontWeight: '800',
  },

  // ── FILTER MODAL STYLES (NEW) ──
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    maxHeight: '90%',
  },
  filterModalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  filterModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#3F251A',
    marginBottom: 4,
  },
  filterModalSubtitle: {
    fontSize: 13,
    color: '#A78B7D',
    fontWeight: '500',
  },
  filterModalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF8F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  filterModalDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  filterModalSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#854D0E',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  filterModalCollectionsContainer: {
    gap: 16,
  },
  filterModalCollectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterModalCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  filterModalCheckboxActive: {
    backgroundColor: '#EF6C00',
    borderColor: '#EF6C00',
  },
  filterModalCollectionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1917',
  },
  filterModalCollectionTextActive: {
    color: '#EF6C00',
    fontWeight: '700',
  },
  filterModalFooter: {
    marginTop: 16,
    gap: 12,
  },
  filterModalResetBtn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    borderStyle: 'dashed',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterModalResetBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#854D0E',
  },
  filterModalApplyBtn: {
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
  },
  filterModalApplyGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterModalApplyBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  scheduleInfoBox: {
    backgroundColor: '#FFF8F1',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  scheduleInfoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  scheduleInfoDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FED7AA',
    backgroundColor: '#FFF',
    gap: 8,
  },
  viewDetailsBtnText: {
    color: '#F97316',
    fontWeight: '800',
    fontSize: 14,
  },
});
