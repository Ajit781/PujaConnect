import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Star, ChevronDown } from 'lucide-react-native';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { getPujaReviewDetails } from '../../service/api/dashboardService';
import TopNavBar from '../../components/common/TopNavBar';

type NavigationProp = NativeStackNavigationProp<MainStackParamList, 'AllReviews'>;

const FILTER_OPTIONS = [
  { label: 'All Stars', value: 0 },
  { label: '5 Stars', value: 5 },
  { label: '4 Stars', value: 4 },
  { label: '3 Stars', value: 3 },
  { label: '2 Stars', value: 2 },
  { label: '1 Star', value: 1 },
];

const SORT_OPTIONS = [
  { label: 'Most Recent', value: 1 },
  { label: 'Top Positive Reviews', value: 2 },
  { label: 'Top Negative Reviews', value: 3 },
];

export default function AllReviewsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<any>();
  const { pujaId, initialStarFilter } = route.params;

  const [reviewData, setReviewData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [starFilter, setStarFilter] = useState(initialStarFilter || 0);
  const [sortBy, setSortBy] = useState(1);
  const [pageNo, setPageNo] = useState(1);
  const limit = 10;

  // Dropdown states
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [isSortModalVisible, setSortModalVisible] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [starFilter, sortBy, pageNo]);

  const fetchReviews = () => {
    setIsLoading(true);
    getPujaReviewDetails(Number(pujaId), starFilter, sortBy, pageNo, limit)
      .then((res) => {
        setReviewData(res);
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn('Error fetching all reviews:', err);
        setIsLoading(false);
      });
  };

  const totalReviews = reviewData?.total_review_count || 0;
  const totalPages = Math.max(1, Math.ceil(totalReviews / limit));

  const handlePrevPage = () => {
    if (pageNo > 1) setPageNo(pageNo - 1);
  };

  const handleNextPage = () => {
    if (pageNo < totalPages) setPageNo(pageNo + 1);
  };

  const currentFilterLabel = FILTER_OPTIONS.find((o) => o.value === starFilter)?.label || 'All Stars';
  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label || 'Most Recent';

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Navbar */}
      <TopNavBar showBack={true} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Reviews</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Title Section */}
        <View style={styles.reviewsHeaderRow}>
          <View style={styles.starIconBox}>
            <Star size={20} color="#E8700A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.reviewsSectionTitle}>Customer Reviews</Text>
            <Text style={styles.reviewsSectionSub}>Feedback from verified bookings</Text>
          </View>
        </View>

        {/* Filter and Sort Row */}
        <View style={[styles.filterSortRow, { zIndex: 100 }]}>
          {(isFilterModalVisible || isSortModalVisible) && (
            <TouchableOpacity 
              style={styles.fullScreenOverlay} 
              activeOpacity={1} 
              onPress={() => {
                setFilterModalVisible(false);
                setSortModalVisible(false);
              }} 
            />
          )}

          <View style={{ flex: 1, marginRight: 8, zIndex: isFilterModalVisible ? 10 : 1 }}>
            <Text style={styles.dropdownLabel}>Filter by</Text>
            <TouchableOpacity 
              style={[styles.dropdownBtn, isFilterModalVisible && { borderColor: '#E8700A' }]} 
              onPress={() => {
                setFilterModalVisible(!isFilterModalVisible);
                setSortModalVisible(false);
              }}
            >
              <Text style={styles.dropdownText}>{currentFilterLabel}</Text>
              <ChevronDown size={16} color="#4B5563" />
            </TouchableOpacity>

            {isFilterModalVisible && (
              <View style={styles.dropdownPopover}>
                {FILTER_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.popoverItem, starFilter === opt.value && styles.popoverItemActive]}
                    onPress={() => {
                      setStarFilter(opt.value);
                      setPageNo(1);
                      setFilterModalVisible(false);
                    }}
                  >
                    <Text style={[styles.popoverItemText, starFilter === opt.value && styles.popoverItemTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={{ flex: 1, marginLeft: 8, zIndex: isSortModalVisible ? 10 : 1 }}>
            <Text style={styles.dropdownLabel}>Sort by</Text>
            <TouchableOpacity 
              style={[styles.dropdownBtn, isSortModalVisible && { borderColor: '#E8700A' }]} 
              onPress={() => {
                setSortModalVisible(!isSortModalVisible);
                setFilterModalVisible(false);
              }}
            >
              <Text style={styles.dropdownText}>{currentSortLabel}</Text>
              <ChevronDown size={16} color="#4B5563" />
            </TouchableOpacity>

            {isSortModalVisible && (
              <View style={styles.dropdownPopover}>
                {SORT_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.popoverItem, sortBy === opt.value && styles.popoverItemActive]}
                    onPress={() => {
                      setSortBy(opt.value);
                      setPageNo(1);
                      setSortModalVisible(false);
                    }}
                  >
                    <Text style={[styles.popoverItemText, sortBy === opt.value && styles.popoverItemTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Summary Card */}
        {pageNo === 1 && (
          <View style={styles.ratingSummaryCard}>
            <Text style={styles.ratingCardTitle}>Customer Reviews</Text>
            {isLoading && !reviewData ? (
              <ActivityIndicator color="#E8700A" style={{ marginVertical: 20 }} />
            ) : (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 6 }}>
                  <View style={{ flexDirection: 'row', gap: 2 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={16}
                        color="#E8700A"
                        fill={s <= (reviewData?.average_star_rating || 0) ? '#E8700A' : '#D1D5DB'}
                      />
                    ))}
                  </View>
                  <Text style={styles.ratingScoreText}>{reviewData?.average_star_rating || 0} out of 5</Text>
                </View>
                <Text style={styles.globalRatingsText}>{reviewData?.total_review_count || 0} global ratings</Text>

                <View style={styles.ratingBarsContainer}>
                  {[
                    { star: '5 star', value: 5, percent: reviewData?.total_review_star_5_percentage || 0 },
                    { star: '4 star', value: 4, percent: reviewData?.total_review_star_4_percentage || 0 },
                    { star: '3 star', value: 3, percent: reviewData?.total_review_star_3_percentage || 0 },
                    { star: '2 star', value: 2, percent: reviewData?.total_review_star_2_percentage || 0 },
                    { star: '1 star', value: 1, percent: reviewData?.total_review_star_1_percentage || 0 },
                  ].map((item, idx) => (
                    <TouchableOpacity 
                      key={idx} 
                      style={[styles.ratingBarRow, starFilter === item.value && styles.ratingBarRowActive]}
                      onPress={() => {
                        setStarFilter(item.value);
                        setPageNo(1);
                      }}
                    >
                      <Text style={styles.starLabelText}>{item.star}</Text>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${item.percent}%` }]} />
                      </View>
                      <Text style={styles.percentText}>{item.percent}%</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {/* Reviews List */}
        {isLoading ? (
          <ActivityIndicator color="#E8700A" style={{ marginTop: 40 }} />
        ) : reviewData?.review_details && reviewData.review_details.length > 0 ? (
          <>
            {reviewData.review_details.map((review: any, index: number) => (
              <View key={index} style={[styles.reviewItemCard, { marginBottom: 12 }]}>
                <View style={styles.reviewItemHeader}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarLetter}>
                      {(review?.customer_name || review?.citizen_name || review?.user_name || 'U')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewerName}>
                      {review?.customer_name || review?.citizen_name || review?.user_name || 'User'}
                    </Text>
                    <Text style={styles.reviewDate}>{review?.review_date || review?.created_at || ''}</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 4, marginVertical: 10 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={14}
                      color={
                        s <= (review?.review_star_count || review?.star_count || review?.rating || 5)
                          ? '#E8700A'
                          : '#D1D5DB'
                      }
                      fill={
                        s <= (review?.review_star_count || review?.star_count || review?.rating || 5)
                          ? '#E8700A'
                          : '#D1D5DB'
                      }
                    />
                  ))}
                </View>

                <Text style={styles.reviewCommentText}>
                  {review?.review_remarks || review?.review_desc || review?.review_text || review?.comment || ''}
                </Text>
              </View>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <View style={styles.paginationRow}>
                <TouchableOpacity
                  style={[styles.pageBtn, pageNo === 1 && styles.pageBtnDisabled]}
                  onPress={handlePrevPage}
                  disabled={pageNo === 1}
                >
                  <Text style={[styles.pageBtnText, pageNo === 1 && styles.pageBtnTextDisabled]}>Prev</Text>
                </TouchableOpacity>

                <View style={styles.activePageBox}>
                  <Text style={styles.activePageText}>{pageNo}</Text>
                </View>

                <TouchableOpacity
                  style={[styles.pageBtn, pageNo === totalPages && styles.pageBtnDisabled]}
                  onPress={handleNextPage}
                  disabled={pageNo === totalPages}
                >
                  <Text style={[styles.pageBtnText, pageNo === totalPages && styles.pageBtnTextDisabled]}>Next</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>No reviews found</Text>
            <Text style={styles.emptyStateSub}>We couldn't find any reviews matching your current filters. Please try adjusting them.</Text>
          </View>
        )}
      </ScrollView>


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8DC',
    backgroundColor: '#FFFDF6',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3E8DC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  content: { padding: 16, paddingBottom: 40 },

  reviewsHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  starIconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(232,112,10,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reviewsSectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  reviewsSectionSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },

  filterSortRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  dropdownLabel: { fontSize: 12, color: '#6B7280', marginBottom: 6, fontWeight: '500' },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownText: { fontSize: 14, color: '#1F2937' },

  ratingSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F3E8DC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  ratingCardTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  ratingScoreText: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  globalRatingsText: { fontSize: 13, color: '#6B7280', marginBottom: 16 },
  ratingBarsContainer: { gap: 10 },
  ratingBarRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8 },
  ratingBarRowActive: { backgroundColor: '#FFF1E6' },
  starLabelText: { width: 44, fontSize: 13, color: '#0066CC', fontWeight: '500' },
  barTrack: { flex: 1, height: 16, backgroundColor: '#F3F4F6', borderRadius: 8, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#E8700A', borderRadius: 8 },
  percentText: { width: 32, fontSize: 13, color: '#0066CC', fontWeight: '500', textAlign: 'right' },

  reviewItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3E8DC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reviewItemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF1E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#FCE7D8',
  },
  avatarLetter: { fontSize: 18, fontWeight: '700', color: '#E8700A' },
  reviewerName: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  reviewDate: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  reviewCommentText: { fontSize: 14, color: '#4B5563', lineHeight: 20 },

  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
    gap: 8,
  },
  pageBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  pageBtnDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  pageBtnText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  pageBtnTextDisabled: {
    color: '#9CA3AF',
  },
  activePageBox: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  activePageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  fullScreenOverlay: {
    position: 'absolute',
    top: -1000,
    bottom: -1000,
    left: -1000,
    right: -1000,
    zIndex: 5,
  },
  dropdownPopover: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 0, // Matched sharp edges in screenshot
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 20,
    zIndex: 999,
  },
  popoverItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  popoverItemActive: {
    backgroundColor: '#1D4ED8', // Blue for active item
  },
  popoverItemText: {
    fontSize: 14,
    color: '#3F3F46',
  },
  popoverItemTextActive: {
    color: '#FFFFFF', // White text for active item
  },
  emptyStateCard: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginTop: 20
  },
  emptyStateTitle: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8
  },
  emptyStateSub: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20
  }
});
