import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import AllPujasScreen from '../screens/puja/AllPujasScreen';
import WishlistScreen from '../screens/puja/WishlistScreen';
import CartScreen from '../screens/cart/CartScreen';
import PujaDetailsScreen from '../screens/puja/PujaDetailsScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import AddressScreen from '../screens/profile/AddressScreen';

export type MainStackParamList = {
  Dashboard: undefined;
  AllPujas: undefined;
  Wishlist: undefined;
  PujaDetails: { pujaId: string };
  Cart: undefined;
  EditProfile: undefined;
  Address: undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="AllPujas" component={AllPujasScreen} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} />
      <Stack.Screen name="PujaDetails" component={PujaDetailsScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Address" component={AddressScreen} />
    </Stack.Navigator>
  );
}
