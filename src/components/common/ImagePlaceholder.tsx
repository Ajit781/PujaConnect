import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

interface ImagePlaceholderProps {
  style?: ViewStyle;
  textStyle?: TextStyle;
  containerStyle?: ViewStyle;
}

const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({
  style,
  textStyle,
  containerStyle,
}) => {
  const { t } = useTranslation();

  return (
    <View style={[styles.container, containerStyle, style]}>
      <View style={styles.content}>
        <Text style={styles.icon}>🛕</Text>
        <Text style={[styles.text, textStyle]}>{t('common.noImage')}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F3F4F6', // Light gray background
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  icon: {
    fontSize: 32,
    marginBottom: 8,
    opacity: 0.6,
  },
  text: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ImagePlaceholder;
