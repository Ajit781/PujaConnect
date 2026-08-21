/* eslint-disable react-native/no-inline-styles */
import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import NetInfo from '@react-native-community/netinfo';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Keyboard,
  Animated,
  Easing,
  RefreshControl,
  StatusBar,
  Modal,
} from 'react-native';
import { decode as base64Decode } from 'base-64';
import { PluralWebView } from '../../components/payment/PluralWebView';
import { startPaytmTransaction } from '../../service/payment/paytmManager';
import { PAYTM_CONFIG } from '../../config/apiConfig';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import {
  removeFromCart,
  clearCart,
  markCartAsSeen,
} from '../../store/slices/cartSlice';
import { showLoader, hideLoader } from '../../store/slices/loaderSlice';
import { placeOrder, Order } from '../../store/slices/orderSlice';
import {
  useGetPujaCartInfoQuery,
  useGetPujaCartSummaryQuery,
  useManagePujaCartMutation,
  useGetAddressesQuery,
  useBookPujaMutation,
} from '../../store/api/pujaApi';
import TopNavBar from '../../components/common/TopNavBar';
import NoDataFound from '../../components/common/NoDataFound';
import { useToast } from '../../context/ToastContext';
import { CustomAlert } from '../../components/common/CustomAlert';
import SchedulePujasModal, {
  ScheduleItemPayload,
} from '../../components/booking/SchedulePujasModal';
import { Colors } from '../../constants/Colors';
import LinearGradient from 'react-native-linear-gradient';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Users,
  Trash2,
  Plus,
  MapPin,
  Sparkles,
  Receipt,
  Star,
} from 'lucide-react-native';

const BRAND_PRIMARY = Colors.primary;
const BRAND_TEXT = Colors.textMain;
const BRAND_MUTED = Colors.textMuted;

