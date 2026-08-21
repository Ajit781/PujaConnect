import React, { useRef, useState, useEffect } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { decode as base64Decode } from 'base-64';
import Svg, { Circle, Path } from 'react-native-svg';

interface PluralWebViewProps {
  source: { uri: string };
  onPaymentResult: (res: {
    status: 'response' | 'error';
    url?: string;
    reason?: string;
    encData?: string;
    orderId?: string;
  }) => void;
  stopNavigationOnMatch?: boolean;
}

const CustomPaymentLoader = () => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Spinner rotation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Dots bouncing
    const createDotAnim = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ])
      );
    };

    createDotAnim(dot1Anim, 0).start();
    createDotAnim(dot2Anim, 200).start();
    createDotAnim(dot3Anim, 400).start();
  }, [rotateAnim, dot1Anim, dot2Anim, dot3Anim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const getDotStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }) }]
  });

  return (
    <View style={customStyles.overlayContainer} pointerEvents="none">
      <View style={customStyles.modalCard}>

        {/* Spinner Graphic */}
        <View style={customStyles.spinnerWrapper}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <Circle cx="32" cy="32" r="28" stroke="#fde68a" strokeWidth="6" />
              <Path d="M32 4a28 28 0 0 1 28 28" stroke="#c0420a" strokeWidth="6" strokeLinecap="round" />
            </Svg>
          </Animated.View>
          <View style={customStyles.emojiWrapper}>
            <Text style={customStyles.emojiText}>🙏</Text>
          </View>
        </View>

        {/* Text */}
        <View style={customStyles.textContainer}>
          <Text style={customStyles.titleText}>Preparing payment…</Text>
          <Text style={customStyles.subtitleText}>Please wait, do not close this page.</Text>
        </View>

        {/* Bouncing Dots */}
        <View style={customStyles.dotsContainer}>
          <Animated.View style={[customStyles.dot, getDotStyle(dot1Anim)]} />
          <Animated.View style={[customStyles.dot, getDotStyle(dot2Anim)]} />
          <Animated.View style={[customStyles.dot, getDotStyle(dot3Anim)]} />
        </View>

      </View>
    </View>
  );
};

const customStyles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 32,
    alignItems: 'center',
    width: 320,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  spinnerWrapper: {
    position: 'relative',
    width: 64,
    height: 64,
    marginBottom: 16,
  },
  emojiWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 24,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  titleText: {
    color: '#3d1f00',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitleText: {
    color: '#d97706',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fb923c',
    marginHorizontal: 3,
  }
});

