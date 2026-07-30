import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import {
  Eye,
  IndianRupee,
  MoreHorizontal,
  Calendar,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  X,
  RefreshCw,
  FileText,
  Package,
  File as FileIcon,
} from "lucide-react-native";
import {
  OrderSummary,
  OrderBookingDetail,
  OrderPackageDetail,
} from "../../service/api/dashboardService";
import { Colors } from "../../constants/Colors";
import { formatTo12Hr } from "../../utils/timeUtils";

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
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${d.getDate().toString().padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateString;
  }
};

const STATUS_CONFIG: Record<string, { bg: string; border: string; text: string }> = {
  "Order Initiated": { bg: "#FFF8ED", border: "#FDBA74", text: "#D97706" },
  "Order Pending": { bg: "#FFF8ED", border: "#FDBA74", text: "#D97706" },
  Pending: { bg: "#FFF8ED", border: "#FDBA74", text: "#D97706" },
  Upcoming: { bg: "#EFF6FF", border: "#93C5FD", text: "#2563EB" },
  Completed: { bg: "#F0FDF4", border: "#86EFAC", text: "#16A34A" },
  Rescheduled: { bg: "#F0FDF4", border: "#86EFAC", text: "#16A34A" },
  "Order Payment Done": { bg: "#F0FDF4", border: "#86EFAC", text: "#16A34A" },
  Cancelled: { bg: "#FEF2F2", border: "#FCA5A5", text: "#DC2626" },
  "Order Cancelled": { bg: "#FEF2F2", border: "#FCA5A5", text: "#DC2626" },
  "Partial Cancelled": { bg: "#FEF2F2", border: "#FCA5A5", text: "#DC2626" },
  "Order payment Fail": { bg: "#FEF2F2", border: "#FCA5A5", text: "#DC2626" },
};

const StatusBadge = ({ status }: { status: string }) => {
  const cfg = STATUS_CONFIG[status] || { bg: "#F3F4F6", border: "#D1D5DB", text: BRAND_MUTED };
  return (
    <View style={[sBadge.badge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <Text style={[sBadge.text, { color: cfg.text }]}>{status}</Text>
    </View>
  );
};

const sBadge = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, alignSelf: "flex-start" },
  text: { fontSize: 12, fontWeight: "700" },
});

