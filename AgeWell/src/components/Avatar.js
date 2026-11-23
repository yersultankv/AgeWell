import React from 'react';
import { View, Text, Image } from 'react-native';
import { useApp } from '../context/AppContext';

export default function Avatar({ size = 44 }) {
  const { user, colors: c } = useApp();
  if (user?.avatar) return <Image source={{ uri: user.avatar }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.42 }}>{user?.name?.[0]?.toUpperCase() || '?'}</Text>
    </View>
  );
}
