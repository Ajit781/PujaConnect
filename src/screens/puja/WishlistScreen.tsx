import PackagesListModal from '../../components/puja/PackagesListModal';

import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { Scale, CalendarClock, ShieldCheck } from 'lucide-react-native';
import PackageComparisonModal, { PackageComparisonItem } from '../../components/puja/PackageComparisonModal';
import { useLazyGetPujaPackagesQuery } from '../../store/api/pujaApi';
import React, { useState, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  TextInput,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import {
  Heart,
  Search,
  Trash2,
  Sparkles,
  ChevronRight,
  Clock,
  Star,
  Eye,
  X,
} from 'lucide-react-native';
import { RootState } from '../../store';
import { markWishlistAsSeen } from '../../store/slices/wishlistSlice';
import { showLoader, hideLoader } from '../../store/slices/loaderSlice';
import NoDataFound from '../../components/common/NoDataFound';
import ImagePlaceholder from '../../components/common/ImagePlaceholder';
import TopNavBar from '../../components/common/TopNavBar';
import { useToast } from '../../context/ToastContext';
import { Colors } from '../../constants/Colors';
import {
  useGetTagPujasQuery,
  useSavePujaTagMutation,
  useGetAllPujaCountQuery,
} from '../../store/api/pujaApi';

export default function WishlistScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { i18n } = useTranslation();
  const isBn = i18n.language === 'bn';
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { showToast } = useToast();

  useFocusEffect(
    useCallback(() => {
      dispatch(markWishlistAsSeen());
      return () => { };
    }, [dispatch]),
  );

  const user = useSelector((state: RootState) => state.auth.user);
  const favorites = useSelector(
    (state: RootState) => state.wishlist?.favorites || [],
  );

  const [pageNo, setPageNo] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  // Packages Modal & Comparison State
  const [showPackagesModal, setShowPackagesModal] = useState(false);
  const [selectedPujaForPackages, setSelectedPujaForPackages] = useState<any>(null);
  const [openingPujaId, setOpeningPujaId] = useState<number | null>(null);
  const [comparePackages, setComparePackages] = useState<PackageComparisonItem[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  // Fetch Packages dynamically for the selected Puja
  const [fetchPackages, { data: modalPackagesData, isFetching: isLoadingModalPackages }] = useLazyGetPujaPackagesQuery();

  const [searchQuery, setSearchQuery] = useState('');
  const LIMIT = 10;
  const WISHLIST_TAG_ID = 3;

  const [savePujaTag] = useSavePujaTagMutation();

  const {
    data: wishlistPujas = [],
    isLoading,
    refetch: refetchWishlist,
  } = useGetTagPujasQuery(
    {
      userId: user?.user_id || 0,
      tagId: WISHLIST_TAG_ID,
      pageNo,
      limit: LIMIT,
    },
    { skip: !user?.user_id, skipGlobalLoader: true } as any,
  );

  const { data: totalPujaCount = 0, refetch: refetchCount } =
    useGetAllPujaCountQuery(
      {
        userId: user?.user_id || 0,
        tagId: WISHLIST_TAG_ID,
      },
      { skip: !user?.user_id } as any,
    );

  const totalCount =
    typeof totalPujaCount === 'object'
      ? (totalPujaCount as any).total_puja_count || wishlistPujas.length
      : totalPujaCount || wishlistPujas.length;

  const hasMore = pageNo * LIMIT < totalCount;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchWishlist(), refetchCount()]);
    } catch (error) {
      console.error('Wishlist refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchWishlist, refetchCount]);

  const handleToggleFavorite = useCallback(
    async (pujaId: string) => {
      if (!user?.user_id) return;

      const isCurrentlyFavorited = favorites.includes(pujaId);
      const action = isCurrentlyFavorited ? 5 : 1;

      try {
        dispatch(showLoader());
        await savePujaTag({
          userId: user.user_id,
          pujaId: parseInt(pujaId, 10),
          tagId: WISHLIST_TAG_ID,
          action,
          skipGlobalLoader: true,
        }).unwrap();
      } catch (error) {
        console.error('Failed to update wishlist:', error);
      } finally {
        dispatch(hideLoader());
      }
    },
    [user?.user_id, favorites, savePujaTag],
  );

  const handleClearAll = useCallback(async () => {
    if (!user?.user_id || wishlistPujas.length === 0) return;
    try {
      dispatch(showLoader());
      for (const puja of wishlistPujas) {
        const pId = puja.puja_id || puja.puja_type_id;
        if (pId) {
          await savePujaTag({
            userId: user.user_id,
            pujaId: parseInt(pId.toString(), 10),
            tagId: WISHLIST_TAG_ID,
            action: 5,
            skipGlobalLoader: true,
          }).unwrap();
        }
      }
      showToast({
        message: isBn ? 'সকল ফেভারিট সরানো হয়েছে' : 'Cleared all favourites',
        type: 'success',
      });
      refetchWishlist();
    } catch (err) {
      console.error('Failed to clear all:', err);
    } finally {
      dispatch(hideLoader());
    }
  }, [user?.user_id, wishlistPujas, savePujaTag, isBn, showToast, refetchWishlist]);

  const filteredPujas = wishlistPujas.filter((p: any) => {
    if (!searchQuery.trim()) return true;
    const name = (p.puja_name || p.puja_type_name || '').toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const renderWishlistItem = useCallback(
    ({ item: puja }: any) => {
      const pId = puja.puja_id || puja.puja_type_id;
      const pName = puja.puja_name || puja.puja_type_name;
      const isFav = pId ? favorites.includes(pId.toString()) : true;
      const pMinPrice = puja.minimum_price || puja.puja_with_samagri_amount || 0;
      const pMaxPrice = puja.maximum_price || puja.puja_without_samagri_amount || 0;
      const pPriceStr = pMinPrice === pMaxPrice
        ? `₹${pMinPrice.toLocaleString('en-IN')}`
        : `₹${pMinPrice.toLocaleString('en-IN')}`;
      let rawDuration = puja.duration || puja.puja_duration || '2';
      let pDuration = String(rawDuration).includes('hr') ? rawDuration : `${rawDuration} hr`;

      return (
        <View style={styles.pujaCardRow}>
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
              <Text style={styles.cardTitleDash} numberOfLines={1}>{pName}</Text>
              <TouchableOpacity
                style={styles.heartBtnOutline}
                onPress={async () => {
                  const state = await NetInfo.fetch();
                  if (state.isConnected) {
                    pId && handleToggleFavorite(pId.toString());
                  } else {
                    showToast({ message: t('common.connectionRequired'), type: 'error' });
                  }
                }}
              >
                <Trash2
                  size={16}
                  color={Colors.red}
                />
              </TouchableOpacity>
            </View>

            {/* Duration, Rating and Compare row */}
            <View style={styles.detailsRow}>
              <View style={styles.durationRatingBox}>
                <Clock size={12} color="#6B5E59" style={{ marginRight: 3 }} />
                <Text style={styles.durationText}>{pDuration}</Text>
              </View>
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
                  // Save recently viewed via API
                  if (user?.user_id || user?.auth_id) {
                    savePujaTag({
                      userId: user.user_id || user.auth_id,
                      pujaId: puja.puja_id,
                      tagId: 5,
                      action: 1,
                      skipGlobalLoader: true
                    });
                  }
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
    },
    [favorites, handleToggleFavorite, isBn, navigation, showToast, t, fetchPackages, openingPujaId, savePujaTag, user],
  );

  const renderHeader = () => (
    <View style={styles.headerBannerSection}>
      {/* My Account & Header Title matching Screenshot */}
      <View style={styles.bannerRow}>
        <View style={styles.heartIconBadge}>
          <Heart size={20} color="#DC2626" fill="#DC2626" />
        </View>
        <View style={styles.titleTextCol}>
          <Text style={styles.accountLabelText}>
            {isBn ? 'আমার অ্যাকাউন্ট' : 'MY ACCOUNT'}
          </Text>
          <Text style={styles.mainHeaderTitle}>
            {isBn ? 'পছন্দের পূজা' : 'My favourites'}
          </Text>
        </View>
      </View>
      <Text style={styles.headerSubtitleText}>
        {isBn
          ? 'পবিত্র পূজাগুলি সংজ্ঞায়িত রাখুন এবং বুকিংয়ের জন্য প্রস্তুত হলে ফিরে আসুন।'
          : 'Keep meaningful pujas close and return when you are ready to book.'}
      </Text>

      {/* Filter & Control Card matching Screenshot */}
      <View style={styles.controlCard}>
        <View style={styles.controlCardTopRow}>
          <View>
            <Text style={styles.savedCountTitle}>
              {totalCount} {isBn ? 'সংরক্ষিত পূজা' : totalCount === 1 ? 'saved puja' : 'saved pujas'}
            </Text>
            <Text style={styles.availablePagesSub}>
              {isBn ? 'সকল পৃষ্ঠায় উপলব্ধ' : 'Available across all pages'}
            </Text>
          </View>

          {wishlistPujas.length > 0 && (
            <TouchableOpacity
              style={styles.clearAllBtn}
              activeOpacity={0.8}
              onPress={handleClearAll}
            >
              <Trash2 size={14} color="#DC2626" />
              <Text style={styles.clearAllText}>
                {isBn ? 'সব সরান' : 'Clear all'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Bar matching Screenshot */}
        <View style={styles.searchInputWrap}>
          <Search size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder={isBn ? 'পছন্দের পূজা খুঁজুন' : 'Search all favourites'}
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
    </View>
  );

  const renderFooter = () => (
    <>
      {totalCount > LIMIT && wishlistPujas.length > 0 && (
        <View style={styles.paginationRow}>
          <TouchableOpacity
            style={[styles.pageBtn, pageNo === 1 && styles.pageBtnDisabled]}
            onPress={() => pageNo > 1 && setPageNo(p => p - 1)}
            disabled={pageNo === 1}
          >
            <Text style={styles.pageBtnText}>
              {isBn ? 'পূর্ববর্তী' : 'Prev'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.pageText}>
            {isBn ? 'পৃষ্ঠা' : 'Page'} {pageNo}
          </Text>
          <TouchableOpacity
            style={[styles.pageBtn, !hasMore && styles.pageBtnDisabled]}
            onPress={() => hasMore && setPageNo(p => p + 1)}
            disabled={!hasMore}
          >
            <Text style={styles.pageBtnText}>{isBn ? 'পরবর্তী' : 'Next'}</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.bottomSpacer} />
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FFFDF6" barStyle="dark-content" translucent={true} />
      <TopNavBar showBack={true} />

      <FlatList
        style={styles.body}
        data={filteredPujas}
        keyExtractor={item =>
          (item.puja_id || item.puja_type_id || Math.random()).toString()
        }
        renderItem={renderWishlistItem}
        ListHeaderComponent={renderHeader()}
        ListFooterComponent={renderFooter()}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centerLoader}>
              <ActivityIndicator size="large" color="#E8700A" />
            </View>
          ) : (
            <NoDataFound
              message={
                isBn
                  ? 'আপনার পছন্দের তালিকায় কোনও পূজা নেই।'
                  : 'No pujas in your wishlist yet.'
              }
              containerHeight={280}
            />
          )
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#E8700A']}
            tintColor="#E8700A"
          />
        }
      />
    
        
        <PackagesListModal
          visible={showPackagesModal}
          onClose={() => setShowPackagesModal(false)}
          pujaData={selectedPujaForPackages}
          packages={modalPackagesData || []}
          isLoading={isLoadingModalPackages}
          comparePackages={comparePackages}
          setComparePackages={setComparePackages}
          onCompareNow={() => setShowComparisonModal(true)}
          onSelectPackage={(pkg) => {
            setShowPackagesModal(false);
            const chosenId = pkg?.puja_package_id || pkg?.package_id;
            navigation.navigate('PujaDetails', {
              pujaId: selectedPujaForPackages?.puja_id,
              pujaData: selectedPujaForPackages,
              selectedPackageId: chosenId,
              packageId: chosenId,
              selectedPackage: pkg,
            });
          }}
          onViewCompleteDetails={() => {
            setShowPackagesModal(false);
            navigation.navigate('PujaDetails', {
              pujaId: selectedPujaForPackages?.puja_id,
              pujaData: selectedPujaForPackages,
            });
          }}
        />


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
            const chosenCompareId = pkg?.package_id || (pkg as any)?.puja_package_id;
            navigation.navigate('PujaDetails', {
              pujaId: selectedPujaForPackages?.puja_id,
              pujaData: selectedPujaForPackages,
              selectedPackageId: chosenCompareId,
              packageId: chosenCompareId,
              selectedPackage: pkg,
            });
          }}
        />
      </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF6' },
  body: { flex: 1 },
  pujaCardRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FDBA74',
    padding: 14,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    marginHorizontal: 16,
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
  cardTitleDash: {
    fontSize: 14,
    fontWeight: '800',
    color: '#291811',
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
    color: '#6B5E59',
    fontWeight: '600',
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  packagesFromLabel: {
    fontSize: 8,
    color: '#6B5E59',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  priceValueText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#291811',
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


  // Header Banner matching Screenshot
  headerBannerSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heartIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleTextCol: { flex: 1 },
  accountLabelText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9C4A2F',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  mainHeaderTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1C1917',
  },
  headerSubtitleText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 16,
  },

  // Control Card matching Screenshot
  controlCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 16,
    marginBottom: 16,
  },
  controlCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  savedCountTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1917',
  },
  availablePagesSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF5F5',
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },

  // Search Input Bar matching Screenshot
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1C1917',
    paddingVertical: 0,
  },

  // Saved Puja Card Item matching Screenshot
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FED7AA',
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  cardImageBanner: {
    height: 180,
    backgroundColor: '#FAF5EE',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  heartOverlayBtn: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 5,
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#C84400',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    zIndex: 5,
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },

  cardContentBox: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C84400',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },

  // Duration Pill matching Screenshot 2
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginTop: 10,
    marginBottom: 12,
  },
  durationPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C84400',
  },

  // Price & Rating Split Box matching Screenshot 2
  priceRatingBox: {
    backgroundColor: '#FFFDF9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FED7AA',
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  priceCol: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#FED7AA',
    paddingRight: 10,
  },
  ratingCol: {
    flex: 1,
    paddingLeft: 14,
  },
  boxLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8A7A71',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  boxPriceValueText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1917',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },

  // View Details Button matching Screenshot 2
  viewDetailsBtn: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#C84400',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  viewDetailsBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  centerLoader: { height: 240, justifyContent: 'center', alignItems: 'center' },

  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 16,
  },
  pageBtn: {
    backgroundColor: '#E8700A',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pageBtnDisabled: { backgroundColor: '#D1D5DB' },
  pageBtnText: { color: '#FFFFFF', fontWeight: '600' },
  pageText: { fontSize: 14, fontWeight: '600', color: '#1C1917' },
  scrollContent: { paddingBottom: 60 },
  bottomSpacer: { height: 30 },

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


});
