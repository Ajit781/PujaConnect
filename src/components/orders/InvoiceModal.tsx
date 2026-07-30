import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  PermissionsAndroid,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { generatePDF } from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';
import { useToast } from '../../context/ToastContext';
import {
  ShieldCheck,
  Download,
  X,
  Phone,
  FileText,
} from 'lucide-react-native';

const appLogo = require('../../assets/images/Logo.webp');
const { height } = Dimensions.get('window');

interface InvoiceModalProps {
  visible: boolean;
  onClose: () => void;
  invoiceData: any;
}

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateString;
  }
};

const formatCurrency = (val: any) => {
  const num = Number(val);
  if (isNaN(num)) return '₹0.00';
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function InvoiceModal({ visible, onClose, invoiceData }: InvoiceModalProps) {
  const { showToast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  if (!invoiceData) return null;

  const data = Array.isArray(invoiceData) && invoiceData.length > 0 ? invoiceData[0] : invoiceData;

  const orderNo = data.order_reference || (data.order_id ? `ORD-${data.order_id}` : 'N/A');
  const orderDate = data.order_date || new Date().toISOString();
  const billedName = data.ctzn_full_name || 'Customer';
  const billedPhone = data.ctzn_contact_no || 'N/A';

  const bookings = data.booking_details || [];

  const orderAmount = data.order_amount || data.order_payble_amount || 0;
  const totalPlatformCharges = data.total_platform_fee || 0;
  const platformFee = data.platform_fee || 0;
  const gst = data.gst_amount || 0;
  const grandTotal = data.total_order_amount || data.order_total_amount || (orderAmount + totalPlatformCharges);

  const totalPackagesCount = bookings.reduce(
    (acc: number, b: any) => acc + (b.package_details?.length || 0),
    0,
  ) || 0;

  const downloadPDF = async () => {
    setIsDownloading(true);
    try {
      if (Platform.OS === 'android' && Platform.Version < 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          showToast({ message: 'Storage permission required', type: 'error' });
          setIsDownloading(false);
          return;
        }
      }

      let htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Helvetica, Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
              .header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
              .invoice-title { font-size: 28px; font-weight: bold; color: #D46B08; margin: 0; }
              .ord-id { font-size: 14px; color: #666; font-weight: bold; margin-top: 4px; }
              .booking-card { border: 1px solid #E5E7EB; border-radius: 12px; margin-bottom: 20px; overflow: hidden; }
              .booking-header { background-color: #FAFAFA; padding: 12px; font-weight: bold; font-size: 13px; border-bottom: 1px solid #E5E7EB; }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 12px; text-align: left; font-size: 13px; }
              .amt-col { text-align: right; font-weight: bold; }
              .totals-box { border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; margin-bottom: 20px; }
              .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
              .grand-total { border-top: 2px solid #D46B08; padding-top: 10px; font-size: 18px; font-weight: bold; color: #D46B08; display: flex; justify-content: space-between; }
            </style>
          </head>
          <body>
            <div class="header-row">
              <div>
                <div class="invoice-title">Pujora</div>
                <div style="color:#666">Puja services invoice</div>
                <div class="ord-id">${orderNo}</div>
              </div>
              <div style="text-align: right">
                <div style="font-size: 12px; color: #666">Billed To: ${billedName} (${billedPhone})</div>
                <div style="font-size: 12px; color: #666">Date: ${formatDate(orderDate)}</div>
              </div>
            </div>
      `;

      bookings.forEach((booking: any, bIdx: number) => {
        const ref = booking.booking_number || `PB-${booking.booking_id}`;
        const packages = booking.package_details || [];
        const subtotal = booking.booking_amount || 0;

        htmlContent += `
          <div class="booking-card">
            <div class="booking-header">BOOKING ${bIdx + 1}: ${ref}</div>
            <table>
        `;

        packages.forEach((pkg: any, pIndex: number) => {
          const name = pkg.package_name || 'Puja package';
          const amt = pkg.package_amount || 0;
          htmlContent += `
            <tr>
              <td>${pIndex + 1}</td>
              <td>${name}</td>
              <td class="amt-col">${formatCurrency(amt)}</td>
            </tr>
          `;
        });

        htmlContent += `
              <tr style="background-color: #FFF7ED; font-weight: bold; color: #D46B08">
                <td colspan="2">Booking total</td>
                <td class="amt-col">${formatCurrency(subtotal)}</td>
              </tr>
            </table>
          </div>
        `;
      });

      htmlContent += `
            <div class="totals-box">
              <div class="total-row">
                <span>Puja services</span>
                <span>${formatCurrency(orderAmount)}</span>
              </div>
              <div class="total-row">
                <span>Platform fee</span>
                <span>${formatCurrency(platformFee)}</span>
              </div>
              <div class="total-row">
                <span>GST on platform fee</span>
                <span>${formatCurrency(gst)}</span>
              </div>
              <div class="total-row" style="font-weight: bold; border-top: 1px solid #E5E7EB; padding-top: 8px">
                <span>Platform charges total</span>
                <span>${formatCurrency(totalPlatformCharges)}</span>
              </div>
              <div class="grand-total">
                <span>Grand total</span>
                <span>${formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </body>
        </html>
      `;

      const options = {
        html: htmlContent,
        fileName: `Invoice_${orderNo}`,
        directory: 'Documents',
      };

      const file = await generatePDF(options);

      if (Platform.OS === 'android' && file.filePath) {
        const downloadPath = `${RNFS.DownloadDirectoryPath}/Invoice_${orderNo}.pdf`;
        await RNFS.copyFile(file.filePath, downloadPath);
        Alert.alert('Success', `PDF saved to Downloads:\nInvoice_${orderNo}.pdf`);
      } else {
        Alert.alert('Success', 'PDF generated successfully!');
      }
    } catch (err) {
      console.error('PDF Generation error:', err);
      Alert.alert('Error', 'Failed to generate PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* ── Top Header Bar ── */}
          <View style={styles.headerBar}>
            <View style={styles.headerLeftRow}>
              <View style={styles.headerIconWrap}>
                <FileText color="#D46B08" size={20} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Invoice preview</Text>
                <Text style={styles.headerSubTitle}>{orderNo}</Text>
              </View>
            </View>

            <View style={styles.headerRightActions}>
              <TouchableOpacity
                style={styles.pdfBtn}
                onPress={downloadPDF}
                disabled={isDownloading}
              >
                <Download color="#FFF" size={16} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeCircleBtn}>
                <X color="#6B7280" size={18} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Scrollable Body with Grey Background ── */}
          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ── White Main Invoice Card with Orange Accent Bar ── */}
            <View style={styles.mainCard}>
              {/* Logo & Subtitle */}
              <View style={styles.brandRow}>
                <Image source={appLogo} style={styles.logoImage} resizeMode="contain" />
                <Text style={styles.brandSub}>Puja services invoice</Text>
              </View>

              {/* Invoice Reference Info */}
              <View style={styles.refInfoSection}>
                <Text style={styles.sectionSmallLabel}>INVOICE REFERENCE</Text>
                <Text style={styles.refNumberText}>{orderNo}</Text>
                <Text style={styles.generatedDateText}>
                  Generated {formatDate(orderDate) || '29 Jul 2026'}
                </Text>
              </View>

              <View style={styles.divider} />

              {/* Billed To Card */}
              <View style={styles.infoCard}>
                <Text style={styles.billedToLabel}>BILLED TO</Text>
                <Text style={styles.customerNameText}>{billedName}</Text>
                {billedPhone !== 'N/A' && (
                  <View style={styles.phoneRow}>
                    <Phone color="#9CA3AF" size={14} style={{ marginRight: 6 }} />
                    <Text style={styles.phoneText}>{billedPhone}</Text>
                  </View>
                )}
              </View>

              {/* Order Information Card */}
              <View style={styles.infoCard}>
                <Text style={styles.sectionSmallLabel}>ORDER INFORMATION</Text>
                <View style={styles.metaDataRow}>
                  <Text style={styles.metaDataLabel}>Order reference</Text>
                  <Text style={styles.metaDataVal} numberOfLines={2}>
                    {orderNo}
                  </Text>
                </View>
                <View style={[styles.metaDataRow, { marginTop: 6 }]}>
                  <Text style={styles.metaDataLabel}>Bookings</Text>
                  <Text style={styles.metaDataVal}>{bookings.length || 1}</Text>
                </View>
              </View>

              {/* Order Items Header */}
              <View style={styles.itemsHeaderRow}>
                <View>
                  <Text style={styles.sectionSmallLabel}>ORDER ITEMS</Text>
                  <Text style={styles.itemsHeaderTitle}>Puja bookings</Text>
                </View>
                <Text style={styles.itemsCountText}>{totalPackagesCount} packages</Text>
              </View>

              {/* Bookings List Cards */}
              {bookings.map((booking: any, bIndex: number) => {
                const ref = booking.booking_number || `PB-${booking.booking_id}`;
                const packages = booking.package_details || [];
                const subtotal = booking.booking_amount || 0;

                return (
                  <View key={bIndex} style={styles.bookingCard}>
                    {/* Header */}
                    <View style={styles.bookingCardHeader}>
                      <Text style={styles.bookingIndexText}>BOOKING {bIndex + 1}</Text>
                      <Text style={styles.bookingRefText}>{ref}</Text>
                    </View>

                    {/* Package Rows */}
                    {packages.map((pkg: any, pIndex: number) => {
                      const name = pkg.package_name || 'Puja package';
                      const amt = pkg.package_amount || 0;
                      return (
                        <View key={pIndex} style={styles.pkgRow}>
                          <Text style={styles.pkgIndexText}>{pIndex + 1}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.pkgNameText}>{name}</Text>
                            <Text style={styles.pkgPriceText}>{formatCurrency(amt)}</Text>
                          </View>
                        </View>
                      );
                    })}

                    {/* Booking Total Cream Bar */}
                    <View style={styles.bookingTotalBar}>
                      <Text style={styles.bookingTotalLabel}>Booking total</Text>
                      <Text style={styles.bookingTotalVal}>{formatCurrency(subtotal)}</Text>
                    </View>
                  </View>
                );
              })}

              {/* Breakdown Card */}
              <View style={styles.breakdownCard}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Puja services</Text>
                  <Text style={styles.breakdownVal}>{formatCurrency(orderAmount)}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Platform fee</Text>
                  <Text style={styles.breakdownVal}>{formatCurrency(platformFee)}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>GST on platform fee</Text>
                  <Text style={styles.breakdownVal}>{formatCurrency(gst)}</Text>
                </View>

                <View style={styles.breakdownDivider} />

                <View style={styles.breakdownRowBold}>
                  <Text style={styles.breakdownLabelBold}>Platform charges total</Text>
                  <Text style={styles.breakdownValBold}>
                    {formatCurrency(totalPlatformCharges)}
                  </Text>
                </View>

                <View style={styles.orangeLine} />

                <View style={styles.grandTotalRow}>
                  <Text style={styles.grandTotalLabel}>Grand total</Text>
                  <Text style={styles.grandTotalVal}>{formatCurrency(grandTotal)}</Text>
                </View>
              </View>

              {/* System Note Footer */}
              <View style={styles.noteDivider} />
              <View style={styles.noteRow}>
                <ShieldCheck color="#10B981" size={18} style={{ marginRight: 8, marginTop: 2 }} />
                <Text style={styles.noteText}>
                  This is a system-generated invoice for order {orderNo}. No signature is required.
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    width: '100%',
    height: height * 0.9,
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },

  // Header Bar
  headerBar: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  headerSubTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pdfBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FF5500',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Body
  bodyScroll: {
    flex: 1,
  },
  bodyContent: {
    padding: 14,
    paddingBottom: 30,
  },

  // Main Card
  mainCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderTopWidth: 5,
    borderTopColor: '#FF5500',
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },

  // Logo & Subtitle
  brandRow: {
    marginBottom: 16,
  },
  logoImage: {
    width: 120,
    height: 36,
  },
  brandSub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },

  // Ref section
  refInfoSection: {
    marginBottom: 14,
  },
  sectionSmallLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.6,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  refNumberText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  generatedDateText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 14,
  },

  // Info card (Billed to / Order Info)
  infoCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 14,
  },
  billedToLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D46B08',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  customerNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  phoneText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },

  metaDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaDataLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  metaDataVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    maxWidth: '60%',
    textAlign: 'right',
  },

  // Items section header
  itemsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 6,
    marginBottom: 12,
  },
  itemsHeaderTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  itemsCountText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },

  // Booking Card
  bookingCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
    overflow: 'hidden',
  },
  bookingCardHeader: {
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  bookingIndexText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  bookingRefText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  pkgRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  pkgIndexText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '600',
    width: 24,
  },
  pkgNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  pkgPriceText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  bookingTotalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bookingTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#D46B08',
  },
  bookingTotalVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#D46B08',
  },

  // Breakdown Card
  breakdownCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginTop: 6,
    marginBottom: 14,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#4B5563',
  },
  breakdownVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  breakdownRowBold: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  breakdownLabelBold: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  breakdownValBold: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  orangeLine: {
    height: 2,
    backgroundColor: '#FF5500',
    marginBottom: 10,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FF5500',
  },
  grandTotalVal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FF5500',
  },

  // Note Footer
  noteDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  noteText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    flex: 1,
  },
});
