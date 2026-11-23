import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export default function ScoreRing({ score, color = '#fff', track = 'rgba(255,255,255,0.25)', size = 120, stroke = 12, textColor = '#fff', big = 40 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={`${circ * pct} ${circ}`} rotation="-90" origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={{ fontSize: big, fontWeight: '800', color: textColor }}>{score}</Text>
    </View>
  );
}
