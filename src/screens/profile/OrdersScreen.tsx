import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Order } from '../../store/slices/orderSlice';
import OrderDetailsModal from '../../components/orders/OrderDetailsModal';
import CancelOrderModal from '../../components/orders/CancelOrderModal';
import CustomDatePickerModal from '../../components/common/CustomDatePickerModal';
import NoDataFound from '../../components/common/NoDataFound';

const BRAND_PRIMARY = '#F97316';
const BRAND_BG = '#FDF8F0';
const BRAND_TEXT = '#291811';
const BRAND_MUTED = '#6B5E59';

export default function OrdersScreen({ navigation }: any) {
  const { i18n } = useTranslation();
  const isBn = i18n.language === 'bn';

  const orders = useSelector((state: RootState) => state.order.orders);

  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const selectedOrder = orders.find(o => o.id === selectedOrderId) || null;

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [activeDatePicker, setActiveDatePicker] = useState<
    'from' | 'to' | null
  >(null);

  const TABS = [
    'All',
    'Upcoming',
    'Completed',
    'Pending',
    'Partial Cancelled',
    'Cancelled',
    'Rescheduled',
  ];

  // Filter logic
  const filteredOrders = orders.filter(o => {
    if (activeTab !== 'All' && o.status !== activeTab) return false;
    if (
      searchQuery &&
      !o.bookingRef.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;

    if (fromDate.length === 10 || toDate.length === 10) {
      const orderD = new Date(o.datePlaced).getTime();

      if (fromDate.length === 10) {
        const [fm, fd, fy] = fromDate.split('/');
        const fromD = new Date(
          parseInt(fy, 10),
          parseInt(fm, 10) - 1,
          parseInt(fd, 10),
        ).getTime();
        if (orderD < fromD) return false;
      }

      if (toDate.length === 10) {
        const [tm, td, ty] = toDate.split('/');
        // End of the target day
        const toD = new Date(
          parseInt(ty, 10),
          parseInt(tm, 10) - 1,
          parseInt(td, 10),
          23,
          59,
          59,
        ).getTime();
        if (orderD > toD) return false;
      }
    }

    return true;
  });

  const handleDateSelect = (d: Date) => {
    const formatted = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(
      d.getDate(),
    ).padStart(2, '0')}/${d.getFullYear()}`;
    if (activeDatePicker === 'from') {
      setFromDate(formatted);
    } else if (activeDatePicker === 'to') {
      setToDate(formatted);
    }
    setActiveDatePicker(null);
  };

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
    return `${d.getDate().toString().padStart(2, '0')} ${
      months[d.getMonth()]
    } ${d.getFullYear()}`;
  };

  const renderStatusBadge = (status: string) => {
    let bgColor = '#F3F4F6';
    let textColor = '#4B5563';
    if (status === 'Booking Initiated' || status === 'Pending') {
      bgColor = '#E0F2FE';
      textColor = '#0369A1';
    } else if (status === 'Completed') {
      bgColor = '#DCFCE7';
      textColor = '#15803D';
    } else if (status === 'Cancelled' || status === 'Partial Cancelled') {
      bgColor = '#FEE2E2';
      textColor = '#B91C1C';
    } else if (status === 'Upcoming' || status === 'Rescheduled') {
      bgColor = '#FEF3C7';
      textColor = '#B45309';
    }

    return (
      <View style={[styles.badge, { backgroundColor: bgColor }]}>
        <Text style={[styles.badgeText, { color: textColor }]}>{status}</Text>
      </View>
    );
  };

  const renderOrderCard = ({ item }: { item: Order }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardLabel}>
              {isBn ? 'বুকিং রেফারেন্স' : 'BOOKING REFERENCE'}
            </Text>
            <Text style={styles.cardRef}>{item.bookingRef}</Text>
            <Text style={styles.cardDate}>
              📅 {formatDate(item.datePlaced)}
            </Text>
          </View>
          {renderStatusBadge(item.status)}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.col}>
            <Text style={styles.colLabel}>{isBn ? 'স্ট্যাটাস' : 'Status'}</Text>
            {renderStatusBadge(item.status)}
          </View>
          <View style={styles.col}>
            <Text style={styles.colLabel}>{isBn ? 'পেমেন্ট' : 'Payment'}</Text>
            <Text
              style={[
                styles.paymentText,
                item.paymentStatus === 'PAID'
                  ? styles.paymentGreen
                  : styles.paymentOrange,
              ]}
            >
              {item.paymentStatus}
            </Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.colLabel}>
              {isBn ? 'মোট পরিমাণ' : 'Total Amount'}
            </Text>
            <Text style={styles.amountText}>
              ₹{item.totalAmount.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.actionBtnOutline}
            onPress={() => {
              setSelectedOrderId(item.id);
              setShowDetailsModal(true);
            }}
          >
            <Text style={styles.actionBtnOutlineText}>
              🎯 {isBn ? 'বিস্তারিত দেখুন' : 'See Details'}
            </Text>
          </TouchableOpacity>

          {(item.status === 'Upcoming' ||
            item.status === 'Booking Initiated' ||
            item.status === 'Pending') && (
            <TouchableOpacity
              style={styles.actionBtnDanger}
              onPress={() => {
                setSelectedOrderId(item.id);
                setShowCancelModal(true);
              }}
            >
              <Text style={styles.actionBtnDangerText}>
                ✖ {isBn ? 'বাতিল করুন' : 'Cancel'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={BRAND_BG} barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.backBtnText}>
              ← {isBn ? 'ড্যাশবোর্ডে ফিরে যান' : 'Back to Dashboard'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isBn ? 'আপনার অর্ডার' : 'Your Orders'}
          </Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
          >
            {TABS.map(tab => (
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
                    styles.tabText,
                    activeTab === tab && styles.tabTextActive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Filters */}
        <View style={styles.filtersWrapper}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>
              {isBn ? 'পেমেন্ট' : 'Payment'}
            </Text>
            <View style={styles.filterInputBox}>
              <Text style={styles.filterInputText}>💳 All Payments</Text>
            </View>
          </View>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>
              {isBn ? 'তারিখ থেকে' : 'From date'}
            </Text>
            <TouchableOpacity
              style={styles.filterInputBox}
              onPress={() => setActiveDatePicker('from')}
            >
              <Text
                style={[
                  styles.filterInputText,
                  !fromDate && styles.placeholderText,
                ]}
              >
                {fromDate || 'MM/DD/YYYY'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>
              {isBn ? 'তারিখ পর্যন্ত' : 'To date'}
            </Text>
            <TouchableOpacity
              style={styles.filterInputBox}
              onPress={() => setActiveDatePicker('to')}
            >
              <Text
                style={[
                  styles.filterInputText,
                  !toDate && styles.placeholderText,
                ]}
              >
                {toDate || 'MM/DD/YYYY'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>
              {isBn ? 'অনুসন্ধান' : 'Search'}
            </Text>
            <View style={styles.filterInputBox}>
              <TextInput
                style={styles.searchInput}
                placeholder="Booking no, status..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            Showing 1-{filteredOrders.length} of {filteredOrders.length}{' '}
            bookings
          </Text>
          <Text style={styles.statsText}>Page 1 of 1</Text>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listHeaderTitle}>
            {isBn ? 'আগের অর্ডার' : 'Previous Orders'}
          </Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{filteredOrders.length}</Text>
          </View>
        </View>

        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.id}
          renderItem={renderOrderCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <NoDataFound
              message={isBn ? 'কোনো অর্ডার পাওয়া যায়নি' : 'No orders found'}
              containerHeight={300}
            />
          }
        />
      </SafeAreaView>

      {showDetailsModal && selectedOrder && (
        <OrderDetailsModal
          visible={showDetailsModal}
          order={selectedOrder}
          onClose={() => setShowDetailsModal(false)}
        />
      )}

      {showCancelModal && selectedOrder && (
        <CancelOrderModal
          visible={showCancelModal}
          orderId={selectedOrder.id}
          itemTitle={selectedOrder.items[0]?.titleEn || 'Booking'}
          onClose={() => setShowCancelModal(false)}
        />
      )}

      {activeDatePicker && (
        <CustomDatePickerModal
          visible={!!activeDatePicker}
          mode="date"
          onClose={() => setActiveDatePicker(null)}
          onSelect={handleDateSelect}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND_BG },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  backBtnText: { color: BRAND_TEXT, fontSize: 14, fontWeight: 'bold' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: BRAND_TEXT },

  tabsWrapper: {
    backgroundColor: '#fff',
    paddingVertical: 12,
  },
  tabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  tabBtnActive: {
    backgroundColor: BRAND_PRIMARY,
    borderColor: BRAND_PRIMARY,
  },
  tabText: { color: BRAND_MUTED, fontSize: 14, fontWeight: '500' },
  tabTextActive: { color: '#fff', fontWeight: 'bold' },

  filtersWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 0,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterGroup: { flex: 1, minWidth: '45%' },
  filterLabel: { fontSize: 12, color: '#9CA3AF', marginBottom: 4 },
  filterInputBox: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  filterInputText: { fontSize: 14, color: BRAND_TEXT },
  searchInput: { padding: 0, fontSize: 14, color: BRAND_TEXT },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  statsText: { fontSize: 12, color: '#9CA3AF' },

  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  listHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: BRAND_TEXT },
  countBadge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: { fontSize: 12, color: BRAND_TEXT, fontWeight: 'bold' },

  listContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  cardRef: {
    fontSize: 16,
    fontWeight: 'bold',
    color: BRAND_TEXT,
    marginVertical: 4,
  },
  cardDate: { fontSize: 13, color: BRAND_MUTED },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { fontSize: 12, fontWeight: 'bold' },

  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FAFAF9',
  },
  col: { gap: 4 },
  colLabel: { fontSize: 11, color: '#9CA3AF' },
  paymentText: { fontSize: 14, fontWeight: 'bold' },
  amountText: { fontSize: 16, fontWeight: 'bold', color: BRAND_TEXT },
  paymentGreen: { color: '#16A34A' },
  paymentOrange: { color: '#F97316' },

  cardFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FED7AA',
    backgroundColor: '#FFF7ED',
  },
  actionBtnOutlineText: {
    color: BRAND_PRIMARY,
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionBtnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  actionBtnDangerText: { color: '#DC2626', fontSize: 14, fontWeight: 'bold' },

  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { color: BRAND_MUTED, fontSize: 16 },
});
