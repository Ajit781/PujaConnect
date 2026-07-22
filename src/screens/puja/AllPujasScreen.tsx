import React, { useState, useRef, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Image,
  Modal,
  FlatList,
  Platform,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '../../store';
import { setFavorites } from '../../store/slices/wishlistSlice';
import {
  useGetPujaTagsQuery,
  useGetTagPujasQuery,
  useSavePujaTagMutation,
  useGetAllPujaCountQuery,
} from '../../store/api/pujaApi';
import NoDataFound from '../../components/common/NoDataFound';
import ImagePlaceholder from '../../components/common/ImagePlaceholder';
import { useToast } from '../../context/ToastContext';
import { Colors } from '../../constants/Colors';

export default function AllPujasScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { i18n } = useTranslation();
  const isBn = i18n.language === 'bn';
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const user = useSelector((state: RootState) => state.auth.user);
  const favorites = useSelector(
    (state: RootState) => state.wishlist?.favorites || [],
  );

  const [selectedTagId, setSelectedTagId] = useState<number>(
    route?.params?.initialTagId || 1,
  );
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [pageNo, setPageNo] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const LIMIT = 10;
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // RTK Query Hooks
  const { data: pujaTags = [], refetch: refetchTags } = useGetPujaTagsQuery();

  const {
    data: currentPujas = [],
    isLoading,
    isError,
    error,
    refetch: refetchCurrentPujas,
  } = useGetTagPujasQuery(
    {
      userId: user?.user_id || user?.id || 0,
      tagId: selectedTagId,
      pageNo,
      limit: LIMIT,
    },
    { skip: !user?.user_id && !user?.id, skipGlobalLoader: true } as any,
  );

  const { data: totalPujaCount = 0, refetch: refetchCount } =
    useGetAllPujaCountQuery(
      {
        userId: user?.user_id || user?.id || 0,
        tagId: selectedTagId,
      },
      { skip: !user?.user_id && !user?.id } as any,
    );
  const totalCount =
    typeof totalPujaCount === 'object'
      ? (totalPujaCount as any).total_puja_count || 0
      : totalPujaCount;

  const hasMore = pageNo * LIMIT < totalCount;

  React.useEffect(() => {
    setPageNo(1);
  }, [selectedTagId]);

  // Sync favorites from server
  const WISHLIST_TAG_ID = 3;
  const { data: wishlistPujas, refetch: refetchWishlist } = useGetTagPujasQuery(
    {
      userId: user?.user_id || 0,
      tagId: WISHLIST_TAG_ID,
      pageNo: 1,
      limit: 100,
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchTags(),
        refetchCurrentPujas(),
        refetchCount(),
        refetchWishlist(),
      ]);
    } catch (err) {
      console.error('AllPujas refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  }, [refetchTags, refetchCurrentPujas, refetchCount, refetchWishlist]);

  const handleToggleFavoriteServer = useCallback(
    async (pujaId: string) => {
      if (!user?.user_id) return;

      const isCurrentlyFav = favorites.includes(pujaId);
      // Optimistic toggle is handled by pujaApi.ts onQueryStarted

      try {
        await savePujaTag({
          userId: user.user_id,
          pujaId: parseInt(pujaId, 10),
          tagId: WISHLIST_TAG_ID,
          action: isCurrentlyFav ? 5 : 1,
          skipGlobalLoader: true,
        }).unwrap();
      } catch (err) {
        console.error('Wishlist sync failed:', err);
        // Revert is handled by pujaApi.ts
      }
    },
    [user?.user_id, favorites, savePujaTag],
  );

  const handleNextPage = () => {
    if (hasMore) {
      setPageNo(prev => prev + 1);
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  };

  const handlePrevPage = () => {
    if (pageNo > 1) {
      setPageNo(prev => prev - 1);
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  };

  const filteredPujas = currentPujas.filter(p => {
    // 1. Text search
    const q = searchQuery.toLowerCase();
    const name = p.puja_name || p.puja_type_name || '';
    const searchMatch = name.toLowerCase().includes(q);
    if (!searchMatch) return false;

    // 2. Favorite logic (if showing 'Favourite' tag 3)
    if (selectedTagId === 3) {
      const pId = p.puja_id || p.puja_type_id;
      return pId ? favorites.includes(pId.toString()) : false;
    }
    return true;
  });

  const getTagName = (tagId: number) => {
    const tag = pujaTags.find(tg => tg.tag_id === tagId);
    if (!tag) return isBn ? 'সব' : 'All';
    if (isBn) {
      if (tag.tag_value === 'All') return 'সব';
      if (tag.tag_value === 'Featured') return 'বৈশিষ্ট্যযুক্ত';
      if (tag.tag_value === 'Favourite') return 'প্রিয়';
      if (tag.tag_value === 'Popular') return 'জনপ্রিয়';
    }
    return tag.tag_value;
  };

  const renderPujaCard = useCallback(
    ({ item: puja }: any) => {
      const pId = puja.puja_id || puja.puja_type_id;
      const pName = puja.puja_name || puja.puja_type_name;
      const pMinPrice =
        puja.minimum_price || puja.puja_with_samagri_amount || 0;
      const pMaxPrice =
        puja.maximum_price || puja.puja_with_samagri_amount || 0; // Fixed pMaxPrice source
      const pPrice =
        pMinPrice === pMaxPrice
          ? `₹${pMinPrice.toLocaleString('en-IN')}`
          : `₹${pMinPrice.toLocaleString('en-IN')}-₹${pMaxPrice.toLocaleString(
              'en-IN',
            )}`;
      const pDuration =
        puja.duration ||
        (puja.puja_duration ? puja.puja_duration.toString() : '');
      const pRating = puja.puja_rating || 5;

      return (
        <View style={styles.gridCard}>
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
                {pId && favorites.includes(pId.toString()) ? '❤️' : '🤍'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.flex1}>
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

              <View style={styles.durationRow}>
                <Text style={styles.durationIcon}>⏱️</Text>
                <Text style={styles.durationText}>
                  {pDuration} {isBn ? 'ঘন্টা' : 'Hours'}
                </Text>
              </View>

              <View style={styles.priceRow}>
                <View style={styles.flex1}>
                  <Text style={styles.priceLabel}>
                    {isBn ? 'মূল্য সীমা' : 'PRICE RANGE'}
                  </Text>
                  <Text style={styles.priceValue} numberOfLines={1}>
                    {pPrice}
                  </Text>
                </View>
                <View style={styles.ratingCol}>
                  <Text style={styles.priceLabel}>
                    {isBn ? 'রেটিং' : 'RATING'}
                  </Text>
                  <View style={styles.ratingRow}>
                    <Text style={styles.ratingValue}>{pRating}</Text>
                    <Text style={styles.starIcon}>⭐</Text>
                  </View>
                </View>
              </View>
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
                  puja.puja_active_status === 0 && styles.bookBtnTextDisabled,
                ]}
              >
                {puja.puja_active_status === 0
                  ? isBn
                    ? 'উপলব্ধ নেই'
                    : 'Not Available'
                  : isBn
                  ? 'প্যাকেজ দেখুন →'
                  : 'View packages →'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [favorites, handleToggleFavoriteServer, isBn, navigation, showToast, t],
  );

  const renderHeader = () => (
    <View style={styles.controlsWrap}>
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={
            isBn
              ? 'নাম বা বিবরণ দিয়ে পূজা খুঁজুন...'
              : 'Search pujas by name or description...'
          }
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.placeholder}
        />
      </View>
    </View>
  );

  const renderFooter = () => {
    const isSearching = searchQuery.trim().length > 0;
    // Show pagination only if total count > 10
    const shouldShowPagination = isSearching
      ? filteredPujas.length >= 10
      : totalCount > LIMIT;

    return (
      <>
        {shouldShowPagination && (
          <View style={styles.paginationRow}>
            <TouchableOpacity
              style={[styles.pageBtn, pageNo === 1 && styles.pageBtnDisabled]}
              onPress={handlePrevPage}
              disabled={pageNo === 1}
            >
              <Text style={styles.pageBtnText}>← {isBn ? 'আগের' : 'Prev'}</Text>
            </TouchableOpacity>

            <View style={styles.pageNumBox}>
              <Text style={styles.pageNumText}>{pageNo}</Text>
            </View>

            <TouchableOpacity
              style={[styles.pageBtn, !hasMore && styles.pageBtnDisabled]}
              onPress={handleNextPage}
              disabled={!hasMore}
            >
              <Text style={styles.pageBtnText}>{isBn ? 'পরের' : 'Next'} →</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.bottomSpacer} />
      </>
    );
  };

  const headerStyle = [
    styles.header,
    styles.headerPadding,
    { paddingTop: insets.top + 12 },
  ];

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />
      <View style={headerStyle}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backBtnText}>← {isBn ? 'ফিরে যান' : 'Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isBn ? 'সব পূজা' : 'All Pujas'}</Text>

        <TouchableOpacity
          style={styles.headerFilterBtn}
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
          <Text style={styles.headerFilterBtnText}>
            {getTagName(selectedTagId)}
          </Text>
          <Text style={styles.dropdownArrowSmall}>▼</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        style={styles.body}
        data={filteredPujas}
        keyExtractor={item =>
          (item.puja_id || item.puja_type_id || Math.random()).toString()
        }
        renderItem={renderPujaCard}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={BRAND_PRIMARY} />
              <Text style={styles.loadingText}>
                {isBn ? 'লোড হচ্ছে...' : 'Loading Pujas...'}
              </Text>
            </View>
          ) : isError ? (
            <View style={styles.centerBox}>
              <Text style={styles.errorEmoji}>⚠️</Text>
              <Text style={styles.errorText}>
                {isBn ? 'ডেটা লোড করতে ব্যর্থ হয়েছে' : 'Failed to load data'}
              </Text>
              <Text style={styles.errorSubText}>{JSON.stringify(error)}</Text>
            </View>
          ) : (
            <NoDataFound
              message={
                isBn
                  ? 'কোনো পূজা খুঁজে পাওয়া যায়নি'
                  : 'No pujas found matching your selection'
              }
              containerHeight={300}
            />
          )
        }
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridContainer}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[BRAND_PRIMARY]}
            tintColor={BRAND_PRIMARY}
          />
        }
      />

      {/* Tag Filter Popover Menu */}
      <Modal
        visible={showTagMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTagMenu(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowTagMenu(false)}>
          <View style={styles.popoverOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.popoverBox, styles.modalBoxWidth]}>
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
                      setPageNo(1);
                    }}
                  >
                    <Text style={styles.popoverItemIconOrange}>🏷️</Text>
                    <Text
                      style={[
                        styles.popoverItemText,
                        selectedTagId === tag.tag_id && styles.selectedItemText,
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
                      <Text style={styles.checkMark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const BRAND_PRIMARY = Colors.primary;
const BRAND_TEXT = Colors.textMain;
const BRAND_MUTED = Colors.textMuted;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  headerPadding: { paddingBottom: 14 },
  backBtn: { paddingVertical: 10, paddingRight: 20 },
  backBtnText: { fontSize: 16, fontWeight: '700', color: BRAND_PRIMARY },
  headerTitle: { fontSize: 18, fontWeight: '800', color: BRAND_TEXT },

  body: { flex: 1 },
  controlsWrap: { paddingHorizontal: 16, marginBottom: 16, marginTop: 16 },
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
    borderColor: Colors.divider,
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
    borderColor: Colors.blueBorder,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: BRAND_TEXT },

  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  gridContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
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
    position: 'relative',
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    padding: 6,
    zIndex: 5,
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
    fontSize: 8,
    color: Colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  priceValue: { fontSize: 12, fontWeight: '800', color: Colors.textMain },
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

  safeArea: {
    backgroundColor: Colors.white,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 10,
  },
  headerSpacer: { width: 60 },
  flexSpacer: { flex: 1 },
  pujaImgText: { fontSize: 50 },
  heartIconText: { fontSize: 16 },
  ratingCol: { alignItems: 'flex-end' },
  bottomSpacer: { height: 40 },

  // New Dropdown Styles
  headerFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightOrange,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.blueBorder,
    gap: 6,
  },
  headerFilterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  dropdownArrowSmall: {
    fontSize: 8,
    color: Colors.primary,
  },

  // Popover Styles (Unified with Dashboard)
  popoverOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popoverBox: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 12,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
    overflow: 'hidden',
  },
  popoverHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  popoverUserName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textMain,
  },
  popoverDivider: {
    height: 1,
    backgroundColor: Colors.lightGray,
    width: '100%',
    marginBottom: 8,
  },
  popoverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  popoverItemIconOrange: { fontSize: 16, marginRight: 12, opacity: 0.8 },
  popoverItemText: {
    fontSize: 14,
    color: Colors.textMuted,
    flex: 1,
    fontWeight: '500',
  },
  loadMoreWrap: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 20,
  },
  paginationRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    gap: 16,
  },
  pageBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  pageBtnDisabled: {
    backgroundColor: Colors.disabled,
  },
  pageBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  pageNumBox: {
    backgroundColor: Colors.lightOrange,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  pageNumText: {
    color: Colors.primary,
    fontWeight: '800',
    fontSize: 16,
  },
  pujaIconImage: {
    width: '100%',
    height: '100%',
  },
  centerBox: {
    padding: 40,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: BRAND_MUTED,
    marginTop: 12,
    fontWeight: '600',
  },
  errorEmoji: {
    fontSize: 40,
  },
  errorText: {
    color: Colors.red,
    marginTop: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorSubText: {
    color: BRAND_MUTED,
    fontSize: 12,
    marginTop: 4,
  },
  flex1: {
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starRatingText: {
    fontSize: 10,
    color: Colors.gold,
  },
  starIcon: {
    fontSize: 10,
    color: Colors.gold,
  },
  modalBoxWidth: {
    width: '85%',
  },
  selectedItemText: {
    color: BRAND_PRIMARY,
    fontWeight: '800',
  },
  checkMark: {
    color: BRAND_PRIMARY,
    fontWeight: 'bold',
  },
});
