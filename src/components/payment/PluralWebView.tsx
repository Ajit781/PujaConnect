import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { decode as base64Decode } from 'base-64';

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
  const hasLoadedOnce = useRef(false); // track first successful load

  const fireResult = (res: {
    status: 'response' | 'error';
    url?: string;
    reason?: string;
    encData?: string;
    orderId?: string;
  }) => {
    if (hasCalledResult.current) return;
    hasCalledResult.current = true;
    console.log('[PluralWebView]   Full Res :', JSON.stringify(res, null, 2));
    onPaymentResult(res);
  };

  // Extract enc_data and order info from a Plural callback URL
  const extractPluralCallbackData = (url: string) => {
    try {
      const urlObj = new URL(url);
      const encData = urlObj.searchParams.get('enc_data') || undefined;
      const status = urlObj.searchParams.get('status') || undefined;
      // Decode enc_data: it's base64 JSON like {order_id, txn_number}
      let orderId: string | undefined;
      if (encData) {
        try {
          const decoded = JSON.parse(base64Decode(encData));
          console.log(
            '[PluralWebView] 📦 Decoded enc_data Payload:',
            JSON.stringify(decoded, null, 2),
          );
          orderId = String(decoded.order_id || decoded.txn_number || '');
        } catch {}
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

    // ✅ Detect success via PAGE TITLE or URL patterns
    const isSuccess =
      lowerTitle.includes('payment-success') ||
      lowerTitle.includes('payment_success') ||
      lowerTitle.includes('payment success') ||
      lowerUrl.includes('payment-success') ||
      lowerUrl.includes('payment_success') ||
      lowerUrl.includes('txn_status=success') ||
      lowerUrl.includes('payment_status=success') ||
      lowerUrl.includes('status=success');

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

    // Detect failure via URL patterns
    const isFailure =
      lowerUrl.includes('payment-fail') ||
      lowerUrl.includes('payment_fail') ||
      lowerUrl.includes('txn_status=failure') ||
      lowerUrl.includes('payment_status=failure') ||
      lowerUrl.includes('status=failure') ||
      lowerUrl.includes('status=cancelled');

    if (isFailure) {
      console.log('[PluralWebView] ❌ FAILURE DETECTED!');
      if (stopNavigationOnMatch) webviewRef.current?.stopLoading();
      fireResult({
        status: 'error',
        url,
        reason: 'Payment failed or cancelled',
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
          injectedJavaScriptBeforeContentLoaded={`
            (function() {
              // Set viewport BEFORE page renders to avoid wrong initial layout
              var meta = document.createElement('meta');
              meta.name = 'viewport';
              meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0';
              document.head && document.head.appendChild(meta);
              
              // Also set it via a style to override any existing rules
              var style = document.createElement('style');
              style.innerHTML = 'html, body { width: 100% !important; max-width: 100vw !important; overflow-x: hidden !important; }';
              document.head && document.head.appendChild(style);
            })();
            true;
          `}
          injectedJavaScript={`
            (function() {
              // After content loads, check if page is wider than screen and scale down
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
            // Only show loading overlay on very first load
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

            // ✅ KEY: Plural redirects to localhost:5173 on success — it fails on Android
            // but the checkAndFireSuccess logic will catch it via title/url in the error event.
            if (checkAndFireSuccess(ev.url, ev.title)) {
              return; // Success detected even though navigation failed
            }

            // Genuine load error — show error UI
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

        {/* Loading overlay — hides once onLoadEnd fires */}
        {isLoading && !loadError && (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color="#FF8A00" />
            <Text style={styles.loadingText}>Loading Secure Checkout...</Text>
          </View>
        )}

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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
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
