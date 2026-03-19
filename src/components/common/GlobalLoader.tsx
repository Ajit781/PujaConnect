import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

interface GlobalLoaderProps {
  visible: boolean;
}

export default function GlobalLoader({ visible }: GlobalLoaderProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      rotateAnim.setValue(0);
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1200, // Time for one full rotation
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    } else {
      rotateAnim.stopAnimation();
    }
  }, [visible, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.omBox, { transform: [{ rotate: spin }] }]}>
        <Text style={styles.omText}>ॐ</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(253, 248, 240, 0.7)', // Very light warm overlay as per reference
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999, // Ensure it's on top of everything
    elevation: 99999,
  },
  omBox: {
    width: 50,
    height: 50,
    backgroundColor: '#8B5CF6', // Purple box
    borderWidth: 2,
    borderColor: '#000', // Black border
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  omText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF', // White text
  },
});