const OrderCard = React.memo(({
  item, isBn,
  onPressCancel, onPressCancelBooking, onPressCancelPackage,
  onPressReschedule, onPressPayNow, onPressInvoice, onPressCard,
}: Props) => {
  const [expanded, setExpanded] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const canCancel = ["Order Initiated", "Order Pending", "Pending"].includes(item.order_status);
  const canPay = ["Order Initiated", "Order payment Fail"].includes(item.order_status);
  const isOrderCancelled = item.order_status?.toLowerCase().includes("cancel");
  const bookingCount = item.booking_details?.length ?? 0;

  const renderPackageRow = (booking: OrderBookingDetail, pkg: OrderPackageDetail, index: number) => {
    const pkgCancelled = isOrderCancelled ||
      booking.booking_status?.toLowerCase().includes("cancel") ||
      pkg.package_status?.toLowerCase().includes("cancel");
    return (
      <View style={pkgStyles.row} key={`${booking.booking_id}-${pkg.package_id}-${index}`}>
        <View style={pkgStyles.rowInner}>
          <Package color={BRAND_PRIMARY} size={14} style={{ marginTop: 2 }} />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={pkgStyles.pkgName} numberOfLines={2}>{pkg.package_name}</Text>
            <View style={pkgStyles.metaRow}>
              <Calendar color={BRAND_MUTED} size={12} />
              <Text style={pkgStyles.metaText}>{pkg.preferred_date ? formatDate(pkg.preferred_date) : "—"}</Text>
              <Clock color={BRAND_MUTED} size={12} style={{ marginLeft: 8 }} />
              <Text style={pkgStyles.metaText}>{pkg.preferred_time ? formatTo12Hr(pkg.preferred_time) : "—"}</Text>
            </View>
            {pkg.citizen_address ? (
              <View style={pkgStyles.metaRow}>
                <MapPin color={BRAND_MUTED} size={12} />
                <Text style={pkgStyles.metaText} numberOfLines={1}>{pkg.citizen_address}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={pkgStyles.pkgFooter}>
          <Text style={pkgStyles.pkgAmount}>Rs.{pkg.package_amount.toLocaleString("en-IN")}</Text>
          <StatusBadge status={pkgCancelled ? "Cancelled" : item.order_status} />
          {!pkgCancelled && (
            <TouchableOpacity
              style={pkgStyles.cancelPkgBtn}
              onPress={() => onPressCancelPackage(item.order_id.toString(), booking.booking_id.toString(), pkg.package_id.toString())}
            >
              <X color="#DC2626" size={12} />
              <Text style={pkgStyles.cancelPkgText}> Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderBooking = (booking: OrderBookingDetail) => {
    const bookingCancelled = isOrderCancelled || booking.booking_status?.toLowerCase().includes("cancel");
    return (
      <View key={booking.booking_id} style={pkgStyles.bookingWrap}>
        <View style={pkgStyles.bookingHeader}>
          <View style={pkgStyles.bookingHeaderLeft}>
            <ClipboardList color={BRAND_PRIMARY} size={14} />
            <Text style={pkgStyles.bookingNo} numberOfLines={1}>{booking.booking_no}</Text>
          </View>
          <View style={pkgStyles.bookingHeaderActions}>
            {!bookingCancelled && (
              <>
                <TouchableOpacity
                  style={pkgStyles.bookingActionBtn}
                  onPress={() => onPressReschedule(item.order_id.toString(), booking.booking_id.toString())}
                >
                  <RefreshCw color={BRAND_PRIMARY} size={12} />
                  <Text style={pkgStyles.bookingActionText}> Reschedule</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[pkgStyles.bookingActionBtn, pkgStyles.cancelBookBtn]}
                  onPress={() => onPressCancelBooking(item.order_id.toString(), booking.booking_id.toString())}
                >
                  <X color="#DC2626" size={12} />
                  <Text style={pkgStyles.cancelBookText}> Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
        {booking.package_details.map((pkg, idx) => renderPackageRow(booking, pkg, idx))}
      </View>
    );
  };

  return (
    <View style={styles.card}>
      {/* Header: Icon + ORDER REFERENCE */}
      <View style={styles.cardHeader}>
        <View style={styles.orderIconWrap}>
          <FileIcon color={BRAND_PRIMARY} size={18} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderRefLabel}>ORDER REFERENCE</Text>
          <Text style={styles.orderRefValue} numberOfLines={1}>{item.order_reference}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnOutline]}
          onPress={() => onPressCard && onPressCard(item)}
        >
          <Eye color={BRAND_TEXT} size={15} />
          <Text style={[styles.actionBtnText, { color: BRAND_TEXT }]}>{isBn ? "বিস্তারিত" : "Details"}</Text>
        </TouchableOpacity>

        {canPay && onPressPayNow ? (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary]}
            onPress={() => onPressPayNow(item.order_id.toString())}
          >
            <IndianRupee color="#fff" size={15} />
            <Text style={[styles.actionBtnText, { color: "#fff" }]}>{isBn ? "পেমেন্ট করুন" : "Pay Now"}</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnOutline]}
          onPress={() => setShowMore(v => !v)}
        >
          <MoreHorizontal color={BRAND_TEXT} size={15} />
          <Text style={[styles.actionBtnText, { color: BRAND_TEXT }]}>{isBn ? "আরও" : "More"}</Text>
        </TouchableOpacity>
      </View>

      {/* More Menu */}
      {showMore && (
        <View style={styles.moreMenu}>
          {onPressInvoice && !isOrderCancelled && (
            <TouchableOpacity
              style={styles.moreMenuInvoiceBtn}
              onPress={() => { setShowMore(false); onPressInvoice(item.order_id.toString()); }}
            >
              <FileText color="#374151" size={15} />
              <Text style={styles.moreMenuInvoiceText}>{isBn ? "ইনভয়েস দেখুন" : "View invoice"}</Text>
            </TouchableOpacity>
          )}
          {canCancel && (
            <TouchableOpacity
              style={styles.moreMenuCancelBtn}
              onPress={() => { setShowMore(false); onPressCancel(item.order_id.toString()); }}
            >
              <X color="#DC2626" size={15} />
              <Text style={styles.moreMenuCancelText}>{isBn ? "অর্ডার বাতিল করুন" : "Cancel order"}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Total Amount + Status */}
      <View style={styles.amountStatusRow}>
        <View>
          <Text style={styles.amountLabel}>{isBn ? "মোট পরিমাণ" : "TOTAL AMOUNT"}</Text>
          <Text style={styles.amountValue}>Rs.{item.order_total_amount.toLocaleString("en-IN")}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.amountLabel}>STATUS</Text>
          <StatusBadge status={item.order_status} />
        </View>
      </View>

      {/* Expand Row */}
      <TouchableOpacity style={styles.expandRow} onPress={() => setExpanded(v => !v)} activeOpacity={0.7}>
        <Text style={styles.expandBookingCount}>
          {bookingCount} {bookingCount === 1 ? "booking" : "bookings"} {isBn ? "এই অর্ডারে" : "in this order"}
        </Text>
        <View style={styles.expandBtn}>
          <Text style={styles.expandBtnText}>{expanded ? (isBn ? "সংকুচিত করুন" : "Collapse") : (isBn ? "বিস্তার করুন" : "Expand")}</Text>
          {expanded ? <ChevronUp color={BRAND_PRIMARY} size={16} /> : <ChevronDown color={BRAND_PRIMARY} size={16} />}
        </View>
      </TouchableOpacity>

      {/* Expanded Booking Details */}
      {expanded && (
        <View style={styles.bookingsContainer}>
          <Text style={styles.expandSubLabel}>{isBn ? "প্যাকেজ, সময়সূচী এবং ঠিকানা দেখুন" : "View packages, schedules and service addresses"}</Text>
          {item.booking_details?.map(renderBooking)}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  orderIconWrap: {
    width: 40,
    height: 40,
    backgroundColor: "#FFF3E0",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFE0B2",
  },
  orderRefLabel: { fontSize: 10, fontWeight: "700", color: BRAND_MUTED, letterSpacing: 0.6, marginBottom: 2 },
  orderRefValue: { fontSize: 16, fontWeight: "bold", color: BRAND_TEXT, letterSpacing: 0.2 },
  actionsRow: { flexDirection: "row", paddingHorizontal: 12, paddingBottom: 10, gap: 8 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 10, gap: 5 },
  actionBtnOutline: { borderWidth: 1.5, borderColor: "#D1D5DB", backgroundColor: "#fff" },
  actionBtnPrimary: { backgroundColor: BRAND_PRIMARY, borderWidth: 1.5, borderColor: BRAND_PRIMARY },
  actionBtnText: { fontSize: 13, fontWeight: "700" },
  moreMenu: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 10,
    flexWrap: "wrap",
  },
  moreMenuInvoiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    gap: 6,
  },
  moreMenuInvoiceText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
  },
  moreMenuCancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
    gap: 6,
  },
  moreMenuCancelText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#DC2626",
  },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginHorizontal: 16 },
  amountStatusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  amountLabel: { fontSize: 10, fontWeight: "700", color: BRAND_MUTED, letterSpacing: 0.5, marginBottom: 4 },
  amountValue: { fontSize: 20, fontWeight: "bold", color: BRAND_TEXT },
  expandRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#F3F4F6", backgroundColor: "#FAFAFA" },
  expandBookingCount: { fontSize: 13, fontWeight: "600", color: BRAND_TEXT },
  expandBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  expandBtnText: { fontSize: 13, fontWeight: "700", color: BRAND_PRIMARY },
  expandSubLabel: { fontSize: 11, color: BRAND_MUTED, marginBottom: 12 },
  bookingsContainer: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8, borderTopWidth: 1, borderTopColor: "#F3F4F6", backgroundColor: "#FAFAFA" },
});

