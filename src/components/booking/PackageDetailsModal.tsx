import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Clock, Users, Gift, X } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';

interface PackageDetailsModalProps {
  visible: boolean;
  pkg: any;
  onClose: () => void;
  onSelect: () => void;
  isBn: boolean;
}

export default function PackageDetailsModal({
  visible,
  pkg,
  onClose,
  onSelect,
  isBn,
}: PackageDetailsModalProps) {
  if (!pkg) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerSubtitle}>
                {isBn ? 'প্যাকেজ বিস্তারিত' : 'PACKAGE DETAILS'}
              </Text>
              <Text style={styles.headerTitle}>{pkg.puja_package_name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color="#fff" size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} bounces={false}>
            {/* Price Box */}
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>
                {isBn ? 'মোট প্যাকেজ মূল্য' : 'Total package price'}
              </Text>
              <Text style={styles.priceValue}>
                ₹{pkg.puja_package_price.toLocaleString('en-IN')}
              </Text>
            </View>

            {/* Description */}
            {pkg.puja_package_description ? (
              <Text style={styles.description}>
                {pkg.puja_package_description}
              </Text>
            ) : (
              <Text style={styles.description}>
                {isBn
                  ? 'উন্নতমানের পূজার ব্যবস্থা'
                  : 'Detailed puja with all arrangements'}
              </Text>
            )}

            {/* Info Cards */}
            <View style={styles.infoCardsRow}>
              <View style={styles.infoCard}>
                <Clock color="#E8711E" size={24} style={styles.infoIcon} />
                <Text style={styles.infoLabel}>
                  {isBn ? 'সময়কাল' : 'Duration'}
                </Text>
                <Text style={styles.infoValue}>
                  {pkg.puja_duration} {isBn ? 'ঘণ্টা' : 'hours'}
                </Text>
              </View>
              <View style={styles.infoCard}>
                <Users color="#E8711E" size={24} style={styles.infoIcon} />
                <Text style={styles.infoLabel}>
                  {isBn ? 'পুরোহিত' : 'Pandits'}
                </Text>
                <Text style={styles.infoValue}>{pkg.pandit_count}</Text>
              </View>
              <View style={styles.infoCard}>
                <Gift color="#E8711E" size={24} style={styles.infoIcon} />
                <Text style={styles.infoLabel}>
                  {isBn ? 'উপকরণ' : 'Materials'}
                </Text>
                <Text style={styles.infoValue}>
                  {isBn ? 'অন্তর্ভুক্ত' : 'Included'}
                </Text>
              </View>
            </View>

            {/* Included items */}
            <View style={styles.includedSection}>
              <Text style={styles.includedTitle}>
                {isBn ? 'যা অন্তর্ভুক্ত' : 'What is included'}
              </Text>
              <Text style={styles.includedText}>
                {isBn ? 'সম্পূর্ণ বৈদিক আচার' : 'Complete Vedic ritual'}
              </Text>
              {pkg.materials && pkg.materials.length > 0 && (
                <View style={{ marginTop: 8 }}>
                  {pkg.materials.map((m: any, i: number) => (
                    <Text key={i} style={styles.includedText}>
                      • {m.name}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer actions */}
          <SafeAreaView style={{ backgroundColor: '#fff' }}>
            <View style={styles.footer}>
              <TouchableOpacity style={styles.btnOutline} onPress={onClose}>
                <Text style={styles.btnOutlineText}>
                  {isBn ? 'বন্ধ করুন' : 'Close'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSolid} onPress={onSelect}>
                <Text style={styles.btnSolidText}>
                  {isBn ? 'প্যাকেজ নির্বাচন করুন' : 'Select this package'}
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
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
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#E8711E', // Orange from design
    paddingHorizontal: 20,
    paddingVertical: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  closeBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  priceBox: {
    backgroundColor: '#FFF8F3', // Light beige
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  priceLabel: {
    color: '#5C4033', // Dark brown
    fontSize: 13,
    fontWeight: '700',
  },
  priceValue: {
    color: '#D95D14',
    fontSize: 24,
    fontWeight: '800',
  },
  description: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginBottom: 24,
  },
  infoCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  infoCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FAFAFA',
  },
  infoIcon: {
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
  },
  includedSection: {
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 24,
    paddingBottom: 40,
  },
  includedTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#222',
    marginBottom: 12,
  },
  includedText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    gap: 12,
  },
  btnOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  btnOutlineText: {
    color: '#333',
    fontWeight: '700',
    fontSize: 15,
  },
  btnSolid: {
    flex: 1.5,
    backgroundColor: '#E8711E',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  btnSolidText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
});
