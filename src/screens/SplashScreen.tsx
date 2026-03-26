import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  Dimensions,
  StyleSheet,
  StatusBar,
  Image,
} from 'react-native';
import { Colors } from '../constants/Colors';
import appLogo from '../assets/images/Logo.png';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  // --- Animation Values ---
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(20)).current;
  const loaderOpacity = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const ring1Scale = useRef(new Animated.Value(0.8)).current;
  const ring1Opacity = useRef(new Animated.Value(0.5)).current;
  const ring2Scale = useRef(new Animated.Value(0.6)).current;
  const ring2Opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Pulsing rings
    const pulse = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(ring1Scale, {
            toValue: 1.15,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(ring1Scale, {
            toValue: 0.8,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(ring1Opacity, {
            toValue: 0.15,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(ring1Opacity, {
            toValue: 0.5,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(ring2Scale, {
            toValue: 1.3,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(ring2Scale, {
            toValue: 0.6,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(ring2Opacity, {
            toValue: 0.1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(ring2Opacity, {
            toValue: 0.3,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    pulse.start();

    // Main entrance sequence
    Animated.sequence([
      // Logo pops in
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // Tagline slides up
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(taglineY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Loader fades in
      Animated.timing(loaderOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Shimmer loop
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );
    shimmerLoop.start();

    return () => {
      pulse.stop();
      shimmerLoop.stop();
    };
  }, [
    loaderOpacity,
    logoOpacity,
    logoScale,
    ring1Opacity,
    ring1Scale,
    ring2Opacity,
    ring2Scale,
    shimmer,
    taglineOpacity,
    taglineY,
  ]);

  const dotOpacity = shimmer.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: [0.3, 1, 0.3, 0.3],
  });
  const dot2Opacity = shimmer.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: [0.3, 0.3, 1, 0.3],
  });
  const dot3Opacity = shimmer.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: [0.3, 0.3, 0.3, 1],
  });

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={Colors.splashBg}
        barStyle="light-content"
        translucent
      />

      {/* Radial warm gradient background */}
      <View style={styles.bgGradientOuter} />
      <View style={styles.bgGradientMid} />
      <View style={styles.bgGradientInner} />

      {/* Animated decorative rings */}
      <Animated.View
        style={[
          styles.ring,
          styles.ringOuter,
          { transform: [{ scale: ring2Scale }], opacity: ring2Opacity },
        ]}
      />
      <Animated.View
        style={[
          styles.ring,
          styles.ringInner,
          { transform: [{ scale: ring1Scale }], opacity: ring1Opacity },
        ]}
      />

      {/* Decorative Om symbol top-right */}
      <View style={styles.omTopRight}>
        <Text style={styles.omDecor}>ॐ</Text>
      </View>

      {/* Main centered content */}
      <View style={styles.content}>
        {/* Logo Image */}
        <Animated.View
          style={[
            styles.logoBadge,
            { transform: [{ scale: logoScale }], opacity: logoOpacity },
          ]}
        >
          <Image source={appLogo} style={styles.logoImage} />
        </Animated.View>

        {/* Divider line */}
        <Animated.View style={[styles.divider, { opacity: taglineOpacity }]}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerDot}>✦</Text>
          <View style={styles.dividerLine} />
        </Animated.View>

        {/* Tagline */}
        <Animated.Text
          style={[
            styles.tagline,
            { opacity: taglineOpacity, transform: [{ translateY: taglineY }] },
          ]}
        >
          Your Spiritual Gateway
        </Animated.Text>

        {/* Language label */}
        <Animated.Text style={[styles.subTagline, { opacity: taglineOpacity }]}>
          আপনার আধ্যাত্মিক প্রবেশদ্বার
        </Animated.Text>
      </View>

      {/* Bottom loading dots */}
      <Animated.View style={[styles.loaderRow, { opacity: loaderOpacity }]}>
        <Animated.View style={[styles.dot, { opacity: dotOpacity }]} />
        <Animated.View style={[styles.dot, { opacity: dot2Opacity }]} />
        <Animated.View style={[styles.dot, { opacity: dot3Opacity }]} />
      </Animated.View>

      {/* Bottom attribution */}
      <Animated.Text style={[styles.bottomText, { opacity: loaderOpacity }]}>
        🔒 Encrypted & Secure
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.splashBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Radial warm gradient layers (stacked circles)
  bgGradientOuter: {
    position: 'absolute',
    width: width * 1.8,
    height: width * 1.8,
    borderRadius: width * 0.9,
    backgroundColor: Colors.splashMid,
    top: height * 0.5 - width * 0.9,
    left: width * 0.5 - width * 0.9,
  },
  bgGradientMid: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: Colors.splashInner,
    top: height * 0.5 - width * 0.6,
    left: width * 0.5 - width * 0.6,
  },
  bgGradientInner: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: Colors.splashCenter,
    top: height * 0.5 - width * 0.35,
    left: width * 0.5 - width * 0.35,
  },
  // Pulsing rings
  ring: {
    position: 'absolute',
    borderRadius: 9999,
    borderColor: Colors.background,
    borderWidth: 1,
  },
  ringOuter: {
    width: 280,
    height: 280,
  },
  ringInner: {
    width: 200,
    height: 200,
  },
  // Om top-right
  omTopRight: {
    position: 'absolute',
    top: 56,
    right: 28,
    opacity: 0.15,
  },
  omDecor: {
    fontSize: 64,
    color: Colors.background,
  },
  // Main content
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 24,
  },
  logoBadge: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  logoBadgeInner: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(253, 248, 240, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(253, 248, 240, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
  },
  logoOm: {
    fontSize: 56,
    color: Colors.background,
  },
  appName: {
    fontSize: 52,
    fontWeight: '900',
    color: Colors.background,
    letterSpacing: -1,
    marginBottom: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    width: 200,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(253, 248, 240, 0.3)',
  },
  dividerDot: {
    color: Colors.primary,
    fontSize: 14,
    marginHorizontal: 8,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(253, 248, 240, 0.85)',
    letterSpacing: 1,
    marginBottom: 8,
  },
  subTagline: {
    fontSize: 11,
    color: 'rgba(253, 248, 240, 0.45)',
    letterSpacing: 0.5,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  // Loading dots
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: 80,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginHorizontal: 4,
  },
  bottomText: {
    position: 'absolute',
    bottom: 40,
    fontSize: 12,
    color: 'rgba(253, 248, 240, 0.5)',
    letterSpacing: 0.5,
  },
  logoImage: {
    width: 260,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 20,
  },
});
