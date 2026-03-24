import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { login } from '../../store/slices/authSlice';
import { Button } from '../../components/common/Button';
import { OtpInput } from '../../components/common/OtpInput';
import { useAlert } from '../../context/AlertContext';
import { generateOtp, validateOtp } from '../../service/auth/authService';
import { showLoader, hideLoader } from '../../store/slices/loaderSlice';
import { VALIDATION } from '../../config/apiConfig';
import appLogo from '../../assets/images/Logo.png';

const { height } = Dimensions.get('window');
const HEADER_HEIGHT = Math.max(height * 0.38, 270);
const OTP_LENGTH = VALIDATION.OTP_LENGTH;

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Otp'>;
  route: RouteProp<AuthStackParamList, 'Otp'>;
};

export default function OtpPage({ navigation, route }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { showAlert } = useAlert();
  const { mobileNumber } = route.params;

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(30);

  useEffect(() => {
    if (resendCountdown === 0) return;
    const timer = setInterval(() => {
      setResendCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const otpValue = otp.join('');
  const isComplete = otpValue.length === OTP_LENGTH;

  useEffect(() => {
    if (isComplete && !isVerifying) {
      handleVerify(otpValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete, otpValue]);

  const handleVerify = async (code: string = otpValue) => {
    if (code.length < OTP_LENGTH) return;
    setIsVerifying(true);
    dispatch(showLoader());
    try {
      const result = await validateOtp(mobileNumber, code);
      if (result) {
        dispatch(login({ user: result, token: 'session_active' }));
      }
    } catch {
      showAlert({
        title: 'Verification Failed',
        message: 'Unable to verify OTP. Please try again.',
        buttons: [{ text: 'OK' }],
      });
      setOtp(Array(OTP_LENGTH).fill(''));
    } finally {
      setIsVerifying(false);
      dispatch(hideLoader());
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0 || isResending) return;
    setIsResending(true);
    try {
      await generateOtp(mobileNumber);
      setResendCountdown(30);
      setOtp(Array(OTP_LENGTH).fill(''));
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

  const maskedNumber = `+91 ${mobileNumber.slice(
    0,
    2,
  )}••••••${mobileNumber.slice(-2)}`;

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
              {/* Title */}
              <View style={styles.titleSection}>
                <Text style={styles.title}>{t('auth.verifyOtpTitle')}</Text>
                <Text style={styles.subtitle}>
                  {t('auth.enter6Digit')}{' '}
                  <Text style={styles.subtitleBold}>{maskedNumber}</Text>
                </Text>
              </View>

              {/* OTP Input */}
              <View style={styles.otpSection}>
                <OtpInput
                  value={otp}
                  length={OTP_LENGTH}
                  onChange={newOtp => setOtp(newOtp)}
                />
              </View>

              {/* Actions row: Change Number + Resend */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
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
                isDisabled={!isComplete}
              />

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
  root: { flex: 1, backgroundColor: '#7F1D1D' },
  flex1: { flex: 1 },

  // ─ Header ─
  header: {
    height: HEADER_HEIGHT,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  logoWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 12,
  },
  logo: {
    width: 280,
    height: 80,
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
    paddingTop: 48,
    overflow: 'hidden',
  },
  scrollContent: { paddingBottom: 16 },

  // ─ Title ─
  titleSection: {
    alignItems: 'center',
    marginBottom: 24,
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

  // ─ OTP ─
  otpSection: { marginBottom: 8 },
  actionsRow: {
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
