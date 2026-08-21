import React, { useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import {
  Platform,
  LayoutAnimation,
  UIManager,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  Image,
  ActivityIndicator,
  Keyboard,
  RefreshControl,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  Users,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Gift,
  ChevronLeft,
  ChevronRight,
  Star,
  ArrowLeft,
  Check,
} from 'lucide-react-native';
import BookingModal from '../../components/booking/BookingModal';
import PackageDetailsModal from '../../components/booking/PackageDetailsModal';
import NoDataFound from '../../components/common/NoDataFound';
import ImagePlaceholder from '../../components/common/ImagePlaceholder';
import { useToast } from '../../context/ToastContext';
import { Colors } from '../../constants/Colors';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import {
  useGetPujaImagesQuery,
  useGetPujaPackagesQuery,
  useGetPackageMaterialsQuery,
  useGetPujaFullDetailsQuery,
} from '../../store/api/pujaApi';
import TopNavBar from '../../components/common/TopNavBar';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Collapsible Accordion Item Component matching Screenshot 3
const AccordionItem = ({
  title,
  children,
  defaultOpen = false,
  badgeCount = null,
  subtitle = null,
}: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen(!isOpen);
  };
  return (
    <View style={styles.accordionContainer}>
      <TouchableOpacity
        style={styles.accordionHeader}
        onPress={toggle}
        activeOpacity={0.7}
      >
        <View style={{ flex: 1 }}>
          {subtitle && <Text style={styles.accordionSubtitle}>{subtitle}</Text>}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[styles.accordionTitle, subtitle && { color: '#C84400' }]}>
              {title}
            </Text>
            {badgeCount !== null && (
              <View style={styles.badgeCircle}>
                <Text style={styles.badgeText}>{badgeCount}</Text>
              </View>
            )}
          </View>
        </View>
        {isOpen ? (
          <ChevronUp size={20} color="#1C1917" />
        ) : (
          <ChevronDown size={20} color="#1C1917" />
        )}
      </TouchableOpacity>
      {isOpen && <View style={styles.accordionContent}>{children}</View>}
    </View>
  );
};

