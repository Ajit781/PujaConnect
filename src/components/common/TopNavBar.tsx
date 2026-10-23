import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Dimensions, TouchableWithoutFeedback, ScrollView, Linking, Alert } from 'react-native';
import { Menu, ArrowLeft, ShoppingCart, UserCircle2, Heart, ChevronRight, LogOut, Package, MapPin, Flame, Sparkles, User as UserIcon, Shield } from 'lucide-react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { RootState } from '../../store';
import NetInfo from '@react-native-community/netinfo';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/Colors';
import LinearGradient from 'react-native-linear-gradient';
import { useGetUserDetailsQuery } from '../../store/api/pujaApi';
const appLogo = require('../../assets/images/Logo.png');

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
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const { data: userDetails } = useGetUserDetailsQuery(user?.user_id || 0, {
    skip: !user?.user_id,
  });
  const { showToast } = useToast();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const dispatch = useDispatch();
  const { width } = Dimensions.get('window');
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
        setIsMenuVisible(true);
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

  const navigateFromMenu = (routeName: string, params?: any) => {
    setIsMenuVisible(false);
    setTimeout(() => {
      if (params) {
        navigation.navigate(routeName, params);
      } else {
        navigation.navigate(routeName);
      }
    }, 150);
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
          ) : null}
          <Image source={appLogo} style={{ width: 100, height: 32, tintColor: '#FFF' }} resizeMode="contain" />
        </View>

        <View style={styles.headerActions}>
          {/* 1. Language Toggle Button matching Screenshot */}
          {false && (
            <TouchableOpacity onPress={toggleLanguage} style={[styles.langBtn, { opacity: 0.5 }]} activeOpacity={0.8} disabled={true}>
              <Text style={styles.langBtnText}>文A</Text>
            </TouchableOpacity>
          )}

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
      {/* Profile Dropdown Modal */}
      <Modal visible={isMenuVisible} transparent={true} animationType="fade" onRequestClose={() => setIsMenuVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setIsMenuVisible(false)}
          />
          <View style={[styles.menuCard, { width: width - 20 }]}>
            {/* Header */}
            <View style={styles.menuHeader}>
              <View style={styles.menuHeaderLeft}>
                {userDetails?.ctnz_profile_image ? (
                  <Image source={{ uri: userDetails.ctnz_profile_image }} style={styles.menuAvatar} />
                ) : (
                  <UserCircle2 size={36} color="#9CA3AF" />
                )}
                <View style={styles.menuUserInfo}>
                  <Text style={styles.menuUserName} numberOfLines={1}>{userDetails?.ctnz_full_name || user?.user_name || 'Guest User'}</Text>
                  <Text style={styles.menuUserPhone}>{user?.mobile || user?.mobile_no || userDetails?.ctnz_mobile_no || ''}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => navigateFromMenu('MainTabs', { screen: 'EditProfile' })} style={styles.manageProfileBtn}>
                <Text style={styles.manageProfileText}>Manage Profile</Text>
                <ChevronRight size={14} color="#EA580C" />
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.menuDivider} />

            {/* Horizontal Scroll Area for columns */}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.menuScrollArea}
            >

              {/* Column 1: Puja Service */}
              <View style={styles.menuColumn}>
                <Text style={styles.columnTitle}>PUJA SERVICE</Text>
                <TouchableOpacity style={styles.menuListItem} onPress={() => navigateFromMenu('MainTabs', { screen: 'HomeTab' })}>
                  <Flame size={16} color="#EA580C" />
                  <Text style={styles.menuListText}>Puja Service</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuListItem} onPress={() => navigateFromMenu('Wishlist')}>
                  <Heart size={16} color="#EA580C" />
                  <Text style={styles.menuListText}>My Favourites</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuListItem} onPress={() => navigateFromMenu('MainTabs', { screen: 'OrdersTab' })}>
                  <Package size={16} color="#EA580C" />
                  <Text style={styles.menuListText}>Orders</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuListItem} onPress={() => navigateFromMenu('MainTabs', { screen: 'Blessings' })}>
                  <Text style={{ fontSize: 16 }}>🙏</Text>
                  <Text style={styles.menuListText}>My Blessings</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuListItem} onPress={() => navigateFromMenu('MainTabs', { screen: 'CartTab' })}>
                  <ShoppingCart size={16} color="#EA580C" />
                  <Text style={styles.menuListText}>Cart</Text>
                </TouchableOpacity>
              </View>

              {isAuthenticated && (
                <>
                  <View style={styles.verticalDivider} />

                  {/* Column 2: Your Account */}
                  <View style={styles.menuColumn}>
                    <Text style={styles.columnTitle}>YOUR ACCOUNT</Text>
                    <TouchableOpacity style={styles.menuListItem} onPress={() => { setIsMenuVisible(false); dispatch(logout()); }}>
                      <LogOut size={16} color="#EF4444" />
                      <Text style={styles.menuListText}>Log out</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuListItem} onPress={() => navigateFromMenu('MainTabs', { screen: 'EditProfile' })}>
                      <UserIcon size={16} color="#EA580C" />
                      <Text style={styles.menuListText}>Profile/Account</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuListItem} onPress={() => navigateFromMenu('MainTabs', { screen: 'Address' })}>
                      <MapPin size={16} color="#EA580C" />
                      <Text style={styles.menuListText}>Your Addresses</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuListItem} onPress={() => {
                      setIsMenuVisible(false);
                      Alert.alert(
                        "Privacy Policy",
                        "Do you want to view the Privacy Policy?",
                        [
                          {
                            text: "Cancel",
                            onPress: () => console.log("Privacy Policy Rejected"),
                            style: "cancel"
                          },
                          {
                            text: "Accept",
                            onPress: () => Linking.openURL('http://subhmuhurat.com/en/policies')
                          }
                        ]
                      );
                    }}>
                      <Shield size={16} color="#EA580C" />
                      <Text style={styles.menuListText}>Privacy Policy</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              <View style={styles.verticalDivider} />

              {/* Column 3: Temple Darshan */}
              <View style={styles.menuColumn}>
                <Text style={styles.columnTitle}>TEMPLE DARSHAN</Text>
                <View style={styles.comingSoonRow}>
                  <View style={styles.orangeDot} />
                  <View style={styles.comingSoonPill}>
                    <Sparkles size={12} color="#EA580C" />
                    <Text style={styles.comingSoonText}>Coming Soon</Text>
                  </View>
                </View>
              </View>

              <View style={styles.verticalDivider} />

              {/* Column 4: Astrology */}
              <View style={styles.menuColumn}>
                <Text style={styles.columnTitle}>ASTROLOGY</Text>
                <View style={styles.comingSoonRow}>
                  <View style={styles.orangeDot} />
                  <View style={styles.comingSoonPill}>
                    <Sparkles size={12} color="#EA580C" />
                    <Text style={styles.comingSoonText}>Coming Soon</Text>
                  </View>
                </View>
              </View>

              <View style={styles.verticalDivider} />

              {/* Column 5: Puja Participation */}
              <View style={styles.menuColumn}>
                <Text style={styles.columnTitle}>PUJA PARTICIPATION</Text>
                <View style={styles.comingSoonRow}>
                  <View style={styles.orangeDot} />
                  <View style={styles.comingSoonPill}>
                    <Sparkles size={12} color="#EA580C" />
                    <Text style={styles.comingSoonText}>Coming Soon</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </LinearGradient>

  );
}

