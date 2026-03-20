import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { FEATURED_PUJAS } from '../../data/dummyData';
import BookingModal from '../../components/booking/BookingModal';

export default function PujaDetailsScreen({ route, navigation }: any) {
  const { i18n } = useTranslation();
  const isBn = i18n.language === 'bn';
  const { pujaId, pujaData } = route.params;

  // Use passed pujaData (Real API) or fallback to FEATURED_PUJAS (Dummy)
  const puja = pujaData || FEATURED_PUJAS.find(p => p.id === pujaId);
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);

  if (!puja) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtnWrapper}
          >
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.notFoundText}>Puja not found</Text>
        </SafeAreaView>
      </View>
    );
  }

  const title = pujaData
    ? pujaData.puja_type_name
    : isBn
    ? puja.titleBn
    : puja.titleEn;
  const desc = pujaData
    ? isBn
      ? 'পবিত্র অনুষ্ঠান আপনার কাছাকাছি'
      : 'Holy ceremony near you'
    : isBn
    ? puja.descBn
    : puja.descEn;
  const duration = pujaData
    ? `${pujaData.puja_duration} ${isBn ? 'ঘন্টা' : 'Hours'}`
    : isBn
    ? puja.durationBn
    : puja.durationEn;
  const rating = pujaData ? '4.8' : isBn ? puja.ratingBn : puja.ratingEn;

  const IMAGES = [
    {
      id: 0,
      content: pujaData ? '🛕' : puja.imagePlaceholder,
      color: pujaData ? '#FEE2E2' : puja.color,
    },
    { id: 1, content: '🕉️', color: '#FDE68A' },
    { id: 2, content: '🛕', color: '#FECACA' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FDF8F0" barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtnWrapper}
          >
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.ratingBox}>
            <Text style={styles.ratingText}>{rating}</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Banner Area */}
        <View style={styles.bannerWrapper}>
          <View
            style={[
              styles.bannerImg,
              { backgroundColor: IMAGES[activeImageIndex].color },
            ]}
          >
            <Text style={styles.bannerIconLarge}>
              {IMAGES[activeImageIndex].content}
            </Text>
            <View style={styles.vedicTag}>
              <Text style={styles.vedicTagText}>
                ✨ {isBn ? 'বৈদিক আচার' : 'Vedic Ritual'}
              </Text>
            </View>
            <Text style={[styles.floatingEmoji, styles.floatingEmoji1]}>
              🌸
            </Text>
            <Text style={[styles.floatingEmoji, styles.floatingEmoji2]}>
              🌺
            </Text>
          </View>
          <View style={styles.thumbnailRow}>
            {IMAGES.map((img, idx) => (
              <TouchableOpacity
                key={img.id}
                activeOpacity={0.8}
                onPress={() => setActiveImageIndex(idx)}
              >
                <View
                  style={[
                    styles.thumbnailImg,
                    { backgroundColor: img.color },
                    activeImageIndex === idx && styles.thumbnailImgActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.thumbEmoji,
                      activeImageIndex === idx
                        ? styles.thumbEmojiActive
                        : styles.thumbEmojiInactive,
                    ]}
                  >
                    {img.content}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Details Card */}
        <View style={styles.quickDetailsCard}>
          <View style={styles.tabRow}>
            {['OVERVIEW', 'PACKAGES', 'MATERIALS'].map(tab => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabBtn,
                  activeTab === tab && styles.tabBtnActive,
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    activeTab === tab && styles.tabBtnTextActive,
                  ]}
                >
                  {tab === 'OVERVIEW'
                    ? isBn
                      ? 'ওভারভিউ'
                      : 'OVERVIEW'
                    : tab === 'PACKAGES'
                    ? isBn
                      ? 'প্যাকেজ'
                      : 'PACKAGES'
                    : isBn
                    ? 'উপকরণ'
                    : 'MATERIALS'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'OVERVIEW' && (
            <View style={styles.overviewTab}>
              <View style={styles.aboutBlock}>
                <View style={styles.aboutBadge}>
                  <Text style={styles.aboutBadgeText}>
                    🔥 {isBn ? 'পবিত্র আচার' : 'SACRED RITUAL'}
                  </Text>
                </View>
                <Text style={styles.aboutTitle}>
                  {isBn ? 'এই পূজা সম্পর্কে' : 'About This Puja'}
                </Text>
                <Text style={styles.aboutDesc}>{desc}</Text>
                <Text style={styles.aboutDesc}>
                  {isBn
                    ? 'ভক্তরা সাফল্য নিশ্চিত করতে এবং অসুবিধা দূর করতে গুরুত্বপূর্ণ কাজ শুরু করার আগে তাঁকে পূজা করে। পূজার মধ্যে ফুল, ফল, মিষ্টি নিবেদন এবং ভালো ভাগ্য ও ঐক্যের জন্য পবিত্র মন্ত্র জপ অন্তর্ভুক্ত থাকে।'
                    : 'Devotees worship before starting any important work to ensure success and remove difficulties. The puja includes offerings of flowers, fruits, sweets, and chanting of sacred mantras for good fortune and harmony.'}
                </Text>
              </View>

              <View style={styles.featuresRow}>
                <View style={styles.featureCard}>
                  <Text style={styles.featureIcon}>📖</Text>
                  <Text style={styles.featureTitle}>
                    {isBn ? 'ইতিহাস ও ঐতিহ্য' : 'History & Heritage'}
                  </Text>
                  <Text style={styles.featureItem}>
                    •{' '}
                    {isBn
                      ? 'প্রাচীন হিন্দু শাস্ত্রে উৎপত্তি'
                      : 'Origin in Ancient Hindu Scriptures'}
                  </Text>
                </View>
                <View style={styles.featureCard}>
                  <Text style={styles.featureIcon}>🙏</Text>
                  <Text style={styles.featureTitle}>
                    {isBn ? 'তাৎপর্য' : 'Significance'}
                  </Text>
                  <Text style={styles.featureItem}>
                    • {isBn ? 'বাধা দূরকারী' : 'Remover of Obstacles'}
                  </Text>
                </View>
              </View>

              <View style={styles.trustRow}>
                <Text style={styles.trustItem}>
                  ✅{' '}
                  {isBn
                    ? '১০০% খাঁটি বৈদিক আচার'
                    : '100% Authentic Vedic Rituals'}
                </Text>
                <Text style={styles.trustItem}>
                  ✅ {isBn ? 'প্রত্যয়িত পুরোহিত' : 'Certified Pandits'}
                </Text>
                <Text style={styles.trustItem}>
                  ✅{' '}
                  {isBn
                    ? '৫০০০+ পরিবারের বিশ্বস্ত'
                    : 'Trusted by 5,000+ Families'}
                </Text>
              </View>

              <View style={styles.quickInfoList}>
                <Text style={styles.quickInfoTitle}>
                  {isBn ? 'বিস্তারিত' : 'Details'}
                </Text>
                <View style={styles.quickInfoItem}>
                  <Text>⏱️</Text>
                  <Text style={styles.quickInfoText}>{duration}</Text>
                </View>
                <View style={styles.quickInfoItem}>
                  <Text>🧘</Text>
                  <Text style={styles.quickInfoText}>
                    {isBn ? '১ জন অভিজ্ঞ পুরোহিত' : '1 experienced pandit'}
                  </Text>
                </View>
                <View style={styles.quickInfoItem}>
                  <Text>🎁</Text>
                  <Text style={styles.quickInfoText}>
                    {isBn ? 'সব উপকরণ অন্তর্ভুক্ত' : 'All materials included'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {activeTab !== 'OVERVIEW' && (
            <View style={styles.comingSoonWrap}>
              <Text>
                {isBn
                  ? 'আরও বিবরণ শীঘ্রই আসছে...'
                  : 'More details coming soon...'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Sticky Footer */}
      <View style={styles.stickyFooter}>
        <View>
          <Text style={styles.footerLabel}>
            {isBn
              ? 'প্যাকেজ মূল্য (সামগ্রী সহ)'
              : 'PACKAGE PRICE (WITH SAMAGRI)'}
          </Text>
          <Text style={styles.footerPrice}>
            {pujaData
              ? `₹${pujaData.puja_with_samagri_amount.toLocaleString('en-IN')}`
              : isBn
              ? puja.exactPriceBn
              : `₹${puja.exactPrice?.toLocaleString()}`}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.footerBtn,
            pujaData ? {} : !puja.isAvailable && styles.footerBtnDisabled,
          ]}
          disabled={pujaData ? false : !puja.isAvailable}
          onPress={() => setShowBookingModal(true)}
        >
          <Text style={styles.footerBtnText}>
            🛒 {isBn ? 'পূজা বুক করুন' : 'Book Puja'}
          </Text>
        </TouchableOpacity>
      </View>

      <BookingModal
        visible={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        puja={puja}
        isBn={isBn}
      />
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
  backBtnWrapper: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5DFD7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: { fontSize: 20, color: BRAND_TEXT },
  headerTitle: { fontSize: 18, fontWeight: '800', color: BRAND_TEXT },
  ratingBox: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#F59E0B' },

  body: { flex: 1 },
  bannerWrapper: { padding: 16 },
  bannerImg: {
    height: 200,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  vedicTag: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  vedicTagText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  floatingEmoji: { position: 'absolute', fontSize: 24 },
  thumbnailRow: { flexDirection: 'row', marginTop: 12, gap: 12 },
  thumbnailImg: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailImgActive: {
    borderColor: BRAND_PRIMARY,
    shadowColor: BRAND_PRIMARY,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },

  quickDetailsCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFF',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    overflow: 'hidden',
    paddingBottom: 24,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: BRAND_PRIMARY },
  tabBtnText: { fontSize: 12, fontWeight: '700', color: BRAND_MUTED },
  tabBtnTextActive: { color: BRAND_PRIMARY },

  overviewTab: { padding: 16 },
  aboutBlock: {
    backgroundColor: '#4A2A18',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  aboutBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  aboutBadgeText: {
    color: '#FCD34D',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  aboutTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
  },
  aboutDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },

  featuresRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  featureCard: {
    flex: 1,
    backgroundColor: '#FFF8F1',
    borderRadius: 16,
    padding: 12,
  },
  featureIcon: { fontSize: 20, marginBottom: 8 },
  featureTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: BRAND_TEXT,
    marginBottom: 8,
  },
  featureItem: { fontSize: 11, color: BRAND_MUTED, lineHeight: 16 },

  trustRow: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE1D3',
    marginBottom: 24,
  },
  trustItem: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A2A18',
    marginBottom: 6,
  },

  quickInfoList: { paddingHorizontal: 4 },
  quickInfoTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: BRAND_TEXT,
    marginBottom: 12,
  },
  quickInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickInfoText: {
    fontSize: 13,
    color: BRAND_MUTED,
    marginLeft: 12,
    fontWeight: '500',
  },

  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    elevation: 10,
  },
  footerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: BRAND_MUTED,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  footerPrice: { fontSize: 18, fontWeight: '900', color: BRAND_TEXT },
  footerBtn: {
    backgroundColor: BRAND_PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  footerBtnDisabled: { backgroundColor: '#E5E7EB' },
  footerBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },

  notFoundText: { textAlign: 'center', marginTop: 40 },
  safeArea: { backgroundColor: '#FDF8F0', zIndex: 10 },
  bannerIconLarge: { fontSize: 100, opacity: 0.8 },
  floatingEmoji1: { top: 20, right: 20 },
  floatingEmoji2: { bottom: 20, left: 30 },
  thumbEmoji: { fontSize: 24 },
  thumbEmojiActive: { opacity: 1 },
  thumbEmojiInactive: { opacity: 0.6 },
  comingSoonWrap: { padding: 40, alignItems: 'center' },
  bottomSpacer: { height: 100 },
});