export default function PujaDetailsScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const { i18n, t } = useTranslation();
  const isBn = i18n.language === 'bn';
  const { showToast } = useToast();
  const { pujaId, pujaData } = route.params;
  const [refreshing, setRefreshing] = useState(false);

  const puja = pujaData || {};
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [activeDetailsPkg, setActiveDetailsPkg] = useState<any>(null);

  // RTK Query Hooks
  const {
    data: imagesData = [],
    isLoading: isLoadingImages,
    refetch: refetchImages,
  } = useGetPujaImagesQuery(pujaId.toString(), { skipGlobalLoader: true } as any);

  const {
    data: packagesData = [],
    isLoading: isLoadingPackages,
    isError: isErrorPackages,
    refetch: refetchPackages,
  } = useGetPujaPackagesQuery(pujaId.toString(), { skipGlobalLoader: true } as any);

  const {
    data: materialsData = [],
    isLoading: isLoadingMaterials,
    refetch: refetchMaterials,
  } = useGetPackageMaterialsQuery(
    {
      pujaId: pujaId.toString(),
      packageId: selectedPackageId || '',
    },
    { skip: !selectedPackageId, skipGlobalLoader: true } as any,
  );

  const {
    data: fullDetails,
    refetch: refetchFullDetails,
  } = useGetPujaFullDetailsQuery(pujaId.toString(), { skipGlobalLoader: true } as any);

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchImages(),
        refetchPackages(),
        refetchMaterials(),
        refetchFullDetails(),
      ]);
    } catch (err) {
      console.error('PujaDetails refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  }, [refetchImages, refetchPackages, refetchMaterials, refetchFullDetails]);

  // Auto-select first package when loaded
  useEffect(() => {
    if (packagesData.length > 0 && !selectedPackageId) {
      setSelectedPackageId(packagesData[0].puja_package_id.toString());
    }
  }, [packagesData, selectedPackageId]);

  const rating =
    fullDetails?.puja_rating ||
    pujaData?.puja_rating ||
    puja.rating ||
    '4.5';
  const title =
    fullDetails?.puja_name || pujaData?.puja_name || puja.name || puja.title || 'Durga Puja';
  const subTitle =
    fullDetails?.puja_sub_name || pujaData?.puja_sub_name || 'Worship for strength and protection';
  const description =
    fullDetails?.description ||
    pujaData?.description ||
    puja.description ||
    'Durga worship with mantra chanting, offerings, and aarti to seek courage, protection, and family well-being.';

  // Parsing Utility for Semicolon/Newline data
  const parseAsBullets = (dataStr: string | undefined) => {
    if (!dataStr) return [];
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
    : [
      'Provides structured priest guidance.',
      'Encourages spiritual focus.',
      'Creates a meaningful family experience.',
    ];

  const history = parseAsBullets(fullDetails?.puja_history_details);
  const significance = parseAsBullets(fullDetails?.puja_significance);

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
          content: null,
          isUrl: false,
          color: Colors.tagRed,
        },
      ];

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor="#FFFDF6"
        barStyle="dark-content"
        translucent={true}
      />

      {/* Top Navigation Bar with Back Arrow, Cart & Wishlist */}
      <TopNavBar showBack={true} />

      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#E8700A']}
            tintColor="#E8700A"
          />
        }
      >
        {/* ── Main Banner Image Carousel matching Screenshot 1 ── */}
        <View style={styles.bannerWrapper}>
          <View style={styles.bannerCard}>
            {isLoadingImages ? (
              <View style={[styles.bannerImg, styles.bannerLoadingContainer]}>
                <ActivityIndicator color="#E8700A" size="large" />
              </View>
            ) : (
              <View style={styles.bannerImgContainer}>
                {IMAGES[activeImageIndex].isUrl ? (
                  <Image
                    source={{ uri: IMAGES[activeImageIndex].content }}
                    style={styles.bannerImgFull}
                    resizeMode="cover"
                  />
                ) : (
                  <ImagePlaceholder />
                )}

                {/* Translucent Overlay Pill Pagination < 1/2 > */}
                <View style={styles.imagePaginationOverlay}>
                  <TouchableOpacity
                    onPress={() => setActiveImageIndex(Math.max(0, activeImageIndex - 1))}
                    disabled={activeImageIndex === 0}
                    style={styles.paginationArrowBtn}
                  >
                    <ChevronLeft size={16} color="#FFFFFF" />
                  </TouchableOpacity>

                  <Text style={styles.paginationText}>
                    {activeImageIndex + 1}/{IMAGES.length}
                  </Text>

                  <TouchableOpacity
                    onPress={() => setActiveImageIndex(Math.min(IMAGES.length - 1, activeImageIndex + 1))}
                    disabled={activeImageIndex === IMAGES.length - 1}
                    style={styles.paginationArrowBtn}
                  >
                    <ChevronRight size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Thumbnails Row matching Screenshot 1 */}
          {IMAGES.length > 1 && (
            <View style={styles.thumbnailRow}>
              {IMAGES.map((img, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setActiveImageIndex(idx)}
                  style={[
                    styles.thumbnailImg,
                    activeImageIndex === idx && styles.thumbnailImgActive,
                  ]}
                >
                  {img.isUrl ? (
                    <Image source={{ uri: img.content }} style={styles.thumbImgReal} resizeMode="cover" />
                  ) : (
                    <View style={styles.thumbPlaceholder}>
                      <Text style={{ fontSize: 18 }}>🖼️</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── Authentic Vedic Puja Service Tag & Title Info matching Screenshot 1 ── */}
        <View style={styles.infoArea}>
          <View style={styles.vedicLabelRow}>
            <View style={styles.vedicIconSquare}>
              <Text style={{ fontSize: 14 }}>🕉️</Text>
            </View>
            <Text style={styles.vedicLabelText}>Authentic Vedic Puja Service</Text>
          </View>

          <Text style={styles.mainTitle}>{title}</Text>
          <Text style={styles.subTitle}>{subTitle}</Text>

          {/* Meta Links Row matching Screenshot 1 */}
          <View style={styles.linksRow}>
            <Text style={styles.linkText}>No reviews yet</Text>
            <View style={styles.linkDivider} />
            <Text style={styles.linkTextActive}>Certified pandits</Text>
            <View style={styles.linkDivider} />
            <Text style={styles.linkTextActive}>Clear package pricing</Text>
          </View>

          {/* ── Quick Benefits Pills matching exact web CSS (#f4f8f7 bg, #315b50 text, #067d62 icon) ── */}
          <View style={styles.cyanBenefitsWrap}>
            {benefitItems.map((ben, i) => (
              <View key={i} style={styles.cyanBenefitPill}>
                <CheckCircle2 size={16} color="#067D62" strokeWidth={2} />
                <Text style={styles.cyanBenefitPillText}>{ben}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── SELECT A PACKAGE Grid Box matching Screenshot 2 ── */}
        <View style={styles.packagesContainer}>
          <View style={styles.packagesCardOuter}>
            <View style={styles.packagesHeader}>
              <Text style={styles.packagesHeaderTitle}>SELECT A PACKAGE</Text>
              <Text style={styles.packagesHeaderCount}>
                {packagesData.length > 0 ? `${packagesData.length} options` : '3 options'}
              </Text>
            </View>

            {isLoadingPackages ? (
              <ActivityIndicator color="#E8700A" style={{ marginVertical: 30 }} />
            ) : isErrorPackages ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>Failed to load packages</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => refetchPackages()}>
                  <Text style={styles.retryBtnText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.packagesGrid}>
                {(packagesData.length > 0
                  ? packagesData
                  : [
                    {
                      puja_package_id: '1',
                      puja_package_name: 'Platinum Package',
                      puja_package_price: 10000,
                      puja_duration: '2',
                      puja_count: 3,
                    },
                    {
                      puja_package_id: '2',
                      puja_package_name: 'Silver Package',
                      puja_package_price: 10000,
                      puja_duration: '2',
                      puja_count: 3,
                    },
                    {
                      puja_package_id: '3',
                      puja_package_name: 'Gold Package',
                      puja_package_price: 10000,
                      puja_duration: '3',
                      puja_count: 3,
                    },
                  ]
                ).map((pkg: any) => {
                  const pkgId = pkg.puja_package_id.toString();
                  const isSelected = selectedPackageId === pkgId;
                  return (
                    <TouchableOpacity
                      key={pkgId}
                      activeOpacity={0.9}
                      style={[
                        styles.newPackageCard,
                        isSelected && styles.newPackageCardSelected,
                      ]}
                      onPress={() => setSelectedPackageId(pkgId)}
                    >
                      {isSelected && (
                        <View style={styles.selectedCheckCircle}>
                          <Check size={12} color="#E8700A" strokeWidth={3} />
                        </View>
                      )}

                      <Text
                        style={[
                          styles.newPackageTitle,
                          isSelected && styles.newPackageTitleSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {pkg.puja_package_name}
                      </Text>

                      <Text style={styles.newPackagePrice}>
                        ₹{pkg.puja_package_price.toLocaleString('en-IN')}
                      </Text>

                      <View style={styles.newPackageMetaRow}>
                        <Clock size={13} color="#C84400" />
                        <Text style={styles.newPackageMetaText}>
                          {pkg.puja_duration || pkg.duration || 2} hours
                        </Text>
                        <Users size={13} color="#C84400" style={{ marginLeft: 4 }} />
                        <Text style={styles.newPackageMetaText}>
                          {pkg.puja_count || pkg.pandit_count || 3} pandits
                        </Text>
                      </View>

                      <View style={[styles.newPackageMetaRow, { marginTop: 4 }]}>
                        <Gift size={13} color="#315B50" />
                        <Text style={styles.materialsIncludedText}>Materials included</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.moreDetailsBtn}
                        onPress={() => setActiveDetailsPkg(pkg)}
                      >
                        <Text style={styles.moreDetailsText}>More details</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* ── ACCORDION SECTIONS matching Screenshot 3 ── */}
        <View style={styles.accordionsWrapper}>
          {/* 1. Package Materials Accordion */}
          <AccordionItem
            subtitle="INCLUDED WITH PACKAGE"
            title="Package materials"
            defaultOpen={true}
            badgeCount={materialsData.length > 0 ? materialsData.length : 2}
          >
            <View style={styles.matList}>
              {isLoadingMaterials ? (
                <ActivityIndicator color="#E8700A" />
              ) : (materialsData.length > 0 ? materialsData : [
                { material_name: 'Kumkum', quantity: 1, unit: 'GRAM', category: 'Puja Materials' },
                { material_name: 'Turmeric Powder', quantity: 1, unit: 'GRAM', category: 'Puja Materials' },
              ]).map((mat: any, idx: number) => (
                <View key={idx} style={styles.materialCardItem}>
                  <View style={styles.matNumberBox}>
                    <Text style={styles.matNumberText}>0{idx + 1}</Text>
                  </View>
                  <View style={styles.matContentBox}>
                    <Text style={styles.matNameText}>{mat.material_name}</Text>
                    <Text style={styles.matMetaText}>
                      {mat.quantity} {mat.unit || 'GRAM'} · {mat.category || 'Puja Materials'}
                    </Text>
                  </View>
                  <View style={styles.matIncludedBadge}>
                    <CheckCircle2 size={14} color="#059669" />
                    <Text style={styles.matIncludedText}>Included</Text>
                  </View>
                </View>
              ))}
            </View>
          </AccordionItem>

          {/* 2. About this puja */}
          <AccordionItem title="About this puja" defaultOpen={true}>
            <Text style={styles.aboutDescText}>{description}</Text>
          </AccordionItem>

          {/* 3. History & heritage */}
          <AccordionItem title="History & heritage" defaultOpen={false}>
            {history.length > 0 ? (
              history.map((h, i) => (
                <Text key={i} style={styles.aboutDescText}>{h}</Text>
              ))
            ) : (
              <>
                <Text style={styles.aboutDescText}>Rooted in established Hindu traditions.</Text>
                <Text style={styles.aboutDescText}>Performed with sankalpa and customary ritual steps.</Text>
                <Text style={styles.aboutDescText}>Adapted for respectful family participation.</Text>
              </>
            )}
          </AccordionItem>

          {/* 4. Significance */}
          <AccordionItem title="Significance" defaultOpen={false}>
            {significance.length > 0 ? (
              significance.map((s, i) => (
                <Text key={i} style={styles.aboutDescText}>{s}</Text>
              ))
            ) : (
              <Text style={styles.aboutDescText}>Brings courage, removes obstacles, and protects family members from negativity.</Text>
            )}
          </AccordionItem>

          {/* 5. Key benefits */}
          <AccordionItem title="Key benefits" defaultOpen={false}>
            <View style={styles.featureList}>
              {benefitItems.map((b, i) => (
                <Text key={i} style={styles.benefitDescText}>✓ {b}</Text>
              ))}
            </View>
          </AccordionItem>
        </View>

        {/* ── CUSTOMER REVIEWS SECTION matching Screenshot 4 ── */}
        <View style={styles.reviewsSectionWrapper}>
          <View style={styles.reviewsHeaderRow}>
            <View style={styles.starIconBox}>
              <Star size={20} color="#E8700A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reviewsSectionTitle}>Customer Reviews</Text>
              <Text style={styles.reviewsSectionSub}>Feedback from verified bookings</Text>
            </View>
          </View>

          {/* Rating Summary Card matching Screenshot 4 */}
          <View style={styles.ratingSummaryCard}>
            <Text style={styles.ratingCardTitle}>Customer Reviews</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 6 }}>
              <View style={{ flexDirection: 'row', gap: 2 }}>
                {[1, 2, 3, 4].map((s) => (
                  <Star key={s} size={16} color="#E8700A" fill="#E8700A" />
                ))}
                <Star size={16} color="#E8700A" fill="rgba(232,112,10,0.3)" />
              </View>
              <Text style={styles.ratingScoreText}>{rating} out of 5</Text>
            </View>
            <Text style={styles.globalRatingsText}>2 global ratings</Text>

            {/* Rating Bars matching Screenshot 4 */}
            <View style={styles.ratingBarsContainer}>
              {[
                { star: '5 star', percent: 50 },
                { star: '4 star', percent: 50 },
                { star: '3 star', percent: 0 },
                { star: '2 star', percent: 0 },
                { star: '1 star', percent: 0 },
              ].map((item, idx) => (
                <View key={idx} style={styles.ratingBarRow}>
                  <Text style={styles.starLabelText}>{item.star}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${item.percent}%` }]} />
                  </View>
                  <Text style={styles.percentText}>{item.percent}%</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Sample Review Item Card matching Screenshot 4 */}
          <View style={styles.reviewItemCard}>
            <View style={styles.reviewItemHeader}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarLetter}>K</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reviewerName}>Koushani Banerjee</Text>
                <Text style={styles.reviewDate}>20 Aug 2026</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 2, marginVertical: 6 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={14} color="#E8700A" fill="#E8700A" />
              ))}
            </View>

            <Text style={styles.reviewCommentText}>
              The pandit ji arrived on time with all authentic samagri. The entire puja was conducted with deep Vedic devotion. Highly satisfied!
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* ── STICKY BOTTOM FOOTER ACTION BUTTON matching Screenshots 1, 2, 3, 4 ── */}
      <View style={[styles.stickyFooter, { paddingBottom: Math.max(16, insets.bottom + 10) }]}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }], width: '100%' }}>
          <TouchableOpacity
            style={styles.footerBtn}
            activeOpacity={0.9}
            onPress={() => {
              NetInfo.fetch().then((state) => {
                if (state.isConnected) {
                  setShowBookingModal(true);
                } else {
                  showToast({
                    message: t('common.connectionRequired'),
                    type: 'error',
                  });
                }
              });
            }}
          >
            <View style={StyleSheet.absoluteFillObject}>
              <Svg height="100%" width="100%">
                <Defs>
                  <LinearGradient id="footerBtnGrad" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor="#FF9933" />
                    <Stop offset="1" stopColor="#E07800" />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#footerBtnGrad)" rx="16" />
              </Svg>
            </View>

            <View style={styles.footerLeft}>
              <Text style={styles.footerPkgName} numberOfLines={1}>
                {selectedPackage ? selectedPackage.puja_package_name : 'Platinum Package'}
              </Text>
              <Text style={styles.footerPkgPrice}>
                ₹{selectedPackage ? selectedPackage.puja_package_price.toLocaleString('en-IN') : '10,000'}
              </Text>
            </View>
            <View style={styles.footerRight}>
              <Text style={styles.footerBtnText}>Continue {'>'}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Modals */}
      <BookingModal
        visible={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        puja={puja}
        selectedPackage={selectedPackage}
        isBn={isBn}
        packagesData={packagesData}
        onSelectPackage={(id) => setSelectedPackageId(id)}
      />

      <PackageDetailsModal
        visible={!!activeDetailsPkg}
        pkg={activeDetailsPkg}
        onClose={() => setActiveDetailsPkg(null)}
        onSelect={() => {
          if (activeDetailsPkg) {
            setSelectedPackageId(activeDetailsPkg.puja_package_id.toString());
          }
          setActiveDetailsPkg(null);
        }}
        isBn={isBn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF6' },
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    backgroundColor: '#FFFDF6',
  },
  backBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1917',
    flex: 1,
  },
  body: { flex: 1 },

  // Banner
  bannerWrapper: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 16 },
  bannerCard: {
    backgroundColor: '#FAF6EF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3EFEA',
    overflow: 'hidden',
  },
  bannerImgContainer: {
    height: 280,
    width: '100%',
    position: 'relative',
  },
  bannerImgFull: { width: '100%', height: '100%' },
  bannerLoadingContainer: { height: 280, justifyContent: 'center', alignItems: 'center' },

  imagePaginationOverlay: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(30,30,30,0.85)',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paginationArrowBtn: {
    padding: 2,
  },
  paginationText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  thumbnailRow: { flexDirection: 'row', marginTop: 12, gap: 10 },
  thumbnailImg: {
    width: 56,
    height: 56,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  thumbnailImgActive: { borderColor: '#E8700A' },
  thumbImgReal: { width: '100%', height: '100%' },
  thumbPlaceholder: { width: '100%', height: '100%', backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },

  // Info Area
  infoArea: { paddingHorizontal: 16, marginBottom: 16 },
  vedicLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  vedicIconSquare: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FED7AA',
    backgroundColor: '#FFF8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vedicLabelText: { color: '#2162A1', fontSize: 13, fontWeight: '600' },
  mainTitle: { fontSize: 24, fontWeight: '600', color: '#1C1917', marginBottom: 2 },
  subTitle: { fontSize: 14, color: '#6B7280', fontWeight: '400', marginBottom: 12 },

  linksRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 },
  linkText: { color: '#6B7280', fontSize: 13 },
  linkTextActive: { color: '#2162A1', fontSize: 13, fontWeight: '400' },
  linkDivider: { width: 1, height: 12, backgroundColor: '#D1D5DB' },

  // Quick Benefits matching exact web CSS (.quick-benefits li)
  cyanBenefitsWrap: { gap: 8 },
  cyanBenefitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F4F8F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  cyanBenefitPillText: { fontSize: 13, color: '#315B50', fontWeight: '500' },

  // Packages Grid
  packagesContainer: { paddingHorizontal: 16, marginBottom: 16 },
  packagesCardOuter: {
    backgroundColor: '#FFFDF9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  packagesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  packagesHeaderTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: '#1C1917',
  },
  packagesHeaderCount: {
    fontSize: 12,
    color: '#E8700A',
    fontWeight: '500',
  },
  packagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  newPackageCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 14,
    position: 'relative',
    marginBottom: 14,
  },
  newPackageCardSelected: {
    backgroundColor: '#FFFDF9',
    borderColor: '#E8700A',
    borderWidth: 1,
  },
  selectedCheckCircle: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#E8700A',
    backgroundColor: '#FFF8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newPackageTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1C1917',
    marginBottom: 4,
    paddingRight: 20,
  },
  newPackageTitleSelected: {
    color: '#C84400',
  },
  newPackagePrice: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1917',
    marginBottom: 6,
  },
  newPackageMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  newPackageMetaText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '400',
  },
  materialsIncludedText: {
    fontSize: 11,
    color: '#315B50',
    fontWeight: '500',
  },
  moreDetailsBtn: {
    marginTop: 12,
  },
  moreDetailsText: {
    fontSize: 12,
    color: '#2162A1',
    textDecorationLine: 'underline',
    fontWeight: '400',
  },

  // Accordions matching web list layout (not card-wise)
  accordionsWrapper: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  accordionContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  accordionSubtitle: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1917',
  },
  badgeCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#FED7AA',
    backgroundColor: '#FFF8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#C84400',
  },
  accordionContent: {
    paddingBottom: 16,
  },
  aboutDescText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    fontWeight: '400',
    marginBottom: 8,
  },

  // Materials
  matList: { gap: 8 },
  materialCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    gap: 12,
  },
  matNumberBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  matContentBox: {
    flex: 1,
  },
  matNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1917',
  },
  matMetaText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  matIncludedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matIncludedText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#059669',
  },

  featureList: { gap: 6 },
  benefitDescText: {
    fontSize: 13,
    color: '#0F766E',
    fontWeight: '400',
  },

  // Reviews
  reviewsSectionWrapper: { paddingHorizontal: 16, marginBottom: 16 },
  reviewsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  starIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1917',
  },
  reviewsSectionSub: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '400',
  },
  ratingSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 12,
  },
  ratingCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1917',
  },
  ratingScoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1917',
  },
  globalRatingsText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  ratingBarsContainer: { gap: 6 },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  starLabelText: {
    width: 44,
    fontSize: 12,
    fontWeight: '500',
    color: '#2563EB',
  },
  barTrack: {
    flex: 1,
    height: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#E8700A',
    borderRadius: 6,
  },
  percentText: {
    width: 36,
    fontSize: 12,
    fontWeight: '500',
    color: '#2563EB',
    textAlign: 'right',
  },

  // Review Item
  reviewItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  reviewItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C84400',
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1917',
  },
  reviewDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  reviewCommentText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
    fontWeight: '400',
  },

  errorBox: { padding: 20, alignItems: 'center' },
  errorText: { color: '#EF4444', fontSize: 13, marginBottom: 10 },
  retryBtn: { backgroundColor: '#E8700A', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  retryBtnText: { color: '#FFF', fontSize: 12, fontWeight: '600' },

  // Sticky Footer
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFDF6',
    borderTopWidth: 1,
    borderTopColor: '#F3E8DC',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  footerBtn: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#E8700A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  footerLeft: { flex: 1 },
  footerPkgName: { color: '#FFFFFF', fontSize: 12, fontWeight: '500' },
  footerPkgPrice: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  footerRight: {},
  footerBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
