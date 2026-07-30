/* eslint-disable react-native/no-inline-styles */
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
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path, Defs, LinearGradient, RadialGradient, Stop, Rect } from 'react-native-svg';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useAlert } from '../../context/AlertContext';
import { useToast } from '../../context/ToastContext';
import { generateOtp, validateOtp } from '../../service/auth/authService';
import { login } from '../../store/slices/authSlice';
import SmsRetriever from 'react-native-sms-retriever';
import RNOtpVerify from 'react-native-otp-verify';
import { VALIDATION } from '../../config/apiConfig';
import { Colors } from '../../constants/Colors';
import NetInfo from '@react-native-community/netinfo';

const { width } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

// Svg Translator Icon
const TranslatorIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#291811" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m5 8 6 6" />
    <Path d="m4 14 6-6 2 3" />
    <Path d="M2 5h12" />
    <Path d="M7 2h1" />
    <Path d="m22 22-5-10-5 10" />
    <Path d="M14 18h6" />
  </Svg>
);

// Svg Shield Check Icon (Lucide)
const ShieldCheckIcon = ({ color = '#FFF', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2-1 4-2 7-2 2.97 0 5 1 7 2a1 1 0 0 1 1 1z" />
    <Path d="m9 12 2 2 4-4" />
  </Svg>
);

const LockIcon = ({ color = '#FFF', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Svg>
);

const PhoneIcon = ({ color = '#FFF', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </Svg>
);

// Pujora Drop Leaf Logo SVG
const PujoraLeafLogo = () => (
  <Svg width="26" height="34" viewBox="0 0 45 60" fill="none">
    <Path
      d="M22.5 0C8.5 15.5 0 28.5 0 40.5C0 51.27 8.73 60 19.5 60C30.27 60 39 51.27 39 40.5C39 31.5 32.5 17 22.5 0Z"
      fill="#F97316"
    />
    <Path
      d="M22.5 18C15 28 11 35 11 41.5C11 47 15.5 51.5 21 51.5C26.5 51.5 31 47 31 41.5C31 36.5 27 28.5 22.5 18Z"
      fill="#FFFFFF"
    />
  </Svg>
);

// Custom Svg Linear Gradient Button to avoid native dependencies
const SvgGradientButton = ({ colors, children, onPress, disabled, style }: any) => {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} style={[style, { overflow: 'hidden', borderRadius: 14 }]}>
      <View style={StyleSheet.absoluteFill}>
        <Svg height="100%" width="100%">
          <Defs>
            <LinearGradient id="btnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={colors[0]} />
              <Stop offset="100%" stopColor={colors[1]} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#btnGrad)" />
        </Svg>
      </View>
      {children}
    </TouchableOpacity>
  );
};

// Svg Background Gradient matching the UserLogin web version
const SvgBackground = () => (
  <View style={[StyleSheet.absoluteFill, { backgroundColor: '#fffaf3' }]}>
    <Svg height="100%" width="100%">
      <Defs>
        <RadialGradient id="glow1" cx="0%" cy="0%" r="70%">
          <Stop offset="0%" stopColor="#fde68a" stopOpacity="0.45" />
          <Stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="glow2" cx="100%" cy="100%" r="70%">
          <Stop offset="0%" stopColor="#fed7aa" stopOpacity="0.35" />
          <Stop offset="100%" stopColor="#fed7aa" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#glow1)" />
      <Rect width="100%" height="100%" fill="url(#glow2)" />
    </Svg>
  </View>
);

export default function LoginPage({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { showErrorAlert } = useAlert();
  const { showToast } = useToast();

  const isBn = i18n.language === 'bn';

  // Step 1 state
  const [mobile, setMobile] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [isGettingOtp, setIsGettingOtp] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Step 2 state
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(VALIDATION.OTP_LENGTH).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(30);

  const otpRefs = useRef<Array<TextInput | null>>([]);

  // Load Sms hash for android
  useEffect(() => {
    if (Platform.OS === 'android') {
      RNOtpVerify.getHash()
        .then(hash => console.log('SMS HASH:', hash))
        .catch(err => console.log('SMS HASH ERROR:', err));
    }
    return () => {
      if (Platform.OS === 'android') {
        RNOtpVerify.removeListener();
      }
    };
  }, []);

  // OTP Countdown timer
  useEffect(() => {
    if (!otpSent || resendCountdown === 0) return;
    const timer = setInterval(() => {
      setResendCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpSent, resendCountdown]);

  const otpValue = otp.join('');
  const isOtpComplete = otpValue.length === VALIDATION.OTP_LENGTH;

  // Auto-submit OTP
  useEffect(() => {
    if (isOtpComplete && !isVerifying) {
      Keyboard.dismiss();
      handleVerify(otpValue);
    }
  }, [isOtpComplete, otpValue]);

  const validateMobile = (value: string): string => {
    if (!value) return isBn ? 'মোবাইল নম্বর প্রয়োজন' : 'Mobile number is required';
    if (value.length < 10) return isBn ? 'সঠিক ১০-ডিজিটের মোবাইল নম্বর দিন' : 'Enter a valid 10-digit mobile number';
    if (!/^[6-9]\d{9}$/.test(value)) return isBn ? 'মোবাইল নম্বরটি অবশ্যই ৬, ৭, ৮ বা ৯ দিয়ে শুরু হতে হবে' : 'Mobile number must start with 6, 7, 8 or 9';
    return '';
  };

  const handleGetOtp = async () => {
    const err = validateMobile(mobile);
    if (err) {
      setMobileError(err);
      return;
    }
    setMobileError('');

    // Check Network connection
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      showErrorAlert(
        isBn
          ? 'ইন্টারনেট কানেকশন নেই। ইন্টারনেট চেক করে আবার চেষ্টা করুন।'
          : 'No internet connection. Please check your network and try again.',
        isBn ? 'নেটওয়ার্ক এরর' : 'Network Error',
      );
      return;
    }

    setIsGettingOtp(true);
    try {
      const response = await generateOtp(mobile);
      if (response) {
        setOtpSent(true);
        setResendCountdown(30);
        setOtp(Array(VALIDATION.OTP_LENGTH).fill(''));

        // Start listening to SMS on Android
        try {
          if (Platform.OS === 'android') {
            await RNOtpVerify.getOtp();
            RNOtpVerify.addListener(message => {
              if (message && message !== 'Timeout Error.') {
                const otpMatch = message.match(/\d{6}/);
                if (otpMatch) {
                  const extractedOtp = otpMatch[0];
                  setOtp(extractedOtp.split(''));
                  RNOtpVerify.removeListener();
                }
              }
            });
          }
        } catch (e) {
          console.log('RNOtpVerify error:', e);
        }
      }
    } catch (error: any) {
      showErrorAlert(
        error.message || (isBn ? 'ওটিপি পাঠাতে ব্যর্থ হয়েছে' : 'Failed to send OTP'),
        isBn ? 'ওটিপি এরর' : 'OTP Error',
      );
    } finally {
      setIsGettingOtp(false);
    }
  };

  const handleVerify = async (code: string = otpValue) => {
    if (code.length < VALIDATION.OTP_LENGTH) return;

    // Check Network connection
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      showErrorAlert(
        isBn
          ? 'ইন্টারনেট কানেকশন নেই। ইন্টারনেট চেক করে আবার চেষ্টা করুন।'
          : 'No internet connection. Please check your network and try again.',
        isBn ? 'নেটওয়ার্ক এরর' : 'Network Error',
      );
      return;
    }

    setIsVerifying(true);
    try {
      const result = await validateOtp(mobile, code);
      if (result) {
        dispatch(login({ user: { ...result, mobile }, token: 'session_active' }));
      }
    } catch (err: any) {
      showErrorAlert(
        err.message || (isBn ? 'ওটিপি যাচাই করতে ব্যর্থ হয়েছে। দয়া করে সঠিক ওটিপি দিন।' : 'OTP verification failed. Please check your OTP and try again.'),
        isBn ? 'ওটিপি এরর' : 'OTP Error',
      );
      setOtp(Array(VALIDATION.OTP_LENGTH).fill(''));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0 || isResending) return;

    // Check Network connection
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      showErrorAlert(
        isBn
          ? 'ইন্টারনেট কানেকশন নেই। ইন্টারনেট চেক করে আবার চেষ্টা করুন।'
          : 'No internet connection. Please check your network and try again.',
      );
      return;
    }

    setIsResending(true);
    try {
      await generateOtp(mobile);
      setResendCountdown(30);
      setOtp(Array(VALIDATION.OTP_LENGTH).fill(''));
      showToast({ message: isBn ? 'ওটিপি আবার পাঠানো হয়েছে' : 'OTP resent successfully', type: 'success' });
    } catch (err: any) {
      showErrorAlert(err.message || (isBn ? 'সতর্কতা' : 'Alert'));
    } finally {
      setIsResending(false);
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    const cleanText = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];

    if (cleanText.length > 1) {
      // Handle paste
      const pastedData = cleanText.slice(0, VALIDATION.OTP_LENGTH).split('');
      pastedData.forEach((char, i) => {
        newOtp[i] = char;
      });
      setOtp(newOtp);
      // Focus last input or submit
      otpRefs.current[Math.min(pastedData.length - 1, VALIDATION.OTP_LENGTH - 1)]?.focus();
      return;
    }

    newOtp[index] = cleanText;
    setOtp(newOtp);

    if (cleanText.length === 1 && index < VALIDATION.OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const maskedNumber = mobile
    ? `+91 ${mobile.slice(0, 2)}•••• ••${mobile.slice(-2)}`
    : '';

  return (
    <View style={styles.root}>
      {/* Svg Background Gradient */}
      <SvgBackground />

      <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent />
      <SafeAreaView style={{ backgroundColor: 'transparent' }} edges={['top', 'left', 'right']}>
        {/* Top Header Row */}
        <View style={styles.topHeader}>
          <View />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {/* Translate Button */}
            <TouchableOpacity
              style={styles.langBtn}
              onPress={() => i18n.changeLanguage(i18n.language === 'en' ? 'bn' : 'en')}
            >
              <TranslatorIcon />
              <Text style={styles.langBtnText}>{i18n.language === 'en' ? 'বাংলা' : 'English'}</Text>
            </TouchableOpacity>

            {/* Orange Pujora Droplet logo */}
            <View style={styles.logoBadge}>
              <PujoraLeafLogo />
            </View>
          </View>
        </View>
      </SafeAreaView>

      <SafeAreaView style={styles.flex1} edges={['left', 'right', 'bottom']}>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex1}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Secure Pujora Access Banner Badge */}
            <View style={styles.secureBannerCard}>
              <View style={styles.orangeShieldIconCircle}>
                <ShieldCheckIcon color="#FFF" size={20} />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.secureBannerTitle}>{isBn ? 'নিরাপদ পুজোর অ্যাক্সেস' : 'Secure Pujora access'}</Text>
                <Text style={styles.secureBannerSub}>{isBn ? 'পাসওয়ার্ড-মুক্ত ওটিপি যাচাইকরণ' : 'Password-free OTP verification'}</Text>
              </View>
            </View>

            {/* Main Form Input Card Container */}
            <View style={styles.card}>
              {/* Active Steps Progress Bar */}
              <View style={styles.stepsContainer}>
                {/* Step 1 MOBILE */}
                <View style={styles.stepItem}>
                  <View style={[styles.stepCircle, !otpSent ? styles.stepCircleActive : styles.stepCircleSuccess]}>
                    {!otpSent ? <Text style={styles.stepCircleText}>1</Text> : <Text style={styles.stepCircleText}>✓</Text>}
                  </View>
                  <Text style={[styles.stepLabel, !otpSent ? styles.stepLabelActive : styles.stepLabelMuted]}>
                    {isBn ? 'মোবাইল' : 'MOBILE'}
                  </Text>
                </View>

                <View style={[styles.stepLine, otpSent && styles.stepLineActive]} />

                {/* Step 2 VERIFICATION */}
                <View style={styles.stepItem}>
                  <Text style={[styles.stepLabel, otpSent ? styles.stepLabelActive : styles.stepLabelMuted]}>
                    {isBn ? 'যাচাইকরণ' : 'VERIFICATION'}
                  </Text>
                  <View style={[styles.stepCircle, otpSent ? styles.stepCircleActive : styles.stepCircleInactive]}>
                    <Text style={[styles.stepCircleText, !otpSent && { color: '#9CA3AF' }]}>2</Text>
                  </View>
                </View>
              </View>

              {!otpSent ? (
                // STEP 1: Mobile number screen
                <>
                  <View style={styles.formBadge}>
                    <LockIcon color="#c2410c" size={12} />
                    <Text style={styles.formBadgeText}>{isBn ? 'পুজোর অ্যাক্সেস' : 'ACCESS PUJORA'}</Text>
                  </View>

                  <Text style={styles.formTitle}>{isBn ? 'স্বাগতম' : 'Welcome'}</Text>
                  <Text style={styles.formSub}>{isBn ? 'আমাদের ওয়েবঅ্যাপ অ্যাক্সেস করতে মোবাইল নম্বর দিন' : 'Enter your mobile number to access our webapp'}</Text>

                  {/* Input form */}
                  <View style={{ marginTop: 24 }}>
                    <Text style={styles.inputLabel}>{isBn ? 'মোবাইল নম্বর' : 'Mobile Number'}</Text>
                    <View style={[
                      styles.inputContainer,
                      isFocused && styles.inputContainerFocused,
                      mobile.length === 10 && styles.inputContainerSuccess,
                      mobileError.length > 0 && styles.inputContainerError,
                    ]}>
                      <View style={styles.prefixContainer}>
                        <PhoneIcon color="#ea580c" size={16} />
                        <Text style={styles.countryCode}>+91</Text>
                      </View>

                      <TextInput
                        style={styles.textInput}
                        placeholder="98765 43210"
                        placeholderTextColor="#d6d3d1"
                        keyboardType="phone-pad"
                        maxLength={10}
                        value={mobile}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        onChangeText={text => {
                          const digits = text.replace(/[^0-9]/g, '');
                          setMobile(digits);
                          if (mobileError) setMobileError('');
                        }}
                      />
                    </View>
                    {mobileError.length > 0 && (
                      <Text style={styles.errorText}>{mobileError}</Text>
                    )}
                    <View style={styles.otpSentCheckRow}>
                      <ShieldCheckIcon color="#059669" size={14} />
                      <Text style={styles.otpSentCheckText}>
                        {isBn ? 'যাচাইকরণের জন্য ওটিপি পাঠানো হবে' : 'OTP will be sent to this number for verification'}
                      </Text>
                    </View>
                  </View>

                  {/* Primary Get OTP Button with Svg Gradient */}
                  <SvgGradientButton
                    colors={['#ea580c', '#dc2626']} // Tailwind orange-600 to red-600
                    disabled={isGettingOtp || mobile.length !== 10}
                    onPress={handleGetOtp}
                    style={[styles.primaryBtn, (isGettingOtp || mobile.length !== 10) && { opacity: 0.5 }]}
                  >
                    {isGettingOtp ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.primaryBtnText}>
                        {isBn ? 'ওটিপি পাঠান →' : 'Get OTP →'}
                      </Text>
                    )}
                  </SvgGradientButton>
                </>
              ) : (
                // STEP 2: Verify OTP screen
                <>
                  <View style={styles.formBadge}>
                    <LockIcon color="#c2410c" size={12} />
                    <Text style={styles.formBadgeText}>{isBn ? 'পুজোর অ্যাক্সেস' : 'ACCESS PUJORA'}</Text>
                  </View>

                  <Text style={styles.formTitle}>{isBn ? 'ওটিপি যাচাই করুন' : 'Verify OTP'}</Text>
                  <Text style={styles.formSub}>
                    {isBn ? '৬-ডিজিটের কোডটি দিন যা পাঠানো হয়েছে' : 'Enter the 6-digit code sent to'}{' '}
                    <Text style={{ fontWeight: '800', color: '#1c1917' }}>{maskedNumber}</Text>
                  </Text>

                  {/* OTP inputs fields */}
                  <View style={{ marginTop: 24 }}>
                    <View style={styles.otpLabelRow}>
                      <Text style={styles.inputLabel}>{isBn ? 'ওটিপি দিন' : 'Enter OTP'}</Text>
                      <View style={styles.timerBox}>
                        <Text style={{ fontSize: 12, marginRight: 4 }}>⏱️</Text>
                        <Text style={styles.timerText}>
                          {resendCountdown > 0
                            ? `${isBn ? 'পুনরায় পাঠান' : 'Resend in'} ${resendCountdown}s`
                            : isBn ? 'পুনরায় পাঠানোর জন্য প্রস্তুত' : 'Ready to resend'}
                        </Text>
                      </View>
                    </View>

                    {/* 6 separate boxes */}
                    <View style={styles.otpInputsRow}>
                      {Array(VALIDATION.OTP_LENGTH).fill(0).map((_, idx) => (
                        <TextInput
                          key={idx}
                          ref={ref => { otpRefs.current[idx] = ref; }}
                          style={[styles.otpBox, otp[idx] ? styles.otpBoxFilled : null]}
                          placeholder=""
                          keyboardType="numeric"
                          maxLength={1}
                          value={otp[idx]}
                          onChangeText={text => handleOtpChange(text, idx)}
                          onKeyPress={e => handleOtpKeyPress(e, idx)}
                          textAlign="center"
                        />
                      ))}
                    </View>
                  </View>

                  {/* Primary Verify Button with Svg Gradient */}
                  <SvgGradientButton
                    colors={['#ea580c', '#dc2626']} // Tailwind orange-600 to red-600
                    disabled={isVerifying || !isOtpComplete}
                    onPress={() => handleVerify()}
                    style={[styles.primaryBtn, (isVerifying || !isOtpComplete) && { opacity: 0.5 }]}
                  >
                    {isVerifying ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.primaryBtnText}>
                        {isBn ? 'যাচাই ও অ্যাক্সেস করুন →' : 'Verify & Access Pujora →'}
                      </Text>
                    )}
                  </SvgGradientButton>

                  {/* Options row under button */}
                  <View style={styles.otpOptionsRow}>
                    <TouchableOpacity onPress={() => setOtpSent(false)}>
                      <Text style={styles.optionLinkText}>← {isBn ? 'মোবাইল নম্বর পরিবর্তন' : 'Change Mobile Number'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleResend}
                      disabled={resendCountdown > 0 || isResending}
                    >
                      <Text style={[styles.optionLinkText, resendCountdown > 0 && { color: '#a8a29e' }]}>
                        {isBn ? 'ওটিপি পাননি? পুনরায় পাঠান' : 'Didn\'t receive it? Resend OTP'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Secure Authentication Footer Card Badge */}
              <View style={styles.secureFooterCard}>
                <View style={styles.greenShieldIcon}>
                  <ShieldCheckIcon color="#059669" size={16} />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.secureFooterTitle}>{isBn ? 'এনক্রিপ্ট করা এবং সুরক্ষিত ব্যবহারকারী প্রমাণীকরণ' : 'Encrypted & Secure User Authentication'}</Text>
                  <Text style={styles.secureFooterSub}>
                    {isBn
                      ? 'আপনার মোবাইল নম্বর শুধুমাত্র যাচাইকরণ এবং অ্যাকাউন্ট অ্যাক্সেসের জন্য ব্যবহৃত হয়।'
                      : 'Your mobile number is used only for verification and account access.'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Terms of Service & Privacy Policy */}
            <Text style={styles.bottomTermsText}>
              {isBn ? 'লগইন করে, আপনি আমাদের ' : 'By logging in, you agree to our '}
              <Text style={styles.orangeText}>{isBn ? 'পরিষেবার শর্তাবলী' : 'Terms of Service'}</Text>
              {isBn ? ' এবং ' : ' & '}
              <Text style={styles.orangeText}>{isBn ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}</Text>
              {isBn ? ' মেনে নিচ্ছেন।' : '.'}
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex1: { flex: 1 },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 80,
    zIndex: 10,
  },
  backBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb', // stone-200
    elevation: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  langBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#fed7aa', // orange-200
    elevation: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  langBtnText: {
    color: '#9a3412', // text-orange-800
    fontSize: 12,
    fontWeight: '800',
  },
  logoBadge: {
    height: 44,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 40, // Added to push card down
    paddingBottom: 40,
    zIndex: 10,
  },

  // Secure top banner
  secureBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 18,
    marginBottom: 20,
  },
  orangeShieldIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ea580c', // Tailwind orange-600
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#fed7aa', // orange-200
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  secureBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0c0a09', // text-stone-950
  },
  secureBannerSub: {
    fontSize: 11,
    color: '#6B5E59',
    marginTop: 1,
  },

  // Steps Progress Bar
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginBottom: 24,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#ea580c',
    elevation: 2,
    shadowColor: '#fed7aa',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  stepCircleInactive: {
    backgroundColor: '#E5E7EB',
  },
  stepCircleSuccess: {
    backgroundColor: '#10B981',
  },
  stepCircleText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stepLabelActive: {
    color: '#ea580c',
  },
  stepLabelMuted: {
    color: '#9CA3AF',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  stepLineActive: {
    backgroundColor: '#10B981',
  },

  // Card Content container
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    elevation: 5,
    shadowColor: '#78350f', // Very subtle dark amber shadow
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    borderWidth: 1,
    borderColor: '#fffbeb', // Light amber border
  },
  formBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#FED7AA',
    backgroundColor: '#FFF7ED',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 14,
  },
  formBadgeText: {
    color: '#ea580c',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: '#1c1917',
  },
  formSub: {
    fontSize: 14,
    color: '#78716c',
    marginTop: 4,
    lineHeight: 24,
  },

  // Input styling
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#44403c', // text-stone-700
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d6d3d1', // border-stone-300
    borderRadius: 12,
    height: 56, // h-14
    backgroundColor: '#fafaf9',
    overflow: 'hidden',
  },
  inputContainerFocused: {
    borderColor: '#f97316',
    backgroundColor: '#FFF',
    borderWidth: 2,
    elevation: 0,
  },
  inputContainerSuccess: {
    borderColor: '#10B981',
  },
  inputContainerError: {
    borderColor: '#EF4444',
  },
  prefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb', // stone-200
    height: '100%',
  },
  countryCode: {
    fontSize: 14,
    fontWeight: '800', // font-extrabold
    color: '#292524', // stone-800
  },
  separatorLine: {
    width: 1,
    height: 20,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 10,
  },
  textInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 18,
    color: '#1c1917', // stone-900
    fontWeight: '700',
    letterSpacing: 0.5,
    paddingVertical: 0,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  otpSentCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  otpSentCheckText: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '600',
  },

  // OTP page timer and labels
  otpLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ea580c',
  },
  otpInputsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  otpBox: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#d6d3d1', // stone-300
    borderRadius: 10,
    backgroundColor: '#fafaf9', // stone-50
    fontSize: 18,
    fontWeight: '900',
    color: '#1c1917', // stone-900
  },
  otpBoxFilled: {
    borderColor: '#ea580c',
    backgroundColor: '#fff7ed',
  },
  otpOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  optionLinkText: {
    fontSize: 11,
    color: '#ea580c',
    fontWeight: '700',
  },

  // Primary buttons styles
  primaryBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    elevation: 6,
    shadowColor: '#fed7aa', // orange-200 shadow
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },

  // Secure Auth footer box card
  secureFooterCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  greenShieldIcon: {
    marginTop: 2,
  },
  secureFooterTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0c0a09', // text-stone-950
  },
  secureFooterSub: {
    fontSize: 9,
    color: '#78716c', // text-stone-500
    marginTop: 2,
    lineHeight: 12,
  },

  // Bottom footer text
  bottomTermsText: {
    fontSize: 10,
    color: '#78716c', // text-stone-500
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 14,
  },
  orangeText: {
    color: '#F97316',
    fontWeight: '800',
  },
});
