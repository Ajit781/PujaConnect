import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Calendar, Clock, IndianRupee, MapPin, X, RefreshCw, FileText, CreditCard, Package, File as FileIcon, ClipboardList } from 'lucide-react-native';
import {
  OrderSummary,
  OrderBookingDetail,
  OrderPackageDetail,
} from '../../service/api/dashboardService';
import { Colors } from '../../constants/Colors';
import { formatTo12Hr } from '../../utils/timeUtils';

const BRAND_PRIMARY = Colors.primary;
const BRAND_TEXT = Colors.textMain;
const BRAND_MUTED = Colors.textMuted;

interface Props {
  item: OrderSummary;
  isBn: boolean;
  onPressCancel: (orderId: string) => void;
  onPressCancelBooking: (orderId: string, bookingId: string) => void;
  onPressCancelPackage: (orderId: string, bookingId: string, packageId: string) => void;
  onPressReschedule: (orderId: string, bookingId: string) => void;
  onPressPayNow?: (orderId: string) => void;
  onPressInvoice?: (orderId: string) => void;
  onPressCard?: (item: OrderSummary) => void;
}

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateString;
  }
};

const OrderCard = React.memo(
  ({
    item,
    isBn,
    onPressCancel,
    onPressCancelBooking,
    onPressCancelPackage,
    onPressReschedule,
    onPressPayNow,
    onPressInvoice,
    onPressCard
  }: Props) => {
    const canCancel = ['Order Initiated', 'Order Pending', 'Pending'].includes(
      item.order_status,
    );

    const canPay = ['Order Initiated', 'Order payment Fail'].includes(item.order_status);

    const isOrderCancelled = item.order_status?.toLowerCase().includes('cancel');

    const renderPackageRow = (
      booking: OrderBookingDetail,
      pkg: OrderPackageDetail,
      index: number,
    ) => {
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
              {pkg.citizen_address || '-'}
            </Text>
          </View>

          {/* AMOUNT */}
          <View style={[styles.col, { width: 100 }]}>
            <Text style={styles.tableValueBold}>₹{pkg.package_amount.toLocaleString('en-IN')}</Text>
          </View>

          {/* STATUS */}
          <View style={[styles.col, { width: 160 }]}>
            {(isOrderCancelled || booking.booking_status?.toLowerCase().includes('cancel') || pkg.package_status?.toLowerCase().includes('cancel')) ? (
              <View style={styles.pillRed}>
                <Text style={styles.pillRedText}>Package Cancelled</Text>
              </View>
            ) : (
              <View style={styles.pillYellow}>
                <Text style={styles.pillYellowText}>{item.order_status}</Text>
              </View>
            )}
          </View>

          {/* ACTION */}
          <View style={[styles.col, { width: 140 }]}>
            <TouchableOpacity
              style={[styles.cancelActionBtn, (isOrderCancelled || booking.booking_status?.toLowerCase().includes('cancel') || pkg.package_status?.toLowerCase().includes('cancel')) && { opacity: 0.5 }]}
              disabled={isOrderCancelled || booking.booking_status?.toLowerCase().includes('cancel') || pkg.package_status?.toLowerCase().includes('cancel')}
              onPress={() => onPressCancelPackage(item.order_id.toString(), booking.booking_id.toString(), pkg.package_id.toString())}
            >
              <X color="#DC2626" size={14} />
              <Text style={styles.cancelActionText}> CANCEL PACKAGE</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    };

    const renderBooking = (booking: OrderBookingDetail) => {
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
                <Text style={[styles.thText, { width: 160 }]}>STATUS</Text>
                <Text style={[styles.thText, { width: 140 }]}>ACTION</Text>
              </View>

              {/* Table Rows */}
              {booking.package_details.map((pkg, idx) => renderPackageRow(booking, pkg, idx))}
            </View>
          </ScrollView>

          {/* Booking Footer */}
          <View style={styles.bookingFooter}>
            <TouchableOpacity
              style={[styles.rescheduleBtn, (isOrderCancelled || booking.booking_status?.toLowerCase().includes('cancel')) && { opacity: 0.5 }]}
              disabled={isOrderCancelled || booking.booking_status?.toLowerCase().includes('cancel')}
              onPress={() => onPressReschedule(item.order_id.toString(), booking.booking_id.toString())}
            >
              <RefreshCw color="#D46B08" size={14} style={{ marginRight: 6 }} />
              <Text style={styles.rescheduleBtnText}>Reschedule Booking</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelBookingBtn, (isOrderCancelled || booking.booking_status?.toLowerCase().includes('cancel')) && { opacity: 0.5 }]}
              disabled={isOrderCancelled || booking.booking_status?.toLowerCase().includes('cancel')}
              onPress={() => onPressCancelBooking(item.order_id.toString(), booking.booking_id.toString())}
            >
              <X color="#DC2626" size={14} />
              <Text style={styles.cancelBookingText}> Cancel Booking</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    };

    return (
      <TouchableOpacity
        activeOpacity={0.95}
        disabled={!onPressCard}
        onPress={() => onPressCard && onPressCard(item)}
        style={[styles.card, isOrderCancelled && { opacity: 0.6 }]}
      >
        {/* Top Orange Banner */}
        <View style={styles.topBanner}>
          <View style={styles.bannerLeft}>
            <View style={styles.iconBox}>
              <FileIcon color="#FFF" size={20} />
            </View>
            <View style={styles.orderRefBox}>
              <Text style={styles.bannerLabel}>ORDER REF</Text>
              <Text style={styles.bannerValueBold}>{item.order_reference}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.amountBox}>
              <Text style={styles.bannerLabel}>TOTAL AMOUNT</Text>
              <Text style={styles.bannerValueBold}>₹{item.order_total_amount.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          <View style={styles.bannerRight}>
            {!isOrderCancelled && (
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>{item.order_status}</Text>
              </View>
            )}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {isOrderCancelled ? (
                <View style={styles.pillRedOutline}>
                  <Text style={styles.pillRedOutlineText}>Order Cancelled</Text>
                </View>
              ) : canPay && onPressPayNow && (
                <TouchableOpacity
                  style={styles.actionBtnWhite}
                  onPress={() => onPressPayNow(item.order_id.toString())}
                >
                  <IndianRupee color="#D46B08" size={14} style={{ marginRight: 4 }} />
                  <Text style={[styles.actionBtnText, { color: '#D46B08' }]}>Pay Now</Text>
                </TouchableOpacity>
              )}
              {onPressInvoice && (
                <TouchableOpacity
                  style={[styles.actionBtnWhite, isOrderCancelled && { opacity: 0.5 }]}
                  disabled={isOrderCancelled}
                  onPress={() => onPressInvoice(item.order_id.toString())}
                >
                  <FileText color="#2563EB" size={14} style={{ marginRight: 4 }} />
                  <Text style={[styles.actionBtnText, { color: '#2563EB' }]}>Download Invoice</Text>
                </TouchableOpacity>
              )}
              {canCancel && (
                <TouchableOpacity
                  style={styles.actionBtnWhite}
                  onPress={() => onPressCancel(item.order_id.toString())}
                >
                  <X color="#DC2626" size={14} style={{ marginRight: 4 }} />
                  <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>Cancel Order</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>

        {/* Bookings */}
        <View style={styles.bookingsContainer}>
          {item.booking_details?.map(renderBooking)}
        </View>
      </TouchableOpacity>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  topBanner: {
    backgroundColor: '#D46B08',
    padding: 16,
    flexDirection: 'column',
    gap: 16,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  orderRefBox: {
    marginRight: 16,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginRight: 16,
  },
  amountBox: {},
  bannerLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  bannerValueBold: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bannerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusPill: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusPillText: {
    color: '#D46B08',
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnWhite: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bookingsContainer: {
    padding: 16,
    backgroundColor: '#FFF',
  },
  bookingCard: {
    backgroundColor: '#FAF9F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3E8E0',
    marginBottom: 16,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8E0',
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
    borderColor: '#FFE0B2'
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
  cancelBookingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  cancelBookingText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '500',
  },
  tableContainer: {
    paddingBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8E0',
    backgroundColor: '#FDFBF7'
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
    borderBottomColor: '#F3E8E0',
    alignItems: 'center',
  },
  col: {
    justifyContent: 'center',
  },
  tableValue: {
    fontSize: 12,
    color: '#555',
  },
  tableValueBold: {
    fontSize: 13,
    color: '#222',
    fontWeight: 'bold',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillYellow: {
    backgroundColor: '#FFF8E1',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFECB3'
  },
  pillYellowText: {
    color: '#D46B08',
    fontSize: 11,
    fontWeight: '700',
  },
  pillRed: {
    backgroundColor: '#FEF2F2',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pillRedText: {
    color: '#FCA5A5',
    fontSize: 11,
    fontWeight: '700',
  },
  pillRedOutline: {
    backgroundColor: '#FFF',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  pillRedOutlineText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  topBadgeContainer: {
    position: 'absolute',
    top: -12,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  topBadge: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  topBadgeText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: 'bold',
  },
  cancelActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelActionText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '700',
  },
  bookingFooter: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rescheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFDDC1',
    backgroundColor: '#FFF',
  },
  rescheduleBtnText: {
    color: '#D46B08',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default OrderCard;
