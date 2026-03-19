import React, { createContext, useCallback, useContext, useState } from 'react';
import { CustomAlert, AlertButton } from '../components/common/CustomAlert';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

interface AlertContextValue {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────
const AlertContext = createContext<AlertContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertOptions>({
    title: '',
  });

  const showAlert = useCallback((options: AlertOptions) => {
    setAlertConfig(options);
    setVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setVisible(false);
  }, []);

  // Auto-close the alert after each button press
  const resolvedButtons: AlertButton[] | undefined = alertConfig.buttons?.map(
    btn => ({
      ...btn,
      onPress: () => {
        hideAlert();
        btn.onPress?.();
      },
    }),
  );

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <CustomAlert
        visible={visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={resolvedButtons}
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
