import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { OrderItem } from '../../store/slices/orderSlice';

interface Props {
  visible: boolean;
  item: OrderItem;
  onClose: () => void;
}

const BRAND_PRIMARY = '#F97316';
const BRAND_TEXT = '#291811';
const BRAND_MUTED = '#6B5E59';

export default function RescheduleSuccessModal({
  visible,
  item,
  onClose,
}: Props) {
  const { i18n } = useTranslation();
  const isBn = i18n.language === 'bn';

  const formatDateWithDay = (dateString: string) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      const days = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];
      const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      return `${days[d.getDay()]}, ${d.getDate()} ${
        months[d.getMonth()]
      } ${d.getFullYear()}`;
    } catch {
      return dateString;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.iconContainer}>
            <View style={styles.iconBg}>
              <Text style={styles.iconEmoji}>📅</Text>
              <View style={styles.checkBadge}>
                <Text
                  style={{
                    fontSize: 16,
                    color: BRAND_PRIMARY,
                    fontWeight: 'bold',
                  }}
                >
                  ✓
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.title}>
            {isBn ? 'পুনর্নির্ধারিত!' : 'Rescheduled!'}
          </Text>
          <Text style={styles.subtitle}>
            {isBn
              ? 'আপনার পূজা সফলভাবে পুনর্নির্ধারিত করা হয়েছে।'
              : 'Your puja has been successfully rescheduled.'}
          </Text>

          <View style={styles.ticketBox}>
            <View style={styles.ticketHeader}>
              <Text style={styles.ticketTitle}>
                🙏 {isBn ? item.titleBn : item.titleEn}
              </Text>
            </View>
            <View style={styles.ticketBody}>
              <Text style={styles.ticketDate}>
                📅 {formatDateWithDay(item.scheduledDate)}
              </Text>
              <Text style={styles.ticketTime}>🕒 {item.scheduledTime}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>{isBn ? 'সম্পন্ন' : 'Done'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconBg: {
    width: 64,
    height: 64,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconEmoji: { fontSize: 32 },
  checkBadge: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: BRAND_PRIMARY,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  ticketBox: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
    marginBottom: 24,
    overflow: 'hidden',
  },
  ticketHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FFEDD5',
  },
  ticketTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: BRAND_PRIMARY,
  },
  ticketBody: {
    padding: 12,
    gap: 8,
  },
  ticketDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: BRAND_TEXT,
  },
  ticketTime: {
    fontSize: 12,
    color: BRAND_MUTED,
  },
  doneBtn: {
    backgroundColor: BRAND_PRIMARY,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
