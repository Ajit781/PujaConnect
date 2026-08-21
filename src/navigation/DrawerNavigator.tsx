import React, { useState } from 'react';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import {
  Home, ShoppingCart, User, Package, Flame, MapPin, Users, LayoutGrid, HelpCircle, LogOut, Sparkles
} from 'lucide-react-native';
import { View, Image, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { performLogout } from '../utils/authUtils';
import { useAlert } from '../context/AlertContext';
// Screen Imports
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import OrdersScreen from '../screens/profile/OrdersScreen';
import CartScreen from '../screens/cart/CartScreen';
import AccountScreen from '../screens/profile/AccountScreen';
import BlessingsScreen from '../screens/profile/BlessingsScreen';
import appLogo from '../assets/images/Logo.webp';

import EditProfileScreen from '../screens/profile/EditProfileScreen';
import UpdateProfileScreen from '../screens/profile/UpdateProfileScreen';
import AddressScreen from '../screens/profile/AddressScreen';
import AddEditAddressScreen from '../screens/profile/AddEditAddressScreen';
import AddFamilyMemberScreen from '../screens/profile/AddFamilyMemberScreen';

export type DrawerParamList = {
  HomeTab: undefined;
  OrdersTab: undefined;
  Blessings: undefined;
  CartTab: undefined;
  AccountTab: undefined;
  EditProfile: undefined;
  UpdateProfile: undefined;
  Address: { mode?: 'manage' | 'select'; onSelect?: (addressId: string) => void } | undefined;
  AddEditAddress: { address?: any; relationType?: string; targetCtznId?: number } | undefined;
  AddFamilyMember: { relative?: any } | undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();

const DRAWER_ITEMS = [
  { id: 'HomeTab', label: 'Home', icon: Home },
  { id: 'OrdersTab', label: 'My Orders', icon: Package },
  { id: 'Blessings', label: 'My Blessings', icon: Sparkles },
  { id: 'CartTab', label: 'Cart', icon: ShoppingCart },
  { id: 'EditProfile', label: 'Edit Profile', icon: User },
  { id: 'Address', label: 'Saved Addresses', icon: MapPin },
];

function CustomDrawerContent(props: any) {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();

  const handleLogout = () => {
    showAlert({
      title: 'Confirm Logout',
      message: 'Are you sure you want to log out of Pujora?',
      type: 'warning',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: async () => {
            await performLogout();
          },
        },
      ],
    });
  };

  return (
    <View style={styles.drawerContainer}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        {/* Header */}
        <View style={[styles.drawerHeader, { paddingTop: insets.top + 40 }]}>
          <Image source={appLogo} style={styles.logo} resizeMode="contain" />
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {DRAWER_ITEMS.map((item) => {
            const isActive = props.state.routes[props.state.index].name === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuItem, isActive && styles.menuItemActive]}
                onPress={() => {
                  props.navigation.navigate(item.id);
                }}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.iconContainer}>
                    <item.icon size={22} color={isActive ? '#ef7d16' : '#ef7d16'} />
                  </View>
                  <Text style={[styles.menuText, isActive && styles.menuTextActive]}>
                    {item.label}
                  </Text>
                </View>
                {isActive && <View style={styles.activeDot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </DrawerContentScrollView>

      {/* Bottom Footer Actions */}
      <View style={[styles.footerContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 30 }]}>
        <TouchableOpacity style={[styles.actionBtn, styles.logoutBtn]} onPress={handleLogout}>
          <LogOut size={16} color="#DC2626" />
          <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>Log out</Text>
        </TouchableOpacity>

        <Text style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>
          Version v1.0.0
        </Text>
      </View>
    </View>
  );
}

export function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: '75%', // custom width
          backgroundColor: '#FFFFFF',
        },
      }}
    >
      <Drawer.Screen name="HomeTab" component={DashboardScreen} />
      <Drawer.Screen name="OrdersTab" component={OrdersScreen} />
      <Drawer.Screen name="Blessings" component={BlessingsScreen} />
      <Drawer.Screen name="CartTab" component={CartScreen} />
      <Drawer.Screen name="AccountTab" component={AccountScreen} />
      <Drawer.Screen name="EditProfile" component={EditProfileScreen} />
      <Drawer.Screen name="UpdateProfile" component={UpdateProfileScreen} />
      <Drawer.Screen name="Address" component={AddressScreen} />
      <Drawer.Screen name="AddEditAddress" component={AddEditAddressScreen} />
      <Drawer.Screen name="AddFamilyMember" component={AddFamilyMemberScreen} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  drawerHeader: {
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 8,
  },
  logo: {
    width: 130,
    height: 44,
  },
  menuContainer: {
    paddingHorizontal: 16,
    gap: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  menuItemActive: {
    backgroundColor: '#FFF5F0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF5F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  menuTextActive: {
    color: '#ef7d16',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef7d16',
  },
  footerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
    backgroundColor: '#FFF8F1',
    gap: 8,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F97316',
  },
  logoutBtn: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
});
