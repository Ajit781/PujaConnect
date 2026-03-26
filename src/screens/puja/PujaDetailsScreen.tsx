import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { FEATURED_PUJAS } from '../../data/dummyData';
import BookingModal from '../../components/booking/BookingModal';
import NoDataFound from '../../components/common/NoDataFound';
import { Colors } from '../../constants/Colors';
import {
  useGetPujaImagesQuery,
  useGetPujaPackagesQuery,
  useGetPackageMaterialsQuery,
  useGetPujaFullDetailsQuery,
} from '../../store/api/pujaApi';

export default function PujaDetailsScreen({ route, navigation }: any) {
  const { i18n } = useTranslation();
  const isBn = i18n.language === 'bn';
  const { pujaId, pujaData } = route.params;

  // Use passed pujaData (Real API) or fallback to FEATURED_PUJAS (Dummy)
  const puja = pujaData || FEATURED_PUJAS.find(p => p.id === pujaId);
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    null,
  );

  // RTK Query Hooks
  const { data: imagesData = [], isLoading: isLoadingImages } =
    useGetPujaImagesQuery(pujaId.toString(), { skipGlobalLoader: true } as any);
  const {
    data: packagesData = [],
    isLoading: isLoadingPackages,
    isError: isErrorPackages,
    refetch: refetchPackages,
  } = useGetPujaPackagesQuery(pujaId.toString(), {
    skipGlobalLoader: true,
  } as any);
  const { data: materialsData = [], isLoading: isLoadingMaterials } =
    useGetPackageMaterialsQuery(
      {
        pujaId: pujaId.toString(),
        packageId: selectedPackageId || '',
      },
      { skip: !selectedPackageId, skipGlobalLoader: true } as any,
    );
  const { data: fullDetails, isLoading: isLoadingFull } =
    useGetPujaFullDetailsQuery(pujaId.toString(), {
      skipGlobalLoader: true,
    } as any);

  // Auto-select first package when loaded
  useEffect(() => {
    if (packagesData.length > 0 && !selectedPackageId) {
      setSelectedPackageId(packagesData[0].puja_package_id.toString());
    }
  }, [packagesData, selectedPackageId]);

  const duration =
    fullDetails?.duration || pujaData?.duration || puja.duration || '2.0';
  const rating =
    fullDetails?.puja_rating ||
    pujaData?.puja_rating ||
    puja.rating ||
    puja.ratingText ||
    '4.5';
  const title =
    fullDetails?.puja_name || pujaData?.puja_name || puja.name || puja.title;
  const description =
    fullDetails?.description ||
    pujaData?.description ||
    puja.description ||
    puja.desc;

  // Parsing Utility for Semicolon/Newline data
  const parseAsBullets = (dataStr: string | undefined) => {
    if (!dataStr) return [];
    // Replace literal \\n with real newline and split
    return dataStr
      .replace(/\\n/g, '\n')
      .split(/[;\n]/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
  };

  const benefitItems = fullDetails?.puja_benifit
    ? fullDetails.puja_benifit
        .replace(/\\n/g, '\n')
        .split(/[;\n]/)
        .map(b => b.trim())
        .filter(b => b.length > 0)
    : [];
  const history = parseAsBullets(fullDetails?.puja_history_details);
  const significance = parseAsBullets(fullDetails?.puja_significance);
  const promises = parseAsBullets(fullDetails?.puja_our_promise);

  if (!puja && !fullDetails) {
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

  const selectedPackage = packagesData.find(
    (pkg: any) => pkg.puja_package_id.toString() === selectedPackageId,
  );

  const IMAGES =
    imagesData.length > 0
      ? imagesData.map((img: any, idx: number) => ({
          id: idx,
          content: img.puja_image,
          isUrl: true,
          color: Colors.tagRed,
        }))
      : [
          {
            id: 0,
            content: pujaData ? '🛕' : puja.imagePlaceholder,
            isUrl: false,
            color: pujaData ? Colors.tagRed : puja.color,
          },
          { id: 1, content: '🕉️', isUrl: false, color: Colors.tagYellow },
          { id: 2, content: '🛕', isUrl: false, color: Colors.tagRed },
        ];

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
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
            <Text style={styles.starIconMarginRight}>⭐</Text>
            <Text style={styles.ratingText}>{rating}</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Banner Area */}
        <View style={styles.bannerWrapper}>
          {isLoadingImages ? (
            <View style={[styles.bannerImg, styles.bannerLoadingContainer]}>
              <ActivityIndicator color={Colors.primary} size="large" />
            </View>
          ) : (
            <>
              <View
                style={[
                  styles.bannerImg,
                  { backgroundColor: IMAGES[activeImageIndex].color },
                ]}
              >
                {IMAGES[activeImageIndex].isUrl ? (
                  <Image
                    source={{ uri: IMAGES[activeImageIndex].content }}
                    style={styles.bannerImgFull}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.bannerIconLarge}>
                    {IMAGES[activeImageIndex].content}
                  </Text>
                )}
                <View style={styles.vedicTag}>
                  <Text style={styles.vedicTagText}>
                    ✨ {isBn ? 'বৈদিক আচার' : 'Vedic Ritual'}
                  </Text>
                </View>
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
                      {img.isUrl ? (
                        <Image
                          source={{ uri: img.content }}
                          style={styles.thumbImgReal}
                          resizeMode="cover"
                        />
                      ) : (
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
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
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
            <View>
              {isLoadingFull ? (
                <ActivityIndicator
                  color={BRAND_PRIMARY}
                  style={styles.activityIndicatorMargin60}
                />
              ) : (
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
                    <Text style={styles.aboutDesc}>{description}</Text>
                  </View>

                  <View style={styles.featuresRow}>
                    <View style={styles.featureCard}>
                      <View style={styles.featureIconContainer}>
                        <Text style={styles.featureIcon}>📖</Text>
                      </View>
                      <Text style={styles.featureTitle}>
                        {isBn ? 'ইতিহাস ও ঐতিহ্য' : 'History & Heritage'}
                      </Text>
                      <View style={styles.featureList}>
                        {history.length > 0 ? (
                          history.slice(0, 5).map((h, i) => (
                            <View key={i} style={styles.featureItemRow}>
                              <View style={styles.featureBullet} />
                              <Text style={styles.featureItem}>{h}</Text>
                            </View>
                          ))
                        ) : (
                          <Text style={styles.noDataSmall}>
                            {isBn
                              ? 'ইতিহাস পাওয়া যায়নি'
                              : 'History information not available'}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.featureCard}>
                      <View style={styles.featureIconContainer}>
                        <Text style={styles.featureIcon}>🙏</Text>
                      </View>
                      <Text style={styles.featureTitle}>
                        {isBn ? 'তাৎপর্য' : 'Significance'}
                      </Text>
                      <View style={styles.featureList}>
                        {significance.length > 0 ? (
                          significance.slice(0, 5).map((s, i) => (
                            <View key={i} style={styles.featureItemRow}>
                              <View style={styles.featureBullet} />
                              <Text style={styles.featureItem}>{s}</Text>
                            </View>
                          ))
                        ) : (
                          <Text style={styles.noDataSmall}>
                            {isBn
                              ? 'তাৎপর্য পাওয়া যায়নি'
                              : 'Significance information not available'}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>

                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionEmoji}>⚡</Text>
                    <Text style={styles.sectionTitle}>
                      {isBn ? 'মূল সুবিধা' : 'Key Benefits'}
                    </Text>
                  </View>
                  {benefitItems.length > 0 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.benefitsCarousel}
                    >
                      {benefitItems.map((b, i) => (
                        <View key={i} style={styles.benefitCard}>
                          <Text style={styles.benefitNumber}>
                            {(i + 1).toString().padStart(2, '0')}
                          </Text>
                          <Text style={styles.benefitCardDesc}>{b}</Text>
                          <View style={styles.benefitDecoration}>
                            <Text style={styles.flowerIconFontSize}>🌸</Text>
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                  ) : (
                    <View
                      style={[
                        styles.emptySection,
                        styles.inlineMarginHorizontal16Padding20,
                      ]}
                    >
                      <Text style={styles.noDataText}>
                        {isBn
                          ? 'কোন টেকনিক্যাল সুবিধা পাওয়া যায়নি'
                          : 'No benefit information available'}
                      </Text>
                    </View>
                  )}

                  <View style={styles.promiseBox}>
                    <View style={styles.promiseHeader}>
                      <Text style={styles.promiseIcon}>📜</Text>
                      <Text style={styles.promiseTitle}>
                        {isBn ? 'আমাদের প্রতিশ্রুতি' : 'Our Promise to You'}
                      </Text>
                    </View>
                    <View style={styles.promiseContent}>
                      {promises.length > 0 ? (
                        promises.map((p, i) => (
                          <Text key={i} style={styles.promiseText}>
                            • {p}
                          </Text>
                        ))
                      ) : (
                        <Text style={styles.promiseText}>
                          {isBn
                            ? 'আমরা যথাযথ নিষ্ঠা ও বিশুদ্ধতার সাথে পূজা সম্পন্ন করার গ্যারান্টি দিই।'
                            : 'We guarantee to perform the puja with utmost devotion and purity.'}
                        </Text>
                      )}
                    </View>

                    <View style={styles.promiseFooter}>
                      <View style={styles.promiseBadge}>
                        <Text style={styles.promiseBadgeText}>
                          ✅ 100% Authentic
                        </Text>
                      </View>
                      <View style={styles.promiseBadge}>
                        <Text style={styles.promiseBadgeText}>
                          📜 Certified Pandits
                        </Text>
                      </View>
                      <View style={styles.promiseBadge}>
                        <Text style={styles.promiseBadgeText}>
                          ✨ Vedic Purity
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.quickInfoList}>
                    <Text style={styles.quickInfoTitle}>
                      {isBn ? 'বিস্তারিত' : 'Details'}
                    </Text>
                    <View style={styles.quickInfoItem}>
                      <Text>⏱️</Text>
                      <Text style={styles.quickInfoText}>
                        {selectedPackage
                          ? `${selectedPackage.puja_duration} ${
                              isBn ? 'ঘণ্টা' : 'Hours'
                            }`
                          : duration}
                      </Text>
                    </View>
                    <View style={styles.quickInfoItem}>
                      <Text>🧘</Text>
                      <Text style={styles.quickInfoText}>
                        {selectedPackage?.pandit_count || 1}
                        {isBn ? ' জন পুরোহিত' : ' Experienced Pandits'}
                      </Text>
                    </View>
                    <View style={styles.quickInfoItem}>
                      <Text>🎁</Text>
                      <Text style={styles.quickInfoText}>
                        {isBn
                          ? 'সব উপকরণ অন্তর্ভুক্ত'
                          : 'All materials included'}
                      </Text>
                    </View>
                    <View style={styles.quickInfoItem}>
                      <Text style={styles.flowerIconFontSize}>✨</Text>
                      <Text style={styles.quickInfoText}>
                        {isBn
                          ? '১০০% খাঁটি বৈদিক আচার'
                          : '100% Authentic Vedic Rituals'}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}

          {activeTab === 'PACKAGES' && (
            <View style={styles.packagesTab}>
              {isLoadingPackages ? (
                <ActivityIndicator
                  color={BRAND_PRIMARY}
                  style={styles.inlineMargin40}
                />
              ) : isErrorPackages ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorEmoji}>⚠️</Text>
                  <Text style={styles.errorText}>
                    {isBn
                      ? 'প্যাকেজ লোড করতে ব্যর্থ হয়েছে'
                      : 'Failed to load packages'}
                  </Text>
                  <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={() => refetchPackages()}
                  >
                    <Text style={styles.retryBtnText}>
                      {isBn ? 'আবার চেষ্টা করুন' : 'Try Again'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : packagesData.length > 0 ? (
                packagesData.map((pkg: any) => {
                  const isSelected =
                    selectedPackageId === pkg.puja_package_id.toString();
                  return (
                    <TouchableOpacity
                      key={pkg.puja_package_id}
                      activeOpacity={0.9}
                      style={[
                        styles.packageCard,
                        isSelected && styles.packageCardSelected,
                      ]}
                      onPress={() =>
                        setSelectedPackageId(pkg.puja_package_id.toString())
                      }
                    >
                      <View style={styles.pkgTopRow}>
                        <View style={styles.pkgTitleCol}>
                          <Text style={styles.pkgName}>
                            {pkg.puja_package_name}
                          </Text>
                          <Text style={styles.pkgSubtitle}>
                            {pkg.puja_package_description ||
                              (isBn
                                ? 'বিস্তারিত বিবরণ নেই'
                                : 'No detailed description available')}
                          </Text>
                        </View>
                        <View style={styles.pkgPriceCol}>
                          <Text style={styles.pkgPrice}>
                            ₹{pkg.puja_package_price.toLocaleString('en-IN')}
                          </Text>
                          <Text style={styles.pkgPriceLabel}>
                            {isBn ? 'প্যাকেজ মূল্য' : 'PACKAGE PRICE'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.pkgDivider} />

                      <View style={styles.pkgMetaRow}>
                        <View style={styles.pkgMetaItem}>
                          <Text style={styles.pkgMetaIcon}>🕒</Text>
                          <Text style={styles.pkgMetaText}>
                            {pkg.puja_duration} {isBn ? 'ঘন্টা' : 'hrs'}
                          </Text>
                        </View>
                        <View style={styles.pkgMetaItem}>
                          <Text style={styles.pkgMetaIcon}>👤</Text>
                          <Text style={styles.pkgMetaText}>
                            {pkg.pandit_count} {isBn ? 'পুরোহিত' : 'Pandits'}
                          </Text>
                        </View>
                        <View style={styles.pkgMetaItem}>
                          <Text style={styles.pkgMetaIcon}>🎁</Text>
                          <Text style={styles.pkgMetaText}>
                            {pkg.puja_include_samagri === 1
                              ? isBn
                                ? 'উপকরণ সহ'
                                : 'Materials Inc.'
                              : isBn
                              ? 'উপকরণ ছাড়া'
                              : 'No Materials'}
                          </Text>
                        </View>
                      </View>

                      {isSelected && materialsData.length > 0 && (
                        <View style={styles.pkgIncludesBox}>
                          <Text style={styles.pkgIncludesLabel}>
                            {isBn ? 'অন্তর্ভুক্ত:' : 'Includes:'}{' '}
                            <Text style={styles.pkgIncludesText}>
                              {materialsData
                                .slice(0, 3)
                                .map((m: any) => m.material_name)
                                .join(', ')}
                              {materialsData.length > 3 ? '...' : ''}
                            </Text>
                          </Text>
                        </View>
                      )}

                      {isSelected && (
                        <View style={styles.selectedIndicator}>
                          <Text style={styles.selectedIndicatorText}>
                            ✓ {isBn ? 'নির্বাচিত' : 'SELECTED'}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
              ) : (
                <NoDataFound
                  message={
                    isBn
                      ? 'এই পূজার জন্য কোনো বিশেষ প্যাকেজ পাওয়া যায়নি।'
                      : 'No packages found for this puja'
                  }
                  containerHeight={200}
                />
              )}
            </View>
          )}

          {activeTab === 'MATERIALS' && (
            <View style={styles.materialsTab}>
              {isLoadingMaterials ? (
                <ActivityIndicator
                  color={Colors.primary}
                  style={styles.activityIndicatorMargin60}
                />
              ) : !selectedPackageId ? (
                <NoDataFound
                  message={
                    isBn
                      ? 'সামগ্রীর তালিকা দেখতে প্যাকেজ ট্যাব থেকে একটি প্যাকেজ নির্বাচন করুন।'
                      : 'Please select a package to see materials.'
                  }
                  containerHeight={250}
                />
              ) : materialsData.length > 0 ? (
                <View style={styles.matList}>
                  {materialsData.map((mat: any, idx: number) => (
                    <View key={idx} style={styles.matRow}>
                      <View style={styles.matInfo}>
                        <Text style={styles.matName}>{mat.material_name}</Text>
                        <Text style={styles.matQty}>
                          {isBn ? 'পরিমাণ' : 'Qty'}: {mat.quantity}{' '}
                          {mat.material_unit}
                        </Text>
                      </View>
                      <View style={styles.matBadge}>
                        <Text style={styles.matCategory}>
                          {mat.category_name}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <NoDataFound
                  message={
                    isBn ? 'কোন উপকরণ পাওয়া যায়নি' : 'No materials found'
                  }
                  containerHeight={200}
                />
              )}
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
            {selectedPackage
              ? `₹${selectedPackage.puja_package_price.toLocaleString('en-IN')}`
              : pujaData
              ? `₹${(
                  pujaData.puja_with_samagri_amount ||
                  pujaData.minimum_price ||
                  0
                ).toLocaleString('en-IN')}`
              : isBn
              ? puja.exactPriceBn
              : `₹${(puja.exactPrice || 0).toLocaleString()}`}
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
        selectedPackage={selectedPackage}
        isBn={isBn}
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
    paddingHorizontal: 16,
    height: 60,
  },
  backBtnWrapper: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: { fontSize: 20, color: BRAND_TEXT },
  headerTitle: { fontSize: 18, fontWeight: '800', color: BRAND_TEXT },
  ratingBox: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 12, fontWeight: '700', color: Colors.gold },

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
  vedicTagText: { color: Colors.white, fontSize: 10, fontWeight: '700' },
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
    backgroundColor: Colors.white,
    borderRadius: 24,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    overflow: 'hidden',
    paddingBottom: 24,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
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
    backgroundColor: Colors.secondary,
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
    color: Colors.gold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  aboutTitle: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
  },
  aboutDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
  },
  packageInfoBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 24,
  },
  packageInfoTitle: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  packageInfoText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    lineHeight: 18,
  },
  featuresRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  featureCard: {
    flex: 1,
    backgroundColor: Colors.background,
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
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  trustItem: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondary,
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
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: Colors.shadow,
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
  footerBtnDisabled: { backgroundColor: Colors.disabled },
  footerBtnText: { color: Colors.white, fontSize: 14, fontWeight: '800' },

  notFoundText: { textAlign: 'center', marginTop: 40 },
  safeArea: { backgroundColor: Colors.background, zIndex: 10 },
  bannerIconLarge: { fontSize: 100, opacity: 0.8 },
  floatingEmoji1: { top: 20, right: 20 },
  floatingEmoji2: { bottom: 20, left: 30 },
  thumbEmoji: { fontSize: 24 },
  thumbEmojiActive: { opacity: 1 },
  thumbEmojiInactive: { opacity: 0.6 },
  comingSoonWrap: { padding: 40, alignItems: 'center' },
  bottomSpacer: { height: 100 },
  bannerImgFull: { width: '100%', height: '100%' },
  thumbImgReal: { width: '100%', height: '100%', borderRadius: 10 },
  packagesTab: { padding: 16 },
  packageCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: Colors.ultraLightGray,
    shadowColor: Colors.textMuted,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  packageCardSelected: {
    borderColor: BRAND_PRIMARY,
    backgroundColor: Colors.white,
    borderWidth: 2,
    shadowColor: BRAND_PRIMARY,
    shadowOpacity: 0.15,
    elevation: 8,
  },
  pkgTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  pkgTitleCol: { flex: 1, paddingRight: 12 },
  pkgName: {
    fontSize: 20,
    fontWeight: '900',
    color: BRAND_TEXT,
    marginBottom: 6,
  },
  pkgSubtitle: {
    fontSize: 13,
    color: BRAND_MUTED,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  pkgPriceCol: { alignItems: 'flex-end' },
  pkgPrice: { fontSize: 26, fontWeight: '900', color: BRAND_PRIMARY },
  pkgPriceLabel: {
    fontSize: 10,
    color: BRAND_MUTED,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  pkgDivider: {
    height: 1.5,
    backgroundColor: Colors.ultraLightGray,
    marginVertical: 20,
    opacity: 0.8,
  },
  pkgMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  pkgMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pkgMetaIcon: { fontSize: 16 },
  pkgMetaText: { fontSize: 13, color: BRAND_TEXT, fontWeight: '700' },
  selectedIndicator: {
    marginTop: 24,
    alignSelf: 'flex-start',
    backgroundColor: Colors.lightOrange,
    borderWidth: 1.5,
    borderColor: BRAND_PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  selectedIndicatorText: {
    fontSize: 11,
    fontWeight: '900',
    color: BRAND_PRIMARY,
  },
  pkgIncludesBox: { marginTop: 16 },
  pkgIncludesLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: BRAND_TEXT,
  },
  pkgIncludesText: {
    fontWeight: '500',
    color: BRAND_MUTED,
  },
  noDataText: { textAlign: 'center', marginTop: 20, color: BRAND_MUTED },
  errorBox: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: Colors.tagRed,
    borderRadius: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: Colors.tagRed,
  },
  errorEmoji: { fontSize: 32, marginBottom: 8 },
  errorText: {
    fontSize: 14,
    color: Colors.red,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: BRAND_PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryBtnText: { color: Colors.white, fontWeight: '800', fontSize: 13 },
  emptyPackagesWrap: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginTop: 20,
  },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: BRAND_TEXT,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: BRAND_MUTED,
    textAlign: 'center',
    lineHeight: 20,
  },
  materialsTab: { padding: 16 },
  matList: { gap: 12 },
  matRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  matInfo: { flex: 1 },
  matName: { fontSize: 14, fontWeight: '700', color: BRAND_TEXT },
  matQty: { fontSize: 12, color: BRAND_MUTED, marginTop: 2 },
  matBadge: {
    backgroundColor: Colors.ultraLightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  matCategory: { fontSize: 10, color: BRAND_MUTED, fontWeight: '700' },

  // New Overview Section Styles
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.lightOrange,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureList: { gap: 8 },
  featureItemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  featureBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: BRAND_PRIMARY,
    marginTop: 6,
  },
  noDataSmall: { fontSize: 11, color: BRAND_MUTED, fontStyle: 'italic' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 32,
    marginBottom: 16,
    gap: 8,
  },
  sectionEmoji: { fontSize: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: BRAND_TEXT },
  benefitsCarousel: { paddingHorizontal: 16, paddingBottom: 16, gap: 16 },
  benefitCard: {
    width: 240,
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: Colors.textMuted,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  benefitNumber: {
    fontSize: 40,
    fontWeight: '900',
    color: Colors.ultraLightGray,
    position: 'absolute',
    top: 10,
    left: 20,
  },
  benefitCardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: BRAND_TEXT,
    marginTop: 12,
    marginBottom: 8,
    zIndex: 1,
  },
  benefitCardDesc: {
    fontSize: 13,
    color: BRAND_MUTED,
    lineHeight: 18,
    zIndex: 1,
  },
  benefitDecoration: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    opacity: 0.4,
  },
  promiseBox: {
    margin: 16,
    marginTop: 32,
    backgroundColor: Colors.secondary, // Richer brand orange-brown
    borderRadius: 28,
    padding: 24,
    shadowColor: Colors.secondary,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  promiseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  promiseIcon: { fontSize: 28 },
  promiseTitle: { fontSize: 20, fontWeight: '900', color: Colors.white },
  promiseContent: { gap: 14 },
  promiseText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.95)',
    lineHeight: 22,
  },
  promiseFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 28,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  promiseBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  promiseBadgeText: { fontSize: 11, fontWeight: '800', color: Colors.white },
  emptySection: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  starIconMarginRight: { marginRight: 2 },
  bannerLoadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.lightOrange,
  },
  activityIndicatorMargin60: { margin: 60 },
  flowerIconFontSize: { fontSize: 16 },
  inlineMarginHorizontal16Padding20: { marginHorizontal: 16, padding: 20 },
  inlineMargin40: { margin: 40 },
});
