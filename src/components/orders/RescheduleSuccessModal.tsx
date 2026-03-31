import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { OrderItem } from '../../store/slices/orderSlice';

interface Props {
  visible: boolean;
  item: OrderItem;
  onClose: () => void;
}

import { Colors } from '../../constants/Colors';
import { formatTo12Hr } from '../../utils/timeUtils';

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
      // Handle both YYYY-MM-DD and other formats
      const d = dateString.includes('-')
        ? new Date(dateString)
        : new Date(dateString);

      if (isNaN(d.getTime())) return dateString;

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
          {/* Top Logo / Icon */}
          <View style={styles.logoWrapper}>
            <View style={styles.calendarGraphic}>
              <View style={styles.calendarHinge} />
              <Text style={styles.calendarDateText}>31</Text>
            </View>
            <View style={styles.successBadge}>
              <Text style={styles.successCheck}>✓</Text>
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
            <View style={styles.ticketRow}>
              <Text style={styles.pujaIcon}>🙏</Text>
              <Text style={styles.pujaName}>
                {isBn ? item.titleBn : item.titleEn}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailsRow}>
              <Text style={styles.detailText}>
                📅 {formatDateWithDay(item.scheduledDate)}
              </Text>
              <Text style={styles.detailText}>
                🕒 {formatTo12Hr(item.scheduledTime)}
              </Text>
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
    backgroundColor: '#FFFCF5', // Warm light background from image
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  logoWrapper: {
    width: 100,
    height: 100,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarGraphic: {
    width: 60,
    height: 60,
    backgroundColor: '#1E40AF', // Blue color from image
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  calendarHinge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: '#3B82F6',
  },
  calendarDateText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 10,
  },
  successBadge: {
    position: 'absolute',
    top: 15,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FDBA74', // Light orange
    borderWidth: 2,
    borderColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  successCheck: {
    fontSize: 16,
    color: '#D946EF', // Pinkish/Purple check from image
    fontWeight: 'bold',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#EA580C', // Deep orange title
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 18,
  },
  ticketBox: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    padding: 20,
    marginBottom: 32,
  },
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  pujaIcon: { fontSize: 16 },
  pujaName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#EA580C',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 16,
  },
  detailsRow: {
    gap: 12,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  doneBtn: {
    backgroundColor: '#F97316', // Bright orange button
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  doneBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
