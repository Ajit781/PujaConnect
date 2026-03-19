import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  StyleSheet,
  Dimensions,
} from 'react-native';
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
import { VALIDATION } from '../../config/apiConfig';
import appLogo from '../../assets/images/Logo.png';

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

  // Step 2 state
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState<string[]>(
    Array(VALIDATION.OTP_LENGTH).fill(''),
  );
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(30);

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

  // Auto-submit OTP when all digits entered
  const otpValue = otp.join('');
  const isOtpComplete = otpValue.length === VALIDATION.OTP_LENGTH;
  useEffect(() => {
    if (isOtpComplete && !isVerifying) {
      handleVerify(otpValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOtpComplete, otpValue]);

  const validateMobile = (value: string): string => {
    if (!value) return t('auth.mobileRequired') ?? 'Mobile number is required';
    if (value.length < VALIDATION.MOBILE_LENGTH)
      return t('auth.mobileTooShort') ?? 'Enter a valid 10-digit mobile number';
    if (!VALIDATION.MOBILE_REGEX.test(value))
      return (
        t('auth.mobileInvalid') ?? 'Mobile number must start with 6, 7, 8 or 9'
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
    try {
      const result = await generateOtp(mobile);
      if (result) {
        setOtpSent(true);
        setResendCountdown(30);
        setOtp(Array(VALIDATION.OTP_LENGTH).fill(''));
      }
    } catch {
      showAlert({
        title: 'Connection Error',
        message: 'Unable to reach the server. Check your internet.',
        buttons: [{ text: 'OK' }],
      });
    } finally {
      setIsGettingOtp(false);
    }
  };

  const handleVerify = async (code: string = otpValue) => {
    if (code.length < VALIDATION.OTP_LENGTH) return;
    setIsVerifying(true);
    try {
      const result = await validateOtp(mobile, code);
      if (result) {
        dispatch(login({ user: result, token: 'session_active' }));
      }
    } catch {
      showAlert({
        title: 'Verification Failed',
        message: 'Unable to verify OTP. Please try again.',
        buttons: [{ text: 'OK' }],
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
    try {
      await generateOtp(mobile);
      setResendCountdown(30);
      setOtp(Array(VALIDATION.OTP_LENGTH).fill(''));
    } catch {
      showAlert({
        title: 'Error',
        message: 'Could not resend OTP. Please try again.',
        buttons: [{ text: 'OK' }],
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
        backgroundColor="#7F1D1D"
        barStyle="light-content"
        translucent
      />
      <SafeAreaView style={styles.flex1} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex1}
        >
          {/* ── Top Header ── */}
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <View style={styles.flex1} />
              <TouchableOpacity
                onPress={toggleLanguage}
                style={styles.langPill}
              >
                <Text style={styles.langText}>
                  {i18n.language.toUpperCase()}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.logoWrap}>
              <Image source={appLogo} style={styles.logo} />
              <Text style={styles.tagline}>
                {t('auth.yourSpiritualGateway')}
              </Text>
            </View>
          </View>

          {/* ── White Card ── */}
          <View style={styles.card}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              {!otpSent ? (
                /* ─ Step 1: Mobile Input ─ */
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
                      label={t('auth.mobileNumberLabel')}
                      placeholder="98765 43210"
                      keyboardType="number-pad"
                      maxLength={VALIDATION.MOBILE_LENGTH}
                      value={mobile}
                      onChangeText={text => {
                        const digits = text.replace(/[^0-9]/g, '');
                        setMobile(digits);
                        if (mobileError) setMobileError('');
                      }}
                      error={mobileError}
                      leftElement={<Text style={styles.countryCode}>+91</Text>}
                    />
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
                  <Text style={styles.secureText}>
                    🛡️ {t('auth.encryptedSecure')}
                  </Text>
                </>
              ) : (
                /* ─ Step 2: OTP Input ─ */
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

                  {/* Resend + Change mobile row */}
                  <View style={styles.otpActionsRow}>
                    <TouchableOpacity
                      onPress={handleChangeMobile}
                      style={styles.changeMobileBtn}
                    >
                      <Text style={styles.changeMobileText}>
                        ✏️ {t('auth.changeMobile') ?? 'Change Number'}
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
                  <Text style={styles.secureText}>
                    🛡️ {t('auth.encryptedSecure')}
                  </Text>
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#7F1D1D' },
  flex1: { flex: 1 },

  // ─ Header ─
  header: {
    height: HEADER_HEIGHT,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  langPill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  langText: {
    color: '#FDF8F0',
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
  logo: {
    width: 300,
    height: 90,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  tagline: {
    color: 'rgba(253,248,240,0.65)',
    fontSize: 13,
    letterSpacing: 0.6,
  },

  // ─ Card ─
  card: {
    flex: 1,
    backgroundColor: '#FDF8F0',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 28,
    overflow: 'hidden',
  },
  scrollContent: { paddingBottom: 16 },

  // ─ Title ─
  titleSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badge: {
    backgroundColor: '#FFF0E5',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },
  badgeText: {
    color: '#F97316',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#291811',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    color: '#6B5E59',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  subtitleBold: {
    fontWeight: '700',
    color: '#291811',
  },

  // ─ Step 1: Mobile ─
  inputSection: { marginBottom: 24 },
  countryCode: {
    color: '#291811',
    fontWeight: '700',
    fontSize: 15,
    borderRightWidth: 1,
    borderRightColor: '#E5DFD7',
    paddingRight: 12,
  },
  hint: { color: '#9CA3AF', fontSize: 12, marginTop: 8 },

  // ─ Step 2: OTP ─
  otpSection: { marginBottom: 8 },
  otpActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  changeMobileBtn: {
    backgroundColor: '#FFF0E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  changeMobileText: {
    color: '#F97316',
    fontSize: 12,
    fontWeight: '600',
  },
  resendText: {
    color: '#F97316',
    fontSize: 13,
    fontWeight: '600',
  },
  resendDisabled: { color: '#9CA3AF' },

  secureText: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
});
