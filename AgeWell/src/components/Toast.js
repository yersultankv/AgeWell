import React, { useEffect, useRef } from 'react';
import { Animated, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';

export default function Toast() {
  const { toast, clearToast, colors: c } = useApp();
  const anim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (!toast) return;
    Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const t = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => clearToast());
    }, 2200);
    return () => clearTimeout(t);
  }, [toast]);
  if (!toast) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute', left: 20, right: 20, top: insets.top + 12, padding: 14, borderRadius: 14,
        backgroundColor: toast.type === 'error' ? c.error : c.success, opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
      }}
    >
      <Text style={{ color: '#fff', fontWeight: '700', textAlign: 'center' }}>{toast.msg}</Text>
    </Animated.View>
  );
}
