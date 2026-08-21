import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Menu, ArrowLeft, ShoppingCart, UserCircle2, Heart } from 'lucide-react-native';
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
  const favorites = useSelector((state: RootState) => state.wishlist.favorites);
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: userDetails } = useGetUserDetailsQuery(user?.user_id || 0, {
    skip: !user?.user_id,
  });
  const { showToast } = useToast();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'bn' ? 'en' : 'bn';
    i18n.changeLanguage(nextLang);
    showToast({
      message: nextLang === 'bn' ? 'ভাষা পরিবর্তন করা হয়েছে (বাংলা)' : 'Language changed to English',
      type: 'info',
    });
  };

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

  const handleWishlistPress = async () => {
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      navigation.navigate('Wishlist');
    } else {
      showToast({ message: t('common.connectionRequired'), type: 'error' });
    }
  };

  return (
    <LinearGradient
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
          {/* 1. Language Toggle Button matching Screenshot */}
          <TouchableOpacity onPress={toggleLanguage} style={styles.langBtn} activeOpacity={0.8}>
            <Text style={styles.langBtnText}>文A</Text>
          </TouchableOpacity>

          {/* 2. Wishlist Heart Button with White Outline & Red Badge matching Screenshot */}
          <TouchableOpacity onPress={handleWishlistPress} style={styles.wishlistBtnCircle} activeOpacity={0.8}>
            <Heart size={18} color="#FFFFFF" fill="#E8700A" strokeWidth={2} />
            {favorites.length > 0 && (
              <View style={styles.redBadgeCircle}>
                <Text style={styles.redBadgeText}>{favorites.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* 3. Shopping Cart Button matching Screenshot */}
          <TouchableOpacity onPress={handleCartPress} style={styles.cartBtnCircle} activeOpacity={0.8}>
            <ShoppingCart size={18} color="#FFFFFF" strokeWidth={2} />
            {cartItems.length > 0 && (
              <View style={styles.redBadgeCircle}>
                <Text style={styles.redBadgeText}>{cartItems.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* 4. User Avatar with Translucent Halo Ring matching Screenshot */}
          <TouchableOpacity onPress={handleProfilePress} style={styles.avatarHaloCircle} activeOpacity={0.8}>
            <View style={styles.avatarInner}>
              {userDetails?.ctnz_profile_image ? (
                <Image
                  key={userDetails.ctnz_profile_image}
                  source={{
                    uri: userDetails.ctnz_profile_image.includes('?')
                      ? `${userDetails.ctnz_profile_image}&t=${Date.now()}`
                      : `${userDetails.ctnz_profile_image}?t=${Date.now()}`,
                  }}
                  style={styles.avatarImg}
                  resizeMode="cover"
                />
              ) : (
                <UserCircle2 size={20} color="#FFF" />
              )}
            </View>
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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  // 1. Language Button matching Screenshot
  langBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFDF9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langBtnText: {
    color: '#8A2B06',
    fontSize: 13,
    fontWeight: '800',
  },

  // 2. Wishlist Heart Circle with White Outline & Red Badge matching Screenshot
  wishlistBtnCircle: {
    position: 'relative',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  redBadgeCircle: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#DC2626',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  redBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },

  // 3. Cart Circle matching Screenshot
  cartBtnCircle: {
    position: 'relative',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 4. Avatar Halo Circle matching Screenshot
  avatarHaloCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarImg: { width: '100%', height: '100%', borderRadius: 14 },
});
