import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginPage from '../screens/auth/LoginPage';
import OtpPage from '../screens/auth/OtpPage';

export type AuthStackParamList = {
  Login: undefined;
  Otp: { mobileNumber: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="Login" component={LoginPage} />
      <Stack.Screen name="Otp" component={OtpPage} />
    </Stack.Navigator>
  );
};
