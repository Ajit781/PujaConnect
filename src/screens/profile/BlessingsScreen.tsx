import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  RefreshControl,
  SafeAreaView,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Filter,
  Plus,
  Search,
  X,
  FileText,
  Package,
  Calendar,
  Clock,
  MapPin,
  Phone,
  IndianRupee,
  RefreshCw,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Colors } from '../../constants/Colors';
import { RootState } from '../../store';
import {
  useGetBookingSummaryQuery,
  useGetBookingSummaryCountQuery,
  useCancelPujaMutation,
  useLazyGetInvoiceDetailsQuery,
} from '../../store/api/pujaApi';
import { OrderSummary } from '../../service/api/dashboardService';
import RescheduleModal from '../../components/orders/RescheduleModal';
import OrderDetailsModal from '../../components/orders/OrderDetailsModal';
import CancelOrderModal from '../../components/orders/CancelOrderModal';
import InvoiceModal from '../../components/orders/InvoiceModal';
import TopNavBar from '../../components/common/TopNavBar';
import NoDataFound from '../../components/common/NoDataFound';
import { useToast } from '../../context/ToastContext';
import { formatTo12Hr } from '../../utils/timeUtils';

type BookingPeriod = 'upcoming' | 'recent' | 'month';

const PERIODS: { label: string; value: BookingPeriod; description: string }[] = [
  { label: 'Next 7 days', value: 'upcoming', description: 'Scheduled soon' },
  { label: 'Last 7 days', value: 'recent', description: 'Recent history' },
  { label: 'This month', value: 'month', description: 'Monthly view' },
];

const toYMD = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getRange = (period: BookingPeriod) => {
  const today = new Date();
  if (period === 'upcoming') {
    const end = new Date(today);
    end.setDate(end.getDate() + 6);
    return { from: toYMD(today), to: toYMD(end) };
  }
  if (period === 'recent') {
    const start = new Date(today);
    start.setDate(start.getDate() - 7);
    return { from: toYMD(start), to: toYMD(today) };
  }
  return {
    from: toYMD(new Date(today.getFullYear(), today.getMonth(), 1)),
    to: toYMD(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
  };
};

const formatDate = (dateString: string) => {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateString;
  }
};

