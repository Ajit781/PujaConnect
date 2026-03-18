/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { View, Text, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { useTranslation } from 'react-i18next';
import { store, persistor } from './src/store';

// Initialize i18n
import './src/i18n';

function AppContent() {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'bn' : 'en');
  };

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 24, marginBottom: 16 }}>{t('welcome')}!</Text>
        <Text style={{ fontSize: 16, marginBottom: 32 }}>
          {t('login')} / {t('logout')}
        </Text>
        <TouchableOpacity
          onPress={toggleLanguage}
          style={{ padding: 12, backgroundColor: '#007AFF', borderRadius: 8 }}
        >
          <Text style={{ color: 'white' }}>
            Switch to {i18n.language === 'en' ? 'Bengali' : 'English'}
          </Text>
        </TouchableOpacity>
        <Text style={{ marginTop: 24, color: 'gray' }}>
          Redux, Redux Persist, and i18n are configured.
        </Text>
      </View>
    </SafeAreaProvider>
  );
}

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AppContent />
      </PersistGate>
    </Provider>
  );
}

export default App;
