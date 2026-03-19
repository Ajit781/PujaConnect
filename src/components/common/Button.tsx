import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  View,
} from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'muted' | 'outline';
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: React.ReactNode;
}

export const Button = ({
  label,
  variant = 'primary',
  isLoading = false,
  isDisabled = false,
  leftIcon,
  className = '',
  ...props
}: ButtonProps) => {
  const baseStyles =
    'flex-row items-center justify-center rounded-xl py-4 px-6';

  const getVariantStyles = () => {
    if (isDisabled) return 'bg-brand-disabled';
    switch (variant) {
      case 'primary':
        return 'bg-brand-primary active:bg-orange-600';
      case 'muted':
        return 'bg-brand-disabled active:bg-opacity-80';
      case 'outline':
        return 'bg-transparent border border-brand-primary active:bg-brand-background';
      default:
        return 'bg-brand-primary';
    }
  };

  const getLabelStyles = () => {
    if (variant === 'outline' && !isDisabled) return 'text-brand-primary';
    return 'text-white';
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isDisabled || isLoading}
      className={`${baseStyles} ${getVariantStyles()} ${className}`}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === 'outline' ? '#F97316' : '#FFFFFF'}
        />
      ) : (
        <View className="flex-row items-center justify-center">
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          <Text
            className={`font-bold text-base tracking-wide ${getLabelStyles()}`}
          >
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