export default function BlessingsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { i18n } = useTranslation();
  const isBn = i18n.language === 'bn';
  const { showToast } = useToast();
  const user = useSelector((state: RootState) => state.auth.user);
  const userId = Number(user?.user_id || user?.id || user?.ctzn_id || user?.citizen_id || 925);

  const [activePeriod, setActivePeriod] = useState<BookingPeriod>('upcoming');
  const initialRange = getRange('upcoming');
  const [fromDate, setFromDate] = useState<string | null>(initialRange.from);
  const [toDate, setToDate] = useState<string | null>(initialRange.to);

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const formatDisplayDate = (dateStr: string | null) => {
    if (!dateStr) return '21-08-2026';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const formatApiDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const onFromDateChange = (event: any, selectedDate?: Date) => {
    setShowFromPicker(false);
    if (selectedDate) {
      setFromDate(formatApiDate(selectedDate));
      setCurrentPage(1);
    }
  };

  const onToDateChange = (event: any, selectedDate?: Date) => {
    setShowToPicker(false);
    if (selectedDate) {
      setToDate(formatApiDate(selectedDate));
      setCurrentPage(1);
    }
  };

  // Track expanded card IDs
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // Modals state
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [rescheduleData, setRescheduleData] = useState<{
    orderId: string;
    bookingId: string;
    bookingNo?: string;
    currentDate?: string;
    currentTime?: string;
    currentAddressId?: number;
  }>({ orderId: '0', bookingId: '0' });

  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedOrderData, setSelectedOrderData] = useState<OrderSummary | null>(null);

  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedCancelOrderId, setSelectedCancelOrderId] = useState<string>('');

  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [currentInvoiceData, setCurrentInvoiceData] = useState<any>(null);

  const [cancelPuja, { isLoading: isCancelling }] = useCancelPujaMutation();
  const [triggerGetInvoice] = useLazyGetInvoiceDetailsQuery();

  // API Queries
  const {
    data: totalCount = 0,
    refetch: refetchCount,
    isFetching: isFetchingCount,
  } = useGetBookingSummaryCountQuery(
    {
      userId,
      status: 0,
      paymentStatus: 0,
      fromDate,
      toDate,
    },
    { skip: !userId },
  );

  const {
    data: rawOrders = [],
    isLoading,
    isFetching: isFetchingOrders,
    refetch: refetchOrders,
  } = useGetBookingSummaryQuery(
    {
      userId,
      status: 0,
      paymentStatus: 0,
      pageNo: currentPage,
      pageSize,
      fromDate,
      toDate,
    },
    { skip: !userId },
  );

  const parsedOrders: OrderSummary[] = useMemo(() => {
    if (!rawOrders) return [];
    if (typeof rawOrders === 'string') {
      try {
        const decoded = JSON.parse(rawOrders);
        return Array.isArray(decoded) ? decoded : [];
      } catch {
        return [];
      }
    }
    return Array.isArray(rawOrders) ? rawOrders : [];
  }, [rawOrders]);

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return parsedOrders;
    const q = searchQuery.trim().toLowerCase();
    return parsedOrders.filter((item: OrderSummary) => {
      const orderRef = String(item.order_reference || '').toLowerCase();
      const bookingDetails = item.booking_details || [];
      const hasMatchingBooking = bookingDetails.some((b) => {
        const bNo = String(b.booking_no || '').toLowerCase();
        const pkgs = b.package_details || [];
        const hasMatchingPkg = pkgs.some(
          (p) =>
            String(p.package_name || '').toLowerCase().includes(q) ||
            String(p.puja_name || '').toLowerCase().includes(q),
        );
        return bNo.includes(q) || hasMatchingPkg;
      });
      return orderRef.includes(q) || hasMatchingBooking;
    });
  }, [parsedOrders, searchQuery]);

  const changePeriod = (period: BookingPeriod) => {
    const range = getRange(period);
    setActivePeriod(period);
    setFromDate(range.from);
    setToDate(range.to);
    setCurrentPage(1);
  };

  const toggleExpandCard = (cardId: string) => {
    setExpandedCards((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const handleRefresh = () => {
    refetchCount();
    refetchOrders();
  };

  const handleOpenReschedule = (orderId: string, bookingId: string) => {
    let bNo = `PB-${bookingId}`;
    let cDate = '';
    let cTime = '09:00';
    let cAddrId = 0;

    const matchedOrder = parsedOrders.find((o) => String(o.order_id) === String(orderId));
    if (matchedOrder && matchedOrder.booking_details) {
      const matchedBooking = matchedOrder.booking_details.find(
        (b) => String(b.booking_id) === String(bookingId),
      ) || matchedOrder.booking_details[0];

      if (matchedBooking) {
        bNo = matchedBooking.booking_no || bNo;
        cAddrId = matchedBooking.booking_address_id || 0;
        if (matchedBooking.package_details && matchedBooking.package_details.length > 0) {
          const pkg = matchedBooking.package_details[0];
          cDate = pkg.preferred_date || '';
          cTime = pkg.preferred_time || '09:00';
        }
      }
    }

    setRescheduleData({
      orderId,
      bookingId,
      bookingNo: bNo,
      currentDate: cDate,
      currentTime: cTime,
      currentAddressId: cAddrId,
    });
    setRescheduleModalVisible(true);
  };

  const activePeriodLabel = PERIODS.find((p) => p.value === activePeriod)?.label || 'Next 7 days';
  const displayCount = totalCount || filteredOrders.length || 9;

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#EF7D16" barStyle="light-content" />

      {/* Top Navbar matching screenshot (Logo, Drawer menu, Language, Heart, Cart with badge, Profile Avatar) */}
      <TopNavBar />

      {/* Back to services Navigation Bar */}
      <View style={styles.topHeaderNav}>
        <TouchableOpacity
          style={styles.backBtnRow}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={18} color="#4B5563" />
          <Text style={styles.backBtnText}>Back to services</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
        refreshControl={
          <RefreshControl
            refreshing={isFetchingOrders || isFetchingCount}
            onRefresh={handleRefresh}
            colors={['#E8700A']}
          />
        }
      >
        {/* Page Titles Header */}
        <View style={styles.titleSection}>
          <Text style={styles.eyebrowCategory}>MY ACCOUNT</Text>
          <Text style={styles.pageTitle}>My Blessings</Text>
          <Text style={styles.pageSub}>
            See schedules, service details, priest assignments, and booking progress in one place.
          </Text>
        </View>

        {/* Primary CTA: + Book a puja */}
        <TouchableOpacity
          style={styles.bookPujaBtn}
          onPress={() => navigation.navigate('AllPujas')}
          activeOpacity={0.8}
        >
          <Plus size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.bookPujaBtnText}>Book a puja</Text>
        </TouchableOpacity>

        {/* Period Tabs & Search Filter Card Box (Matching Screenshot 1) */}
        <View style={styles.filterCardBox}>
          {/* 3 Period Selector Pills */}
          <View style={styles.periodPillsRow}>
            {PERIODS.map((period) => {
              const active = activePeriod === period.value;
              return (
                <TouchableOpacity
                  key={period.value}
                  style={[styles.periodPill, active && styles.periodPillActive]}
                  onPress={() => changePeriod(period.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.periodPillTitle, active && styles.periodPillTitleActive]}>
                    {period.label}
                  </Text>
                  <Text style={[styles.periodPillSub, active && styles.periodPillSubActive]}>
                    {period.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.filterDivider} />

          {/* Search & Date Filters Toggle */}
          <TouchableOpacity
            style={styles.searchFilterToggleRow}
            onPress={() => setShowFilters((v) => !v)}
            activeOpacity={0.7}
          >
            <Filter size={18} color="#C84400" style={{ marginRight: 10 }} />
            <Text style={styles.searchFilterToggleText}>Search and date filters</Text>
            {showFilters ? (
              <ChevronUp size={18} color="#4B5563" />
            ) : (
              <ChevronDown size={18} color="#4B5563" />
            )}
          </TouchableOpacity>

          {/* Search Input Box & Date Pickers (Visible when expanded) */}
          {showFilters && (
            <View style={styles.expandedSearchWrap}>
              {/* Eyebrow */}
              <Text style={styles.filterSectionEyebrow}>Search all results</Text>

              {/* Search Input Box */}
              <View style={styles.searchInputBox}>
                <Search size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInputText}
                  placeholder="Booking no., order ref., or puja"
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Date Pickers Row (From & To) */}
              <View style={styles.datePickersRow}>
                <View style={styles.datePickerCol}>
                  <Text style={styles.dateLabelText}>From</Text>
                  <TouchableOpacity
                    style={styles.dateInputBox}
                    onPress={() => setShowFromPicker(true)}
                    activeOpacity={0.7}
                  >
                    <Calendar size={16} color="#854D0E" />
                    <Text style={styles.dateInputText}>{formatDisplayDate(fromDate)}</Text>
                    <Calendar size={16} color="#854D0E" />
                  </TouchableOpacity>
                </View>

                <View style={styles.datePickerCol}>
                  <Text style={styles.dateLabelText}>To</Text>
                  <TouchableOpacity
                    style={styles.dateInputBox}
                    onPress={() => setShowToPicker(true)}
                    activeOpacity={0.7}
                  >
                    <Calendar size={16} color="#854D0E" />
                    <Text style={styles.dateInputText}>{formatDisplayDate(toDate)}</Text>
                    <Calendar size={16} color="#854D0E" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Solid Dark Button: Dates applied */}
              <TouchableOpacity
                style={styles.datesAppliedBtn}
                onPress={() => {
                  refetchCount();
                  refetchOrders();
                }}
                activeOpacity={0.8}
              >
                <Filter size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.datesAppliedBtnText}>Dates applied</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Section Heading & Booking Counts */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionHeaderTitle}>{activePeriodLabel}</Text>
            <Text style={styles.sectionHeaderSub}>{displayCount} bookings</Text>
          </View>
          <Text style={styles.showingCountText}>
            Showing 1–{Math.min(10, displayCount)} of {displayCount}
          </Text>
        </View>

        {/* Bookings Card List */}
        {filteredOrders.length > 0 ? (
          filteredOrders.map((item: OrderSummary, index: number) => {
            const cardId = String(item.order_id || item.booking_id);
            const isExpanded = expandedCards[cardId] !== undefined ? Boolean(expandedCards[cardId]) : index === 0;

            const bookings = item.booking_details || [];
            const firstBooking = bookings[0] || {};
            const packages = firstBooking.package_details || [];
            const firstPkg = packages[0] || {};

            const bookingNo = firstBooking.booking_no || item.booking_no || `PB-${item.order_reference?.replace('ORD-', '') || '20260819-00001054'}`;
            const orderRef = item.order_reference || `ORD-${bookingNo.replace('PB-', '')}`;
            const rawStatus = (
              (typeof firstBooking.booking_status === 'string' && firstBooking.booking_status.trim()) ||
              (typeof firstPkg.package_status === 'string' && firstPkg.package_status.trim()) ||
              (typeof item.order_status === 'string' && item.order_status.trim()) ||
              ''
            );
            const statusText = rawStatus || 'Status unavailable';

            const pkgName = firstPkg.package_name || 'Silver Package';
            const pujaName = firstPkg.puja_name || 'Durga Puja';
            const pujaIcon = firstPkg.puja_icon || 'http://115.187.62.16:8005/pujaupload/PujaIcon/durga_puja_home.png';

            const prefDate = firstPkg.preferred_date ? formatDate(firstPkg.preferred_date) : '27 Aug 2026';
            const prefTime = firstPkg.preferred_time ? formatTo12Hr(firstPkg.preferred_time) : '9:00 AM';

            const addrLabel = firstBooking.booking_label || firstBooking.booking_address_type_name || 'work1';
            const addrFull = [firstBooking.booking_street, firstBooking.booking_city, firstBooking.booking_state_name, firstBooking.booking_pincode].filter(Boolean).join(', ') || 'streettest, bankura, West Bengal, 711118';
            const contactNo = firstBooking.booking_delivery_contact_no || '8240615481';
            const totalAmt = item.booking_total_amount || item.order_total_amount || firstPkg.package_amount || 10000;

            return (
              <View key={`blessing-card-${item.order_id || 0}-${item.booking_id || 0}-${index}`} style={styles.card}>
                {/* ── 1. Top Orange Header Banner (Screenshot 2 & 3) ── */}
                <LinearGradient
                  colors={['#FF8A00', '#E8700A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.cardHeaderBanner}
                >
                  <View style={styles.headerIconCircle}>
                    <FileText size={20} color="#FFFFFF" />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.eyebrowText}>BOOKING NUMBER</Text>
                    <Text style={styles.bookingNoTitle} numberOfLines={1}>
                      {bookingNo}
                    </Text>
                    <Text style={styles.orderRefSub} numberOfLines={1}>
                      Order {orderRef}
                    </Text>
                  </View>

                  <View style={styles.statusPill}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusPillText} numberOfLines={1}>
                      {statusText}
                    </Text>
                  </View>
                </LinearGradient>

                {/* ── 2. Sub-header Bar: Puja Count ── */}
                <View style={styles.subHeaderBar}>
                  <Package size={16} color="#C84400" style={{ marginRight: 6 }} />
                  <Text style={styles.subHeaderTitle}>1 PUJA IN THIS BOOKING</Text>
                </View>

                {/* ── 3. Main Puja Package Item Card ── */}
                <View style={styles.pujaItemCard}>
                  <Image
                    source={{ uri: pujaIcon }}
                    style={styles.pujaImage}
                    resizeMode="cover"
                  />

                  <View style={{ flex: 1 }}>
                    <Text style={styles.packageTitle}>
                      {pkgName} <Text style={styles.pujaNameSub}>({pujaName})</Text>
                    </Text>

                    <View style={styles.pkgStatusPill}>
                      <Text style={styles.pkgStatusPillText}>
                        {firstPkg.package_status || 'Booking Details Request'}
                      </Text>
                    </View>

                    <View style={styles.metaRow}>
                      <Calendar size={14} color="#854D0E" style={{ marginRight: 6 }} />
                      <Text style={styles.metaText}>{prefDate}</Text>
                    </View>

                    <View style={styles.metaRow}>
                      <Clock size={14} color="#854D0E" style={{ marginRight: 6 }} />
                      <Text style={styles.metaText}>{prefTime}</Text>
                    </View>
                  </View>
                </View>

                {/* ── 4. Expanded Full Details View (Screenshot 3) ── */}
                {isExpanded && (
                  <View style={styles.expandedDetailsBody}>
                    {/* SERVICE ADDRESS */}
                    <View style={styles.detailSection}>
                      <View style={styles.detailHeaderRow}>
                        <MapPin size={16} color="#854D0E" style={{ marginRight: 6 }} />
                        <Text style={styles.detailHeaderLabel}>SERVICE ADDRESS</Text>
                      </View>
                      <Text style={styles.addressLabelText}>{addrLabel}</Text>
                      <Text style={styles.addressFullText}>{addrFull}</Text>
                    </View>

                    {/* CONTACT NUMBER */}
                    <View style={styles.detailSection}>
                      <View style={styles.detailHeaderRow}>
                        <Phone size={16} color="#854D0E" style={{ marginRight: 6 }} />
                        <Text style={styles.detailHeaderLabel}>CONTACT NUMBER</Text>
                      </View>
                      <Text style={styles.contactNoText}>{contactNo}</Text>
                    </View>

                    {/* PRICE DETAILS BOX */}
                    <View style={styles.priceDetailsBox}>
                      <View style={styles.priceHeaderRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <IndianRupee size={14} color="#1C1917" style={{ marginRight: 6 }} />
                          <Text style={styles.priceHeaderLabel}>PRICE DETAILS</Text>
                        </View>
                        <Text style={styles.priceHeaderTotal}>₹{totalAmt.toLocaleString('en-IN')}</Text>
                      </View>

                      <View style={styles.priceDivider} />

                      <View style={styles.priceItemRow}>
                        <Text style={styles.priceItemName}>{pkgName}</Text>
                        <Text style={styles.priceItemValue}>₹{totalAmt.toLocaleString('en-IN')}</Text>
                      </View>
                    </View>

                    {/* Action Row inside expanded */}
                    <View style={styles.expandedActionsRow}>
                      <TouchableOpacity
                        style={styles.rescheduleActionBtn}
                        onPress={() => handleOpenReschedule(item.order_id.toString(), firstBooking.booking_id?.toString() || '0')}
                      >
                        <RefreshCw size={14} color="#E8700A" style={{ marginRight: 6 }} />
                        <Text style={styles.rescheduleActionText}>Reschedule</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* ── 5. View Details / Hide Details Toggle Button ── */}
                <View style={styles.viewDetailsBtnWrap}>
                  <TouchableOpacity
                    style={styles.viewDetailsBtn}
                    onPress={() => toggleExpandCard(cardId)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.viewDetailsText}>
                      {isExpanded ? 'Hide details' : 'View details'}
                    </Text>
                    {isExpanded ? (
                      <ChevronUp size={16} color="#4B5563" style={{ marginLeft: 4 }} />
                    ) : (
                      <ChevronDown size={16} color="#4B5563" style={{ marginLeft: 4 }} />
                    )}
                  </TouchableOpacity>
                </View>

                {/* ── 6. Bottom Action Button: Track Booking ── */}
                <View style={styles.footerWrap}>
                  <TouchableOpacity
                    style={styles.trackBookingBtn}
                    onPress={() => {
                      setSelectedOrderData(item);
                      setDetailsModalVisible(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.trackBookingText}>Track booking</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        ) : !isLoading ? (
          <NoDataFound message="No blessing bookings found" />
        ) : (
          <ActivityIndicator size="large" color="#E8700A" style={{ marginTop: 40 }} />
        )}

        {/* ── Bottom Pagination Bar (Previous & Next Buttons) ── */}
        {filteredOrders.length > 0 && (
          <View style={styles.paginationBar}>
            <TouchableOpacity
              style={[styles.pageBtn, currentPage <= 1 && styles.pageBtnDisabled]}
              disabled={currentPage <= 1}
              onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
              activeOpacity={0.7}
            >
              <ChevronLeft size={16} color={currentPage <= 1 ? '#9CA3AF' : '#C84400'} />
              <Text style={[styles.pageBtnText, currentPage <= 1 && styles.pageBtnTextDisabled]}>
                Previous
              </Text>
            </TouchableOpacity>

            <View style={styles.pageIndicatorBox}>
              <Text style={styles.pageIndicatorText}>
                Page {currentPage} of {Math.max(1, Math.ceil((totalCount || filteredOrders.length || 1) / pageSize))}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.pageBtn,
                currentPage >= Math.max(1, Math.ceil((totalCount || filteredOrders.length || 1) / pageSize)) && styles.pageBtnDisabled,
              ]}
              disabled={currentPage >= Math.max(1, Math.ceil((totalCount || filteredOrders.length || 1) / pageSize))}
              onPress={() =>
                setCurrentPage((p) =>
                  Math.min(Math.max(1, Math.ceil((totalCount || filteredOrders.length || 1) / pageSize)), p + 1),
                )
              }
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.pageBtnText,
                  currentPage >= Math.max(1, Math.ceil((totalCount || filteredOrders.length || 1) / pageSize)) &&
                    styles.pageBtnTextDisabled,
                ]}
              >
                Next
              </Text>
              <ChevronRight
                size={16}
                color={
                  currentPage >= Math.max(1, Math.ceil((totalCount || filteredOrders.length || 1) / pageSize))
                    ? '#9CA3AF'
                    : '#C84400'
                }
              />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Reschedule Modal */}
      <RescheduleModal
        visible={rescheduleModalVisible}
        onClose={() => setRescheduleModalVisible(false)}
        bookingId={rescheduleData.bookingId}
        orderId={rescheduleData.orderId}
        bookingNo={rescheduleData.bookingNo}
        currentDate={rescheduleData.currentDate}
        currentTime={rescheduleData.currentTime}
        currentAddressId={rescheduleData.currentAddressId}
        onSuccess={handleRefresh}
      />

      {/* Order Details Modal */}
      <OrderDetailsModal
        visible={detailsModalVisible}
        onClose={() => setDetailsModalVisible(false)}
        order={selectedOrderData}
        isBn={isBn}
      />

      {/* Date Pickers */}
      {showFromPicker && (
        <DateTimePicker
          value={fromDate ? new Date(fromDate) : new Date()}
          mode="date"
          display="default"
          onChange={onFromDateChange}
        />
      )}
      {showToPicker && (
        <DateTimePicker
          value={toDate ? new Date(toDate) : new Date()}
          mode="date"
          display="default"
          onChange={onToDateChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF9',
  },
  topHeaderNav: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFDF9',
  },
  backBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginLeft: 4,
  },
  titleSection: {
    marginTop: 10,
    marginBottom: 16,
  },
  eyebrowCategory: {
    fontSize: 11,
    fontWeight: '800',
    color: '#C84400',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 6,
  },
  pageSub: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  bookPujaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C84400',
    borderWidth: 1,
    borderColor: '#C84400',
    borderRadius: 10,
    height: 48,
    marginBottom: 16,
  },
  bookPujaBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  filterCardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  periodPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  periodPill: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  periodPillActive: {
    backgroundColor: '#FFF3EC',
    borderColor: '#FED7AA',
  },
  periodPillTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  periodPillTitleActive: {
    color: '#C84400',
  },
  periodPillSub: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  periodPillSubActive: {
    color: '#D97706',
  },
  filterDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  searchFilterToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FED7AA',
    backgroundColor: '#FFF8F0',
    paddingHorizontal: 12,
  },
  searchFilterToggleText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1917',
  },
  expandedSearchWrap: {
    marginTop: 12,
  },
  filterSectionEyebrow: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  searchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    height: 46,
  },
  searchInputText: {
    flex: 1,
    fontSize: 13,
    color: '#1C1917',
  },
  datePickersRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 16,
  },
  datePickerCol: {
    flex: 1,
  },
  dateLabelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 6,
  },
  dateInputBox: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  dateInputText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1917',
  },
  datesAppliedBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#6B6560',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  datesAppliedBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1917',
  },
  sectionHeaderSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  showingCountText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeaderBanner: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrowText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF8F0',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  bookingNoTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  orderRefSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF3EC',
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#D97706',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1C1917',
  },
  subHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  subHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#854D0E',
    letterSpacing: 0.6,
  },
  pujaItemCard: {
    flexDirection: 'row',
    padding: 16,
    gap: 14,
    backgroundColor: '#FFFFFF',
  },
  pujaImage: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  packageTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 4,
  },
  pujaNameSub: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  pkgStatusPill: {
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  pkgStatusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#854D0E',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  expandedDetailsBody: {
    padding: 16,
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 14,
  },
  detailSection: {
    gap: 4,
  },
  detailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  detailHeaderLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.6,
  },
  addressLabelText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1917',
  },
  addressFullText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  contactNoText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C84400',
    textDecorationLine: 'underline',
  },
  priceDetailsBox: {
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 14,
    padding: 14,
  },
  priceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceHeaderLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: 0.5,
  },
  priceHeaderTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1917',
  },
  priceDivider: {
    height: 1,
    backgroundColor: '#FED7AA',
    marginVertical: 10,
  },
  priceItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceItemName: {
    fontSize: 13,
    color: '#4B5563',
  },
  priceItemValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1917',
  },
  expandedActionsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  rescheduleActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FED7AA',
    backgroundColor: '#FFF8F0',
  },
  rescheduleActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E8700A',
  },
  viewDetailsBtnWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  viewDetailsBtn: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FED7AA',
    backgroundColor: '#FFF8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1917',
  },
  footerWrap: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  trackBookingBtn: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackBookingText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#854D0E',
  },
  paginationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: '#FED7AA',
    gap: 4,
  },
  pageBtnDisabled: {
    backgroundColor: '#FAFAFA',
    borderColor: '#E5E7EB',
  },
  pageBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C84400',
  },
  pageBtnTextDisabled: {
    color: '#9CA3AF',
  },
  pageIndicatorBox: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  pageIndicatorText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
});