const styles = StyleSheet.create({

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', paddingTop: 90 },
  menuCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#FED7AA', paddingBottom: 16, elevation: 10, shadowColor: '#EA580C', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  menuHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  menuHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  menuAvatar: { width: 36, height: 36, borderRadius: 18 },
  menuUserInfo: { marginLeft: 12, flex: 1 },
  menuUserName: { fontSize: 15, fontWeight: '800', color: '#1F2937' },
  menuUserPhone: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  manageProfileBtn: { flexDirection: 'row', alignItems: 'center' },
  manageProfileText: { fontSize: 13, fontWeight: '700', color: '#EA580C', marginRight: 4 },
  menuDivider: { height: 1, backgroundColor: '#FED7AA', marginHorizontal: 16, marginBottom: 12 },
  menuScrollArea: { paddingHorizontal: 16 },
  menuColumn: { width: 170, paddingRight: 16 },
  verticalDivider: { width: 1, backgroundColor: '#FEF08A', marginRight: 16 },
  columnTitle: { fontSize: 12, fontWeight: '900', color: '#C84400', letterSpacing: 0.5, marginBottom: 12 },
  comingSoonRow: { flexDirection: 'row', alignItems: 'center' },
  orangeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EA580C', marginRight: 8 },
  comingSoonPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8F0', borderWidth: 1, borderColor: '#FED7AA', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  comingSoonText: { fontSize: 11, fontWeight: '700', color: '#EA580C', marginLeft: 4 },
  menuListItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  menuListText: { fontSize: 13, fontWeight: '500', color: '#4B5563', marginLeft: 10 },

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

