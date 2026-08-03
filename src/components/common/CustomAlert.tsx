/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Modal,
} from 'react-native';
import { Colors } from '../../constants/Colors';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
  icon?: React.ReactNode;
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  type?: 'success' | 'error' | 'warning' | 'info' | 'default';
  onDismiss?: () => void;
}

export function CustomAlert({
  visible,
  title,
  message,
  buttons,
  type = 'default',
  onDismiss,
}: CustomAlertProps) {
  // Determine icon and colors based on type
  let icon = '';
  let iconColor = Colors.primary;
  let iconBg = '#F3F4F6';

  if (type === 'success') {
    icon = '✓';
    iconColor = '#FFFFFF';
    iconBg = Colors.primary || '#F97316';
  } else if (type === 'error') {
    icon = '✕';
    iconColor = '#FFFFFF';
    iconBg = Colors.dangerRed || '#EF4444';
  } else if (type === 'warning') {
    icon = '!';
    iconColor = '#FFFFFF';
    iconBg = '#F59E0B';
  } else if (type === 'info') {
    icon = 'i';
    iconColor = '#FFFFFF';
    iconBg = '#3B82F6';
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={
        buttons && buttons.length ? () => { } : onDismiss || (() => { })
      }
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={[styles.overlay, { zIndex: 1000 }]}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              {/* Icon Badge */}
              {type !== 'default' && (
                <View style={[styles.iconBadge, { backgroundColor: iconBg }]}>
                  <Text style={[styles.iconText, { color: iconColor }]}>
                    {icon}
                  </Text>
                </View>
              )}

              {/* Title */}
              <Text style={[styles.title, type !== 'default' && { marginTop: 12 }]}>{title}</Text>

              {/* Message */}
              {message ? <Text style={styles.message}>{message}</Text> : null}

              {/* Buttons */}
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
                          btn.style === 'destructive' &&
                          styles.buttonDestructive,
                          buttons.length === 1 && styles.buttonFull,
                          buttons.length > 2 && styles.buttonFullCol,
                          index > 0 && buttons.length <= 2 && styles.buttonLeft,
                        ]}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                          {btn.icon ? <View style={{ marginRight: 8 }}>{btn.icon}</View> : null}
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
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(41, 24, 17, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingTop: 32,
    alignItems: 'center',
    overflow: 'visible',
    shadowColor: Colors.textMain,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  iconBadge: {
    position: 'absolute',
    top: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.white,
    shadowColor: Colors.textMain,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  iconText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textMain,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  message: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 22,
    marginBottom: 24,
  },
  divider: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.divider,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
  },
  buttonCol: {
    flexDirection: 'column',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  buttonFull: {
    flex: 1,
  },
  buttonLeft: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: Colors.divider,
  },
  buttonFullCol: {
    flex: undefined,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.divider,
  },
  buttonCancel: {},
  buttonDestructive: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.2,
  },
  buttonTextCancel: {
    color: Colors.textMuted,
    fontWeight: '600',
  },
  buttonTextDestructive: {
    color: Colors.dangerRed,
    fontWeight: '700',
  },
});
