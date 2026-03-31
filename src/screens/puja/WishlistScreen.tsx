import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { RootState } from '../../store';
import { markWishlistAsSeen } from '../../store/slices/wishlistSlice';
import NoDataFound from '../../components/common/NoDataFound';
import { Colors } from '../../constants/Colors';
import {
  useGetTagPujasQuery,
  useSavePujaTagMutation,
} from '../../store/api/pujaApi';

export default function WishlistScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { i18n } = useTranslation();
  const isBn = i18n.language === 'bn';
  const dispatch = useDispatch();

  useFocusEffect(
    React.useCallback(() => {
      dispatch(markWishlistAsSeen());
      return () => {};
    }, [dispatch]),
  );

  const user = useSelector((state: RootState) => state.auth.user);
  const favorites = useSelector(
    (state: RootState) => state.wishlist?.favorites || [],
  );

  const [pageNo, setPageNo] = useState(1);
  const LIMIT = 10;
  const WISHLIST_TAG_ID = 3;

  const [savePujaTag] = useSavePujaTagMutation();

  const { data: wishlistPujas = [], isLoading } = useGetTagPujasQuery(
    {
      userId: user?.user_id || 0,
      tagId: WISHLIST_TAG_ID,
      pageNo,
      limit: LIMIT,
    },
    { skip: !user?.user_id, skipGlobalLoader: true } as any,
  );

  const { data: nextPujas = [] } = useGetTagPujasQuery(
    {
      userId: user?.user_id || 0,
      tagId: WISHLIST_TAG_ID,
      pageNo: pageNo + 1,
      limit: LIMIT,
    },
    { skip: !user?.user_id, skipGlobalLoader: true } as any,
  );

  const hasMore = nextPujas.length > 0;

  const handleToggleFavorite = useCallback(
    async (pujaId: string) => {
      if (!user?.user_id) return;

      const isCurrentlyFavorited = favorites.includes(pujaId);
      const action = isCurrentlyFavorited ? 5 : 1;

      // Optimistic toggle is handled by pujaApi.ts via onQueryStarted (centralized)

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
        // Revert is handled by pujaApi.ts
      }
    },
    [user?.user_id, favorites, savePujaTag],
  );

  const handleNextPage = () => {
    if (hasMore) setPageNo(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (pageNo > 1) setPageNo(prev => prev - 1);
  };

  const renderWishlistItem = useCallback(
    ({ item: puja }: any) => {
      const pId = puja.puja_id || puja.puja_type_id;
      const pName = puja.puja_name || puja.puja_type_name;
      const isFav = pId ? favorites.includes(pId.toString()) : true;

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
              <Text style={styles.pujaImgText}>🛕</Text>
            )}
            <TouchableOpacity
              style={styles.heartBtn}
              onPress={() => pId && handleToggleFavorite(pId.toString())}
            >
              <Text style={styles.heartIconText}>{isFav ? '❤️' : '🤍'}</Text>
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

            <View style={styles.durationRow}>
              <Text style={styles.durationIcon}>⏱️</Text>
              <Text style={styles.durationText}>
                {puja.duration || puja.puja_duration} {isBn ? 'ঘন্টা' : 'Hours'}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.bookBtn,
                puja.puja_active_status === 0 && styles.bookBtnDisabled,
              ]}
              disabled={puja.puja_active_status === 0}
              onPress={() =>
                navigation.navigate('PujaDetails', {
                  pujaId: pId?.toString(),
                  pujaData: puja,
                })
              }
            >
              <Text style={styles.bookBtnText}>
                {puja.puja_active_status !== 0
                  ? isBn
                    ? 'বুক করুন →'
                    : 'Book Now →'
                  : isBn
                  ? 'উপলব্ধ নেই'
                  : 'Not Available'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [favorites, handleToggleFavorite, isBn, navigation],
  );

  const renderHeader = () => (
    <View style={styles.controlsWrap}>
      <Text style={styles.subtext}>
        {isBn ? `আপনার সংরক্ষিত পূজা` : `Your saved pujas`}
      </Text>
    </View>
  );

  const renderFooter = () => (
    <>
      {(pageNo > 1 || hasMore) && wishlistPujas.length > 0 && (
        <View style={styles.paginationRow}>
          <TouchableOpacity
            style={[styles.pageBtn, pageNo === 1 && styles.pageBtnDisabled]}
            onPress={handlePrevPage}
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
            onPress={handleNextPage}
            disabled={!hasMore}
          >
            <Text style={styles.pageBtnText}>{isBn ? 'পরবর্তী' : 'Next'}</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.bottomSpacer} />
    </>
  );

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
        <Text style={styles.headerTitle}>
          {isBn ? 'পছন্দের পূজা' : 'Wishlist'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        style={styles.body}
        data={wishlistPujas}
        keyExtractor={item =>
          (item.puja_id || item.puja_type_id || Math.random()).toString()
        }
        renderItem={renderWishlistItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centerLoader}>
              <ActivityIndicator size="large" color={BRAND_PRIMARY} />
            </View>
          ) : (
            <NoDataFound
              message={
                isBn
                  ? 'আপনার পছন্দের তালিকায় কোনও পূজা নেই।'
                  : 'No pujas in your wishlist yet.'
              }
              containerHeight={300}
            />
          )
        }
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
      />
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
  subtext: { fontSize: 14, color: BRAND_MUTED, fontWeight: '600' },

  centerLoader: { height: 300, justifyContent: 'center', alignItems: 'center' },

  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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
    height: 120,
    backgroundColor: Colors.tagRed,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pujaIconImage: { width: '100%', height: '100%' },
  heartBtn: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    padding: 6,
    zIndex: 5,
  },
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
  bookBtn: {
    backgroundColor: BRAND_PRIMARY,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  bookBtnDisabled: { backgroundColor: Colors.border },
  bookBtnText: { color: Colors.white, fontSize: 12, fontWeight: '700' },

  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 20,
  },
  pageBtn: {
    backgroundColor: BRAND_PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pageBtnDisabled: { backgroundColor: Colors.textMuted },
  pageBtnText: { color: Colors.white, fontWeight: 'bold' },
  pageText: { fontSize: 14, fontWeight: '700', color: BRAND_TEXT },
  headerSpacer: { width: 60 },
  pujaImgText: { fontSize: 50 },
  heartIconText: { fontSize: 16 },
  scrollContent: { paddingBottom: 100 },
  bottomSpacer: { height: 40 },
});
