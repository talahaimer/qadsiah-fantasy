import { View, Text, TextInput } from 'react-native';

export default function Input({ label, error, className = '', ...rest }) {
  return (
    <View className={`gap-1 ${className}`}>
      {label ? <Text className="text-xs text-white/60">{label}</Text> : null}
      <TextInput
        placeholderTextColor="rgba(255,255,255,0.3)"
        className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white"
        {...rest}
      />
      {error ? <Text className="text-xs text-red-400">{error}</Text> : null}
    </View>
  );
}
