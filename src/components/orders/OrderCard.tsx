import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
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
  Info,
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
  onPressReason?: (title: string, reason: string) => void;
  onPressPayNow?: (orderId: string) => void;
  onPressInvoice?: (orderId: string) => void;
  onPressCard?: (item: OrderSummary) => void;
}

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
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
  "Refund Initiated": { bg: "#EFF6FF", border: "#93C5FD", text: "#2563EB" },
  "Refund Processed": { bg: "#EFF6FF", border: "#93C5FD", text: "#2563EB" },
  "Refund Successfull": { bg: "#F0FDF4", border: "#86EFAC", text: "#16A34A" },
  "Refund Successful": { bg: "#F0FDF4", border: "#86EFAC", text: "#16A34A" },
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
  onPressReschedule, onPressReason, onPressPayNow, onPressInvoice, onPressCard,
}: Props) => {
  const [expanded, setExpanded] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [expandedPackages, setExpandedPackages] = useState<Record<string, boolean>>({});

  const togglePackage = (key: string) => {
    setExpandedPackages(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const canCancel = ["Order Initiated", "Order Pending", "Pending", "Order Payment Done"].includes(item.order_status);
  const canPay = ["Order Initiated", "Order payment Fail"].includes(item.order_status);
  const isOrderCancelled = item.order_status?.toLowerCase().includes("cancel");
  const bookingCount = item.booking_details?.length ?? 0;

  const renderPackageRow = (booking: OrderBookingDetail, pkg: OrderPackageDetail, index: number) => {
    const pkgCancelled = isOrderCancelled ||
      booking.booking_status?.toLowerCase().includes("cancel") ||
      pkg.package_status?.toLowerCase().includes("cancel");
    const pkgKey = `${booking.booking_id}-${pkg.package_id}-${index}`;
    const isExpanded = expandedPackages[pkgKey];

    return (
      <View style={pkgStyles.row} key={pkgKey}>
        <TouchableOpacity style={pkgStyles.pkgHeaderRow} onPress={() => togglePackage(pkgKey)} activeOpacity={0.7}>
          <View style={pkgStyles.pkgIconWrap}>
            <Package color="#D97706" size={16} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={pkgStyles.pkgName} numberOfLines={2}>{pkg.package_name}</Text>
            <Text style={pkgStyles.pkgDateText}>
              {pkg.preferred_date ? formatDate(pkg.preferred_date) : "—"} · {pkg.preferred_time ? formatTo12Hr(pkg.preferred_time) : "—"}
            </Text>
          </View>
          <View style={pkgStyles.pkgPriceWrap}>
            <Text style={pkgStyles.pkgAmount}>₹{Number(pkg.package_amount).toLocaleString("en-IN")}</Text>
            {isExpanded ? <ChevronUp color={BRAND_MUTED} size={16} style={{ marginLeft: 6 }} /> : <ChevronDown color={BRAND_MUTED} size={16} style={{ marginLeft: 6 }} />}
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View>
            <View style={pkgStyles.addressSection}>
              <Text style={pkgStyles.addressLabel}>SERVICE ADDRESS</Text>
              <View style={pkgStyles.addressRow}>
                <MapPin color={BRAND_MUTED} size={14} style={{ marginTop: 2 }} />
                <Text style={pkgStyles.addressText} numberOfLines={3}>
                  {[pkg.booking_address, pkg.booking_street, pkg.booking_city, pkg.booking_state_name, pkg.booking_pincode].filter(Boolean).join(", ") || pkg.citizen_address || "—"}
                </Text>
              </View>
            </View>

            <View style={pkgStyles.pkgActionRow}>
              <TouchableOpacity style={pkgStyles.detailsBtn}>
                <Text style={pkgStyles.detailsBtnText}>Booking Details Request</Text>
              </TouchableOpacity>
              {pkgCancelled && ((pkg as any).package_cancel_reason || (booking as any).booking_cancel_reason) ? (
                <TouchableOpacity
                  style={pkgStyles.cancelPkgBtnLarge}
                  onPress={() => onPressReason && onPressReason(isBn ? "বাতিলের কারণ" : "Cancellation Reason", (pkg as any).package_cancel_reason || (booking as any).booking_cancel_reason)}
                >
                  <Info color="#DC2626" size={14} />
                  <Text style={pkgStyles.cancelPkgTextLarge}> {isBn ? "কারণ" : "Reason"}</Text>
                </TouchableOpacity>
              ) : (
                !pkgCancelled && (
                  <TouchableOpacity
                    style={pkgStyles.cancelPkgBtnLarge}
                    onPress={() => onPressCancelPackage(item.order_id.toString(), booking.booking_id.toString(), pkg.package_id.toString())}
                  >
                    <X color="#DC2626" size={14} />
                    <Text style={pkgStyles.cancelPkgTextLarge}> Cancel package</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderBooking = (booking: OrderBookingDetail) => {
    const bookingCancelled = isOrderCancelled || booking.booking_status?.toLowerCase().includes("cancel");
    return (
      <View key={booking.booking_id} style={pkgStyles.bookingWrap}>
        <View style={pkgStyles.bookingHeader}>
          <View style={pkgStyles.bookingHeaderTop}>
            <ClipboardList color={BRAND_MUTED} size={16} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={pkgStyles.bookingLabel}>BOOKING NUMBER</Text>
              <Text style={pkgStyles.bookingNo} numberOfLines={1}>{booking.booking_no}</Text>
            </View>
            <TouchableOpacity style={pkgStyles.bookingMenuBtn}>
              <MoreHorizontal color={BRAND_MUTED} size={16} />
            </TouchableOpacity>
          </View>
          
          <View style={pkgStyles.bookingActionRow}>
            {bookingCancelled && (booking as any).booking_cancel_reason ? (
              <TouchableOpacity
                style={pkgStyles.cancelBookBtnLarge}
                onPress={() => onPressReason && onPressReason(isBn ? "বাতিলের কারণ" : "Cancellation Reason", (booking as any).booking_cancel_reason)}
              >
                <Info color="#DC2626" size={14} />
                <Text style={pkgStyles.cancelBookTextLarge}> {isBn ? "কারণ" : "Reason"}</Text>
              </TouchableOpacity>
            ) : null}
            {!bookingCancelled && (
              <TouchableOpacity
                style={pkgStyles.cancelBookBtnLarge}
                onPress={() => onPressCancelBooking(item.order_id.toString(), booking.booking_id.toString())}
              >
                <X color="#DC2626" size={14} />
                <Text style={pkgStyles.cancelBookTextLarge}> Cancel booking</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {booking.package_details.map((pkg, idx) => renderPackageRow(booking, pkg, idx))}

        {booking.booking_confirmation_code ? (
          <View style={{
            marginTop: 16,
            padding: 16,
            backgroundColor: '#FFFBEB',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#FDE68A',
            alignItems: 'center',
            marginBottom: 8,
          }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#B45309', marginBottom: 6, letterSpacing: 0.5 }}>
              {isBn ? 'আপনার বুকিং কনফার্মেশন কোড' : 'YOUR BOOKING CONFIRMATION CODE'}
            </Text>
            <Text style={{ fontSize: 13, color: '#92400E', textAlign: 'center', marginBottom: 12 }}>
              {isBn ? 'পূজা শেষ হওয়ার পর আমাদের পুরোহিতকে এই কোডটি দিন' : 'Give this code to our priest after completing the puja'} 👇
            </Text>
            <View style={{ backgroundColor: '#F59E0B', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8, shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: '#FFFFFF', letterSpacing: 2 }}>
                {booking.booking_confirmation_code}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.orangeHeader}>
        <View style={styles.cardHeaderTop}>
          <View style={styles.orderIconWrap}>
            <ClipboardList color="#F97316" size={18} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.orderRefLabel}>ORDER REFERENCE</Text>
            <Text style={styles.orderRefValue} numberOfLines={1}>{item.order_reference}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onPressCard && onPressCard(item)}
          >
            <Eye color={BRAND_TEXT} size={15} />
            <Text style={styles.actionBtnText}>{isBn ? "বিস্তারিত" : "Details"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setShowMore(v => !v)}
          >
            <MoreHorizontal color={BRAND_TEXT} size={15} />
            <Text style={styles.actionBtnText}>{isBn ? "আরও" : "More"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* More Menu */}
      {showMore && (
        <View style={styles.moreMenu}>
          {canPay && onPressPayNow ? (
            <TouchableOpacity
              style={[styles.moreMenuBtn, { borderColor: BRAND_PRIMARY, backgroundColor: '#FFF7ED' }]}
              onPress={() => onPressPayNow(item.order_id.toString())}
            >
              <IndianRupee color={BRAND_PRIMARY} size={15} />
              <Text style={[styles.moreMenuText, { color: BRAND_PRIMARY }]}>{isBn ? "পেমেন্ট করুন" : "Pay Now"}</Text>
            </TouchableOpacity>
          ) : null}
          {onPressInvoice && !isOrderCancelled && (
            <TouchableOpacity
              style={styles.moreMenuBtn}
              onPress={() => { setShowMore(false); onPressInvoice(item.order_id.toString()); }}
            >
              <FileText color="#374151" size={15} />
              <Text style={styles.moreMenuText}>{isBn ? "ইনভয়েস দেখুন" : "View invoice"}</Text>
            </TouchableOpacity>
          )}
          {canCancel && (
            <TouchableOpacity
              style={[styles.moreMenuBtn, { borderColor: "#FCA5A5", backgroundColor: "#FEF2F2" }]}
              onPress={() => { setShowMore(false); onPressCancel(item.order_id.toString()); }}
            >
              <X color="#DC2626" size={15} />
              <Text style={[styles.moreMenuText, { color: "#DC2626" }]}>{isBn ? "অর্ডার বাতিল করুন" : "Cancel order"}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.divider} />

      {/* Total Amount + Status */}
      <View style={styles.amountStatusRow}>
        <View style={{ flex: 0.3, paddingRight: 8 }}>
          <Text style={styles.amountLabel}>{isBn ? "মোট পরিমাণ" : "TOTAL AMOUNT"}</Text>
          <Text style={styles.amountValue}>₹{Number(item.order_total_amount).toLocaleString("en-IN")}</Text>
          {item.order_status === "Order Payment Done" && (
            <Text style={styles.paidOnlineText}>₹{Number(item.order_total_amount).toLocaleString("en-IN")} paid online</Text>
          )}
        </View>
        <View style={{ flex: 0.7, alignItems: "flex-end" }}>
          <Text style={[styles.amountLabel, { marginBottom: 6 }]}>STATUS</Text>
          <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 6 }}>
            <StatusBadge status={item.order_status} />
            {isOrderCancelled && item.refund_status_name ? (
              <StatusBadge status={item.refund_status_name} />
            ) : null}
          </View>
          
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 10, justifyContent: "flex-end" }}>
            {isOrderCancelled && item.order_cancel_reason ? (
              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: "#FCA5A5", backgroundColor: "#FEF2F2" }}
                onPress={() => onPressReason && onPressReason(isBn ? "অর্ডার বাতিলের কারণ" : "Order Cancellation Reason", item.order_cancel_reason)}
              >
                <Info color="#DC2626" size={12} />
                <Text style={{ fontSize: 11, color: "#DC2626", fontWeight: "700" }}>{isBn ? "কারণ দেখুন" : "View Reason"}</Text>
              </TouchableOpacity>
            ) : null}

            {isOrderCancelled && (item.refund_amount !== undefined && item.refund_amount !== null) ? (
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#16A34A" }}>
                {isBn ? "রিফান্ড পরিমাণ" : "Refund Amt"}: ₹{Number(item.refund_amount).toLocaleString("en-IN")}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      {/* Refund Policy Text Full Width Row */}
      {isOrderCancelled && item.refund_policy_display_text ? (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <TouchableOpacity 
            style={[styles.policyBox, { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 0 }]} 
            onPress={() => onPressReason && onPressReason(isBn ? "রিফান্ড পলিসি" : "Refund Policy", item.refund_policy_display_text!)}
          >
            <Info color="#D97706" size={14} style={{ marginRight: 6 }} />
            <Text style={styles.policyText}>
              {isBn ? "রিফান্ড পলিসি দেখুন" : "View Refund Policy"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.divider} />

      {/* Expand Row */}
      <TouchableOpacity style={styles.expandRow} onPress={() => setExpanded(v => !v)} activeOpacity={0.7}>
        <View>
          <Text style={styles.expandBookingCount}>
            {bookingCount} {bookingCount === 1 ? "booking" : "bookings"} {isBn ? "এই অর্ডারে" : "in this order"}
          </Text>
          <Text style={styles.expandSubLabel}>
            {expanded ? "Hide package and schedule details" : "View package and schedule details"}
          </Text>
        </View>
        <View style={styles.expandBtn}>
          <Text style={styles.expandBtnText}>{expanded ? (isBn ? "সংকুচিত করুন" : "Collapse") : (isBn ? "বিস্তার করুন" : "Expand")}</Text>
          {expanded ? <ChevronUp color="#DC2626" size={16} /> : <ChevronDown color="#DC2626" size={16} />}
        </View>
      </TouchableOpacity>

      {/* Expanded Booking Details */}
      {expanded && (
        <View style={styles.bookingsContainer}>
          {item.booking_details?.map(renderBooking)}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  orangeHeader: {
    backgroundColor: "#F97316",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  cardHeaderTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  orderIconWrap: {
    width: 44,
    height: 44,
    backgroundColor: "#fff",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  orderRefLabel: { fontSize: 10, fontWeight: "700", color: "#FFEDD5", letterSpacing: 0.6, marginBottom: 2 },
  orderRefValue: { fontSize: 16, fontWeight: "bold", color: "#fff", letterSpacing: 0.2 },
  actionsRow: { flexDirection: "row", gap: 12 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 8, backgroundColor: "#fff", gap: 6 },
  actionBtnText: { fontSize: 14, fontWeight: "600", color: BRAND_TEXT },
  moreMenu: {
    flexDirection: "row",
    padding: 16,
    gap: 10,
    flexWrap: "wrap",
    backgroundColor: "#FFF7ED",
    borderBottomWidth: 1,
    borderBottomColor: "#FFEDD5",
  },
  moreMenuBtn: {
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
  moreMenuText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
  },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginHorizontal: 16 },
  amountStatusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 16, paddingVertical: 16 },
  amountLabel: { fontSize: 10, fontWeight: "700", color: BRAND_MUTED, letterSpacing: 0.5, marginBottom: 4, textTransform: 'uppercase' },
  amountValue: { fontSize: 20, fontWeight: "bold", color: BRAND_TEXT, marginBottom: 4 },
  paidOnlineText: { fontSize: 11, color: BRAND_MUTED, fontWeight: "500" },
  policyBox: { marginTop: 10, padding: 8, backgroundColor: "#FFF7ED", borderRadius: 6, borderWidth: 1, borderColor: "#FFEDD5" },
  policyText: { fontSize: 10, color: "#D97706", lineHeight: 14, fontStyle: "italic" },
  expandRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#fff" },
  expandBookingCount: { fontSize: 15, fontWeight: "700", color: BRAND_TEXT, marginBottom: 2 },
  expandSubLabel: { fontSize: 12, color: BRAND_MUTED },
  expandBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  expandBtnText: { fontSize: 13, fontWeight: "700", color: "#DC2626" },
  bookingsContainer: { paddingHorizontal: 14, paddingBottom: 14, backgroundColor: "#F9FAFB", paddingTop: 8 },
});

const pkgStyles = StyleSheet.create({
  bookingWrap: { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", marginBottom: 12, overflow: "hidden" },
  bookingHeader: { padding: 14, borderBottomWidth: 1, borderBottomColor: "#F3F4F6", backgroundColor: "#FDFBF7" },
  bookingHeaderTop: { flexDirection: "row", alignItems: "center" },
  bookingLabel: { fontSize: 10, fontWeight: "700", color: BRAND_MUTED, letterSpacing: 0.5, marginBottom: 2 },
  bookingNo: { fontSize: 15, fontWeight: "600", color: BRAND_TEXT },
  bookingMenuBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  bookingActionRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  cancelBookBtnLarge: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: "#FCA5A5", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: "#FEF2F2" },
  cancelBookTextLarge: { color: "#DC2626", fontWeight: "600", fontSize: 13 },
  row: { padding: 14, borderBottomWidth: 1, borderBottomColor: "#F9FAFB" },
  pkgHeaderRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  pkgIconWrap: { width: 40, height: 40, borderRadius: 8, backgroundColor: "#FFF7ED", alignItems: "center", justifyContent: "center", marginRight: 12 },
  pkgName: { fontSize: 15, fontWeight: "600", color: BRAND_TEXT, marginBottom: 4 },
  pkgDateText: { fontSize: 12, color: BRAND_MUTED },
  pkgPriceWrap: { flexDirection: "row", alignItems: "center", marginLeft: 8 },
  pkgAmount: { fontSize: 15, fontWeight: "600", color: BRAND_TEXT },
  addressSection: { 
    marginBottom: 16, 
    backgroundColor: "#F9FAFB", 
    padding: 12, 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F3F4F6"
  },
  addressLabel: { fontSize: 10, fontWeight: "700", color: BRAND_MUTED, letterSpacing: 0.5, marginBottom: 6 },
  addressRow: { flexDirection: "row", gap: 6, paddingRight: 12 },
  addressText: { fontSize: 13, color: BRAND_TEXT, lineHeight: 18 },
  pkgActionRow: { flexDirection: "column", gap: 10 },
  detailsBtn: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#fff", paddingHorizontal: 4 },
  detailsBtnText: { fontSize: 13, fontWeight: "600", color: BRAND_TEXT, textAlign: "center" },
  cancelPkgBtnLarge: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: "#FCA5A5", backgroundColor: "#FEF2F2", gap: 6, paddingHorizontal: 4 },
  cancelPkgTextLarge: { fontSize: 13, fontWeight: "600", color: "#DC2626", textAlign: "center" },
});

export default OrderCard;
