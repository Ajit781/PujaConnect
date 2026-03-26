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
import { Order, OrderItem } from '../../store/slices/orderSlice';
import RescheduleOrderModal from './RescheduleOrderModal';
import RescheduleSuccessModal from './RescheduleSuccessModal';
import CancelOrderModal from './CancelOrderModal';
import CancelSuccessModal from './CancelSuccessModal';

const { height } = Dimensions.get('window');

import { Colors } from '../../constants/Colors';

const BRAND_PRIMARY = Colors.primary;
const BRAND_TEXT = Colors.textMain;
const BRAND_MUTED = Colors.textMuted;

interface Props {
  visible: boolean;
  order: Order;
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

  const handleReschedule = (item: OrderItem) => {
    setActiveRescheduleItem(item);
  };

  const handleCancelItem = (item: OrderItem) => {
    setActiveCancelItem(item);
  };

  const renderPujaItem = (item: OrderItem, index: number) => {
    return (
      <View style={styles.itemBox} key={item.id}>
        <View style={styles.itemHeader}>
          <View style={styles.itemTitleRow}>
            <View style={styles.itemIndexBox}>
              <Text style={styles.itemIndexText}>{index + 1}</Text>
            </View>
            <View>
              <Text style={styles.itemTitle}>
                {isBn ? item.titleBn : item.titleEn}
              </Text>
              <Text style={styles.itemSubTitle}>Basic Package Details</Text>
            </View>
          </View>
          <Text style={styles.itemPriceText}>
            ₹{item.price.toLocaleString('en-IN')}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statIcon}>👥</Text>
            <Text style={styles.statLabel}>PANDITS</Text>
            <Text style={styles.statValue}>{item.pandits}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statIcon}>🕒</Text>
            <Text style={styles.statLabel}>DURATION</Text>
            <Text style={styles.statValue}>{item.duration}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statIcon}>₹</Text>
            <Text style={styles.statLabel}>AMOUNT</Text>
            <Text style={styles.statValue}>
              ₹{item.price.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        <View style={styles.descBox}>
          <Text style={styles.descIcon}>📦</Text>
          <Text style={styles.descText}>
            Puja performed at home with essential rituals.
          </Text>
        </View>

        <View style={styles.sessionsBox}>
          <Text style={styles.sessionsHeader}>📅 SCHEDULED SESSIONS</Text>
          <View style={styles.sessionRow}>
            <View style={styles.sessionIndex}>
              <Text style={styles.itemIndexText}>1</Text>
            </View>
            <View>
              <Text style={styles.sessionDate}>
                {formatDate(item.scheduledDate)}
              </Text>
              <Text style={styles.sessionTime}>{item.scheduledTime}</Text>
            </View>
            <View style={styles.flexOne} />
            <Text style={{ ...styles.statLabel, color: BRAND_PRIMARY }}>
              {item.status}
            </Text>
          </View>
        </View>

        {(item.status === 'Upcoming' || item.status === 'Rescheduled') && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.rescheduleBtn}
              onPress={() => handleReschedule(item)}
            >
              <Text style={styles.rescheduleBtnText}>🔄 Reschedule</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => handleCancelItem(item)}
            >
              <Text style={styles.cancelBtnText}>✖ Cancel This Puja</Text>
            </TouchableOpacity>
          </View>
        )}
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
                      ✨ {order.items.length} Pujas
                    </Text>
                  </View>
                </View>
                <Text style={styles.modalTitleRef}>{order.bookingRef}</Text>
                <Text style={styles.modalSubRef}>
                  Booked on {formatDate(order.datePlaced)}
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
            {order.items.map((item, idx) => renderPujaItem(item, idx))}
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
          orderId={order.id}
          item={activeRescheduleItem}
          onClose={() => setActiveRescheduleItem(null)}
          onSuccess={updatedItem => {
            setActiveRescheduleItem(null);
            setRescheduledItem(updatedItem);
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
          orderId={order.id}
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
  itemTitleRow: { flexDirection: 'row', gap: 12 },
  itemIndexBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND_PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemIndexText: { color: Colors.white, fontWeight: 'bold', fontSize: 14 },
  itemTitle: { fontSize: 16, fontWeight: 'bold', color: BRAND_TEXT },
  itemSubTitle: { fontSize: 12, color: BRAND_PRIMARY, marginTop: 2 },
  itemPriceText: { fontSize: 16, fontWeight: 'bold', color: Colors.red },

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
});
