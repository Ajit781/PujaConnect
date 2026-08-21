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
} from 'lucide-react-native';
import { RootState } from '../../store';
import { markWishlistAsSeen } from '../../store/slices/wishlistSlice';
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
      return () => {};
    }, [dispatch]),
  );

  const user = useSelector((state: RootState) => state.auth.user);
  const favorites = useSelector(
    (state: RootState) => state.wishlist?.favorites || [],
  );

  const [pageNo, setPageNo] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
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
        await savePujaTag({
          userId: user.user_id,
          pujaId: parseInt(pujaId, 10),
          tagId: WISHLIST_TAG_ID,
          action,
          skipGlobalLoader: true,
        }).unwrap();
      } catch (error) {
        console.error('Failed to update wishlist:', error);
      }
    },
    [user?.user_id, favorites, savePujaTag],
  );

  const handleClearAll = useCallback(async () => {
    if (!user?.user_id || wishlistPujas.length === 0) return;
    try {
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

      return (
        <View style={styles.cardContainer}>
          {/* Card Image Banner matching Screenshot */}
          <View style={styles.cardImageBanner}>
            {puja.icon ? (
              <Image
                source={{ uri: puja.icon }}
                style={styles.cardImage}
                resizeMode="cover"
              />
            ) : (
              <ImagePlaceholder />
            )}

            {/* Heart Button Overlay Top Left */}
            <TouchableOpacity
              style={styles.heartOverlayBtn}
              activeOpacity={0.8}
              onPress={async () => {
                const state = await NetInfo.fetch();
                if (state.isConnected) {
                  pId && handleToggleFavorite(pId.toString());
                } else {
                  showToast({
                    message: t('common.connectionRequired'),
                    type: 'error',
                  });
                }
              }}
            >
              <Heart
                size={18}
                color={isFav ? '#DC2626' : '#6B7280'}
                fill={isFav ? '#DC2626' : 'none'}
              />
            </TouchableOpacity>

            {/* Popular Badge Overlay Top Right */}
            <View style={styles.popularBadge}>
              <Sparkles size={12} color="#FFFFFF" />
              <Text style={styles.popularBadgeText}>Popular</Text>
            </View>
          </View>

          {/* Card Content Section matching Screenshot */}
          <TouchableOpacity
            style={styles.cardContentBox}
            activeOpacity={0.9}
            onPress={() => {
              NetInfo.fetch().then(state => {
                if (state.isConnected) {
                  navigation.navigate('PujaDetails', {
                    pujaId: pId?.toString(),
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
            <Text style={styles.cardTitle}>{pName}</Text>
            <Text style={styles.cardSubtitle}>
              {puja.tagline ||
                (isBn
                  ? 'শুভ নতুন শুরুর জন্য বিশেষ পূজা'
                  : 'Auspicious worship for new beginnings')}
            </Text>
            <Text style={styles.cardDescription} numberOfLines={3}>
              {puja.description ||
                puja.puja_description ||
                (isBn
                  ? 'পবিত্র বৈদিক আচারের মাধ্যমে সুখ ও সমৃদ্ধি লাভ করুন।'
                  : 'Traditional Ganesh worship with sankalpa, mantra chanting, offerings, and aarti to seek wisdom and obstacle-free progress.')}
            </Text>

            {/* Duration Pill matching Screenshot 2 */}
            <View style={styles.durationPill}>
              <Clock size={14} color="#C84400" />
              <Text style={styles.durationPillText}>
                {puja.duration || puja.puja_duration || '1.5'} {isBn ? 'ঘন্টা' : 'hours'}
              </Text>
            </View>

            {/* Price Range & Rating Box matching Screenshot 2 */}
            <View style={styles.priceRatingBox}>
              <View style={styles.priceCol}>
                <Text style={styles.boxLabelText}>{isBn ? 'মূল্য সীমা' : 'PRICE RANGE'}</Text>
                <Text style={styles.boxPriceValueText}>
                  {puja.price_range || (puja.minimum_price ? `₹${puja.minimum_price.toLocaleString('en-IN')} – ₹${((puja.minimum_price || 1000) * 2).toLocaleString('en-IN')}` : '₹1,100 – ₹2,100')}
                </Text>
              </View>
              <View style={styles.ratingCol}>
                <Text style={styles.boxLabelText}>{isBn ? 'রেটিং' : 'RATING'}</Text>
                <View style={styles.starsRow}>
                  <Star size={12} color="#F59E0B" fill="#F59E0B" />
                  <Star size={12} color="#F59E0B" fill="#F59E0B" />
                  <Star size={12} color="#F59E0B" fill="#F59E0B" />
                  <Star size={12} color="#F59E0B" fill="#F59E0B" />
                  <Star size={12} color="#D1D5DB" fill="#D1D5DB" />
                </View>
              </View>
            </View>

            {/* View Details Action Button matching Screenshot 2 */}
            <TouchableOpacity
              style={styles.viewDetailsBtn}
              activeOpacity={0.9}
              onPress={() => {
                NetInfo.fetch().then(state => {
                  if (state.isConnected) {
                    navigation.navigate('PujaDetails', {
                      pujaId: pId?.toString(),
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
              <Text style={styles.viewDetailsBtnText}>
                {isBn ? 'বিস্তারিত দেখুন' : 'View details'}
              </Text>
              <ChevronRight size={16} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      );
    },
    [favorites, handleToggleFavorite, isBn, navigation, showToast, t],
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
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF6' },
  body: { flex: 1 },

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
});
