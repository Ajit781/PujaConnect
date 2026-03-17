import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    SafeAreaView,
    Animated,
} from 'react-native';
import { styled } from 'nativewind';

const APP_LOGO = require('../../assets/appLogo.png');
const HERO_IMAGE = require('../../assets/bg.png');

const SView = styled(View);
const SText = styled(Text);
const SInput = styled(TextInput);
const STouch = styled(TouchableOpacity);
const SImage = styled(Image);
const SKbAvoiding = styled(KeyboardAvoidingView);
const SSafeArea = styled(SafeAreaView);

type LoginPageProps = {
    onOtpSent: (phoneNumber: string) => void;
    onSignupPress?: () => void;
};

const LoginPage = ({ onOtpSent, onSignupPress }: LoginPageProps) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [focused, setFocused] = useState(false);
    const borderAnim = useRef(new Animated.Value(0)).current;

    const isValid = phoneNumber.length === 10;

    const handleFocus = () => {
        setFocused(true);
        Animated.timing(borderAnim, {
            toValue: 1, duration: 200, useNativeDriver: false,
        }).start();
    };

    const handleBlur = () => {
        setFocused(false);
        Animated.timing(borderAnim, {
            toValue: 0, duration: 200, useNativeDriver: false,
        }).start();
    };

    const borderColor = borderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['#E2E8F0', '#F08A1A'],
    });

    const handleSendOtp = () => {
        if (!isValid) {
            Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
            return;
        }
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            Alert.alert('OTP Sent', `An OTP has been sent to +91 ${phoneNumber}`);
            onOtpSent(phoneNumber);
        }, 1500);
    };

    return (
        <SView className="flex-1 bg-[#F8F8F4]">
            <SSafeArea className="flex-1">
                <SKbAvoiding
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1"
                >
                    <SView className="flex-1 px-6 pt-4 pb-6">

                        {/* ── Hero Image ── */}
                        <SView className="h-36 w-full rounded-2xl overflow-hidden">
                            <SImage
                                source={HERO_IMAGE}
                                resizeMode="cover"
                                className="w-full h-full"
                            />
                        </SView>

                        {/* ── Brand Row ── */}
                        <SView className="mt-5 flex-row items-center gap-3">
                            <SView
                                className="h-10 w-10 rounded-full bg-[#F08A1A] items-center justify-center"
                                style={{
                                    shadowColor: '#F08A1A',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.35,
                                    shadowRadius: 8,
                                    elevation: 4,
                                }}
                            >
                                <SImage source={APP_LOGO} resizeMode="contain" className="h-6 w-6" />
                            </SView>
                            <SText
                                className="text-lg font-bold text-slate-900 tracking-widest"
                                style={{ fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}
                            >
                        Dissha
                            </SText>
                        </SView>

                        {/* ── Welcome ── */}
                        <SView className="mt-6">
                            <SText
                                className="text-4xl font-bold text-slate-900"
                                style={{ fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}
                            >
                                Welcome
                            </SText>
                            <SText className="mt-1.5 text-sm text-slate-400">
                                We are glad to see you back with us
                            </SText>
                        </SView>

                        {/* ── Mobile Number Field ── */}
                        <SView className="mt-8">
                            <SText className="text-xs font-semibold tracking-widest uppercase text-slate-400 mb-2">
                                Mobile Number
                            </SText>

                            <Animated.View
                                style={{
                                    borderWidth: 1.5,
                                    borderColor,
                                    borderRadius: 14,
                                    backgroundColor: '#FFFFFF',
                                    paddingHorizontal: 16,
                                    paddingVertical: 14,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    shadowColor: focused ? '#F08A1A' : 'transparent',
                                    shadowOffset: { width: 0, height: 0 },
                                    shadowOpacity: focused ? 0.12 : 0,
                                    shadowRadius: 8,
                                    elevation: focused ? 3 : 0,
                                }}
                            >
                                {/* Country code */}
                                <SView
                                    className="flex-row items-center mr-3 pr-3"
                                    style={{ borderRightWidth: 1.5, borderRightColor: '#E2E8F0' }}
                                >
                                    <SText className="text-base font-bold text-slate-800">
                                        🇮🇳  +91
                                    </SText>
                                </SView>

                                <SInput
                                    className="flex-1 text-slate-800 text-base font-medium"
                                    style={{ paddingVertical: 0 }}
                                    placeholder="Enter Mobile Number"
                                    placeholderTextColor="#CBD5E1"
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                    value={phoneNumber}
                                    onChangeText={setPhoneNumber}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                />

                                {/* Character counter */}
                                <SText className="text-xs text-slate-300 font-medium ml-2">
                                    {phoneNumber.length}/10
                                </SText>
                            </Animated.View>
                        </SView>

                        {/* ── Send OTP Button ── */}
                        <STouch
                            className={`mt-6 h-14 rounded-2xl items-center justify-center ${isValid ? 'opacity-100' : 'opacity-55'}`}
                            style={{
                                backgroundColor: '#F08A1A',
                                shadowColor: '#F08A1A',
                                shadowOffset: { width: 0, height: 6 },
                                shadowOpacity: isValid ? 0.4 : 0,
                                shadowRadius: 14,
                                elevation: isValid ? 6 : 0,
                            }}
                            onPress={handleSendOtp}
                            disabled={loading || !isValid}
                            activeOpacity={0.88}
                        >
                            {loading ? (
                                <ActivityIndicator color="#ffffff" size="small" />
                            ) : (
                                <SText className="text-white text-base font-bold tracking-wide">
                                    Login
                                </SText>
                            )}
                        </STouch>

                        {/* ── Signup Row ── */}
                        <SView className="mt-5 flex-row items-center justify-center">
                            <SText className="text-sm text-slate-400">
                                I don't have Account ??
                            </SText>
                            <STouch onPress={onSignupPress} activeOpacity={0.7}>
                                <SText className="ml-1 text-sm text-[#F08A1A] font-bold">
                                    Signup
                                </SText>
                            </STouch>
                        </SView>

                        {/* ── Divider ── */}
                        <SView className="mt-6 flex-row items-center gap-3">
                            <SView className="flex-1 h-px bg-slate-200" />
                            <SText className="text-xs text-slate-300 tracking-widest uppercase font-medium">
                                By signing up
                            </SText>
                            <SView className="flex-1 h-px bg-slate-200" />
                        </SView>

                        {/* ── Terms ── */}
                        <SView className="mt-4 flex-row flex-wrap items-center justify-center">
                            <SText className="text-xs text-slate-400">you agree to mtn </SText>
                            <STouch activeOpacity={0.7}>
                                <SText className="text-xs text-[#F08A1A] font-semibold">
                                    terms & Conditions
                                </SText>
                            </STouch>
                            <SText className="text-xs text-slate-400"> and </SText>
                            <STouch activeOpacity={0.7}>
                                <SText className="text-xs text-[#F08A1A] font-semibold">
                                    privacy policy
                                </SText>
                            </STouch>
                        </SView>

                    </SView>
                </SKbAvoiding>
            </SSafeArea>
        </SView>
    );
};

export default LoginPage;
