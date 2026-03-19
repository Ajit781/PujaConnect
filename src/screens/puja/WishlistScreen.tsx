import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '../../store';
import { toggleFavorite } from '../../store/slices/wishlistSlice';
import { FEATURED_PUJAS } from '../../data/dummyData';

export default function WishlistScreen({ navigation }: any) {
  const { i18n } = useTranslation();
  const isBn = i18n.language === 'bn';
  const dispatch = useDispatch();

  const favorites = useSelector(
    (state: RootState) => state.wishlist?.favorites || [],
  );

  const favoritePujas = FEATURED_PUJAS.filter(p => favorites.includes(p.id));

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Text style={styles.backBtnText}>
              ← {isBn ? 'ফিরে যান' : 'Back'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isBn ? 'পছন্দের পূজা' : 'Wishlist'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.controlsWrap}>
          <Text style={styles.subtext}>
            {isBn
              ? `আপনার সংরক্ষিত পূজা (${favoritePujas.length})`
              : `Your saved pujas (${favoritePujas.length})`}
          </Text>
        </View>

        <View style={styles.gridContainer}>
          {favoritePujas.map(puja => (
            <View key={puja.id} style={styles.gridCard}>
              <View
                style={[styles.cardImgBox, { backgroundColor: puja.color }]}
              >
                <Text style={styles.pujaImgText}>{puja.imagePlaceholder}</Text>
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
          {favoritePujas.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateEmoji}>🤍</Text>
              <Text style={styles.emptyStateText}>
                {isBn
                  ? 'আপনার পছন্দের তালিকায় কোনও পূজা নেই।'
                  : 'No pujas in your wishlist yet.'}
              </Text>
              <Text style={styles.subtextEmpty}>
                {isBn
                  ? 'দয়া করে কিছু যোগ করতে হৃদয় আইকনে ক্লিক করুন।'
                  : 'Add some by clicking the heart icon on any puja!'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const BRAND_PRIMARY = '#F97316';
const BRAND_TEXT = '#291811';
const BRAND_MUTED = '#6B5E59';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF8F0' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
  },
  backBtn: { paddingVertical: 10, paddingRight: 20 },
  backBtnText: { fontSize: 16, fontWeight: '700', color: BRAND_PRIMARY },
  headerTitle: { fontSize: 18, fontWeight: '800', color: BRAND_TEXT },

  body: { flex: 1 },
  controlsWrap: { paddingHorizontal: 16, marginBottom: 16, marginTop: 16 },
  subtext: { fontSize: 14, color: BRAND_MUTED, fontWeight: '600' },

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
    zIndex: 5,
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
    width: '100%',
  },
  emptyStateEmoji: { fontSize: 40, marginBottom: 12 },
  emptyStateText: {
    color: BRAND_TEXT,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtextEmpty: { color: BRAND_MUTED, fontSize: 14, textAlign: 'center' },

  safeArea: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 10,
  },
  headerSpacer: { width: 60 },
  pujaImgText: { fontSize: 50 },
  heartIconText: { fontSize: 16 },
  ratingCol: { alignItems: 'flex-end' },
  bottomSpacer: { height: 40 },
});
