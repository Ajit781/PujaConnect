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
  FileText,
  AlertTriangle,
} from 'lucide-react-native';
import {
  OrderSummary,
  OrderBookingDetail,
  OrderPackageDetail,
} from '../../service/api/dashboardService';
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

  const isOrderCancelled = order.order_status
    ?.toLowerCase()
    .includes('cancel');

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return dateString;
    }
  };

  const totalPackages =
    order.booking_details?.reduce(
      (acc, booking) => acc + (booking.package_details?.length || 0),
      0,
    ) || 0;

  const renderBookingCard = (booking: OrderBookingDetail) => {
    const isCancelled =
      isOrderCancelled ||
      booking.booking_status?.toLowerCase().includes('cancel');

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
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>
              {isCancelled ? 'Booking Cancelled' : booking.booking_status || order.order_status}
            </Text>
          </View>
        </View>

        {/* Package Items */}
        {booking.package_details?.map((pkg, idx) => (
          <View
            style={styles.packageBlock}
            key={`${booking.booking_id}-${pkg.package_id}-${idx}`}
          >
            {/* Package Row */}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>PACKAGE</Text>
              <View style={styles.fieldValueWrap}>
                <Package color="#D46B08" size={16} style={{ marginRight: 6 }} />
                <Text style={styles.packageNameText} numberOfLines={2}>
                  {pkg.package_name}
                </Text>
              </View>
            </View>

            {/* Schedule Row */}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>SCHEDULE</Text>
              <View style={styles.scheduleWrap}>
                <View style={styles.scheduleSubRow}>
                  <Calendar color={BRAND_MUTED} size={14} style={{ marginRight: 6 }} />
                  <Text style={styles.scheduleText}>
                    {pkg.preferred_date ? formatDate(pkg.preferred_date) : '-'}
                  </Text>
                </View>
                <View style={[styles.scheduleSubRow, { marginTop: 4 }]}>
                  <Clock color={BRAND_MUTED} size={14} style={{ marginRight: 6 }} />
                  <Text style={styles.scheduleText}>
                    {pkg.preferred_time ? formatTo12Hr(pkg.preferred_time) : '-'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Address Row */}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>ADDRESS</Text>
              <View style={styles.fieldValueWrap}>
                <MapPin color={BRAND_MUTED} size={14} style={{ marginRight: 6 }} />
                <Text style={styles.addressText} numberOfLines={2}>
                  {pkg.citizen_address || 'Not provided'}
                </Text>
              </View>
            </View>
          </View>
        ))}
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
          {/* Modal Header Banner */}
          <View style={styles.headerBox}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconWrap}>
                <FileText color="#FFF" size={22} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerLabelText}>ORDER DETAILS</Text>
                <Text style={styles.headerTitleText} numberOfLines={1}>
                  {order.order_reference}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X color="#FFF" size={20} />
            </TouchableOpacity>
          </View>

          {/* Modal Body */}
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Top Combined Card: Total Amount + Bookings + Packages */}
            <View style={styles.combinedCard}>
              <View style={styles.amountSection}>
                <Text style={styles.combinedLabel}>TOTAL AMOUNT</Text>
                <Text style={styles.amountValue}>
                  ₹{order.order_total_amount.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.combinedDivider} />
              <View style={styles.countsSection}>
                <View style={styles.countCol}>
                  <Text style={styles.combinedLabel}>BOOKINGS</Text>
                  <Text style={styles.countValue}>
                    {order.booking_details?.length || 0}
                  </Text>
                </View>
                <View style={styles.countVerticalDivider} />
                <View style={styles.countCol}>
                  <Text style={styles.combinedLabel}>PACKAGES</Text>
                  <Text style={styles.countValue}>{totalPackages}</Text>
                </View>
              </View>
            </View>

            {/* Cancellation Reason Box */}
            {isOrderCancelled && order.order_cancel_reason && (
              <View style={styles.cancelReasonBox}>
                <AlertTriangle
                  color="#EF4444"
                  size={20}
                  style={styles.warningIcon}
                />
                <View style={styles.cancelReasonTextWrap}>
                  <Text style={styles.cancelReasonLabel}>
                    ORDER CANCELLATION REASON
                  </Text>
                  <Text style={styles.cancelReasonText}>
                    {order.order_cancel_reason}
                  </Text>
                </View>
              </View>
            )}

            {/* Booking Overview Section */}
            <View style={styles.overviewSection}>
              <Text style={styles.overviewLabel}>BOOKING OVERVIEW</Text>
              <View style={styles.overviewHeaderRow}>
                <Text style={styles.overviewTitle}>Booking details</Text>
                <Text style={styles.overviewCount}>
                  {order.booking_details?.length || 0}{' '}
                  {order.booking_details?.length === 1 ? 'booking' : 'bookings'}
                </Text>
              </View>

              {/* Bookings List */}
              {order.booking_details?.map(renderBookingCard)}
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.footerBox}>
            <Text style={styles.footerRefText}>
              Order reference: {order.order_reference}
            </Text>
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
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.9,
    overflow: 'hidden',
  },
  headerBox: {
    backgroundColor: '#D46B08',
    paddingHorizontal: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
    marginRight: 12,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerLabelText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  headerTitleText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  scrollBody: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  combinedCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
    overflow: 'hidden',
  },
  amountSection: {
    padding: 16,
  },
  combinedLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: BRAND_MUTED,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: '900',
    color: BRAND_TEXT,
  },
  combinedDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  countsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  countCol: {
    flex: 1,
    paddingHorizontal: 16,
  },
  countValue: {
    fontSize: 18,
    fontWeight: '800',
    color: BRAND_TEXT,
    marginTop: 2,
  },
  countVerticalDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#F3F4F6',
  },
  cancelReasonBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 14,
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
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cancelReasonText: {
    color: BRAND_TEXT,
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  overviewSection: {},
  overviewLabel: {
    color: BRAND_MUTED,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  overviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BRAND_TEXT,
  },
  overviewCount: {
    fontSize: 13,
    color: BRAND_MUTED,
    fontWeight: '600',
  },
  bookingCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
    overflow: 'hidden',
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FDFBF7',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  bookingHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  iconBoxLight: {
    width: 32,
    height: 32,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  bookingLabel: {
    fontSize: 10,
    color: BRAND_MUTED,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bookingValue: {
    fontSize: 13,
    color: BRAND_TEXT,
    fontWeight: 'bold',
    marginTop: 1,
  },
  statusPill: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusPillText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '700',
  },
  packageBlock: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  fieldRow: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: BRAND_MUTED,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  fieldValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  packageNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND_TEXT,
    flex: 1,
  },
  scheduleWrap: {},
  scheduleSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleText: {
    fontSize: 13,
    color: BRAND_TEXT,
    fontWeight: '500',
  },
  addressText: {
    fontSize: 13,
    color: BRAND_TEXT,
    fontWeight: '500',
    flex: 1,
  },
  footerBox: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    alignItems: 'center',
    gap: 12,
  },
  footerRefText: {
    fontSize: 12,
    color: BRAND_MUTED,
    fontWeight: '500',
  },
  footerCloseBtn: {
    backgroundColor: '#D46B08',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerCloseBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