export default function CartScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { i18n, t } = useTranslation();
  const isBn = i18n.language === 'bn';
  const { showToast } = useToast();
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    buttons?: any[];
  }>({ visible: false, title: '' });
  const dispatch = useDispatch();
  const [manageCart] = useManagePujaCartMutation();
  const [bookPuja] = useBookPujaMutation();

  useFocusEffect(
    React.useCallback(() => {
      dispatch(markCartAsSeen());
      return () => { };
    }, [dispatch]),
  );

  const user = useSelector((state: RootState) => state.auth.user);
  const [refreshing, setRefreshing] = useState(false);
  const { data: serverAddresses, refetch: refetchAddresses } =
    useGetAddressesQuery(
      { userId: user?.auth_id || user?.user_id || 0, pageNo: 1, pageSize: 100 },
      { skip: !(user?.auth_id || user?.user_id) },
    );

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [isPaymentInitializing, setIsPaymentInitializing] = useState(false);


  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [paymentOrderRef, setPaymentOrderRef] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  useEffect(() => {
    if (route?.params?.confirmedSchedules) {
      const schedules = route.params.confirmedSchedules;
      setPujaScheduleList(schedules);
      handleConfirmOrder(schedules);

      // Clear the param so it doesn't trigger again on subsequent renders
      navigation.setParams({ confirmedSchedules: undefined });
    }
  }, [route?.params?.confirmedSchedules, navigation]);

  const handlePaymentResult = (res: {
    status: 'response' | 'error';
    url?: string;
    reason?: string;
    encData?: string;
    orderId?: string;
  }) => {
    console.log(
      '[CartScreen] 💳 Payment Result Received:',
      JSON.stringify(res, null, 2),
    );
    setPaymentUrl(null); // close WebView

    if (res.status === 'response') {
      // Payment succeeded — show booking confirmed
      setPaymentResult(res);
      setPaymentOrderRef(res.orderId || res.encData || null);
      setPaymentConfirmed(true);
      // Secretly clear the cart now that payment is done
      // Call the API to clear server cart, but also force clear local Redux cart
      handleClearAllCart();
      dispatch(clearCart());
    } else {
      // Payment failed or cancelled
      const isCancelled = res.reason === 'User Cancelled';
      setAlertConfig({
        visible: true,
        title: isCancelled
          ? isBn
            ? 'পেমেন্ট বাতিল'
            : 'Payment Cancelled'
          : isBn
            ? 'পেমেন্ট ব্যর্থ'
            : 'Payment Failed',
        message: isBn
          ? isCancelled
            ? 'আপনি পেমেন্ট প্রক্রিয়াটি বাতিল করেছেন।'
            : 'পেমেন্ট সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।'
          : isCancelled
            ? 'The payment process was cancelled by you.'
            : res.reason || 'Payment could not be completed. Please try again.',
        buttons: [
          {
            text: 'OK',
            onPress: () =>
              setAlertConfig(prev => ({ ...prev, visible: false })),
          },
        ],
      });
    }
  };

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true),
    );
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const addresses = useMemo(() => {
    if (!serverAddresses) return [];

    let allAddresses: any[] = [];
    if (Array.isArray(serverAddresses)) {
      allAddresses = serverAddresses;
    } else {
      // Parse Self Addresses
      if (serverAddresses.citizen_info && Array.isArray(serverAddresses.citizen_info.address_list)) {
        const citizen = serverAddresses.citizen_info;
        const selfAddrs = citizen.address_list.map((a: any) => ({
          ...a,
          full_name: citizen.full_name,
          phone: citizen.phone,
          relation_type_name: 'Self',
          ctzn_id: citizen.auth_id,
        }));
        allAddresses = [...allAddresses, ...selfAddrs];
      }

      // Parse Relative Addresses
      if (Array.isArray(serverAddresses.relative_info)) {
        serverAddresses.relative_info.forEach((rel: any) => {
          if (Array.isArray(rel.address_list)) {
            const relAddrs = rel.address_list.map((a: any) => ({
              ...a,
              full_name: rel.full_name,
              phone: rel.phone,
              relation_type_name: 'Relative',
              ctzn_id: rel.auth_id,
            }));
            allAddresses = [...allAddresses, ...relAddrs];
          }
        });
      }
    }

    return allAddresses.map((a: any) => ({
      id: (a.address_id || a.ctzn_address_id || Date.now()).toString(),
      type: a.address_type || a.address_type_name || 'Home',
      label: a.label || '',
      contactName: a.full_name || a.name || '',
      contactNumber: a.phone || a.contact_no || '',
      relationType: a.relation_type || a.relation_type_name || '',
      addressLine1: a.address || '',
      streetArea: a.street || '',
      landmark: a.landmark || '',
      city: a.city || '',
      state: a.state || '',
      pincode: a.pincode || '',
      latitude: a.latitude?.toString() || '',
      longitude: a.longitude?.toString() || '',
      isDefault: a.is_default === 1 || a.is_default === true,
    }));
  }, [serverAddresses]);

  const [pageNo, setPageNo] = useState(1);
  const itemsPerPage = 10;

  // Fetch full cart (limit 1000) for accurate subtotal calculations
  const {
    data: fullApiCartItems = [],
    isLoading: isFetchingCart,
    refetch: refetchCartInfo,
  } = useGetPujaCartInfoQuery(
    {
      userId: user?.user_id || 0,
      pageNo: 1,
      limit: 1000,
    },
    { skip: !user?.user_id },
  );

  const cartId = fullApiCartItems.length > 0 ? fullApiCartItems[0].cart_id : 0;

  const { data: cartSummary, refetch: refetchCartSummary } =
    useGetPujaCartSummaryQuery(
      { cartId, userId: user?.user_id || 0 },
      { skip: !cartId || !user?.user_id }
    );

  useEffect(() => {
    console.log('Cart Items Details:', fullApiCartItems);
  }, [fullApiCartItems]);

  useEffect(() => {
    console.log('Cart Summary Details:', cartSummary);
  }, [cartSummary]);

  // Local pagination logic
  const totalPages = Math.ceil(fullApiCartItems.length / itemsPerPage);
  const startIndex = (pageNo - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = fullApiCartItems.slice(startIndex, endIndex);

  const cartItemsMapped = currentItems.map(item => ({
    cartItemId: item.cart_item_id.toString(),
    pujaId: item.puja_id.toString(),
    packageId: item.pkg_id,
    titleEn: item.puja_name,
    titleBn: item.puja_name,
    exactPrice: item.pkg_price,
    selectedDate: item.preferred_puja_date,
    selectedTime: item.preferred_puja_time,
    imagePlaceholder: item.icon,
    color: Colors.white,
    pkg_name: item.pkg_name,
    pkg_quantity: item.pkg_quantity,
    duration: item.duration,
    pandits: item.pkg_pandit_qty,
    rating: item.puja_rating,
  }));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchAddresses(),
        refetchCartInfo(),
        refetchCartSummary(),
      ]);
    } catch (err) {
      console.error('Cart refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  }, [refetchAddresses, refetchCartInfo, refetchCartSummary]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [activeAddressTab, setActiveAddressTab] = useState<'Self' | 'Relative'>('Self');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [pujaScheduleList, setPujaScheduleList] = useState<
    ScheduleItemPayload[]
  >([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [orderSuccessRef, setOrderSuccessRef] = useState<string | null>(null);

  const rotateValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    rotateValue.setValue(0);
    Animated.loop(
      Animated.timing(rotateValue, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [rotateValue]);

  const spin = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const subtotal = cartSummary?.cart_value || 0;
  const platformFee = cartSummary?.platform_charges || 0;
  const gst = cartSummary?.platform_charges_gst || 0;
  const grandTotal = cartSummary?.total_booking_amount || 0;
  const payOnlineAmount = cartSummary?.total_payable_amount || 0;
  const cashOnDeliveryAmount = cartSummary?.cart_value || 0;

  const handleAddAddressNav = () => {
    setShowAddressModal(false);
    navigation.navigate('Address');
  };

  const handleRemoveSingleItem = async (cartItemId: string) => {
    if (!user?.user_id) return;
    try {
      const res = await manageCart({
        ctzn_id: user.user_id,
        cart_item_id: parseInt(cartItemId, 10),
        action: 1,
      }).unwrap();
      console.log('--- API: managePujaCart (Remove Item) RESPONSE ---', res);
      if (res.status === 0) {
        dispatch(removeFromCart(cartItemId));
      }
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  const handleClearAllCart = async () => {
    if (!user?.user_id) return;
    try {
      const res = await manageCart({
        ctzn_id: user.user_id,
        cart_item_id: 0,
        action: 2,
      }).unwrap();
      console.log('--- API: managePujaCart (Clear Cart) RESPONSE ---', res);
      if (res.status === 0) {
        dispatch(clearCart());
      }
    } catch (err) {
      console.error('Failed to clear cart:', err);
    }
  };

  const handleConfirmOrder = async (
    schedulesOverride?: ScheduleItemPayload[],
  ) => {
    const schedulesToUse = schedulesOverride || pujaScheduleList;

    dispatch(showLoader());

    const cart_id =
      fullApiCartItems.length > 0 ? fullApiCartItems[0].cart_id : 1;

    // Use the first scheduled item's address as the top-level address for the API
    const topAddressId =
      schedulesToUse.length > 0 && schedulesToUse[0].ctzn_address_id
        ? schedulesToUse[0].ctzn_address_id
        : parseInt(selectedAddressId || '0', 10);

    if (!topAddressId || topAddressId === 0) {
      dispatch(hideLoader());
      showToast({
        message: isBn
          ? 'আপনি একটি ডিফল্ট ঠিকানা নির্বাচন করেননি। পেমেন্টে এগিয়ে যাওয়ার আগে একটি বিতরণ ঠিকানা নির্বাচন করুন।'
          : 'You have not selected a default delivery address. Please select or add an address before proceeding to payment.',
        type: 'error',
      });
      return;
    }

    try {
      console.log('--- CHECKOUT USER OBJECT ---', user);
      console.log('--- CHECKOUT AUTH_ID TO SEND ---', user?.auth_id || user?.user_id);

      const payload = {
        ctzn_id: user?.auth_id || user?.user_id || 925,
        puja_schedule_list: schedulesToUse.map((s: any) => ({
          package_id: s.package_id,
          ctzn_address_id: s.ctzn_address_id || topAddressId,
          preferred_date: s.preferred_date,
          preferred_time: s.preferred_time,
          special_instructions: s.special_instruction || s.special_instructions || '',
        })),
      };

      console.log(
        '--- API: bookPuja PAYLOAD Request ---',
        JSON.stringify(payload, null, 2),
      );

      const response = await bookPuja(payload).unwrap();

      console.log(
        '--- API: bookPuja FULL Response ---',
        JSON.stringify(response, null, 2),
      );

      if (response?.status === 0 || String(response?.status) === '0' || response?.status === 104 || String(response?.status) === '104') {
        if (response?.status === 104 || String(response?.status) === '104') {
          // Clear cart immediately if status is 104 as requested
          handleClearAllCart();
          dispatch(clearCart());
        }
        let bookingData: any = {};
        if (typeof response.data === 'string') {
          try {
            bookingData = JSON.parse(response.data);
          } catch { }
        } else {
          bookingData = response.data || {};
        }

        // Extract Paytm parameters from response (prioritize txn_number matching Web code)
        const txnToken = bookingData?.txn_token || bookingData?.txnToken;
        const orderId = String(bookingData?.txn_number || bookingData?.order_ref || bookingData?.order_id || bookingData?.booking_id || '770');
        const txnAmount = bookingData?.txn_amount || grandTotal || 21;

        console.log('🚀 [PAYTM CHECKOUT] Extracted Parameters:', {
          txnToken,
          orderId,
          txnAmount,
          redirect_url: bookingData?.redirect_url,
        });

        // 1. If Paytm txnToken is present, launch Paytm Checkout with txn_number!
        if (txnToken) {
          // KEY DISCOVERY FROM WEB CODE: orderId MUST be txn_number (e.g. "00000775-1")
          const paytmOrderId = String(
            bookingData?.txn_number ||
            bookingData?.order_ref ||
            bookingData?.order_id ||
            bookingData?.booking_id ||
            orderId,
          );
          const amountStr =
            typeof txnAmount === 'number'
              ? txnAmount.toFixed(2)
              : String(txnAmount);
          const callbackUrl = `${PAYTM_CONFIG.BASE_URL}theia/paytmCallback?ORDER_ID=${paytmOrderId}`;

          console.log('====================================================');
          console.log('🚀 [PAYTM CHECKOUT] Invoking Paytm with txn_number:', paytmOrderId);
          console.log('====================================================');

          dispatch(hideLoader());
          setShowAddressModal(false);

          startPaytmTransaction({
            orderId: paytmOrderId,
            mid: PAYTM_CONFIG.MID,
            txnToken: txnToken,
            amount: amountStr,
            callbackUrl: callbackUrl,
            isStaging: PAYTM_CONFIG.IS_STAGING,
            restrictAppInvoke: PAYTM_CONFIG.RESTRICT_APP_INVOKE,
            urlScheme: PAYTM_CONFIG.URL_SCHEME,
          })
            .then((result: any) => {
              console.log('====================================================');
              console.log('✅ [PAYTM SDK SUCCESS RESPONSE]:', JSON.stringify(result, null, 2));
              console.log('====================================================');
              showToast({ message: isBn ? 'পেটিএম পেমেন্ট সফল হয়েছে!' : 'Paytm Payment Successful!', type: 'success' });
            })
            .catch((err: any) => {
              console.log('====================================================');
              console.log('❌ [PAYTM SDK ERROR / CANCELLED RESPONSE]:', err);
              console.log('====================================================');
              const webUrl = `${PAYTM_CONFIG.BASE_URL}theia/processTransaction?txnToken=${txnToken}`;
              setPaymentUrl(webUrl);
            });

          return;
        }

        // 2. Handle Payment Redirect via Plural / Paytm WebView if redirect_url is given
        if (bookingData.redirect_url) {
          try {
            let redirectUrl = base64Decode(bookingData.redirect_url);
            if (!redirectUrl.startsWith('http')) {
              redirectUrl = bookingData.redirect_url;
            }
            console.log('🌐 Decoded redirect URL:', redirectUrl);
            setPaymentUrl(redirectUrl);
          } catch (e) {
            console.error('Base64 decode or URL validation failed:', e);
            if (bookingData.redirect_url.startsWith('http')) {
              setPaymentUrl(bookingData.redirect_url);
            }
          }
          dispatch(hideLoader());
          setShowAddressModal(false);
          return;
        }

        const now = new Date();
        const dateString = `${now.getFullYear()}${(now.getMonth() + 1)
          .toString()
          .padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
        const randomId = Math.floor(10000000 + Math.random() * 90000000);

        const bookingRef =
          bookingData?.booking_no ||
          bookingData?.booking_ref ||
          `PB-${dateString}-${randomId}`;

        const newOrder: Order = {
          id:
            bookingData?.booking_id?.toString() ||
            Math.random().toString(36).substring(7),
          bookingRef,
          items: cartItemsMapped.map(item => ({
            id: Math.random().toString(36).substring(7),
            titleEn: item.titleEn,
            titleBn: item.titleBn,
            price: item.exactPrice || 0,
            pandits: 1,
            duration: (item.duration || '1-2 hours').toString(),
            imagePlaceholder: item.imagePlaceholder || '',
            color: item.color || Colors.lightGray,
            scheduledDate: item.selectedDate || '',
            scheduledTime: item.selectedTime || '',
            status: 'Upcoming',
          })),
          totalAmount: grandTotal,
          datePlaced: now.toISOString(),
          status: 'Booking Initiated',
          paymentStatus: 'PAID',
        };

        dispatch(placeOrder(newOrder));
        handleClearAllCart();
        dispatch(clearCart());
        dispatch(hideLoader());
        setShowAddressModal(false);
        setOrderSuccessRef(bookingRef);
      } else {
        dispatch(hideLoader());
        console.error('Booking failed API Response:', response);
        setAlertConfig({
          visible: true,
          title: isBn ? 'বুকিং ব্যর্থ হয়েছে' : 'Booking Failed',
          message: response.message || 'An error occurred.',
          buttons: [
            {
              text: 'OK',
              onPress: () =>
                setAlertConfig(prev => ({ ...prev, visible: false })),
            },
          ],
        });
      }
    } catch (err) {
      dispatch(hideLoader());
      console.error('Booking failed Exception:', err);
      setAlertConfig({
        visible: true,
        title: isBn ? 'ত্রুটি' : 'Error',
        message: isBn
          ? 'বুকিং সম্পূর্ণ করতে অক্ষম। অনুগ্ৰহ করে আবার চেষ্টা করুন।'
          : 'Unable to complete the booking. Please try again.',
        buttons: [
          {
            text: 'OK',
            onPress: () =>
              setAlertConfig(prev => ({ ...prev, visible: false })),
          },
        ],
      });
    }
  };

  if (orderSuccessRef) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <StatusBar
          backgroundColor={Colors.background}
          barStyle="dark-content"
        />
        <View
          style={{
            backgroundColor: Colors.white,
            padding: 32,
            borderRadius: 16,
            width: '85%',
            alignItems: 'center',
            shadowColor: Colors.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 5,
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: Colors.tagGreen,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 24,
            }}
          >
            <Text style={{ fontSize: 40 }}>✅</Text>
          </View>
          <Text
            style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: BRAND_TEXT,
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            {isBn ? 'বুকিং নিশ্চিত!' : 'Booking Confirmed!'}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: BRAND_MUTED,
              textAlign: 'center',
              marginBottom: 24,
            }}
          >
            {isBn
              ? 'আপনার পবিত্র পূজা অফার সফলভাবে বুক করা হয়েছে।'
              : 'Your sacred puja offering has been successfully booked.'}
          </Text>

          <View
            style={{
              backgroundColor: Colors.lightOrange,
              padding: 16,
              borderRadius: 8,
              width: '100%',
              alignItems: 'center',
              marginBottom: 24,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: 'bold',
                color: BRAND_PRIMARY,
                marginBottom: 8,
                textTransform: 'uppercase',
              }}
            >
              {isBn ? 'বুকিং রেফারেন্স আইডি' : 'BOOKING REFERENCE ID'}
            </Text>
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: BRAND_TEXT,
                letterSpacing: 1,
                textAlign: 'center',
              }}
            >
              📄 {orderSuccessRef}
            </Text>
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: BRAND_PRIMARY,
              paddingVertical: 14,
              borderRadius: 8,
              width: '100%',
              alignItems: 'center',
              marginBottom: 12,
            }}
            onPress={() => {
              setOrderSuccessRef(null);
              navigation.navigate('Orders');
            }}
          >
            <Text
              style={{ color: Colors.white, fontSize: 16, fontWeight: 'bold' }}
            >
              {isBn ? 'আমার অর্ডার দেখুন' : 'View My Orders'} →
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: 'transparent',
              paddingVertical: 14,
              borderRadius: 8,
              width: '100%',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: Colors.border,
            }}
            onPress={() => {
              setOrderSuccessRef(null);
              navigation.navigate('MainTabs');
            }}
          >
            <Text
              style={{ color: BRAND_PRIMARY, fontSize: 16, fontWeight: 'bold' }}
            >
              {isBn ? 'হোমে ফিরে যান' : '🏡 Back to Home'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (cartItemsMapped.length === 0 && !isFetchingCart) {
    return (
      <View style={styles.container}>
        <StatusBar
          backgroundColor="#FAF6EF"
          barStyle="dark-content"
          translucent={true}
        />
        <TopNavBar showBack={true} />
        <NoDataFound
          message={isBn ? 'আপনার কার্ট খালি' : 'Your cart is empty'}
          containerHeight={400}
        >
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={() => navigation.navigate('AllPujas')}
          >
            <Text style={styles.exploreBtnText}>
              {isBn ? 'পূজা অন্বেষণ করুন' : 'Explore Pujas'}
            </Text>
          </TouchableOpacity>
        </NoDataFound>
      </View>
    );
  }

  const renderOrderSummary = (isModal = false) => (
    <View style={isModal ? styles.modalOrderSummaryBox : styles.orderSummaryCardClean}>
      {!isModal && (
        <View style={styles.osHeaderBanner}>
          <Receipt size={18} color="#C84400" />
          <Text style={styles.osTitleHeader}>
            {isBn ? 'অর্ডার সারাংশ' : 'Order Summary'}
          </Text>
        </View>
      )}

      <View style={styles.osDividerLine} />

      <View style={styles.osRowClean}>
        <Text style={styles.osLabelText}>
          {isBn
            ? `সাবটোটাল (${cartItemsMapped.length} সেবা)`
            : `Subtotal (${cartItemsMapped.length} services)`}
        </Text>
        <Text style={styles.osValueTextBold}>
          ₹{subtotal.toLocaleString('en-IN')}
        </Text>
      </View>
      <View style={styles.osDividerLine} />

      <View style={styles.osRowClean}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={styles.osLabelText}>
            {isBn ? 'প্ল্যাটফর্ম ফি' : 'Platform Fee'}
          </Text>
          <View style={styles.fixedBadgeBox}>
            <Text style={styles.fixedBadgeText}>Fixed</Text>
          </View>
        </View>
        <Text style={styles.osValueTextBold}>₹{platformFee.toFixed(1)}</Text>
      </View>
      <View style={styles.osDividerLine} />

      <View style={styles.osRowClean}>
        <Text style={styles.osLabelText}>
          {isBn ? 'জিএসটি (১৮%)' : 'GST (18%)'}
        </Text>
        <Text style={styles.osValueTextBold}>₹{gst.toFixed(1)}</Text>
      </View>
      <View style={styles.osDividerLine} />

      <View style={styles.grandTotalSplitCard}>
        <View style={styles.grandTotalHeaderRow}>
          <Text style={styles.grandTotalTitle}>
            {isBn ? 'সর্বমোট' : 'Grand Total'}
          </Text>
          <Text style={styles.grandTotalAmountOrange}>
            ₹{grandTotal.toLocaleString('en-IN')}
          </Text>
        </View>

        <View style={styles.splitDividerLine} />

        <View style={styles.splitPayRow}>
          <Text style={styles.splitPayLabelBlue}>
            💳 {isBn ? 'এখন পরিশোধ' : 'Pay now'} <Text style={styles.splitPaySubText}>(secure booking payment)</Text>
          </Text>
          <Text style={styles.splitPayValBlue}>
            ₹{payOnlineAmount.toLocaleString('en-IN')}
          </Text>
        </View>

        <View style={styles.splitPayRow}>
          <Text style={styles.splitPayLabelGreen}>
            🏠 {isBn ? 'সার্ভিসের সময় বাকি' : 'Remaining during service'}
          </Text>
          <Text style={styles.splitPayValGreen}>
            ₹{cashOnDeliveryAmount.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor="#FAF6EF"
        barStyle="dark-content"
        translucent={true}
      />
      <TopNavBar showBack={true} />

      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Math.max(110, insets.bottom + 90),
          paddingTop: 12,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[BRAND_PRIMARY]}
            tintColor={BRAND_PRIMARY}
          />
        }
      >
        {/* Cart Items List */}
        <View style={styles.listSection}>
          <View style={styles.itemListContainer}>
            {cartItemsMapped.map(item => (
              <View key={item.cartItemId} style={styles.cartCardClean}>
                <View style={styles.cardHeaderRowClean}>
                  <View style={styles.cardImgWrap}>
                    {item.imagePlaceholder && item.imagePlaceholder.startsWith('http') ? (
                      <Image
                        source={{ uri: item.imagePlaceholder }}
                        style={styles.cardImg}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.cardImgEmoji}>🛕</Text>
                    )}
                  </View>
                  <View style={styles.cardHeaderInfoClean}>
                    <Text style={styles.cardTitleClean}>
                      {isBn ? item.titleBn : item.titleEn}
                    </Text>
                    <View style={styles.pkgEditRow}>
                      <Text style={styles.cardPackageTextOrange} numberOfLines={1}>
                        {item.pkg_name || (isBn ? item.titleBn + ' প্যাকেজ' : item.titleEn + ' Package')}
                      </Text>
                      <TouchableOpacity onPress={() => navigation.navigate('PujaDetails', { pujaId: item.pujaId })}>
                        <Text style={styles.editPkgLink}>Edit package</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.cardDescTextClean} numberOfLines={2}>
                      Verification package created to confirm database and API package persistence.
                    </Text>

                    <View style={styles.metaPillsRow}>
                      <View style={styles.metaPill}>
                        <Clock size={12} color="#C84400" />
                        <Text style={styles.metaPillText}>{item.duration || '2'}h</Text>
                      </View>
                      <View style={styles.metaPill}>
                        <Users size={12} color="#C84400" />
                        <Text style={styles.metaPillText}>{item.pandits || 1} {item.pandits > 1 ? 'Pandits' : 'Pandit'}</Text>
                      </View>
                      <View style={styles.metaPillYellow}>
                        <Star size={12} color="#EAB308" fill="#EAB308" />
                        <Text style={styles.metaPillTextDark}>{item.rating || 4}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.cardBottomRow}>
                  <View>
                    <Text style={styles.exactPriceLarge}>
                      ₹{item.exactPrice?.toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.packageTotalSub}>Package total</Text>
                  </View>

                  <TouchableOpacity
                    onPress={async () => {
                      const state = await NetInfo.fetch();
                      if (state.isConnected) {
                        handleRemoveSingleItem(item.cartItemId);
                      } else {
                        showToast({
                          message: t('common.connectionRequired'),
                          type: 'error',
                        });
                      }
                    }}
                    style={styles.trashDeleteBtn}
                  >
                    <Trash2 size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Dashed Add More Pujas Button */}
            <TouchableOpacity
              style={styles.addMorePujasDashedBtn}
              activeOpacity={0.8}
              onPress={async () => {
                const state = await NetInfo.fetch();
                if (state.isConnected) {
                  navigation.navigate('AllPujas');
                } else {
                  showToast({
                    message: t('common.connectionRequired'),
                    type: 'error',
                  });
                }
              }}
            >
              <Plus size={18} color="#E8700A" strokeWidth={2.5} />
              <Text style={styles.addMorePujasText}>
                {isBn ? 'আরও পূজা যোগ করুন' : 'Add More Pujas'}
              </Text>
            </TouchableOpacity>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <View style={styles.paginationRow}>
                <TouchableOpacity
                  style={[
                    styles.pageBtn,
                    pageNo === 1 && styles.pageBtnDisabled,
                  ]}
                  onPress={() => setPageNo(prev => Math.max(1, prev - 1))}
                  disabled={pageNo === 1}
                >
                  <Text style={styles.pageBtnText}>
                    ← {isBn ? 'আগের' : 'Prev'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.pageNumBox}>
                  <Text style={styles.pageNumText}>{pageNo}</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.pageBtn,
                    pageNo === totalPages && styles.pageBtnDisabled,
                  ]}
                  onPress={() =>
                    setPageNo(prev => Math.min(totalPages, prev + 1))
                  }
                  disabled={pageNo === totalPages}
                >
                  <Text style={styles.pageBtnText}>
                    {isBn ? 'পরের' : 'Next'} →
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Guided Booking Card (What Happens Next?) */}
        <View style={styles.guidedBookingCard}>
          <Text style={styles.guidedCategoryLabel}>SIMPLE, GUIDED BOOKING</Text>
          <Text style={styles.guidedTitle}>What happens next?</Text>

          <View style={styles.guidedStepRow}>
            <View style={styles.guidedIconPill}>
              <Clock size={16} color="#C84400" />
            </View>
            <View style={styles.guidedTextWrap}>
              <Text style={styles.guidedStepTitle}>Choose your schedule</Text>
              <Text style={styles.guidedStepSub}>Select a preferred date and time.</Text>
            </View>
          </View>

          <View style={styles.guidedStepRow}>
            <View style={styles.guidedIconPill}>
              <MapPin size={16} color="#C84400" />
            </View>
            <View style={styles.guidedTextWrap}>
              <Text style={styles.guidedStepTitle}>Confirm the location</Text>
              <Text style={styles.guidedStepSub}>Add the address for the ceremony.</Text>
            </View>
          </View>

          <View style={styles.guidedStepRow}>
            <View style={styles.guidedIconPill}>
              <ShieldCheck size={16} color="#C84400" />
            </View>
            <View style={styles.guidedTextWrap}>
              <Text style={styles.guidedStepTitle}>Book securely</Text>
              <Text style={styles.guidedStepSub}>Pay the booking amount now and the remaining balance during service.</Text>
            </View>
          </View>
        </View>

        {/* Order Summary Form */}
        <View style={styles.summarySection}>
          {renderOrderSummary(false)}

          <View style={styles.trustBadgeOutlineCard}>
            <CheckCircle2 size={20} color="#4B5563" style={{ marginTop: 2 }} />
            <Text style={styles.trustBadgeTextMain}>
              <Text style={styles.trustBadgeBold}>
                {isBn ? 'নিরাপদ বুকিং' : 'Secure Booking'}
              </Text>
              {isBn
                ? ' — প্রত্যয়িত পুরোহিত, খাঁটি আচার'
                : ' — Certified pandits, authentic rituals'}
            </Text>
          </View>

          <View style={styles.trustBadgeOutlineCard}>
            <Sparkles size={20} color="#4B5563" style={{ marginTop: 2 }} />
            <Text style={styles.trustBadgeTextMain}>
              <Text style={styles.trustBadgeBold}>
                {isBn ? 'ঐশ্বরিক আশীর্বাদ' : 'Divine Blessings'}
              </Text>
              {isBn
                ? ' — ঐতিহ্যবাহী বৈদিক অনুশীলন'
                : ' — Traditional Vedic practices observed'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.clearCartBtn}
            onPress={async () => {
              const state = await NetInfo.fetch();
              if (state.isConnected) {
                handleClearAllCart();
              } else {
                showToast({
                  message: t('common.connectionRequired'),
                  type: 'error',
                });
              }
            }}
          >
            <Text style={styles.clearCartBtnText}>
              {isBn ? 'কার্ট মুছুন' : 'Clear Cart'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fixed Checkout Footer matching Screenshot 100% */}
      {cartItemsMapped.length > 0 &&
        !showScheduleModal &&
        !showAddressModal &&
        !showConfirmModal && (
          <View style={[styles.fixedCheckoutBar, { paddingBottom: Math.max(12, insets.bottom + 8) }]}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={{ width: '100%' }}
              onPress={async () => {
                const state = await NetInfo.fetch();
                if (state.isConnected) {
                  navigation.navigate('SchedulePujas' as never, {
                    cartItems: cartItemsMapped,
                    addresses,
                    grandTotal,
                  } as never);
                } else {
                  showToast({
                    message: t('common.connectionRequired'),
                    type: 'error',
                  });
                }
              }}
            >
              <LinearGradient
                colors={['#FF9933', '#E07800']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.proceedCheckoutBtnGradient}
              >
                <View style={styles.checkoutBtnLeft}>
                  <ShieldCheck size={18} color="#FFFFFF" />
                  <Text style={styles.checkoutBtnText} numberOfLines={1}>
                    {isBn ? 'এগিয়ে যান' : 'Proceed to Checkout'}
                  </Text>
                </View>

                <Text style={styles.checkoutPriceTagText} numberOfLines={1}>
                  ₹{payOnlineAmount || 21} now · ₹{cashOnDeliveryAmount?.toLocaleString('en-IN')} later
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

      {/* Confirm Order Modal */}
      {showConfirmModal && (
        <View
          style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Animated.View
                style={[
                  styles.omIconBoxModal,
                  { transform: [{ rotate: spin }] },
                ]}
              >
                <Text style={styles.omTextSm}>ॐ</Text>
              </Animated.View>
              <Text style={styles.modalTitle}>
                {isBn ? 'আপনার অর্ডার নিশ্চিত করুন' : 'Confirm Your Order'}
              </Text>
              <Text style={styles.modalSub}>
                {isBn
                  ? 'এগিয়ে যাওয়ার আগে পেমেন্ট ব্রেকডাউন পর্যালোচনা করুন।'
                  : 'Review the payment breakdown before proceeding.'}
              </Text>

              {renderOrderSummary(true)}

              <View style={styles.disclaimerBox}>
                <Text style={styles.disclaimerText}>
                  {isBn
                    ? 'আমাদের প্রত্যয়িত পুরোহিত আপনার সাথে যোগাযোগ করবে।'
                    : 'Our certified pandits will contact you within 24 hours to confirm the ritual date and time.'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalActionBtn}
                onPress={() => {
                  NetInfo.fetch().then(state => {
                    if (state.isConnected) {
                      setShowConfirmModal(false);
                      const def = addresses.find(a => a.isDefault);
                      if (def) setSelectedAddressId(def.id);
                      else if (addresses.length > 0)
                        setSelectedAddressId(addresses[0].id);
                      setTimeout(() => setShowAddressModal(true), 300);
                    } else {
                      showToast({
                        message: t('common.connectionRequired'),
                        type: 'error',
                      });
                    }
                  });
                }}
              >
                <Text style={styles.modalActionBtnText}>
                  {isBn ? 'ঠিকানা নির্বাচন ও পে করুন' : 'Select Address & Pay'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>
                  {isBn ? 'বাতিল' : 'Cancel'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Delivery Address Modal */}
      {showAddressModal && (
        <View
          style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContentAddr}>
              <View style={styles.modalHeaderOrange}>
                <View style={styles.modalHeaderTitleRow}>
                  <View style={styles.modalHeaderIconBox}>
                    <Text style={styles.modalHeaderIcon}>📍</Text>
                  </View>
                  <View>
                    <Text style={styles.modalTitleWhite}>
                      {isBn ? 'ডেলিভারি ঠিকানা' : 'Delivery Address'}
                    </Text>
                    <Text style={styles.modalSubWhite}>
                      {isBn
                        ? 'আপনার পূজা কোথায় হবে নির্বাচন করুন'
                        : 'Select where to deliver your puja service'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setShowAddressModal(false)}
                  style={styles.modalCloseBtnWhite}
                >
                  <Text style={styles.modalCloseTxtWhite}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalBodyScroll}
                showsVerticalScrollIndicator={false}
              >
                <View style={{ flexDirection: 'row', marginBottom: 16, alignItems: 'center', backgroundColor: Colors.white, padding: 4, borderRadius: 24, borderWidth: 1, borderColor: Colors.disabled }}>
                  <TouchableOpacity
                    style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 20 }, activeAddressTab === 'Self' && { backgroundColor: Colors.primary }]}
                    onPress={() => setActiveAddressTab('Self')}
                  >
                    <Text style={[{ fontSize: 14, fontWeight: '700', color: Colors.textMuted }, activeAddressTab === 'Self' && { color: Colors.white }]}>
                      👤 My Addresses
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 20 }, activeAddressTab === 'Relative' && { backgroundColor: Colors.primary }]}
                    onPress={() => setActiveAddressTab('Relative')}
                  >
                    <Text style={[{ fontSize: 14, fontWeight: '700', color: Colors.textMuted }, activeAddressTab === 'Relative' && { color: Colors.white }]}>
                      👥 Relatives
                    </Text>
                  </TouchableOpacity>
                </View>

                {(() => {
                  const filteredAddresses = addresses.filter(addr => addr.relationType === activeAddressTab);
                  return (
                    <>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textMuted }}>
                          {filteredAddresses.length} addresses
                        </Text>
                        <TouchableOpacity
                          style={{ backgroundColor: Colors.lightOrange, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}
                          onPress={async () => {
                            const state = await NetInfo.fetch();
                            if (state.isConnected) {
                              handleAddAddressNav();
                            } else {
                              showToast({ message: t('common.connectionRequired'), type: 'error' });
                            }
                          }}
                        >
                          <Text style={{ color: Colors.primary, fontSize: 14, fontWeight: '700' }}>+ Add Address</Text>
                        </TouchableOpacity>
                      </View>

                      {filteredAddresses.length === 0 ? (
                        <View style={styles.noAddressBox}>
                          <Text style={styles.noAddressText}>
                            {isBn
                              ? 'কোনো সংরক্ষিত ঠিকানা নেই।'
                              : 'No saved addresses found.'}
                          </Text>
                        </View>
                      ) : (
                        filteredAddresses.map(addr => {
                          const isSelected = selectedAddressId === addr.id;
                          return (
                            <TouchableOpacity
                              key={addr.id}
                              style={[
                                styles.addrSelectCard,
                                { borderRadius: 16, padding: 16, marginBottom: 16 },
                                isSelected && styles.addrSelectCardActive,
                              ]}
                              onPress={() => setSelectedAddressId(addr.id)}
                            >
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <View style={{ backgroundColor: addr.type === 'Home' ? '#FEF3C7' : addr.type === 'Work' ? '#DBEAFE' : '#F3F4F6', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 }}>
                                  <Text style={{ fontSize: 12, fontWeight: '700', color: addr.type === 'Home' ? '#D97706' : addr.type === 'Work' ? '#2563EB' : '#4B5563' }}>
                                    {addr.type === 'Home' ? '🏠' : addr.type === 'Work' ? '💼' : '🏷️'} {addr.type}
                                  </Text>
                                </View>
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                  <TouchableOpacity onPress={() => {/* Handle Edit API */ }}>
                                    <Text style={{ fontSize: 16, color: Colors.textMuted }}>✏️</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity onPress={() => {/* Handle Delete API */ }}>
                                    <Text style={{ fontSize: 16, color: Colors.textMuted }}>🗑️</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>

                              <View style={{ marginBottom: 12 }}>
                                <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.textMain, marginBottom: 4 }}>
                                  {addr.label || addr.contactName}
                                </Text>
                                <Text style={{ fontSize: 13, color: Colors.textMuted, lineHeight: 20 }}>
                                  {addr.addressLine1 ? addr.addressLine1 + '\n' : ''}
                                  {[addr.streetArea, addr.landmark].filter(Boolean).join(', ')}
                                  {'\n'}
                                  {[addr.city, addr.state].filter(Boolean).join(', ')} - {addr.pincode}
                                </Text>
                                <Text style={{ fontSize: 13, color: Colors.textMuted, marginTop: 8 }}>
                                  📞 {addr.contactNumber}
                                </Text>
                              </View>

                              <TouchableOpacity style={{ borderWidth: 1, borderColor: Colors.lightOrange, backgroundColor: '#FFF7ED', borderRadius: 8, paddingVertical: 10, alignItems: 'center' }}>
                                <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: 14 }}>
                                  {addr.isDefault ? '★ Default Address' : '☆ Set as Default'}
                                </Text>
                              </TouchableOpacity>
                            </TouchableOpacity>
                          );
                        })
                      )}
                    </>
                  );
                })()}

                <View style={{ height: 4 }} />
              </ScrollView>

              <View style={styles.modalFooterBtns}>
                <TouchableOpacity
                  style={styles.modalCancelOutlinedBtn}
                  onPress={() => setShowAddressModal(false)}
                >
                  <Text style={styles.modalCancelOutlinedTxt}>
                    {isBn ? 'বাতিল' : 'Cancel'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalConfirmBtn,
                    (!selectedAddressId || addresses.length === 0) && {
                      opacity: 0.5,
                    },
                  ]}
                  onPress={() => {
                    NetInfo.fetch().then(state => {
                      if (state.isConnected) {
                        handleConfirmOrder();
                      } else {
                        showToast({
                          message: t('common.connectionRequired'),
                          type: 'error',
                        });
                      }
                    });
                  }}
                  disabled={!selectedAddressId || addresses.length === 0}
                >
                  <Text style={styles.modalConfirmBtnTxt}>
                    {isBn ? 'ঠিকানা নিশ্চিত করুন' : 'Confirm Address'} &gt;
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Schedule Pujas Modal with embedded Addresses */}
      <SchedulePujasModal
        visible={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        cartItems={cartItemsMapped}
        addresses={addresses} // Passed from API in CartScreen
        isBn={isBn}
        onConfirmSchedule={schedules => {
          setPujaScheduleList(schedules);
          setShowScheduleModal(false);
          // Directly proceed to payment/booking API logic!
          handleConfirmOrder(schedules);
        }}
        onAddNewAddress={handleAddAddressNav}
      />

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onDismiss={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />

      {/* Custom Payment Initialization Loader */}
      <Modal visible={isPaymentInitializing} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', padding: 24, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }}>
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.textMain }}>Processing...</Text>
            <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 4 }}>Initializing secure payment</Text>
          </View>
        </View>
      </Modal>

      {/* Plural WebView Modal */}
      <Modal
        visible={!!paymentUrl}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setPaymentUrl(null)}
      >
        {paymentUrl && (
          <PluralWebView
            source={{ uri: paymentUrl }}
            onPaymentResult={handlePaymentResult}
            stopNavigationOnMatch={true}
          />
        )}
      </Modal>

      {/* Payment / Booking Confirmed Modal */}
      <Modal
        visible={paymentConfirmed}
        animationType="fade"
        transparent={true}
        onRequestClose={() => { }}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            {/* Success icon */}
            <View style={styles.confirmIconCircle}>
              <Text style={styles.confirmIconText}>✓</Text>
            </View>
            <Text style={styles.confirmTitle}>
              {isBn ? 'বুকিং নিশ্চিত হয়েছে!' : 'Booking Confirmed!'}
            </Text>
            <Text style={styles.confirmSub}>
              {isBn
                ? 'আপনার পূজা সফলভাবে বুক হয়েছে। আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।'
                : 'Your puja has been successfully booked. We will get in touch with you shortly.'}
            </Text>
            {paymentOrderRef ? (
              <View style={styles.confirmRefBox}>
                <Text style={styles.confirmRefLabel}>
                  {isBn ? 'রেফারেন্স নম্বর' : 'Reference No.'}
                </Text>
                <Text style={styles.confirmRefValue}>{paymentOrderRef}</Text>
              </View>
            ) : null}

            {paymentResult && (
              <View style={styles.paymentDetailsBox}>
                <Text style={styles.paymentDetailsTitle}>
                  {isBn ? 'পেমেন্ট বিবরণ' : 'Payment Details'}
                </Text>
                <View style={styles.paymentDetailRow}>
                  <Text style={styles.paymentDetailLabel}>
                    {isBn ? 'অবস্থা' : 'Status'}:
                  </Text>
                  <Text style={styles.paymentDetailValue}>
                    {paymentResult.status === 'response'
                      ? '✅ Success'
                      : '❌ Error'}
                  </Text>
                </View>
                {paymentResult.reason && (
                  <View style={styles.paymentDetailRow}>
                    <Text style={styles.paymentDetailLabel}>
                      {isBn ? 'কারণ' : 'Reason'}:
                    </Text>
                    <Text style={styles.paymentDetailValue}>
                      {paymentResult.reason}
                    </Text>
                  </View>
                )}
                {paymentResult.orderId && (
                  <View style={styles.paymentDetailRow}>
                    <Text style={styles.paymentDetailLabel}>
                      {isBn ? 'অর্ডার আইডি' : 'Order ID'}:
                    </Text>
                    <Text style={styles.paymentDetailValue}>
                      {paymentResult.orderId}
                    </Text>
                  </View>
                )}
              </View>
            )}
            <TouchableOpacity
              style={styles.confirmGoOrdersBtn}
              onPress={() => {
                setPaymentConfirmed(false);
                setPaymentOrderRef(null);
                setPaymentResult(null);
                navigation.navigate('Orders' as never);
              }}
            >
              <Text style={styles.confirmGoOrdersBtnText}>
                {isBn ? 'অর্ডার দেখুন' : 'View My Orders'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmHomeBtn}
              onPress={() => {
                setPaymentConfirmed(false);
                setPaymentOrderRef(null);
                setPaymentResult(null);
                navigation.navigate('Dashboard' as never);
              }}
            >
              <Text style={styles.confirmHomeBtnText}>
                {isBn ? 'হোমে ফিরুন' : 'Go to Home'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.extraLightWarm }, // VERY light warm background
  safeArea: { backgroundColor: Colors.background, zIndex: 10 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtnBig: {
    width: 36,
    height: 36,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backBtnBigText: { color: Colors.white, fontSize: 18, fontWeight: 'bold' },
  headerTitleBox: { flex: 1 },
  headerTitleMain: { fontSize: 24, fontWeight: '900', color: Colors.textMain },
  headerTitleSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  headerSparkle: { fontSize: 24 },

  body: { flex: 1, padding: 16 },

  listSection: { marginBottom: 12 },
  itemListContainer: { paddingBottom: 8 },
  scrollHint: {
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.ultraLightGray,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: Colors.disabled,
  },
  scrollHintText: {
    fontSize: 10,
    color: Colors.gray,
    fontWeight: '600',
  },
  cartCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border, // Light orange border
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardImgPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardImgEmoji: { fontSize: 32 },
  cardHeaderInfo: { flex: 1 },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textMain,
    marginBottom: 2,
  },
  cardPackageText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDescText: { fontSize: 11, color: Colors.gray },
  deleteBtn: { padding: 4 },
  deleteIcon: { fontSize: 16, color: Colors.red },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tagBox: {
    backgroundColor: Colors.ultraLightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.disabled,
  },
  tagText: { fontSize: 10, color: Colors.textMuted, fontWeight: '500' },
  tagBoxGreen: {
    backgroundColor: Colors.greenLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.successBorder,
  },
  tagTextGreen: {
    fontSize: 10,
    color: Colors.statusSuccessText,
    fontWeight: '600',
  },
  tagBoxBlue: {
    backgroundColor: Colors.blueLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.blueBorder,
  },
  tagTextBlue: { fontSize: 10, color: Colors.blue, fontWeight: '600' },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exactPriceMain: { fontSize: 18, fontWeight: '900', color: Colors.textMain },
  exactPriceSub: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },

  addMoreBtn: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  addMoreBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '800' },

  summarySection: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  orderSummaryBox: { marginBottom: 16 },
  osHeader: { alignItems: 'center', marginBottom: 20 },
  omIconBoxSm: {
    width: 32,
    height: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-10deg' }],
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: Colors.textMain,
  },
  omTextSm: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },
  osTitle: { fontSize: 16, fontWeight: '800', color: Colors.primary },

  osRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  osLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  osValueBox: { fontSize: 14, fontWeight: '800', color: Colors.textMain },
  fixedBadge: {
    fontSize: 9,
    backgroundColor: Colors.lightOrange,
    color: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  osDivider: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginVertical: 8,
  },

  yellowBox: {
    backgroundColor: Colors.tagYellow,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalLabel: { fontSize: 14, fontWeight: '800', color: Colors.textMain },
  grandTotalValue: { fontSize: 20, fontWeight: '900', color: Colors.primary },
  yellowDivider: {
    height: 1,
    backgroundColor: Colors.gold,
    marginVertical: 12,
  },
  paymentSplitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentSplitLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  paymentSplitRowDistant: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  smallMuted: { fontSize: 9, color: Colors.gray, fontWeight: 'normal' },
  paymentSplitValueBlue: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.blue,
  },
  paymentSplitValueGreen: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.greenMedium,
  },

  infoBoxGreen: {
    flexDirection: 'row',
    backgroundColor: Colors.greenLight,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.successBorder,
    marginBottom: 12,
  },
  infoBoxBlue: {
    flexDirection: 'row',
    backgroundColor: Colors.blueLight,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.blueBorder,
    marginBottom: 24,
  },
  infoBoxIcon: { fontSize: 14, marginRight: 8 },
  infoBoxText: {
    flex: 1,
    fontSize: 11,
    color: Colors.statusSuccessText,
    lineHeight: 16,
  },
  infoBoxTextBlue: {
    flex: 1,
    fontSize: 11,
    color: Colors.blue,
    lineHeight: 16,
  },
  infoBoxBold: { fontWeight: 'bold' },

  checkoutBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    marginBottom: 16,
  },
  checkoutBtnText: { color: Colors.white, fontSize: 15, fontWeight: '800' },
  fixedFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    paddingTop: 12,
    // paddingBottom removed to allow insets in component
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    elevation: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  fixedFooterInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fixedFooterPriceBox: { flex: 1 },
  fixedFooterPriceLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fixedFooterPriceValue: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.primary,
  },
  fixedFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fixedFooterBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '900',
  },
  clearCartBtn: {
    borderWidth: 1,
    borderColor: Colors.tagRed,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: Colors.redToastBg,
  },
  clearCartBtnText: { color: Colors.red, fontSize: 14, fontWeight: '700' },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateEmoji: { fontSize: 60, marginBottom: 16 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: BRAND_TEXT,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: BRAND_MUTED,
    textAlign: 'center',
    marginBottom: 24,
  },
  exploreBtn: {
    backgroundColor: BRAND_PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
  },
  exploreBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },

  bottomSpacer: { height: 220 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: Colors.extraLightWarm,
    borderRadius: 24,
    padding: 24,
    elevation: 10,
  },
  omIconBoxModal: {
    width: 40,
    height: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-10deg' }],
    alignSelf: 'center',
    marginTop: -40,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.textMain,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textMain,
    textAlign: 'center',
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalOrderSummaryBox: { marginBottom: 0 },
  disclaimerBox: {
    backgroundColor: Colors.greenVeryLight,
    borderWidth: 1,
    borderColor: Colors.successBorder,
    borderRadius: 8,
    padding: 12,
    marginVertical: 20,
  },
  disclaimerText: {
    fontSize: 10,
    color: Colors.statusSuccessText,
    textAlign: 'center',
    lineHeight: 15,
  },
  modalActionBtn: {
    backgroundColor: Colors.greenMedium,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
  },
  modalActionBtnText: { color: Colors.white, fontSize: 15, fontWeight: '800' },
  modalCancelBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  // Delivery Address Modal
  modalContentAddr: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    maxHeight: '90%',
    width: '100%',
    overflow: 'hidden',
  },
  modalHeaderOrange: {
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeaderTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalHeaderIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderIcon: { fontSize: 16 },
  modalTitleWhite: { fontSize: 18, fontWeight: '800', color: Colors.white },
  modalSubWhite: { fontSize: 12, color: 'rgba(255,255,255,0.9)' },
  modalCloseBtnWhite: {
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseTxtWhite: { color: Colors.white, fontSize: 14, fontWeight: 'bold' },

  modalBodyScroll: { padding: 20, flexShrink: 1 },
  savedAddressesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  savedAddressesTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  addNewInlineBtn: {
    backgroundColor: Colors.lightOrange,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addNewInlineBtnTxt: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },

  noAddressBox: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.ultraLightGray,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.disabled,
    borderStyle: 'dashed',
  },
  noAddressText: { color: Colors.gray, fontSize: 14, fontWeight: '600' },

  addrSelectCard: {
    borderWidth: 1,
    borderColor: Colors.disabled,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: Colors.white,
  },
  addrSelectCardActive: {
    borderColor: Colors.greenMedium,
    borderWidth: 2,
    backgroundColor: Colors.greenLight,
  },
  addrSelectHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  addrSelectIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.ultraLightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addrSelectIconBoxActive: { backgroundColor: Colors.greenVeryLight },
  addrSelectIcon: { fontSize: 18 },
  addrSelectInfo: { flex: 1 },
  addrLabelChip: {
    backgroundColor: Colors.lightGray,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  addrLabelChipTxt: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '700',
  },
  addrSelectName: { fontSize: 14, fontWeight: '800', color: Colors.textMain },
  addrSelectPhone: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: 8,
  },
  addrSelectText: {
    fontSize: 13,
    color: Colors.textMain,
    fontWeight: '500',
    marginBottom: 2,
  },
  addrSelectSubText: { fontSize: 12, color: Colors.textMuted, lineHeight: 18 },

  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.gray,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.greenMedium,
  },

  addAnotherBtnDashed: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    backgroundColor: Colors.white,
  },
  addAnotherBtnDashedTxt: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },

  modalFooterBtns: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  modalCancelOutlinedBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.disabled,
    alignItems: 'center',
  },
  modalCancelOutlinedTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  modalConfirmBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.greenMedium,
    alignItems: 'center',
  },
  modalConfirmBtnTxt: { fontSize: 14, fontWeight: '800', color: Colors.white },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 16,
    backgroundColor: Colors.white,
    marginTop: 8,
  },
  pageBtn: {
    backgroundColor: BRAND_PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  pageBtnDisabled: {
    backgroundColor: Colors.disabled,
  },
  pageBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  pageNumBox: {
    backgroundColor: Colors.lightOrange,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BRAND_PRIMARY,
  },
  pageNumText: {
    color: BRAND_PRIMARY,
    fontWeight: '800',
    fontSize: 14,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.greenVeryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  confirmIconText: {
    fontSize: 40,
    color: Colors.greenMedium,
    fontWeight: 'bold',
  },
  confirmTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textMain,
    marginBottom: 10,
    textAlign: 'center',
  },
  confirmSub: {
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  confirmRefBox: {
    backgroundColor: Colors.lightOrange,
    padding: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  confirmRefLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  confirmRefValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  confirmGoOrdersBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmGoOrdersBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  confirmHomeBtn: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  confirmHomeBtnText: {
    color: Colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },

  // Payment Details in Success Modal
  paymentDetailsBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paymentDetailsTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  paymentDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  paymentDetailLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  paymentDetailValue: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '700',
  },

  // Screenshot-matched Cart Item Card styles
  cartCardClean: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 16,
    marginBottom: 14,
  },
  cardHeaderRowClean: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardImgWrap: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFF8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardImg: { width: '100%', height: '100%', borderRadius: 12 },
  cardHeaderInfoClean: { flex: 1 },
  cardTitleClean: { fontSize: 16, fontWeight: '700', color: '#1C1917', marginBottom: 2 },
  pkgEditRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  cardPackageTextOrange: { fontSize: 13, fontWeight: '600', color: '#C84400', flexShrink: 1 },
  editPkgLink: { fontSize: 12, fontWeight: '600', color: '#C84400', textDecorationLine: 'underline', marginLeft: 8 },
  cardDescTextClean: { fontSize: 12, color: '#6B7280', lineHeight: 16, marginBottom: 8 },
  metaPillsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  metaPillYellow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE047',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  metaPillText: { fontSize: 11, fontWeight: '600', color: '#C84400' },
  metaPillTextDark: { fontSize: 11, fontWeight: '700', color: '#854D0E' },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#FEE2E2',
  },
  exactPriceLarge: { fontSize: 20, fontWeight: '800', color: '#1C1917' },
  packageTotalSub: { fontSize: 11, color: '#6B7280' },
  trashDeleteBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Dashed Add More Pujas Button
  addMorePujasDashedBtn: {
    height: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#E8700A',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 14,
  },
  addMorePujasText: { color: '#E8700A', fontSize: 15, fontWeight: '700' },

  // Guided Booking Section (What Happens Next?)
  guidedBookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 16,
    marginHorizontal: 0,
    marginBottom: 16,
  },
  guidedCategoryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C84400',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  guidedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 14,
  },
  guidedStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFDF9',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  guidedIconPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  guidedTextWrap: { flex: 1 },
  guidedStepTitle: { fontSize: 14, fontWeight: '700', color: '#1C1917', marginBottom: 2 },
  guidedStepSub: { fontSize: 12, color: '#6B7280', lineHeight: 16 },

  // Order Summary Card Styles
  orderSummaryCardClean: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  osHeaderBanner: {
    backgroundColor: '#FFF8F0',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  osTitleHeader: { fontSize: 16, fontWeight: '700', color: '#C84400' },
  osRowClean: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  osLabelText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  osValueTextBold: { fontSize: 14, color: '#111827', fontWeight: '700' },
  fixedBadgeBox: {
    backgroundColor: '#FFEDD5',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  fixedBadgeText: { fontSize: 10, fontWeight: '700', color: '#C84400' },
  grandTotalSplitCard: {
    backgroundColor: '#FFFDF9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 14,
    marginTop: 12,
  },
  grandTotalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalTitle: { fontSize: 16, fontWeight: '700', color: '#1C1917' },
  grandTotalAmountOrange: { fontSize: 24, fontWeight: '800', color: '#C84400' },
  splitDividerLine: { height: 1, backgroundColor: '#FED7AA', marginVertical: 10 },
  splitPayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  splitPayLabelBlue: { fontSize: 13, fontWeight: '600', color: '#2563EB' },
  splitPaySubText: { fontSize: 11, color: '#6B7280', fontWeight: '400' },
  splitPayValBlue: { fontSize: 14, fontWeight: '800', color: '#2563EB' },
  splitPayLabelGreen: { fontSize: 13, fontWeight: '600', color: '#059669' },
  splitPayValGreen: { fontSize: 14, fontWeight: '800', color: '#059669' },

  // Trust Badges matching screenshot 100%
  trustBadgeOutlineCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  trustBadgeTextMain: { fontSize: 13, color: '#4B5563', flex: 1, lineHeight: 18 },
  trustBadgeBold: { fontWeight: '700', color: '#1F2937' },

  // Sticky Fixed Checkout Footer Bar
  fixedCheckoutBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 16,
    paddingTop: 10,
    zIndex: 999,
    elevation: 10,
  },
  proceedCheckoutBtnGradient: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  checkoutBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    marginRight: 8,
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  checkoutPriceTagText: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 11,
    fontWeight: '600',
    flexShrink: 0,
  },
});
