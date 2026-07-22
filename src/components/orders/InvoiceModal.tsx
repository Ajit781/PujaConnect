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
} from 'react-native';
import { generatePDF } from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';
import { useToast } from '../../context/ToastContext';
import { Phone } from 'lucide-react-native';

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
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
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

  // Handle case where API returns an array
  const data = Array.isArray(invoiceData) && invoiceData.length > 0 ? invoiceData[0] : invoiceData;

  // Make best-effort guesses at data keys based on common API patterns
  const orderNo = data.order_id ? `ORD-${data.order_id}` : 'N/A';
  const orderDate = new Date().toISOString(); // Using current date as API doesn't provide it
  const billedName = data.ctzn_full_name || 'N/A';
  const billedPhone = data.ctzn_contact_no || 'N/A';
  
  const bookings = data.booking_details || [];

  const orderAmount = data.order_amount || data.order_payble_amount || 0;
  const totalPlatformCharges = data.total_platform_fee || 0;
  const platformFee = data.platform_fee || 0;
  const gst = data.gst_amount || 0;
  const grandTotal = data.total_order_amount || data.order_total_amount || 0;

  const downloadPDF = async () => {
    setIsDownloading(true);
    try {
      if (Platform.OS === 'android') {
        if (Platform.Version < 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            showToast({ message: 'Storage permission required', type: 'error' });
            setIsDownloading(false);
            return;
          }
        }
      }

      // Generate HTML string for PDF
      let htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Helvetica, Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
              .header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
              .invoice-title { font-size: 36px; font-weight: bold; color: #F38015; margin: 0; }
              .ord-id { font-size: 16px; color: #666; font-weight: bold; margin-top: 5px; }
              .order-meta { text-align: right; }
              .order-meta-title { font-size: 12px; font-weight: bold; color: #D97706; }
              .order-meta-val { font-size: 16px; font-weight: bold; color: #000; margin-bottom: 10px; }
              
              .billed-box { border: 1px solid #F38015; border-radius: 8px; padding: 15px; width: 300px; margin-bottom: 30px; background-color: #fffaf0; }
              .billed-title { font-size: 12px; font-weight: bold; color: #D97706; margin: 0 0 10px 0; }
              .billed-name { font-size: 16px; font-weight: bold; color: #000; margin: 0 0 5px 0; }
              .billed-phone { font-size: 14px; color: #666; margin: 0; }
              
              .booking-card { border: 1px solid #FFE4C4; border-radius: 8px; margin-bottom: 30px; overflow: hidden; }
              .booking-header { background-color: #F38015; padding: 10px 15px; color: white; font-weight: bold; font-size: 14px; }
              table { width: 100%; border-collapse: collapse; }
              th { text-align: left; padding: 15px; font-size: 12px; color: #000; }
              td { padding: 15px; border-top: 1px solid #FFE4C4; font-size: 14px; font-weight: bold; }
              .amt-col { text-align: right; }
              .subtotal-row { background-color: #FFF3E0; }
              .subtotal-row td { color: #D97706; border-top: none; }
              
              .totals-box { border: 1px solid #FFE4C4; border-radius: 8px; padding: 20px; margin-top: 20px; }
              .total-row { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 14px; color: #666; }
              .total-row-bold { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 12px; font-weight: bold; color: #666; text-transform: uppercase; }
              .grand-total { display: flex; justify-content: space-between; margin-top: 10px; padding-top: 15px; border-top: 1px dashed #ccc; font-size: 20px; font-weight: bold; color: #D97706; }
            </style>
          </head>
          <body>
            <div class="header-row">
              <div>
                <h1 class="invoice-title">INVOICE</h1>
                <div class="ord-id">${orderNo}</div>
              </div>
              <div class="order-meta">
                <div class="order-meta-title">ORDER NUMBER</div>
                <div class="order-meta-val">${orderNo}</div>
                <div class="order-meta-title">DATE</div>
                <div class="order-meta-val">${formatDate(orderDate)}</div>
              </div>
            </div>
            
            <div class="billed-box">
              <p class="billed-title">BILLED TO</p>
              <p class="billed-name">${billedName}</p>
              <p class="billed-phone">${billedPhone}</p>
            </div>
      `;

      bookings.forEach((booking: any) => {
        const ref = booking.booking_number || 'N/A';
        const packages = booking.package_details || [];
        const subtotal = booking.booking_amount || 0;

        htmlContent += `
          <div class="booking-card">
            <div class="booking-header">BOOKING REFERENCE: ${ref}</div>
            <table>
              <thead>
                <tr>
                  <th>SL NO</th>
                  <th>PACKAGE NAME</th>
                  <th class="amt-col">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
        `;

        packages.forEach((pkg: any, index: number) => {
          const name = pkg.package_name || 'Package';
          const amt = pkg.package_amount || 0;
          htmlContent += `
            <tr>
              <td>${index + 1}</td>
              <td>${name}</td>
              <td class="amt-col">${formatCurrency(amt)}</td>
            </tr>
          `;
        });

        htmlContent += `
              <tr class="subtotal-row">
                <td colspan="2">Subtotal for Booking</td>
                <td class="amt-col">${formatCurrency(subtotal)}</td>
              </tr>
              </tbody>
            </table>
          </div>
        `;
      });

      htmlContent += `
            <div class="totals-box">
              <div class="total-row">
                <span>ORDER AMOUNT</span>
                <span style="font-weight: bold; color: #000">${formatCurrency(orderAmount)}</span>
              </div>
              <div class="total-row-bold">
                <span>TOTAL PLATFORM CHARGES</span>
                <span style="color: #000">${formatCurrency(totalPlatformCharges)}</span>
              </div>
              <div class="total-row">
                <span>Platform Fee</span>
                <span style="font-weight: bold; color: #000">${formatCurrency(platformFee)}</span>
              </div>
              <div class="total-row">
                <span>GST on Platform Fee</span>
                <span style="font-weight: bold; color: #000">${formatCurrency(gst)}</span>
              </div>
              <div class="grand-total">
                <span>GRAND TOTAL</span>
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

      console.log('Generating PDF with options:', options);
      const file = await generatePDF(options);
      console.log('PDF Generated successfully at internal path:', file.filePath);
      
      // On Android, RNHTMLtoPDF sometimes places it in a weird path, let's copy to Download folder
      if (Platform.OS === 'android' && file.filePath) {
        const downloadPath = `${RNFS.DownloadDirectoryPath}/Invoice_${orderNo}.pdf`;
        console.log('Copying PDF to Downloads folder at:', downloadPath);
        await RNFS.copyFile(file.filePath, downloadPath);
        console.log('Successfully copied to:', downloadPath);
        Alert.alert('Success', `PDF saved to Downloads:\nInvoice_${orderNo}.pdf`);
      } else {
        console.log('PDF available at:', file.filePath);
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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Invoice Preview</Text>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.downloadBtn} onPress={downloadPDF} disabled={isDownloading}>
                <Text style={styles.downloadBtnText}>
                  {isDownloading ? 'Generating...' : '📥 Download PDF'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {/* Top row with INVOICE and line */}
            <View style={styles.topRow}>
               <Text style={styles.invoiceTitle}>INVOICE</Text>
               <Text style={styles.ordId}>{orderNo}</Text>
            </View>
            <View style={styles.separatorLine} />

            {/* Middle row: Billed To (Left) & Meta (Right) */}
            <View style={styles.middleRow}>
               {/* Billed To */}
               <View style={styles.billedBox}>
                 <Text style={styles.billedLabel}>BILLED TO</Text>
                 <View style={styles.billedRow}>
                    <Phone color="#666" size={14} style={{ marginRight: 6 }} />
                    <Text style={styles.billedPhone}>{billedPhone}</Text>
                 </View>
               </View>

               {/* Meta Right */}
               <View style={styles.orderMetaRight}>
                 <Text style={styles.metaLabel}>ORDER NUMBER</Text>
                 <Text style={styles.metaValue}>{orderNo}</Text>
                 <Text style={[styles.metaLabel, { marginTop: 12 }]}>DATE</Text>
                 <Text style={styles.metaValue}>{formatDate(orderDate)}</Text>
               </View>
            </View>

            {/* Bookings */}
            {bookings.map((booking: any, bIndex: number) => {
              const ref = booking.booking_number || 'N/A';
              const packages = booking.package_details || [];
              const subtotal = booking.booking_amount || 0;

              return (
                <View key={bIndex} style={styles.bookingCard}>
                  <View style={styles.bookingHeader}>
                    <Text style={styles.bookingHeaderTxt}>BOOKING REFERENCE: {ref}</Text>
                  </View>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.th, { flex: 0.5 }]}>#</Text>
                    <Text style={[styles.th, { flex: 3 }]}>PACKAGE NAME</Text>
                    <Text style={[styles.th, { flex: 1.5, textAlign: 'right' }]}>AMOUNT</Text>
                  </View>
                  {packages.map((pkg: any, pIndex: number) => {
                    const name = pkg.package_name || 'Package';
                    const amt = pkg.package_amount || 0;
                    return (
                      <View key={pIndex} style={styles.tr}>
                        <Text style={[styles.td, { flex: 0.5, color: '#666', fontWeight: 'normal' }]}>{pIndex + 1}</Text>
                        <Text style={[styles.td, { flex: 3, fontWeight: 'normal' }]}>{name}</Text>
                        <Text style={[styles.td, { flex: 1.5, textAlign: 'right', fontWeight: 'normal' }]}>{formatCurrency(amt)}</Text>
                      </View>
                    );
                  })}
                  <View style={styles.subtotalRow}>
                    <Text style={[styles.subtotalLabel, { flex: 3.5 }]}>Booking Amount</Text>
                    <Text style={[styles.subtotalValue, { flex: 1.5, textAlign: 'right' }]}>{formatCurrency(subtotal)}</Text>
                  </View>
                </View>
              );
            })}

            {/* Totals */}
            <View style={styles.totalsBox}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>ORDER AMOUNT</Text>
                <Text style={styles.totalValBlackBold}>{formatCurrency(orderAmount)}</Text>
              </View>
              
              <View style={[styles.totalRow, { marginTop: 15 }]}>
                <Text style={styles.totalLabel}>TOTAL PLATFORM CHARGES</Text>
                <Text style={styles.totalValBlackBold}>{formatCurrency(totalPlatformCharges)}</Text>
              </View>
              <View style={styles.totalRowLight}>
                <Text style={styles.totalLabelLight}>Platform Fee</Text>
                <Text style={styles.totalValBlackLight}>{formatCurrency(platformFee)}</Text>
              </View>
              <View style={styles.totalRowLight}>
                <Text style={styles.totalLabelLight}>GST on Platform Fee</Text>
                <Text style={styles.totalValBlackLight}>{formatCurrency(gst)}</Text>
              </View>
              <View style={styles.separatorLineLight} />
              <View style={styles.grandTotalRow}>
                <Text style={styles.grandTotalLabel}>GRAND TOTAL</Text>
                <Text style={styles.grandTotalValue}>{formatCurrency(grandTotal)}</Text>
              </View>
            </View>

            {/* Bottom Close Button */}
            <View style={styles.bottomActions}>
              <TouchableOpacity style={styles.bottomCloseBtn} onPress={onClose}>
                <Text style={styles.bottomCloseBtnText}>Close</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '95%', height: '90%', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F38015', padding: 15 },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  downloadBtn: { backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 15 },
  downloadBtnText: { color: '#F38015', fontSize: 12, fontWeight: 'bold' },
  closeBtn: { padding: 5, paddingHorizontal: 10 },
  closeBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  body: { flex: 1, backgroundColor: '#FFF' },
  bodyContent: { padding: 20 },
  topRow: { flexDirection: 'column', alignItems: 'flex-start' },
  separatorLine: { height: 1, backgroundColor: '#FFDDC1', width: '100%', marginVertical: 20 },
  middleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  invoiceTitle: { fontSize: 32, fontWeight: '900', color: '#D46B08', letterSpacing: 1 },
  ordId: { fontSize: 13, color: '#D46B08', fontWeight: 'bold', marginTop: 5 },
  orderMetaRight: { alignItems: 'flex-end', justifyContent: 'flex-start' },
  metaLabel: { fontSize: 11, color: '#D46B08', fontWeight: '700' },
  metaValue: { fontSize: 16, fontWeight: '900', color: '#111', marginTop: 4 },
  billedBox: { borderWidth: 1, borderColor: '#FFDDC1', borderRadius: 8, padding: 15, width: '45%', backgroundColor: '#FFFDF9' },
  billedLabel: { fontSize: 11, color: '#D46B08', fontWeight: '700', marginBottom: 10 },
  billedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  billedPhone: { fontSize: 14, color: '#666' },
  bookingCard: { borderWidth: 1, borderColor: '#F38015', borderRadius: 8, overflow: 'hidden', marginBottom: 30 },
  bookingHeader: { backgroundColor: '#F38015', padding: 12 },
  bookingHeaderTxt: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  tableHeader: { flexDirection: 'row', padding: 12, backgroundColor: '#FFFDF9', borderBottomWidth: 1, borderBottomColor: '#FFDDC1' },
  th: { fontSize: 11, fontWeight: '700', color: '#111' },
  tr: { flexDirection: 'row', padding: 12, backgroundColor: '#FFF' },
  td: { fontSize: 13, color: '#333' },
  subtotalRow: { flexDirection: 'row', padding: 12, backgroundColor: '#FFF3E0' },
  subtotalLabel: { fontSize: 13, fontWeight: '700', color: '#D46B08' },
  subtotalValue: { fontSize: 13, fontWeight: '700', color: '#D46B08' },
  totalsBox: { borderWidth: 1, borderColor: '#FFDDC1', borderRadius: 12, padding: 20, backgroundColor: '#FFFDF9' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalLabel: { fontSize: 12, fontWeight: '700', color: '#444' },
  totalValBlackBold: { fontSize: 13, fontWeight: 'bold', color: '#111' },
  totalRowLight: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalLabelLight: { fontSize: 13, color: '#666' },
  totalValBlackLight: { fontSize: 13, color: '#111' },
  separatorLineLight: { height: 1, backgroundColor: '#FFDDC1', width: '100%', marginVertical: 15 },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grandTotalLabel: { fontSize: 18, fontWeight: '900', color: '#D46B08' },
  grandTotalValue: { fontSize: 18, fontWeight: '900', color: '#D46B08' },
  bottomActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 30, marginBottom: 20 },
  bottomCloseBtn: { backgroundColor: '#F38015', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  bottomCloseBtnText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
});
