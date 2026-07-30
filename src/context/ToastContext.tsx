import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
} from 'react';
import { Text, StyleSheet, Animated, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextData {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextData | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('info');
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const showToast = useCallback(
    ({
      message: incomingMessage,
      type: incomingType = 'info',
      duration = 3000,
    }: ToastOptions) => {
      setMessage(incomingMessage);
      setType(incomingType);
      setVisible(true);

      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(duration),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setVisible(false));
    },
    [opacity],
  );

  const getGradientColors = () => {
    switch (type) {
      case 'success':
        return ['#FF9933', '#E07800']; // Orange gradient just like "View packages"
      case 'error':
        return ['#EF4444', '#B91C1C'];
      case 'info':
        return ['#3B82F6', '#1D4ED8'];
      default:
        return ['#333333', '#111111'];
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && (
        <View
          style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}
          pointerEvents="none"
        >
          <Animated.View
            style={[
              styles.toastContainer,
              { opacity }
            ]}
          >
            <LinearGradient
              colors={getGradientColors()}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ ...StyleSheet.absoluteFillObject, borderRadius: 12 }}
            />
            <View style={styles.toastContent}>
              {type === 'success' && <Text style={{ fontSize: 16, marginRight: 8 }}>✨</Text>}
              <Text style={styles.toastText}>{message}</Text>
            </View>
          </Animated.View>
        </View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    width: '90%',
    borderRadius: 12,
    zIndex: 9999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});
