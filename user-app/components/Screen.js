import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View } from 'react-native';

export default function Screen({ children, scroll = true, className = '', contentClassName = '' }) {
  const Inner = scroll ? ScrollView : View;
  return (
    <SafeAreaView className={`flex-1 bg-neutral-950 ${className}`} edges={['top']}>
      <Inner
        className="flex-1"
        contentContainerClassName={scroll ? `px-4 pb-10 ${contentClassName}` : undefined}
      >
        {children}
      </Inner>
    </SafeAreaView>
  );
}
