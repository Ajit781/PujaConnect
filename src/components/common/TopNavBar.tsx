import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Menu, ArrowLeft, ShoppingCart, UserCircle2 } from 'lucide-react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import NetInfo from '@react-native-community/netinfo';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/Colors';
import LinearGradient from 'react-native-linear-gradient';
import { useGetUserDetailsQuery } from '../../store/api/pujaApi';
const appLogo = require('../../assets/images/Logo.webp');

interface TopNavBarProps {
  showBack?: boolean;
  onProfilePress?: () => void;
  onBackPress?: () => void;
}

export default function TopNavBar({ showBack = false, onProfilePress, onBackPress }: TopNavBarProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: userDetails } = useGetUserDetailsQuery(user?.user_id || 0, {
    skip: !user?.user_id,
  });
  const { showToast } = useToast();
  const { t } = useTranslation();

  const handleProfilePress = async () => {
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      if (onProfilePress) {
        onProfilePress();
      } else {
        navigation.navigate('EditProfile');
      }
    } else {
      showToast({ message: t('common.connectionRequired'), type: 'error' });
    }
  };

  const handleCartPress = async () => {
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      navigation.navigate('Cart');
    } else {
      showToast({ message: t('common.connectionRequired'), type: 'error' });
    }
  };

  return (
    <LinearGradient
      // 110deg ≈ start bottom-left → end top-right in RN linear-gradient
      colors={['#ef7d16', '#f3a33a']}
      start={{ x: 0, y: 1 }}
      end={{ x: 1, y: 0 }}
      style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}
    >
      <View style={styles.headerInner}>
        <View style={styles.logoRow}>
          {showBack ? (
            <TouchableOpacity onPress={() => onBackPress ? onBackPress() : navigation.goBack()} style={{ marginRight: 12 }}>
              <ArrowLeft size={24} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={{ marginRight: 12 }}>
              <Menu size={24} color="#FFF" />
            </TouchableOpacity>
          )}
          <Image source={appLogo} style={{ width: 100, height: 32, tintColor: '#FFF' }} resizeMode="contain" />
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleCartPress} style={styles.cartBtn}>
            <ShoppingCart size={20} color="#FFF" />
            {cartItems.length > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleProfilePress} style={[styles.avatar, { width: 32, height: 32, borderRadius: 16, overflow: 'hidden', borderWidth: 1.5, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center' }]}>
            {userDetails?.ctnz_profile_image ? (
              <Image
                key={userDetails.ctnz_profile_image}
                source={{
                  uri: userDetails.ctnz_profile_image.includes('?')
                    ? `${userDetails.ctnz_profile_image}&t=${Date.now()}`
                    : `${userDetails.ctnz_profile_image}?t=${Date.now()}`,
                }}
                style={{ width: '100%', height: '100%', borderRadius: 16 }}
                resizeMode="cover"
              />
            ) : (
              <UserCircle2 size={20} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: '#ef7d16',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    zIndex: 100,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  cartBtn: { position: 'relative', padding: 4 },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.white,
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: { color: '#ef7d16', fontSize: 10, fontWeight: '800' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