export const PluralWebView: React.FC<PluralWebViewProps> = ({
  source,
  onPaymentResult,
  stopNavigationOnMatch = true,
}) => {
  const webviewRef = useRef<WebView>(null);
  const { width } = useWindowDimensions();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const hasCalledResult = useRef(false);
  const hasLoadedOnce = useRef(false);

  const fireResult = (res: {
    status: 'response' | 'error';
    url?: string;
    reason?: string;
    encData?: string;
    orderId?: string;
  }) => {
    if (hasCalledResult.current) return;
    hasCalledResult.current = true;
    console.log('[PluralWebView] 💳 Final Res :', JSON.stringify(res, null, 2));
    onPaymentResult(res);
  };

  // Extract enc_data and order info from callback URL
  const extractPluralCallbackData = (url: string) => {
    try {
      let encData: string | undefined;
      let status: string | undefined;
      let orderId: string | undefined;

      if (url.includes('?')) {
        const queryString = url.split('?')[1];
        const params = queryString.split('&');
        params.forEach(p => {
          const [key, val] = p.split('=');
          if (key === 'enc_data') encData = val;
          if (key === 'status') status = val;
        });
      }

      if (encData) {
        try {
          const decoded = JSON.parse(base64Decode(encData));
          console.log(
            '[PluralWebView] 📦 Decoded enc_data Payload:',
            JSON.stringify(decoded, null, 2),
          );
          orderId = String(decoded.order_id || decoded.txn_number || '');
        } catch { }
      }
      return { encData, orderId, status };
    } catch {
      return {};
    }
  };

  const checkAndFireSuccess = (url: string, title?: string) => {
    if (hasCalledResult.current || !url) return false;

    const lowerUrl = url.toLowerCase();
    const lowerTitle = (title || '').toLowerCase();

    // Check if error message exists in params
    const hasErrorParam = lowerUrl.includes('errormessage=') || lowerUrl.includes('error=');

    // ✅ DETECT SUCCESS
    const isSuccess =
      !hasErrorParam &&
      (lowerTitle.includes('payment-success') ||
        lowerTitle.includes('payment_success') ||
        lowerTitle.includes('payment success') ||
        lowerUrl.includes('payment-success') ||
        lowerUrl.includes('payment_success') ||
        lowerUrl.includes('txn_status=success') ||
        lowerUrl.includes('payment_status=success') ||
        lowerUrl.includes('status=success'));

    if (isSuccess) {
      console.log('[PluralWebView] ✅ SUCCESS DETECTED!');
      if (stopNavigationOnMatch) webviewRef.current?.stopLoading();
      const { encData, orderId } = extractPluralCallbackData(url);
      fireResult({
        status: 'response',
        url,
        reason: 'Payment successful',
        encData,
        orderId,
      });
      return true;
    }

    // ❌ DETECT FAILURE / CANCELLED / LOCALHOST REDIRECT
    const isFailure =
      hasErrorParam ||
      lowerUrl.includes('payment-fail') ||
      lowerUrl.includes('payment_fail') ||
      lowerUrl.includes('txn_status=failure') ||
      lowerUrl.includes('payment_status=failure') ||
      lowerUrl.includes('status=failure') ||
      lowerUrl.includes('status=cancelled') ||
      lowerUrl.includes('localhost');

    if (isFailure) {
      console.log('[PluralWebView] ❌ FAILURE OR LOCALHOST REDIRECT DETECTED!');
      if (stopNavigationOnMatch) webviewRef.current?.stopLoading();

      // Extract error message if present in URL
      let reason = 'Payment failed or cancelled';
      try {
        if (url.includes('errorMessage=')) {
          const errorMsgParam = url.split('errorMessage=')[1]?.split('&')[0];
          if (errorMsgParam) {
            reason = decodeURIComponent(errorMsgParam.replace(/\+/g, ' '));
          }
        }
      } catch (e) { }

      fireResult({
        status: 'error',
        url,
        reason: reason,
      });
      return true;
    }

    return false;
  };

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const { url, loading, title } = navState;
    console.log('[PluralWebView] ─── Navigation State Change ───');
    console.log('[PluralWebView]   URL    :', url);
    console.log('[PluralWebView]   Title  :', title);
    console.log('[PluralWebView]   Loading:', loading);

    checkAndFireSuccess(url, title);
  };

  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log(
        '[PluralWebView] 📩 postMessage received:',
        JSON.stringify(data, null, 2),
      );
      if (data?.status) {
        fireResult(data);
      }
    } catch {
      console.log(
        '[PluralWebView] 📩 Raw message (non-JSON):',
        event.nativeEvent.data,
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() =>
            fireResult({ status: 'error', reason: 'User Cancelled' })
          }
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.closeText}>✕ Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔒 Secure Checkout</Text>
        <View style={{ width: 70 }} />
      </View>

      {/* WebView */}
      <View style={styles.webviewContainer}>
        <WebView
          ref={webviewRef}
          source={source}
          style={[styles.webview, { width }]}
          javaScriptEnabled
          domStorageEnabled
          thirdPartyCookiesEnabled
          sharedCookiesEnabled
          mixedContentMode="compatibility"
          scalesPageToFit={false}
          allowsBackForwardNavigationGestures={false}

          // 🚀 Intercept Localhost / Payment Status redirects BEFORE WebView opens them
          onShouldStartLoadWithRequest={(request) => {
            const { url } = request;
            console.log('[PluralWebView] 🚦 Navigation Request URL:', url);

            if (url.includes('localhost') || url.includes('payment-status') || url.includes('payment-success') || url.includes('payment-fail')) {
              checkAndFireSuccess(url, '');
              return false; // Prevent loading unreachable localhost
            }
            return true;
          }}

          injectedJavaScriptBeforeContentLoaded={`
            (function() {
              var meta = document.createElement('meta');
              meta.name = 'viewport';
              meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0';
              document.head && document.head.appendChild(meta);
              
              var style = document.createElement('style');
              style.innerHTML = 'html, body { width: 100% !important; max-width: 100vw !important; overflow-x: hidden !important; }';
              document.head && document.head.appendChild(style);
            })();
            true;
          `}
          injectedJavaScript={`
            (function() {
              var pageWidth = document.documentElement.scrollWidth;
              var viewWidth = window.innerWidth;
              if (pageWidth > viewWidth) {
                var scale = viewWidth / pageWidth;
                document.documentElement.style.transform = 'scale(' + scale + ')';
                document.documentElement.style.transformOrigin = 'top left';
                document.documentElement.style.width = (100 / scale) + '%';
              }
            })();
            true;
          `}
          onNavigationStateChange={handleNavigationStateChange}
          onMessage={onMessage}
          onLoadStart={() => {
            if (!hasLoadedOnce.current) {
              setIsLoading(true);
              setLoadError(null);
            }
          }}
          onLoadEnd={() => {
            setIsLoading(false);
            hasLoadedOnce.current = true;
          }}
          onError={e => {
            const ev = e.nativeEvent;
            console.log('[PluralWebView] ⚠️ Load Error:', ev);

            if (checkAndFireSuccess(ev.url, ev.title)) {
              return; // Success or failure detected even though navigation failed
            }

            if (!hasCalledResult.current) {
              setLoadError(ev.description || 'Failed to load checkout page');
              setIsLoading(false);
            }
          }}
          onHttpError={e => {
            console.warn(
              '[PluralWebView] HTTP Error:',
              e.nativeEvent.statusCode,
              e.nativeEvent.url,
            );
          }}
        />

        {/* Loading overlay */}
        {isLoading && !loadError && <CustomPaymentLoader />}

        {/* Error state */}
        {loadError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{loadError}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => {
                setLoadError(null);
                setIsLoading(true);
                webviewRef.current?.reload();
              }}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FF8A00',
  },
  header: {
    height: 54,
    backgroundColor: '#FF8A00',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  closeButton: {
    width: 70,
    paddingVertical: 8,
  },
  closeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
    backgroundColor: '#fff',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#c62828',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: '#FF8A00',
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});