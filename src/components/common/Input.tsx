import React, { useState } from 'react';
import { View, TextInput, Text, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftElement?: React.ReactNode;
}

export const Input = ({
  label,
  error,
  leftElement,
  className = '',
  ...props
}: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className={`w-full ${className}`}>
      {label && (
        <Text className="text-xs font-bold text-brand-textMuted tracking-widest mb-2 uppercase">
          {label}
        </Text>
      )}
      <View
        className={`flex-row items-center border rounded-xl bg-white px-4 h-14 ${
          error
            ? 'border-red-500'
            : isFocused
            ? 'border-brand-primary'
            : 'border-brand-border'
        }`}
      >
        {leftElement && <View className="mr-3">{leftElement}</View>}
        <TextInput
          className="flex-1 text-base text-brand-textMain py-0"
          placeholderTextColor="#9CA3AF"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </View>
      {error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}
    </View>
  );
};
