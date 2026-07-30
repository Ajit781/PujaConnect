import React from 'react';
import { StatusBar, View, Animated, StyleSheet } from 'react-native';
import { setupListeners } from '@reduxjs/toolkit/query';
import NetInfo from '@react-native-community/netinfo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { NavigationContainer } from '@react-navigation/native';
import { store, persistor, RootState } from './src/store';
import { AuthNavigator } from './src/navigation/AuthNavigator';
import SplashScreen from './src/screens/SplashScreen';
import { MainNavigator } from './src/navigation/MainNavigator';
import { AlertProvider, useAlert } from './src/context/AlertContext';
import { ToastProvider } from './src/context/ToastContext';
import { initApiErrorHandler } from './src/service/api/apiErrorHandler';
import { performLogout } from './src/utils/authUtils';
import GlobalLoader from './src/components/common/GlobalLoader';
import './src/i18n';

// Registers showAlert + logout into the Axios error handler once providers are ready
function AppInitializer() {
  const { showAlert, showErrorAlert } = useAlert();

  React.useEffect(() => {
    initApiErrorHandler(showAlert, showErrorAlert, performLogout);
  }, [showAlert, showErrorAlert]);

  return null;
}

const GlobalLoaderWrapper = () => {
  return <GlobalLoader />;
};

// Main App Navigation Logic — mapped to Redux auth state
function RootNavigator() {
  const [isSplashVisible, setIsSplashVisible] = React.useState(true);
  const splashOpacity = React.useRef(new Animated.Value(1)).current;
  
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );

  React.useEffect(() => {
    const timer = setTimeout(() => {
      // Fade out the splash screen smoothly
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        setIsSplashVisible(false);
      });
    }, 2500);
    
    return () => clearTimeout(timer);
  }, [splashOpacity]);

  return (
    <View style={{ flex: 1, backgroundColor: '#fffdfa' }}>
      <NavigationContainer>
        {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
      </NavigationContainer>

      {isSplashVisible && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { opacity: splashOpacity, zIndex: 9999 }
          ]}
        >
          <SplashScreen />
        </Animated.View>
      )}
    </View>
  );
}

function App() {
  React.useEffect(() => {
    // Enable automatic refetch on reconnect for RTK Query
    const unsubscribe = setupListeners(
      store.dispatch,
      (dispatch, { onOnline, onOffline }) => {
        return NetInfo.addEventListener(state => {
          if (state.isConnected) {
            onOnline();
          } else {
            onOffline();
          }
        });
      },
    );
    return unsubscribe;
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={<SplashScreen />} persistor={persistor}>
        <SafeAreaProvider>
          <StatusBar
            barStyle="light-content"
            backgroundColor="transparent"
            translucent
          />
          <AlertProvider>
            <ToastProvider>
              <AppInitializer />
              <RootNavigator />
              <GlobalLoaderWrapper />
            </ToastProvider>
          </AlertProvider>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
