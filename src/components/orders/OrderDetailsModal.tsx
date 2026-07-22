import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import {
  Calendar,
  Clock,
  MapPin,
  X,
  Package,
  ClipboardList,
  AlertTriangle,
} from 'lucide-react-native';
import { OrderSummary, OrderBookingDetail, OrderPackageDetail } from '../../service/api/dashboardService';
import { Colors } from '../../constants/Colors';
import { formatTo12Hr } from '../../utils/timeUtils';

const { height } = Dimensions.get('window');

const BRAND_PRIMARY = Colors.primary;
const BRAND_TEXT = Colors.textMain;
const BRAND_MUTED = Colors.textMuted;

interface Props {
  visible: boolean;
  order: OrderSummary | null;
  onClose: () => void;
}

export default function OrderDetailsModal({ visible, order, onClose }: Props) {
  if (!order) return null;

  const isOrderCancelled = order.order_status?.toLowerCase().includes('cancel');

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return dateString;
    }
  };

  // Count total packages across all bookings
  const totalPackages = order.booking_details?.reduce(
    (acc, booking) => acc + (booking.package_details?.length || 0),
    0
  ) || 0;

  const renderPackageRow = (
    booking: OrderBookingDetail,
    pkg: OrderPackageDetail,
    index: number
  ) => {
    const isCancelled = isOrderCancelled || 
      booking.booking_status?.toLowerCase().includes('cancel') || 
      pkg.package_status?.toLowerCase().includes('cancel');

    return (
      <View style={styles.tableRow} key={`${booking.booking_id}-${pkg.package_id}-${index}`}>
        {/* PACKAGE */}
        <View style={[styles.col, { width: 180, flexDirection: 'row', alignItems: 'flex-start' }]}>
          <Package color="#D46B08" size={16} style={{ marginRight: 6, marginTop: 2 }} />
          <Text style={styles.tableValueBold} numberOfLines={2}>
            {pkg.package_name}
          </Text>
        </View>

        {/* SCHEDULE */}
        <View style={[styles.col, { width: 120 }]}>
          <View style={styles.scheduleRow}>
            <Calendar color={BRAND_MUTED} size={14} style={{ marginRight: 4 }} />
            <Text style={styles.tableValue}>{pkg.preferred_date ? formatDate(pkg.preferred_date) : '-'}</Text>
          </View>
          <View style={[styles.scheduleRow, { marginTop: 4 }]}>
            <Clock color={BRAND_MUTED} size={14} style={{ marginRight: 4 }} />
            <Text style={styles.tableValue}>{pkg.preferred_time ? formatTo12Hr(pkg.preferred_time) : '-'}</Text>
          </View>
        </View>

        {/* ADDRESS */}
        <View style={[styles.col, { width: 140, flexDirection: 'row' }]}>
          <MapPin color={BRAND_MUTED} size={14} style={{ marginRight: 4, marginTop: 2 }} />
          <Text style={styles.tableValue} numberOfLines={2}>
            {pkg.citizen_address || 'Not provided'}
          </Text>
        </View>

        {/* AMOUNT */}
        <View style={[styles.col, { width: 100 }]}>
          <Text style={styles.tableValueBold}>₹{pkg.package_amount.toLocaleString('en-IN')}</Text>
        </View>

        {/* STATUS */}
        <View style={[styles.col, { width: 120 }]}>
          {isCancelled ? (
            <View style={styles.pillRed}>
              <Text style={styles.pillRedText}>Package Cancel</Text>
            </View>
          ) : (
            <View style={styles.pillYellow}>
              <Text style={styles.pillYellowText}>{order.order_status}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderBookingCard = (booking: OrderBookingDetail) => {
    const isCancelled = isOrderCancelled || booking.booking_status?.toLowerCase().includes('cancel');

    return (
      <View style={styles.bookingCard} key={booking.booking_id}>
        {/* Booking Header */}
        <View style={styles.bookingHeader}>
          <View style={styles.bookingHeaderLeft}>
            <View style={styles.iconBoxLight}>
              <ClipboardList color="#D46B08" size={16} />
            </View>
            <View>
              <Text style={styles.bookingLabel}>BOOKING NUMBER</Text>
              <Text style={styles.bookingValue}>{booking.booking_no}</Text>
            </View>
          </View>

          {isCancelled && (
            <View style={styles.pillRed}>
              <Text style={styles.pillRedText}>Puja Booking Cancel</Text>
            </View>
          )}
        </View>

        {/* Booking Table (Horizontal Scroll) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableContainer}>
          <View>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.thText, { width: 180 }]}>PACKAGE</Text>
              <Text style={[styles.thText, { width: 120 }]}>SCHEDULE</Text>
              <Text style={[styles.thText, { width: 140 }]}>ADDRESS</Text>
              <Text style={[styles.thText, { width: 100 }]}>AMOUNT</Text>
              <Text style={[styles.thText, { width: 120 }]}>STATUS</Text>
            </View>

            {/* Table Rows */}
            {booking.package_details?.map((pkg, idx) => renderPackageRow(booking, pkg, idx))}
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.headerBox}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerLabelText}>ORDER DETAILS</Text>
              <Text style={styles.headerTitleText}>{order.order_reference}</Text>
            </View>
            <View style={styles.headerRight}>
              {isOrderCancelled && (
                <View style={styles.pillWhiteRed}>
                  <Text style={styles.pillWhiteRedText}>Order Cancel</Text>
                </View>
              )}
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <X color="#FFF" size={18} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Modal Body */}
          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
            {/* Key Stats Cards */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>TOTAL AMOUNT</Text>
                <Text style={styles.statValue}>₹{order.order_total_amount.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>BOOKINGS</Text>
                <Text style={styles.statValue}>{order.booking_details?.length || 0}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>PACKAGES</Text>
                <Text style={styles.statValue}>{totalPackages}</Text>
              </View>
            </View>

            {/* Cancellation Reason Box */}
            {isOrderCancelled && order.order_cancel_reason && (
              <View style={styles.cancelReasonBox}>
                <AlertTriangle color="#EF4444" size={20} style={styles.warningIcon} />
                <View style={styles.cancelReasonTextWrap}>
                  <Text style={styles.cancelReasonLabel}>ORDER CANCELLATION REASON</Text>
                  <Text style={styles.cancelReasonText}>{order.order_cancel_reason}</Text>
                </View>
              </View>
            )}

            {/* Booking Overview Section */}
            <View style={styles.overviewSection}>
              <Text style={styles.overviewLabel}>BOOKING OVERVIEW</Text>
              <View style={styles.overviewHeaderRow}>
                <Text style={styles.overviewTitle}>Booking details</Text>
                <Text style={styles.overviewCount}>
                  {order.booking_details?.length || 0} {order.booking_details?.length === 1 ? 'booking' : 'bookings'}
                </Text>
              </View>

              {/* Bookings List */}
              {order.booking_details?.map(renderBookingCard)}
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.footerBox}>
            <Text style={styles.footerRefText}>Order reference: {order.order_reference}</Text>
            <TouchableOpacity style={styles.footerCloseBtn} onPress={onClose}>
              <Text style={styles.footerCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FAF9F6',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: height * 0.85,
    overflow: 'hidden',
  },
  headerBox: {
    backgroundColor: '#D46B08',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {},
  headerLabelText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerTitleText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pillWhiteRed: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  pillWhiteRedText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: 'bold',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statLabel: {
    color: '#8A8A8A',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statValue: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  cancelReasonBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: 12,
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  warningIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  cancelReasonTextWrap: {
    flex: 1,
  },
  cancelReasonLabel: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cancelReasonText: {
    color: '#333',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  overviewSection: {},
  overviewLabel: {
    color: '#8A8A8A',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  overviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  overviewCount: {
    fontSize: 12,
    color: '#8A8A8A',
    fontWeight: '500',
  },
  bookingCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    overflow: 'hidden',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FCFAF7',
  },
  bookingHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBoxLight: {
    width: 32,
    height: 32,
    backgroundColor: '#FFF3E0',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  bookingLabel: {
    fontSize: 10,
    color: '#8A8A8A',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bookingValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
    marginTop: 2,
  },
  tableContainer: {
    paddingBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FDFBF7',
  },
  thText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A8A8A',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  col: {
    justifyContent: 'center',
  },
  tableValueBold: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  tableValue: {
    fontSize: 12,
    color: '#555',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillRed: {
    backgroundColor: '#FEF2F2',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillRedText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '700',
  },
  pillYellow: {
    backgroundColor: '#FFF8E1',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillYellowText: {
    color: '#D46B08',
    fontSize: 10,
    fontWeight: '700',
  },
  footerBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FCFAF7',
  },
  footerRefText: {
    fontSize: 12,
    color: '#8A8A8A',
    fontWeight: '500',
  },
  footerCloseBtn: {
    backgroundColor: '#D46B08',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  footerCloseBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
