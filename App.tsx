/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginPage from './src/screens/auth/LoginPage';
import OtpPage from './src/screens/auth/OtpPage';

function App() {
  const [step, setStep] = useState<'LOGIN' | 'OTP'>('LOGIN');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleOtpSent = (number: string) => {
    setPhoneNumber(number);
    setStep('OTP');
  };

  const handleBack = () => {
    setStep('LOGIN');
  };

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      {step === 'LOGIN' ? (
        <LoginPage onOtpSent={handleOtpSent} />
      ) : (
        <OtpPage phoneNumber={phoneNumber} onBack={handleBack} />
      )}
    </SafeAreaProvider>
  );
}

export default App;
