import React, { createContext, useCallback, useContext, useState } from 'react';
import { CustomAlert, AlertButton } from '../components/common/CustomAlert';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  type?: 'success' | 'error' | 'warning' | 'info' | 'default';
}

interface AlertContextValue {
  showAlert: (options: AlertOptions) => void;
  showErrorAlert: (message?: string) => void;
  hideAlert: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────
const AlertContext = createContext<AlertContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertOptions>({
    title: '',
    type: 'default',
  });

  const showAlert = useCallback((options: AlertOptions) => {
    let autoType = options.type;
    if (!autoType) {
      const lowerTitle = options.title.toLowerCase();
      if (lowerTitle.includes('success') || lowerTitle.includes('সফল')) {
        autoType = 'success';
      } else if (lowerTitle.includes('error') || lowerTitle.includes('ত্রুটি')) {
        autoType = 'error';
      } else if (lowerTitle.includes('warning') || lowerTitle.includes('সতর্কতা')) {
        autoType = 'warning';
      } else {
        autoType = 'default';
      }
    }

    setAlertConfig({ ...options, type: autoType });
    setVisible(true);
  }, []);

  const showErrorAlert = useCallback((message?: string) => {
    let finalMessage = message;

    // If the message is the generic default, replace it with the support text
    if (
      !message ||
      message.toLowerCase() === 'something went wrong' ||
      message === 'কিছু ভুল হয়েছে'
    ) {
      finalMessage =
        'Please try again. If the issue persists, contact support.';
    } else {
      // If there's a dynamic message, just show it cleanly
      finalMessage = message;
    }

    setAlertConfig({
      title: 'Something went wrong',
      message: finalMessage,
      type: 'error',
      buttons: [{ text: 'OK' }],
    });
    setVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setVisible(false);
  }, []);

  // Auto-close the alert after each button press
  const resolvedButtons: AlertButton[] =
    alertConfig.buttons && alertConfig.buttons.length > 0
      ? alertConfig.buttons.map(btn => ({
        ...btn,
        onPress: () => {
          hideAlert();
          btn.onPress?.();
        },
      }))
      : [
        {
          text: 'OK',
          onPress: () => hideAlert(),
        },
      ];

  return (
    <AlertContext.Provider value={{ showAlert, showErrorAlert, hideAlert }}>
      {children}
      <CustomAlert
        visible={visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={resolvedButtons}
        type={alertConfig.type}
        onDismiss={hideAlert}
      />
    </AlertContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
/**
 * Use this hook in any screen or component to show a custom alert.
 *
 * @example
 * const { showAlert } = useAlert();
 *
 * showAlert({
 *   title: 'Error',
 *   message: 'Something went wrong. Please try again.',
 *   buttons: [{ text: 'OK' }],
 * });
 */
export function useAlert(): AlertContextValue {
  const ctx = useContext(AlertContext);
  if (!ctx) {
    throw new Error('useAlert must be used inside <AlertProvider>');
  }
  return ctx;
}
