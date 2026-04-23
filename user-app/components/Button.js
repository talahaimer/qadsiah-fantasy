import { Pressable, Text, ActivityIndicator, View } from 'react-native';

const variants = {
  primary: 'bg-brand active:bg-brand-accent',
  ghost: 'bg-white/5 active:bg-white/10',
  outline: 'border border-white/15 active:bg-white/5',
  danger: 'bg-red-500/20 active:bg-red-500/30 border border-red-500/30',
};

const text = {
  primary: 'text-black font-semibold',
  ghost: 'text-white font-semibold',
  outline: 'text-white font-semibold',
  danger: 'text-red-300 font-semibold',
};

export default function Button({
  children, onPress, variant = 'primary', disabled, loading, className = '', leftIcon,
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`rounded-xl px-4 py-3 flex-row items-center justify-center gap-2 ${variants[variant]} ${isDisabled ? 'opacity-50' : ''} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#000' : '#fff'} />
      ) : (
        <>
          {leftIcon ? <View>{leftIcon}</View> : null}
          <Text className={text[variant]}>{children}</Text>
        </>
      )}
    </Pressable>
  );
}
