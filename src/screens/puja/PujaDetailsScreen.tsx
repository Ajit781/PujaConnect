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
import { Clock, Users, CheckCircle, ChevronDown, ChevronUp, Gift, ChevronLeft, ChevronRight } from 'lucide-react-native';
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

const AccordionItem = ({ title, children, defaultOpen = false, isBn = false }) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen(!isOpen);
  };
  return (
    <View style={styles.accordionContainer}>
      <TouchableOpacity style={styles.accordionHeader} onPress={toggle} activeOpacity={0.7}>
        <Text style={styles.accordionTitle}>{title}</Text>
        {isOpen ? <ChevronUp size={20} color="#333" /> : <ChevronDown size={20} color="#333" />}
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.accordionContent}>
          {children}
        </View>
      )}
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

  // Use passed pujaData (Real API) or fallback to FEATURED_PUJAS (Dummy)
  const puja = pujaData || {};
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    null,
  );
  const [showPackageDropdown, setShowPackageDropdown] = useState(false);
  const [activeDetailsPkg, setActiveDetailsPkg] = useState<any>(null);

  // RTK Query Hooks
  const {
    data: imagesData = [],
    isLoading: isLoadingImages,
    refetch: refetchImages,
  } = useGetPujaImagesQuery(pujaId.toString(), {
    skipGlobalLoader: true,
  } as any);
  const {
    data: packagesData = [],
    isLoading: isLoadingPackages,
    isError: isErrorPackages,
    refetch: refetchPackages,
  } = useGetPujaPackagesQuery(pujaId.toString(), {
    skipGlobalLoader: true,
  } as any);
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
    isLoading: isLoadingFull,
    refetch: refetchFullDetails,
  } = useGetPujaFullDetailsQuery(pujaId.toString(), {
    skipGlobalLoader: true,
  } as any);

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true),
    );
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
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
  }, [refetchImages, refetchPackages, refetchFullDetails]);

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
          content: null,
          isUrl: false,
          color: Colors.tagRed,
        },
      ];

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor="#FAF6EF"
        barStyle="dark-content"
        translucent={true}
      />
      <TopNavBar showBack={true} />

      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#E8711E']}
            tintColor="#E8711E"
          />
        }
      >
        {/* Banner Area */}
        <View style={styles.bannerWrapper}>
          {isLoadingImages ? (
            <View style={[styles.bannerImg, styles.bannerLoadingContainer]}>
              <ActivityIndicator color="#E8711E" size="large" />
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
                  <ImagePlaceholder />
                )}

                <View style={styles.imagePagination}>
                  <TouchableOpacity
                    onPress={() => setActiveImageIndex(Math.max(0, activeImageIndex - 1))}
                    disabled={activeImageIndex === 0}
                    style={[styles.navRoundBtn, activeImageIndex === 0 && { opacity: 0.5 }]}
                  >
                    <ChevronLeft size={20} color="#FFF" />
                  </TouchableOpacity>
                  <View style={styles.paginationPill}>
                    <Text style={styles.paginationText}>{activeImageIndex + 1} / {IMAGES.length}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setActiveImageIndex(Math.min(IMAGES.length - 1, activeImageIndex + 1))}
                    disabled={activeImageIndex === IMAGES.length - 1}
                    style={[styles.navRoundBtn, activeImageIndex === IMAGES.length - 1 && { opacity: 0.5 }]}
                  >
                    <ChevronRight size={20} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>

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
                        <Image
                          source={{ uri: img.content }}
                          style={styles.thumbImgReal}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.thumbPlaceholder}>
                          <Text style={[styles.thumbEmoji, activeImageIndex === idx ? styles.thumbEmojiActive : styles.thumbEmojiInactive]}>
                            🖼️
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        {/* Info Area */}
        <View style={styles.infoArea}>
          <View style={styles.vedicLabelRow}>
            <Text style={{ fontSize: 18, marginRight: 4 }}>🏵️</Text>
            <Text style={styles.vedicLabelText}>Authentic Vedic Puja Service</Text>
          </View>

          <Text style={styles.mainTitle}>{title}</Text>
          <Text style={styles.subTitle}>Invoke Divine Blessings</Text>

          <View style={styles.linksRow}>
            <Text style={styles.linkText}>No reviews yet</Text>
            <View style={styles.linkDivider} />
            <Text style={styles.linkTextActive}>Certified pandits</Text>
            <View style={styles.linkDivider} />
            <Text style={styles.linkTextActive}>Clear package pricing</Text>
          </View>

          <View style={styles.benefitsWrap}>
            {['Removes obstacles', 'Attracts positive energy', 'Brings prosperity'].map((ben, i) => (
              <View key={i} style={styles.benefitPill}>
                <CheckCircle size={14} color="#E8700A" strokeWidth={2.5} />
                <Text style={styles.benefitPillText}>{ben}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* PACKAGES SECTION START */}
        <View style={styles.packagesTabContainer}>
          <View style={styles.packagesHeader}>
            <Text style={styles.packagesHeaderTitle}>
              {isBn ? 'প্যাকেজ নির্বাচন করুন' : 'SELECT A PACKAGE'}
            </Text>
            <Text style={styles.packagesHeaderCount}>
              {packagesData.length} {isBn ? 'বিকল্প' : 'options'}
            </Text>
          </View>

          {isLoadingPackages ? (
            <ActivityIndicator
              color="#E8711E"
              style={styles.inlineMargin40}
            />
          ) : isErrorPackages ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorEmoji}>⚠️</Text>
              <Text style={styles.errorText}>Failed to load packages</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => refetchPackages()}
              >
                <Text style={styles.retryBtnText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : packagesData.length > 0 ? (
            <View style={styles.packagesGrid}>
              {packagesData.map((pkg) => {
                const isSelected = selectedPackageId === pkg.puja_package_id.toString();
                return (
                  <TouchableOpacity
                    key={pkg.puja_package_id}
                    activeOpacity={0.9}
                    style={[
                      styles.newPackageCard,
                      isSelected && styles.newPackageCardSelected,
                    ]}
                    onPress={() => setSelectedPackageId(pkg.puja_package_id.toString())}
                  >
                    {isSelected && (
                      <View style={styles.newPackageCheck}>
                        <CheckCircle size={18} color="#E8711E" strokeWidth={2.5} />
                      </View>
                    )}
                    <Text style={[styles.newPackageTitle, isSelected && styles.newPackageTitleSelected]}>
                      {pkg.puja_package_name}
                    </Text>
                    <Text style={styles.newPackagePrice}>
                      ₹{pkg.puja_package_price.toLocaleString('en-IN')}
                    </Text>

                    <View style={styles.newPackageMetaRow}>
                      <Clock size={12} color="#A68A7A" />
                      <Text style={styles.newPackageMetaText}>
                        {pkg.puja_duration} {isBn ? 'ঘন্টা' : 'hours'}
                      </Text>
                      <Users size={12} color="#A68A7A" style={{ marginLeft: 4 }} />
                      <Text style={styles.newPackageMetaText}>
                        {pkg.puja_count || pkg.pandit_count || 1} {isBn ? 'পুরোহিত' : 'pandit'}{((pkg.puja_count || pkg.pandit_count || 1) > 1 && !isBn) ? 's' : ''}
                      </Text>
                    </View>

                    <View style={[styles.newPackageMetaRow, { marginTop: 4 }]}>
                      <Gift size={12} color="#0D9488" />
                      <Text style={styles.materialsIncludedText}>Materials included</Text>
                    </View>

                    <TouchableOpacity style={styles.newPackageDetailsBtn} onPress={() => setActiveDetailsPkg(pkg)}>
                      <Text style={styles.newPackageDetailsText}>
                        {isBn ? 'আরও বিস্তারিত' : 'More details'}
                      </Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <NoDataFound
              message="No packages found for this puja"
              containerHeight={200}
            />
          )}
        </View>

        {/* OVERVIEW SECTION START */}
        <View style={styles.accordionsWrapper}>
          <AccordionItem title={"INCLUDED WITH PACKAGE\nPackage materials"} defaultOpen={false}>
            <View style={styles.matList}>
              {isLoadingMaterials ? (
                <ActivityIndicator color="#E8711E" />
              ) : materialsData.length > 0 ? (
                materialsData.map((mat, idx) => (
                  <View key={idx} style={styles.matRow}>
                    <View style={styles.matInfo}>
                      <Text style={styles.matName}>{mat.material_name}</Text>
                      <Text style={styles.matQty}>Quantity: {mat.quantity} {mat.unit}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataSmall}>No specific materials listed.</Text>
              )}
            </View>
          </AccordionItem>

          <AccordionItem title="About this puja" defaultOpen={true}>
            <Text style={styles.aboutDescText}>{description}</Text>
          </AccordionItem>

          <AccordionItem title="History & heritage" defaultOpen={false}>
            {history.length > 0 ? (
              history.map((h, i) => (
                <Text key={i} style={styles.aboutDescText}>• {h}</Text>
              ))
            ) : (
              <Text style={styles.aboutDescText}>Rooted in ancient Vedic traditions.</Text>
            )}
          </AccordionItem>

          <AccordionItem title="Significance" defaultOpen={false}>
            {significance.length > 0 ? (
              significance.map((s, i) => (
                <Text key={i} style={styles.aboutDescText}>• {s}</Text>
              ))
            ) : (
              <Text style={styles.aboutDescText}>Brings peace, prosperity, and divine grace.</Text>
            )}
          </AccordionItem>

          <AccordionItem title="Key benefits" defaultOpen={false}>
            <View style={styles.featureList}>
              {benefitItems.length > 0 ? (
                benefitItems.map((b, i) => (
                  <Text key={i} style={styles.benefitDescText}>{b}</Text>
                ))
              ) : (
                <>
                  <Text style={styles.benefitDescText}>Removes obstacles</Text>
                  <Text style={styles.benefitDescText}>Attracts positive energy</Text>
                  <Text style={styles.benefitDescText}>Brings prosperity</Text>
                </>
              )}
            </View>
          </AccordionItem>
        </View>

      </ScrollView>

      {/* Package Dropdown Menu Backdrop */}
      {showPackageDropdown && packagesData.length > 0 && (
        <TouchableWithoutFeedback onPress={() => setShowPackageDropdown(false)}>
          <View style={styles.dropdownBackdrop} />
        </TouchableWithoutFeedback>
      )}

      {/* Sticky Footer */}
      <View
        style={[
          styles.stickyFooter,
          {
            paddingBottom: Math.max(20, insets.bottom + 15),
            marginBottom: isKeyboardVisible ? 20 : 0,
          },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }], width: '100%' }}>
          <TouchableOpacity
            style={[
              styles.footerBtn,
              pujaData ? {} : !puja.isAvailable && styles.footerBtnDisabled,
            ]}
            disabled={pujaData ? false : !puja.isAvailable}
            onPress={() => {
              NetInfo.fetch().then(state => {
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
                  <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor="#FF9933" stopOpacity="1" />
                    <Stop offset="1" stopColor="#E07800" stopOpacity="1" />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#grad)" rx="16" />
              </Svg>
            </View>
            <View style={styles.footerLeft}>
              <Text style={styles.footerPkgName}>
                {selectedPackage ? selectedPackage.puja_package_name : (isBn ? 'প্যাকেজ নির্বাচন করুন' : 'Select Package')}
              </Text>
              <Text style={styles.footerPkgPrice}>
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
            <View style={styles.footerRight}>
              <Text style={styles.footerBtnText}>
                Continue {'>'}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>


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
  container: { flex: 1, backgroundColor: '#FAF6EF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FAF6EF',
  },
  headerPadding: { paddingBottom: 10 },
  backBtnWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: { fontSize: 24, color: '#333', marginBottom: 2 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111' },

  body: { flex: 1 },
  bannerWrapper: { padding: 16 },
  bannerImg: {
    height: 320,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  imagePagination: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navRoundBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)'
  },
  paginationPill: {
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)'
  },
  paginationText: { color: '#FFF', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  paginationArrow: { color: '#FFF', fontSize: 16, fontWeight: '900', marginTop: -2 },

  thumbnailRow: { flexDirection: 'row', marginTop: 12, gap: 12 },
  thumbnailImg: {
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  thumbnailImgActive: {
    borderColor: '#E8711E',
  },
  thumbImgReal: { width: '100%', height: '100%' },
  thumbPlaceholder: { width: '100%', height: '100%', backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  thumbEmoji: { fontSize: 24 },
  thumbEmojiActive: { opacity: 1 },
  thumbEmojiInactive: { opacity: 0.5 },
  bannerImgFull: { width: '100%', height: '100%' },
  bannerLoadingContainer: { backgroundColor: '#F3EFEA' },

  infoArea: { paddingHorizontal: 16, marginBottom: 24 },
  vedicLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  vedicIcon: { width: 24, height: 24 },
  vedicLabelText: { color: '#2162a1', fontSize: 13, fontWeight: '600' },
  mainTitle: { fontSize: 26, fontWeight: '500', color: '#1A0E04', marginBottom: 4 },
  subTitle: { fontSize: 15, color: '#C8962A', fontWeight: '400', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },

  linksRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 },
  linkText: { color: '#888', fontSize: 13 },
  linkTextActive: { color: '#2162a1', fontSize: 13, textDecorationLine: 'underline' },
  linkDivider: { width: 1, height: 12, backgroundColor: '#D1D5DB' },

  benefitsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  benefitPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FDF8EC', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(200,150,42,0.2)' },
  benefitPillText: { fontSize: 13, color: '#4A2C0E', fontWeight: '500' },

  packagesTabContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3EFEA',
  },
  packagesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  packagesHeaderTitle: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
    color: '#1A0E04',
  },
  packagesHeaderCount: {
    fontSize: 13,
    color: '#8A7A71',
  },
  packagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  newPackageCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 8,
    position: 'relative',
    marginBottom: 12,
  },
  newPackageCardSelected: {
    backgroundColor: '#FFF8F3',
    borderColor: '#E8711E',
    borderWidth: 1.5,
  },
  newPackageCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
  },
  newPackageTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
    paddingRight: 16,
    minHeight: 30,
  },
  newPackageTitleSelected: {
    color: '#E8711E',
  },
  newPackagePrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    marginBottom: 6,
  },
  newPackageMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newPackageMetaText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
  },
  materialsIncludedText: {
    fontSize: 11,
    color: '#0D9488',
    marginLeft: 4,
    fontWeight: '600',
  },
  newPackageDetailsBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  newPackageDetailsText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  inlineMargin40: { margin: 40 },
  errorBox: { padding: 30, alignItems: 'center', backgroundColor: '#FEE2E2', borderRadius: 20 },
  errorEmoji: { fontSize: 32, marginBottom: 8 },
  errorText: { fontSize: 14, color: '#DC2626', fontWeight: '700', marginBottom: 16 },
  retryBtn: { backgroundColor: '#E8711E', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  retryBtnText: { color: '#FFF', fontWeight: '800', fontSize: 13 },

  accordionsWrapper: { paddingHorizontal: 16, marginTop: 16, paddingBottom: 40 },
  accordionContainer: { borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18 },
  accordionTitle: { fontSize: 17, fontWeight: '500', color: '#1A0E04' },
  accordionContent: { paddingBottom: 16 },

  matList: { gap: 12 },
  matRow: { paddingBottom: 8 },
  matInfo: { flex: 1 },
  matName: { fontSize: 14, fontWeight: '600', color: '#111' },
  matQty: { fontSize: 12, color: '#666', marginTop: 2 },
  noDataSmall: { fontSize: 13, color: '#888', fontStyle: 'italic' },

  aboutDescText: { fontSize: 14, color: '#7A4A22', lineHeight: 22, marginBottom: 8 },
  featureList: { gap: 8 },
  benefitDescText: { fontSize: 14, color: '#E8711E', fontWeight: '600', marginBottom: 4 },

  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FAF6EF',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  footerBtn: {
    /* backgroundColor: '#D95D14', */ overflow: 'hidden',
    borderRadius: 16,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    shadowColor: '#D95D14',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  footerBtnDisabled: { backgroundColor: '#ccc' },
  footerLeft: { flex: 1 },
  footerPkgName: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600', marginBottom: 2 },
  footerPkgPrice: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  footerRight: { justifyContent: 'center' },
  footerBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  dropdownBackdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 90,
  },
});
