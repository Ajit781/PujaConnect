import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { X } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export interface PackageComparisonItem {
  package_id: number;
  package_name: string;
  package_description?: string;
  package_price: number;
  pandit_count?: number;
  package_duration_hours?: number;
  duration_hours?: number;
  includes_samagri?: number;
  procedure_involved?: string;
  materials?: string[];
}

interface PackageComparisonModalProps {
  visible: boolean;
  pujaTitle: string;
  packages: PackageComparisonItem[];
  onClose: () => void;
  onSelectPackage: (pkg: PackageComparisonItem) => void;
}

export default function PackageComparisonModal({
  visible,
  pujaTitle,
  packages,
  onClose,
  onSelectPackage,
}: PackageComparisonModalProps) {
  if (!visible || packages.length === 0) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCardContainer}>
          {/* ── Header Matching Web Screenshot 100% ── */}
          <View style={styles.header}>
            <View style={StyleSheet.absoluteFill}>
              <Svg height="100%" width="100%">
                <Defs>
                  <LinearGradient id="compModalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#FF9933" />
                    <Stop offset="100%" stopColor="#E07800" />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill="url(#compModalGrad)" />
              </Svg>
            </View>

            <Text style={styles.headerTitle} numberOfLines={1}>
              Compare packages
            </Text>

            <TouchableOpacity
              style={styles.closeBtn}
              activeOpacity={0.8}
              onPress={onClose}
            >
              <X size={20} color="#E8700A" />
            </TouchableOpacity>
          </View>

          {/* ── Matrix Body ── */}
          <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyContent}>
            <View style={styles.tableCardContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View style={styles.tableWrapper}>
                  {/* Row 1: Package */}
                  <View style={styles.row}>
                    <View style={styles.labelCol}>
                      <Text style={styles.labelTitle}>Package</Text>
                    </View>
                    {packages.map((pkg) => (
                      <View key={`name-${pkg.package_id}`} style={styles.dataCol}>
                        <Text style={styles.packageNameText}>
                          {pkg.package_name}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Row 2: Starting price */}
                  <View style={styles.row}>
                    <View style={styles.labelCol}>
                      <Text style={styles.labelTitle}>Starting price</Text>
                    </View>
                    {packages.map((pkg) => (
                      <View key={`price-${pkg.package_id}`} style={styles.dataCol}>
                        <Text style={styles.priceText}>
                          ₹{pkg.package_price ? pkg.package_price.toLocaleString('en-IN') : '0'}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Row 3: Duration & Pandit count */}
                  <View style={styles.row}>
                    <View style={styles.labelCol}>
                      <Text style={styles.labelTitle}>Duration & Pandit count</Text>
                    </View>
                    {packages.map((pkg) => {
                      const duration = pkg.package_duration_hours || pkg.duration_hours || 2;
                      const count = pkg.pandit_count || 1;
                      return (
                        <View key={`duration-${pkg.package_id}`} style={styles.dataCol}>
                          <Text style={styles.specText}>{duration} hr</Text>
                          <Text style={styles.specText}>{count} priest{count > 1 ? 's' : ''}</Text>
                        </View>
                      );
                    })}
                  </View>

                  {/* Row 4: Procedure Involved */}
                  <View style={styles.row}>
                    <View style={styles.labelCol}>
                      <Text style={styles.labelTitle}>Procedure Involved</Text>
                    </View>
                    {packages.map((pkg) => (
                      <View key={`procedure-${pkg.package_id}`} style={styles.dataCol}>
                        <Text style={styles.descText}>
                          {pkg.procedure_involved || pkg.package_description || 'arati'}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Row 5: Materials Included */}
                  <View style={styles.row}>
                    <View style={styles.labelCol}>
                      <Text style={styles.labelTitle}>Materials Included</Text>
                    </View>
                    {packages.map((pkg) => {
                      const isIncluded = pkg.includes_samagri === 1 || pkg.includes_samagri === undefined;
                      const materialsList = pkg.materials && pkg.materials.length > 0
                        ? pkg.materials.join(', ')
                        : 'Kumkum, Turmeric Powder, Camphor, Incense';
                      return (
                        <View key={`samagri-${pkg.package_id}`} style={styles.dataCol}>
                          <Text style={styles.statusText}>{isIncluded ? 'Included' : 'Not Included'}</Text>
                          {isIncluded && (
                            <Text style={styles.materialsSubText} numberOfLines={2}>
                              <Text style={{ fontWeight: '500' }}>Materials:</Text> {materialsList}
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </View>

                  {/* Row 6: Next step */}
                  <View style={[styles.row, { borderBottomWidth: 0 }]}>
                    <View style={styles.labelCol}>
                      <Text style={styles.labelTitle}>Next step</Text>
                    </View>
                    {packages.map((pkg) => (
                      <View key={`action-${pkg.package_id}`} style={styles.dataColAction}>
                        <TouchableOpacity
                          style={styles.selectBtn}
                          activeOpacity={0.85}
                          onPress={() => {
                            onClose();
                            onSelectPackage(pkg);
                          }}
                        >
                          <Text style={styles.selectBtnText}>Select package</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const COL_WIDTH = width * 0.48;
const LABEL_WIDTH = width * 0.38;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 9999,
  },
  modalCardContainer: {
    backgroundColor: '#FFFDF6',
    borderRadius: 20,
    width: '100%',
    maxHeight: height * 0.8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
    zIndex: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1,
  },
  modalBody: {
    maxHeight: height * 0.7,
  },
  modalBodyContent: {
    padding: 16,
  },
  tableCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
    overflow: 'hidden',
  },
  tableWrapper: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8DC',
    minHeight: 56,
  },
  labelCol: {
    width: LABEL_WIDTH,
    backgroundColor: '#FFF4E6',
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F3E8DC',
  },
  labelTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9C6644',
    lineHeight: 18,
  },
  dataCol: {
    width: COL_WIDTH,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F3E8DC',
  },
  dataColAction: {
    width: COL_WIDTH,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F3E8DC',
  },
  packageNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1917',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#374151',
  },
  specText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 18,
  },
  descText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 18,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#374151',
  },
  materialsSubText: {
    fontSize: 11,
    fontWeight: '400',
    color: '#786C66',
    marginTop: 4,
    lineHeight: 15,
  },
  selectBtn: {
    backgroundColor: '#E8700A',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
