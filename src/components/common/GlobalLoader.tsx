import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import CustomOmLoader from './CustomOmLoader';

const GlobalLoader = () => {
  const isLoading = useSelector((state: RootState) => state.loader.isLoading);

  if (!isLoading) return null;

  return (
    <Modal transparent animationType="fade" visible={isLoading}>
      <View style={styles.overlay}>
        <CustomOmLoader size={80} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GlobalLoader;
