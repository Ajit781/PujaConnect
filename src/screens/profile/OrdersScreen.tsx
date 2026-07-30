import React, { useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Platform,
  RefreshControl,
  Modal,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { decode as base64Decode } from 'base-64';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import OrderCard from '../../components/orders/OrderCard';
import TopNavBar from '../../components/common/TopNavBar';
import {
  ClipboardList,
  Sparkles,
  SlidersHorizontal,
  RotateCcw,
  Calendar,
  Package,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Archive,
} from 'lucide-react-native';

import InvoiceModal from '../../components/orders/InvoiceModal';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { PluralWebView } from '../../components/payment/PluralWebView';
import {
  useGetOrderSummaryQuery,
  useGetOrderSummaryCountQuery,
  useCancelPujaMutation,
  useGetStatusTypeQuery,
  useLazyGetCheckoutDetailsByOrderIdQuery,
  useLazyGetInvoiceDetailsQuery,
} from '../../store/api/pujaApi';
import { OrderSummary } from '../../service/api/dashboardService';
import OrderDetailsModal from '../../components/orders/OrderDetailsModal';
import CancelOrderModal from '../../components/orders/CancelOrderModal';
import CustomDatePickerModal from '../../components/common/CustomDatePickerModal';
import NoDataFound from '../../components/common/NoDataFound';
import { useToast } from '../../context/ToastContext';
import { Colors } from '../../constants/Colors';

const BRAND_PRIMARY = Colors.primary;
const BRAND_TEXT = Colors.textMain;
const BRAND_MUTED = Colors.textMuted;

const formatDate = (isoString: string) => {
  const d = new Date(isoString);
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]
    } ${d.getFullYear()}`;
};

const STATUS_CONFIG: Record<
  string,
  { bg: string; text: string; icon: string }
> = {
  'Booking Initiated': { bg: '#FFF7ED', text: '#D97706', icon: '⏳' },
  Pending: { bg: '#FFF7ED', text: '#D97706', icon: '⏳' },
  Upcoming: { bg: '#EFF6FF', text: '#2563EB', icon: '📅' },
  Rescheduled: { bg: '#F0FDF4', text: '#16A34A', icon: '🔄' },
  Completed: { bg: '#F0FDF4', text: '#16A34A', icon: '✅' },
  Cancelled: { bg: '#FEF2F2', text: '#DC2626', icon: '✖' },
  'Partial Cancelled': { bg: '#FEF2F2', text: '#DC2626', icon: '⚠️' },
};

const StatusBadge = React.memo(({ status }: { status: string }) => {
  const cfg = STATUS_CONFIG[status] || {
    bg: Colors.lightGray,
    text: BRAND_MUTED,
    icon: '•',
  };
  return (
    <View style={[sBadge.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[sBadge.text, { color: cfg.text }]}>
        {cfg.icon} {status}
      </Text>
    </View>
  );
});
const sBadge = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  text: { fontSize: 11, fontWeight: '700' },
});


export default function OrdersScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { i18n, t } = useTranslation();
  const isBn = i18n.language === 'bn';
  const { showToast } = useToast();
  const user = useSelector((state: RootState) => state.auth.user);

  const defaultToDate = new Date();
  const defaultFromDate = new Date();
  defaultFromDate.setMonth(defaultFromDate.getMonth() - 1);

  const [fromDate, setFromDate] = useState<string | null>(defaultFromDate.toISOString().split('T')[0]);
  const [toDate, setToDate] = useState<string | null>(defaultToDate.toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [quickRange, setQuickRange] = useState<'30d' | '6m' | 'all'>('30d');

  const formatDisplayDate = (dStr: string | null) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dStr;
  };

  const handleQuickRange = (type: '30d' | '6m' | 'all') => {
    setQuickRange(type);
    const today = new Date();
    if (type === '30d') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setFromDate(d.toISOString().split('T')[0]);
      setToDate(today.toISOString().split('T')[0]);
    } else if (type === '6m') {
      const d = new Date();
      d.setMonth(d.getMonth() - 6);
      setFromDate(d.toISOString().split('T')[0]);
      setToDate(today.toISOString().split('T')[0]);
    } else if (type === 'all') {
      setFromDate(null);
      setToDate(null);
    }
  };

  const PAYMENT_OPTIONS = [
    { label: 'All Payments', value: 7 },
    { label: 'Paid', value: 1 },
    { label: 'Not Paid', value: 2 },
  ] as const;

  const [paymentFilter, setPaymentFilter] = useState<{
    label: string;
    value: number;
  }>(PAYMENT_OPTIONS[0]);
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [currentInvoiceData, setCurrentInvoiceData] = useState<any>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const [getCheckoutDetails] = useLazyGetCheckoutDetailsByOrderIdQuery();
  const [getInvoiceDetails] = useLazyGetInvoiceDetailsQuery();

  const statusQueryInfo = useGetStatusTypeQuery(undefined, { refetchOnMountOrArgChange: true });
  if (statusQueryInfo.isError) {
    console.log('--- OrdersScreen: API ERROR DETAILS ---', JSON.stringify(statusQueryInfo.error, null, 2));
  }
  const { data: statusTypesData } = statusQueryInfo;

  const STATUS_OPTIONS = React.useMemo(() => {
    const apiData = statusTypesData || [];
    const options = [
      { label: isBn ? 'সব স্ট্যাটাস' : 'All Status', value: 0 },
      ...apiData.map((s: any) => ({
        label: s.status_type_name,
        value: s.status_type_id,
      })),
    ];
    return options;
  }, [statusTypesData, isBn]);

  const [statusFilter, setStatusFilter] = useState(STATUS_OPTIONS[0]);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  React.useEffect(() => {
    setStatusFilter(prev => {
      const found = STATUS_OPTIONS.find(o => o.value === prev.value);
      if (found && found.label === prev.label) return prev;
      return found || STATUS_OPTIONS[0];
    });
  }, [STATUS_OPTIONS]);

  const [cancelDetails, setCancelDetails] = useState<{
    orderId: string;
    bookingId: string;
    packageId: string;
    title: string;
  } | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);
  const [activeDatePicker, setActiveDatePicker] = useState<
    'from' | 'to' | null
  >(null);
  const [pageNo, setPageNo] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const PAGE_SIZE = 10;

  const { data: totalSummaryCountData, refetch: refetchCount } =
    useGetOrderSummaryCountQuery(
      {
        userId: user?.user_id || 0,
        status: statusFilter.value,
        paymentStatus: paymentFilter.value,
        fromDate: fromDate,
        toDate: toDate,
      },
      { skip: !user?.user_id },
    );

  const totalCount =
    typeof totalSummaryCountData === 'object' && totalSummaryCountData !== null
      ? (totalSummaryCountData as any).total_puja_booking_summary_qty || 0
      : Number(totalSummaryCountData) || 0;

  const {
    data: orders = [],
    isLoading,
    refetch: refetchBookings,
  } = useGetOrderSummaryQuery(
    {
      userId: user?.user_id || 0,
      status: statusFilter.value,
      paymentStatus: paymentFilter.value,
      pageNo,
      pageSize: PAGE_SIZE,
      fromDate: fromDate,
      toDate: toDate,
    },
    { skip: !user?.user_id },
  );

  const onRefresh = React.useCallback(async () => {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      showToast({
        message: t('common.connectionRequired'),
        type: 'error',
      });
      return;
    }
    setRefreshing(true);
    try {
      await Promise.all([refetchBookings(), refetchCount()]);
    } catch (err) {
      console.error('Orders refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  }, [refetchBookings, refetchCount, showToast, t]);

  React.useEffect(() => {
    setPageNo(1);
  }, [paymentFilter, statusFilter, fromDate, toDate]);

  const filteredOrders = React.useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase().trim();
    return orders.filter((o: any) => {
      if (o.order_reference?.toLowerCase().includes(q)) return true;
      if (o.order_id?.toString().includes(q)) return true;
      if (o.booking_details?.some((b: any) =>
        b.booking_no?.toLowerCase().includes(q) ||
        b.package_details?.some((p: any) => p.package_name?.toLowerCase().includes(q))
      )) return true;
      return false;
    });
  }, [orders, searchQuery]);

  const showPagination = totalCount > PAGE_SIZE;
  const isNextDisabled = pageNo * PAGE_SIZE >= totalCount;
  const isPrevDisabled = pageNo === 1;

  const handleDateSelect = (d: Date) => {
    const f = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(d.getDate()).padStart(2, '0')}`;
    if (activeDatePicker === 'from') setFromDate(f);
    else if (activeDatePicker === 'to') setToDate(f);
    setActiveDatePicker(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />

      {/* ── Orange Top Navbar ── */}
      <TopNavBar />

      <InvoiceModal
        visible={invoiceModalVisible}
        onClose={() => setInvoiceModalVisible(false)}
        invoiceData={currentInvoiceData}
      />

      <FlatList
        data={filteredOrders}
        keyExtractor={(item: any) => item.order_id.toString()}
        ListHeaderComponent={
          <>
            {/* ── My Orders Hero Card ── */}
            <View style={styles.heroCard}>
              <View style={styles.heroLeft}>
                <View style={styles.heroIconWrap}>
                  <ClipboardList color={BRAND_PRIMARY} size={24} />
                </View>
                <View>
                  <Text style={styles.heroTitle}>{isBn ? 'আমার অর্ডার' : 'My Orders'}</Text>
                  <Text style={styles.heroSub}>{isBn ? 'আপনার পূজা অর্ডার পর্যালোচনা করুন' : 'Review and manage your puja orders'}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.bookBtn}
                onPress={() => navigation.navigate('HomeTab' as never)}
              >
                <Sparkles color="#fff" size={16} style={{ marginRight: 6 }} />
                <Text style={styles.bookBtnText}>{isBn ? 'পূজা বুক করুন' : 'Book a puja'}</Text>
              </TouchableOpacity>
            </View>

            {/* ── Order History Section Label ── */}
            <View style={styles.sectionLabelRow}>
              <Text style={styles.sectionLabel}>{isBn ? 'অর্ডার ইতিহাস' : 'Order history'}</Text>
              <Text style={styles.sectionLabelSub}>{isBn ? 'নির্বাচিত তারিখ পরিসরের অর্ডার' : 'Orders from the selected date range'}</Text>
            </View>

            {/* ── Filter Card ── */}
            <View style={styles.filterCard}>
              {/* Header row - clickable to toggle expand/collapse */}
              <TouchableOpacity
                style={styles.filterTitleRow}
                onPress={() => setIsFilterExpanded(prev => !prev)}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <SlidersHorizontal color={BRAND_TEXT} size={18} />
                  <Text style={styles.filterTitle}>
                    {isBn ? 'ফিল্টার ও অনুসন্ধান' : 'Filter & search'}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  {isFilterExpanded ? (
                    <ChevronUp color={BRAND_MUTED} size={18} />
                  ) : (
                    <ChevronDown color={BRAND_MUTED} size={18} />
                  )}
                  <TouchableOpacity
                    style={styles.resetBtn}
                    onPress={() => {
                      setFromDate(defaultFromDate.toISOString().split('T')[0]);
                      setToDate(defaultToDate.toISOString().split('T')[0]);
                      setStatusFilter(STATUS_OPTIONS[0]);
                      setPaymentFilter(PAYMENT_OPTIONS[0]);
                      setSearchQuery('');
                      setQuickRange('30d');
                    }}
                  >
                    <RotateCcw color={BRAND_MUTED} size={14} style={{ marginRight: 4 }} />
                    <Text style={styles.resetBtnText}>{isBn ? 'রিসেট' : 'Reset'}</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              {/* Collapsed Summary Chips */}
              {!isFilterExpanded && (
                <View style={styles.summaryChipsRow}>
                  <View style={styles.summaryStatusPill}>
                    <Text style={styles.summaryStatusText}>{statusFilter.label}</Text>
                  </View>
                  <View style={styles.summaryDatePill}>
                    <Text style={styles.summaryDateText}>
                      {quickRange === '30d'
                        ? (isBn ? 'শেষ ৩০ দিন' : 'Last 30 days')
                        : quickRange === '6m'
                        ? (isBn ? 'শেষ ৬ মাস' : 'Last 6 months')
                        : (isBn ? 'সমস্ত অর্ডার' : 'All orders')}
                    </Text>
                  </View>
                </View>
              )}

              {/* Expanded Filter Body */}
              {isFilterExpanded && (
                <View style={styles.filterCardBody}>
                  {/* STATUS */}
                  <View style={styles.fieldWrap}>
                    <Text style={styles.fieldLabel}>{isBn ? 'স্ট্যাটাস' : 'STATUS'}</Text>
                    <TouchableOpacity
                      style={styles.inputBox}
                      onPress={async () => {
                        const state = await NetInfo.fetch();
                        if (state.isConnected) setShowStatusDropdown(true);
                        else showToast({ message: t('common.connectionRequired'), type: 'error' });
                      }}
                    >
                      <Archive color="#D97706" size={16} style={{ marginRight: 8 }} />
                      <Text style={styles.inputText} numberOfLines={1}>{statusFilter.label}</Text>
                      <ChevronDown color="#D97706" size={16} />
                    </TouchableOpacity>
                  </View>

                  {/* FROM DATE */}
                  <View style={styles.fieldWrap}>
                    <Text style={styles.fieldLabel}>{isBn ? 'তারিখ থেকে' : 'FROM DATE'}</Text>
                    <TouchableOpacity
                      style={styles.inputBox}
                      onPress={async () => {
                        const state = await NetInfo.fetch();
                        if (state.isConnected) setActiveDatePicker('from');
                        else showToast({ message: t('common.connectionRequired'), type: 'error' });
                      }}
                    >
                      <Calendar color="#D97706" size={16} style={{ marginRight: 8 }} />
                      <Text style={[styles.inputText, !fromDate && styles.inputPlaceholder]}>
                        {fromDate ? formatDisplayDate(fromDate) : 'Select Date'}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                        <Calendar color={BRAND_MUTED} size={14} />
                        {fromDate && (
                          <TouchableOpacity onPress={() => setFromDate(null)}>
                            <X color={BRAND_MUTED} size={14} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* TO DATE */}
                  <View style={styles.fieldWrap}>
                    <Text style={styles.fieldLabel}>{isBn ? 'তারিখ পর্যন্ত' : 'TO DATE'}</Text>
                    <TouchableOpacity
                      style={styles.inputBox}
                      onPress={async () => {
                        const state = await NetInfo.fetch();
                        if (state.isConnected) setActiveDatePicker('to');
                        else showToast({ message: t('common.connectionRequired'), type: 'error' });
                      }}
                    >
                      <Calendar color="#D97706" size={16} style={{ marginRight: 8 }} />
                      <Text style={[styles.inputText, !toDate && styles.inputPlaceholder]}>
                        {toDate ? formatDisplayDate(toDate) : 'Select Date'}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                        <Calendar color={BRAND_MUTED} size={14} />
                        {toDate && (
                          <TouchableOpacity onPress={() => setToDate(null)}>
                            <X color={BRAND_MUTED} size={14} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* SEARCH ALL ORDERS */}
                  <View style={styles.fieldWrap}>
                    <Text style={styles.fieldLabel}>{isBn ? 'সমস্ত অর্ডার খুঁজুন' : 'SEARCH ALL ORDERS'}</Text>
                    <View style={styles.inputBox}>
                      <Search color="#D97706" size={16} style={{ marginRight: 8 }} />
                      <TextInput
                        style={styles.textInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder={isBn ? 'রেফারেন্স বা প্যাকেজ...' : 'Reference or package...'}
                        placeholderTextColor={BRAND_MUTED}
                      />
                      {searchQuery ? (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                          <X color={BRAND_MUTED} size={14} />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>

                  {/* Filters applied pill button */}
                  <View style={styles.filtersAppliedPill}>
                    <Package color="#059669" size={16} />
                    <Text style={styles.filtersAppliedText}>
                      {isBn ? 'ফিল্টার প্রয়োগ করা হয়েছে' : 'Filters applied'}
                    </Text>
                  </View>

                  {/* QUICK RANGE */}
                  <View style={styles.quickRangeContainer}>
                    <Text style={styles.quickRangeLabel}>{isBn ? 'দ্রুত সীমার' : 'QUICK RANGE'}</Text>
                    <View style={styles.quickRangeChipsRow}>
                      <TouchableOpacity
                        style={[styles.rangeChip, quickRange === '30d' && styles.rangeChipActive]}
                        onPress={() => handleQuickRange('30d')}
                      >
                        <Text style={[styles.rangeChipText, quickRange === '30d' && styles.rangeChipTextActive]}>
                          {isBn ? 'শেষ ৩০ দিন' : 'Last 30 days'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.rangeChip, quickRange === '6m' && styles.rangeChipActive]}
                        onPress={() => handleQuickRange('6m')}
                      >
                        <Text style={[styles.rangeChipText, quickRange === '6m' && styles.rangeChipTextActive]}>
                          {isBn ? 'শেষ ৬ মাস' : 'Last 6 months'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.rangeChip, quickRange === 'all' && styles.rangeChipActive]}
                        onPress={() => handleQuickRange('all')}
                      >
                        <Text style={[styles.rangeChipText, quickRange === 'all' && styles.rangeChipTextActive]}>
                          {isBn ? 'সমস্ত অর্ডার' : 'All orders'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* ── Order Results Banner ── */}
            <View style={styles.resultsBanner}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Package color={BRAND_PRIMARY} size={18} />
                <View>
                  <Text style={styles.resultsBannerTitle}>{isBn ? 'অর্ডার ফলাফল' : 'Order results'}</Text>
                  <Text style={styles.resultsBannerSub}>
                    {isBn ? `${filteredOrders.length}-এর মধ্যে ${totalCount} দেখাচ্ছে` : `Showing 1–${filteredOrders.length} of ${totalCount} orders`}
                  </Text>
                </View>
              </View>
              <Text style={styles.pageLabel}>{isBn ? `পৃষ্ঠা ${pageNo}` : `Page ${pageNo} of ${Math.ceil(totalCount / PAGE_SIZE) || 1}`}</Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <OrderCard
            item={item}
            isBn={isBn}
            onPressCard={(order) => {
              setSelectedOrderDetails(order);
            }}
            onPressCancel={(orderId) => {
              setCancelDetails({ orderId, bookingId: '0', packageId: '0', title: item.order_reference });
            }}
            onPressCancelBooking={(orderId, bookingId) => {
              setCancelDetails({ orderId, bookingId, packageId: '0', title: 'Cancel Booking' });
            }}
            onPressCancelPackage={(orderId, bookingId, packageId) => {
              setCancelDetails({ orderId, bookingId, packageId, title: 'Cancel Package' });
            }}
            onPressReschedule={(orderId, bookingId) => {
              console.log('Reschedule clicked for', bookingId);
            }}
            onPressPayNow={async (orderId) => {
              try {
                showToast({ message: isBn ? 'পেমেন্ট প্রসেস হচ্ছে...' : 'Processing payment...', type: 'success' });
                const res = await getCheckoutDetails({ orderId: parseInt(orderId), ctznId: user?.user_id || 0 }).unwrap();
                let paymentUrl = '';

                if (res.redirect_url) {
                  try {
                    paymentUrl = base64Decode(res.redirect_url);
                  } catch (err) {
                    console.error('Base64 decode failed:', err);
                  }
                }

                if (!paymentUrl) {
                  const findUrl = (obj: any): string => {
                    if (typeof obj === 'string' && obj.startsWith('http')) return obj;
                    if (typeof obj === 'object' && obj !== null) {
                      for (const key of Object.keys(obj)) {
                        const val = findUrl(obj[key]);
                        if (val) return val;
                      }
                    }
                    return '';
                  };
                  paymentUrl = findUrl(res);
                }

                if (paymentUrl) {
                  setPaymentUrl(paymentUrl);
                } else {
                  showToast({ message: 'Payment URL not available right now', type: 'error' });
                }
              } catch (e) {
                showToast({ message: isBn ? 'চেকআউট ডিটেইলস ফেচ করতে সমস্যা হয়েছে' : 'Failed to fetch checkout details', type: 'error' });
              }
            }}
            onPressInvoice={async (orderId) => {
              try {
                showToast({ message: isBn ? 'ইনভয়েস ফেচ হচ্ছে...' : 'Fetching invoice...', type: 'info' });
                const res = await getInvoiceDetails({ order_id: parseInt(orderId), booking_id: 0 }).unwrap();
                setCurrentInvoiceData(res || item);
                setInvoiceModalVisible(true);
              } catch (e) {
                console.log('Invoice API fetch error, fallback to order item:', e);
                setCurrentInvoiceData(item);
                setInvoiceModalVisible(true);
              }
            }}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={Platform.OS === 'android'}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[BRAND_PRIMARY]}
            tintColor={BRAND_PRIMARY}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <NoDataFound
              message={isBn ? 'কোনো অর্ডার পাওয়া যায়নি' : 'No orders found'}
              containerHeight={280}
            />
          ) : null
        }
        ListFooterComponent={
          showPagination ? (
            <View style={styles.paginationRow}>
              <TouchableOpacity
                style={[
                  styles.pageBtn,
                  isPrevDisabled && styles.pageBtnDisabled,
                ]}
                onPress={async () => {
                  if (isPrevDisabled) return;
                  const state = await NetInfo.fetch();
                  if (state.isConnected) {
                    setPageNo(p => p - 1);
                  } else {
                    showToast({
                      message: t('common.connectionRequired'),
                      type: 'error',
                    });
                  }
                }}
                disabled={isPrevDisabled}
              >
                <Text style={styles.pageBtnText}>
                  {isBn ? 'পূর্ববর্তী' : 'Previous'}
                </Text>
              </TouchableOpacity>

              <View style={styles.pageIndicator}>
                <Text style={styles.pageIndicatorText}>
                  {isBn ? 'পৃষ্ঠা' : 'Page'} {pageNo}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.pageBtn,
                  isNextDisabled && styles.pageBtnDisabled,
                ]}
                onPress={async () => {
                  if (isNextDisabled) return;
                  const state = await NetInfo.fetch();
                  if (state.isConnected) {
                    setPageNo(p => p + 1);
                  } else {
                    showToast({
                      message: t('common.connectionRequired'),
                      type: 'error',
                    });
                  }
                }}
                disabled={isNextDisabled}
              >
                <Text style={styles.pageBtnText}>
                  {isBn ? 'পরবর্তী' : 'Next'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.bottomSpace} />
          )
        }
      />

      {cancelDetails && (
        <CancelOrderModal
          visible={!!cancelDetails}
          orderId={cancelDetails.orderId}
          bookingId={cancelDetails.bookingId}
          packageId={cancelDetails.packageId}
          itemTitle={cancelDetails.title}
          onClose={() => setCancelDetails(null)}
          onSuccess={() => {
            setCancelDetails(null);
            onRefresh();
          }}
        />
      )}
      <OrderDetailsModal
        visible={!!selectedOrderDetails}
        order={selectedOrderDetails}
        onClose={() => setSelectedOrderDetails(null)}
      />
      {activeDatePicker && (
        <CustomDatePickerModal
          visible={!!activeDatePicker}
          mode="date"
          initialDate={
            activeDatePicker === 'from' && fromDate
              ? new Date(fromDate)
              : activeDatePicker === 'to' && toDate
                ? new Date(toDate)
                : undefined
          }
          minimumDate={
            activeDatePicker === 'to' && fromDate
              ? new Date(fromDate)
              : undefined
          }
          maximumDate={
            activeDatePicker === 'from' && toDate ? new Date(toDate) : undefined
          }
          onClose={() => setActiveDatePicker(null)}
          onSelect={handleDateSelect}
        />
      )}

      {showStatusDropdown && (
        <View style={[StyleSheet.absoluteFill, styles.popoverWrapper]}>
          <TouchableOpacity
            style={styles.popoverOverlay}
            activeOpacity={1}
            onPress={() => setShowStatusDropdown(false)}
          >
            <TouchableOpacity activeOpacity={1}>
              <View style={styles.popoverBox}>
                <View style={styles.popoverHeader}>
                  <Text style={styles.popoverTitle}>
                    {isBn ? 'অর্ডার স্ট্যাটাস' : 'Order Status'}
                  </Text>
                </View>
                <View style={styles.popoverDivider} />

                {STATUS_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={styles.popoverItem}
                    onPress={() => {
                      setStatusFilter(opt);
                      setShowStatusDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.popoverItemText,
                        statusFilter.value === opt.value &&
                        styles.popoverItemTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {statusFilter.value === opt.value && (
                      <Text style={styles.checkMark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      )}

      {showPaymentDropdown && (
        <View style={[StyleSheet.absoluteFill, styles.popoverWrapper]}>
          <TouchableOpacity
            style={styles.popoverOverlay}
            activeOpacity={1}
            onPress={() => setShowPaymentDropdown(false)}
          >
            <TouchableOpacity activeOpacity={1}>
              <View style={styles.popoverBox}>
                <View style={styles.popoverHeader}>
                  <Text style={styles.popoverTitle}>
                    {isBn ? 'পেমেন্ট স্ট্যাটাস' : 'Payment Status'}
                  </Text>
                </View>
                <View style={styles.popoverDivider} />

                {PAYMENT_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={styles.popoverItem}
                    onPress={() => {
                      setPaymentFilter(opt);
                      setShowPaymentDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.popoverItemText,
                        paymentFilter.value === opt.value &&
                        styles.popoverItemTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {paymentFilter.value === opt.value && (
                      <Text style={styles.checkMark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={!!paymentUrl}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setPaymentUrl(null)}
      >
        {paymentUrl && (
          <PluralWebView
            source={{ uri: paymentUrl }}
            onPaymentResult={(res) => {
              setPaymentUrl(null);
              if (res.status === 'response') {
                showToast({ message: isBn ? 'পেমেন্ট সফল হয়েছে!' : 'Payment successful!', type: 'success' });
                onRefresh();
              } else {
                const isCancelled = res.reason === 'User Cancelled';
                showToast({
                  message: isCancelled
                    ? (isBn ? 'পেমেন্ট বাতিল' : 'Payment Cancelled')
                    : (isBn ? 'পেমেন্ট ব্যর্থ' : 'Payment Failed'),
                  type: 'error'
                });
              }
            }}
            stopNavigationOnMatch={true}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F3F7' },

  // Hero Card - white card below the orange navbar
  heroCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  heroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  heroIcon: { fontSize: 22 },
  heroTitle: { fontSize: 22, fontWeight: '900', color: BRAND_TEXT },
  heroSub: { fontSize: 12, color: BRAND_MUTED, marginTop: 2 },
  bookBtn: {
    backgroundColor: BRAND_PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  bookBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // Section label
  sectionLabelRow: {
    paddingHorizontal: 0,
    paddingTop: 6,
    paddingBottom: 10,
  },
  sectionLabel: { fontSize: 18, fontWeight: '800', color: BRAND_TEXT },
  sectionLabelSub: { fontSize: 12, color: BRAND_MUTED, marginTop: 2 },

  // Filter card
  filterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  filterIcon: { fontSize: 18, color: BRAND_TEXT, fontWeight: '700' },
  filterTitle: { fontSize: 14, fontWeight: '700', color: BRAND_TEXT },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resetBtnText: { fontSize: 13, color: BRAND_MUTED, fontWeight: '600' },

  // Summary chips when collapsed
  summaryChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 8,
  },
  summaryStatusPill: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  summaryStatusText: {
    color: '#D46B08',
    fontSize: 12,
    fontWeight: '700',
  },
  summaryDatePill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryDateText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '700',
  },

  // Quick range chips row
  quickRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 8,
    flexWrap: 'wrap',
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  quickChipActive: {
    backgroundColor: BRAND_PRIMARY,
    borderColor: BRAND_PRIMARY,
  },
  quickChipText: { fontSize: 13, fontWeight: '600', color: BRAND_MUTED },
  quickChipTextActive: { color: '#fff' },

  filterCardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  fieldWrap: {
    marginTop: 12,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: BRAND_MUTED,
    letterSpacing: 0.6,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
  },
  inputText: {
    flex: 1,
    fontSize: 14,
    color: BRAND_TEXT,
    fontWeight: '600',
  },
  inputPlaceholder: {
    color: BRAND_MUTED,
    fontWeight: '400',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: BRAND_TEXT,
    fontWeight: '600',
    padding: 0,
  },
  filtersAppliedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  filtersAppliedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  quickRangeContainer: {
    marginTop: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  quickRangeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: BRAND_MUTED,
    letterSpacing: 0.6,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  quickRangeChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  rangeChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  rangeChipActive: {
    backgroundColor: '#D46B08',
    borderColor: '#D46B08',
  },
  rangeChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND_TEXT,
  },
  rangeChipTextActive: {
    color: '#fff',
  },

  // Results banner
  resultsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resultsIcon: { fontSize: 18 },
  resultsBannerTitle: { fontSize: 13, fontWeight: '700', color: BRAND_TEXT },
  resultsBannerSub: { fontSize: 11, color: BRAND_MUTED, marginTop: 1 },
  pageLabel: { fontSize: 12, fontWeight: '700', color: BRAND_MUTED },


  // Old header kept for compat
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F2F3F7',
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { fontSize: 18, color: BRAND_TEXT, fontWeight: 'bold' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: BRAND_TEXT },
  headerSub: { fontSize: 12, color: BRAND_MUTED, marginTop: 1 },
  headerRight: { width: 36 },


  // Tabs
  tabsBar: {
    backgroundColor: Colors.white,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tabsContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  tabBtnActive: {
    backgroundColor: BRAND_PRIMARY,
    borderColor: BRAND_PRIMARY,
    elevation: 4,
    shadowOpacity: 0.15,
  },
  tabText: { color: BRAND_MUTED, fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: Colors.white, fontWeight: '900', letterSpacing: 0.3 },

  filterCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
    color: BRAND_MUTED,
    opacity: 0.7,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: BRAND_TEXT,
    padding: 0,
    fontWeight: '500',
  },
  clearIconWrap: { padding: 4 },
  clearBtn: { fontSize: 14, color: BRAND_MUTED, fontWeight: 'bold' },

  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFD8A8',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 48,
    minWidth: 130,
    justifyContent: 'space-between',
    gap: 8,
  },
  filterDropdownText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D9480F',
    flexShrink: 1,
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#D9480F',
    opacity: 0.8,
  },

  dateFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
    paddingBottom: 12,
  },
  dateControlWrap: { flex: 1 },
  dateControlLabel: {
    fontSize: 11, color: BRAND_MUTED, fontWeight: '800',
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  dateBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 6,
    shadowRadius: 3,
    elevation: 1,
  },
  dateIcon: { fontSize: 14, opacity: 0.7 },
  dateValue: { fontSize: 13, color: BRAND_TEXT, fontWeight: '600' },
  datePlaceholder: { color: BRAND_MUTED, fontWeight: '400', opacity: 0.6 },

  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  resultsText: { fontSize: 12, color: BRAND_MUTED, fontWeight: '700' },
  clearAllBtn: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  clearFilters: { fontSize: 11, color: '#DC2626', fontWeight: '800' },

  // Popover Menu
  popoverOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popoverBox: {
    width: '85%',
    backgroundColor: Colors.white,
    borderRadius: 28,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 20,
    overflow: 'hidden',
  },
  popoverHeader: { paddingHorizontal: 24, paddingBottom: 16 },
  popoverTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: BRAND_TEXT,
    textAlign: 'center',
  },
  popoverDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 4,
  },
  popoverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  popoverItemText: {
    fontSize: 16,
    color: BRAND_TEXT,
    fontWeight: '600',
  },

  // List
  listContent: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  cardTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  pujaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  pujaIconText: { fontSize: 20 },
  cardTopInfo: { flex: 1 },
  cardRef: { fontSize: 15, fontWeight: '800', color: BRAND_TEXT },
  cardDate: { fontSize: 12, color: BRAND_MUTED, marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F2F3F7', marginHorizontal: 14 },
  statsRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FAFAFA',
  },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statLabel: { fontSize: 11, color: BRAND_MUTED, fontWeight: '600' },
  statValue: { fontSize: 14, fontWeight: '800' },
  statDiv: { width: 1, backgroundColor: '#EBEBEB' },
  cardFooter: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F2F3F7',
  },
  btnDetails: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3EC',
    borderWidth: 1,
    borderColor: '#FFD4B0',
  },
  btnDetailsText: { color: BRAND_PRIMARY, fontSize: 13, fontWeight: '700' },
  btnCancel: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  btnCancelText: { color: '#DC2626', fontSize: 13, fontWeight: '700' },

  // Pagination
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 16,
  },
  pageBtn: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  pageBtnDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#F3F4F6',
    opacity: 0.5,
  },
  pageBtnText: {
    color: BRAND_PRIMARY,
    fontSize: 14,
    fontWeight: '700',
  },
  pageIndicator: {
    paddingHorizontal: 12,
  },
  pageIndicatorText: {
    fontSize: 14,
    fontWeight: '800',
    color: BRAND_TEXT,
  },
  popoverItemTextActive: { color: BRAND_PRIMARY, fontWeight: '800' },
  checkMark: { color: BRAND_PRIMARY, fontWeight: 'bold' },
  bottomSpace: { height: 20 },
  popoverWrapper: { zIndex: 99999, elevation: 99999 },
});
