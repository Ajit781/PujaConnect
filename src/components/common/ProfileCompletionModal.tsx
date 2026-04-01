import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/Colors';

const { width } = Dimensions.get('window');

interface ProfileCompletionModalProps {
  visible: boolean;
  percentage: number;
  onClose: () => void;
  onComplete: () => void;
}

const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({
  visible,
  percentage,
  onClose,
  onComplete,
}) => {
  const { i18n } = useTranslation();
  const isBn = i18n.language === 'bn';

  // Ensure percentage is between 0 and 100
  const displayPercentage = Math.min(100, Math.max(0, Math.round(percentage)));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {isBn ? 'আপনার প্রোফাইল সম্পূর্ণ করুন' : 'Complete your profile'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.content}>
            <Text style={styles.message}>
              {isBn ? (
                <>
                  আপনার প্রোফাইল{' '}
                  <Text style={styles.boldText}>{displayPercentage}%</Text>{' '}
                  সম্পূর্ণ। আপনার প্রোফাইল সম্পূর্ণ করা আমাদের বুকিং এবং
                  সুপারিশগুলো ব্যক্তিগতকৃত করতে সাহায্য করে।
                </>
              ) : (
                <>
                  Your profile is{' '}
                  <Text style={styles.boldText}>{displayPercentage}%</Text>{' '}
                  complete. Completing your profile helps us personalise
                  bookings and recommendations.
                </>
              )}
            </Text>

            {/* Progress Section */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${displayPercentage}%` },
                  ]}
                />
              </View>
              <Text style={styles.percentageText}>{displayPercentage}%</Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={onClose}
                style={styles.laterBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.laterBtnText}>
                  {isBn ? 'পরে' : 'Later'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onComplete}
                style={styles.completeBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.completeBtnText}>
                  {isBn ? 'প্রোফাইল সম্পূর্ণ করুন →' : 'Complete Profile →'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: width * 0.85,
    backgroundColor: '#FFFBEB', // Slightly yellowish background matching image
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeBtn: {
    backgroundColor: Colors.white,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  content: {
    padding: 24,
  },
  message: {
    fontSize: 14,
    color: Colors.textMain,
    lineHeight: 20,
    textAlign: 'left',
    marginBottom: 20,
  },
  boldText: {
    fontWeight: 'bold',
    color: Colors.primary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  progressBarTrack: {
    flex: 1,
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
    marginRight: 15,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#90CAF9', // Light blue fill matching image
    borderRadius: 5,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.textMain,
    width: 40,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  laterBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: Colors.white,
  },
  laterBtnText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  completeBtn: {
    flex: 1,
    marginLeft: 15,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  completeBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ProfileCompletionModal;
