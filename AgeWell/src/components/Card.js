import React from 'react';
import { View } from 'react-native';
import { useApp } from '../context/AppContext';
import { radius, shadow } from '../theme';

export default function Card({ children, style }) {
  const { colors: c } = useApp();
  return <View style={[{ backgroundColor: c.surface, borderRadius: radius.card, padding: 16 }, shadow, style]}>{children}</View>;
}
