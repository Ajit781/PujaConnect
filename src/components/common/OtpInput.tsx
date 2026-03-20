import React, { useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';

interface OtpInputProps {
  value: string[];
  onChange: (otp: string[], index: number) => void;
  onKeyPress?: (e: any, index: number) => void;
  length?: number;
}

export function OtpInput({
  value,
  onChange,
  onKeyPress,
  length = 6,
}: OtpInputProps) {
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleChange = (text: string, index: number) => {
    const cleaned = text.replace(/[^0-9]/g, '');

    // Handle paste or autofill (multiple characters)
    if (cleaned.length > 1) {
      const newOtp = [...value];
      for (let i = 0; i < cleaned.length && index + i < length; i++) {
        newOtp[index + i] = cleaned[i];
      }
      onChange(newOtp, index);
      // Focus the next empty box or the last box
      const nextFocusIndex = Math.min(index + cleaned.length, length - 1);
      inputRefs.current[nextFocusIndex]?.focus();
      return;
    }

    // Handle single digit typing
    const digit = cleaned.slice(-1);
    const newOtp = [...value];
    newOtp[index] = digit;
    onChange(newOtp, index);
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (value[index]) {
        const newOtp = [...value];
        newOtp[index] = '';
        onChange(newOtp, index);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
    onKeyPress?.(e, index);
  };

  return (
    <View style={styles.row}>
      {value.map((digit, index) => (
        <TouchableWithoutFeedback
          key={index}
          onPress={() => inputRefs.current[index]?.focus()}
        >
          <View
            style={[styles.box, digit ? styles.boxFilled : styles.boxEmpty]}
          >
            <TextInput
              ref={el => {
                inputRefs.current[index] = el;
              }}
              style={styles.input}
              keyboardType="number-pad"
              maxLength={index === 0 ? length : 1} // allow initial paste of full length
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              value={digit}
              onChangeText={text => handleChange(text, index)}
              onKeyPress={e => handleKeyPress(e, index)}
              caretHidden
              selectTextOnFocus
            />
          </View>
        </TouchableWithoutFeedback>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  box: {
    width: 48,
    height: 58,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  boxEmpty: {
    borderColor: '#E5DFD7',
  },
  boxFilled: {
    borderColor: '#F97316',
    backgroundColor: '#FFF8F4',
  },
  input: {
    fontSize: 22,
    fontWeight: '800',
    color: '#291811',
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
});