const pkgStyles = StyleSheet.create({
  bookingWrap: { backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB", marginBottom: 10, overflow: "hidden" },
  bookingHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F3F4F6", backgroundColor: "#FDFBF7" },
  bookingHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  bookingNo: { fontSize: 12, fontWeight: "700", color: BRAND_TEXT, flex: 1 },
  bookingHeaderActions: { flexDirection: "row", gap: 6 },
  bookingActionBtn: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: "#fff" },
  bookingActionText: { fontSize: 11, color: BRAND_PRIMARY, fontWeight: "600" },
  cancelBookBtn: { borderColor: "#FEE2E2", backgroundColor: "#FEF2F2" },
  cancelBookText: { fontSize: 11, color: "#DC2626", fontWeight: "600" },
  row: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F9FAFB" },
  rowInner: { flexDirection: "row", marginBottom: 8 },
  pkgName: { fontSize: 13, fontWeight: "700", color: BRAND_TEXT, marginBottom: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 },
  metaText: { fontSize: 11, color: BRAND_MUTED },
  pkgFooter: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  pkgAmount: { fontSize: 14, fontWeight: "800", color: BRAND_TEXT, marginRight: 4 },
  cancelPkgBtn: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#FEE2E2", backgroundColor: "#FEF2F2", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: "auto" },
  cancelPkgText: { fontSize: 11, color: "#DC2626", fontWeight: "600" },
});

export default OrderCard;
