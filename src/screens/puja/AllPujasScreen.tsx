import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '../../store';
import { toggleFavorite } from '../../store/slices/wishlistSlice';
import { FEATURED_PUJAS } from '../../data/dummyData';

export default function AllPujasScreen({ navigation }: any) {
  const { i18n } = useTranslation();
  const isBn = i18n.language === 'bn';
  const dispatch = useDispatch();

  const favorites = useSelector(
    (state: RootState) => state.wishlist?.favorites || [],
  );

  const [activeFilter, setActiveFilter] = useState<'All' | 'Popular'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPujas = FEATURED_PUJAS.filter(p => {
    // 1. Text search
    const q = searchQuery.toLowerCase();
    const searchMatch =
      p.titleEn.toLowerCase().includes(q) ||
      p.titleBn.includes(q) ||
      p.descEn.toLowerCase().includes(q) ||
      p.descBn.includes(q);
    if (!searchMatch) return false;

    // 2. Filter tabs
    if (activeFilter === 'Popular') return p.isPopular;
    return true; // All
  });

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
            {isBn ? 'সব পূজা' : 'All Pujas'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.controlsWrap}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>
              {isBn ? 'ফিল্টার:' : 'Filter:'}
            </Text>
            {['All', 'Popular'].map(f => (
              <TouchableOpacity
                key={f}
                onPress={() => setActiveFilter(f as any)}
                style={[
                  styles.filterChip,
                  activeFilter === f && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    activeFilter === f && styles.filterChipTextActive,
                  ]}
                >
                  {f === 'All'
                    ? isBn
                      ? 'সব'
                      : 'All'
                    : isBn
                    ? 'জনপ্রিয়'
                    : 'Popular'}
                </Text>
              </TouchableOpacity>
            ))}
            <View style={styles.flexSpacer} />
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {filteredPujas.length} {isBn ? 'পূজা' : 'pujas'}
              </Text>
            </View>
          </View>

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
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View style={styles.gridContainer}>
          {filteredPujas.map(puja => (
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
          {filteredPujas.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateEmoji}>😞</Text>
              <Text style={styles.emptyStateText}>
                {isBn
                  ? 'কোনো পূজা খুঁজে পাওয়া যায়নি।'
                  : 'No pujas found matching your filters.'}
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
  },
  emptyStateEmoji: { fontSize: 40, marginBottom: 12 },
  emptyStateText: { color: BRAND_MUTED, fontSize: 14, textAlign: 'center' },

  safeArea: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
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
});
