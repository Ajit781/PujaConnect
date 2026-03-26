import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  Dimensions,
  Keyboard,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { OtpInput } from '../../components/common/OtpInput';
import { useAlert } from '../../context/AlertContext';
import { generateOtp, validateOtp } from '../../service/auth/authService';
import { login } from '../../store/slices/authSlice';
import SmsRetriever from 'react-native-sms-retriever';
import { VALIDATION } from '../../config/apiConfig';
import appLogo from '../../assets/images/Logo.png';
import { Colors } from '../../constants/Colors';

const { height } = Dimensions.get('window');
const HEADER_HEIGHT = Math.max(height * 0.42, 300);

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export default function LoginPage({ navigation: _navigation }: Props) {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { showAlert } = useAlert();

  // Step 1 state
  const [mobile, setMobile] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [isGettingOtp, setIsGettingOtp] = useState(false);
  const [canShowKeyboard, setCanShowKeyboard] = useState(false);

  // Step 2 state
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState<string[]>(
    Array(VALIDATION.OTP_LENGTH).fill(''),
  );
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(30);

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const headerHeight = useRef(new Animated.Value(HEADER_HEIGHT)).current;
  const logoSize = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
      Animated.parallel([
        Animated.timing(headerHeight, {
          toValue: 120,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(logoSize, {
          toValue: 180,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
      Animated.parallel([
        Animated.timing(headerHeight, {
          toValue: HEADER_HEIGHT,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(logoSize, {
          toValue: 300,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [headerHeight, logoSize]);

  // Phone History state
  const [phoneHistory, setPhoneHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const hintShown = useRef(false);
  const mobileInputRef = useRef<any>(null);

  // Load history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const saved = await AsyncStorage.getItem('PHONE_HISTORY');
        if (saved) setPhoneHistory(JSON.parse(saved));
      } catch (e) {
        console.log('Error loading history:', e);
      }
    };
    loadHistory();
  }, []);

  // Phone Hint Retriever on Mount
  useEffect(() => {
    // Immediate dismiss and blur to fight any auto-focus
    Keyboard.dismiss();
    if (mobileInputRef.current) {
      mobileInputRef.current.blur();
    }

    const showPhoneHint = async () => {
      try {
        Keyboard.dismiss();
        if (mobileInputRef.current) {
          mobileInputRef.current.blur();
        }
        const phoneNumber = await SmsRetriever.requestPhoneNumber();
        if (phoneNumber) {
          // Clean non-digits
          const cleaned = phoneNumber.replace(/[^0-9]/g, '');
          // Usually hints are like +919876543210, so take the last 10 digits
          const tenDigits = cleaned.length > 10 ? cleaned.slice(-10) : cleaned;
          setMobile(tenDigits);
          setMobileError('');
          Keyboard.dismiss();
          if (mobileInputRef.current) {
            mobileInputRef.current.blur();
          }
          setCanShowKeyboard(false); // Prevent autofocus if number already filled
        } else {
          setCanShowKeyboard(true);
        }
      } catch (err) {
        console.log('--- SMS Hint Cancelled or Failed ---', err);
        setCanShowKeyboard(true);
      }
    };

    if (!otpSent && !hintShown.current) {
      hintShown.current = true;
      // Delay slightly to ensure screen is rendered and avoids racing with keyboard
      const timer = setTimeout(showPhoneHint, 1500);
      return () => clearTimeout(timer);
    }
  }, [otpSent]);

  const saveToHistory = async (num: string) => {
    try {
      const newHistory = [num, ...phoneHistory.filter(h => h !== num)].slice(
        0,
        5,
      );
      setPhoneHistory(newHistory);
      await AsyncStorage.setItem('PHONE_HISTORY', JSON.stringify(newHistory));
    } catch (e) {
      console.log('Error saving history:', e);
    }
  };

  const handleSelectHistory = (num: string) => {
    setMobile(num);
    setMobileError('');
    setShowHistory(false);
    Keyboard.dismiss();
    if (mobileInputRef.current) {
      mobileInputRef.current.blur();
    }
    setCanShowKeyboard(false);
  };

  const toggleLanguage = () =>
    i18n.changeLanguage(i18n.language === 'en' ? 'bn' : 'en');

  // Countdown timer for resend
  useEffect(() => {
    if (!otpSent || resendCountdown === 0) return;
    const timer = setInterval(() => {
      setResendCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpSent, resendCountdown]);

  // Auto-submit OTP
  const otpValue = otp.join('');
  const isOtpComplete = otpValue.length === VALIDATION.OTP_LENGTH;
  useEffect(() => {
    if (isOtpComplete && !isVerifying) {
      Keyboard.dismiss();
      handleVerify(otpValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOtpComplete, otpValue]);

  const validateMobile = (value: string): string => {
    if (!value) return t('auth.mobileRequired') || 'Mobile number is required';
    if (value.length < VALIDATION.MOBILE_LENGTH)
      return t('auth.mobileTooShort') || 'Enter a valid 10-digit mobile number';
    if (!VALIDATION.MOBILE_REGEX.test(value))
      return (
        t('auth.mobileInvalid') || 'Mobile number must start with 6, 7, 8 or 9'
      );
    return '';
  };

  const handleGetOtp = async () => {
    const err = validateMobile(mobile);
    if (err) {
      setMobileError(err);
      return;
    }
    setMobileError('');
    setIsGettingOtp(true);
    const isBn = i18n.language === 'bn';
    try {
      const response = await generateOtp(mobile);
      if (response) {
        saveToHistory(mobile);
        setOtpSent(true);
        setResendCountdown(30);
        // SmsRetriever logic omitted for brevity in restoration if needed, but adding back
        try {
          const registered = await SmsRetriever.startSmsRetriever();
          if (registered) {
            SmsRetriever.addSmsListener(event => {
              if (event && event.message) {
                const otpMatch = event.message.match(/\d{6}/);
                if (otpMatch) {
                  const extractedOtp = otpMatch[0];
                  setOtp(extractedOtp.split(''));
                  SmsRetriever.removeSmsListener();
                  handleVerify(extractedOtp);
                }
              }
            });
          }
        } catch (e) {
          console.log('SmsRetriever error:', e);
        }
        setOtp(Array(VALIDATION.OTP_LENGTH).fill(''));
      }
    } catch (error: any) {
      showAlert({
        title: isBn ? 'সংযোগ ত্রুটি' : 'Connection Error',
        message: error.message || (isBn ? 'ত্রুটি' : 'Error'),
        buttons: [{ text: isBn ? 'ঠিক আছে' : 'OK' }],
      });
    } finally {
      setIsGettingOtp(false);
    }
  };

  useEffect(() => {
    if (mobile.length === 10) {
      Keyboard.dismiss();
    }
  }, [mobile]);

  const handleVerify = async (code: string = otpValue) => {
    if (code.length < VALIDATION.OTP_LENGTH) return;
    setIsVerifying(true);
    const isBn = i18n.language === 'bn';
    try {
      const result = await validateOtp(mobile, code);
      if (result) {
        dispatch(login({ user: result, token: 'session_active' }));
      }
    } catch (err: any) {
      showAlert({
        title: isBn ? 'যাচাইকরণ ব্যর্থ হয়েছে' : 'Verification Failed',
        message: err.message || (isBn ? 'ত্রুটি' : 'Error'),
        buttons: [{ text: isBn ? 'ঠিক আছে' : 'OK' }],
      });
      setOtp(Array(VALIDATION.OTP_LENGTH).fill(''));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleChangeMobile = () => {
    setOtpSent(false);
    setOtp(Array(VALIDATION.OTP_LENGTH).fill(''));
    setResendCountdown(30);
  };

  const handleResend = async () => {
    if (resendCountdown > 0 || isResending) return;
    setIsResending(true);
    const isBn = i18n.language === 'bn';
    try {
      await generateOtp(mobile);
      setResendCountdown(30);
      setOtp(Array(VALIDATION.OTP_LENGTH).fill(''));
    } catch (err: any) {
      showAlert({
        title: isBn ? 'ত্রুটি' : 'Error',
        message: err.message || (isBn ? 'ত্রুটি' : 'Error'),
        buttons: [{ text: isBn ? 'ঠিক আছে' : 'OK' }],
      });
    } finally {
      setIsResending(false);
    }
  };

  const maskedNumber = mobile
    ? `+91 ${mobile.slice(0, 2)}••••••${mobile.slice(-2)}`
    : '';

  return (
    <View style={styles.root}>
      <StatusBar
        backgroundColor={Colors.splashBg}
        barStyle="light-content"
        translucent
      />
      <SafeAreaView style={styles.flex1} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex1}
        >
          {/* ── Animated Header ── */}
          <Animated.View style={[styles.header, { height: headerHeight }]}>
            <View style={styles.headerTopRow}>
              <TouchableOpacity
                style={styles.langPill}
                onPress={toggleLanguage} // Restore original function
              >
                <Text style={styles.langText}>
                  {i18n.language === 'en' ? 'বাংলা' : 'English'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.logoWrap}>
              <Animated.Image
                source={appLogo}
                style={[styles.logo, { width: logoSize }]}
              />
              {!isKeyboardVisible && (
                <Text style={styles.tagline}>
                  {t('auth.yourSpiritualGateway')}
                </Text>
              )}
            </View>
          </Animated.View>

          {/* ── Main Input Card ── */}
          <View style={styles.card}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              {!otpSent ? (
                <>
                  <View style={styles.titleSection}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {t('auth.accessDissha')}
                      </Text>
                    </View>
                    <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
                    <Text style={styles.subtitle}>{t('auth.enterMobile')}</Text>
                  </View>

                  <View style={styles.inputSection}>
                    <Input
                      ref={mobileInputRef}
                      showSoftInputOnFocus={canShowKeyboard}
                      label={t('auth.mobileNumberLabel')}
                      placeholder="98765 43210"
                      keyboardType="number-pad"
                      autoComplete="tel"
                      textContentType="telephoneNumber"
                      maxLength={VALIDATION.MOBILE_LENGTH}
                      value={mobile}
                      onFocus={() => {
                        if (phoneHistory.length > 0) setShowHistory(true);
                      }}
                      onChangeText={text => {
                        const digits = text.replace(/[^0-9]/g, '');
                        setMobile(digits);
                        if (mobileError) setMobileError('');
                        setShowHistory(
                          digits.length === 0 && phoneHistory.length > 0,
                        );
                      }}
                      error={mobileError}
                      leftElement={<Text style={styles.countryCode}>+91</Text>}
                    />

                    {showHistory && phoneHistory.length > 0 && (
                      <View style={styles.historyDropdown}>
                        <View style={styles.historyHeader}>
                          <Text style={styles.historyHeaderText}>
                            {t('auth.recentNumbers') || 'Recent Numbers'}
                          </Text>
                          <TouchableOpacity
                            onPress={() => setShowHistory(false)}
                          >
                            <Text style={styles.closeHistory}>✕</Text>
                          </TouchableOpacity>
                        </View>
                        {phoneHistory.map((item, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.historyItem}
                            onPress={() => handleSelectHistory(item)}
                          >
                            <Text style={styles.historyItemIcon}>📱</Text>
                            <Text style={styles.historyItemText}>{item}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                    <Text style={styles.hint}>
                      🔒 {t('auth.otpWillBeSent')}
                    </Text>
                  </View>

                  <Button
                    label={t('auth.getOtp')}
                    onPress={handleGetOtp}
                    isLoading={isGettingOtp}
                    isDisabled={mobile.length < VALIDATION.MOBILE_LENGTH}
                  />
                </>
              ) : (
                <>
                  <View style={styles.titleSection}>
                    <Text style={styles.title}>{t('auth.verifyOtpTitle')}</Text>
                    <Text style={styles.subtitle}>
                      {t('auth.enter6Digit')}{' '}
                      <Text style={styles.subtitleBold}>{maskedNumber}</Text>
                    </Text>
                  </View>
                  <View style={styles.otpSection}>
                    <OtpInput
                      value={otp}
                      length={VALIDATION.OTP_LENGTH}
                      onChange={newOtp => setOtp(newOtp)}
                    />
                  </View>
                  <View style={styles.otpActionsRow}>
                    <TouchableOpacity
                      onPress={handleChangeMobile}
                      style={styles.changeMobileBtn}
                    >
                      <Text style={styles.changeMobileText}>
                        ✏️ {t('auth.changeMobile') || 'Change Number'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleResend}
                      disabled={resendCountdown > 0 || isResending}
                    >
                      <Text
                        style={[
                          styles.resendText,
                          resendCountdown > 0 && styles.resendDisabled,
                        ]}
                      >
                        {resendCountdown > 0
                          ? `${t('auth.resendOtp')} (${resendCountdown}s)`
                          : t('auth.resendOtp')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Button
                    label={t('auth.verifyAccess')}
                    onPress={() => handleVerify()}
                    isLoading={isVerifying}
                    isDisabled={!isOtpComplete}
                  />
                </>
              )}
              <Text style={styles.secureText}>
                🛡️ {t('auth.encryptedSecure')}
              </Text>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.splashBg },
  flex1: { flex: 1 },
  header: { height: HEADER_HEIGHT, paddingHorizontal: 24, paddingTop: 8 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  langPill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  langText: {
    color: Colors.background,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  logoWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 12,
  },
  logo: { width: 300, height: 90, resizeMode: 'contain', marginBottom: 10 },
  tagline: {
    color: 'rgba(253,248,240,0.65)', // This is Colors.background with 65% alpha
    fontSize: 13,
    letterSpacing: 0.6,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 28,
    overflow: 'hidden',
  },
  scrollContent: { paddingBottom: 16 },
  titleSection: { alignItems: 'center', marginBottom: 24 },
  badge: {
    backgroundColor: Colors.lightOrange,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },
  badgeText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.textMain,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  subtitleBold: { fontWeight: '700', color: Colors.textMain },
  inputSection: { marginBottom: 24 },
  countryCode: {
    color: Colors.textMain,
    fontWeight: '700',
    fontSize: 15,
    borderRightWidth: 1,
    borderRightColor: Colors.divider,
    paddingRight: 12,
  },
  hint: { color: Colors.textMuted, fontSize: 12, marginTop: 12 },
  historyDropdown: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: Colors.black,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.tagRed,
  },
  historyHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  closeHistory: { fontSize: 14, color: Colors.textMuted, padding: 4 },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.background,
  },
  historyItemIcon: { fontSize: 14, marginRight: 10, opacity: 0.7 },
  historyItemText: { fontSize: 15, color: Colors.textMain, fontWeight: '600' },
  otpSection: { marginBottom: 8 },
  otpActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  changeMobileBtn: {
    backgroundColor: Colors.lightOrange,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  changeMobileText: { color: Colors.primary, fontSize: 12, fontWeight: '600' },
  resendText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  resendDisabled: { color: Colors.textMuted },
  secureText: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
});
