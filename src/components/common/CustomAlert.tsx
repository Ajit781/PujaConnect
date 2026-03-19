/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[]; // optional — if omitted, no button row is rendered
  onDismiss?: () => void;
}

export function CustomAlert({
  visible,
  title,
  message,
  buttons,
  onDismiss,
}: CustomAlertProps) {
  if (!visible) return null;

  return (
    <View
      style={[StyleSheet.absoluteFill, { zIndex: 999999, elevation: 999999 }]}
    >
      {/* Dimmed overlay — blocks interaction with the screen behind */}
      <TouchableWithoutFeedback onPress={undefined}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            {/* Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Message */}
            {message ? <Text style={styles.message}>{message}</Text> : null}

            {/* Buttons — only rendered when caller provides them */}
            {buttons && buttons.length > 0 && (
              <>
                <View style={styles.divider} />
                <View
                  style={[
                    styles.buttonRow,
                    buttons.length > 2 && styles.buttonCol,
                  ]}
                >
                  {buttons.map((btn, index) => (
                    <TouchableOpacity
                      key={index}
                      activeOpacity={0.7}
                      onPress={btn.onPress ?? onDismiss}
                      style={[
                        styles.button,
                        btn.style === 'cancel' && styles.buttonCancel,
                        btn.style === 'destructive' && styles.buttonDestructive,
                        buttons.length === 1 && styles.buttonFull,
                        buttons.length > 2 && styles.buttonFullCol,
                        index > 0 && buttons.length <= 2 && styles.buttonLeft,
                      ]}
                    >
                      <Text
                        style={[
                          styles.buttonText,
                          btn.style === 'cancel' && styles.buttonTextCancel,
                          btn.style === 'destructive' &&
                            styles.buttonTextDestructive,
                        ]}
                      >
                        {btn.text}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(41, 24, 17, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingTop: 24,
    overflow: 'hidden',
    // Subtle shadow
    shadowColor: '#291811',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#291811',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  message: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B5E59',
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 20,
    marginBottom: 20,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5DFD7',
    marginHorizontal: 0,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  buttonCol: {
    flexDirection: 'column',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  buttonFull: {
    flex: 1,
  },
  buttonLeft: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: '#E5DFD7',
  },
  buttonFullCol: {
    flex: undefined,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5DFD7',
  },
  buttonCancel: {
    // No special background — just muted text
  },
  buttonDestructive: {
    // No special background — just red text
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F97316', // brand primary
    letterSpacing: 0.1,
  },
  buttonTextCancel: {
    color: '#6B5E59', // muted
    fontWeight: '400',
  },
  buttonTextDestructive: {
    color: '#DC2626', // red
    fontWeight: '600',
  },
});
