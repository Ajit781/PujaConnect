import { Colors } from '../../constants/Colors';
import React from 'react';
import { View, Text, StyleSheet, DimensionValue } from 'react-native';

interface Props {
  message?: string;
  containerHeight?: DimensionValue;
  children?: React.ReactNode;
}

const NoDataFound = ({
  message = 'Data not found',
  containerHeight = 200,
  children,
}: Props) => {
  return (
    <View style={[styles.container, { height: containerHeight }]}>
      <Text style={styles.icon}>🗇</Text>
      <Text style={styles.text}>{message}</Text>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  icon: {
    fontSize: 40,
    marginBottom: 10,
    opacity: 0.3,
  },
  text: {
    fontSize: 16,
    color: Colors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default NoDataFound;
