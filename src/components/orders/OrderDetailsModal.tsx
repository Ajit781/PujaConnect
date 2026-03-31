import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  BookingSummary,
  BookingDetail,
} from '../../service/api/dashboardService';
import { useGetBookingDetailsQuery } from '../../store/api/pujaApi';
import { OrderItem } from '../../store/slices/orderSlice';
import RescheduleOrderModal from './RescheduleOrderModal';
import RescheduleSuccessModal from './RescheduleSuccessModal';
import CancelOrderModal from './CancelOrderModal';
import CancelSuccessModal from './CancelSuccessModal';

const { height } = Dimensions.get('window');

import { Colors } from '../../constants/Colors';
import { formatTo12Hr } from '../../utils/timeUtils';

const BRAND_PRIMARY = Colors.primary;
const BRAND_TEXT = Colors.textMain;
const BRAND_MUTED = Colors.textMuted;

interface Props {
  visible: boolean;
  order: BookingSummary;
  onClose: () => void;
}

export default function OrderDetailsModal({ visible, order, onClose }: Props) {
  const { i18n } = useTranslation();
  const isBn = i18n.language === 'bn';
  const [activeRescheduleItem, setActiveRescheduleItem] =
    useState<OrderItem | null>(null);
  const [rescheduledItem, setRescheduledItem] = useState<OrderItem | null>(
    null,
  );

  const [activeCancelItem, setActiveCancelItem] = useState<OrderItem | null>(
    null,
  );
  const [showCancelSuccess, setShowCancelSuccess] = useState(false);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
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
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return dateString;
    }
  };

  // Fetch booking details (puja items)
  const {
    data: pujaItems = [],
    isLoading,
    refetch,
  } = useGetBookingDetailsQuery(order.booking_id, {
    skip: !visible,
  });

  const handleReschedule = (item: OrderItem) => {
    setActiveRescheduleItem(item);
  };

  const handleCancelItem = (item: OrderItem) => {
    setActiveCancelItem(item);
  };

  const renderPujaItemDetail = (item: BookingDetail, index: number) => {
    return (
      <View style={styles.itemBox} key={index}>
        <View style={styles.itemHeader}>
          <View style={styles.itemTitleRow}>
            <View style={styles.itemIndexBox}>
              <Text style={styles.itemIndexText}>{index + 1}</Text>
            </View>
            <View style={styles.itemTitleContainer}>
              <Text style={styles.itemTitle} numberOfLines={2}>
                {item.puja_name}
              </Text>
              <Text style={styles.itemSubTitle} numberOfLines={1}>
                {item.package_name}
              </Text>
            </View>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.itemPriceText}>
              ₹{item.package_total_amount.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statIcon}>👥</Text>
            <Text style={styles.statLabel}>PANDITS</Text>
            <Text style={styles.statValue}>{item.pandit_count}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statIcon}>🕒</Text>
            <Text style={styles.statLabel}>DURATION</Text>
            <Text style={styles.statValue}>{item.duration_hours}h</Text>
          </View>
        </View>

        <View style={styles.descBox}>
          <Text style={styles.descIcon}>📖</Text>
          <Text style={styles.descText}>{item.package_description}</Text>
        </View>

        <View style={styles.sessionsBox}>
          <Text style={styles.sessionsHeader}>📅 SCHEDULED SESSION</Text>
          <View style={styles.sessionRow}>
            <View style={styles.sessionIndex}>
              <Text style={styles.itemIndexText}>1</Text>
            </View>
            <View style={styles.flexOne}>
              <Text style={styles.sessionDate}>{item.preferred_date}</Text>
              <Text style={styles.sessionTime}>
                {formatTo12Hr(item.preferred_time)}
              </Text>
            </View>
            <Text style={[styles.statLabel, styles.statusWeight]}>
              {item.puja_item_booking_status}
            </Text>
          </View>
        </View>

        {/* Action Buttons for every item */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.rescheduleBtn}
            onPress={() => {
              // Convert BookingDetail to OrderItem-like structure for the existing modal logic
              const legacyItem: any = {
                id: item.puja_id.toString(),
                titleEn: item.puja_name,
                titleBn: item.puja_name,
                price: item.package_total_amount,
                scheduledDate: item.preferred_date,
                scheduledTime: item.preferred_time,
                status: item.puja_item_booking_status,
                pandits: item.pandit_count,
                duration: `${item.duration_hours}h`,
                bookingId: item.booking_id,
                packageId: item.package_id,
              };
              handleReschedule(legacyItem);
            }}
          >
            <Text style={styles.rescheduleBtnText}>🔄 Reschedule</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => {
              const legacyItem: any = {
                id: item.puja_id.toString(),
                titleEn: item.puja_name,
                titleBn: item.puja_name,
              };
              handleCancelItem(legacyItem);
            }}
          >
            <Text style={styles.cancelBtnText}>✖ Cancel</Text>
          </TouchableOpacity>
        </View>
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
          {/* Header */}
          <View style={styles.headerBox}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>🔥</Text>
              </View>
              <View>
                <View style={styles.badgeRow}>
                  <Text style={styles.modalTitleLabel}>BOOKING DETAILS</Text>
                  <View style={styles.badgeSm}>
                    <Text style={styles.badgeSmText}>
                      ✨ {order.booking_status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.modalTitleRef}>{order.booking_no}</Text>
                <Text style={styles.modalSubRef}>
                  Booked on {formatDate(order.booking_create_date)}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✖</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
          >
            {isLoading ? (
              <View style={styles.loadingBox}>
                <Text style={styles.loadingText}>Fetching items...</Text>
              </View>
            ) : pujaItems.length > 0 ? (
              pujaItems.map((item, idx) => renderPujaItemDetail(item, idx))
            ) : (
              <View style={styles.noItemsBox}>
                <Text style={styles.noItemsText}>
                  No puja items found for this booking.
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.footerBtn} onPress={onClose}>
              <Text style={styles.footerBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {activeRescheduleItem && (
        <RescheduleOrderModal
          visible={!!activeRescheduleItem}
          orderId={order.booking_id.toString()}
          item={activeRescheduleItem}
          onClose={() => setActiveRescheduleItem(null)}
          onSuccess={updated => {
            setActiveRescheduleItem(null);
            setRescheduledItem(updated);
            refetch(); // Refresh the list to show new date/time
          }}
        />
      )}

      {rescheduledItem && (
        <RescheduleSuccessModal
          visible={!!rescheduledItem}
          item={rescheduledItem}
          onClose={() => setRescheduledItem(null)}
        />
      )}

      {activeCancelItem && (
        <CancelOrderModal
          visible={!!activeCancelItem}
          orderId={order.booking_id.toString()}
          itemId={activeCancelItem.id}
          itemTitle={isBn ? activeCancelItem.titleBn : activeCancelItem.titleEn}
          onClose={() => setActiveCancelItem(null)}
          onSuccess={() => {
            setActiveCancelItem(null);
            setShowCancelSuccess(true);
          }}
        />
      )}

      <CancelSuccessModal
        visible={showCancelSuccess}
        itemTitle={
          activeCancelItem
            ? isBn
              ? activeCancelItem.titleBn
              : activeCancelItem.titleEn
            : ''
        }
        onClose={() => setShowCancelSuccess(false)}
      />
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
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: height * 0.9,
    overflow: 'hidden',
  },
  headerBox: {
    backgroundColor: Colors.lightOrange,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BRAND_PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: { fontSize: 24 },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  modalTitleLabel: { fontSize: 12, fontWeight: 'bold', color: BRAND_PRIMARY },
  badgeSm: {
    backgroundColor: Colors.lightOrange,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeSmText: { fontSize: 10, color: BRAND_PRIMARY, fontWeight: 'bold' },
  modalTitleRef: { fontSize: 18, fontWeight: 'bold', color: BRAND_TEXT },
  modalSubRef: { fontSize: 12, color: Colors.gray, marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: { color: BRAND_MUTED, fontSize: 14 },

  scrollBody: { flex: 1, backgroundColor: Colors.ultraLightGray },

  itemBox: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  itemTitleRow: { flex: 1, flexDirection: 'row', gap: 12 },
  itemTitleContainer: { flex: 1, paddingRight: 8 },
  priceContainer: { alignItems: 'flex-end', justifyContent: 'flex-start' },
  itemIndexBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BRAND_PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  itemIndexText: { color: Colors.white, fontWeight: 'bold', fontSize: 12 },
  itemTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: BRAND_TEXT,
    lineHeight: 20,
  },
  itemSubTitle: {
    fontSize: 11,
    color: BRAND_PRIMARY,
    marginTop: 2,
    fontWeight: '600',
  },
  itemPriceText: { fontSize: 15, fontWeight: 'bold', color: Colors.red },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    alignItems: 'center',
  },
  statIcon: { fontSize: 16, marginBottom: 4 },
  statLabel: {
    fontSize: 10,
    color: Colors.gray,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statValue: { fontSize: 14, fontWeight: 'bold', color: BRAND_TEXT },

  descBox: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.warningBackground,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    marginBottom: 16,
  },
  descIcon: { fontSize: 14 },
  descText: { fontSize: 12, color: Colors.warningText, flex: 1 },

  sessionsBox: { marginBottom: 16 },
  sessionsHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: BRAND_TEXT,
    marginBottom: 8,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sessionIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.lightOrange,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionDate: { fontSize: 14, fontWeight: 'bold', color: BRAND_TEXT },
  sessionTime: { fontSize: 12, color: Colors.gray },

  actionRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  rescheduleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.blueBorder,
    backgroundColor: Colors.blueLight,
    alignItems: 'center',
  },
  rescheduleBtnText: { color: Colors.blue, fontSize: 14, fontWeight: 'bold' },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.tagRed,
    backgroundColor: Colors.tagRed,
    alignItems: 'center',
  },
  cancelBtnText: { color: Colors.red, fontSize: 14, fontWeight: 'bold' },

  footer: {
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  footerBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  footerBtnText: { fontSize: 16, fontWeight: 'bold', color: BRAND_TEXT },
  flexOne: { flex: 1 },
  scrollContent: { padding: 20 },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: BRAND_MUTED,
    fontWeight: '600',
  },
  noItemsBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noItemsText: {
    fontSize: 14,
    color: BRAND_MUTED,
    textAlign: 'center',
  },
  statusWeight: { color: BRAND_PRIMARY, fontWeight: '800' },
});
