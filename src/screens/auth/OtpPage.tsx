import React, { useRef, useState } from 'react';
import { styled } from 'nativewind';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Image,
} from 'react-native';

const APP_LOGO = require('../../assets/appLogo.png');

type OtpPageProps = {
  phoneNumber: string;
  onBack: () => void;
  onVerified?: () => void;
};

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledImage = styled(Image);
const StyledKeyboardAvoidingView = styled(KeyboardAvoidingView);
const StyledSafeAreaView = styled(SafeAreaView);

const OtpPage = ({ phoneNumber, onBack, onVerified }: OtpPageProps) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleOtpChange = (text: string, index: number) => {
    const next = [...otp];
    const value = text.replace(/[^0-9]/g, '').slice(-1);
    next[index] = value;
    setOtp(next);
    if (value && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit OTP.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', 'Login Successful!');
      onVerified?.();
    }, 1500);
  };

  return (
    <StyledView className="flex-1 bg-[#FFF2EB]">
      <StyledView className="absolute -top-16 -left-10 h-56 w-56 rounded-full bg-[#FFD8C8]" />
      <StyledView className="absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-[#FFC0D4]" />
      <StyledSafeAreaView className="flex-1">
        <StyledKeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-center px-6"
        >
          <StyledView className="items-center mb-8">
            <StyledView className="h-28 w-28 items-center justify-center rounded-[28px] bg-white border border-black/5">
              <StyledImage source={APP_LOGO} resizeMode="contain" className="h-20 w-20" />
            </StyledView>
            <StyledText className="mt-4 text-2xl font-semibold text-slate-900">
              Verify OTP
            </StyledText>
            <StyledText className="mt-2 text-sm text-slate-500 text-center">
              Enter the 6-digit code sent to +91 {phoneNumber}
            </StyledText>
          </StyledView>

          <StyledView className="rounded-3xl border border-black/5 bg-white p-6">
            <StyledView className="flex-row items-center justify-between">
              <StyledText className="text-slate-700 text-base font-semibold">
                One-time code
              </StyledText>
              <StyledTouchableOpacity onPress={onBack} activeOpacity={0.8}>
                <StyledText className="text-rose-500 text-xs font-semibold">
                  Change number
                </StyledText>
              </StyledTouchableOpacity>
            </StyledView>

            <StyledView className="mt-5 flex-row justify-between">
              {otp.map((digit, index) => (
                <StyledTextInput
                  key={index}
                  className="h-14 w-12 rounded-2xl border border-slate-200 bg-[#F7F7F7] text-center text-lg font-semibold text-slate-900"
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                />
              ))}
            </StyledView>

            <StyledTouchableOpacity
              className={`mt-6 h-12 rounded-2xl items-center justify-center bg-[#FF5A5F] ${loading ? 'opacity-70' : ''}`}
              onPress={handleVerifyOtp}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <StyledText className="text-white text-base font-semibold">
                  Verify & Proceed
                </StyledText>
              )}
            </StyledTouchableOpacity>

            <StyledView className="mt-5 flex-row items-center justify-center">
              <StyledText className="text-xs text-slate-400">
                Didn't receive the code?
              </StyledText>
              <StyledTouchableOpacity activeOpacity={0.8}>
                <StyledText className="ml-2 text-xs text-rose-500 font-semibold">
                  Resend
                </StyledText>
              </StyledTouchableOpacity>
            </StyledView>
          </StyledView>
        </StyledKeyboardAvoidingView>
      </StyledSafeAreaView>
    </StyledView>
  );
};

export default OtpPage;
