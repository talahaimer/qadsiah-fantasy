import { View } from 'react-native';

export default function Card({ children, className = '' }) {
  return (
    <View className={`rounded-2xl border border-white/10 bg-white/5 p-4 ${className}`}>
      {children}
    </View>
  );
}
