import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DrawerNavigator } from './DrawerNavigator';
import AllPujasScreen from '../screens/puja/AllPujasScreen';
import WishlistScreen from '../screens/puja/WishlistScreen';
import CartScreen from '../screens/cart/CartScreen';
import PujaDetailsScreen from '../screens/puja/PujaDetailsScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import UpdateProfileScreen from '../screens/profile/UpdateProfileScreen';
import AddressScreen from '../screens/profile/AddressScreen';
import OrdersScreen from '../screens/profile/OrdersScreen';
import SchedulePujasScreen from '../screens/cart/SchedulePujasScreen';

import AddEditAddressScreen from '../screens/profile/AddEditAddressScreen';
import AddFamilyMemberScreen from '../screens/profile/AddFamilyMemberScreen';

export type MainStackParamList = {
  MainTabs: undefined;
  AllPujas: undefined;
  Wishlist: undefined;
  PujaDetails: { pujaId: string };
  Cart: undefined;
  SchedulePujas: { cartItems: any[]; addresses: any[]; grandTotal: number };
  EditProfile: undefined;
  UpdateProfile: undefined;
  Address: { mode?: 'manage' | 'select'; onSelect?: (addressId: string) => void } | undefined;
  AddEditAddress: { address?: any; relationType?: string; targetCtznId?: number } | undefined;
  AddFamilyMember: { relative?: any } | undefined;
  Orders: undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={DrawerNavigator} />
      <Stack.Screen name="AllPujas" component={AllPujasScreen} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} />
      <Stack.Screen name="PujaDetails" component={PujaDetailsScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="SchedulePujas" component={SchedulePujasScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="UpdateProfile" component={UpdateProfileScreen} />
      <Stack.Screen name="Address" component={AddressScreen} />
      <Stack.Screen name="Orders" component={OrdersScreen} />
      <Stack.Screen name="AddEditAddress" component={AddEditAddressScreen} />
      <Stack.Screen name="AddFamilyMember" component={AddFamilyMemberScreen} />
    </Stack.Navigator>
  );
}
