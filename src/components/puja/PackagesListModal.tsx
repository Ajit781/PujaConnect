import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { X, CalendarClock, ShieldCheck, Scale, Eye } from 'lucide-react-native';
import { PackageComparisonItem } from './PackageComparisonModal';
import { useToast } from '../../context/ToastContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PackagesListModalProps {
  visible: boolean;
  onClose: () => void;
  pujaData: any;
  packages: any[];
  isLoading: boolean;
  comparePackages: PackageComparisonItem[];
  setComparePackages: (updater: (prev: PackageComparisonItem[]) => PackageComparisonItem[] | PackageComparisonItem[]) => void;
  onCompareNow: () => void;
  onSelectPackage: (pkg: any) => void;
  onViewCompleteDetails: () => void;
}

export default function PackagesListModal({
  visible,
  onClose,
  pujaData,
  packages,
  isLoading,
  comparePackages,
  setComparePackages,
  onCompareNow,
  onSelectPackage,
  onViewCompleteDetails,
}: PackagesListModalProps) {
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    if (visible) {
      console.log('=== [PackagesListModal] packages received for', pujaData?.puja_name, '===', JSON.stringify(packages, null, 2));
    }
  }, [visible, packages, pujaData]);

  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}>
      <View style={styles.packagesModalOverlay}>
        <View style={[styles.packagesModalHeader, { height: 60 }]}>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' }}>
            <Svg height="100%" width="100%">
              <Defs>
                <LinearGradient id="modalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#FF9933" />
                  <Stop offset="100%" stopColor="#E07800" />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="100%" fill="url(#modalGrad)" />
            </Svg>
          </View>
          <Text style={styles.packagesModalTitle} numberOfLines={1}>
            {pujaData?.puja_name || 'Puja'} packages
          </Text>
          <TouchableOpacity style={styles.packagesModalCloseBtn} onPress={onClose}>
            <X size={20} color="#E8700A" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }} style={{ flex: 1, backgroundColor: '#FFFDF6' }}>
          {isLoading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#E65100" />
              <Text style={{ marginTop: 10, color: '#6B7280' }}>Loading packages...</Text>
            </View>
          ) : packages && packages.length > 0 ? (
            packages.map((pkg, index) => {
              const price = pkg.puja_package_price || pkg.maximum_price || 0;
              const duration = pkg.puja_duration || pkg.duration_hours;
              const panditCount = pkg.pandit_count;
              const includesSamagri = pkg.puja_include_samagri === 1 || pkg.includes_samagri === 1;
              const pkgId = pkg.puja_package_id || index;
              const isAlreadyAdded = comparePackages.some((p) => p.package_id === pkgId);

              return (
                <View key={`pkg-${pkgId}`} style={styles.packageCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={styles.packageCardLabel}>PACKAGE</Text>
                    <Text style={styles.packageCardPrice}>₹{price.toLocaleString('en-IN')}</Text>
                  </View>
                  <Text style={styles.packageCardTitle}>{pkg.puja_package_name || 'Package'}</Text>
                  <View style={{ gap: 10, marginBottom: 18 }}>
                    {!!duration && (
                      <View style={styles.packageFeatureItem}>
                        <CalendarClock size={16} color="#E65100" />
                        <Text style={styles.packageFeatureText}>{duration} hr</Text>
                      </View>
                    )}
                    {!!panditCount && (
                      <View style={styles.packageFeatureItem}>
                        <ShieldCheck size={16} color="#E65100" />
                        <Text style={styles.packageFeatureText}>
                          {panditCount} priest{panditCount > 1 ? 's' : ''}
                        </Text>
                      </View>
                    )}
                    <View style={styles.packageFeatureItem}>
                      <ShieldCheck size={16} color="#059669" />
                      <Text style={styles.packageFeatureText}>
                        {includesSamagri ? 'Materials Included' : 'Materials Not Included'}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity style={styles.packageSelectBtn} activeOpacity={0.85} onPress={() => onSelectPackage(pkg)}>
                      <Text style={styles.packageSelectBtnText}>Select</Text>
                    </TouchableOpacity>
                    {packages && packages.length > 1 && (
                      <TouchableOpacity
                        style={[styles.compareBtn, isAlreadyAdded ? styles.compareBtnAdded : styles.compareBtnDefault]}
                        activeOpacity={0.8}
                        onPress={() => {
                          if (isAlreadyAdded) {
                            setComparePackages((prev) => prev.filter((p) => p.package_id !== pkgId));
                          } else {
                            if (comparePackages.length >= 3) {
                              showToast({ message: 'You can compare maximum 3 packages', type: 'error' });
                              return;
                            }
                            const newPkg: PackageComparisonItem = {
                              package_id: pkgId,
                              package_name: pkg.puja_package_name || 'Puja Package',
                              package_description: pkg.puja_package_description || '',
                              package_price: price,
                              pandit_count: panditCount,
                              package_duration_hours: duration,
                              includes_samagri: includesSamagri ? 1 : 0,
                              procedure_involved: pkg.procedure_involved || pkg.puja_package_description || '',
                            };
                            setComparePackages((prev) => [...prev, newPkg]);
                          }
                        }}
                      >
                        <Scale size={16} color={isAlreadyAdded ? '#C84400' : '#4B5563'} />
                        <Text style={[styles.compareBtnText, { color: isAlreadyAdded ? '#C84400' : '#374151' }]}>
                          {isAlreadyAdded ? 'Added' : 'Compare'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          ) : (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: '#6B7280' }}>No packages found for this Puja.</Text>
            </View>
          )}
          {packages && packages.length > 1 && comparePackages.length > 0 && (
            <View style={styles.compareTrayCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Scale size={20} color="#E8700A" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#1C1917' }}>
                    {comparePackages.length} of 3 selected
                  </Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }} numberOfLines={1}>
                    {comparePackages.map((p) => p.package_name).join(' • ')}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={styles.trayClearBtn} onPress={() => setComparePackages([])}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.trayCompareBtn, { backgroundColor: comparePackages.length >= 2 ? '#E8700A' : '#9CA3AF' }]}
                  disabled={comparePackages.length < 2}
                  onPress={onCompareNow}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>Compare now</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          <View style={styles.infoBox}>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <CalendarClock size={20} color="#E8700A" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#1C1917', marginBottom: 2 }}>
                  Schedule with confidence
                </Text>
                <Text style={{ fontSize: 11, color: '#57534E', lineHeight: 16 }}>
                  Available dates and service coverage are confirmed for your address before payment.
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.viewDetailsBtn} onPress={onViewCompleteDetails}>
            <Eye size={18} color="#E8700A" />
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#E8700A' }}>
              View complete puja details
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  packagesModalOverlay: { flex: 1, backgroundColor: '#FFFDF6' },
  packagesModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, overflow: 'hidden' },
  packagesModalTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', zIndex: 1 },
  packagesModalCloseBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3, zIndex: 1 },
  packageCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 18, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  packageCardLabel: { fontSize: 11, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1, textTransform: 'uppercase' },
  packageCardPrice: { fontSize: 20, fontWeight: '900', color: '#E65100' },
  packageCardTitle: { fontSize: 18, fontWeight: '800', color: '#1C1917', marginBottom: 14 },
  packageFeatureItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  packageFeatureText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  packageSelectBtn: { flex: 1, backgroundColor: '#E8700A', paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  packageSelectBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  compareBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, gap: 6 },
  compareBtnDefault: { borderColor: '#D1D5DB', backgroundColor: '#FFFFFF' },
  compareBtnAdded: { borderColor: '#FDBA74', backgroundColor: '#FFF8F0' },
  compareBtnText: { fontSize: 14, fontWeight: '700' },
  compareTrayCard: { backgroundColor: '#FFFDF9', borderRadius: 14, borderWidth: 1, borderColor: '#FDBA74', padding: 12, marginBottom: 10 },
  trayClearBtn: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  trayCompareBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  infoBox: { backgroundColor: '#FFFDF9', borderRadius: 14, borderWidth: 1, borderColor: '#FED7AA', padding: 12, marginBottom: 10 },
  viewDetailsBtn: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E8700A', paddingVertical: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginBottom: 10 },
});
