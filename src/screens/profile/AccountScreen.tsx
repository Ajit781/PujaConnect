import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Colors } from '../../constants/Colors';
import { RootState } from '../../store';
import { performLogout } from '../../utils/authUtils';
import { useGetUserDetailsQuery } from '../../store/api/pujaApi';
import { User, MapPin, Package, Heart, LogOut, ChevronRight } from 'lucide-react-native';

const BRAND_PRIMARY = Colors.primary;
const BRAND_BG = Colors.background;

export default function AccountScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === 'bn';
  const { user } = useSelector((state: RootState) => state.auth);

  const { data: userDetailsResponse } = useGetUserDetailsQuery(user?.user_id || 0, {
    skip: !user?.user_id,
  });
  const userDetails = userDetailsResponse;

  const handleLogout = async () => {
    await performLogout();
  };

  const menuItems = [
    {
      id: 'profile',
      title: isBn ? 'প্রোফাইল' : 'Profile',
      icon: <User color={BRAND_PRIMARY} size={22} />,
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      id: 'address',
      title: isBn ? 'ঠিকানা' : 'Address',
      icon: <MapPin color={BRAND_PRIMARY} size={22} />,
      onPress: () => navigation.navigate('Address'),
    },
    {
      id: 'orders',
      title: isBn ? 'অর্ডার' : 'Orders',
      icon: <Package color={BRAND_PRIMARY} size={22} />,
      onPress: () => navigation.navigate('Orders'),
    },
    {
      id: 'wishlist',
      title: isBn ? 'উইশলিস্ট' : 'WishList',
      icon: <Heart color={BRAND_PRIMARY} size={22} />,
      onPress: () => navigation.navigate('Wishlist'),
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar backgroundColor={BRAND_BG} barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{isBn ? 'অ্যাকাউন্ট' : 'Account'}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Image
              source={
                userDetails?.ctnz_profile_image || user?.profile_image
                  ? { uri: userDetails?.ctnz_profile_image || user?.profile_image }
                  : require('../../assets/Placeholder_Person_3A7BFF.png')
              }
              style={styles.avatarImg}
            />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {userDetails?.ctnz_full_name || 'User'}
            </Text>
            <Text style={styles.profilePhone}>
              {user?.user_name || ''}
            </Text>
            {!userDetails?.ctnz_full_name && (
              <TouchableOpacity style={styles.missingNameBadge} onPress={() => navigation.navigate('EditProfile')}>
                <Text style={styles.missingNameText}>⚠️ {isBn ? 'নাম সেট করা নেই' : 'N/A '}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.noBorder
              ]}
              onPress={item.onPress}
            >
              <View style={styles.menuIconBox}>
                {item.icon}
              </View>
              <Text style={styles.menuItemTitle}>{item.title}</Text>
              <ChevronRight color="#CBD5E1" size={20} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut color="#EF4444" size={20} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>{isBn ? 'লগআউট' : 'Logout'}</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_BG,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: BRAND_BG,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  profileCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  profilePhone: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  missingNameBadge: {
    marginTop: 6,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    alignSelf: 'flex-start',
  },
  missingNameText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '700',
  },
  menuContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 16,
    borderRadius: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#EF4444',
  }
});
