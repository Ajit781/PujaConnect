import React from 'react';
import { StatusBar } from 'react-native';
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
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );

  React.useEffect(() => {
    const timer = setTimeout(() => setIsSplashVisible(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (isSplashVisible) return <SplashScreen />;

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
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
