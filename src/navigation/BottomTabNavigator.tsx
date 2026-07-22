import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Screen Imports
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import OrdersScreen from '../screens/profile/OrdersScreen';
import CartScreen from '../screens/cart/CartScreen';
import AccountScreen from '../screens/profile/AccountScreen';

export type BottomTabParamList = {
  HomeTab: undefined;
  OrdersTab: undefined;
  CartTab: undefined;
  AccountTab: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

import { Home, ShoppingCart, User, Package } from 'lucide-react-native';

const TabIcon = ({ name, focused }: { name: string, focused: boolean }) => {
  const color = focused ? '#F38015' : 'gray';
  const size = 24;

  if (name === 'OrdersTab') return <Package color={color} size={size} />;
  if (name === 'CartTab') return <ShoppingCart color={color} size={size} />;
  if (name === 'AccountTab') return <User color={color} size={size} />;
  
  return <Home color={color} size={size} />;
};

export function BottomTabNavigator() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
        tabBarActiveTintColor: '#F38015',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          position: 'absolute',
          bottom: insets.bottom > 10 ? insets.bottom + 8 : 0,
          left: insets.bottom > 10 ? 15 : 0,
          right: insets.bottom > 10 ? 15 : 0,
          borderRadius: insets.bottom > 10 ? 20 : 0,
          height: insets.bottom > 10 ? 65 : 60,
          paddingBottom: insets.bottom > 10 ? 8 : 8,
          paddingTop: 10,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          borderTopWidth: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={DashboardScreen} 
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="OrdersTab" 
        component={OrdersScreen} 
        options={{ tabBarLabel: 'Orders' }}
      />
      <Tab.Screen 
        name="CartTab" 
        component={CartScreen} 
        options={{ tabBarLabel: 'Cart' }}
      />
      <Tab.Screen 
        name="AccountTab" 
        component={AccountScreen} 
        options={{ tabBarLabel: 'Account' }}
      />
    </Tab.Navigator>
  );
}
